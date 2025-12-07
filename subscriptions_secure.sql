-- SUBSCRIPTION SECURITY SYSTEM
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Helper Function: Is Active Subscriber?
-- Returns true if the tenant has an active or trialing subscription
CREATE OR REPLACE FUNCTION public.is_active_subscriber(target_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    sub_status TEXT;
    sub_end TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT status, current_period_end INTO sub_status, sub_end
    FROM public.subscriptions
    WHERE tenant_id = target_tenant_id;

    -- If no subscription found, assume false (or true if you want a default free trial that isn't in DB yet)
    -- Here we assume strict: Must have a record.
    IF sub_status IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check status
    IF sub_status IN ('active', 'trialing') THEN
        RETURN TRUE;
    END IF;

    -- Check if past due but within grace period? (Optional, skipping for now)
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Helper Function: Check Resource Limits
-- Checks if a tenant has reached their limit for a specific resource
CREATE OR REPLACE FUNCTION public.check_resource_limit(target_tenant_id UUID, resource_table TEXT, max_count INT)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INT;
BEGIN
    EXECUTE format('SELECT count(*) FROM public.%I WHERE tenant_id = $1', resource_table)
    USING target_tenant_id
    INTO current_count;

    RETURN current_count < max_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ENFORCE LIMITS ON LEADS (Backend Validation)
-- Logic: 
-- IF Subscription is 'trialing' -> Max 5 Leads
-- IF Subscription is 'active' -> Unlimited (or higher)
-- IF Subscription is 'canceled'/'past_due' -> Block INSERT
-- IF No Subscription -> Block INSERT

CREATE OR REPLACE FUNCTION public.validate_lead_insertion()
RETURNS TRIGGER AS $$
DECLARE
    sub_status TEXT;
    sub_plan TEXT;
    current_count INT;
    max_leads INT;
BEGIN
    -- Get Subscription Info
    SELECT status, plan_id INTO sub_status, sub_plan
    FROM public.subscriptions
    WHERE tenant_id = NEW.tenant_id;

    -- Default to locked if no sub
    IF sub_status IS NULL THEN
        RAISE EXCEPTION 'No subscription found for this tenant.';
    END IF;

    -- Block if Canceled or Past Due (Strict)
    IF sub_status NOT IN ('active', 'trialing') THEN
        RAISE EXCEPTION 'Subscription is not active.';
    END IF;

    -- Define Limits based on Plan/Status
    IF sub_status = 'trialing' THEN
        max_leads := 5;
    ELSIF sub_plan = 'starter' THEN
        max_leads := 1000;
    ELSE
        -- Pro/Business = Unlimited
        RETURN NEW;
    END IF;

    -- Check Current Count
    SELECT count(*) INTO current_count
    FROM public.leads
    WHERE tenant_id = NEW.tenant_id;

    IF current_count >= max_leads THEN
        RAISE EXCEPTION 'Resource limit reached for your current plan (% leads). Upgrade to add more.', max_leads;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for Leads
DROP TRIGGER IF EXISTS check_leads_limit ON public.leads;
CREATE TRIGGER check_leads_limit
    BEFORE INSERT ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_lead_insertion();
