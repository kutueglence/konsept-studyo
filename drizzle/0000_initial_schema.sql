CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"icon" varchar(16) DEFAULT '📦' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "designs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"customer_name" varchar(200),
	"customer_phone" varchar(60),
	"event_type" varchar(120),
	"event_date" varchar(40),
	"room" jsonb NOT NULL,
	"items" jsonb NOT NULL,
	"total" real DEFAULT 0 NOT NULL,
	"notes" text,
	"is_template" boolean DEFAULT false NOT NULL,
	"cover_color" varchar(32) DEFAULT '#fde68a' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"category_id" integer,
	"subcategory_id" integer,
	"image_url" text,
	"model_url" text,
	"shape" varchar(40) DEFAULT 'kutu' NOT NULL,
	"width" real DEFAULT 50 NOT NULL,
	"height" real DEFAULT 50 NOT NULL,
	"depth" real DEFAULT 10 NOT NULL,
	"color" varchar(32) DEFAULT '#f0abfc' NOT NULL,
	"color_editable" boolean DEFAULT true NOT NULL,
	"material" varchar(120),
	"price" real DEFAULT 0 NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"description" text,
	"plane" varchar(16) DEFAULT 'wall' NOT NULL,
	"tags" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"design_id" integer,
	"company_name" varchar(200) DEFAULT 'Konsept Kiralama' NOT NULL,
	"customer_name" varchar(200),
	"customer_phone" varchar(60),
	"event_type" varchar(120),
	"event_date" varchar(40),
	"concept_name" varchar(200),
	"lines" jsonb NOT NULL,
	"total" real DEFAULT 0 NOT NULL,
	"discount" real DEFAULT 0 NOT NULL,
	"notes" text,
	"status" varchar(40) DEFAULT 'taslak' NOT NULL,
	"preview" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subcategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
