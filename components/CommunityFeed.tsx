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
            // Fetch posts first
            const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select('id, tenant_id, author_id, content, created_at')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false });

            if (postsError) throw postsError;
            if (!postsData || postsData.length === 0) {
                setPosts([]);
                return;
            }

            // Get unique author IDs
            const authorIds = [...new Set(postsData.map(p => p.author_id))];

            // Fetch profiles for all authors
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, role')
                .in('id', authorIds);

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
            }

            // Create a map of profiles by ID
            const profilesMap = new Map();
            (profilesData || []).forEach(p => profilesMap.set(p.id, p));

            // Merge posts with author info
            const postsWithAuthors = postsData.map(post => ({
                ...post,
                author: profilesMap.get(post.author_id) || null
            }));

            console.log('Posts with authors:', postsWithAuthors);
            setPosts(postsWithAuthors);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostCreated = (newPost: CommunityPost) => {
        setPosts([newPost, ...posts]);
    };

    const handlePostDeleted = (postId: string) => {
        setPosts(posts.filter(p => p.id !== postId));
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
                        <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} />
                    ))
                )}
            </div>
        </div>
    );
};
