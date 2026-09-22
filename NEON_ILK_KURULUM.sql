-- KONSEPT STÜDYO — NEON İLK TABLO KURULUMU
--
-- 1. Neon Console > projeniz > SQL Editor ekranını açın.
-- 2. Vercel DATABASE_URL ayarının bağlı olduğu AYNI branch ve database'i seçin.
-- 3. Bu dosyanın TAMAMINI yapıştırın ve Run düğmesine basın.
-- Şifre veya bağlantı adresi bu dosyaya yazılmaz. Yer tutucu değiştirmeniz gerekmez.
--
-- Yalnızca yeni/boş uygulama veritabanının ilk kurulumu içindir.
-- Beş tabloyu ve Drizzle migration kaydını tek atomik işlemle oluşturur.
-- Aynı kurulum zaten kayıtlıysa tablo/veri değiştirmeden geçer.
-- Kayıtsız, kısmi veya farklı bir kurulum varsa işlemi durdurur.
-- Hata alırsanız tablo SİLMEYİN; hata mesajıyla yardım isteyin.
-- Ürün, müşteri veya demo verisi eklemez; veri yedeği/aktarımı değildir.
--
-- Kaynak: drizzle/0000_initial_schema.sql
-- SHA-256: c0ae63023439001aa4dcff599c428287e6e0ea4913086b08196779c016a56758
-- Migration zamanı: 1790064034797
-- Kaynak şema değişirse bu dosya da yeniden hazırlanmalıdır.

DO $konsept_ilk_kurulum$
DECLARE
  beklenen_tablolar text[] := ARRAY['categories', 'subcategories', 'products', 'designs', 'quotes'];
  mevcut_nesne_sayisi integer;
  mevcut_tablo_sayisi integer;
BEGIN
  -- Ayarlar yalnızca bu işlem için geçerlidir.
  PERFORM pg_catalog.set_config('search_path', 'public', true);
  PERFORM pg_catalog.set_config('lock_timeout', '10s', true);
  -- İki SQL Editor oturumundan aynı anda çalıştırılmasını sıraya alır.
  PERFORM pg_catalog.pg_advisory_xact_lock(1802464883, 1);

  CREATE SCHEMA IF NOT EXISTS drizzle;
  CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
    id serial PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint
  );

  SELECT count(*), count(*) FILTER (WHERE c.relkind IN ('r', 'p'))
    INTO mevcut_nesne_sayisi, mevcut_tablo_sayisi
    FROM pg_catalog.pg_class AS c
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = ANY(beklenen_tablolar);

  IF EXISTS (
    SELECT 1 FROM drizzle.__drizzle_migrations
    WHERE hash = 'c0ae63023439001aa4dcff599c428287e6e0ea4913086b08196779c016a56758'
      AND created_at = 1790064034797
  ) THEN
    IF mevcut_tablo_sayisi <> 5 THEN
      RAISE EXCEPTION 'Kurulum kaydı var fakat beklenen beş tablonun tamamı bulunamadı. Otomatik onarım yapılmadı; hiçbir tabloyu silmeyin ve yardım isteyin.';
    END IF;
    RAISE NOTICE 'Bu ilk kurulum daha önce tamamlanmış. Mevcut tablolar ve veriler değiştirilmedi.';
    RETURN;
  END IF;

  IF mevcut_nesne_sayisi > 0 OR EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations) THEN
    RAISE EXCEPTION 'Kurulum durduruldu: mevcut uygulama tabloları veya farklı bir migration geçmişi bulundu. Bu dosya boş veritabanı içindir. Hiçbir tabloyu silmeyin; mevcut kurulumu kontrol ettirin.';
  END IF;

  -- BAŞLANGIÇ: orijinal migration (değiştirilmeden)
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

  -- BİTİŞ: orijinal migration

  -- Daha sonraki drizzle-kit migrate çalıştırmalarının bu kurulumu tanıması için.
  INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
  VALUES ('c0ae63023439001aa4dcff599c428287e6e0ea4913086b08196779c016a56758', 1790064034797);

  RAISE NOTICE 'İlk tablo kurulumu tamamlandı. Beş uygulama tablosu hazır.';
END;
$konsept_ilk_kurulum$;

-- Hata olmadan tamamlandığında aşağıdaki sorgu beş tablo adı göstermelidir.
SELECT table_name AS "Tablo"
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN ('categories', 'subcategories', 'products', 'designs', 'quotes')
ORDER BY table_name;
