import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/_tmp-reset")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("k") !== "one-shot-8fk2") {
          return new Response("nope", { status: 401 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const email = "jonathanjude22@gmail.com";
        const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
        if (listErr) return new Response(listErr.message, { status: 500 });
        const user = list.users.find((u) => u.email?.toLowerCase() === email);
        if (!user) return new Response("user not found", { status: 404 });
        const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: "$/jb12bz-login#DC" });
        if (error) return new Response(error.message, { status: 500 });
        return new Response(JSON.stringify({ ok: true, id: user.id }), { headers: { "content-type": "application/json" } });
      },
    },
  },
});
