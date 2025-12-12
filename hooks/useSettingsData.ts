import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

interface ProfileData {
    name: string;
    email: string;
    bio: string;
    avatar: string;
}

interface TeamMember {
    id: string;
    email: string;
    name: string;
    role: 'OWNER' | 'EDITOR' | 'VIEWER';
    status: 'active' | 'pending';
    avatar?: string;
}

interface NotificationPreferences {
    emailNewSale: boolean;
    emailNewLead: boolean;
    emailWeeklyReport: boolean;
    pushNewSale: boolean;
    pushNewMember: boolean;
}

interface TenantSettings {
    brandColor: string;
    logo: string;
    customDomain: string;
    favicon: string;
}

export interface AffiliateLink {
    id: string;
    name: string;
    code: string;
    commission: number;
    clicks: number;
    conversions: number;
    revenue: number;
    isActive: boolean;
}

export interface Integration {
    id: string;
    provider: string;
    isConnected: boolean;
    connectedAt: string | null;
}

export interface ApiKey {
    id: string;
    name: string;
    keyPrefix: string;
    createdAt: string;
    lastUsedAt: string | null;
}

interface UseSettingsDataReturn {
    // Data
    profile: ProfileData;
    teamMembers: TeamMember[];
    notifications: NotificationPreferences;
    customization: TenantSettings;
    affiliateLinks: AffiliateLink[];
    integrations: Integration[];
    apiKeys: ApiKey[];
    webhookUrl: string;
    isLoading: boolean;
    error: string | null;

    // Actions - Profile
    setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
    saveProfile: () => Promise<{ success: boolean; message: string }>;
    updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;

    // Actions - Team
    inviteTeamMember: (email: string, role: 'EDITOR' | 'VIEWER') => Promise<{ success: boolean; message: string }>;
    removeTeamMember: (userId: string) => Promise<{ success: boolean; message: string }>;
    updateMemberRole: (userId: string, newRole: 'EDITOR' | 'VIEWER') => Promise<{ success: boolean; message: string }>;

    // Actions - Notifications
    setNotifications: React.Dispatch<React.SetStateAction<NotificationPreferences>>;
    saveNotifications: () => Promise<{ success: boolean; message: string }>;

    // Actions - Customization
    setCustomization: React.Dispatch<React.SetStateAction<TenantSettings>>;
    saveCustomization: () => Promise<{ success: boolean; message: string }>;

    // Actions - Affiliates
    createAffiliateLink: (name: string, commission: number) => Promise<{ success: boolean; message: string }>;
    deleteAffiliateLink: (id: string) => Promise<{ success: boolean; message: string }>;

    // Actions - Integrations
    generateApiKey: (name?: string) => Promise<{ success: boolean; message: string; fullKey?: string }>;
    revokeApiKey: (id: string) => Promise<{ success: boolean; message: string }>;
    toggleIntegration: (provider: string, connect: boolean) => Promise<{ success: boolean; message: string }>;

    refetch: () => void;
}

// Helper to generate random code
const generateCode = (name: string): string => {
    const prefix = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${prefix}${suffix}`;
};

// Helper to generate API key
const generateApiKeyString = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'onyx_live_';
    for (let i = 0; i < 32; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
};

// Simple hash function (in production, use proper crypto)
const simpleHash = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export function useSettingsData(userId: string, tenantId: string | null): UseSettingsDataReturn {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [profile, setProfile] = useState<ProfileData>({
        name: '',
        email: '',
        bio: '',
        avatar: ''
    });

    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

    const [notifications, setNotifications] = useState<NotificationPreferences>({
        emailNewSale: true,
        emailNewLead: true,
        emailWeeklyReport: true,
        pushNewSale: false,
        pushNewMember: true
    });

    const [customization, setCustomization] = useState<TenantSettings>({
        brandColor: '#ffffff',
        logo: '',
        customDomain: '',
        favicon: ''
    });

    const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

    const webhookUrl = `https://api.onyxclub.io/webhook/${tenantId || 'demo'}`;

    // Fetch all settings data
    const fetchData = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        setError(null);

        try {
            // 1. Fetch Profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('full_name, email, bio, avatar_url')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;

            if (profileData) {
                setProfile({
                    name: profileData.full_name || '',
                    email: profileData.email || '',
                    bio: profileData.bio || '',
                    avatar: profileData.avatar_url || ''
                });
            }

            // 2. Fetch Team Members (if tenant exists)
            if (tenantId) {
                const { data: membersData, error: membersError } = await supabase
                    .from('tenant_members')
                    .select(`
                        user_id,
                        role,
                        joined_at,
                        profiles:user_id (
                            id,
                            full_name,
                            email,
                            avatar_url
                        )
                    `)
                    .eq('tenant_id', tenantId);

                if (membersError) throw membersError;

                if (membersData) {
                    const members: TeamMember[] = membersData
                        .filter(m => m.profiles && m.user_id !== userId)
                        .map(m => ({
                            id: m.user_id,
                            email: (m.profiles as any)?.email || '',
                            name: (m.profiles as any)?.full_name || 'Usuário',
                            role: m.role as 'OWNER' | 'EDITOR' | 'VIEWER',
                            status: 'active' as const,
                            avatar: (m.profiles as any)?.avatar_url
                        }));
                    setTeamMembers(members);
                }

                // 3. Fetch Tenant Settings
                const { data: settingsData } = await supabase
                    .from('tenant_settings')
                    .select('*')
                    .eq('tenant_id', tenantId)
                    .single();

                if (settingsData) {
                    setCustomization({
                        brandColor: settingsData.brand_color || '#ffffff',
                        logo: settingsData.logo_url || '',
                        customDomain: settingsData.custom_domain || '',
                        favicon: settingsData.favicon_url || ''
                    });
                }

                // 4. Fetch Affiliate Links
                const { data: linksData } = await supabase
                    .from('affiliate_links')
                    .select('*')
                    .eq('tenant_id', tenantId)
                    .order('created_at', { ascending: false });

                if (linksData) {
                    setAffiliateLinks(linksData.map(l => ({
                        id: l.id,
                        name: l.name,
                        code: l.code,
                        commission: l.commission_percent,
                        clicks: l.clicks,
                        conversions: l.conversions,
                        revenue: l.revenue_generated,
                        isActive: l.is_active
                    })));
                }

                // 5. Fetch Integrations
                const { data: integrationsData } = await supabase
                    .from('connected_integrations')
                    .select('*')
                    .eq('tenant_id', tenantId);

                if (integrationsData) {
                    setIntegrations(integrationsData.map(i => ({
                        id: i.id,
                        provider: i.provider,
                        isConnected: i.is_connected,
                        connectedAt: i.connected_at
                    })));
                }

                // 6. Fetch API Keys
                const { data: keysData } = await supabase
                    .from('api_keys')
                    .select('*')
                    .eq('tenant_id', tenantId)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (keysData) {
                    setApiKeys(keysData.map(k => ({
                        id: k.id,
                        name: k.name,
                        keyPrefix: k.key_prefix,
                        createdAt: k.created_at,
                        lastUsedAt: k.last_used_at
                    })));
                }
            }

            // 7. Fetch Notification Preferences
            const { data: notifData } = await supabase
                .from('notification_preferences')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (notifData) {
                setNotifications({
                    emailNewSale: notifData.email_new_sale ?? true,
                    emailNewLead: notifData.email_new_lead ?? true,
                    emailWeeklyReport: notifData.email_weekly_report ?? true,
                    pushNewSale: notifData.push_new_sale ?? false,
                    pushNewMember: notifData.push_new_member ?? true
                });
            }

        } catch (err: any) {
            console.error('Error fetching settings:', err);
            setError(err.message || 'Erro ao carregar configurações');
        } finally {
            setIsLoading(false);
        }
    }, [userId, tenantId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Save Profile
    const saveProfile = async (): Promise<{ success: boolean; message: string }> => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: profile.name,
                    bio: profile.bio
                })
                .eq('id', userId);

            if (error) throw error;

            return { success: true, message: 'Perfil salvo com sucesso!' };
        } catch (err: any) {
            return { success: false, message: err.message || 'Erro ao salvar perfil' };
        }
    };

    // Update Password
    const updatePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            return { success: true, message: 'Senha alterada com sucesso!' };
        } catch (err: any) {
            return { success: false, message: err.message || 'Erro ao alterar senha' };
        }
    };

    // Save Notifications
    const saveNotifications = async (): Promise<{ success: boolean; message: string }> => {
        try {
            const { error } = await supabase
                .from('notification_preferences')
                .upsert({
                    user_id: userId,
                    email_new_sale: notifications.emailNewSale,
                    email_new_lead: notifications.emailNewLead,
                    email_weekly_report: notifications.emailWeeklyReport,
                    push_new_sale: notifications.pushNewSale,
                    push_new_member: notifications.pushNewMember,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) throw error;

            return { success: true, message: 'Preferências salvas com sucesso!' };
        } catch (err: any) {
            return { success: false, message: err.message || 'Erro ao salvar preferências' };
        }
    };

    // Save Customization
    const saveCustomization = async (): Promise<{ success: boolean; message: string }> => {
        if (!tenantId) return { success: false, message: 'Tenant não encontrado' };

        try {
            const { error } = await supabase
                .from('tenant_settings')
                .upsert({
                    tenant_id: tenantId,
                    brand_color: customization.brandColor,
                    logo_url: customization.logo,
                    custom_domain: customization.customDomain,
                    favicon_url: customization.favicon,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'tenant_id' });

            if (error) throw error;

            return { success: true, message: 'Personalização salva com sucesso!' };
        } catch (err: any) {
            return { success: false, message: err.message || 'Erro ao salvar personalização' };
        }
    };

    // Invite Team Member
    const inviteTeamMember = async (email: string, role: 'EDITOR' | 'VIEWER'): Promise<{ success: boolean; message: string }> => {
        if (!tenantId) return { success: false, message: 'Tenant não encontrado' };

        try {
            const { data: existingUser } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email)
                .single();

            if (!existingUser) {
                const tempMember: TeamMember = {
                    id: `pending-${Date.now()}`,
                    email,
                    name: email.split('@')[0],
                    role,
                    status: 'pending'
                };
                setTeamMembers(prev => [...prev, tempMember]);
                return { success: true, message: `Convite pendente para ${email}` };
            }

            const { error } = await supabase
                .from('tenant_members')
                .insert({
                    tenant_id: tenantId,
                    user_id: existingUser.id,
                    role
                });

            if (error) throw error;

            await fetchData();

            return { success: true, message: `${email} adicionado à equipe!` };
        } catch (err: any) {
            return { success: false, message: err.message || 'Erro ao convidar membro' };
        }
    };

    // Remove Team Member
    const removeTeamMember = async (memberId: string): Promise<{ success: boolean; message: string }> => {
        if (!tenantId) return { success: false, message: 'Tenant não encontrado' };

        if (memberId.startsWith('pending-')) {
            setTeamMembers(prev => prev.filter(m => m.id !== memberId));
            return { success: true, message: 'Convite cancelado' };
        }

        try {
            const { error } = await supabase
                .from('tenant_members')
                .delete()
                .eq('tenant_id', tenantId)
                .eq('user_id', memberId);

            if (error) throw error;

            setTeamMembers(prev => prev.filter(m => m.id !== memberId));

            return { success: true, message: 'Membro removido!' };
        } catch (err: any) {
            return { success: false, message: err.message || 'Erro ao remover membro' };
        }
    };

    // Update Member Role
    const updateMemberRole = async (memberId: string, newRole: 'EDITOR' | 'VIEWER'): Promise<{ success: boolean; message: string }> => {
        if (!tenantId) return { success: false, message: 'Tenant não encontrado' };

        try {
            const { error } = await supabase
                .from('tenant_members')
                .update({ role: newRole })
                .eq('tenant_id', tenantId)
                .eq('user_id', memberId);

            if (error) throw error;

            setTeamMembers(prev => prev.map(m =>
                m.id === memberId ? { ...m, role: newRole } : m
            ));

            return { success: true, message: `Permissão alterada para ${newRole === 'EDITOR' ? 'Editor' : 'Visualizador'}!` };
        } catch (err: any) {
            return { success: false, message: err.message || 'Erro ao alterar permissão' };
        }
    };

    // Create Affiliate Link
    const createAffiliateLink = async (name: string, commission: number): Promise<{ success: boolean; message: string }> => {
        if (!tenantId) return { success: false, message: 'Tenant não encontrado' };

        try {
            const code = generateCode(name);

            const { data, error } = await supabase
                .from('affiliate_links')
                .insert({
                    tenant_id: tenantId,
                    name,
                    code,
                    commission_percent: commission
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setAffiliateLinks(prev => [{
                    id: data.id,
                    name: data.name,
                    code: data.code,
                    commission: data.commission_percent,
                    clicks: 0,
                    conversions: 0,
                    revenue: 0,
                    isActive: true
                }, ...prev]);
            }

            return { success: true, message: 'Link de afiliado criado!' };
        } catch (err: any) {
            return { success: false, message: err.message || 'Erro ao criar link' };
        }
    };

    // Delete Affiliate Link
    const deleteAffiliateLink = async (id: string): Promise<{ success: boolean; message: string }> => {
        try {
            const { error } = await supabase
                .from('affiliate_links')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setAffiliateLinks(prev => prev.filter(l => l.id !== id));

            return { success: true, message: 'Link removido!' };
        } catch (err: any) {
            return { success: false, message: err.message || 'Erro ao remover link' };
        }
    };

    // Generate API Key
    const generateApiKey = async (name: string = 'Default API Key'): Promise<{ success: boolean; message: string; fullKey?: string }> => {
        if (!tenantId) return { success: false, message: 'Tenant não encontrado' };

        try {
            const fullKey = generateApiKeyString();
            const keyPrefix = fullKey.slice(0, 20);
            const keyHash = await simpleHash(fullKey);

            const { data, error } = await supabase
                .from('api_keys')
                .insert({
                    tenant_id: tenantId,
                    name,
                    key_prefix: keyPrefix,
                    key_hash: keyHash
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setApiKeys(prev => [{
                    id: data.id,
                    name: data.name,
                    keyPrefix: data.key_prefix,
                    createdAt: data.created_at,
                    lastUsedAt: null
                }, ...prev]);
            }

            return { success: true, message: 'Chave API gerada! Copie agora, não será mostrada novamente.', fullKey };
        } catch (err: any) {
            return { success: false, message: err.message || 'Erro ao gerar chave' };
        }
    };

    // Revoke API Key
    const revokeApiKey = async (id: string): Promise<{ success: boolean; message: string }> => {
        try {
            const { error } = await supabase
                .from('api_keys')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setApiKeys(prev => prev.filter(k => k.id !== id));

            return { success: true, message: 'Chave revogada!' };
        } catch (err: any) {
            return { success: false, message: err.message || 'Erro ao revogar chave' };
        }
    };

    // Toggle Integration
    const toggleIntegration = async (provider: string, connect: boolean): Promise<{ success: boolean; message: string }> => {
        if (!tenantId) return { success: false, message: 'Tenant não encontrado' };

        try {
            const { error } = await supabase
                .from('connected_integrations')
                .upsert({
                    tenant_id: tenantId,
                    provider,
                    is_connected: connect,
                    connected_at: connect ? new Date().toISOString() : null
                }, { onConflict: 'tenant_id,provider' });

            if (error) throw error;

            setIntegrations(prev => prev.map(i =>
                i.provider === provider
                    ? { ...i, isConnected: connect, connectedAt: connect ? new Date().toISOString() : null }
                    : i
            ));

            return { success: true, message: connect ? 'Integração conectada!' : 'Integração desconectada!' };
        } catch (err: any) {
            return { success: false, message: err.message || 'Erro ao alterar integração' };
        }
    };

    return {
        profile,
        teamMembers,
        notifications,
        customization,
        affiliateLinks,
        integrations,
        apiKeys,
        webhookUrl,
        isLoading,
        error,
        setProfile,
        setNotifications,
        setCustomization,
        saveProfile,
        saveNotifications,
        saveCustomization,
        inviteTeamMember,
        removeTeamMember,
        updateMemberRole,
        updatePassword,
        createAffiliateLink,
        deleteAffiliateLink,
        generateApiKey,
        revokeApiKey,
        toggleIntegration,
        refetch: fetchData
    };
}
