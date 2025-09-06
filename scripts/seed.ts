import { db } from "../server/db";
import { users, categories, professionals, reviews, payments, contacts } from "../shared/schema";
import bcrypt from "bcryptjs";

async function seedDatabase() {
  console.log("🌱 Seeding database...");

  try {
    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const [adminUser] = await db.insert(users).values({
      email: "admin@monteeverest.com",
      password: hashedPassword,
      role: "admin"
    }).returning();
    console.log("✅ Admin user created:", adminUser.email);

    // Create categories
    const categoryData = [
      { name: "Limpeza", slug: "limpeza", description: "Serviços de limpeza doméstica e comercial", icon: "broom" },
      { name: "Eletricista", slug: "eletricista", description: "Instalações e reparos elétricos", icon: "bolt" },
      { name: "Encanador", slug: "encanador", description: "Serviços hidráulicos e encanamento", icon: "wrench" },
      { name: "Pintor", slug: "pintor", description: "Pintura residencial e comercial", icon: "paint-roller" },
      { name: "Jardinagem", slug: "jardinagem", description: "Cuidados com jardins e plantas", icon: "seedling" },
      { name: "Marido de Aluguel", slug: "marido-aluguel", description: "Pequenos reparos e consertos", icon: "tools" },
      { name: "Beleza", slug: "beleza", description: "Serviços de beleza e estética", icon: "cut" },
      { name: "Informática", slug: "informatica", description: "Suporte técnico e manutenção", icon: "laptop" },
    ];

    const createdCategories = await db.insert(categories).values(categoryData).returning();
    console.log("✅ Categories created:", createdCategories.length);

    // Create sample professionals
    const professionalData = [
      {
        fullName: "Maria Silva",
        email: "maria.silva@email.com",
        phone: "(11) 99999-1234",
        document: "123.456.789-00",
        categoryId: createdCategories.find(c => c.slug === "limpeza")!.id,
        serviceArea: "01310-100",
        city: "São Paulo",
        description: "Especializada em limpeza residencial com mais de 10 anos de experiência. Trabalho com produtos ecológicos e ofereço garantia de qualidade.",
        status: "active",
        paymentStatus: "active",
        lastPaymentDate: new Date(),
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        rating: "4.8",
        totalReviews: 23,
        rankingPosition: 1,
        socialMedia: { whatsapp: "5511999991234" }
      },
      {
        fullName: "João Santos",
        email: "joao.santos@email.com",
        phone: "(11) 99999-5678",
        document: "987.654.321-00",
        categoryId: createdCategories.find(c => c.slug === "eletricista")!.id,
        serviceArea: "01310-100",
        city: "São Paulo",
        description: "Eletricista certificado com experiência em instalações residenciais e comerciais. Atendimento 24h para emergências.",
        status: "active",
        paymentStatus: "active",
        lastPaymentDate: new Date(),
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        rating: "4.9",
        totalReviews: 31,
        rankingPosition: 1,
        socialMedia: { whatsapp: "5511999995678" }
      },
      {
        fullName: "Ana Costa",
        email: "ana.costa@email.com",
        phone: "(11) 99999-9012",
        document: "456.789.123-00",
        categoryId: createdCategories.find(c => c.slug === "encanador")!.id,
        serviceArea: "01310-100",
        city: "São Paulo",
        description: "Encanadora com mais de 8 anos de experiência. Especialista em desentupimentos, vazamentos e instalações hidráulicas.",
        status: "active",
        paymentStatus: "active",
        lastPaymentDate: new Date(),
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        rating: "4.7",
        totalReviews: 18,
        rankingPosition: 1,
        socialMedia: { whatsapp: "5511999999012" }
      },
      {
        fullName: "Carlos Oliveira",
        email: "carlos.oliveira@email.com",
        phone: "(11) 99999-3456",
        document: "789.123.456-00",
        categoryId: createdCategories.find(c => c.slug === "pintor")!.id,
        serviceArea: "01310-100",
        city: "São Paulo",
        description: "Pintor profissional especializado em acabamentos de alta qualidade. Trabalho com tintas premium e texturas decorativas.",
        status: "active",
        paymentStatus: "active",
        lastPaymentDate: new Date(),
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        rating: "4.6",
        totalReviews: 15,
        rankingPosition: 1,
        socialMedia: { whatsapp: "5511999993456" }
      },
      {
        fullName: "Fernanda Lima",
        email: "fernanda.lima@email.com",
        phone: "(11) 99999-7890",
        document: "321.654.987-00",
        categoryId: createdCategories.find(c => c.slug === "jardinagem")!.id,
        serviceArea: "01310-100",
        city: "São Paulo",
        description: "Paisagista e jardineira com formação técnica. Especializada em design de jardins, poda e manutenção de plantas ornamentais.",
        status: "active",
        paymentStatus: "active",
        lastPaymentDate: new Date(),
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        rating: "4.9",
        totalReviews: 27,
        rankingPosition: 1,
        socialMedia: { whatsapp: "5511999997890" }
      },
      {
        fullName: "Roberto Almeida",
        email: "roberto.almeida@email.com",
        phone: "(11) 99999-2468",
        document: "654.321.987-00",
        categoryId: createdCategories.find(c => c.slug === "marido-aluguel")!.id,
        serviceArea: "01310-100",
        city: "São Paulo",
        description: "Handyman experiente em pequenos reparos domésticos. Montagem de móveis, furação de paredes, instalação de suportes e muito mais.",
        status: "active",
        paymentStatus: "active",
        lastPaymentDate: new Date(),
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        rating: "4.5",
        totalReviews: 12,
        rankingPosition: 1,
        socialMedia: { whatsapp: "5511999992468" }
      }
    ];

    const createdProfessionals = await db.insert(professionals).values(professionalData).returning();
    console.log("✅ Professionals created:", createdProfessionals.length);

    // Create sample reviews
    const reviewsData = [];
    for (const professional of createdProfessionals) {
      const numReviews = Math.floor(Math.random() * 5) + 2; // 2-6 reviews per professional
      
      for (let i = 0; i < numReviews; i++) {
        const customerNames = ["Pedro Silva", "Ana Santos", "Carlos Lima", "Maria Costa", "José Oliveira", "Lucia Almeida"];
        const customerEmails = ["pedro@email.com", "ana@email.com", "carlos@email.com", "maria@email.com", "jose@email.com", "lucia@email.com"];
        const comments = [
          "Excelente profissional! Muito competente e pontual.",
          "Serviço de qualidade, recomendo!",
          "Ficou perfeito, superou minhas expectativas.",
          "Profissional dedicado e cuidadoso com os detalhes.",
          "Muito satisfeito com o trabalho realizado.",
          "Pontual e eficiente, voltaria a contratar."
        ];

        const randomIndex = Math.floor(Math.random() * customerNames.length);
        reviewsData.push({
          professionalId: professional.id,
          customerName: customerNames[randomIndex],
          customerEmail: customerEmails[randomIndex],
          rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
          comment: comments[Math.floor(Math.random() * comments.length)],
          isVerified: Math.random() > 0.3, // 70% verified
        });
      }
    }

    if (reviewsData.length > 0) {
      await db.insert(reviews).values(reviewsData);
      console.log("✅ Reviews created:", reviewsData.length);
    }

    // Create sample payments
    const paymentsData = [];
    for (const professional of createdProfessionals) {
      paymentsData.push({
        professionalId: professional.id,
        amount: "2990", // 29.90 em centavos
        currency: "BRL",
        status: "paid",
        paymentMethod: "credit_card",
        transactionId: `txn_${Date.now()}_${professional.id.slice(-8)}`,
        dueDate: new Date(),
        paidAt: new Date(),
      });
    }

    if (paymentsData.length > 0) {
      await db.insert(payments).values(paymentsData);
      console.log("✅ Payments created:", paymentsData.length);
    }

    // Create sample contacts
    const contactsData = [];
    for (const professional of createdProfessionals) {
      const numContacts = Math.floor(Math.random() * 3) + 1; // 1-3 contacts per professional
      
      for (let i = 0; i < numContacts; i++) {
        contactsData.push({
          professionalId: professional.id,
          customerName: "Cliente " + (i + 1),
          customerEmail: `cliente${i + 1}@email.com`,
          customerPhone: `(11) 9999${i}-${Math.floor(Math.random() * 9000) + 1000}`,
          contactMethod: Math.random() > 0.5 ? "whatsapp" : "phone",
          message: "Gostaria de solicitar um orçamento para os serviços.",
        });
      }
    }

    if (contactsData.length > 0) {
      await db.insert(contacts).values(contactsData);
      console.log("✅ Contacts created:", contactsData.length);
    }

    console.log("🎉 Database seeded successfully!");
    console.log("📋 Login credentials:");
    console.log("   Email: admin@monteeverest.com");
    console.log("   Password: admin123");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();