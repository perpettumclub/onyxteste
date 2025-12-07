-- Migration: Add Kiwify columns to subscriptions table
-- Run this in your Supabase SQL Editor

-- Add Kiwify-specific columns (optional, you can also reuse stripe_ columns)
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS kiwify_order_id TEXT,
ADD COLUMN IF NOT EXISTS kiwify_customer_email TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_kiwify_email ON public.subscriptions(kiwify_customer_email);

-- If you want to rename stripe columns to be generic (OPTIONAL):
-- ALTER TABLE public.subscriptions RENAME COLUMN stripe_customer_id TO payment_customer_id;
-- ALTER TABLE public.subscriptions RENAME COLUMN stripe_subscription_id TO payment_subscription_id;
