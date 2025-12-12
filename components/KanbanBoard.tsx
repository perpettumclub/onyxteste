import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, TaskLabel, ChecklistItem, Subtask, Playbook, XP_REWARDS } from '../types';
import { MoreHorizontal, Plus, MessageSquare, Calendar, ChevronLeft, ChevronRight, UserCircle, Edit2, X, Trash2, Tag, AlertTriangle, Filter, CheckSquare, Square, ListChecks, LayoutGrid, List, CalendarDays, Zap, Home, FolderOpen, ChevronDown, Star, Sparkles, Share2, Hash, BarChart3, Table2, GanttChart, Eye, EyeOff, Columns3, Users, Search, Settings, GitBranch } from 'lucide-react';
import { supabase } from '../services/supabase';
import { PlaybookList } from './PlaybookCard';

// View modes
type ViewMode = 'board' | 'list' | 'calendar' | 'channel' | 'gantt' | 'table';

// Predefined labels for CRM
const AVAILABLE_LABELS: TaskLabel[] = [
  { id: 'hot', name: 'Lead Quente', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { id: 'warm', name: 'Lead Morno', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { id: 'cold', name: 'Lead Frio', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'followup', name: 'Follow-up', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: 'proposal', name: 'Aguardando Proposta', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { id: 'urgent', name: 'Urgente', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
];

interface KanbanBoardProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, setTasks }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<TaskStatus | null>(null);
  const [collapsedColumns, setCollapsedColumns] = useState<Set<TaskStatus>>(new Set());

  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterLabel, setFilterLabel] = useState<string | null>(null);
  const [filterAssignee, setFilterAssignee] = useState<string>('');
  const [filterOverdue, setFilterOverdue] = useState(false);

  // ClickUp-style toolbar states
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [groupBy, setGroupBy] = useState<'status' | 'assignee' | 'priority' | 'due_date'>('status');
  const [showClosed, setShowClosed] = useState(true);
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Inline add state
  const [inlineAddColumn, setInlineAddColumn] = useState<TaskStatus | null>(null);
  const [inlineTaskTitle, setInlineTaskTitle] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee: '',
    dueDate: '',
    status: TaskStatus.TODO,
    labels: [] as string[],
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    checklist: [] as ChecklistItem[],
    subtasks: [] as Subtask[],
    playbooks: [] as Playbook[],
    newChecklistItem: '',
    newSubtaskTitle: '',
    newPlaybookUrl: '',
    newPlaybookTitle: '',
    newPlaybookType: 'VIDEO' as Playbook['type']
  });

  // Custom columns state (editable)
  const [customColumns, setCustomColumns] = useState([
    { id: TaskStatus.TODO, label: 'A Fazer', color: 'bg-onyx-500' },
    { id: TaskStatus.IN_PROGRESS, label: 'Em Progresso', color: 'bg-blue-500' },
    { id: TaskStatus.REVIEW, label: 'Revisão', color: 'bg-purple-500' },
    { id: TaskStatus.DONE, label: 'Concluído', color: 'bg-white' },
  ]);

  // State for adding new column
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState('');

  // Playbooks state
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loadingPlaybooks, setLoadingPlaybooks] = useState(false);
  const [showAddPlaybook, setShowAddPlaybook] = useState(false);
  const [newPlaybook, setNewPlaybook] = useState<{ title: string, url: string, type: Playbook['type'] }>({
    title: '',
    url: '',
    type: 'VIDEO'
  });

  // Load Playbooks from Supabase
  const loadPlaybooks = async (taskId: string) => {
    setLoadingPlaybooks(true);
    try {
      const { data, error } = await supabase
        .from('task_playbooks')
        .select('*')
        .eq('task_id', taskId)
        .order('order_index');

      if (error) throw error;

      const mappedPlaybooks: Playbook[] = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        url: item.url,
        duration: item.duration,
        description: item.description
      }));

      setPlaybooks(mappedPlaybooks);
    } catch (error) {
      console.error('Error loading playbooks:', error);
      // Fallback para mock data se tabela não existir ainda ou erro
      setPlaybooks([]);
    } finally {
      setLoadingPlaybooks(false);
    }
  };

  // Add Playbook to Supabase
  const handleAddPlaybook = async () => {
    if (!editingTask || !newPlaybook.title || !newPlaybook.url) return;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const newItem: Playbook = { id: tempId, ...newPlaybook };
    setPlaybooks([...playbooks, newItem]);
    setNewPlaybook({ title: '', url: '', type: 'VIDEO' });
    setShowAddPlaybook(false);

    try {
      const { data, error } = await supabase
        .from('task_playbooks')
        .insert([{
          task_id: editingTask.id,
          title: newPlaybook.title,
          url: newPlaybook.url,
          type: newPlaybook.type,
          order_index: playbooks.length
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Atualiza com ID real
        setPlaybooks(prev => prev.map(p => p.id === tempId ? { ...p, id: data.id } : p));
      }
    } catch (error) {
      console.error('Error adding playbook:', error);
      // Revert optimistic
      setPlaybooks(prev => prev.filter(p => p.id !== tempId));
    }
  };

  // Use customColumns as the source of truth
  const columns = customColumns;

  // Get unique assignees for filter dropdown
  const uniqueAssignees = useMemo(() => {
    return [...new Set(tasks.map(t => t.assignee).filter(Boolean))];
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filterLabel && !task.labels?.some(l => l.id === filterLabel)) return false;
      if (filterAssignee && task.assignee !== filterAssignee) return false;
      if (filterOverdue && !(new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE)) return false;
      return true;
    });
  }, [tasks, filterLabel, filterAssignee, filterOverdue]);

  const hasActiveFilters = filterLabel || filterAssignee || filterOverdue;

  const moveTask = (taskId: string, direction: 'prev' | 'next') => {
    const statusOrder = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW, TaskStatus.DONE];
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      const currentIndex = statusOrder.indexOf(task.status);
      let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      if (newIndex < 0) newIndex = 0;
      if (newIndex >= statusOrder.length) newIndex = statusOrder.length - 1;
      return { ...task, status: statusOrder[newIndex] };
    }));
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (status: TaskStatus) => {
    setDraggedOverColumn(status);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    if (draggedTask) {
      setTasks(prev => prev.map(task =>
        task.id === draggedTask ? { ...task, status: newStatus } : task
      ));
    }
    setDraggedTask(null);
    setDraggedOverColumn(null);
  };

  const openModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description,
        assignee: task.assignee,
        dueDate: task.dueDate,
        status: task.status,
        labels: task.labels?.map(l => l.id) || [],
        priority: task.priority || 'MEDIUM',
        checklist: task.checklist || [],
        subtasks: task.subtasks || [],
        playbooks: task.playbooks || [], // Mantém compatibilidade com local
        newChecklistItem: '',
        newSubtaskTitle: '',
        newPlaybookUrl: '',
        newPlaybookTitle: '',
        newPlaybookType: 'VIDEO'
      });
      // Carrega playbooks do backend
      loadPlaybooks(task.id);
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        assignee: '',
        dueDate: new Date().toISOString().split('T')[0],
        status: TaskStatus.TODO,
        labels: [],
        priority: 'MEDIUM',
        checklist: [],
        subtasks: [],
        playbooks: [],
        newChecklistItem: '',
        newSubtaskTitle: '',
        newPlaybookUrl: '',
        newPlaybookTitle: '',
        newPlaybookType: 'VIDEO'
      });
      setPlaybooks([]); // Limpa
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const taskLabels = AVAILABLE_LABELS.filter(l => formData.labels.includes(l.id));

    if (editingTask) {
      // Update task locally
      setTasks(prev => prev.map(t => t.id === editingTask.id ? {
        ...t,
        title: formData.title,
        description: formData.description,
        assignee: formData.assignee,
        dueDate: formData.dueDate,
        status: formData.status,
        labels: taskLabels,
        priority: formData.priority,
        checklist: formData.checklist,
        subtasks: formData.subtasks,
        playbooks: formData.playbooks
      } : t));

      // Save playbooks to Supabase
      try {
        // Delete existing playbooks
        await supabase
          .from('task_playbooks')
          .delete()
          .eq('task_id', editingTask.id);

        // Insert new playbooks
        if (formData.playbooks.length > 0) {
          const playbooksToInsert = formData.playbooks.map((p, index) => ({
            task_id: editingTask.id,
            title: p.title,
            type: p.type,
            url: p.url,
            duration: p.duration,
            description: p.description,
            order_index: index
          }));

          await supabase
            .from('task_playbooks')
            .insert(playbooksToInsert);
        }
      } catch (error) {
        console.error('Error saving playbooks:', error);
      }
    } else {
      const newTask: Task = {
        id: `t-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        assignee: formData.assignee,
        dueDate: formData.dueDate,
        status: formData.status,
        labels: taskLabels,
        priority: formData.priority,
        checklist: formData.checklist,
        subtasks: formData.subtasks,
        playbooks: formData.playbooks,
        comments: []
      };
      setTasks(prev => [...prev, newTask]);

      // Note: For new tasks, playbooks will be saved when task is synced to Supabase
      // The task needs to exist in DB first to get a proper UUID
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!editingTask) return;

    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', editingTask.id);

        if (error) throw error;

        setTasks(prev => prev.filter(t => t.id !== editingTask.id));
        setIsModalOpen(false);
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Erro ao excluir tarefa');
      }
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col animate-fade-in-up">
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* TOOLBAR ESTILO CLICKUP                                                       */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="premium-card rounded-xl border border-white/[0.04] mb-4">
        {/* Barra 1: Abas de Visualização */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-white/[0.04] bg-white/[0.005] overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${viewMode === 'board'
              ? 'bg-white/[0.1] text-white'
              : 'text-onyx-400 hover:text-white hover:bg-white/[0.05]'
              }`}
          >
            <LayoutGrid size={14} />
            <span>Quadro</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${viewMode === 'list'
              ? 'bg-white/[0.1] text-white'
              : 'text-onyx-400 hover:text-white hover:bg-white/[0.05]'
              }`}
          >
            <List size={14} />
            <span>Lista</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${viewMode === 'table'
              ? 'bg-white/[0.1] text-white'
              : 'text-onyx-400 hover:text-white hover:bg-white/[0.05]'
              }`}
          >
            <Table2 size={14} />
            <span>Tabela</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${viewMode === 'calendar'
              ? 'bg-white/[0.1] text-white'
              : 'text-onyx-400 hover:text-white hover:bg-white/[0.05]'
              }`}
          >
            <CalendarDays size={14} />
            <span>Calendário</span>
          </button>
          <button
            onClick={() => setViewMode('channel')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${viewMode === 'channel'
              ? 'bg-white/[0.1] text-white'
              : 'text-onyx-400 hover:text-white hover:bg-white/[0.05]'
              }`}
          >
            <Hash size={14} />
            <span>Canal</span>
          </button>
        </div>

        {/* Barra 3: Ferramentas de Organização (Simplificada) */}
        <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] overflow-visible relative z-50">
          {/* Lado Esquerdo: Grupo, Subtarefas, Colunas */}
          <div className="flex items-center gap-1">
            {/* Dropdown Grupo */}
            <div className="relative">
              <button
                onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-onyx-400 hover:text-white hover:bg-white/[0.05]"
              >
                <LayoutGrid size={12} />
                <span>Grupo: {groupBy === 'status' ? 'Status' : groupBy === 'assignee' ? 'Responsável' : groupBy === 'priority' ? 'Prioridade' : 'Data'}</span>
                <ChevronDown size={12} />
              </button>
              {isGroupDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[99]" onClick={() => setIsGroupDropdownOpen(false)}></div>
                  <div className="absolute top-full left-0 mt-2 w-48 premium-card rounded-lg shadow-premium-xl z-[100] py-1 animate-in fade-in zoom-in-95 duration-150">
                    {[
                      { value: 'status', label: 'Status', icon: LayoutGrid },
                      { value: 'assignee', label: 'Responsável', icon: Users },
                      { value: 'priority', label: 'Prioridade', icon: AlertTriangle },
                      { value: 'due_date', label: 'Data de Vencimento', icon: Calendar }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => { setGroupBy(option.value as typeof groupBy); setIsGroupDropdownOpen(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${groupBy === option.value ? 'bg-white/[0.1] text-white' : 'text-onyx-400 hover:text-white hover:bg-white/[0.05]'}`}
                      >
                        <option.icon size={12} />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>



            {/* Dropdown Colunas */}
            <div className="relative">
              <button
                onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-onyx-400 hover:text-white hover:bg-white/[0.05]"
              >
                <Columns3 size={12} />
                <span>Colunas</span>
              </button>
              {isColumnsDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[99]" onClick={() => setIsColumnsDropdownOpen(false)}></div>
                  <div className="absolute top-full left-0 mt-2 w-48 premium-card rounded-lg shadow-premium-xl z-[100] py-2 px-3 animate-in fade-in zoom-in-95 duration-150">
                    <p className="text-[10px] text-onyx-500 uppercase tracking-wider mb-2 font-bold">Colunas Visíveis</p>
                    {columns.map(col => (
                      <label key={col.id} className="flex items-center gap-2 py-1.5 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-3.5 h-3.5 rounded border-onyx-600 bg-transparent checked:bg-white checked:border-white" />
                        <span className="text-xs text-onyx-300">{col.label}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Lado Direito: Filtro, Fechado, Responsável, Busca, Config, Add Tarefa */}
          <div className="flex items-center gap-1">

            {/* Tabela View: Opção de Colunas (Opcional, pode ser adicionada aqui se necessário) */}

            {/* Filtro */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${hasActiveFilters ? 'bg-white/[0.15] text-white' : 'text-onyx-400 hover:text-white hover:bg-white/[0.05]'}`}
              >
                <Filter size={12} />
                <span>Filtro</span>
                {hasActiveFilters && <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>}
              </button>
              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-[99]" onClick={() => setIsFilterOpen(false)}></div>
                  <div className="absolute top-full right-0 mt-2 w-72 premium-card rounded-xl shadow-premium-xl z-[100] p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                    <div>
                      <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Etiqueta</label>
                      <select
                        value={filterLabel || ''}
                        onChange={(e) => setFilterLabel(e.target.value || null)}
                        className="w-full premium-input rounded-lg px-3 py-2 text-sm text-white"
                      >
                        <option value="">Todas</option>
                        {AVAILABLE_LABELS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Responsável</label>
                      <select
                        value={filterAssignee}
                        onChange={(e) => setFilterAssignee(e.target.value)}
                        className="w-full premium-input rounded-lg px-3 py-2 text-sm text-white"
                      >
                        <option value="">Todos</option>
                        {uniqueAssignees.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${filterOverdue ? 'bg-white border-white' : 'bg-transparent border-onyx-600'}`} onClick={() => setFilterOverdue(!filterOverdue)}>
                        {filterOverdue && <CheckSquare size={10} className="text-black" />}
                      </div>
                      <label className="text-xs text-onyx-400 cursor-pointer select-none" onClick={() => setFilterOverdue(!filterOverdue)}>Apenas atrasados</label>
                    </div>
                    {hasActiveFilters && (
                      <button
                        onClick={() => { setFilterLabel(null); setFilterAssignee(''); setFilterOverdue(false); }}
                        className="w-full text-xs text-white hover:text-white/80 py-2 bg-white/[0.05] rounded-lg font-medium transition-colors"
                      >
                        Limpar filtros
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Toggle Fechado */}
            <button
              onClick={() => setShowClosed(!showClosed)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showClosed ? 'text-onyx-400 hover:text-white hover:bg-white/[0.05]' : 'bg-white/[0.1] text-white'}`}
            >
              {showClosed ? <Eye size={12} /> : <EyeOff size={12} />}
              <span>Fechado</span>
            </button>

            {/* Dropdown Responsável */}
            <div className="relative">
              <button
                onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterAssignee ? 'bg-white/[0.15] text-white' : 'text-onyx-400 hover:text-white hover:bg-white/[0.05]'}`}
              >
                <Users size={12} />
                <span>Responsável</span>
              </button>
              {isAssigneeDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[99]" onClick={() => setIsAssigneeDropdownOpen(false)}></div>
                  <div className="absolute top-full right-0 mt-2 w-48 premium-card rounded-lg shadow-premium-xl z-[100] py-1 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => { setFilterAssignee(''); setIsAssigneeDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${!filterAssignee ? 'bg-white/[0.1] text-white' : 'text-onyx-400 hover:text-white hover:bg-white/[0.05]'}`}
                    >
                      Todos
                    </button>
                    {uniqueAssignees.map(assignee => (
                      <button
                        key={assignee}
                        onClick={() => { setFilterAssignee(assignee); setIsAssigneeDropdownOpen(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${filterAssignee === assignee ? 'bg-white/[0.1] text-white' : 'text-onyx-400 hover:text-white hover:bg-white/[0.05]'}`}
                      >
                        <div className="w-5 h-5 rounded-full bg-onyx-700 flex items-center justify-center text-[9px] font-bold text-white">
                          {assignee.substring(0, 2).toUpperCase()}
                        </div>
                        {assignee}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="w-px h-5 bg-white/[0.08] mx-1"></div>

            {/* Busca */}
            <div className="relative">
              {isSearchOpen ? (
                <div className="flex items-center gap-2 bg-white/[0.05] rounded-lg px-3 py-1.5 border border-white/[0.1]">
                  <Search size={12} className="text-onyx-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar..."
                    className="bg-transparent text-xs text-white focus:outline-none w-24"
                    autoFocus
                    onBlur={() => { if (!searchQuery) setIsSearchOpen(false); }}
                  />
                  <button onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }} className="text-onyx-500 hover:text-white">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="flex items-center justify-center p-1.5 rounded-lg text-onyx-400 hover:text-white hover:bg-white/[0.05] transition-all"
                >
                  <Search size={14} />
                </button>
              )}
            </div>

            {/* Configurações */}
            <button className="flex items-center justify-center p-1.5 rounded-lg text-onyx-400 hover:text-white hover:bg-white/[0.05] transition-all">
              <Settings size={14} />
            </button>

            {/* Botão Add Tarefa */}
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-purple-500/20 ml-2"
            >
              <Plus size={14} />
              Add Tarefa
            </button>
          </div>
        </div>
      </div>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="premium-card rounded-2xl overflow-hidden border border-white/[0.04]">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white/[0.02] border-b border-white/[0.04] text-[10px] font-bold text-onyx-500 uppercase tracking-wider">
              <div className="col-span-4">Nome</div>
              <div className="col-span-2">Responsável</div>
              <div className="col-span-2">Data de Vencimento</div>
              <div className="col-span-2">Prioridade</div>
              <div className="col-span-2">Status</div>
            </div>

            {/* Grouped by Status */}
            {columns.map(col => {
              const colTasks = filteredTasks.filter(t => t.status === col.id);
              const isCollapsed = collapsedColumns.has(col.id);

              return (
                <div key={col.id} className="border-b border-white/[0.02] last:border-b-0">
                  {/* Status Group Header */}
                  <button
                    onClick={() => {
                      const newCollapsed = new Set(collapsedColumns);
                      if (isCollapsed) newCollapsed.delete(col.id);
                      else newCollapsed.add(col.id);
                      setCollapsedColumns(newCollapsed);
                    }}
                    className="w-full flex items-center gap-3 px-6 py-3 bg-white/[0.01] hover:bg-white/[0.03] transition-colors text-left"
                  >
                    <ChevronRight size={14} className={`text-onyx-500 transition-transform ${!isCollapsed ? 'rotate-90' : ''}`} />
                    <div className={`w-2 h-2 rounded-full ${col.id === TaskStatus.DONE ? 'bg-white' : 'bg-onyx-500'}`}></div>
                    <span className="text-sm font-bold text-white">{col.label}</span>
                    <span className="text-xs text-onyx-500 font-mono bg-white/[0.05] px-2 py-0.5 rounded-full">{colTasks.length}</span>
                  </button>

                  {/* Tasks in Group */}
                  {!isCollapsed && (
                    <div>
                      {colTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => openModal(task)}
                          className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer border-t border-white/[0.02] group"
                        >
                          <div className="col-span-4 flex items-center gap-3">
                            <div className="w-4 h-4 rounded border border-onyx-600 group-hover:border-onyx-400 transition-colors"></div>
                            <span className="text-sm font-medium text-white truncate">{task.title}</span>
                          </div>
                          <div className="col-span-2 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-onyx-800 border border-white/[0.1] flex items-center justify-center text-[9px] text-white font-bold">
                              {task.assignee ? task.assignee.substring(0, 2).toUpperCase() : '?'}
                            </div>
                            <span className="text-xs text-onyx-400 truncate">{task.assignee || '-'}</span>
                          </div>
                          <div className="col-span-2 flex items-center">
                            <span className={`text-xs font-mono ${new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE ? 'text-red-400' : 'text-onyx-400'}`}>
                              {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <div className="col-span-2 flex items-center">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded border ${task.priority === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              task.priority === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                'bg-green-500/10 text-green-400 border-green-500/20'
                              }`}>
                              {task.priority === 'HIGH' ? 'Alta' : task.priority === 'MEDIUM' ? 'Média' : 'Baixa'}
                            </span>
                          </div>
                          <div className="col-span-2 flex items-center">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded border ${task.status === TaskStatus.DONE ? 'bg-white/10 text-white border-white/20' :
                              task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                task.status === TaskStatus.REVIEW ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                  'bg-onyx-500/10 text-onyx-400 border-onyx-500/20'
                              }`}>
                              {col.label}
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Inline Add Task */}
                      {inlineAddColumn === col.id ? (
                        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-t border-white/[0.02] bg-white/[0.01]">
                          <div className="col-span-4 flex items-center gap-3">
                            <div className="w-4 h-4 rounded border border-onyx-600"></div>
                            <input
                              type="text"
                              value={inlineTaskTitle}
                              onChange={(e) => setInlineTaskTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && inlineTaskTitle.trim()) {
                                  const newTask: Task = {
                                    id: `t-${Date.now()}`,
                                    title: inlineTaskTitle.trim(),
                                    description: '',
                                    assignee: '',
                                    dueDate: new Date().toISOString().split('T')[0],
                                    status: col.id,
                                    labels: [],
                                    priority: 'MEDIUM',
                                    checklist: [],
                                    comments: []
                                  };
                                  setTasks(prev => [...prev, newTask]);
                                  setInlineTaskTitle('');
                                  setInlineAddColumn(null);
                                }
                                if (e.key === 'Escape') {
                                  setInlineTaskTitle('');
                                  setInlineAddColumn(null);
                                }
                              }}
                              placeholder="Digite o nome da tarefa..."
                              className="flex-1 bg-transparent text-sm text-white focus:outline-none"
                              autoFocus
                            />
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setInlineAddColumn(col.id)}
                          className="w-full text-left px-6 py-3 text-xs text-onyx-500 hover:text-white hover:bg-white/[0.02] transition-colors flex items-center gap-2 border-t border-white/[0.02]"
                        >
                          <Plus size={12} /> Adicionar Tarefa
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="flex-1 overflow-hidden flex flex-col pt-0">
          <div className="premium-card rounded-2xl border border-white/[0.04] flex-1 flex flex-col overflow-hidden shadow-2xl bg-[#0f0f11]">
            {/* Calendar Header (Control Bar - INSIDE Card) */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.04] bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-xs font-medium text-white bg-white/[0.05] hover:bg-white/[0.1] rounded-lg transition-colors border border-white/[0.05]">
                  Hoje
                </button>
                <div className="flex bg-white/[0.05] rounded-lg p-0.5 border border-white/[0.05]">
                  <button className="px-3 py-1 text-xs font-medium text-white bg-white/[0.1] rounded shadow-sm">
                    Mês
                  </button>
                  <button className="px-3 py-1 text-xs font-medium text-onyx-400 hover:text-white transition-colors">
                    Semana
                  </button>
                </div>
              </div>

              <div className="h-4 w-px bg-white/[0.1]"></div>

              <div className="flex items-center gap-1">
                <button className="p-1.5 text-onyx-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]">
                  <ChevronLeft size={16} />
                </button>
                <button className="p-1.5 text-onyx-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]">
                  <ChevronRight size={16} />
                </button>
              </div>

              <h3 className="text-sm font-bold text-white ml-2">Dezembro 2024</h3>

              <div className="flex-1"></div>

              <div className="flex items-center gap-4 text-xs font-medium text-onyx-400">
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-onyx-600"></div> 3 Não agendado</span>
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> 0 Em atraso</span>
              </div>
            </div>

            {/* Calendar Grid Header (Days) */}
            <div className="grid grid-cols-7 border-b border-white/[0.04] bg-white/[0.01]">
              {['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'].map(day => (
                <div key={day} className="px-4 py-3 text-xs font-medium text-onyx-500 lowercase">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid Body */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-[#0f0f11]">
              {Array.from({ length: 35 }, (_, i) => {
                const dayNum = i - 6 + 1;
                const isCurrentMonth = dayNum > 0 && dayNum <= 31;
                const tasksOnDay = filteredTasks.filter(t => {
                  const d = new Date(t.dueDate);
                  return d.getDate() === dayNum && d.getMonth() === 11;
                });

                return (
                  <div
                    key={i}
                    className={`min-h-[120px] border-r border-b border-white/[0.04] p-2 relative group hover:bg-white/[0.01] transition-colors flex flex-col gap-1 ${!isCurrentMonth ? 'bg-stripes-onyx opacity-50' : ''}`}
                  >
                    {/* Content Area */}
                    <div className="flex-1 space-y-1">
                      {isCurrentMonth && tasksOnDay.map(task => (
                        <div
                          key={task.id}
                          onClick={() => openModal(task)}
                          className={`text-[10px] truncate px-2 py-1 rounded cursor-pointer border-l-2 transition-all hover:translate-x-0.5 ${task.status === TaskStatus.DONE ? 'bg-green-500/10 border-green-500 text-green-400' :
                            task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-500/10 border-blue-500 text-blue-400' :
                              task.status === TaskStatus.REVIEW ? 'bg-purple-500/10 border-purple-500 text-purple-400' :
                                'bg-onyx-500/10 border-onyx-500 text-onyx-300'
                            }`}
                        >
                          {task.title}
                        </div>
                      ))}
                    </div>

                    {/* Date Number (Bottom Right) */}
                    {isCurrentMonth && (
                      <div className={`text-xs absolute bottom-2 right-2 font-medium ${dayNum === 7 ? 'bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-onyx-500'}`}>
                        {dayNum}
                      </div>
                    )}

                    {/* Add Button on Hover */}
                    {isCurrentMonth && (
                      <button onClick={() => { setInlineAddColumn(TaskStatus.TODO); setInlineTaskTitle(''); }} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-white/[0.1] rounded text-onyx-400 hover:text-white transition-all">
                        <Plus size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CHANNEL VIEW - Feed de Comunicação */}
      {
        viewMode === 'channel' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-4">
              {/* Input de nova mensagem */}
              <div className="premium-card rounded-2xl p-4 border border-white/[0.04]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white">
                    VC
                  </div>
                  <div className="flex-1">
                    <textarea
                      placeholder="Compartilhe uma atualização, anexe um arquivo ou @mencione alguém..."
                      className="w-full bg-transparent text-sm text-white placeholder-onyx-500 focus:outline-none resize-none min-h-[60px]"
                    />
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
                      <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg text-onyx-400 hover:text-white hover:bg-white/[0.05]">
                          <Plus size={16} />
                        </button>
                        <button className="p-2 rounded-lg text-onyx-400 hover:text-white hover:bg-white/[0.05]">
                          <Hash size={16} />
                        </button>
                      </div>
                      <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors">
                        Publicar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feed de atividades - Usando dados reais das tasks */}
              {/* TODO: Integrar useActivityLog quando tenantId estiver disponível */}
              {filteredTasks
                .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
                .slice(0, 15)
                .map((task) => {
                  // Calcula tempo relativo real baseado na dueDate
                  const taskDate = new Date(task.dueDate);
                  const now = new Date();
                  const diffMs = now.getTime() - taskDate.getTime();
                  const diffMin = Math.floor(Math.abs(diffMs) / (1000 * 60));
                  const diffHour = Math.floor(diffMin / 60);
                  const diffDay = Math.floor(diffHour / 24);

                  let timeAgo = '';
                  if (diffMs > 0) {
                    // Passado
                    if (diffMin < 60) timeAgo = diffMin === 0 ? 'agora' : `há ${diffMin} min`;
                    else if (diffHour < 24) timeAgo = `há ${diffHour}h`;
                    else if (diffDay === 1) timeAgo = 'ontem';
                    else if (diffDay < 7) timeAgo = `há ${diffDay} dias`;
                    else timeAgo = taskDate.toLocaleDateString('pt-BR');
                  } else {
                    // Futuro (deadline)
                    if (diffMin < 60) timeAgo = 'em breve';
                    else if (diffHour < 24) timeAgo = `em ${Math.abs(diffHour)}h`;
                    else timeAgo = `em ${Math.abs(diffDay)} dias`;
                  }

                  // Determina ação baseada no status real
                  const getActionInfo = () => {
                    switch (task.status) {
                      case TaskStatus.DONE: return { emoji: '✅', text: 'completou a tarefa' };
                      case TaskStatus.IN_PROGRESS: return { emoji: '🔄', text: 'está trabalhando em' };
                      case TaskStatus.REVIEW: return { emoji: '👀', text: 'enviou para revisão' };
                      default: return { emoji: '📝', text: 'criou a tarefa' };
                    }
                  };
                  const actionInfo = getActionInfo();

                  return (
                    <div key={task.id} className="premium-card rounded-2xl p-4 border border-white/[0.04] hover:border-white/[0.08] transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${task.status === TaskStatus.DONE ? 'bg-green-600' :
                          task.status === TaskStatus.IN_PROGRESS ? 'bg-purple-600' :
                            task.status === TaskStatus.REVIEW ? 'bg-blue-600' : 'bg-onyx-700'
                          }`}>
                          {task.assignee ? task.assignee.substring(0, 2).toUpperCase() : '?'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-white">{task.assignee || 'Usuário'}</span>
                            <span className="text-[10px] text-onyx-500">{timeAgo}</span>
                            {task.priority === 'HIGH' && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-500/20 text-red-400 rounded">URGENTE</span>
                            )}
                          </div>
                          <p className="text-xs text-onyx-300 mb-2">
                            {actionInfo.emoji} {actionInfo.text}
                          </p>
                          <div
                            onClick={() => openModal(task)}
                            className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-3 cursor-pointer hover:bg-white/[0.05] transition-colors"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${task.status === TaskStatus.DONE ? 'bg-green-500' :
                                task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-500' :
                                  task.status === TaskStatus.REVIEW ? 'bg-purple-500' : 'bg-onyx-500'
                                }`}></div>
                              <span className="text-sm font-medium text-white">{task.title}</span>
                            </div>
                            {task.description && (
                              <p className="text-xs text-onyx-400 line-clamp-2">{task.description}</p>
                            )}
                            {task.progress !== undefined && task.progress > 0 && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 h-1 bg-onyx-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${task.progress}%` }} />
                                </div>
                                <span className="text-[10px] text-onyx-500">{task.progress}%</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-3">
                            <button className="flex items-center gap-1.5 text-onyx-500 hover:text-white text-xs transition-colors">
                              <MessageSquare size={14} />
                              {task.comments?.length || 0}
                            </button>
                            <button className="flex items-center gap-1.5 text-onyx-500 hover:text-white text-xs transition-colors">
                              <Zap size={14} />
                              Reagir
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {filteredTasks.length === 0 && (
                <div className="premium-card rounded-2xl p-12 border border-white/[0.04] text-center">
                  <Hash size={48} className="mx-auto text-onyx-600 mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Nenhuma atividade</h3>
                  <p className="text-sm text-onyx-500">Crie tarefas para ver o feed de atividades aqui.</p>
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* GANTT VIEW - Cronograma */}
      {
        viewMode === 'gantt' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="premium-card rounded-2xl border border-white/[0.04] flex-1 flex flex-col overflow-hidden">
              {/* Gantt Toolbar (ClickUp Style) */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.04] bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-onyx-400 hover:text-white border border-white/[0.1] hover:bg-white/[0.05] rounded-lg transition-colors">
                    <LayoutGrid size={12} /> Hoje
                  </button>
                  <div className="flex items-center bg-white/[0.05] rounded-lg p-0.5">
                    <button className="px-3 py-1 text-xs font-medium text-white bg-white/[0.1] rounded shadow-sm">Semana</button>
                    <button className="px-3 py-1 text-xs font-medium text-onyx-400 hover:text-white">Mês</button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-onyx-400 hover:text-white border border-white/[0.1] hover:bg-white/[0.05] rounded-lg transition-colors">
                    Ajuste automático
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-onyx-400 hover:text-white border border-white/[0.1] hover:bg-white/[0.05] rounded-lg transition-colors">
                    <Share2 size={12} /> Exportar
                  </button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Left Pane: Task List */}
                <div className="w-80 flex-shrink-0 border-r border-white/[0.04] flex flex-col bg-white/[0.005]">
                  <div className="h-10 border-b border-white/[0.04] flex items-center px-4">
                    <span className="text-xs font-bold text-onyx-500 uppercase tracking-wide">Nome</span>
                    <div className="ml-auto">
                      <Plus size={14} className="text-onyx-500 cursor-pointer hover:text-white" />
                    </div>
                  </div>

                  {/* List Body */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="py-2">
                      <div className="flex items-center gap-2 px-4 py-2 hover:bg-white/[0.02] cursor-pointer group">
                        <ChevronDown size={12} className="text-onyx-500" />
                        <FolderOpen size={14} className="text-onyx-500 group-hover:text-white" />
                        <span className="text-sm font-bold text-white">Projeto 1</span>
                      </div>

                      {filteredTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-2 pl-10 pr-4 py-2 hover:bg-white/[0.02] cursor-pointer group border-l-2 border-transparent hover:border-purple-500" onClick={() => openModal(task)}>
                          <div className={`w-2 h-2 rounded-sm ${task.status === TaskStatus.DONE ? 'bg-green-500' : task.status === TaskStatus.IN_PROGRESS ? 'bg-purple-500' : 'bg-onyx-500'}`}></div>
                          <span className="text-xs text-onyx-300 group-hover:text-white truncate">{task.title}</span>
                        </div>
                      ))}

                      <div className="flex items-center gap-2 pl-10 pr-4 py-2 text-onyx-500 hover:text-white cursor-pointer hover:bg-white/[0.02]">
                        <Plus size={12} /> <span className="text-xs">Add Task</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Pane: Timeline */}
                <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative bg-[#0f0f11]">
                  <div className="min-w-[1200px]">
                    {/* Timeline Header */}
                    <div className="h-10 border-b border-white/[0.04] flex bg-white/[0.01]">
                      {['W49 dez 7-13', 'W50 dez 14-20', 'W51 dez 21-27', 'W52 dez 28-3'].map((week, i) => (
                        <div key={i} className="flex-1 border-r border-white/[0.04] flex flex-col">
                          <div className="text-[9px] text-center py-0.5 text-onyx-500 border-b border-white/[0.02]">{week}</div>
                          <div className="flex flex-1">
                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, di) => (
                              <div key={di} className={`flex-1 flex flex-col items-center justify-center border-r border-white/[0.02] last:border-0 ${i === 0 && di === 3 ? 'bg-red-500/10' : ''}`}>
                                <span className={`text-[8px] font-bold ${i === 0 && di === 3 ? 'text-red-400' : 'text-onyx-600'}`}>{7 + i * 7 + di}</span>
                                <span className="text-[7px] text-onyx-700">{d}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Timeline Grid & Content */}
                    <div className="relative">
                      {/* Grid Columns Background */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {Array.from({ length: 28 }).map((_, i) => (
                          <div key={i} className={`flex-1 border-r border-white/[0.02] ${i === 3 ? 'bg-red-500/05 relative' : ''}`}>
                            {i === 3 && (
                              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-red-500 h-full z-10">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full absolute -top-0.5 -left-[2px]"></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Spacer for Project Header */}
                      <div className="h-[38px] border-b border-white/[0.02]"></div>

                      {/* Task Rows */}
                      {filteredTasks.map((task) => {
                        // Calcula posição baseada em datas reais
                        const ganttStart = new Date('2024-12-07'); // Início do Gantt (primeira coluna)
                        const ganttEnd = new Date('2025-01-03'); // Fim do Gantt (28 dias)
                        const totalDays = 28;

                        // Usa startDate/endDate se disponível, senão faz fallback para dueDate
                        const taskStart = task.startDate ? new Date(task.startDate) : new Date(task.dueDate);
                        const taskEnd = task.endDate ? new Date(task.endDate) : new Date(taskStart.getTime() + 2 * 24 * 60 * 60 * 1000); // +2 dias default

                        // Calcula dias desde o início do Gantt
                        const startOffset = Math.max(0, Math.floor((taskStart.getTime() - ganttStart.getTime()) / (24 * 60 * 60 * 1000)));
                        const endOffset = Math.min(totalDays, Math.ceil((taskEnd.getTime() - ganttStart.getTime()) / (24 * 60 * 60 * 1000)));
                        const duration = Math.max(1, endOffset - startOffset);

                        // Garante que a barra fique dentro do range visível
                        const clampedStart = Math.max(0, Math.min(startOffset, totalDays - 1));
                        const clampedDuration = Math.min(duration, totalDays - clampedStart);

                        // Indicador de progresso
                        const progress = task.progress || 0;

                        return (
                          <div key={task.id} className="h-[34px] border-b border-white/[0.02] relative group hover:bg-white/[0.01]">
                            <div
                              className={`absolute top-1.5 h-5 rounded-full z-20 cursor-pointer flex items-center px-2 shadow-sm border overflow-hidden ${task.status === TaskStatus.DONE ? 'bg-green-500/20 border-green-500/50' :
                                task.status === TaskStatus.IN_PROGRESS ? 'bg-purple-500/20 border-purple-500/50' :
                                  'bg-onyx-500/20 border-onyx-500/50'
                                }`}
                              style={{
                                left: `${(clampedStart / totalDays) * 100}%`,
                                width: `${(clampedDuration / totalDays) * 100}%`,
                                minWidth: '40px'
                              }}
                              onClick={() => openModal(task)}
                            >
                              {/* Barra de progresso interna */}
                              {progress > 0 && (
                                <div
                                  className="absolute left-0 top-0 bottom-0 bg-current opacity-20 rounded-l-full"
                                  style={{ width: `${progress}%` }}
                                />
                              )}
                              {task.priority === 'HIGH' && <div className="w-1 h-1 rounded-full bg-yellow-400 mr-1.5 flex-shrink-0"></div>}
                              <span className="text-[9px] font-medium text-white truncate relative z-10">{task.title}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* TABLE VIEW */}
      {
        viewMode === 'table' && (
          <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar flex flex-col">
            <div className="premium-card rounded-2xl border border-white/[0.04] min-w-[1000px] flex-1 overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-0 bg-white/[0.02] border-b border-white/[0.04]">
                <div className="col-span-1 border-r border-white/[0.04] p-3 flex items-center justify-center">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded border-onyx-600 bg-transparent" />
                </div>
                <div className="col-span-3 border-r border-white/[0.04] p-3 text-xs font-medium text-onyx-500 uppercase tracking-wide">
                  Nome
                </div>
                <div className="col-span-2 border-r border-white/[0.04] p-3 text-xs font-medium text-onyx-500 uppercase tracking-wide">
                  Responsável
                </div>
                <div className="col-span-2 border-r border-white/[0.04] p-3 text-xs font-medium text-onyx-500 uppercase tracking-wide">
                  Status
                </div>
                <div className="col-span-2 border-r border-white/[0.04] p-3 text-xs font-medium text-onyx-500 uppercase tracking-wide">
                  Data de vencimento
                </div>
                <div className="col-span-2 p-3 text-xs font-medium text-onyx-500 uppercase tracking-wide">
                  Prioridade
                </div>
              </div>

              {/* Table Rows */}
              {filteredTasks.map((task, index) => (
                <div
                  key={task.id}
                  className="grid grid-cols-12 gap-0 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group text-sm"
                >
                  {/* Index / Checkbox */}
                  <div className="col-span-1 border-r border-white/[0.04] p-3 flex items-center gap-3 relative">
                    <span className="text-xs text-onyx-500 absolute left-3 group-hover:opacity-0 transition-opacity">{index + 1}</span>
                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-onyx-600 bg-transparent opacity-0 group-hover:opacity-100 transition-opacity absolute left-3" />
                    <div className="w-full flex justify-end">
                      <button onClick={() => openModal(task)} className="p-1 text-onyx-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Nome */}
                  <div className="col-span-3 border-r border-white/[0.04] p-3 flex items-center gap-2 cursor-pointer" onClick={() => openModal(task)}>
                    {task.status === TaskStatus.DONE ? (
                      <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white"><CheckSquare size={10} /></div>
                    ) : task.status === TaskStatus.IN_PROGRESS ? (
                      <div className="w-4 h-4 rounded-full border-2 border-purple-500"></div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-onyx-500 border-dashed"></div>
                    )}
                    <span className={`${task.status === TaskStatus.DONE ? 'text-onyx-500 line-through' : 'text-white'}`}>{task.title}</span>
                  </div>

                  {/* Responsável */}
                  <div className="col-span-2 border-r border-white/[0.04] p-3 flex items-center">
                    {task.assignee ? (
                      <div className="w-6 h-6 rounded-full bg-onyx-700 flex items-center justify-center text-[9px] font-bold text-white border border-white/[0.1]">
                        {task.assignee.substring(0, 2).toUpperCase()}
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-transparent border border-dashed border-onyx-600 flex items-center justify-center text-onyx-600">
                        <UserCircle size={14} />
                      </div>
                    )}
                  </div>

                  {/* Status (ClickUp Style Badges) */}
                  <div className="col-span-2 border-r border-white/[0.04] p-3 flex items-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${task.status === TaskStatus.DONE ? 'bg-green-500 text-white' :
                      task.status === TaskStatus.IN_PROGRESS ? 'bg-purple-600 text-white' :
                        task.status === TaskStatus.REVIEW ? 'bg-orange-500 text-white' :
                          'bg-onyx-600 text-onyx-200'
                      }`}>
                      {task.status === TaskStatus.DONE && <CheckSquare size={10} className="fill-white" />}
                      {task.status === TaskStatus.IN_PROGRESS && <div className="w-2 h-2 rounded-full border-[3px] border-l-transparent border-white animate-spin"></div>}
                      {task.status === TaskStatus.TODO && <div className="w-2 h-2 rounded-full border border-white opacity-50"></div>}

                      {task.status === TaskStatus.DONE ? 'CONCLUÍDO' :
                        task.status === TaskStatus.IN_PROGRESS ? 'EM PROGRESSO' :
                          task.status === TaskStatus.REVIEW ? 'REVISÃO' : 'A FAZER'}
                    </span>
                  </div>

                  {/* Data de Vencimento */}
                  <div className="col-span-2 border-r border-white/[0.04] p-3 flex items-center">
                    {task.dueDate ? (
                      <span className="text-xs text-onyx-400">{new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>
                    ) : (
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Calendar size={14} className="text-onyx-600" />
                      </span>
                    )}
                  </div>

                  {/* Prioridade */}
                  <div className="col-span-2 p-3 flex items-center">
                    {task.priority === 'HIGH' && <Tag size={14} className="text-red-500 fill-red-500/20" />}
                    {task.priority === 'MEDIUM' && <Tag size={14} className="text-yellow-500 fill-yellow-500/20" />}
                    {task.priority === 'LOW' && <Tag size={14} className="text-blue-500 fill-blue-500/20" />}
                  </div>
                </div>
              ))}

              {/* Add Row Placeholder */}
              <div className="grid grid-cols-12 gap-0 border-b border-white/[0.04] hover:bg-white/[0.01] transition-colors cursor-pointer group">
                <div className="col-span-12 p-2 flex items-center text-onyx-500 text-xs gap-2 group-hover:text-purple-400">
                  <Plus size={14} /> <span className="font-medium">Nova tarefa...</span>
                </div>
              </div>

              <div className="h-full bg-white/[0.005]"></div>
            </div>
          </div>
        )
      }

      {/* BOARD VIEW (Original Kanban) */}
      {
        viewMode === 'board' && (
          <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
            <div className="flex gap-6 min-w-[1000px] h-full">
              {columns.map(col => {
                const colTasks = filteredTasks.filter(t => t.status === col.id);
                return (
                  <div
                    key={col.id}
                    className={`flex-1 flex flex-col min-w-[280px] transition-all rounded-3xl ${draggedOverColumn === col.id ? 'bg-white/[0.03] ring-1 ring-white/[0.1]' : ''
                      }`}
                    onDragOver={handleDragOver}
                    onDragEnter={() => handleDragEnter(col.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, col.id)}
                  >
                    <div className="mb-4 flex justify-between items-center px-4 pt-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shadow-glow ${col.id === TaskStatus.DONE ? 'bg-white' : 'bg-onyx-500'}`}></div>
                        <span className="font-bold text-white text-sm tracking-wide">{col.label}</span>
                        <span className="text-onyx-500 text-xs font-mono bg-white/[0.05] px-2 py-0.5 rounded-full">{colTasks.length}</span>
                      </div>
                      <button onClick={() => openModal()} className="text-onyx-600 hover:text-white transition-colors p-1 hover:bg-white/[0.05] rounded-lg">
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="flex-1 space-y-3 px-2 pb-2 overflow-y-auto custom-scrollbar">
                      {colTasks.map((task, index) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onClick={() => openModal(task)}
                          className={`premium-card p-5 rounded-2xl cursor-grab active:cursor-grabbing group relative hover:-translate-y-1 duration-300 animate-fade-in ${draggedTask === task.id ? 'opacity-50 scale-95' : ''
                            }`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="absolute top-4 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-black/80 backdrop-blur rounded-lg border border-white/[0.1] p-0.5 shadow-xl z-10">
                            <button
                              onClick={(e) => { e.stopPropagation(); moveTask(task.id, 'prev'); }}
                              disabled={task.status === TaskStatus.TODO}
                              className="p-1 hover:bg-white/[0.1] rounded disabled:opacity-30 text-onyx-400 hover:text-white transition-colors"
                            >
                              <ChevronLeft size={12} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveTask(task.id, 'next'); }}
                              disabled={task.status === TaskStatus.DONE}
                              className="p-1 hover:bg-white/[0.1] rounded disabled:opacity-30 text-onyx-400 hover:text-white transition-colors"
                            >
                              <ChevronRight size={12} />
                            </button>
                          </div>

                          <div className="mb-3">
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-[9px] font-bold text-onyx-600 font-mono">#{task.id.slice(-4)}</span>
                              {task.priority === 'HIGH' && (
                                <span className="text-[9px] font-bold text-white flex items-center gap-1 bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
                                  <AlertTriangle size={9} /> ALTA
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-white leading-snug group-hover:text-white/90 transition-colors">{task.title}</h4>

                            {/* Labels */}
                            {task.labels && task.labels.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {task.labels.map(label => (
                                  <span
                                    key={label.id}
                                    className={`text-[9px] font-bold px-2 py-0.5 rounded border ${label.color}`}
                                  >
                                    {label.name}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Checklist Progress */}
                            {task.checklist && task.checklist.length > 0 && (
                              <div className="flex items-center gap-2 mt-3 bg-white/[0.02] p-1.5 rounded-lg border border-white/[0.02]">
                                <ListChecks size={12} className="text-onyx-500" />
                                <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-white transition-all duration-500"
                                    style={{ width: `${(task.checklist.filter(c => c.completed).length / task.checklist.length) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-[9px] text-onyx-500 font-mono">
                                  {task.checklist.filter(c => c.completed).length}/{task.checklist.length}
                                </span>
                              </div>
                            )}

                            {/* Playbooks - MVP 0 Killer Feature */}
                            {task.playbooks && task.playbooks.length > 0 && (
                              <div className="mt-3">
                                <PlaybookList playbooks={task.playbooks} maxVisible={2} />
                              </div>
                            )}

                            {/* XP Reward Badge */}
                            {(task.xp_reward || task.priority) && (
                              <div className="flex items-center gap-2 mt-3">
                                <span className="text-[9px] font-bold text-yellow-400 flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                                  <Zap size={9} />
                                  +{task.xp_reward || (task.priority === 'HIGH' ? XP_REWARDS.TASK_COMPLETE_HIGH : XP_REWARDS.TASK_COMPLETE)} XP
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-onyx-700 to-black border border-white/[0.1] flex items-center justify-center text-[9px] text-white font-bold shadow-inner">
                                {task.assignee ? task.assignee.substring(0, 2).toUpperCase() : '?'}
                              </div>
                              <span className="text-[10px] text-onyx-500 truncate max-w-[80px] font-medium">{task.assignee ? task.assignee.split(' ')[0] : 'Unassigned'}</span>
                            </div>

                            <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md border ${new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE
                              ? 'text-red-400 border-red-500/30 bg-red-500/10'
                              : 'text-onyx-400 border-white/[0.05] bg-white/[0.02]'
                              }`}>
                              <Calendar size={10} />
                              {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      ))}

                      <button onClick={() => openModal()} className="w-full py-3 rounded-2xl border border-dashed border-white/[0.1] text-onyx-500 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.02] text-xs font-bold transition-all flex items-center justify-center gap-2 group uppercase tracking-wide">
                        <Plus size={14} className="group-hover:scale-110 transition-transform" />
                        Adicionar Card
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add New Status Column */}
              <div className="flex-shrink-0 w-[280px]">
                {isAddingColumn ? (
                  <div className="premium-card p-4 rounded-2xl border border-green-500/20 bg-green-500/5">
                    <input
                      type="text"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newColumnName.trim()) {
                          const newId = `CUSTOM_${Date.now()}` as TaskStatus;
                          setCustomColumns([...customColumns, { id: newId, label: newColumnName.trim(), color: 'bg-green-500' }]);
                          setNewColumnName('');
                          setIsAddingColumn(false);
                        }
                        if (e.key === 'Escape') {
                          setNewColumnName('');
                          setIsAddingColumn(false);
                        }
                      }}
                      placeholder="Nome do status..."
                      className="w-full bg-transparent text-white text-sm font-bold focus:outline-none mb-3"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (newColumnName.trim()) {
                            const newId = `CUSTOM_${Date.now()}` as TaskStatus;
                            setCustomColumns([...customColumns, { id: newId, label: newColumnName.trim(), color: 'bg-green-500' }]);
                            setNewColumnName('');
                            setIsAddingColumn(false);
                          }
                        }}
                        className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold hover:bg-green-500/30 transition-colors"
                      >
                        Criar
                      </button>
                      <button
                        type="button"
                        onClick={() => { setNewColumnName(''); setIsAddingColumn(false); }}
                        className="px-3 py-2 bg-white/[0.05] text-onyx-400 rounded-lg text-xs font-bold hover:bg-white/[0.1] transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingColumn(true)}
                    className="w-full h-full min-h-[200px] rounded-2xl border border-dashed border-white/[0.1] text-onyx-500 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.02] text-xs font-bold transition-all flex flex-col items-center justify-center gap-2 group"
                  >
                    <Plus size={24} className="group-hover:scale-110 transition-transform" />
                    <span className="uppercase tracking-wider">Novo Status</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Task Modal */}
      {
        isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative premium-card w-full max-w-2xl shadow-2xl animate-scale-in flex flex-col max-h-[85vh] rounded-3xl overflow-hidden">

              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-white/[0.04] bg-white/[0.02]">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
                  <p className="text-xs text-onyx-500 mt-1">Gerencie os detalhes e o progresso desta atividade.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-onyx-500 hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors"><X size={20} /></button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                <form id="taskForm" onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Título da Tarefa</label>
                    <input
                      required
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full premium-input rounded-xl px-4 py-3 text-white font-medium text-lg"
                      placeholder="Ex: Definir Estratégia de Lançamento"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Responsável</label>
                      <div className="relative">
                        <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-onyx-500" size={16} />
                        <input
                          value={formData.assignee}
                          onChange={e => setFormData({ ...formData, assignee: e.target.value })}
                          className="w-full premium-input rounded-xl pl-10 pr-4 py-3 text-white"
                          placeholder="Nome do responsável"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Prazo de Entrega</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-onyx-500" size={16} />
                        <input
                          type="date"
                          required
                          value={formData.dueDate}
                          onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                          className="w-full premium-input rounded-xl pl-10 pr-4 py-3 text-white [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Descrição Detalhada</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full premium-input rounded-xl px-4 py-3 text-white min-h-[120px] resize-none leading-relaxed"
                      placeholder="Descreva os detalhes, requisitos e objetivos desta tarefa..."
                    />
                  </div>

                  {/* Labels */}
                  <div>
                    <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-3 tracking-wider">Etiquetas</label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_LABELS.map(label => (
                        <button
                          key={label.id}
                          type="button"
                          onClick={() => {
                            const newLabels = formData.labels.includes(label.id)
                              ? formData.labels.filter(l => l !== label.id)
                              : [...formData.labels, label.id];
                            setFormData({ ...formData, labels: newLabels });
                          }}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${formData.labels.includes(label.id)
                            ? `${label.color} border-transparent shadow-glow`
                            : 'bg-white/[0.02] text-onyx-500 border-white/[0.05] hover:border-white/[0.1] hover:text-white'
                            }`}
                        >
                          {label.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
                    <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-3 tracking-wider flex items-center gap-2">
                      <ListChecks size={14} /> Checklist
                    </label>
                    <div className="space-y-2 mb-4">
                      {formData.checklist.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-3 group p-2 hover:bg-white/[0.03] rounded-lg transition-colors">
                          <button
                            type="button"
                            onClick={() => {
                              const newChecklist = [...formData.checklist];
                              newChecklist[index].completed = !newChecklist[index].completed;
                              setFormData({ ...formData, checklist: newChecklist });
                            }}
                            className="flex-shrink-0 text-onyx-500 hover:text-white transition-colors"
                          >
                            {item.completed ? (
                              <CheckSquare size={18} className="text-white" />
                            ) : (
                              <Square size={18} />
                            )}
                          </button>
                          <span className={`flex-1 text-sm font-medium ${item.completed ? 'text-onyx-600 line-through' : 'text-onyx-200'}`}>
                            {item.text}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, checklist: formData.checklist.filter((_, i) => i !== index) });
                            }}
                            className="text-onyx-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      {formData.checklist.length === 0 && (
                        <p className="text-xs text-onyx-600 italic px-2">Nenhum item na checklist.</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.newChecklistItem}
                        onChange={e => setFormData({ ...formData, newChecklistItem: e.target.value })}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && formData.newChecklistItem.trim()) {
                            e.preventDefault();
                            setFormData({
                              ...formData,
                              checklist: [...formData.checklist, { id: `cl-${Date.now()}`, text: formData.newChecklistItem.trim(), completed: false }],
                              newChecklistItem: ''
                            });
                          }
                        }}
                        placeholder="Adicionar novo item..."
                        className="flex-1 premium-input rounded-lg px-3 py-2 text-sm text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (formData.newChecklistItem.trim()) {
                            setFormData({
                              ...formData,
                              checklist: [...formData.checklist, { id: `cl-${Date.now()}`, text: formData.newChecklistItem.trim(), completed: false }],
                              newChecklistItem: ''
                            });
                          }
                        }}
                        className="px-3 py-2 bg-white/[0.05] text-white rounded-lg hover:bg-white/[0.1] text-sm border border-white/[0.05]"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Subtasks */}
                  <div className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-xl p-4 border border-purple-500/10">
                    <label className="block text-[10px] font-bold text-purple-400 uppercase mb-3 tracking-wider flex items-center gap-2">
                      <ListChecks size={14} /> Subtarefas
                    </label>
                    <div className="space-y-2 mb-4">
                      {formData.subtasks.map((subtask, index) => (
                        <div key={subtask.id} className="flex items-center gap-3 group p-2 hover:bg-white/[0.03] rounded-lg transition-colors">
                          <button
                            type="button"
                            onClick={() => {
                              const newSubtasks = [...formData.subtasks];
                              newSubtasks[index].completed = !newSubtasks[index].completed;
                              setFormData({ ...formData, subtasks: newSubtasks });
                            }}
                            className="flex-shrink-0 text-onyx-500 hover:text-white transition-colors"
                          >
                            {subtask.completed ? (
                              <CheckSquare size={18} className="text-purple-400" />
                            ) : (
                              <Square size={18} />
                            )}
                          </button>
                          <span className={`flex-1 text-sm font-medium ${subtask.completed ? 'text-onyx-600 line-through' : 'text-onyx-200'}`}>
                            {subtask.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, subtasks: formData.subtasks.filter((_, i) => i !== index) });
                            }}
                            className="text-onyx-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* Input Nova Subtarefa */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nova subtarefa..."
                        className="flex-1 premium-input rounded-lg px-3 py-2 text-sm text-white"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            e.preventDefault();
                            const title = e.currentTarget.value.trim();
                            setFormData({
                              ...formData,
                              subtasks: [...formData.subtasks, { id: `st-${Date.now()}`, title, completed: false }]
                            });
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Playbooks Section (Integrated with Supabase) */}
                  <div className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-xl p-4 border border-blue-500/10 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                        <LayoutGrid size={14} /> Playbooks & Recursos
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAddPlaybook(!showAddPlaybook)}
                        className="text-xs text-blue-400 hover:text-white flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded transition-colors"
                      >
                        <Plus size={12} /> Adicionar
                      </button>
                    </div>

                    {/* Loading State */}
                    {loadingPlaybooks && (
                      <div className="text-center py-4 text-onyx-500 text-xs">Carregando recursos...</div>
                    )}

                    {/* Empty State */}
                    {!loadingPlaybooks && playbooks.length === 0 && !showAddPlaybook && (
                      <div className="text-center py-4 border border-dashed border-white/[0.1] rounded-lg bg-white/[0.02]">
                        <p className="text-xs text-onyx-500">Nenhum playbook anexado.</p>
                        <button
                          type="button"
                          onClick={() => setShowAddPlaybook(true)}
                          className="text-xs text-blue-400 mt-1 hover:underline"
                        >
                          Adicionar manual ou vídeo
                        </button>
                      </div>
                    )}

                    {/* List */}
                    <div className="space-y-2">
                      <PlaybookList
                        playbooks={playbooks}
                        maxVisible={5}
                        onOpen={(pb) => window.open(pb.url, '_blank')}
                      />
                    </div>

                    {/* Add Form */}
                    {showAddPlaybook && (
                      <div className="mt-3 p-3 bg-white/[0.03] rounded-lg border border-white/[0.05] animate-scale-in">
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] text-onyx-500 block mb-1">Título</label>
                            <input
                              autoFocus
                              type="text"
                              className="w-full bg-onyx-900 border border-white/[0.1] rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 transition-colors"
                              placeholder="Ex: Tutorial de Vendas"
                              value={newPlaybook.title}
                              onChange={e => setNewPlaybook({ ...newPlaybook, title: e.target.value })}
                            />
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="text-[10px] text-onyx-500 block mb-1">URL</label>
                              <input
                                type="text"
                                className="w-full bg-onyx-900 border border-white/[0.1] rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 transition-colors"
                                placeholder="https://..."
                                value={newPlaybook.url}
                                onChange={e => setNewPlaybook({ ...newPlaybook, url: e.target.value })}
                              />
                            </div>
                            <div className="w-24">
                              <label className="text-[10px] text-onyx-500 block mb-1">Tipo</label>
                              <select
                                className="w-full bg-onyx-900 border border-white/[0.1] rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 outline-none"
                                value={newPlaybook.type}
                                onChange={e => setNewPlaybook({ ...newPlaybook, type: e.target.value as any })}
                              >
                                <option value="VIDEO">Vídeo</option>
                                <option value="DOCUMENT">Doc</option>
                                <option value="LINK">Link</option>
                                <option value="CHECKLIST">Checklist</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setShowAddPlaybook(false)}
                              className="text-xs text-onyx-400 hover:text-white px-3 py-1.5"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={handleAddPlaybook}
                              disabled={!newPlaybook.title || !newPlaybook.url}
                              className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Priority and Status */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Prioridade</label>
                      <select
                        value={formData.priority}
                        onChange={e => setFormData({ ...formData, priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' })}
                        className="w-full premium-input rounded-xl px-4 py-3 text-white"
                      >
                        <option value="LOW">Baixa</option>
                        <option value="MEDIUM">Média</option>
                        <option value="HIGH">Alta</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Status Atual</label>
                      <select
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                        className="w-full premium-input rounded-xl px-4 py-3 text-white"
                      >
                        <option value={TaskStatus.TODO}>A Fazer</option>
                        <option value={TaskStatus.IN_PROGRESS}>Em Progresso</option>
                        <option value={TaskStatus.REVIEW}>Revisão</option>
                        <option value={TaskStatus.DONE}>Concluído</option>
                      </select>
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/[0.04] bg-white/[0.02] flex justify-between items-center">
                {editingTask ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={14} />
                    Excluir Tarefa
                  </button>
                ) : <div></div>}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl font-bold text-onyx-400 hover:text-white transition-colors text-sm hover:bg-white/[0.05]"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="premium-btn px-8 py-2.5 rounded-xl font-bold text-black text-sm shadow-glow hover:shadow-glow-blue transition-all"
                  >
                    {editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
                  </button>
                </div>
              </div>

            </div >
          </div >
        )
      }
    </div >
  );
};