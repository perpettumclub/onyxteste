-- ============================================
-- SETTINGS BACKEND MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add bio column to profiles (if not exists)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

-- ============================================
-- 2. NOTIFICATION PREFERENCES
-- ============================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_new_sale boolean DEFAULT true,
  email_new_lead boolean DEFAULT true,
  email_weekly_report boolean DEFAULT true,
  push_new_sale boolean DEFAULT false,
  push_new_member boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only access their own preferences
DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 3. TENANT SETTINGS (Customization)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tenant_settings (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  brand_color text DEFAULT '#ffffff',
  logo_url text,
  favicon_url text,
  custom_domain text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

-- RLS: Tenant members can view, only owners/editors can update
DROP POLICY IF EXISTS "Tenant members can view tenant settings" ON public.tenant_settings;
CREATE POLICY "Tenant members can view tenant settings" ON public.tenant_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_members.tenant_id = tenant_settings.tenant_id
      AND tenant_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Tenant owners can insert tenant settings" ON public.tenant_settings;
CREATE POLICY "Tenant owners can insert tenant settings" ON public.tenant_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_members.tenant_id = tenant_settings.tenant_id
      AND tenant_members.user_id = auth.uid()
      AND tenant_members.role IN ('OWNER', 'EDITOR')
    )
  );

DROP POLICY IF EXISTS "Tenant owners can update tenant settings" ON public.tenant_settings;
CREATE POLICY "Tenant owners can update tenant settings" ON public.tenant_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_members.tenant_id = tenant_settings.tenant_id
      AND tenant_members.user_id = auth.uid()
      AND tenant_members.role IN ('OWNER', 'EDITOR')
    )
  );

-- ============================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant ON public.tenant_settings(tenant_id);

-- ============================================
-- Done! Now integrate with Settings.tsx
-- ============================================
