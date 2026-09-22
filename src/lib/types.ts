export type Plane = "wall" | "floor" | "ceiling";

export type ShapeKey =
  | "balon"
  | "balon-kemer"
  | "balon-sutun"
  | "kalp"
  | "yildiz"
  | "panel-yuvarlak"
  | "panel-kemer"
  | "panel-dikdortgen"
  | "cicek"
  | "yaprak"
  | "neon-yazi"
  | "isik-zinciri"
  | "ampul"
  | "mum"
  | "harf"
  | "rakam"
  | "masa"
  | "silindir-masa"
  | "pasta"
  | "cupcake"
  | "sandalye"
  | "koltuk"
  | "hediye"
  | "ayi"
  | "bulut"
  | "kutu";

export interface RoomConfig {
  wallWidth: number; // cm
  wallHeight: number; // cm
  floorDepth: number; // cm
  wallColor: string;
  wallColor2: string;
  floorColor: string;
  ceilingColor: string;
  showCeiling: boolean;
  backgroundColor: string;
  ambientLight: number; // 0.4 - 1.4
  gridVisible: boolean;
  snapEnabled: boolean;
  snapSize: number; // cm
}

export interface SceneItemBase {
  id: string;
  kind: "product" | "text";
  name: string;
  plane: Plane;
  /** cm — duvar düzleminde soldan merkeze */
  x: number;
  /** cm — zeminden yukarı (merkez) */
  y: number;
  /** cm — duvardan öne doğru derinlik */
  z: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  color: string;
  opacity: number;
  layer: number;
  qty: number;
  locked: boolean;
  visible: boolean;
}

export interface ProductSceneItem extends SceneItemBase {
  kind: "product";
  productId: number;
  shape: ShapeKey | string;
  imageUrl?: string | null;
  price: number;
  category?: string | null;
}

export interface TextSceneItem extends SceneItemBase {
  kind: "text";
  text: string;
  fontFamily: string;
  fontSize: number; // cm
  fontWeight: number;
  letterSpacing: number;
  price: number;
  strokeColor?: string;
  glow: boolean;
}

export type SceneItem = ProductSceneItem | TextSceneItem;

export interface DesignMeta {
  id?: number;
  name: string;
  customerName: string;
  customerPhone: string;
  eventType: string;
  eventDate: string;
  notes: string;
}

export interface MaterialLine {
  key: string;
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
  category?: string | null;
}

export const DEFAULT_ROOM: RoomConfig = {
  wallWidth: 400,
  wallHeight: 250,
  floorDepth: 300,
  wallColor: "#f6f1ea",
  wallColor2: "#efe6da",
  floorColor: "#d9cfc4",
  ceilingColor: "#faf7f2",
  showCeiling: false,
  backgroundColor: "#eef1f6",
  ambientLight: 1,
  gridVisible: true,
  snapEnabled: true,
  snapSize: 5,
};

export const EVENT_TYPES = [
  "Doğum Günü",
  "1 Yaş Doğum Günü",
  "Baby Shower",
  "Cinsiyet Partisi",
  "Nişan",
  "Kına Gecesi",
  "Düğün",
  "Diş Buğdayı",
  "Mezuniyet",
  "Açılış",
  "Kurumsal Etkinlik",
  "Sevgililer Günü",
  "Yılbaşı",
  "Diğer",
];
