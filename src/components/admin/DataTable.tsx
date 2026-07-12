import { useState, useMemo, useEffect, ReactNode } from "react";
import { Search } from "lucide-react";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  accessor?: (row: T) => string | number;
};

export function DataTable<T extends { id: string }>({
  rows, columns, searchKeys, actions, empty, pageSize = 25,
}: {
  rows: T[];
  columns: Column<T>[];
  searchKeys?: (keyof T)[];
  actions?: (row: T) => ReactNode;
  empty?: string;
  pageSize?: number;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const needle = q.toLowerCase();
    return rows.filter((r) =>
      (searchKeys ?? (Object.keys(r) as (keyof T)[])).some((k) =>
        String(r[k] ?? "").toLowerCase().includes(needle),
      ),
    );
  }, [rows, q, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  useMemo(() => { setPage(1); }, [q, rows.length]);
  const start = (currentPage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="p-4 border-b flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted text-sm border border-transparent focus:border-brand outline-none"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {filtered.length === 0 ? 0 : start + 1}–{Math.min(start + pageSize, filtered.length)} of {filtered.length}
          {filtered.length !== rows.length && <> (filtered from {rows.length})</>}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-2 font-medium text-muted-foreground">{c.header}</th>
              ))}
              {actions && <th className="px-4 py-2 font-medium text-muted-foreground text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-muted-foreground">{empty ?? "No results"}</td></tr>
            )}
            {paged.map((row) => (
              <tr key={row.id} className="border-t hover:bg-muted/30">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3">
                    {c.render ? c.render(row) : c.accessor ? c.accessor(row) : String((row as Record<string, unknown>)[c.key] ?? "")}
                  </td>
                ))}
                {actions && <td className="px-4 py-3 text-right">{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="p-3 border-t flex items-center justify-between text-xs">
          <div className="text-muted-foreground">Page {currentPage} of {totalPages}</div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={currentPage === 1} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-muted">« First</button>
            <button onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-muted">‹ Prev</button>
            <button onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-muted">Next ›</button>
            <button onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-muted">Last »</button>
          </div>
        </div>
      )}
    </div>
  );
}


export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    pending: "bg-amber-100 text-amber-800",
    banned: "bg-red-100 text-red-800",
    suspended: "bg-red-100 text-red-800",
    contacted: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-gray-200 text-gray-700",
    inactive: "bg-gray-200 text-gray-700",
  };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-muted text-foreground"}`}>{status}</span>;
}
