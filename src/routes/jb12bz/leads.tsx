import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, StatusPill } from "@/components/admin/DataTable";
import { adminListLeads, adminUpdateLeadStatus } from "@/lib/admin-catalog.functions";
import { Check, Clock, Phone } from "lucide-react";


type Row = {
  id: string; user_id: string; restaurant_id: string | null; meal_slug: string | null;
  city: string | null; request_type: string; status: string; created_at: string;
  restaurants?: { name: string; city: string } | null;
  profiles?: { display_name: string | null } | null;
};

export const Route = createFileRoute("/jb12bz/leads")({
  head: () => ({ meta: [{ title: "Leads — MealBeta Admin" }] }),
  component: LeadsPage,
});

function LeadsPage() {
  const qc = useQueryClient();
  const list = useServerFn(adminListLeads);
  const upd = useServerFn(adminUpdateLeadStatus);
  const { data: rows = [], isLoading, error } = useQuery({ queryKey: ["admin", "leads"], queryFn: () => list() as unknown as Promise<Row[]> });
  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: string }) => upd({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "leads"] }),
  });

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const filtered = statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter);

  return (
    <div>
      <PageHeader title="Restaurant leads" subtitle="Customer requests sent to restaurants from the app." />
      {error && <div className="mb-4 text-sm p-3 rounded border border-destructive/30 bg-destructive/5 text-destructive">{(error as Error).message}</div>}
      <div className="mb-3 flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Filter status:</span>
        {["all", "pending", "contacted", "completed", "cancelled"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-2.5 py-1 rounded-full border ${statusFilter === s ? "bg-brand text-brand-foreground border-brand" : "bg-card"}`}>{s}</button>
        ))}
      </div>
      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : filtered.length === 0 ? (
        <div className="bg-card border rounded-xl p-10 text-center text-sm text-muted-foreground">No leads match this filter.</div>
      ) : (
        <DataTable<Row>
          rows={filtered}
          searchKeys={["meal_slug", "city", "status", "request_type"]}

          columns={[
            { key: "user", header: "Customer", render: (r) => r.profiles?.display_name ?? "—" },
            { key: "restaurant", header: "Restaurant", render: (r) => r.restaurants?.name ?? "—" },
            { key: "meal", header: "Meal", render: (r) => r.meal_slug ?? "—" },
            { key: "city", header: "City", render: (r) => r.city ?? "—" },
            { key: "type", header: "Type", render: (r) => r.request_type },
            { key: "status", header: "Status", render: (r) => <StatusPill status={r.status} /> },
            { key: "date", header: "Date", render: (r) => new Date(r.created_at).toLocaleDateString() },
          ]}
          actions={(r) => (
            <div className="flex items-center gap-1 justify-end">
              {r.status !== "contacted" && <button title="Mark contacted" onClick={() => setStatus.mutate({ id: r.id, status: "contacted" })} className="p-1.5 rounded hover:bg-blue-50 text-blue-700"><Phone className="h-4 w-4" /></button>}
              {r.status !== "completed" && <button title="Complete" onClick={() => setStatus.mutate({ id: r.id, status: "completed" })} className="p-1.5 rounded hover:bg-green-50 text-green-700"><Check className="h-4 w-4" /></button>}
              {r.status !== "pending" && <button title="Reopen" onClick={() => setStatus.mutate({ id: r.id, status: "pending" })} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Clock className="h-4 w-4" /></button>}
            </div>
          )}
        />
      )}
    </div>
  );
}
