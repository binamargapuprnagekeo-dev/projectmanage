import React, { useState } from 'react';
import { FileSpreadsheet, Download, Upload, ExternalLink, RefreshCw, CheckCircle2, X, AlertCircle } from 'lucide-react';
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
  const SAVED_SHEET_URL_KEY = 'kurva_s_google_sheets_url';
  const DEFAULT_SPREADSHEET_ID = '1MBMa_C5sJ2TRYDJ0gUcyHR06PmeffLAoi9f6f3NizCg';

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
  const [accessToken, setAccessToken] = useState('');
  const [showTokenHelp, setShowTokenHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(
    project.sheetsConfig?.spreadsheetUrl || ''
  );

  const getAccessToken = async (): Promise<string> => {
    if (accessToken && accessToken.trim()) {
      return accessToken.trim();
    }
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: '1029272332612-placeholder.apps.googleusercontent.com',
          scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
          callback: (response: any) => {
            if (response.access_token) {
              setAccessToken(response.access_token);
              resolve(response.access_token);
            } else {
              reject(new Error('Akses Google Sheets ditolak. Pastikan memberikan izin saat pop-up OAuth muncul.'));
            }
          },
        });
        tokenClient.requestAccessToken();
      } else {
        setShowTokenHelp(true);
        reject(
          new Error(
            'Silakan masukkan Google OAuth Access Token pada kolom di bawah ini, atau gunakan opsi Impor/Ekspor Excel (.xlsx) di menu utama.'
          )
        );
      }
    });
  };

  const handleExport = async () => {
    setLoading(true);
    setStatusMsg('Menghubungkan ke Google Sheets & mengekspor data Kurva S...');
    setErrorMsg('');

    try {
      const targetInput = spreadsheetId.trim();

      // Case 1: Apps Script Web App URL provided (No login/OAuth required)
      if (targetInput.startsWith('https://script.google.com')) {
        const result = await exportToGoogleSheets(project, undefined, targetInput, targetInput);
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
        setStatusMsg('✅ Data Kurva S berhasil disimpan otomatis ke Google Sheets via Server Apps Script!');
        return;
      }

      // Case 2: Google Sheets API v4 via Access Token
      const token = await getAccessToken();
      const result = await exportToGoogleSheets(project, token, targetInput || undefined);

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
    setStatusMsg('Membaca data & realisasi fisik langsung dari Google Sheets...');
    setErrorMsg('');

    try {
      let cleanId = spreadsheetId.trim();
      if (cleanId.includes('/d/')) {
        cleanId = cleanId.split('/d/')[1].split('/')[0];
      }

      // Try importing without token first (using public CSV)
      const updatedProj = await importFromGoogleSheets(cleanId, undefined, project);

      onProjectUpdated(updatedProj);
      setSpreadsheetId(cleanId);
      setStatusMsg('✅ Progress realisasi berhasil disinkronkan & diimpor dari Google Sheets!');
    } catch (err: any) {
      console.error('Google Sheets Import error:', err);
      // If public CSV failed, ask for optional access token fallback
      try {
        let cleanId = spreadsheetId.trim();
        if (cleanId.includes('/d/')) {
          cleanId = cleanId.split('/d/')[1].split('/')[0];
        }
        const token = await getAccessToken();
        const updatedProj = await importFromGoogleSheets(cleanId, token, project);
        onProjectUpdated(updatedProj);
        setSpreadsheetId(cleanId);
        setStatusMsg('✅ Progress realisasi berhasil disinkronkan & diimpor dari Google Sheets!');
      } catch (tokenErr: any) {
        setStatusMsg('');
        setErrorMsg(
          err.message || tokenErr.message || 'Gagal membaca Google Sheet. Pastikan spreadsheet disetting: "Siapa saja yang memiliki link dapat melihat" (Anyone with link can view).'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTwoWaySync = async () => {
    const targetInput = spreadsheetId.trim();
    if (!targetInput) {
      setErrorMsg('Masukkan Spreadsheet ID, Link Google Sheets, atau URL Apps Script terlebih dahulu.');
      return;
    }

    setLoading(true);
    setStatusMsg('1/2 Membaca data terbaru dari Google Sheets...');
    setErrorMsg('');

    try {
      if (targetInput.startsWith('https://script.google.com')) {
        // Save directly via Apps Script Web App
        setStatusMsg('2/2 Menyimpan data ke Google Sheets via Server Apps Script...');
        const exportRes = await exportToGoogleSheets(project, undefined, targetInput, targetInput);
        setSpreadsheetId(exportRes.spreadsheetId);
        setSpreadsheetUrl(exportRes.spreadsheetUrl);

        const finalProj: ProjectInfo = {
          ...project,
          sheetsConfig: {
            ...project.sheetsConfig,
            spreadsheetId: exportRes.spreadsheetId,
            spreadsheetUrl: exportRes.spreadsheetUrl,
            lastSyncedAt: new Date().toLocaleString('id-ID'),
          },
        };

        onProjectUpdated(finalProj);
        setStatusMsg('⚡ Sinkronisasi Sukses! Data tersimpan di Google Sheets via Server Web App.');
        return;
      }

      let cleanId = targetInput;
      if (cleanId.includes('/d/')) {
        cleanId = cleanId.split('/d/')[1].split('/')[0];
      }

      // Step 1: Import latest values from Sheets (Public CSV or API)
      let updatedProj = project;
      try {
        updatedProj = await importFromGoogleSheets(cleanId, undefined, project);
        onProjectUpdated(updatedProj);
      } catch (e) {
        console.warn('Public import failed during sync, trying with token if available...');
      }

      // Step 2: Re-export updated project back to Sheets via token
      const token = await getAccessToken();
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
      setStatusMsg('');
      setErrorMsg(err.message || 'Gagal melakukan sinkronisasi dengan Google Sheets.');
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
                Integrasi Google Sheets
              </h3>
              <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">
                Simpan, Ekspor &amp; Input Progress Kurva S via Google Spreadsheet
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
          {/* Authorization Info Box */}
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-[11px] space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-[#C8FF00] uppercase tracking-wider text-[11px]">
              <AlertCircle className="w-4 h-4 text-[#C8FF00]" />
              <span>Integrasi Google Sheets Kosong &amp; Otomatis</span>
            </div>
            <p className="leading-relaxed text-white/90">
              ✨ <strong>Ingin Menggunakan Sheet Kosong?</strong><br />
              1. **Cara Otomatis:** Kosongkan kolom Link/ID di bawah lalu klik <strong>&quot;Simpan / Ekspor Ke Sheets&quot;</strong> (sistem akan membuat file Google Spreadsheet baru di Drive Anda).<br />
              2. **Cara Manual:** Buka{' '}
              <a
                href="https://sheets.new"
                target="_blank"
                rel="noreferrer"
                className="text-[#C8FF00] font-bold underline inline-flex items-center gap-0.5"
              >
                sheets.new (Google Sheet Kosong Baru) <ExternalLink className="w-3 h-3" />
              </a>
              , lalu tempel (paste) link-nya di kolom bawah dan klik <strong>&quot;Simpan / Ekspor Ke Sheets&quot;</strong>.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {statusMsg && (
            <div className="p-3 bg-[#C8FF00]/10 border border-[#C8FF00]/40 text-[#C8FF00] font-bold uppercase tracking-wider flex items-center gap-2 font-mono">
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#C8FF00] flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#C8FF00] flex-shrink-0" />
              )}
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Spreadsheet ID / Link Input */}
          <div className="space-y-1.5 bg-[#0A0A0A] p-3.5 border border-white/10">
            <div className="flex items-center justify-between">
              <label className="font-bold uppercase tracking-wider text-white/80 text-[10px]">
                <span>Spreadsheet ID / Link Google Sheets</span>
              </label>
              {spreadsheetId && (
                <button
                  type="button"
                  onClick={() => {
                    setSpreadsheetId('');
                    setStatusMsg('Kolom dikosongkan. Klik "Simpan / Ekspor Ke Sheets" di bawah untuk membuat Google Spreadsheet baru.');
                  }}
                  className="text-amber-400 hover:text-amber-300 text-[10px] font-bold uppercase tracking-wider underline flex items-center gap-1"
                >
                  <span>⚡ Kosongkan Kolom (Buat Sheet Baru)</span>
                </button>
              )}
            </div>
            <input
              type="text"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              placeholder="Tempel link Google Sheet Anda di sini (atau biarkan kosong untuk buat sheet baru)"
              className="w-full bg-[#121212] border border-white/20 text-white p-2.5 font-mono text-xs focus:outline-none focus:border-[#C8FF00]"
            />
            <div className="flex flex-col gap-1 text-[10px] text-white/60 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[#C8FF00] font-bold">💾 URL ini tersimpan otomatis di browser &amp; diingat untuk seterusnya.</span>
                {project.sheetsConfig?.lastSyncedAt && (
                  <span className="text-white/40">Sync: {project.sheetsConfig.lastSyncedAt}</span>
                )}
              </div>
            </div>
          </div>

          {/* Apps Script Guide & Code Copy Box */}
          <div className="space-y-2 bg-[#0A0A0A] p-3.5 border border-[#C8FF00]/30">
            <div className="flex items-center justify-between">
              <div className="font-bold uppercase tracking-wider text-[#C8FF00] text-[11px] flex items-center gap-1.5">
                <span>🚀 SOLUSI TANPA LOGIN: Tanam Script Server di Google Sheet</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const code = `function getTargetSheet(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss.getActiveSheet();
  } catch(e) {}
  
  var targetId = (data && data.spreadsheetId) ? data.spreadsheetId : "1MBMa_C5sJ2TRYDJ0gUcyHR06PmeffLAoi9f6f3NizCg";
  if (targetId.indexOf("/d/") !== -1) {
    targetId = targetId.split("/d/")[1].split("/")[0];
  }
  try {
    var ss = SpreadsheetApp.openById(targetId);
    if (ss) return ss.getSheets()[0];
  } catch(e) {}

  throw new Error("Spreadsheet tidak ditemukan. Pastikan ID Spreadsheet valid.");
}

function doPost(e) {
  try {
    var contents = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    var data = JSON.parse(contents);
    var sheet = getTargetSheet(data);
    sheet.clear();
    var values = data.values;
    if (values && values.length > 0) {
      var maxCols = 0;
      for (var i = 0; i < values.length; i++) {
        if (values[i] && values[i].length > maxCols) {
          maxCols = values[i].length;
        }
      }
      if (maxCols === 0) maxCols = 1;

      for (var r = 0; r < values.length; r++) {
        if (!values[r]) values[r] = [];
        while (values[r].length < maxCols) {
          values[r].push("");
        }
      }

      sheet.getRange(1, 1, values.length, maxCols).setValues(values);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var sheet = getTargetSheet({});
    var values = sheet.getDataRange().getValues();
    return ContentService.createTextOutput(JSON.stringify({ status: "success", values: values }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Server Google Apps Script Active" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
                  navigator.clipboard.writeText(code);
                  alert('✅ Kode Script Server Google Sheet berhasil disalin ke clipboard!');
                }}
                className="bg-[#C8FF00] text-black font-black px-2.5 py-1 text-[10px] uppercase tracking-wider hover:bg-[#b0e000] transition-colors flex items-center gap-1"
              >
                <span>📋 Salin Kode Script</span>
              </button>
            </div>
            <p className="text-[10.5px] text-white/80 leading-relaxed">
              Pasang script ini 1 kali di Google Sheet Anda agar dapat menyimpan &amp; sinkronisasi data secara otomatis tanpa perlu login atau minta izin OAuth lagi:
            </p>
            <ol className="list-decimal list-inside text-[10px] text-white/70 space-y-1 pl-1">
              <li>Buka Google Sheet Anda &rarr; klik menu <strong>Ekstensi</strong> &rarr; <strong>Apps Script</strong>.</li>
              <li>Hapus semua kode bawaan, lalu klik tombol <strong>Salin Kode Script</strong> di atas dan tempelkan.</li>
              <li>Klik tombol <strong>Terapkan (Deploy)</strong> &rarr; <strong>Penerapan Baru</strong> &rarr; Pilih jenis <strong>Aplikasi Web</strong>.</li>
              <li>Ubah opsi <strong>&quot;Siapa yang memiliki akses&quot;</strong> menjadi <strong>&quot;Siapa saja (Anyone)&quot;</strong>, lalu klik Terapkan.</li>
              <li>Salin URL Web App yang muncul (diawali <code>https://script.google.com/macros/s/...</code>) dan tempel pada kolom Spreadsheet ID/Link di atas!</li>
            </ol>
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
        <div className="p-3 sm:p-4 bg-[#0A0A0A] border-t border-white/10 flex items-center justify-between flex-shrink-0">
          <span className="text-[10px] text-white/40 font-mono hidden sm:inline">
            Status: {loading ? 'Sedang Memproses...' : 'Siap'}
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 bg-[#C8FF00] text-black hover:bg-[#b5e600] font-black text-xs uppercase tracking-wider transition-colors shadow-md"
          >
            Tutup (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
