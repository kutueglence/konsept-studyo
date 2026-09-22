import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/*  Katalog                                                                    */
/* -------------------------------------------------------------------------- */

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  icon: varchar("icon", { length: 16 }).default("📦").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subcategories = pgTable("subcategories", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  categoryId: integer("category_id"),
  subcategoryId: integer("subcategory_id"),
  imageUrl: text("image_url"),
  modelUrl: text("model_url"),
  /** görsel yerine kullanılacak vektörel şekil anahtarı */
  shape: varchar("shape", { length: 40 }).default("kutu").notNull(),
  /** cm cinsinden */
  width: real("width").default(50).notNull(),
  height: real("height").default(50).notNull(),
  depth: real("depth").default(10).notNull(),
  color: varchar("color", { length: 32 }).default("#f0abfc").notNull(),
  colorEditable: boolean("color_editable").default(true).notNull(),
  material: varchar("material", { length: 120 }),
  price: real("price").default(0).notNull(),
  stock: integer("stock").default(0).notNull(),
  description: text("description"),
  /** wall | floor | ceiling */
  plane: varchar("plane", { length: 16 }).default("wall").notNull(),
  tags: text("tags"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* -------------------------------------------------------------------------- */
/*  Tasarımlar / Konseptler                                                    */
/* -------------------------------------------------------------------------- */

export const designs = pgTable("designs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  customerName: varchar("customer_name", { length: 200 }),
  customerPhone: varchar("customer_phone", { length: 60 }),
  eventType: varchar("event_type", { length: 120 }),
  eventDate: varchar("event_date", { length: 40 }),
  /** oda ayarları (ölçü, renk, ışık) */
  room: jsonb("room").notNull(),
  /** sahnedeki nesneler */
  items: jsonb("items").notNull(),
  total: real("total").default(0).notNull(),
  notes: text("notes"),
  /** yöneticinin hazırladığı hazır konsept mi */
  isTemplate: boolean("is_template").default(false).notNull(),
  coverColor: varchar("cover_color", { length: 32 }).default("#fde68a").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  designId: integer("design_id"),
  companyName: varchar("company_name", { length: 200 }).default("Konsept Kiralama").notNull(),
  customerName: varchar("customer_name", { length: 200 }),
  customerPhone: varchar("customer_phone", { length: 60 }),
  eventType: varchar("event_type", { length: 120 }),
  eventDate: varchar("event_date", { length: 40 }),
  conceptName: varchar("concept_name", { length: 200 }),
  lines: jsonb("lines").notNull(),
  total: real("total").default(0).notNull(),
  discount: real("discount").default(0).notNull(),
  notes: text("notes"),
  status: varchar("status", { length: 40 }).default("taslak").notNull(),
  preview: text("preview"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Subcategory = typeof subcategories.$inferSelect;
export type Design = typeof designs.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
