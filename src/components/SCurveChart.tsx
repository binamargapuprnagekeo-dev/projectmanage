import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { WeekSummary } from '../types/schedule';
import { TrendingUp, TrendingDown, Info, BarChart2 } from 'lucide-react';

interface SCurveChartProps {
  weekSummaries: WeekSummary[];
  currentWeek: number;
}

export const SCurveChart: React.FC<SCurveChartProps> = ({
  weekSummaries,
  currentWeek,
}) => {
  const [showDeviationBar, setShowDeviationBar] = useState(true);
  const [showWeeklyBobotBar, setShowWeeklyBobotBar] = useState(false);

  const chartData = weekSummaries.map((s) => ({
    weekLabel: `M${s.weekNumber}`,
    weekNumber: s.weekNumber,
    monthNumber: s.monthNumber,
    rencanaKumulatif: s.cumulativePlannedWeight,
    realisasiKumulatif: s.actualWeight > 0 || s.cumulativeActualWeight > 0 ? s.cumulativeActualWeight : null,
    rencanaMingguan: s.plannedWeight,
    realisasiMingguan: s.actualWeight,
    deviasi: s.deviationCumulative,
  }));

  const activeSummary = weekSummaries.find((s) => s.weekNumber === currentWeek) || weekSummaries[0];

  return (
    <div className="bg-[#121212] border border-white/10 p-5 text-white shadow-xl">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tighter font-syne text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#C8FF00]" />
            Grafik Kurva S (Pelaksanaan Pekerjaan)
          </h3>
          <p className="text-xs font-medium uppercase tracking-wider text-white/50 mt-0.5">
            Perbandingan Rencana Progress Kumulatif vs Realisasi Lapangan
          </p>
        </div>

        {/* Toggle options */}
        <div className="flex items-center gap-2 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer bg-[#0A0A0A] px-3 py-1.5 border border-white/10 hover:border-white/30 text-white/80 font-bold uppercase tracking-wider text-[10px]">
            <input
              type="checkbox"
              checked={showDeviationBar}
              onChange={(e) => setShowDeviationBar(e.target.checked)}
              className="accent-[#C8FF00]"
            />
            Bar Deviasi
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer bg-[#0A0A0A] px-3 py-1.5 border border-white/10 hover:border-white/30 text-white/80 font-bold uppercase tracking-wider text-[10px]">
            <input
              type="checkbox"
              checked={showWeeklyBobotBar}
              onChange={(e) => setShowWeeklyBobotBar(e.target.checked)}
              className="accent-[#C8FF00]"
            />
            Bobot Mingguan
          </label>
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
            <XAxis
              dataKey="weekLabel"
              tick={{ fontSize: 11, fill: '#A3A3A3', fontWeight: 'bold' }}
              interval={0}
            />
            <YAxis
              yAxisId="left"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#A3A3A3', fontWeight: 'bold' }}
              unit="%"
            />
            {showDeviationBar && (
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[-30, 30]}
                tick={{ fontSize: 10, fill: '#737373', fontWeight: 'bold' }}
                unit="%"
              />
            )}

            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              iconType="circle"
            />

            <ReferenceLine yAxisId="left" y={100} stroke="#404040" strokeDasharray="3 3" />
            <ReferenceLine yAxisId="left" x={`M${currentWeek}`} stroke="#C8FF00" strokeDasharray="2 2" label={{ value: `M-${currentWeek}`, fill: '#C8FF00', fontSize: 11, fontWeight: 'bold', position: 'top' }} />

            {/* Optional Weekly Bobot Bars */}
            {showWeeklyBobotBar && (
              <Bar
                yAxisId="left"
                dataKey="rencanaMingguan"
                name="Bobot Rencana Mingguan (%)"
                fill="#38bdf8"
                opacity={0.3}
              />
            )}

            {/* Deviation Bars */}
            {showDeviationBar && (
              <Bar
                yAxisId="right"
                dataKey="deviasi"
                name="Deviasi (%)"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.deviasi >= 0 ? '#C8FF00' : '#f43f5e'}
                  />
                ))}
              </Bar>
            )}

            {/* Rencana Kumulatif Line (S-Curve) */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="rencanaKumulatif"
              name="Rencana Kumulatif (%)"
              stroke="#38bdf8"
              strokeWidth={3}
              dot={{ r: 3, fill: '#38bdf8' }}
              activeDot={{ r: 6 }}
            />

            {/* Realisasi Kumulatif Line (Actual S-Curve) */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="realisasiKumulatif"
              name="Realisasi Kumulatif (%)"
              stroke="#C8FF00"
              strokeWidth={3.5}
              dot={{ r: 4, fill: '#C8FF00' }}
              activeDot={{ r: 7 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Summary Bar underneath */}
      <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-white/70 gap-2 bg-[#0A0A0A] p-3 border border-white/10">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#C8FF00] flex-shrink-0" />
          <span className="font-medium">
            Kurva ideal: Melandai di awal (persiapan), curam di pertengahan (konstruksi), dan melandai di akhir (finishing).
          </span>
        </div>
        <div className="flex items-center gap-4 font-black uppercase tracking-wider text-xs">
          <span className="text-sky-400">Rencana: {activeSummary.cumulativePlannedWeight.toFixed(2)}%</span>
          <span className="text-[#C8FF00]">Realisasi: {activeSummary.cumulativeActualWeight.toFixed(2)}%</span>
          <span className={activeSummary.deviationCumulative >= 0 ? 'text-[#C8FF00]' : 'text-rose-400'}>
            Deviasi: {activeSummary.deviationCumulative >= 0 ? '+' : ''}{activeSummary.deviationCumulative.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isAhead = data.deviasi >= 0;

    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-[190px]">
        <div className="font-bold border-b border-slate-700 pb-1 flex justify-between items-center text-slate-200">
          <span>Minggu ke-{data.weekNumber} (Bulan {data.monthNumber})</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] ${isAhead ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
            {isAhead ? 'Ahead' : 'Delay'}
          </span>
        </div>
        <div className="space-y-1 pt-0.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Rencana Kumulatif:</span>
            <span className="font-semibold text-blue-400">{data.rencanaKumulatif?.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Realisasi Kumulatif:</span>
            <span className="font-semibold text-emerald-400">
              {data.realisasiKumulatif !== null ? `${data.realisasiKumulatif?.toFixed(2)}%` : 'Belum diisi'}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-800 pt-1 mt-1 font-medium">
            <span className="text-slate-300">Deviasi Fisik:</span>
            <span className={`font-bold ${isAhead ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isAhead ? '+' : ''}{data.deviasi?.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
