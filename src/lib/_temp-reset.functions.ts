import { createServerFn } from "@tanstack/react-start";

export const tempResetAdminPassword = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const email = "jonathanjude22@gmail.com";
  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) throw listErr;
  const user = list.users.find((u) => u.email?.toLowerCase() === email);
  if (!user) throw new Error("user not found");
  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: "$/jb12bz-login#DC" });
  if (error) throw error;
  return { ok: true, id: user.id };
});
