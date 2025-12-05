import React, { useState } from 'react';
import { FinancialGoal, SalesMetrics, Transaction } from '../types';
import { Target, TrendingUp, AlertCircle, Edit2, X, PieChart as PieIcon, Users, Award, Lock, Plus } from 'lucide-react';

interface SalesDashboardProps {
    financialGoal: FinancialGoal;
    setFinancialGoal: React.Dispatch<React.SetStateAction<FinancialGoal>>;
    salesMetrics: SalesMetrics;
    setSalesMetrics: React.Dispatch<React.SetStateAction<SalesMetrics>>;
    transactions: Transaction[];
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({ financialGoal, setFinancialGoal, salesMetrics, setSalesMetrics }) => {
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [isEditingTaxes, setIsEditingTaxes] = useState(false);
    const [tempGoal, setTempGoal] = useState(financialGoal);
    const [tempSales, setTempSales] = useState(salesMetrics.grossTotal);
    const [tempDailyAverage, setTempDailyAverage] = useState(salesMetrics.manualDailyAverage?.toString() || '');
    const [tempProjectionDays, setTempProjectionDays] = useState(salesMetrics.manualProjectionDays?.toString() || '');
    const [tempPlatformFee, setTempPlatformFee] = useState(salesMetrics.platformFeePercentage * 100);
    const [customTaxes, setCustomTaxes] = useState<{ name: string, percentage: number }[]>([]);

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

    const saveGoal = () => {
        setFinancialGoal(tempGoal);
        setSalesMetrics({
            ...salesMetrics,
            grossTotal: tempSales,
            manualDailyAverage: tempDailyAverage ? Number(tempDailyAverage) : undefined,
            manualProjectionDays: tempProjectionDays ? Number(tempProjectionDays) : undefined
        });
        setIsEditingGoal(false);
    };

    const saveTaxes = () => {
        setSalesMetrics({ ...salesMetrics, platformFeePercentage: tempPlatformFee / 100 });
        setIsEditingTaxes(false);
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
        <div className="space-y-8 pb-16 animate-fade-in-up">
            {/* Header */}
            <div className="flex justify-between items-end pb-4 border-b border-onyx-900">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full bg-onyx-900 text-[10px] font-bold text-onyx-400 border border-onyx-800 uppercase tracking-wider">Financeiro</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Painel de Vendas</h1>
                    <p className="text-onyx-500 mt-2 text-sm">Acompanhamento detalhado de receita, splits e projeções.</p>
                </div>
            </div>

            {/* Main Goal Widget */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gradient-to-br from-onyx-950 to-black border border-onyx-800 rounded-3xl p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <Target size={200} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xs font-bold text-onyx-400 uppercase tracking-widest mb-1">Meta de Faturamento (Bruto)</h3>
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-4xl font-bold text-white">R$ {salesMetrics.grossTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                                    <span className="text-xl text-onyx-600 font-medium">/ {financialGoal.target.toLocaleString('pt-BR')}</span>
                                </div>
                            </div>
                            <button onClick={() => {
                                setTempGoal(financialGoal);
                                setTempSales(salesMetrics.grossTotal);
                                setTempDailyAverage(salesMetrics.manualDailyAverage?.toString() || '');
                                setTempProjectionDays(salesMetrics.manualProjectionDays?.toString() || '');
                                setIsEditingGoal(true);
                            }} className="p-2 rounded-full hover:bg-onyx-900 text-onyx-500 hover:text-white transition-colors bg-black/50 border border-onyx-800" title="Editar valores">
                                <Edit2 size={16} />
                            </button>
                        </div>

                        <div className="relative h-6 w-full bg-onyx-900 rounded-full overflow-hidden border border-onyx-800 mb-4">
                            <div
                                className="absolute top-0 left-0 h-full bg-white transition-all duration-1000 ease-out rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                style={{ width: `${percentGoal}%` }}
                            >
                                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                            <div className="bg-black/40 rounded-xl p-3 border border-onyx-800/50">
                                <div className="text-[10px] text-onyx-500 uppercase font-bold mb-1">Status</div>
                                <div className="text-white font-bold">{percentGoal}% Concluído</div>
                            </div>
                            <div className="bg-black/40 rounded-xl p-3 border border-onyx-800/50">
                                <div className="text-[10px] text-onyx-500 uppercase font-bold mb-1">Média Diária</div>
                                <div className="text-white font-bold">R$ {dailyAverage.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
                            </div>
                            <div className="bg-black/40 rounded-xl p-3 border border-onyx-800/50 col-span-2">
                                <div className="text-[10px] text-onyx-500 uppercase font-bold mb-1 flex items-center gap-1">
                                    <TrendingUp size={12} className="text-green-500" /> Projeção
                                </div>
                                <div className="text-white font-bold text-sm">
                                    Meta atingida em <span className="text-green-400">{daysToGoal} dias</span> ({projectedDate.toLocaleDateString()})
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Platform Fees Widget */}
                <div className="bg-onyx-950 border border-onyx-800 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <AlertCircle size={100} />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-onyx-400 uppercase tracking-widest">Taxas & Deduções</h3>
                            <button onClick={() => { setTempPlatformFee(salesMetrics.platformFeePercentage * 100); setIsEditingTaxes(true); }} className="p-2 rounded-full hover:bg-onyx-900 text-onyx-500 hover:text-white transition-colors bg-black/50 border border-onyx-800" title="Editar taxas">
                                <Edit2 size={14} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-onyx-300">Faturamento Bruto</span>
                                    <span className="text-white font-mono">R$ {salesMetrics.grossTotal.toLocaleString('pt-BR')}</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-red-400 flex items-center gap-1"><AlertCircle size={12} /> Taxa Plataforma ({(salesMetrics.platformFeePercentage * 100).toFixed(1)}%)</span>
                                    <span className="text-red-400 font-mono">- R$ {platformFeeAmount.toLocaleString('pt-BR')}</span>
                                </div>
                                <div className="w-full bg-onyx-900 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-red-900/50 h-full" style={{ width: `${salesMetrics.platformFeePercentage * 100}%` }}></div>
                                </div>
                            </div>
                            {customTaxes.map((tax, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-orange-400 flex items-center gap-1"><AlertCircle size={12} /> {tax.name} ({tax.percentage.toFixed(1)}%)</span>
                                        <span className="text-orange-400 font-mono">- R$ {(salesMetrics.grossTotal * (tax.percentage / 100)).toLocaleString('pt-BR')}</span>
                                    </div>
                                    <div className="w-full bg-onyx-900 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-orange-900/50 h-full" style={{ width: `${tax.percentage}%` }}></div>
                                    </div>
                                </div>
                            ))}
                            <div className="pt-4 border-t border-onyx-800">
                                <div className="flex justify-between items-end">
                                    <span className="text-white font-bold text-sm">Receita Líquida</span>
                                    <span className="text-2xl font-bold text-green-500 font-mono">R$ {netRevenue.toLocaleString('pt-BR')}</span>
                                </div>
                                <p className="text-[10px] text-onyx-500 mt-1">Valor disponível para split entre sócios.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Split Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Expert Card */}
                <div className="bg-onyx-950 border border-onyx-800 rounded-3xl p-6 hover:bg-onyx-900/50 transition-colors">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-onyx-900 flex items-center justify-center border border-onyx-800 text-white">
                            <Users size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Expert Share</h3>
                            <p className="text-xs text-onyx-500">{(salesMetrics.expertSplitPercentage * 100)}% da Receita Líquida</p>
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white font-mono mb-2">
                        R$ {expertAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-onyx-500 bg-onyx-900/50 p-2 rounded-lg border border-onyx-900 inline-block">
                        Disponível para saque em D+30
                    </div>
                </div>

                {/* Team Card */}
                <div className="bg-onyx-950 border border-onyx-800 rounded-3xl p-6 hover:bg-onyx-900/50 transition-colors">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-onyx-900 flex items-center justify-center border border-onyx-800 text-white">
                            <PieIcon size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Equipe / Coprodução</h3>
                            <p className="text-xs text-onyx-500">{(salesMetrics.teamSplitPercentage * 100)}% da Receita Líquida</p>
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white font-mono mb-2">
                        R$ {teamAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-onyx-500 bg-onyx-900/50 p-2 rounded-lg border border-onyx-900 inline-block">
                        Disponível para saque em D+30
                    </div>
                </div>
            </div>

            {/* Milestones / Plaques Section REPLACING Transactions */}
            <div className="mt-8">
                <h2 className="text-xl font-bold text-white mb-6">Conquistas & Placas</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {milestones.map((milestone) => {
                        const isUnlocked = salesMetrics.grossTotal >= milestone.value;
                        const progress = Math.min(100, (salesMetrics.grossTotal / milestone.value) * 100);

                        return (
                            <div key={milestone.label} className={`relative overflow-hidden rounded-3xl border p-5 flex flex-col items-center text-center transition-all duration-500 group ${isUnlocked
                                ? 'bg-gradient-to-b from-onyx-800 to-black border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:scale-[1.02]'
                                : 'bg-onyx-950 border-onyx-900 opacity-60'
                                }`}>
                                {/* Glow Effect for Unlocked */}
                                {isUnlocked && <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 pointer-events-none"></div>}

                                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors relative z-10 ${isUnlocked ? 'bg-white text-black shadow-lg shadow-white/20' : 'bg-onyx-900 text-onyx-600'
                                    }`}>
                                    {isUnlocked ? <Award size={28} fill="currentColor" className="text-black" /> : <Lock size={24} />}
                                </div>

                                <div className={`text-2xl font-bold font-mono tracking-tighter relative z-10 ${isUnlocked ? 'text-white' : 'text-onyx-500'}`}>
                                    {milestone.label}
                                </div>

                                <div className={`text-[10px] uppercase tracking-widest font-bold mt-2 relative z-10 border border-onyx-800 px-2 py-1 rounded-full ${isUnlocked ? 'bg-white/10 text-white' : 'bg-black/50 text-onyx-600'}`}>
                                    {milestone.title}
                                </div>

                                {!isUnlocked && (
                                    <div className="absolute inset-x-0 bottom-0 h-1.5 bg-onyx-900 w-full">
                                        <div className="h-full bg-onyx-600 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                    </div>
                                )}

                                {isUnlocked && (
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-50"></div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Edit Financial Goal Modal */}
            {isEditingGoal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditingGoal(false)}></div>
                    <div className="relative bg-[#0a0a0a] border border-onyx-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Editar Valores</h2>
                            <button onClick={() => setIsEditingGoal(false)} className="text-onyx-500 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-onyx-500 uppercase mb-1">Faturamento Bruto (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={tempSales}
                                    onChange={e => setTempSales(Number(e.target.value))}
                                    className="w-full bg-onyx-900 border border-onyx-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-onyx-500 uppercase mb-1">Data Início</label>
                                <input
                                    type="date"
                                    value={tempGoal.startDate}
                                    onChange={e => setTempGoal({ ...tempGoal, startDate: e.target.value })}
                                    className="w-full bg-onyx-900 border border-onyx-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-onyx-500 uppercase mb-1">Objetivo (R$)</label>
                                <input
                                    type="number"
                                    value={tempGoal.target}
                                    onChange={e => setTempGoal({ ...tempGoal, target: Number(e.target.value) })}
                                    className="w-full bg-onyx-900 border border-onyx-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-onyx-500 uppercase mb-1">Média Diária (R$) <span className="text-[10px] font-normal lowercase">(opcional)</span></label>
                                <input
                                    type="number"
                                    value={tempDailyAverage}
                                    onChange={e => setTempDailyAverage(e.target.value)}
                                    className="w-full bg-onyx-900 border border-onyx-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white"
                                    placeholder="Calculado automaticamente se vazio"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-onyx-500 uppercase mb-1">Dias para Meta <span className="text-[10px] font-normal lowercase">(opcional)</span></label>
                                <input
                                    type="number"
                                    value={tempProjectionDays}
                                    onChange={e => setTempProjectionDays(e.target.value)}
                                    className="w-full bg-onyx-900 border border-onyx-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white"
                                    placeholder="Calculado automaticamente se vazio"
                                />
                            </div>
                            <button onClick={saveGoal} className="w-full bg-white text-black font-bold py-3 rounded-full hover:bg-onyx-200 transition-colors">
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Taxes Modal */}
            {isEditingTaxes && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditingTaxes(false)}></div>
                    <div className="relative bg-[#0a0a0a] border border-onyx-800 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-scale-in max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Editar Taxas & Deduções</h2>
                            <button onClick={() => setIsEditingTaxes(false)} className="text-onyx-500 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-onyx-500 uppercase mb-1">Taxa da Plataforma (%)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={tempPlatformFee}
                                    onChange={e => setTempPlatformFee(Number(e.target.value))}
                                    className="w-full bg-onyx-900 border border-onyx-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white"
                                    placeholder="Ex: 5.5"
                                />
                                <p className="text-[10px] text-onyx-500 mt-1">Taxa cobrada pela plataforma de pagamento</p>
                            </div>

                            <div className="border-t border-onyx-800 pt-4">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-xs font-bold text-onyx-500 uppercase">Taxas Adicionais</label>
                                    <button onClick={addCustomTax} className="text-xs font-bold text-white bg-onyx-800 hover:bg-onyx-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                        <Plus size={12} /> Adicionar Taxa
                                    </button>
                                </div>

                                {customTaxes.length === 0 ? (
                                    <p className="text-xs text-onyx-600 text-center py-4 border border-dashed border-onyx-800 rounded-xl">
                                        Nenhuma taxa adicional. Clique em "Adicionar Taxa" para incluir impostos, taxas administrativas, etc.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {customTaxes.map((tax, idx) => (
                                            <div key={idx} className="bg-onyx-900/50 border border-onyx-800 rounded-xl p-3">
                                                <div className="flex justify-between items-start mb-2">
                                                    <input
                                                        type="text"
                                                        value={tax.name}
                                                        onChange={e => updateCustomTax(idx, 'name', e.target.value)}
                                                        className="flex-1 bg-black border border-onyx-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white mr-2"
                                                        placeholder="Nome da taxa"
                                                    />
                                                    <button onClick={() => removeCustomTax(idx)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={tax.percentage}
                                                    onChange={e => updateCustomTax(idx, 'percentage', Number(e.target.value))}
                                                    className="w-full bg-black border border-onyx-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white"
                                                    placeholder="Percentual (%)"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button onClick={saveTaxes} className="w-full bg-white text-black font-bold py-3 rounded-full hover:bg-onyx-200 transition-colors">
                                Salvar Taxas
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
