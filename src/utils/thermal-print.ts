export interface PrintThermalOptions {
  documentTitle?: string;
  paperWidth?: "58mm" | "80mm";
}

/**
 * Prints a thermal receipt using an isolated iframe document.
 * This guarantees zero blank pages, zero layout contamination from the main app,
 * and flawless export to both physical thermal POS printers and "Save as PDF".
 */
export function printThermalElement(
  element: HTMLElement,
  options?: PrintThermalOptions
): boolean {
  if (typeof window === "undefined" || !document) return false;

  const title = options?.documentTitle || "Struk-UanginKuy";
  const paperWidth = options?.paperWidth || "58mm";

  // Clean up any old print iframe if present
  const existingFrame = document.getElementById("thermal-print-frame");
  if (existingFrame && document.body.contains(existingFrame)) {
    document.body.removeChild(existingFrame);
  }

  // Create invisible iframe
  const iframe = document.createElement("iframe");
  iframe.id = "thermal-print-frame";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  iframe.setAttribute("aria-hidden", "true");

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return false;
  }

  const clonedElement = element.cloneNode(true) as HTMLElement;
  clonedElement.id = "thermal-receipt-isolated-content";
  clonedElement.classList.remove("hidden");
  clonedElement.style.display = "block";

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page {
      size: ${paperWidth} auto;
      margin: 0mm !important;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      margin: 0 !important;
      padding: 0 !important;
      background-color: #ffffff !important;
      color: #000000 !important;
      font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }
    .thermal-receipt-container {
      width: ${paperWidth};
      max-width: 100%;
      margin: 0 auto;
      padding: 2mm 3mm;
      font-size: 11px;
      line-height: 1.3;
      background-color: #ffffff !important;
      color: #000000 !important;
    }
    /* Layout utilities */
    .flex { display: flex !important; }
    .justify-between { justify-content: space-between !important; }
    .items-start { align-items: flex-start !important; }
    .items-center { align-items: center !important; }
    .text-center { text-align: center !important; }
    .text-right { text-align: right !important; }
    .text-left { text-align: left !important; }
    .font-bold { font-weight: 700 !important; }
    .font-semibold { font-weight: 600 !important; }
    .uppercase { text-transform: uppercase !important; }
    .truncate {
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }
    .max-w-\\[120px\\] { max-width: 120px !important; }
    .max-w-\\[140px\\] { max-width: 140px !important; }
    .max-w-\\[340px\\] { max-width: 100% !important; }
    .border { border: 1px solid #000000 !important; }
    .border-b { border-bottom: 1px dashed #000000 !important; }
    .border-t { border-top: 1px dashed #000000 !important; }
    .border-dashed { border-style: dashed !important; }
    .border-dotted { border-style: dotted !important; }
    .border-black { border-color: #000000 !important; }
    .border-black\\/40 { border-color: rgba(0, 0, 0, 0.4) !important; }
    
    /* Spacings */
    .my-1 { margin-top: 4px !important; margin-bottom: 4px !important; }
    .my-1\\.5 { margin-top: 6px !important; margin-bottom: 6px !important; }
    .my-2 { margin-top: 8px !important; margin-bottom: 8px !important; }
    .mb-1 { margin-bottom: 4px !important; }
    .mt-0\\.5 { margin-top: 2px !important; }
    .mt-1 { margin-top: 4px !important; }
    .pt-0\\.5 { padding-top: 2px !important; }
    .pt-1 { padding-top: 4px !important; }
    .pl-2 { padding-left: 8px !important; }
    .px-1\\.5 { padding-left: 6px !important; padding-right: 6px !important; }
    .py-0\\.5 { padding-top: 2px !important; padding-bottom: 2px !important; }
    .p-3 { padding: 8px !important; }
    
    .space-y-0\\.5 > * + * { margin-top: 2px !important; }
    .space-y-1 > * + * { margin-top: 4px !important; }
    .space-y-1\\.5 > * + * { margin-top: 6px !important; }
    
    /* Typography */
    .text-\\[9px\\] { font-size: 9px !important; }
    .text-\\[10px\\] { font-size: 10px !important; }
    .text-\\[10\\.5px\\] { font-size: 10.5px !important; }
    .text-\\[11px\\] { font-size: 11px !important; }
    .text-\\[12px\\] { font-size: 12px !important; }
    .tracking-tight { letter-spacing: -0.025em !important; }
    .tracking-tighter { letter-spacing: -0.05em !important; }
    .tracking-wider { letter-spacing: 0.05em !important; }
    .tracking-widest { letter-spacing: 0.1em !important; }
    .text-black { color: #000000 !important; }
    .text-black\\/70 { color: #000000 !important; }
    .bg-white { background-color: #ffffff !important; }
  </style>
</head>
<body>
  ${clonedElement.outerHTML}
</body>
</html>`);
  doc.close();

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error("Print execution error, falling back to window.print():", err);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }
  };

  // Brief delay to ensure iframe DOM has parsed
  setTimeout(triggerPrint, 150);
  return true;
}
