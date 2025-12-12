-- ============================================
-- AFFILIATES & INTEGRATIONS BACKEND
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. AFFILIATE LINKS
-- ============================================
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  commission_percent numeric DEFAULT 30,
  clicks int DEFAULT 0,
  conversions int DEFAULT 0,
  revenue_generated numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Unique code per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_links_code ON public.affiliate_links(tenant_id, code);

ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

-- RLS: Tenant members can view/manage affiliate links
DROP POLICY IF EXISTS "Tenant members can view affiliate links" ON public.affiliate_links;
CREATE POLICY "Tenant members can view affiliate links" ON public.affiliate_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_members.tenant_id = affiliate_links.tenant_id
      AND tenant_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Tenant owners can insert affiliate links" ON public.affiliate_links;
CREATE POLICY "Tenant owners can insert affiliate links" ON public.affiliate_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_members.tenant_id = affiliate_links.tenant_id
      AND tenant_members.user_id = auth.uid()
      AND tenant_members.role IN ('OWNER', 'EDITOR')
    )
  );

DROP POLICY IF EXISTS "Tenant owners can update affiliate links" ON public.affiliate_links;
CREATE POLICY "Tenant owners can update affiliate links" ON public.affiliate_links
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_members.tenant_id = affiliate_links.tenant_id
      AND tenant_members.user_id = auth.uid()
      AND tenant_members.role IN ('OWNER', 'EDITOR')
    )
  );

DROP POLICY IF EXISTS "Tenant owners can delete affiliate links" ON public.affiliate_links;
CREATE POLICY "Tenant owners can delete affiliate links" ON public.affiliate_links
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_members.tenant_id = affiliate_links.tenant_id
      AND tenant_members.user_id = auth.uid()
      AND tenant_members.role IN ('OWNER', 'EDITOR')
    )
  );

-- ============================================
-- 2. API KEYS
-- ============================================
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name text DEFAULT 'Default API Key',
  key_prefix text NOT NULL, -- First 8 chars shown to user
  key_hash text NOT NULL, -- SHA-256 hash of full key
  last_used_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS: Tenant owners can manage API keys
DROP POLICY IF EXISTS "Tenant owners can view api keys" ON public.api_keys;
CREATE POLICY "Tenant owners can view api keys" ON public.api_keys
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_members.tenant_id = api_keys.tenant_id
      AND tenant_members.user_id = auth.uid()
      AND tenant_members.role = 'OWNER'
    )
  );

DROP POLICY IF EXISTS "Tenant owners can insert api keys" ON public.api_keys;
CREATE POLICY "Tenant owners can insert api keys" ON public.api_keys
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_members.tenant_id = api_keys.tenant_id
      AND tenant_members.user_id = auth.uid()
      AND tenant_members.role = 'OWNER'
    )
  );

DROP POLICY IF EXISTS "Tenant owners can delete api keys" ON public.api_keys;
CREATE POLICY "Tenant owners can delete api keys" ON public.api_keys
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_members.tenant_id = api_keys.tenant_id
      AND tenant_members.user_id = auth.uid()
      AND tenant_members.role = 'OWNER'
    )
  );

-- ============================================
-- 3. CONNECTED INTEGRATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.connected_integrations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL, -- 'stripe', 'hotmart', 'activecampaign', 'zapier'
  is_connected boolean DEFAULT false,
  config jsonb DEFAULT '{}'::jsonb, -- Provider-specific config (encrypted in production)
  connected_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Unique provider per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_connected_integrations_provider ON public.connected_integrations(tenant_id, provider);

ALTER TABLE public.connected_integrations ENABLE ROW LEVEL SECURITY;

-- RLS: Tenant owners can manage integrations
DROP POLICY IF EXISTS "Tenant owners can view integrations" ON public.connected_integrations;
CREATE POLICY "Tenant owners can view integrations" ON public.connected_integrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_members.tenant_id = connected_integrations.tenant_id
      AND tenant_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Tenant owners can manage integrations" ON public.connected_integrations;
CREATE POLICY "Tenant owners can manage integrations" ON public.connected_integrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_members.tenant_id = connected_integrations.tenant_id
      AND tenant_members.user_id = auth.uid()
      AND tenant_members.role = 'OWNER'
    )
  );

-- ============================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_affiliate_links_tenant ON public.affiliate_links(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON public.api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_connected_integrations_tenant ON public.connected_integrations(tenant_id);

-- ============================================
-- 5. SEED DEFAULT INTEGRATIONS FOR EXISTING TENANTS
-- ============================================
-- This creates placeholder rows for each integration type per tenant
INSERT INTO public.connected_integrations (tenant_id, provider, is_connected)
SELECT t.id, 'stripe', false FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.connected_integrations ci 
  WHERE ci.tenant_id = t.id AND ci.provider = 'stripe'
);

INSERT INTO public.connected_integrations (tenant_id, provider, is_connected)
SELECT t.id, 'hotmart', false FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.connected_integrations ci 
  WHERE ci.tenant_id = t.id AND ci.provider = 'hotmart'
);

INSERT INTO public.connected_integrations (tenant_id, provider, is_connected)
SELECT t.id, 'activecampaign', false FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.connected_integrations ci 
  WHERE ci.tenant_id = t.id AND ci.provider = 'activecampaign'
);

INSERT INTO public.connected_integrations (tenant_id, provider, is_connected)
SELECT t.id, 'zapier', false FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.connected_integrations ci 
  WHERE ci.tenant_id = t.id AND ci.provider = 'zapier'
);

-- ============================================
-- Done! Now update useSettingsData.ts
-- ============================================
