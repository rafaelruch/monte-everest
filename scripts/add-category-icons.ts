import { db } from "../server/db";
import { categories } from "../shared/schema";
import { eq } from "drizzle-orm";

const categoryIcons: Record<string, string> = {
  // Assistência Técnica
  "assistencia-tecnica-ar-condicionado": "snowflake",
  "assistencia-tecnica-eletrodomesticos": "refrigerator", 
  "assistencia-tecnica-eletronicos": "tv",
  "assistencia-tecnica-informatica": "laptop",
  "assistencia-tecnica-relogios": "clock",

  // Aulas
  "aulas-idiomas": "languages",
  "aulas-musica": "music",
  "aulas-informatica": "code",
  "aulas-esportes": "activity",
  "reforco-escolar": "book",
  "preparacao-concursos": "graduation-cap",

  // Automóveis
  "auto-eletrica": "zap",
  "funilaria-pintura": "palette",
  "vidracaria-automotiva": "car",
  "mecanica-automotiva": "wrench",
  "borracharia": "disc",
  "guincho": "truck",
  "martelinho-ouro": "hammer",

  // Consultoria
  "advocacia": "scale",
  "contabilidade": "calculator",
  "traducao": "globe",
  "investigacao-particular": "search",
  "consultoria-financeira": "trending-up",
  "palestras": "mic",

  // Design e Tecnologia
  "desenvolvimento-web": "code",
  "desenvolvimento-mobile": "smartphone",
  "design-grafico": "palette",
  "criacao-logos": "pen-tool",
  "marketing-digital": "megaphone",
  "edicao-fotos-videos": "camera",

  // Eventos
  "churrasqueiro": "chef-hat",
  "buffet-completo": "utensils",
  "animacao-festa": "party-popper",
  "dj": "music",
  "garcons-copeiras": "coffee",
  "fotografia-eventos": "camera",
  "decoracao-eventos": "flower",

  // Moda e Beleza
  "cabeleireiro": "scissors",
  "manicure-pedicure": "sparkles",
  "maquiagem": "palette",
  "design-sobrancelhas": "eye",
  "costureira": "shirt",
  "personal-stylist": "hanger",
  "sapateiro": "shoe-prints",
  "esteticista": "heart",

  // Reformas e Reparos
  "pedreiro": "hard-hat",
  "pintor": "paint-bucket",
  "eletricista": "zap",
  "encanador": "droplet",
  "marceneiro": "saw",
  "serralheria": "hammer",
  "jardinagem": "flower",
  "arquitetura": "building",
  "engenharia": "compass",
  "dedetizacao": "bug",

  // Saúde
  "psicologia": "brain",
  "nutricao": "apple",
  "fisioterapia": "activity",
  "cuidadores": "heart",
  "enfermagem": "cross",
  "terapias-alternativas": "leaf",

  // Serviços Domésticos
  "diarista": "broom",
  "baba": "baby",
  "cozinheira": "chef-hat",
  "motorista-particular": "car",
  "personal-organizer": "grid",
  "personal-shopper": "shopping-bag",
  "passadeira": "iron",
  "passeador-caes": "dog",
  "servicos-veterinarios": "heart-pulse",
  "limpeza-piscina": "waves",
  "adestramento-caes": "dog"
};

async function addCategoryIcons() {
  console.log("🎨 Adicionando ícones às categorias...");

  try {
    const allCategories = await db.select().from(categories);
    let updatedCount = 0;

    for (const category of allCategories) {
      const icon = categoryIcons[category.slug];
      if (icon) {
        await db
          .update(categories)
          .set({ icon })
          .where(eq(categories.id, category.id));
        
        console.log(`   ✅ ${category.name}: ${icon}`);
        updatedCount++;
      } else {
        console.log(`   ⚠️  ${category.name}: ícone não encontrado para slug '${category.slug}'`);
      }
    }

    console.log(`\n🎉 ${updatedCount} categorias atualizadas com ícones!`);
    console.log("💡 Os ícones agora aparecerão na interface das categorias");

  } catch (error) {
    console.error("❌ Erro ao adicionar ícones:", error);
    throw error;
  }
}

addCategoryIcons();