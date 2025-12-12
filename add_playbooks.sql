-- ============================================
-- PLAYBOOKS SYSTEM (MVP 0)
-- Playbook-Powered Kanban
-- ============================================

-- 17. TASK PLAYBOOKS (Many-to-One with Tasks)
create table if not exists public.task_playbooks (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  title text not null,
  type text default 'VIDEO' check (type in ('VIDEO', 'DOCUMENT', 'LINK', 'CHECKLIST')),
  url text not null,
  duration text, -- ex: "4min" para vídeos
  description text,
  order_index int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.task_playbooks enable row level security;

-- Drop existings policies to avoid errors on re-run
drop policy if exists "Users can view playbooks of their tasks" on public.task_playbooks;
drop policy if exists "Users can insert playbooks to their tasks" on public.task_playbooks;
drop policy if exists "Users can update playbooks of their tasks" on public.task_playbooks;
drop policy if exists "Users can delete playbooks of their tasks" on public.task_playbooks;

-- RLS Policies
create policy "Users can view playbooks of their tasks" on public.task_playbooks
  for select using (
    exists (
      select 1 from public.tasks t
      join public.tenant_members tm on tm.tenant_id = t.tenant_id
      where t.id = task_playbooks.task_id
      and tm.user_id = auth.uid()
    )
  );

create policy "Users can insert playbooks to their tasks" on public.task_playbooks
  for insert with check (
    exists (
      select 1 from public.tasks t
      join public.tenant_members tm on tm.tenant_id = t.tenant_id
      where t.id = task_playbooks.task_id
      and tm.user_id = auth.uid()
    )
  );

create policy "Users can update playbooks of their tasks" on public.task_playbooks
  for update using (
    exists (
      select 1 from public.tasks t
      join public.tenant_members tm on tm.tenant_id = t.tenant_id
      where t.id = task_playbooks.task_id
      and tm.user_id = auth.uid()
    )
  );

create policy "Users can delete playbooks of their tasks" on public.task_playbooks
  for delete using (
    exists (
      select 1 from public.tasks t
      join public.tenant_members tm on tm.tenant_id = t.tenant_id
      where t.id = task_playbooks.task_id
      and tm.user_id = auth.uid()
    )
  );

-- Index for faster queries
create index if not exists idx_task_playbooks_task_id on public.task_playbooks(task_id);

-- ============================================
-- Add XP reward column to tasks if columns don't exist
-- ============================================
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'xp_reward') then
        alter table public.tasks add column xp_reward int default 50;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'tasks' and column_name = 'priority') then
        alter table public.tasks add column priority text default 'MEDIUM' check (priority in ('LOW', 'MEDIUM', 'HIGH'));
    end if;
end $$;


-- ============================================
-- PLAYBOOK LIBRARY (Reutilizáveis)
-- Para MVP 1 - Biblioteca de Playbooks
-- ============================================

create table if not exists public.playbook_templates (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  title text not null,
  type text default 'VIDEO' check (type in ('VIDEO', 'DOCUMENT', 'LINK', 'CHECKLIST')),
  url text not null,
  duration text,
  description text,
  tags text[] default '{}',
  usage_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.playbook_templates enable row level security;

-- Drop existings policies
drop policy if exists "Tenant members can view playbook templates" on public.playbook_templates;
drop policy if exists "Tenant members can manage playbook templates" on public.playbook_templates;

create policy "Tenant members can view playbook templates" on public.playbook_templates
  for select using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = playbook_templates.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Tenant members can manage playbook templates" on public.playbook_templates
  for all using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = playbook_templates.tenant_id
      and tenant_members.user_id = auth.uid()
      and tenant_members.role in ('OWNER', 'EDITOR')
    )
  );

-- Index for search
create index if not exists idx_playbook_templates_tenant on public.playbook_templates(tenant_id);
create index if not exists idx_playbook_templates_tags on public.playbook_templates using gin(tags);
