import { pgTable, text, serial, timestamp, boolean, integer, doublePrecision } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table (authenticated via Firebase Auth uid)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase Auth UID
  email: text("email").notNull(),
  name: text("name"),
  kycStatus: text("kyc_status").default("VERIFIED").notNull(),
  tier: integer("tier").default(3).notNull(),
  twoFA: boolean("two_fa").default(true).notNull(),
  passkey: boolean("passkey").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Balances
export const balances = pgTable("balances", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.uid, { onDelete: "cascade" }),
  asset: text("asset").notNull(),
  free: doublePrecision("free").default(0).notNull(),
  locked: doublePrecision("locked").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// CLOB Orders
export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.uid, { onDelete: "cascade" }),
  pair: text("pair").notNull(),
  side: text("side").notNull(), // BUY / SELL
  type: text("type").notNull(), // LIMIT, MARKET, IOC, FOK, POST_ONLY
  price: doublePrecision("price").notNull(),
  qty: doublePrecision("qty").notNull(),
  filledQty: doublePrecision("filled_qty").default(0).notNull(),
  status: text("status").notNull(), // NEW, PARTIALLY_FILLED, FILLED, CANCELLED, REJECTED
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Trade Tape
export const trades = pgTable("trades", {
  id: text("id").primaryKey(),
  pair: text("pair").notNull(),
  price: doublePrecision("price").notNull(),
  qty: doublePrecision("qty").notNull(),
  buyerId: text("buyer_id"),
  sellerId: text("seller_id"),
  makerSide: text("maker_side").notNull(), // BUY / SELL
  executedAt: timestamp("executed_at").defaultNow().notNull(),
});

// Address Whitelist
export const whitelist = pgTable("whitelist", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.uid, { onDelete: "cascade" }),
  asset: text("asset").notNull(),
  chain: text("chain").notNull(),
  address: text("address").notNull(),
  label: text("label").notNull(),
  timeLockHours: integer("time_lock_hours").default(24).notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  balances: many(balances),
  orders: many(orders),
  whitelist: many(whitelist),
}));

export const balancesRelations = relations(balances, ({ one }) => ({
  user: one(users, {
    fields: [balances.userId],
    references: [users.uid],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.uid],
  }),
}));

export const whitelistRelations = relations(whitelist, ({ one }) => ({
  user: one(users, {
    fields: [whitelist.userId],
    references: [users.uid],
  }),
}));
