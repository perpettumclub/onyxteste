import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { MoreHorizontal, Plus, MessageSquare, Calendar, ChevronLeft, ChevronRight, UserCircle, Edit2, X } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, setTasks }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<TaskStatus | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee: '',
    dueDate: '',
    status: TaskStatus.TODO
  });

  const columns = [
    { id: TaskStatus.TODO, label: 'A Fazer', color: 'bg-onyx-800' },
    { id: TaskStatus.IN_PROGRESS, label: 'Em Progresso', color: 'bg-onyx-600' },
    { id: TaskStatus.REVIEW, label: 'Revisão', color: 'bg-onyx-500' },
    { id: TaskStatus.DONE, label: 'Concluído', color: 'bg-white' },
  ];

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
        status: task.status
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        assignee: '',
        dueDate: new Date().toISOString().split('T')[0],
        status: TaskStatus.TODO
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...formData } : t));
    } else {
      const newTask: Task = {
        id: `t-${Date.now()}`,
        ...formData,
        comments: []
      };
      setTasks(prev => [...prev, newTask]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-onyx-900 text-[10px] font-bold text-onyx-400 border border-onyx-800 uppercase tracking-wider">CRM</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Pipeline de Entregas</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full hover:bg-onyx-200 transition-colors text-xs font-bold shadow-lg shadow-white/5"
          >
            <Plus size={14} />
            Nova Tarefa
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-[1000px] h-full">
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div
                key={col.id}
                className={`flex-1 flex flex-col min-w-[280px] transition-all ${draggedOverColumn === col.id ? 'bg-onyx-900/30 ring-2 ring-onyx-600 rounded-2xl' : ''
                  }`}
                onDragOver={handleDragOver}
                onDragEnter={() => handleDragEnter(col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className="mb-4 flex justify-between items-center px-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${col.color}`}></div>
                    <span className="font-bold text-white text-sm tracking-wide">{col.label}</span>
                    <span className="text-onyx-600 text-xs font-mono">{colTasks.length}</span>
                  </div>
                  <button onClick={() => openModal()} className="text-onyx-600 hover:text-white transition-colors">
                    <Plus size={14} />
                  </button>
                </div>

                <div className="flex-1 space-y-3">
                  {colTasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => openModal(task)}
                      className={`bg-onyx-950 border border-onyx-800 p-5 rounded-2xl hover:border-onyx-600 transition-all group relative hover:shadow-xl hover:shadow-black/50 hover:-translate-y-1 duration-300 cursor-grab active:cursor-grabbing ${draggedTask === task.id ? 'opacity-50 scale-95' : ''
                        }`}
                    >
                      <div className="absolute top-4 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-onyx-950 rounded-lg border border-onyx-800 p-0.5 shadow-xl z-10">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveTask(task.id, 'prev'); }}
                          disabled={task.status === TaskStatus.TODO}
                          className="p-1 hover:bg-onyx-800 rounded disabled:opacity-30 text-onyx-400 transition-colors"
                        >
                          <ChevronLeft size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveTask(task.id, 'next'); }}
                          disabled={task.status === TaskStatus.DONE}
                          className="p-1 hover:bg-onyx-800 rounded disabled:opacity-30 text-onyx-400 transition-colors"
                        >
                          <ChevronRight size={12} />
                        </button>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-start justify-between">
                          <span className="text-[10px] font-bold text-onyx-500 mb-1 block">#{task.id}</span>
                        </div>
                        <h4 className="text-sm font-bold text-onyx-100 leading-snug">{task.title}</h4>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-onyx-900">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-onyx-800 border border-onyx-700 flex items-center justify-center text-[8px] text-white font-bold">
                            {task.assignee ? task.assignee.substring(0, 2).toUpperCase() : '?'}
                          </div>
                          <span className="text-[10px] text-onyx-500 truncate max-w-[80px]">{task.assignee ? task.assignee.split(' ')[0] : 'Unassigned'}</span>
                        </div>

                        <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md border ${new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE
                          ? 'text-red-400 border-red-900/30 bg-red-900/10'
                          : 'text-onyx-400 border-onyx-900 bg-black'
                          }`}>
                          <Calendar size={10} />
                          {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))}

                  <button onClick={() => openModal()} className="w-full py-3 rounded-2xl border border-dashed border-onyx-800 text-onyx-600 hover:text-onyx-400 hover:border-onyx-700 text-xs font-medium transition-all flex items-center justify-center gap-2 group">
                    <Plus size={14} className="group-hover:scale-110 transition-transform" />
                    Adicionar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[#0a0a0a] border border-onyx-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-onyx-500 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-onyx-500 uppercase mb-1">Título</label>
                <input
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-onyx-900 border border-onyx-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white"
                  placeholder="Ex: Definir Estratégia"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-onyx-500 uppercase mb-1">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-onyx-900 border border-onyx-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white h-24 resize-none"
                  placeholder="Detalhes da tarefa..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-onyx-500 uppercase mb-1">Responsável</label>
                  <input
                    value={formData.assignee}
                    onChange={e => setFormData({ ...formData, assignee: e.target.value })}
                    className="w-full bg-onyx-900 border border-onyx-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white"
                    placeholder="Ex: Carlos"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-onyx-500 uppercase mb-1">Prazo</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full bg-onyx-900 border border-onyx-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-onyx-500 uppercase mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                  className="w-full bg-onyx-900 border border-onyx-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white"
                >
                  <option value={TaskStatus.TODO}>A Fazer</option>
                  <option value={TaskStatus.IN_PROGRESS}>Em Progresso</option>
                  <option value={TaskStatus.REVIEW}>Revisão</option>
                  <option value={TaskStatus.DONE}>Concluído</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-full font-bold text-onyx-400 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" className="bg-white text-black px-6 py-2.5 rounded-full font-bold hover:bg-onyx-200 transition-colors">{editingTask ? 'Salvar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};