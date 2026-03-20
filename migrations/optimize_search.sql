-- Migração para otimizar buscas em customers e loans
-- Executar no banco de dados Supabase via SQL Editor

-- ============================================
-- EXTENSÃO E FUNÇÕES PARA BUSCA OTIMIZADA
-- ============================================

-- Habilitar extensão unaccent se não existir
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================
-- ÍNDICES PARA CUSTOMERS
-- ============================================

-- Remover índice antigo se existir (para recriar com otimização)
DROP INDEX IF EXISTS idx_customers_name_gin;

-- Criar índice GIN com unaccent para busca por nome (ignora acentos)
CREATE INDEX idx_customers_name_search ON customers USING gin(
  gin_trgm_ops(normalize_text(name))
);

-- Função para normalizar texto (remove acentos e converte para lowercase)
CREATE OR REPLACE FUNCTION normalize_text(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(unaccent($1));
$$;

-- Criar índice funcional para documento (para buscas mais rápidas)
CREATE INDEX IF NOT EXISTS idx_customers_document_lower ON customers(
  lower(document)
);

-- Índice composto para tenant + status (filtros frequentes)
CREATE INDEX IF NOT EXISTS idx_customers_tenant_status ON customers(
  tenant_id, status
) WHERE status != 'deleted';

-- ============================================
-- ÍNDICES PARA LOANS
-- ============================================

-- Índice para busca por tenant + status
CREATE INDEX IF NOT EXISTS idx_loans_tenant_status ON loans(
  tenant_id, status
);

-- Índice para busca por customer_id (relacionamento)
CREATE INDEX IF NOT EXISTS idx_loans_customer ON loans(
  customer_id
);

-- Índice para ordenação por data
CREATE INDEX IF NOT EXISTS idx_loans_created_at ON loans(
  tenant_id, created_at DESC
);

-- Índice para busca por valor (range queries)
CREATE INDEX IF NOT EXISTS idx_loans_principal_amount ON loans(
  tenant_id, principal_amount
);

-- Índice para busca por número do contrato (id)
CREATE INDEX IF NOT EXISTS idx_loans_id_tenant ON loans(
  tenant_id, id
);

-- ============================================
-- OBSERVAÇÕES
-- ============================================
-- Para usar a busca otimizada no backend:
-- 1. Usar normalize_text(column) para comparações
-- 2. Para buscas por nome com ILIKE, usar:
--    WHERE normalize_text(name) LIKE normalize_text('%João%')
-- 3. Para documento, usar:
--    WHERE lower(document) = lower('123.456.789-00')
--    ou WHERE document ILIKE '%12345678900%'
