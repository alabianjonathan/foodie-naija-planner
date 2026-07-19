import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// -------------------- Input schema --------------------

const OpeningHourSchema = z.object({
  day: z.string().optional().default(""),
  hours: z.string().optional().default(""),
});

const GooglePlaceSchema = z.object({
  title: z.string().min(1),
  subTitle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  price: z.string().nullable().optional(),
  categoryName: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  street: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  phoneUnformatted: z.string().nullable().optional(),
  location: z.object({ lat: z.number(), lng: z.number() }).nullable().optional(),
  totalScore: z.number().nullable().optional(),
  reviewsCount: z.number().nullable().optional(),
  imagesCount: z.number().nullable().optional(),
  permanentlyClosed: z.boolean().nullable().optional(),
  temporarilyClosed: z.boolean().nullable().optional(),
  placeId: z.string().nullable().optional(),
  categories: z.array(z.string()).nullable().optional(),
  openingHours: z.array(OpeningHourSchema).nullable().optional(),
  url: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  additionalInfo: z.record(z.string(), z.unknown()).nullable().optional(),
}).passthrough();

const InputSchema = z.object({
  rows: z.array(GooglePlaceSchema).min(1).max(5000),
  dryRun: z.boolean().optional().default(false),
  skipInvalid: z.boolean().optional().default(true),
});

// -------------------- Helpers --------------------

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 80);

// Extract cuisines from category strings. Google returns things like
// "Nigerian restaurant", "Chinese restaurant", "Fast food restaurant".
const CUISINE_MAP: Array<[RegExp, string]> = [
  [/nigerian/i, "Nigerian"],
  [/chinese/i, "Chinese"],
  [/indian/i, "Indian"],
  [/italian/i, "Italian"],
  [/lebanese|middle eastern/i, "Middle Eastern"],
  [/french/i, "French"],
  [/japanese|sushi/i, "Japanese"],
  [/korean/i, "Korean"],
  [/thai/i, "Thai"],
  [/american/i, "American"],
  [/mexican/i, "Mexican"],
  [/mediterranean/i, "Mediterranean"],
  [/african/i, "African"],
  [/continental/i, "Continental"],
  [/seafood/i, "Seafood"],
  [/steak|grill|bbq|barbec/i, "Grill & BBQ"],
  [/pizza/i, "Pizza"],
  [/burger/i, "Burgers"],
  [/vegetarian|vegan/i, "Vegetarian"],
  [/fast food|quick/i, "Fast Food"],
  [/breakfast|brunch/i, "Breakfast"],
  [/bakery|patisserie/i, "Bakery"],
  [/cafe|coffee/i, "Cafe"],
  [/ice cream|dessert/i, "Desserts"],
  [/bar|pub|lounge/i, "Bar & Lounge"],
  [/buffet/i, "Buffet"],
  [/suya/i, "Suya & Grills"],
];

function extractCuisines(categories: string[] | null | undefined, categoryName: string | null | undefined): string[] {
  const source = [...(categories ?? []), categoryName ?? ""].filter(Boolean).join(" | ");
  const found = new Set<string>();
  for (const [re, name] of CUISINE_MAP) if (re.test(source)) found.add(name);
  return Array.from(found);
}

function formatOpening(oh: Array<{ day: string; hours: string }> | null | undefined): string | null {
  if (!oh || oh.length === 0) return null;
  return oh.map((x) => `${x.day}: ${x.hours}`).join(" • ");
}

// MealBeta Score: rating (40) + reviews trust (30) + data completeness (30) = 100
function computeCompleteness(input: {
  address?: string | null; phone?: string | null; location?: { lat: number; lng: number } | null;
  openingHours?: unknown[] | null; imageUrl?: string | null; categories?: string[] | null;
  url?: string | null;
}): number {
  let score = 0;
  if (input.address && input.address.length > 10) score += 6;
  if (input.phone && input.phone.length > 5) score += 5;
  if (input.location && Number.isFinite(input.location.lat)) score += 6;
  if (input.openingHours && input.openingHours.length > 0) score += 5;
  if (input.imageUrl) score += 4;
  if (input.categories && input.categories.length > 0) score += 2;
  if (input.url) score += 2;
  return Math.min(30, score);
}

function computeScore(rating: number, reviews: number, completeness: number): number {
  const ratingPts = Math.max(0, Math.min(5, rating)) / 5 * 40;
  const reviewPts = Math.min(30, Math.log10(Math.max(0, reviews) + 1) * 15);
  return Math.round((ratingPts + reviewPts + completeness) * 100) / 100;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function requireAdmin(context: any): Promise<void> {
  const { data: roleRows } = await context.supabase
    .from("user_roles").select("role").eq("user_id", context.userId);
  const roles = new Set(((roleRows ?? []) as { role: string }[]).map((r) => r.role));
  if (!roles.has("admin") && !roles.has("super_admin")) {
    throw new Response("Forbidden", { status: 403 });
  }
}

// -------------------- Report --------------------

export type GoogleImportReport = {
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  duplicatesInBatch: number;
  averageScore: number;
  details: Array<{ title: string; city: string; action: "created" | "updated" | "skipped" | "failed"; reason?: string; score?: number }>;
};

// -------------------- Import --------------------

export const importRestaurantsFromGooglePlaces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }): Promise<GoogleImportReport> => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const report: GoogleImportReport = {
      totalRows: data.rows.length,
      created: 0, updated: 0, skipped: 0, failed: 0,
      duplicatesInBatch: 0, averageScore: 0, details: [],
    };

    // Preload existing by placeId + slug for dedup
    const { data: existing } = await supabaseAdmin
      .from("restaurants")
      .select("id, slug, place_id, name, city, latitude, longitude");
    const byPlace = new Map<string, { id: string; slug: string }>();
    const bySlug = new Map<string, { id: string; slug: string }>();
    for (const r of existing ?? []) {
      if (r.place_id) byPlace.set(r.place_id, r);
      bySlug.set(r.slug, r);
    }

    const seenInBatch = new Set<string>();
    let scoreSum = 0;
    let scored = 0;

    for (const row of data.rows) {
      try {
        // Skip closed places
        if (row.permanentlyClosed) {
          report.skipped++;
          report.details.push({ title: row.title, city: row.city ?? "", action: "skipped", reason: "Permanently closed" });
          continue;
        }
        // Validate address
        const hasAddress = (row.address && row.address.length > 8) || (row.street && row.city);
        if (!hasAddress && data.skipInvalid) {
          report.skipped++;
          report.details.push({ title: row.title, city: row.city ?? "", action: "skipped", reason: "Missing full address" });
          continue;
        }

        const placeId = row.placeId ?? null;
        const dedupKey = placeId ?? `${row.title}|${row.location?.lat ?? ""}|${row.location?.lng ?? ""}`;
        if (seenInBatch.has(dedupKey)) {
          report.duplicatesInBatch++;
          report.details.push({ title: row.title, city: row.city ?? "", action: "skipped", reason: "Duplicate in batch" });
          continue;
        }
        seenInBatch.add(dedupKey);

        const city = (row.city ?? "").trim() || "Unknown";
        const area = (row.neighborhood ?? "").trim() || null;
        const state = (row.state ?? "").trim() || null;
        const rating = Number(row.totalScore ?? 0) || 0;
        const reviews = Number(row.reviewsCount ?? 0) || 0;
        const cuisines = extractCuisines(row.categories, row.categoryName);
        const opening = row.openingHours ?? null;
        const completeness = computeCompleteness({
          address: row.address, phone: row.phone, location: row.location,
          openingHours: opening as unknown[], imageUrl: row.imageUrl,
          categories: row.categories, url: row.url,
        });
        const mealbetaScore = computeScore(rating, reviews, completeness);
        scoreSum += mealbetaScore; scored++;

        const slugBase = slugify(`${row.title}-${area ?? city}`);
        // Dedup: prefer place_id → fallback existing slug
        const existingRow = (placeId && byPlace.get(placeId)) || bySlug.get(slugBase) || null;
        const slug = existingRow?.slug ?? (bySlug.has(slugBase) ? `${slugBase}-${(placeId ?? "").slice(-6) || Math.random().toString(36).slice(2, 6)}` : slugBase);

        const payload = {
          slug,
          name: row.title,
          city,
          area,
          neighborhood: area,
          state,
          address: row.address ?? null,
          phone: row.phone ?? row.phoneUnformatted ?? null,
          latitude: row.location?.lat ?? null,
          longitude: row.location?.lng ?? null,
          google_maps_url: row.url ?? null,
          place_id: placeId,
          source_url: row.url ?? null,
          rating: Math.min(5, rating),
          reviews_count: reviews,
          mealbeta_score: mealbetaScore,
          completeness_score: completeness,
          cuisines,
          tags: cuisines,
          image_url: row.imageUrl ?? null,
          cover_url: row.imageUrl ?? null,
          opening_hours: opening,
          opening: formatOpening(opening ?? null),
          price_range: row.price ?? null,
          delivery: Boolean(
            row.additionalInfo && Array.isArray((row.additionalInfo as Record<string, unknown>)["Service options"]) &&
            ((row.additionalInfo as Record<string, unknown>)["Service options"] as Array<Record<string, boolean>>)
              .some((o) => o["Delivery"] === true)
          ),
          verified: rating >= 4.0 && reviews >= 20 && completeness >= 20,
          verification_status: rating >= 4.0 && reviews >= 20 ? "google_verified" : "unverified",
          restaurant_data_source: "google_places",
          food_data_priority: 5,
          has_verified_food_data: false,
          needs_review: completeness < 15 || rating < 3,
          review_reason: completeness < 15 ? "Low completeness" : rating < 3 ? "Low rating" : null,
          last_imported_at: new Date().toISOString(),
          status: "active" as const,
        };

        if (data.dryRun) {
          report.details.push({ title: row.title, city, action: existingRow ? "updated" : "created", score: mealbetaScore });
          if (existingRow) report.updated++; else report.created++;
          continue;
        }

        if (existingRow) {
          const { error } = await supabaseAdmin
            .from("restaurants").update(payload).eq("id", existingRow.id);
          if (error) throw error;
          report.updated++;
          report.details.push({ title: row.title, city, action: "updated", score: mealbetaScore });
        } else {
          const { data: ins, error } = await supabaseAdmin
            .from("restaurants").insert({ ...payload, distance_km: 0 }).select("id, slug").single();
          if (error) {
            // Race on unique slug — retry with suffix
            const retrySlug = `${slug}-${Math.random().toString(36).slice(2, 7)}`;
            const { error: e2 } = await supabaseAdmin
              .from("restaurants").insert({ ...payload, slug: retrySlug, distance_km: 0 });
            if (e2) throw e2;
          } else if (ins) {
            bySlug.set(ins.slug, ins);
            if (placeId) byPlace.set(placeId, ins);
          }
          report.created++;
          report.details.push({ title: row.title, city, action: "created", score: mealbetaScore });
        }
      } catch (err) {
        report.failed++;
        report.details.push({
          title: row.title, city: row.city ?? "", action: "failed",
          reason: (err as Error).message?.slice(0, 200),
        });
      }
    }

    report.averageScore = scored > 0 ? Math.round((scoreSum / scored) * 100) / 100 : 0;

    if (!data.dryRun) {
      await supabaseAdmin.from("import_logs").insert({
        kind: "restaurants_google_places",
        ran_by: context.userId,
        summary: {
          totalRows: report.totalRows, created: report.created, updated: report.updated,
          skipped: report.skipped, failed: report.failed, duplicatesInBatch: report.duplicatesInBatch,
          averageScore: report.averageScore,
        },
        rows: report.details.slice(0, 500),
      });
    }

    return report;
  });
