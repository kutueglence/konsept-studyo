import Link from "next/link";

const FEATURES = [
  { icon: "🖱️", title: "Sürükle & Bırak", text: "Katalogdan ürünleri sahneye sürükleyin, konumlandırın, döndürün." },
  { icon: "🧊", title: "2D / 3D Görünüm", text: "Duvar, zemin ve tavanı gerçek ölçülerle 2D veya 3D olarak inceleyin." },
  { icon: "🎨", title: "Renk Paletleri", text: "Pastel, Gold, Rose Gold, Luxury ve özel HEX renklerle konsept kurun." },
  { icon: "🧮", title: "Anlık Fiyat", text: "Her ürün eklendiğinde kiralama bedeli otomatik güncellenir." },
  { icon: "🧾", title: "Profesyonel Teklif", text: "Tek tıkla malzeme listesi ve PDF'e hazır teklif ekranı oluşturun." },
  { icon: "🗂️", title: "Dinamik Katalog", text: "Ürünlerinizi yönetici panelinden ekleyin, düzenleyin, fiyatlandırın." },
];

export default function Home() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-white via-slate-50 to-indigo-50/40">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎈</span>
          <span className="text-lg font-bold tracking-tight text-slate-900">Konsept Stüdyo</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/konseptler" className="btn-ghost text-sm">
            Kayıtlı Konseptler
          </Link>
          <Link href="/yonetim" className="btn-outline text-sm">
            Yönetici Paneli
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20">
        <section className="grid items-center gap-10 py-10 md:grid-cols-2 md:py-16">
          <div>
            <span className="chip chip-active">Doğum Günü & Özel Gün Simülatörü</span>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Etkinlik konseptinizi
              <span className="bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
                {" "}
                gerçek ölçülerle
              </span>{" "}
              tasarlayın
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600">
              Duvar ve zemin ölçülerinizi girin, balon, panel, çiçek, ışık ve yazıları sahneye
              yerleştirin; kiralama bedelini anında görün, müşterinize profesyonel teklif sunun.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/tasarim" className="btn-primary px-5 py-3 text-base">
                🎨 Tasarıma Başla
              </Link>
              <Link href="/yonetim/urunler" className="btn-outline px-5 py-3 text-base">
                📦 Ürünlerimi Ekle
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Ürün kataloğu tamamen size aittir: kendi ürünlerinizi, ölçülerinizi ve fiyatlarınızı
              yönetici panelinden tanımlarsınız.
            </p>
          </div>

          <div className="relative">
            <div className="card overflow-hidden p-4">
              <div className="relative h-64 overflow-hidden rounded-xl bg-gradient-to-b from-[#f6f1ea] to-[#efe6da]">
                <div className="absolute bottom-0 h-16 w-full bg-[#d9cfc4]" />
                <div className="absolute left-1/2 top-6 h-32 w-32 -translate-x-1/2 rounded-full bg-[#fff6d6] shadow-inner" />
                {[
                  ["10%", "28%", "#F9D5E5", 46],
                  ["20%", "14%", "#EED6F5", 34],
                  ["74%", "16%", "#D6E5F9", 40],
                  ["86%", "34%", "#FBDCC4", 30],
                  ["30%", "8%", "#D4AF37", 26],
                  ["64%", "8%", "#F3C8BE", 28],
                ].map(([l, t, c, sz], i) => (
                  <span
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      left: l as string,
                      top: t as string,
                      width: sz as number,
                      height: (sz as number) * 1.12,
                      background: c as string,
                    }}
                  />
                ))}
                <span
                  className="absolute left-1/2 top-[38%] -translate-x-1/2 text-lg font-black tracking-widest text-[#b98f2f]"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  İYİ Kİ DOĞDUN
                </span>
                <span className="absolute bottom-16 left-[24%] h-10 w-16 rounded-t-lg bg-[#e3d5ca]" />
                <span className="absolute bottom-16 left-[62%] h-14 w-12 rounded-t-full bg-[#f1e6ce]" />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>400 × 250 cm duvar · 300 cm zemin</span>
                <span className="font-semibold text-indigo-600">Anlık fiyat hesaplama</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-5">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-2 text-sm font-bold text-slate-800">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{f.text}</p>
            </div>
          ))}
        </section>

        <section className="card mt-10 flex flex-col items-center gap-3 p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Hazır mısınız?</h2>
          <p className="max-w-xl text-sm text-slate-600">
            Önce yönetici panelinden ürünlerinizi tanımlayın, ardından tasarım stüdyosunda
            müşterilerinize özel konseptler hazırlayın.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/tasarim" className="btn-primary px-5 py-2.5">
              Stüdyoyu Aç
            </Link>
            <Link href="/yonetim" className="btn-soft px-5 py-2.5">
              Yönetici Paneli
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
