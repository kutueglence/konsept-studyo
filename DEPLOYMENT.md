# Konsept Stüdyo — Kalıcı yayın rehberi

Önerilen kurulum: **Vercel + Neon PostgreSQL**. Kendi alan adınız isteğe bağlıdır.

> Bu rehber hesap, sunucu veya alan adı satın almaz. Kalıcı adres, kendi Vercel hesabınızda başarılı bir production yayını yaptıktan sonra oluşur. Sohbetteki sandbox/önizleme bağlantısı kalıcı değildir.

## 1. Kaynak kodu alın

Uygulama içindeki **Kalıcı Yayın** ekranı ve kaynak kod ZIP indirme servisi kaldırılmıştır. Kurulum ve bakım bilgileri yalnızca bu dosyada tutulur; eski `/yonetim/yayin` adresi yönetim gösterge paneline yönlendirilir.

Kaynak kodu kendi GitHub deponuzdan **Code → Download ZIP** ile indirin veya depoyu bilgisayarınıza klonlayın. ZIP'i açın; `package.json`, `src`, `drizzle` ve bu rehberin bulunduğu proje klasörünü kullanın.

- ZIP, uygulama kodunu ve tablo şemasını içerir; **veritabanı yedeği değildir**.
- Mevcut ürünler, müşteriler, tasarımlar, teklifler, `.env` dosyası ve şifreler dahil değildir.
- Yüklenen ürün görselleri bu sürümde veritabanındaki kayıtlarda tutulur; bunlar kod ZIP'iyle taşınmaz.
- Yerel ayarları `.env.local` dosyasında saklayın. Gerçek bağlantı adreslerini veya şifreleri GitHub'a yüklemeyin.

Mevcut **private** GitHub deponuzu kullanabilirsiniz. Başka bir depoya aktarıyorsanız ZIP dosyasının kendisini değil, açılmış klasörün içeriğini aktarın. `package.json` depo kökünde bulunmalıdır. `.gitignore` ve `package-lock.json` dahil olsun; `.env`, `.env.local`, `node_modules` ve `.next` olmasın.

## 2. Kalıcı veritabanı oluşturun

1. [Neon Console](https://console.neon.tech)'da kendi hesabınızla bir PostgreSQL projesi oluşturun.
2. Vercel ayarı `fra1` olduğu için mümkünse Frankfurt / Avrupa bölgesini seçin. Veritabanı başka bölgedeyse Vercel bölgesini de buna göre ayarlayın.
3. **Connect** ekranında iki adresi alın:
   - Connection pooling **açık**: uygulamanın `DATABASE_URL` değeri.
   - Connection pooling **kapalı** (doğrudan): şema kurulumunun `DATABASE_URL_UNPOOLED` değeri.
4. Sağlayıcının verdiği `sslmode=require` gibi TLS parametrelerini koruyun. SSL doğrulamasını kapatmayın.
5. Gerçek müşteri verileri için yedekleme/geri yükleme politikasını ve sağlayıcının bölge/erişim ayarlarını yapılandırın.

Bu ortamdaki `127.0.0.1` veritabanı adresi Vercel'de çalışmaz. Sandbox PostgreSQL'ini dışarıya açmak yerine Neon bağlantısını kullanın.

## 3. İlk tablo kurulumunu yapın

Aşağıdaki iki yöntemden **yalnızca birini** kullanın. Tablolar siteyi açınca veya Vercel'de Deploy deyince kendiliğinden oluşmaz.

### Yöntem A — Terminal kullanmadan, Neon SQL Editor (ilk kurulum)

Windows dahil, yalnızca tarayıcıyla yapılabilir. Node.js kurmanıza, `.env.local` oluşturmanıza veya `npm ci` çalıştırmanıza gerek yoktur.

1. Bu paketteki [`NEON_ILK_KURULUM.sql`](./NEON_ILK_KURULUM.sql) dosyasını açın ve **içeriğinin tamamını** kopyalayın. Dosyaya şifre veya bağlantı adresi yazılmaz; değiştirilecek yer tutucu yoktur.
2. [Neon Console](https://console.neon.tech)'da projenizi açın ve **SQL Editor** bölümüne girin.
3. Editördeki **branch** ve **database** seçimlerinin Vercel'in **Production → DATABASE_URL** ayarındaki veritabanıyla aynı olduğundan emin olun. Başka bir Neon branch'ine kurulum yapmak canlı siteyi düzeltmez.
4. Editördeki örnek sorguyu temizleyin, dosyanın tamamını yapıştırın ve **Run** düğmesine basın.
5. Hata olmadan tamamlandığında son sorguda şu beş tablo görünmelidir: `categories`, `designs`, `products`, `quotes`, `subcategories`.
6. Aşağıdaki terminal yöntemini ayrıca çalıştırmayın. Vercel'e henüz yayınlamadıysanız **4. Vercel'e yayınlayın**, yayınınız zaten hazırsa **6. Canlı yayını doğrulayın** bölümüne geçin. Yalnızca tablo oluşturduysanız Vercel'de yeniden yayın gerekmez; siteyi yenileyin. Ortam değişkenleri değiştiyse **Redeploy** gerekir.

Bu dosya ilk şemayı ve Drizzle migration kaydını tek atomik işlemle oluşturur. Aynı ilk kurulum kayıtlıysa yeniden tablo/veri eklemez. Mevcut uygulama tabloları olup bunlarla eşleşen migration kaydı yoksa veya kurulum kısmi/farklıysa **işlemi durdurur**; mevcut veritabanına kendiliğinden geçmiş kaydı eklemez. Hata alırsanız tabloları silmeyin, `DROP` veya `--force` kullanmayın. Hata mesajını, gizli değerleri çıkardıktan sonra yardım almak için paylaşın.

Dosya ürün veya müşteri verisi taşımaz; şema onarım aracı değildir. Gelecekteki şema güncellemelerinde incelenmiş yeni migration'lar uygulanmalıdır.

### Yöntem B — Bilgisayarda terminal ile

Bilgisayarınıza **Node.js 22 LTS** kurun. Proje klasöründe terminal açın.

1. Proje klasöründe `.env.local` dosyası oluşturun; bu dosyayı GitHub'a yüklemeyin.
2. Kendi Neon bağlantılarınızı ve yönetici bilgilerinizi doldurun. Kullanıcı adı `:` içermemeli. Parola en az 16 karakter olmalı; parola yöneticisinden 32+ karakterlik rastgele bir parola önerilir.
3. Bağımlılıkları kurun:

```bash
npm ci
```

4. **Yeni, boş Neon veritabanına** dahil edilmiş şemayı uygulayın:

```bash
npx drizzle-kit migrate --config=drizzle.deploy.config.ts
```

`drizzle.deploy.config.ts`, şema işlemleri için öncelikle `DATABASE_URL_UNPOOLED` değerini kullanır; yoksa `DATABASE_URL` değerine döner. Dışarıdan tanımlanmış ortam değişkenleri önceliklidir; `.env.local`, sandbox `.env` dosyasından önce okunur.

Bu ilk migration zaten aynı tabloları içeren mevcut bir veritabanına uygulanmamalıdır. Mevcut bir veritabanını taşıyorsanız önce yedekleme ve migration geçmişini eşleme planı yapın. `--force` ile tablo silmeyin.

İlk açılışta yalnızca kategori/alt kategori yapısı oluşturulur. **Hiçbir ürün otomatik eklenmez.** Ürünlerinizi Yönetim → Ürünler bölümünden eklersiniz. İsteğe bağlı demo paketi ayrıca yüklenebilir.

## 4. Vercel'e yayınlayın

1. [Vercel New Project](https://vercel.com/new) sayfasını açın ve kendi hesabınıza giriş yapın.
2. GitHub hesabınızı bağlayın; projeyi **Import** ile seçin.
3. Framework: **Next.js**. Root Directory: `package.json` dosyasının bulunduğu klasör. Node.js: **22.x**.
4. Environment Variables bölümüne aşağıdaki değerleri **Production** ortamı için ekleyin:

| Değişken | Değer / işlev |
| --- | --- |
| `DATABASE_URL` | Neon'un pooled PostgreSQL bağlantısı |
| `ADMIN_USERNAME` | Stüdyoya girişte kullanılacak kullanıcı adı |
| `ADMIN_PASSWORD` | En az 16 karakterli, tercihen 32+ karakterli güçlü ve benzersiz parola |
| `REQUIRE_ADMIN_AUTH` | `true` |

`DATABASE_URL_UNPOOLED` yalnızca bilgisayarınızda veya güvenilir migration CI adımında gereklidir; çalışan Vercel uygulamasına eklemek zorunda değilsiniz. Hiçbir gizli değere `NEXT_PUBLIC_` öneki vermeyin.

5. **Deploy** düğmesine basın. Yapılandırma yalnızca `npm run build` çalıştırır; her yayında veritabanını otomatik değiştirmez.
6. Deployment durumu **Ready** olduktan sonra projenin **Domains** bölümündeki production adresini kullanın.

Örnek biçim: `https://proje-adiniz.vercel.app`. Bu bir örnektir; müsait adı Vercel belirler. Sonraki GitHub güncellemeleri aynı proje adresinde yayınlanabilir.

Preview dalları için ayrı bir Neon geliştirme branch'i ve ayrı giriş bilgileri kullanın. Her önizlemeyi gerçek müşteri veritabanına bağlamayın. Vercel ortam değişkeni değişikliklerinden sonra **Redeploy** gerekir.

### Mevcut canlı siteyi güncelleyin

Kod değişiklikleri Vercel projesinin izlediği **Production Branch** dalına alındığında GitHub entegrasyonu yeni bir yayın başlatır. Değişiklikler başka bir geliştirme dalındaysa önce GitHub'da pull request üzerinden inceleyip üretim dalına birleştirin.

- Vercel'de yeni yayının doğru commit'i kullandığını ve **Ready** olduğunu kontrol edin.
- Eski bir deployment'a **Redeploy** yapmak, farklı bir daldaki yeni kodu otomatik olarak almaz.
- Yalnızca menü/sayfa değişikliği için Neon kurulumunu tekrar çalıştırmayın; mevcut veritabanını ve giriş ayarlarını koruyun.

### Erişim koruması

Vercel ortamında giriş koruması otomatik zorunludur. Eksik ya da kısa bir yönetici parolası varsa uygulama verileri açmak yerine kurulum uyarısı gösterir.

- Stüdyo, yönetim ekranları, kaydedilmiş konseptler, teklifler ve iş API'leri tek işletmeci için HTTP Basic Authentication ile korunur.
- İlk ziyarette tarayıcı kullanıcı adı ve parola ister. Aynı HTTPS site içindeki API çağrılarında bu bilgiler kullanılır.
- `/api/health` yalnızca bağlantının çalışıp çalışmadığını bildirir ve platform sağlık kontrolü için açık kalır.
- Müşteriye yönetici parolasını vermeyin. Bu sürümde müşterilere PDF teklif paylaşın; teklif sayfasının kendisi de korumalıdır.
- Bu, müşteri hesabı/çoklu kullanıcı/rol yönetimi değildir. Bu özellikler ayrıca geliştirilmelidir.
- Güvenli çıkış için paylaşılan cihaz kullanmayın; özel tarayıcı oturumunu kapatın. Tarayıcı Basic bilgilerini geçici önbelleğinde tutabilir.
- Vercel Firewall üzerinden özellikle başarısız giriş denemeleri için hız sınırı ve izleme yapılandırın. Dağıtık brute-force sınırlaması uygulama içinde ayrıca sağlanmıyor.
- Vercel dışındaki canlı kurulumda da `REQUIRE_ADMIN_AUTH=true` kullanın ve **HTTPS** sağlayın.
- Parola koruması kapalı yerel önizleme ortamına gerçek müşteri verisi girmeyin.

## 5. Kendi .com / .com.tr adresinizi bağlayın (isteğe bağlı)

İlk kalıcı yayın için özel alan adı satın almak zorunda değilsiniz. İsterseniz sonradan:

1. Bir alan adı kayıt şirketinden müsait bir alan adı satın alın veya mevcut alan adınızı kullanın.
2. Vercel → Proje → **Settings → Domains → Add Domain** bölümüne girin.
3. Alan adınızı veya `tasarim.sirketiniz.com` gibi bir alt alan adı ekleyin.
4. Vercel'in **bu proje için gösterdiği** DNS kayıtlarını alan adı sağlayıcınızda tanımlayın. Kayıt değerlerini başka bir projenin ekranından kopyalamayın.
5. Doğrulama ve HTTPS sertifikası tamamlandığında yeni adresi kullanın.

Mevcut e-posta MX/TXT kayıtlarını silmeyin. Sadece gerekli A/CNAME kayıtlarını değiştirmek çoğu durumda yeterlidir. Nameserver değiştirecekseniz mevcut DNS kayıtlarını önce taşıyın. Alan adını süresi dolmadan yenileyin.

## 6. Canlı yayını doğrulayın

- Yeni adresi gizli pencerede açın: kullanıcı adı/parola sorulmalı.
- `/api/health` adresi `{"ok":true}` döndürmeli; bu yalnızca veritabanı bağlantısını doğrular, tabloların varlığını doğrulamaz.
- Neon panelinde canlı yayının bağlı olduğu veritabanında `categories`, `subcategories`, `products`, `designs` ve `quotes` tablolarını kontrol edin.
- `/yonetim` gösterge paneli açılmalı; masaüstü ve mobil menülerde kurulum/yayın rehberi bağlantısı bulunmamalı.
- Bir deneme ürünü ekleyin, tasarıma yerleştirin, kaydedip tekrar açın.
- Teklif oluşturmayı ve PDF çıktısını kontrol edin.
- Yeniden deploy sonrasında kayıtların korunduğunu doğrulayın.
- İş verilerini yedekleyin; mümkünse geri yüklemeyi test edin.

Kalıcı adres, uygulama ve veritabanı projeleri aktif tutulduğu sürece kullanılabilir. Plan limitleri, hesap kapatma, faturalandırma veya alan adı süresinin dolması erişimi etkileyebilir.

### Yaygın sorunlar

| Sorun | Çözüm |
| --- | --- |
| Build sırasında `DATABASE_URL is required` | Production ortam değişkenini Vercel'e ekleyip Redeploy yapın. |
| `relation ... does not exist` | İlk migration'ı doğru Neon veritabanına uygulayın. |
| Bağlantı reddedildi | Localhost değil bulut URL'si kullandığınızı, erişim ve TLS ayarlarını kontrol edin. |
| Kurulum uyarısı / 503 | Yönetici kullanıcı adı ve en az 16 karakterli parola tanımlayıp Redeploy yapın. |
| Sürekli giriş ekranı | Vercel ortamındaki doğru kullanıcı/parolayı kullanın; özel tarayıcı penceresi deneyin. |
| Önizlemedeki ürünler görünmüyor | Kod yayını veritabanı verilerini taşımaz. Yeni veritabanına kendi ürünlerinizi ekleyin veya ayrı veri aktarımı planlayın. |
| Büyük görselde 413 hatası | Bu sürümde görseller/veriler JSON içinde gönderiliyor. Dosyaları küçültün; yoğun kullanım için nesne depolama entegrasyonu gerekir. |

## Ücretler ve kullanım şartları

- `vercel.app` adresi için ayrıca domain satın alınmaz.
- **Vercel Hobby yalnızca kişisel, ticari olmayan kullanımlar içindir.** Kiralama işletmeniz için ticari kullanıma uygun planı (ör. Pro) değerlendirin.
- Neon ve Vercel'in ücretsiz kotaları, yedekleme özellikleri ve ücretleri değişebilir; güncel planları kendi hesaplarınızda kontrol edin.
- Özel alan adı ayrı bir yıllık ücret doğurabilir.

## Geliştirici notları

- Yerel sandbox'ın `drizzle.config.json` dosyası yalnızca yerel ortama yöneliktir. Canlı ortam komutlarında `--config=drizzle.deploy.config.ts` kullanın.
- İlerideki şema değişiklikleri için `npx drizzle-kit generate --config=drizzle.deploy.config.ts` ile migration üretin, SQL'i inceleyin, yedek alın, sonra `migrate` çalıştırın.
- Uygulama Drizzle üzerinden `pg` kullanır; Vercel'de bağlantı havuzu yaşam döngüsü `@vercel/functions` ile yönetilir. Neon pooled URL kullanın.
- Kategori ilk kurulumu transaction kilidiyle birden fazla sunucuda eşzamanlı çalışmaya karşı korunur.
- Next.js Proxy mevcut sayfa ve API girişlerini korur. Yeni bir Server Action veya farklı yol eklenirse o işlemde de kimlik/yetki kontrolü eklenmelidir.
- Kaynak kod GitHub üzerinden yönetilir; uygulama üzerinden indirme servisi sunulmaz. Gerçek üretim kodunda şifre hardcode etmeyin.
- Canlıya geçmeden önce `npm audit`, tip kontrolü ve üretim derlemesi çalıştırın; açık kalan bağımlılık uyarılarını değerlendirin.

## Resmi kaynaklar

- [Vercel'e başlama](https://vercel.com/docs/getting-started-with-vercel)
- [Neon ve Drizzle](https://neon.com/docs/guides/drizzle)
- [Vercel ortam değişkenleri](https://vercel.com/docs/environment-variables)
- [Alan adı bağlama](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
- [Vercel Hobby kullanım şartları](https://vercel.com/docs/plans/hobby)
