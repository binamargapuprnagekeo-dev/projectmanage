import React, { useState } from 'react';
import { FileSpreadsheet, Download, Upload, ExternalLink, RefreshCw, Check, X, AlertCircle } from 'lucide-react';
import { ProjectInfo } from '../types/schedule';
import { exportToGoogleSheets, importFromGoogleSheets } from '../utils/googleSheets';

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
  const [spreadsheetId, setSpreadsheetId] = useState(
    project.sheetsConfig?.spreadsheetId || ''
  );
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(
    project.sheetsConfig?.spreadsheetUrl || ''
  );

  const getAccessToken = async (): Promise<string> => {
    // If running in Google AI Studio sandbox with OAuth granted, get token or ask user
    // We try to request GIS token client or prompt
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: '1029272332612-placeholder.apps.googleusercontent.com', // fallback
          scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
          callback: (response: any) => {
            if (response.access_token) {
              resolve(response.access_token);
            } else {
              reject(new Error('Gagal mendapatkan token OAuth Google.'));
            }
          },
        });
        tokenClient.requestAccessToken();
      } else {
        // Fallback: prompt for user token or use proxy
        const manualToken = prompt('OAuth Token Google Sheets telah aktif. Silakan masukkan Access Token Google Anda (opsional) atau klik OK untuk memproses:');
        if (manualToken !== null) {
          resolve(manualToken);
        } else {
          reject(new Error('Batal memilih token.'));
        }
      }
    });
  };

  const handleExport = async () => {
    setLoading(true);
    setStatusMsg('Menghubungkan ke Google Sheets API & Mengekspor data Kurva S...');
    setErrorMsg('');

    try {
      const token = await getAccessToken();
      const result = await exportToGoogleSheets(project, token, spreadsheetId || undefined);

      setSpreadsheetId(result.spreadsheetId);
      setSpreadsheetUrl(result.spreadsheetUrl);

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
      setStatusMsg('✅ Data Kurva S & Bobot Fisik berhasil diekspor ke Google Sheets!');
    } catch (err: any) {
      console.error('Google Sheets Export error:', err);
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
    setStatusMsg('Membaca realisasi fisik dari Google Sheets...');
    setErrorMsg('');

    try {
      // Extract clean ID if full URL pasted
      let cleanId = spreadsheetId.trim();
      if (cleanId.includes('/d/')) {
        cleanId = cleanId.split('/d/')[1].split('/')[0];
      }

      const token = await getAccessToken();
      const updatedProj = await importFromGoogleSheets(cleanId, token, project);

      onProjectUpdated(updatedProj);
      setSpreadsheetId(cleanId);
      setStatusMsg('✅ Progress realisasi berhasil disinkronkan & diimpor dari Google Sheets!');
    } catch (err: any) {
      console.error('Google Sheets Import error:', err);
      setErrorMsg(err.message || 'Gagal mengimpor data dari Google Sheets.');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoWaySync = async () => {
    if (!spreadsheetId.trim()) {
      setErrorMsg('Masukkan Spreadsheet ID atau URL Google Sheets terlebih dahulu.');
      return;
    }

    setLoading(true);
    setStatusMsg('1/2 Membaca data terbaru dari Google Sheets...');
    setErrorMsg('');

    try {
      let cleanId = spreadsheetId.trim();
      if (cleanId.includes('/d/')) {
        cleanId = cleanId.split('/d/')[1].split('/')[0];
      }

      const token = await getAccessToken();
      // Step 1: Import latest values from Sheets
      const updatedProj = await importFromGoogleSheets(cleanId, token, project);
      onProjectUpdated(updatedProj);

      setStatusMsg('2/2 Menyimpan & memperbarui ulang seluruh data ke Google Sheets...');
      // Step 2: Re-export updated project back to Sheets
      const exportRes = await exportToGoogleSheets(updatedProj, token, cleanId);

      setSpreadsheetId(exportRes.spreadsheetId);
      setSpreadsheetUrl(exportRes.spreadsheetUrl);

      const finalProj: ProjectInfo = {
        ...updatedProj,
        sheetsConfig: {
          ...updatedProj.sheetsConfig,
          spreadsheetId: exportRes.spreadsheetId,
          spreadsheetUrl: exportRes.spreadsheetUrl,
          lastSyncedAt: new Date().toLocaleString('id-ID'),
        },
      };

      onProjectUpdated(finalProj);
      setStatusMsg('⚡ Sinkronisasi 2 Arah Sukses! Data ditarik dari Sheets & disimpan ulang dengan sempurna.');
    } catch (err: any) {
      console.error('Two-Way Sync error:', err);
      setErrorMsg(err.message || 'Gagal melakukan sinkronisasi 2 arah dengan Google Sheets.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-[#121212] border border-white/20 shadow-2xl max-w-xl w-full flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 bg-[#0A0A0A] text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-[#C8FF00] p-2 text-black font-black">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base uppercase tracking-wide font-syne text-[#C8FF00]">
                Integrasi Google Sheets
              </h3>
              <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">
                Simpan, Ekspor &amp; Input Progress Kurva S via Google Spreadsheet
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

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {statusMsg && (
            <div className="p-3 bg-[#C8FF00]/10 border border-[#C8FF00]/40 text-[#C8FF00] font-bold uppercase tracking-wider flex items-center gap-2 font-mono">
              <RefreshCw className="w-4 h-4 animate-spin text-[#C8FF00]" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Spreadsheet ID / Link Input */}
          <div className="space-y-1.5 bg-[#0A0A0A] p-3.5 border border-white/10">
            <label className="font-bold uppercase tracking-wider text-white/80 text-[10px] flex items-center justify-between">
              <span>Spreadsheet ID / Link Google Sheets</span>
              {project.sheetsConfig?.lastSyncedAt && (
                <span className="text-white/40 font-mono text-[9px]">
                  Terakhir Sync: {project.sheetsConfig.lastSyncedAt}
                </span>
              )}
            </label>
            <input
              type="text"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms atau paste link lengkap"
              className="w-full bg-[#121212] border border-white/20 text-white p-2.5 font-mono text-xs focus:outline-none focus:border-[#C8FF00]"
            />
            <p className="text-[10px] text-white/50 font-mono">
              Kosongkan ID jika ingin membuat Google Spreadsheet baru secara otomatis.
            </p>
          </div>

          {spreadsheetUrl && (
            <div className="p-3 bg-[#0A0A0A] border border-[#C8FF00]/40 flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <div className="text-[10px] uppercase font-bold text-[#C8FF00] tracking-wider">
                  Link Spreadsheet Aktif
                </div>
                <div className="text-[11px] font-mono text-white/80 truncate">
                  {spreadsheetUrl}
                </div>
              </div>
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-[#C8FF00] text-black font-black uppercase text-[10px] tracking-wider flex items-center gap-1.5 hover:bg-[#b5e600]"
              >
                Buka Sheets <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleTwoWaySync}
              disabled={loading}
              className="w-full p-3.5 bg-[#C8FF00] hover:bg-[#b5e600] text-black font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-black ${loading ? 'animate-spin' : ''}`} />
              ⚡ Sinkronisasi 2 Arah (Tarik Progress &amp; Simpan Ulang Ke Sheets)
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleExport}
                disabled={loading}
                className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-[#C8FF00]" />
                Simpan / Ekspor Ke Sheets
              </button>

              <button
                onClick={handleImport}
                disabled={loading}
                className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5 text-sky-400" />
                Tarik / Impor Dari Sheets
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0A0A0A] border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-transparent border border-white/20 text-white/80 hover:text-white hover:border-white text-xs font-bold uppercase tracking-wider"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
