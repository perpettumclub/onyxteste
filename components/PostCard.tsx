import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, MoreHorizontal, Pin } from 'lucide-react';
import { CommunityPost } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface PostCardProps {
    post: CommunityPost;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
    const { user } = useAuth();
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0); // Mock for MVP

    const handleLike = () => {
        setLiked(!liked);
        setLikesCount(prev => liked ? prev - 1 : prev + 1);
    };

    return (
        <div className="flux-card p-6 group animate-fade-in">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-flux-subtle border border-flux-border flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                        {post.author?.avatar_url ? (
                            <img src={post.author.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                            (post.author?.full_name || 'U').charAt(0)
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{post.author?.full_name || 'Usuário'}</span>
                            {/* Mock pinned for now, logic needed if we store pinned state */}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-flux-text-tertiary font-medium">
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            <span className="w-0.5 h-0.5 bg-flux-text-tertiary rounded-full"></span>
                            <span className="bg-flux-subtle px-2 py-0.5 rounded text-flux-text-secondary border border-flux-border uppercase tracking-wider text-[9px]">{post.author?.role || 'Membro'}</span>
                        </div>
                    </div>
                </div>
                <button className="text-flux-text-tertiary hover:text-white transition-colors p-2 hover:bg-flux-subtle rounded-lg">
                    <MoreHorizontal size={16} />
                </button>
            </div>

            {post.title && <h3 className="text-base font-bold text-white mb-2">{post.title}</h3>}
            <p className="text-sm text-flux-text-secondary leading-relaxed mb-5 whitespace-pre-line font-medium">{post.content}</p>

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
                    {/* Mock comments count */}
                    0 <span className="hidden sm:inline">Comentários</span>
                </button>
            </div>
        </div>
    );
};
