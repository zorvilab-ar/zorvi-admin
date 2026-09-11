"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function DownloadCsv({
  filename,
  rows,
}: {
  filename: string;
  rows: Record<string, string | number>[];
}) {
  function download() {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <Button type="button" variant="secondary" onClick={download}>
      <Download />
      Exportar CSV
    </Button>
  );
}
