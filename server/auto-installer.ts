import { Pool } from 'pg';

export async function createDatabaseTables(databaseUrl: string): Promise<boolean> {
  console.log('[auto-installer] Iniciando criação automática das tabelas...');
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false
  });

  try {
    const client = await pool.connect();
    
    console.log('[auto-installer] Conectado ao banco PostgreSQL');
    
    // SQL completo para criar todas as tabelas
    const createTablesSQL = `
    -- Criar todas as tabelas do Monte Everest
    BEGIN;

    -- Tabela de usuários/admin
    CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role VARCHAR NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de categorias
    CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        slug VARCHAR NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR,
        is_active BOOLEAN DEFAULT true,
        is_popular BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de planos de assinatura
    CREATE TABLE IF NOT EXISTS subscription_plans (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        description TEXT,
        monthly_price DECIMAL(10,2) NOT NULL,
        yearly_price DECIMAL(10,2),
        features JSONB,
        max_contacts INTEGER,
        max_photos INTEGER DEFAULT 5,
        priority INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        pagarme_product_id VARCHAR,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de profissionais
    CREATE TABLE IF NOT EXISTS professionals (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name VARCHAR NOT NULL,
        email VARCHAR NOT NULL UNIQUE,
        password TEXT,
        phone VARCHAR NOT NULL,
        document VARCHAR NOT NULL UNIQUE,
        category_id VARCHAR NOT NULL,
        subscription_plan_id VARCHAR,
        service_area VARCHAR NOT NULL,
        city VARCHAR NOT NULL,
        description TEXT NOT NULL,
        profile_image TEXT,
        portfolio JSONB,
        website VARCHAR,
        social_media JSONB,
        working_hours JSONB,
        status VARCHAR NOT NULL DEFAULT 'pending',
        payment_status VARCHAR NOT NULL DEFAULT 'pending',
        last_payment_date TIMESTAMP,
        next_payment_date TIMESTAMP,
        subscription_expires_at TIMESTAMP,
        photo VARCHAR,
        rating DECIMAL(3,2) DEFAULT 0.00,
        total_reviews INTEGER DEFAULT 0,
        ranking_position INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de avaliações
    CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        professional_id VARCHAR NOT NULL,
        customer_name VARCHAR NOT NULL,
        customer_email VARCHAR NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de pagamentos
    CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        professional_id VARCHAR NOT NULL,
        subscription_plan_id VARCHAR,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR DEFAULT 'BRL',
        status VARCHAR NOT NULL DEFAULT 'pending',
        transaction_id VARCHAR,
        pagarme_subscription_id VARCHAR,
        payment_method VARCHAR,
        due_date TIMESTAMP,
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de contatos
    CREATE TABLE IF NOT EXISTS contacts (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        professional_id VARCHAR NOT NULL,
        client_name VARCHAR NOT NULL,
        client_email VARCHAR,
        client_phone VARCHAR,
        message TEXT,
        contact_type VARCHAR NOT NULL DEFAULT 'whatsapp',
        ip_address VARCHAR,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de logs do sistema
    CREATE TABLE IF NOT EXISTS system_logs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR,
        action VARCHAR NOT NULL,
        entity_type VARCHAR,
        entity_id VARCHAR,
        details JSONB,
        ip_address VARCHAR,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de configurações do sistema
    CREATE TABLE IF NOT EXISTS system_configs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR NOT NULL UNIQUE,
        value TEXT NOT NULL,
        description TEXT,
        is_secret BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de páginas
    CREATE TABLE IF NOT EXISTS pages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR NOT NULL,
        slug VARCHAR NOT NULL UNIQUE,
        content TEXT NOT NULL,
        excerpt TEXT,
        status VARCHAR DEFAULT 'draft',
        is_featured BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Criar índices para performance
    CREATE INDEX IF NOT EXISTS professionals_category_idx ON professionals(category_id);
    CREATE INDEX IF NOT EXISTS professionals_service_area_idx ON professionals(service_area);
    CREATE INDEX IF NOT EXISTS professionals_status_idx ON professionals(status);
    CREATE INDEX IF NOT EXISTS professionals_rating_idx ON professionals(rating);
    CREATE INDEX IF NOT EXISTS reviews_professional_idx ON reviews(professional_id);
    CREATE INDEX IF NOT EXISTS reviews_rating_idx ON reviews(rating);
    CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON reviews(created_at);

    -- Inserir categorias iniciais
    INSERT INTO categories (name, slug, description, icon, is_active, is_popular) VALUES
        ('Encanador', 'encanador', 'Serviços de encanamento e hidráulica', '🔧', true, true),
        ('Eletricista', 'eletricista', 'Serviços elétricos residenciais e comerciais', '⚡', true, true),
        ('Pedreiro', 'pedreiro', 'Construção e reformas em geral', '🧱', true, true),
        ('Pintor', 'pintor', 'Pintura residencial e comercial', '🎨', true, true),
        ('Marceneiro', 'marceneiro', 'Móveis e estruturas de madeira', '🪚', true, false),
        ('Jardineiro', 'jardineiro', 'Cuidados com jardins e paisagismo', '🌱', true, false),
        ('Limpeza', 'limpeza', 'Serviços de limpeza residencial e comercial', '🧽', true, true),
        ('Montador', 'montador', 'Montagem de móveis e equipamentos', '🔨', true, false),
        ('Chaveiro', 'chaveiro', 'Serviços de chaveiro e fechaduras', '🗝️', true, false),
        ('Vidraceiro', 'vidraceiro', 'Instalação e reparo de vidros', '🔲', true, false)
    ON CONFLICT (slug) DO NOTHING;

    -- Inserir planos de assinatura iniciais
    INSERT INTO subscription_plans (name, description, monthly_price, features, max_contacts, is_active, is_featured) VALUES
        ('Plano Básico', 'Plano básico para profissionais', 29.90, '["Perfil completo", "Até 50 contatos/mês", "5 fotos no portfólio"]', 50, true, true),
        ('Plano Premium', 'Plano premium com recursos avançados', 59.90, '["Perfil destacado", "Contatos ilimitados", "20 fotos no portfólio", "Suporte prioritário"]', null, true, true)
    ON CONFLICT DO NOTHING;

    COMMIT;
    `;

    console.log('[auto-installer] Executando SQL de criação das tabelas...');
    
    await client.query(createTablesSQL);
    
    console.log('[auto-installer] ✅ Todas as tabelas criadas com sucesso!');
    
    client.release();
    await pool.end();
    
    return true;
  } catch (error) {
    console.error('[auto-installer] ❌ Erro ao criar tabelas:', error);
    await pool.end();
    return false;
  }
}

export async function checkDatabaseConnection(databaseUrl: string): Promise<boolean> {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false
  });

  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    await pool.end();
    console.log('[auto-installer] ✅ Conexão com banco testada com sucesso');
    return true;
  } catch (error) {
    console.error('[auto-installer] ❌ Erro ao conectar com banco:', error);
    await pool.end();
    return false;
  }
}