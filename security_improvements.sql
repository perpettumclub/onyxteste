-- ========================================
-- SECURITY IMPROVEMENTS - ONYX CLUB
-- Execute no Supabase SQL Editor
-- (SEM ÍNDICES - apenas políticas e funções)
-- ========================================

-- ========================================
-- 1. POLÍTICA PARA PÁGINA DE CONVITE
-- Permite que qualquer pessoa veja o nome do tenant
-- (necessário para a página /invite/:code funcionar)
-- ========================================

-- Remove política antiga se existir
DROP POLICY IF EXISTS "Anyone can view tenant name for invites" ON public.tenants;

-- Cria nova política para permitir leitura pública
CREATE POLICY "Anyone can view tenant name for invites" ON public.tenants
  FOR SELECT USING (true);


-- ========================================
-- 2. POLÍTICAS PARA TABELA LESSON_PROGRESS
-- ========================================

DROP POLICY IF EXISTS "Users can view their own progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.lesson_progress;

CREATE POLICY "Users can view their own progress" ON public.lesson_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.lesson_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON public.lesson_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ========================================
-- 3. TRIGGER PARA PREVENIR ESCALAÇÃO DE PRIVILÉGIOS
-- Impede que usuários mudem seu próprio role
-- ========================================

-- Remove função e trigger antigos se existirem
DROP TRIGGER IF EXISTS tr_prevent_role_escalation ON public.profiles;
DROP FUNCTION IF EXISTS prevent_role_escalation();

-- Cria função de proteção
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o usuário está tentando mudar seu próprio role
  IF OLD.id = auth.uid() AND OLD.role IS DISTINCT FROM NEW.role THEN
    -- Verifica se o usuário é um super admin
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    ) THEN
      -- Mantém o role antigo, não permite a mudança
      NEW.role := OLD.role;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cria trigger
CREATE TRIGGER tr_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_escalation();


-- ========================================
-- 8. FUNÇÃO RPC PARA ATUALIZAÇÃO DE ROLE
-- Apenas admins podem mudar roles de outros usuários
-- ========================================

DROP FUNCTION IF EXISTS update_user_role(UUID, TEXT);

CREATE OR REPLACE FUNCTION update_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Valida o novo role
  IF new_role NOT IN ('USER', 'ADMIN', 'SUPER_ADMIN') THEN
    RAISE EXCEPTION 'Role inválido: %', new_role;
  END IF;

  -- Verifica se o chamador é admin
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  
  IF caller_role NOT IN ('ADMIN', 'SUPER_ADMIN') THEN
    RAISE EXCEPTION 'Não autorizado: apenas admins podem alterar roles';
  END IF;
  
  -- Não permite que admin altere SUPER_ADMIN
  IF new_role = 'SUPER_ADMIN' AND caller_role != 'SUPER_ADMIN' THEN
    RAISE EXCEPTION 'Apenas SUPER_ADMIN pode promover a SUPER_ADMIN';
  END IF;
  
  -- Atualiza o role
  UPDATE public.profiles SET role = new_role WHERE id = target_user_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ========================================
-- SUCESSO! 
-- Todas as melhorias de segurança foram aplicadas.
-- ========================================
