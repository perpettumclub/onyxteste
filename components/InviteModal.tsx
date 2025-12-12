import React, { useState } from 'react';
import { X, Link2, Mail, Copy, Check, Loader2, UserPlus } from 'lucide-react';
import { supabase } from '../services/supabase';

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenantId: string;
    tenantName: string;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, tenantId, tenantName }) => {
    const [email, setEmail] = useState('');
    const [inviteLink, setInviteLink] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const generateInviteCode = () => {
        return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    };

    const handleGenerateLink = async () => {
        setIsLoading(true);
        setError('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('Você precisa estar logado para gerar convites.');
                return;
            }

            const inviteCode = generateInviteCode();

            const { error: insertError } = await supabase.from('invites').insert({
                tenant_id: tenantId,
                inviter_id: user.id,
                invite_code: inviteCode,
                invited_email: email || null,
                status: 'PENDING'
            });

            if (insertError) {
                console.error('Error creating invite:', insertError);
                setError('Erro ao criar convite. Tente novamente.');
                return;
            }

            const link = `${window.location.origin}/invite/${inviteCode}`;
            setInviteLink(link);
        } catch (err) {
            console.error('Error:', err);
            setError('Erro ao criar convite.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleClose = () => {
        setEmail('');
        setInviteLink('');
        setError('');
        setCopied(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 lg:left-72 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={handleClose}></div>
            <div className="relative w-full max-w-md animate-scale-in">
                <div className="bg-flux-black border border-flux-border rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-flux-border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-flux-subtle border border-flux-border flex items-center justify-center">
                                    <UserPlus size={20} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Convidar Membro</h2>
                                    <p className="text-xs text-flux-text-tertiary">Convide alguém para {tenantName}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-lg hover:bg-white/[0.05] text-flux-text-tertiary hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-5">
                        {!inviteLink ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-flux-text-tertiary uppercase tracking-wider">
                                        Email do convidado (opcional)
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-flux-text-tertiary" size={16} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="email@exemplo.com"
                                            className="w-full bg-flux-dark border border-flux-border rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-flux-text-tertiary focus:outline-none focus:border-flux-text-tertiary transition-colors"
                                        />
                                    </div>
                                    <p className="text-[10px] text-flux-text-tertiary">
                                        Deixe em branco para criar um link que qualquer pessoa pode usar.
                                    </p>
                                </div>

                                {error && (
                                    <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleGenerateLink}
                                    disabled={isLoading}
                                    className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <>
                                            <Link2 size={18} />
                                            Gerar Link de Convite
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
                                    <Check size={18} />
                                    <span className="text-sm font-medium">Link de convite criado!</span>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-flux-text-tertiary uppercase tracking-wider">
                                        Link de Convite
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={inviteLink}
                                            readOnly
                                            className="flex-1 bg-flux-dark border border-flux-border rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none"
                                        />
                                        <button
                                            onClick={handleCopyLink}
                                            className={`px-4 rounded-xl border transition-all flex items-center gap-2 font-bold text-sm ${copied
                                                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                                : 'bg-flux-subtle border-flux-border text-white hover:bg-white/[0.08]'
                                                }`}
                                        >
                                            {copied ? <Check size={16} /> : <Copy size={16} />}
                                            {copied ? 'Copiado!' : 'Copiar'}
                                        </button>
                                    </div>
                                </div>

                                <p className="text-xs text-flux-text-tertiary">
                                    Este link expira em 7 dias. Compartilhe com a pessoa que você deseja convidar.
                                </p>

                                <button
                                    onClick={() => {
                                        setInviteLink('');
                                        setEmail('');
                                    }}
                                    className="w-full py-3 rounded-xl border border-flux-border text-sm font-medium text-flux-text-secondary hover:text-white hover:border-flux-text-tertiary transition-all"
                                >
                                    Criar outro convite
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
