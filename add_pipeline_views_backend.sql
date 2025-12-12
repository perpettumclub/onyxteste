-- =============================================
-- Pipeline Views Backend - Onyx Club
-- Execute this in Supabase SQL Editor
-- =============================================

-- 1. Adicionar campos para Gantt Chart na tabela tasks
-- Permite rastrear data de início, fim e progresso de cada tarefa
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date timestamp default now();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS end_date timestamp;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS progress int default 0 CHECK (progress >= 0 AND progress <= 100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id uuid references tasks(id) on delete set null;

-- Comentários para documentação
COMMENT ON COLUMN tasks.start_date IS 'Data de início da tarefa (para Gantt)';
COMMENT ON COLUMN tasks.end_date IS 'Data de término da tarefa (para Gantt)';
COMMENT ON COLUMN tasks.progress IS 'Progresso da tarefa em porcentagem (0-100)';
COMMENT ON COLUMN tasks.parent_task_id IS 'Tarefa pai para hierarquia/dependências';

-- 2. Criar tabela de Activity Log para Channel View (Feed de Atividades)
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references profiles(id),
  task_id uuid references tasks(id) on delete cascade,
  action text not null CHECK (action IN ('CREATED', 'UPDATED', 'COMPLETED', 'COMMENTED', 'ASSIGNED', 'STATUS_CHANGED')),
  details jsonb default '{}',
  created_at timestamp default now()
);

-- Comentários
COMMENT ON TABLE activity_log IS 'Log de atividades para o feed do Channel View';
COMMENT ON COLUMN activity_log.action IS 'Tipo de ação: CREATED, UPDATED, COMPLETED, COMMENTED, ASSIGNED, STATUS_CHANGED';
COMMENT ON COLUMN activity_log.details IS 'Detalhes da ação em JSON, ex: {"field": "status", "old": "TODO", "new": "DONE"}';

-- 3. RLS para activity_log
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: Membros do tenant podem visualizar atividades
DROP POLICY IF EXISTS "Tenant members can view activity" ON activity_log;
CREATE POLICY "Tenant members can view activity" ON activity_log
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
  );

-- Policy: Membros do tenant podem inserir atividades
DROP POLICY IF EXISTS "Tenant members can insert activity" ON activity_log;
CREATE POLICY "Tenant members can insert activity" ON activity_log
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
  );

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_activity_log_tenant ON activity_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_task ON activity_log(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_start_end ON tasks(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);

-- 5. Função para criar log automaticamente quando uma tarefa é atualizada
CREATE OR REPLACE FUNCTION log_task_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log de criação
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_log (tenant_id, user_id, task_id, action, details)
    VALUES (NEW.tenant_id, auth.uid(), NEW.id, 'CREATED', jsonb_build_object('title', NEW.title));
    RETURN NEW;
  END IF;
  
  -- Log de atualização de status
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO activity_log (tenant_id, user_id, task_id, action, details)
    VALUES (
      NEW.tenant_id, 
      auth.uid(), 
      NEW.id, 
      CASE WHEN NEW.status = 'DONE' THEN 'COMPLETED' ELSE 'STATUS_CHANGED' END,
      jsonb_build_object('field', 'status', 'old', OLD.status, 'new', NEW.status)
    );
  END IF;
  
  -- Log de atribuição
  IF TG_OP = 'UPDATE' AND OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
    INSERT INTO activity_log (tenant_id, user_id, task_id, action, details)
    VALUES (
      NEW.tenant_id, 
      auth.uid(), 
      NEW.id, 
      'ASSIGNED',
      jsonb_build_object('assignee_id', NEW.assignee_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para log automático
DROP TRIGGER IF EXISTS task_activity_trigger ON tasks;
CREATE TRIGGER task_activity_trigger
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_activity();

-- 6. View para facilitar consultas no Channel (join com profiles e tasks)
CREATE OR REPLACE VIEW activity_feed AS
SELECT 
  al.id,
  al.tenant_id,
  al.task_id,
  t.title as task_title,
  al.action,
  al.details,
  al.created_at,
  p.id as user_id,
  p.full_name as user_name,
  p.avatar_url as user_avatar
FROM activity_log al
LEFT JOIN profiles p ON al.user_id = p.id
LEFT JOIN tasks t ON al.task_id = t.id
ORDER BY al.created_at DESC;

-- Permissões para a view
GRANT SELECT ON activity_feed TO authenticated;

SELECT 'Pipeline Views Backend instalado com sucesso!' as result;
