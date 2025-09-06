import { db } from "../server/db";
import { 
  categories, 
  professionals, 
  reviews, 
  contacts, 
  users 
} from "../shared/schema";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";

async function setupCompleteDatabase() {
  console.log("🚀 Configurando banco de dados completo...");

  try {
    // Limpar dados existentes
    await db.delete(reviews);
    await db.delete(contacts);
    await db.delete(professionals);
    await db.delete(categories);
    await db.delete(users);

    console.log("✅ Dados existentes removidos");

    // 1. Criar categorias
    const categoriesData = [
      { 
        name: "Limpeza Residencial", 
        slug: "limpeza-residencial",
        description: "Serviços de limpeza doméstica, faxina e organização"
      },
      { 
        name: "Manutenção", 
        slug: "manutencao",
        description: "Reparos domésticos, elétrica, hidráulica e reformas"
      },
      { 
        name: "Jardinagem", 
        slug: "jardinagem",
        description: "Cuidados com jardim, poda e paisagismo"
      },
      { 
        name: "Beleza", 
        slug: "beleza",
        description: "Manicure, pedicure, cabelo e estética"
      },
      { 
        name: "Culinária", 
        slug: "culinaria",
        description: "Chef pessoal, cozinheira e serviços gastronômicos"
      },
      { 
        name: "Cuidados", 
        slug: "cuidados",
        description: "Babá, cuidador de idosos e acompanhante"
      },
      { 
        name: "Pet Care", 
        slug: "pet-care",
        description: "Cuidados com animais de estimação"
      },
      { 
        name: "Educação", 
        slug: "educacao",
        description: "Professores particulares e reforço escolar"
      },
      { 
        name: "Tecnologia", 
        slug: "tecnologia",
        description: "Suporte técnico e desenvolvimento"
      },
      { 
        name: "Transporte", 
        slug: "transporte",
        description: "Motorista particular e entregas"
      }
    ];

    const createdCategories = await db.insert(categories).values(categoriesData).returning();
    console.log(`✅ ${createdCategories.length} categorias criadas`);

    // 2. Criar usuário administrador
    const adminData = {
      id: nanoid(),
      email: "admin@monteeverest.com",
      password: await bcrypt.hash("admin123", 10),
      role: "admin",
    };

    await db.insert(users).values(adminData);
    console.log("✅ Usuário administrador criado");

    // 3. Criar profissionais mais realistas
    const professionalsData = [
      {
        fullName: "Maria Silva",
        email: "maria.silva@email.com",
        password: await bcrypt.hash("senha123", 10),
        phone: "(11) 99999-0001",
        document: "12345678901",
        categoryId: createdCategories.find(c => c.slug === "limpeza-residencial")!.id,
        serviceArea: "01234-567",
        description: "Profissional de limpeza com 10 anos de experiência. Especializada em limpeza residencial completa, organização e cuidados especiais com móveis delicados.",
        status: "active",
        paymentStatus: "active",
        lastPaymentDate: new Date("2025-08-15"),
        rating: "4.8",
        totalReviews: 3,
        createdAt: new Date("2024-01-15"),
      },
      {
        fullName: "João Santos",
        email: "joao.santos@email.com", 
        password: await bcrypt.hash("senha123", 10),
        phone: "(11) 99999-0002",
        address: "Av. Paulista, 456",
        city: "São Paulo",
        state: "SP",
        zipCode: "01310-100",
        categoryId: createdCategories.find(c => c.slug === "manutencao")!.id,
        serviceAreas: "Toda São Paulo",
        description: "Eletricista e encanador qualificado. Atendo emergências 24h, instalações elétricas, reparos hidráulicos e pequenas reformas residenciais.",
        hourlyRate: 50.00,
        isVerified: true,
        createdAt: new Date("2024-02-20"),
        lastPaymentDate: new Date("2025-08-20"),
      },
      {
        fullName: "Ana Costa",
        email: "ana.costa@email.com",
        password: await bcrypt.hash("senha123", 10),
        phone: "(11) 99999-0003",
        address: "Rua dos Jardins, 789",
        city: "São Paulo",
        state: "SP", 
        zipCode: "01234-890",
        categoryId: createdCategories.find(c => c.slug === "jardinagem")!.id,
        serviceAreas: "Zona Oeste, Zona Sul",
        description: "Paisagista e jardineira especializada em projetos residenciais. Cuidado com plantas ornamentais, poda técnica e design de jardins.",
        hourlyRate: 40.00,
        isVerified: true,
        createdAt: new Date("2024-03-10"),
        lastPaymentDate: new Date("2025-08-10"),
      },
      {
        fullName: "Carlos Oliveira",
        email: "carlos.oliveira@email.com",
        password: await bcrypt.hash("senha123", 10),
        phone: "(11) 99999-0004",
        address: "Rua da Consolação, 321",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234-321",
        categoryId: createdCategories.find(c => c.slug === "beleza")!.id,
        serviceAreas: "Centro, Vila Madalena",
        description: "Cabeleireiro profissional com formação em Paris. Especialista em cortes modernos, coloração e tratamentos capilares. Atendimento domiciliar.",
        hourlyRate: 60.00,
        isVerified: true,
        createdAt: new Date("2024-04-05"),
        lastPaymentDate: new Date("2025-08-05"),
      },
      {
        fullName: "Fernanda Lima",
        email: "fernanda.lima@email.com",
        password: await bcrypt.hash("senha123", 10),
        phone: "(11) 99999-0005",
        address: "Alameda Santos, 654",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234-654",
        categoryId: createdCategories.find(c => c.slug === "culinaria")!.id,
        serviceAreas: "Jardins, Itaim, Vila Olímpia",
        description: "Chef especializada em culinária brasileira e internacional. Preparo de refeições em domicílio, eventos e aulas de culinária.",
        hourlyRate: 80.00,
        isVerified: true,
        createdAt: new Date("2024-05-12"),
        lastPaymentDate: new Date("2025-08-12"),
      },
      {
        fullName: "Roberto Almeida",
        email: "roberto.almeida@email.com",
        password: await bcrypt.hash("senha123", 10),
        phone: "(11) 99999-0006",
        address: "Rua Augusta, 987",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234-987",
        categoryId: createdCategories.find(c => c.slug === "cuidados")!.id,
        serviceAreas: "Zona Norte, Centro",
        description: "Cuidador de idosos certificado com 8 anos de experiência. Especializado em cuidados médicos básicos, companhia e atividades terapêuticas.",
        hourlyRate: 25.00,
        isVerified: true,
        createdAt: new Date("2024-06-18"),
        lastPaymentDate: new Date("2025-08-18"),
      },
      {
        fullName: "Patrícia Rodrigues",
        email: "patricia.rodrigues@email.com",
        password: await bcrypt.hash("senha123", 10),
        phone: "(11) 99999-0007",
        address: "Rua Vergueiro, 234",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234-234",
        categoryId: createdCategories.find(c => c.slug === "pet-care")!.id,
        serviceAreas: "Vila Mariana, Saúde",
        description: "Veterinária e pet sitter especializada em cuidados domiciliares. Passeios, cuidados médicos básicos e hospedagem responsável.",
        hourlyRate: 30.00,
        isVerified: true,
        createdAt: new Date("2024-07-22"),
        lastPaymentDate: new Date("2025-08-22"),
      },
      {
        fullName: "André Silva",
        email: "andre.silva@email.com",
        password: await bcrypt.hash("senha123", 10),
        phone: "(11) 99999-0008",
        address: "Av. Faria Lima, 567",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234-567",
        categoryId: createdCategories.find(c => c.slug === "educacao")!.id,
        serviceAreas: "Pinheiros, Faria Lima",
        description: "Professor de matemática e física com mestrado pela USP. Especializado em vestibular, ENEM e reforço escolar para ensino médio.",
        hourlyRate: 45.00,
        isVerified: true,
        createdAt: new Date("2024-08-15"),
        lastPaymentDate: new Date("2025-08-25"),
      }
    ];

    const createdProfessionals = await db.insert(professionals).values(professionalsData).returning();
    console.log(`✅ ${createdProfessionals.length} profissionais criados`);

    // 4. Criar avaliações realistas
    const reviewsData = [
      // Maria Silva (Limpeza)
      { professionalId: createdProfessionals[0].id, clientName: "Ana Paula", clientEmail: "ana.paula@email.com", rating: 5, comment: "Maria é excepcional! Minha casa ficou impecável e ela teve muito cuidado com meus móveis antigos. Super recomendo!", createdAt: new Date("2025-08-20") },
      { professionalId: createdProfessionals[0].id, clientName: "Ricardo Santos", clientEmail: "ricardo@email.com", rating: 5, comment: "Profissional muito confiável, pontual e caprichosa. Já é a terceira vez que contrato e sempre superou as expectativas.", createdAt: new Date("2025-08-15") },
      { professionalId: createdProfessionals[0].id, clientName: "Juliana Costa", clientEmail: "ju.costa@email.com", rating: 4, comment: "Muito boa profissional, organizou tudo perfeitamente. Única observação é que demorou um pouco mais que o esperado.", createdAt: new Date("2025-08-10") },

      // João Santos (Manutenção)
      { professionalId: createdProfessionals[1].id, clientName: "Pedro Lima", clientEmail: "pedro.lima@email.com", rating: 5, comment: "João resolveu um problema elétrico complexo que outros profissionais não conseguiram. Muito competente e honesto no preço.", createdAt: new Date("2025-08-18") },
      { professionalId: createdProfessionals[1].id, clientName: "Mariana Oliveira", clientEmail: "mari.oliveira@email.com", rating: 5, comment: "Excelente trabalho! Trocou todos os registros e ainda deu dicas de manutenção preventiva. Recomendo!", createdAt: new Date("2025-08-12") },

      // Ana Costa (Jardinagem)
      { professionalId: createdProfessionals[2].id, clientName: "Roberto Silva", clientEmail: "roberto.s@email.com", rating: 5, comment: "Ana transformou meu jardim! Tem muito conhecimento técnico e sugeriu plantas perfeitas para o ambiente.", createdAt: new Date("2025-08-25") },
      { professionalId: createdProfessionals[2].id, clientName: "Laura Mendes", clientEmail: "laura.mendes@email.com", rating: 4, comment: "Trabalho muito bem feito, jardim ficou lindo. Profissional muito educada e cuidadosa.", createdAt: new Date("2025-08-08") },

      // Carlos Oliveira (Beleza)
      { professionalId: createdProfessionals[3].id, clientName: "Sophia Alves", clientEmail: "sophia.alves@email.com", rating: 5, comment: "Carlos é um artista! Meu cabelo nunca ficou tão bonito. Atendimento em casa foi super conveniente.", createdAt: new Date("2025-08-22") },
      { professionalId: createdProfessionals[3].id, clientName: "Isabella Rocha", clientEmail: "isa.rocha@email.com", rating: 5, comment: "Profissional incrível, muito atualizado com as tendências. Resultado superou todas as minhas expectativas!", createdAt: new Date("2025-08-14") },

      // Fernanda Lima (Culinária)
      { professionalId: createdProfessionals[4].id, clientName: "Gustavo Reis", clientEmail: "gustavo.reis@email.com", rating: 5, comment: "Fernanda preparou um jantar espetacular para minha família. Comida deliciosa e apresentação impecável!", createdAt: new Date("2025-08-21") },

      // Roberto Almeida (Cuidados)
      { professionalId: createdProfessionals[5].id, clientName: "Carmen Souza", clientEmail: "carmen.souza@email.com", rating: 5, comment: "Roberto cuida da minha mãe com muito carinho e profissionalismo. Família inteira confia nele!", createdAt: new Date("2025-08-17") },

      // Patrícia Rodrigues (Pet Care)
      { professionalId: createdProfessionals[6].id, clientName: "Lucas Barbosa", clientEmail: "lucas.barbosa@email.com", rating: 5, comment: "Patrícia cuidou do meu Golden com muito amor. Veterinária competente e pessoa de confiança total!", createdAt: new Date("2025-08-19") },

      // André Silva (Educação)
      { professionalId: createdProfessionals[7].id, clientName: "Monica Castro", clientEmail: "monica.castro@email.com", rating: 5, comment: "André é um excelente professor! Meu filho melhorou muito em matemática. Didática perfeita e muita paciência.", createdAt: new Date("2025-08-16") }
    ];

    await db.insert(reviews).values(reviewsData);
    console.log(`✅ ${reviewsData.length} avaliações criadas`);

    // 5. Criar contatos/leads
    const contactsData = [
      { professionalId: createdProfessionals[0].id, clientName: "Bruna Martins", clientEmail: "bruna.martins@email.com", clientPhone: "(11) 98888-1111", message: "Preciso de limpeza completa da casa para o final de semana", createdAt: new Date("2025-08-30") },
      { professionalId: createdProfessionals[1].id, clientName: "Daniel Costa", clientEmail: "daniel.costa@email.com", clientPhone: "(11) 98888-2222", message: "Tenho um problema no chuveiro elétrico, urgente", createdAt: new Date("2025-08-29") },
      { professionalId: createdProfessionals[2].id, clientName: "Vanessa Santos", clientEmail: "vanessa.santos@email.com", clientPhone: "(11) 98888-3333", message: "Quero fazer um projeto de jardim na minha varanda", createdAt: new Date("2025-08-28") },
      { professionalId: createdProfessionals[3].id, clientName: "Thiago Oliveira", clientEmail: "thiago.oliveira@email.com", clientPhone: "(11) 98888-4444", message: "Preciso de um corte moderno para uma entrevista importante", createdAt: new Date("2025-08-31") },
      { professionalId: createdProfessionals[4].id, clientName: "Camila Lima", clientEmail: "camila.lima@email.com", clientPhone: "(11) 98888-5555", message: "Gostaria de contratar para jantar de aniversário (10 pessoas)", createdAt: new Date("2025-08-30") }
    ];

    await db.insert(contacts).values(contactsData);
    console.log(`✅ ${contactsData.length} contatos/leads criados`);

    console.log("🎉 Banco de dados configurado com sucesso!");
    console.log("\n=== CREDENCIAIS DE ACESSO ===");
    console.log("👑 ADMINISTRADOR:");
    console.log("   Email: admin@monteeverest.com");
    console.log("   Senha: admin123");
    console.log("   URL: /entrar");
    console.log("\n👨‍💼 PROFISSIONAIS (todos com senha: senha123):");
    createdProfessionals.forEach((prof, index) => {
      console.log(`   ${prof.fullName} - ${prof.email}`);
    });
    console.log("   URL: /professional-login");
    console.log("\n📊 DADOS CRIADOS:");
    console.log(`   • ${createdCategories.length} categorias`);
    console.log(`   • ${createdProfessionals.length} profissionais`);
    console.log(`   • ${reviewsData.length} avaliações`);
    console.log(`   • ${contactsData.length} contatos/leads`);
    console.log(`   • 1 administrador`);

  } catch (error) {
    console.error("❌ Erro ao configurar banco:", error);
    throw error;
  }
}

setupCompleteDatabase();