import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { PostCreator } from './PostCreator';
import { PostCard } from './PostCard';
import { CommunityPost } from '../types';
import { Loader2, MessageSquare } from 'lucide-react';

interface CommunityFeedProps {
    tenantId: string | null;
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({ tenantId }) => {
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenantId) return;
        fetchPosts();
    }, [tenantId]);

    const fetchPosts = async () => {
        console.log('Fetching community posts for tenant:', tenantId);
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*, author:author_id(full_name, avatar_url, role)')
                .eq('tenant_id', tenantId) // Ensure RLS allows this
                .order('created_at', { ascending: false });

            console.log('Supabase response:', { data, error });

            if (error) throw error;
            setPosts(data || []);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostCreated = (newPost: CommunityPost) => {
        setPosts([newPost, ...posts]);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="animate-spin text-flux-accent-blue" />
            </div>
        );
    }

    return (
        <div className="min-h-[600px] flex flex-col gap-6">
            <PostCreator onPostCreated={handlePostCreated} tenantId={tenantId} />

            <div className="space-y-4">
                {posts.length === 0 ? (
                    <div className="text-center py-12 text-flux-text-tertiary">
                        <MessageSquare className="mx-auto mb-3 opacity-20" size={48} />
                        <p>Ainda não há publicações.</p>
                        <p className="text-xs mt-1">Seja o primeiro a compartilhar algo!</p>
                    </div>
                ) : (
                    posts.map(post => (
                        <PostCard key={post.id} post={post} />
                    ))
                )}
            </div>
        </div>
    );
};
