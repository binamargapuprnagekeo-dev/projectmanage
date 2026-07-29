import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gemini AI endpoint for Schedule Analysis and AI Recommendations
app.post('/api/ai-schedule', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY tidak dikonfigurasi di lingkungan server.',
      });
    }

    const { mode, project, prompt } = req.body;
    const ai = new GoogleGenAI({ apiKey });

    if (mode === 'analyze') {
      // Analyze current progress & deviasi
      const systemInstruction = `Anda adalah Ahli Penjadwalan Konstruksi & Evaluasi Kurva S (Civil Project Management Expert).
Tugas Anda adalah menganalisis data proyek konstruksi, mengevaluasi deviasi antara rencana (kumulatif) dan realisasi, serta memberikan saran percepatan (crash program/fast tracking), identifikasi jalur kritis (critical path), dan mitigasi risiko keterlambatan.
Berikan respons dalam bahasa Indonesia yang profesional, jelas, dan terstruktur. Gunakan format markdown dengan poin-poin yang mudah dibaca.`;

      const userPrompt = `Analisislah proyek konstruksi berikut:
Nama Pekerjaan: ${project.title}
Lokasi: ${project.location}
Durasi: ${project.totalWeeks} minggu (${project.durationDays} Hari Kalender)
Minggu Evaluasi Saat Ini: Minggu ke-${project.currentWeek}

Detail Kategori & Bobot Pekerjaan:
${JSON.stringify(
  project.categories.map((c: any) => ({
    kode: c.code,
    nama: c.name,
    items: c.items.map((i: any) => ({
      uraian: i.description,
      satuan: i.unit,
      volume: i.volume,
      totalHarga: i.totalPrice,
      bobot: i.weightPercent + '%',
      weeklyPlan: i.weeklyPlan,
      weeklyActual: i.weeklyActual,
    })),
  })),
  null,
  2
)}

Pertanyaan / Catatan Pengguna: ${prompt || 'Tolong evaluasi progress saat ini, apakah terlambat atau sesuai jadwal, dan apa rekomendasi tindakan percepatannya?'}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });

      return res.json({ result: response.text });
    } else if (mode === 'generate') {
      // Auto generate a project schedule structure from user description
      const systemInstruction = `Anda adalah Ahli Quantity Surveyor & Penjadwalan Proyek Konstruksi Indonesia.
Buatlah struktur Rencana Anggaran Biaya (RAB) dan jadwal pelaksanaan pekerjaan Kurva S sederhana untuk proyek berikut dalam format JSON MURNI (tanpa tag markdown \`\`\`json).

Format JSON yang harus dihasilkan:
{
  "title": "NAMA PROYEK",
  "location": "LOKASI PROYEK",
  "durationDays": 120,
  "durationMonths": 4,
  "totalWeeks": 16,
  "categories": [
    {
      "code": "I",
      "name": "PEKERJAAN PERSIAPAN",
      "items": [
        {
          "itemNo": "1",
          "description": "Pembersihan Lapangan",
          "unit": "ls",
          "volume": 1,
          "unitPrice": 1500000,
          "startWeek": 1,
          "endWeek": 2
        }
      ]
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Buatkan jadwal konstruksi Kurva S untuk deskripsi proyek berikut: "${prompt}"`,
        config: {
          systemInstruction,
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      let jsonResult;
      try {
        jsonResult = JSON.parse(response.text || '{}');
      } catch (err) {
        jsonResult = { rawText: response.text };
      }

      return res.json({ result: jsonResult });
    } else {
      return res.status(400).json({ error: 'Mode AI tidak valid.' });
    }
  } catch (error: any) {
    console.error('Gemini AI error:', error);
    return res.status(500).json({ error: error.message || 'Gagal memproses permintaan AI.' });
  }
});

// Proxy endpoint for Google Apps Script Web App (Server-to-Server Sync)
app.post('/api/sheets-proxy', async (req, res) => {
  try {
    const { scriptUrl, payload } = req.body;
    if (!scriptUrl || !scriptUrl.startsWith('https://script.google.com')) {
      return res.status(400).json({ error: 'URL Google Apps Script Web App tidak valid.' });
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    const text = await response.text();

    if (text.includes('<!DOCTYPE html>') || text.includes('Google Accounts') || text.includes('accounts.google.com')) {
      return res.status(400).json({
        error: 'Akses ditolak oleh Google. Pastikan setelan pendeploian Google Apps Script diatur ke: "Siapa saja" (Anyone).',
      });
    }

    let jsonResult;
    try {
      jsonResult = JSON.parse(text);
    } catch (e) {
      jsonResult = { message: text };
    }

    if (jsonResult && jsonResult.status === 'error') {
      return res.status(400).json({
        error: jsonResult.message || 'Google Apps Script mengembalikan pesan error.',
      });
    }

    return res.json({ success: true, result: jsonResult });
  } catch (err: any) {
    console.error('Sheets Proxy Error:', err);
    return res.status(500).json({ error: err.message || 'Gagal menghubungkan ke Google Apps Script Web App.' });
  }
});

// Setup Vite middleware in dev mode, or serve static dist in prod mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Kurva S running on http://localhost:${PORT}`);
  });
}

startServer();
