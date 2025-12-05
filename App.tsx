import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { KanbanBoard } from './components/KanbanBoard';
import { MemberArea } from './components/MemberArea';
import { LeadsList } from './components/LeadsList';
import { Billing } from './components/Billing';
import { SalesDashboard } from './components/SalesDashboard';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { ClientSelect } from './components/ClientSelect';
import { Task, ViewState, Lead, Post, FinancialGoal, Module, User, SalesMetrics, Transaction } from './types';
import { MOCK_TASKS, MOCK_MODULES, MOCK_LEADS, MOCK_POSTS, CURRENT_USER, MOCK_SALES_METRICS, MOCK_TRANSACTIONS } from './constants';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const DashboardLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [user, setUser] = useState<User>(CURRENT_USER);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [financialGoal, setFinancialGoal] = useState<FinancialGoal>({
    current: 24500,
    target: 100000,
    startDate: '2023-11-01'
  });
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics>(MOCK_SALES_METRICS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setTasks(MOCK_TASKS);
    setLeads(MOCK_LEADS);
    setPosts(MOCK_POSTS);
    setModules(MOCK_MODULES);
    setSalesMetrics(MOCK_SALES_METRICS);
    setTransactions(MOCK_TRANSACTIONS);
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard user={user} tasks={tasks} posts={posts} setPosts={setPosts} setView={setCurrentView} />;
      case ViewState.SALES:
        return <SalesDashboard financialGoal={financialGoal} setFinancialGoal={setFinancialGoal} salesMetrics={salesMetrics} setSalesMetrics={setSalesMetrics} transactions={transactions} />;
      case ViewState.KANBAN:
        return <KanbanBoard tasks={tasks} setTasks={setTasks} />;
      case ViewState.LEADS:
        return <LeadsList leads={leads} setLeads={setLeads} />;
      case ViewState.MEMBER_AREA:
        return <MemberArea modules={modules} setModules={setModules} userRole={user.role} />;
      case ViewState.BILLING:
        return <Billing />;
      case ViewState.SETTINGS:
        return (
          <div className="flex flex-col items-center justify-center h-[50vh] text-onyx-500 animate-fade-in-up">
            <div className="p-8 border border-onyx-800 rounded-3xl bg-onyx-950 text-center shadow-2xl max-w-lg w-full">
              <h2 className="text-xl font-bold text-white mb-6">Configurações de Admin</h2>
              <div className="text-left space-y-4">
                <label className="block text-sm font-bold text-white">Simular Nível de Acesso</label>
                <select
                  value={user.role}
                  onChange={(e) => setUser({ ...user, role: e.target.value as any })}
                  className="w-full bg-black border border-onyx-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white"
                >
                  <option value="USER">Usuário (Membro)</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
                <p className="text-xs text-onyx-500">Alterne entre os níveis para testar as permissões.</p>
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard user={user} tasks={tasks} posts={posts} setPosts={setPosts} setView={setCurrentView} />;
    }
  };

  return (
    <Layout currentView={currentView} setView={setCurrentView} user={user}>
      {renderContent()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/select-client"
        element={
          <ProtectedRoute>
            <ClientSelect />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;