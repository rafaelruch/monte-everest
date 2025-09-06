import { db } from "../server/db";
import { categories, professionals, reviews, contacts, users } from "../shared/schema";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";

async function setupDatabase() {
  console.log("🚀 Configurando banco de dados...");

  try {
    // Limpar dados
    await db.delete(reviews);
    await db.delete(contacts); 
    await db.delete(professionals);
    await db.delete(categories);
    await db.delete(users);

    // Criar admin
    await db.insert(users).values({
      email: "admin@monteeverest.com",
      password: await bcrypt.hash("admin123", 10),
      role: "admin"
    });

    // Criar categorias
    const cats = await db.insert(categories).values([
      { name: "Limpeza Residencial", slug: "limpeza-residencial", description: "Serviços de limpeza" },
      { name: "Manutenção", slug: "manutencao", description: "Reparos e manutenção" },
      { name: "Jardinagem", slug: "jardinagem", description: "Cuidados com jardim" },
      { name: "Beleza", slug: "beleza", description: "Serviços de beleza" },
      { name: "Culinária", slug: "culinaria", description: "Chef e cozinheira" },
      { name: "Cuidados", slug: "cuidados", description: "Cuidador e babá" }
    ]).returning();

    // Criar profissionais
    const profs = await db.insert(professionals).values([
      {
        fullName: "Maria Silva",
        email: "maria.silva@email.com",
        password: await bcrypt.hash("senha123", 10),
        phone: "(11) 99999-0001",
        document: "12345678901",
        categoryId: cats[0].id,
        serviceArea: "01234-567",
        description: "Profissional de limpeza com 10 anos de experiência",
        status: "active",
        paymentStatus: "active",
        rating: "4.8",
        totalReviews: 2
      },
      {
        fullName: "João Santos",
        email: "joao.santos@email.com",
        password: await bcrypt.hash("senha123", 10),
        phone: "(11) 99999-0002",
        document: "12345678902",
        categoryId: cats[1].id,
        serviceArea: "01234-567",
        description: "Eletricista e encanador qualificado",
        status: "active",
        paymentStatus: "active",
        rating: "4.9",
        totalReviews: 3
      },
      {
        fullName: "Ana Costa",
        email: "ana.costa@email.com",
        password: await bcrypt.hash("senha123", 10),
        phone: "(11) 99999-0003",
        document: "12345678903",
        categoryId: cats[2].id,
        serviceArea: "01234-567",
        description: "Paisagista especializada em jardins residenciais",
        status: "active",
        paymentStatus: "active",
        rating: "4.7",
        totalReviews: 2
      }
    ]).returning();

    // Criar avaliações
    await db.insert(reviews).values([
      {
        professionalId: profs[0].id,
        customerName: "Ana Paula",
        customerEmail: "ana@email.com",
        rating: 5,
        comment: "Serviço excelente! Muito caprichosa.",
        isVerified: true
      },
      {
        professionalId: profs[0].id,
        customerName: "Carlos Lima",
        customerEmail: "carlos@email.com",
        rating: 5,
        comment: "Profissional muito confiável e pontual."
      },
      {
        professionalId: profs[1].id,
        customerName: "Mariana Silva",
        customerEmail: "mariana@email.com",
        rating: 5,
        comment: "Resolveu o problema rapidamente!"
      }
    ]);

    // Criar contatos
    await db.insert(contacts).values([
      {
        professionalId: profs[0].id,
        customerName: "Roberto Santos",
        customerEmail: "roberto@email.com",
        customerPhone: "(11) 98888-1111",
        contactMethod: "whatsapp",
        message: "Preciso de limpeza completa da casa"
      },
      {
        professionalId: profs[1].id,
        customerName: "Julia Costa",
        customerEmail: "julia@email.com", 
        customerPhone: "(11) 98888-2222",
        contactMethod: "phone",
        message: "Problema no chuveiro elétrico"
      }
    ]);

    console.log("✅ Banco configurado!");
    console.log("\n=== CREDENCIAIS ===");
    console.log("Admin: admin@monteeverest.com / admin123");
    console.log("Profissionais: qualquer email / senha123");
    console.log("Ex: maria.silva@email.com / senha123");

  } catch (error) {
    console.error("❌ Erro:", error);
  }
}

setupDatabase();