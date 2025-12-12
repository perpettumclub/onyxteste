import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { ActivityLog } from '../types';

interface UseActivityLogOptions {
    tenantId: string;
    limit?: number;
}

interface UseActivityLogReturn {
    activities: ActivityLog[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * Hook para buscar o feed de atividades de um tenant.
 * Usa a view `activity_feed` do Supabase.
 */
export function useActivityLog({ tenantId, limit = 50 }: UseActivityLogOptions): UseActivityLogReturn {
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchActivities = useCallback(async () => {
        if (!tenantId) {
            setActivities([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const { data, error: supabaseError } = await supabase
                .from('activity_feed')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (supabaseError) {
                throw new Error(supabaseError.message);
            }

            // Mapeia os dados do Supabase para a interface ActivityLog
            const mappedActivities: ActivityLog[] = (data || []).map((item: Record<string, unknown>) => ({
                id: item.id as string,
                tenantId: item.tenant_id as string,
                userId: item.user_id as string,
                userName: item.user_name as string | undefined,
                userAvatar: item.user_avatar as string | undefined,
                taskId: item.task_id as string | undefined,
                taskTitle: item.task_title as string | undefined,
                action: item.action as ActivityLog['action'],
                details: item.details as Record<string, unknown> | undefined,
                createdAt: item.created_at as string,
            }));

            setActivities(mappedActivities);
        } catch (err) {
            console.error('Error fetching activity log:', err);
            setError(err instanceof Error ? err : new Error('Erro ao carregar atividades'));
        } finally {
            setLoading(false);
        }
    }, [tenantId, limit]);

    useEffect(() => {
        fetchActivities();

        // Realtime subscription para novos logs
        const channel = supabase
            .channel(`activity_log:${tenantId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'activity_log',
                    filter: `tenant_id=eq.${tenantId}`,
                },
                () => {
                    // Refetch quando há nova atividade
                    fetchActivities();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tenantId, fetchActivities]);

    return { activities, loading, error, refetch: fetchActivities };
}

/**
 * Helper para formatar timestamps relativos (ex: "há 5 min")
 */
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'agora';
    if (diffMin < 60) return `há ${diffMin} min`;
    if (diffHour < 24) return `há ${diffHour}h`;
    if (diffDay === 1) return 'ontem';
    if (diffDay < 7) return `há ${diffDay} dias`;
    return date.toLocaleDateString('pt-BR');
}

/**
 * Helper para obter o ícone/emoji baseado na ação
 */
export function getActionEmoji(action: ActivityLog['action']): string {
    switch (action) {
        case 'CREATED': return '📝';
        case 'UPDATED': return '✏️';
        case 'COMPLETED': return '✅';
        case 'COMMENTED': return '💬';
        case 'ASSIGNED': return '👤';
        case 'STATUS_CHANGED': return '🔄';
        default: return '📌';
    }
}

/**
 * Helper para obter a descrição da ação
 */
export function getActionDescription(action: ActivityLog['action']): string {
    switch (action) {
        case 'CREATED': return 'criou a tarefa';
        case 'UPDATED': return 'atualizou a tarefa';
        case 'COMPLETED': return 'completou a tarefa';
        case 'COMMENTED': return 'comentou na tarefa';
        case 'ASSIGNED': return 'foi atribuído(a) à tarefa';
        case 'STATUS_CHANGED': return 'alterou o status da tarefa';
        default: return 'interagiu com a tarefa';
    }
}
