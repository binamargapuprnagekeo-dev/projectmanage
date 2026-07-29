import React, { useState } from 'react';
import { UserCheck, MessageSquare, CheckCircle2, ShieldCheck, X, Check } from 'lucide-react';
import { ProjectInfo, UserRole } from '../types/schedule';

interface ConsultantNoteModalProps {
  project: ProjectInfo;
  role: UserRole;
  onProjectUpdated: (updated: ProjectInfo) => void;
  onClose: () => void;
}

export const ConsultantNoteModal: React.FC<ConsultantNoteModalProps> = ({
  project,
  role,
  onProjectUpdated,
  onClose,
}) => {
  const [notesState, setNotesState] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    project.categories.forEach((c) =>
      c.items.forEach((i) => {
        map[i.id] = i.consultantNote || '';
      })
    );
    return map;
  });

  const [verifications, setVerifications] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    const currWeek = project.currentWeek;
    project.categories.forEach((c) =>
      c.items.forEach((i) => {
        const key = `${i.id}_w${currWeek}`;
        if (role === 'admin') {
          map[key] = i.verifiedByAdmin ? i.verifiedByAdmin[currWeek] || false : false;
        } else {
          map[key] = i.verifiedByConsultant ? i.verifiedByConsultant[currWeek] || false : false;
        }
      })
    );
    return map;
  });

  const currWeek = project.currentWeek;

  const handleNoteChange = (itemId: string, text: string) => {
    setNotesState((prev) => ({ ...prev, [itemId]: text }));
  };

  const handleToggleVerify = (itemId: string) => {
    const key = `${itemId}_w${currWeek}`;
    setVerifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    const updatedCategories = project.categories.map((cat) => ({
      ...cat,
      items: cat.items.map((item) => {
        const key = `${item.id}_w${currWeek}`;
        const isVerified = verifications[key] || false;

        const newVerifiedByConsultant = { ...item.verifiedByConsultant };
        const newVerifiedByAdmin = { ...item.verifiedByAdmin };

        if (role === 'admin') {
          newVerifiedByAdmin[currWeek] = isVerified;
        } else {
          newVerifiedByConsultant[currWeek] = isVerified;
        }

        return {
          ...item,
          consultantNote: notesState[item.id] || '',
          verifiedByConsultant: newVerifiedByConsultant,
          verifiedByAdmin: newVerifiedByAdmin,
        };
      }),
    }));

    onProjectUpdated({
      ...project,
      categories: updatedCategories,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-[#121212] border border-white/20 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 bg-[#0A0A0A] text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-amber-400 p-2 text-black font-black">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base uppercase tracking-wide font-syne text-amber-400">
                Verifikasi &amp; Catatan Pengawasan Lapangan
              </h3>
              <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">
                Sisi {role === 'admin' ? 'Admin PPK' : 'Konsultan Pengawas (MK)'} - Evaluasi Minggu ke-{currWeek}
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

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {project.categories.map((cat) => (
            <div key={cat.id} className="border border-white/10 bg-[#0A0A0A] overflow-hidden">
              <div className="bg-[#121212] px-3.5 py-2 font-black text-xs text-white uppercase tracking-wider border-b border-white/10">
                {cat.code}. {cat.name}
              </div>

              <div className="divide-y divide-white/10">
                {cat.items.map((item) => {
                  const key = `${item.id}_w${currWeek}`;
                  const isVerified = verifications[key] || false;
                  const planVal = item.weeklyPlan ? item.weeklyPlan[currWeek] || 0 : 0;
                  const actualVal = item.weeklyActual ? item.weeklyActual[currWeek] || 0 : 0;

                  return (
                    <div key={item.id} className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white text-xs">
                            <span className="text-amber-400 font-mono">#{item.itemNo}</span> {item.description}
                          </div>
                          <div className="text-[10px] text-white/50 font-mono flex items-center gap-3 mt-0.5">
                            <span>Satuan: {item.unit}</span>
                            <span>
                              Plan M-{currWeek}: <strong className="text-[#C8FF00]">{planVal}%</strong>
                            </span>
                            <span>
                              Realisasi M-{currWeek}: <strong className="text-sky-400">{actualVal}%</strong>
                            </span>
                          </div>
                        </div>

                        {/* Verification Toggle */}
                        <button
                          onClick={() => handleToggleVerify(item.id)}
                          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border ${
                            isVerified
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : 'bg-white/5 text-white/50 border-white/10 hover:text-white'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isVerified ? 'VERIFIKASI ACC' : 'BELUM ACC'}
                        </button>
                      </div>

                      {/* Catatan Field */}
                      <div>
                        <input
                          type="text"
                          value={notesState[item.id] || ''}
                          onChange={(e) => handleNoteChange(item.id, e.target.value)}
                          placeholder="Catatan Pengawasan Lapangan (misal: Uji kubus beton K-250 lulus, besi terpasang sesuai spesifikasi)..."
                          className="w-full bg-[#121212] border border-white/20 text-white p-2 font-sans text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0A0A0A] border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-white/20 text-white/80 hover:text-white text-xs font-bold uppercase tracking-wider"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
          >
            <Check className="w-4 h-4" />
            Simpan Verifikasi &amp; Catatan Lapangan
          </button>
        </div>
      </div>
    </div>
  );
};
