import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Subscription } from '../types';
import { debugLog } from '../config/debug';

export const useSubscription = (tenantId: string | null) => {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenantId) return;

        const fetchSubscription = async () => {
            try {
                const { data, error } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('tenant_id', tenantId)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching subscription:', error);
                }

                if (data) {
                    setSubscription(data as Subscription);
                } else {
                    // Default to PRO if no subscription found (for demo purposes)
                    setSubscription({
                        tenant_id: tenantId,
                        plan_id: 'pro',
                        status: 'active',
                        cancel_at_period_end: false
                    });
                }
            } catch (error) {
                console.error('Error in fetchSubscription:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscription();
    }, [tenantId]);

    const updatePlan = async (planId: string) => {
        if (!tenantId) return;

        setLoading(true);
        try {
            // KIWIFY: Redirect to Kiwify checkout page
            const kiwifyLinks: Record<string, string> = {
                'starter': 'https://pay.kiwify.com.br/gh1rDp1',
                'pro': 'https://pay.kiwify.com.br/NyE4zc3',
                'business': 'https://pay.kiwify.com.br/XOQcRRd'
            };

            const checkoutUrl = kiwifyLinks[planId];

            if (checkoutUrl) {
                window.location.href = checkoutUrl;
            } else {
                // Fallback: Direct DB update for demo/testing
                const { error } = await supabase
                    .from('subscriptions')
                    .upsert({
                        tenant_id: tenantId,
                        plan_id: planId,
                        status: 'active',
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'tenant_id' });

                if (error) throw error;

                setSubscription(prev => prev ? { ...prev, plan_id: planId as any, status: 'active' } : null);
                alert('Plano atualizado com sucesso! (Modo Demo)');
                window.location.reload();
            }
        } catch (err: any) {
            console.error('Error updating plan:', err);
            alert('Erro ao atualizar plano: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const cancelSubscription = async () => {
        if (!tenantId) return;

        // In a real app, this would call Stripe to cancel at period end
        const { error } = await supabase
            .from('subscriptions')
            .upsert({
                tenant_id: tenantId,
                cancel_at_period_end: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'tenant_id' });

        if (error) throw error;

        setSubscription(prev => prev ? { ...prev, cancel_at_period_end: true } : null);
    };

    return { subscription, loading, updatePlan, cancelSubscription };
};
