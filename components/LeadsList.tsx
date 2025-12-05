import React, { useState } from 'react';
import { Lead } from '../types';
import { Plus, Search, Filter, MoreHorizontal, Mail, Building, DollarSign, Calendar, X, Trash2, Edit } from 'lucide-react';

interface LeadsListProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
}

export const LeadsList: React.FC<LeadsListProps> = ({ leads, setLeads }) => {
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

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lead?')) {
      setLeads(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLead) {
      setLeads(prev => prev.map(l => l.id === editingLead.id ? {
        ...l,
        name: formData.name,
        email: formData.email,
        company: formData.company,
        value: Number(formData.value),
        status: formData.status as any
      } : l));
    } else {
      const newLead: Lead = {
        id: `l-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        company: formData.company,
        value: Number(formData.value),
        status: formData.status as any,
        lastContact: new Date().toISOString().split('T')[0]
      };
      setLeads(prev => [...prev, newLead]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-onyx-900 text-[10px] font-bold text-onyx-400 border border-onyx-800 uppercase tracking-wider">CRM</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Gerenciar Leads</h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-onyx-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nome ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-onyx-950 border border-onyx-800 rounded-full py-2.5 pl-9 pr-4 text-sm text-onyx-200 focus:outline-none focus:border-onyx-600 transition-colors"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full hover:bg-onyx-200 transition-colors text-sm font-bold shadow-lg shadow-white/5 whitespace-nowrap"
          >
            <Plus size={16} />
            Novo Lead
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden bg-onyx-950 border border-onyx-800 rounded-3xl flex flex-col shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-onyx-800 bg-black/20">
                <th className="py-4 px-6 text-xs font-bold text-onyx-500 uppercase tracking-wider">Nome</th>
                <th className="py-4 px-6 text-xs font-bold text-onyx-500 uppercase tracking-wider">Empresa</th>
                <th className="py-4 px-6 text-xs font-bold text-onyx-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-bold text-onyx-500 uppercase tracking-wider">Valor Estimado</th>
                <th className="py-4 px-6 text-xs font-bold text-onyx-500 uppercase tracking-wider">Último Contato</th>
                <th className="py-4 px-6 text-xs font-bold text-onyx-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onyx-800/50">
              {filteredLeads.map(lead => (
                <tr key={lead.id} className="group hover:bg-onyx-900 transition-colors cursor-pointer">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-onyx-800 border border-onyx-700 flex items-center justify-center text-xs font-bold text-white">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{lead.name}</div>
                        <div className="text-xs text-onyx-500 flex items-center gap-1">
                          <Mail size={10} /> {lead.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-sm text-onyx-300">
                      <Building size={14} className="text-onyx-600" />
                      {lead.company}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${lead.status === 'WON' ? 'bg-green-900/20 text-green-400 border-green-900/50' :
                      lead.status === 'LOST' ? 'bg-red-900/20 text-red-400 border-red-900/50' :
                        lead.status === 'NEW' ? 'bg-blue-900/20 text-blue-400 border-blue-900/50' :
                          'bg-onyx-800 text-onyx-300 border-onyx-700'
                      }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1 text-sm font-medium text-white">
                      <span className="text-onyx-600">R$</span> {lead.value.toLocaleString('pt-BR')}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-xs text-onyx-400 font-mono">
                      {new Date(lead.lastContact).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenModal(lead)}
                        className="p-2 hover:bg-onyx-800 rounded-lg text-onyx-400 hover:text-white transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="p-2 hover:bg-red-900/20 rounded-lg text-onyx-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-onyx-500 text-sm">
                    Nenhum lead encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-[#0a0a0a] border border-onyx-800 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{editingLead ? 'Editar Lead' : 'Novo Lead'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-onyx-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-onyx-500 uppercase mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-onyx-900 border border-onyx-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-onyx-600 transition-colors"
                  placeholder="Ex: João Silva"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-onyx-500 uppercase mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-onyx-900 border border-onyx-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-onyx-600 transition-colors"
                  placeholder="joao@empresa.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-onyx-500 uppercase mb-1">Empresa</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-onyx-900 border border-onyx-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-onyx-600 transition-colors"
                    placeholder="Empresa Ltd"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-onyx-500 uppercase mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    required
                    value={formData.value}
                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                    className="w-full bg-onyx-900 border border-onyx-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-onyx-600 transition-colors"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-onyx-500 uppercase mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-onyx-900 border border-onyx-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-onyx-600 transition-colors appearance-none"
                >
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="WON">Won</option>
                  <option value="LOST">Lost</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-full text-sm font-bold text-onyx-400 hover:text-white transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-bold hover:bg-onyx-200 transition-colors shadow-lg shadow-white/10">
                  {editingLead ? 'Salvar Alterações' : 'Criar Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};