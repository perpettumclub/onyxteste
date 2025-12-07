-- SEED DATA
-- Run this in the Supabase SQL Editor to populate your tables with sample data.

-- 1. Create a Test User (Profile)
-- NOTE: In reality, profiles are created automatically via Auth triggers. 
-- But for seeding data manually without signing up, we insert a profile directly.
-- You will need to create a user in Authentication > Users with this ID to log in, 
-- OR just sign up in the app and this seed data won't be linked to you.
-- BETTER APPROACH: We will create a "Demo Tenant" and data that you can see once you sign up.

-- Let's assume you will sign up and get a UID. 
-- Since we don't know your UID yet, we'll create data linked to a placeholder, 
-- and you can update the owner_id later or we just make it public for now?
-- No, let's stick to RLS.

-- WORKAROUND: We will insert data that is "public" for now or just insert it and you'll see it in the Table Editor.

BEGIN;

-- 1. Create a Demo Tenant
INSERT INTO public.tenants (id, name, slug)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Onyx Demo Launch', 'onyx-demo')
ON CONFLICT DO NOTHING;

-- 2. Create Tasks
INSERT INTO public.tasks (tenant_id, title, description, status, due_date)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Definir Big Idea', 'Reunião estratégica para definir a promessa.', 'DONE', NOW() - INTERVAL '2 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Gravar Criativos', 'Gravar 5 variações de vídeos.', 'IN_PROGRESS', NOW() + INTERVAL '2 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Configurar Página de Captura', 'Implementar design e integração.', 'TODO', NOW() + INTERVAL '5 days');

-- 3. Create Leads
INSERT INTO public.leads (tenant_id, name, email, company, value, status, last_contact)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Roberto Almeida', 'roberto@tech.com', 'TechCorp', 5000, 'WON', NOW() - INTERVAL '1 day'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Julia Silva', 'julia@design.io', 'Design Studio', 2500, 'QUALIFIED', NOW() - INTERVAL '3 days'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Marcos Souza', 'marcos@free.net', 'Freelancer', 1200, 'NEW', NOW());

-- 4. Create Modules & Lessons
INSERT INTO public.modules (id, tenant_id, title, description, order_index)
VALUES
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Onboarding e Cultura', 'Comece por aqui.', 1);

INSERT INTO public.lessons (module_id, title, duration, type, order_index)
VALUES
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Boas-vindas', '5:20', 'VIDEO', 1),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Como usar o Kanban', '12:00', 'VIDEO', 2);

COMMIT;
