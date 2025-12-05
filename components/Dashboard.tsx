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
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardProps {
  user: User;
  tasks: Task[];
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  setView: (view: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, tasks, posts, setPosts, setView }) => {
  const [aiSummary, setAiSummary] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");

  const doneCount = tasks.filter(t => t.status === TaskStatus.DONE).length;
  const inProgressCount = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
  const todoCount = tasks.filter(t => t.status === TaskStatus.TODO || t.status === TaskStatus.REVIEW).length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const data = [
    { name: 'Concluído', value: doneCount, color: '#e5e5e5' },
    { name: 'Em Progresso', value: inProgressCount, color: '#737373' },
    { name: 'A Fazer', value: todoCount, color: '#262626' },
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
    <div className="space-y-8 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 pb-4 border-b border-onyx-900">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-onyx-900 text-[10px] font-bold text-onyx-400 border border-onyx-800 uppercase tracking-wider">Dashboard</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Bem vindo de volta, {user.name.split(' ')[0]}</h1>
          <p className="text-onyx-500 mt-2 text-sm">Aqui está o que está acontecendo no seu projeto hoje.</p>
        </div>
        <button
          onClick={handleGenerateSummary}
          disabled={loadingAi}
          className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full hover:bg-onyx-200 transition-all text-sm font-bold shadow-lg shadow-white/5 disabled:opacity-50"
        >
          {loadingAi ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          {loadingAi ? 'Gerando...' : 'Gerar Daily Briefing'}
        </button>
      </div>

      {/* AI Insight Card */}
      {(aiSummary || loadingAi) && (
        <div className="bg-gradient-to-r from-onyx-900 to-black border border-onyx-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles size={120} />
          </div>
          <h3 className="text-sm font-bold text-onyx-100 mb-3 flex items-center gap-2 uppercase tracking-wider">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            Onyx AI Insights
          </h3>
          <div className="text-onyx-300 leading-relaxed text-sm max-w-3xl relative z-10">
            {loadingAi ? (
              <div className="space-y-3">
                <div className="h-2 bg-onyx-800 rounded-full w-3/4 animate-pulse"></div>
                <div className="h-2 bg-onyx-800 rounded-full w-1/2 animate-pulse"></div>
                <div className="h-2 bg-onyx-800 rounded-full w-5/6 animate-pulse"></div>
              </div>
            ) : (
              aiSummary
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tarefas Concluídas"
          value={doneCount.toString()}
          subtext="Total completado"
          icon={<CheckCircle2 className="text-white" />}
          trend="+12%"
        />
        <StatCard
          title="Em Andamento"
          value={inProgressCount.toString()}
          subtext="Fluxo ativo"
          icon={<Clock className="text-white" />}
          trend="Estável"
        />
        <StatCard
          title="Progresso"
          value={`${progress}%`}
          subtext="Do lançamento"
          icon={<CircleDashed className="text-white" />}
          trend="No prazo"
        />
        <div className="bg-white text-black p-6 rounded-3xl flex flex-col justify-between shadow-xl shadow-white/5 hover:scale-[1.02] transition-transform cursor-pointer group" onClick={() => setView('KANBAN')}>
          <div className="flex justify-between items-start">
            <div className="p-2 bg-black/5 rounded-xl group-hover:bg-black/10 transition-colors">
              <ArrowUpRight size={20} />
            </div>
            <span className="text-xs font-bold bg-black/10 px-2 py-1 rounded-full">RELATÓRIO</span>
          </div>
          <div>
            <div className="text-3xl font-bold mb-1">Abrir CRM</div>
            <div className="text-xs font-medium text-black/60">Ver pipeline detalhado</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white">Comunidade & Avisos</h2>
            <button className="text-xs text-onyx-400 hover:text-white transition-colors">Ver tudo</button>
          </div>

          {/* Create Post */}
          <div className="bg-onyx-950 border border-onyx-800 rounded-2xl p-4 flex gap-4 items-start focus-within:border-onyx-600 transition-colors">
            <div className="w-10 h-10 rounded-full bg-onyx-800 flex-shrink-0 flex items-center justify-center font-bold text-white text-sm">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Compartilhe algo com a comunidade..."
                className="w-full bg-transparent text-sm text-white placeholder-onyx-600 focus:outline-none resize-none min-h-[60px]"
              />
              <div className="flex justify-between items-center mt-2 border-t border-onyx-900 pt-3">
                <div className="text-[10px] text-onyx-600 font-medium uppercase tracking-wide">Postar como {user.role}</div>
                <button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim()}
                  className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-onyx-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Send size={12} /> Publicar
                </button>
              </div>
            </div>
          </div>

          {/* Posts List */}
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-onyx-950/50 border border-onyx-800/50 p-5 rounded-2xl hover:border-onyx-700 transition-all hover:bg-onyx-900 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-onyx-700 to-black border border-onyx-600 flex items-center justify-center text-xs font-bold text-white">
                      {post.author.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{post.author}</span>
                        {post.pinned && <Pin size={12} className="text-onyx-400 fill-onyx-400" />}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-onyx-500">
                        <span>{post.time}</span>
                        <span>•</span>
                        <span className="bg-onyx-900 px-1.5 py-0.5 rounded text-onyx-400 border border-onyx-800">{post.authorRole}</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-onyx-600 hover:text-white transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                {post.title && <h3 className="text-base font-bold text-onyx-100 mb-2 group-hover:text-white">{post.title}</h3>}
                <p className="text-sm text-onyx-400 leading-relaxed mb-4 whitespace-pre-line">{post.content}</p>

                <div className="flex items-center gap-4 border-t border-onyx-900 pt-3">
                  <button className="flex items-center gap-1.5 text-xs text-onyx-500 hover:text-onyx-200 transition-colors bg-onyx-900/50 px-3 py-1.5 rounded-lg border border-transparent hover:border-onyx-800">
                    <ThumbsUp size={14} />
                    {post.likes}
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-onyx-500 hover:text-onyx-200 transition-colors bg-onyx-900/50 px-3 py-1.5 rounded-lg border border-transparent hover:border-onyx-800">
                    <MessageSquare size={14} />
                    {post.comments}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* Chart Widget */}
          <div className="bg-onyx-950 border border-onyx-800 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Status Geral</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={4}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    itemStyle={{ color: '#d4d4d4' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-2">
              {data.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-onyx-400">{item.name}</span>
                  </div>
                  <span className="font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next Tasks Widget */}
          <div className="bg-onyx-950 border border-onyx-800 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Próximas Entregas</h3>
            <div className="space-y-3">
              {tasks
                .filter(t => t.status !== TaskStatus.DONE)
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .slice(0, 3)
                .map(task => (
                  <div key={task.id} className="group p-3 rounded-2xl bg-black border border-onyx-900 hover:border-onyx-700 transition-all cursor-pointer" onClick={() => setView('KANBAN')}>
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${task.status === TaskStatus.IN_PROGRESS ? 'bg-onyx-800 text-white border-onyx-700' : 'bg-onyx-900 text-onyx-500 border-onyx-900'
                        }`}>{task.status.replace('_', ' ')}</span>
                      <span className="text-[10px] text-onyx-600 font-mono">{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <p className="text-sm font-medium text-onyx-200 group-hover:text-white truncate">{task.title}</p>
                  </div>
                ))}
            </div>
            <button onClick={() => setView('KANBAN')} className="w-full mt-4 py-3 rounded-xl border border-onyx-800 text-xs font-bold text-onyx-400 hover:bg-onyx-900 hover:text-white transition-colors">
              Ver todo o Pipeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; subtext: string; icon: React.ReactNode; trend: string }> = ({ title, value, subtext, icon, trend }) => (
  <div className="bg-onyx-950 border border-onyx-800 p-6 rounded-3xl hover:bg-onyx-900 transition-all duration-300 group flex flex-col justify-between h-40 relative overflow-hidden">
    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
      <ArrowUpRight className="text-onyx-600 w-4 h-4" />
    </div>

    <div className="flex items-center gap-3">
      <div className="p-2.5 bg-onyx-900 rounded-2xl border border-onyx-800 group-hover:border-onyx-700 transition-colors shadow-inner shadow-white/5">
        {React.cloneElement(icon as React.ReactElement, { size: 18 })}
      </div>
      <span className="text-xs font-bold text-onyx-500 bg-onyx-900 px-2 py-1 rounded-full border border-onyx-800">{trend}</span>
    </div>

    <div>
      <div className="text-3xl font-bold text-white mb-0.5 tracking-tight">{value}</div>
      <div className="text-xs font-medium text-onyx-500 uppercase tracking-wide">{title}</div>
    </div>
  </div>
);