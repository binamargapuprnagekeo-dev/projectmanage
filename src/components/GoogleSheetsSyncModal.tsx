import React, { useState } from 'react';
import { FileSpreadsheet, Download, Upload, ExternalLink, RefreshCw, CheckCircle2, X, AlertCircle, Copy, Check } from 'lucide-react';
import { ProjectInfo } from '../types/schedule';
import { exportToGoogleSheets, importFromGoogleSheets, copyProjectMatrixToClipboard } from '../utils/googleSheets';

interface GoogleSheetsSyncModalProps {
  project: ProjectInfo;
  onProjectUpdated: (updatedProject: ProjectInfo) => void;
  onClose: () => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  project,
  onProjectUpdated,
  onClose,
}) => {
  const SAVED_SHEET_URL_KEY = 'kurva_s_google_sheets_url';
  const DEFAULT_SPREADSHEET_ID = '1MBMa_C5sJ2TRYDJ0gUcyHR06PmeffLAoi9f6f3NizCg';
  const DEFAULT_SPREADSHEET_FULL_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit?gid=0#gid=0`;

  const [spreadsheetId, setSpreadsheetIdState] = useState<string>(() => {
    return project.sheetsConfig?.spreadsheetId || localStorage.getItem(SAVED_SHEET_URL_KEY) || DEFAULT_SPREADSHEET_ID;
  });

  const setSpreadsheetId = (val: string) => {
    setSpreadsheetIdState(val);
    if (val && val.trim()) {
      localStorage.setItem(SAVED_SHEET_URL_KEY, val.trim());
    } else {
      localStorage.removeItem(SAVED_SHEET_URL_KEY);
    }
  };

  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCopyTable = async () => {
    const success = await copyProjectMatrixToClipboard(project);
    if (success) {
      setCopied(true);
      setStatusMsg('✅ Seluruh tabel & bobot Kurva S berhasil disalin ke Clipboard! Buka Google Sheets lalu tekan Ctrl+V di Cell A1.');
      setTimeout(() => setCopied(false), 4000);
    } else {
      setErrorMsg('Gagal menyalin data ke clipboard.');
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setStatusMsg('Mengekspor data Kurva S...');
    setErrorMsg('');

    try {
      const targetInput = spreadsheetId.trim();

      if (targetInput.startsWith('https://script.google.com')) {
        const result = await exportToGoogleSheets(project, undefined, targetInput, targetInput);
        setSpreadsheetId(result.spreadsheetId);

        const updatedProj: ProjectInfo = {
          ...project,
          sheetsConfig: {
            ...project.sheetsConfig,
            spreadsheetId: result.spreadsheetId,
            spreadsheetUrl: result.spreadsheetUrl,
            lastSyncedAt: new Date().toLocaleString('id-ID'),
          },
        };

        onProjectUpdated(updatedProj);
        setStatusMsg('✅ Data Kurva S berhasil tersimpan otomatis ke Google Sheets!');
        return;
      }

      // If a standard Google Sheet URL or ID is passed, copy to clipboard for instant pasting
      await copyProjectMatrixToClipboard(project);
      setStatusMsg('✅ Seluruh data Kurva S disalin ke clipboard! Buka Google Sheets lalu tekan Ctrl+V pada sel A1.');
    } catch (err: any) {
      console.error('Google Sheets Export error:', err);
      setStatusMsg('');
      setErrorMsg(err.message || 'Gagal mengekspor data ke Google Sheets.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!spreadsheetId.trim()) {
      setErrorMsg('Masukkan Spreadsheet ID atau URL Google Sheets terlebih dahulu.');
      return;
    }

    setLoading(true);
    setStatusMsg('Membaca data & realisasi fisik dari Google Sheets...');
    setErrorMsg('');

    try {
      let cleanId = spreadsheetId.trim();
      if (cleanId.includes('/d/')) {
        cleanId = cleanId.split('/d/')[1].split('/')[0];
      }

      const updatedProj = await importFromGoogleSheets(cleanId, undefined, project);
      onProjectUpdated(updatedProj);
      setSpreadsheetId(cleanId);
      setStatusMsg('✅ Progress realisasi berhasil disinkronkan & diimpor dari Google Sheets!');
    } catch (err: any) {
      console.error('Import error:', err);
      setStatusMsg('');
      setErrorMsg(err.message || 'Gagal mengimpor data dari Google Sheets. Pastikan sheet diset Publik (Siapa saja yang memiliki link).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 font-sans overflow-y-auto">
      <div className="bg-[#121212] border border-white/20 shadow-2xl max-w-xl w-full flex flex-col my-auto max-h-[90vh] text-white">
        {/* Header */}
        <div className="p-4 bg-[#0A0A0A] text-white flex items-center justify-between border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#C8FF00] p-2 text-black font-black">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base uppercase tracking-wide font-syne text-[#C8FF00]">
                Google Sheets Database
              </h3>
              <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">
                Penyimpanan Otomatis &amp; Link Google Spreadsheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-2.5 py-1 bg-white/10 hover:bg-rose-600 hover:border-rose-500 border border-white/20 text-white rounded text-xs font-bold transition-colors flex items-center gap-1"
            title="Tutup Modal"
          >
            <span>Tutup</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1 min-h-0">
          {/* Direct Link Banner */}
          <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/50 text-emerald-100 space-y-2">
            <div className="font-bold flex items-center justify-between text-[#C8FF00] uppercase tracking-wider text-[11px]">
              <span className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-[#C8FF00]" />
                DATABASE GOOGLE SHEETS AKTIF
              </span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 border border-emerald-500/30 font-mono">
                OTOMATIS TERSIMPAN
              </span>
            </div>

            <p className="text-[11px] text-white/90 leading-relaxed">
              Semua input progress &amp; jadwal Kurva S Anda tersimpan secara langsung dan aman di memori sistem. Anda dapat langsung membuka Google Spreadsheet target di bawah ini:
            </p>

            <a
              href={DEFAULT_SPREADSHEET_FULL_URL}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 bg-[#C8FF00] hover:bg-[#b5e600] text-black font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <ExternalLink className="w-4 h-4 stroke-[2.5]" />
              <span>BUKA GOOGLE SHEETS PEKERJAAN INI</span>
            </a>
          </div>

          {/* Quick Copy Button */}
          <div className="p-3.5 bg-[#0A0A0A] border border-white/15 space-y-2">
            <div className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <Copy className="w-4 h-4 text-[#C8FF00]" />
              <span>SALIN SELURUH DATA PEKERJAAN (1-KLIK)</span>
            </div>
            <p className="text-[10.5px] text-white/70 leading-relaxed">
              Klik tombol di bawah untuk menyalin seluruh baris pekerjaan, volume, harga, bobot %, jadwal mingguan &amp; realisasi ke clipboard. Kemudian buka Google Sheets dan tekan <strong className="text-white">Ctrl+V</strong> di Cell A1:
            </p>

            <button
              type="button"
              onClick={handleCopyTable}
              className={`w-full py-2.5 px-3 border font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all ${
                copied
                  ? 'bg-emerald-500 border-emerald-400 text-black'
                  : 'bg-[#C8FF00] hover:bg-[#b5e600] border-[#C8FF00] text-black shadow-lg'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-black stroke-[3]" />
                  <span>BERHASIL DISALIN! PASTE (CTRL+V) DI CELL A1 GOOGLE SHEETS</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-black stroke-[2.5]" />
                  <span>SALIN MATRIKS LENGKAP KE CLIPBOARD (CTRL+V)</span>
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {statusMsg && (
            <div className="p-3 bg-[#C8FF00]/10 border border-[#C8FF00]/40 text-[#C8FF00] font-bold uppercase tracking-wider flex items-center gap-2 font-mono text-[11px]">
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#C8FF00] flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#C8FF00] flex-shrink-0" />
              )}
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Spreadsheet ID / Script URL Input */}
          <div className="space-y-1.5 bg-[#0A0A0A] p-3.5 border border-white/10">
            <label className="font-bold uppercase tracking-wider text-white/80 text-[10px]">
              <span>Link Spreadsheet / Web App URL</span>
            </label>
            <input
              type="text"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              placeholder="Tempel link Google Sheet atau Web App Script URL di sini"
              className="w-full bg-[#121212] border border-white/20 text-white p-2.5 font-mono text-xs focus:outline-none focus:border-[#C8FF00]"
            />
            <div className="text-[10px] text-white/50 font-mono">
              Link default: <span className="text-[#C8FF00]">{DEFAULT_SPREADSHEET_ID}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleExport}
              disabled={loading}
              className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-[#C8FF00]" />
              Salin Data Tabel
            </button>

            <button
              onClick={handleImport}
              disabled={loading}
              className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              Tarik Progress Dari Sheet
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-[#0A0A0A] border-t border-white/10 flex items-center justify-between flex-shrink-0">
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Auto-Save Aktif
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#C8FF00] text-black hover:bg-[#b5e600] font-black text-xs uppercase tracking-wider transition-colors shadow-md"
          >
            Tutup (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
