import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Hexagon, ArrowLeft, Mail, Send, CheckCircle } from 'lucide-react';
import { supabase } from '../services/supabase';

export const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;
            setIsSent(true);
        } catch (err: any) {
            setError(err.message || 'Erro ao enviar email de recuperação');
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
                    <h1 className="text-3xl font-bold text-white mb-2">Recuperar Senha</h1>
                    <p className="text-onyx-400">
                        {isSent
                            ? 'Verifique seu email para continuar'
                            : 'Digite seu email para receber o link de recuperação'
                        }
                    </p>
                </div>

                <div className="bg-onyx-950 border border-onyx-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
                    {isSent ? (
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                                <CheckCircle className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white mb-2">Email Enviado!</h2>
                                <p className="text-onyx-400 text-sm">
                                    Enviamos um link de recuperação para <span className="text-white font-medium">{email}</span>.
                                    Verifique sua caixa de entrada e spam.
                                </p>
                            </div>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-onyx-400 hover:text-white transition-colors text-sm"
                            >
                                <ArrowLeft size={16} /> Voltar para login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

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

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-onyx-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Send size={18} /> Enviar Link de Recuperação
                                    </>
                                )}
                            </button>

                            <Link
                                to="/login"
                                className="flex items-center justify-center gap-2 text-onyx-400 hover:text-white transition-colors text-sm"
                            >
                                <ArrowLeft size={16} /> Voltar para login
                            </Link>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
