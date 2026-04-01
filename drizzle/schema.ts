import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }).unique(),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  plan: mysqlEnum("plan", ["light", "standard", "premium"]).notNull(),
  status: mysqlEnum("status", [
    "active",
    "canceled",
    "past_due",
    "trialing",
    "incomplete",
  ]).notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: int("cancelAtPeriodEnd").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const reviewGenerations = mysqlTable("reviewGenerations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: mysqlEnum("plan", ["light", "standard", "premium"]).notNull(),
  industry: varchar("industry", { length: 100 }),
  purpose: varchar("purpose", { length: 50 }),
  tone: varchar("tone", { length: 50 }),
  questionsData: text("questionsData"),
  answersData: text("answersData"),
  generatedReview: text("generatedReview").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const customQuestions = mysqlTable("customQuestions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  questionText: text("questionText").notNull(),
  orderIndex: int("orderIndex").notNull().default(0),
  isActive: int("isActive").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const paymentHistory = mysqlTable("paymentHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).unique(),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 255 }),
  amount: int("amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("jpy"),
  plan: mysqlEnum("plan", ["light", "standard", "premium"]).notNull(),
  status: mysqlEnum("status", ["succeeded", "pending", "failed"]).notNull(),
  description: text("description"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type ReviewGeneration = typeof reviewGenerations.$inferSelect;
export type CustomQuestion = typeof customQuestions.$inferSelect;
export type PaymentHistory = typeof paymentHistory.$inferSelect;
