import React from 'react';
import {
  Calendar,
  Plus,
  Bot,
  FileSpreadsheet,
  Printer,
  Download,
  Upload,
  CheckSquare,
  DollarSign,
  Layers,
  UserCheck,
} from 'lucide-react';
import { ProjectInfo, UserRole } from '../types/schedule';
import { RoleSelector } from './RoleSelector';

interface HeaderProps {
  project: ProjectInfo;
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  onSelectPreset: (presetKey: string) => void;
  onOpenAddItem: () => void;
  onOpenInputProgress: () => void;
  onOpenAiAssistant: () => void;
  onOpenProjectEdit: () => void;
  onOpenGoogleSheetsModal: () => void;
  onOpenConsultantModal: () => void;
  onOpenChecklistModal: () => void;
  onExportExcel: () => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePrintMode: () => void;
  activeTab: 'schedule' | 'termin' | 'chart';
  setActiveTab: (tab: 'schedule' | 'termin' | 'chart') => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  role,
  onRoleChange,
  onSelectPreset,
  onOpenAddItem,
  onOpenInputProgress,
  onOpenAiAssistant,
  onOpenProjectEdit,
  onOpenGoogleSheetsModal,
  onOpenConsultantModal,
  onOpenChecklistModal,
  onExportExcel,
  onExportJson,
  onImportJson,
  onTogglePrintMode,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="bg-[#0A0A0A] text-white border-b border-white/10 sticky top-0 z-30 font-sans">
      <div className="max-w-[1600px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#C8FF00] flex items-center justify-center text-black font-black text-lg">
            <Calendar className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tighter uppercase font-syne text-white">
                KURVA-S<span className="text-[#C8FF00]">.</span>PRO
              </h1>
              <span className="text-[9px] bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/30 px-1.5 py-0.2 font-bold uppercase tracking-widest font-mono">
                v2.5
              </span>
            </div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
              Penjadwalan &amp; Jalur Kritis Proyek
            </p>
          </div>

          <div className="h-5 w-px bg-white/10 mx-1 hidden md:block" />

          {/* Preset Selector */}
          <div className="hidden lg:flex items-center gap-2">
            <select
              value={project.id}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="bg-[#121212] border border-white/20 text-white text-xs font-semibold px-2 py-1 focus:outline-none focus:border-[#C8FF00]"
            >
              <option value="picu-2026">1. Gedung PICU (Rp 882,3 Jt)</option>
              <option value="cleanroom-2026">2. Arsitektur Cleanroom (Rp 844,1 Jt)</option>
              <option value="new">3. + Buat Proyek Baru</option>
            </select>
          </div>
        </div>

        {/* Role Access Switcher */}
        <RoleSelector currentRole={role} onRoleChange={onRoleChange} />

        {/* Center View Tabs */}
        <div className="flex items-center bg-[#121212] p-1 border border-white/10 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-1.5 px-3 py-1 transition-all ${
              activeTab === 'schedule'
                ? 'bg-[#C8FF00] text-black font-black'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Matriks Kurva S
          </button>
          <button
            onClick={() => setActiveTab('chart')}
            className={`flex items-center gap-1.5 px-3 py-1 transition-all ${
              activeTab === 'chart'
                ? 'bg-[#C8FF00] text-black font-black'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Grafik S-Curve
          </button>
          <button
            onClick={() => setActiveTab('termin')}
            className={`flex items-center gap-1.5 px-3 py-1 transition-all ${
              activeTab === 'termin'
                ? 'bg-[#C8FF00] text-black font-black'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Proyeksi Termin
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Google Sheets Sync */}
          <button
            onClick={onOpenGoogleSheetsModal}
            className="flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs px-3 py-1.5 font-bold uppercase tracking-wider transition-all"
            title="Simpan & Sync Google Sheets"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google Sheets</span>
          </button>

          {/* Checklist Inspeksi Pekerjaan Tim Teknis / Konsultan */}
          <button
            onClick={onOpenChecklistModal}
            className="flex items-center gap-1.5 bg-[#C8FF00]/10 hover:bg-[#C8FF00]/20 text-[#C8FF00] border border-[#C8FF00]/40 text-xs px-3 py-1.5 font-bold uppercase tracking-wider transition-all"
            title="Ceklis Pemeriksaan Item Pekerjaan Lapangan"
          >
            <CheckSquare className="w-3.5 h-3.5 text-[#C8FF00]" />
            <span>Ceklis Inspeksi</span>
          </button>

          {/* Consultant Notes / Verification (Visible in Konsultan or Admin mode) */}
          {(role === 'konsultan' || role === 'admin') && (
            <button
              onClick={onOpenConsultantModal}
              className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs px-3 py-1.5 font-bold uppercase tracking-wider transition-all"
              title="Verifikasi Progress & Catatan Lapangan"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Catatan Lapangan</span>
            </button>
          )}

          {/* AI Assistant */}
          <button
            onClick={onOpenAiAssistant}
            className="flex items-center gap-1.5 bg-[#C8FF00] text-black text-xs px-3 py-1.5 font-black uppercase tracking-wider hover:bg-[#b5e600] transition-all"
            title="AI Analisis Risiko & Fast-Tracking"
          >
            <Bot className="w-3.5 h-3.5 stroke-[2.5]" />
            AI Asisten
          </button>

          {/* Progress Input */}
          <button
            onClick={onOpenInputProgress}
            className="flex items-center gap-1.5 bg-white text-black hover:bg-neutral-200 text-xs px-3 py-1.5 font-black uppercase tracking-wider transition-all"
          >
            <CheckSquare className="w-3.5 h-3.5 stroke-[2.5]" />
            Input Progress
          </button>

          {/* Add Pekerjaan (Admin / Kontraktor) */}
          {(role === 'admin' || role === 'kontraktor') && (
            <button
              onClick={onOpenAddItem}
              className="flex items-center gap-1.5 bg-[#121212] hover:bg-white/10 text-white border border-white/20 text-xs px-2.5 py-1.5 font-bold uppercase tracking-wider transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-[#C8FF00]" />
              Tambah
            </button>
          )}

          {/* Print & Export Actions */}
          <div className="flex items-center gap-1 border-l border-white/10 pl-2">
            <button
              onClick={onTogglePrintMode}
              className="p-1.5 text-white/70 hover:text-[#C8FF00] hover:bg-white/5 transition-colors"
              title="Cetak Laporan / Simpan PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onExportJson}
              className="p-1.5 text-white/70 hover:text-[#C8FF00] hover:bg-white/5 transition-colors"
              title="Download Data JSON"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

