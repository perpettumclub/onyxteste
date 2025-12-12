import React, { useState } from 'react';
import { Lead } from '../types';
import { supabase } from '../services/supabase';
import { Plus, Search, Filter, MoreHorizontal, Mail, Building, DollarSign, Calendar, X, Trash2, Edit } from 'lucide-react';

interface LeadsListProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  tenantId: string | null;
}

export const LeadsList: React.FC<LeadsListProps> = ({ leads, setLeads, tenantId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    value: '',
    status: 'NEW'
  });

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (lead?: Lead) => {
    if (lead) {
      setEditingLead(lead);
      setFormData({
        name: lead.name,
        email: lead.email,
        company: lead.company,
        value: lead.value.toString(),
        status: lead.status
      });
    } else {
      setEditingLead(null);
      setFormData({ name: '', email: '', company: '', value: '', status: 'NEW' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;

    // Optimistic update
    setLeads(prev => prev.filter(l => l.id !== id));

    if (tenantId) {
      await supabase.from('leads').delete().eq('id', id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    if (editingLead) {
      // Optimistic Update
      setLeads(prev => prev.map(l => l.id === editingLead.id ? {
        ...l,
        name: formData.name,
        email: formData.email,
        company: formData.company,
        value: Number(formData.value),
        status: formData.status as any
      } : l));

      // Supabase Update
      await supabase.from('leads').update({
        name: formData.name,
        email: formData.email,
        company: formData.company,
        value: Number(formData.value),
        status: formData.status
      }).eq('id', editingLead.id);

    } else {
      const newLeadId = crypto.randomUUID();
      const newLead: Lead = {
        id: newLeadId,
        name: formData.name,
        email: formData.email,
        company: formData.company,
        value: Number(formData.value),
        status: formData.status as any,
        lastContact: new Date().toISOString().split('T')[0]
      };

      // Optimistic Update (will revert if fails)
      setLeads(prev => [...prev, newLead]);

      // Supabase Insert with Error Handling for Limits
      const { error } = await supabase.from('leads').insert([{
        id: newLeadId,
        tenant_id: tenantId,
        name: formData.name,
        email: formData.email,
        company: formData.company,
        value: Number(formData.value),
        status: formData.status,
        last_contact: new Date().toISOString()
      }]);

      if (error) {
        // Revert optimistic update
        setLeads(prev => prev.filter(l => l.id !== newLeadId));

        if (error.message.includes('Resource limit reached') || error.code === 'P0001') {
          alert('LIMITE ATINGIDO! \n\nVocê atingiu o limite de leads do seu plano atual (Trial/Starter). \nPor favor, faça um upgrade para continuar.');
        } else {
          alert('Erro ao criar lead: ' + error.message);
        }
        return; // Keep modal open
      }
    }
    setIsModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="premium-badge px-2.5 py-1 rounded-full text-[10px] font-bold text-onyx-400 uppercase tracking-widest">CRM</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Gerenciar Leads</h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-onyx-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nome ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.04] rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/[0.1] focus:bg-white/[0.05] transition-all"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="premium-btn flex items-center gap-2 text-black px-5 py-2.5 rounded-xl text-xs font-bold shadow-glow hover:shadow-glow-blue transition-all"
          >
            <Plus size={14} />
            Novo Lead
          </button>
        </div>
      </div>

      {/* Lead Count / Limit Indicator (Optional - could come from useSubscription) */}
      <div className="mb-4 flex justify-end">
        <span className="text-[10px] text-onyx-500 uppercase font-bold tracking-wider">
          Total: {leads.length} Leads
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden premium-card rounded-3xl flex flex-col shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.04] bg-white/[0.02]">
                <th className="py-5 px-6 text-[10px] font-bold text-onyx-500 uppercase tracking-widest">Nome</th>
                <th className="py-5 px-6 text-[10px] font-bold text-onyx-500 uppercase tracking-widest">Empresa</th>
                <th className="py-5 px-6 text-[10px] font-bold text-onyx-500 uppercase tracking-widest">Status</th>
                <th className="py-5 px-6 text-[10px] font-bold text-onyx-500 uppercase tracking-widest">Valor Estimado</th>
                <th className="py-5 px-6 text-[10px] font-bold text-onyx-500 uppercase tracking-widest">Último Contato</th>
                <th className="py-5 px-6 text-[10px] font-bold text-onyx-500 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filteredLeads.map(lead => (
                <tr key={lead.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-onyx-800 to-black border border-white/[0.05] flex items-center justify-center text-xs font-bold text-white shadow-inner">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{lead.name}</div>
                        <div className="text-xs text-onyx-500 flex items-center gap-1.5 font-medium">
                          <Mail size={10} /> {lead.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-sm text-onyx-300 font-medium">
                      <Building size={14} className="text-onyx-600" />
                      {lead.company}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${lead.status === 'WON' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      lead.status === 'LOST' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        lead.status === 'NEW' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          'bg-white/[0.05] text-onyx-400 border-white/[0.05]'
                      }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1 text-sm font-bold text-white font-mono">
                      <span className="text-onyx-600">R$</span> {lead.value.toLocaleString('pt-BR')}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-xs text-onyx-400 font-mono bg-white/[0.02] px-2 py-1 rounded border border-white/[0.02] inline-block">
                      {new Date(lead.lastContact).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenModal(lead)}
                        className="p-2 hover:bg-white/[0.05] rounded-lg text-onyx-400 hover:text-white transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-onyx-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-onyx-500">
                      <Search size={32} className="mb-4 opacity-50" />
                      <p className="text-sm font-medium">Nenhum lead encontrado.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 pb-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative premium-card w-full max-w-md p-0 shadow-2xl animate-scale-in rounded-3xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-white/[0.04] bg-white/[0.02] flex justify-between items-center">
              <h2 className="text-xl font-bold text-white tracking-tight">{editingLead ? 'Editar Lead' : 'Novo Lead'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-onyx-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
              <form id="leadForm" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full premium-input rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full premium-input rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                    placeholder="joao@empresa.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Empresa</label>
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={e => setFormData({ ...formData, company: e.target.value })}
                      className="w-full premium-input rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                      placeholder="Empresa Ltd"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Valor (R$)</label>
                    <input
                      type="number"
                      required
                      value={formData.value}
                      onChange={e => setFormData({ ...formData, value: e.target.value })}
                      className="w-full premium-input rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-onyx-500 uppercase mb-2 tracking-wider">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full premium-input rounded-xl px-4 py-3 text-sm text-white focus:outline-none appearance-none"
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="WON">Won</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-white/[0.04] bg-white/[0.02] flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-onyx-400 hover:text-white transition-colors hover:bg-white/[0.05]">
                Cancelar
              </button>
              <button type="submit" form="leadForm" className="premium-btn text-black px-6 py-2.5 rounded-xl text-xs font-bold shadow-glow hover:shadow-glow-blue transition-all">
                {editingLead ? 'Salvar Alterações' : 'Criar Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};