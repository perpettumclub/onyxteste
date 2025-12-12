import React, { useState } from 'react';
import { Invoice } from '../types';
import { MOCK_INVOICES } from '../constants';
import { CreditCard, Download, CheckCircle, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { SubscriptionModal } from './SubscriptionModal';

interface BillingProps {
   tenantId: string | null;
}

export const Billing: React.FC<BillingProps> = ({ tenantId }) => {
   const { subscription, loading, updatePlan, cancelSubscription } = useSubscription(tenantId);
   const [isModalOpen, setIsModalOpen] = useState(false);

   const handleUpdatePlan = async (planId: string) => {
      await updatePlan(planId);
      setIsModalOpen(false);
   };

   const handleCancelSubscription = async () => {
      await cancelSubscription();
      setIsModalOpen(false);
   };

   const getPlanName = (id: string) => {
      switch (id) {
         case 'starter': return 'Onyx Starter';
         case 'pro': return 'Onyx Pro';
         case 'business': return 'Onyx Business';
         default: return 'Onyx Pro';
      }
   };

   const getPlanPrice = (id: string) => {
      switch (id) {
         case 'starter': return 'R$ 99';
         case 'pro': return 'R$ 299';
         case 'business': return 'R$ 599';
         default: return 'R$ 299';
      }
   };

   const getLeadLimit = (id: string) => {
      switch (id) {
         case 'starter': return '1.000';
         case 'pro': return '5.000';
         case 'business': return 'Ilimitado';
         default: return '5.000';
      }
   };

   if (loading) return <div className="p-8 text-center text-onyx-500">Carregando informações da assinatura...</div>;

   return (
      <div className="space-y-8 animate-fade-in-up">
         {/* Header */}
         <div>
            <div className="flex items-center gap-2 mb-1">
               <span className="px-2 py-0.5 rounded-full bg-onyx-900 text-[10px] font-bold text-onyx-400 border border-onyx-800 uppercase tracking-wider">Conta</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Faturamento & Assinatura</h1>
            <p className="text-onyx-500 text-sm mt-2">Gerencie seu plano, método de pagamento e histórico de faturas.</p>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Plan Card */}
            <div className="lg:col-span-2 bg-gradient-to-br from-onyx-900 to-black border border-onyx-800 rounded-3xl p-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Zap size={150} />
               </div>

               <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                     <div className="flex items-center gap-2 mb-2">
                        <span className="bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Plano Atual</span>
                        {subscription?.cancel_at_period_end ? (
                           <span className="text-yellow-500 text-xs font-bold flex items-center gap-1"><AlertTriangle size={12} /> Cancela em breve</span>
                        ) : (
                           <span className="text-green-500 text-xs font-bold flex items-center gap-1"><CheckCircle size={12} /> Ativo</span>
                        )}
                     </div>
                     <h2 className="text-3xl font-bold text-white mb-1">{getPlanName(subscription?.plan_id || 'pro')}</h2>
                     <p className="text-onyx-400 text-sm">
                        {subscription?.cancel_at_period_end
                           ? 'Acesso disponível até o final do ciclo atual.'
                           : 'Faturado anualmente • Próxima cobrança em 01 Nov 2024'}
                     </p>
                  </div>
                  <div className="text-right">
                     <div className="text-2xl font-bold text-white">{getPlanPrice(subscription?.plan_id || 'pro')}<span className="text-sm text-onyx-500 font-normal">/mês</span></div>
                  </div>
               </div>

               <div className="mt-8 pt-8 border-t border-onyx-800/50 relative z-10">
                  <div className="flex justify-between text-xs font-bold text-onyx-400 mb-2 uppercase tracking-wide">
                     <span>Uso de Leads</span>
                     <span>1.240 / {getLeadLimit(subscription?.plan_id || 'pro')}</span>
                  </div>
                  <div className="w-full bg-onyx-950 h-2 rounded-full overflow-hidden border border-onyx-900">
                     <div className="bg-white h-full w-[25%] rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                  </div>
               </div>

               <div className="mt-6 flex gap-3 relative z-10">
                  <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold hover:bg-onyx-200 transition-colors">
                     Alterar Plano
                  </button>
                  {!subscription?.cancel_at_period_end && (
                     <button onClick={() => setIsModalOpen(true)} className="bg-transparent border border-onyx-700 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-onyx-900 transition-colors">
                        Cancelar Assinatura
                     </button>
                  )}
               </div>
            </div>

            {/* Payment Method */}
            <div className="bg-onyx-950 border border-onyx-800 rounded-3xl p-6 flex flex-col justify-between">
               <div>
                  <h3 className="text-lg font-bold text-white mb-4">Método de Pagamento</h3>
                  <div className="bg-gradient-to-br from-onyx-800 to-black p-5 rounded-2xl border border-onyx-700/50 shadow-xl relative overflow-hidden group">
                     <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <div className="flex justify-between items-start mb-6">
                        <CreditCard className="text-white" size={24} />
                        <ShieldCheck className="text-onyx-500" size={16} />
                     </div>
                     <div className="text-onyx-400 text-xs font-mono mb-1">CARD NUMBER</div>
                     <div className="text-white font-mono text-lg tracking-widest mb-4">•••• •••• •••• 4242</div>
                     <div className="flex justify-between items-end">
                        <div>
                           <div className="text-onyx-400 text-[10px] font-mono">EXPIRY</div>
                           <div className="text-white text-sm font-mono">12/25</div>
                        </div>
                        <div className="w-8 h-5 bg-white/20 rounded"></div>
                     </div>
                  </div>
               </div>
               <button className="w-full mt-4 py-3 rounded-xl border border-dashed border-onyx-800 text-onyx-500 hover:text-white hover:border-onyx-600 text-xs font-bold transition-all">
                  Adicionar novo cartão
               </button>
            </div>
         </div>

         {/* Invoice History */}
         <div className="bg-onyx-950 border border-onyx-800 rounded-3xl p-6 md:p-8">
            <h3 className="text-lg font-bold text-white mb-6">Histórico de Faturas</h3>
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-onyx-900 text-xs font-bold text-onyx-500 uppercase tracking-wider">
                        <th className="pb-4 pl-2">Data</th>
                        <th className="pb-4">Plano</th>
                        <th className="pb-4">Valor</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4 text-right pr-2">Download</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-onyx-900">
                     {MOCK_INVOICES.map(invoice => (
                        <tr key={invoice.id} className="group hover:bg-onyx-900/30 transition-colors">
                           <td className="py-4 pl-2 text-sm text-onyx-300 font-mono">{invoice.date}</td>
                           <td className="py-4 text-sm text-white font-bold">{invoice.planName}</td>
                           <td className="py-4 text-sm text-onyx-300">{invoice.amount}</td>
                           <td className="py-4">
                              <span className="px-2 py-0.5 rounded bg-green-900/20 text-green-500 border border-green-900/50 text-[10px] font-bold uppercase">
                                 {invoice.status}
                              </span>
                           </td>
                           <td className="py-4 text-right pr-2">
                              <button className="p-2 text-onyx-500 hover:text-white transition-colors">
                                 <Download size={16} />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         <SubscriptionModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            currentPlan={subscription?.plan_id || 'pro'}
            onUpdatePlan={handleUpdatePlan}
            onCancelSubscription={handleCancelSubscription}
         />
      </div>
   );
};