# Onyx - Guia Passo a Passo (Roadmap Ajustado)

> "De 20 horas ensinando para 2 horas. Em 30 dias ou dinheiro de volta."

---

## 🎯 Killer Feature: Playbook-Powered Kanban

Cada tarefa é autoexplicativa. Zero interrupções.

```
┌──────────────────────────────────────┐
│ 📋 Criar anúncio Facebook            │
│ 👤 João | 📅 22/12                   │
├──────────────────────────────────────┤
│ 📚 PLAYBOOKS:                        │
│ ▶️ Como criar anúncio (4min)         │
│ ☑️ Checklist aprovação (3 itens)     │
│ 🔗 Template Canva                    │
│ 📄 Briefing cliente                  │
├──────────────────────────────────────┤
│ 🎮 +50 XP | Badge: "Criativo"       │
│ [Concluir]                           │
└──────────────────────────────────────┘
```

---

## 📅 Roadmap Ajustado

### Mês 1: MVP 0 - Proof of Concept

**Objetivo:** Validar se Playbook-Powered Kanban resolve a dor.

#### Semana 1-2: Setup
- [ ] Configurar Supabase (Auth + DB)
- [ ] Criar schema básico (tasks, playbooks)
- [ ] Kanban funcional (criar, mover, deletar)
- [ ] Deploy em `beta.onyxclub.com`

#### Semana 3-4: Core Feature
- [ ] Card com link de vídeo (YouTube/Vimeo)
- [ ] Checklist dentro do card
- [ ] Marcar task como concluída
- [ ] XP básico ao completar (+50 XP)

#### Validação
- [ ] 5 beta users PAGANDO R$ 47/mês
- [ ] Entrevistas semanais: "Isso resolve a dor?"
- [ ] Métrica: 80% acessam Playbook antes de perguntar

---

### Mês 2-3: MVP 1 - Core Product

**Objetivo:** 20 clientes pagando R$ 197/mês = R$ 4.000 MRR

#### Features
- [ ] Multi-tenant básico (1 agência → N clientes)
- [ ] Permissões (Owner, Editor, Viewer)
- [ ] Biblioteca de Playbooks reutilizáveis
- [ ] Busca de Playbooks por nome/tag
- [ ] Analytics: "Playbook X usado Y vezes"

#### UX
- [ ] Onboarding guiado (tour interativo)
- [ ] Estados vazios informativos
- [ ] Notificações (task atribuída, prazo próximo)

#### Aquisição
- [ ] LinkedIn outbound (20 DMs/dia)
- [ ] 3 posts/semana no LinkedIn
- [ ] Landing page com calculadora de ROI

---

### Mês 4-6: V1.0 - Growth

**Objetivo:** 80 clientes = R$ 24.000 MRR

#### Features
- [ ] Onboarding automatizado para clientes finais
- [ ] Steps customizáveis (checklist visual)
- [ ] Emails automáticos (nudges de progresso)
- [ ] Streaks & badges completos
- [ ] Dashboard de gestor (quem fez o quê)

#### Integrações
- [ ] Slack (notificações)
- [ ] Zapier (automações externas)
- [ ] Webhook para eventos

#### Aquisição
- [ ] 1 webinar/mês ("Como Comprar de Volta 15h/Semana")
- [ ] 2 parcerias com consultorias de agências
- [ ] Case studies publicados

---

### Mês 7-12: V2.0 - Scale

**Objetivo:** 200 clientes = R$ 60.000 MRR

#### Features Premium
- [ ] IA: Auto-gerar checklists do vídeo (tier Agency+)
- [ ] IA: Sugerir Playbooks similares
- [ ] White-label (logo do cliente)
- [ ] API pública

#### Integrações Avançadas
- [ ] Asaas/Stripe para billing
- [ ] HubSpot/Pipedrive sync
- [ ] Google Drive/Dropbox

#### Aquisição
- [ ] SDR dedicado para outbound
- [ ] 5+ parcerias ativas
- [ ] Programa de afiliados (20% recorrente)

---

## 💰 Pricing Ajustado

| Tier | Preço | Para Quem | Limites |
|------|-------|-----------|---------|
| **Team** | R$ 197/mês | Agência pequena | 5 projetos, 10 pessoas |
| **Agency** | R$ 397/mês | Agência média | 15 projetos, 25 pessoas |
| **Enterprise** | R$ 997/mês | Agência grande | Ilimitado + API + White-label |

> **Nota:** Removido tier Solo (R$ 147). Infoprodutor solo não tem a dor de "20h ensinando".

---

## 📊 Métricas de Sucesso

### Mês 3 (Fim do MVP 1)
- [ ] 20 clientes pagantes
- [ ] NPS > 40
- [ ] 80% usuários acessam Playbooks semanalmente

### Mês 6 (Fim do V1.0)
- [ ] 80 clientes
- [ ] Churn < 7%
- [ ] 3 case studies com ROI > 10x

### Mês 12 (Fim do V2.0)
- [ ] 200 clientes
- [ ] MRR > R$ 60.000
- [ ] 50% novos clientes via referral/orgânico

---

## � Stack Técnico

```
Frontend: React + TypeScript + Tailwind + Vite
Backend: Supabase (PostgreSQL + Auth + Storage + RLS)
Video: YouTube/Vimeo embed (MVP) → Mux (V2.0)
Payments: Stripe
Analytics: PostHog
```

---

## ⏱️ Próximos 7 Dias

1. [ ] Revisar schema.sql atual vs. schema do PRD
2. [ ] Criar componente PlaybookCard (vídeo + checklist)
3. [ ] Adicionar XP ao completar task
4. [ ] Deploy versão beta
5. [ ] Recrutar 3 beta testers

---

## 🔄 Como Reverter

```bash
# Ver histórico
git log --oneline

# Reverter para backup
git checkout [hash] -- .
```
