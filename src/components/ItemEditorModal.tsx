import React, { useState, useEffect } from 'react';
import { ScheduleItem, Category, ProjectInfo } from '../types/schedule';
import { autoDistributeWeeklyPlan, formatCurrency } from '../utils/calculator';
import { X, Check, Wand2, PlusCircle, Trash2 } from 'lucide-react';

interface ItemEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ScheduleItem | null;
  categories: Category[];
  targetCategoryId?: string;
  project: ProjectInfo;
  onSaveItem: (
    savedItem: ScheduleItem,
    newCategoryInfo?: { code: string; name: string }
  ) => void;
}

export const ItemEditorModal: React.FC<ItemEditorModalProps> = ({
  isOpen,
  onClose,
  item,
  categories,
  targetCategoryId,
  project,
  onSaveItem,
}) => {
  const [categoryId, setCategoryId] = useState<string>('');
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState<boolean>(false);
  const [newCategoryCode, setNewCategoryCode] = useState<string>('I');
  const [newCategoryName, setNewCategoryName] = useState<string>('PEKERJAAN PERSIAPAN');
  const [itemNo, setItemNo] = useState<string>('1');
  const [description, setDescription] = useState<string>('');
  const [unit, setUnit] = useState<string>('m²');
  const [volume, setVolume] = useState<string>('1');
  const [unitPrice, setUnitPrice] = useState<string>('100000');
  const [startWeek, setStartWeek] = useState<number>(1);
  const [endWeek, setEndWeek] = useState<number>(4);
  const [distributionMode, setDistributionMode] = useState<'equal' | 'bell'>('equal');
  const [weeklyPlan, setWeeklyPlan] = useState<Record<number, number>>({});

  useEffect(() => {
    if (item) {
      setIsCreatingNewCategory(false);
      setCategoryId(item.categoryId);
      setItemNo(item.itemNo);
      setDescription(item.description);
      setUnit(item.unit);
      setVolume(item.volume.toString());
      setUnitPrice(item.unitPrice.toString());
      setWeeklyPlan(item.weeklyPlan || {});

      const activeWeeks = Object.keys(item.weeklyPlan || {})
        .map(Number)
        .filter((w) => item.weeklyPlan[w] > 0);
      if (activeWeeks.length > 0) {
        setStartWeek(Math.min(...activeWeeks));
        setEndWeek(Math.max(...activeWeeks));
      }
    } else {
      if (categories.length === 0) {
        setIsCreatingNewCategory(true);
        setNewCategoryCode('I');
        setNewCategoryName('PEKERJAAN UMUM & PERSIAPAN');
        setCategoryId('');
      } else {
        setIsCreatingNewCategory(false);
        const defaultCat = targetCategoryId || categories[0]?.id || '';
        setCategoryId(defaultCat);
      }
      setItemNo((categories.flatMap((c) => c.items).length + 1).toString());
      setDescription('');
      setUnit('m²');
      setVolume('1');
      setUnitPrice('100000');
      setStartWeek(1);
      setEndWeek(Math.min(4, project.totalWeeks || 4));
      setWeeklyPlan({});
    }
  }, [item, targetCategoryId, categories, isOpen, project.totalWeeks]);

  if (!isOpen) return null;

  const numericVolume = parseFloat(volume) || 0;
  const numericUnitPrice = parseFloat(unitPrice) || 0;
  const totalPrice = numericVolume * numericUnitPrice;

  // Approximate weight
  const grandTotalCost = categories.reduce((sum, c) => {
    return sum + c.items.reduce((itemSum, i) => itemSum + i.totalPrice, 0);
  }, 0) || totalPrice || 1;

  const approxWeight = totalPrice > 0 ? (totalPrice / (grandTotalCost || totalPrice)) * 100 : 0;

  const handleApplyAutoDistribution = () => {
    const distributedPlan = autoDistributeWeeklyPlan(
      approxWeight,
      startWeek,
      endWeek,
      distributionMode
    );
    setWeeklyPlan(distributedPlan);
  };

  const handleSave = () => {
    if (!description.trim()) {
      alert('Uraian pekerjaan wajib diisi.');
      return;
    }

    if (isCreatingNewCategory && !newCategoryName.trim()) {
      alert('Nama Kategori Pekerjaan Baru wajib diisi.');
      return;
    }

    // Auto calculate weekly plan if user didn't manually click apply
    let finalWeeklyPlan = weeklyPlan;
    if (Object.keys(finalWeeklyPlan).length === 0 && approxWeight > 0) {
      finalWeeklyPlan = autoDistributeWeeklyPlan(
        approxWeight,
        startWeek,
        endWeek,
        distributionMode
      );
    }

    let targetCatId = categoryId;
    let newCatInfo: { code: string; name: string } | undefined = undefined;

    if (isCreatingNewCategory || categories.length === 0 || !categoryId) {
      targetCatId = `cat-${Date.now()}`;
      newCatInfo = {
        code: newCategoryCode || 'I',
        name: newCategoryName || 'PEKERJAAN PERSIAPAN',
      };
    }

    const newItem: ScheduleItem = {
      id: item ? item.id : `item-${Date.now()}`,
      categoryId: targetCatId,
      itemNo: itemNo || '1',
      description,
      unit,
      volume: numericVolume,
      unitPrice: numericUnitPrice,
      totalPrice,
      weightPercent: Number(approxWeight.toFixed(4)),
      startWeek,
      endWeek,
      weeklyPlan: finalWeeklyPlan,
      weeklyActual: item ? item.weeklyActual : {},
    };

    onSaveItem(newItem, newCatInfo);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#121212] border border-white/20 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-white font-sans">
        {/* Header */}
        <div className="p-4 bg-[#0A0A0A] text-white flex items-center justify-between border-b border-white/10">
          <h3 className="font-black text-base flex items-center gap-2 uppercase tracking-wide font-syne">
            <PlusCircle className="w-5 h-5 text-[#C8FF00]" />
            {item ? 'Edit Item Pekerjaan' : 'Tambah Item Pekerjaan Baru'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-white/50 hover:text-white rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Category & No */}
          <div className="space-y-2 p-3 bg-[#1A1A1A] border border-white/10">
            <div className="flex items-center justify-between">
              <label className="font-bold uppercase tracking-wider text-[#C8FF00] text-[10px]">
                Kategori Utama Pekerjaan (Sub-Kelompok RAB)
              </label>
              {categories.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCreatingNewCategory(!isCreatingNewCategory)}
                  className="text-[10px] bg-white/10 hover:bg-[#C8FF00] hover:text-black text-white px-2 py-0.5 font-bold uppercase transition-all"
                >
                  {isCreatingNewCategory ? '← Pilih Kategori Ada' : '+ Buat Kategori Baru'}
                </button>
              )}
            </div>

            {isCreatingNewCategory || categories.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
                <div className="space-y-1">
                  <label className="text-[9px] text-white/50 font-bold uppercase">Kode Kategori</label>
                  <input
                    type="text"
                    value={newCategoryCode}
                    onChange={(e) => setNewCategoryCode(e.target.value)}
                    placeholder="e.g. I / II"
                    className="w-full bg-[#0A0A0A] border border-white/20 text-white p-2 font-bold uppercase focus:outline-none focus:border-[#C8FF00]"
                  />
                </div>
                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[9px] text-white/50 font-bold uppercase">Nama Kategori Utama Baru</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Contoh: PEKERJAAN PERSIAPAN / PEKERJAAN TANAH"
                    className="w-full bg-[#0A0A0A] border border-white/20 text-white p-2 font-bold uppercase focus:outline-none focus:border-[#C8FF00]"
                  />
                </div>
              </div>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-white/20 text-white p-2.5 font-bold focus:outline-none focus:border-[#C8FF00]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-black text-white">
                    {c.code}. {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Item No & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-white/70 text-[10px]">No. Item Pekerjaan</label>
              <input
                type="text"
                value={itemNo}
                onChange={(e) => setItemNo(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-white/20 text-white p-2.5 font-bold focus:outline-none focus:border-[#C8FF00]"
                placeholder="e.g. 1 / 2.a"
              />
            </div>
            <div className="sm:col-span-3 space-y-1">
              <label className="font-bold uppercase tracking-wider text-white/70 text-[10px]">Uraian Pekerjaan / Rincian Kegiatan</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Pemasangan 1 m2 dinding bata merah tebal 1/2 batu mortar 1SP : 5PP"
                className="w-full bg-[#0A0A0A] border border-white/20 text-white p-2.5 font-bold focus:outline-none focus:border-[#C8FF00]"
              />
            </div>
          </div>

          {/* Unit, Volume, Unit Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-white/70 text-[10px]">Satuan (SAT)</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="m², m³, Kg, Ls, bh"
                className="w-full bg-[#0A0A0A] border border-white/20 text-white p-2.5 font-bold focus:outline-none focus:border-[#C8FF00]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-white/70 text-[10px]">Volume</label>
              <input
                type="number"
                step="any"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-white/20 text-white p-2.5 font-mono font-bold focus:outline-none focus:border-[#C8FF00]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-white/70 text-[10px]">Harga Satuan (Rp)</label>
              <input
                type="number"
                step="any"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-white/20 text-white p-2.5 font-mono font-bold focus:outline-none focus:border-[#C8FF00]"
              />
            </div>
          </div>

          {/* Computed Summary Box */}
          <div className="p-3 bg-[#1A1A1A] border border-white/10 flex items-center justify-between text-white font-bold">
            <div>
              <span className="text-white/50 block text-[10px] uppercase tracking-wider">Total Harga Item:</span>
              <span className="font-black text-sm text-[#C8FF00] font-mono">{formatCurrency(totalPrice)}</span>
            </div>
            <div className="text-right">
              <span className="text-white/50 block text-[10px] uppercase tracking-wider">Estimasi Bobot Proyek:</span>
              <span className="font-black text-sm text-[#C8FF00] font-mono">{approxWeight.toFixed(2)}%</span>
            </div>
          </div>

          {/* Auto Distribution Tool */}
          <div className="p-4 bg-[#1A1A1A] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-black text-[#C8FF00] text-xs uppercase tracking-wider">
                <Wand2 className="w-4 h-4" />
                <span>Distribusi & Rentang Jadwal Pekerjaan</span>
              </div>
              <span className="text-[10px] bg-white/10 text-white/80 px-2 py-0.5 font-mono">
                Hari {((startWeek - 1) * 7) + 1} - {endWeek * 7} Kalender ({((endWeek - startWeek + 1) * 7)} Hari = {endWeek - startWeek + 1} Minggu)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-white/60 font-bold block mb-1 text-[10px] uppercase tracking-wider">Mulai Minggu Ke-</label>
                <select
                  value={startWeek}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setStartWeek(val);
                    if (val > endWeek) setEndWeek(val);
                  }}
                  className="w-full bg-[#0A0A0A] border border-white/20 text-white p-2 font-bold font-mono"
                >
                  {Array.from({ length: project.totalWeeks }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w} className="bg-black text-white">
                      Minggu-{w} (Hari {((w - 1) * 7) + 1}-{w * 7})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-white/60 font-bold block mb-1 text-[10px] uppercase tracking-wider">Sampai Minggu Ke-</label>
                <select
                  value={endWeek}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setEndWeek(val);
                    if (val < startWeek) setStartWeek(val);
                  }}
                  className="w-full bg-[#0A0A0A] border border-white/20 text-white p-2 font-bold font-mono"
                >
                  {Array.from({ length: project.totalWeeks }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w} className="bg-black text-white">
                      Minggu-{w} (Hari {((w - 1) * 7) + 1}-{w * 7})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-white/60 font-bold block mb-1 text-[10px] uppercase tracking-wider">Pola Distribusi</label>
                <select
                  value={distributionMode}
                  onChange={(e) => setDistributionMode(e.target.value as any)}
                  className="w-full bg-[#0A0A0A] border border-white/20 text-white p-2 font-bold"
                >
                  <option value="equal" className="bg-black text-white">Linear (Merata)</option>
                  <option value="bell" className="bg-black text-white">Kurva Bell (S-Shape)</option>
                </select>
              </div>
            </div>

            <div className="p-2 bg-[#0A0A0A] border border-white/10 flex flex-wrap items-center justify-between text-[11px] text-white/70">
              <span>Konversi Waktu Pelaksanaan:</span>
              <span className="font-mono font-bold text-[#C8FF00]">
                {endWeek - startWeek + 1} Minggu = {(endWeek - startWeek + 1) * 7} Hari Kalender ≈ {((endWeek - startWeek + 1) / 4).toFixed(1)} Bulan
              </span>
            </div>

            <button
              type="button"
              onClick={handleApplyAutoDistribution}
              className="w-full bg-white/10 hover:bg-[#C8FF00] hover:text-black text-[#C8FF00] font-black py-2.5 transition-all text-xs flex items-center justify-center gap-2 border border-[#C8FF00]/40 uppercase tracking-wider"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Terapkan Distribusi Bobot ({approxWeight.toFixed(2)}%)
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0A0A0A] border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-transparent border border-white/20 text-white/80 hover:text-white hover:border-white text-xs font-bold uppercase tracking-wider"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-[#C8FF00] hover:bg-[#b5e600] text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
          >
            <Check className="w-4 h-4" />
            Simpan Item
          </button>
        </div>
      </div>
    </div>
  );
};
