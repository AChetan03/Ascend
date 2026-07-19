// Client-only resume text extraction. Imports heavy libs lazily.
// Supports PDF, DOCX, TXT, and image files (PNG/JPG/WEBP) via OCR fallback.

const MIN_TEXT_LENGTH = 50;

export async function extractResumeText(
  file: File,
  onProgress?: (msg: string) => void,
): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return extractPdf(file, onProgress);
  if (name.endsWith(".docx")) return extractDocx(file);
  if (name.endsWith(".txt")) return await file.text();
  if (/\.(png|jpe?g|webp|bmp)$/.test(name)) return ocrImage(file, onProgress);
  throw new Error("Unsupported file type. Upload PDF, DOCX, TXT, or an image (PNG/JPG).");
}

async function extractPdf(file: File, onProgress?: (msg: string) => void): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdfjs as any).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parts.push(content.items.map((it: any) => ("str" in it ? it.str : "")).join(" "));
  }
  const text = parts.join("\n\n").trim();
  if (text.length >= MIN_TEXT_LENGTH) return text;

  // Scanned/image PDF — fall back to OCR by rendering each page to a canvas.
  onProgress?.("This looks like a scanned PDF. Running OCR — this may take a minute…");
  const ocrParts: string[] = [];
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const maxPages = Math.min(doc.numPages, 5);
    for (let i = 1; i <= maxPages; i++) {
      onProgress?.(`OCR page ${i} of ${maxPages}…`);
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
      const { data } = await worker.recognize(canvas);
      ocrParts.push(data.text);
    }
  } finally {
    await worker.terminate();
  }
  return ocrParts.join("\n\n").trim();
}

async function ocrImage(file: File, onProgress?: (msg: string) => void): Promise<string> {
  onProgress?.("Running OCR on your image…");
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(file);
    return data.text.trim();
  } finally {
    await worker.terminate();
  }
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return result.value.trim();
}
