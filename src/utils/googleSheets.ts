import { ProjectInfo } from '../types/schedule';
import { calculateWeekSummaries, formatCurrency, isItemCriticalPath } from './calculator';

/**
 * Parse CSV string into 2D string array handling quoted commas and newlines.
 */
export function parseCSV(csvText: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentToken = '';

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentToken += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentToken.trim());
      currentToken = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentToken.trim());
      currentToken = '';
      if (row.some((cell) => cell.length > 0)) {
        lines.push(row);
      }
      row = [];
    } else {
      currentToken += char;
    }
  }

  if (currentToken.length > 0 || row.length > 0) {
    row.push(currentToken.trim());
    if (row.some((cell) => cell.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

/**
 * Creates or updates a Google Spreadsheet with Kurva S schedule and progress data.
 * Supports both Google Apps Script Web App URLs (no login required) and Google Sheets API v4.
 */
export async function exportToGoogleSheets(
  project: ProjectInfo,
  accessToken?: string,
  existingSpreadsheetId?: string,
  webAppUrl?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const weekSummaries = calculateWeekSummaries(project);
  
  // Calculate Grand Total
  let grandTotalCost = 0;
  project.categories.forEach((c) =>
    c.items.forEach((i) => {
      grandTotalCost += i.volume * i.unitPrice;
    })
  );

  // 1. Build Rows Array
  const values: any[][] = [];

  // Title Block
  values.push(['JADWAL PELAKSANAAN PEKERJAAN (KURVA S)']);
  values.push([project.title.toUpperCase()]);
  values.push([]);
  values.push(['Lokasi Pekerjaan', project.location, '', 'Tahun Anggaran', project.fiscalYear]);
  values.push(['Satuan Kerja', project.agency, '', 'Jangka Waktu', `${project.durationDays} HARI KALENDER (${project.totalWeeks} MINGGU)`]);
  values.push(['Penawar / Kontraktor', project.bidderName, '', 'Total Nilai Kontrak', formatCurrency(grandTotalCost)]);
  values.push([]);

  // Table Headers
  const weekHeaders: string[] = [];
  for (let w = 1; w <= project.totalWeeks; w++) {
    weekHeaders.push(`M${w}`);
  }

  const headerRow = [
    'NO',
    'URAIAN PEKERJAAN',
    'SAT',
    'VOL',
    'HARGA SATUAN (RP)',
    'JUMLAH HARGA (RP)',
    'BOBOT %',
    'JALUR KRITIS',
    'CATATAN MK',
    ...weekHeaders,
  ];

  values.push(headerRow);

  // Categories & Items
  project.categories.forEach((cat) => {
    let catTotal = 0;
    let catWeight = 0;
    cat.items.forEach((i) => {
      catTotal += i.volume * i.unitPrice;
      catWeight += i.weightPercent;
    });

    // Category Header Row
    values.push([
      cat.code,
      cat.name.toUpperCase(),
      '',
      '',
      '',
      catTotal,
      Number(catWeight.toFixed(2)),
      'KATEGORI',
      '',
      ...Array(project.totalWeeks).fill(''),
    ]);

    // Item Rows
    cat.items.forEach((item) => {
      const isCritical = isItemCriticalPath(item);
      const weekPlans: (number | string)[] = [];

      for (let w = 1; w <= project.totalWeeks; w++) {
        const plan = item.weeklyPlan ? item.weeklyPlan[w] : undefined;
        const actual = item.weeklyActual ? item.weeklyActual[w] : undefined;

        if (actual !== undefined && actual !== null) {
          weekPlans.push(`${actual}% (P: ${plan || 0}%)`);
        } else if (plan) {
          weekPlans.push(`${plan}%`);
        } else {
          weekPlans.push('');
        }
      }

      values.push([
        item.itemNo,
        item.description,
        item.unit,
        item.volume,
        item.unitPrice,
        item.volume * item.unitPrice,
        Number(item.weightPercent.toFixed(2)),
        isCritical ? '🔥 KRITIS' : 'NORMAL',
        item.consultantNote || '',
        ...weekPlans,
      ]);
    });
  });

  // Summary Rows
  values.push([]);
  values.push([
    '',
    'TOTAL BOBOT FISIK RENCANA MINGGUAN (%)',
    '',
    '',
    '',
    '',
    100,
    '',
    '',
    ...weekSummaries.map((s) => s.plannedWeight),
  ]);
  values.push([
    '',
    'KUMULATIF RENCANA S-CURVE (%)',
    '',
    '',
    '',
    '',
    100,
    '',
    '',
    ...weekSummaries.map((s) => s.cumulativePlannedWeight),
  ]);
  values.push([
    '',
    'TOTAL BOBOT FISIK REALISASI MINGGUAN (%)',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ...weekSummaries.map((s) => s.actualWeight),
  ]);
  values.push([
    '',
    'KUMULATIF REALISASI S-CURVE (%)',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ...weekSummaries.map((s) => s.cumulativeActualWeight),
  ]);
  values.push([
    '',
    'DEVIASI KUMULATIF (%)',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ...weekSummaries.map((s) => s.deviationCumulative),
  ]);

  // Ensure 2D matrix is rectangular (every row has equal number of columns = maxCols)
  let maxCols = 0;
  values.forEach((r) => {
    if (r.length > maxCols) maxCols = r.length;
  });
  if (maxCols === 0) maxCols = 1;

  const normalizedValues = values.map((row) => {
    const padded = [...row];
    while (padded.length < maxCols) {
      padded.push('');
    }
    return padded;
  });

  // If Google Apps Script Web App URL is provided or inputted as spreadsheetId
  const scriptUrl = webAppUrl || (existingSpreadsheetId?.startsWith('https://script.google.com') ? existingSpreadsheetId : undefined);
  if (scriptUrl) {
    const proxyRes = await fetch('/api/sheets-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scriptUrl,
        payload: {
          values: normalizedValues,
          title: project.title,
          spreadsheetId: '1R7pwxSWyPi5kh01kaI8OKXP5a7hHfGY2hBdBoiR2cIo',
        },
      }),
    });

    const proxyData = await proxyRes.json().catch(() => ({}));
    if (!proxyRes.ok || proxyData.error) {
      throw new Error(proxyData.error || 'Gagal menyimpan data ke Google Apps Script Web App.');
    }

    return {
      spreadsheetId: scriptUrl,
      spreadsheetUrl: scriptUrl,
    };
  }

  let spreadsheetId = existingSpreadsheetId;
  if (spreadsheetId && spreadsheetId.includes('/d/')) {
    spreadsheetId = spreadsheetId.split('/d/')[1].split('/')[0];
  }

  if (!accessToken) {
    throw new Error(
      'Diperlukan Google Apps Script Web App URL atau Access Token untuk menyimpan data secara otomatis ke Google Sheets.'
    );
  }

  if (!spreadsheetId) {
    // Create new spreadsheet via Google Sheets API v4
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: `KURVA S - ${project.title} (${project.fiscalYear})`,
        },
      }),
    });

    if (!createRes.ok) {
      const errJson = await createRes.json();
      throw new Error(errJson.error?.message || 'Gagal membuat Google Spreadsheet baru.');
    }

    const createData = await createRes.json();
    spreadsheetId = createData.spreadsheetId;
  }

  // Update cell values via Google Sheets API v4
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: normalizedValues,
      }),
    }
  );

  if (!updateRes.ok) {
    const errJson = await updateRes.json();
    throw new Error(errJson.error?.message || 'Gagal memperbarui data Google Spreadsheet.');
  }

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return {
    spreadsheetId: spreadsheetId!,
    spreadsheetUrl,
  };
}

/**
 * Reads weekly actual values from a Google Spreadsheet ID and updates the project state.
 * First attempts public CSV fetch (works for any public sheet without API key/OAuth).
 * If that fails, falls back to Google Sheets API v4 with token.
 */
export async function importFromGoogleSheets(
  spreadsheetIdInput: string,
  accessToken: string | undefined,
  currentProject: ProjectInfo
): Promise<ProjectInfo> {
  let cleanId = spreadsheetIdInput.trim();
  if (cleanId.includes('/d/')) {
    cleanId = cleanId.split('/d/')[1].split('/')[0];
  }

  let rows: string[][] = [];

  // Try 0: If Google Apps Script Web App URL is provided
  if (cleanId.startsWith('https://script.google.com')) {
    try {
      const proxyRes = await fetch('/api/sheets-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptUrl: cleanId, method: 'GET' }),
      });
      const proxyData = await proxyRes.json();
      if (proxyData.success && proxyData.result && Array.isArray(proxyData.result.values)) {
        rows = proxyData.result.values;
      }
    } catch (err) {
      console.warn('Apps script import failed:', err);
    }
  }

  // Try 1: Public CSV Export endpoint (No OAuth or API Key required!)
  if (rows.length === 0 && !cleanId.startsWith('https://script.google.com')) {
    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv`;
      const csvRes = await fetch(csvUrl);
      if (csvRes.ok) {
        const csvText = await csvRes.text();
        if (csvText && !csvText.includes('<!DOCTYPE html>')) {
          rows = parseCSV(csvText);
        }
      }
    } catch (err) {
      console.warn('Public CSV fetch failed, trying API fallback...', err);
    }
  }

  // Try 2: Google Sheets API v4 fallback (if public fetch failed or returned HTML)
  if (rows.length === 0 && accessToken) {
    const range = 'Sheet1!A1:ZZ500';
    const fetchRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(range)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (fetchRes.ok) {
      const data = await fetchRes.json();
      rows = data.values || [];
    } else {
      const errJson = await fetchRes.json();
      throw new Error(errJson.error?.message || 'Gagal membaca Google Spreadsheet.');
    }
  }

  if (rows.length === 0) {
    throw new Error(
      'Gagal membaca Google Spreadsheet. Pastikan Google Sheet Anda disetting: "Siapa saja yang memiliki link dapat melihat" (Anyone with link can view).'
    );
  }

  // Find header row (starts with NO and URAIAN PEKERJAAN)
  const headerIndex = rows.findIndex(
    (r) => r && r[0] && String(r[0]).trim().toUpperCase() === 'NO' && r[1] && String(r[1]).toUpperCase().includes('URAIAN')
  );

  if (headerIndex === -1) {
    throw new Error('Header tabel Kurva S (NO, URAIAN PEKERJAAN, M1, M2...) tidak ditemukan di Google Spreadsheet.');
  }

  const headerRow = rows[headerIndex];
  // Dynamically locate M1 column index
  let m1ColIndex = headerRow.findIndex(
    (cell: any) => cell && String(cell).trim().toUpperCase() === 'M1'
  );
  if (m1ColIndex === -1) {
    m1ColIndex = 9; // default fallback if M1 header not found
  }

  // Dynamically locate CATATAN MK column index
  const noteColIndex = headerRow.findIndex(
    (cell: any) => cell && String(cell).trim().toUpperCase().includes('CATATAN')
  );

  const updatedCategories = currentProject.categories.map((cat) => {
    const updatedItems = cat.items.map((item) => {
      // Find row matching itemNo or description
      const itemRow = rows.find(
        (r, idx) =>
          idx > headerIndex &&
          r &&
          ((r[0] && String(r[0]).trim() === String(item.itemNo).trim()) ||
            (r[1] && String(r[1]).toLowerCase().includes(item.description.toLowerCase().substring(0, 15))))
      );

      if (!itemRow) return item;

      const newActual: Record<number, number> = { ...item.weeklyActual };
      let newConsultantNote = item.consultantNote;

      // Extract Consultant Note if present
      if (noteColIndex !== -1 && itemRow[noteColIndex] !== undefined) {
        newConsultantNote = String(itemRow[noteColIndex]).trim() || item.consultantNote;
      }

      // Columns starting at m1ColIndex for M1, M2... MN
      for (let w = 1; w <= currentProject.totalWeeks; w++) {
        const colVal = itemRow[m1ColIndex + (w - 1)];
        if (colVal !== undefined && colVal !== '') {
          // Parse percentage value
          let cleanVal = String(colVal).replace('%', '').trim();
          if (cleanVal.includes('(P:')) {
            cleanVal = cleanVal.split('(')[0].trim();
          }
          const parsed = parseFloat(cleanVal);
          if (!isNaN(parsed)) {
            newActual[w] = parsed;
          }
        }
      }

      return {
        ...item,
        weeklyActual: newActual,
        consultantNote: newConsultantNote,
      };
    });

    return {
      ...cat,
      items: updatedItems,
    };
  });

  return {
    ...currentProject,
    categories: updatedCategories,
    sheetsConfig: {
      ...currentProject.sheetsConfig,
      spreadsheetId: cleanId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}/edit`,
      lastSyncedAt: new Date().toLocaleString('id-ID'),
    },
  };
}
