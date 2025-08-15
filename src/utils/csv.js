// src/utils/csv.js
export function exportToCsv(filename, rows) {
  if (!rows || !rows.length) {
    return;
  }
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(","),
    ...rows.map((row) =>
      keys
        .map((k) => {
          const val = row[k] === undefined || row[k] === null ? "" : String(row[k]);
          // escape
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(",")
    )
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
