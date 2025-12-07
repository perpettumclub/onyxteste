import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Hexagon, ArrowRight, Lock, Mail } from 'lucide-react';
import { supabase } from '../services/supabase';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            navigate('/select-client');
        } catch (error: any) {
            alert(error.message || 'Erro ao fazer login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-onyx-900/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-onyx-800/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                        <Hexagon className="w-8 h-8 text-black fill-black" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo de volta</h1>
                    <p className="text-onyx-400">Acesse sua conta para continuar</p>
                </div>

                <div className="bg-onyx-950 border border-onyx-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-onyx-500 uppercase tracking-wider ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-onyx-600 group-focus-within:text-white transition-colors" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black border border-onyx-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-onyx-700 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                                    placeholder="seu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-bold text-onyx-500 uppercase tracking-wider">Senha</label>
                                <a href="#" className="text-xs text-onyx-400 hover:text-white transition-colors">Esqueceu a senha?</a>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-onyx-600 group-focus-within:text-white transition-colors" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black border border-onyx-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-onyx-700 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-onyx-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Entrar na Plataforma <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-onyx-500 text-sm mt-8">
                    Não tem uma conta?{' '}
                    <Link to="/register" className="text-white font-bold hover:underline">
                        Criar conta agora
                    </Link>
                </p>
            </div>
        </div>
    );
};
