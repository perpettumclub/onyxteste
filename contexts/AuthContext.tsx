import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { CURRENT_USER } from '../constants';

interface AuthContextType {
    session: Session | null;
    user: any | null; // Using any for now to match existing User type flexibility, or strict User type
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                fetchUserProfile(session.user);
            } else {
                setLoading(false);
            }
        });

        // 2. Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                fetchUserProfile(session.user);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserProfile = async (sessionUser: User) => {
        try {
            // Try to fetch from profiles table first
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sessionUser.id)
                .single();

            if (profile) {
                setUser({
                    ...CURRENT_USER,
                    id: sessionUser.id,
                    email: sessionUser.email || CURRENT_USER.email,
                    name: profile.full_name || sessionUser.user_metadata.full_name || CURRENT_USER.name,
                    avatar: profile.avatar_url || sessionUser.user_metadata.avatar_url || CURRENT_USER.avatar,
                    role: profile.role || 'ADMIN'
                });
            } else {
                // Fallback to metadata if no profile record exists
                setUser({
                    ...CURRENT_USER,
                    id: sessionUser.id,
                    email: sessionUser.email || CURRENT_USER.email,
                    name: sessionUser.user_metadata.full_name || CURRENT_USER.name,
                    avatar: sessionUser.user_metadata.avatar_url || CURRENT_USER.avatar,
                    role: 'MEMBER'
                });
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        // Redirect is handled by the router listening to session state
    };

    return (
        <AuthContext.Provider value={{ session, user, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
