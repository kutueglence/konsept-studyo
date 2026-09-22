import type { ReactNode } from "react";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getAccessConfiguration } from "@/lib/server/access";
import DeploymentDownload, { CopyCommand } from "@/components/admin/DeploymentActions";

export const dynamic = "force-dynamic";

export default async function YayinPage() {
  const access = getAccessConfiguration();
  const production = process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";
  let cloudDatabase = false;
  try {
    const host = new URL(process.env.DATABASE_URL ?? "").hostname;
    cloudDatabase = Boolean(host) && !["localhost", "127.0.0.1", "::1", "[::1]", "postgres"].includes(host);
  } catch { /* No secret or connection string is sent to the browser. */ }

  let connected = false;
  let tablesReady = false;
  try {
    const result = await db.execute<{ ready: boolean }>(sql`
      select (
        to_regclass('public.categories') is not null and
        to_regclass('public.subcategories') is not null and
        to_regclass('public.products') is not null and
        to_regclass('public.designs') is not null and
        to_regclass('public.quotes') is not null
      ) as ready
    `);
    connected = true;
    tablesReady = result.rows[0]?.ready === true;
  } catch { /* Report state, never infrastructure credentials or raw errors. */ }

  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "";
  const productionUrl = production && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host) ? `https://${host}` : null;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-500">Yayına geçiş</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Stüdyonuzun kalıcı adresi.</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
            Önizlemeden kendi uygulamanıza geçin. Kodlarınızı alın, kalıcı veritabanınızı bağlayın ve kendi hesabınızda yayınlayın.
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${production ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
          {production ? "● Vercel üretim ortamı" : "◷ Önizleme / yerel ortam"}
        </span>
      </div>

      <div className="card overflow-hidden border-indigo-100 bg-gradient-to-br from-white to-indigo-50/70 p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div>
            <span className="mb-3 inline-flex rounded-lg border border-indigo-100 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-500">Önerilen kurulum</span>
            <h2 className="text-xl font-bold text-slate-800">Vercel <span className="px-1 text-indigo-300">+</span> Neon PostgreSQL</h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-500">
              Uygulamanız Vercel&apos;de, ürünleriniz ve kayıtlarınız Neon&apos;da. İlk yayın için özel alan adı satın almanız gerekmez.
            </p>
          </div>
          <div className="shrink-0">
            <DeploymentDownload />
            <p className="mt-2 text-[11px] text-slate-400">Kaynak kod + şema + Türkçe rehber</p>
          </div>
        </div>
        <div className="mt-5 border-t border-indigo-100 pt-4 text-xs leading-relaxed text-slate-500">
          <strong className="text-slate-700">Şifreler ve müşteri verileri pakete dahil edilmez.</strong>{" "}
          Bu indirme işlemi uygulamayı yayınlamaz veya mevcut veritabanını taşımaz.
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-800">Bu ortamın durumu</h2>
          <p className="text-[11px] text-slate-400">Sayfa açılışında sunucudan kontrol edilir</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatusCard title="Veritabanı bağlantısı" good={connected && cloudDatabase}
            value={!connected ? "Bağlantı kurulamadı" : cloudDatabase ? "Harici PostgreSQL bağlı" : "Yerel önizleme veritabanı"}
            detail="Canlı yayında Neon bağlantısı kullanın." />
          <StatusCard title="Veritabanı şeması" good={tablesReady}
            value={tablesReady ? "5 uygulama tablosu hazır" : "Tablo kurulumu gerekli"}
            detail="Yeni veritabanına migration uygulayın." />
          <StatusCard title="Stüdyo erişimi" good={access.required && access.configured}
            value={access.required && access.configured ? "Parola koruması etkin" : access.required ? "Giriş bilgileri eksik" : "Önizleme erişimi açık"}
            detail="Vercel'de yönetici parolası zorunludur." />
        </div>
        {!access.required && <p className="mt-2 text-xs text-amber-700">Açık önizleme ortamına gerçek müşteri verisi girmeyin.</p>}
      </div>

      {productionUrl && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Vercel&apos;in bildirdiği production adresiniz:{" "}
          <a className="break-all font-semibold underline underline-offset-4" href={productionUrl} target="_blank" rel="noreferrer">{productionUrl}</a>
        </div>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="card divide-y divide-slate-100">
          <Step number="01" title="Kodları kendi GitHub hesabınıza aktarın">
            <p>Yayın ZIP&apos;ini açın. GitHub&apos;da özel bir depo oluşturun ve içindeki proje dosyalarını yükleyin. <code>package.json</code> depo kökünde olmalı; ZIP dosyasının kendisini yüklemeyin.</p>
            <External href="https://github.com/new">GitHub deposu oluştur ↗</External>
          </Step>
          <Step number="02" title="Neon'da kalıcı PostgreSQL oluşturun">
            <p>Yeni proje için mümkünse Frankfurt bölgesini seçin. <strong>Connect</strong> ekranından uygulama için pooled, şema kurulumu için direct bağlantı adreslerini alın.</p>
            <External href="https://console.neon.tech">Neon Console&apos;u aç ↗</External>
          </Step>
          <Step number="03" title="Boş veritabanında tabloları oluşturun">
            <p>Bilgisayarınızda Node.js 22 kurulu olmalı. Proje klasöründe <code>.env.example</code> dosyasını <code>.env.local</code> olarak kopyalayın. <code>DATABASE_URL</code> ve <code>DATABASE_URL_UNPOOLED</code> alanlarını Neon değerleriyle doldurun.</p>
            <CopyCommand command="npm ci" />
            <CopyCommand command="npx drizzle-kit migrate --config=drizzle.deploy.config.ts" />
            <p className="mt-3 text-xs text-amber-700">Bu ilk kurulum yeni, boş veritabanı içindir. Mevcut verileri taşımak ayrıca yedekleme ve aktarım gerektirir.</p>
          </Step>
          <Step number="04" title="Vercel'e bağlayın ve yayınlayın">
            <p><strong>New Project → Import</strong> ile GitHub deponuzu seçin. Framework olarak Next.js, Node.js olarak 22.x kullanın. Aşağıdaki değişkenleri Production ortamına ekleyin, ardından <strong>Deploy</strong> düğmesine basın.</p>
            <dl className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3 text-xs">
              <Env name="DATABASE_URL" value="Neon pooled bağlantı adresi" />
              <Env name="ADMIN_USERNAME" value="Sizin belirlediğiniz kullanıcı adı" />
              <Env name="ADMIN_PASSWORD" value="En az 16 karakter; 32+ karakter önerilir" />
              <Env name="REQUIRE_ADMIN_AUTH" value="true" />
            </dl>
            <p className="mt-2 text-xs text-slate-500">Gizli değerleri sohbete veya GitHub&apos;a yazmayın. Ayarlar değişirse Redeploy yapın.</p>
            <External href="https://vercel.com/new">Vercel&apos;de proje oluştur ↗</External>
          </Step>
          <Step number="05" title="Kalıcı adresinizi alın">
            <p>Yayın <strong>Ready</strong> olduğunda Vercel projenizin <strong>Domains</strong> bölümündeki production adresini kullanın. Örnek biçim:</p>
            <div className="mt-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 px-4 py-3 font-mono text-xs text-indigo-700">https://proje-adiniz.vercel.app</div>
            <p className="mt-2 text-xs text-slate-400">Bu yalnızca bir örnektir; sizin adınıza alınmış bir adres değildir.</p>
            <p className="mt-3">Kendi alan adınız varsa <strong>Settings → Domains → Add Domain</strong> ile ekleyin. Alan adı sağlayıcınıza Vercel&apos;in gösterdiği DNS kayıtlarını girin.</p>
            <External href="https://vercel.com/docs/domains/working-with-domains/add-a-domain">Alan adı bağlantı rehberi ↗</External>
          </Step>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="text-sm font-bold text-slate-800">Hangi adresi paylaşacağım?</h2>
            <div className="mt-4 space-y-4 text-xs leading-relaxed text-slate-500">
              <div><p className="mb-1 font-semibold text-slate-700">Önizleme adresi</p><p>Geçicidir; bu geliştirme ortamına bağlıdır.</p></div>
              <div><p className="mb-1 font-semibold text-indigo-600">Vercel proje adresi</p><p>Yayın sonrasında oluşur. Proje aktif kaldıkça aynı adresi kullanabilirsiniz.</p></div>
              <div><p className="mb-1 font-semibold text-slate-700">Kendi alan adınız</p><p>İsteğe bağlıdır. Örneğin <span className="break-all">tasarim.sirketiniz.com</span>.</p></div>
            </div>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
            <h2 className="text-sm font-bold text-amber-900">Ticari kullanım notu</h2>
            <p className="mt-2 text-xs leading-relaxed text-amber-800">Vercel Hobby kişisel ve ticari olmayan projeler içindir. Kiralama işletmeniz için ticari kullanıma uygun bir plan seçin. Alan adı ve veritabanı ücretleri ayrıca değerlendirilebilir.</p>
            <External href="https://vercel.com/docs/plans/hobby">Güncel kullanım şartları ↗</External>
          </div>
          <div className="card p-5">
            <h2 className="text-sm font-bold text-slate-800">İlk yayında kontrol edin</h2>
            <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-500">
              <li>□ Gizli pencerede giriş isteniyor mu?</li>
              <li>□ Ürün eklenip tekrar açılıyor mu?</li>
              <li>□ Tasarım kaydı ve teklif çalışıyor mu?</li>
              <li>□ Yeniden yayın sonrası kayıtlar duruyor mu?</li>
              <li>□ Veritabanı yedeğiniz var mı?</li>
            </ul>
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-500">İlk sürüm tek işletmeci kullanımı içindir. Yönetici parolanızı müşterilerle paylaşmayın; teklifleri PDF olarak gönderin.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ title, value, detail, good }: { title: string; value: string; detail: string; good: boolean }) {
  return (
    <div className="card p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-2 flex items-start gap-2 text-xs font-semibold text-slate-800"><span className={good ? "text-emerald-500" : "text-amber-500"}>{good ? "✓" : "○"}</span>{value}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{detail}</p>
    </div>
  );
}

function Step({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <section className="flex gap-3 p-4 sm:gap-4 sm:p-5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 font-mono text-xs font-semibold text-indigo-500">{number}</span>
      <div className="min-w-0 flex-1"><h3 className="mb-2 text-sm font-bold text-slate-800">{title}</h3><div className="text-sm leading-relaxed text-slate-500">{children}</div></div>
    </section>
  );
}

function External({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-semibold text-indigo-600 underline-offset-4 hover:underline">{children}</a>;
}

function Env({ name, value }: { name: string; value: string }) {
  return <div className="flex flex-wrap justify-between gap-1"><dt className="font-mono font-semibold text-slate-700">{name}</dt><dd className="text-slate-500">{value}</dd></div>;
}
