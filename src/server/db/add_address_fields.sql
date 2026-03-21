-- Adicionar campos de endereço separados na tabela customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS cep VARCHAR(10);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS street VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS number VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS complement VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state VARCHAR(2);

-- Atualizar políticas RLS para incluir novos campos (se necessário)
-- Os campos já estarão protegidos pela política existente

SELECT 'Campos de endereço adicionados com sucesso!' AS status;
