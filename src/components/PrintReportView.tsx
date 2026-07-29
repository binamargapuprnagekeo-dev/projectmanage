import React from 'react';
import { ProjectInfo, WeekSummary } from '../types/schedule';
import { formatCurrency, formatNumber } from '../utils/calculator';
import { Printer, ArrowLeft } from 'lucide-react';

interface PrintReportViewProps {
  project: ProjectInfo;
  weekSummaries: WeekSummary[];
  grandTotalCost: number;
  onBack: () => void;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  project,
  weekSummaries,
  grandTotalCost,
  onBack,
}) => {
  const handlePrint = () => {
    window.print();
  };

  // Group weeks by Month
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
    <div className="bg-[#0A0A0A] min-h-screen p-4 sm:p-8 print:p-0 print:bg-white text-white print:text-black font-sans">
      {/* Top Print Control Bar */}
      <div className="max-w-[1600px] mx-auto mb-6 flex items-center justify-between bg-[#121212] border border-white/20 text-white p-4 rounded-none shadow-xl print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs bg-[#0A0A0A] hover:bg-white/10 border border-white/20 px-4 py-2 font-bold uppercase tracking-wider transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-[#C8FF00]" /> Kembali ke Aplikasi
        </button>
        <div className="text-center">
          <div className="font-black text-sm uppercase tracking-wider font-syne text-[#C8FF00]">Mode Cetak / Export PDF Dokumen Resmi</div>
          <p className="text-[11px] text-white/50 uppercase tracking-wider font-medium">
            Layout diformat sesuai standar pengajuan jadwal pelaksanaan pekerjaan konstruksi
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-[#C8FF00] hover:bg-[#b5e600] text-black text-xs px-5 py-2 font-black uppercase tracking-wider shadow-md transition-all"
        >
          <Printer className="w-4 h-4" /> Cetak / Simpan PDF
        </button>
      </div>

      {/* Official Document Container */}
      <div className="max-w-[1600px] mx-auto bg-[#121212] border border-white/20 p-6 shadow-2xl print:bg-white print:text-black print:shadow-none print:border-none print:p-0">
        {/* Header Block */}
        <div className="text-center uppercase font-black space-y-1 mb-6 border-b-2 border-white/20 print:border-black pb-4 font-syne">
          <h2 className="text-xl font-black tracking-wider text-[#C8FF00] print:text-black">
            JADWAL PELAKSANAAN PEKERJAAN (KURVA S)
          </h2>
          <h3 className="text-sm font-bold text-white/80 print:text-black">{project.title}</h3>
        </div>

        {/* Project Meta Info Header */}
        <div className="grid grid-cols-2 text-xs font-bold mb-4 gap-y-1 border border-white/20 print:border-black p-3.5 bg-[#0A0A0A] print:bg-gray-50 text-white/90 print:text-black font-mono">
          <div>
            <span className="w-32 inline-block font-sans uppercase text-white/50 print:text-black">Nama Pekerjaan</span>: <span className="text-white print:text-black">{project.title}</span>
          </div>
          <div>
            <span className="w-32 inline-block font-sans uppercase text-white/50 print:text-black">Tahun Anggaran</span>: <span className="text-white print:text-black">{project.fiscalYear}</span>
          </div>
          <div>
            <span className="w-32 inline-block font-sans uppercase text-white/50 print:text-black">Lokasi</span>: <span className="text-white print:text-black">{project.location}</span>
          </div>
          <div>
            <span className="w-32 inline-block font-sans uppercase text-white/50 print:text-black">Jangka Waktu</span>: <span className="text-[#C8FF00] print:text-black">{project.durationDays} HARI KALENDER ({project.totalWeeks} MINGGU)</span>
          </div>
          <div>
            <span className="w-32 inline-block font-sans uppercase text-white/50 print:text-black">Satuan Kerja</span>: <span className="text-white print:text-black">{project.agency}</span>
          </div>
          <div>
            <span className="w-32 inline-block font-sans uppercase text-white/50 print:text-black">Total Nilai Proyek</span>: <span className="text-[#C8FF00] print:text-black">{formatCurrency(grandTotalCost)}</span>
          </div>
        </div>

        {/* Schedule Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] text-left border-collapse border border-white/20 print:border-black">
            <thead>
              <tr className="bg-[#0A0A0A] print:bg-gray-200 text-white print:text-black font-black uppercase font-syne border-b border-white/20 print:border-black">
                <th rowSpan={3} className="p-1 text-center border border-white/20 print:border-black w-8">
                  NO
                </th>
                <th rowSpan={3} className="p-1.5 border border-white/20 print:border-black min-w-[200px]">
                  URAIAN PEKERJAAN
                </th>
                <th rowSpan={3} className="p-1 text-center border border-white/20 print:border-black w-10">
                  SAT
                </th>
                <th rowSpan={3} className="p-1 text-right border border-white/20 print:border-black min-w-[50px]">
                  VOL
                </th>
                <th rowSpan={3} className="p-1 text-right border border-white/20 print:border-black min-w-[80px]">
                  HARGA SATUAN (RP)
                </th>
                <th rowSpan={3} className="p-1 text-right border border-white/20 print:border-black min-w-[90px]">
                  JML. HARGA (RP)
                </th>
                <th rowSpan={3} className="p-1 text-right border border-white/20 print:border-black min-w-[55px] bg-[#1A1A1A] print:bg-gray-300 text-[#C8FF00] print:text-black">
                  BOBOT %
                </th>
                <th
                  colSpan={project.totalWeeks}
                  className="p-1 text-center border border-white/20 print:border-black uppercase font-black"
                >
                  JANGKA WAKTU PELAKSANAAN PEKERJAAN ({project.durationDays} HARI KALENDER)
                </th>
              </tr>
              <tr className="bg-[#0A0A0A] print:bg-gray-200 text-white print:text-black font-bold uppercase border-b border-white/20 print:border-black">
                {monthGroups.map((mg) => (
                  <th
                    key={mg.monthNumber}
                    colSpan={mg.weeks.length}
                    className="p-1 text-center border border-white/20 print:border-black text-[#C8FF00] print:text-black"
                  >
                    BULAN {mg.monthNumber}
                  </th>
                ))}
              </tr>
              <tr className="bg-[#0A0A0A] print:bg-gray-200 text-white print:text-black font-bold border-b border-white/20 print:border-black">
                {weekSummaries.map((s) => (
                  <th
                    key={s.weekNumber}
                    className="p-1 text-center border border-white/20 print:border-black min-w-[28px]"
                  >
                    M{s.weekInMonth}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {project.categories.map((cat) => {
                const categoryTotal = cat.items.reduce((s, i) => s + i.totalPrice, 0);
                const categoryWeight = cat.items.reduce((s, i) => s + i.weightPercent, 0);

                return (
                  <React.Fragment key={cat.id}>
                    {/* Category Row */}
                    <tr className="bg-[#1A1A1A] print:bg-gray-100 font-black text-white print:text-black border-b border-white/20 print:border-black uppercase">
                      <td className="p-1 text-center border border-white/20 print:border-black">{cat.code}</td>
                      <td className="p-1.5 border border-white/20 print:border-black tracking-wider">{cat.name}</td>
                      <td className="border border-white/20 print:border-black"></td>
                      <td className="border border-white/20 print:border-black"></td>
                      <td className="border border-white/20 print:border-black"></td>
                      <td className="p-1 text-right border border-white/20 print:border-black font-mono">
                        {formatCurrency(categoryTotal).replace('Rp', '').trim()}
                      </td>
                      <td className="p-1 text-right border border-white/20 print:border-black font-bold bg-[#0A0A0A] print:bg-gray-200 text-[#C8FF00] print:text-black">
                        {categoryWeight.toFixed(2)}
                      </td>
                      {weekSummaries.map((s) => {
                        const catWeeklyPlan = cat.items.reduce(
                          (sum, item) => sum + (item.weeklyPlan[s.weekNumber] || 0),
                          0
                        );
                        return (
                          <td
                            key={s.weekNumber}
                            className="p-0.5 text-center border border-white/20 print:border-black font-bold font-mono text-[9px] text-[#C8FF00] print:text-black"
                          >
                            {catWeeklyPlan > 0 ? catWeeklyPlan.toFixed(2) : ''}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Items */}
                    {cat.items.map((item) => (
                      <tr key={item.id} className="border-b border-white/10 print:border-black hover:bg-white/5 print:hover:bg-transparent">
                        <td className="p-1 text-center border border-white/20 print:border-black text-white/60 print:text-black">
                          {item.itemNo}
                        </td>
                        <td className="p-1.5 border border-white/20 print:border-black font-semibold text-white/90 print:text-black">
                          {item.description}
                        </td>
                        <td className="p-1 text-center border border-white/20 print:border-black text-white/80 print:text-black">{item.unit}</td>
                        <td className="p-1 text-right border border-white/20 print:border-black font-mono">
                          {formatNumber(item.volume, 2)}
                        </td>
                        <td className="p-1 text-right border border-white/20 print:border-black font-mono">
                          {formatCurrency(item.unitPrice).replace('Rp', '').trim()}
                        </td>
                        <td className="p-1 text-right border border-white/20 print:border-black font-mono">
                          {formatCurrency(item.totalPrice).replace('Rp', '').trim()}
                        </td>
                        <td className="p-1 text-right border border-white/20 print:border-black font-bold bg-[#0A0A0A] print:bg-gray-50 text-sky-400 print:text-black font-mono">
                          {item.weightPercent.toFixed(2)}
                        </td>
                        {weekSummaries.map((s) => {
                          const planVal = item.weeklyPlan[s.weekNumber];
                          return (
                            <td
                              key={s.weekNumber}
                              className="p-0.5 text-center border border-white/20 print:border-black font-mono text-[9px] text-white/80 print:text-black"
                            >
                              {planVal ? planVal.toFixed(2) : ''}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>

            {/* Summary Rows */}
            <tfoot>
              {/* Grand Total */}
              <tr className="bg-[#0A0A0A] print:bg-gray-200 font-black text-white print:text-black border-t-2 border-white/20 print:border-black">
                <td colSpan={5} className="p-1.5 text-right border border-white/20 print:border-black uppercase font-syne">
                  TOTAL FISIK PEKERJAAN
                </td>
                <td className="p-1 text-right border border-white/20 print:border-black font-mono font-black text-[#C8FF00] print:text-black">
                  {formatCurrency(grandTotalCost)}
                </td>
                <td className="p-1 text-right border border-white/20 print:border-black font-black bg-[#1A1A1A] print:bg-gray-300 text-[#C8FF00] print:text-black">
                  100.00
                </td>
                <td colSpan={project.totalWeeks} className="border border-white/20 print:border-black"></td>
              </tr>

              {/* Rencana Mingguan */}
              <tr className="font-bold bg-[#121212] print:bg-gray-100 text-white print:text-black">
                <td colSpan={6} className="p-1.5 text-right border border-white/20 print:border-black uppercase">
                  A. TOTAL FISIK PEKERJAAN RENCANA
                </td>
                <td className="border border-white/20 print:border-black"></td>
                {weekSummaries.map((s) => (
                  <td key={s.weekNumber} className="p-0.5 text-center border border-white/20 print:border-black font-mono text-[9px] text-amber-400 print:text-black">
                    {s.plannedWeight > 0 ? s.plannedWeight.toFixed(2) : ''}
                  </td>
                ))}
              </tr>

              {/* Kumulatif Rencana */}
              <tr className="font-extrabold bg-[#0A0A0A] print:bg-gray-200 text-white print:text-black">
                <td colSpan={6} className="p-1.5 text-right border border-white/20 print:border-black uppercase font-syne">
                  B. KOMULATIF RENCANA %
                </td>
                <td className="border border-white/20 print:border-black"></td>
                {weekSummaries.map((s) => (
                  <td key={s.weekNumber} className="p-0.5 text-center border border-white/20 print:border-black font-mono text-[9px] text-[#C8FF00] print:text-black">
                    {s.cumulativePlannedWeight.toFixed(2)}
                  </td>
                ))}
              </tr>

              {/* Realisasi Mingguan */}
              <tr className="font-bold bg-[#121212] print:bg-gray-100 text-white print:text-black">
                <td colSpan={6} className="p-1.5 text-right border border-white/20 print:border-black uppercase">
                  C. TOTAL FISIK PEKERJAAN REALISASI
                </td>
                <td className="border border-white/20 print:border-black"></td>
                {weekSummaries.map((s) => (
                  <td key={s.weekNumber} className="p-0.5 text-center border border-white/20 print:border-black font-mono text-[9px] text-sky-400 print:text-black">
                    {s.actualWeight > 0 ? s.actualWeight.toFixed(2) : ''}
                  </td>
                ))}
              </tr>

              {/* Kumulatif Realisasi */}
              <tr className="font-extrabold bg-[#0A0A0A] print:bg-gray-200 text-white print:text-black">
                <td colSpan={6} className="p-1.5 text-right border border-white/20 print:border-black uppercase font-syne">
                  D. KOMULATIF REALISASI %
                </td>
                <td className="border border-white/20 print:border-black"></td>
                {weekSummaries.map((s) => (
                  <td key={s.weekNumber} className="p-0.5 text-center border border-white/20 print:border-black font-mono text-[9px] text-[#C8FF00] print:text-black">
                    {s.cumulativeActualWeight > 0 ? s.cumulativeActualWeight.toFixed(2) : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Signature Area */}
        <div className="mt-8 pt-6 border-t border-white/20 print:border-black flex justify-end text-xs">
          <div className="text-center w-64 space-y-12">
            <div>
              <div className="font-mono text-white/70 print:text-black">{project.cityDate}</div>
              <div className="font-bold mt-1 uppercase text-white/90 print:text-black">Penawar / Contractor,</div>
              <div className="font-black uppercase mt-0.5 text-[#C8FF00] print:text-black font-syne">{project.bidderName}</div>
            </div>

            <div>
              <div className="font-black underline uppercase text-white print:text-black font-syne">{project.directorName}</div>
              <div className="text-white/60 print:text-black font-bold uppercase tracking-wider text-[10px] mt-0.5">{project.directorTitle}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
