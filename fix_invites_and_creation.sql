-- ============================================
-- FIX INVITES AND MEMBER AREA CREATION (V2)
-- Run this in Supabase SQL Editor
-- ============================================

-- DROP old functions first to ensure clean state
drop function if exists public.get_invite_details(text);
drop function if exists public.accept_invite(text);

-- 1. Function to safely get invite details (publicly accessible via RPC)
create or replace function public.get_invite_details(invite_code_param text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_record record;
  tenant_name_val text;
begin
  -- Find invite
  select * into invite_record
  from invites
  where invite_code = invite_code_param;

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

  -- Get tenant name
  select name into tenant_name_val
  from tenants
  where id = invite_record.tenant_id;

  return jsonb_build_object(
    'tenant_name', tenant_name_val,
    'tenant_id', invite_record.tenant_id,
    'status', invite_record.status
  );
end;
$$;

-- 2. Function to safely accept invite (authenticated user only)
create or replace function public.accept_invite(invite_code_param text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_record record;
  current_user_id uuid;
  existing_member_id uuid;
begin
  -- Get current user
  current_user_id := auth.uid();
  if current_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
  end if;

  -- Find invite
  select * into invite_record
  from invites
  where invite_code = invite_code_param;

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
  select user_id into existing_member_id
  from tenant_members
  where tenant_id = invite_record.tenant_id
  and user_id = current_user_id;

  if existing_member_id is not null then
    return jsonb_build_object('success', true, 'message', 'Usuário já é membro', 'tenant_id', invite_record.tenant_id);
  end if;

  -- Add to tenant_members
  insert into tenant_members (tenant_id, user_id, role)
  values (invite_record.tenant_id, current_user_id, 'VIEWER');

  -- Update invite status
  update invites
  set status = 'ACCEPTED',
      accepted_at = now()
  where id = invite_record.id;

  return jsonb_build_object('success', true, 'tenant_id', invite_record.tenant_id);
end;
$$;

-- Grant execute permissions
grant execute on function public.get_invite_details(text) to anon, authenticated, service_role;
grant execute on function public.accept_invite(text) to authenticated, service_role;
