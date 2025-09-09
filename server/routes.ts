import type { Express, Request, Response, NextFunction } from "express";
import './types'; // Import type declarations
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pg from 'pg';
import crypto from 'crypto';

const { Pool: PgPool } = pg;
import { insertProfessionalSchema, insertReviewSchema, insertContactSchema } from "@shared/schema";
import { z } from "zod";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { pagarmeService } from "./pagarme";
import { createDatabaseTables, checkDatabaseConnection, installDatabaseModule, type DatabaseModule } from "./auto-installer";

const JWT_SECRET = process.env.JWT_SECRET || "monte-everest-secret-key";

// Middleware to verify admin JWT token
const verifyAdminToken = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: "Token de acesso requerido" });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ message: "Acesso não autorizado" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
};

// Middleware to verify professional JWT token
const verifyProfessionalToken = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: "Token de acesso requerido" });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const professional = await storage.getProfessional(decoded.professionalId);
    
    if (!professional) {
      return res.status(401).json({ message: "Acesso não autorizado" });
    }
    
    req.professional = professional;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
};

// ViaCEP integration
const validateCEP = async (cep: string) => {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    return !data.erro;
  } catch {
    return false;
  }
};

// Pagar.me integration (mock implementation - replace with actual Pagar.me SDK)
const processPagarMePayment = async (paymentData: any) => {
  // This would integrate with actual Pagar.me API
  // For now, returning mock successful payment
  return {
    success: true,
    transactionId: `txn_${Date.now()}`,
    status: 'paid'
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Public API Routes

  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/categories/popular", async (req, res) => {
    try {
      const popularCategories = await storage.getPopularCategories();
      res.json(popularCategories);
    } catch (error) {
      console.error("Error fetching popular categories:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Search professionals
  app.get("/api/professionals/search", async (req, res) => {
    try {
      const { category, location, page = 1, limit = 12, sortBy = 'rating' } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const professionals = await storage.getProfessionals({
        categoryId: category as string,
        city: location as string,
        status: 'active',
        limit: parseInt(limit as string),
        offset,
        // sortBy removed as it doesn't exist in filter interface
      });
      
      res.json(professionals);
    } catch (error) {
      console.error("Error searching professionals:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get professional by ID
  app.get("/api/professionals/:id", async (req, res) => {
    try {
      const professional = await storage.getProfessional(req.params.id);
      if (!professional) {
        return res.status(404).json({ message: "Profissional não encontrado" });
      }
      res.json(professional);
    } catch (error) {
      console.error("Error fetching professional:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get professional reviews
  app.get("/api/professionals/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviews(req.params.id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Professional authentication routes
  app.post("/api/professionals/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }
      
      const professional = await storage.authenticateProfessional(email, password);
      
      if (!professional) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { professionalId: professional.id, email: professional.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Check if this is first login (using default password)
      const isFirstLogin = password === 'senha123';
      
      res.json({
        professional: {
          id: professional.id,
          email: professional.email,
          fullName: professional.fullName,
          status: professional.status,
          firstLogin: isFirstLogin
        },
        token,
        firstLogin: isFirstLogin,
        redirectTo: isFirstLogin ? '/professional-change-password' : '/professional-dashboard'
      });
    } catch (error) {
      console.error("Error during professional login:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Professional change password endpoint
  app.post("/api/professionals/change-password", async (req, res) => {
    try {
      const { email, currentPassword, newPassword } = req.body;
      
      if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Nova senha deve ter pelo menos 6 caracteres" });
      }

      // Verify current password
      const professional = await storage.authenticateProfessional(email, currentPassword);
      if (!professional) {
        return res.status(401).json({ message: "Senha atual incorreta" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password in database
      await storage.updateProfessional(professional.id, {
        password: hashedPassword
      });

      res.json({ 
        message: "Senha alterada com sucesso!",
        redirectTo: '/professional-dashboard'
      });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Installation endpoint
  // Check if application is already installed
  app.get("/api/install/status", async (req, res) => {
    try {
      // Direct database check without SSL for installation status
      const dbUrl = process.env.DATABASE_URL;
      
      if (!dbUrl) {
        return res.json({ installed: false, needsInstallation: true });
      }
      
      const pool = new PgPool({ 
        connectionString: dbUrl, 
        ssl: false // Force SSL false for installation check
      });
      
      try {
        const client = await pool.connect();
        const result = await client.query(`SELECT COUNT(*) as count FROM users WHERE role = 'admin'`);
        const adminCount = parseInt(result.rows[0].count);
        client.release();
        await pool.end();
        
        const isInstalled = adminCount > 0;
        res.json({ 
          installed: isInstalled,
          needsInstallation: !isInstalled
        });
      } catch (dbError) {
        await pool.end();
        // If table doesn't exist or other DB error, system needs installation
        console.log("[install-status] DB error (likely tables don't exist):", dbError.message);
        res.json({ 
          installed: false,
          needsInstallation: true
        });
      }
    } catch (error) {
      console.error("Error checking installation status:", error);
      res.json({ 
        installed: false,
        needsInstallation: true
      });
    }
  });

  // ENDPOINT SIMPLES PARA CRIAR TABELAS
  app.post("/api/setup-tables", async (req, res) => {
    try {
      const { databaseUrl } = req.body;
      
      if (!databaseUrl) {
        return res.status(400).json({ message: "URL do banco de dados é obrigatória" });
      }

      console.log("[setup-tables] Iniciando criação das tabelas...");
      
      // Testar conexão primeiro
      const connectionOk = await checkDatabaseConnection(databaseUrl);
      if (!connectionOk) {
        return res.status(400).json({ 
          message: "Não foi possível conectar ao banco de dados. Verifique a URL." 
        });
      }

      // Criar tabelas
      const tablesCreated = await createDatabaseTables(databaseUrl);
      if (!tablesCreated) {
        return res.status(500).json({ 
          message: "Erro ao criar tabelas no banco de dados" 
        });
      }

      console.log("[setup-tables] ✅ Tabelas criadas com sucesso!");
      
      res.json({ 
        success: true,
        message: "✅ Todas as tabelas foram criadas com sucesso! Agora você pode configurar a aplicação normalmente." 
      });
      
    } catch (error) {
      console.error("[setup-tables] Erro:", error);
      res.status(500).json({ 
        message: `Erro ao criar tabelas: ${error instanceof Error ? error.message : "Erro desconhecido"}` 
      });
    }
  });

  // Emergency reset endpoint - only works when tables don't exist
  app.post("/api/install/force-reset", async (req, res) => {
    try {
      // Try to check if tables exist
      const adminUsers = await storage.getAdminUsers();
      // If this succeeds, system is already working
      return res.status(400).json({ message: "Sistema já está funcionando" });
    } catch (error) {
      // Tables don't exist - allow reset
      res.json({ 
        message: "Reset realizado - sistema pronto para instalação",
        installed: false,
        needsInstallation: true
      });
    }
  });

  app.post("/api/install", async (req, res) => {
    try {
      const { adminEmail, adminPassword, siteName, databaseUrl, siteUrl } = req.body;
      
      if (!adminEmail || !adminPassword) {
        return res.status(400).json({ message: "Email e senha do admin são obrigatórios" });
      }

      // Always create tables first - this is the main installation process
      const targetDatabaseUrl = databaseUrl || process.env.DATABASE_URL;
      
      if (!targetDatabaseUrl) {
        return res.status(400).json({ 
          message: "DATABASE_URL não configurada. Forneça uma URL de banco de dados." 
        });
      }
      
      console.log("[install] Criando tabelas automaticamente...");
      
      // Test connection first
      const connectionOk = await checkDatabaseConnection(targetDatabaseUrl);
      if (!connectionOk) {
        return res.status(400).json({ 
          message: "Não foi possível conectar ao banco de dados. Verifique a URL de conexão." 
        });
      }

      // Create all tables
      const tablesCreated = await createDatabaseTables(targetDatabaseUrl);
      if (!tablesCreated) {
        return res.status(500).json({ 
          message: "Erro ao criar tabelas no banco de dados" 
        });
      }

      console.log("[install] ✅ Tabelas criadas com sucesso!");

      // NOW check if already installed (after tables exist) using direct query
      try {

        const pool = new PgPool({ 
          connectionString: targetDatabaseUrl, 
          ssl: false 
        });
        
        const client = await pool.connect();
        const result = await client.query(`SELECT COUNT(*) as count FROM users WHERE role = 'admin'`);
        const adminCount = parseInt(result.rows[0].count);
        client.release();
        await pool.end();
        
        if (adminCount > 0) {
          return res.status(400).json({ message: "Sistema já foi instalado" });
        }
      } catch (error) {
        // If still fails after creating tables, tables were not created properly
        console.error("[install] Erro após criar tabelas:", error);
        return res.status(500).json({ message: "Erro ao verificar instalação após criar tabelas" });
      }

      // Hash password and create admin using direct SQL to avoid SSL issues
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      // Create admin user with direct SQL query
      try {

        const pool = new PgPool({ 
          connectionString: targetDatabaseUrl, 
          ssl: false 
        });
        
        const client = await pool.connect();
        const adminId = crypto.randomUUID();
        await client.query(`
          INSERT INTO users (id, email, password, role, is_system_admin, created_at, updated_at)
          VALUES ($1, $2, $3, 'admin', true, NOW(), NOW())
        `, [adminId, adminEmail, hashedPassword]);
        
        client.release();
        await pool.end();
        
        console.log("[install] ✅ Admin criado com sucesso!");
      } catch (error) {
        console.error("[install] Erro ao criar admin:", error);
        return res.status(500).json({ message: "Erro ao criar usuário admin" });
      }

      // Create installation configuration record
      const installConfig = {
        siteName: siteName || "Monte Everest",
        siteUrl: siteUrl || "",
        installedAt: new Date().toISOString(),
        installedBy: adminUser.id,
        version: "1.0.0"
      };

      // Save installation config
      await storage.saveInstallationConfig(installConfig);

      // Create default categories if none exist
      await storage.createInitialData();

      // Create system logs entry
      await storage.createLog({
        userId: adminUser.id,
        action: 'system_installation',
        entityType: 'system',
        entityId: 'installation',
        details: {
          siteName: installConfig.siteName,
          adminEmail: adminEmail,
          version: installConfig.version,
          dataPopulated: true
        },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      res.json({ 
        success: true, 
        message: "Sistema instalado com sucesso!",
        siteName: installConfig.siteName,
        adminEmail: adminEmail,
        installedAt: installConfig.installedAt
      });
    } catch (error) {
      console.error("Error during installation:", error);
      res.status(500).json({ 
        message: error.message || "Erro durante a instalação",
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Endpoint especial para instalação automática de tabelas (EasyPanel)
  app.post("/api/install/setup-database", async (req, res) => {
    try {

      const { databaseUrl } = req.body;
      
      if (!databaseUrl) {
        return res.status(400).json({ 
          message: "DATABASE_URL é obrigatória", 
          example: "postgres://user:pass@host:5432/database" 
        });
      }

      console.log("[setup-database] Testando conexão com banco...");
      
      // Testar conexão primeiro
      const connectionOk = await checkDatabaseConnection(databaseUrl);
      if (!connectionOk) {
        return res.status(400).json({ 
          message: "Não foi possível conectar ao banco de dados. Verifique a URL de conexão." 
        });
      }

      console.log("[setup-database] Criando tabelas...");
      
      // Criar todas as tabelas
      const tablesCreated = await createDatabaseTables(databaseUrl);
      if (!tablesCreated) {
        return res.status(500).json({ 
          message: "Erro ao criar tabelas no banco de dados" 
        });
      }

      console.log("[setup-database] ✅ Instalação completa!");
      
      res.json({ 
        success: true, 
        message: "Banco de dados configurado com sucesso!",
        tablesCreated: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("[setup-database] Erro:", error);
      res.status(500).json({ 
        message: "Erro interno durante configuração do banco",
        error: error.message || "Erro desconhecido"
      });
    }
  });

  // Endpoint para instalar módulos específicos do banco de dados
  app.post("/api/install/module", verifyAdminToken, async (req, res) => {
    try {
      const { module }: { module: DatabaseModule } = req.body;
      
      if (!module || !module.name || !module.tables) {
        return res.status(400).json({ 
          message: "Módulo inválido. Nome e tabelas são obrigatórios." 
        });
      }

      console.log(`[install-module] Instalando módulo: ${module.name}`);
      
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        return res.status(500).json({ 
          message: "DATABASE_URL não configurada no servidor" 
        });
      }
      
      // Instalar o módulo específico
      const moduleInstalled = await installDatabaseModule(databaseUrl, module);
      if (!moduleInstalled) {
        return res.status(500).json({ 
          message: `Erro ao instalar módulo ${module.name}` 
        });
      }

      console.log(`[install-module] ✅ Módulo ${module.name} instalado com sucesso!`);
      
      res.json({ 
        success: true, 
        message: `Módulo ${module.name} instalado com sucesso!`,
        module: module.name,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("[install-module] Erro:", error);
      res.status(500).json({ 
        message: "Erro interno durante instalação do módulo",
        error: error.message || "Erro desconhecido"
      });
    }
  });

  // Register new professional
  app.post("/api/professionals/register", async (req, res) => {
    try {
      // Validate input
      const validatedData = insertProfessionalSchema.parse(req.body);
      
      // Validate CEP
      if (!await validateCEP(validatedData.serviceArea)) {
        return res.status(400).json({ message: "CEP inválido" });
      }

      // Check if email already exists
      const existingProfessional = await storage.getProfessionalByEmail(validatedData.email);
      if (existingProfessional) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }

      // Process payment with Pagar.me
      const paymentResult = await processPagarMePayment(req.body.paymentData);
      if (!paymentResult.success) {
        return res.status(400).json({ message: "Falha no processamento do pagamento" });
      }

      // Generate temporary password for professional
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      // Create professional with password
      const professional = await storage.createProfessional({
        ...validatedData,
        password: hashedPassword
      });

      // Create payment record
      await storage.createPayment({
        professionalId: professional.id,
        amount: "29.90",
        currency: "BRL",
        status: paymentResult.status,
        transactionId: paymentResult.transactionId,
        dueDate: new Date(),
      });

      // Update professional payment status
      await storage.updateProfessional(professional.id, {
        status: 'active',
        paymentStatus: 'active',
        lastPaymentDate: new Date(),
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      res.status(201).json({ 
        message: "Profissional cadastrado com sucesso", 
        professional,
        tempPassword: tempPassword // Send temp password for first login
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error registering professional:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Submit review
  app.post("/api/reviews", async (req, res) => {
    try {
      const validatedData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(validatedData);
      res.status(201).json({ message: "Avaliação enviada com sucesso", review });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get reviews for professional
  // Change professional password
  app.post("/api/professionals/:id/change-password", verifyProfessionalToken, async (req, res) => {
    try {
      const professionalId = req.params.id;
      const { currentPassword, newPassword } = req.body;
      
      if (professionalId !== req.professional.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Get professional for password verification
      const professional = await storage.getProfessional(professionalId);
      if (!professional) {
        return res.status(404).json({ message: "Profissional não encontrado" });
      }
      
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, professional.password || '');
      if (!isValidPassword) {
        return res.status(400).json({ message: "Senha atual incorreta" });
      }
      
      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      await storage.updateProfessional(professionalId, {
        password: hashedNewPassword
      });
      
      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Professional portfolio photo upload routes
  app.post("/api/professionals/:id/photos/upload-url", verifyProfessionalToken, async (req, res) => {
    try {
      const professionalId = req.params.id;
      
      if (professionalId !== req.professional.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Get professional and their plan to check photo limits
      const professional = await storage.getProfessional(professionalId);
      if (!professional) {
        return res.status(404).json({ message: "Profissional não encontrado" });
      }

      const plan = await storage.getSubscriptionPlan(professional.subscriptionPlanId || '');
      const maxPhotos = plan?.maxPhotos || 3;
      
      // Check current photo count
      const currentPhotoCount = professional.portfolio?.length || 0;
      if (currentPhotoCount >= maxPhotos) {
        return res.status(400).json({ 
          message: `Limite de ${maxPhotos} fotos atingido para seu plano` 
        });
      }

      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/professionals/:id/photos", verifyProfessionalToken, async (req, res) => {
    try {
      const professionalId = req.params.id;
      const { photoURL } = req.body;
      
      if (professionalId !== req.professional.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      if (!photoURL) {
        return res.status(400).json({ message: "URL da foto é obrigatória" });
      }

      // Get professional to update portfolio
      const professional = await storage.getProfessional(professionalId);
      if (!professional) {
        return res.status(404).json({ message: "Profissional não encontrado" });
      }

      // Set object ACL policy for the uploaded photo
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = await objectStorageService.trySetObjectEntityAclPolicy(photoURL, {
        owner: professionalId,
        visibility: "public", // Portfolio photos are public
      });

      // Update professional portfolio
      const currentPortfolio = professional.portfolio || [];
      const updatedPortfolio = [...currentPortfolio, normalizedPath];
      
      await storage.updateProfessional(professionalId, {
        portfolio: updatedPortfolio
      });

      res.json({ 
        message: "Foto adicionada com sucesso",
        photoPath: normalizedPath 
      });
    } catch (error) {
      console.error("Error adding photo to portfolio:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.delete("/api/professionals/:id/photos", verifyProfessionalToken, async (req, res) => {
    try {
      const professionalId = req.params.id;
      const { photoPath } = req.body;
      
      if (professionalId !== req.professional.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      if (!photoPath) {
        return res.status(400).json({ message: "Caminho da foto é obrigatório" });
      }

      // Get professional to update portfolio
      const professional = await storage.getProfessional(professionalId);
      if (!professional) {
        return res.status(404).json({ message: "Profissional não encontrado" });
      }

      // Remove photo from portfolio
      const currentPortfolio = professional.portfolio || [];
      const updatedPortfolio = currentPortfolio.filter(path => path !== photoPath);
      
      await storage.updateProfessional(professionalId, {
        portfolio: updatedPortfolio
      });

      res.json({ message: "Foto removida com sucesso" });
    } catch (error) {
      console.error("Error removing photo from portfolio:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Profile image upload routes
  app.post("/api/professionals/:id/profile-image/upload-url", verifyProfessionalToken, async (req, res) => {
    try {
      const professionalId = req.params.id;
      
      if (professionalId !== req.professional.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting profile image upload URL:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/professionals/:id/profile-image", verifyProfessionalToken, async (req, res) => {
    try {
      const professionalId = req.params.id;
      const { profileImage } = req.body;
      
      if (professionalId !== req.professional.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      if (!profileImage) {
        return res.status(400).json({ message: "URL da foto de perfil é obrigatória" });
      }

      // Set object ACL policy for the uploaded profile image
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = await objectStorageService.trySetObjectEntityAclPolicy(profileImage, {
        owner: professionalId,
        visibility: "public", // Profile images are public
      });

      // Update professional profile image
      await storage.updateProfessional(professionalId, {
        profileImage: normalizedPath
      });

      res.json({ 
        message: "Foto de perfil atualizada com sucesso",
        profileImage: normalizedPath 
      });
    } catch (error) {
      console.error("Error updating profile image:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Professional profile update route (self-update)
  app.patch("/api/professionals/:id", verifyProfessionalToken, async (req, res) => {
    try {
      const professionalId = req.params.id;
      
      if (professionalId !== req.professional.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Check if professional is active
      const professional = await storage.getProfessional(professionalId);
      if (!professional) {
        return res.status(404).json({ message: "Profissional não encontrado" });
      }
      
      if (professional.status !== 'active') {
        return res.status(403).json({ 
          message: "Não é possível editar perfil. Status da conta: " + 
                   (professional.status === 'pending' ? 'Pendente' : 'Inativo') 
        });
      }

      const { fullName, phone, description, serviceArea, city, categoryId } = req.body;

      // Validate required fields
      if (!fullName || !phone || !description || !serviceArea || !city || !categoryId) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
      }

      // Update professional profile
      const updatedProfessional = await storage.updateProfessional(professionalId, {
        fullName,
        phone,
        description,
        serviceArea,
        city,
        categoryId
      });

      res.json(updatedProfessional);
    } catch (error) {
      console.error("Error updating professional profile:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/reviews/:professionalId", async (req, res) => {
    try {
      const reviews = await storage.getReviews(req.params.professionalId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get contacts for professional  
  app.get("/api/contacts/:professionalId", async (req, res) => {
    try {
      const contacts = await storage.getContacts(req.params.professionalId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Record contact interaction
  app.post("/api/contacts", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      res.status(201).json({ message: "Contato registrado com sucesso", contact });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error creating contact:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get monthly contact stats for professional (protected route)
  app.get("/api/professionals/:id/contacts/monthly", verifyProfessionalToken, async (req, res) => {
    try {
      const professionalId = req.params.id;
      
      if (professionalId !== req.professional.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Get professional and their plan to check contact limits
      const professional = await storage.getProfessional(professionalId);
      if (!professional) {
        return res.status(404).json({ message: "Profissional não encontrado" });
      }

      const plan = await storage.getSubscriptionPlan(professional.subscriptionPlanId || '');
      const maxContacts = plan?.maxContacts; // null means unlimited

      // Get current month contacts
      const currentDate = new Date();
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

      const allContacts = await storage.getContacts(professionalId);
      const monthlyContacts = allContacts.filter(contact => {
        const contactDate = new Date(contact.createdAt || '');
        return contactDate >= monthStart && contactDate <= monthEnd;
      });

      res.json({
        currentMonth: monthlyContacts.length,
        maxContacts: maxContacts,
        hasLimit: maxContacts !== null,
        remainingContacts: maxContacts ? Math.max(0, maxContacts - monthlyContacts.length) : null,
        limitReached: maxContacts ? monthlyContacts.length >= maxContacts : false
      });
    } catch (error) {
      console.error("Error fetching monthly contact stats:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Validate CEP
  app.get("/api/validate-cep/:cep", async (req, res) => {
    try {
      const isValid = await validateCEP(req.params.cep);
      if (isValid) {
        const response = await fetch(`https://viacep.com.br/ws/${req.params.cep}/json/`);
        const data = await response.json();
        res.json({ valid: true, data });
      } else {
        res.json({ valid: false });
      }
    } catch (error) {
      console.error("Error validating CEP:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Admin Authentication Routes

  // Admin login
  app.post("/api/auth/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || user.role !== 'admin') {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      await storage.createLog({
        userId: user.id,
        action: 'admin_login',
        details: { email },
        entityType: 'user',
        entityId: null,
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Protected Admin Routes

  // Get dashboard stats
  app.get("/api/admin/dashboard/stats", verifyAdminToken, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get all professionals for admin
  app.get("/api/admin/professionals", verifyAdminToken, async (req, res) => {
    try {
      const { status, page, limit } = req.query;
      
      // Para admin, vamos buscar TODOS os profissionais sem filtro de status por padrão
      let filters: any = {};
      
      // Se status for especificado, aplicar o filtro
      if (status && status !== 'all') {
        filters.status = status as string;
      }
      // Se não especificar status, remover o filtro padrão de 'active'
      
      // Só aplicar paginação se especificado
      if (limit) {
        filters.limit = parseInt(limit as string);
        if (page) {
          const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
          filters.offset = offset;
        }
      }
      
      // Se não tiver status especificado, buscar todos sem filtro
      const professionals = filters.status ? 
        await storage.getProfessionals(filters) : 
        await storage.getAllProfessionalsForAdmin();
      
      res.json(professionals);
    } catch (error) {
      console.error("Error fetching professionals:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Update professional status
  app.patch("/api/admin/professionals/:id/status", verifyAdminToken, async (req, res) => {
    try {
      const { status } = req.body;
      
      if (!['active', 'inactive', 'pending'].includes(status)) {
        return res.status(400).json({ message: "Status inválido" });
      }

      const professional = await storage.updateProfessional(req.params.id, { status });
      
      await storage.createLog({
        userId: req.user.id,
        action: 'update_professional_status',
        entityType: 'professional',
        entityId: req.params.id,
        details: { newStatus: status },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      res.json({ message: "Status atualizado com sucesso", professional });
    } catch (error) {
      console.error("Error updating professional status:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Payment management routes
  app.get("/api/admin/payments", verifyAdminToken, async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/payments", verifyAdminToken, async (req, res) => {
    try {
      // Convert date strings to Date objects if necessary
      const paymentData = { ...req.body };
      if (paymentData.dueDate && typeof paymentData.dueDate === 'string') {
        paymentData.dueDate = new Date(paymentData.dueDate);
      }
      if (paymentData.paidAt && typeof paymentData.paidAt === 'string') {
        paymentData.paidAt = new Date(paymentData.paidAt);
      }

      const payment = await storage.createPayment(paymentData);
      
      await storage.createLog({
        userId: req.user.id,
        action: 'create_payment',
        entityType: 'payment',
        entityId: payment.id,
        details: paymentData,
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/admin/payments/:id", verifyAdminToken, async (req, res) => {
    try {
      // Convert date strings to Date objects if necessary
      const paymentData = { ...req.body };
      if (paymentData.dueDate && typeof paymentData.dueDate === 'string') {
        paymentData.dueDate = new Date(paymentData.dueDate);
      }
      if (paymentData.paidAt && typeof paymentData.paidAt === 'string') {
        paymentData.paidAt = new Date(paymentData.paidAt);
      }

      const payment = await storage.updatePayment(req.params.id, paymentData);
      
      await storage.createLog({
        userId: req.user.id,
        action: 'update_payment',
        entityType: 'payment',
        entityId: req.params.id,
        details: paymentData,
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      res.json(payment);
    } catch (error) {
      console.error("Error updating payment:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.delete("/api/admin/payments/:id", verifyAdminToken, async (req, res) => {
    try {
      await storage.deletePayment(req.params.id);
      
      await storage.createLog({
        userId: req.user.id,
        action: 'delete_payment',
        entityType: 'payment',
        entityId: req.params.id,
        details: {},
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      res.json({ message: "Pagamento removido com sucesso" });
    } catch (error) {
      console.error("Error deleting payment:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Sync payment with Pagar.me
  app.post("/api/admin/payments/:id/sync", verifyAdminToken, async (req, res) => {
    try {
      const payment = await storage.getPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ message: "Pagamento não encontrado" });
      }

      const pagarmeData = await pagarmeService.syncPaymentWithPagarMe(payment);
      
      // Update payment with Pagar.me data if available
      if (pagarmeData) {
        const updateData: any = {};
        
        if (pagarmeData.status) {
          updateData.status = pagarmeData.status === 'paid' ? 'paid' : 
                             pagarmeData.status === 'pending' ? 'pending' : 
                             pagarmeData.status === 'failed' ? 'failed' : 
                             pagarmeData.status;
        }
        
        if (pagarmeData.paid_at) {
          updateData.paidAt = new Date(pagarmeData.paid_at);
        }

        if (Object.keys(updateData).length > 0) {
          await storage.updatePayment(req.params.id, updateData);
        }
      }

      await storage.createLog({
        userId: req.user.id,
        action: 'sync_payment_pagarme',
        entityType: 'payment',
        entityId: req.params.id,
        details: { pagarmeData },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      res.json({ 
        message: "Sincronização realizada com sucesso",
        pagarmeData 
      });
    } catch (error) {
      console.error("Error syncing payment:", error);
      res.status(500).json({ 
        message: "Erro ao sincronizar com Pagar.me",
        error: error.message 
      });
    }
  });

  // Get all payments with Pagar.me sync status
  app.get("/api/admin/payments/sync-status", verifyAdminToken, async (req, res) => {
    try {
      const payments = await storage.getPayments();
      const syncStatuses = await Promise.allSettled(
        payments.map(async (payment) => {
          try {
            if (payment.pagarmeSubscriptionId || payment.transactionId) {
              const pagarmeData = await pagarmeService.syncPaymentWithPagarMe(payment);
              return {
                paymentId: payment.id,
                syncStatus: 'success',
                pagarmeStatus: pagarmeData?.status,
                localStatus: payment.status,
                needsSync: pagarmeData?.status !== payment.status
              };
            }
            return {
              paymentId: payment.id,
              syncStatus: 'no_pagarme_id',
              needsSync: false
            };
          } catch (error) {
            return {
              paymentId: payment.id,
              syncStatus: 'error',
              error: error.message,
              needsSync: true
            };
          }
        })
      );

      const results = syncStatuses.map((result, index) => ({
        payment: payments[index],
        sync: result.status === 'fulfilled' ? result.value : { 
          paymentId: payments[index].id, 
          syncStatus: 'error', 
          error: result.reason 
        }
      }));

      res.json(results);
    } catch (error) {
      console.error("Error checking sync status:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Manage categories
  app.get("/api/admin/categories", verifyAdminToken, async (req, res) => {
    try {
      const categories = await storage.getCategoriesWithStats();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching admin categories:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/categories", verifyAdminToken, async (req, res) => {
    try {
      const category = await storage.createCategory(req.body);
      
      await storage.createLog({
        userId: req.user.id,
        action: 'create_category',
        entityType: 'category',
        entityId: category.id,
        details: req.body,
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/admin/categories/:id", verifyAdminToken, async (req, res) => {
    try {
      const category = await storage.updateCategory(req.params.id, req.body);
      
      await storage.createLog({
        userId: req.user.id,
        action: 'update_category',
        entityType: 'category',
        entityId: req.params.id,
        details: req.body,
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.delete("/api/admin/categories/:id", verifyAdminToken, async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      
      await storage.createLog({
        userId: req.user.id,
        action: 'delete_category',
        entityType: 'category',
        entityId: req.params.id,
        details: {},
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      res.json({ message: "Categoria removida com sucesso" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Seed initial categories - one time setup
  app.post("/api/admin/categories/seed", verifyAdminToken, async (req, res) => {
    try {
      const defaultCategories = [
        { name: "Assistência Técnica - Ar Condicionado", slug: "assistencia-tecnica-ar-condicionado", description: "Manutenção e reparo de sistemas de ar condicionado", icon: "zap" },
        { name: "Assistência Técnica - Eletrodomésticos", slug: "assistencia-tecnica-eletrodomesticos", description: "Conserto de geladeiras, máquinas de lavar e outros eletrodomésticos", icon: "wrench" },
        { name: "Assistência Técnica - Informática", slug: "assistencia-tecnica-informatica", description: "Reparo de computadores, notebooks e equipamentos de informática", icon: "laptop" },
        { name: "Aulas de Idiomas", slug: "aulas-idiomas", description: "Professores particulares de inglês, espanhol, francês e outros idiomas", icon: "book" },
        { name: "Aulas de Música", slug: "aulas-musica", description: "Professores de piano, violão, bateria e outros instrumentos musicais", icon: "music" },
        { name: "Aulas de Esportes", slug: "aulas-esportes", description: "Personal trainers e professores de modalidades esportivas", icon: "dumbbell" },
        { name: "Advocacia", slug: "advocacia", description: "Advogados especializados em diferentes áreas do direito", icon: "scale" },
        { name: "Contabilidade", slug: "contabilidade", description: "Contadores e consultores contábeis para empresas e pessoas físicas", icon: "calculator" },
        { name: "Marketing Digital", slug: "marketing-digital", description: "Especialistas em marketing digital, redes sociais e publicidade online", icon: "briefcase" },
        { name: "Fotografia de Eventos", slug: "fotografia-eventos", description: "Fotógrafos especializados em casamentos, festas e eventos corporativos", icon: "camera" },
        { name: "Construção", slug: "construcao", description: "Pedreiros, mestres de obra e profissionais da construção civil", icon: "hammer" },
        { name: "Pintura", slug: "pintura", description: "Pintores residenciais e comerciais", icon: "paintbrush" },
        { name: "Eletricista", slug: "eletricista", description: "Instalações e manutenções elétricas residenciais e comerciais", icon: "zap" },
        { name: "Encanador", slug: "encanador", description: "Instalações hidráulicas, desentupimentos e reparos", icon: "droplets" },
        { name: "Jardinagem", slug: "jardinagem", description: "Paisagismo, manutenção de jardins e áreas verdes", icon: "leaf" },
        { name: "Beleza e Estética", slug: "beleza", description: "Cabeleireiros, esteticistas, manicures e profissionais de beleza", icon: "scissors" },
        { name: "Limpeza Doméstica", slug: "limpeza", description: "Diaristas, faxineiras e serviços de limpeza residencial", icon: "home" },
        { name: "Culinária", slug: "culinaria", description: "Chefs, cozinheiros e profissionais da gastronomia", icon: "utensils" },
        { name: "Costura", slug: "costura", description: "Costureiras e profissionais de confecção e ajustes", icon: "shirt" },
        { name: "Cuidados Infantis", slug: "cuidados-infantis", description: "Babás, cuidadores e profissionais especializados em crianças", icon: "baby" },
        { name: "Reforço Escolar", slug: "reforco-escolar", description: "Professores particulares para todas as matérias escolares", icon: "graduation-cap" },
        { name: "Saúde", slug: "saude", description: "Profissionais de saúde e bem-estar", icon: "stethoscope" },
        { name: "Design Gráfico", slug: "design-grafico", description: "Designers gráficos, web designers e profissionais criativos", icon: "palette" },
        { name: "Manutenção Automotiva", slug: "auto-eletrica", description: "Mecânicos, eletricistas automotivos e serviços veiculares", icon: "car" }
      ];

      let createdCount = 0;
      let skippedCount = 0;

      for (const categoryData of defaultCategories) {
        try {
          // Check if category already exists
          const existing = await storage.getCategoryBySlug(categoryData.slug);
          if (!existing) {
            await storage.createCategory({
              ...categoryData,
              isActive: true
            });
            createdCount++;
          } else {
            skippedCount++;
          }
        } catch (error) {
          console.error(`Error creating category ${categoryData.name}:`, error);
        }
      }

      await storage.createLog({
        userId: req.user.id,
        action: 'seed_categories',
        entityType: 'category',
        entityId: null,
        details: { createdCount, skippedCount },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      res.json({ 
        message: `Categorias inseridas: ${createdCount}, já existiam: ${skippedCount}`,
        createdCount,
        skippedCount
      });
    } catch (error) {
      console.error("Error seeding categories:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Update existing categories to mark popular ones
  app.post("/api/admin/categories/mark-popular", verifyAdminToken, async (req, res) => {
    try {
      // Lista das 24 categorias que eram populares na home original
      const popularSlugs = [
        "assistencia-tecnica-ar-condicionado",
        "eletricista", 
        "encanador",
        "pintura",
        "jardinagem",
        "construcao",
        "beleza",
        "assistencia-tecnica-informatica",
        "auto-eletrica",
        "aulas-idiomas",
        "aulas-musica",
        "fotografia-eventos",
        "advocacia",
        "contabilidade",
        "design-grafico",
        "limpeza",
        "culinaria",
        "costura",
        "cuidados-infantis",
        "marketing-digital",
        "aulas-esportes",
        "saude",
        "reforco-escolar",
        "assistencia-tecnica-eletrodomesticos"
      ];

      let updatedCount = 0;
      let notFoundCount = 0;

      for (const slug of popularSlugs) {
        try {
          const category = await storage.getCategoryBySlug(slug);
          if (category) {
            await storage.updateCategory(category.id, { isPopular: true });
            updatedCount++;
          } else {
            notFoundCount++;
          }
        } catch (error) {
          console.error(`Error updating category ${slug}:`, error);
          notFoundCount++;
        }
      }

      await storage.createLog({
        userId: req.user.id,
        action: 'mark_popular_categories',
        entityType: 'category',
        entityId: null,
        details: { updatedCount, notFoundCount },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      res.json({ 
        message: `${updatedCount} categorias marcadas como populares, ${notFoundCount} não encontradas`,
        updatedCount,
        notFoundCount
      });
    } catch (error) {
      console.error("Error marking popular categories:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Manage subscription plans
  app.get("/api/admin/plans", verifyAdminToken, async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/plans", verifyAdminToken, async (req, res) => {
    try {
      const plan = await storage.createSubscriptionPlan(req.body);
      
      // Tentar sincronizar automaticamente com Pagar.me
      try {
        console.log('[auto-sync] Tentando sincronizar novo plano com Pagar.me...');
        const pagarmeResult = await pagarmeService.syncPlanWithPagarMe(plan);
        const pagarmeId = pagarmeResult?.result?.id || pagarmeResult?.id;
        
        if (pagarmeId) {
          // Atualizar plano com ID do Pagar.me
          await storage.updateSubscriptionPlan(plan.id, { pagarmeProductId: pagarmeId });
          console.log(`[auto-sync] ✅ Plano ${plan.name} sincronizado com Pagar.me (ID: ${pagarmeId})`);
        }
      } catch (syncError) {
        console.error('[auto-sync] ⚠️ Erro na sincronização automática:', syncError);
        // Continua sem falhar - sincronização pode ser feita manualmente depois
      }
      
      await storage.createLog({
        userId: req.user.id,
        action: 'create_subscription_plan',
        entityType: 'subscription_plan',
        entityId: plan.id,
        details: req.body,
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      // Buscar plano atualizado para retornar com pagarmeProductId se foi sincronizado
      const updatedPlan = await storage.getSubscriptionPlan(plan.id);
      res.status(201).json(updatedPlan || plan);
    } catch (error) {
      console.error("Error creating plan:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/admin/plans/:id", verifyAdminToken, async (req, res) => {
    try {
      // Clean numeric fields - convert empty strings to null/undefined
      const cleanedData = { ...req.body };
      
      // Decimal fields
      if (cleanedData.monthlyPrice === "" || cleanedData.monthlyPrice === null) {
        cleanedData.monthlyPrice = undefined;
      }
      if (cleanedData.yearlyPrice === "" || cleanedData.yearlyPrice === null) {
        cleanedData.yearlyPrice = undefined;
      }
      
      // Integer fields
      if (cleanedData.maxContacts === "" || cleanedData.maxContacts === null) {
        cleanedData.maxContacts = undefined;
      }
      if (cleanedData.maxPhotos === "" || cleanedData.maxPhotos === null) {
        cleanedData.maxPhotos = undefined;
      }
      if (cleanedData.priority === "" || cleanedData.priority === null) {
        cleanedData.priority = undefined;
      }
      
      const plan = await storage.updateSubscriptionPlan(req.params.id, cleanedData);
      
      // Se há mudanças significativas (preço, nome, descrição), sincronizar com Pagar.me
      if (req.body.monthlyPrice || req.body.name || req.body.description) {
        try {
          console.log('[auto-sync] Plano atualizado, tentando ressincronizar com Pagar.me...');
          const pagarmeResult = await pagarmeService.syncPlanWithPagarMe(plan);
          const pagarmeId = pagarmeResult?.result?.id || pagarmeResult?.id;
          
          if (pagarmeId && pagarmeId !== plan.pagarmeProductId) {
            // Atualizar com novo ID se mudou
            await storage.updateSubscriptionPlan(plan.id, { pagarmeProductId: pagarmeId });
            console.log(`[auto-sync] ✅ Plano ${plan.name} ressincronizado com Pagar.me (novo ID: ${pagarmeId})`);
          }
        } catch (syncError) {
          console.error('[auto-sync] ⚠️ Erro na ressincronização automática:', syncError);
          // Continua sem falhar - sincronização pode ser feita manualmente depois
        }
      }
      
      await storage.createLog({
        userId: req.user.id,
        action: 'update_subscription_plan',
        entityType: 'subscription_plan',
        entityId: req.params.id,
        details: req.body,
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      // Buscar plano atualizado para retornar com possível novo pagarmeProductId
      const updatedPlan = await storage.getSubscriptionPlan(req.params.id);
      res.json(updatedPlan || plan);
    } catch (error) {
      console.error("Error updating plan:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.delete("/api/admin/plans/:id", verifyAdminToken, async (req, res) => {
    try {
      await storage.deleteSubscriptionPlan(req.params.id);
      
      await storage.createLog({
        userId: req.user.id,
        action: 'delete_subscription_plan',
        entityType: 'subscription_plan',
        entityId: req.params.id,
        details: {},
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      res.json({ message: "Plano removido com sucesso" });
    } catch (error) {
      console.error("Error deleting plan:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get active subscription plans for public display
  app.get("/api/plans", async (req, res) => {
    try {
      const plans = await storage.getActiveSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching public plans:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get subscription plans for checkout page
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getActiveSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Manage pages
  app.get("/api/admin/pages", verifyAdminToken, async (req, res) => {
    try {
      const pages = await storage.getPages();
      res.json(pages);
    } catch (error) {
      console.error("Error fetching pages:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/pages", verifyAdminToken, async (req, res) => {
    try {
      const page = await storage.createPage(req.body);
      
      await storage.createLog({
        userId: req.user.id,
        action: 'create_page',
        entityType: 'page',
        entityId: page.id,
        details: req.body,
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      res.status(201).json(page);
    } catch (error) {
      console.error("Error creating page:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/admin/pages/:id", verifyAdminToken, async (req, res) => {
    try {
      const page = await storage.updatePage(req.params.id, req.body);
      
      await storage.createLog({
        userId: req.user.id,
        action: 'update_page',
        entityType: 'page',
        entityId: req.params.id,
        details: req.body,
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      res.json(page);
    } catch (error) {
      console.error("Error updating page:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.delete("/api/admin/pages/:id", verifyAdminToken, async (req, res) => {
    try {
      await storage.deletePage(req.params.id);
      
      await storage.createLog({
        userId: req.user.id,
        action: 'delete_page',
        entityType: 'page',
        entityId: req.params.id,
        details: {},
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      res.json({ message: "Página removida com sucesso" });
    } catch (error) {
      console.error("Error deleting page:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Public page endpoint (for /pagina/:slug routes)
  app.get("/api/pages/:slug", async (req, res) => {
    try {
      const page = await storage.getPageBySlug(req.params.slug);
      if (!page) {
        return res.status(404).json({ message: "Página não encontrada" });
      }
      res.json(page);
    } catch (error) {
      console.error("Error fetching page by slug:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Admin reviews management
  app.get("/api/admin/reviews", verifyAdminToken, async (req, res) => {
    try {
      const reviews = await storage.getAllReviewsWithProfessionalInfo();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.patch("/api/admin/reviews/:id/verification", verifyAdminToken, async (req, res) => {
    try {
      const { isVerified } = req.body;
      const review = await storage.updateReviewVerification(req.params.id, isVerified);
      
      await storage.createLog({
        userId: req.user.id,
        action: isVerified ? 'verify_review' : 'unverify_review',
        entityType: 'review',
        entityId: req.params.id,
        details: { isVerified },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      res.json(review);
    } catch (error) {
      console.error("Error updating review verification:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // =========================================
  // ADMIN USER MANAGEMENT ROUTES
  // =========================================

  // Get all admin users  
  app.get("/api/admin/users", verifyAdminToken, async (req, res) => {
    try {
      const adminUsers = await storage.getAdminUsers();
      // Remove password from response
      const safeUsers = adminUsers.map(user => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isSystemAdmin: user.isSystemAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Create new admin user
  app.post("/api/admin/users", verifyAdminToken, async (req, res) => {
    try {
      const { email, password, fullName } = req.body;
      
      if (!email || !password || !fullName) {
        return res.status(400).json({ message: "Email, senha e nome completo são obrigatórios" });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }

      // Hash password and create admin
      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = await storage.createUser({
        email,
        password: hashedPassword,
        fullName,
        role: "admin"
      });

      // Log the action
      await storage.createLog({
        userId: req.user.id,
        action: 'create_admin_user',
        entityType: 'user',
        entityId: newAdmin.id,
        details: { email, fullName },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      // Return user without password
      const safeUser = {
        id: newAdmin.id,
        email: newAdmin.email,
        fullName: newAdmin.fullName,
        role: newAdmin.role,
        createdAt: newAdmin.createdAt,
        updatedAt: newAdmin.updatedAt
      };

      res.status(201).json(safeUser);
    } catch (error) {
      console.error("Error creating admin user:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Delete admin user
  app.delete("/api/admin/users/:id", verifyAdminToken, async (req, res) => {
    try {
      const userId = req.params.id;
      
      // Prevent deleting self
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Não é possível excluir sua própria conta" });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Prevent deleting system admin (created during installation)
      if (user.isSystemAdmin) {
        return res.status(400).json({ message: "Não é possível excluir o administrador do sistema" });
      }

      await storage.deleteUser(userId);

      // Log the action
      await storage.createLog({
        userId: req.user.id,
        action: 'delete_admin_user',
        entityType: 'user',
        entityId: userId,
        details: { deletedEmail: user.email },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      });

      res.json({ message: "Administrador removido com sucesso" });
    } catch (error) {
      console.error("Error deleting admin user:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Object storage routes for professional photo upload
  app.post("/api/objects/upload", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  // Serve private objects with public access for professional photos
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Update professional photo
  app.put("/api/professionals/:id/photo", verifyProfessionalToken, async (req, res) => {
    if (!req.body.photoURL) {
      return res.status(400).json({ error: "photoURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.photoURL,
      );

      // Update professional photo in database
      await storage.updateProfessionalPhoto(req.params.id, objectPath);

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting professional photo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Pagar.me Integration Routes
  
  // Test Pagar.me connection
  app.get("/api/admin/test-pagarme", verifyAdminToken, async (req, res) => {
    try {
      console.log("Testing Pagar.me connection...");
      
      // Test basic authentication with a simple request
      const credentials = Buffer.from(`sk_test_16b6d3ac9ca24aeb85ff31c9fc819638:`).toString('base64');
      
      const response = await fetch('https://api.pagar.me/core/v5/orders', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Response body:", responseText);
      
      if (!response.ok) {
        return res.status(500).json({ 
          message: "Erro na conexão com Pagar.me",
          status: response.status,
          error: responseText 
        });
      }
      
      res.json({ 
        message: "Conexão com Pagar.me bem-sucedida!",
        status: response.status,
        data: responseText ? JSON.parse(responseText) : null
      });
    } catch (error) {
      console.error("Error testing Pagar.me:", error);
      res.status(500).json({ 
        message: "Erro ao testar Pagar.me",
        error: error.message 
      });
    }
  });
  
  // OAuth routes for Pagar.me
  app.get('/api/admin/pagarme/connect', verifyAdminToken, async (req, res) => {
    try {
      // For now, redirect to manual setup since OAuth requires app registration
      res.json({ 
        message: 'Conecte sua conta Pagar.me',
        setupInstructions: 'Por favor, obtenha sua API key em https://dashboard.pagar.me/account/api-keys',
        nextStep: 'Configure PAGARME_API_KEY nas configurações do sistema'
      });
    } catch (error) {
      console.error('Error with Pagar.me connection:', error);
      res.status(500).json({ message: 'Erro ao conectar com Pagar.me' });
    }
  });

  app.get('/api/admin/pagarme/status', verifyAdminToken, async (req, res) => {
    try {
      const apiKey = await storage.getSystemConfig('PAGARME_API_KEY');
      
      res.json({
        connected: !!apiKey?.value,
        hasApiKey: !!apiKey?.value,
      });
    } catch (error) {
      console.error('Error checking Pagar.me status:', error);
      res.status(500).json({ message: 'Erro ao verificar status da conexão' });
    }
  });

  // Sync local plan with Pagar.me
  app.post("/api/admin/plans/:id/sync-pagarme", verifyAdminToken, async (req, res) => {
    try {
      const planId = req.params.id;
      const plan = await storage.getSubscriptionPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: "Plano não encontrado" });
      }

      const pagarmeResult = await pagarmeService.syncPlanWithPagarMe(plan);
      
      console.log('Pagar.me result:', pagarmeResult);
      console.log('Result structure:', typeof pagarmeResult, Object.keys(pagarmeResult || {}));
      
      // O resultado do Pagar.me pode ter o ID em diferentes estruturas
      const pagarmeId = pagarmeResult?.result?.id || pagarmeResult?.id;
      console.log('Extracted Pagar.me ID:', pagarmeId);
      
      if (!pagarmeId) {
        throw new Error('ID do Pagar.me não encontrado na resposta');
      }
      
      // Update local plan with Pagar.me ID
      const updatedPlan = await storage.updateSubscriptionPlan(planId, {
        pagarmeProductId: pagarmeId
      });
      
      console.log('Plan updated:', { id: updatedPlan.id, pagarmeProductId: updatedPlan.pagarmeProductId });
      
      res.json({ 
        message: "Plano sincronizado com Pagar.me", 
        pagarmeId: pagarmeId,
        planName: plan.name // Usar o nome do plano local, não do Pagar.me
      });
    } catch (error) {
      console.error("Error syncing plan with Pagar.me:", error);
      res.status(500).json({ 
        message: "Erro ao sincronizar plano com Pagar.me",
        error: error.message 
      });
    }
  });

  // Create subscription for professional
  app.post("/api/payments/create-subscription", async (req, res) => {
    try {
      const { planId, professionalData, paymentMethod, cardData } = req.body;
      
      const plan = await storage.getSubscriptionPlan(planId);
      console.log('Plan found:', { 
        id: plan.id, 
        name: plan.name, 
        monthlyPrice: plan.monthlyPrice,
        monthlyPriceType: typeof plan.monthlyPrice,
        pagarmeProductId: plan.pagarmeProductId 
      });
      
      if (!plan || !plan.pagarmeProductId) {
        return res.status(400).json({ 
          message: `Plano não encontrado ou não sincronizado com Pagar.me. Plan ID: ${planId}, Pagar.me ID: ${plan?.pagarmeProductId || 'não definido'}` 
        });
      }

      // Use exact price from plan, convert to centavos for Pagar.me
      const originalPrice = plan.monthlyPrice; // É uma string decimal do banco
      const priceInReais = parseFloat(originalPrice);
      const priceInCentavos = Math.round(priceInReais * 100);
      
      console.log('Price validation:', {
        planName: plan.name,
        originalPrice: originalPrice,
        priceInReais: priceInReais,
        priceInCentavos: priceInCentavos,
        expectedForProfissional: 'R$ 59,90 = 5990 centavos'
      });
      
      // Validação extra: garantir que o preço está correto
      if (plan.name === 'Profissional' && priceInCentavos !== 5990) {
        console.error('ERRO: Preço incorreto para plano Profissional!', {
          expected: 5990,
          actual: priceInCentavos
        });
      }

      // Estrutura de subscription que funcionava - mantendo apenas preço correto
      const subscriptionData = {
        planId: plan.pagarmeProductId,
        paymentMethod: paymentMethod,
        billingType: 'prepaid',
        currency: 'BRL',
        interval: 'month',
        intervalCount: 1,
        statementDescriptor: 'MONTE EVEREST',
        description: `Assinatura ${plan.name}`,
        code: `SUB_${professionalData.cpf}_${Date.now()}`,
        items: [{
          id: plan.id,
          planItemId: plan.id,
          name: plan.name,
          description: plan.description,
          quantity: 1,
          // Não definir pricing_scheme aqui - será definido no nível principal
          discounts: []
        }],
        shipping: {
          amount: 0,
          description: 'Produto digital',
          recipientName: professionalData.name,
          recipientPhone: professionalData.phone,
          addressId: `addr_${professionalData.cpf}`,
          type: 'free',
          address: {
            country: 'BR',
            state: 'GO',
            city: professionalData.city || 'Goiânia',
            zip_code: professionalData.cep || '74000000',
            street: professionalData.street || 'Rua Principal',
            number: professionalData.number || '123',
            neighborhood: professionalData.neighborhood || 'Centro',
            complement: '',
            line_1: `${professionalData.street || 'Rua Principal'}, ${professionalData.number || '123'}`,
            line_2: professionalData.neighborhood || 'Centro'
          }
        },
        metadata: {
          professional_name: professionalData.name,
          professional_email: professionalData.email,
          plan_name: plan.name
        },
        increments: [],
        discounts: [],
        customer: {
          name: professionalData.name,
          email: professionalData.email,
          document: professionalData.cpf,
          documentType: 'cpf',
          type: 'individual',
          address: {
            country: 'BR',
            state: 'GO',
            city: professionalData.city || 'Goiânia',
            zip_code: professionalData.cep || '74000000',
            street: professionalData.street || 'Rua Principal',
            number: professionalData.number || '123',
            neighborhood: professionalData.neighborhood || 'Centro',
            complement: '',
            line_1: `${professionalData.street || 'Rua Principal'}, ${professionalData.number || '123'}`,
            line_2: professionalData.neighborhood || 'Centro'
          },
          phones: {
            mobilePhone: {
              countryCode: '55',
              areaCode: professionalData.phone.substring(0, 2),
              number: professionalData.phone.substring(2)
            }
          },
          metadata: {
            created_by: 'monte_everest_system'
          },
          code: professionalData.cpf
        },
        // Card é sempre obrigatório no SDK, mesmo para PIX
        card: paymentMethod === 'credit_card' && cardData ? {
          number: cardData.number,
          holder_name: cardData.holderName,
          exp_month: parseInt(cardData.expMonth),
          exp_year: parseInt(cardData.expYear),
          cvv: cardData.cvv,
          billing_address: {
            country: 'BR',
            state: 'GO',
            city: 'Goiânia',
            zip_code: '74000000',
            street: 'Rua Principal',
            number: '123',
            neighborhood: 'Centro',
            complement: '',
            line_1: 'Rua Principal, 123',
            line_2: 'Centro'
          }
        } : {
          // Card dummy para PIX - SDK exige o campo
          number: '4000000000000010',
          holder_name: professionalData.name,
          exp_month: 1,
          exp_year: 2030,
          cvv: '123',
          billing_address: {
            country: 'BR',
            state: 'GO',
            city: 'Goiânia',
            zip_code: '74000000',
            street: 'Rua Principal',
            number: '123',
            neighborhood: 'Centro',
            complement: '',
            line_1: 'Rua Principal, 123',
            line_2: 'Centro'
          }
        }
      };

      // Voltar para estrutura de subscription que funcionava, mas com preço correto
      const pagarmeResponse = await fetch('https://api.pagar.me/core/v5/subscriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(process.env.PAGARME_API_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan_id: subscriptionData.planId,
          payment_method: subscriptionData.paymentMethod === 'pix' ? 'boleto' : subscriptionData.paymentMethod,
          billing_type: subscriptionData.billingType,
          installments: 1,
          currency: subscriptionData.currency,
          interval: subscriptionData.interval,
          interval_count: subscriptionData.intervalCount,
          statement_descriptor: subscriptionData.statementDescriptor,
          description: subscriptionData.description,
          code: subscriptionData.code,
          // Usar preço correto em pricingScheme
          pricing_scheme: {
            scheme_type: 'unit',
            price: priceInCentavos // Preço correto aqui
          },
          items: [{
            id: plan.id,
            name: plan.name,
            description: plan.description,
            quantity: 1,
            pricing_scheme: {
              scheme_type: 'unit',
              price: priceInCentavos
            },
            discounts: []
          }],
          customer: subscriptionData.customer,
          ...(paymentMethod === 'credit_card' ? { card: subscriptionData.card } : {}),
          metadata: subscriptionData.metadata
        })
      });

      if (!pagarmeResponse.ok) {
        const errorData = await pagarmeResponse.json();
        console.error('Erro na API Pagar.me:', errorData);
        throw new Error(`API Error: ${pagarmeResponse.status} - ${JSON.stringify(errorData)}`);
      }

      const subscription = await pagarmeResponse.json();
      console.log('Pagar.me subscription response:', JSON.stringify(subscription, null, 2));
      
      // Check if professional already exists, if so, update instead of creating
      let professional = await storage.getProfessionalByEmail(professionalData.email);
      
      if (professional) {
        // Professional exists, update their data
        console.log(`Professional with email ${professionalData.email} already exists, updating...`);
        professional = await storage.updateProfessional(professional.id, {
          fullName: professionalData.name,
          phone: professionalData.phone,
          document: professionalData.cpf,
          serviceArea: professionalData.cep || professional.serviceArea || '74000000',
          city: professionalData.city || professional.city || 'Goiânia',
          status: subscription.status === 'active' ? 'active' : 'inactive',
          subscriptionPlanId: planId,
          updatedAt: new Date()
        });
      } else {
        // Create new professional account
        console.log(`Creating new professional with email ${professionalData.email}...`);
        professional = await storage.createProfessional({
          fullName: professionalData.name,
          email: professionalData.email,
          phone: professionalData.phone,
          document: professionalData.cpf,
          categoryId: '', // Will be set later when they complete profile
          serviceArea: professionalData.cep || '74000000', // Use provided CEP or default
          city: professionalData.city || 'Goiânia', // Use provided city or default
          description: '',
          status: subscription.status === 'active' ? 'pending' : 'inactive',
          averageRating: 0,
          totalReviews: 0,
          password: await bcrypt.hash('senha123', 10) // Default password: senha123
        });
      }
      
      // Save payment record
      const payment = await storage.createPayment({
        professionalId: professional.id,
        planId: planId,
        amount: plan.monthlyPrice,
        currency: 'BRL',
        status: subscription.status,
        pagarmeSubscriptionId: subscription.id,
        paymentMethod: paymentMethod,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      });

      // Generate JWT token for auto-login
      const token = jwt.sign(
        { professionalId: professional.id, email: professional.email },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      // Prepare response data
      const responseData = { 
        success: true,
        message: paymentMethod === 'pix' || paymentMethod === 'boleto' ? 
          "Assinatura criada! Complete o pagamento para ativar sua conta." :
          "Conta criada com sucesso! Redirecionando para seu painel...",
        subscriptionId: subscription.id,
        paymentId: payment.id,
        professionalId: professional.id,
        status: subscription.status,
        paymentMethod: paymentMethod,
        professional: {
          id: professional.id,
          fullName: professional.fullName,
          email: professional.email
        }
      };
      
      // For PIX/Boleto payments, include payment info and don't auto-login yet
      if (paymentMethod === 'pix' || paymentMethod === 'boleto') {
        console.log('Processing PIX payment - searching for payment data...');
        console.log('Subscription boleto field:', JSON.stringify(subscription.boleto, null, 2));
        console.log('Subscription charges:', JSON.stringify(subscription.charges, null, 2));
        console.log('Full subscription keys:', Object.keys(subscription));
        
        // Try to find payment info in different places
        let paymentInfo = {};
        
        // Check charges first
        const lastCharge = subscription.charges && subscription.charges[0];
        if (lastCharge && lastCharge.last_transaction) {
          const transaction = lastCharge.last_transaction;
          console.log('Transaction found:', JSON.stringify(transaction, null, 2));
          
          paymentInfo = {
            qrCode: transaction.qr_code,
            qrCodeUrl: transaction.qr_code_url,
            line: transaction.line,
            pdf: transaction.pdf,
            dueAt: transaction.due_at || lastCharge.due_at,
            amount: lastCharge.amount
          };
        }
        // Check boleto field
        else if (subscription.boleto && Object.keys(subscription.boleto).length > 0) {
          console.log('Using boleto data:', JSON.stringify(subscription.boleto, null, 2));
          paymentInfo = {
            qrCode: subscription.boleto.qr_code,
            qrCodeUrl: subscription.boleto.qr_code_url,
            line: subscription.boleto.line,
            pdf: subscription.boleto.pdf,
            dueAt: subscription.boleto.due_at,
            amount: priceInCentavos
          };
        }
        // If no payment data found, create a single charge for PIX payment
        else {
          console.log('No payment data found, creating boleto with PIX QR Code (30-day expiration)...');
          
          try {
            // Create boleto with PIX QR Code (30-day expiration)
            const chargeData = {
              amount: priceInCentavos,
              payment: {
                payment_method: 'boleto',
                boleto: {
                  due_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
                  type: 'DM',
                  instructions: 'Pague via PIX escaneando o QR Code ou usando o código PIX. Válido por 30 dias.'
                }
              },
              customer: {
                id: subscription.customer.id,
                name: subscription.customer.name,
                email: subscription.customer.email,
                document: subscription.customer.document,
                type: subscription.customer.type,
                address: subscription.customer.address,
                phones: {
                  mobile_phone: {
                    country_code: '55',
                    area_code: professionalData.phone.substring(0, 2),
                    number: professionalData.phone.substring(2)
                  }
                }
              },
              statement_descriptor: 'MONTE EVEREST'
            };

            console.log('Creating charge with data:', JSON.stringify(chargeData, null, 2));

            const chargeResponse = await fetch('https://api.pagar.me/core/v5/charges', {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${Buffer.from(process.env.PAGARME_API_KEY + ':').toString('base64')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(chargeData)
            });

            if (chargeResponse.ok) {
              const charge = await chargeResponse.json();
              console.log('Charge created:', JSON.stringify(charge, null, 2));
              
              if (charge.last_transaction) {
                const transaction = charge.last_transaction;
                console.log('Transaction from new charge:', JSON.stringify(transaction, null, 2));
                
                paymentInfo = {
                  qrCode: transaction.qr_code,
                  qrCodeUrl: transaction.qr_code, // For boleto, qr_code is the PIX code
                  pixCode: transaction.qr_code, // PIX copy-paste code
                  line: transaction.line, // Boleto line
                  pdf: transaction.pdf, // Boleto PDF
                  expiresAt: transaction.due_at,
                  amount: charge.amount || priceInCentavos
                };
              } else {
                paymentInfo = {
                  amount: priceInCentavos,
                  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                };
              }
            } else {
              const errorText = await chargeResponse.text();
              console.log('Failed to create charge:', chargeResponse.status, errorText);
              paymentInfo = {
                amount: priceInCentavos,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              };
            }
          } catch (error) {
            console.error('Error creating charge:', error);
            paymentInfo = {
              amount: priceInCentavos,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            };
          }
        }
        
        responseData.paymentInfo = paymentInfo;
        responseData.redirectTo = null; // Don't redirect yet, show payment info first
      } else {
        // For credit card, proceed with auto-login
        responseData.autoLogin = true;
        responseData.firstLogin = true;
        responseData.token = token;
        responseData.redirectTo = '/professional-login';
      }
      
      res.json(responseData);
    } catch (error) {
      console.error("Error creating subscription:", error);
      
      // Check if it's a duplicate email error
      if (error.code === '23505' && error.constraint === 'professionals_email_unique') {
        return res.status(400).json({ 
          success: false,
          error: 'duplicate_email',
          message: 'Este email já possui uma conta profissional. Faça login ou use outro email.' 
        });
      }
      
      // Check if it's a duplicate CPF error
      if (error.code === '23505' && error.constraint === 'professionals_document_unique') {
        return res.status(400).json({ 
          success: false,
          error: 'duplicate_cpf',
          message: 'Este CPF já está cadastrado na plataforma. Cada pessoa pode ter apenas uma conta.' 
        });
      }
      
      res.status(500).json({ 
        success: false,
        error: 'payment_failed',
        message: 'Erro ao processar pagamento. Tente novamente.' 
      });
    }
  });

  // Webhook for Pagar.me notifications
  app.post("/api/payments/webhook", async (req, res) => {
    try {
      const { event, data } = req.body;
      
      switch (event) {
        case 'subscription.paid':
          // Update payment status
          const payment = await storage.updatePaymentByPagarmeId(data.id, {
            status: 'paid',
            paidAt: new Date(),
          });
          
          // Update professional subscription expiry date (30 days from now)
          if (payment && payment.professionalId) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30); // Add 30 days
            
            await storage.updateProfessional(payment.professionalId, {
              paymentStatus: 'active',
              status: 'active',
              lastPaymentDate: new Date(),
              subscriptionExpiresAt: expiryDate,
            });
          }
          break;
          
        case 'subscription.payment_failed':
          // Update payment status
          await storage.updatePaymentByPagarmeId(data.id, {
            status: 'failed',
          });
          break;
          
        case 'subscription.canceled':
          // Handle subscription cancellation
          await storage.updatePaymentByPagarmeId(data.id, {
            status: 'canceled',
          });
          break;
      }
      
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // Get subscription status
  app.get("/api/payments/subscription/:subscriptionId", verifyAdminToken, async (req, res) => {
    try {
      const subscription = await pagarmeService.getSubscription(req.params.subscriptionId);
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ 
        message: "Erro ao buscar assinatura",
        error: error.message 
      });
    }
  });

  // System configurations routes
  app.get('/api/admin/configs', verifyAdminToken, async (req, res) => {
    try {
      const configs = await storage.getSystemConfigs();
      res.json(configs);
    } catch (error) {
      console.error('Error fetching system configs:', error);
      res.status(500).json({ error: 'Failed to fetch system configs' });
    }
  });

  app.get('/api/admin/configs/:key', verifyAdminToken, async (req, res) => {
    try {
      const config = await storage.getSystemConfig(req.params.key);
      if (!config) {
        return res.status(404).json({ error: 'Configuration not found' });
      }
      res.json(config);
    } catch (error) {
      console.error('Error fetching system config:', error);
      res.status(500).json({ error: 'Failed to fetch system config' });
    }
  });

  app.post('/api/admin/configs', verifyAdminToken, async (req, res) => {
    try {
      const { key, value, description, isSecret } = req.body;
      
      if (!key || !value) {
        return res.status(400).json({ error: 'Key and value are required' });
      }

      const config = await storage.setSystemConfig(key, value, description, isSecret);
      res.json(config);
    } catch (error) {
      console.error('Error creating/updating system config:', error);
      res.status(500).json({ error: 'Failed to save system config' });
    }
  });

  app.put('/api/admin/configs/:id', verifyAdminToken, async (req, res) => {
    try {
      const { value } = req.body;
      
      if (!value) {
        return res.status(400).json({ error: 'Value is required' });
      }

      const config = await storage.updateSystemConfig(req.params.id, value);
      res.json(config);
    } catch (error) {
      console.error('Error updating system config:', error);
      res.status(500).json({ error: 'Failed to update system config' });
    }
  });

  app.delete('/api/admin/configs/:id', verifyAdminToken, async (req, res) => {
    try {
      await storage.deleteSystemConfig(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting system config:', error);
      res.status(500).json({ error: 'Failed to delete system config' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
