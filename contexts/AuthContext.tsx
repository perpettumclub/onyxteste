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
                // Fetch user profile or set default
                setUser({
                    ...CURRENT_USER,
                    id: session.user.id,
                    email: session.user.email || CURRENT_USER.email,
                    name: session.user.user_metadata.full_name || CURRENT_USER.name,
                    avatar: session.user.user_metadata.avatar_url || CURRENT_USER.avatar,
                    role: 'ADMIN' // Default role for now, can be fetched from profiles table
                });
            }
            setLoading(false);
        });

        // 2. Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                setUser({
                    ...CURRENT_USER,
                    id: session.user.id,
                    email: session.user.email || CURRENT_USER.email,
                    name: session.user.user_metadata.full_name || CURRENT_USER.name,
                    avatar: session.user.user_metadata.avatar_url || CURRENT_USER.avatar,
                    role: 'ADMIN'
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

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
