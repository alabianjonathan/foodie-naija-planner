import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";


export type ChefCategory =
  | "private_chef"
  | "home_cook"
  | "meal_prep"
  | "soup_bowl"
  | "small_chops"
  | "grill_bbq"
  | "pastry_baker"
  | "event_catering"
  | "healthy_meals"
  | "diet_specialist";

export type ChefPlan = "basic" | "featured" | "premium";

export type PublicChef = {
  id: string;
  slug: string;
  fullName: string;
  businessName: string;
  bio: string | null;
  city: string;
  area: string | null;
  areasCovered: string[];
  categories: string[];
  yearsExperience: number | null;
  photoUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  priceMin: number | null;
  priceMax: number | null;
  availability: string | null;
  rating: number | null;
  verified: boolean;
  featured: boolean;
  plan: ChefPlan;
};

export type PublicChefListing = {
  id: string;
  chefId: string;
  name: string;
  type: "food" | "service";
  description: string | null;
  priceMin: number | null;
  priceMax: number | null;
  photos: string[];
  availableDays: string[];
  serviceArea: string | null;
};

export type PublicChefReview = {
  id: string;
  chefId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

function publicClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const CHEF_COLS =
  "id,slug,full_name,business_name,bio,city,area,areas_covered,categories,years_experience,photo_url,phone,whatsapp,price_min,price_max,availability,rating,verified,featured,plan";

function mapChef(r: any): PublicChef {
  return {
    id: r.id, slug: r.slug, fullName: r.full_name, businessName: r.business_name, bio: r.bio,
    city: r.city, area: r.area, areasCovered: r.areas_covered ?? [], categories: r.categories ?? [],
    yearsExperience: r.years_experience, photoUrl: r.photo_url, phone: r.phone, whatsapp: r.whatsapp,
    priceMin: r.price_min != null ? Number(r.price_min) : null,
    priceMax: r.price_max != null ? Number(r.price_max) : null,
    availability: r.availability, rating: r.rating != null ? Number(r.rating) : null,
    verified: r.verified, featured: r.featured, plan: r.plan,
  };
}

export const listChefs = createServerFn({ method: "GET" }).handler(async (): Promise<PublicChef[]> => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("chefs")
    .select(CHEF_COLS)
    .eq("status", "active")
    .order("featured", { ascending: false })
    .order("plan", { ascending: false })
    .order("rating", { ascending: false, nullsFirst: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []).map(mapChef);
});

export const getChefBySlug = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => z.object({ slug: z.string().min(1).max(120) }).parse(data))
  .handler(async ({ data }): Promise<{
    chef: PublicChef;
    listings: PublicChefListing[];
    reviews: PublicChefReview[];
  } | null> => {
    const sb = publicClient();
    const { data: chef, error } = await sb
      .from("chefs").select(CHEF_COLS).eq("slug", data.slug).eq("status", "active").maybeSingle();
    if (error) throw error;
    if (!chef) return null;

    const [{ data: listings }, { data: reviews }] = await Promise.all([
      sb.from("chef_listings")
        .select("id,chef_id,name,type,description,price_min,price_max,photos,available_days,service_area")
        .eq("chef_id", chef.id).eq("status", "active").order("created_at", { ascending: false }),
      sb.from("chef_reviews")
        .select("id,chef_id,rating,comment,created_at")
        .eq("chef_id", chef.id).order("created_at", { ascending: false }).limit(50),
    ]);

    return {
      chef: mapChef(chef),
      listings: (listings ?? []).map((l: any) => ({
        id: l.id, chefId: l.chef_id, name: l.name, type: l.type, description: l.description,
        priceMin: l.price_min != null ? Number(l.price_min) : null,
        priceMax: l.price_max != null ? Number(l.price_max) : null,
        photos: l.photos ?? [], availableDays: l.available_days ?? [], serviceArea: l.service_area,
      })),
      reviews: (reviews ?? []).map((r: any) => ({
        id: r.id, chefId: r.chef_id, rating: r.rating, comment: r.comment, createdAt: r.created_at,
      })),
    };
  });

const LeadSchema = z.object({
  chefId: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(6).max(30).optional().or(z.literal("")),
  whatsapp: z.string().trim().min(6).max(30).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  requestedDate: z.string().trim().max(20).optional().or(z.literal("")),
});

export const submitChefLead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => LeadSchema.parse(data))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { error } = await sb.from("chef_leads").insert({
      chef_id: data.chefId,
      name: data.name,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      message: data.message || null,
      requested_date: data.requestedDate || null,
      status: "new",
    });
    if (error) throw error;
    return { ok: true as const };
  });

const ApplySchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  businessName: z.string().trim().min(2).max(120),
  bio: z.string().trim().max(1000).optional().or(z.literal("")),
  phone: z.string().trim().min(6).max(30),
  whatsapp: z.string().trim().min(6).max(30).optional().or(z.literal("")),
  email: z.string().trim().email().max(200),
  city: z.string().trim().min(2).max(60), // state
  area: z.string().trim().max(200).optional().or(z.literal("")), // specific areas/streets (free text)
  areasCovered: z.array(z.string().min(1).max(60)).min(1).max(30), // cities covered
  categories: z.array(z.string().min(1).max(60)).min(1).max(20),
  yearsExperience: z.number().int().min(0).max(80).optional(),
  priceMin: z.number().min(0).max(10_000_000).optional(),
  priceMax: z.number().min(0).max(10_000_000).optional(),
  availability: z.string().trim().max(200).optional().or(z.literal("")),
  plan: z.enum(["basic", "featured", "premium"]).default("basic"),
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

export const applyAsChef = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ApplySchema.parse(data))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const sb = context.supabase;

    const base = slugify(data.businessName) || slugify(data.fullName) || "chef";
    let slug = base;
    for (let i = 0; i < 20; i++) {
      const { data: existing } = await sb.from("chefs").select("id").eq("slug", slug).maybeSingle();
      if (!existing) break;
      slug = `${base}-${Math.floor(Math.random() * 9000 + 1000)}`;
    }

    const { error: insErr } = await sb.from("chefs").insert({
      user_id: userId,
      slug,
      full_name: data.fullName,
      business_name: data.businessName,
      bio: data.bio || null,
      phone: data.phone,
      whatsapp: data.whatsapp || null,
      email: data.email,
      city: data.city,
      area: data.area || null,
      areas_covered: data.areasCovered ?? [],
      categories: data.categories,
      years_experience: data.yearsExperience ?? null,
      price_min: data.priceMin ?? null,
      price_max: data.priceMax ?? null,
      availability: data.availability || null,
      status: "pending",
      plan: data.plan ?? "basic",
    });
    if (insErr) throw insErr;
    return { ok: true as const, slug, plan: data.plan ?? "basic" };
  });


