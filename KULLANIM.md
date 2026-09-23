# Kullanım Kılavuzu — Duvar Desenleri & Arka Fon Panelleri

Bu kılavuz, Konsept Stüdyo'ya eklenen iki özelliğin kullanımını anlatır:
**duvar tipleri/desenleri** ve **yönetim panelinden özel arka fon paneli ekleme**.

---

## 1) Alan Sekmesi — Duvar Tipleri ve Desenler

Tasarım stüdyosunda (**/tasarim**) sol paneldeki **Alan** sekmesinin en üstünde
**Duvar Tipi & Desen** bölümü bulunur.

### Hazır yüzeyler

| Desen | Açıklama | Önerilen aralık / kalınlık |
|---|---|---|
| ▯ Düz Duvar | Desensiz, boyalı duvar (varsayılan) | — |
| ▦ Kare Paneller | Kare duvar panelleri, çerçeveli ızgara | 40 cm / 1,5 cm |
| 🧱 Tuğla Duvar | Şaşırtmalı (kayarak) derzli tuğla | 30 cm / 1,5 cm |
| ▮▯ Dikey Şerit | Dikey çizgili duvar | 14 cm / 5 cm |
| ▬ Yatay Şerit | Yatay çizgili duvar | 14 cm / 5 cm |
| 🪵 Ahşap Çıta | Ahşap lath kaplama görünümü | 9 cm / 6 cm |
| ⧅ Zikzak | Zigzag desen | 30 cm / 1,5 cm |
| ⠿ Puantiye | Düzenli (kanelür) nokta dizilimi | 20 cm / 5 cm |

### Ayarlar (desen seçince açılır)

- **Desen aralığı (cm):** desenin tekrar aralığı. Tuğla için tuğla uzunluğu,
  şeritler için periyot, puantiye için nokta aralığıdır.
- **Çizgi/nokta kalınlığı (cm):** derz/çizgi kalınlığı veya nokta çapı.
- **Desen/derz rengi:** tuğla derzi ya da desen çizgilerinin rengi.
- **Belirginlik (%):** desenin saydamlığı.

### Bilinmesi gerekenler

- Desen **gerçek santimetreyle** ölçeklenir: 400 cm duvarda 30 cm'lik tuğla
  her zaman duvarın 1/13 genişliğindedir. Yakınlaştırıp uzaklaştırdığınızda
  desen duvarla birlikte ölçeklenir; ek olarak büyütülüp gerilmez.
- Desen, mavi hizalama ızgarasından **ayrı bir katmandır**; ızgarayı açıp
  kapatmak deseni, deseni değiştirmek ızgarayı bozmaz.
- Desen seçimi **kaydedilen konseptin oda ayarlarının içinde** saklanır;
  2B, 3B ve indirilen görselde aynı görünür.
- Eski kayıtlı konseptleriniz desensiz (düz duvar) açılır; hiçbir kayıt
  bozulmaz.
- Çok uzaklaştırıldığında desen piksel altına düşerse görünürlük için gizlenir.

---

## 2) Konsept / Arka Fon Panelleri — Özel Ürün Ekleme

### Panel oluşturma (Yönetim → Ürünler)

1. **Yönetim → Ürünler**'de kategori olarak **Konsept / Arka Fon Panelleri**
   seçildiğinde form otomatik olarak panel alanına dönüşür.
2. **Panel biçimi:** Dikdörtgen, Kemer, Yuvarlak, Oval, Kare veya Dalgalı.
   *Yuvarlak ve Kare seçildiğinde yükseklik genişliğe kilitlenir.*
3. **Genişlik/yükseklik/derinlik (cm)**, fiyat, stok, malzeme ve etiketleri girin.
4. **Görseli seç veya sürükle:** PNG, JPG veya WebP; en fazla 20 MB.
   *(SVG ve GIF kabul edilmez — önce PNG/JPG'ye çevirin.)*
5. **Görsel yerleşimi:**
   - **Tamamını göster:** kırpma yok; görselin tamamı panelde görünür,
     boşluklar **Panel Fon Rengi** ile doldurulur.
   - **Alanı doldur:** görsel paneli tamamen kaplar; **yatay/dikey odak
     kaydırıcıları** ile hangi tarafın kalacağını siz seçersiniz
     (sol/orta/sağ, üst/orta/alt).
6. Sağdaki **canlı önizleme** panel biçimine göre kırpılmış hâli gösterir;
   ölçü, biçim, renk, mod veya odak değişince otomatik yeniden üretilir.
7. İsterseniz **“Görselin oranını ölçülere uygula”** ile panel ölçülerini
   fotoğrafın oranına uydurabilirsiniz (kilitli biçimlerde kapalıdır).
8. **Paneli Ekle** dediğinizde ürün, verdiğiniz isimle o kategoride listelenir.

### Netlik için optimizasyon

- Görsel, panelin **en/boy oranında** üretilir — uzatma/yayma yoktur.
- Kaynak görsel hedef çözünürlüğün altındaysa **büyütülmez** ve panelde
  uyarı gösterilir.
- Sahnenin hafif kalması için görsel **WebP'ye** sıkıştırılır.
- Büyük görseller ürün listesine gömülmez; `/api/products/{id}/image`
  üzerinden **sürüm imzasıyla** sunulur (liste yanıtı hafif kalır, görsel
  değişene kadar tarayıcı önbelleğinden gelir).

### Stüdyoda kullanım

- Panel ürünleri katalogda **“Arka fon · otomatik yerleşir”** etiketiyle
  görünür.
- Panele tıklayınca ya da sürükleyip bıraktığınızda otomatik yerleşim
  yapılır:
  - duvardan büyükse **duvara sığacak şekilde küçülür** (küçük panel
    büyütülmez),
  - **yatayda ortalanır** (bırakış noktası varsa oraya uyar; duvardan
    taşacaksa kenarda tutulur),
  - **zemine oturur**, **duvara yaslanır**,
  - **tüm süslemelerin arkasına** gönderilir.
- Kaydedilen konsept, panel görselinin **anlık kopyasını** alır; ürünü daha
  sonra değiştirseniz ya da silseniz bile eski konsept bozulmaz.

---

## 3) Dürüst Sınırlar

- Hazırlanan panel görseli **ekran/önizleme çıktısıdır; baskı dosyası
  değildir.** Baskı için üreticinize kaynak dosyayı ayrıca verin.
- Bulanık/küçük bir görselden detay üretilmez; görsel büyütülmez.
- SVG ve GIF yüklenemez — önce PNG/JPG'ye çevirin.
- Panel sahnede **2B bir yüzeydir**; gerçek 3B kabartı derinliği yoktur.
- Duvar desenleri görsel (dekoratif) katmandır; malzeme maliyetine etkisi
  yoktur.

---

## Teknik Notlar (geliştirici)

- Desen üretimi: `src/lib/editor/wall-pattern.ts` (saf, test edilebilir;
  SVG karo → CSS arka plan katmanı).
- Panel kırpma/odak matematiği: `src/lib/editor/panel-image.ts`;
  canvas+WebP hattı: `src/lib/editor/panel-render.ts`.
- Otomatik yerleşim: `src/lib/editor/backdrop.ts` + `store.ts` → `addProduct`.
- API doğrulama ve hafif liste: `src/lib/server/product-sanitize.ts`.
- Testler: `npm test` (desen üretimi, kırpma/odak matematiği, yerleşim,
  doğrulamalar, görsel kopyası).
