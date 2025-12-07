-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'USER' check (role in ('USER', 'ADMIN', 'SUPER_ADMIN')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Profile Policies
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Trigger to auto-create profile on signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. TENANTS (Projects/Clients)
create table public.tenants (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique,
  owner_id uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tenants enable row level security;

-- 3. TENANT MEMBERS (Many-to-Many)
create table public.tenant_members (
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'VIEWER' check (role in ('OWNER', 'EDITOR', 'VIEWER')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (tenant_id, user_id)
);

alter table public.tenant_members enable row level security;

-- 4. TASKS (Kanban)
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  title text not null,
  description text,
  status text default 'TODO' check (status in ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE')),
  assignee_id uuid references public.profiles(id),
  due_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tasks enable row level security;

-- 5. LEADS (CRM)
create table public.leads (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  email text,
  company text,
  value numeric default 0,
  status text default 'NEW' check (status in ('NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST')),
  last_contact timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.leads enable row level security;

-- 6. MODULES (LMS)
create table public.modules (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  title text not null,
  description text,
  image_url text,
  order_index int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.modules enable row level security;

-- 7. LESSONS
create table public.lessons (
  id uuid default uuid_generate_v4() primary key,
  module_id uuid references public.modules(id) on delete cascade not null,
  title text not null,
  duration text,
  type text default 'VIDEO' check (type in ('VIDEO', 'TEXT', 'DOCUMENT')),
  content_url text,
  order_index int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.lessons enable row level security;

-- 8. LESSON PROGRESS
create table public.lesson_progress (
  user_id uuid references public.profiles(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  is_completed boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, lesson_id)
);

alter table public.lesson_progress enable row level security;

-- RLS POLICIES (Simplified for MVP)
-- Allow read/write if user is a member of the tenant
create policy "Tenant members can view tasks" on public.tasks
  for select using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = tasks.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Tenant members can insert tasks" on public.tasks
  for insert with check (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = tasks.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Tenant members can update tasks" on public.tasks
  for update using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = tasks.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

-- Repeat similar policies for leads, modules, lessons...
-- For MVP, we might want to be permissive or just use these patterns.

-- 9. POSTS (Feed)
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  author_id uuid references public.profiles(id),
  content text not null,
  likes int default 0,
  comments int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.posts enable row level security;

-- 10. TRANSACTIONS (Financial)
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  description text not null,
  amount numeric not null,
  type text check (type in ('INCOME', 'EXPENSE')),
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'COMPLETED' check (status in ('COMPLETED', 'PENDING', 'FAILED')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.transactions enable row level security;

-- 11. SALES CONFIG (Settings per tenant)
create table public.sales_config (
  tenant_id uuid references public.tenants(id) on delete cascade not null primary key,
  financial_goal_target numeric default 100000,
  financial_goal_start_date date default '2023-11-01',
  platform_fee_percentage numeric default 0.05,
  expert_split_percentage numeric default 0.60,
  team_split_percentage numeric default 0.40,
  manual_gross_revenue numeric,
  manual_daily_average numeric,
  manual_projection_days int,
  custom_taxes jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.sales_config enable row level security;

-- 12. SUBSCRIPTIONS (Stripe Integration)
create table public.subscriptions (
  tenant_id uuid references public.tenants(id) on delete cascade not null primary key,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_id text not null default 'pro', -- starter, pro, business
  status text not null default 'active', -- active, past_due, canceled, incomplete
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.subscriptions enable row level security;

-- ============================================
-- NOTIFICATIONS SYSTEM
-- ============================================

-- 13. NOTIFICATIONS
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text,
  type text default 'info' check (type in ('success', 'info', 'warning', 'error')),
  read boolean default false,
  link text, -- optional link to navigate
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.notifications enable row level security;

-- Allow users to view their own notifications
create policy "Users can view their own notifications" on public.notifications
  for select using (auth.uid() = user_id);
create policy "Users can update their own notifications" on public.notifications
  for update using (auth.uid() = user_id);
create policy "Users can delete their own notifications" on public.notifications
  for delete using (auth.uid() = user_id);
-- Allow inserting notifications for any user (for system notifications)
create policy "Allow inserting notifications" on public.notifications
  for insert with check (true);

-- Index for faster queries
create index idx_notifications_user_created on public.notifications(user_id, created_at desc);

-- ============================================
-- GAMIFICATION SYSTEM
-- ============================================

-- 13. USER GAMIFICATION (XP, Level, Streak)
create table public.user_gamification (
  user_id uuid references public.profiles(id) on delete cascade not null,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  xp int default 0,
  level int default 1,
  current_streak int default 0,
  longest_streak int default 0,
  last_activity_date date,
  total_lessons_completed int default 0,
  total_watch_time_minutes int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, tenant_id)
);
alter table public.user_gamification enable row level security;

-- Allow users to view and update their own gamification data
create policy "Users can view their own gamification" on public.user_gamification
  for select using (auth.uid() = user_id);
create policy "Users can update their own gamification" on public.user_gamification
  for update using (auth.uid() = user_id);
create policy "Users can insert their own gamification" on public.user_gamification
  for insert with check (auth.uid() = user_id);

-- 14. ACHIEVEMENTS (Badges/Conquistas)
create table public.achievements (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  icon text, -- emoji or icon name
  xp_reward int default 50,
  condition_type text check (condition_type in ('LESSONS_COMPLETED', 'STREAK_DAYS', 'XP_EARNED', 'MODULES_COMPLETED', 'FIRST_LESSON', 'FIRST_COMMENT')),
  condition_value int default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed some default achievements
insert into public.achievements (name, description, icon, xp_reward, condition_type, condition_value) values
  ('Primeiro Passo', 'Completou sua primeira aula', '🎯', 50, 'FIRST_LESSON', 1),
  ('Estudante Dedicado', 'Completou 10 aulas', '📚', 100, 'LESSONS_COMPLETED', 10),
  ('Maratonista', 'Completou 50 aulas', '🏃', 500, 'LESSONS_COMPLETED', 50),
  ('Em Chamas', 'Manteve um streak de 7 dias', '🔥', 200, 'STREAK_DAYS', 7),
  ('Consistência', 'Manteve um streak de 30 dias', '💎', 1000, 'STREAK_DAYS', 30),
  ('Iniciante', 'Alcançou 100 XP', '⭐', 50, 'XP_EARNED', 100),
  ('Intermediário', 'Alcançou 1000 XP', '🌟', 150, 'XP_EARNED', 1000),
  ('Expert', 'Alcançou 5000 XP', '👑', 500, 'XP_EARNED', 5000),
  ('Módulo Concluído', 'Completou um módulo inteiro', '✅', 150, 'MODULES_COMPLETED', 1);

-- 15. USER ACHIEVEMENTS (Many-to-Many)
create table public.user_achievements (
  user_id uuid references public.profiles(id) on delete cascade not null,
  achievement_id uuid references public.achievements(id) on delete cascade not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, achievement_id)
);
alter table public.user_achievements enable row level security;

create policy "Users can view their own achievements" on public.user_achievements
  for select using (auth.uid() = user_id);
create policy "Users can insert their own achievements" on public.user_achievements
  for insert with check (auth.uid() = user_id);

-- 16. ACTIVITY FEED (Real-time notifications)
create table public.activity_feed (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  user_name text,
  user_avatar text,
  activity_type text check (activity_type in ('LESSON_COMPLETED', 'ACHIEVEMENT_UNLOCKED', 'STREAK_MILESTONE', 'MODULE_COMPLETED', 'NEW_MEMBER', 'PURCHASE', 'LEVEL_UP')),
  activity_data jsonb default '{}'::jsonb,
  message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.activity_feed enable row level security;

-- Allow tenant members to view activity feed
create policy "Tenant members can view activity feed" on public.activity_feed
  for select using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = activity_feed.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

-- Allow users to insert their own activities
create policy "Users can insert their own activities" on public.activity_feed
  for insert with check (auth.uid() = user_id);

-- Create index for faster activity feed queries
create index idx_activity_feed_tenant_created on public.activity_feed(tenant_id, created_at desc);
create index idx_user_gamification_tenant on public.user_gamification(tenant_id);
