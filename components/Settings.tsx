import React, { useState } from 'react';
import { User, Mail, Lock, Users, Link2, Bell, Palette, Webhook, Copy, Check, Plus, Trash2, Send, Shield, Globe, Camera, Save, ExternalLink, ChevronRight, Sparkles } from 'lucide-react';

interface SettingsProps {
    user: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    tenantId?: string;
}

interface TeamMember {
    id: string;
    email: string;
    name: string;
    role: 'OWNER' | 'EDITOR' | 'VIEWER';
    status: 'active' | 'pending';
    avatar?: string;
}

interface AffiliateLink {
    id: string;
    name: string;
    code: string;
    commission: number;
    clicks: number;
    conversions: number;
}

type SettingsTab = 'profile' | 'team' | 'affiliates' | 'integrations' | 'notifications' | 'customization';

export const Settings: React.FC<SettingsProps> = ({ user, tenantId }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    // Profile state
    const [profileData, setProfileData] = useState({
        name: user.name || '',
        email: user.email || '',
        bio: '',
        avatar: user.avatar || ''
    });

    // Team state
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'EDITOR' | 'VIEWER'>('VIEWER');

    // Affiliate state
    const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([
        { id: '1', name: 'Link Principal', code: 'ONYX2024', commission: 30, clicks: 1250, conversions: 45 },
        { id: '2', name: 'Instagram Bio', code: 'INSTA30', commission: 30, clicks: 890, conversions: 23 },
    ]);
    const [newLinkName, setNewLinkName] = useState('');
    const [newLinkCommission, setNewLinkCommission] = useState(30);

    // Notification preferences
    const [notifications, setNotifications] = useState({
        emailNewSale: true,
        emailNewLead: true,
        emailWeeklyReport: true,
        pushNewSale: false,
        pushNewMember: true,
    });

    // Customization state
    const [customization, setCustomization] = useState({
        brandColor: '#ffffff',
        logo: '',
        customDomain: '',
        favicon: ''
    });

    // Integrations state
    const [copied, setCopied] = useState<string | null>(null);
    const webhookUrl = `https://api.onyxclub.io/webhook/${tenantId || 'demo'}`;
    const apiKey = 'onyx_live_sk_1234567890abcdef';

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

    const handleSave = async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaveMessage('Alterações salvas com sucesso!');
        setIsSaving(false);
        setTimeout(() => setSaveMessage(null), 3000);
    };

    const handleInvite = () => {
        if (!inviteEmail.trim()) return;
        const newMember: TeamMember = {
            id: `temp-${Date.now()}`,
            email: inviteEmail,
            name: inviteEmail.split('@')[0],
            role: inviteRole,
            status: 'pending'
        };
        setTeamMembers([...teamMembers, newMember]);
        setInviteEmail('');
        setSaveMessage(`Convite enviado para ${inviteEmail}`);
        setTimeout(() => setSaveMessage(null), 3000);
    };

    const handleRemoveMember = (id: string) => {
        setTeamMembers(teamMembers.filter(m => m.id !== id));
    };

    const handleCreateAffiliateLink = () => {
        if (!newLinkName.trim()) return;
        const code = newLinkName.toUpperCase().replace(/\s+/g, '').slice(0, 8) + Math.random().toString(36).slice(2, 6).toUpperCase();
        const newLink: AffiliateLink = {
            id: `link-${Date.now()}`,
            name: newLinkName,
            code,
            commission: newLinkCommission,
            clicks: 0,
            conversions: 0
        };
        setAffiliateLinks([...affiliateLinks, newLink]);
        setNewLinkName('');
    };

    return (
        <div className="h-full flex flex-col animate-fade-in-up">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <span className="premium-badge px-2.5 py-1 rounded-full text-[10px] font-semibold text-onyx-400 uppercase tracking-widest">Configurações</span>
                </div>
                <h1 className="text-3xl font-semibold text-gradient tracking-tight">Configurações</h1>
                <p className="text-onyx-500 text-sm mt-1">Gerencie sua conta e preferências</p>
            </div>

            {/* Success Message */}
            {saveMessage && (
                <div className="mb-6 premium-card p-4 rounded-2xl flex items-center gap-3 animate-fade-in-up border-l-2 border-l-white/20">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <Check size={14} className="text-white" />
                    </div>
                    <span className="text-white/90 text-sm font-medium">{saveMessage}</span>
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

                {/* Content Area */}
                <div className="flex-1 glass-panel rounded-3xl p-8 overflow-y-auto custom-scrollbar">
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
                                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-onyx-700 to-onyx-800 border border-white/[0.06] flex items-center justify-center text-3xl font-semibold text-white shadow-premium transition-all group-hover:shadow-premium-lg">
                                        {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <button className="absolute -bottom-2 -right-2 p-2.5 premium-btn rounded-xl shadow-premium-lg transition-transform hover:scale-105">
                                        <Camera size={14} />
                                    </button>
                                </div>
                                <div>
                                    <p className="text-white font-medium text-lg">{profileData.name || 'Seu Nome'}</p>
                                    <p className="text-onyx-500 text-sm">{profileData.email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-semibold text-onyx-400 uppercase tracking-wider">Nome Completo</label>
                                    <input
                                        type="text"
                                        value={profileData.name}
                                        onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                                        className="w-full premium-input rounded-xl px-4 py-3.5 text-white placeholder-onyx-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-semibold text-onyx-400 uppercase tracking-wider">E-mail</label>
                                    <input
                                        type="email"
                                        value={profileData.email}
                                        onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                                        className="w-full premium-input rounded-xl px-4 py-3.5 text-white placeholder-onyx-600"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-semibold text-onyx-400 uppercase tracking-wider">Bio</label>
                                <textarea
                                    value={profileData.bio}
                                    onChange={e => setProfileData({ ...profileData, bio: e.target.value })}
                                    placeholder="Conte um pouco sobre você..."
                                    className="w-full premium-input rounded-xl px-4 py-3.5 text-white placeholder-onyx-600 h-28 resize-none"
                                />
                            </div>

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
                                            placeholder="••••••••"
                                            className="w-full premium-input rounded-xl px-4 py-3.5 text-white placeholder-onyx-600"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[11px] font-semibold text-onyx-400 uppercase tracking-wider">Nova Senha</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full premium-input rounded-xl px-4 py-3.5 text-white placeholder-onyx-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="premium-btn flex items-center gap-2.5 text-black px-7 py-3.5 rounded-xl font-semibold text-sm disabled:opacity-50"
                            >
                                {isSaving ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Save size={16} />}
                                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
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
                                        <p className="text-onyx-500 text-xs">Envie um convite por e-mail</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                        placeholder="email@exemplo.com"
                                        className="flex-1 premium-input rounded-xl px-4 py-3 text-white text-sm placeholder-onyx-600"
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
                                        className="premium-btn flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-black"
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
                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${member.status === 'pending'
                                                ? 'bg-white/5 text-onyx-400 border border-white/[0.06]'
                                                : member.role === 'EDITOR'
                                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                    : 'bg-white/5 text-onyx-400 border border-white/[0.06]'
                                            }`}>
                                            {member.status === 'pending' ? 'Pendente' : member.role === 'EDITOR' ? 'Editor' : 'Visualizador'}
                                        </span>
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
                                    <h2 className="text-xl font-semibold text-white mb-1">Programa de Afiliados</h2>
                                    <p className="text-onyx-500 text-sm">Gerencie seus links e comissões</p>
                                </div>
                                <div className="flex items-center gap-2 premium-badge px-3 py-1.5 rounded-lg">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full live-indicator"></span>
                                    <span className="text-white/70 text-xs font-medium">Ativo</span>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="stat-card rounded-2xl p-5">
                                    <p className="text-onyx-500 text-[11px] uppercase font-semibold tracking-wider mb-2">Total de Cliques</p>
                                    <p className="text-3xl font-semibold text-white number-display">{affiliateLinks.reduce((acc, l) => acc + l.clicks, 0).toLocaleString()}</p>
                                </div>
                                <div className="stat-card rounded-2xl p-5">
                                    <p className="text-onyx-500 text-[11px] uppercase font-semibold tracking-wider mb-2">Conversões</p>
                                    <p className="text-3xl font-semibold text-white number-display">{affiliateLinks.reduce((acc, l) => acc + l.conversions, 0)}</p>
                                </div>
                                <div className="stat-card rounded-2xl p-5">
                                    <p className="text-onyx-500 text-[11px] uppercase font-semibold tracking-wider mb-2">Comissão Média</p>
                                    <p className="text-3xl font-semibold text-white number-display">{affiliateLinks.length > 0 ? Math.round(affiliateLinks.reduce((acc, l) => acc + l.commission, 0) / affiliateLinks.length) : 0}%</p>
                                </div>
                            </div>

                            {/* Create Link */}
                            <div className="premium-card rounded-2xl p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                        <Link2 size={14} className="text-onyx-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium text-sm">Criar Novo Link</h3>
                                        <p className="text-onyx-500 text-xs">Gere um link de afiliado personalizado</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={newLinkName}
                                        onChange={e => setNewLinkName(e.target.value)}
                                        placeholder="Nome do link (ex: YouTube)"
                                        className="flex-1 premium-input rounded-xl px-4 py-3 text-white text-sm placeholder-onyx-600"
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
                                        className="premium-btn flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-black"
                                    >
                                        <Plus size={14} /> Criar
                                    </button>
                                </div>
                            </div>

                            {/* Links List */}
                            <div className="space-y-3">
                                {affiliateLinks.map(link => (
                                    <div key={link.id} className="premium-card flex items-center gap-4 p-4 rounded-2xl group">
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{link.name}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <code className="text-xs bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 rounded-lg text-onyx-400 font-mono">
                                                    onyxclub.io/r/{link.code}
                                                </code>
                                                <button
                                                    onClick={() => copyToClipboard(`https://onyxclub.io/r/${link.code}`, link.id)}
                                                    className="p-1.5 rounded-lg text-onyx-500 hover:text-white hover:bg-white/[0.03] transition-all"
                                                >
                                                    {copied === link.id ? <Check size={14} className="text-white" /> : <Copy size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white font-semibold text-lg number-display">{link.commission}%</p>
                                            <p className="text-onyx-500 text-xs">{link.clicks.toLocaleString()} cliques • {link.conversions} vendas</p>
                                        </div>
                                        <button className="p-2.5 rounded-xl text-onyx-600 hover:text-white hover:bg-white/[0.03] opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
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

                            {/* API Key */}
                            <div className="premium-card rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                        <Shield size={18} className="text-onyx-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">API Key</h3>
                                        <p className="text-onyx-500 text-xs">Chave secreta para autenticação</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <code className="flex-1 premium-input rounded-xl px-4 py-3.5 text-sm text-onyx-300 font-mono">
                                        {apiKey.slice(0, 20)}••••••••••••
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard(apiKey, 'api')}
                                        className="premium-btn-ghost p-3.5 rounded-xl text-onyx-400 hover:text-white"
                                    >
                                        {copied === 'api' ? <Check size={16} className="text-white" /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Connected Apps */}
                            <div>
                                <h3 className="text-[11px] font-semibold text-onyx-400 uppercase tracking-wider mb-4">Aplicativos Conectados</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { name: 'Stripe', icon: '💳', connected: true, desc: 'Pagamentos' },
                                        { name: 'Hotmart', icon: '🔥', connected: false, desc: 'Vendas' },
                                        { name: 'ActiveCampaign', icon: '📧', connected: true, desc: 'Email Marketing' },
                                        { name: 'Zapier', icon: '⚡', connected: false, desc: 'Automações' },
                                    ].map(app => (
                                        <div key={app.name} className="premium-card flex items-center gap-4 p-4 rounded-2xl">
                                            <span className="text-2xl">{app.icon}</span>
                                            <div className="flex-1">
                                                <p className="text-white font-medium">{app.name}</p>
                                                <p className="text-onyx-500 text-xs">{app.desc}</p>
                                            </div>
                                            <button className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${app.connected
                                                    ? 'bg-white/5 text-white/70 border border-white/[0.06]'
                                                    : 'premium-btn-ghost text-onyx-400 hover:text-white'
                                                }`}>
                                                {app.connected ? 'Conectado' : 'Conectar'}
                                            </button>
                                        </div>
                                    ))}
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
                                onClick={handleSave}
                                disabled={isSaving}
                                className="premium-btn flex items-center gap-2.5 text-black px-7 py-3.5 rounded-xl font-semibold text-sm disabled:opacity-50"
                            >
                                <Save size={16} />
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
                                        className="flex-1 premium-input rounded-xl px-4 py-3.5 text-white placeholder-onyx-600"
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
                                onClick={handleSave}
                                disabled={isSaving}
                                className="premium-btn flex items-center gap-2.5 text-black px-7 py-3.5 rounded-xl font-semibold text-sm disabled:opacity-50"
                            >
                                <Sparkles size={16} />
                                Salvar Personalização
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
