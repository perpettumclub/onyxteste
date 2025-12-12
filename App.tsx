import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { KanbanBoard } from './components/KanbanBoard';
import { MemberArea } from './components/MemberArea';
import { LeadsList } from './components/LeadsList';
import { Billing } from './components/Billing';
import { SalesDashboard } from './components/SalesDashboard';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { ForgotPassword } from './components/ForgotPassword';
import { ResetPassword } from './components/ResetPassword';
import { ClientSelect } from './components/ClientSelect';
import { InvitePage } from './components/InvitePage';
import { Task, ViewState, Lead, Post, FinancialGoal, Module, User, SalesMetrics, Transaction } from './types';
import { MOCK_TASKS, MOCK_MODULES, MOCK_LEADS, MOCK_POSTS, MOCK_SALES_METRICS, MOCK_TRANSACTIONS } from './constants';
import TeleConsole from './components/TeleConsole';

import { useDashboardData } from './hooks/useDashboardData';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const DashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);

  // Get selected tenant from localStorage (set by ClientSelect)
  const tenantId = localStorage.getItem('selectedClientId');

  // Fetch real data
  const {
    tasks: realTasks,
    leads: realLeads,
    modules: realModules,
    posts: realPosts,
    transactions: realTransactions,
    salesMetrics: realSalesMetrics,
    financialGoal: realFinancialGoal,
    loading: isLoadingData,
    refetch
  } = useDashboardData(tenantId);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics>(MOCK_SALES_METRICS);
  const [financialGoal, setFinancialGoal] = useState<FinancialGoal>({
    current: 0,
    target: 100000,
    startDate: '2023-11-01'
  });

  useEffect(() => {
    // If we have real data, use it. Otherwise fall back to mocks (or empty)
    if (tenantId) {
      setTasks(realTasks);
      setLeads(realLeads);
      setModules(realModules);
      setPosts(realPosts);
      setTransactions(realTransactions);
      setSalesMetrics(realSalesMetrics);
      setFinancialGoal(realFinancialGoal);
    } else {
      // Fallback to mocks if no tenant selected (shouldn't happen due to ProtectedRoute logic but safe to keep)
      setTasks(MOCK_TASKS);
      setLeads(MOCK_LEADS);
      setPosts(MOCK_POSTS);
      setModules(MOCK_MODULES);
      setSalesMetrics(MOCK_SALES_METRICS);
      setTransactions(MOCK_TRANSACTIONS);
    }
  }, [realTasks, realLeads, realModules, realPosts, realTransactions, realSalesMetrics, realFinancialGoal, tenantId]);

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard user={user} tasks={tasks} posts={posts} setPosts={setPosts} setView={setCurrentView} />;
      case ViewState.SALES:
        return <SalesDashboard financialGoal={financialGoal} setFinancialGoal={setFinancialGoal} salesMetrics={salesMetrics} setSalesMetrics={setSalesMetrics} transactions={transactions} tenantId={tenantId} />;
      case ViewState.KANBAN:
        return <KanbanBoard tasks={tasks} setTasks={setTasks} />;
      case ViewState.LEADS:
        return <LeadsList leads={leads} setLeads={setLeads} tenantId={tenantId} />;
      case ViewState.MEMBER_AREA:
        return <MemberArea modules={modules} setModules={setModules} userRole={user.role} tenantId={tenantId} onRefresh={refetch} />;
      case ViewState.BILLING:
        return <Billing tenantId={tenantId} />;
      case ViewState.SETTINGS:
        return <Settings user={user} tenantId={tenantId || undefined} />;
      default:
        return <Dashboard user={user} tasks={tasks} posts={posts} setPosts={setPosts} setView={setCurrentView} />;
    }
  };

  const handleTenantChange = (newTenantId: string) => {
    localStorage.setItem('selectedClientId', newTenantId);
    window.location.reload(); // Reload to refetch all data for new tenant
  };

  return (
    <Layout
      currentView={currentView}
      setView={setCurrentView}
      user={user}
      selectedTenantId={tenantId}
      onTenantChange={handleTenantChange}
    >
      {renderContent()}
    </Layout>
  );
};

const AppRoutes: React.FC = () => {
  const { session } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/select-client" replace />} />
      <Route path="/register" element={!session ? <Register /> : <Navigate to="/select-client" replace />} />
      <Route path="/forgot-password" element={!session ? <ForgotPassword /> : <Navigate to="/select-client" replace />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/invite/:code" element={<InvitePage />} />
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
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
      <TeleConsole />
    </AuthProvider>
  );
};

export default App;