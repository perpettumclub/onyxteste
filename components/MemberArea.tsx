import React, { useState } from 'react';
import { Module, Lesson, UserRole } from '../types';
import { PlayCircle, FileText, CheckCircle, Search, Clock, ArrowRight, Play, BookOpen, Plus, MoreVertical, Edit2, X, Settings, Trash2, Video, Upload, Folder, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';
import { ContentManager } from './ContentManager';
import { VideoPlayer } from './VideoPlayer';
import { LessonMaterials } from './LessonMaterials';
import { supabase } from '../services/supabase';

interface MemberAreaProps {
   modules: Module[];
   setModules: React.Dispatch<React.SetStateAction<Module[]>>;
   userRole: UserRole;
   tenantId: string | null;
   onRefresh?: () => void;
}

export const MemberArea: React.FC<MemberAreaProps> = ({ modules, setModules, userRole, tenantId, onRefresh }) => {
   const [view, setView] = useState<'GRID' | 'PLAYER'>('GRID');
   const [activeModule, setActiveModule] = useState<Module | null>(modules.length > 0 ? modules[0] : null);
   const [activeLesson, setActiveLesson] = useState<Lesson | null>(
      modules.length > 0 && modules[0].lessons.length > 0 ? modules[0].lessons[0] : null
   );
   const [searchQuery, setSearchQuery] = useState('');
   const [showModuleMenu, setShowModuleMenu] = useState<string | null>(null);
   const [editingModule, setEditingModule] = useState<Module | null>(null);
   const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
   const [deletingModule, setDeletingModule] = useState<Module | null>(null);
   const [isContentManagerOpen, setIsContentManagerOpen] = useState(false);
   const [managerTab, setManagerTab] = useState<'MODULES' | 'LESSONS' | 'FILES'>('MODULES');
   const [selectedModuleForLessons, setSelectedModuleForLessons] = useState<string>(modules[0]?.id || '');

   React.useEffect(() => {
      if (modules.length > 0) {
         // If no active module, set first one
         if (!activeModule) {
            setActiveModule(modules[0]);
            if (modules[0].lessons.length > 0) {
               setActiveLesson(modules[0].lessons[0]);
            }
         } else {
            // Sync activeModule with updated modules data
            const updatedModule = modules.find(m => m.id === activeModule.id);
            if (updatedModule) {
               setActiveModule(updatedModule);
               // Sync activeLesson with updated lesson data
               if (activeLesson) {
                  const updatedLesson = updatedModule.lessons.find(l => l.id === activeLesson.id);
                  if (updatedLesson) {
                     setActiveLesson(updatedLesson);
                  }
               }
            }
         }
      }
   }, [modules]);

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

   const toggleLessonComplete = async (lessonId?: string) => {
      const targetLesson = lessonId ? activeModule?.lessons.find(l => l.id === lessonId) : activeLesson;
      if (!targetLesson || !activeModule) return;

      const newStatus = !targetLesson.isCompleted;

      // Update locally first for responsiveness
      const updatedLesson = { ...targetLesson, isCompleted: newStatus };
      const updatedModule = {
         ...activeModule,
         lessons: activeModule.lessons.map(l => l.id === targetLesson.id ? updatedLesson : l)
      };
      setModules(modules.map(m => m.id === activeModule.id ? updatedModule : m));
      setActiveModule(updatedModule);
      if (activeLesson?.id === targetLesson.id) setActiveLesson(updatedLesson);

      // Save to DB
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
         await supabase.from('lesson_progress').upsert({
            user_id: user.id,
            lesson_id: targetLesson.id,
            is_completed: newStatus,
            updated_at: new Date().toISOString()
         }, { onConflict: 'user_id,lesson_id' });
      }
   };

   // Navigation helpers
   const getAllLessons = () => modules.flatMap(m => m.lessons.map(l => ({ ...l, moduleId: m.id, moduleTitle: m.title })));

   const currentLessonIndex = () => {
      const all = getAllLessons();
      return all.findIndex(l => l.id === activeLesson?.id);
   };

   const goToPreviousLesson = () => {
      const all = getAllLessons();
      const idx = currentLessonIndex();
      if (idx > 0) {
         const prev = all[idx - 1];
         const mod = modules.find(m => m.id === prev.moduleId);
         if (mod) {
            setActiveModule(mod);
            setActiveLesson(mod.lessons.find(l => l.id === prev.id) || null);
         }
      }
   };

   const goToNextLesson = () => {
      const all = getAllLessons();
      const idx = currentLessonIndex();
      if (idx < all.length - 1) {
         const next = all[idx + 1];
         const mod = modules.find(m => m.id === next.moduleId);
         if (mod) {
            setActiveModule(mod);
            setActiveLesson(mod.lessons.find(l => l.id === next.id) || null);
         }
      }
   };

   const handleLessonComplete = async () => {
      if (activeLesson && !activeLesson.isCompleted) {
         await toggleLessonComplete();
      }
      // Auto-advance to next lesson
      goToNextLesson();
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
         <>
            <div className="animate-fade-in-up space-y-10">

               {/* Hero Section */}
               <div className="relative w-full h-80 rounded-[2rem] overflow-hidden border border-white/[0.04] group cursor-pointer shadow-premium-lg" onClick={() => modules.length > 0 && handleModuleClick(modules[0])}>
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-onyx-900/80 to-transparent z-10"></div>
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-40 group-hover:scale-105 transition-transform duration-700"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>

                  <div className="absolute bottom-0 left-0 p-10 z-20 max-w-2xl">
                     <div className="flex items-center gap-3 mb-4">
                        <span className="bg-white text-black text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest shadow-glow">Continuar Assistindo</span>
                        <div className="flex items-center gap-1.5 text-onyx-300 text-xs font-medium bg-black/30 backdrop-blur px-2 py-1 rounded-full border border-white/10">
                           <Clock size={12} />
                           <span>Restam 12 min</span>
                        </div>
                     </div>
                     <h1 className="text-4xl font-bold text-white mb-3 leading-tight tracking-tight">Boas-vindas ao Ecossistema Onyx</h1>
                     <p className="text-onyx-300 text-sm mb-8 line-clamp-2 font-medium leading-relaxed max-w-lg">Comece por aqui para entender como nossa parceria funciona e quais são os próximos passos para o lançamento.</p>

                     <button className="premium-btn flex items-center gap-3 text-black px-8 py-3.5 rounded-full font-bold text-sm shadow-glow hover:shadow-glow-blue transition-all">
                        <Play size={16} fill="currentColor" />
                        Assistir Agora
                     </button>
                  </div>

                  {isAdmin && (
                     <div className="absolute top-6 right-6 z-30">
                        <button
                           onClick={(e) => { e.stopPropagation(); setIsContentManagerOpen(true); }}
                           className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all hover:scale-105 shadow-premium"
                           title="Gerenciar Conteúdo"
                        >
                           <Edit2 size={20} />
                        </button>
                     </div>
                  )}
               </div>

               {/* Course Grid */}
               <div>
                  <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                     <div>
                        <div className="flex items-center gap-2 mb-2">
                           <GraduationCap size={16} className="text-onyx-400" />
                           <span className="text-[10px] font-bold text-onyx-500 uppercase tracking-widest">Área de Membros</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Seus Módulos</h2>
                        <p className="text-onyx-400 text-sm mt-1">Trilhas de conhecimento disponíveis para você.</p>
                     </div>

                     <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-onyx-500 w-4 h-4" />
                           <input
                              type="text"
                              placeholder="Filtrar módulos..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full bg-white/[0.03] border border-white/[0.04] rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/[0.1] focus:bg-white/[0.05] transition-all"
                           />
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     {filteredModules.length === 0 ? (
                        <div className="col-span-full text-center py-16 bg-white/[0.02] rounded-3xl border border-dashed border-white/[0.05]">
                           <Search size={32} className="mx-auto text-onyx-700 mb-4" />
                           <p className="text-onyx-500 text-sm font-medium">Nenhum módulo encontrado para "{searchQuery}"</p>
                        </div>
                     ) : (
                        filteredModules.map((module, index) => (
                           <div
                              key={module.id}
                              onClick={() => handleModuleClick(module)}
                              className="group premium-card rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 duration-300 relative animate-fade-in"
                              style={{ animationDelay: `${index * 50}ms` }}
                           >
                              <div className="aspect-[4/3] bg-onyx-900 relative overflow-hidden">
                                 <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105" style={{ background: module.image || '#18181b' }}></div>
                                 <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300"></div>

                                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                    <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-glow hover:scale-110 transition-transform">
                                       <Play size={24} className="text-white ml-1" fill="currentColor" />
                                    </div>
                                 </div>

                                 {/* Progress Bar */}
                                 <div className="absolute bottom-0 left-0 w-full h-1 bg-white/[0.1]">
                                    <div
                                       className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                       style={{ width: `${module.lessons.length > 0 ? (module.lessons.filter(l => l.isCompleted).length / module.lessons.length) * 100 : 0}%` }}
                                    ></div>
                                 </div>
                              </div>

                              <div className="p-5">
                                 <div className="flex justify-between items-start mb-3">
                                    <div className="text-[9px] font-bold text-onyx-500 uppercase tracking-widest bg-white/[0.03] px-2 py-1 rounded border border-white/[0.05]">
                                       {module.lessons.length} Aulas
                                    </div>
                                    {isAdmin && (
                                       <div className="relative" onClick={(e) => e.stopPropagation()}>
                                          <button
                                             onClick={() => setShowModuleMenu(showModuleMenu === module.id ? null : module.id)}
                                             className="p-1 hover:bg-white/[0.1] rounded-lg text-onyx-500 hover:text-white transition-colors"
                                          >
                                             <MoreVertical size={16} />
                                          </button>

                                          {showModuleMenu === module.id && (
                                             <>
                                                <div className="fixed inset-0 z-10" onClick={() => setShowModuleMenu(null)}></div>
                                                <div className="absolute right-0 top-8 w-40 premium-card rounded-xl shadow-premium-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-1">
                                                   <button
                                                      onClick={() => { setEditingModule(module); setShowModuleMenu(null); }}
                                                      className="w-full text-left px-3 py-2.5 text-xs font-bold text-onyx-300 hover:bg-white/[0.05] hover:text-white flex items-center gap-2 rounded-lg transition-colors"
                                                   >
                                                      <Edit2 size={14} /> Editar
                                                   </button>
                                                   <button
                                                      onClick={() => { setDeletingModule(module); setShowModuleMenu(null); }}
                                                      className="w-full text-left px-3 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 flex items-center gap-2 rounded-lg transition-colors"
                                                   >
                                                      <Trash2 size={14} /> Excluir
                                                   </button>
                                                </div>
                                             </>
                                          )}
                                       </div>
                                    )}
                                 </div>
                                 <h3 className="text-lg font-bold text-white mb-2 leading-snug group-hover:text-white/90 transition-colors">{module.title}</h3>
                                 <p className="text-xs text-onyx-400 line-clamp-2 font-medium leading-relaxed">{module.description}</p>
                              </div>
                           </div>
                        ))
                     )}

                     {/* "Coming Soon" placeholder */}
                     <div className="bg-white/[0.01] rounded-2xl border border-dashed border-white/[0.05] flex flex-col items-center justify-center p-6 opacity-60 hover:opacity-100 transition-all hover:bg-white/[0.02] cursor-default group">
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                           <BookOpen size={24} className="text-onyx-600 group-hover:text-onyx-400" />
                        </div>
                        <span className="text-sm font-bold text-onyx-500 uppercase tracking-widest">Em breve</span>
                     </div>
                  </div>
               </div>

               {/* Edit Module Modal */}
               {
                  editingModule && (
                     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={() => setEditingModule(null)}></div>
                        <div className="relative premium-card w-full max-w-lg p-0 shadow-2xl animate-scale-in rounded-3xl overflow-hidden flex flex-col max-h-[85vh]">
                           <div className="p-6 border-b border-white/[0.04] bg-white/[0.02] flex justify-between items-center">
                              <h2 className="text-xl font-bold text-white tracking-tight">Editar Módulo</h2>
                              <button onClick={() => setEditingModule(null)} className="text-onyx-500 hover:text-white transition-colors"><X size={20} /></button>
                           </div>

                           <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
                              <div>
                                 <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Título</label>
                                 <input
                                    type="text"
                                    value={editingModule.title}
                                    onChange={e => setEditingModule({ ...editingModule, title: e.target.value })}
                                    className="w-full premium-input rounded-xl px-4 py-3 text-white focus:outline-none"
                                 />
                              </div>
                              <div>
                                 <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Descrição</label>
                                 <textarea
                                    value={editingModule.description}
                                    onChange={e => setEditingModule({ ...editingModule, description: e.target.value })}
                                    className="w-full premium-input rounded-xl px-4 py-3 text-white focus:outline-none h-32 resize-none leading-relaxed"
                                 />
                              </div>
                           </div>

                           <div className="p-6 border-t border-white/[0.04] bg-white/[0.02]">
                              <button
                                 onClick={() => updateModule(editingModule)}
                                 className="premium-btn w-full text-black font-bold py-3.5 rounded-xl shadow-glow hover:shadow-glow-blue transition-all"
                              >
                                 Salvar Alterações
                              </button>
                           </div>
                        </div>
                     </div>
                  )
               }

               {/* Delete Module Confirmation Modal */}
               {
                  deletingModule && (
                     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={() => setDeletingModule(null)}></div>
                        <div className="relative premium-card w-full max-w-md p-6 shadow-2xl animate-scale-in rounded-3xl">
                           <div className="flex justify-between items-center mb-6">
                              <h2 className="text-xl font-bold text-white tracking-tight">Excluir Módulo</h2>
                              <button onClick={() => setDeletingModule(null)} className="text-onyx-500 hover:text-white transition-colors"><X size={20} /></button>
                           </div>
                           <p className="text-onyx-300 mb-8 leading-relaxed text-sm">
                              Tem certeza que deseja excluir o módulo <span className="text-white font-bold">"{deletingModule.title}"</span>?
                              <br /><br />
                              <span className="text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 text-xs font-bold">Atenção:</span> Esta ação não pode ser desfeita e todas as aulas serão perdidas.
                           </p>
                           <div className="flex gap-3">
                              <button
                                 onClick={() => setDeletingModule(null)}
                                 className="flex-1 bg-white/[0.05] text-white font-bold py-3 rounded-xl hover:bg-white/[0.1] transition-colors text-sm"
                              >
                                 Cancelar
                              </button>
                              <button
                                 onClick={() => deleteModule(deletingModule.id)}
                                 className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 font-bold py-3 rounded-xl hover:bg-red-500/20 transition-colors text-sm shadow-glow-red"
                              >
                                 Excluir
                              </button>
                           </div>
                        </div>
                     </div>
                  )
               }
            </div>
            <ContentManager isOpen={isContentManagerOpen} onClose={() => setIsContentManagerOpen(false)} tenantId={tenantId} onModulesChange={onRefresh} />
         </>
      );
   }

   // PLAYER VIEW
   if (!activeLesson || !activeModule) return <div className="flex items-center justify-center h-full text-onyx-500">Carregando conteúdo...</div>;

   return (
      <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
         <button onClick={() => setView('GRID')} className="flex items-center gap-2 text-onyx-500 hover:text-white mb-6 transition-colors w-fit group">
            <div className="p-1.5 rounded-lg bg-white/[0.03] group-hover:bg-white/[0.1] transition-colors border border-white/[0.05]">
               <ChevronLeft size={16} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wide">Voltar aos Módulos</span>
         </button>

         <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-180px)]">
            {/* Main Content Player */}
            <div className="flex-1 premium-card rounded-3xl overflow-hidden flex flex-col shadow-2xl">
               <div className="aspect-video bg-black relative flex items-center justify-center group border-b border-white/[0.04]">
                  {activeLesson.type === 'VIDEO' ? (
                     <VideoPlayer
                        key={activeLesson.id}
                        src={activeLesson.contentUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}
                        title={activeLesson.title}
                        poster="https://images.unsplash.com/photo-1492619882492-482d73319400?q=80&w=2670&auto=format&fit=crop"
                        onEnded={handleLessonComplete}
                        autoPlay
                     />
                  ) : (
                     <div className="flex flex-col items-center text-onyx-400 z-10">
                        <div className="w-20 h-20 rounded-full bg-white/[0.03] flex items-center justify-center mb-6 border border-white/[0.05]">
                           <FileText size={32} className="text-onyx-500" />
                        </div>
                        <span className="text-sm font-medium border border-white/[0.05] px-4 py-2 rounded-full bg-black/50 backdrop-blur text-onyx-300">Documento de Leitura</span>
                     </div>
                  )}
               </div>

               <div className="p-8 overflow-y-auto custom-scrollbar bg-[#09090b]">
                  <div className="flex justify-between items-start mb-8">
                     <div>
                        <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">{activeLesson.title}</h2>
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-bold bg-white/[0.05] text-onyx-300 px-2.5 py-1 rounded border border-white/[0.05] uppercase tracking-wider">{activeLesson.type}</span>
                           {activeLesson.isCompleted && <span className="text-[10px] font-bold text-white flex items-center gap-1.5 bg-green-500/20 px-2.5 py-1 rounded border border-green-500/20"><CheckCircle size={12} /> Concluído</span>}
                           <span className="text-[10px] text-onyx-500 font-mono flex items-center gap-1.5"><Clock size={12} /> {activeLesson.duration}</span>
                        </div>
                     </div>
                  </div>

                  {/* Lesson Materials */}
                  {activeLesson.materials && activeLesson.materials.length > 0 && (
                     <LessonMaterials materials={activeLesson.materials} />
                  )}
               </div>
            </div>

            {/* Sidebar / Playlist */}
            <div className="w-full lg:w-96 premium-card rounded-3xl flex flex-col overflow-hidden max-h-[600px] lg:max-h-none">
               <div className="p-6 border-b border-white/[0.04] bg-white/[0.01]">
                  <div className="flex justify-between items-center mb-4">
                     <div>
                        <h3 className="text-sm font-bold text-white mb-1">Conteúdo do Módulo</h3>
                        <p className="text-xs text-onyx-500 font-medium truncate max-w-[200px]">{activeModule.title}</p>
                     </div>
                     {isAdmin && (
                        <button onClick={handleAddLesson} className="p-2 hover:bg-white/[0.05] rounded-lg text-onyx-400 hover:text-white transition-colors border border-transparent hover:border-white/[0.05]" title="Adicionar Aula">
                           <Plus size={16} />
                        </button>
                     )}
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-white/[0.03] p-3 rounded-xl border border-white/[0.02]">
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-onyx-500 uppercase tracking-wider">Progresso</span>
                        <span className="text-[10px] font-bold text-white font-mono">
                           {activeModule.lessons.filter(l => l.isCompleted).length}/{activeModule.lessons.length}
                        </span>
                     </div>
                     <div className="w-full bg-black h-1.5 rounded-full overflow-hidden border border-white/[0.05]">
                        <div
                           className="bg-white h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                           style={{
                              width: `${activeModule.lessons.length > 0 ? (activeModule.lessons.filter(l => l.isCompleted).length / activeModule.lessons.length) * 100 : 0}%`
                           }}
                        ></div>
                     </div>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                  {activeModule.lessons.map((lesson, idx) => (
                     <button
                        key={lesson.id}
                        onClick={() => setActiveLesson(lesson)}
                        className={`w-full flex items-start gap-3 p-3 text-left transition-all rounded-xl group ${activeLesson.id === lesson.id
                           ? 'bg-white/[0.06] border border-white/[0.05] shadow-inner'
                           : 'hover:bg-white/[0.03] border border-transparent'
                           }`}
                     >
                        {/* Thumbnail */}
                        <div className="w-20 h-12 rounded-lg bg-black overflow-hidden flex-shrink-0 relative border border-white/[0.05]">
                           {lesson.type === 'VIDEO' ? (
                              <>
                                 <img
                                    src={`https://img.youtube.com/vi/${lesson.contentUrl?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] || 'dQw4w9WgXcQ'}/mqdefault.jpg`}
                                    alt={lesson.title}
                                    className={`w-full h-full object-cover transition-opacity ${activeLesson.id === lesson.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}
                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=120&h=80&fit=crop'; }}
                                 />
                                 <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <div className={`w-6 h-6 rounded-full bg-black/50 backdrop-blur flex items-center justify-center ${activeLesson.id === lesson.id ? 'text-white' : 'text-white/70'}`}>
                                       <Play size={10} fill="currentColor" />
                                    </div>
                                 </div>
                              </>
                           ) : (
                              <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                                 <FileText size={16} className="text-onyx-600" />
                              </div>
                           )}
                           {lesson.isCompleted && (
                              <div className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5">
                                 <CheckCircle size={10} className="text-green-500" />
                              </div>
                           )}
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0 py-0.5">
                           <p className={`text-xs font-bold mb-1.5 line-clamp-2 leading-relaxed ${activeLesson.id === lesson.id ? 'text-white' : 'text-onyx-400 group-hover:text-onyx-200'}`}>
                              {lesson.title}
                           </p>
                           <span className="text-[10px] text-onyx-600 font-mono">{lesson.duration}</span>
                        </div>
                     </button>
                  ))}
               </div>

               {/* Navigation Footer */}
               <div className="p-4 border-t border-white/[0.04] bg-white/[0.01]">
                  <div className="flex items-center gap-3">
                     <button
                        onClick={goToPreviousLesson}
                        disabled={currentLessonIndex() === 0}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/[0.05] text-white rounded-xl text-xs font-bold hover:bg-white/[0.1] transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.05]"
                     >
                        <ChevronLeft size={14} />
                        Anterior
                     </button>
                     <button
                        onClick={goToNextLesson}
                        disabled={currentLessonIndex() === getAllLessons().length - 1}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-xl text-xs font-bold hover:bg-onyx-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-glow"
                     >
                        Próxima
                        <ChevronRight size={14} />
                     </button>
                  </div>
               </div>
            </div>

         </div>
      </div>
   );
};