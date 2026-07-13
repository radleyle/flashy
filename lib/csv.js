export function cardsToCsv(cards) {
  const escape = (v) => {
    const s = String(v ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const rows = [['term', 'definition', 'imageUrl', 'difficulty']];
  cards.forEach((c) => {
    rows.push([c.front || '', c.back || '', c.imageUrl || '', c.difficulty || '']);
  });
  return rows.map((r) => r.map(escape).join(',')).join('\n');
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Minimal CSV parser supporting quoted fields. */
export function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim());
  if (!lines.length) return [];

  const parseLine = (line) => {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',' || ch === '\t') {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out;
  };

  const rows = lines.map(parseLine);
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const hasHeader =
    header.includes('term') ||
    header.includes('front') ||
    header.includes('definition') ||
    header.includes('back');

  const dataRows = hasHeader ? rows.slice(1) : rows;
  const termIdx = hasHeader
    ? Math.max(header.indexOf('term'), header.indexOf('front'), 0)
    : 0;
  const defIdx = hasHeader
    ? Math.max(header.indexOf('definition'), header.indexOf('back'), 1)
    : 1;
  const imgIdx = hasHeader ? header.indexOf('imageurl') : -1;
  const diffIdx = hasHeader ? header.indexOf('difficulty') : -1;

  return dataRows
    .map((cols) => ({
      front: (cols[termIdx] || '').trim(),
      back: (cols[defIdx] || '').trim(),
      imageUrl: imgIdx >= 0 ? (cols[imgIdx] || '').trim() : '',
      difficulty: diffIdx >= 0 ? (cols[diffIdx] || '').trim() : '',
    }))
    .filter((c) => c.front || c.back);
}
