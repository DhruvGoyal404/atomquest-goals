export function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  const headers = Object.keys(rows[0] ?? {});
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\n");
  downloadBlob(filename, new Blob([csv], { type: "text/csv;charset=utf-8;" }));
}

export async function downloadExcel(filename: string, rows: Record<string, string | number>[]) {
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Goals");
  XLSX.writeFile(workbook, filename);
}

export async function downloadPdfFromElement(filename: string, element: HTMLElement) {
  const [{ default: html2canvas }, { default: JsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  
  // Clone element to avoid modifying DOM
  const clonedElement = element.cloneNode(true) as HTMLElement;
  
  // Remove SVG elements and chart components that may have unsupported color functions (oklab, etc)
  clonedElement.querySelectorAll("svg, [role='img']").forEach((el) => {
    el.remove();
  });
  
  const canvas = await html2canvas(clonedElement, {
    scale: 2,
    backgroundColor: "#ffffff",
    allowTaint: true,
    useCORS: true,
    logging: false, // Suppress oklab warnings
  });
  
  const image = canvas.toDataURL("image/png");
  const pdf = new JsPDF("p", "mm", "a4");
  const width = pdf.internal.pageSize.getWidth();
  const height = (canvas.height * width) / canvas.width;
  pdf.addImage(image, "PNG", 0, 0, width, Math.min(height, pdf.internal.pageSize.getHeight()));
  pdf.save(filename);
}

function csvCell(value: string | number | undefined) {
  const text = String(value ?? "");
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
