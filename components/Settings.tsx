import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Lock, Users, Link2, Bell, Palette, Webhook, Copy, Check, Plus, Trash2, Send, Shield, Globe, Camera, Save, ExternalLink, ChevronRight, Sparkles, Loader2, Key, RefreshCw } from 'lucide-react';
import { useSettingsData } from '../hooks/useSettingsData';
import { supabase } from '../services/supabase';

interface SettingsProps {
    user: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    tenantId?: string;
    initialTab?: SettingsTab;
}

type SettingsTab = 'profile' | 'team' | 'affiliates' | 'integrations' | 'notifications' | 'customization';

const INTEGRATION_META: Record<string, { name: string; icon: string; desc: string }> = {
    stripe: { name: 'Stripe', icon: '💳', desc: 'Pagamentos' },
    hotmart: { name: 'Hotmart', icon: '🔥', desc: 'Vendas' },
    activecampaign: { name: 'ActiveCampaign', icon: '📧', desc: 'Email Marketing' },
    zapier: { name: 'Zapier', icon: '⚡', desc: 'Automações' },
};

export const Settings: React.FC<SettingsProps> = ({ user, tenantId, initialTab }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab || 'profile');

    useEffect(() => {
        const storedTab = localStorage.getItem('settingsTab') as SettingsTab | null;
        if (storedTab) {
            setActiveTab(storedTab);
            localStorage.removeItem('settingsTab');
        }
    }, []);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Invite state
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'EDITOR' | 'VIEWER'>('VIEWER');

    // Affiliate form state
    const [newLinkName, setNewLinkName] = useState('');
    const [newLinkCommission, setNewLinkCommission] = useState(30);

    // API Key state
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);

    // Clipboard state
    const [copied, setCopied] = useState<string | null>(null);

    // Avatar upload state
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // Use the settings hook
    const {
        profile,
        teamMembers,
        notifications,
        customization,
        affiliateLinks,
        integrations,
        apiKeys,
        webhookUrl,
        isLoading,
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
        toggleIntegration
    } = useSettingsData(user.id, tenantId || null);

    const tabs = [
        { id: 'profile' as SettingsTab, label: 'Perfil', icon: User },
        { id: 'team' as SettingsTab, label: 'Equipe', icon: Users },
        { id: 'affiliates' as SettingsTab, label: 'Afiliados', icon: Link2 },
        { id: 'integrations' as SettingsTab, label: 'Integrações', icon: Webhook },
        { id: 'notifications' as SettingsTab, label: 'Notificações', icon: Bell },
        { id: 'customization' as SettingsTab, label: 'Personalização', icon: Palette },
    ];

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const showMessage = (message: string) => {
        setSaveMessage(message);
        setTimeout(() => setSaveMessage(null), 3000);
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        const result = await saveProfile();
        showMessage(result.message);
        setIsSaving(false);
    };

    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            showMessage('A senha deve ter pelo menos 6 caracteres');
            return;
        }
        setIsSaving(true);
        const result = await updatePassword(currentPassword, newPassword);
        showMessage(result.message);
        if (result.success) {
            setCurrentPassword('');
            setNewPassword('');
        }
        setIsSaving(false);
    };

    const handleSaveNotifications = async () => {
        setIsSaving(true);
        const result = await saveNotifications();
        showMessage(result.message);
        setIsSaving(false);
    };

    const handleSaveCustomization = async () => {
        setIsSaving(true);
        const result = await saveCustomization();
        showMessage(result.message);
        setIsSaving(false);
    };

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;
        setIsSaving(true);
        const result = await inviteTeamMember(inviteEmail, inviteRole);
        showMessage(result.message);
        if (result.success) {
            setInviteEmail('');
        }
        setIsSaving(false);
    };

    const handleRemoveMember = async (id: string) => {
        const result = await removeTeamMember(id);
        showMessage(result.message);
    };

    const handleCreateAffiliateLink = async () => {
        if (!newLinkName.trim()) return;
        setIsSaving(true);
        const result = await createAffiliateLink(newLinkName, newLinkCommission);
        showMessage(result.message);
        if (result.success) {
            setNewLinkName('');
        }
        setIsSaving(false);
    };

    const handleDeleteAffiliateLink = async (id: string) => {
        const result = await deleteAffiliateLink(id);
        showMessage(result.message);
    };

    const handleGenerateApiKey = async () => {
        setIsSaving(true);
        const result = await generateApiKey();
        showMessage(result.message);
        if (result.success && result.fullKey) {
            setGeneratedKey(result.fullKey);
        }
        setIsSaving(false);
    };

    const handleRevokeApiKey = async (id: string) => {
        const result = await revokeApiKey(id);
        showMessage(result.message);
    };

    const handleToggleIntegration = async (provider: string, currentlyConnected: boolean) => {
        setIsSaving(true);
        const result = await toggleIntegration(provider, !currentlyConnected);
        showMessage(result.message);
        setIsSaving(false);
    };

    const handleUpdateRole = async (memberId: string, currentRole: 'EDITOR' | 'VIEWER') => {
        const newRole = currentRole === 'EDITOR' ? 'VIEWER' : 'EDITOR';
        const result = await updateMemberRole(memberId, newRole);
        showMessage(result.message);
    };

    // Avatar upload handler
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
            showMessage('Por favor, selecione uma imagem válida');
            return;
        }

        // Validar tamanho (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showMessage('A imagem deve ter no máximo 5MB');
            return;
        }

        setUploadingAvatar(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}_${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // Upload para Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('media')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                showMessage('Erro ao fazer upload: ' + uploadError.message);
                return;
            }

            // Obter URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('media')
                .getPublicUrl(filePath);

            // Atualizar estado do perfil com a nova URL
            setProfile({ ...profile, avatar: publicUrl });
            showMessage('Foto atualizada! Clique em "Salvar Perfil" para confirmar.');
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            showMessage('Erro ao fazer upload da imagem');
        } finally {
            setUploadingAvatar(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-full flex flex-col animate-fade-in-up">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <span className="premium-badge px-2.5 py-1 rounded-full text-[10px] font-semibold text-onyx-400 uppercase tracking-widest">Configurações</span>
                </div>
                <h1 className="text-3xl font-semibold text-gradient tracking-tight">Configurações</h1>
                <p className="text-onyx-500 text-sm mt-1">Gerencie sua conta e preferências</p>
            </div>

            {/* Generated Key Modal */}
            {generatedKey && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center pt-4 px-4 pb-4">
                    {/* ... modal content ... */}
                </div>
            )}

            <div className="flex-1 flex gap-8">
                {/* Sidebar Tabs */}
                <div className="w-60 flex-shrink-0">
                    <nav className="space-y-1">
                        {tabs.map((tab, index) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{ animationDelay: `${index * 50}ms` }}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ease-premium group animate-fade-in ${activeTab === tab.id
                                    ? 'premium-btn text-black shadow-premium'
                                    : 'text-onyx-400 hover:text-white hover:bg-white/[0.03]'
                                    }`}
                            >
                                <tab.icon size={18} className={activeTab === tab.id ? '' : 'opacity-60 group-hover:opacity-100'} />
                                <span className="flex-1 text-left">{tab.label}</span>
                                {activeTab === tab.id && <ChevronRight size={14} className="opacity-40" />}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex-1 glass-panel rounded-3xl px-8 pt-8 pb-20 overflow-y-auto custom-scrollbar">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <h2 className="text-xl font-semibold text-white mb-1">Informações do Perfil</h2>
                                <p className="text-onyx-500 text-sm">Atualize suas informações pessoais</p>
                            </div>

                            {/* Avatar */}
                            <div className="flex items-center gap-6">
                                <div className="relative group">
                                    <input
                                        type="file"
                                        ref={avatarInputRef}
                                        onChange={handleAvatarUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-onyx-700 to-onyx-800 border border-white/[0.06] flex items-center justify-center text-3xl font-semibold text-white shadow-premium transition-all group-hover:shadow-premium-lg overflow-hidden">
                                        {uploadingAvatar ? (
                                            <Loader2 className="w-8 h-8 animate-spin text-white" />
                                        ) : profile.avatar ? (
                                            <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            profile.name ? profile.name.charAt(0).toUpperCase() : 'U'
                                        )}
                                    </div>
                                    <button
                                        onClick={() => avatarInputRef.current?.click()}
                                        disabled={uploadingAvatar}
                                        className="absolute -bottom-2 -right-2 p-2.5 premium-btn rounded-xl shadow-premium-lg transition-transform hover:scale-105 disabled:opacity-50"
                                    >
                                        <Camera size={14} />
                                    </button>
                                </div>
                                <div>
                                    <p className="text-white font-medium text-lg">{profile.name || 'Seu Nome'}</p>
                                    <p className="text-onyx-500 text-sm">{profile.email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-semibold text-onyx-400 uppercase tracking-wider">Nome Completo</label>
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={e => setProfile({ ...profile, name: e.target.value })}
                                        className="w-full premium-input rounded-xl px-4 py-3.5 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-semibold text-onyx-400 uppercase tracking-wider">E-mail</label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="w-full premium-input rounded-xl px-4 py-3.5 text-onyx-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-semibold text-onyx-400 uppercase tracking-wider">Bio</label>
                                <textarea
                                    value={profile.bio}
                                    onChange={e => setProfile({ ...profile, bio: e.target.value })}
                                    placeholder="Conte um pouco sobre você..."
                                    className="w-full premium-input rounded-xl px-4 py-3.5 text-white h-28 resize-none"
                                />
                            </div>

                            <button
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                                className="premium-btn flex items-center gap-2.5 text-black px-7 py-3.5 rounded-xl font-semibold text-sm disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {isSaving ? 'Salvando...' : 'Salvar Perfil'}
                            </button>

                            <div className="premium-divider" />

                            <div className="space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                        <Lock size={16} className="text-onyx-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">Segurança</h3>
                                        <p className="text-onyx-500 text-xs">Altere sua senha de acesso</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="block text-[11px] font-semibold text-onyx-400 uppercase tracking-wider">Senha Atual</label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={e => setCurrentPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full premium-input rounded-xl px-4 py-3.5 text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[11px] font-semibold text-onyx-400 uppercase tracking-wider">Nova Senha</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full premium-input rounded-xl px-4 py-3.5 text-white"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleChangePassword}
                                    disabled={isSaving || !newPassword}
                                    className="premium-btn-ghost flex items-center gap-2.5 text-white px-7 py-3.5 rounded-xl font-semibold text-sm disabled:opacity-50 border border-white/10"
                                >
                                    <Lock size={16} />
                                    Alterar Senha
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Team Tab */}
                    {activeTab === 'team' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-white mb-1">Gerenciar Equipe</h2>
                                    <p className="text-onyx-500 text-sm">Convide membros para sua área</p>
                                </div>
                                <span className="premium-badge px-3 py-1.5 rounded-lg text-xs font-medium text-onyx-400">
                                    {teamMembers.length + 1} membro{teamMembers.length !== 0 && 's'}
                                </span>
                            </div>

                            {/* Invite Form */}
                            <div className="premium-card rounded-2xl p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                        <Send size={14} className="text-onyx-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium text-sm">Convidar Membro</h3>
                                        <p className="text-onyx-500 text-xs">Adicione por e-mail</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                        placeholder="email@exemplo.com"
                                        className="flex-1 premium-input rounded-xl px-4 py-3 text-white text-sm"
                                    />
                                    <select
                                        value={inviteRole}
                                        onChange={e => setInviteRole(e.target.value as 'EDITOR' | 'VIEWER')}
                                        className="premium-input rounded-xl px-4 py-3 text-white text-sm"
                                    >
                                        <option value="VIEWER">Visualizador</option>
                                        <option value="EDITOR">Editor</option>
                                    </select>
                                    <button
                                        onClick={handleInvite}
                                        disabled={isSaving || !inviteEmail}
                                        className="premium-btn flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-black disabled:opacity-50"
                                    >
                                        <Plus size={14} /> Convidar
                                    </button>
                                </div>
                            </div>

                            {/* Team List */}
                            <div className="space-y-3">
                                {/* Owner (current user) */}
                                <div className="premium-card flex items-center gap-4 p-4 rounded-2xl">
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-onyx-700 to-onyx-800 border border-white/[0.06] flex items-center justify-center text-white font-semibold">
                                        {user.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium">{user.name} <span className="text-onyx-500 text-xs ml-1">(você)</span></p>
                                        <p className="text-onyx-500 text-sm">{user.email}</p>
                                    </div>
                                    <span className="px-3 py-1.5 bg-white/5 text-white/70 rounded-lg text-xs font-semibold border border-white/[0.06]">
                                        Proprietário
                                    </span>
                                </div>

                                {teamMembers.map(member => (
                                    <div key={member.id} className="premium-card flex items-center gap-4 p-4 rounded-2xl group">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-onyx-700 to-onyx-800 border border-white/[0.06] flex items-center justify-center text-white font-semibold">
                                            {member.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{member.name}</p>
                                            <p className="text-onyx-500 text-sm">{member.email}</p>
                                        </div>
                                        {member.status === 'pending' ? (
                                            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                                Pendente
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleUpdateRole(member.id, member.role as 'EDITOR' | 'VIEWER')}
                                                title="Clique para alterar permissão"
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all hover:scale-105 ${member.role === 'EDITOR'
                                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
                                                    : 'bg-white/5 text-onyx-400 border border-white/[0.06] hover:bg-white/10'
                                                    }`}
                                            >
                                                {member.role === 'EDITOR' ? 'Editor' : 'Visualizador'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="p-2.5 rounded-xl text-onyx-600 hover:text-white hover:bg-white/[0.03] opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}

                                {teamMembers.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center mx-auto mb-4">
                                            <Users size={24} className="text-onyx-600" />
                                        </div>
                                        <p className="text-onyx-400 font-medium">Nenhum membro convidado</p>
                                        <p className="text-onyx-600 text-sm mt-1">Use o formulário acima para convidar pessoas</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Affiliates Tab */}
                    {activeTab === 'affiliates' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-white mb-1">Afiliados</h2>
                                    <p className="text-onyx-500 text-sm">Ganhe comissão vitalícia quando alguém criar ou entrar em uma comunidade através do seu link.</p>
                                </div>
                            </div>

                            {/* Stats Cards - Inspired by Skool */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="stat-card rounded-2xl p-5 text-center">
                                    <p className="text-3xl font-semibold text-white number-display mb-1">R$ 0</p>
                                    <p className="text-onyx-500 text-[11px] uppercase font-semibold tracking-wider">Últimos 30 dias</p>
                                </div>
                                <div className="stat-card rounded-2xl p-5 text-center">
                                    <p className="text-3xl font-semibold text-white number-display mb-1">R$ 0</p>
                                    <p className="text-onyx-500 text-[11px] uppercase font-semibold tracking-wider">Vitalício</p>
                                </div>
                                <div className="stat-card rounded-2xl p-5 text-center">
                                    <p className="text-3xl font-semibold text-onyx-400 number-display mb-1">R$ 0</p>
                                    <p className="text-onyx-500 text-[11px] uppercase font-semibold tracking-wider">Saldo disponível</p>
                                </div>
                                <div className="stat-card rounded-2xl p-5 flex items-center justify-center">
                                    <button className="premium-btn-ghost px-6 py-3 rounded-xl text-white font-semibold text-sm border border-white/10 hover:bg-white/5 transition-all">
                                        SACAR
                                    </button>
                                </div>
                            </div>

                            <p className="text-right text-onyx-600 text-xs">R$ 0 disponível em breve</p>

                            {/* Affiliate Links Section */}
                            <div className="space-y-4">
                                <h3 className="text-white font-medium">Seus links de afiliado</h3>

                                {/* Product Tabs */}
                                <div className="flex gap-2">
                                    {affiliateLinks.length === 0 ? (
                                        <button className="px-4 py-2 rounded-lg bg-onyx-700 text-white text-sm font-medium">
                                            Plataforma Onyx
                                        </button>
                                    ) : (
                                        affiliateLinks.map((link, index) => (
                                            <button
                                                key={link.id}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${index === 0 ? 'bg-onyx-700 text-white' : 'bg-white/[0.03] text-onyx-400 hover:bg-white/[0.05] hover:text-white'}`}
                                            >
                                                {link.name}
                                            </button>
                                        ))
                                    )}
                                </div>

                                {/* Commission Info */}
                                <p className="text-onyx-400 text-sm">
                                    Ganhe <span className="text-onyx-300 font-semibold">40% de comissão</span> quando alguém criar ou entrar em uma comunidade Onyx através do seu link.
                                </p>

                                {/* Affiliate Link Copy */}
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 premium-input rounded-xl px-4 py-3.5 text-onyx-300 font-mono text-sm">
                                        https://onyxclub.io/r/{affiliateLinks[0]?.code || 'seu-codigo'}
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(`https://onyxclub.io/r/${affiliateLinks[0]?.code || 'seu-codigo'}`, 'affiliate-link')}
                                        className="premium-btn px-6 py-3.5 rounded-xl font-semibold text-sm text-black"
                                    >
                                        {copied === 'affiliate-link' ? 'COPIADO!' : 'COPIAR'}
                                    </button>
                                </div>

                                {/* Status Badge */}
                                <div className="flex justify-end">
                                    <span className="text-onyx-500 text-sm flex items-center gap-1.5">
                                        Ativo <ChevronRight size={14} className="rotate-90" />
                                    </span>
                                </div>
                            </div>

                            {/* Create New Link */}
                            <div className="premium-divider" />

                            <div className="premium-card rounded-2xl p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                        <Link2 size={14} className="text-onyx-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium text-sm">Criar Novo Link</h3>
                                        <p className="text-onyx-500 text-xs">Gere um link de afiliado para um produto específico</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={newLinkName}
                                        onChange={e => setNewLinkName(e.target.value)}
                                        placeholder="Nome do produto (ex: Curso Premium)"
                                        className="flex-1 premium-input rounded-xl px-4 py-3 text-white text-sm"
                                    />
                                    <div className="flex items-center gap-2 premium-input rounded-xl px-4">
                                        <input
                                            type="number"
                                            value={newLinkCommission}
                                            onChange={e => setNewLinkCommission(Number(e.target.value))}
                                            className="w-12 bg-transparent text-white text-sm focus:outline-none text-center"
                                            min={1}
                                            max={100}
                                        />
                                        <span className="text-onyx-500 text-sm">%</span>
                                    </div>
                                    <button
                                        onClick={handleCreateAffiliateLink}
                                        disabled={isSaving || !newLinkName}
                                        className="premium-btn flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-black disabled:opacity-50"
                                    >
                                        <Plus size={14} /> Criar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Integrations Tab */}
                    {activeTab === 'integrations' && (
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <h2 className="text-xl font-semibold text-white mb-1">Integrações</h2>
                                <p className="text-onyx-500 text-sm">Conecte serviços e automatize processos</p>
                            </div>

                            {/* Webhook */}
                            <div className="premium-card rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                        <Webhook size={18} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">Webhook URL</h3>
                                        <p className="text-onyx-500 text-xs">Receba eventos em tempo real</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <code className="flex-1 premium-input rounded-xl px-4 py-3.5 text-sm text-onyx-300 font-mono">
                                        {webhookUrl}
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                                        className="premium-btn-ghost p-3.5 rounded-xl text-onyx-400 hover:text-white"
                                    >
                                        {copied === 'webhook' ? <Check size={16} className="text-white" /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* API Keys */}
                            <div className="premium-card rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                            <Shield size={18} className="text-onyx-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">Chaves API</h3>
                                            <p className="text-onyx-500 text-xs">Autenticação para integrações</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleGenerateApiKey}
                                        disabled={isSaving}
                                        className="premium-btn flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-black disabled:opacity-50"
                                    >
                                        <Key size={14} /> Nova Chave
                                    </button>
                                </div>

                                {apiKeys.length === 0 ? (
                                    <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                                        <Key size={24} className="text-onyx-600 mx-auto mb-2" />
                                        <p className="text-onyx-500 text-sm">Nenhuma chave API</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {apiKeys.map(key => (
                                            <div key={key.id} className="flex items-center gap-3 p-3 bg-black/30 rounded-xl group">
                                                <code className="flex-1 text-sm text-onyx-300 font-mono">
                                                    {key.keyPrefix}••••••••••••
                                                </code>
                                                <span className="text-onyx-600 text-xs">
                                                    {new Date(key.createdAt).toLocaleDateString('pt-BR')}
                                                </span>
                                                <button
                                                    onClick={() => handleRevokeApiKey(key.id)}
                                                    className="p-2 rounded-lg text-red-500/50 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Revogar chave"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Connected Apps */}
                            <div>
                                <h3 className="text-[11px] font-semibold text-onyx-400 uppercase tracking-wider mb-4">Aplicativos</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {['stripe', 'hotmart', 'activecampaign', 'zapier'].map(provider => {
                                        const meta = INTEGRATION_META[provider];
                                        const integration = integrations.find(i => i.provider === provider);
                                        const isConnected = integration?.isConnected || false;

                                        return (
                                            <div key={provider} className="premium-card flex items-center gap-4 p-4 rounded-2xl">
                                                <span className="text-2xl">{meta.icon}</span>
                                                <div className="flex-1">
                                                    <p className="text-white font-medium">{meta.name}</p>
                                                    <p className="text-onyx-500 text-xs">{meta.desc}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleToggleIntegration(provider, isConnected)}
                                                    disabled={isSaving}
                                                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${isConnected
                                                        ? 'bg-white/5 text-white/70 border border-white/[0.06]'
                                                        : 'premium-btn-ghost text-onyx-400 hover:text-white'
                                                        }`}
                                                >
                                                    {isConnected ? 'Conectado' : 'Conectar'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <h2 className="text-xl font-semibold text-white mb-1">Preferências de Notificação</h2>
                                <p className="text-onyx-500 text-sm">Escolha como deseja ser notificado</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Mail size={14} className="text-onyx-500" />
                                    <h3 className="text-[11px] font-semibold text-onyx-400 uppercase tracking-wider">Notificações por E-mail</h3>
                                </div>
                                {[
                                    { key: 'emailNewSale', label: 'Nova venda realizada', desc: 'Receba um email a cada nova venda' },
                                    { key: 'emailNewLead', label: 'Novo lead capturado', desc: 'Quando alguém se cadastra na sua lista' },
                                    { key: 'emailWeeklyReport', label: 'Relatório semanal', desc: 'Resumo das suas métricas toda segunda-feira' },
                                ].map(item => (
                                    <div key={item.key} className="premium-card flex items-center justify-between p-4 rounded-2xl">
                                        <div>
                                            <p className="text-white font-medium">{item.label}</p>
                                            <p className="text-onyx-500 text-xs mt-0.5">{item.desc}</p>
                                        </div>
                                        <button
                                            onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                                            className={`w-12 h-7 rounded-full transition-all duration-300 relative ${notifications[item.key as keyof typeof notifications]
                                                ? 'bg-white'
                                                : 'toggle-premium'
                                                }`}
                                        >
                                            <div className={`absolute top-1 w-5 h-5 rounded-full shadow-lg transition-all duration-300 ${notifications[item.key as keyof typeof notifications]
                                                ? 'left-6 bg-black'
                                                : 'left-1 bg-onyx-400'
                                                }`} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="premium-divider" />

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Bell size={14} className="text-onyx-500" />
                                    <h3 className="text-[11px] font-semibold text-onyx-400 uppercase tracking-wider">Notificações Push</h3>
                                </div>
                                {[
                                    { key: 'pushNewSale', label: 'Nova venda', desc: 'Notificação instantânea no navegador' },
                                    { key: 'pushNewMember', label: 'Novo membro', desc: 'Quando alguém entra na área de membros' },
                                ].map(item => (
                                    <div key={item.key} className="premium-card flex items-center justify-between p-4 rounded-2xl">
                                        <div>
                                            <p className="text-white font-medium">{item.label}</p>
                                            <p className="text-onyx-500 text-xs mt-0.5">{item.desc}</p>
                                        </div>
                                        <button
                                            onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                                            className={`w-12 h-7 rounded-full transition-all duration-300 relative ${notifications[item.key as keyof typeof notifications]
                                                ? 'bg-white'
                                                : 'toggle-premium'
                                                }`}
                                        >
                                            <div className={`absolute top-1 w-5 h-5 rounded-full shadow-lg transition-all duration-300 ${notifications[item.key as keyof typeof notifications]
                                                ? 'left-6 bg-black'
                                                : 'left-1 bg-onyx-400'
                                                }`} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleSaveNotifications}
                                disabled={isSaving}
                                className="premium-btn flex items-center gap-2.5 text-black px-7 py-3.5 rounded-xl font-semibold text-sm disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Salvar Preferências
                            </button>
                        </div>
                    )}

                    {/* Customization Tab */}
                    {activeTab === 'customization' && (
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <h2 className="text-xl font-semibold text-white mb-1">Personalização</h2>
                                <p className="text-onyx-500 text-sm">Customize a aparência da sua área</p>
                            </div>

                            {/* Brand Color */}
                            <div className="space-y-3">
                                <label className="block text-[11px] font-semibold text-onyx-400 uppercase tracking-wider">Cor da Marca</label>
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <input
                                            type="color"
                                            value={customization.brandColor}
                                            onChange={e => setCustomization({ ...customization, brandColor: e.target.value })}
                                            className="w-14 h-14 rounded-xl cursor-pointer bg-transparent border-2 border-white/[0.06] shadow-premium"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={customization.brandColor}
                                        onChange={e => setCustomization({ ...customization, brandColor: e.target.value })}
                                        className="w-32 premium-input rounded-xl px-4 py-3 text-white text-sm font-mono uppercase"
                                    />
                                </div>
                            </div>

                            {/* Custom Domain */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[11px] font-semibold text-onyx-400 uppercase tracking-wider">
                                    <Globe size={12} /> Domínio Personalizado
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={customization.customDomain}
                                        onChange={e => setCustomization({ ...customization, customDomain: e.target.value })}
                                        placeholder="meusite.com.br"
                                        className="flex-1 premium-input rounded-xl px-4 py-3.5 text-white"
                                    />
                                    <button className="premium-btn-ghost px-5 py-3.5 rounded-xl text-onyx-400 hover:text-white flex items-center gap-2 font-medium text-sm">
                                        <ExternalLink size={14} /> Verificar DNS
                                    </button>
                                </div>
                                <p className="text-xs text-onyx-500">
                                    Aponte seu CNAME para <code className="bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded text-onyx-400">app.onyxclub.io</code>
                                </p>
                            </div>

                            {/* Logo Upload */}
                            <div className="space-y-3">
                                <label className="block text-[11px] font-semibold text-onyx-400 uppercase tracking-wider">Logo</label>
                                <div className="flex items-center gap-5">
                                    <div className="w-28 h-28 rounded-2xl premium-card border-2 border-dashed border-white/[0.08] flex flex-col items-center justify-center text-onyx-500 hover:border-white/20 hover:text-white transition-all cursor-pointer group">
                                        <Camera size={24} className="mb-1 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] uppercase tracking-wider">Upload</span>
                                    </div>
                                    <div className="text-onyx-500 text-sm">
                                        <p className="text-onyx-400 font-medium">Arraste ou clique para fazer upload</p>
                                        <p className="text-xs mt-1">PNG, JPG ou SVG. Máximo 2MB.</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveCustomization}
                                disabled={isSaving}
                                className="premium-btn flex items-center gap-2.5 text-black px-7 py-3.5 rounded-xl font-semibold text-sm disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                Salvar Personalização
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
