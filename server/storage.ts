import {
  users,
  categories,
  subscriptionPlans,
  professionals,
  reviews,
  payments,
  contacts,
  systemLogs,
  systemConfigs,
  pages,
  type User,
  type InsertUser,
  type Category,
  type InsertCategory,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type Professional,
  type InsertProfessional,
  type Review,
  type InsertReview,
  type Payment,
  type InsertPayment,
  type Contact,
  type InsertContact,
  type SystemLog,
  type SystemConfig,
  type InsertSystemConfig,
  type Page,
  type InsertPage,
} from "@shared/schema";
import { db } from "./db";
import { Pool as PgPool } from 'pg';
import { eq, desc, asc, and, like, sql, count, avg, or, isNull, gt, lt, lte } from "drizzle-orm";
import bcrypt from "bcrypt";

// Global flag to track UNACCENT availability
let unaccentAvailable: boolean | null = null;

export interface IStorage {
  // Installation operations
  getAdminUsers(): Promise<User[]>;
  saveInstallationConfig(config: any): Promise<void>;
  getInstallationConfig(): Promise<any>;
  createInitialData(): Promise<void>;

  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getPopularCategories(): Promise<Category[]>;
  getCategoriesWithStats(): Promise<(Category & { professionalsCount: number })[]>;
  getCategory(id: string): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Subscription plan operations
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan>;
  deleteSubscriptionPlan(id: string): Promise<void>;

  // Professional operations
  getProfessionals(filters?: {
    categoryId?: string;
    serviceArea?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Professional[]>;
  getProfessional(id: string): Promise<Professional | undefined>;
  getProfessionalByEmail(email: string): Promise<Professional | undefined>;
  createProfessional(professional: InsertProfessional): Promise<Professional>;
  updateProfessional(id: string, professional: Partial<InsertProfessional>): Promise<Professional>;
  deleteProfessional(id: string): Promise<void>;
  updateProfessionalRating(professionalId: string): Promise<void>;
  updateCategoryRankings(categoryId: string): Promise<void>;
  getActiveCities(): Promise<string[]>;
  
  // Professional authentication
  authenticateProfessional(email: string, password: string): Promise<Professional | null>;
  updateProfessionalPassword(id: string, hashedPassword: string): Promise<void>;

  // Review operations
  getReviews(professionalId: string): Promise<Review[]>;
  getReview(id: string): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: string, review: Partial<InsertReview>): Promise<Review>;
  deleteReview(id: string): Promise<void>;

  // Payment operations
  getPayments(professionalId?: string): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment>;
  deletePayment(id: string): Promise<void>;
  getOverduePayments(): Promise<Payment[]>;

  // Contact operations
  getContacts(professionalId?: string): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;

  // Analytics
  getDashboardStats(): Promise<{
    activeProfessionals: number;
    monthlyRevenue: string;
    averageRating: string;
    growthPercentage: string;
  }>;

  // Logs
  createLog(log: Omit<SystemLog, 'id' | 'createdAt'>): Promise<SystemLog>;

  // System configurations
  getSystemConfig(key: string): Promise<SystemConfig | undefined>;
  getSystemConfigs(): Promise<SystemConfig[]>;
  setSystemConfig(key: string, value: string, description?: string, isSecret?: boolean): Promise<SystemConfig>;
  updateSystemConfig(id: string, value: string): Promise<SystemConfig>;
  deleteSystemConfig(id: string): Promise<void>;

  // Page operations
  getPages(): Promise<Page[]>;
  getPage(id: string): Promise<Page | undefined>;
  getPageBySlug(slug: string): Promise<Page | undefined>;
  createPage(page: InsertPage): Promise<Page>;
  updatePage(id: string, page: Partial<InsertPage>): Promise<Page>;
  deletePage(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Initialize database extensions and check UNACCENT availability
  async initializeDatabase(): Promise<void> {
    try {
      console.log('[db] Initializing database extensions...');
      
      // Try to create UNACCENT extension
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS unaccent`);
      
      // Test UNACCENT functionality
      await db.execute(sql`SELECT unaccent('test')`);
      
      unaccentAvailable = true;
      console.log('[db] UNACCENT extension is available and working');
    } catch (error) {
      console.warn('[db] UNACCENT extension not available, falling back to regular ILIKE:', error);
      unaccentAvailable = false;
      
      // Log the error for debugging
      await this.createLog({
        userId: 'system',
        action: 'unaccent_initialization_failed',
        entityType: 'database',
        entityId: 'unaccent_extension',
        details: { error: error instanceof Error ? error.message : String(error) },
        ipAddress: null,
        userAgent: null
      }).catch(() => {
        // Ignore logging errors during initialization
        console.warn('[db] Could not log UNACCENT initialization error');
      });
    }
  }

  // Helper method to create accent-insensitive search conditions with fallback
  private createAccentInsensitiveCondition(column: any, searchTerm: string) {
    if (unaccentAvailable === true) {
      try {
        return sql`unaccent(${column}) ILIKE unaccent(${`%${searchTerm}%`})`;
      } catch (error) {
        console.warn('[db] UNACCENT query failed, falling back to case-insensitive ILIKE:', error);
        unaccentAvailable = false;
        return sql`${column} ILIKE ${`%${searchTerm}%`}`;
      }
    } else {
      // Use regular case-insensitive search as fallback
      return sql`${column} ILIKE ${`%${searchTerm}%`}`;
    }
  }
  // Installation operations
  async getAdminUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'admin'));
  }

  async saveInstallationConfig(config: any): Promise<void> {
    // For simplicity, we'll store this in a system log or config table
    // In a real implementation, you might want a dedicated configs table
    await this.createLog({
      userId: config.installedBy,
      action: 'save_installation_config',
      entityType: 'system',
      entityId: 'installation_config',
      details: config,
      ipAddress: null,
      userAgent: null
    });
  }

  async getInstallationConfig(): Promise<any> {
    const [config] = await db
      .select()
      .from(systemLogs)
      .where(and(
        eq(systemLogs.action, 'save_installation_config'),
        eq(systemLogs.entityType, 'system'),
        eq(systemLogs.entityId, 'installation_config')
      ))
      .orderBy(desc(systemLogs.createdAt))
      .limit(1);
    
    return config ? config.details : null;
  }

  async createInitialData(): Promise<void> {
    try {
      // Check if categories already exist
      const existingCategories = await db.select().from(categories).limit(1);
      
      if (existingCategories.length === 0) {
        // Create initial categories
        const initialCategories = [
          { name: "Encanador", slug: "encanador", description: "Serviços de encanamento e hidráulica", icon: "🔧", isActive: true, isPopular: true },
          { name: "Eletricista", slug: "eletricista", description: "Serviços elétricos residenciais e comerciais", icon: "⚡", isActive: true, isPopular: true },
          { name: "Pedreiro", slug: "pedreiro", description: "Construção e reformas em geral", icon: "🧱", isActive: true, isPopular: true },
          { name: "Pintor", slug: "pintor", description: "Pintura residencial e comercial", icon: "🎨", isActive: true, isPopular: true },
          { name: "Marceneiro", slug: "marceneiro", description: "Móveis e estruturas de madeira", icon: "🪚", isActive: true, isPopular: false },
          { name: "Jardineiro", slug: "jardineiro", description: "Cuidados com jardins e paisagismo", icon: "🌱", isActive: true, isPopular: false },
          { name: "Limpeza", slug: "limpeza", description: "Serviços de limpeza residencial e comercial", icon: "🧽", isActive: true, isPopular: true },
          { name: "Montador", slug: "montador", description: "Montagem de móveis e equipamentos", icon: "🔨", isActive: true, isPopular: false },
          { name: "Chaveiro", slug: "chaveiro", description: "Serviços de chaveiro e fechaduras", icon: "🗝️", isActive: true, isPopular: false },
          { name: "Vidraceiro", slug: "vidraceiro", description: "Instalação e reparo de vidros", icon: "🔲", isActive: true, isPopular: false }
        ];

        for (const categoryData of initialCategories) {
          await db.insert(categories).values(categoryData);
        }
      }

      // Check if subscription plans already exist
      const existingPlans = await db.select().from(subscriptionPlans).limit(1);
      
      if (existingPlans.length === 0) {
        // Create initial subscription plans
        const initialPlans = [
          {
            name: "Plano Básico",
            description: "Ideal para profissionais iniciantes",
            price: 19.90,
            duration: 30,
            features: JSON.stringify([
              "Perfil profissional básico",
              "Até 5 fotos no portfólio",
              "Receber contatos de clientes",
              "Suporte via email"
            ]),
            maxPhotos: 5,
            priorityListing: false,
            verifiedBadge: false,
            customUrl: false,
            analytics: false,
            isActive: true,
            isPopular: false,
            sortOrder: 1
          },
          {
            name: "Plano Profissional",
            description: "Para profissionais estabelecidos",
            price: 39.90,
            duration: 30,
            features: JSON.stringify([
              "Perfil profissional completo",
              "Até 15 fotos no portfólio",
              "Selo de verificado",
              "Listagem prioritária",
              "Suporte via WhatsApp",
              "Estatísticas básicas"
            ]),
            maxPhotos: 15,
            priorityListing: true,
            verifiedBadge: true,
            customUrl: false,
            analytics: true,
            isActive: true,
            isPopular: true,
            sortOrder: 2
          },
          {
            name: "Plano Premium",
            description: "Máxima visibilidade e recursos",
            price: 69.90,
            duration: 30,
            features: JSON.stringify([
              "Perfil premium com destaque",
              "Fotos ilimitadas no portfólio",
              "Selo de verificado premium",
              "Primeira posição nas buscas",
              "URL personalizada",
              "Suporte prioritário",
              "Relatórios avançados",
              "Badge de destaque"
            ]),
            maxPhotos: 999,
            priorityListing: true,
            verifiedBadge: true,
            customUrl: true,
            analytics: true,
            isActive: true,
            isPopular: false,
            sortOrder: 3
          }
        ];

        for (const planData of initialPlans) {
          await db.insert(subscriptionPlans).values(planData);
        }
      }
    } catch (error) {
      console.error("Error creating initial data:", error);
      throw error;
    }
  }
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.name));
  }

  async getPopularCategories(): Promise<Category[]> {
    return db.select().from(categories).where(and(eq(categories.isActive, true), eq(categories.isPopular, true))).orderBy(asc(categories.name));
  }

  async getCategoriesWithStats(): Promise<(Category & { professionalsCount: number })[]> {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        icon: categories.icon,
        isActive: categories.isActive,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        professionalsCount: count(professionals.id).as('professionalsCount')
      })
      .from(categories)
      .leftJoin(professionals, eq(categories.id, professionals.categoryId))
      .groupBy(categories.id)
      .orderBy(asc(categories.name));
    
    return result.map((row: any) => ({
      ...row,
      professionalsCount: Number(row.professionalsCount) || 0
    }));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category> {
    const [updated] = await db.update(categories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.update(categories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(categories.id, id));
  }

  async getProfessionals(filters?: {
    categoryId?: string;
    serviceArea?: string;
    city?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Professional[]> {
    let query = db
      .select({
        ...professionals,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        },
      })
      .from(professionals)
      .leftJoin(categories, eq(professionals.categoryId, categories.id));
    
    const conditions = [];
    
    if (filters?.categoryId) {
      conditions.push(eq(professionals.categoryId, filters.categoryId));
    }
    
    if (filters?.serviceArea) {
      // Use accent-insensitive search with fallback
      conditions.push(this.createAccentInsensitiveCondition(professionals.serviceArea, filters.serviceArea));
    }
    
    if (filters?.city) {
      // Use accent-insensitive search with fallback
      conditions.push(this.createAccentInsensitiveCondition(professionals.city, filters.city));
    }
    
    if (filters?.status) {
      conditions.push(eq(professionals.status, filters.status));
    } else {
      // Only show active professionals with valid subscriptions
      conditions.push(eq(professionals.status, 'active'));
      conditions.push(or(
        isNull(professionals.subscriptionExpiresAt),
        gt(professionals.subscriptionExpiresAt, new Date())
      ));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    query = query.orderBy(desc(professionals.rating), asc(professionals.rankingPosition));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }
    
    return await query;
  }

  // Método especial para admin buscar TODOS os profissionais sem filtros
  async getAllProfessionalsForAdmin(): Promise<Professional[]> {
    return await db.select().from(professionals)
      .orderBy(desc(professionals.createdAt), desc(professionals.rating));
  }

  async getProfessional(id: string): Promise<Professional | undefined> {
    const [professional] = await db.select().from(professionals).where(eq(professionals.id, id));
    return professional;
  }

  async getProfessionalById(id: string): Promise<Professional | undefined> {
    return this.getProfessional(id);
  }

  async getProfessionalByEmail(email: string): Promise<Professional | undefined> {
    const [professional] = await db.select().from(professionals).where(eq(professionals.email, email));
    return professional;
  }

  async createProfessional(professional: InsertProfessional): Promise<Professional> {
    const [created] = await db.insert(professionals).values(professional).returning();
    return created;
  }

  async updateProfessional(id: string, professional: Partial<InsertProfessional>): Promise<Professional> {
    const [updated] = await db.update(professionals)
      .set({ ...professional, updatedAt: new Date() })
      .where(eq(professionals.id, id))
      .returning();
    return updated;
  }

  async deleteProfessional(id: string): Promise<void> {
    // Delete in order due to foreign key constraints
    // First delete contacts
    await db.delete(contacts).where(eq(contacts.professionalId, id));
    
    // Delete reviews
    await db.delete(reviews).where(eq(reviews.professionalId, id));
    
    // Delete payments
    await db.delete(payments).where(eq(payments.professionalId, id));
    
    // Finally delete the professional
    await db.delete(professionals).where(eq(professionals.id, id));
  }

  async updateProfessionalRating(professionalId: string): Promise<void> {
    const [ratingData] = await db.select({
      avgRating: avg(reviews.rating),
      totalReviews: count(reviews.id)
    })
    .from(reviews)
    .where(eq(reviews.professionalId, professionalId));

    await db.update(professionals)
      .set({
        rating: ratingData.avgRating ? ratingData.avgRating.toString() : "0.00",
        totalReviews: ratingData.totalReviews || 0,
        updatedAt: new Date()
      })
      .where(eq(professionals.id, professionalId));
  }

  async updateCategoryRankings(categoryId: string): Promise<void> {
    const categoryProfessionals = await db.select()
      .from(professionals)
      .where(and(
        eq(professionals.categoryId, categoryId),
        eq(professionals.status, 'active')
      ))
      .orderBy(desc(professionals.rating), desc(professionals.totalReviews));

    for (let i = 0; i < categoryProfessionals.length; i++) {
      await db.update(professionals)
        .set({ 
          rankingPosition: i + 1,
          updatedAt: new Date()
        })
        .where(eq(professionals.id, categoryProfessionals[i].id));
    }
  }

  async getActiveCities(): Promise<string[]> {
    const result = await db.select({ city: professionals.city })
      .from(professionals)
      .where(eq(professionals.status, 'active'))
      .groupBy(professionals.city)
      .orderBy(asc(professionals.city));
    
    return result.map(row => row.city).filter(city => city !== null && city !== undefined);
  }

  async getReviews(professionalId: string): Promise<Review[]> {
    return db.select().from(reviews)
      .where(eq(reviews.professionalId, professionalId))
      .orderBy(desc(reviews.createdAt));
  }

  async getReview(id: string): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review;
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [created] = await db.insert(reviews).values(review).returning();
    
    // Update professional rating
    await this.updateProfessionalRating(review.professionalId);
    
    // Update category rankings
    const professional = await this.getProfessional(review.professionalId);
    if (professional) {
      await this.updateCategoryRankings(professional.categoryId);
    }
    
    return created;
  }

  async updateReview(id: string, review: Partial<InsertReview>): Promise<Review> {
    const [updated] = await db.update(reviews)
      .set({ ...review, updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning();
    return updated;
  }

  async deleteReview(id: string): Promise<void> {
    await db.delete(reviews).where(eq(reviews.id, id));
  }

  async getPayments(professionalId?: string): Promise<Payment[]> {
    let query = db.select({
      id: payments.id,
      professionalId: payments.professionalId,
      planId: payments.planId,
      amount: payments.amount,
      currency: payments.currency,
      status: payments.status,
      pagarmeSubscriptionId: payments.pagarmeSubscriptionId,
      paymentMethod: payments.paymentMethod,
      dueDate: payments.dueDate,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
      updatedAt: payments.updatedAt,
      // Join data
      professionalName: professionals.fullName,
      professionalEmail: professionals.email,
      planName: subscriptionPlans.name,
      planPrice: subscriptionPlans.monthlyPrice
    })
    .from(payments)
    .leftJoin(professionals, eq(payments.professionalId, professionals.id))
    .leftJoin(subscriptionPlans, eq(payments.planId, subscriptionPlans.id));
    
    if (professionalId) {
      query = query.where(eq(payments.professionalId, professionalId));
    }
    
    return await query.orderBy(desc(payments.createdAt));
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [created] = await db.insert(payments).values(payment).returning();
    return created;
  }

  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment> {
    const [updated] = await db.update(payments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updated;
  }

  async deletePayment(id: string): Promise<void> {
    await db.delete(payments).where(eq(payments.id, id));
  }

  async getOverduePayments(): Promise<Payment[]> {
    return db.select().from(payments)
      .where(and(
        eq(payments.status, 'pending'),
        sql`${payments.dueDate} < NOW()`
      ))
      .orderBy(asc(payments.dueDate));
  }

  async getContacts(professionalId?: string): Promise<Contact[]> {
    let query = db.select().from(contacts);
    
    if (professionalId) {
      query = query.where(eq(contacts.professionalId, professionalId));
    }
    
    return await query.orderBy(desc(contacts.createdAt));
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [created] = await db.insert(contacts).values(contact).returning();
    return created;
  }

  async getDashboardStats(): Promise<{
    activeProfessionals: number;
    monthlyRevenue: string;
    averageRating: string;
    growthPercentage: string;
  }> {
    const [professionalCount] = await db.select({
      count: count()
    }).from(professionals)
      .where(eq(professionals.status, 'active'));

    const [revenueData] = await db.select({
      total: sql<string>`COALESCE(SUM(${payments.amount}), 0)`
    }).from(payments)
      .where(and(
        eq(payments.status, 'paid'),
        sql`${payments.paidAt} >= DATE_TRUNC('month', CURRENT_DATE)`
      ));

    const [ratingData] = await db.select({
      avgRating: avg(professionals.rating)
    }).from(professionals)
      .where(eq(professionals.status, 'active'));

    return {
      activeProfessionals: professionalCount.count,
      monthlyRevenue: `R$ ${parseFloat(revenueData.total || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      averageRating: ratingData.avgRating ? parseFloat(ratingData.avgRating).toFixed(1) : '0.0',
      growthPercentage: '+12%' // This would need more complex calculation
    };
  }

  // Subscription plan operations
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans).orderBy(asc(subscriptionPlans.priority));
  }

  async getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(asc(subscriptionPlans.priority));
  }

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [created] = await db.insert(subscriptionPlans).values(plan).returning();
    return created;
  }

  async updateSubscriptionPlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan> {
    const [updated] = await db.update(subscriptionPlans)
      .set({ ...plan, updatedAt: new Date() })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return updated;
  }

  async deleteSubscriptionPlan(id: string): Promise<void> {
    await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));
  }

  async createLog(log: Omit<SystemLog, 'id' | 'createdAt'>): Promise<SystemLog> {
    const [created] = await db.insert(systemLogs).values(log).returning();
    return created;
  }

  async updateProfessionalPhoto(id: string, photoPath: string): Promise<void> {
    await db.update(professionals)
      .set({ profileImage: photoPath, updatedAt: new Date() })
      .where(eq(professionals.id, id));
  }

  // Professional authentication methods
  async authenticateProfessional(email: string, password: string): Promise<Professional | null> {
    const professional = await this.getProfessionalByEmail(email);
    if (!professional || !professional.password) {
      return null;
    }

    const isValid = await bcrypt.compare(password, professional.password);
    return isValid ? professional : null;
  }

  async updateProfessionalPassword(id: string, hashedPassword: string): Promise<void> {
    await db.update(professionals)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(professionals.id, id));
  }

  // Subscription management
  async deactivateExpiredSubscriptions(): Promise<number> {
    const now = new Date();
    const [result] = await db.update(professionals)
      .set({ 
        status: 'suspended', 
        paymentStatus: 'overdue',
        updatedAt: new Date()
      })
      .where(and(
        lt(professionals.subscriptionExpiresAt, now),
        eq(professionals.status, 'active')
      ))
      .returning({ id: professionals.id });
    
    return result ? 1 : 0;
  }

  async getProfessionalsNearExpiry(daysAhead: number = 5): Promise<Professional[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);
    
    return await db.select().from(professionals)
      .where(and(
        lte(professionals.subscriptionExpiresAt, targetDate),
        gt(professionals.subscriptionExpiresAt, new Date()),
        eq(professionals.status, 'active')
      ))
      .orderBy(asc(professionals.subscriptionExpiresAt));
  }

  async isSubscriptionActive(professionalId: string): Promise<boolean> {
    const [professional] = await db.select({
      subscriptionExpiresAt: professionals.subscriptionExpiresAt,
      status: professionals.status
    }).from(professionals)
      .where(eq(professionals.id, professionalId));
    
    if (!professional) return false;
    if (professional.status !== 'active') return false;
    if (!professional.subscriptionExpiresAt) return false;
    
    return professional.subscriptionExpiresAt > new Date();
  }

  // Review management operations
  async getAllReviewsWithProfessionalInfo(): Promise<any[]> {
    return await db.select({
      id: reviews.id,
      professionalId: reviews.professionalId,
      customerName: reviews.customerName,
      customerEmail: reviews.customerEmail,
      rating: reviews.rating,
      comment: reviews.comment,
      isVerified: reviews.isVerified,
      createdAt: reviews.createdAt,
      professional: {
        fullName: professionals.fullName,
        email: professionals.email
      }
    }).from(reviews)
      .leftJoin(professionals, eq(reviews.professionalId, professionals.id))
      .orderBy(desc(reviews.createdAt));
  }

  async updateReviewVerification(reviewId: string, isVerified: boolean): Promise<Review> {
    const [updated] = await db.update(reviews)
      .set({ isVerified, updatedAt: new Date() })
      .where(eq(reviews.id, reviewId))
      .returning();
    return updated;
  }

  // Payment operations for Pagar.me integration
  async updatePaymentByPagarmeId(pagarmeId: string, updateData: Partial<Payment>): Promise<Payment | null> {
    const [updated] = await db.update(payments)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(payments.pagarmeSubscriptionId, pagarmeId))
      .returning();
    return updated || null;
  }

  // System configurations
  async getSystemConfig(key: string): Promise<SystemConfig | undefined> {
    const [config] = await db.select().from(systemConfigs).where(eq(systemConfigs.key, key));
    return config;
  }

  async getSystemConfigs(): Promise<SystemConfig[]> {
    return db.select().from(systemConfigs).orderBy(asc(systemConfigs.key));
  }

  async setSystemConfig(key: string, value: string, description?: string, isSecret?: boolean): Promise<SystemConfig> {
    const existing = await this.getSystemConfig(key);
    
    if (existing) {
      const [updated] = await db
        .update(systemConfigs)
        .set({ value, description, isSecret, updatedAt: new Date() })
        .where(eq(systemConfigs.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(systemConfigs)
        .values({ key, value, description, isSecret })
        .returning();
      return created;
    }
  }

  async updateSystemConfig(id: string, value: string): Promise<SystemConfig> {
    const [updated] = await db
      .update(systemConfigs)
      .set({ value, updatedAt: new Date() })
      .where(eq(systemConfigs.id, id))
      .returning();
    return updated;
  }

  async deleteSystemConfig(id: string): Promise<void> {
    await db.delete(systemConfigs).where(eq(systemConfigs.id, id));
  }

  // Page operations
  async getPages(): Promise<Page[]> {
    return db.select().from(pages).orderBy(asc(pages.sortOrder), asc(pages.title));
  }

  async getPage(id: string): Promise<Page | undefined> {
    const [page] = await db.select().from(pages).where(eq(pages.id, id));
    return page;
  }

  async getPageBySlug(slug: string): Promise<Page | undefined> {
    const [page] = await db.select().from(pages).where(eq(pages.slug, slug));
    return page;
  }

  async createPage(page: InsertPage): Promise<Page> {
    const [created] = await db.insert(pages).values(page).returning();
    return created;
  }

  async updatePage(id: string, page: Partial<InsertPage>): Promise<Page> {
    const [updated] = await db
      .update(pages)
      .set({ ...page, updatedAt: new Date() })
      .where(eq(pages.id, id))
      .returning();
    return updated;
  }

  async deletePage(id: string): Promise<void> {
    await db.delete(pages).where(eq(pages.id, id));
  }
}

export const storage = new DatabaseStorage();
