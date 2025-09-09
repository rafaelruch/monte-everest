-- Script para adicionar colunas PIX na tabela professionals em produção
-- Execute este script no banco de dados de produção

BEGIN;

-- Adicionar colunas PIX se não existirem
DO $$ 
BEGIN 
    -- Adicionar pending_pix_code
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='professionals' AND column_name='pending_pix_code'
    ) THEN
        ALTER TABLE professionals ADD COLUMN pending_pix_code TEXT;
        RAISE NOTICE 'Coluna pending_pix_code adicionada à tabela professionals';
    ELSE
        RAISE NOTICE 'Coluna pending_pix_code já existe na tabela professionals';
    END IF;
    
    -- Adicionar pending_pix_url
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='professionals' AND column_name='pending_pix_url'
    ) THEN
        ALTER TABLE professionals ADD COLUMN pending_pix_url TEXT;
        RAISE NOTICE 'Coluna pending_pix_url adicionada à tabela professionals';
    ELSE
        RAISE NOTICE 'Coluna pending_pix_url já existe na tabela professionals';
    END IF;
    
    -- Adicionar pending_pix_expiry
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='professionals' AND column_name='pending_pix_expiry'
    ) THEN
        ALTER TABLE professionals ADD COLUMN pending_pix_expiry TIMESTAMP;
        RAISE NOTICE 'Coluna pending_pix_expiry adicionada à tabela professionals';
    ELSE
        RAISE NOTICE 'Coluna pending_pix_expiry já existe na tabela professionals';
    END IF;
    
    RAISE NOTICE 'Todas as colunas PIX foram processadas com sucesso!';
END $$;

COMMIT;

-- Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'professionals' 
  AND column_name IN ('pending_pix_code', 'pending_pix_url', 'pending_pix_expiry')
ORDER BY column_name;