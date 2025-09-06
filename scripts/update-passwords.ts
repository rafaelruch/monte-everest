import { db } from "../server/db";
import { professionals } from "../shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function updatePasswords() {
  console.log("Atualizando senhas dos profissionais existentes...");

  try {
    const allProfessionals = await db.select().from(professionals);
    
    for (const prof of allProfessionals) {
      if (!prof.password) {
        const tempPassword = "senha123";
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        await db.update(professionals)
          .set({ password: hashedPassword })
          .where(eq(professionals.id, prof.id));
        
        console.log(`Senha criada para ${prof.fullName}: senha123`);
      }
    }

    console.log("Senhas atualizadas com sucesso!");
    console.log("=== Credenciais de Login ===");
    console.log("Todos os profissionais podem fazer login com:");
    console.log("- Email: (email cadastrado)");
    console.log("- Senha: senha123");
  } catch (error) {
    console.error("Erro ao atualizar senhas:", error);
  }
}

updatePasswords();