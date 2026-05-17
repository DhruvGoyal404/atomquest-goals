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

export type GoalExportRow = {
  employee: string;
  department: string;
  thrustArea: string;
  title: string;
  uomType: string;
  target: number;
  weightage: number;
  status: string;
  currentProgress: number;
  shared: string;
};

export type GoalPdfSummary = {
  totalGoals: number;
  approvedGoals: number;
  averageProgress: number;
  totalWeightage: number;
};

export async function downloadGoalsPdf(
  filename: string,
  rows: GoalExportRow[],
  summary?: GoalPdfSummary,
) {
  const { default: JsPDF } = await import("jspdf");
  const doc = new JsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text("AtomQuest Goals", margin, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text("FY 2026-27 goal sheet", margin, y + 12);
  doc.text(
    `Generated ${new Date().toLocaleString()}`,
    pageWidth - margin,
    y + 12,
    { align: "right" },
  );

  y += 18;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  if (summary) {
    const owner = rows[0]?.employee;
    const department = rows[0]?.department;
    if (owner) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      doc.text(owner, margin, y);
      if (department) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(110, 110, 110);
        doc.text(department, margin + doc.getTextWidth(owner) + 4, y);
      }
      y += 6;
    }

    const cards = [
      { label: "Total goals", value: String(summary.totalGoals) },
      { label: "Approved", value: String(summary.approvedGoals) },
      { label: "Avg progress", value: `${Math.round(summary.averageProgress * 1000) / 10}%` },
      { label: "Total weightage", value: `${summary.totalWeightage}%` },
    ];
    const cardWidth = (pageWidth - margin * 2 - 6 * (cards.length - 1)) / cards.length;
    const cardHeight = 16;
    cards.forEach((card, index) => {
      const x = margin + index * (cardWidth + 6);
      doc.setDrawColor(225, 225, 225);
      doc.setFillColor(248, 249, 251);
      doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      doc.text(card.label.toUpperCase(), x + 3, y + 5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(20, 20, 20);
      doc.text(card.value, x + 3, y + 12);
    });
    y += cardHeight + 8;
  }

  const columns: Array<{ key: keyof GoalExportRow; label: string; width: number; align?: "left" | "right" }> = [
    { key: "title", label: "Goal", width: 70 },
    { key: "thrustArea", label: "Thrust area", width: 40 },
    { key: "uomType", label: "UOM", width: 28 },
    { key: "target", label: "Target", width: 20, align: "right" },
    { key: "weightage", label: "Weight", width: 20, align: "right" },
    { key: "currentProgress", label: "Progress", width: 22, align: "right" },
    { key: "status", label: "Status", width: 25 },
    { key: "shared", label: "Shared", width: 18 },
  ];
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
  const usable = pageWidth - margin * 2;
  const scale = usable / totalWidth;
  columns.forEach((col) => { col.width = col.width * scale; });

  const rowPaddingX = 2.5;
  const lineHeight = 4.2;

  function drawHeader() {
    doc.setFillColor(30, 58, 138);
    doc.rect(margin, y, usable, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    let x = margin;
    columns.forEach((col) => {
      const tx = col.align === "right" ? x + col.width - rowPaddingX : x + rowPaddingX;
      doc.text(col.label, tx, y + 5.5, { align: col.align ?? "left" });
      x += col.width;
    });
    y += 8;
  }

  drawHeader();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);

  if (rows.length === 0) {
    doc.setTextColor(120, 120, 120);
    doc.text("No goals to export.", margin + rowPaddingX, y + 6);
  }

  rows.forEach((row, rowIndex) => {
    const cellLines: string[][] = columns.map((col) => {
      const raw = formatCell(col.key, row[col.key]);
      return doc.splitTextToSize(raw, col.width - rowPaddingX * 2) as string[];
    });
    const maxLines = Math.max(...cellLines.map((lines) => lines.length));
    const rowHeight = Math.max(7, maxLines * lineHeight + 2);

    if (y + rowHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeader();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
    }

    if (rowIndex % 2 === 0) {
      doc.setFillColor(247, 248, 250);
      doc.rect(margin, y, usable, rowHeight, "F");
    }

    let x = margin;
    columns.forEach((col, colIndex) => {
      const lines = cellLines[colIndex];
      const tx = col.align === "right" ? x + col.width - rowPaddingX : x + rowPaddingX;
      lines.forEach((line, lineIdx) => {
        doc.text(line, tx, y + 4.5 + lineIdx * lineHeight, { align: col.align ?? "left" });
      });
      x += col.width;
    });

    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y + rowHeight, margin + usable, y + rowHeight);
    y += rowHeight;
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} • AtomQuest Goals`,
      pageWidth / 2,
      pageHeight - 5,
      { align: "center" },
    );
  }

  doc.save(filename);
}

function formatCell(key: keyof GoalExportRow, value: string | number): string {
  if (value === null || value === undefined) return "";
  if (key === "currentProgress") {
    const num = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(num)) return String(value);
    return `${Math.round(num * 1000) / 10}%`;
  }
  if (key === "weightage") {
    return `${value}%`;
  }
  if (key === "status") {
    return String(value).replaceAll("_", " ");
  }
  return String(value);
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
