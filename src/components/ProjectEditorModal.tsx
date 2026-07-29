import React, { useState } from 'react';
import { ProjectInfo } from '../types/schedule';
import { X, Check, Building2 } from 'lucide-react';

interface ProjectEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectInfo;
  onSaveProjectInfo: (updatedProject: Partial<ProjectInfo>) => void;
}

export const ProjectEditorModal: React.FC<ProjectEditorModalProps> = ({
  isOpen,
  onClose,
  project,
  onSaveProjectInfo,
}) => {
  const [title, setTitle] = useState(project.title);
  const [location, setLocation] = useState(project.location);
  const [agency, setAgency] = useState(project.agency);
  const [fiscalYear, setFiscalYear] = useState(project.fiscalYear);
  const [durationDays, setDurationDays] = useState(project.durationDays.toString());
  const [durationMonths, setDurationMonths] = useState(project.durationMonths.toString());
  const [bidderName, setBidderName] = useState(project.bidderName);
  const [directorName, setDirectorName] = useState(project.directorName);
  const [directorTitle, setDirectorTitle] = useState(project.directorTitle);
  const [cityDate, setCityDate] = useState(project.cityDate);

  if (!isOpen) return null;

  const handleSave = () => {
    const days = parseInt(durationDays, 10) || 150;
    const months = parseInt(durationMonths, 10) || 5;
    const totalWeeks = months * 4;

    onSaveProjectInfo({
      title,
      location,
      agency,
      fiscalYear,
      durationDays: days,
      durationMonths: months,
      weeksPerMonth: 4,
      totalWeeks,
      bidderName,
      directorName,
      directorTitle,
      cityDate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#121212] border border-white/20 shadow-2xl max-w-xl w-full flex flex-col overflow-hidden text-white font-sans">
        {/* Header */}
        <div className="p-4 bg-[#0A0A0A] text-white flex items-center justify-between border-b border-white/10">
          <h3 className="font-black text-base flex items-center gap-2 uppercase tracking-wide font-syne">
            <Building2 className="w-5 h-5 text-[#C8FF00]" />
            Edit Informasi Proyek Konstruksi
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-white/50 hover:text-white rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3.5 text-xs overflow-y-auto max-h-[75vh]">
          <div className="space-y-1">
            <label className="font-bold uppercase tracking-wider text-white/70 text-[10px]">Nama Pekerjaan / Proyek</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-white/20 text-white p-2.5 font-black text-sm focus:outline-none focus:border-[#C8FF00]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-white/70 text-[10px]">Lokasi Pekerjaan</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-white/20 text-white p-2.5 font-bold focus:outline-none focus:border-[#C8FF00]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-white/70 text-[10px]">Satuan Kerja / Pengguna Jasa</label>
              <input
                type="text"
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-white/20 text-white p-2.5 font-bold focus:outline-none focus:border-[#C8FF00]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-white/70 text-[10px]">Tahun Anggaran</label>
              <input
                type="text"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-white/20 text-white p-2.5 font-bold focus:outline-none focus:border-[#C8FF00]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-white/70 text-[10px]">Durasi (Hari Kalender)</label>
              <input
                type="number"
                value={durationDays}
                onChange={(e) => {
                  const days = parseInt(e.target.value, 10) || 0;
                  setDurationDays(e.target.value);
                  const approxMonths = Math.ceil(days / 30);
                  if (approxMonths > 0) setDurationMonths(approxMonths.toString());
                }}
                className="w-full bg-[#0A0A0A] border border-white/20 text-white p-2.5 font-mono font-bold focus:outline-none focus:border-[#C8FF00]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-white/70 text-[10px]">Durasi (Bulan)</label>
              <input
                type="number"
                value={durationMonths}
                onChange={(e) => {
                  const months = parseInt(e.target.value, 10) || 0;
                  setDurationMonths(e.target.value);
                  if (months > 0) setDurationDays((months * 30).toString());
                }}
                className="w-full bg-[#0A0A0A] border border-white/20 text-white p-2.5 font-mono font-bold focus:outline-none focus:border-[#C8FF00]"
              />
            </div>
          </div>

          <div className="p-2.5 bg-[#1A1A1A] border border-white/10 text-white/80 font-mono text-[11px] flex items-center justify-between">
            <span>Konversi Otomatis Rentang Waktu:</span>
            <span className="text-[#C8FF00] font-bold">
              {durationDays || 0} Hari Kalender = {(parseInt(durationMonths, 10) || 0) * 4} Minggu = {durationMonths || 0} Bulan
            </span>
          </div>

          <hr className="border-white/10 my-3" />

          <div className="space-y-1">
            <label className="font-bold uppercase tracking-wider text-white/70 text-[10px]">Nama Penawar / Kontraktor (CV/PT)</label>
            <input
              type="text"
              value={bidderName}
              onChange={(e) => setBidderName(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-white/20 text-white p-2.5 font-bold focus:outline-none focus:border-[#C8FF00]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-white/70 text-[10px]">Nama Kuasa Direktur / Pimpinan</label>
              <input
                type="text"
                value={directorName}
                onChange={(e) => setDirectorName(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-white/20 text-white p-2.5 font-bold focus:outline-none focus:border-[#C8FF00]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-white/70 text-[10px]">Jabatan Pimpinan</label>
              <input
                type="text"
                value={directorTitle}
                onChange={(e) => setDirectorTitle(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-white/20 text-white p-2.5 font-bold focus:outline-none focus:border-[#C8FF00]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold uppercase tracking-wider text-white/70 text-[10px]">Tempat &amp; Tanggal Penetapan</label>
            <input
              type="text"
              value={cityDate}
              onChange={(e) => setCityDate(e.target.value)}
              placeholder="Mbay, 01 Juli 2026"
              className="w-full bg-[#0A0A0A] border border-white/20 text-white p-2.5 font-bold focus:outline-none focus:border-[#C8FF00]"
            />
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
            Simpan Informasi
          </button>
        </div>
      </div>
    </div>
  );
};
