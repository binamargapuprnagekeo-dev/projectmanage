export interface ScheduleItem {
  id: string;
  categoryId: string;
  itemNo: string; // e.g. "1", "2", "3.a"
  description: string; // e.g. "Pemasangan 1 m2 dinding bata merah tebal 1/2 batu"
  unit: string; // SAT e.g. "m²", "m³", "Kg", "Ls", "bh", "Unit", "Set", "psg", "titik"
  volume: number;
  unitPrice: number; // Harga Satuan in IDR
  totalPrice: number; // Computed: volume * unitPrice
  weightPercent: number; // Computed: (totalPrice / projectTotal) * 100
  startWeek?: number; // 1-indexed
  endWeek?: number; // 1-indexed
  weeklyPlan: Record<number, number>; // weekNumber (1..20) -> weight % assigned
  weeklyActual: Record<number, number>; // weekNumber (1..20) -> weight % realized
  isCriticalPath?: boolean; // Flag if item is on critical path (high weight or critical sequence)
  consultantNote?: string; // Catatan dari Konsultan Pengawas
  verifiedByConsultant?: Record<number, boolean>; // weekNumber -> verified status
  verifiedByAdmin?: Record<number, boolean>; // weekNumber -> verified by PPK status
}

export interface Category {
  id: string;
  code: string; // e.g., "I", "II", "A", "B", "PEKERJAAN UMUM"
  name: string; // e.g., "PEKERJAAN UMUM DAN PERSIAPAN"
  items: ScheduleItem[];
}

export type UserRole = 'admin' | 'kontraktor' | 'konsultan';

export interface GoogleSheetsConfig {
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  autoSync?: boolean;
  lastSyncedAt?: string;
}

export interface ProjectInfo {
  id: string;
  title: string; // Nama Pekerjaan
  location: string; // Lokasi
  agency: string; // Satuan Kerja
  fiscalYear: string; // Tahun Anggaran
  durationDays: number; // e.g., 150
  durationMonths: number; // e.g., 5
  weeksPerMonth: number; // default 4
  totalWeeks: number; // durationMonths * weeksPerMonth (e.g. 20)
  bidderName: string; // Penawar / Kontraktor (e.g. "CV. AMAR MANDIRI PERSADA")
  directorName: string; // Nama Kuasa Direktur (e.g. "JULIANUS CHANDRA DULA")
  directorTitle: string; // Jabatan (e.g. "Kuasa Direktur")
  cityDate: string; // Place & Date (e.g. "Mbay, 01 Juli 2026")
  categories: Category[];
  currentWeek: number; // Which week is currently active/reported
  sheetsConfig?: GoogleSheetsConfig;
}

export interface CriticalPathAlert {
  itemId: string;
  itemNo: string;
  description: string;
  weightPercent: number;
  plannedThisWeek: number;
  actualThisWeek: number;
  lagPercent: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: string;
}

export interface WeekSummary {
  weekNumber: number; // 1-indexed (1..20)
  monthNumber: number; // 1..5
  weekInMonth: number; // 1..4
  plannedWeight: number; // Total plan % in this week
  cumulativePlannedWeight: number; // Running total plan %
  actualWeight: number; // Total actual % in this week
  cumulativeActualWeight: number; // Running total actual %
  deviationCumulative: number; // Cumulative Actual - Cumulative Plan
}

export interface PaymentTerm {
  id: string;
  name: string;
  requiredProgressPercent: number; // e.g. 25%, 50%, 75%, 100%
  payoutPercent: number; // e.g. 20%, 30%, 30%, 20%
  amount: number;
  estimatedWeek: number;
  actualWeekReached?: number;
  isPaid: boolean;
}

