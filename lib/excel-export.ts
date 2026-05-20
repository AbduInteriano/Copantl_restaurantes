import * as XLSX from "xlsx";

export function rowsToExcelBuffer(
  sheetName: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
): Buffer {
  const data = [headers, ...rows.map((row) => row.map((c) => c ?? ""))];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  const arrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return Buffer.from(arrayBuffer);
}
