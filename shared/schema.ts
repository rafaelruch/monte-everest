import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  decimal,
  boolean,
  jsonb,
  index,
  bytea,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users/Admin table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: varchar("full_name"), // Nome completo do administrador
  role: varchar("role").notNull().default("admin"), // admin
  isSystemAdmin: boolean("is_system_admin").default(false), // Admin criado na instalação
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service categories
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  icon: varchar("icon"), // FontAwesome icon class
  isActive: boolean("is_active").default(true),
  isPopular: boolean("is_popular").default(false), // Mark as popular to appear in featured section
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription plans for professionals
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  yearlyPrice: decimal("yearly_price", { precision: 10, scale: 2 }),
  features: jsonb("features").$type<string[]>(), // Array of features
  maxContacts: integer("max_contacts"), // null = unlimited
  maxPhotos: integer("max_photos").default(5),
  priority: integer("priority").default(0), // for ordering in selection
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false), // Mark as popular/highlighted
  pagarmeProductId: varchar("pagarme_product_id"), // Pagar.me product reference
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service providers/professionals
export const professionals = pgTable("professionals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: varchar("full_name").notNull(),
  email: varchar("email").notNull().unique(),
  password: text("password"),
  phone: varchar("phone").notNull(),
  document: varchar("document").notNull().unique(), // CPF/CNPJ - must be unique
  categoryId: varchar("category_id").notNull(),
  subscriptionPlanId: varchar("subscription_plan_id"),
  serviceArea: varchar("service_area").notNull(), // CEP
  city: varchar("city").notNull(), // Cidade
  description: text("description").notNull(),
  profileImage: text("profile_image"),
  portfolio: jsonb("portfolio").$type<string[]>(), // Array of image URLs
  website: varchar("website"),
  socialMedia: jsonb("social_media").$type<{
    whatsapp?: string;
    facebook?: string;
    instagram?: string;
  }>(),
  workingHours: jsonb("working_hours").$type<{
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  }>(),
  status: varchar("status").notNull().default("pending"), // pending, active, suspended
  paymentStatus: varchar("payment_status").notNull().default("pending"), // pending, active, overdue
  lastPaymentDate: timestamp("last_payment_date"),
  nextPaymentDate: timestamp("next_payment_date"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"), // When subscription becomes inactive
  firstLogin: boolean("first_login").default(true), // Force password change on first login
  photo: varchar("photo"), // URL to professional's photo
  pendingPixCode: text("pending_pix_code"), // PIX code for pending payment
  pendingPixUrl: text("pending_pix_url"), // PIX QR Code URL for pending payment
  pendingPixExpiry: timestamp("pending_pix_expiry"), // When PIX payment expires
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalReviews: integer("total_reviews").default(0),
  rankingPosition: integer("ranking_position"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  categoryIdx: index("professionals_category_idx").on(table.categoryId),
  serviceAreaIdx: index("professionals_service_area_idx").on(table.serviceArea),
  statusIdx: index("professionals_status_idx").on(table.status),
  ratingIdx: index("professionals_rating_idx").on(table.rating),
}));

// Customer reviews/evaluations
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  professionalId: varchar("professional_id").notNull(),
  customerName: varchar("customer_name").notNull(),
  customerEmail: varchar("customer_email").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  professionalIdx: index("reviews_professional_idx").on(table.professionalId),
  ratingIdx: index("reviews_rating_idx").on(table.rating),
  createdAtIdx: index("reviews_created_at_idx").on(table.createdAt),
}));

// Payment records
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  professionalId: varchar("professional_id").notNull(),
  planId: varchar("plan_id"), // Reference to subscription plan
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default("BRL"),
  status: varchar("status").notNull(), // pending, paid, failed, refunded
  paymentMethod: varchar("payment_method"), // credit_card, pix, etc
  transactionId: varchar("transaction_id"), // Pagar.me transaction ID
  pagarmeSubscriptionId: varchar("pagarme_subscription_id"), // Pagar.me subscription ID
  cardToken: text("card_token"), // Encrypted card token
  dueDate: timestamp("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  professionalIdx: index("payments_professional_idx").on(table.professionalId),
  statusIdx: index("payments_status_idx").on(table.status),
  dueDateIdx: index("payments_due_date_idx").on(table.dueDate),
}));

// Contact interactions for statistics
export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  professionalId: varchar("professional_id").notNull(),
  customerName: varchar("customer_name"),
  customerEmail: varchar("customer_email"),
  customerPhone: varchar("customer_phone"),
  contactMethod: varchar("contact_method").notNull(), // whatsapp, phone, form
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  professionalIdx: index("contacts_professional_idx").on(table.professionalId),
  methodIdx: index("contacts_method_idx").on(table.contactMethod),
  createdAtIdx: index("contacts_created_at_idx").on(table.createdAt),
}));

// System logs
export const systemLogs = pgTable("system_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  action: varchar("action").notNull(),
  entityType: varchar("entity_type"),
  entityId: varchar("entity_id"),
  details: jsonb("details"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdx: index("system_logs_user_idx").on(table.userId),
  actionIdx: index("system_logs_action_idx").on(table.action),
  createdAtIdx: index("system_logs_created_at_idx").on(table.createdAt),
}));

// System configurations
export const systemConfigs = pgTable("system_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  value: text("value"),
  description: text("description"),
  isSecret: boolean("is_secret").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Pages for footer links and static content
export const pages = pgTable("pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  slug: varchar("slug").notNull().unique(),
  content: text("content").notNull(),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  isActive: boolean("is_active").default(true),
  showInFooter: boolean("show_in_footer").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const professionalsRelations = relations(professionals, ({ one, many }) => ({
  category: one(categories, {
    fields: [professionals.categoryId],
    references: [categories.id],
  }),
  subscriptionPlan: one(subscriptionPlans, {
    fields: [professionals.subscriptionPlanId],
    references: [subscriptionPlans.id],
  }),
  reviews: many(reviews),
  payments: many(payments),
  contacts: many(contacts),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  professionals: many(professionals),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  professionals: many(professionals),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  professional: one(professionals, {
    fields: [reviews.professionalId],
    references: [professionals.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  professional: one(professionals, {
    fields: [payments.professionalId],
    references: [professionals.id],
  }),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  professional: one(professionals, {
    fields: [contacts.professionalId],
    references: [professionals.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProfessionalSchema = createInsertSchema(professionals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  rating: true,
  totalReviews: true,
  rankingPosition: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isVerified: true,
}).extend({
  rating: z.number().min(1).max(5),
  comment: z.string().max(300).optional(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  paidAt: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Images table - para armazenar imagens diretamente no banco
export const images = pgTable("images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: varchar("filename").notNull(),
  mimetype: varchar("mimetype").notNull(),
  size: integer("size").notNull(), // tamanho em bytes
  data: bytea("data").notNull(), // dados binários da imagem
  professionalId: varchar("professional_id").notNull(), // quem fez upload
  type: varchar("type").notNull(), // 'profile' ou 'portfolio'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  professionalIdx: index("images_professional_idx").on(table.professionalId),
  typeIdx: index("images_type_idx").on(table.type),
}));

export const insertPageSchema = createInsertSchema(pages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertImageSchema = createInsertSchema(images).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertProfessional = z.infer<typeof insertProfessionalSchema>;
export type Professional = typeof professionals.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

export type SystemLog = typeof systemLogs.$inferSelect;
export type InsertSystemLog = typeof systemLogs.$inferInsert;

export type SystemConfig = typeof systemConfigs.$inferSelect;
export type InsertSystemConfig = typeof systemConfigs.$inferInsert;

export type Page = typeof pages.$inferSelect;
export type InsertPage = z.infer<typeof insertPageSchema>;

export type Image = typeof images.$inferSelect;
export type InsertImage = z.infer<typeof insertImageSchema>;
