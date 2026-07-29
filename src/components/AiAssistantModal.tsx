import React, { useState } from 'react';
import { ProjectInfo } from '../types/schedule';
import { Bot, X, Sparkles, AlertTriangle, Send, Loader2, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectInfo;
  onImportGeneratedProject: (newProjectData: any) => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  project,
  onImportGeneratedProject,
}) => {
  const [activeTab, setActiveTab] = useState<'analyze' | 'generate'>('analyze');
  const [promptInput, setPromptInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [generatedJson, setGeneratedJson] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAnalyzeProject = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'analyze',
          project,
          prompt: promptInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses analisis AI.');
      }
      setAnalysisResult(data.result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan pada AI Asisten.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateProject = async () => {
    if (!promptInput.trim()) {
      alert('Tolong masukkan deskripsi proyek yang ingin dibuat.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'generate',
          prompt: promptInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal generate jadwal proyek.');
      }
      setGeneratedJson(data.result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat membuat jadwal.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyGeneratedProject = () => {
    if (generatedJson) {
      onImportGeneratedProject(generatedJson);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#121212] border border-white/20 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-white font-sans">
        {/* Header */}
        <div className="p-4 bg-[#0A0A0A] text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-[#C8FF00] p-2 text-black">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base flex items-center gap-2 uppercase tracking-wide font-syne">
                AI Asisten Penjadwalan &amp; Kurva S
                <Sparkles className="w-4 h-4 text-[#C8FF00]" />
              </h3>
              <p className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">
                Powered by Gemini AI - Solusi Manajemen Risiko &amp; Optimasi Jadwal
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

        {/* Navigation Tabs */}
        <div className="bg-[#0A0A0A] p-2 border-b border-white/10 flex gap-2 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('analyze')}
            className={`px-4 py-2 transition-all ${
              activeTab === 'analyze'
                ? 'bg-[#C8FF00] text-black font-black'
                : 'text-white/60 hover:text-white bg-white/5'
            }`}
          >
            🔍 Analisis Deviasi &amp; Percepatan
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 transition-all ${
              activeTab === 'generate'
                ? 'bg-[#C8FF00] text-black font-black'
                : 'text-white/60 hover:text-white bg-white/5'
            }`}
          >
            ✨ Auto-Generate Jadwal Proyek Baru
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded flex items-center gap-2 font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'analyze' && (
            <div className="space-y-4">
              <div className="bg-[#1A1A1A] border border-white/10 p-4 space-y-3">
                <div className="font-black text-white uppercase tracking-wider text-xs font-syne">
                  Evaluasi Progress &amp; Rekomendasi Fast-Tracking
                </div>
                <p className="text-white/70 leading-relaxed">
                  AI akan mengevaluasi seluruh bobot item, deviasi fisik pada minggu ke-{project.currentWeek}, serta memberikan strategi crash program (misal penambahan tenaga kerja / lembur pada pekerjaan berbobot besar).
                </p>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="text"
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="Pertanyaan opsional (contoh: Bagaimana cara mengatasi keterlambatan pada pekerjaan struktur?)"
                    className="flex-1 bg-[#0A0A0A] border border-white/20 text-white p-2.5 font-bold focus:outline-none focus:border-[#C8FF00]"
                  />
                  <button
                    onClick={handleAnalyzeProject}
                    disabled={loading}
                    className="bg-[#C8FF00] hover:bg-[#b5e600] disabled:opacity-50 text-black font-black px-5 py-2.5 uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Mulai Analisis
                  </button>
                </div>
              </div>

              {analysisResult && (
                <div className="bg-[#1A1A1A] border border-white/10 p-5 space-y-3">
                  <div className="font-black text-[#C8FF00] text-sm flex items-center gap-2 uppercase tracking-wide font-syne">
                    <Sparkles className="w-4 h-4" />
                    Hasil Rekomendasi &amp; Analisis AI
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none text-white/90 leading-relaxed bg-[#0A0A0A] p-4 border border-white/10 font-sans">
                    <ReactMarkdown>{analysisResult}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="space-y-4">
              <div className="bg-[#1A1A1A] border border-white/10 p-4 space-y-3">
                <div className="font-black text-white uppercase tracking-wider text-xs font-syne">
                  Buat Jadwal Kurva S Otomatis dari Deskripsi Proyek
                </div>
                <p className="text-white/70">
                  Tuliskan jenis proyek, durasi, dan item pekerjaan utama yang Anda inginkan. AI akan menyusun RAB, volume, unit harga, dan pembagian mingguannya secara otomatis!
                </p>

                <textarea
                  rows={3}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Contoh: Buatkan jadwal proyek Pembangunan Poskesdes 1 Lantai luas 60m2 durasi 120 hari kalender mencakup struktur beton, pasangan bata, atap seng, dan keramik."
                  className="w-full bg-[#0A0A0A] border border-white/20 text-white p-2.5 font-bold focus:outline-none focus:border-[#C8FF00]"
                />

                <button
                  onClick={handleGenerateProject}
                  disabled={loading}
                  className="w-full bg-[#C8FF00] hover:bg-[#b5e600] disabled:opacity-50 text-black font-black py-3 uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Generate Jadwal Proyek dengan AI
                </button>
              </div>

              {generatedJson && (
                <div className="bg-[#1A1A1A] border border-[#C8FF00]/40 p-4 space-y-3">
                  <div className="font-black text-[#C8FF00] text-sm flex items-center justify-between uppercase tracking-wide font-syne">
                    <span>Jadwal Berhasil Dihasilkan oleh AI!</span>
                    <span className="text-xs font-mono font-bold text-white/70">
                      {generatedJson.categories?.length || 0} Kategori Pekerjaan
                    </span>
                  </div>

                  <div className="bg-[#0A0A0A] p-3 border border-white/10 text-white/80 font-mono text-[11px] max-h-48 overflow-y-auto">
                    <pre>{JSON.stringify(generatedJson, null, 2)}</pre>
                  </div>

                  <button
                    onClick={handleApplyGeneratedProject}
                    className="w-full bg-[#C8FF00] hover:bg-[#b5e600] text-black font-black py-2.5 uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Terapkan &amp; Impor Jadwal Ini ke Aplikasi
                  </button>
                </div>
              )}
            </div>
          )}
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
