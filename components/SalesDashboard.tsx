import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { FinancialGoal, SalesMetrics, Transaction } from '../types';
import { Target, TrendingUp, AlertCircle, Edit2, X, PieChart as PieIcon, Users, Award, Lock, Plus, DollarSign } from 'lucide-react';

interface SalesDashboardProps {
    financialGoal: FinancialGoal;
    setFinancialGoal: React.Dispatch<React.SetStateAction<FinancialGoal>>;
    salesMetrics: SalesMetrics;
    setSalesMetrics: React.Dispatch<React.SetStateAction<SalesMetrics>>;
    transactions: Transaction[];
    tenantId: string | null;
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({ financialGoal, setFinancialGoal, salesMetrics, setSalesMetrics, transactions, tenantId }) => {
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [isEditingTaxes, setIsEditingTaxes] = useState(false);
    const [tempGoal, setTempGoal] = useState(financialGoal);
    const [tempSales, setTempSales] = useState(salesMetrics.grossTotal);
    const [tempDailyAverage, setTempDailyAverage] = useState(salesMetrics.manualDailyAverage?.toString() || '');
    const [tempProjectionDays, setTempProjectionDays] = useState(salesMetrics.manualProjectionDays?.toString() || '');
    const [tempPlatformFee, setTempPlatformFee] = useState(salesMetrics.platformFeePercentage * 100);
    const [customTaxes, setCustomTaxes] = useState<{ name: string, percentage: number }[]>(salesMetrics.customTaxes || []);

    // Sync state with props when data is fetched
    React.useEffect(() => {
        setTempGoal(financialGoal);
        setTempSales(salesMetrics.grossTotal);
        setTempDailyAverage(salesMetrics.manualDailyAverage?.toString() || '');
        setTempProjectionDays(salesMetrics.manualProjectionDays?.toString() || '');
        setTempPlatformFee(salesMetrics.platformFeePercentage * 100);
        setCustomTaxes(salesMetrics.customTaxes || []);
    }, [financialGoal, salesMetrics]);

    // Calculations
    const platformFeeAmount = salesMetrics.grossTotal * salesMetrics.platformFeePercentage;
    const customTaxesTotal = customTaxes.reduce((sum, tax) => sum + (salesMetrics.grossTotal * (tax.percentage / 100)), 0);
    const totalDeductions = platformFeeAmount + customTaxesTotal;
    const netRevenue = salesMetrics.grossTotal - totalDeductions;
    const expertAmount = netRevenue * salesMetrics.expertSplitPercentage;
    const teamAmount = netRevenue * salesMetrics.teamSplitPercentage;

    const percentGoal = Math.min(100, Math.round((salesMetrics.grossTotal / financialGoal.target) * 100));

    // Projection Logic (Simplified Linear or Manual)
    const daysSinceStart = Math.max(1, Math.floor((new Date().getTime() - new Date(financialGoal.startDate).getTime()) / (1000 * 3600 * 24)));

    // Use manual daily average if set, otherwise calculate
    const dailyAverage = salesMetrics.manualDailyAverage !== undefined
        ? salesMetrics.manualDailyAverage
        : (salesMetrics.grossTotal / daysSinceStart);

    // Use manual projection days if set, otherwise calculate
    const daysToGoal = salesMetrics.manualProjectionDays !== undefined
        ? salesMetrics.manualProjectionDays
        : (dailyAverage > 0 ? Math.ceil((financialGoal.target - salesMetrics.grossTotal) / dailyAverage) : 999);

    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + daysToGoal);

    const saveGoal = async () => {
        setFinancialGoal(tempGoal);
        setSalesMetrics({
            ...salesMetrics,
            grossTotal: tempSales,
            manualDailyAverage: tempDailyAverage ? Number(tempDailyAverage) : undefined,
            manualProjectionDays: tempProjectionDays ? Number(tempProjectionDays) : undefined
        });
        setIsEditingGoal(false);

        if (tenantId) {
            await supabase.from('sales_config').upsert({
                tenant_id: tenantId,
                financial_goal_target: tempGoal.target,
                financial_goal_start_date: tempGoal.startDate,
                manual_gross_revenue: tempSales, // Save the manual gross revenue
                manual_daily_average: tempDailyAverage ? Number(tempDailyAverage) : null,
                manual_projection_days: tempProjectionDays ? Number(tempProjectionDays) : null,
                updated_at: new Date().toISOString()
            }, { onConflict: 'tenant_id' });
        }
    };

    const saveTaxes = async () => {
        setSalesMetrics({ ...salesMetrics, platformFeePercentage: tempPlatformFee / 100 });
        setIsEditingTaxes(false);

        if (tenantId) {
            await supabase.from('sales_config').upsert({
                tenant_id: tenantId,
                platform_fee_percentage: tempPlatformFee / 100,
                custom_taxes: customTaxes,
                updated_at: new Date().toISOString()
            }, { onConflict: 'tenant_id' });
        }
    };

    const addCustomTax = () => {
        setCustomTaxes([...customTaxes, { name: 'Nova Taxa', percentage: 0 }]);
    };

    const removeCustomTax = (index: number) => {
        setCustomTaxes(customTaxes.filter((_, i) => i !== index));
    };

    const updateCustomTax = (index: number, field: 'name' | 'percentage', value: string | number) => {
        const updated = [...customTaxes];
        updated[index] = { ...updated[index], [field]: value };
        setCustomTaxes(updated);
    };

    // Milestones Data
    const milestones = [
        { value: 50000, label: '50k', title: 'Onyx Starter' },
        { value: 100000, label: '100k', title: 'Onyx Iron' },
        { value: 250000, label: '250k', title: 'Onyx Bronze' },
        { value: 500000, label: '500k', title: 'Onyx Silver' },
        { value: 1000000, label: '1M', title: 'Onyx Gold' },
    ];

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex justify-between items-end pb-4 border-b border-white/[0.04]">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="premium-badge px-2.5 py-1 rounded-full text-[10px] font-bold text-onyx-400 uppercase tracking-widest">Financeiro</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Painel de Vendas</h1>
                    <p className="text-onyx-400 mt-2 text-sm font-medium">Acompanhamento detalhado de receita, splits e projeções.</p>
                </div>
            </div>

            {/* Main Goal Widget */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 premium-card rounded-3xl p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <Target size={200} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xs font-bold text-onyx-400 uppercase tracking-widest mb-2">Meta de Faturamento (Bruto)</h3>
                                <div className="flex items-baseline gap-3">
                                    <h2 className="text-4xl font-bold text-white tracking-tight">R$ {salesMetrics.grossTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                                    <span className="text-xl text-onyx-600 font-medium">/ {financialGoal.target.toLocaleString('pt-BR')}</span>
                                </div>
                            </div>
                            <button onClick={() => {
                                setTempGoal(financialGoal);
                                setTempSales(salesMetrics.grossTotal);
                                setTempDailyAverage(salesMetrics.manualDailyAverage?.toString() || '');
                                setTempProjectionDays(salesMetrics.manualProjectionDays?.toString() || '');
                                setIsEditingGoal(true);
                            }} className="p-2 rounded-xl hover:bg-white/[0.05] text-onyx-500 hover:text-white transition-colors border border-transparent hover:border-white/[0.05]" title="Editar valores">
                                <Edit2 size={18} />
                            </button>
                        </div>

                        <div className="relative h-6 w-full bg-black/40 rounded-full overflow-hidden border border-white/[0.05] mb-6 shadow-inner">
                            <div
                                className="absolute top-0 left-0 h-full bg-white transition-all duration-1000 ease-out rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                style={{ width: `${percentGoal}%` }}
                            >
                                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.04] backdrop-blur-sm">
                                <div className="text-[10px] text-onyx-500 uppercase font-bold mb-1 tracking-wider">Status</div>
                                <div className="text-white font-bold text-lg">{percentGoal}% Concluído</div>
                            </div>
                            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.04] backdrop-blur-sm">
                                <div className="text-[10px] text-onyx-500 uppercase font-bold mb-1 tracking-wider">Média Diária</div>
                                <div className="text-white font-bold text-lg">R$ {dailyAverage.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
                            </div>
                            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.04] backdrop-blur-sm col-span-2">
                                <div className="text-[10px] text-onyx-500 uppercase font-bold mb-1 flex items-center gap-1 tracking-wider">
                                    <TrendingUp size={12} className="text-green-400" /> Projeção
                                </div>
                                <div className="text-white font-bold text-sm">
                                    Meta atingida em <span className="text-green-400 font-bold">{daysToGoal} dias</span> ({projectedDate.toLocaleDateString()})
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Platform Fees Widget */}
                <div className="premium-card rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <AlertCircle size={100} />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold text-onyx-400 uppercase tracking-widest">Taxas & Deduções</h3>
                            <button onClick={() => { setTempPlatformFee(salesMetrics.platformFeePercentage * 100); setIsEditingTaxes(true); }} className="p-2 rounded-xl hover:bg-white/[0.05] text-onyx-500 hover:text-white transition-colors border border-transparent hover:border-white/[0.05]" title="Editar taxas">
                                <Edit2 size={16} />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-onyx-300 font-medium">Faturamento Bruto</span>
                                    <span className="text-white font-mono font-bold">R$ {salesMetrics.grossTotal.toLocaleString('pt-BR')}</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-red-400 flex items-center gap-1.5 font-medium"><AlertCircle size={12} /> Taxa Plataforma ({(salesMetrics.platformFeePercentage * 100).toFixed(1)}%)</span>
                                    <span className="text-red-400 font-mono font-bold">- R$ {platformFeeAmount.toLocaleString('pt-BR')}</span>
                                </div>
                                <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/[0.05]">
                                    <div className="bg-red-500/50 h-full shadow-[0_0_10px_rgba(239,68,68,0.3)]" style={{ width: `${salesMetrics.platformFeePercentage * 100}%` }}></div>
                                </div>
                            </div>
                            {customTaxes.map((tax, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-orange-400 flex items-center gap-1.5 font-medium"><AlertCircle size={12} /> {tax.name} ({tax.percentage.toFixed(1)}%)</span>
                                        <span className="text-orange-400 font-mono font-bold">- R$ {(salesMetrics.grossTotal * (tax.percentage / 100)).toLocaleString('pt-BR')}</span>
                                    </div>
                                    <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/[0.05]">
                                        <div className="bg-orange-500/50 h-full shadow-[0_0_10px_rgba(249,115,22,0.3)]" style={{ width: `${tax.percentage}%` }}></div>
                                    </div>
                                </div>
                            ))}
                            <div className="pt-5 border-t border-white/[0.05]">
                                <div className="flex justify-between items-end">
                                    <span className="text-white font-bold text-sm uppercase tracking-wide">Receita Líquida</span>
                                    <span className="text-2xl font-bold text-green-400 font-mono tracking-tight text-shadow-glow-green">R$ {netRevenue.toLocaleString('pt-BR')}</span>
                                </div>
                                <p className="text-[10px] text-onyx-500 mt-1.5 font-medium">Valor disponível para split entre sócios.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Split Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Expert Card */}
                <div className="premium-card rounded-3xl p-6 hover:translate-y-[-2px] transition-transform duration-300">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-onyx-800 to-black flex items-center justify-center border border-white/[0.05] text-white shadow-inner">
                            <Users size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg tracking-tight">Expert Share</h3>
                            <p className="text-xs text-onyx-400 font-medium">{(salesMetrics.expertSplitPercentage * 100)}% da Receita Líquida</p>
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white font-mono mb-3 tracking-tight">
                        R$ {expertAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-onyx-400 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.05] inline-flex items-center gap-2 font-medium">
                        <DollarSign size={12} /> Disponível para saque em D+30
                    </div>
                </div>

                {/* Team Card */}
                <div className="premium-card rounded-3xl p-6 hover:translate-y-[-2px] transition-transform duration-300">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-onyx-800 to-black flex items-center justify-center border border-white/[0.05] text-white shadow-inner">
                            <PieIcon size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg tracking-tight">Equipe / Coprodução</h3>
                            <p className="text-xs text-onyx-400 font-medium">{(salesMetrics.teamSplitPercentage * 100)}% da Receita Líquida</p>
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white font-mono mb-3 tracking-tight">
                        R$ {teamAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-onyx-400 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.05] inline-flex items-center gap-2 font-medium">
                        <DollarSign size={12} /> Disponível para saque em D+30
                    </div>
                </div>
            </div>

            {/* Milestones / Plaques Section */}
            <div className="mt-8">
                <div className="flex items-center gap-2 mb-6">
                    <Award size={20} className="text-white" />
                    <h2 className="text-xl font-bold text-white tracking-tight">Conquistas & Placas</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {milestones.map((milestone) => {
                        const isUnlocked = salesMetrics.grossTotal >= milestone.value;
                        const progress = Math.min(100, (salesMetrics.grossTotal / milestone.value) * 100);

                        return (
                            <div key={milestone.label} className={`relative overflow-hidden rounded-3xl border p-6 flex flex-col items-center text-center transition-all duration-500 group ${isUnlocked
                                ? 'bg-gradient-to-b from-white/[0.08] to-black border-white/20 shadow-glow hover:scale-[1.02]'
                                : 'bg-black/40 border-white/[0.02] opacity-60 grayscale'
                                }`}>
                                {/* Glow Effect for Unlocked */}
                                {isUnlocked && <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 pointer-events-none"></div>}

                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 transition-colors relative z-10 ${isUnlocked ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-white/[0.05] text-onyx-600'
                                    }`}>
                                    {isUnlocked ? <Award size={32} fill="currentColor" className="text-black" /> : <Lock size={24} />}
                                </div>

                                <div className={`text-2xl font-bold font-mono tracking-tighter relative z-10 mb-3 ${isUnlocked ? 'text-white text-shadow-glow' : 'text-onyx-500'}`}>
                                    {milestone.label}
                                </div>

                                <div className={`text-[9px] uppercase tracking-widest font-bold relative z-10 border px-3 py-1.5 rounded-full ${isUnlocked ? 'bg-white/10 text-white border-white/20' : 'bg-black/50 text-onyx-600 border-white/[0.05]'}`}>
                                    {milestone.title}
                                </div>

                                {!isUnlocked && (
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-white/[0.05] w-full">
                                        <div className="h-full bg-white/50 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                    </div>
                                )}

                                {isUnlocked && (
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 shadow-[0_0_10px_white]"></div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Edit Financial Goal Modal */}
            {isEditingGoal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={() => setIsEditingGoal(false)}></div>
                    <div className="relative premium-card w-full max-w-md shadow-2xl animate-scale-in flex flex-col max-h-[85vh] rounded-3xl overflow-hidden">
                        <div className="p-6 border-b border-white/[0.04] bg-white/[0.02] flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white tracking-tight">Editar Valores</h2>
                            <button onClick={() => setIsEditingGoal(false)} className="text-onyx-500 hover:text-white transition-colors"><X size={20} /></button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Faturamento Bruto (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={tempSales}
                                    onChange={e => setTempSales(Number(e.target.value))}
                                    className="w-full premium-input rounded-xl px-4 py-3 text-white focus:outline-none font-mono text-lg"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Data Início</label>
                                <input
                                    type="date"
                                    value={tempGoal.startDate}
                                    onChange={e => setTempGoal({ ...tempGoal, startDate: e.target.value })}
                                    className="w-full premium-input rounded-xl px-4 py-3 text-white focus:outline-none [color-scheme:dark]"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Objetivo (R$)</label>
                                <input
                                    type="number"
                                    value={tempGoal.target}
                                    onChange={e => setTempGoal({ ...tempGoal, target: Number(e.target.value) })}
                                    className="w-full premium-input rounded-xl px-4 py-3 text-white focus:outline-none font-mono text-lg"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Média Diária (R$)</label>
                                    <input
                                        type="number"
                                        value={tempDailyAverage}
                                        onChange={e => setTempDailyAverage(e.target.value)}
                                        className="w-full premium-input rounded-xl px-4 py-3 text-white focus:outline-none"
                                        placeholder="Auto"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Dias para Meta</label>
                                    <input
                                        type="number"
                                        value={tempProjectionDays}
                                        onChange={e => setTempProjectionDays(e.target.value)}
                                        className="w-full premium-input rounded-xl px-4 py-3 text-white focus:outline-none"
                                        placeholder="Auto"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/[0.04] bg-white/[0.02]">
                            <button onClick={saveGoal} className="premium-btn w-full text-black font-bold py-3.5 rounded-xl shadow-glow hover:shadow-glow-blue transition-all">
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Taxes Modal */}
            {isEditingTaxes && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={() => setIsEditingTaxes(false)}></div>
                    <div className="relative premium-card w-full max-w-md shadow-2xl animate-scale-in flex flex-col max-h-[85vh] rounded-3xl overflow-hidden">
                        <div className="p-6 border-b border-white/[0.04] bg-white/[0.02] flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white tracking-tight">Editar Taxas & Deduções</h2>
                            <button onClick={() => setIsEditingTaxes(false)} className="text-onyx-500 hover:text-white transition-colors"><X size={20} /></button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Taxa da Plataforma (%)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={tempPlatformFee}
                                    onChange={e => setTempPlatformFee(Number(e.target.value))}
                                    className="w-full premium-input rounded-xl px-4 py-3 text-white focus:outline-none text-lg font-mono"
                                    placeholder="Ex: 5.5"
                                />
                                <p className="text-[10px] text-onyx-500 mt-2 font-medium">Taxa cobrada pela plataforma de pagamento</p>
                            </div>

                            <div className="border-t border-white/[0.05] pt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-[10px] font-bold text-onyx-500 uppercase tracking-wider">Taxas Adicionais</label>
                                    <button onClick={addCustomTax} className="text-[10px] font-bold text-white bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-white/[0.05]">
                                        <Plus size={12} /> Adicionar Taxa
                                    </button>
                                </div>

                                {customTaxes.length === 0 ? (
                                    <p className="text-xs text-onyx-600 text-center py-6 border border-dashed border-white/[0.05] rounded-xl bg-white/[0.01]">
                                        Nenhuma taxa adicional configurada.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {customTaxes.map((tax, idx) => (
                                            <div key={idx} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 flex gap-3 items-start">
                                                <div className="flex-1 space-y-2">
                                                    <input
                                                        type="text"
                                                        value={tax.name}
                                                        onChange={e => updateCustomTax(idx, 'name', e.target.value)}
                                                        className="w-full bg-transparent border-b border-white/[0.1] px-0 py-1 text-white text-sm focus:outline-none focus:border-white"
                                                        placeholder="Nome da taxa"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            value={tax.percentage}
                                                            onChange={e => updateCustomTax(idx, 'percentage', Number(e.target.value))}
                                                            className="w-20 bg-transparent border-b border-white/[0.1] px-0 py-1 text-white text-sm focus:outline-none focus:border-white font-mono"
                                                            placeholder="0.0"
                                                        />
                                                        <span className="text-onyx-500 text-xs">%</span>
                                                    </div>
                                                </div>
                                                <button onClick={() => removeCustomTax(idx)} className="p-2 text-onyx-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/[0.04] bg-white/[0.02]">
                            <button onClick={saveTaxes} className="premium-btn w-full text-black font-bold py-3.5 rounded-xl shadow-glow hover:shadow-glow-blue transition-all">
                                Salvar Taxas
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
