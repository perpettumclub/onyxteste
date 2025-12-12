-- ============================================
-- GAMIFICATION AUTOMATION (MVP 0)
-- Trigger para dar XP e Badge automaticamente
-- ============================================

-- 0. Ensure Tables Exist (Idempotent)
create table if not exists public.achievements (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  icon text,
  xp_reward int default 50,
  condition_type text,
  condition_value int default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.user_achievements (
  user_id uuid references public.profiles(id) on delete cascade not null,
  achievement_id uuid references public.achievements(id) on delete cascade not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, achievement_id)
);

-- 0b. Update Check Constraint for achievements to include FIRST_TASK
do $$
begin
  -- Try to drop constraint if exists
  if exists (select 1 from pg_constraint where conname = 'achievements_condition_type_check') then
    alter table public.achievements drop constraint achievements_condition_type_check;
  end if;
  
  -- Add updated constraint
  alter table public.achievements add constraint achievements_condition_type_check 
  check (condition_type in ('LESSONS_COMPLETED', 'STREAK_DAYS', 'XP_EARNED', 'MODULES_COMPLETED', 'FIRST_LESSON', 'FIRST_COMMENT', 'FIRST_TASK'));
end $$;

-- Enable RLS (safe only if table created)
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

-- Drop existings policies (idempotent)
drop policy if exists "Users can view their own achievements" on public.user_achievements;
drop policy if exists "Users can insert their own achievements" on public.user_achievements;

create policy "Users can view their own achievements" on public.user_achievements
  for select using (auth.uid() = user_id);
create policy "Users can insert their own achievements" on public.user_achievements
  for insert with check (auth.uid() = user_id);

-- 1. Inserir Conquista "Primeira Task"
insert into public.achievements (name, description, icon, xp_reward, condition_type, condition_value)
select 'Primeira Task', 'Completou sua primeira tarefa com sucesso!', '🚀', 50, 'FIRST_TASK', 1
where not exists (select 1 from public.achievements where condition_type = 'FIRST_TASK');

-- 2. Função Trigger: Ao completar task, dar XP e verificar Badge
create or replace function public.handle_task_completion()
returns trigger as $$
declare
  v_xp_reward int;
begin
  -- Só executa se status mudou para DONE
  if new.status = 'DONE' and (old.status != 'DONE' or old.status is null) then
    
    -- Definir XP (usa o da task ou 50 padrão)
    v_xp_reward := 50;
    if to_jsonb(new) ? 'xp_reward' then
        v_xp_reward := coalesce((new.xp_reward), 50);
    end if;

    -- A. Atualizar XP do usuário (ou criar se não existir)
    insert into public.user_gamification (user_id, tenant_id, xp, level, last_activity_date)
    values (new.assignee_id, new.tenant_id, v_xp_reward, 1, current_date)
    on conflict (user_id, tenant_id) do update
    set xp = user_gamification.xp + v_xp_reward,
        last_activity_date = current_date;

    -- B. Verificar e Entregar Badge "Primeira Task"
    if not exists (
      select 1 from public.user_achievements ua
      join public.achievements a on a.id = ua.achievement_id
      where ua.user_id = new.assignee_id
      and a.condition_type = 'FIRST_TASK'
    ) then
      -- Inserir badge
      insert into public.user_achievements (user_id, achievement_id)
      select new.assignee_id, id
      from public.achievements
      where condition_type = 'FIRST_TASK'
      limit 1;
    end if;

  end if;
  return new;
end;
$$ language plpgsql security definer;

-- 3. Criar Trigger na tabela tasks
drop trigger if exists on_task_complete on public.tasks;

create trigger on_task_complete
  after update on public.tasks
  for each row
  execute procedure public.handle_task_completion();
