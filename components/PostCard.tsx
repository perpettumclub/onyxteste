import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import { CommunityPost } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

interface PostCardProps {
    post: CommunityPost;
    onPostDeleted?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted }) => {
    const { user } = useAuth();
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [showMenu, setShowMenu] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);

    const isAuthor = user?.id === post.author_id;

    const handleLike = () => {
        setLiked(!liked);
        setLikesCount(prev => liked ? prev - 1 : prev + 1);
    };

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir este post?')) return;

        setIsDeleting(true);
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', post.id);

        if (error) {
            alert(`Erro ao excluir: ${error.message}`);
        } else {
            onPostDeleted?.(post.id);
        }
        setIsDeleting(false);
        setShowMenu(false);
    };

    const handleEdit = async () => {
        if (!editContent.trim()) return;

        const { error } = await supabase
            .from('posts')
            .update({ content: editContent })
            .eq('id', post.id);

        if (error) {
            alert(`Erro ao editar: ${error.message}`);
        } else {
            post.content = editContent;
            setIsEditing(false);
        }
    };

    return (
        <div className="flux-card p-6 group animate-fade-in">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-flux-subtle border border-flux-border flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                        {post.author?.avatar_url ? (
                            <img src={post.author.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            (post.author?.full_name || 'U').charAt(0)
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{post.author?.full_name || 'Usuário'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-flux-text-tertiary font-medium">
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            <span className="w-0.5 h-0.5 bg-flux-text-tertiary rounded-full"></span>
                            <span className="bg-flux-subtle px-2 py-0.5 rounded text-flux-text-secondary border border-flux-border uppercase tracking-wider text-[9px]">{post.author?.role || 'Membro'}</span>
                        </div>
                    </div>
                </div>

                {/* Menu dropdown - only for post author */}
                {isAuthor && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="text-flux-text-tertiary hover:text-white transition-colors p-2 hover:bg-flux-subtle rounded-lg"
                        >
                            <MoreHorizontal size={16} />
                        </button>

                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                <div className="absolute right-0 top-full mt-1 bg-flux-panel border border-flux-border rounded-xl shadow-xl z-20 py-1 min-w-[140px]">
                                    <button
                                        onClick={() => { setIsEditing(true); setShowMenu(false); }}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-flux-text-secondary hover:text-white hover:bg-flux-subtle transition-colors"
                                    >
                                        <Edit2 size={14} />
                                        Editar
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                    >
                                        <Trash2 size={14} />
                                        {isDeleting ? 'Excluindo...' : 'Excluir'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Content - editable or static */}
            {isEditing ? (
                <div className="mb-5">
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-flux-subtle border border-flux-border rounded-lg px-4 py-3 text-sm text-white placeholder-flux-text-tertiary focus:outline-none focus:border-flux-accent-blue resize-none min-h-[80px]"
                    />
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={handleEdit}
                            className="px-4 py-2 bg-flux-accent-blue text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Salvar
                        </button>
                        <button
                            onClick={() => { setIsEditing(false); setEditContent(post.content); }}
                            className="px-4 py-2 bg-flux-subtle text-flux-text-secondary text-xs font-bold rounded-lg hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-flux-text-secondary leading-relaxed mb-5 whitespace-pre-line font-medium">{post.content}</p>
            )}

            <div className="flex items-center gap-3 border-t border-flux-border pt-4">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 text-xs font-medium text-flux-text-tertiary hover:text-white transition-colors bg-flux-subtle px-3 py-2 rounded-lg border border-transparent hover:border-flux-border ${liked ? 'text-white border-flux-accent-blue/50' : ''}`}
                >
                    <ThumbsUp size={14} className={liked ? "fill-current text-flux-accent-blue" : ""} />
                    {likesCount} <span className="hidden sm:inline">Curtidas</span>
                </button>
                <button className="flex items-center gap-2 text-xs font-medium text-flux-text-tertiary hover:text-white transition-colors bg-flux-subtle px-3 py-2 rounded-lg border border-transparent hover:border-flux-border">
                    <MessageSquare size={14} />
                    0 <span className="hidden sm:inline">Comentários</span>
                </button>
            </div>
        </div>
    );
};
