import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Hexagon, ArrowRight, Lock, Mail, User } from 'lucide-react';
import { supabase } from '../services/supabase';

export const Register: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
                    }
                }
            });

            if (error) throw error;

            // Check for pending invite
            const pendingInvite = localStorage.getItem('pendingInvite');
            if (pendingInvite && data.session) {
                // User is automatically logged in, redirect to invite
                localStorage.removeItem('pendingInvite');
                navigate(`/invite/${pendingInvite}`);
            } else if (pendingInvite) {
                // User needs to confirm email first
                alert('Conta criada! Confirme seu email e faça login para aceitar o convite.');
                navigate('/login');
            } else {
                alert('Conta criada com sucesso! Verifique seu email ou faça login.');
                navigate('/login');
            }
        } catch (error: any) {
            alert(error.message || 'Erro ao criar conta');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-onyx-900/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-onyx-800/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                        <Hexagon className="w-8 h-8 text-black fill-black" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Criar Conta</h1>
                    <p className="text-onyx-400">Comece sua jornada no Onyx Club</p>
                </div>

                <div className="bg-onyx-950 border border-onyx-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-onyx-500 uppercase tracking-wider ml-1">Nome Completo</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-onyx-600 group-focus-within:text-white transition-colors" size={18} />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="premium-input pl-12 py-3.5"
                                    placeholder="Seu nome"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-onyx-500 uppercase tracking-wider ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-onyx-600 group-focus-within:text-white transition-colors" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="premium-input pl-12 py-3.5"
                                    placeholder="seu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-onyx-500 uppercase tracking-wider ml-1">Senha</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-onyx-600 group-focus-within:text-white transition-colors" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="premium-input pl-12 py-3.5"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-onyx-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Criar Minha Conta <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-onyx-500 text-sm mt-8">
                    Já tem uma conta?{' '}
                    <Link to="/login" className="text-white font-bold hover:underline">
                        Fazer login
                    </Link>
                </p>
            </div>
        </div>
    );
};
