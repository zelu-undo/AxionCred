-- ============================================
-- Seed: Criar Super Admin para o AXION Cred
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Criar tenant para a AXION (empresa que administra a plataforma)
INSERT INTO tenants (id, name, document, phone, email, is_active, plan, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'AXION Cred',
  '12345678901',
  '+5511999999999',
  'admin@axioncred.com.br',
  true,
  'enterprise',
  '{"is_super_admin": true}'
) ON CONFLICT (id) DO NOTHING;

-- 2. Criar usuário Super Admin
INSERT INTO users (id, tenant_id, email, name, role, is_active, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'admin@axioncred.com.br',
  'Administrador AXION',
  'super_admin',
  true,
  'active'
) ON CONFLICT (id) DO NOTHING;

-- 3. Verificar se foi criado corretamente
SELECT u.id, u.email, u.name, u.role, t.name as tenant_name, t.plan
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.role = 'super_admin';

-- ============================================
-- IMPORTANTE: Como definir a senha do Super Admin
-- ============================================
-- O usuário foi criado na tabela 'users', mas a senha é gerenciada
-- pelo Supabase Auth. Você precisa criar o usuário manualmente:
--
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em Authentication → Users
-- 3. Clique em "Add user"
-- 4. Preencha:
--    - Email: admin@axioncred.com.br
--    - Password: Defina uma senha forte
--    - Email confirm: Marcado
-- 5. Clique em "Create user"
--
-- Agora você poderá fazer login com:
-- Email: admin@axioncred.com.br
-- Senha: A senha que você definir
-- ============================================