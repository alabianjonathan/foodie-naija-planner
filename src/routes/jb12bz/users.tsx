import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, StatusPill } from "@/components/admin/DataTable";
import { listAllUsers, type AdminUserRow } from "@/lib/admin-users.functions";
import { Ban, Trash2, ShieldCheck, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/jb12bz/users")({
  head: () => ({ meta: [{ title: "Users — MealBeta Admin" }] }),
  component: UsersPage,
});

function UsersPage() {
  const { adminRole } = useRouteContext({ from: "/jb12bz" });
  const fetchUsers = useServerFn(listAllUsers);
  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => fetchUsers(),
  });

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage customer accounts, roles and status." />
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm p-3 mb-4">
          Failed to load users: {(error as Error).message}
        </div>
      ) : null}
      {isLoading ? (
        <div className="text-sm text-muted-foreground p-4">Loading users…</div>
      ) : (
        <DataTable<AdminUserRow>
          rows={users}
          searchKeys={["name", "email", "phone", "city", "role"]}
          columns={[
            { key: "name", header: "Name", render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.email}</div></div> },
            { key: "phone", header: "Phone" },
            { key: "city", header: "City" },
            { key: "role", header: "Role", render: (r) => <span className="text-xs bg-muted rounded px-2 py-1 border">{r.role}</span> },
            { key: "status", header: "Status", render: (r) => <StatusPill status={r.status} /> },
            { key: "joined", header: "Joined" },
          ]}
          actions={(r) => (
            <div className="flex items-center gap-1 justify-end">
              <button title={r.status === "banned" ? "Unban" : "Ban"} onClick={() => refetch()} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                {r.status === "banned" ? <RotateCcw className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
              </button>
              <button title="Verify" className="p-1.5 rounded hover:bg-muted text-muted-foreground"><ShieldCheck className="h-4 w-4" /></button>
              {adminRole === "super_admin" && (
                <button title="Delete" className="p-1.5 rounded hover:bg-red-50 text-destructive"><Trash2 className="h-4 w-4" /></button>
              )}
            </div>
          )}
        />
      )}
    </div>
  );
}

