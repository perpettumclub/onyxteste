-- ============================================
-- INVITE SYSTEM
-- ============================================

-- Table for storing invites
create table public.invites (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  inviter_id uuid references public.profiles(id) on delete set null,
  invite_code text unique not null,
  invited_email text,
  status text default 'PENDING' check (status in ('PENDING', 'ACCEPTED', 'EXPIRED')),
  expires_at timestamp with time zone default (now() + interval '7 days'),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  accepted_at timestamp with time zone
);

alter table public.invites enable row level security;

-- Policies
create policy "Tenant members can view invites" on public.invites
  for select using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = invites.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Tenant members can create invites" on public.invites
  for insert with check (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = invites.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Tenant members can update invites" on public.invites
  for update using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = invites.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

-- Anyone can view invite by code (for public invite page)
create policy "Anyone can view invite by code" on public.invites
  for select using (true);

-- Index for faster lookups
create index idx_invites_code on public.invites(invite_code);
create index idx_invites_tenant on public.invites(tenant_id);
