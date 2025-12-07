import React, { useState } from 'react';
import { X, Check, AlertTriangle, CreditCard, Calendar } from 'lucide-react';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPlan: string;
    onUpdatePlan: (planId: string) => void;
    onCancelSubscription: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, currentPlan, onUpdatePlan, onCancelSubscription }) => {
    const [step, setStep] = useState<'PLANS' | 'CANCEL_CONFIRM'>('PLANS');
    const [selectedPlan, setSelectedPlan] = useState(currentPlan);

    if (!isOpen) return null;

    const plans = [
        { id: 'starter', name: 'Onyx Starter', price: 'R$ 99', features: ['Até 1.000 leads', '1 Usuário', 'Suporte Básico'] },
        { id: 'pro', name: 'Onyx Pro', price: 'R$ 299', features: ['Até 5.000 leads', '3 Usuários', 'Suporte Prioritário', 'Dashboard Avançado'] },
        { id: 'business', name: 'Onyx Business', price: 'R$ 599', features: ['Leads Ilimitados', '10 Usuários', 'Gerente de Conta', 'API Access'] },
    ];

    return (
        <div className="fixed inset-0 lg:left-72 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose}></div>
            <div className="relative premium-card w-full max-w-3xl p-0 shadow-2xl animate-scale-in rounded-3xl overflow-hidden flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/[0.04] bg-white/[0.02] flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Gerenciar Assinatura</h2>
                        <p className="text-xs text-onyx-500 mt-1">Escolha o plano ideal para o seu momento.</p>
                    </div>
                    <button onClick={onClose} className="text-onyx-500 hover:text-white transition-colors p-2 hover:bg-white/[0.05] rounded-xl">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    {step === 'PLANS' ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                {plans.map(plan => (
                                    <div
                                        key={plan.id}
                                        onClick={() => setSelectedPlan(plan.id)}
                                        className={`relative p-6 rounded-2xl border cursor-pointer transition-all duration-300 group ${selectedPlan === plan.id
                                            ? 'bg-white text-black border-white shadow-glow scale-[1.02]'
                                            : 'bg-white/[0.03] border-white/[0.05] text-onyx-400 hover:border-white/[0.1] hover:bg-white/[0.05]'
                                            }`}
                                    >
                                        {selectedPlan === plan.id && (
                                            <div className="absolute -top-3 -right-3 bg-black text-white p-1.5 rounded-full border border-white shadow-lg">
                                                <Check size={14} />
                                            </div>
                                        )}
                                        <h3 className="font-bold text-lg mb-2 tracking-tight">{plan.name}</h3>
                                        <div className="text-2xl font-bold mb-6 tracking-tighter">{plan.price}<span className="text-xs font-normal opacity-70 ml-1">/mês</span></div>
                                        <ul className="space-y-3">
                                            {plan.features.map((feature, idx) => (
                                                <li key={idx} className="text-xs flex items-center gap-2 font-medium">
                                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${selectedPlan === plan.id ? 'bg-black/10 text-black' : 'bg-white/[0.1] text-white'}`}>
                                                        <Check size={8} />
                                                    </div>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center pt-6 border-t border-white/[0.05]">
                                <button
                                    onClick={() => setStep('CANCEL_CONFIRM')}
                                    className="text-red-400 text-xs font-bold hover:text-red-300 transition-colors hover:bg-red-500/10 px-4 py-2 rounded-lg"
                                >
                                    Cancelar Assinatura
                                </button>
                                <button
                                    onClick={() => onUpdatePlan(selectedPlan)}
                                    className="premium-btn text-black px-8 py-3 rounded-xl font-bold text-sm shadow-glow hover:shadow-glow-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                    disabled={selectedPlan === currentPlan}
                                >
                                    {selectedPlan === currentPlan ? 'Plano Atual' : 'Atualizar Plano'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8 animate-fade-in">
                            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                                <AlertTriangle size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Tem certeza?</h2>
                            <p className="text-onyx-400 text-sm max-w-md mx-auto mb-10 leading-relaxed">
                                Ao cancelar, você perderá acesso a recursos premium ao final do ciclo de cobrança atual. Seus dados serão mantidos por 30 dias antes da exclusão permanente.
                            </p>

                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => setStep('PLANS')}
                                    className="bg-white/[0.05] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/[0.1] transition-colors border border-white/[0.05]"
                                >
                                    Manter Assinatura
                                </button>
                                <button
                                    onClick={onCancelSubscription}
                                    className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-500/20 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                                >
                                    Confirmar Cancelamento
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
