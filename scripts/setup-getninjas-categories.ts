import { db } from "../server/db";
import { categories } from "../shared/schema";

const getninjasCategoriesData = [
  // ASSISTÊNCIA TÉCNICA
  {
    name: "Assistência Técnica - Ar Condicionado",
    slug: "assistencia-tecnica-ar-condicionado",
    description: "Instalação, manutenção e reparo de sistemas de ar condicionado",
    parentCategory: "Assistência Técnica"
  },
  {
    name: "Assistência Técnica - Eletrodomésticos",
    slug: "assistencia-tecnica-eletrodomesticos",
    description: "Reparo de geladeiras, máquinas de lavar, microondas e outros eletrodomésticos",
    parentCategory: "Assistência Técnica"
  },
  {
    name: "Assistência Técnica - Eletrônicos",
    slug: "assistencia-tecnica-eletronicos",
    description: "Reparo de TVs, smartphones, tablets e equipamentos eletrônicos",
    parentCategory: "Assistência Técnica"
  },
  {
    name: "Assistência Técnica - Informática",
    slug: "assistencia-tecnica-informatica",
    description: "Reparo de computadores, notebooks e equipamentos de informática",
    parentCategory: "Assistência Técnica"
  },
  {
    name: "Assistência Técnica - Relógios",
    slug: "assistencia-tecnica-relogios",
    description: "Reparo e manutenção de relógios e smartwatches",
    parentCategory: "Assistência Técnica"
  },

  // AULAS
  {
    name: "Aulas de Idiomas",
    slug: "aulas-idiomas",
    description: "Professores particulares de inglês, espanhol, francês e outros idiomas",
    parentCategory: "Aulas"
  },
  {
    name: "Aulas de Música",
    slug: "aulas-musica",
    description: "Professores de piano, violão, canto e outros instrumentos musicais",
    parentCategory: "Aulas"
  },
  {
    name: "Aulas de Informática",
    slug: "aulas-informatica",
    description: "Cursos de programação, pacote Office, design e tecnologia",
    parentCategory: "Aulas"
  },
  {
    name: "Aulas de Esportes",
    slug: "aulas-esportes",
    description: "Personal trainers, professores de natação, artes marciais e outros esportes",
    parentCategory: "Aulas"
  },
  {
    name: "Reforço Escolar",
    slug: "reforco-escolar",
    description: "Professores particulares para todas as matérias escolares",
    parentCategory: "Aulas"
  },
  {
    name: "Preparação para Concursos",
    slug: "preparacao-concursos",
    description: "Professores especializados em preparação para concursos públicos",
    parentCategory: "Aulas"
  },

  // AUTOMÓVEIS
  {
    name: "Auto Elétrica",
    slug: "auto-eletrica",
    description: "Serviços de elétrica automotiva, bateria e sistema elétrico",
    parentCategory: "Automóveis"
  },
  {
    name: "Funilaria e Pintura",
    slug: "funilaria-pintura",
    description: "Reparo de lataria, pintura automotiva e restauração",
    parentCategory: "Automóveis"
  },
  {
    name: "Vidraçaria Automotiva",
    slug: "vidracaria-automotiva",
    description: "Troca e reparo de vidros automotivos, para-brisas",
    parentCategory: "Automóveis"
  },
  {
    name: "Mecânica Automotiva",
    slug: "mecanica-automotiva",
    description: "Manutenção e reparo de motores, freios e sistemas mecânicos",
    parentCategory: "Automóveis"
  },
  {
    name: "Borracharia",
    slug: "borracharia",
    description: "Serviços de pneus, alinhamento, balanceamento e suspensão",
    parentCategory: "Automóveis"
  },
  {
    name: "Guincho",
    slug: "guincho",
    description: "Serviços de guincho e reboque automotivo",
    parentCategory: "Automóveis"
  },
  {
    name: "Martelinho de Ouro",
    slug: "martelinho-ouro",
    description: "Remoção de amassados sem pintura",
    parentCategory: "Automóveis"
  },

  // CONSULTORIA
  {
    name: "Advocacia",
    slug: "advocacia",
    description: "Serviços jurídicos, advogados especializados em diversas áreas",
    parentCategory: "Consultoria"
  },
  {
    name: "Contabilidade",
    slug: "contabilidade",
    description: "Serviços contábeis, declaração de imposto de renda, consultoria fiscal",
    parentCategory: "Consultoria"
  },
  {
    name: "Tradução",
    slug: "traducao",
    description: "Serviços de tradução e interpretação de documentos e textos",
    parentCategory: "Consultoria"
  },
  {
    name: "Investigação Particular",
    slug: "investigacao-particular",
    description: "Serviços de detetive particular e investigação",
    parentCategory: "Consultoria"
  },
  {
    name: "Consultoria Financeira",
    slug: "consultoria-financeira",
    description: "Planejamento financeiro pessoal e empresarial",
    parentCategory: "Consultoria"
  },
  {
    name: "Palestras",
    slug: "palestras",
    description: "Palestrantes motivacionais e especialistas em diversos temas",
    parentCategory: "Consultoria"
  },

  // DESIGN E TECNOLOGIA
  {
    name: "Desenvolvimento Web",
    slug: "desenvolvimento-web",
    description: "Criação de sites, sistemas web e e-commerce",
    parentCategory: "Design e Tecnologia"
  },
  {
    name: "Desenvolvimento Mobile",
    slug: "desenvolvimento-mobile",
    description: "Desenvolvimento de aplicativos para Android e iOS",
    parentCategory: "Design e Tecnologia"
  },
  {
    name: "Design Gráfico",
    slug: "design-grafico",
    description: "Criação de materiais gráficos, identidade visual e peças publicitárias",
    parentCategory: "Design e Tecnologia"
  },
  {
    name: "Criação de Logos",
    slug: "criacao-logos",
    description: "Design de logotipos e identidade visual para empresas",
    parentCategory: "Design e Tecnologia"
  },
  {
    name: "Marketing Digital",
    slug: "marketing-digital",
    description: "Gestão de redes sociais, SEO, Google Ads e marketing online",
    parentCategory: "Design e Tecnologia"
  },
  {
    name: "Edição de Fotos e Vídeos",
    slug: "edicao-fotos-videos",
    description: "Tratamento de imagens e edição de vídeos profissionais",
    parentCategory: "Design e Tecnologia"
  },

  // EVENTOS
  {
    name: "Churrasqueiro",
    slug: "churrasqueiro",
    description: "Churrasqueiros profissionais para eventos e festas",
    parentCategory: "Eventos"
  },
  {
    name: "Buffet Completo",
    slug: "buffet-completo",
    description: "Serviços completos de buffet para casamentos e eventos",
    parentCategory: "Eventos"
  },
  {
    name: "Animação de Festa",
    slug: "animacao-festa",
    description: "Animadores infantis, palhaços e recreação para festas",
    parentCategory: "Eventos"
  },
  {
    name: "DJ",
    slug: "dj",
    description: "DJs para festas, casamentos e eventos",
    parentCategory: "Eventos"
  },
  {
    name: "Garçons e Copeiras",
    slug: "garcons-copeiras",
    description: "Equipe de garçons e copeiras para eventos",
    parentCategory: "Eventos"
  },
  {
    name: "Fotografia de Eventos",
    slug: "fotografia-eventos",
    description: "Fotógrafos especializados em casamentos e eventos sociais",
    parentCategory: "Eventos"
  },
  {
    name: "Decoração de Eventos",
    slug: "decoracao-eventos",
    description: "Decoração para casamentos, festas e eventos corporativos",
    parentCategory: "Eventos"
  },

  // MODA E BELEZA
  {
    name: "Cabeleireiro",
    slug: "cabeleireiro",
    description: "Cortes, coloração, escova e tratamentos capilares",
    parentCategory: "Moda e Beleza"
  },
  {
    name: "Manicure e Pedicure",
    slug: "manicure-pedicure",
    description: "Cuidados com unhas das mãos e pés",
    parentCategory: "Moda e Beleza"
  },
  {
    name: "Maquiagem",
    slug: "maquiagem",
    description: "Maquiadores para eventos, noivas e ocasiões especiais",
    parentCategory: "Moda e Beleza"
  },
  {
    name: "Design de Sobrancelhas",
    slug: "design-sobrancelhas",
    description: "Design, modelagem e coloração de sobrancelhas",
    parentCategory: "Moda e Beleza"
  },
  {
    name: "Costureira",
    slug: "costureira",
    description: "Ajustes, consertos e confecção de roupas",
    parentCategory: "Moda e Beleza"
  },
  {
    name: "Personal Stylist",
    slug: "personal-stylist",
    description: "Consultoria de estilo e moda pessoal",
    parentCategory: "Moda e Beleza"
  },
  {
    name: "Sapateiro",
    slug: "sapateiro",
    description: "Conserto e manutenção de calçados e artigos de couro",
    parentCategory: "Moda e Beleza"
  },
  {
    name: "Esteticista",
    slug: "esteticista",
    description: "Tratamentos estéticos faciais e corporais",
    parentCategory: "Moda e Beleza"
  },

  // REFORMAS E REPAROS
  {
    name: "Pedreiro",
    slug: "pedreiro",
    description: "Serviços de alvenaria, construção e reformas gerais",
    parentCategory: "Reformas e Reparos"
  },
  {
    name: "Pintor",
    slug: "pintor",
    description: "Pintura residencial, comercial e industrial",
    parentCategory: "Reformas e Reparos"
  },
  {
    name: "Eletricista",
    slug: "eletricista",
    description: "Instalações elétricas, reparos e manutenção elétrica",
    parentCategory: "Reformas e Reparos"
  },
  {
    name: "Encanador",
    slug: "encanador",
    description: "Instalações hidráulicas, reparos e desentupimento",
    parentCategory: "Reformas e Reparos"
  },
  {
    name: "Marceneiro",
    slug: "marceneiro",
    description: "Móveis sob medida, marcenaria e carpintaria",
    parentCategory: "Reformas e Reparos"
  },
  {
    name: "Serralheria",
    slug: "serralheria",
    description: "Portões, grades, estruturas metálicas e soldas",
    parentCategory: "Reformas e Reparos"
  },
  {
    name: "Jardinagem",
    slug: "jardinagem",
    description: "Cuidados com jardim, poda de árvores e paisagismo",
    parentCategory: "Reformas e Reparos"
  },
  {
    name: "Arquitetura",
    slug: "arquitetura",
    description: "Projetos arquitetônicos e design de interiores",
    parentCategory: "Reformas e Reparos"
  },
  {
    name: "Engenharia",
    slug: "engenharia",
    description: "Projetos estruturais e consultoria em engenharia",
    parentCategory: "Reformas e Reparos"
  },
  {
    name: "Dedetização",
    slug: "dedetizacao",
    description: "Controle de pragas e dedetização residencial e comercial",
    parentCategory: "Reformas e Reparos"
  },

  // SAÚDE
  {
    name: "Psicologia",
    slug: "psicologia",
    description: "Psicólogos e terapeutas para atendimento individual e familiar",
    parentCategory: "Saúde"
  },
  {
    name: "Nutrição",
    slug: "nutricao",
    description: "Nutricionistas para acompanhamento e reeducação alimentar",
    parentCategory: "Saúde"
  },
  {
    name: "Fisioterapia",
    slug: "fisioterapia",
    description: "Fisioterapeutas para reabilitação e tratamentos específicos",
    parentCategory: "Saúde"
  },
  {
    name: "Cuidadores",
    slug: "cuidadores",
    description: "Cuidadores de idosos e pessoas com necessidades especiais",
    parentCategory: "Saúde"
  },
  {
    name: "Enfermagem",
    slug: "enfermagem",
    description: "Técnicos e enfermeiros para cuidados domiciliares",
    parentCategory: "Saúde"
  },
  {
    name: "Terapias Alternativas",
    slug: "terapias-alternativas",
    description: "Acupuntura, massoterapia e outras terapias complementares",
    parentCategory: "Saúde"
  },

  // SERVIÇOS DOMÉSTICOS
  {
    name: "Diarista",
    slug: "diarista",
    description: "Profissionais de limpeza doméstica e faxina",
    parentCategory: "Serviços Domésticos"
  },
  {
    name: "Babá",
    slug: "baba",
    description: "Cuidadoras de crianças e babás especializadas",
    parentCategory: "Serviços Domésticos"
  },
  {
    name: "Cozinheira",
    slug: "cozinheira",
    description: "Cozinheiras domésticas e chefs particulares",
    parentCategory: "Serviços Domésticos"
  },
  {
    name: "Motorista Particular",
    slug: "motorista-particular",
    description: "Motoristas particulares e serviços de transporte",
    parentCategory: "Serviços Domésticos"
  },
  {
    name: "Personal Organizer",
    slug: "personal-organizer",
    description: "Organização e decoração de ambientes domésticos",
    parentCategory: "Serviços Domésticos"
  },
  {
    name: "Personal Shopper",
    slug: "personal-shopper",
    description: "Serviços de compras pessoais e assessoria de compras",
    parentCategory: "Serviços Domésticos"
  },
  {
    name: "Passadeira",
    slug: "passadeira",
    description: "Serviços de passar roupas e cuidados com tecidos",
    parentCategory: "Serviços Domésticos"
  },
  {
    name: "Passeador de Cães",
    slug: "passeador-caes",
    description: "Passeio e cuidados básicos com cães",
    parentCategory: "Serviços Domésticos"
  },
  {
    name: "Serviços Veterinários",
    slug: "servicos-veterinarios",
    description: "Veterinários para atendimento domiciliar",
    parentCategory: "Serviços Domésticos"
  },
  {
    name: "Limpeza de Piscina",
    slug: "limpeza-piscina",
    description: "Manutenção e limpeza de piscinas",
    parentCategory: "Serviços Domésticos"
  },
  {
    name: "Adestramento de Cães",
    slug: "adestramento-caes",
    description: "Treinamento e educação canina",
    parentCategory: "Serviços Domésticos"
  }
];

async function setupGetNinjasCategories() {
  console.log("🚀 Configurando categorias do GetNinjas...");

  try {
    // Limpar categorias existentes (opcional)
    console.log("🗑️ Limpando categorias existentes...");
    await db.delete(categories);

    // Inserir todas as categorias do GetNinjas
    console.log("📝 Inserindo categorias do GetNinjas...");
    const insertedCategories = await db.insert(categories).values(
      getninjasCategoriesData.map(cat => ({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        isActive: true
      }))
    ).returning();

    console.log(`✅ ${insertedCategories.length} categorias inseridas com sucesso!`);
    
    // Estatísticas por grupo
    const stats: Record<string, number> = {};
    getninjasCategoriesData.forEach(cat => {
      stats[cat.parentCategory] = (stats[cat.parentCategory] || 0) + 1;
    });

    console.log("\n📊 Estatísticas por grupo:");
    Object.entries(stats).forEach(([group, count]) => {
      console.log(`   ${group}: ${count} categorias`);
    });

    console.log("\n🎉 Configuração concluída!");
    console.log("💡 Agora os profissionais podem escolher entre todas essas categorias!");

  } catch (error) {
    console.error("❌ Erro ao configurar categorias:", error);
    throw error;
  }
}

setupGetNinjasCategories();