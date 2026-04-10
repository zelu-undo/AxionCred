-- Adicionar coluna plan na tabela tenants
-- Execute este SQL no Supabase SQL Editor

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free';