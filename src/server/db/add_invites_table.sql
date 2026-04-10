-- ============================================
-- Tabela de Convites (Invites System)
-- ============================================

-- Criar tabela de convites
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'operator',
  invited_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, expired
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index para buscar convites por email rapidamente
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_status ON invites(status);
CREATE INDEX IF NOT EXISTS idx_invites_tenant ON invites(tenant_id);

-- Habilitar RLS
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Política: Owners e admins do tenant podem ver convites do próprio tenant
CREATE POLICY "invites_select_tenant" ON invites FOR SELECT
USING (
  tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
);

-- Política: Owners e admins podem criar convites para seu tenant
CREATE POLICY "invites_insert_tenant" ON invites FOR INSERT
WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  AND (
    SELECT role FROM users WHERE id = auth.uid()
  ) IN ('owner', 'admin')
);

-- Política: Owners podem deletar convites
CREATE POLICY "invites_delete_tenant" ON invites FOR DELETE
USING (
  tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  AND (
    SELECT role FROM users WHERE id = auth.uid()
  ) = 'owner'
);

-- Super admin pode ver todos os convites
CREATE POLICY "invites_select_superadmin" ON invites FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
);

-- Super admin pode fazer qualquer operação
CREATE POLICY "invites_all_superadmin" ON invites FOR ALL
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
);

COMMENT ON TABLE invites IS 'Tabela para gerenciar convites de usuários para empresas';
COMMENT ON COLUMN invites.email IS 'Email do convidado';
COMMENT ON COLUMN invites.role IS 'Função que o convidado terá na empresa';
COMMENT ON COLUMN invites.status IS 'pending: aguardando aceite, accepted: aceito, expired: expirado';
COMMENT ON COLUMN invites.expires_at IS 'Data de expiração do convite';