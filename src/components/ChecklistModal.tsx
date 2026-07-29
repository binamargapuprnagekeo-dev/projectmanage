import React, { useState, useMemo } from 'react';
import { CheckSquare, Search, Filter, Flame, Printer, X, Check, Clock, AlertTriangle } from 'lucide-react';
import { ProjectInfo, UserRole, ScheduleItem } from '../types/schedule';
import { isItemCriticalPath } from '../utils/calculator';

interface ChecklistModalProps {
  project: ProjectInfo;
  role: UserRole;
  onProjectUpdated: (updated: ProjectInfo) => void;
  onClose: () => void;
}

export const ChecklistModal: React.FC<ChecklistModalProps> = ({
  project,
  role,
  onProjectUpdated,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'pending' | 'completed'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Track completion or verification state per item ID
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    const currWeek = project.currentWeek;
    project.categories.forEach((cat) => {
      cat.items.forEach((item) => {
        // Calculate cumulative actual progress for this item
        const totalActualPercent = Object.values(item.weeklyActual || {}).reduce((a, b) => a + b, 0);
        // Item is marked checked if verified by consultant or total actual >= item weight
        const isVerified = item.verifiedByConsultant ? item.verifiedByConsultant[currWeek] : false;
        map[item.id] = isVerified || totalActualPercent >= (item.weightPercent || 0.01);
      });
    });
    return map;
  });

  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    project.categories.forEach((cat) => {
      cat.items.forEach((item) => {
        map[item.id] = item.consultantNote || '';
      });
    });
    return map;
  });

  // Calculate overall statistics
  const stats = useMemo(() => {
    let total = 0;
    let completed = 0;
    let criticalCount = 0;
    let criticalCompleted = 0;

    project.categories.forEach((cat) => {
      cat.items.forEach((item) => {
        total++;
        const isDone = checkedItems[item.id];
        if (isDone) completed++;

        if (isItemCriticalPath(item)) {
          criticalCount++;
          if (isDone) criticalCompleted++;
        }
      });
    });

    const pending = total - completed;
    const completionPercentage = total > 0 ? (completed / total) * 100 : 0;

    return { total, completed, pending, criticalCount, criticalCompleted, completionPercentage };
  }, [project, checkedItems]);

  const handleToggleCheck = (itemId: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleSaveChecklist = () => {
    const currWeek = project.currentWeek;

    const updatedCategories = project.categories.map((cat) => ({
      ...cat,
      items: cat.items.map((item) => {
        const isDone = checkedItems[item.id];
        const newVerifiedByConsultant = { ...item.verifiedByConsultant, [currWeek]: isDone };

        return {
          ...item,
          consultantNote: notes[item.id] || '',
          verifiedByConsultant: newVerifiedByConsultant,
        };
      }),
    }));

    onProjectUpdated({
      ...project,
      categories: updatedCategories,
    });

    onClose();
  };

  const handlePrintChecklist = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-[#121212] border border-white/20 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 bg-[#0A0A0A] flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-[#C8FF00] p-2 text-black font-black">
              <CheckSquare className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-base uppercase tracking-wide font-syne text-[#C8FF00]">
                Ceklis Pemeriksaan Lapangan Pekerjaan (Technical Checklist)
              </h3>
              <p className="text-[10px] text-white/60 uppercase tracking-wider font-semibold font-mono">
                {project.title} &bull; Evaluasi Minggu ke-{project.currentWeek}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintChecklist}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
              title="Cetak Lembar Ceklis Lapangan"
            >
              <Printer className="w-4 h-4 text-[#C8FF00]" />
              <span>Cetak Ceklis</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-white/50 hover:text-white rounded hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="bg-[#1A1A1A] p-3 border-b border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-[#0A0A0A] p-2 border border-white/10">
            <span className="text-[10px] text-white/50 uppercase font-bold block">Total Pekerjaan</span>
            <span className="text-base font-black font-mono text-white">{stats.total} Item</span>
          </div>
          <div className="bg-[#0A0A0A] p-2 border border-emerald-500/30">
            <span className="text-[10px] text-emerald-400 uppercase font-bold block">Selesai / Terverifikasi</span>
            <span className="text-base font-black font-mono text-emerald-400">
              {stats.completed} ({stats.completionPercentage.toFixed(1)}%)
            </span>
          </div>
          <div className="bg-[#0A0A0A] p-2 border border-amber-500/30">
            <span className="text-[10px] text-amber-300 uppercase font-bold block">Belum / Dalam Proses</span>
            <span className="text-base font-black font-mono text-amber-300">{stats.pending} Item</span>
          </div>
          <div className="bg-[#0A0A0A] p-2 border border-rose-500/30">
            <span className="text-[10px] text-rose-400 uppercase font-bold block">Jalur Kritis</span>
            <span className="text-base font-black font-mono text-rose-400">
              {stats.criticalCompleted} / {stats.criticalCount} Selesai
            </span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-3 bg-[#0A0A0A] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari item pekerjaan atau nomor uraian..."
              className="w-full bg-[#121212] border border-white/20 text-white px-2.5 py-1.5 focus:outline-none focus:border-[#C8FF00]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#121212] border border-white/20 text-white px-2.5 py-1.5 font-bold"
            >
              <option value="all">Semua Kategori</option>
              {project.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}. {c.name}
                </option>
              ))}
            </select>

            {/* Filter Buttons */}
            <div className="flex items-center bg-[#121212] p-1 border border-white/10 font-bold uppercase text-[10px]">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 transition-all ${
                  filterType === 'all' ? 'bg-[#C8FF00] text-black font-black' : 'text-white/60 hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterType('critical')}
                className={`px-2.5 py-1 transition-all flex items-center gap-1 ${
                  filterType === 'critical' ? 'bg-rose-500 text-white font-black' : 'text-rose-400 hover:text-rose-300'
                }`}
              >
                <Flame className="w-3 h-3" /> Kritis
              </button>
              <button
                onClick={() => setFilterType('pending')}
                className={`px-2.5 py-1 transition-all ${
                  filterType === 'pending' ? 'bg-amber-400 text-black font-black' : 'text-amber-300 hover:text-white'
                }`}
              >
                Belum Done
              </button>
              <button
                onClick={() => setFilterType('completed')}
                className={`px-2.5 py-1 transition-all ${
                  filterType === 'completed' ? 'bg-emerald-500 text-black font-black' : 'text-emerald-400 hover:text-white'
                }`}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>

        {/* Checklist Items Container */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {project.categories
            .filter((cat) => selectedCategory === 'all' || cat.id === selectedCategory)
            .map((cat) => {
              const filteredItems = cat.items.filter((item) => {
                // Search term filter
                const matchesSearch =
                  item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.itemNo.toLowerCase().includes(searchTerm.toLowerCase());

                if (!matchesSearch) return false;

                const isDone = checkedItems[item.id];
                const isCritical = isItemCriticalPath(item);

                if (filterType === 'critical' && !isCritical) return false;
                if (filterType === 'pending' && isDone) return false;
                if (filterType === 'completed' && !isDone) return false;

                return true;
              });

              if (filteredItems.length === 0) return null;

              return (
                <div key={cat.id} className="border border-white/10 bg-[#0A0A0A] overflow-hidden">
                  <div className="bg-[#181818] px-3.5 py-2 font-black text-xs text-[#C8FF00] uppercase tracking-wider border-b border-white/10 font-syne flex items-center justify-between">
                    <span>
                      {cat.code}. {cat.name}
                    </span>
                    <span className="text-[10px] text-white/50 font-mono">
                      {filteredItems.length} Item
                    </span>
                  </div>

                  <div className="divide-y divide-white/10">
                    {filteredItems.map((item) => {
                      const isDone = checkedItems[item.id];
                      const isCritical = isItemCriticalPath(item);
                      const currWeek = project.currentWeek;
                      const planVal = item.weeklyPlan ? item.weeklyPlan[currWeek] || 0 : 0;
                      const actualVal = item.weeklyActual ? item.weeklyActual[currWeek] || 0 : 0;

                      return (
                        <div
                          key={item.id}
                          className={`p-3 space-y-2 transition-colors ${
                            isDone ? 'bg-emerald-950/10' : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            {/* Checkbox & Item Description */}
                            <label className="flex items-start gap-3 cursor-pointer flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={() => handleToggleCheck(item.id)}
                                className="w-4 h-4 mt-0.5 accent-[#C8FF00] bg-black border-white/30 cursor-pointer"
                              />
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs font-black text-[#C8FF00]">
                                    #{item.itemNo}
                                  </span>
                                  <span
                                    className={`font-semibold text-xs ${
                                      isDone ? 'line-through text-white/50' : 'text-white'
                                    }`}
                                  >
                                    {item.description}
                                  </span>
                                  {isCritical && (
                                    <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                      <Flame className="w-3 h-3" /> KRITIS
                                    </span>
                                  )}
                                </div>

                                <div className="text-[10px] text-white/60 font-mono flex items-center gap-3">
                                  <span>Volume: {item.volume} {item.unit}</span>
                                  <span>Bobot: <strong>{item.weightPercent.toFixed(2)}%</strong></span>
                                  <span>Plan M-{currWeek}: <strong className="text-sky-300">{planVal}%</strong></span>
                                  <span>Realisasi M-{currWeek}: <strong className="text-[#C8FF00]">{actualVal}%</strong></span>
                                </div>
                              </div>
                            </label>

                            {/* Status Tag */}
                            <span
                              className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 flex-shrink-0 ${
                                isDone
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {isDone ? (
                                <>
                                  <Check className="w-3.5 h-3.5" /> SELESAI / OK
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3.5 h-3.5" /> DALAM PROSES
                                </>
                              )}
                            </span>
                          </div>

                          {/* Notes input */}
                          <div className="pl-7">
                            <input
                              type="text"
                              value={notes[item.id] || ''}
                              onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
                              placeholder="Catatan hasil inspeksi fisik teknis / konsultan..."
                              className="w-full bg-[#121212] border border-white/20 text-white p-1.5 text-[11px] focus:outline-none focus:border-[#C8FF00]"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0A0A0A] border-t border-white/10 flex items-center justify-between gap-3">
          <span className="text-xs text-white/50 font-mono hidden sm:inline">
            Status pemeriksaan akan memperbarui status verifikasi minggu ke-{project.currentWeek}.
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-white/20 text-white/80 hover:text-white text-xs font-bold uppercase tracking-wider"
            >
              Batal
            </button>
            <button
              onClick={handleSaveChecklist}
              className="px-5 py-2 bg-[#C8FF00] hover:bg-[#b5e600] text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              Simpan Hasil Ceklis Lapangan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
