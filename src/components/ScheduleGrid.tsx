import React, { useState } from 'react';
import {
  ProjectInfo,
  ScheduleItem,
  Category,
  WeekSummary,
  UserRole,
} from '../types/schedule';
import { formatCurrency, formatNumber, isItemCriticalPath } from '../utils/calculator';
import {
  Plus,
  Edit2,
  Trash2,
  Wand2,
  ChevronDown,
  ChevronRight,
  Flame,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';

interface ScheduleGridProps {
  project: ProjectInfo;
  role: UserRole;
  weekSummaries: WeekSummary[];
  showOnlyCritical?: boolean;
  onEditItem: (item: ScheduleItem) => void;
  onDeleteItem: (itemId: string) => void;
  onAddItemToCategory: (categoryId: string) => void;
  onAddCategory?: () => void;
  onSelectPreset?: (presetKey: string) => void;
  onAutoDistributeItem: (item: ScheduleItem) => void;
  onUpdateWeeklyCell: (
    itemId: string,
    weekNum: number,
    planValue: number,
    actualValue?: number
  ) => void;
  grandTotalCost: number;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  project,
  role,
  weekSummaries,
  showOnlyCritical = false,
  onEditItem,
  onDeleteItem,
  onAddItemToCategory,
  onAddCategory,
  onSelectPreset,
  onAutoDistributeItem,
  onUpdateWeeklyCell,
  grandTotalCost,
}) => {
  const [collapsedCategories, setCollapsedCategories] = useState<
    Record<string, boolean>
  >({});
  const [activeCellEdit, setActiveCellEdit] = useState<{
    itemId: string;
    weekNum: number;
    type: 'plan' | 'actual';
  } | null>(null);
  const [cellValue, setCellValue] = useState<string>('');

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleCellClick = (
    itemId: string,
    weekNum: number,
    type: 'plan' | 'actual',
    currentVal: number
  ) => {
    // Only allow editing if role is admin or kontraktor
    if (role === 'konsultan') return;
    setActiveCellEdit({ itemId, weekNum, type });
    setCellValue(currentVal ? currentVal.toString() : '');
  };

  const handleCellSave = () => {
    if (!activeCellEdit) return;
    const num = parseFloat(cellValue.replace(',', '.')) || 0;
    const { itemId, weekNum, type } = activeCellEdit;

    const item = project.categories
      .flatMap((c) => c.items)
      .find((i) => i.id === itemId);

    if (item) {
      const planVal = type === 'plan' ? num : item.weeklyPlan[weekNum] || 0;
      const actualVal = type === 'actual' ? num : item.weeklyActual[weekNum];
      onUpdateWeeklyCell(itemId, weekNum, planVal, actualVal);
    }

    setActiveCellEdit(null);
  };

  // Group weeks by Month (e.g. 4 weeks per month)
  const monthGroups: { monthNumber: number; weeks: number[] }[] = [];
  for (let m = 1; m <= project.durationMonths; m++) {
    const weeksInM: number[] = [];
    for (let w = 1; w <= project.weeksPerMonth; w++) {
      const weekNum = (m - 1) * project.weeksPerMonth + w;
      if (weekNum <= project.totalWeeks) {
        weeksInM.push(weekNum);
      }
    }
    monthGroups.push({ monthNumber: m, weeks: weeksInM });
  }

  return (
    <div className="bg-[#121212] border border-white/10 shadow-2xl overflow-hidden font-sans">
      {/* Top Action Toolbar */}
      <div className="p-3 bg-[#0A0A0A] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#C8FF00]" />
          <h3 className="font-syne font-black text-sm uppercase tracking-wider text-white">
            JADWAL PELAKSANAAN PEKERJAAN (MATRIKS KURVA S)
          </h3>
        </div>

        {(role === 'admin' || role === 'kontraktor') && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onAddItemToCategory('')}
              className="px-3 py-1.5 bg-[#C8FF00] hover:bg-[#b5e600] text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Tambah Item Pekerjaan</span>
            </button>

            {onAddCategory && (
              <button
                onClick={onAddCategory}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border border-white/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Kategori Baru</span>
              </button>
            )}

            {onSelectPreset && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onSelectPreset('picu-2026')}
                  className="px-2.5 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold text-[11px] uppercase tracking-wider transition-all"
                >
                  📁 Contoh: PICU
                </button>
                <button
                  onClick={() => onSelectPreset('cleanroom-2026')}
                  className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[11px] uppercase tracking-wider transition-all"
                >
                  📁 Contoh: Cleanroom
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid Container with horizontal scroll */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-xs text-left border-collapse min-w-[1200px]">
          {/* Table Header */}
          <thead>
            {/* Row 1: Main Header Columns + Months Header */}
            <tr className="bg-[#0A0A0A] text-white font-black uppercase tracking-wider border-b border-white/20">
              <th rowSpan={3} className="px-2.5 py-3 text-center border-r border-white/10 w-12 sticky left-0 bg-[#0A0A0A] z-20 font-mono">
                NO
              </th>
              <th rowSpan={3} className="px-3 py-3 border-r border-white/10 min-w-[280px] sticky left-12 bg-[#0A0A0A] z-20">
                URAIAN PEKERJAAN
              </th>
              <th rowSpan={3} className="px-2 py-3 text-center border-r border-white/10 w-14">
                SAT
              </th>
              <th rowSpan={3} className="px-2.5 py-3 text-right border-r border-white/10 min-w-[70px]">
                VOLUME
              </th>
              <th rowSpan={3} className="px-3 py-3 text-right border-r border-white/10 min-w-[110px]">
                HARGA SATUAN (Rp)
              </th>
              <th rowSpan={3} className="px-3 py-3 text-right border-r border-white/10 min-w-[120px]">
                JML. HARGA (Rp)
              </th>
              <th rowSpan={3} className="px-2.5 py-3 text-right border-r border-white/10 min-w-[75px] bg-[#0A0A0A] text-[#C8FF00]">
                BOBOT %
              </th>

              {/* JANGKA WAKTU PELAKSANAAN PEKERJAAN */}
              <th
                colSpan={project.totalWeeks}
                className="px-2 py-2 text-center bg-[#C8FF00] text-black font-black uppercase tracking-widest border-b border-white/10 font-syne"
              >
                JANGKA WAKTU PELAKSANAAN PEKERJAAN ({project.durationDays} HARI KALENDER)
              </th>
            </tr>

            {/* Row 2: Bulan 1, Bulan 2, ... */}
            <tr className="bg-[#0A0A0A] text-white/80 font-bold uppercase tracking-wider border-b border-white/10">
              {monthGroups.map((mg) => (
                <th
                  key={mg.monthNumber}
                  colSpan={mg.weeks.length}
                  className="px-2 py-1.5 text-center border-r border-white/10 bg-white/5 font-mono"
                >
                  BULAN {mg.monthNumber}
                </th>
              ))}
            </tr>

            {/* Row 3: M1, M2, M3, M4 per month + Hari Kalender range */}
            <tr className="bg-[#0A0A0A] text-white/60 font-black text-[10px] uppercase tracking-wider font-mono">
              {weekSummaries.map((s) => {
                const dayStart = ((s.weekNumber - 1) * 7) + 1;
                const dayEnd = s.weekNumber * 7;
                const isCurrent = s.weekNumber === project.currentWeek;

                return (
                  <th
                    key={s.weekNumber}
                    className={`px-1 py-1 text-center border-r border-white/10 min-w-[50px] ${
                      isCurrent
                        ? 'bg-[#C8FF00] text-black font-black'
                        : ''
                    }`}
                    title={`Minggu Ke-${s.weekNumber} (Hari Ke-${dayStart} s/d Hari Ke-${dayEnd} Kalender)`}
                  >
                    <div className="flex flex-col items-center justify-center py-0.5">
                      <span className="text-[11px] font-black">M{s.weekNumber}</span>
                      <span className={`text-[8.5px] font-mono leading-tight ${isCurrent ? 'text-black/80 font-bold' : 'text-white/40 font-normal'}`}>
                        H{dayStart}-{dayEnd}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {project.categories.length === 0 && (
              <tr>
                <td colSpan={7 + project.totalWeeks} className="py-12 text-center bg-[#0D0D0D]">
                  <div className="flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto p-5 border border-white/10 bg-[#121212]">
                    <div className="w-12 h-12 bg-[#C8FF00]/10 border border-[#C8FF00]/30 flex items-center justify-center text-[#C8FF00]">
                      <Plus className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="font-syne font-black text-white text-base uppercase tracking-wide">
                        Tabel Item Pekerjaan Masih Kosong
                      </h4>
                      <p className="text-xs text-white/60 mt-1">
                        Pilih opsi di bawah ini untuk menginput Item Pekerjaan (Uraian Pekerjaan, Satuan, Volume, Harga Satuan, Durasi & Urutan Pekerjaan), atau Muat Contoh Data RAB yang sudah siap:
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <button
                        onClick={() => onAddItemToCategory('')}
                        className="px-4 py-2 bg-[#C8FF00] text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-[#b5e600] transition-all shadow-lg"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        + Input Item Pekerjaan
                      </button>

                      {onAddCategory && (
                        <button
                          onClick={onAddCategory}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 border border-white/20 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          + Kategori Baru
                        </button>
                      )}

                      {onSelectPreset && (
                        <>
                          <button
                            onClick={() => onSelectPreset('picu-2026')}
                            className="px-3 py-2 bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 text-xs font-bold uppercase tracking-wider transition-all"
                          >
                            📁 Muat Contoh PICU (Rp 882 Jt)
                          </button>
                          <button
                            onClick={() => onSelectPreset('cleanroom-2026')}
                            className="px-3 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-xs font-bold uppercase tracking-wider transition-all"
                          >
                            📁 Muat Contoh Cleanroom (Rp 844 Jt)
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {project.categories.map((cat) => {
              const isCollapsed = collapsedCategories[cat.id];
              const categoryTotal = cat.items.reduce(
                (sum, item) => sum + item.totalPrice,
                0
              );
              const categoryWeight = cat.items.reduce(
                (sum, item) => sum + item.weightPercent,
                0
              );

              // Filter items if showOnlyCritical is active
              const displayedItems = showOnlyCritical
                ? cat.items.filter((i) => isItemCriticalPath(i))
                : cat.items;

              if (showOnlyCritical && displayedItems.length === 0) {
                return null;
              }

              return (
                <React.Fragment key={cat.id}>
                  {/* Category Header Row */}
                  <tr className="bg-[#1A1A1A] hover:bg-[#222222] font-black uppercase text-white border-b border-white/10">
                    <td className="px-2.5 py-2 text-center border-r border-white/10 sticky left-0 bg-[#1A1A1A] z-10 text-[#C8FF00] font-mono">
                      {cat.code}
                    </td>
                    <td className="px-3 py-2 border-r border-white/10 sticky left-12 bg-[#1A1A1A] z-10">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => toggleCategory(cat.id)}
                          className="flex items-center gap-1.5 text-left text-white font-black hover:text-[#C8FF00] uppercase tracking-wide font-syne"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="w-4 h-4 text-white/50" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-white/50" />
                          )}
                          {cat.name}
                        </button>
                        {(role === 'admin' || role === 'kontraktor') && (
                          <button
                            onClick={() => onAddItemToCategory(cat.id)}
                            className="text-[10px] bg-[#0A0A0A] border border-white/20 hover:border-[#C8FF00] text-white/80 hover:text-[#C8FF00] px-2 py-0.5 font-bold uppercase tracking-wider transition-all"
                            title="Tambah item pekerjaan ke kategori ini"
                          >
                            + Item
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="border-r border-white/10"></td>
                    <td className="border-r border-white/10"></td>
                    <td className="border-r border-white/10"></td>
                    <td className="px-3 py-2 text-right border-r border-white/10 text-white font-mono font-bold">
                      {formatCurrency(categoryTotal)}
                    </td>
                    <td className="px-2.5 py-2 text-right border-r border-white/10 text-[#C8FF00] bg-[#C8FF00]/10 font-black font-mono">
                      {categoryWeight.toFixed(2)}%
                    </td>

                    {/* Category Weekly Sums */}
                    {weekSummaries.map((s) => {
                      const catWeeklyPlan = cat.items.reduce(
                        (sum, item) => sum + (item.weeklyPlan[s.weekNumber] || 0),
                        0
                      );
                      return (
                        <td
                          key={s.weekNumber}
                          className="px-1 py-1 text-center border-r border-white/10 font-bold text-[10px] text-white/70 bg-white/5 font-mono"
                        >
                          {catWeeklyPlan > 0 ? catWeeklyPlan.toFixed(2) : '-'}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Category Items */}
                  {!isCollapsed &&
                    displayedItems.map((item) => {
                      const isCritical = isItemCriticalPath(item);
                      const currWeek = project.currentWeek;
                      const planThisWeek = item.weeklyPlan ? item.weeklyPlan[currWeek] || 0 : 0;
                      const actualThisWeek = item.weeklyActual ? item.weeklyActual[currWeek] || 0 : 0;
                      const isLagging = planThisWeek > actualThisWeek && planThisWeek > 0;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-white/5 text-white/90 border-b border-white/10 group transition-colors ${
                            isCritical ? 'bg-amber-950/20' : ''
                          }`}
                        >
                          <td className="px-2.5 py-1.5 text-center text-white/40 border-r border-white/10 sticky left-0 bg-[#121212] group-hover:bg-[#1A1A1A] z-10 font-mono font-bold">
                            {item.itemNo}
                          </td>
                          <td className="px-3 py-1.5 border-r border-white/10 sticky left-12 bg-[#121212] group-hover:bg-[#1A1A1A] z-10">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-white line-clamp-2">
                                    {item.description}
                                  </span>
                                  {isCritical && (
                                    <span
                                      className="px-1.5 py-0.2 bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 flex-shrink-0"
                                      title="Pekerjaan Kritis (High Weight / Jalur Kritis)"
                                    >
                                      <Flame className="w-3 h-3 text-rose-400" /> KRITIS
                                    </span>
                                  )}
                                  {isLagging && (
                                    <span
                                      className="px-1 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5 flex-shrink-0"
                                      title="Progress Mingguan Ketinggalan Rencana"
                                    >
                                      <AlertTriangle className="w-3 h-3 text-amber-300" /> LAG
                                    </span>
                                  )}
                                </div>
                                {item.consultantNote && (
                                  <span className="text-[10px] text-amber-300/80 italic font-mono flex items-center gap-1 mt-0.5">
                                    <MessageSquare className="w-3 h-3 text-amber-400" /> Catatan MK: {item.consultantNote}
                                  </span>
                                )}
                              </div>

                              {(role === 'admin' || role === 'kontraktor') && (
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity flex-shrink-0">
                                  <button
                                    onClick={() => onAutoDistributeItem(item)}
                                    className="p-1 text-[#C8FF00] hover:bg-white/10"
                                    title="Auto Distribusi Mingguan"
                                  >
                                    <Wand2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onEditItem(item)}
                                    className="p-1 text-sky-400 hover:bg-white/10"
                                    title="Edit Item"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onDeleteItem(item.id)}
                                    className="p-1 text-rose-400 hover:bg-white/10"
                                    title="Hapus Item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-center border-r border-white/10 text-white/50 uppercase font-bold text-[10px] font-mono">
                            {item.unit}
                          </td>
                          <td className="px-2.5 py-1.5 text-right border-r border-white/10 text-white/80 font-mono">
                            {formatNumber(item.volume, 2)}
                          </td>
                          <td className="px-3 py-1.5 text-right border-r border-white/10 text-white/80 font-mono">
                            {formatCurrency(item.unitPrice).replace('Rp', '').trim()}
                          </td>
                          <td className="px-3 py-1.5 text-right border-r border-white/10 text-white font-bold font-mono">
                            {formatCurrency(item.totalPrice).replace('Rp', '').trim()}
                          </td>
                          <td className="px-2.5 py-1.5 text-right border-r border-white/10 font-bold text-sky-400 bg-sky-500/10 font-mono">
                            {item.weightPercent.toFixed(2)}
                          </td>

                          {/* Weekly Plan & Actual Cells */}
                          {weekSummaries.map((s) => {
                            const planVal = item.weeklyPlan[s.weekNumber];
                            const actualVal = item.weeklyActual[s.weekNumber];
                            const isCurrentWeek = s.weekNumber === project.currentWeek;

                            const isEditingThis =
                              activeCellEdit?.itemId === item.id &&
                              activeCellEdit?.weekNum === s.weekNumber;

                            return (
                              <td
                                key={s.weekNumber}
                                onClick={() =>
                                  handleCellClick(
                                    item.id,
                                    s.weekNumber,
                                    'plan',
                                    planVal || 0
                                  )
                                }
                                className={`px-1 py-1 text-center border-r border-white/10 cursor-pointer transition-colors relative hover:bg-[#C8FF00]/20 font-mono ${
                                  isCurrentWeek ? 'bg-[#C8FF00]/10 border-x border-[#C8FF00]/40' : ''
                                }`}
                              >
                                {isEditingThis ? (
                                  <input
                                    type="text"
                                    value={cellValue}
                                    onChange={(e) => setCellValue(e.target.value)}
                                    onBlur={handleCellSave}
                                    onKeyDown={(e) =>
                                      e.key === 'Enter' && handleCellSave()
                                    }
                                    autoFocus
                                    className="w-full text-center text-xs font-black bg-black text-[#C8FF00] border border-[#C8FF00] px-1 py-0.5 focus:outline-none"
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center min-h-[28px]">
                                    {planVal ? (
                                      <span className="font-bold text-white text-[11px]">
                                        {planVal.toFixed(2)}
                                      </span>
                                    ) : (
                                      <span className="text-white/20 text-[10px]">-</span>
                                    )}

                                    {/* Optional Actual progress display underneath */}
                                    {actualVal !== undefined && actualVal > 0 && (
                                      <span className="text-[9px] font-black text-[#C8FF00] bg-[#C8FF00]/20 px-1 border border-[#C8FF00]/40 mt-0.5">
                                        {actualVal.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                </React.Fragment>
              );
            })}
          </tbody>

          {/* Table Footer: Summary & Kumulatif Rows */}
          <tfoot>
            {/* Grand Total Row */}
            <tr className="bg-[#0A0A0A] text-white font-black text-xs border-t-2 border-white/20 uppercase tracking-wider">
              <td colSpan={5} className="px-4 py-3 text-right border-r border-white/10 sticky left-0 bg-[#0A0A0A] z-20 font-syne">
                TOTAL FISIK PEKERJAAN
              </td>
              <td className="px-3 py-3 text-right border-r border-white/10 text-white font-mono font-bold">
                {formatCurrency(grandTotalCost)}
              </td>
              <td className="px-2.5 py-3 text-right border-r border-white/10 text-[#C8FF00] font-black bg-[#C8FF00]/10 font-mono">
                100.00%
              </td>
              <td colSpan={project.totalWeeks} className="bg-[#0A0A0A]"></td>
            </tr>

            {/* Row A: TOTAL FISIK PEKERJAAN RENCANA (Weekly Plan Sum) */}
            <tr className="bg-sky-950/40 font-bold text-sky-300 text-xs border-b border-white/10 uppercase tracking-wider">
              <td colSpan={6} className="px-4 py-2 text-right border-r border-white/10 sticky left-0 bg-[#0A0A0A] z-20 text-sky-400 font-syne">
                A. TOTAL FISIK PEKERJAAN RENCANA (MINGGUAN)
              </td>
              <td className="border-r border-white/10"></td>
              {weekSummaries.map((s) => (
                <td
                  key={s.weekNumber}
                  className="px-1 py-1 text-center border-r border-white/10 text-[11px] font-mono"
                >
                  {s.plannedWeight > 0 ? s.plannedWeight.toFixed(2) : '-'}
                </td>
              ))}
            </tr>

            {/* Row B: KUMULATIF RENCANA % */}
            <tr className="bg-sky-900/60 font-black text-sky-200 text-xs border-b-2 border-sky-500/40 uppercase tracking-wider">
              <td colSpan={6} className="px-4 py-2 text-right border-r border-sky-500/40 sticky left-0 bg-[#0A0A0A] z-20 text-sky-300 font-syne">
                B. KUMULATIF RENCANA %
              </td>
              <td className="border-r border-sky-500/40"></td>
              {weekSummaries.map((s) => (
                <td
                  key={s.weekNumber}
                  className="px-1 py-1 text-center border-r border-sky-500/40 text-[11px] font-mono font-black text-sky-300 bg-sky-900/30"
                >
                  {s.cumulativePlannedWeight.toFixed(2)}
                </td>
              ))}
            </tr>

            {/* Row C: TOTAL FISIK PEKERJAAN REALISASI (Weekly Actual Sum) */}
            <tr className="bg-lime-950/40 font-bold text-[#C8FF00] text-xs border-b border-white/10 uppercase tracking-wider">
              <td colSpan={6} className="px-4 py-2 text-right border-r border-white/10 sticky left-0 bg-[#0A0A0A] z-20 text-[#C8FF00] font-syne">
                C. TOTAL FISIK PEKERJAAN REALISASI (MINGGUAN)
              </td>
              <td className="border-r border-white/10"></td>
              {weekSummaries.map((s) => (
                <td
                  key={s.weekNumber}
                  className="px-1 py-1 text-center border-r border-white/10 text-[11px] font-mono"
                >
                  {s.actualWeight > 0 ? s.actualWeight.toFixed(2) : '-'}
                </td>
              ))}
            </tr>

            {/* Row D: KUMULATIF REALISASI % */}
            <tr className="bg-[#C8FF00]/20 font-black text-[#C8FF00] text-xs border-b-2 border-[#C8FF00]/40 uppercase tracking-wider">
              <td colSpan={6} className="px-4 py-2 text-right border-r border-[#C8FF00]/40 sticky left-0 bg-[#0A0A0A] z-20 text-[#C8FF00] font-syne">
                D. KUMULATIF REALISASI %
              </td>
              <td className="border-r border-[#C8FF00]/40"></td>
              {weekSummaries.map((s) => (
                <td
                  key={s.weekNumber}
                  className="px-1 py-1 text-center border-r border-[#C8FF00]/40 text-[11px] font-mono font-black bg-[#C8FF00]/10"
                >
                  {s.cumulativeActualWeight > 0
                    ? s.cumulativeActualWeight.toFixed(2)
                    : '-'}
                </td>
              ))}
            </tr>

            {/* Row E: DEVIASI (REALISASI - RENCANA) */}
            <tr className="bg-[#0A0A0A] text-white font-black text-xs uppercase tracking-wider">
              <td colSpan={6} className="px-4 py-2.5 text-right border-r border-white/10 sticky left-0 bg-[#0A0A0A] z-20 text-white font-syne">
                E. DEVIASI % (REALISASI - RENCANA)
              </td>
              <td className="border-r border-white/10"></td>
              {weekSummaries.map((s) => {
                const isPositive = s.deviationCumulative >= 0;
                const hasActual = s.cumulativeActualWeight > 0;
                return (
                  <td
                    key={s.weekNumber}
                    className={`px-1 py-2 text-center border-r border-white/10 text-[11px] font-mono font-black ${
                      !hasActual
                        ? 'text-white/30'
                        : isPositive
                        ? 'text-[#C8FF00] bg-[#C8FF00]/10'
                        : 'text-rose-400 bg-rose-500/10'
                    }`}
                  >
                    {hasActual
                      ? `${isPositive ? '+' : ''}${s.deviationCumulative.toFixed(
                          2
                        )}`
                      : '-'}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

