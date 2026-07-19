import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import * as XLSX from "xlsx";
import { PageHeader } from "@/components/admin/PageHeader";
import { importRestaurantsFromRows, type ImportReport } from "@/lib/restaurant-import.functions";
import { Upload, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/jb12bz/import-restaurants")({
  head: () => ({ meta: [{ title: "Import Restaurants — MealBeta Admin" }] }),
  component: ImportPage,
});

type RawRow = Record<string, unknown>;

function normalizeRows(raw: RawRow[]) {
  return raw
    .map((r) => {
      const g = (k: string) => {
        const v = r[k];
        return v == null ? "" : String(v).trim();
      };
      const num = (k: string) => {
        const v = r[k];
        if (v == null || v === "") return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };
      return {
        chain: g("Restaurant Chain"),
        branch: g("Branch Name"),
        address: g("Full Address"),
        area: g("Area"),
        city: g("City"),
        state: g("State"),
        latitude: num("Latitude"),
        longitude: num("Longitude"),
        googleMapsUrl: g("Google Maps URL"),
        phone: g("Phone Number"),
        categories: g("Food Categories"),
        swallow: g("Swallow Types"),
        rice: g("Rice Types"),
        soup: g("Soup Types"),
        beans: g("Beans Types"),
        yam: g("Yam Types"),
        plantain: g("Plantain Types"),
        sourceUrl: g("Source URL"),
        verificationStatus: g("Verification Status"),
      };
    })
    .filter((r) => r.chain && r.city);
}

function ImportPage() {
  const runImport = useServerFn(importRestaurantsFromRows);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ReturnType<typeof normalizeRows>>([]);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sheetName, setSheetName] = useState<string>("");
  const [dryRun, setDryRun] = useState(false);
  const [wipeFirst, setWipeFirst] = useState(false);

  const onFile = async (f: File) => {
    setFile(f); setReport(null); setErr(null); setPreview([]);
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      // Prefer "All Branches"; otherwise first sheet
      const pick = wb.SheetNames.find((s) => /all branches/i.test(s)) ?? wb.SheetNames[0];
      setSheetName(pick);
      const ws = wb.Sheets[pick];
      const rows = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: "" });
      setPreview(normalizeRows(rows));
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const submit = async () => {
    if (!preview.length) return;
    if (wipeFirst && !dryRun) {
      const ok = window.confirm(`This will DELETE all ${preview.length ? "existing" : ""} restaurants and their food links, then import ${preview.length} rows. Continue?`);
      if (!ok) return;
    }
    setBusy(true); setErr(null); setReport(null);
    try {
      const res = await runImport({ data: { rows: preview, dryRun, wipeFirst } });
      setReport(res);
    } catch (e) {
      setErr((e as Error).message ?? "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Import restaurants"
        subtitle="Upload the MealBeta restaurant chains Excel file. Existing rows are updated (never overwritten with blanks); new rows are added and marked verified."
      />

      <div className="bg-card border rounded-xl p-5 space-y-4">
        <label className="flex items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer hover:bg-muted/50 transition">
          <Upload className="h-6 w-6 text-brand" />
          <div>
            <div className="text-sm font-medium">{file ? file.name : "Choose .xlsx file"}</div>
            <div className="text-xs text-muted-foreground">Detected sheet: {sheetName || "—"} • Rows ready: {preview.length}</div>
          </div>
          <input
            type="file" accept=".xlsx,.xls" className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
            Dry run (preview only, no writes)
          </label>
          <label className="flex items-center gap-2 text-sm text-destructive">
            <input type="checkbox" checked={wipeFirst} onChange={(e) => setWipeFirst(e.target.checked)} />
            Replace all (delete every existing restaurant first)
          </label>
          <button
            disabled={!preview.length || busy}
            onClick={submit}
            className="px-4 py-2 rounded-lg bg-brand text-brand-foreground text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "Importing…" : dryRun ? "Run dry-run" : `Import ${preview.length} rows`}
          </button>
        </div>

        {err && (
          <div className="text-sm p-3 rounded border border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2">
            <XCircle className="h-4 w-4 mt-0.5" /> {err}
          </div>
        )}

        {preview.length > 0 && !report && (
          <div className="border rounded-lg overflow-auto max-h-64 text-xs">
            <table className="w-full">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-2">Chain</th>
                  <th className="text-left p-2">Branch</th>
                  <th className="text-left p-2">City</th>
                  <th className="text-left p-2">State</th>
                  <th className="text-left p-2">Phone</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 20).map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{r.chain}</td>
                    <td className="p-2">{r.branch}</td>
                    <td className="p-2">{r.city}</td>
                    <td className="p-2">{r.state}</td>
                    <td className="p-2">{r.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 20 && <div className="p-2 text-muted-foreground">…and {preview.length - 20} more</div>}
          </div>
        )}

        {report && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
              <Stat label="Total" value={report.totalRows} />
              <Stat label="Created" value={report.created} tone="good" />
              <Stat label="Updated" value={report.updated} tone="good" />
              <Stat label="Foods" value={report.foodsCreated} />
              <Stat label="Links" value={report.linksCreated} />
              <Stat label="Failed" value={report.failed} tone={report.failed > 0 ? "bad" : undefined} />
            </div>
            {report.failed > 0 && (
              <div className="border rounded-lg overflow-auto max-h-64 text-xs">
                <table className="w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-2">Chain</th>
                      <th className="text-left p-2">Branch</th>
                      <th className="text-left p-2">City</th>
                      <th className="text-left p-2">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.details.filter((d) => d.action === "failed").map((d, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{d.chain}</td>
                        <td className="p-2">{d.branch}</td>
                        <td className="p-2">{d.city}</td>
                        <td className="p-2 text-destructive">{d.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-leaf">
              <CheckCircle2 className="h-4 w-4" /> Import complete{dryRun ? " (dry run — no changes saved)" : ""}.
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground flex items-start gap-2 pt-2 border-t">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          Existing restaurants matched by chain+branch+city, then by phone. Never overwrites existing values with blanks. Food items are normalized against a Nigerian alias map and linked to canonical categories.
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "good" | "bad" }) {
  const color = tone === "good" ? "text-leaf" : tone === "bad" ? "text-destructive" : "text-charcoal";
  return (
    <div className="bg-muted/40 rounded-lg p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}
