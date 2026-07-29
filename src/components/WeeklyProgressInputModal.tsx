import React, { useState } from 'react';
import { ProjectInfo, ScheduleItem } from '../types/schedule';
import { X, Check, Calculator, CheckSquare } from 'lucide-react';

interface WeeklyProgressInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectInfo;
  onSaveProgress: (
    weekNum: number,
    progressUpdates: Record<string, number>
  ) => void;
}

export const WeeklyProgressInputModal: React.FC<WeeklyProgressInputModalProps> = ({
  isOpen,
  onClose,
  project,
  onSaveProgress,
}) => {
  const [selectedWeek, setSelectedWeek] = useState<number>(project.currentWeek);
  const [actualValues, setActualValues] = useState<Record<string, number>>({});

  if (!isOpen) return null;

  // Initialize values when opening
  const allItems = project.categories.flatMap((c) => c.items);

  const handleValueChange = (itemId: string, valueStr: string) => {
    const val = parseFloat(valueStr.replace(',', '.')) || 0;
    setActualValues((prev) => ({
      ...prev,
      [itemId]: val,
    }));
  };

  const handleApplyPlannedAsActual = () => {
    const autoVals: Record<string, number> = {};
    allItems.forEach((item) => {
      const planVal = item.weeklyPlan[selectedWeek] || 0;
      if (planVal > 0) {
        autoVals[item.id] = planVal;
      }
    });
    setActualValues(autoVals);
  };

  const handleSave = () => {
    onSaveProgress(selectedWeek, actualValues);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#121212] border border-white/20 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-white font-sans">
        {/* Modal Header */}
        <div className="p-4 bg-[#0A0A0A] text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-[#C8FF00]" />
            <div>
              <h3 className="font-black text-base uppercase tracking-wide font-syne">Input Progress Realisasi Lapangan</h3>
              <p className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">
                Catat capaian bobot fisik aktual minggu berjalan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/50 hover:text-white rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Week Selector Bar */}
        <div className="p-4 bg-[#1A1A1A] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <span className="uppercase tracking-wider text-[11px] text-white/70">Pilih Minggu Evaluasi:</span>
            <select
              value={selectedWeek}
              onChange={(e) => {
                const w = parseInt(e.target.value, 10);
                setSelectedWeek(w);
                // Prepopulate current week values
                const currentVals: Record<string, number> = {};
                allItems.forEach((i) => {
                  if (i.weeklyActual[w] !== undefined) {
                    currentVals[i.id] = i.weeklyActual[w];
                  }
                });
                setActualValues(currentVals);
              }}
              className="bg-[#0A0A0A] border border-white/20 text-white text-xs px-3 py-1.5 font-black uppercase tracking-wider focus:outline-none focus:border-[#C8FF00]"
            >
              {Array.from({ length: project.totalWeeks }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w} className="bg-black text-white">
                  Minggu ke-{w} (Bulan {Math.ceil(w / project.weeksPerMonth)})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleApplyPlannedAsActual}
            className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-[#C8FF00] hover:text-black text-[#C8FF00] border border-[#C8FF00]/40 px-3 py-1.5 font-bold uppercase tracking-wider transition-all"
          >
            <Calculator className="w-3.5 h-3.5" />
            Sama dengan Target Rencana (100% On-Track)
          </button>
        </div>

        {/* Item Inputs Table */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {project.categories.map((cat) => (
            <div key={cat.id} className="border border-white/10 bg-[#121212] overflow-hidden">
              <div className="bg-[#0A0A0A] px-3.5 py-2.5 font-black text-xs text-white uppercase tracking-wider flex justify-between border-b border-white/10">
                <span>{cat.code}. {cat.name}</span>
                <span className="text-[#C8FF00]">Bobot Total: {cat.items.reduce((s, i) => s + i.weightPercent, 0).toFixed(2)}%</span>
              </div>

              <div className="divide-y divide-white/10">
                {cat.items.map((item) => {
                  const plannedThisWeek = item.weeklyPlan[selectedWeek] || 0;
                  const currentVal = actualValues[item.id] !== undefined
                    ? actualValues[item.id]
                    : item.weeklyActual[selectedWeek] || 0;

                  return (
                    <div
                      key={item.id}
                      className="p-3 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-white truncate">
                          {item.itemNo}. {item.description}
                        </div>
                        <div className="text-[11px] text-white/50 flex items-center gap-3 mt-0.5 font-mono">
                          <span>SAT: <strong className="text-white">{item.unit}</strong></span>
                          <span>Bobot: <strong className="text-sky-400">{item.weightPercent.toFixed(2)}%</strong></span>
                          <span>Target Rencana: <strong className="text-[#C8FF00]">{plannedThisWeek.toFixed(2)}%</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={currentVal !== 0 ? currentVal : ''}
                          onChange={(e) => handleValueChange(item.id, e.target.value)}
                          placeholder="0.00"
                          className="w-24 text-right text-xs font-black font-mono bg-[#0A0A0A] text-[#C8FF00] border border-white/20 px-2.5 py-1.5 focus:outline-none focus:border-[#C8FF00]"
                        />
                        <span className="text-xs text-white/50 font-bold">%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#0A0A0A] border-t border-white/10 flex items-center justify-between">
          <div className="text-[11px] text-white/50 uppercase font-semibold tracking-wider">
            Memperbarui Kurva Realisasi &amp; status deviasi minggu ke-{selectedWeek}.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-white/20 text-white/80 hover:text-white hover:border-white text-xs font-bold uppercase tracking-wider"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-[#C8FF00] hover:bg-[#b5e600] text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              Simpan Progress Minggu-{selectedWeek}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
