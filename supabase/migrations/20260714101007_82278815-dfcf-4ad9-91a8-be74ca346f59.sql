
DO $$ BEGIN CREATE TYPE public.chef_plan AS ENUM ('basic','featured','premium'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.chef_status AS ENUM ('pending','active','suspended','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.chef_listing_type AS ENUM ('food','service'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.chef_lead_status AS ENUM ('new','contacted','closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.chef_subscription_status AS ENUM ('active','expired','canceled','pending'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.chefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  bio TEXT,
  phone TEXT, whatsapp TEXT, email TEXT,
  city TEXT NOT NULL, area TEXT,
  areas_covered TEXT[] NOT NULL DEFAULT '{}',
  categories TEXT[] NOT NULL DEFAULT '{}',
  years_experience INT DEFAULT 0,
  photo_url TEXT, id_document_url TEXT,
  price_min NUMERIC(12,2) DEFAULT 0, price_max NUMERIC(12,2) DEFAULT 0,
  availability TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  status public.chef_status NOT NULL DEFAULT 'pending',
  plan public.chef_plan NOT NULL DEFAULT 'basic',
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chefs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chefs TO authenticated;
GRANT ALL ON public.chefs TO service_role;
ALTER TABLE public.chefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active chefs" ON public.chefs FOR SELECT USING (status = 'active');
CREATE POLICY "Chef view own" ON public.chefs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Chef update own" ON public.chefs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth apply as chef" ON public.chefs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage chefs" ON public.chefs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'super_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'super_admin'::public.app_role));
CREATE TRIGGER update_chefs_updated_at BEFORE UPDATE ON public.chefs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.chef_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID NOT NULL REFERENCES public.chefs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.chef_listing_type NOT NULL,
  description TEXT,
  price_min NUMERIC(12,2) DEFAULT 0, price_max NUMERIC(12,2) DEFAULT 0,
  photos TEXT[] NOT NULL DEFAULT '{}',
  available_days TEXT[] NOT NULL DEFAULT '{}',
  service_area TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chef_listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chef_listings TO authenticated;
GRANT ALL ON public.chef_listings TO service_role;
ALTER TABLE public.chef_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active listings" ON public.chef_listings FOR SELECT
  USING (status = 'active' AND EXISTS (SELECT 1 FROM public.chefs c WHERE c.id = chef_id AND c.status = 'active'));
CREATE POLICY "Chef manages own listings" ON public.chef_listings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chefs c WHERE c.id = chef_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.chefs c WHERE c.id = chef_id AND c.user_id = auth.uid()));
CREATE POLICY "Admins manage listings" ON public.chef_listings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'super_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'super_admin'::public.app_role));
CREATE TRIGGER update_chef_listings_updated_at BEFORE UPDATE ON public.chef_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.enforce_chef_listing_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_plan public.chef_plan; v_count INT; v_limit INT;
BEGIN
  SELECT plan INTO v_plan FROM public.chefs WHERE id = NEW.chef_id;
  IF v_plan IS NULL THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO v_count FROM public.chef_listings WHERE chef_id = NEW.chef_id;
  IF v_plan = 'basic' THEN v_limit := 1;
  ELSIF v_plan = 'featured' THEN v_limit := 10;
  ELSE v_limit := NULL; END IF;
  IF v_limit IS NOT NULL AND v_count >= v_limit THEN
    RAISE EXCEPTION 'You have reached your plan limit. Upgrade to add more foods/services and get more visibility.' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.enforce_chef_listing_limit() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER chef_listing_limit BEFORE INSERT ON public.chef_listings FOR EACH ROW EXECUTE FUNCTION public.enforce_chef_listing_limit();

CREATE TABLE public.chef_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID NOT NULL REFERENCES public.chefs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL, phone TEXT, whatsapp TEXT, message TEXT,
  requested_date DATE,
  status public.chef_lead_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.chef_leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chef_leads TO authenticated;
GRANT ALL ON public.chef_leads TO service_role;
ALTER TABLE public.chef_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submit lead" ON public.chef_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Chef view own leads" ON public.chef_leads FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chefs c WHERE c.id = chef_id AND c.user_id = auth.uid()));
CREATE POLICY "Chef update own leads" ON public.chef_leads FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chefs c WHERE c.id = chef_id AND c.user_id = auth.uid()));
CREATE POLICY "Admins manage leads" ON public.chef_leads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'super_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'super_admin'::public.app_role));
CREATE TRIGGER update_chef_leads_updated_at BEFORE UPDATE ON public.chef_leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.chef_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID NOT NULL REFERENCES public.chefs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (chef_id, user_id)
);
GRANT SELECT ON public.chef_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chef_reviews TO authenticated;
GRANT ALL ON public.chef_reviews TO service_role;
ALTER TABLE public.chef_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view reviews" ON public.chef_reviews FOR SELECT USING (true);
CREATE POLICY "Users write own reviews" ON public.chef_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.chef_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reviews" ON public.chef_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage reviews" ON public.chef_reviews FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'super_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'super_admin'::public.app_role));

CREATE TABLE public.chef_profile_views (
  id BIGSERIAL PRIMARY KEY,
  chef_id UUID NOT NULL REFERENCES public.chefs(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.chef_profile_views TO anon;
GRANT INSERT, SELECT ON public.chef_profile_views TO authenticated;
GRANT USAGE ON SEQUENCE public.chef_profile_views_id_seq TO anon, authenticated;
GRANT ALL ON public.chef_profile_views TO service_role;
ALTER TABLE public.chef_profile_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone log view" ON public.chef_profile_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Chef view own analytics" ON public.chef_profile_views FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chefs c WHERE c.id = chef_id AND c.user_id = auth.uid()));
CREATE POLICY "Admins view analytics" ON public.chef_profile_views FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'super_admin'::public.app_role));

CREATE TABLE public.chef_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID NOT NULL REFERENCES public.chefs(id) ON DELETE CASCADE,
  plan public.chef_plan NOT NULL,
  status public.chef_subscription_status NOT NULL DEFAULT 'pending',
  paystack_customer_code TEXT,
  paystack_subscription_code TEXT,
  paystack_email_token TEXT,
  amount_kobo INT NOT NULL DEFAULT 0,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chef_subscriptions TO authenticated;
GRANT ALL ON public.chef_subscriptions TO service_role;
ALTER TABLE public.chef_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chef view own subs" ON public.chef_subscriptions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chefs c WHERE c.id = chef_id AND c.user_id = auth.uid()));
CREATE POLICY "Admins manage subs" ON public.chef_subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'super_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'super_admin'::public.app_role));
CREATE TRIGGER update_chef_subscriptions_updated_at BEFORE UPDATE ON public.chef_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_chefs_status_city ON public.chefs(status, city);
CREATE INDEX idx_chefs_user_id ON public.chefs(user_id);
CREATE INDEX idx_chef_listings_chef_id ON public.chef_listings(chef_id);
CREATE INDEX idx_chef_leads_chef_id ON public.chef_leads(chef_id);
CREATE INDEX idx_chef_profile_views_chef_id ON public.chef_profile_views(chef_id);
