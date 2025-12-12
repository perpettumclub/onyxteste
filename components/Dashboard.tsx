import React, { useState } from 'react';
import { Task, TaskStatus, Post, User } from '../types';
import { generateProjectSummary } from '../services/geminiService';
import {
  CheckCircle2,
  CircleDashed,
  Clock,
  ArrowUpRight,
  Sparkles,
  Loader2,
  MessageSquare,
  ThumbsUp,
  MoreHorizontal,
  Pin,
  Send,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { CommunityFeed } from './CommunityFeed';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardProps {
  user: User;
  tasks: Task[];
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  setView: (view: any) => void;
  tenantId: string | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, tasks, posts, setPosts, setView, tenantId }) => {
  const [aiSummary, setAiSummary] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");

  const doneCount = tasks.filter(t => t.status === TaskStatus.DONE).length;
  const inProgressCount = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
  const todoCount = tasks.filter(t => t.status === TaskStatus.TODO || t.status === TaskStatus.REVIEW).length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const data = [
    { name: 'Concluído', value: doneCount, color: '#ffffff' },
    { name: 'Em Progresso', value: inProgressCount, color: '#71717a' },
    { name: 'A Fazer', value: todoCount, color: '#27272a' },
  ];

  const handleGenerateSummary = async () => {
    setLoadingAi(true);
    setAiSummary("");
    const summary = await generateProjectSummary(tasks);
    setAiSummary(summary);
    setLoadingAi(false);
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    const newPost: Post = {
      id: `p-${Date.now()}`,
      author: user.name,
      authorRole: user.role,
      time: 'Just now',
      content: newPostContent,
      likes: 0,
      comments: 0,
      pinned: false
    };
    setPosts([newPost, ...posts]);
    setNewPostContent("");
  };

  return (
    <div className="space-y-8 animate-fade-in-up">

      {/* Welcome Section */}
      <div className="flex justify-between items-start h-full animate-in fade-in zoom-in-95 duration-300 border-b border-flux-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flux-badge">Dashboard</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Bem vindo de volta, {user.name.split(' ')[0]}
          </h1>
          <p className="text-flux-text-secondary mt-2 text-sm font-medium">Aqui está o resumo executivo do seu projeto hoje.</p>
        </div>
        <button
          onClick={handleGenerateSummary}
          disabled={loadingAi}
          className="flux-btn-primary flex items-center gap-2 px-4 py-2 text-xs font-bold disabled:opacity-50 hover:shadow-flux-highlight transition-all flex-shrink-0"
        >
          {loadingAi ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
          {loadingAi ? 'Analisando...' : 'Gerar Daily Briefing'}
        </button>
      </div>

      {/* AI Insight Card */}
      {(aiSummary || loadingAi) && (
        <div className="relative overflow-hidden rounded-xl border border-flux-border bg-gradient-to-br from-flux-panel to-flux-black shadow-lg animate-fade-in">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-flux-accent-blue via-transparent to-transparent"></div>

          <div className="relative p-8 z-10">
            <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-flux-accent-blue animate-pulse"></div>
              Onyx AI Insights
            </h3>
            <div className="text-flux-text-secondary leading-relaxed text-sm max-w-4xl font-medium">
              {loadingAi ? (
                <div className="animate-fade-in-up space-y-10">
                  <div className="h-2 bg-flux-border rounded-full w-3/4 animate-pulse"></div>
                  <div className="h-2 bg-flux-border rounded-full w-1/2 animate-pulse delay-75"></div>
                  <div className="h-2 bg-flux-border rounded-full w-5/6 animate-pulse delay-150"></div>
                </div>
              ) : (
                aiSummary
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Tarefas Concluídas"
          value={doneCount.toString()}
          subtext="Total completado"
          icon={<CheckCircle2 className="text-white" />}
          trend="+12%"
          trendUp={true}
        />
        <StatCard
          title="Em Andamento"
          value={inProgressCount.toString()}
          subtext="Fluxo ativo"
          icon={<Clock className="text-white" />}
          trend="Estável"
          trendUp={null}
        />
        <StatCard
          title="Progresso"
          value={`${progress}%`}
          subtext="Do lançamento"
          icon={<CircleDashed className="text-white" />}
          trend="No prazo"
          trendUp={true}
        />
        <div
          className="flux-card p-6 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
          onClick={() => setView('KANBAN')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="p-2.5 bg-flux-subtle rounded-lg border border-flux-border group-hover:bg-white text-black transition-all duration-300">
              <ArrowUpRight size={20} className="text-white group-hover:text-black transition-colors" />
            </div>
            <span className="text-[10px] font-bold bg-white text-black px-2.5 py-1 rounded-full">RELATÓRIO</span>
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-bold mb-1 text-white group-hover:translate-x-1 transition-transform duration-300">Abrir CRM</div>
            <div className="text-xs font-medium text-flux-text-tertiary group-hover:text-white/80 transition-colors">Ver pipeline detalhado</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Comunidade & Avisos</h2>
            <button className="text-xs font-medium text-flux-text-tertiary hover:text-white transition-colors uppercase tracking-wide">Ver tudo</button>
          </div>

          <CommunityFeed tenantId={tenantId} />
        </div>


        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* Chart Widget */}
          <div className="flux-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Status Geral</h3>
              <button className="p-2 hover:bg-flux-subtle rounded-lg transition-colors">
                <MoreHorizontal size={16} className="text-flux-text-tertiary" />
              </button>
            </div>

            <div className="h-52 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={6}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121212',
                      borderColor: '#27272a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
                    }}
                    itemStyle={{ color: '#a1a1aa' }}
                    cursor={false}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Text */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="text-3xl font-bold text-white">{total}</div>
                <div className="text-[10px] text-flux-text-tertiary uppercase tracking-wider font-bold">Total</div>
              </div>
            </div>

            <div className="space-y-4 mt-4">
              {data.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm group cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                    <span className="text-flux-text-secondary font-medium group-hover:text-white transition-colors">{item.name}</span>
                  </div>
                  <span className="font-bold text-white bg-flux-subtle px-2 py-0.5 rounded-md border border-flux-border min-w-[30px] text-center">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next Tasks Widget */}
          <div className="flux-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Próximas Entregas</h3>
              <Calendar size={16} className="text-flux-text-tertiary" />
            </div>

            <div className="space-y-3">
              {tasks
                .filter(t => t.status !== TaskStatus.DONE)
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .slice(0, 3)
                .map(task => (
                  <div key={task.id} className="group p-4 rounded-xl bg-flux-subtle border border-flux-border hover:border-flux-text-tertiary transition-all cursor-pointer" onClick={() => setView('KANBAN')}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${task.status === TaskStatus.IN_PROGRESS
                        ? 'bg-white text-black border-white'
                        : 'bg-flux-black text-flux-text-tertiary border-flux-border'
                        }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-flux-text-tertiary font-mono bg-black/30 px-1.5 py-0.5 rounded">
                        {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-flux-text-secondary group-hover:text-white truncate transition-colors">{task.title}</p>
                  </div>
                ))}
            </div>
            <button onClick={() => setView('KANBAN')} className="w-full mt-5 py-3.5 rounded-xl border border-flux-border text-xs font-bold text-flux-text-secondary hover:bg-white hover:text-black hover:border-white transition-all uppercase tracking-wide">
              Ver todo o Pipeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; subtext: string; icon: React.ReactNode; trend: string; trendUp?: boolean | null }> = ({ title, value, subtext, icon, trend, trendUp }) => (
  <div className="flux-card p-6 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between h-44 relative overflow-hidden">
    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <ArrowUpRight className="text-white w-5 h-5" />
    </div>

    <div className="flex items-center gap-4">
      <div className="p-3 bg-flux-subtle rounded-2xl border border-flux-border group-hover:bg-white group-hover:text-black text-white transition-all duration-300">
        {React.cloneElement(icon as React.ReactElement, { size: 20, className: "group-hover:text-black transition-colors" })}
      </div>
      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${trendUp === true ? 'bg-flux-subtle text-white border-flux-border' :
        trendUp === false ? 'bg-flux-subtle text-flux-text-tertiary border-flux-border' :
          'bg-flux-subtle text-flux-text-tertiary border-flux-border'
        }`}>
        {trendUp === true && <TrendingUp size={10} />}
        {trend}
      </span>
    </div>

    <div>
      <div className="text-4xl font-bold text-white mb-1 tracking-tight group-hover:scale-105 transition-transform origin-left duration-300">{value}</div>
      <div className="text-xs font-semibold text-flux-text-tertiary uppercase tracking-wider group-hover:text-flux-text-secondary transition-colors">{title}</div>
    </div>
  </div>
);