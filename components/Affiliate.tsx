import React, { useState } from 'react';
import { Copy, CheckCircle, DollarSign, Users, Link, ExternalLink, TrendingUp, Award, Share2 } from 'lucide-react';

interface AffiliateProps {
    tenantId: string | null;
}

export const Affiliate: React.FC<AffiliateProps> = ({ tenantId }) => {
    const [copied, setCopied] = useState(false);

    // Mock affiliate data - in production, fetch from Supabase
    const affiliateData = {
        referralCode: 'ONYX-' + (tenantId?.slice(0, 6).toUpperCase() || 'DEMO'),
        referralLink: `https://app.onyxclub.com/r/${tenantId?.slice(0, 8) || 'demo'}`,
        totalReferrals: 12,
        pendingCommissions: 1250.00,
        paidCommissions: 4800.00,
        commissionRate: 30,
        recentReferrals: [
            { id: '1', name: 'João Silva', date: '2024-12-01', status: 'active', commission: 89.70 },
            { id: '2', name: 'Maria Santos', date: '2024-11-28', status: 'pending', commission: 89.70 },
            { id: '3', name: 'Pedro Costa', date: '2024-11-25', status: 'active', commission: 89.70 },
        ]
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-[10px] font-bold text-purple-400 border border-purple-500/30 uppercase tracking-wider">
                        Programa de Afiliados
                    </span>
                </div>
                <h1 className="text-3xl font-bold text-white">Indique e Ganhe</h1>
                <p className="text-onyx-500 text-sm mt-2">Compartilhe seu link e ganhe {affiliateData.commissionRate}% de comissão em cada venda.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="premium-card rounded-2xl p-6 border border-white/[0.04]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                            <DollarSign size={20} className="text-green-400" />
                        </div>
                        <div>
                            <p className="text-[10px] text-onyx-500 uppercase tracking-wider font-bold">Comissões Pagas</p>
                            <p className="text-2xl font-bold text-white">R$ {affiliateData.paidCommissions.toLocaleString('pt-BR')}</p>
                        </div>
                    </div>
                </div>

                <div className="premium-card rounded-2xl p-6 border border-white/[0.04]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                            <TrendingUp size={20} className="text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-[10px] text-onyx-500 uppercase tracking-wider font-bold">Pendente</p>
                            <p className="text-2xl font-bold text-white">R$ {affiliateData.pendingCommissions.toLocaleString('pt-BR')}</p>
                        </div>
                    </div>
                </div>

                <div className="premium-card rounded-2xl p-6 border border-white/[0.04]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                            <Users size={20} className="text-purple-400" />
                        </div>
                        <div>
                            <p className="text-[10px] text-onyx-500 uppercase tracking-wider font-bold">Total de Indicados</p>
                            <p className="text-2xl font-bold text-white">{affiliateData.totalReferrals}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Referral Link Section */}
            <div className="premium-card rounded-3xl p-8 border border-white/[0.04] bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                        <Share2 size={24} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Seu Link de Afiliado</h2>
                        <p className="text-onyx-500 text-sm">Compartilhe este link para ganhar comissões</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 bg-black/30 border border-white/[0.06] rounded-xl p-4 flex items-center gap-3">
                        <Link size={18} className="text-onyx-500 flex-shrink-0" />
                        <input
                            type="text"
                            readOnly
                            value={affiliateData.referralLink}
                            className="flex-1 bg-transparent text-white text-sm font-mono focus:outline-none"
                        />
                    </div>
                    <button
                        onClick={() => copyToClipboard(affiliateData.referralLink)}
                        className={`px-6 py-4 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${copied
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-black hover:bg-onyx-200'
                            }`}
                    >
                        {copied ? <><CheckCircle size={16} /> Copiado!</> : <><Copy size={16} /> Copiar Link</>}
                    </button>
                </div>

                <div className="mt-6 flex items-center gap-4">
                    <div className="flex-1 border-t border-white/[0.06]"></div>
                    <span className="text-[10px] text-onyx-500 uppercase tracking-wider">ou compartilhe via</span>
                    <div className="flex-1 border-t border-white/[0.06]"></div>
                </div>

                <div className="mt-6 flex justify-center gap-3">
                    <button className="w-12 h-12 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.1] transition-colors">
                        <ExternalLink size={18} className="text-onyx-400" />
                    </button>
                </div>
            </div>

            {/* Recent Referrals */}
            <div className="premium-card rounded-3xl overflow-hidden border border-white/[0.04]">
                <div className="p-6 border-b border-white/[0.04]">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Award size={20} className="text-purple-400" />
                        Indicações Recentes
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/[0.04] bg-white/[0.02]">
                                <th className="py-4 px-6 text-left text-[10px] font-bold text-onyx-500 uppercase tracking-wider">Indicado</th>
                                <th className="py-4 px-6 text-left text-[10px] font-bold text-onyx-500 uppercase tracking-wider">Data</th>
                                <th className="py-4 px-6 text-left text-[10px] font-bold text-onyx-500 uppercase tracking-wider">Status</th>
                                <th className="py-4 px-6 text-right text-[10px] font-bold text-onyx-500 uppercase tracking-wider">Comissão</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {affiliateData.recentReferrals.map(referral => (
                                <tr key={referral.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-400">
                                                {referral.name.charAt(0)}
                                            </div>
                                            <span className="text-sm font-medium text-white">{referral.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-onyx-400 font-mono">
                                        {new Date(referral.date).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${referral.status === 'active'
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                            : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                            }`}>
                                            {referral.status === 'active' ? 'Ativo' : 'Pendente'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <span className="text-sm font-bold text-white font-mono">
                                            R$ {referral.commission.toFixed(2)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
