import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ApplySchema = z.object({
  name: z.string().trim().min(2).max(120),
  branchName: z.string().trim().max(120).optional().or(z.literal("")),
  chain: z.string().trim().max(120).optional().or(z.literal("")),
  state: z.string().trim().min(2).max(60),
  city: z.string().trim().min(2).max(60),
  area: z.string().trim().max(120).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  phone: z.string().trim().min(6).max(30),
  whatsapp: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email().max(200),
  opening: z.string().trim().max(200).optional().or(z.literal("")),
  delivery: z.boolean().default(true),
  tags: z.array(z.string().min(1).max(60)).max(20).default([]),
  googleMapsUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  sourceUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

export const applyAsRestaurant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ApplySchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const baseName = data.branchName ? `${data.name} - ${data.branchName}` : data.name;
    const base = slugify(baseName) || "restaurant";
    let slug = base;
    for (let i = 0; i < 20; i++) {
      const { data: existing } = await supabaseAdmin
        .from("restaurants").select("id").eq("slug", slug).maybeSingle();
      if (!existing) break;
      slug = `${base}-${Math.floor(Math.random() * 9000 + 1000)}`;
    }

    const { error } = await supabaseAdmin.from("restaurants").insert({
      slug,
      name: baseName,
      chain: data.chain || null,
      branch_name: data.branchName || null,
      state: data.state,
      city: data.city,
      area: data.area || null,
      address: data.address || null,
      phone: data.phone,
      whatsapp: data.whatsapp || null,
      email: data.email,
      opening: data.opening || null,
      delivery: data.delivery,
      tags: data.tags,
      google_maps_url: data.googleMapsUrl || null,
      source_url: data.sourceUrl || null,
      review_reason: data.notes || null,
      needs_review: true,
      verified: false,
      status: "pending",
      owner_id: userId,
      restaurant_data_source: "partner_application",
    });
    if (error) throw new Error(error.message);
    return { ok: true as const, slug };
  });
