-- Políticas RLS para tabela tenants
-- Execute este SQL no Supabase SQL Editor

-- Habilitar RLS na tabela tenants (se ainda não estiver)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Policy para usuários autenticados verem seus próprios dados
CREATE POLICY "Users can view their tenant" ON tenants
  FOR SELECT USING (true);

-- Policy para usuários autenticados criarem tenant
CREATE POLICY "Users can insert their tenant" ON tenants
  FOR INSERT WITH CHECK (true);

-- Policy para usuários autenticarem atualizarem seu próprio tenant
CREATE POLICY "Users can update their tenant" ON tenants
  FOR UPDATE USING (true);

-- Policy para usuários autenticados deletarem seu próprio tenant
CREATE POLICY "Users can delete their tenant" ON tenants
  FOR DELETE USING (true);

-- Policy para super_admin acessar todos os tenants
CREATE POLICY "Super admin can view all tenants" ON tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin can manage all tenants" ON tenants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );