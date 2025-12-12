# Product Requirements Document (PRD)
## Onyx Onboarding - Sistema Operacional para Negócios Digitais

**Versão:** 2.0  
**Data:** Dezembro 2024  
**Responsável:** [Seu Nome]  
**Status:** Em Desenvolvimento

---

## 1. VISÃO EXECUTIVA

### 1.1 Problema
Infoprodutores brasileiros gastam em média R$ 800-1.500/mês gerenciando 5-8 ferramentas diferentes (Hotmart, Notion, Trello, RD Station, Google Sheets). Isso gera:
- 4-6 horas/semana em trabalho administrativo
- Dados fragmentados que dificultam tomada de decisão
- Curva de aprendizado multiplicada
- Risco de erros na integração manual de dados

### 1.2 Solução
Plataforma all-in-one que unifica gestão de cursos, CRM, finanças e projetos em uma única interface gamificada, reduzindo custos em 60% e tempo administrativo em 70%.

### 1.3 Target Audience (Persona Principal)
**"Marina, a Coach em Crescimento"**
- 32 anos, coach de carreira
- Fatura R$ 15-40k/mês com mentorias e cursos
- Usa Kiwify (R$ 97) + Notion (R$ 40) + Trello (R$ 50) + Pipedrive (R$ 350)
- Dores: "Perco vendas porque esqueço de follow-up" / "Não sei quais alunos estão engajados"
- Comportamento: Quer simplicidade, valoriza design, usa Instagram

**Personas Secundárias:**
- Pedro, Agência de Lançamentos (multi-cliente, escala)
- Lucas, Criador de Conteúdo Educacional (gamificação, comunidade)

### 1.4 Proposta de Valor Única
> "O único sistema que transforma seu negócio digital em um jogo onde você sempre sabe o próximo passo e seus alunos não desistem no meio do caminho."

**Diferenciadores:**
1. Gamificação nativa (não é um add-on)
2. Multi-tenant sem custo extra
3. Interface brasileira, suporte em PT-BR
4. Preço 60% menor que somar concorrentes

### 1.5 Objetivos de Negócio (12 meses)
- **MRR:** R$ 50.000 (250 clientes pagantes)
- **Churn:** < 5% mensal
- **NPS:** > 50
- **CAC Payback:** < 6 meses

---

## 2. ESPECIFICAÇÕES FUNCIONAIS

### 2.1 MVP (Mínimo Produto Viável) - Mês 1-2

#### Feature 1: Dashboard Financeiro Simplificado
**Prioridade:** MUST HAVE  
**User Story:**  
> Como infoprodutor, quero ver minhas vendas do mês em um gráfico simples, para saber se bati minha meta sem abrir planilhas.

**Requisitos:**
- [ ] Cartões com totais: Receita, Despesas, Lucro, Meta
- [ ] Gráfico de barras: Receita por mês (últimos 6 meses)
- [ ] Adicionar transação manual (Receita/Despesa)
- [ ] Definir meta financeira mensal
- [ ] Exportar relatório em PDF

**Critérios de Aceite:**
- Dashboard carrega em < 2 segundos
- Gráfico é responsivo (mobile/desktop)
- Transações são salvas em tempo real
- Meta aparece como linha tracejada no gráfico

**Métricas de Sucesso:**
- 80% dos usuários ativos acessam o dashboard nos primeiros 7 dias
- 50% definem uma meta financeira na primeira semana

---

#### Feature 2: Área de Membros Básica
**Prioridade:** MUST HAVE  
**User Story:**  
> Como criador de curso, quero hospedar meus vídeos e organizar em módulos, para que meus alunos acessem o conteúdo de forma estruturada.

**Requisitos:**
- [ ] Criar curso com título, descrição e thumbnail
- [ ] Criar módulos dentro de cursos
- [ ] Criar aulas (vídeo, texto, PDF)
- [ ] Player de vídeo com controles básicos (play, pause, velocidade)
- [ ] Barra de progresso do curso para alunos
- [ ] Marcar aula como concluída

**Limitações Técnicas:**
- **Storage:** 10GB (Starter), 50GB (Pro), 200GB (Business)
- **Vídeo:** Max 500MB por arquivo, formatos MP4/WEBM
- **Streaming:** Vidstack com HLS para vídeos > 100MB

**Critérios de Aceite:**
- Vídeos carregam em < 5 segundos (conexão 4G)
- Progresso é salvo automaticamente a cada 30 segundos
- Aluno consegue retomar de onde parou

**Métricas de Sucesso:**
- Taxa de conclusão de aulas > 60%
- Tempo médio de sessão > 15 minutos
- < 2% de reports de bugs no player

---

#### Feature 3: CRM Simplificado (Funil de Vendas)
**Prioridade:** SHOULD HAVE  
**User Story:**  
> Como vendedor, quero mover leads em um funil visual, para acompanhar onde cada cliente está no processo de venda.

**Requisitos:**
- [ ] Criar lead (Nome, Email, Telefone, Valor, Etapa)
- [ ] Funil com 5 etapas: Novo → Contatado → Qualificado → Proposta → Ganho/Perdido
- [ ] Arrastar e soltar leads entre etapas
- [ ] Adicionar notas em cada lead
- [ ] Filtros: Data, Valor, Etapa

**Limitações:**
- Max 500 leads (Starter), 2000 (Pro), ilimitado (Business)

**Critérios de Aceite:**
- Drag & drop funciona em touch (mobile)
- Notificação quando lead fica 7 dias sem movimento
- Cálculo automático de taxa de conversão por etapa

**Métricas de Sucesso:**
- 40% dos usuários criam ao menos 10 leads no primeiro mês
- 25% movem leads diariamente

---

### 2.2 V1.0 (Pós-MVP) - Mês 3-4

#### Feature 4: Gamificação Completa
**Prioridade:** SHOULD HAVE  
**User Story:**  
> Como aluno, quero ganhar XP e badges ao completar aulas, para me sentir motivado a terminar o curso.

**Sistema de Pontos:**
- Assistir aula completa: +10 XP
- Completar módulo: +50 XP
- Streak de 7 dias: +100 XP
- Completar curso: +500 XP

**Níveis:**
1. Iniciante (0-100 XP)
2. Aprendiz (100-500 XP)
3. Estudante (500-1500 XP)
4. Expert (1500-5000 XP)
5. Mestre (5000+ XP)

**Badges:**
- 🔥 "Maratonista" - 5 aulas em 1 dia
- 📚 "Estudante Dedicado" - 30 dias de streak
- 🎓 "Primeiro Graduado" - Completar primeiro curso
- ⚡ "Velocista" - Completar curso em < 7 dias

**Critérios de Aceite:**
- XP atualiza instantaneamente após ação
- Badge aparece em modal animado
- Leaderboard atualiza a cada 5 minutos

**Métricas de Sucesso:**
- Aumento de 30% na taxa de conclusão vs. não-gamificado
- 70% dos usuários desbloqueiam ao menos 1 badge

---

#### Feature 5: Gestão de Tarefas (Kanban)
**Prioridade:** COULD HAVE  
**User Story:**  
> Como infoprodutor, quero organizar meu lançamento em um quadro kanban, para visualizar o que está pendente.

**Requisitos:**
- [ ] Criar quadro com colunas: TODO, IN_PROGRESS, DONE
- [ ] Adicionar cards com título, descrição, prazo
- [ ] Arrastar cards entre colunas
- [ ] Atribuir tarefa a membros do time
- [ ] Filtros: Por responsável, Por prazo

**Limitações:**
- Max 3 quadros (Starter), 10 (Pro), ilimitado (Business)

**Métricas de Sucesso:**
- 30% dos usuários criam ao menos 1 quadro
- 15% usam semanalmente

---

### 2.3 V2.0 (Futuro) - Mês 5-6

#### Feature 6: Automações & Integrações
**Prioridade:** COULD HAVE  
- Zapier/Make.com integration
- Webhooks para eventos (nova venda, lead criado)
- Email marketing nativo (ou integração com Brevo)
- WhatsApp Business API

#### Feature 7: Relatórios Avançados
- Cohort analysis (retenção de alunos)
- Previsão de churn com IA
- ROI por canal de aquisição
- Exportação para Google Data Studio

---

## 3. ESPECIFICAÇÕES NÃO-FUNCIONAIS

### 3.1 Performance
- **Tempo de Carregamento:** < 2s (First Contentful Paint)
- **Uptime:** 99.5% (máximo 3.6h downtime/mês)
- **API Response Time:** < 500ms (p95)
- **Capacidade:** 10.000 usuários simultâneos

### 3.2 Segurança
- **Autenticação:** Supabase Auth (OAuth + Magic Link)
- **Dados:** Criptografia AES-256 em repouso
- **LGPD:** Exportação de dados em JSON, direito ao esquecimento
- **Backups:** Diários, retenção de 30 dias
- **RLS (Row Level Security):** Habilitado em todas as tabelas

### 3.3 Compatibilidade
- **Browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile:** iOS 14+, Android 10+
- **Resolução:** 320px (mobile) até 4K (desktop)

### 3.4 Acessibilidade
- **WCAG 2.1 Nível AA:**
  - Contraste mínimo 4.5:1
  - Navegação por teclado
  - Screen reader friendly
  - Legendas em vídeos

---

## 4. ARQUITETURA TÉCNICA

### 4.1 Stack
- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Video:** Vidstack Player + Bunny CDN (streaming)
- **Payments:** Stripe Checkout + Customer Portal
- **Monitoring:** Sentry (errors) + PostHog (analytics)

### 4.2 Banco de Dados (Schema Simplificado)
```sql
-- Usuários e Autenticação
users (id, email, name, avatar_url, created_at)

-- Multi-Tenant
clients (id, owner_id, name, slug, settings)
client_members (client_id, user_id, role)

-- Financeiro
financial_goals (id, client_id, month, target_amount)
transactions (id, client_id, type, amount, description, date)

-- Cursos
courses (id, client_id, title, description, thumbnail)
modules (id, course_id, title, order)
lessons (id, module_id, title, type, content, video_url, duration)
user_progress (user_id, lesson_id, completed_at, watch_time)

-- Gamificação
user_stats (user_id, client_id, xp, level, streak_days)
achievements (id, name, description, icon, xp_reward)
user_achievements (user_id, achievement_id, unlocked_at)

-- CRM
leads (id, client_id, name, email, phone, value, stage, notes)

-- Tarefas
boards (id, client_id, name)
tasks (id, board_id, title, description, status, assignee_id, due_date)
```

### 4.3 Integrações Externas
| Serviço | Propósito | Custo Estimado |
|---------|-----------|----------------|
| Supabase | Backend + Auth + DB | $25/mês (Pro) |
| Bunny CDN | Streaming de vídeo | $0.01/GB |
| Stripe | Pagamentos | 3.99% + R$ 0.39/transação |
| Resend | Email transacional | $20/mês (50k emails) |
| Sentry | Error tracking | Grátis (até 5k eventos) |

**Custo Total por Cliente:**
- Até 100 clientes: ~$150/mês
- 100-500 clientes: ~$400/mês
- 500-1000 clientes: ~$800/mês

---

## 5. MODELO DE NEGÓCIO

### 5.1 Pricing
| Plano | Preço | Clientes | Storage | Leads | Gamificação |
|-------|-------|----------|---------|-------|-------------|
| **Starter** | R$ 97/mês | 1 | 10GB | 500 | ❌ |
| **Pro** | R$ 197/mês | 3 | 50GB | 2000 | ✅ |
| **Business** | R$ 397/mês | Ilimitado | 200GB | Ilimitado | ✅ + White-label |

### 5.2 Economia de Custos (Pitch)
**Sem Onyx:**
- Kiwify: R$ 97/mês
- Notion: R$ 48/mês
- Trello: R$ 50/mês
- Pipedrive: R$ 350/mês
- **Total: R$ 545/mês**

**Com Onyx Pro:**
- R$ 197/mês
- **Economia: R$ 348/mês (64%)**

---

## 6. GO-TO-MARKET

### 6.1 Canais de Aquisição (Primeiros 6 meses)
1. **SEO/Content Marketing (40% do budget)**
   - 20 artigos/mês em blog próprio
   - Keywords: "melhor plataforma para cursos online", "CRM para infoprodutores"
   
2. **Parcerias com Influencers (30%)**
   - 5 micro-influencers (10-50k seguidores)
   - Afiliados: 20% recorrente por 12 meses

3. **Ads Pagos (20%)**
   - Google Ads: Keywords de intenção alta
   - Meta Ads: Lookalike de clientes beta

4. **Community-Led Growth (10%)**
   - Grupo no Telegram com dicas semanais
   - Lives mensais sobre gestão de negócios digitais

### 6.2 Onboarding (Crítico!)
**Primeiros 5 Minutos:**
1. Pergunta: "Qual seu principal objetivo?" (Aumentar vendas / Engajar alunos / Organizar projetos)
2. Template pré-configurado baseado na resposta
3. Tour interativo: "Clique aqui para criar seu primeiro curso"
4. Checklist de setup (6 tarefas, gamificado com XP)

**Primeiros 7 Dias:**
- Email D+1: "Vídeo: Como importar seus alunos"
- Email D+3: "Case: Como Marina aumentou vendas em 40%"
- Email D+7: "Você desbloqueou 50% das features! Que tal testar o CRM?"

**Meta:** 60% de ativação (usuário completa 3+ ações) em 7 dias

---

## 7. MÉTRICAS & KPIs

### 7.1 Product Metrics (Dashboard Semanal)
| Métrica | Target | Atual | Trend |
|---------|--------|-------|-------|
| **WAU** (Weekly Active Users) | 200 | - | - |
| **Stickiness** (DAU/MAU) | 40% | - | - |
| **Feature Adoption** (% que usam CRM) | 50% | - | - |
| **Time to Value** (dias até 1ª venda) | < 7 dias | - | - |

### 7.2 Business Metrics
| Métrica | Target Mês 6 | Target Mês 12 |
|---------|--------------|---------------|
| **MRR** | R$ 20.000 | R$ 50.000 |
| **Churn Rate** | < 7% | < 5% |
| **CAC** | R$ 150 | R$ 120 |
| **LTV** | R$ 1.800 | R$ 2.400 |
| **LTV/CAC Ratio** | 12x | 20x |

### 7.3 Experimentos (A/B Tests Planejados)
1. **Pricing Page:** Plano anual com 20% desconto vs. 30% desconto
2. **Onboarding:** Checklist gamificado vs. Tutorial em vídeo
3. **CTA:** "Comece Grátis" vs. "Teste por 14 Dias"

---

## 8. RISCOS & MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Churn alto por complexidade** | Alta | Alto | Simplificar MVP, onboarding obrigatório |
| **Competição de gigantes** | Alta | Médio | Focar nicho (coaches), diferenciação por gamificação |
| **Custos de infra explodem** | Média | Alto | Monitorar uso, limites por plano, CDN com cache |
| **Bugs críticos no player de vídeo** | Média | Alto | QA rigoroso, fallback para Vimeo/YouTube embed |
| **LGPD/Compliance** | Baixa | Alto | Consultor jurídico, termos de uso + privacidade |

---

## 9. DEPENDÊNCIAS & BLOCKERS

### 9.1 Pré-Requisitos para Lançamento
- [ ] 20 usuários beta testando por 30 dias
- [ ] Taxa de bugs críticos < 1%
- [ ] Documentação completa (Help Center)
- [ ] Termos de Uso + Política de Privacidade
- [ ] Integração Stripe testada (sandbox)

### 9.2 Decisões Pendentes
- [ ] White-label no plano Business: Sim ou Não?
- [ ] Aceitar pagamento via Pix/Boleto ou só cartão?
- [ ] Oferecer plano vitalício (lifetime deal)?

---

## 10. CRONOGRAMA (Próximos 6 Meses)

```
Mês 1-2: MVP
├─ Semana 1-2: Dashboard Financeiro
├─ Semana 3-4: Área de Membros Básica
├─ Semana 5-6: CRM Simplificado
└─ Semana 7-8: Beta Privado (50 usuários)

Mês 3-4: V1.0
├─ Gamificação Completa
├─ Kanban de Tarefas
└─ Lançamento Público

Mês 5-6: Growth & Iteração
├─ Automações & Integrações
├─ Relatórios Avançados
└─ Escala para 500 usuários
```

---

## 11. APROVAÇÕES

| Stakeholder | Role | Status | Data |
|-------------|------|--------|------|
| [Seu Nome] | Product Lead | ✅ Aprovado | - |
| [CTO] | Tech Lead | ⏳ Pendente | - |
| [CFO] | Financeiro | ⏳ Pendente | - |

---

## 12. REFERÊNCIAS

- [Comparativo de Features vs. Concorrentes](link)
- [Pesquisa com 50 Infoprodutores](link)
- [Análise de Churn de SaaS Similares](link)
- [Benchmarks de Gamificação em EdTech](link)

---

**Última Atualização:** Dezembro 2024  
**Próxima Revisão:** Janeiro 2025
