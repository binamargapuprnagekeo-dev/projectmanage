import React from 'react';
import {
  Building2,
  MapPin,
  Calendar,
  Building,
  UserCheck,
  TrendingUp,
  AlertTriangle,
  Clock,
  Edit2,
  DollarSign,
} from 'lucide-react';
import { ProjectInfo, WeekSummary } from '../types/schedule';
import { formatCurrency } from '../utils/calculator';

interface ProjectInfoBannerProps {
  project: ProjectInfo;
  weekSummaries: WeekSummary[];
  onOpenProjectEdit: () => void;
  grandTotalCost: number;
}

export const ProjectInfoBanner: React.FC<ProjectInfoBannerProps> = ({
  project,
  weekSummaries,
  onOpenProjectEdit,
  grandTotalCost,
}) => {
  const currentSummary = weekSummaries.find(
    (s) => s.weekNumber === project.currentWeek
  ) || weekSummaries[weekSummaries.length - 1];

  const deviasi = currentSummary ? currentSummary.deviationCumulative : 0;
  const planKum = currentSummary ? currentSummary.cumulativePlannedWeight : 0;
  const actualKum = currentSummary ? currentSummary.cumulativeActualWeight : 0;

  let statusBadgeColor = 'bg-[#C8FF00]/10 text-[#C8FF00] border-[#C8FF00]/40';
  let statusIcon = <TrendingUp className="w-4 h-4 text-[#C8FF00]" />;
  let statusText = `SESUAI / LEBIH CEPAT (+${deviasi.toFixed(2)}%)`;

  if (deviasi < 0) {
    statusBadgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/40';
    statusIcon = <AlertTriangle className="w-4 h-4 text-rose-400" />;
    statusText = `TERLAMBAT (${deviasi.toFixed(2)}%) - DEVIASI MINGGUAN`;
  } else if (deviasi === 0) {
    statusBadgeColor = 'bg-sky-500/10 text-sky-400 border-sky-500/40';
    statusIcon = <Clock className="w-4 h-4 text-sky-400" />;
    statusText = `TEPAT SESUAI RENCANA (0.00%)`;
  }

  return (
    <div className="bg-[#121212] border-b border-white/10 text-white">
      <div className="max-w-[1600px] mx-auto px-4 py-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Main Info */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase font-syne">
                {project.title}
              </h2>
              <button
                onClick={onOpenProjectEdit}
                className="p-1.5 text-white/50 hover:text-[#C8FF00] hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
                title="Edit Data Proyek"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-semibold text-white/60 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C8FF00]" />
                {project.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#C8FF00]" />
                {project.agency}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C8FF00]" />
                TA {project.fiscalYear} ({project.durationDays} HARI / {project.totalWeeks} MINGGU)
              </span>
              <span className="flex items-center gap-1.5 text-white font-bold">
                <UserCheck className="w-3.5 h-3.5 text-[#C8FF00]" />
                {project.bidderName}
              </span>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Total Nilai Anggaran */}
            <div className="bg-[#0A0A0A] border border-white/10 px-4 py-2.5 min-w-[180px]">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#C8FF00] flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-[#C8FF00]" /> Total Nilai Proyek
              </div>
              <div className="text-base font-black text-white mt-0.5 tracking-tight">
                {formatCurrency(grandTotalCost)}
              </div>
            </div>

            {/* Current Week Progress */}
            <div className="bg-[#0A0A0A] border border-white/10 px-4 py-2.5 min-w-[210px]">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/50 flex items-center justify-between">
                <span>Progress M-{project.currentWeek}</span>
                <span className="text-[#C8FF00]">100% Target</span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-sm font-black text-sky-400">
                  Rcn: {planKum.toFixed(2)}%
                </span>
                <span className="text-xs text-white/20">|</span>
                <span className="text-sm font-black text-[#C8FF00]">
                  Real: {actualKum.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Deviation Status Pill */}
            <div
              className={`border px-4 py-2.5 flex items-center gap-3 min-w-[220px] ${statusBadgeColor}`}
            >
              {statusIcon}
              <div>
                <div className="text-[10px] font-black tracking-[0.2em] uppercase">
                  Status Deviasi
                </div>
                <div className="text-xs font-black tracking-tight mt-0.5">{statusText}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
