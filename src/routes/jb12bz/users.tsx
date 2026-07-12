import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, StatusPill } from "@/components/admin/DataTable";
import { sampleUsers, type AdminUser } from "@/data/admin-sample";
import { Ban, Trash2, ShieldCheck, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/jb12bz/users")({
  head: () => ({ meta: [{ title: "Users — MealBeta Admin" }] }),
  component: UsersPage,
});

function UsersPage() {
  const { adminRole } = useRouteContext({ from: "/jb12bz" });
  const [users, setUsers] = useState<AdminUser[]>(sampleUsers);

  const updateRole = (id: string, role: AdminUser["role"]) =>
    setUsers((u) => u.map((x) => (x.id === id ? { ...x, role } : x)));
  const toggleBan = (id: string) =>
    setUsers((u) => u.map((x) => (x.id === id ? { ...x, status: x.status === "banned" ? "active" : "banned" } : x)));
  const remove = (id: string) => setUsers((u) => u.filter((x) => x.id !== id));

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage customer accounts, roles and status." />
      <DataTable<AdminUser>
        rows={users}
        searchKeys={["name", "email", "phone", "city", "role"]}
        columns={[
          { key: "name", header: "Name", render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.email}</div></div> },
          { key: "phone", header: "Phone" },
          { key: "city", header: "City" },
          {
            key: "role", header: "Role", render: (r) => (
              <select
                value={r.role}
                onChange={(e) => updateRole(r.id, e.target.value as AdminUser["role"])}
                className="text-xs bg-muted rounded px-2 py-1 border"
              >
                <option value="user">user</option>
                <option value="restaurant">restaurant</option>
                <option value="admin">admin</option>
                {adminRole === "super_admin" && <option value="super_admin">super_admin</option>}
              </select>
            ),
          },
          { key: "status", header: "Status", render: (r) => <StatusPill status={r.status} /> },
          { key: "joined", header: "Joined" },
        ]}
        actions={(r) => (
          <div className="flex items-center gap-1 justify-end">
            <button title={r.status === "banned" ? "Unban" : "Ban"} onClick={() => toggleBan(r.id)} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
              {r.status === "banned" ? <RotateCcw className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
            </button>
            <button title="Verify" className="p-1.5 rounded hover:bg-muted text-muted-foreground"><ShieldCheck className="h-4 w-4" /></button>
            {adminRole === "super_admin" && (
              <button title="Delete" onClick={() => remove(r.id)} className="p-1.5 rounded hover:bg-red-50 text-destructive"><Trash2 className="h-4 w-4" /></button>
            )}
          </div>
        )}
      />
    </div>
  );
}
