/** Client-side PDF text extraction via pdf.js */

const MAX_PAGES = 40;
const MAX_CHARS = 40000;

export async function extractPdfText(file) {
  if (typeof window === 'undefined') {
    throw new Error('PDF extraction only works in the browser');
  }
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages = Math.min(doc.numPages, MAX_PAGES);
  const parts = [];

  for (let i = 1; i <= pages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
    if (text.trim()) parts.push(text.trim());
    if (parts.join('\n\n').length >= MAX_CHARS) break;
  }

  const combined = parts.join('\n\n').slice(0, MAX_CHARS).trim();
  if (!combined) {
    throw new Error(
      'No text found in this PDF. It may be scanned images — paste the text instead.'
    );
  }
  return combined;
}
