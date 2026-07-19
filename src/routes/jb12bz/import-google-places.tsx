import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  importRestaurantsFromGooglePlaces,
  type GoogleImportReport,
} from "@/lib/restaurant-google-import.functions";
import { Upload, Loader2, CheckCircle2, XCircle, AlertTriangle, MapPin, Star } from "lucide-react";

export const Route = createFileRoute("/jb12bz/import-google-places")({
  head: () => ({ meta: [{ title: "Import from Google Places — MealBeta Admin" }] }),
  component: ImportPage,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawRow = Record<string, any>;

function ImportPage() {
  const run = useServerFn(importRestaurantsFromGooglePlaces);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<GoogleImportReport | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [skipInvalid, setSkipInvalid] = useState(true);

  const onFile = async (f: File) => {
    setFile(f); setReport(null); setErr(null); setRows([]);
    try {
      const text = await f.text();
      const parsed = JSON.parse(text);
      const arr: RawRow[] = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.data) ? parsed.data : [];
      if (!arr.length) throw new Error("No records found. Expecting a JSON array of Google Places results.");
      setRows(arr);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const submit = async () => {
    if (!rows.length) return;
    setBusy(true); setErr(null); setReport(null);
    try {
      // Send in batches of 500 to keep payloads reasonable
      const BATCH = 500;
      const merged: GoogleImportReport = { totalRows: 0, created: 0, updated: 0, skipped: 0, failed: 0, duplicatesInBatch: 0, averageScore: 0, details: [] };
      let scoreSum = 0; let scoreN = 0;
      for (let i = 0; i < rows.length; i += BATCH) {
        const chunk = rows.slice(i, i + BATCH);
        const r = await run({ data: { rows: chunk, dryRun, skipInvalid } });
        merged.totalRows += r.totalRows; merged.created += r.created; merged.updated += r.updated;
        merged.skipped += r.skipped; merged.failed += r.failed; merged.duplicatesInBatch += r.duplicatesInBatch;
        merged.details.push(...r.details);
        if (r.averageScore) { scoreSum += r.averageScore * (r.created + r.updated); scoreN += r.created + r.updated; }
      }
      merged.averageScore = scoreN ? Math.round((scoreSum / scoreN) * 100) / 100 : 0;
      setReport(merged);
    } catch (e) {
      setErr((e as Error).message ?? "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Import from Google Places"
        subtitle="Upload Google Places JSON. Records are deduplicated by place_id, addresses validated, and a MealBeta Score is calculated from rating, reviews, and data completeness."
      />

      <div className="bg-card border rounded-xl p-5 space-y-4">
        <label className="flex items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer hover:bg-muted/50 transition">
          <Upload className="h-6 w-6 text-brand" />
          <div>
            <div className="text-sm font-medium">{file ? file.name : "Choose Google Places .json file"}</div>
            <div className="text-xs text-muted-foreground">{rows.length ? `${rows.length} records ready` : "Expects a JSON array with title, address, placeId, location, totalScore, reviewsCount…"}</div>
          </div>
          <input type="file" accept="application/json,.json" className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
            Dry run (preview only, no writes)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={skipInvalid} onChange={(e) => setSkipInvalid(e.target.checked)} />
            Skip records missing full address
          </label>
          <button disabled={!rows.length || busy} onClick={submit}
            className="px-4 py-2 rounded-lg bg-brand text-brand-foreground text-sm font-medium disabled:opacity-50 flex items-center gap-2">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "Importing…" : dryRun ? "Run dry-run" : `Import ${rows.length} records`}
          </button>
        </div>

        {err && (
          <div className="text-sm p-3 rounded border border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2">
            <XCircle className="h-4 w-4 mt-0.5" /> {err}
          </div>
        )}

        {rows.length > 0 && !report && (
          <div className="border rounded-lg overflow-auto max-h-72 text-xs">
            <table className="w-full">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-2">Title</th>
                  <th className="text-left p-2">Address</th>
                  <th className="text-left p-2">City</th>
                  <th className="text-left p-2">Rating</th>
                  <th className="text-left p-2">Reviews</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 25).map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2 font-medium">{String(r.title ?? "")}</td>
                    <td className="p-2 max-w-[320px] truncate">{String(r.address ?? "")}</td>
                    <td className="p-2">{String(r.city ?? "")}</td>
                    <td className="p-2">⭐ {r.totalScore ?? "—"}</td>
                    <td className="p-2">{r.reviewsCount ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 25 && <div className="p-2 text-muted-foreground">…and {rows.length - 25} more</div>}
          </div>
        )}

        {report && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-7 gap-2 text-sm">
              <Stat label="Total" value={report.totalRows} />
              <Stat label="Created" value={report.created} tone="good" />
              <Stat label="Updated" value={report.updated} tone="good" />
              <Stat label="Skipped" value={report.skipped} />
              <Stat label="Dup in batch" value={report.duplicatesInBatch} />
              <Stat label="Failed" value={report.failed} tone={report.failed > 0 ? "bad" : undefined} />
              <Stat label="Avg score" value={report.averageScore} />
            </div>
            <div className="border rounded-lg overflow-auto max-h-80 text-xs">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2">Title</th>
                    <th className="text-left p-2">City</th>
                    <th className="text-left p-2">Action</th>
                    <th className="text-left p-2">Score</th>
                    <th className="text-left p-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {report.details.slice(0, 300).map((d, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{d.title}</td>
                      <td className="p-2">{d.city}</td>
                      <td className="p-2">
                        <span className={
                          d.action === "failed" ? "text-destructive" :
                          d.action === "skipped" ? "text-muted-foreground" :
                          "text-leaf"
                        }>{d.action}</span>
                      </td>
                      <td className="p-2">{d.score ?? "—"}</td>
                      <td className="p-2 text-muted-foreground">{d.reason ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-2 text-sm text-leaf">
              <CheckCircle2 className="h-4 w-4" /> Import complete{dryRun ? " (dry run — no changes saved)" : ""}.
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground flex items-start gap-2 pt-2 border-t">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          Dedup: matches existing records by <code>place_id</code>, then by slug. MealBeta Score = rating (0–40) + review trust (0–30, log scale) + data completeness (0–30). Records auto-verify at ⭐≥4.0 with 20+ reviews and complete data.
          <MapPin className="h-3 w-3 ml-2" /> <Star className="h-3 w-3" />
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
