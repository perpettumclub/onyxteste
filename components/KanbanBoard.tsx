import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, TaskLabel, ChecklistItem, Subtask } from '../types';
import { MoreHorizontal, Plus, MessageSquare, Calendar, ChevronLeft, ChevronRight, UserCircle, Edit2, X, Trash2, Tag, AlertTriangle, Filter, CheckSquare, Square, ListChecks, LayoutGrid, List, CalendarDays } from 'lucide-react';
import { supabase } from '../services/supabase';

// View modes
type ViewMode = 'board' | 'list' | 'calendar';

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
    newChecklistItem: '',
    newSubtaskTitle: ''
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
        newChecklistItem: '',
        newSubtaskTitle: ''
      });
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
        newChecklistItem: '',
        newSubtaskTitle: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taskLabels = AVAILABLE_LABELS.filter(l => formData.labels.includes(l.id));

    if (editingTask) {
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
        subtasks: formData.subtasks
      } : t));
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
        comments: []
      };
      setTasks(prev => [...prev, newTask]);
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
    <div className="h-full flex flex-col animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="premium-badge px-2.5 py-1 rounded-full text-[10px] font-bold text-onyx-400 uppercase tracking-widest">CRM & Pipeline</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Gestão de Tarefas</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* View Switcher */}
          <div className="flex items-center bg-white/[0.03] rounded-xl p-1 border border-white/[0.05]">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'list'
                ? 'bg-white text-black shadow-glow'
                : 'text-onyx-400 hover:text-white hover:bg-white/[0.05]'
                }`}
            >
              <List size={14} />
              <span className="hidden sm:inline">Lista</span>
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'board'
                ? 'bg-white text-black shadow-glow'
                : 'text-onyx-400 hover:text-white hover:bg-white/[0.05]'
                }`}
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">Quadro</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'calendar'
                ? 'bg-white text-black shadow-glow'
                : 'text-onyx-400 hover:text-white hover:bg-white/[0.05]'
                }`}
            >
              <CalendarDays size={14} />
              <span className="hidden sm:inline">Calendário</span>
            </button>
          </div>
          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-xs font-bold border ${hasActiveFilters
                ? 'bg-white text-black border-white shadow-glow'
                : 'bg-white/[0.05] text-onyx-400 border-white/[0.05] hover:text-white hover:bg-white/[0.1]'}`}
            >
              <Filter size={14} />
              Filtros
              {hasActiveFilters && <span className="w-1.5 h-1.5 bg-black rounded-full"></span>}
            </button>

            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
                <div className="absolute top-full right-0 mt-3 w-72 premium-card rounded-xl shadow-premium-xl z-20 p-5 space-y-5 animate-in fade-in zoom-in-95 duration-200">
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
                  <div className="flex items-center gap-3 pt-2">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${filterOverdue ? 'bg-white border-white' : 'bg-transparent border-onyx-600'}`} onClick={() => setFilterOverdue(!filterOverdue)}>
                      {filterOverdue && <CheckSquare size={12} className="text-black" />}
                    </div>
                    <label className="text-sm text-onyx-400 cursor-pointer select-none" onClick={() => setFilterOverdue(!filterOverdue)}>Apenas atrasados</label>
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={() => { setFilterLabel(null); setFilterAssignee(''); setFilterOverdue(false); }}
                      className="w-full text-xs text-white hover:text-white/80 py-2.5 bg-white/[0.05] rounded-lg font-bold transition-colors"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => openModal()}
            className="premium-btn flex items-center gap-2 text-black px-5 py-2.5 rounded-xl text-xs font-bold shadow-glow hover:shadow-glow-blue transition-all"
          >
            <Plus size={14} />
            Nova Tarefa
          </button>
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
                              className="flex-1 bg-transparent text-sm text-white placeholder-onyx-600 focus:outline-none"
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
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="premium-card rounded-2xl p-6 border border-white/[0.04]">
            <div className="text-center py-12">
              <CalendarDays size={48} className="mx-auto text-onyx-600 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Visualização de Calendário</h3>
              <p className="text-sm text-onyx-500">Em breve! Esta funcionalidade está em desenvolvimento.</p>
            </div>
          </div>
        </div>
      )}

      {/* BOARD VIEW (Original Kanban) */}
      {viewMode === 'board' && (
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
                    className="w-full bg-transparent text-white text-sm font-bold placeholder-onyx-600 focus:outline-none mb-3"
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
      )}

      {/* Task Modal */}
      {isModalOpen && (
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
                    className="w-full premium-input rounded-xl px-4 py-3 text-white placeholder-onyx-600 font-medium text-lg"
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
                        className="w-full premium-input rounded-xl pl-10 pr-4 py-3 text-white placeholder-onyx-600"
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
                        className="w-full premium-input rounded-xl pl-10 pr-4 py-3 text-white placeholder-onyx-600 [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Descrição Detalhada</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full premium-input rounded-xl px-4 py-3 text-white placeholder-onyx-600 min-h-[120px] resize-none leading-relaxed"
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
                      className="flex-1 premium-input rounded-lg px-3 py-2 text-sm text-white placeholder-onyx-600"
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
                    {formData.subtasks.length === 0 && (
                      <p className="text-xs text-onyx-600 italic px-2">Nenhuma subtarefa adicionada.</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.newSubtaskTitle}
                      onChange={e => setFormData({ ...formData, newSubtaskTitle: e.target.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && formData.newSubtaskTitle.trim()) {
                          e.preventDefault();
                          setFormData({
                            ...formData,
                            subtasks: [...formData.subtasks, { id: `st-${Date.now()}`, title: formData.newSubtaskTitle.trim(), completed: false }],
                            newSubtaskTitle: ''
                          });
                        }
                      }}
                      placeholder="Adicionar subtarefa..."
                      className="flex-1 premium-input rounded-lg px-3 py-2 text-sm text-white placeholder-onyx-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.newSubtaskTitle.trim()) {
                          setFormData({
                            ...formData,
                            subtasks: [...formData.subtasks, { id: `st-${Date.now()}`, title: formData.newSubtaskTitle.trim(), completed: false }],
                            newSubtaskTitle: ''
                          });
                        }
                      }}
                      className="px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 text-sm border border-purple-500/20"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
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

          </div>
        </div>
      )}
    </div>
  );
};