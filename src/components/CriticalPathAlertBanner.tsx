import React from 'react';
import { AlertTriangle, Flame, Sparkles, Filter, ChevronRight, CheckCircle2 } from 'lucide-react';
import { ProjectInfo, WeekSummary } from '../types/schedule';
import { getOverallProjectStatus } from '../utils/calculator';

interface CriticalPathAlertBannerProps {
  project: ProjectInfo;
  weekSummaries: WeekSummary[];
  onOpenAiAssistant: (customPrompt?: string) => void;
  showOnlyCritical: boolean;
  onToggleShowOnlyCritical: () => void;
}

export const CriticalPathAlertBanner: React.FC<CriticalPathAlertBannerProps> = ({
  project,
  weekSummaries,
  onOpenAiAssistant,
  showOnlyCritical,
  onToggleShowOnlyCritical,
}) => {
  const overall = getOverallProjectStatus(project, weekSummaries);
  const { status, badgeColor, title, deviation, alerts } = overall;

  return (
    <div className="bg-[#121212] border border-white/10 p-4 mb-6 shadow-2xl font-sans">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 border font-mono font-black text-xs ${badgeColor} flex items-center gap-2`}>
            {status === 'KRITIS' && <AlertTriangle className="w-5 h-5 animate-bounce text-rose-400" />}
            {status === 'WASPADA' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
            {status === 'ON_TRACK' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {status === 'AHEAD' && <Sparkles className="w-5 h-5 text-[#C8FF00]" />}
            <span className="uppercase tracking-widest text-sm">{status}</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm uppercase tracking-wide font-syne text-white">
                {title}
              </h3>
              <span className="font-mono text-xs font-bold text-white/60 bg-white/5 px-2 py-0.5 border border-white/10">
                Minggu-{project.currentWeek}
              </span>
            </div>
            <p className="text-xs font-mono mt-0.5 text-white/70">
              Deviasi Kumulatif Saat Ini:{' '}
              <strong
                className={
                  deviation < 0 ? 'text-rose-400 font-black' : 'text-[#C8FF00] font-black'
                }
              >
                {deviation > 0 ? `+${deviation.toFixed(2)}%` : `${deviation.toFixed(2)}%`}
              </strong>{' '}
              ({deviation < 0 ? 'Ketinggalan Progress' : 'Sesuai / Melampaui Rencana'})
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <button
            onClick={onToggleShowOnlyCritical}
            className={`px-3 py-1.5 border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              showOnlyCritical
                ? 'bg-[#C8FF00] text-black border-[#C8FF00] font-black'
                : 'bg-white/5 text-white/80 border-white/20 hover:text-white hover:bg-white/10'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {showOnlyCritical ? 'Tampilkan Semua Item' : 'Filter Pekerjaan Kritis'}
          </button>

          <button
            onClick={() => {
              const promptMsg = `Saya memerlukan strategi percepatan (Crash Program) untuk proyek ${project.title} minggu ke-${project.currentWeek} dengan deviasi ${deviation}%. Item kritis yang mengalami kendala: ${alerts.map((a) => a.description).join(', ')}.`;
              onOpenAiAssistant(promptMsg);
            }}
            className="px-4 py-1.5 bg-[#C8FF00] hover:bg-[#b5e600] text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Solusi Percepatan AI (Fast-Tracking)
          </button>
        </div>
      </div>

      {/* Critical Path Alerts List */}
      {alerts.length > 0 ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-400">
            <Flame className="w-4 h-4 text-rose-500" />
            Daftar Pekerjaan Kritis &amp; Item Mengalami Deviasi Negatif ({alerts.length} Item):
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {alerts.slice(0, 4).map((alert) => (
              <div
                key={alert.itemId}
                className="bg-[#0A0A0A] border border-white/10 p-2.5 flex items-start justify-between gap-3 font-mono text-xs hover:border-white/20 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sky-400">#{alert.itemNo}</span>
                    <span className="font-bold text-white truncate">{alert.description}</span>
                  </div>
                  <div className="text-[10px] text-white/50 flex items-center gap-3 mt-1">
                    <span>Bobot: <strong className="text-white">{alert.weightPercent.toFixed(2)}%</strong></span>
                    <span>
                      Deviasi Lag:{' '}
                      <strong className="text-rose-400 font-black">-{alert.lagPercent}%</strong>
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-300/80 mt-1 italic font-sans">
                    💡 {alert.recommendation}
                  </div>
                </div>

                <div
                  className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                    alert.riskLevel === 'HIGH'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {alert.riskLevel === 'HIGH' ? 'RISIKO TINGGI' : 'RISIKO SEDANG'}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-2 text-[11px] text-emerald-400 font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Seluruh pekerjaan kritis pada minggu ke-{project.currentWeek} berjalan sesuai target (On-Track).
        </div>
      )}
    </div>
  );
};
