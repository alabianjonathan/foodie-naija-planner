import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminListChefs, adminUpdateChef } from "@/lib/admin-chefs.functions";
import { PageHeader } from "@/components/admin/PageHeader";
import { toast } from "sonner";
import { CheckCircle2, XCircle, ShieldCheck, Star } from "lucide-react";

export const Route = createFileRoute("/jb12bz/chefs")({ component: AdminChefsPage });

function AdminChefsPage() {
  const list = useServerFn(adminListChefs);
  const update = useServerFn(adminUpdateChef);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "chefs"], queryFn: () => list() });

  const mut = useMutation({
    mutationFn: (v: { id: string; status?: any; verified?: boolean; featured?: boolean; plan?: any }) =>
      update({ data: v as any }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "chefs"] }); toast.success("Updated"); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div>
      <PageHeader title="Chefs" subtitle="Approve, verify, and manage chef profiles." />
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase">
            <tr>
              <th className="p-3">Business</th>
              <th className="p-3">City</th>
              <th className="p-3">Plan</th>
              <th className="p-3">Status</th>
              <th className="p-3">Flags</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((c: any) => (
              <tr key={c.id} className="border-b">
                <td className="p-3">
                  <div className="font-semibold">{c.business_name}</div>
                  <div className="text-xs text-muted-foreground">{c.full_name} · {c.email}</div>
                </td>
                <td className="p-3 text-xs">{c.area ? `${c.area}, ` : ""}{c.city}</td>
                <td className="p-3">
                  <select
                    value={c.plan}
                    onChange={(e) => mut.mutate({ id: c.id, plan: e.target.value as any })}
                    className="rounded border px-2 py-1 text-xs"
                  >
                    <option value="basic">Basic</option>
                    <option value="featured">Featured</option>
                    <option value="premium">Premium</option>
                  </select>
                </td>
                <td className="p-3">
                  <select
                    value={c.status}
                    onChange={(e) => mut.mutate({ id: c.id, status: e.target.value as any })}
                    className="rounded border px-2 py-1 text-xs"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {c.verified && <ShieldCheck className="h-4 w-4 text-leaf" />}
                    {c.featured && <Star className="h-4 w-4 text-warm fill-warm" />}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => mut.mutate({ id: c.id, verified: !c.verified })}
                      className="text-xs px-2 py-1 rounded bg-secondary hover:bg-secondary/80"
                    >
                      {c.verified ? <XCircle className="h-3.5 w-3.5 inline" /> : <CheckCircle2 className="h-3.5 w-3.5 inline" />}
                      {c.verified ? " Unverify" : " Verify"}
                    </button>
                    <button
                      onClick={() => mut.mutate({ id: c.id, featured: !c.featured })}
                      className="text-xs px-2 py-1 rounded bg-secondary hover:bg-secondary/80"
                    >
                      {c.featured ? "Unfeature" : "Feature"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && (data ?? []).length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">No chefs yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
