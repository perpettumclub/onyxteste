import React from 'react';
import { ViewState, User } from '../types';
import { LayoutDashboard, KanbanSquare, GraduationCap, Settings, Bell, Search, Hexagon, Users, CreditCard, LogOut, Banknote, ChevronDown, Plus, Menu, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  children: React.ReactNode;
  user: User;
}

const MOCK_CLIENTS = [
  { id: '1', name: 'Onyx Club' },
  { id: '2', name: 'Mentoria High Ticket' },
  { id: '3', name: 'Comunidade Alpha' },
];

const INITIAL_NOTIFICATIONS = [
  { id: 1, title: 'Nova venda realizada', time: 'Há 5 min', read: false, type: 'success' },
  { id: 2, title: 'Meta diária atingida', time: 'Há 2 horas', read: false, type: 'success' },
  { id: 3, title: 'Novo lead cadastrado', time: 'Há 4 horas', read: true, type: 'info' },
  { id: 4, title: 'Falha no pagamento', time: 'Há 1 dia', read: true, type: 'error' },
];

export const Layout: React.FC<LayoutProps> = ({ currentView, setView, children, user }) => {
  const [isClientMenuOpen, setIsClientMenuOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(MOCK_CLIENTS[0]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="flex h-screen bg-black text-onyx-200 overflow-hidden font-sans selection:bg-onyx-700 selection:text-white">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-black flex flex-col border-r border-onyx-800/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-4 lg:px-6 border-b border-onyx-800/50">
          <button className="flex items-center gap-3 hover:bg-onyx-900/50 p-2 rounded-xl transition-colors text-left group flex-1">
            <div className="w-10 h-10 bg-onyx-100 rounded-xl flex items-center justify-center shadow-lg shadow-white/5 text-black">
              <Hexagon className="w-6 h-6 fill-current" />
            </div>
            <div className="block flex-1">
              <h1 className="text-sm font-bold text-white leading-none">Onyx Club</h1>
              <span className="text-[10px] text-onyx-500 font-medium group-hover:text-onyx-400">Plataforma Expert</span>
            </div>
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 text-onyx-500 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-3 text-[10px] font-bold text-onyx-600 uppercase tracking-widest mb-2 block">Gerenciamento</p>

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

          <div className="my-6 border-t border-onyx-900 mx-2"></div>

          <p className="px-3 text-[10px] font-bold text-onyx-600 uppercase tracking-widest mb-2 block">Educação</p>
          <NavItem
            icon={<GraduationCap size={18} />}
            label="Conteúdos & Aulas"
            isActive={currentView === ViewState.MEMBER_AREA}
            onClick={() => setView(ViewState.MEMBER_AREA)}
          />

          <div className="my-6 border-t border-onyx-900 mx-2"></div>

          <p className="px-3 text-[10px] font-bold text-onyx-600 uppercase tracking-widest mb-2 block">Conta</p>
          <NavItem
            icon={<CreditCard size={18} />}
            label="Faturamento"
            isActive={currentView === ViewState.BILLING}
            onClick={() => setView(ViewState.BILLING)}
          />
          <NavItem
            icon={<Settings size={18} />}
            label="Configurações"
            isActive={currentView === ViewState.SETTINGS}
            onClick={() => setView(ViewState.SETTINGS)}
          />
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-onyx-800/50">
          <div className="pt-2 flex items-center gap-3 px-2 rounded-xl hover:bg-onyx-900/50 transition-colors cursor-pointer p-2 group">
            <div className="w-9 h-9 rounded-full bg-onyx-800 border border-onyx-700 flex items-center justify-center text-xs font-bold text-white relative">
              {user.name.charAt(0)}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-black rounded-full"></span>
            </div>
            <div className="block overflow-hidden flex-1">
              <p className="text-sm text-white font-medium truncate">{user.name}</p>
              <p className="text-[10px] text-onyx-500 uppercase tracking-wide truncate">{user.role.replace('_', ' ')}</p>
            </div>
            <div className="block text-onyx-600 group-hover:text-white transition-colors">
              <LogOut size={14} />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-black relative">
        <div className="absolute top-0 left-0 w-full h-96 bg-onyx-900/20 blur-3xl pointer-events-none rounded-full -translate-y-1/2"></div>

        <header className="h-16 flex items-center justify-between px-6 z-10 border-b border-onyx-800/30 backdrop-blur-md sticky top-0 bg-black/50">
          <div className="flex items-center gap-4 text-onyx-400">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden text-onyx-400 hover:text-white transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="relative">
              <button
                onClick={() => setIsClientMenuOpen(!isClientMenuOpen)}
                className="flex items-center gap-2 hover:text-white transition-colors group"
              >
                <span className="hidden md:block text-sm font-medium">
                  {selectedClient.name} <span className="text-onyx-600">/</span> <span className="text-white">{currentView === ViewState.DASHBOARD ? 'Dashboard' : currentView.charAt(0) + currentView.slice(1).toLowerCase().replace('_', ' ')}</span>
                </span>
                <ChevronDown size={14} className={`text-onyx-600 group-hover:text-white transition-transform duration-200 ${isClientMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isClientMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsClientMenuOpen(false)}></div>
                  <div className="absolute top-full left-0 mt-2 w-64 bg-onyx-950 border border-onyx-800 rounded-xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 border-b border-onyx-900">
                      <p className="text-[10px] font-bold text-onyx-500 uppercase tracking-wider px-2 py-1">Trocar Área de Membros</p>
                    </div>
                    <div className="p-1">
                      {MOCK_CLIENTS.map(client => (
                        <button
                          key={client.id}
                          onClick={() => {
                            setSelectedClient(client);
                            setIsClientMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between group ${selectedClient.id === client.id
                            ? 'bg-onyx-900 text-white'
                            : 'text-onyx-400 hover:bg-onyx-900/50 hover:text-white'
                            }`}
                        >
                          <span>{client.name}</span>
                          {selectedClient.id === client.id && <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}
                        </button>
                      ))}
                    </div>
                    <div className="p-2 border-t border-onyx-900 bg-black/20">
                      <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-onyx-500 hover:text-white hover:bg-onyx-900 transition-colors flex items-center gap-2">
                        <Plus size={12} /> Adicionar Novo Cliente
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-onyx-600 w-4 h-4 group-focus-within:text-onyx-400 transition-colors" />
              <input
                type="text"
                placeholder="Buscar (Cmd + K)"
                className="w-64 bg-onyx-900/50 border border-onyx-800/50 text-sm rounded-full py-2 pl-10 pr-4 text-onyx-200 placeholder-onyx-600 focus:outline-none focus:border-onyx-600 focus:ring-1 focus:ring-onyx-600 transition-all focus:bg-onyx-900"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`relative p-2 transition-colors bg-onyx-900/50 rounded-full hover:bg-onyx-800 ${isNotificationsOpen ? 'text-white bg-onyx-800' : 'text-onyx-400 hover:text-white'}`}
              >
                <Bell size={18} />
                {unreadCount > 0 && <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>}
              </button>

              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsNotificationsOpen(false)}></div>
                  <div className="absolute top-full right-0 mt-2 w-80 bg-onyx-950 border border-onyx-800 rounded-xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-onyx-900 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">Notificações</h3>
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] text-onyx-500 hover:text-white transition-colors"
                      >
                        Marcar todas como lidas
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-onyx-500 text-xs">Nenhuma notificação.</div>
                      ) : (
                        notifications.map(notification => (
                          <div key={notification.id} className={`p-3 border-b border-onyx-900/50 hover:bg-onyx-900/30 transition-colors flex gap-3 ${!notification.read ? 'bg-onyx-900/10' : ''}`}>
                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notification.read ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                            <div className="flex-1">
                              <p className={`text-sm ${!notification.read ? 'text-white font-medium' : 'text-onyx-400'}`}>{notification.title}</p>
                              <p className="text-[10px] text-onyx-600 mt-1">{notification.time}</p>
                            </div>
                            <div className="text-onyx-600">
                              {notification.type === 'success' && <CheckCircle size={14} className="text-green-500" />}
                              {notification.type === 'error' && <AlertCircle size={14} className="text-red-500" />}
                              {notification.type === 'info' && <Bell size={14} className="text-blue-500" />}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-2 border-t border-onyx-900 bg-black/20 text-center">
                      <button
                        onClick={() => {
                          setIsNotificationsOpen(false);
                          alert('Navegando para todas as notificações...');
                        }}
                        className="text-xs text-onyx-500 hover:text-white transition-colors"
                      >
                        Ver todas
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 lg:px-10 pt-6 lg:pt-10 pb-16 relative z-0">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
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
      className={`w-full flex items-center p-2 rounded-xl transition-all duration-200 group mb-1 ${isActive
        ? 'bg-onyx-900 text-white shadow-inner shadow-white/5'
        : 'text-onyx-500 hover:bg-onyx-900/30 hover:text-onyx-300'
        }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-onyx-100 text-black' : 'bg-onyx-900 text-onyx-500 group-hover:text-onyx-300 group-hover:bg-onyx-800'
        }`}>
        {icon}
      </div>
      <span className="ml-3 text-sm font-medium block tracking-wide">{label}</span>
      {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-white block mr-2"></div>}
    </button>
  );
};