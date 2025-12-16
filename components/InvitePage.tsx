import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Hexagon, Loader2, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

interface InviteData {
    id: string;
    tenant_id: string;
    invite_code: string;
    status: string;
    expires_at: string;
    tenant: {
        name: string;
    };
}

export const InvitePage: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { session, user } = useAuth();

    const [invite, setInvite] = useState<InviteData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAccepting, setIsAccepting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleAcceptInvite = async () => {
        if (!invite || !session?.user) return;

        setIsAccepting(true);

        try {
            // Use secure RPC to accept invite
            const { data, error } = await supabase.rpc('accept_invite', { invite_code_param: code });

            if (error) {
                console.error('Error accepting invite:', error);
                // Handle specific error messages from RPC
                if (error.message.includes('Convite já utilizado')) {
                    setError('Este convite já foi utilizado.');
                } else if (error.message.includes('Convite expirado')) {
                    setError('Este convite expirou.');
                } else {
                    setError('Erro ao aceitar convite.');
                }
                setIsAccepting(false);
                return;
            }

            // RPC returns { success: boolean, tenant_id: string, message?: string }
            if (data && data.success) {
                // Set selected tenant and redirect
                localStorage.setItem('selectedClientId', data.tenant_id);
                setSuccess(true);
                setTimeout(() => navigate('/dashboard'), 1500);
            } else if (data && !data.success) {
                setError(data.error || 'Erro ao processar convite.');
                setIsAccepting(false);
            } else {
                // Handle "Already member" case which might return success=true
                if (data?.message === 'Usuário já é membro') {
                    localStorage.setItem('selectedClientId', data.tenant_id);
                    setSuccess(true);
                    setTimeout(() => navigate('/dashboard'), 1500);
                }
            }

        } catch (err) {
            console.error('Error accepting invite:', err);
            setError('Erro ao aceitar convite.');
            setIsAccepting(false);
        }
    };

    useEffect(() => {
        const fetchInvite = async () => {
            if (!code) {
                setError('Código de convite inválido.');
                setIsLoading(false);
                return;
            }

            try {
                // Use secure RPC to get invite details (works even if not logged in)
                const { data, error } = await supabase.rpc('get_invite_details', { invite_code_param: code });

                if (error) {
                    console.error('Error fetching invite:', error);
                    setError('Erro ao carregar convite.');
                    setIsLoading(false);
                    return;
                }

                if (data.error) {
                    setError(data.error);
                    setIsLoading(false);
                    return;
                }

                setInvite({
                    id: 'rpc-data', // Placeholder
                    tenant_id: data.tenant_id,
                    invite_code: code,
                    status: data.status,
                    expires_at: new Date(Date.now() + 86400000).toISOString(), // Placeholder
                    tenant: {
                        name: data.tenant_name
                    }
                });
            } catch (err) {
                console.error('Error fetching invite:', err);
                setError('Erro ao carregar convite.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInvite();
    }, [code]);

    // Auto-accept if user is logged in
    useEffect(() => {
        if (session && invite && !isAccepting && !success && !error) {
            handleAcceptInvite();
        }
    }, [session, invite]);

    const handleLoginRedirect = () => {
        // Store invite code for after login
        localStorage.setItem('pendingInvite', code || '');
        navigate('/login');
    };

    const handleRegisterRedirect = () => {
        // Store invite code for after registration
        localStorage.setItem('pendingInvite', code || '');
        navigate('/register');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6">
                    <Hexagon className="w-8 h-8 text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Convite Inválido</h1>
                <p className="text-flux-text-secondary mb-8">{error}</p>
                <Link
                    to="/login"
                    className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                    Ir para Login
                </Link>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Convite Aceito!</h1>
                <p className="text-flux-text-secondary">Redirecionando para {invite?.tenant?.name || 'a área de membros'}...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-flux-accent-blue/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/5 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                        <Hexagon className="w-8 h-8 text-black fill-black" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Você foi convidado!</h1>
                    <p className="text-flux-text-secondary">para entrar em</p>
                </div>

                {/* Invite Card */}
                <div className="bg-onyx-950 border border-onyx-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
                            <Users className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{invite?.tenant?.name || 'Área de Membros'}</h2>
                            <p className="text-sm text-flux-text-tertiary">Área de Membros</p>
                        </div>
                    </div>

                    {session ? (
                        // User is logged in - show accepting state
                        <div className="text-center py-4">
                            <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
                            <p className="text-flux-text-secondary">Aceitando convite...</p>
                        </div>
                    ) : (
                        // User is not logged in - show options
                        <div className="space-y-4">
                            <button
                                onClick={handleRegisterRedirect}
                                className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                Criar Conta <ArrowRight size={18} />
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-onyx-700" />
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="px-4 bg-onyx-950 text-flux-text-tertiary uppercase tracking-wider">ou</span>
                                </div>
                            </div>

                            <button
                                onClick={handleLoginRedirect}
                                className="w-full border border-onyx-700 text-white font-bold py-4 rounded-xl hover:bg-white/[0.05] transition-all"
                            >
                                Já tenho conta
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-flux-text-tertiary text-xs mt-8">
                    Ao aceitar, você terá acesso ao conteúdo dessa área de membros.
                </p>
            </div>
        </div>
    );
};
