import { Pool } from 'pg';

// Interface para módulos adicionais do sistema
export interface DatabaseModule {
  name: string;
  tables: string;
  initialData?: string;
  description: string;
}

// Lista de módulos adicionais que podem ser instalados
export const availableModules: DatabaseModule[] = [
  // Módulos futuros podem ser adicionados aqui
  // {
  //   name: 'notifications',
  //   description: 'Sistema de notificações',
  //   tables: `CREATE TABLE IF NOT EXISTS notifications (...);`,
  //   initialData: `INSERT INTO notifications (...) VALUES (...);`
  // }
];

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
        full_name VARCHAR,
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
        meta_description TEXT,
        meta_keywords TEXT,
        is_active BOOLEAN DEFAULT true,
        show_in_footer BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
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

    -- Inserir páginas iniciais do sistema
    INSERT INTO pages (title, slug, content, meta_description, is_active, show_in_footer, sort_order) VALUES
        ('Sobre Nós', 'sobre', 
         '<h2>Sobre o Monte Everest</h2>
         <p>O Monte Everest é a principal plataforma de conexão entre profissionais qualificados e clientes que buscam serviços de excelência.</p>
         <p>Nossa missão é facilitar o encontro entre quem precisa de um serviço e quem tem a competência para realizá-lo, promovendo negócios justos e transparentes.</p>
         <h3>Nossos Valores</h3>
         <ul>
         <li><strong>Qualidade:</strong> Conectamos apenas profissionais verificados</li>
         <li><strong>Transparência:</strong> Reviews e avaliações reais dos clientes</li>
         <li><strong>Confiança:</strong> Sistema seguro de pagamentos e contatos</li>
         </ul>', 
         'Conheça o Monte Everest, plataforma que conecta profissionais qualificados com clientes', true, true, 1),
        
        ('Termos de Uso', 'termos-de-uso',
         '<h2>Termos de Uso</h2>
         <p><strong>Última atualização:</strong> ' || CURRENT_DATE || '</p>
         
         <h3>1. Aceitação dos Termos</h3>
         <p>Ao utilizar o Monte Everest, você concorda com estes termos de uso.</p>
         
         <h3>2. Descrição do Serviço</h3>
         <p>O Monte Everest é uma plataforma que conecta prestadores de serviços com potenciais clientes.</p>
         
         <h3>3. Responsabilidades do Usuário</h3>
         <p>Os usuários devem fornecer informações verdadeiras e manter seus dados atualizados.</p>
         
         <h3>4. Responsabilidades dos Profissionais</h3>
         <p>Profissionais devem prestar serviços com qualidade e dentro dos prazos acordados.</p>
         
         <h3>5. Pagamentos</h3>
         <p>Os pagamentos de assinaturas são processados mensalmente através do sistema Pagar.me.</p>
         
         <h3>6. Contato</h3>
         <p>Para dúvidas sobre estes termos, entre em contato através do nosso suporte.</p>',
         'Termos de uso da plataforma Monte Everest', true, true, 2),
        
        ('Política de Privacidade', 'politica-privacidade',
         '<h2>Política de Privacidade</h2>
         <p><strong>Última atualização:</strong> ' || CURRENT_DATE || '</p>
         
         <h3>1. Coleta de Informações</h3>
         <p>Coletamos apenas as informações necessárias para o funcionamento da plataforma.</p>
         
         <h3>2. Uso das Informações</h3>
         <p>Suas informações são utilizadas para:</p>
         <ul>
         <li>Conectar você com profissionais ou clientes</li>
         <li>Processar pagamentos de forma segura</li>
         <li>Melhorar nossos serviços</li>
         <li>Enviar comunicações importantes</li>
         </ul>
         
         <h3>3. Compartilhamento de Dados</h3>
         <p>Não compartilhamos seus dados pessoais com terceiros, exceto quando necessário para o funcionamento do serviço.</p>
         
         <h3>4. Segurança</h3>
         <p>Utilizamos as melhores práticas de segurança para proteger suas informações.</p>
         
         <h3>5. Seus Direitos</h3>
         <p>Você tem direito a acessar, corrigir ou excluir seus dados pessoais a qualquer momento.</p>
         
         <h3>6. Contato</h3>
         <p>Para questões sobre privacidade, entre em contato através do nosso suporte.</p>',
         'Política de privacidade do Monte Everest', true, true, 3),
        
        ('Contato', 'contato',
         '<h2>Entre em Contato</h2>
         <p>Estamos aqui para ajudar! Entre em contato conosco através dos canais abaixo:</p>
         
         <h3>📧 Email</h3>
         <p><strong>Suporte Geral:</strong> contato@monteeverest.com</p>
         <p><strong>Suporte Profissionais:</strong> profissionais@monteeverest.com</p>
         <p><strong>Parcerias:</strong> parceiros@monteeverest.com</p>
         
         <h3>📱 WhatsApp</h3>
         <p><strong>Atendimento:</strong> (11) 99999-9999</p>
         <p><em>Horário: Segunda a Sexta, 8h às 18h</em></p>
         
         <h3>🏢 Endereço</h3>
         <p>Monte Everest Serviços Ltda<br>
         Rua das Palmeiras, 123<br>
         São Paulo - SP, 01234-567</p>
         
         <h3>⏰ Horário de Atendimento</h3>
         <p><strong>Segunda a Sexta:</strong> 8h às 18h<br>
         <strong>Sábado:</strong> 9h às 14h<br>
         <strong>Domingo:</strong> Fechado</p>',
         'Entre em contato com o Monte Everest', true, true, 4)
    ON CONFLICT (slug) DO NOTHING;

    -- Inserir avaliações iniciais de exemplo (apenas se profissionais existirem)
    DO $$
    DECLARE
        prof_id VARCHAR;
    BEGIN
        -- Buscar um profissional existente para as avaliações de exemplo
        SELECT id INTO prof_id FROM professionals LIMIT 1;
        
        -- Se existe profissional, inserir avaliações de exemplo
        IF prof_id IS NOT NULL THEN
            INSERT INTO reviews (professional_id, customer_name, customer_email, rating, comment, is_verified) VALUES
                (prof_id, 'Maria Silva', 'maria@email.com', 5, 'Excelente profissional! Muito atencioso e pontual. Recomendo!', true),
                (prof_id, 'João Santos', 'joao@email.com', 4, 'Bom trabalho, ficou conforme solicitado. Entrega no prazo.', true),
                (prof_id, 'Ana Costa', 'ana@email.com', 5, 'Superou minhas expectativas! Qualidade excepcional do serviço.', true)
            ON CONFLICT DO NOTHING;
        END IF;
    END $$;

    COMMIT;
    `;

    console.log('[auto-installer] Executando SQL de criação das tabelas...');
    
    await client.query(createTablesSQL);
    
    console.log('[auto-installer] ✅ Todas as tabelas criadas com sucesso!');
    
    // Instalar módulos adicionais, se existirem
    if (availableModules.length > 0) {
      console.log('[auto-installer] Instalando módulos adicionais...');
      for (const module of availableModules) {
        console.log(`[auto-installer] Instalando módulo: ${module.name}`);
        try {
          if (module.tables) {
            await client.query(module.tables);
          }
          if (module.initialData) {
            await client.query(module.initialData);
          }
          console.log(`[auto-installer] ✅ Módulo ${module.name} instalado com sucesso!`);
        } catch (moduleError) {
          console.error(`[auto-installer] ⚠️ Erro ao instalar módulo ${module.name}:`, moduleError);
          // Continua com outros módulos mesmo se um falhar
        }
      }
    }
    
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

// Função para instalar um módulo específico
export async function installDatabaseModule(databaseUrl: string, module: DatabaseModule): Promise<boolean> {
  console.log(`[auto-installer] Instalando módulo específico: ${module.name}`);
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false
  });

  try {
    const client = await pool.connect();
    
    if (module.tables) {
      console.log(`[auto-installer] Criando tabelas do módulo ${module.name}...`);
      await client.query(module.tables);
    }
    
    if (module.initialData) {
      console.log(`[auto-installer] Inserindo dados iniciais do módulo ${module.name}...`);
      await client.query(module.initialData);
    }
    
    console.log(`[auto-installer] ✅ Módulo ${module.name} instalado com sucesso!`);
    
    client.release();
    await pool.end();
    
    return true;
  } catch (error) {
    console.error(`[auto-installer] ❌ Erro ao instalar módulo ${module.name}:`, error);
    await pool.end();
    return false;
  }
}