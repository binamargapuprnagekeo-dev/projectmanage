import React from 'react';
import { ProjectInfo, WeekSummary } from '../types/schedule';
import { calculatePaymentTerms, formatCurrency } from '../utils/calculator';
import { DollarSign, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface TerminCalculatorProps {
  project: ProjectInfo;
  weekSummaries: WeekSummary[];
  grandTotalCost: number;
}

export const TerminCalculator: React.FC<TerminCalculatorProps> = ({
  project,
  weekSummaries,
  grandTotalCost,
}) => {
  const paymentTerms = calculatePaymentTerms(grandTotalCost, weekSummaries);
  const totalPaid = paymentTerms
    .filter((t) => t.isPaid)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121212] border border-white/10 p-6 text-white shadow-xl">
          <div className="text-[10px] font-black text-[#C8FF00] uppercase tracking-[0.2em]">
            Total Nilai Kontrak
          </div>
          <div className="text-2xl font-black text-white mt-1 font-syne">
            {formatCurrency(grandTotalCost)}
          </div>
          <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mt-1">
            100% Anggaran Pelaksanaan
          </div>
        </div>

        <div className="bg-[#121212] border border-[#C8FF00]/30 p-6 text-white shadow-xl">
          <div className="text-[10px] font-black text-[#C8FF00] uppercase tracking-[0.2em]">
            Estimasi Pencairan
          </div>
          <div className="text-2xl font-black text-[#C8FF00] mt-1 font-syne">
            {formatCurrency(totalPaid)}
          </div>
          <div className="text-xs font-semibold text-white/70 uppercase tracking-wider mt-1">
            Realisasi ({weekSummaries.find(s=>s.weekNumber===project.currentWeek)?.cumulativeActualWeight.toFixed(2) || 0}%)
          </div>
        </div>

        <div className="bg-[#121212] border border-sky-500/30 p-6 text-white shadow-xl">
          <div className="text-[10px] font-black text-sky-400 uppercase tracking-[0.2em]">
            Sisa Nilai Pembayaran
          </div>
          <div className="text-2xl font-black text-sky-400 mt-1 font-syne">
            {formatCurrency(grandTotalCost - totalPaid)}
          </div>
          <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mt-1">
            Termin Lanjutan & Retensi
          </div>
        </div>
      </div>

      {/* Termin Table */}
      <div className="bg-[#121212] border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-4 bg-[#0A0A0A] text-white flex items-center justify-between border-b border-white/10">
          <h3 className="font-black text-base flex items-center gap-2 uppercase tracking-tight font-syne">
            <DollarSign className="w-5 h-5 text-[#C8FF00]" />
            Jadwal Proyeksi Pencairan Dana &amp; Termin
          </h3>
          <span className="text-[10px] bg-white/10 border border-white/20 px-3 py-1 font-black uppercase tracking-widest text-[#C8FF00]">
            5 Tahapan Standard
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0A0A0A] text-white font-black uppercase tracking-wider border-b border-white/20">
              <tr>
                <th className="p-3.5">TAHAP TERMIN</th>
                <th className="p-3.5 text-center">SYARAT MINIMAL PROGRESS</th>
                <th className="p-3.5 text-center">ESTIMASI MINGGU RENCANA</th>
                <th className="p-3.5 text-center">REALISASI TERTIAP</th>
                <th className="p-3.5 text-right">PERSENTASE CAIR</th>
                <th className="p-3.5 text-right">NILAI PENCAIRAN (RP)</th>
                <th className="p-3.5 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 font-semibold">
              {paymentTerms.map((term) => {
                return (
                  <tr key={term.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-bold text-white uppercase tracking-wider">{term.name}</td>
                    <td className="p-3.5 text-center font-black text-sky-400">
                      {term.requiredProgressPercent}%
                    </td>
                    <td className="p-3.5 text-center text-white/60 font-mono">
                      Minggu ke-{term.estimatedWeek}
                    </td>
                    <td className="p-3.5 text-center font-bold text-white font-mono">
                      {term.actualWeekReached
                        ? `Minggu ke-${term.actualWeekReached}`
                        : '-'}
                    </td>
                    <td className="p-3.5 text-right font-black text-white">
                      {term.payoutPercent}%
                    </td>
                    <td className="p-3.5 text-right font-black text-[#C8FF00] font-mono text-sm">
                      {formatCurrency(term.amount)}
                    </td>
                    <td className="p-3.5 text-center">
                      {term.isPaid ? (
                        <span className="inline-flex items-center gap-1.5 bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/30 font-black px-3 py-1 text-[10px] uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Syarat Tercapai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-white/5 text-white/40 border border-white/10 font-bold px-3 py-1 text-[10px] uppercase tracking-wider">
                          <Clock className="w-3.5 h-3.5" />
                          Menunggu
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
