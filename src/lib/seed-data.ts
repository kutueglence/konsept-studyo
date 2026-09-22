import type { ShapeKey } from "./types";

export interface SeedCategory {
  name: string;
  icon: string;
  subs: string[];
}

/** Kategori ağacı — ürünler yönetici tarafından eklenir, burada sadece yapı tanımlıdır. */
export const SEED_CATEGORIES: SeedCategory[] = [
  {
    name: "Balonlar",
    icon: "🎈",
    subs: ["Standart Balonlar", "Özel Şekilli Balonlar", "Balon Kombinasyonları"],
  },
  {
    name: "Konsept / Arka Fon Panelleri",
    icon: "🧱",
    subs: ["Panel Çeşitleri", "Panel Materyalleri", "Panel Renkleri"],
  },
  {
    name: "Çiçek & Yeşillik",
    icon: "🌸",
    subs: ["Yapay Çiçekler", "Çiçek Düzenlemeleri", "Yeşillik & Yaprak"],
  },
  {
    name: "Işıklandırma",
    icon: "✨",
    subs: ["Neon & LED", "Dekoratif Işık", "Mum & Fener"],
  },
  {
    name: "Yazı & Tabelalar",
    icon: "🪧",
    subs: ["Hazır Yazılar", "Kişiselleştirilebilir"],
  },
  {
    name: "Rakamlar & Harfler",
    icon: "🔢",
    subs: ["Rakamlar", "Harfler", "Malzeme Tipleri"],
  },
  {
    name: "Masa & Pasta Alanı",
    icon: "🎂",
    subs: ["Masalar", "Standlar", "Servis & Sunum"],
  },
  {
    name: "Pasta & Yiyecek Dekorları",
    icon: "🍰",
    subs: ["Pastalar", "Tatlılar", "İkramlıklar"],
  },
  {
    name: "Temalı Dekorlar",
    icon: "🧸",
    subs: ["Çocuk Temaları", "Yetişkin Konseptleri"],
  },
  {
    name: "Kutlama Aksesuarları",
    icon: "🎁",
    subs: ["Parti Aksesuarları", "Süsleme Aksesuarları"],
  },
  {
    name: "Fotoğraf Alanı (Photobooth)",
    icon: "📸",
    subs: ["Duvar & Fon", "Oturma & Objeler", "Selfie Aksesuarları"],
  },
  {
    name: "Mobilya & Dekoratif Objeler",
    icon: "🪑",
    subs: ["Oturma Grubu", "Masa & Sehpa", "Dekoratif Objeler"],
  },
  {
    name: "Boyama / El İşi",
    icon: "🎨",
    subs: ["Boyama Alanları", "Boya & Malzeme"],
  },
  {
    name: "Masa Süsleme",
    icon: "🎀",
    subs: ["Tekstil", "Sofra", "Aranjman"],
  },
  {
    name: "Asma / Tavan Dekorları",
    icon: "🧵",
    subs: ["Sarkıtlar", "Kumaş & Tül", "Tavan Işıkları"],
  },
  {
    name: "Özel Efektler",
    icon: "🪄",
    subs: ["Duman & Sis", "Konfeti & Parıltı", "Işık Efektleri"],
  },
  {
    name: "Özel Günler",
    icon: "💍",
    subs: ["Baby Shower", "Nişan", "Kına", "Düğün", "Diğer Özel Günler"],
  },
];

export interface DemoProduct {
  name: string;
  category: string;
  sub: string;
  shape: ShapeKey;
  width: number;
  height: number;
  depth: number;
  color: string;
  material?: string;
  price: number;
  stock: number;
  plane: "wall" | "floor" | "ceiling";
  description?: string;
}

/**
 * Opsiyonel demo paketi. Sistem ürünleri sabit tanımlamaz; bu liste yalnızca
 * yönetici panelinden "Demo ürün paketi yükle" butonuna basıldığında eklenir
 * ve tek tıkla tamamen silinebilir.
 */
export const DEMO_PRODUCTS: DemoProduct[] = [
  { name: '12" Standart Balon', category: "Balonlar", sub: "Standart Balonlar", shape: "balon", width: 30, height: 34, depth: 30, color: "#F9D5E5", material: "Lateks", price: 15, stock: 500, plane: "wall" },
  { name: '18" Krom Balon', category: "Balonlar", sub: "Standart Balonlar", shape: "balon", width: 45, height: 50, depth: 45, color: "#D4AF37", material: "Krom Lateks", price: 35, stock: 200, plane: "wall" },
  { name: '36" Dev Balon', category: "Balonlar", sub: "Standart Balonlar", shape: "balon", width: 90, height: 100, depth: 90, color: "#EED6F5", material: "Lateks", price: 120, stock: 40, plane: "floor" },
  { name: "Kalp Folyo Balon", category: "Balonlar", sub: "Özel Şekilli Balonlar", shape: "kalp", width: 45, height: 42, depth: 12, color: "#FF5C6C", material: "Folyo", price: 45, stock: 120, plane: "wall" },
  { name: "Yıldız Folyo Balon", category: "Balonlar", sub: "Özel Şekilli Balonlar", shape: "yildiz", width: 45, height: 45, depth: 12, color: "#E8C86B", material: "Folyo", price: 45, stock: 120, plane: "wall" },
  { name: "Organik Balon Kemeri", category: "Balonlar", sub: "Balon Kombinasyonları", shape: "balon-kemer", width: 260, height: 180, depth: 40, color: "#F3C8BE", material: "Lateks Karışım", price: 1450, stock: 12, plane: "wall", description: "Panel çevresine uygulanan organik balon kemeri." },
  { name: "Balon Sütunu", category: "Balonlar", sub: "Balon Kombinasyonları", shape: "balon-sutun", width: 60, height: 200, depth: 60, color: "#BFE3F7", material: "Lateks", price: 750, stock: 20, plane: "floor" },
  { name: "Yuvarlak Panel 180 cm", category: "Konsept / Arka Fon Panelleri", sub: "Panel Çeşitleri", shape: "panel-yuvarlak", width: 180, height: 180, depth: 6, color: "#FFF6D6", material: "MDF", price: 900, stock: 8, plane: "wall" },
  { name: "Kemer Panel 200 cm", category: "Konsept / Arka Fon Panelleri", sub: "Panel Çeşitleri", shape: "panel-kemer", width: 130, height: 200, depth: 6, color: "#F5EDE4", material: "MDF", price: 850, stock: 10, plane: "wall" },
  { name: "Dikdörtgen Panel", category: "Konsept / Arka Fon Panelleri", sub: "Panel Çeşitleri", shape: "panel-dikdortgen", width: 120, height: 200, depth: 6, color: "#E8DCD2", material: "Ahşap", price: 700, stock: 10, plane: "wall" },
  { name: "Çiçek Duvarı Paneli", category: "Çiçek & Yeşillik", sub: "Çiçek Düzenlemeleri", shape: "cicek", width: 200, height: 200, depth: 15, color: "#FBD3E0", material: "Yapay Çiçek", price: 1600, stock: 5, plane: "wall" },
  { name: "Yapay Gül Aranjmanı", category: "Çiçek & Yeşillik", sub: "Yapay Çiçekler", shape: "cicek", width: 60, height: 55, depth: 40, color: "#E8B4A8", material: "Yapay Çiçek", price: 250, stock: 30, plane: "floor" },
  { name: "Okaliptüs Yaprak Demeti", category: "Çiçek & Yeşillik", sub: "Yeşillik & Yaprak", shape: "yaprak", width: 70, height: 45, depth: 25, color: "#8FAE86", material: "Yapay Yeşillik", price: 180, stock: 40, plane: "wall" },
  { name: "Neon Tabela 'Happy Birthday'", category: "Işıklandırma", sub: "Neon & LED", shape: "neon-yazi", width: 120, height: 45, depth: 4, color: "#FF7AC8", material: "Neon Pleksi", price: 600, stock: 6, plane: "wall" },
  { name: "Peri Işığı Perde", category: "Işıklandırma", sub: "Dekoratif Işık", shape: "isik-zinciri", width: 200, height: 180, depth: 3, color: "#FFE9A8", material: "LED", price: 350, stock: 15, plane: "wall" },
  { name: "Sarkıt Ampul Seti", category: "Işıklandırma", sub: "Dekoratif Işık", shape: "ampul", width: 40, height: 120, depth: 20, color: "#FFD98C", material: "Cam / LED", price: 280, stock: 18, plane: "ceiling" },
  { name: "Dekoratif LED Mum (3'lü)", category: "Işıklandırma", sub: "Mum & Fener", shape: "mum", width: 25, height: 30, depth: 12, color: "#FFF2CC", material: "LED Mum", price: 90, stock: 60, plane: "floor" },
  { name: "Pleksi Harf (Tek)", category: "Rakamlar & Harfler", sub: "Harfler", shape: "harf", width: 35, height: 45, depth: 4, color: "#D4AF37", material: "Pleksi", price: 70, stock: 100, plane: "wall" },
  { name: "Strafor Rakam 100 cm", category: "Rakamlar & Harfler", sub: "Rakamlar", shape: "rakam", width: 60, height: 100, depth: 15, color: "#FFFFFF", material: "Strafor", price: 220, stock: 24, plane: "floor" },
  { name: "Silindir Pasta Masası", category: "Masa & Pasta Alanı", sub: "Masalar", shape: "silindir-masa", width: 70, height: 90, depth: 70, color: "#F1E6CE", material: "MDF", price: 400, stock: 12, plane: "floor" },
  { name: "Yuvarlak Sunum Masası", category: "Masa & Pasta Alanı", sub: "Masalar", shape: "masa", width: 140, height: 75, depth: 90, color: "#E3D5CA", material: "Ahşap", price: 450, stock: 10, plane: "floor" },
  { name: "3 Katlı Pasta Standı", category: "Masa & Pasta Alanı", sub: "Standlar", shape: "cupcake", width: 45, height: 60, depth: 45, color: "#FBE3DC", material: "Metal", price: 200, stock: 14, plane: "floor" },
  { name: "2 Katlı Konsept Pasta (Maket)", category: "Pasta & Yiyecek Dekorları", sub: "Pastalar", shape: "pasta", width: 45, height: 50, depth: 45, color: "#FFF2CC", material: "Maket", price: 300, stock: 10, plane: "floor" },
  { name: "Teddy Bear Dekor", category: "Temalı Dekorlar", sub: "Çocuk Temaları", shape: "ayi", width: 50, height: 60, depth: 40, color: "#CBB3A5", material: "Peluş", price: 260, stock: 8, plane: "floor" },
  { name: "Bulut & Yıldız Sarkıt Set", category: "Asma / Tavan Dekorları", sub: "Sarkıtlar", shape: "bulut", width: 70, height: 45, depth: 20, color: "#D6E5F9", material: "Strafor", price: 190, stock: 20, plane: "ceiling" },
  { name: "Dekoratif Puf", category: "Mobilya & Dekoratif Objeler", sub: "Oturma Grubu", shape: "koltuk", width: 60, height: 45, depth: 60, color: "#EED6F5", material: "Kumaş", price: 180, stock: 16, plane: "floor" },
  { name: "Çocuk Sandalyesi", category: "Mobilya & Dekoratif Objeler", sub: "Oturma Grubu", shape: "sandalye", width: 40, height: 65, depth: 40, color: "#FBDCC4", material: "Ahşap", price: 120, stock: 30, plane: "floor" },
  { name: "Hediye Kutusu Dekoru", category: "Kutlama Aksesuarları", sub: "Süsleme Aksesuarları", shape: "hediye", width: 45, height: 45, depth: 45, color: "#9B51E0", material: "Karton", price: 110, stock: 25, plane: "floor" },
];
