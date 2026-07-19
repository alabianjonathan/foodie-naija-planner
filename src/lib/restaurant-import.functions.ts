import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// -------------------- Types --------------------

const RowSchema = z.object({
  chain: z.string().min(1),
  branch: z.string().optional().default(""),
  address: z.string().optional().default(""),
  area: z.string().optional().default(""),
  city: z.string().min(1),
  state: z.string().optional().default(""),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  googleMapsUrl: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  categories: z.string().optional().default(""),
  swallow: z.string().optional().default(""),
  rice: z.string().optional().default(""),
  soup: z.string().optional().default(""),
  beans: z.string().optional().default(""),
  yam: z.string().optional().default(""),
  plantain: z.string().optional().default(""),
  sourceUrl: z.string().optional().default(""),
  verificationStatus: z.string().optional().default(""),
});

const InputSchema = z.object({
  rows: z.array(RowSchema).min(1).max(2000),
  dryRun: z.boolean().optional().default(false),
  wipeFirst: z.boolean().optional().default(false),
});

// -------------------- Alias / normalization tables --------------------

const CATEGORY_BY_COLUMN: Record<string, string> = {
  swallow: "swallow",
  rice: "rice",
  soup: "soup",
  beans: "beans",
  yam: "yam",
  plantain: "plantain",
};

// Aliases: raw text (lowercased, trimmed) → canonical name
const FOOD_ALIASES: Record<string, string> = {
  // Rice
  "jollof": "Jollof Rice",
  "jollof rice": "Jollof Rice",
  "item 7 special jollof": "Jollof Rice",
  "special jollof": "Jollof Rice",
  "fried rice": "Fried Rice",
  "chinese fried rice": "Chinese Fried Rice",
  "coconut rice": "Coconut Rice",
  "ofada rice": "Ofada Rice",
  "basmati rice": "Basmati Rice",
  "brown rice": "Brown Rice",
  "native rice": "Native Rice",
  "rice & gravy": "Rice and Gravy",
  "rice and gravy": "Rice and Gravy",
  "ram suya rice": "Ram Suya Rice",
  "special rice combo": "Special Rice Combo",
  // Swallow
  "pounded yam": "Pounded Yam",
  "amala": "Amala",
  "wheat": "Wheat Swallow",
  "semovita": "Semovita",
  "semo": "Semovita",
  "eba": "Eba",
  "garri": "Eba",
  "fufu": "Fufu",
  "akpu": "Fufu",
  "tuwo": "Tuwo",
  // Soup
  "egusi": "Egusi Soup",
  "efo riro": "Efo Riro",
  "seafood okra": "Seafood Okra Soup",
  "okra": "Okra Soup",
  "okro": "Okra Soup",
  "native soup": "Native Soup",
  "oha": "Oha Soup",
  "ogbono": "Ogbono Soup",
  "banga": "Banga Soup",
  "edikang ikong": "Edikang Ikong",
  "vegetable soup": "Vegetable Soup",
  "pepper soup": "Pepper Soup",
  // Beans
  "ewa agoyin": "Ewa Agoyin",
  "moin moin": "Moi Moi",
  "moi moi": "Moi Moi",
  "porridge beans": "Porridge Beans",
  "akara": "Akara",
  // Yam
  "yam chips": "Yam Chips",
  "fried yam": "Fried Yam",
  "yam porridge": "Yam Porridge",
  "boiled yam": "Boiled Yam",
  "asaro": "Yam Porridge",
  // Plantain
  "fried plantain": "Fried Plantain",
  "dodo": "Fried Plantain",
  "kelewele": "Kelewele",
  "boli": "Roasted Plantain",
  "roasted plantain": "Roasted Plantain",
  "grilled plantain": "Roasted Plantain",
  "grilled plantain (boli)": "Roasted Plantain",
  "plantain chips": "Plantain Chips",
  // Protein / other
  "suya": "Suya",
  "nkwobi": "Nkwobi",
  "shawarma": "Shawarma",
  "chicken": "Chicken",
  "burgers": "Burgers",
  "french fries": "French Fries",
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const normalizeFood = (raw: string, category: string): { name: string; slug: string } => {
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  const canonical = FOOD_ALIASES[key] ?? raw.trim().replace(/\s+/g, " ");
  const name = canonical.replace(/\b\w/g, (c) => c.toUpperCase());
  return { name, slug: `${category}-${slugify(name)}` };
};

const splitList = (s: string): string[] =>
  s
    .split(/[,;\/]+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0 && x.toLowerCase() !== "none" && x.toLowerCase() !== "n/a");

// -------------------- Admin gate --------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function requireAdmin(context: any): Promise<void> {
  const { data: roleRows } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  const roles = new Set(((roleRows ?? []) as { role: string }[]).map((r) => r.role));
  if (!roles.has("admin") && !roles.has("super_admin")) {
    throw new Response("Forbidden", { status: 403 });
  }
}

// -------------------- Import --------------------

export type ImportReport = {
  totalRows: number;
  created: number;
  updated: number;
  reviewed: number;
  failed: number;
  foodsCreated: number;
  linksCreated: number;
  details: Array<{ chain: string; branch: string; city: string; action: "created" | "updated" | "review" | "failed"; note?: string }>;
};

export const importRestaurantsFromRows = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }): Promise<ImportReport> => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Preload food categories
    const { data: cats } = await supabaseAdmin.from("food_categories").select("id, slug");
    const catBySlug = new Map((cats ?? []).map((c) => [c.slug, c.id]));

    // Preload existing foods
    const { data: existingFoods } = await supabaseAdmin.from("foods").select("id, slug");
    const foodBySlug = new Map((existingFoods ?? []).map((f) => [f.slug, f.id]));

    // Preload existing restaurants (chain+branch or slug)
    const { data: existingRests } = await supabaseAdmin
      .from("restaurants")
      .select("id, slug, chain, branch_name, name, city, phone");
    const restBySlug = new Map((existingRests ?? []).map((r) => [r.slug, r]));
    type ExistingRest = { id: string; slug: string; chain: string | null; branch_name: string | null; name: string; city: string; phone: string | null };
    const restByKey = new Map<string, ExistingRest>();
    for (const r of (existingRests ?? []) as ExistingRest[]) {
      if (r.chain && r.branch_name) {
        restByKey.set(`${r.chain}::${r.branch_name}::${r.city}`.toLowerCase(), r);
      }
    }

    const report: ImportReport = {
      totalRows: data.rows.length,
      created: 0, updated: 0, reviewed: 0, failed: 0,
      foodsCreated: 0, linksCreated: 0, details: [],
    };

    for (const row of data.rows) {
      try {
        const chain = row.chain.trim();
        const branch = row.branch.trim() || row.area.trim() || row.city;
        const displayName = `${chain} — ${branch}`;
        const slug = slugify(`${chain}-${branch}-${row.city}`);
        const key = `${chain}::${branch}::${row.city}`.toLowerCase();

        // Find existing
        let existing = restByKey.get(key) ?? restBySlug.get(slug) ?? null;
        if (!existing && row.phone) {
          existing = (existingRests ?? []).find(
            (r) => r.phone && r.phone.replace(/\D/g, "") === row.phone.replace(/\D/g, "") && r.city.toLowerCase() === row.city.toLowerCase(),
          ) ?? null;
        }

        const payload: Record<string, unknown> = {
          slug: existing?.slug ?? slug,
          name: displayName,
          chain,
          branch_name: branch,
          city: row.city,
          area: row.area || null,
          state: row.state || null,
          address: row.address || null,
          phone: row.phone || null,
          latitude: row.latitude ?? null,
          longitude: row.longitude ?? null,
          google_maps_url: row.googleMapsUrl || null,
          source_url: row.sourceUrl || null,
          verification_status: row.verificationStatus || null,
          tags: splitList(row.categories),
          verified: true,
          status: "active",
          delivery: true,
          has_verified_food_data: true,
          restaurant_data_source: "mealbeta_excel_import",
          food_data_priority: 10,
          last_imported_at: new Date().toISOString(),
          needs_review: false,
        };

        // Never overwrite with blanks
        const cleaned = Object.fromEntries(
          Object.entries(payload).filter(([, v]) => v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)),
        );

        if (data.dryRun) {
          report.details.push({ chain, branch, city: row.city, action: existing ? "updated" : "created", note: "dry run" });
          if (existing) report.updated++; else report.created++;
          continue;
        }

        let restaurantId: string;
        if (existing) {
          const { data: upd, error } = await supabaseAdmin
            .from("restaurants")
            .update(cleaned as never)
            .eq("id", existing.id)
            .select("id")
            .single();
          if (error) throw error;
          restaurantId = upd.id;
          report.updated++;
          report.details.push({ chain, branch, city: row.city, action: "updated" });
        } else {
          const { data: ins, error } = await supabaseAdmin
            .from("restaurants")
            .insert({ ...cleaned, rating: 0, distance_km: 0 } as never)
            .select("id")
            .single();
          if (error) throw error;
          restaurantId = ins.id;
          report.created++;
          report.details.push({ chain, branch, city: row.city, action: "created" });
        }

        // Parse and link foods
        const foodEntries: Array<{ category: string; raw: string }> = [];
        for (const col of Object.keys(CATEGORY_BY_COLUMN)) {
          const cat = CATEGORY_BY_COLUMN[col];
          const items = splitList((row as unknown as Record<string, string>)[col] ?? "");
          for (const item of items) foodEntries.push({ category: cat, raw: item });
        }

        const linkFoodIds = new Set<string>();
        for (const { category, raw } of foodEntries) {
          const { name, slug: foodSlug } = normalizeFood(raw, category);
          let foodId = foodBySlug.get(foodSlug);
          if (!foodId) {
            const { data: fIns, error: fErr } = await supabaseAdmin
              .from("foods")
              .insert({ slug: foodSlug, name, category_id: catBySlug.get(category) ?? null, aliases: [raw] })
              .select("id")
              .single();
            if (fErr) {
              // race: fetch it
              const { data: fSel } = await supabaseAdmin.from("foods").select("id").eq("slug", foodSlug).maybeSingle();
              if (fSel) foodId = fSel.id;
              else continue;
            } else {
              foodId = fIns.id;
              report.foodsCreated++;
            }
            if (foodId) foodBySlug.set(foodSlug, foodId);
          }
          if (foodId) linkFoodIds.add(foodId);
        }

        if (linkFoodIds.size) {
          const linkRows = Array.from(linkFoodIds).map((food_id) => ({
            restaurant_id: restaurantId, food_id, source: "excel_import",
          }));
          const { error: linkErr } = await supabaseAdmin
            .from("restaurant_foods")
            .upsert(linkRows, { onConflict: "restaurant_id,food_id", ignoreDuplicates: true });
          if (!linkErr) report.linksCreated += linkRows.length;
        }
      } catch (err) {
        report.failed++;
        report.details.push({
          chain: row.chain, branch: row.branch, city: row.city, action: "failed",
          note: (err as Error).message?.slice(0, 200),
        });
      }
    }

    // Log
    if (!data.dryRun) {
      await supabaseAdmin.from("import_logs").insert({
        kind: "restaurants_excel",
        ran_by: context.userId,
        summary: {
          totalRows: report.totalRows,
          created: report.created,
          updated: report.updated,
          failed: report.failed,
          foodsCreated: report.foodsCreated,
          linksCreated: report.linksCreated,
        },
        rows: report.details.slice(0, 500),
      });
    }

    return report;
  });
