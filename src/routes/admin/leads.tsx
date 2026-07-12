import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, StatusPill } from "@/components/admin/DataTable";
import { sampleLeads, type AdminLead } from "@/data/admin-sample";
import { Download } from "lucide-react";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({ meta: [{ title: "Leads — MealBeta Admin" }] }),
  component: LeadsPage,
});

function LeadsPage() {
  const [rows, setRows] = useState<AdminLead[]>(sampleLeads);
  const setStatus = (id: string, status: AdminLead["status"]) =>
    setRows((rs) => rs.map((r) => r.id === id ? { ...r, status } : r));

  const exportCsv = () => {
    const headers = ["User", "Restaurant", "Meal", "City", "Request", "Status", "Date"];
    const csv = [headers, ...rows.map((r) => [r.user, r.restaurant, r.meal, r.city, r.requestType, r.status, r.date])]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `mealbeta-leads-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Restaurant leads"
        subtitle="User meal requests routed to restaurants."
        actions={<button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border bg-card text-sm hover:bg-muted"><Download className="h-4 w-4" /> Export CSV</button>}
      />
      <DataTable<AdminLead>
        rows={rows}
        searchKeys={["user", "restaurant", "meal", "city"]}
        columns={[
          { key: "user", header: "User" },
          { key: "restaurant", header: "Restaurant" },
          { key: "meal", header: "Meal" },
          { key: "city", header: "City" },
          { key: "req", header: "Request", render: (r) => r.requestType },
          {
            key: "status", header: "Status", render: (r) => (
              <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value as AdminLead["status"])} className="text-xs bg-transparent border-0 outline-none">
                <option value="pending">pending</option>
                <option value="contacted">contacted</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
            ),
          },
          { key: "state", header: "", render: (r) => <StatusPill status={r.status} /> },
          { key: "date", header: "Date" },
        ]}
      />
    </div>
  );
}
