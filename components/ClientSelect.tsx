import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Hexagon, Plus, ArrowRight, Users, LogOut } from 'lucide-react';

const MOCK_CLIENTS = [
    { id: '1', name: 'Onyx Club', role: 'ADMIN', members: 1240, plan: 'Enterprise' },
    { id: '2', name: 'Mentoria High Ticket', role: 'EXPERT', members: 85, plan: 'Pro' },
    { id: '3', name: 'Comunidade Alpha', role: 'MEMBER', members: 450, plan: 'Basic' },
];

export const ClientSelect: React.FC = () => {
    const navigate = useNavigate();
    const [isCreating, setIsCreating] = React.useState(false);
    const [clients, setClients] = React.useState(MOCK_CLIENTS);
    const [newClient, setNewClient] = React.useState({ name: '', role: 'ADMIN', plan: 'Pro' });

    const handleSelectClient = (clientId: string) => {
        // Save selected client context
        localStorage.setItem('selectedClientId', clientId);
        navigate('/dashboard');
    };

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
    };

    const handleCreateClient = () => {
        if (!newClient.name) return;

        const client = {
            id: String(Date.now()),
            name: newClient.name,
            role: newClient.role,
            members: 0,
            plan: newClient.plan
        };

        setClients([...clients, client]);
        setIsCreating(false);
        setNewClient({ name: '', role: 'ADMIN', plan: 'Pro' });
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-onyx-900/10 rounded-full blur-[150px]"></div>
            </div>

            <div className="w-full max-w-4xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                            <Hexagon className="w-6 h-6 text-black fill-black" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Onyx Club</h1>
                            <p className="text-xs text-onyx-500 uppercase tracking-wider">Selecione uma área</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-onyx-500 hover:text-white transition-colors text-sm font-medium px-4 py-2 rounded-full hover:bg-onyx-900"
                    >
                        <LogOut size={16} /> Sair
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clients.map((client) => (
                        <button
                            key={client.id}
                            onClick={() => handleSelectClient(client.id)}
                            className="group bg-onyx-950 border border-onyx-800 rounded-3xl p-6 hover:border-onyx-600 hover:bg-onyx-900 transition-all text-left relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-300">
                                <ArrowRight className="text-white" />
                            </div>

                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-onyx-800 to-black border border-onyx-700 mb-6 flex items-center justify-center text-xl font-bold text-white shadow-inner">
                                {client.name.charAt(0)}
                            </div>

                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-white transition-colors">{client.name}</h3>

                            <div className="flex items-center gap-4 text-xs text-onyx-500 mb-4">
                                <span className="bg-onyx-900 px-2 py-1 rounded border border-onyx-800 uppercase font-bold tracking-wide">{client.role}</span>
                                <span className="flex items-center gap-1"><Users size={12} /> {client.members} membros</span>
                            </div>

                            <div className="w-full h-1 bg-onyx-900 rounded-full overflow-hidden">
                                <div className="h-full bg-onyx-700 w-2/3 group-hover:bg-white transition-colors duration-500"></div>
                            </div>
                        </button>
                    ))}

                    {/* Add New Client Card */}
                    <button
                        onClick={() => setIsCreating(true)}
                        className="group bg-black border border-dashed border-onyx-800 rounded-3xl p-6 hover:border-onyx-600 hover:bg-onyx-900/30 transition-all flex flex-col items-center justify-center text-center min-h-[200px]"
                    >
                        <div className="w-12 h-12 rounded-full bg-onyx-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Plus className="text-onyx-400 group-hover:text-white" />
                        </div>
                        <h3 className="text-sm font-bold text-onyx-300 group-hover:text-white mb-1">Criar Nova Área</h3>
                        <p className="text-xs text-onyx-600 max-w-[150px]">Adicione um novo cliente ou projeto ao seu portfólio</p>
                    </button>
                </div>
            </div>

            {/* Create Client Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCreating(false)}></div>
                    <div className="relative bg-[#0a0a0a] border border-onyx-800 rounded-3xl w-full max-w-md p-8 shadow-2xl animate-scale-in">
                        <h2 className="text-2xl font-bold text-white mb-6">Nova Área de Membros</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-onyx-500 uppercase mb-1">Nome do Projeto</label>
                                <input
                                    type="text"
                                    value={newClient.name}
                                    onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                                    className="w-full bg-onyx-900 border border-onyx-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white"
                                    placeholder="Ex: Mentoria Elite"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-onyx-500 uppercase mb-1">Seu Papel</label>
                                <select
                                    value={newClient.role}
                                    onChange={e => setNewClient({ ...newClient, role: e.target.value })}
                                    className="w-full bg-onyx-900 border border-onyx-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white"
                                >
                                    <option value="ADMIN">Administrador</option>
                                    <option value="EXPERT">Expert / Produtor</option>
                                    <option value="MEMBER">Membro</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-onyx-500 uppercase mb-1">Plano</label>
                                <select
                                    value={newClient.plan}
                                    onChange={e => setNewClient({ ...newClient, plan: e.target.value })}
                                    className="w-full bg-onyx-900 border border-onyx-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white"
                                >
                                    <option value="Basic">Basic</option>
                                    <option value="Pro">Pro</option>
                                    <option value="Enterprise">Enterprise</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 bg-onyx-900 text-white font-bold py-3 rounded-full hover:bg-onyx-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateClient}
                                    className="flex-1 bg-white text-black font-bold py-3 rounded-full hover:bg-onyx-200 transition-colors"
                                >
                                    Criar Área
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
