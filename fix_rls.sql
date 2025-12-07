-- FIX RLS POLICIES
-- Run this in Supabase SQL Editor to fix the "new row violates row-level security policy" error.

-- 1. TENANTS POLICIES
-- Allow any authenticated user to create a tenant
create policy "Users can create tenants" on public.tenants
  for insert with check (auth.uid() = owner_id);

-- Allow users to view tenants they own or are members of
create policy "Users can view their tenants" on public.tenants
  for select using (
    auth.uid() = owner_id 
    or 
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = tenants.id
      and tenant_members.user_id = auth.uid()
    )
  );

-- 2. TENANT MEMBERS POLICIES
-- Allow users to view their own memberships
create policy "Users can view their own memberships" on public.tenant_members
  for select using (auth.uid() = user_id);

-- Allow users to add themselves as members (initially for creation)
-- OR allow tenant owners to add members
create policy "Users can add members to their tenants" on public.tenant_members
  for insert with check (
    -- Allow inserting SELF if the tenant is owned by SELF (Creation flow)
    (auth.uid() = user_id and exists (
      select 1 from public.tenants 
      where tenants.id = tenant_members.tenant_id 
      and tenants.owner_id = auth.uid()
    ))
    OR
    -- Allow owners to add others (Invite flow - future proofing)
    exists (
      select 1 from public.tenant_members as tm
      where tm.tenant_id = tenant_members.tenant_id
      and tm.user_id = auth.uid()
      and tm.role = 'OWNER'
    )
  );

-- 3. FIX TASKS/LEADS POLICIES (If missing)
-- Ensure we have policies for inserting data into sub-tables
create policy "Tenant members can insert leads" on public.leads
  for insert with check (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = leads.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

create policy "Tenant members can view leads" on public.leads
  for select using (
    exists (
      select 1 from public.tenant_members
      where tenant_members.tenant_id = leads.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );
