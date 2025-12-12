import React, { useEffect, useCallback, useState } from 'react';
import { ViewState, User } from '../types';
import { LayoutDashboard, KanbanSquare, GraduationCap, Settings, Bell, Search, Hexagon, Users, CreditCard, LogOut, Banknote, ChevronDown, Plus, Menu, X, CheckCircle, AlertCircle, FileText, UserCircle, Loader2, ChevronRight, UserPlus } from 'lucide-react';
import { supabase } from '../services/supabase';
import { InviteModal } from './InviteModal';

interface Tenant {
  id: string;
  name: string;
}

interface Notification {
  id: string;
  tenant_id: string;
  title: string;
  message?: string;
  type: 'success' | 'info' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  link?: string;
}

interface SearchResult {
  id: string;
  title: string;
  type: 'task' | 'lead' | 'lesson' | 'module';
  description?: string;
}

interface LayoutProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  children: React.ReactNode;
  user: User;
  selectedTenantId?: string | null;
  onTenantChange?: (tenantId: string) => void;
}

// Helper to format relative time
const formatRelativeTime = (date: string) => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `Há ${diffMins} min`;
  if (diffHours < 24) return `Há ${diffHours} h`;
  if (diffDays < 7) return `Há ${diffDays} d`;
  return past.toLocaleDateString('pt-BR');
};

export const Layout: React.FC<LayoutProps> = ({ currentView, setView, children, user, selectedTenantId, onTenantChange }) => {
  const [isClientMenuOpen, setIsClientMenuOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isAddingTenant, setIsAddingTenant] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Search states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || !selectedTenant) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results: SearchResult[] = [];

    try {
      // Search tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, description')
        .eq('tenant_id', selectedTenant.id)
        .ilike('title', `%${query}%`)
        .limit(5);

      if (tasks) {
        results.push(...tasks.map(t => ({ id: t.id, title: t.title, type: 'task' as const, description: t.description })));
      }

      // Search leads
      const { data: leads } = await supabase
        .from('leads')
        .select('id, name, email')
        .eq('tenant_id', selectedTenant.id)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(5);

      if (leads) {
        results.push(...leads.map(l => ({ id: l.id, title: l.name, type: 'lead' as const, description: l.email })));
      }

      // Search modules
      const { data: modules } = await supabase
        .from('modules')
        .select('id, title, description')
        .eq('tenant_id', selectedTenant.id)
        .ilike('title', `%${query}%`)
        .limit(5);

      if (modules) {
        results.push(...modules.map(m => ({ id: m.id, title: m.title, type: 'module' as const, description: m.description })));
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [selectedTenant]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isSearchOpen) {
        performSearch(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isSearchOpen, performSearch]);

  // Fetch tenants from Supabase
  useEffect(() => {
    const fetchTenants = async () => {
      const { data, error } = await supabase.from('tenants').select('id, name').order('name');
      if (!error && data) {
        setTenants(data);
        // Set initial selected tenant
        if (data.length > 0) {
          const current = selectedTenantId ? data.find(t => t.id === selectedTenantId) : data[0];
          setSelectedTenant(current || data[0]);
        }
      }
    };
    fetchTenants();
  }, [selectedTenantId]);

  // Fetch notifications from Supabase
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!selectedTenant) return;

      setIsLoadingNotifications(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('tenant_id', selectedTenant.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setNotifications(data);
      }
      setIsLoadingNotifications(false);
    };

    fetchNotifications();

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          if (payload.new && (payload.new as Notification).tenant_id === selectedTenant?.id) {
            setNotifications(prev => [payload.new as Notification, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTenant]);

  const handleTenantSelect = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsClientMenuOpen(false);
    onTenantChange?.(tenant.id);
  };

  const handleAddTenant = async () => {
    if (!newTenantName.trim()) return;

    const { data, error } = await supabase.from('tenants').insert([{ name: newTenantName.trim() }]).select();
    if (!error && data && data[0]) {
      setTenants([...tenants, data[0]]);
      setSelectedTenant(data[0]);
      onTenantChange?.(data[0].id);
      setNewTenantName('');
      setIsAddingTenant(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    if (!selectedTenant) return;

    // Update local state immediately
    setNotifications(notifications.map(n => ({ ...n, read: true })));

    // Update in Supabase
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('tenant_id', selectedTenant.id)
      .eq('read', false);
  };

  const markAsRead = async (id: string) => {
    // Update local state immediately
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleSearchResultClick = (result: SearchResult) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    // Navigate to appropriate view based on result type
    if (result.type === 'task') setView(ViewState.KANBAN);
    else if (result.type === 'lead') setView(ViewState.LEADS);
    else if (result.type === 'module') setView(ViewState.MEMBER_AREA);
  };

  const getSearchResultIcon = (type: string) => {
    switch (type) {
      case 'task': return <KanbanSquare size={16} className="text-cyan-400" />;
      case 'lead': return <UserCircle size={16} className="text-cyan-400" />;
      case 'module': return <GraduationCap size={16} className="text-cyan-400" />;
      case 'lesson': return <FileText size={16} className="text-cyan-400" />;
      default: return <FileText size={16} className="text-cyan-500" />;
    }
  };

  return (
    <div className="flex h-screen bg-flux-black text-flux-text-secondary overflow-hidden font-sans selection:bg-flux-accent-blue/20 selection:text-white">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-md transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-flux-black flex flex-col border-r border-flux-border transition-transform duration-300 ease-IN-OUT lg:translate-x-0 lg:static lg:inset-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-flux-border">
          <button className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black transition-colors group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              <Hexagon className="w-5 h-5 fill-black" />
            </div>
            <div className="block flex-1 text-left">
              <h1 className="text-sm font-bold text-white leading-none tracking-tight">Onyx Club</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] text-flux-text-secondary font-medium uppercase tracking-wider">Online</span>
              </div>
            </div>
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 text-flux-text-tertiary hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-8 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-semibold text-flux-text-tertiary uppercase tracking-widest mb-3 block">Gerenciamento</p>

          <NavItem
            icon={<LayoutDashboard size={18} />}
            label="Visão Geral"
            isActive={currentView === ViewState.DASHBOARD}
            onClick={() => setView(ViewState.DASHBOARD)}
          />
          <NavItem
            icon={<KanbanSquare size={18} />}
            label="Pipeline & CRM"
            isActive={currentView === ViewState.KANBAN}
            onClick={() => setView(ViewState.KANBAN)}
          />
          <NavItem
            icon={<Banknote size={18} />}
            label="Vendas"
            isActive={currentView === ViewState.SALES}
            onClick={() => setView(ViewState.SALES)}
          />
          <NavItem
            icon={<Users size={18} />}
            label="Leads"
            isActive={currentView === ViewState.LEADS}
            onClick={() => setView(ViewState.LEADS)}
          />

          <div className="my-8 border-t border-flux-border mx-4"></div>

          <p className="px-4 text-[10px] font-semibold text-flux-text-tertiary uppercase tracking-widest mb-3 block">Educação</p>
          <NavItem
            icon={<GraduationCap size={18} />}
            label="Conteúdos & Aulas"
            isActive={currentView === ViewState.MEMBER_AREA}
            onClick={() => setView(ViewState.MEMBER_AREA)}
          />
        </nav>

        {/* User Profile with Dropdown */}
        <div className="p-4 border-t border-flux-border relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-flux-dark border border-flux-border flex items-center justify-center text-xs font-medium text-white relative">
              {user.name.charAt(0)}
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-flux-black rounded-full"></span>
            </div>
            <div className="block overflow-hidden flex-1 text-left">
              <p className="text-sm text-white font-medium truncate">{user.name}</p>
              <p className="text-[10px] text-flux-text-tertiary uppercase tracking-wide truncate">{user.role.replace('_', ' ')}</p>
            </div>
            <div className="text-flux-text-tertiary group-hover:text-white transition-colors">
              <ChevronDown size={14} className={`transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* User Dropdown Menu */}
          {isUserMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)}></div>
              <div className="absolute bottom-full left-4 right-4 mb-2 flux-card shadow-lg z-20 overflow-hidden animate-fade-in">
                <div className="p-1">
                  <button
                    onClick={() => { setView(ViewState.AFFILIATE); setIsUserMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 transition-colors ${currentView === ViewState.AFFILIATE
                      ? 'bg-white/[0.08] text-white'
                      : 'text-flux-text-secondary hover:bg-white/[0.04] hover:text-white'
                      }`}
                  >
                    <Users size={16} />
                    Afiliados
                  </button>
                  <button
                    onClick={() => { setView(ViewState.BILLING); setIsUserMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-3 transition-colors ${currentView === ViewState.BILLING
                      ? 'bg-white/[0.06] text-white'
                      : 'text-flux-text-secondary hover:bg-white/[0.03] hover:text-white'
                      }`}
                  >
                    <CreditCard size={16} />
                    Faturamento
                  </button>
                  <button
                    onClick={() => { setView(ViewState.SETTINGS); setIsUserMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-3 transition-colors ${currentView === ViewState.SETTINGS
                      ? 'bg-white/[0.06] text-white'
                      : 'text-flux-text-secondary hover:bg-white/[0.03] hover:text-white'
                      }`}
                  >
                    <Settings size={16} />
                    Configurações
                  </button>
                </div>
                <div className="border-t border-flux-border p-1.5">
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      localStorage.removeItem('selectedClientId');
                      window.location.href = '/login';
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-3 text-flux-text-tertiary hover:bg-white/[0.03] hover:text-white transition-colors"
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-flux-black relative">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/4 w-1/2 h-96 bg-flux-accent-blue/5 blur-[100px] pointer-events-none rounded-full -translate-y-1/2"></div>

        <header className="h-16 flex items-center justify-between px-8 z-10 border-b border-flux-border bg-flux-black/80 backdrop-blur sticky top-0">
          <div className="flex items-center gap-6 text-flux-text-secondary">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden text-flux-text-secondary hover:text-white transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="relative">
              <button
                onClick={() => setIsClientMenuOpen(!isClientMenuOpen)}
                className="flex items-center gap-2 hover:text-white transition-colors group px-2 py-1.5 rounded hover:bg-white/[0.03]"
              >
                <span className="hidden md:block text-sm font-medium">
                  {selectedTenant?.name || 'Selecione'} <span className="text-flux-text-tertiary mx-1">/</span> <span className="text-white">{currentView === ViewState.DASHBOARD ? 'Dashboard' : currentView.charAt(0) + currentView.slice(1).toLowerCase().replace('_', ' ')}</span>
                </span>
                <ChevronDown size={14} className={`text-flux-text-tertiary group-hover:text-white transition-transform duration-200 ${isClientMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isClientMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsClientMenuOpen(false)}></div>
                  <div className="absolute top-full left-0 mt-2 w-64 flux-card shadow-lg z-20 overflow-hidden animate-fade-in">
                    <div className="p-3 border-b border-flux-border">
                      <p className="text-[10px] font-bold text-flux-text-tertiary uppercase tracking-widest px-2">Trocar Área de Membros</p>
                    </div>
                    <div className="p-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                      {tenants.length === 0 ? (
                        <p className="text-xs text-flux-text-tertiary px-3 py-2">Nenhuma área encontrada</p>
                      ) : (
                        tenants.map(tenant => (
                          <button
                            key={tenant.id}
                            onClick={() => handleTenantSelect(tenant)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between group transition-colors ${selectedTenant?.id === tenant.id
                              ? 'bg-white/[0.06] text-white'
                              : 'text-flux-text-secondary hover:bg-white/[0.03] hover:text-white'
                              }`}
                          >
                            <span>{tenant.name}</span>
                            {selectedTenant?.id === tenant.id && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-glow"></div>}
                          </button>
                        ))
                      )}
                    </div>
                    <div className="p-2 border-t border-flux-border bg-black/20">
                      {isAddingTenant ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newTenantName}
                            onChange={(e) => setNewTenantName(e.target.value)}
                            placeholder="Nome da área..."
                            className="flex-1 flux-input rounded-lg px-3 py-1.5 text-sm text-white placeholder-flux-text-tertiary"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTenant()}
                          />
                          <button onClick={handleAddTenant} className="px-3 py-1.5 flux-btn-primary rounded-lg text-xs font-bold text-black">
                            Criar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsAddingTenant(true)}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-flux-text-tertiary hover:text-white hover:bg-white/[0.03] transition-colors flex items-center gap-2"
                        >
                          <Plus size={12} /> Adicionar Área de Membros
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="relative hidden md:flex items-center gap-3 w-72 bg-flux-dark border border-flux-border text-sm rounded-lg py-2 pl-4 pr-4 text-flux-text-secondary hover:text-white hover:border-flux-subtle transition-all cursor-pointer group"
            >
              <Search size={16} className="text-flux-text-tertiary group-hover:text-white transition-colors" />
              <span>Buscar...</span>
              <kbd className="ml-auto text-[10px] font-mono bg-white/[0.05] px-1.5 py-0.5 rounded text-flux-text-tertiary group-hover:text-flux-text-secondary">⌘K</kbd>
            </button>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-onyx-400 hover:text-white hover:bg-white/[0.05] text-xs font-medium rounded-lg transition-all"
            >
              <UserPlus size={12} />
              Convidar
            </button>
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`relative p-2 transition-all rounded-lg hover:bg-white/[0.05] ${isNotificationsOpen ? 'text-white' : 'text-flux-text-secondary hover:text-white'}`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-flux-accent-blue rounded-full"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsNotificationsOpen(false)}></div>
                  <div className="absolute top-full right-0 mt-2 w-96 flux-card shadow-lg z-20 overflow-hidden animate-fade-in">
                    <div className="p-4 border-b border-flux-border flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white">Notificações</h3>
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] text-flux-text-tertiary hover:text-white transition-colors uppercase tracking-wide font-medium"
                      >
                        Marcar todas como lidas
                      </button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell size={24} className="mx-auto text-flux-text-tertiary mb-2" />
                          <p className="text-flux-text-secondary text-xs">Nenhuma notificação nova.</p>
                        </div>
                      ) : (
                        notifications.map(notification => (
                          <div
                            key={notification.id}
                            onClick={() => markAsRead(notification.id)}
                            className={`p-4 border-b border-flux-border hover:bg-white/[0.02] transition-colors flex gap-4 cursor-pointer group ${!notification.read ? 'bg-white/[0.02]' : ''}`}
                          >
                            <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 transition-colors ${!notification.read ? 'bg-flux-accent-blue shadow-glow' : 'bg-transparent border border-flux-text-tertiary'}`}></div>
                            <div className="flex-1">
                              <p className={`text-sm ${!notification.read ? 'text-white font-medium' : 'text-flux-text-secondary group-hover:text-white'}`}>{notification.title}</p>
                              {notification.message && <p className="text-xs text-flux-text-tertiary mt-1 leading-relaxed">{notification.message}</p>}
                              <p className="text-[10px] text-flux-text-tertiary mt-2 font-medium">{formatRelativeTime(notification.created_at)}</p>
                            </div>
                            <div className="text-flux-text-tertiary group-hover:text-flux-text-secondary transition-colors">
                              {notification.type === 'success' && <CheckCircle size={16} className="text-emerald-500/80" />}
                              {notification.type === 'error' && <AlertCircle size={16} className="text-red-500/80" />}
                              {notification.type === 'warning' && <AlertCircle size={16} className="text-amber-500/80" />}
                              {notification.type === 'info' && <Bell size={16} className="text-blue-500/80" />}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-flux-border bg-black/20 text-center">
                      <button
                        onClick={() => {
                          setIsNotificationsOpen(false);
                        }}
                        className="text-xs text-flux-text-tertiary hover:text-white transition-colors font-medium"
                      >
                        Ver histórico completo
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 lg:px-10 pt-6 lg:pt-10 pb-16 relative z-0">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </div>
      </main>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 lg:left-72 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={() => setIsSearchOpen(false)}></div>
          <div className="relative w-full max-w-2xl animate-scale-in">
            <div className="flux-panel rounded-xl shadow-2xl overflow-hidden bg-flux-black">
              {/* Search Input */}
              <div className="flex items-center gap-4 p-5 border-b border-flux-border">
                <Search size={20} className="text-flux-text-tertiary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="O que você está procurando?"
                  className="flex-1 bg-transparent text-white text-lg placeholder-flux-text-tertiary focus:outline-none font-medium"
                  autoFocus
                />
                {isSearching ? (
                  <Loader2 size={18} className="text-flux-text-tertiary animate-spin" />
                ) : (
                  <kbd className="text-[10px] text-flux-text-tertiary bg-white/[0.05] px-2 py-1 rounded font-mono border border-flux-border">ESC</kbd>
                )}
              </div>

              {/* Search Results */}
              <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
                {searchQuery && searchResults.length === 0 && !isSearching && (
                  <div className="p-12 text-center text-flux-text-tertiary">
                    <p>Nenhum resultado encontrado para "<span className="text-white">{searchQuery}</span>"</p>
                  </div>
                )}
                {!searchQuery && (
                  <div className="p-8 text-center">
                    <p className="text-flux-text-secondary text-sm mb-6">Busque por tarefas, leads, aulas e módulos</p>
                    <div className="flex justify-center gap-6">
                      <div className="flex flex-col items-center gap-2 group cursor-default">
                        <div className="w-10 h-10 rounded-xl bg-flux-dark border border-flux-border flex items-center justify-center group-hover:bg-white/[0.05] transition-colors">
                          <KanbanSquare size={18} className="text-flux-text-tertiary group-hover:text-flux-accent-cyan" />
                        </div>
                        <span className="text-[10px] text-flux-text-tertiary uppercase tracking-wider font-medium">Tarefas</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 group cursor-default">
                        <div className="w-10 h-10 rounded-xl bg-flux-dark border border-flux-border flex items-center justify-center group-hover:bg-white/[0.05] transition-colors">
                          <UserCircle size={18} className="text-flux-text-tertiary group-hover:text-flux-accent-cyan" />
                        </div>
                        <span className="text-[10px] text-flux-text-tertiary uppercase tracking-wider font-medium">Leads</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 group cursor-default">
                        <div className="w-10 h-10 rounded-xl bg-flux-dark border border-flux-border flex items-center justify-center group-hover:bg-white/[0.05] transition-colors">
                          <GraduationCap size={18} className="text-flux-text-tertiary group-hover:text-flux-accent-cyan" />
                        </div>
                        <span className="text-[10px] text-flux-text-tertiary uppercase tracking-wider font-medium">Aulas</span>
                      </div>
                    </div>
                  </div>
                )}
                {searchResults.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSearchResultClick(result)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left border-b border-flux-border last:border-b-0 group animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="p-2 rounded-lg bg-white/[0.03] border border-flux-border group-hover:border-flux-subtle transition-colors">
                      {getSearchResultIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{result.title}</p>
                      {result.description && (
                        <p className="text-flux-text-tertiary text-xs truncate mt-0.5 group-hover:text-flux-text-secondary">{result.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-flux-text-tertiary uppercase tracking-wider font-medium bg-white/[0.03] px-2 py-1 rounded border border-flux-border">
                        {result.type === 'task' ? 'Tarefa' : result.type === 'lead' ? 'Lead' : 'Módulo'}
                      </span>
                      <ChevronRight size={14} className="text-flux-text-tertiary group-hover:text-white transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        tenantId={selectedTenant?.id || ''}
        tenantName={selectedTenant?.name || ''}
      />
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group mb-1 ${isActive
        ? 'bg-white/[0.08] text-white'
        : 'text-flux-text-secondary hover:bg-white/[0.04] hover:text-white'
        }`}
    >
      <div className={`mr-3 transition-colors ${isActive ? 'text-flux-accent-cyan' : 'text-flux-text-tertiary group-hover:text-white'}`}>
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-flux-accent-cyan"></div>}
    </button>
  );
};