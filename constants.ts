import { Module, Task, TaskStatus, Lead, Invoice, Post, User, SalesMetrics, Transaction } from './types';

export const CURRENT_USER: User = {
  id: 'u-1',
  name: 'Carlos Expert',
  email: 'carlos@onyx.com',
  role: 'SUPER_ADMIN',
  plan: 'Onyx Pro'
};

export const MOCK_SALES_METRICS: SalesMetrics = {
  grossTotal: 24500.00,
  platformFeePercentage: 0.08, // 8% Platform Fee
  expertSplitPercentage: 0.70, // 70% goes to Expert
  teamSplitPercentage: 0.30    // 30% goes to Team
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', customerName: 'Ana Souza', productName: 'Curso Onyx Master', amount: 997.00, date: '2023-11-06 14:30', status: 'APPROVED' },
  { id: 'tx-2', customerName: 'Bruno Lima', productName: 'Curso Onyx Master', amount: 997.00, date: '2023-11-06 13:15', status: 'APPROVED' },
  { id: 'tx-3', customerName: 'Carla Dias', productName: 'Mentoria Vip', amount: 2500.00, date: '2023-11-05 09:00', status: 'PENDING' },
  { id: 'tx-4', customerName: 'Daniel Rocha', productName: 'Curso Onyx Master', amount: 997.00, date: '2023-11-04 18:45', status: 'REFUNDED' },
  { id: 'tx-5', customerName: 'Elena V.', productName: 'Curso Onyx Master', amount: 997.00, date: '2023-11-04 10:20', status: 'APPROVED' },
];

export const MOCK_TASKS: Task[] = [
  {
    id: 't-1',
    title: 'Definir Big Idea do Lançamento',
    description: 'Reunião estratégica para definir a promessa única do produto.',
    status: TaskStatus.DONE,
    assignee: 'Ana (Estrategista)',
    dueDate: '2023-10-25',
    comments: [
      { id: 'c1', author: 'Carlos Expert', role: 'EXPERT', text: 'Adorei a ideia de focar em liberdade geográfica.', createdAt: '2023-10-24' }
    ]
  },
  {
    id: 't-2',
    title: 'Gravar Criativos de Captação',
    description: 'Gravar 5 variações de vídeos para anúncios de Instagram e Facebook.',
    status: TaskStatus.IN_PROGRESS,
    assignee: 'Carlos Expert',
    dueDate: '2023-11-01',
    comments: []
  },
  {
    id: 't-3',
    title: 'Configurar Página de Captura',
    description: 'Implementar design e integração com ferramenta de email marketing.',
    status: TaskStatus.IN_PROGRESS,
    assignee: 'Dev Team',
    dueDate: '2023-11-03',
    comments: []
  },
  {
    id: 't-4',
    title: 'Escrever Sequência de E-mails',
    description: 'Redação de 7 e-mails de aquecimento para o evento.',
    status: TaskStatus.TODO,
    assignee: 'Copywriter',
    dueDate: '2023-11-05',
    comments: []
  },
  {
    id: 't-5',
    title: 'Revisar Módulo 1 do Curso',
    description: 'Validar se a edição das aulas 1 a 4 está correta.',
    status: TaskStatus.REVIEW,
    assignee: 'Carlos Expert',
    dueDate: '2023-11-10',
    comments: []
  }
];

export const MOCK_MODULES: Module[] = [
  {
    id: 'm-1',
    title: 'Onboarding e Cultura',
    description: 'Comece por aqui para entender como nossa parceria funciona.',
    image: 'linear-gradient(to bottom right, #262626, #404040)', 
    lessons: [
      { id: 'l-1', title: 'Boas-vindas ao Ecossistema', duration: '5:20', type: 'VIDEO', isCompleted: true },
      { id: 'l-2', title: 'Como usar o Kanban', duration: '12:00', type: 'VIDEO', isCompleted: true },
      { id: 'l-3', title: 'Contrato e Expectativas', duration: '3 min', type: 'DOCUMENT', isCompleted: false },
    ]
  },
  {
    id: 'm-2',
    title: 'O Método de Escala',
    description: 'Entenda os pilares que usaremos para escalar seu infoproduto.',
    image: 'linear-gradient(to bottom right, #171717, #262626)',
    lessons: [
      { id: 'l-4', title: 'Pilar 1: Tráfego', duration: '25:00', type: 'VIDEO', isCompleted: false },
      { id: 'l-5', title: 'Pilar 2: Copywriting', duration: '18:30', type: 'VIDEO', isCompleted: false },
      { id: 'l-6', title: 'Pilar 3: Oferta Irresistível', duration: '30:00', type: 'VIDEO', isCompleted: false },
    ]
  },
  {
    id: 'm-3',
    title: 'Gravação e Estúdio',
    description: 'Guia técnico para setup de luz e câmera.',
    image: 'linear-gradient(to bottom right, #404040, #525252)',
    lessons: [
      { id: 'l-7', title: 'Setup Básico (Webcam)', duration: '10:00', type: 'TEXT', isCompleted: false },
      { id: 'l-8', title: 'Setup Pro (DSLR)', duration: '15:00', type: 'VIDEO', isCompleted: false },
    ]
  },
  {
    id: 'm-4',
    title: 'Gestão Financeira',
    description: 'Como organizar o fluxo de caixa do lançamento.',
    image: 'linear-gradient(to bottom right, #1a1a1a, #2f2f2f)',
    lessons: [
      { id: 'l-9', title: 'Planilha de Custos', duration: '10:00', type: 'DOCUMENT', isCompleted: false },
    ]
  }
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p-1',
    author: 'Caleb Hosmer',
    authorRole: 'Operations',
    time: '17d ago',
    title: 'Join WEEKLY OPS! (for free) ✌️🫡',
    content: "We've just launched the Scale Systems Weekly Operations Newsletter... This is your chance to improve the way your business runs with impactful operations insights.",
    likes: 2,
    comments: 0,
    pinned: true,
  },
  {
    id: 'p-2',
    author: 'Muhammad Faizan',
    authorRole: 'Business Talk',
    time: '1d ago',
    title: 'How To Build A STRONG Community Identity',
    content: "In this post, I'm going to cover a topic which I've never seen someone else cover. How to build a strong community identity...",
    likes: 1,
    comments: 1,
    pinned: false,
  },
  {
    id: 'p-3',
    author: 'Nikita Spivakov',
    authorRole: 'Business Talk',
    time: '2d ago',
    title: 'Operator Needed 🔥',
    content: "I am looking for an operator, preferably experienced however not necessary, for a friend of mine.",
    likes: 5,
    comments: 12,
    pinned: false,
  }
];

export const MOCK_LEADS: Lead[] = [
  { id: 'l-1', name: 'Roberto Almeida', email: 'roberto@techcorp.com', company: 'TechCorp', value: 5000, status: 'WON', lastContact: '2023-11-01' },
  { id: 'l-2', name: 'Julia Silva', email: 'julia@designstudio.io', company: 'Design Studio', value: 2500, status: 'QUALIFIED', lastContact: '2023-11-04' },
  { id: 'l-3', name: 'Marcos Souza', email: 'marcos@freelance.net', company: 'Freelancer', value: 1200, status: 'CONTACTED', lastContact: '2023-11-05' },
  { id: 'l-4', name: 'Fernanda Lima', email: 'fernanda@startups.br', company: 'Startup BR', value: 8000, status: 'NEW', lastContact: '2023-11-06' },
  { id: 'l-5', name: 'Paulo Costa', email: 'paulo@enterprise.com', company: 'Enterprise Inc', value: 15000, status: 'LOST', lastContact: '2023-10-20' },
];

export const MOCK_INVOICES: Invoice[] = [
  { id: 'inv-001', date: '01 Nov 2023', amount: 'R$ 299,00', status: 'PAID', planName: 'Onyx Pro Plan' },
  { id: 'inv-002', date: '01 Out 2023', amount: 'R$ 299,00', status: 'PAID', planName: 'Onyx Pro Plan' },
  { id: 'inv-003', date: '01 Set 2023', amount: 'R$ 299,00', status: 'PAID', planName: 'Onyx Pro Plan' },
];