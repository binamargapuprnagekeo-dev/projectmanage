import React, { useState } from 'react';
import { ShieldCheck, HardHat, UserCheck, Lock, Key, X, Check } from 'lucide-react';
import { UserRole } from '../types/schedule';

interface RoleSelectorProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ currentRole, onRoleChange }) => {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const handleSelectRole = (role: UserRole) => {
    if (role === 'admin' && currentRole !== 'admin') {
      setShowPinModal(true);
      setPinInput('');
      setPinError('');
    } else {
      onRoleChange(role);
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === 'ppk2026') {
      onRoleChange('admin');
      setShowPinModal(false);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('PIN salah! Masukkan PIN PPK yang benar (ppk2026).');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          label: 'ADMIN (PPK)',
          color: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />,
        };
      case 'konsultan':
        return {
          label: 'KONSULTAN (MK)',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <UserCheck className="w-3.5 h-3.5 text-amber-300" />,
        };
      case 'kontraktor':
      default:
        return {
          label: 'KONTRAKTOR',
          color: 'bg-[#C8FF00]/20 text-[#C8FF00] border-[#C8FF00]/40',
          icon: <HardHat className="w-3.5 h-3.5 text-[#C8FF00]" />,
        };
    }
  };

  const currentBadge = getRoleBadge(currentRole);

  return (
    <>
      <div className="flex items-center gap-1.5 bg-[#0A0A0A] border border-white/10 p-1 font-mono text-xs">
        <span className="text-white/40 uppercase tracking-wider text-[10px] px-2 font-bold hidden md:inline">
          Akses Sisi:
        </span>

        {/* Role Toggle Buttons */}
        <button
          onClick={() => handleSelectRole('kontraktor')}
          className={`px-2.5 py-1 flex items-center gap-1.5 transition-all text-[11px] font-bold uppercase tracking-wider ${
            currentRole === 'kontraktor'
              ? 'bg-[#C8FF00] text-black font-black'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          title="Sisi Kontraktor Pelaksana: Input Progress, Jalur Kritis, Fast Tracking"
        >
          <HardHat className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Kontraktor</span>
        </button>

        <button
          onClick={() => handleSelectRole('konsultan')}
          className={`px-2.5 py-1 flex items-center gap-1.5 transition-all text-[11px] font-bold uppercase tracking-wider ${
            currentRole === 'konsultan'
              ? 'bg-amber-400 text-black font-black'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          title="Sisi Konsultan Pengawas / MK: Verifikasi Progress, Catatan Lapangan, Audit Risiko"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Konsultan</span>
        </button>

        <button
          onClick={() => handleSelectRole('admin')}
          className={`px-2.5 py-1 flex items-center gap-1.5 transition-all text-[11px] font-bold uppercase tracking-wider ${
            currentRole === 'admin'
              ? 'bg-rose-500 text-white font-black'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          title="Sisi Admin PPK: Otoritas Penuh, Edit RAB, Kunci Evaluasi, PIN ppk2026"
        >
          {currentRole === 'admin' ? <ShieldCheck className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-rose-400" />}
          <span>Admin (PPK)</span>
        </button>
      </div>

      {/* PIN Verification Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-rose-500/40 shadow-2xl max-w-sm w-full p-6 text-white animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="bg-rose-500/20 p-2 border border-rose-500/40 text-rose-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wide font-syne text-rose-400">Otorisasi Akses Admin PPK</h3>
                  <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">
                    Sisi Pengawas Utama / Pengguna Jasa
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPinModal(false)}
                className="text-white/40 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVerifyPin} className="mt-4 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/70 block mb-1">
                  Masukkan PIN Keamanan PPK:
                </label>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError('');
                  }}
                  placeholder="PIN contoh: ppk2026"
                  autoFocus
                  className="w-full bg-[#0A0A0A] border border-white/20 text-white p-2.5 text-center text-lg font-mono font-black tracking-widest focus:outline-none focus:border-rose-500"
                />
                {pinError && (
                  <p className="text-rose-400 text-[11px] font-bold uppercase tracking-wider mt-1.5">
                    {pinError}
                  </p>
                )}
              </div>

              <div className="bg-[#0A0A0A] p-2.5 border border-white/10 text-[10px] text-white/60 font-mono">
                <span className="text-rose-400 font-bold">INFO PIN:</span> Masukkan <code className="bg-white/10 px-1 text-[#C8FF00] font-bold">ppk2026</code> untuk membuka akses penuh Sisi Admin PPK.
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="px-4 py-2 border border-white/20 text-white/80 hover:text-white text-xs font-bold uppercase tracking-wider"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-400 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all"
                >
                  <Check className="w-4 h-4" /> Buka Akses Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
