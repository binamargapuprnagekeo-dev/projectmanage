import { ProjectInfo, WeekSummary, PaymentTerm, CriticalPathAlert } from '../types/schedule';

/**
 * Re-calculates total prices, item weight percentages, and week summaries for a project.
 */
export function recalculateProject(project: ProjectInfo): ProjectInfo {
  // 1. Calculate item totals & grand total
  let grandTotal = 0;
  
  const updatedCategories = project.categories.map((cat) => {
    const updatedItems = cat.items.map((item) => {
      const totalPrice = item.volume * item.unitPrice;
      grandTotal += totalPrice;
      return {
        ...item,
        totalPrice,
      };
    });
    return {
      ...cat,
      items: updatedItems,
    };
  });

  // 2. Calculate weight % for each item
  const safeGrandTotal = grandTotal > 0 ? grandTotal : 1;
  const categoriesWithWeight = updatedCategories.map((cat) => ({
    ...cat,
    items: cat.items.map((item) => ({
      ...item,
      weightPercent: Number(((item.totalPrice / safeGrandTotal) * 100).toFixed(4)),
    })),
  }));

  return {
    ...project,
    categories: categoriesWithWeight,
  };
}

/**
 * Computes week-by-week summaries (1..totalWeeks) for planned vs actual progress.
 */
export function calculateWeekSummaries(project: ProjectInfo): WeekSummary[] {
  const summaries: WeekSummary[] = [];
  let cumulativePlanned = 0;
  let cumulativeActual = 0;

  for (let w = 1; w <= project.totalWeeks; w++) {
    const monthNumber = Math.ceil(w / project.weeksPerMonth);
    const weekInMonth = ((w - 1) % project.weeksPerMonth) + 1;

    let plannedWeightThisWeek = 0;
    let actualWeightThisWeek = 0;

    project.categories.forEach((cat) => {
      cat.items.forEach((item) => {
        if (item.weeklyPlan && item.weeklyPlan[w]) {
          plannedWeightThisWeek += item.weeklyPlan[w];
        }
        if (item.weeklyActual && item.weeklyActual[w] !== undefined) {
          actualWeightThisWeek += item.weeklyActual[w];
        }
      });
    });

    cumulativePlanned += plannedWeightThisWeek;
    cumulativeActual += actualWeightThisWeek;

    summaries.push({
      weekNumber: w,
      monthNumber,
      weekInMonth,
      plannedWeight: Number(plannedWeightThisWeek.toFixed(2)),
      cumulativePlannedWeight: Number(Math.min(100, cumulativePlanned).toFixed(2)),
      actualWeight: Number(actualWeightThisWeek.toFixed(2)),
      cumulativeActualWeight: Number(Math.min(100, cumulativeActual).toFixed(2)),
      deviationCumulative: Number((cumulativeActual - cumulativePlanned).toFixed(2)),
    });
  }

  return summaries;
}

/**
 * Auto-distributes weight percentage for an item across a given week range.
 * Distribution types: 'equal' (linear) or 'bell' (s-curve shape).
 */
export function autoDistributeWeeklyPlan(
  weightPercent: number,
  startWeek: number,
  endWeek: number,
  distributionType: 'equal' | 'bell' = 'equal'
): Record<number, number> {
  const plan: Record<number, number> = {};
  if (startWeek > endWeek || startWeek < 1) return plan;

  const duration = endWeek - startWeek + 1;

  if (distributionType === 'equal') {
    const perWeek = weightPercent / duration;
    for (let w = startWeek; w <= endWeek; w++) {
      plan[w] = Number(perWeek.toFixed(2));
    }
  } else {
    // Bell curve approximation
    let weightsSum = 0;
    const rawWeights: number[] = [];
    for (let i = 0; i < duration; i++) {
      // sine curve distribution
      const weight = Math.sin(((i + 0.5) / duration) * Math.PI);
      rawWeights.push(weight);
      weightsSum += weight;
    }
    for (let i = 0; i < duration; i++) {
      const w = startWeek + i;
      plan[w] = Number(((rawWeights[i] / weightsSum) * weightPercent).toFixed(2));
    }
  }

  return plan;
}

/**
 * Calculates financial progress payment schedule (Termin) based on project cost & week summaries.
 */
export function calculatePaymentTerms(projectTotalCost: number, weekSummaries: WeekSummary[]): PaymentTerm[] {
  const defaultTerms = [
    { id: '1', name: 'Uang Muka (DP)', requiredProgressPercent: 0, payoutPercent: 20 },
    { id: '2', name: 'Termin I (Progress 30%)', requiredProgressPercent: 30, payoutPercent: 25 },
    { id: '3', name: 'Termin II (Progress 60%)', requiredProgressPercent: 60, payoutPercent: 25 },
    { id: '4', name: 'Termin III (Progress 90%)', requiredProgressPercent: 90, payoutPercent: 15 },
    { id: '5', name: 'Retensi (Progress 100%)', requiredProgressPercent: 100, payoutPercent: 15 },
  ];

  return defaultTerms.map((term) => {
    // Find week where planned cumulative progress reaches or exceeds required
    const targetSummary = weekSummaries.find((s) => s.cumulativePlannedWeight >= term.requiredProgressPercent);
    const estimatedWeek = targetSummary ? targetSummary.weekNumber : weekSummaries.length;
    
    // Find actual week reached
    const actualSummary = weekSummaries.find((s) => s.cumulativeActualWeight >= term.requiredProgressPercent && s.cumulativeActualWeight > 0);
    const actualWeekReached = actualSummary ? actualSummary.weekNumber : undefined;

    return {
      id: term.id,
      name: term.name,
      requiredProgressPercent: term.requiredProgressPercent,
      payoutPercent: term.payoutPercent,
      amount: Math.round((projectTotalCost * term.payoutPercent) / 100),
      estimatedWeek,
      actualWeekReached,
      isPaid: actualWeekReached !== undefined,
    };
  });
}

/**
 * Helper to determine if an item is considered part of the Critical Path (Jalur Kritis)
 */
export function isItemCriticalPath(item: any): boolean {
  if (item.isCriticalPath) return true;
  // High weight items (>= 3.5%) or key structural/roof/finish items are automatically on critical path
  return item.weightPercent >= 3.5;
}

/**
 * Calculates detailed Critical Path Alerts (Pekerjaan Kritis & Warning Terlambat)
 */
export function getProjectCriticalAlerts(project: ProjectInfo): CriticalPathAlert[] {
  const alerts: CriticalPathAlert[] = [];
  const currWeek = project.currentWeek;

  project.categories.forEach((cat) => {
    cat.items.forEach((item) => {
      const isCritical = isItemCriticalPath(item);
      const planThisWeek = item.weeklyPlan ? (item.weeklyPlan[currWeek] || 0) : 0;
      const actualThisWeek = item.weeklyActual ? (item.weeklyActual[currWeek] || 0) : 0;

      // Cumulative plan & actual up to currWeek for this item
      let itemCumPlan = 0;
      let itemCumActual = 0;

      for (let w = 1; w <= currWeek; w++) {
        itemCumPlan += item.weeklyPlan ? (item.weeklyPlan[w] || 0) : 0;
        itemCumActual += item.weeklyActual ? (item.weeklyActual[w] || 0) : 0;
      }

      const lagPercent = Number((itemCumPlan - itemCumActual).toFixed(2));

      // Report alert if critical item has lag OR if lag is severe (> 0.5%)
      if ((isCritical && lagPercent > 0) || lagPercent >= 0.5) {
        let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
        if (lagPercent > 2.0 || (isCritical && lagPercent > 0.8)) {
          riskLevel = 'HIGH';
        } else if (lagPercent > 0.5 || isCritical) {
          riskLevel = 'MEDIUM';
        }

        let recommendation = `Tambahkan tenaga kerja dan terapkan sistem lembur (shift malam) pada item ${item.description}.`;
        if (riskLevel === 'HIGH') {
          recommendation = `CRITICAL FAST-TRACKING: Lakukan penambahan alat/alat berat, pastikan ketersediaan material di lokasi, dan tambah jam kerja 3 jam/hari.`;
        }

        alerts.push({
          itemId: item.id,
          itemNo: item.itemNo,
          description: item.description,
          weightPercent: item.weightPercent,
          plannedThisWeek: planThisWeek,
          actualThisWeek: actualThisWeek,
          lagPercent,
          riskLevel,
          recommendation,
        });
      }
    });
  });

  return alerts.sort((a, b) => b.lagPercent - a.lagPercent);
}

/**
 * Computes overall project status summary (KRITIS, WASPADA, ON_TRACK)
 */
export function getOverallProjectStatus(project: ProjectInfo, weekSummaries: WeekSummary[]) {
  const currWeek = project.currentWeek;
  const currentSummary = weekSummaries.find((s) => s.weekNumber === currWeek) || weekSummaries[weekSummaries.length - 1];
  const dev = currentSummary ? currentSummary.deviationCumulative : 0;

  const alerts = getProjectCriticalAlerts(project);
  const highRiskCount = alerts.filter((a) => a.riskLevel === 'HIGH').length;

  let status: 'KRITIS' | 'WASPADA' | 'ON_TRACK' | 'AHEAD' = 'ON_TRACK';
  let badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
  let title = 'ON TRACK (Sesuai Rencana)';

  if (dev <= -5.0 || highRiskCount >= 2) {
    status = 'KRITIS';
    badgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse';
    title = 'S-CURVE KRITIS (Terlambat Parah)';
  } else if (dev < 0.0 || alerts.length > 0) {
    status = 'WASPADA';
    badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    title = 'WASPADA (Terdapat Deviasi Negatif)';
  } else if (dev > 2.0) {
    status = 'AHEAD';
    badgeColor = 'bg-[#C8FF00]/20 text-[#C8FF00] border-[#C8FF00]/40';
    title = 'SURPLUS PROGRESS (Lebih Cepat Dari Jadwal)';
  }

  return {
    status,
    badgeColor,
    title,
    deviation: dev,
    alertsCount: alerts.length,
    highRiskCount,
    alerts,
  };
}

/**
 * Format IDR currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format plain number with thousand separators
 */
export function formatNumber(num: number, decimals: number = 2): string {
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

