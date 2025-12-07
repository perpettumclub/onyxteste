// Kiwify Webhook Handler for Supabase Edge Functions
// Deploy this to: https://supabase.com/dashboard/project/_/functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    try {
        const body = await req.json()

        console.log('Kiwify Webhook received:', JSON.stringify(body, null, 2))

        // Kiwify sends different event types
        // Common events: order_paid, subscription_created, subscription_canceled, refund
        const eventType = body.webhook_event_type || body.order_status

        // Get customer email to find the tenant
        const customerEmail = body.Customer?.email || body.customer?.email

        if (!customerEmail) {
            console.error('No customer email found in webhook')
            return new Response(JSON.stringify({ received: true }), {
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Find user by email
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', customerEmail)
            .single()

        if (!profile) {
            console.error('No user found with email:', customerEmail)
            return new Response(JSON.stringify({ received: true, error: 'user_not_found' }), {
                headers: { 'Content-Type': 'application/json' }
            })
        }

        // Find tenant for this user
        const { data: tenantMember } = await supabase
            .from('tenant_members')
            .select('tenant_id')
            .eq('user_id', profile.id)
            .single()

        if (!tenantMember) {
            console.error('No tenant found for user:', profile.id)
            return new Response(JSON.stringify({ received: true, error: 'tenant_not_found' }), {
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const tenantId = tenantMember.tenant_id

        // Handle different Kiwify events
        if (eventType === 'order_paid' || body.order_status === 'paid') {
            // Payment approved - activate subscription
            const planId = body.Product?.id || 'pro' // Map product ID to plan

            await supabase.from('subscriptions').upsert({
                tenant_id: tenantId,
                status: 'active',
                plan_id: planId,
                kiwify_order_id: body.order_id,
                kiwify_customer_email: customerEmail,
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                cancel_at_period_end: false,
                updated_at: new Date().toISOString()
            }, { onConflict: 'tenant_id' })

            console.log('Subscription activated for tenant:', tenantId)
        }

        if (eventType === 'subscription_canceled' || eventType === 'refund') {
            // Subscription canceled or refunded
            await supabase.from('subscriptions').update({
                status: 'canceled',
                cancel_at_period_end: true,
                updated_at: new Date().toISOString()
            }).eq('tenant_id', tenantId)

            console.log('Subscription canceled for tenant:', tenantId)
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (err) {
        console.error('Webhook error:', err)
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        })
    }
})
