import React, { useState } from 'react';
import { Module, Lesson, UserRole } from '../types';
import { PlayCircle, FileText, CheckCircle, Search, Clock, ArrowRight, Play, BookOpen, Plus, MoreVertical, Edit2, X, Settings, Trash2, Video, Upload, Folder } from 'lucide-react';

interface MemberAreaProps {
   modules: Module[];
   setModules: React.Dispatch<React.SetStateAction<Module[]>>;
   userRole: UserRole;
}

export const MemberArea: React.FC<MemberAreaProps> = ({ modules, setModules, userRole }) => {
   const [view, setView] = useState<'GRID' | 'PLAYER'>('GRID');
   const [activeModule, setActiveModule] = useState<Module>(modules[0]);
   const [activeLesson, setActiveLesson] = useState<Lesson>(modules[0].lessons[0]);
   const [searchQuery, setSearchQuery] = useState('');
   const [showModuleMenu, setShowModuleMenu] = useState<string | null>(null);
   const [editingModule, setEditingModule] = useState<Module | null>(null);
   const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
   const [deletingModule, setDeletingModule] = useState<Module | null>(null);
   const [isContentManagerOpen, setIsContentManagerOpen] = useState(false);
   const [managerTab, setManagerTab] = useState<'MODULES' | 'LESSONS' | 'FILES'>('MODULES');
   const [selectedModuleForLessons, setSelectedModuleForLessons] = useState<string>(modules[0]?.id || '');

   const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

   const handleModuleClick = (module: Module) => {
      setActiveModule(module);
      setActiveLesson(module.lessons[0]);
      setView('PLAYER');
   };

   const handleAddModule = () => {
      // Simplified creation for demo
      const newModule: Module = {
         id: `m-${Date.now()}`,
         title: 'Novo Módulo',
         description: 'Descrição do novo módulo',
         lessons: []
      };
      setModules([...modules, newModule]);
   };

   const handleAddLesson = () => {
      const newLesson: Lesson = {
         id: `l-${Date.now()}`,
         title: 'Nova Aula',
         duration: '00:00',
         type: 'VIDEO',
         isCompleted: false
      };
      const updatedModule = { ...activeModule, lessons: [...activeModule.lessons, newLesson] };
      setModules(modules.map(m => m.id === activeModule.id ? updatedModule : m));
      setActiveModule(updatedModule);
   };

   const toggleLessonComplete = () => {
      const updatedLesson = { ...activeLesson, isCompleted: !activeLesson.isCompleted };
      const updatedModule = {
         ...activeModule,
         lessons: activeModule.lessons.map(l => l.id === activeLesson.id ? updatedLesson : l)
      };
      setModules(modules.map(m => m.id === activeModule.id ? updatedModule : m));
      setActiveModule(updatedModule);
      setActiveLesson(updatedLesson);
   };

   const updateModule = (updatedModule: Module) => {
      setModules(modules.map(m => m.id === updatedModule.id ? updatedModule : m));
      if (activeModule.id === updatedModule.id) {
         setActiveModule(updatedModule);
      }
      setEditingModule(null);
   };

   const deleteModule = (moduleId: string) => {
      setModules(modules.filter(m => m.id !== moduleId));
      setDeletingModule(null);
      if (activeModule.id === moduleId) {
         setView('GRID');
      }
   };

   const updateLesson = (updatedLesson: Lesson) => {
      const updatedModule = {
         ...activeModule,
         lessons: activeModule.lessons.map(l => l.id === updatedLesson.id ? updatedLesson : l)
      };
      setModules(modules.map(m => m.id === activeModule.id ? updatedModule : m));
      setActiveModule(updatedModule);
      if (activeLesson.id === updatedLesson.id) {
         setActiveLesson(updatedLesson);
      }
      setEditingLesson(null);
   };

   const deleteLesson = (lessonId: string) => {
      const updatedModule = {
         ...activeModule,
         lessons: activeModule.lessons.filter(l => l.id !== lessonId)
      };
      setModules(modules.map(m => m.id === activeModule.id ? updatedModule : m));
      setActiveModule(updatedModule);
      if (activeLesson.id === lessonId && updatedModule.lessons.length > 0) {
         setActiveLesson(updatedModule.lessons[0]);
      }
   };

   const filteredModules = modules.filter(module =>
      module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase())
   );

   if (view === 'GRID') {
      return (
         <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10 pb-16">

            {/* Hero Section */}
            <div className="relative w-full h-80 rounded-3xl overflow-hidden border border-onyx-800 group cursor-pointer" onClick={() => handleModuleClick(modules[0])}>
               <div className="absolute inset-0 bg-gradient-to-r from-black via-onyx-900/80 to-transparent z-10"></div>
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-40 group-hover:scale-105 transition-transform duration-700"></div>

               <div className="absolute bottom-0 left-0 p-10 z-20 max-w-2xl">
                  <div className="flex items-center gap-3 mb-4">
                     <span className="bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Continuar Assistindo</span>
                     <div className="flex items-center gap-1 text-onyx-300 text-xs">
                        <Clock size={12} />
                        <span>Restam 12 min</span>
                     </div>
                  </div>
                  <h1 className="text-4xl font-bold text-white mb-2 leading-tight">Boas-vindas ao Ecossistema Onyx</h1>
                  <p className="text-onyx-300 text-sm mb-6 line-clamp-2">Comece por aqui para entender como nossa parceria funciona e quais são os próximos passos para o lançamento.</p>

                  <button className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full font-bold text-sm hover:bg-onyx-200 transition-colors">
                     <Play size={16} fill="currentColor" />
                     Assistir Agora
                  </button>
                  {isAdmin && (
                     <button
                        onClick={(e) => { e.stopPropagation(); setIsContentManagerOpen(true); }}
                        className="flex items-center gap-3 bg-onyx-900/80 backdrop-blur-md text-white border border-onyx-700 px-6 py-3 rounded-full font-bold text-sm hover:bg-onyx-800 transition-colors ml-4"
                     >
                        <Settings size={16} />
                        Gerenciar Conteúdo
                     </button>
                  )}
               </div>
            </div>

            {/* Course Grid */}
            <div>
               <div className="flex justify-between items-end mb-6">
                  <div>
                     <h2 className="text-2xl font-bold text-white">Seus Módulos</h2>
                     <p className="text-onyx-500 text-sm mt-1">Trilhas de conhecimento disponíveis.</p>
                  </div>

                  <div className="flex items-center gap-4">
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-onyx-500 w-4 h-4" />
                        <input
                           type="text"
                           placeholder="Filtrar..."
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           className="bg-onyx-950 border border-onyx-800 rounded-full py-2 pl-9 pr-4 text-sm text-onyx-200 focus:outline-none focus:border-onyx-600 w-48 transition-all focus:w-64"
                        />
                     </div>
                     {isAdmin && (
                        <button onClick={handleAddModule} className="bg-white text-black p-2 rounded-full hover:bg-onyx-200 transition-colors" title="Adicionar Módulo">
                           <Plus size={20} />
                        </button>
                     )}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredModules.length === 0 ? (
                     <div className="col-span-full text-center py-12">
                        <p className="text-onyx-500 text-sm">Nenhum módulo encontrado para "{searchQuery}"</p>
                     </div>
                  ) : (
                     filteredModules.map((module) => (
                        <div
                           key={module.id}
                           onClick={() => handleModuleClick(module)}
                           className="group bg-onyx-950 rounded-2xl border border-onyx-800 overflow-hidden hover:border-onyx-600 transition-all cursor-pointer hover:-translate-y-1 duration-300 relative"
                        >
                           <div className="aspect-[4/3] bg-onyx-900 relative overflow-hidden">
                              <div className="absolute inset-0 opacity-50 transition-opacity group-hover:opacity-70" style={{ background: module.image || '#262626' }}></div>
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                 <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                                    <Play size={20} className="text-white ml-1" fill="currentColor" />
                                 </div>
                              </div>
                              <div className="absolute bottom-0 left-0 w-full h-1 bg-onyx-800">
                                 <div className="h-full bg-white w-1/3"></div>
                              </div>
                           </div>
                           <div className="p-5">
                              <div className="flex justify-between items-start">
                                 <div className="text-[10px] font-bold text-onyx-500 uppercase tracking-wider mb-1">{module.lessons.length} Aulas</div>
                                 {isAdmin && (
                                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                                       <button
                                          onClick={() => setShowModuleMenu(showModuleMenu === module.id ? null : module.id)}
                                          className="p-1 hover:bg-onyx-800 rounded-full text-onyx-600 hover:text-white transition-colors"
                                       >
                                          <MoreVertical size={14} />
                                       </button>

                                       {showModuleMenu === module.id && (
                                          <div className="absolute right-0 top-6 w-32 bg-onyx-900 border border-onyx-800 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                             <button
                                                onClick={() => { setEditingModule(module); setShowModuleMenu(null); }}
                                                className="w-full text-left px-3 py-2 text-xs font-bold text-onyx-300 hover:bg-onyx-800 hover:text-white flex items-center gap-2"
                                             >
                                                <Edit2 size={12} /> Editar
                                             </button>
                                             <button
                                                onClick={() => { setDeletingModule(module); setShowModuleMenu(null); }}
                                                className="w-full text-left px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-900/20 flex items-center gap-2"
                                             >
                                                <X size={12} /> Excluir
                                             </button>
                                          </div>
                                       )}
                                    </div>
                                 )}
                              </div>
                              <h3 className="text-lg font-bold text-white mb-2 leading-snug group-hover:text-onyx-200">{module.title}</h3>
                              <p className="text-xs text-onyx-500 line-clamp-2">{module.description}</p>
                           </div>
                        </div>
                     ))
                  )}

                  {/* "Coming Soon" placeholder */}
                  <div className="bg-black rounded-2xl border border-dashed border-onyx-800 flex flex-col items-center justify-center p-6 opacity-50 hover:opacity-100 transition-opacity">
                     <div className="w-12 h-12 rounded-full bg-onyx-900 flex items-center justify-center mb-3">
                        <BookOpen size={20} className="text-onyx-500" />
                     </div>
                     <span className="text-sm font-bold text-onyx-400">Em breve</span>
                  </div>
               </div>
            </div>
            {/* Edit Module Modal */}
            {editingModule && (
               <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditingModule(null)}></div>
                  <div className="relative bg-[#0a0a0a] border border-onyx-800 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">Editar Módulo</h2>
                        <button onClick={() => setEditingModule(null)} className="text-onyx-500 hover:text-white"><X size={20} /></button>
                     </div>
                     <div className="space-y-4">
                        <div>
                           <label className="block text-xs font-bold text-onyx-500 uppercase mb-1">Título</label>
                           <input
                              type="text"
                              value={editingModule.title}
                              onChange={e => setEditingModule({ ...editingModule, title: e.target.value })}
                              className="w-full bg-onyx-900 border border-onyx-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white"
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-onyx-500 uppercase mb-1">Descrição</label>
                           <textarea
                              value={editingModule.description}
                              onChange={e => setEditingModule({ ...editingModule, description: e.target.value })}
                              className="w-full bg-onyx-900 border border-onyx-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white h-24 resize-none"
                           />
                        </div>
                        <button
                           onClick={() => updateModule(editingModule)}
                           className="w-full bg-white text-black font-bold py-3 rounded-full hover:bg-onyx-200 transition-colors"
                        >
                           Salvar Alterações
                        </button>
                     </div>
                  </div>
               </div>
            )}

            {/* Delete Module Confirmation Modal */}
            {deletingModule && (
               <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeletingModule(null)}></div>
                  <div className="relative bg-[#0a0a0a] border border-onyx-800 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">Excluir Módulo</h2>
                        <button onClick={() => setDeletingModule(null)} className="text-onyx-500 hover:text-white"><X size={20} /></button>
                     </div>
                     <p className="text-onyx-300 mb-6">
                        Tem certeza que deseja excluir o módulo <span className="text-white font-bold">"{deletingModule.title}"</span>?
                        Esta ação não pode ser desfeita e todas as aulas serão perdidas.
                     </p>
                     <div className="flex gap-3">
                        <button
                           onClick={() => setDeletingModule(null)}
                           className="flex-1 bg-onyx-900 text-white font-bold py-3 rounded-full hover:bg-onyx-800 transition-colors"
                        >
                           Cancelar
                        </button>
                        <button
                           onClick={() => deleteModule(deletingModule.id)}
                           className="flex-1 bg-red-600 text-white font-bold py-3 rounded-full hover:bg-red-500 transition-colors"
                        >
                           Excluir
                        </button>
                     </div>
                  </div>
               </div>
            )}
         </div>
      );
   }

   // PLAYER VIEW
   return (
      <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-300 pb-16">
         <button onClick={() => setView('GRID')} className="flex items-center gap-2 text-onyx-500 hover:text-white mb-4 transition-colors w-fit">
            <ArrowRight className="rotate-180" size={16} />
            <span className="text-xs font-bold uppercase tracking-wide">Voltar aos Módulos</span>
         </button>

         <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
            {/* Main Content Player */}
            <div className="flex-1 bg-black rounded-3xl border border-onyx-800 overflow-hidden flex flex-col shadow-2xl">
               <div className="aspect-video bg-onyx-900 relative flex items-center justify-center group">
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                  {activeLesson.type === 'VIDEO' ? (
                     <>
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492619882492-482d73319400?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
                        <PlayCircle size={80} className="text-white/90 drop-shadow-2xl z-10 cursor-pointer hover:scale-110 transition-transform duration-300" />
                     </>
                  ) : (
                     <div className="flex flex-col items-center text-onyx-400 z-10">
                        <FileText size={48} className="mb-4" />
                        <span className="text-sm font-medium border border-onyx-700 px-3 py-1 rounded-full bg-black/50 backdrop-blur">Documento de Leitura</span>
                     </div>
                  )}
               </div>

               <div className="p-8 overflow-y-auto">
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <div className="flex items-center gap-2 mb-2">
                           <span className="text-[10px] font-bold bg-onyx-900 text-onyx-300 px-2 py-0.5 rounded border border-onyx-800 uppercase">{activeLesson.type}</span>
                           {activeLesson.isCompleted && <span className="text-[10px] font-bold text-green-500 flex items-center gap-1"><CheckCircle size={10} /> Concluído</span>}
                           <span className="text-[10px] text-onyx-600 font-mono">{activeLesson.duration}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">{activeLesson.title}</h2>
                        <button
                           onClick={toggleLessonComplete}
                           className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${activeLesson.isCompleted
                              ? 'bg-onyx-900 text-onyx-400 border border-onyx-800 hover:bg-onyx-800'
                              : 'bg-green-600 text-white hover:bg-green-500'
                              }`}
                        >
                           <CheckCircle size={16} />
                           {activeLesson.isCompleted ? 'Marcar como Incompleta' : 'Marcar como Concluída'}
                        </button>
                        <p className="text-onyx-500 text-sm mt-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                     </div>
                  </div>

                  <div className="prose prose-invert prose-sm max-w-none text-onyx-400">
                     <p>Conteúdo da aula...</p>
                  </div>
               </div>
            </div>

            {/* Sidebar / Playlist */}
            <div className="w-full lg:w-80 bg-black rounded-3xl border border-onyx-800 flex flex-col overflow-hidden">
               <div className="p-5 border-b border-onyx-800 bg-onyx-950">
                  <div className="flex justify-between items-center mb-3">
                     <div>
                        <h3 className="text-sm font-bold text-white mb-1">Conteúdo do Módulo</h3>
                        <p className="text-xs text-onyx-500">{activeModule.title}</p>
                     </div>
                     {isAdmin && (
                        <button onClick={handleAddLesson} className="p-1 hover:bg-onyx-800 rounded text-onyx-400 hover:text-white" title="Adicionar Aula">
                           <Plus size={16} />
                        </button>
                     )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                     <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-bold text-onyx-500 uppercase tracking-wider">Progresso</span>
                        <span className="text-[10px] font-bold text-white">
                           {activeModule.lessons.filter(l => l.isCompleted).length}/{activeModule.lessons.length}
                        </span>
                     </div>
                     <div className="w-full bg-onyx-900 h-1.5 rounded-full overflow-hidden border border-onyx-800">
                        <div
                           className="bg-white h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                           style={{
                              width: `${activeModule.lessons.length > 0 ? (activeModule.lessons.filter(l => l.isCompleted).length / activeModule.lessons.length) * 100 : 0}%`
                           }}
                        ></div>
                     </div>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {activeModule.lessons.map((lesson, idx) => (
                     <button
                        key={lesson.id}
                        onClick={() => setActiveLesson(lesson)}
                        className={`w-full flex items-start gap-3 p-3 text-left transition-all rounded-xl ${activeLesson.id === lesson.id
                           ? 'bg-onyx-900 border border-onyx-800 shadow-inner'
                           : 'hover:bg-onyx-900/50 border border-transparent'
                           }`}
                     >
                        <div className="mt-0.5 text-xs font-mono text-onyx-600 w-5">{String(idx + 1).padStart(2, '0')}</div>
                        <div className="flex-1 min-w-0">
                           <p className={`text-xs font-bold mb-1 ${activeLesson.id === lesson.id ? 'text-white' : 'text-onyx-400'}`}>
                              {lesson.title}
                           </p>
                           <div className="flex items-center gap-2">
                              <span className="text-[10px] text-onyx-600 bg-onyx-950 px-1.5 py-0.5 rounded border border-onyx-900">{lesson.duration}</span>
                              {lesson.isCompleted && <CheckCircle size={10} className="text-onyx-700" />}
                           </div>
                        </div>
                     </button>
                  ))}
               </div>
            </div>
         </div>
      </div>
   );
};