-- ============================================================
-- Script para adicionar colunas faltantes no banco de dados
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- Função auxiliar para adicionar coluna se não existir
DO $$ 
BEGIN
    -- 1. Adicionar interest_type na tabela interest_rules se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'interest_rules' AND column_name = 'interest_type'
    ) THEN
        ALTER TABLE interest_rules ADD COLUMN interest_type VARCHAR(20) DEFAULT 'monthly';
        -- Adicionar constraint se não existir
        ALTER TABLE interest_rules DROP CONSTRAINT IF EXISTS valid_interest_type;
        ALTER TABLE interest_rules ADD CONSTRAINT valid_interest_type 
            CHECK (interest_type IN ('fixed', 'weekly', 'monthly'));
    END IF;
    
    -- 2. Adicionar colunas faltantes na tabela late_fee_config
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'late_fee_config' AND column_name = 'daily_interest'
    ) THEN
        ALTER TABLE late_fee_config ADD COLUMN daily_interest DECIMAL(5,4) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'late_fee_config' AND column_name = 'monthly_interest'
    ) THEN
        ALTER TABLE late_fee_config ADD COLUMN monthly_interest DECIMAL(5,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'late_fee_config' AND column_name = 'grace_days'
    ) THEN
        ALTER TABLE late_fee_config ADD COLUMN grace_days INTEGER DEFAULT 0;
    END IF;
    
    -- 3. Adicionar colunas na tabela loan_interest_rules (para controle de snapshots)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'loan_interest_rules' AND column_name = 'interest_type'
    ) THEN
        ALTER TABLE loan_interest_rules ADD COLUMN interest_type VARCHAR(20) DEFAULT 'monthly';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'loan_interest_rules' AND column_name = 'late_fee_type'
    ) THEN
        ALTER TABLE loan_interest_rules ADD COLUMN late_fee_type VARCHAR(20) DEFAULT 'percentage';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'loan_interest_rules' AND column_name = 'late_fee_value'
    ) THEN
        ALTER TABLE loan_interest_rules ADD COLUMN late_fee_value DECIMAL(5,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'loan_interest_rules' AND column_name = 'late_interest_type'
    ) THEN
        ALTER TABLE loan_interest_rules ADD COLUMN late_interest_type VARCHAR(20) DEFAULT 'monthly';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'loan_interest_rules' AND column_name = 'late_interest_percentage'
    ) THEN
        ALTER TABLE loan_interest_rules ADD COLUMN late_interest_percentage DECIMAL(5,2) DEFAULT 0;
    END IF;
    
    -- 4. Verificar se a tabela loan_rule_snapshots tem as colunas necessárias
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'loan_rule_snapshots' AND column_name = 'interest_type'
    ) THEN
        ALTER TABLE loan_rule_snapshots ADD COLUMN interest_type VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'loan_rule_snapshots' AND column_name = 'late_fee_type'
    ) THEN
        ALTER TABLE loan_rule_snapshots ADD COLUMN late_fee_type VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'loan_rule_snapshots' AND column_name = 'late_fee_value'
    ) THEN
        ALTER TABLE loan_rule_snapshots ADD COLUMN late_fee_value DECIMAL(5,2);
    END IF;
    
    RAISE NOTICE 'Colunas adicionadas com sucesso!';
END $$;

-- Verificar resultado
SELECT 'interest_rules:' as table_name;
SELECT column_name FROM information_schema.columns WHERE table_name = 'interest_rules' ORDER BY ordinal_position;

SELECT 'late_fee_config:' as table_name;
SELECT column_name FROM information_schema.columns WHERE table_name = 'late_fee_config' ORDER BY ordinal_position;

SELECT 'loan_interest_rules:' as table_name;
SELECT column_name FROM information_schema.columns WHERE table_name = 'loan_interest_rules' ORDER BY ordinal_position;

SELECT 'loan_rule_snapshots:' as table_name;
SELECT column_name FROM information_schema.columns WHERE table_name = 'loan_rule_snapshots' ORDER BY ordinal_position;
