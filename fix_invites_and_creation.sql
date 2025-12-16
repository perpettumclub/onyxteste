-- ============================================
-- FIX INVITES AND MEMBER AREA CREATION
-- ============================================

-- 1. Function to safely get invite details (publicly accessible via RPC)
create or replace function public.get_invite_details(code text)
returns jsonb
language plpgsql
security definer -- Runs with privileges of defining user (bypass RLS)
as $$
declare
  invite_record record;
  tenant_record record;
  result jsonb;
begin
  -- Find invite
  select * into invite_record
  from public.invites
  where invite_code = code;

  if not found then
    return jsonb_build_object('error', 'Convite não encontrado');
  end if;

  -- Check expiry
  if invite_record.expires_at < now() then
     return jsonb_build_object('error', 'Convite expirado');
  end if;

  -- Check status
  if invite_record.status = 'ACCEPTED' then
     return jsonb_build_object('error', 'Convite já utilizado');
  end if;

  -- Get tenant details
  select name into tenant_record
  from public.tenants
  where id = invite_record.tenant_id;

  return jsonb_build_object(
    'tenant_name', tenant_record.name,
    'tenant_id', invite_record.tenant_id,
    'inviter_id', invite_record.inviter_id,
    'status', invite_record.status
  );
end;
$$;

-- 2. Function to safely accept invite (authenticated user only)
create or replace function public.accept_invite(code text)
returns jsonb
language plpgsql
security definer
as $$
declare
  invite_record record;
  user_id uuid;
  existing_member record;
begin
  -- Get current user
  user_id := auth.uid();
  if user_id is null then
    return jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
  end if;

  -- Find invite
  select * into invite_record
  from public.invites
  where invite_code = code;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Convite não encontrado');
  end if;

  if invite_record.expires_at < now() then
     return jsonb_build_object('success', false, 'error', 'Convite expirado');
  end if;

  if invite_record.status = 'ACCEPTED' then
     return jsonb_build_object('success', false, 'error', 'Convite já utilizado');
  end if;

  -- Check if already a member
  select * into existing_member
  from public.tenant_members
  where tenant_members.tenant_id = invite_record.tenant_id
  and tenant_members.user_id = user_id;

  if found then
    return jsonb_build_object('success', true, 'message', 'Usuário já é membro', 'tenant_id', invite_record.tenant_id);
  end if;

  -- Add to tenant_members
  insert into public.tenant_members (tenant_id, user_id, role)
  values (invite_record.tenant_id, user_id, 'VIEWER');

  -- Update invite status
  update public.invites
  set status = 'ACCEPTED',
      accepted_at = now()
  where id = invite_record.id;

  return jsonb_build_object('success', true, 'tenant_id', invite_record.tenant_id);
end;
$$;

-- 3. Policy to allow users to create tenants
-- Ensure Policy exists or Create it
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'tenants' 
    and policyname = 'Users can create tenants'
  ) then
    create policy "Users can create tenants" on public.tenants
      for insert with check (auth.uid() = owner_id);
  end if;
end
$$;

-- 4. Policy for Tenant Members (Creation Flow)
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'tenant_members' 
    and policyname = 'Owners can add themselves'
  ) then
    create policy "Owners can add themselves" on public.tenant_members
      for insert with check (
         auth.uid() = user_id 
         and exists (
           select 1 from public.tenants
           where id = tenant_id 
           and owner_id = auth.uid()
         )
      );
  end if;
end
$$;

-- Grant execute permissions (important for RPC)
grant execute on function public.get_invite_details(text) to anon, authenticated, service_role;
grant execute on function public.accept_invite(text) to authenticated, service_role;
