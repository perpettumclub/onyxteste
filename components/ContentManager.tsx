import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Video, FileText, Upload, Folder, GripVertical, Loader2, Check } from 'lucide-react';
import { supabase } from '../services/supabase';
import { Module, Lesson } from '../types';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getVideoDuration } from '../utils/videoDuration';

interface ContentManagerProps {
    isOpen: boolean;
    onClose: () => void;
    tenantId: string | null;
    onModulesChange?: () => void;
}

// Sortable Module Item
const SortableModuleItem: React.FC<{
    module: any;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ module, onEdit, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.04] p-4 rounded-xl group hover:border-white/[0.1] hover:bg-white/[0.05] transition-all">
            <div className="flex items-center gap-4">
                <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-onyx-600 hover:text-white transition-colors p-1 hover:bg-white/[0.05] rounded">
                    <GripVertical size={20} />
                </button>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-onyx-800 to-black border border-white/[0.05] flex items-center justify-center text-onyx-400 shadow-inner">
                    <Folder size={18} />
                </div>
                <div>
                    <h4 className="text-white font-bold text-sm">{module.title}</h4>
                    <p className="text-[10px] text-onyx-500 uppercase tracking-wide font-medium">{module.lessons?.length || 0} aulas</p>
                </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onEdit} className="p-2 text-onyx-400 hover:text-white hover:bg-white/[0.1] rounded-lg transition-colors"><Edit2 size={16} /></button>
                <button onClick={onDelete} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
            </div>
        </div>
    );
};

// Sortable Lesson Item
const SortableLessonItem: React.FC<{
    lesson: any;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ lesson, onEdit, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.04] p-4 rounded-xl group hover:border-white/[0.1] hover:bg-white/[0.05] transition-all">
            <div className="flex items-center gap-4">
                <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-onyx-600 hover:text-white transition-colors p-1 hover:bg-white/[0.05] rounded">
                    <GripVertical size={20} />
                </button>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-onyx-800 to-black border border-white/[0.05] flex items-center justify-center text-onyx-400 shadow-inner">
                    {lesson.type === 'VIDEO' ? <Video size={18} /> : <FileText size={18} />}
                </div>
                <div>
                    <h4 className="text-white font-bold text-sm">{lesson.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-onyx-500 font-medium">
                        <span className="font-mono">{lesson.duration}</span>
                        <span className="w-1 h-1 rounded-full bg-onyx-700"></span>
                        <span className="uppercase tracking-wide">{lesson.type}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onEdit} className="p-2 text-onyx-400 hover:text-white hover:bg-white/[0.1] rounded-lg transition-colors"><Edit2 size={16} /></button>
                <button onClick={onDelete} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
            </div>
        </div>
    );
};

export const ContentManager: React.FC<ContentManagerProps> = ({ isOpen, onClose, tenantId, onModulesChange }) => {
    const [activeTab, setActiveTab] = useState<'MODULES' | 'LESSONS'>('MODULES');
    const [modules, setModules] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedModuleId, setSelectedModuleId] = useState<string>('');

    // Form States
    const [isEditing, setIsEditing] = useState(false);
    const [editModule, setEditModule] = useState<Partial<Module>>({});
    const [editLesson, setEditLesson] = useState<Partial<Lesson>>({});
    const [isCreating, setIsCreating] = useState(false);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        if (isOpen && tenantId) {
            fetchModules();
        }
    }, [isOpen, tenantId]);

    const fetchModules = async () => {
        if (!tenantId) return;
        setLoading(true);
        const { data } = await supabase
            .from('modules')
            .select('*, lessons(*)')
            .eq('tenant_id', tenantId)
            .order('order_index', { ascending: true });

        if (data) {
            // Sort lessons by order_index too
            const sortedModules = data.map(m => ({
                ...m,
                lessons: (m.lessons || []).sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
            }));
            setModules(sortedModules);
            if (sortedModules.length > 0 && !selectedModuleId) {
                setSelectedModuleId(sortedModules[0].id);
            }
        }
        setLoading(false);
    };

    // --- DRAG END HANDLERS ---
    const handleModuleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = modules.findIndex(m => m.id === active.id);
        const newIndex = modules.findIndex(m => m.id === over.id);
        const newOrder = arrayMove(modules, oldIndex, newIndex);
        setModules(newOrder);

        // Persist to DB
        for (let i = 0; i < newOrder.length; i++) {
            await supabase.from('modules').update({ order_index: i }).eq('id', newOrder[i].id);
        }
        onModulesChange?.();
    };

    const handleLessonDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const currentModule = modules.find(m => m.id === selectedModuleId);
        if (!currentModule) return;

        const lessons = currentModule.lessons || [];
        const oldIndex = lessons.findIndex((l: any) => l.id === active.id);
        const newIndex = lessons.findIndex((l: any) => l.id === over.id);
        const newOrder = arrayMove(lessons, oldIndex, newIndex);

        // Update local state
        setModules(modules.map(m => m.id === selectedModuleId ? { ...m, lessons: newOrder } : m));

        // Persist to DB
        for (let i = 0; i < newOrder.length; i++) {
            await supabase.from('lessons').update({ order_index: i }).eq('id', newOrder[i].id);
        }
        onModulesChange?.();
    };

    // --- MODULE OPERATIONS ---
    const handleSaveModule = async () => {
        if (!tenantId || !editModule.title) return;
        setLoading(true);

        if (editModule.id) {
            await supabase.from('modules').update({ title: editModule.title, description: editModule.description }).eq('id', editModule.id);
        } else {
            const { error } = await supabase.from('modules').insert([{
                tenant_id: tenantId,
                title: editModule.title,
                description: editModule.description,
                order_index: modules.length
            }]);
            if (error) alert('Erro: ' + error.message);
        }
        fetchModules();
        onModulesChange?.();
        setIsEditing(false);
        setIsCreating(false);
        setEditModule({});
        setLoading(false);
    };

    const handleDeleteModule = async (id: string) => {
        if (!confirm('Tem certeza? Todas as aulas serão apagadas.')) return;
        await supabase.from('modules').delete().eq('id', id);
        fetchModules();
        onModulesChange?.();
    };

    // --- LESSON OPERATIONS ---
    const handleSaveLesson = async () => {
        if (!selectedModuleId || !editLesson.title) return;
        setLoading(true);

        const currentModule = modules.find(m => m.id === selectedModuleId);
        const lessonData = {
            module_id: selectedModuleId,
            title: editLesson.title,
            duration: editLesson.duration || '00:00',
            type: editLesson.type || 'VIDEO',
            content_url: editLesson.contentUrl,
            order_index: editLesson.id ? undefined : (currentModule?.lessons?.length || 0)
        };

        if (editLesson.id) {
            await supabase.from('lessons').update(lessonData).eq('id', editLesson.id);
        } else {
            await supabase.from('lessons').insert([lessonData]);
        }
        fetchModules();
        onModulesChange?.();
        setIsEditing(false);
        setIsCreating(false);
        setEditLesson({});
        setLoading(false);
    };

    const handleDeleteLesson = async (id: string) => {
        if (!confirm('Excluir esta aula?')) return;
        await supabase.from('lessons').delete().eq('id', id);
        fetchModules();
        onModulesChange?.();
    };

    if (!isOpen) return null;

    const currentLessons = modules.find(m => m.id === selectedModuleId)?.lessons || [];

    return (
        <div className="fixed inset-0 lg:left-72 z-50 flex items-start justify-center pt-20 px-4 pb-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose}></div>
            <div className="relative premium-card w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-scale-in overflow-hidden rounded-3xl">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/[0.04] bg-white/[0.02]">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Gerenciar Conteúdo</h2>
                        <p className="text-xs text-onyx-500 mt-1">Arraste para reordenar módulos e aulas.</p>
                    </div>
                    <button onClick={onClose} className="text-onyx-500 hover:text-white transition-colors p-2 hover:bg-white/[0.05] rounded-xl">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/[0.04] bg-black/40">
                    <button onClick={() => setActiveTab('MODULES')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'MODULES' ? 'text-white border-b-2 border-white bg-white/[0.02]' : 'text-onyx-500 hover:text-white hover:bg-white/[0.01]'}`}>
                        Módulos
                    </button>
                    <button onClick={() => setActiveTab('LESSONS')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'LESSONS' ? 'text-white border-b-2 border-white bg-white/[0.02]' : 'text-onyx-500 hover:text-white hover:bg-white/[0.01]'}`}>
                        Aulas
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#09090b]">

                    {/* MODULES TAB */}
                    {activeTab === 'MODULES' && (
                        <div className="space-y-4">
                            <button onClick={() => { setIsCreating(true); setEditModule({}); }} className="w-full py-4 border border-dashed border-white/[0.1] rounded-xl text-onyx-500 hover:border-white/[0.2] hover:text-white hover:bg-white/[0.02] transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wide">
                                <Plus size={16} /> Novo Módulo
                            </button>

                            {/* Create/Edit Form */}
                            {(isCreating || isEditing) && (
                                <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 animate-fade-in shadow-premium">
                                    <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wide">{isEditing ? 'Editar Módulo' : 'Novo Módulo'}</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Título</label>
                                            <input type="text" value={editModule.title || ''} onChange={e => setEditModule({ ...editModule, title: e.target.value })} className="w-full premium-input rounded-lg px-4 py-2.5 text-white focus:outline-none" placeholder="Ex: Módulo 1: Introdução" autoFocus />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Descrição</label>
                                            <textarea value={editModule.description || ''} onChange={e => setEditModule({ ...editModule, description: e.target.value })} className="w-full premium-input rounded-lg px-4 py-2.5 text-white focus:outline-none h-24 resize-none leading-relaxed" placeholder="Descreva o conteúdo deste módulo..." />
                                        </div>
                                        <div className="flex justify-end gap-3 pt-2">
                                            <button onClick={() => { setIsCreating(false); setIsEditing(false); }} className="px-4 py-2 text-xs font-bold text-onyx-400 hover:text-white transition-colors">Cancelar</button>
                                            <button onClick={handleSaveModule} className="premium-btn px-6 py-2 text-black rounded-lg font-bold text-xs shadow-glow hover:shadow-glow-blue transition-all">Salvar</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sortable Module List */}
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleModuleDragEnd}>
                                <SortableContext items={modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-2">
                                        {modules.map(module => (
                                            <SortableModuleItem
                                                key={module.id}
                                                module={module}
                                                onEdit={() => { setEditModule(module); setIsEditing(true); }}
                                                onDelete={() => handleDeleteModule(module.id)}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}

                    {/* LESSONS TAB */}
                    {activeTab === 'LESSONS' && (
                        <div className="space-y-6">
                            {/* Module Selector */}
                            <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                {modules.map(module => (
                                    <button key={module.id} onClick={() => setSelectedModuleId(module.id)} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${selectedModuleId === module.id ? 'bg-white text-black border-white shadow-glow' : 'bg-white/[0.03] text-onyx-400 border-white/[0.05] hover:text-white hover:bg-white/[0.05]'}`}>
                                        {module.title}
                                    </button>
                                ))}
                            </div>

                            {selectedModuleId && (
                                <>
                                    <button onClick={() => { setIsCreating(true); setEditLesson({}); }} className="w-full py-4 border border-dashed border-white/[0.1] rounded-xl text-onyx-500 hover:border-white/[0.2] hover:text-white hover:bg-white/[0.02] transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wide">
                                        <Plus size={16} /> Nova Aula
                                    </button>

                                    {/* Create/Edit Lesson Form */}
                                    {(isCreating || isEditing) && (
                                        <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 animate-fade-in shadow-premium">
                                            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wide">{isEditing ? 'Editar Aula' : 'Nova Aula'}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div className="col-span-2">
                                                    <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Título</label>
                                                    <input type="text" value={editLesson.title || ''} onChange={e => setEditLesson({ ...editLesson, title: e.target.value })} className="w-full premium-input rounded-lg px-4 py-2.5 text-white focus:outline-none" placeholder="Ex: Aula 1: Conceitos Básicos" autoFocus />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Duração</label>
                                                    <input type="text" value={editLesson.duration || ''} onChange={e => setEditLesson({ ...editLesson, duration: e.target.value })} className="w-full premium-input rounded-lg px-4 py-2.5 text-white focus:outline-none" placeholder="10:00" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Tipo</label>
                                                    <select value={editLesson.type || 'VIDEO'} onChange={e => setEditLesson({ ...editLesson, type: e.target.value as any })} className="w-full premium-input rounded-lg px-4 py-2.5 text-white focus:outline-none">
                                                        <option value="VIDEO">Vídeo</option>
                                                        <option value="TEXT">Texto</option>
                                                        <option value="DOCUMENT">Documento</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">URL do Conteúdo</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={editLesson.contentUrl || ''}
                                                            onChange={e => setEditLesson({ ...editLesson, contentUrl: e.target.value })}
                                                            onBlur={async (e) => {
                                                                const url = e.target.value;
                                                                if (url && editLesson.type === 'VIDEO') {
                                                                    setLoading(true);
                                                                    const duration = await getVideoDuration(url);
                                                                    if (duration && duration !== '00:00') {
                                                                        setEditLesson(prev => ({ ...prev, duration }));
                                                                    }
                                                                    setLoading(false);
                                                                }
                                                            }}
                                                            className="flex-1 premium-input rounded-lg px-4 py-2.5 text-white focus:outline-none"
                                                            placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                                                        />
                                                        <button className="bg-white/[0.05] text-white px-4 rounded-lg hover:bg-white/[0.1] border border-white/[0.05]" title="Upload">
                                                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                                                        </button>
                                                    </div>
                                                    <p className="text-[10px] text-onyx-600 mt-1.5">A duração será detectada automaticamente para Vimeo e arquivos diretos</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-3 pt-2">
                                                <button onClick={() => { setIsCreating(false); setIsEditing(false); }} className="px-4 py-2 text-xs font-bold text-onyx-400 hover:text-white transition-colors">Cancelar</button>
                                                <button onClick={handleSaveLesson} className="premium-btn px-6 py-2 text-black rounded-lg font-bold text-xs shadow-glow hover:shadow-glow-blue transition-all">Salvar</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Sortable Lesson List */}
                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLessonDragEnd}>
                                        <SortableContext items={currentLessons.map((l: any) => l.id)} strategy={verticalListSortingStrategy}>
                                            <div className="space-y-2">
                                                {currentLessons.map((lesson: any) => (
                                                    <SortableLessonItem
                                                        key={lesson.id}
                                                        lesson={lesson}
                                                        onEdit={() => { setEditLesson(lesson); setIsEditing(true); }}
                                                        onDelete={() => handleDeleteLesson(lesson.id)}
                                                    />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </DndContext>

                                    {currentLessons.length === 0 && (
                                        <div className="text-center py-12 border border-dashed border-white/[0.05] rounded-xl bg-white/[0.01]">
                                            <p className="text-onyx-500 text-sm font-medium">Nenhuma aula neste módulo.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
