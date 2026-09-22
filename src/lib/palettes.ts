export interface Palette {
  key: string;
  name: string;
  colors: string[];
}

export const PALETTES: Palette[] = [
  {
    key: "pastel",
    name: "Pastel",
    colors: ["#F9D5E5", "#EED6F5", "#D6E5F9", "#D9F2E6", "#FFF2CC", "#FBDCC4"],
  },
  {
    key: "soft",
    name: "Soft",
    colors: ["#F5EDE4", "#E8DCD2", "#DCC9BD", "#CBB3A5", "#F2E8E4", "#E3D5CA"],
  },
  {
    key: "gold",
    name: "Gold",
    colors: ["#D4AF37", "#E8C86B", "#F4E2A1", "#B8912B", "#FFF6D6", "#8C6A14"],
  },
  {
    key: "rose-gold",
    name: "Rose Gold",
    colors: ["#E8B4A8", "#F3C8BE", "#D99B8D", "#C08579", "#FBE3DC", "#A96D62"],
  },
  {
    key: "silver",
    name: "Silver",
    colors: ["#C0C6CC", "#DDE2E6", "#9AA3AB", "#EFF2F4", "#7E878F", "#B4BCC4"],
  },
  {
    key: "bw",
    name: "Black & White",
    colors: ["#111111", "#333333", "#777777", "#BBBBBB", "#EEEEEE", "#FFFFFF"],
  },
  {
    key: "baby",
    name: "Baby",
    colors: ["#BFE3F7", "#FBD3E0", "#FFF6C7", "#D8F0DC", "#E7DCF7", "#FFE6D2"],
  },
  {
    key: "luxury",
    name: "Luxury",
    colors: ["#14181F", "#2B3242", "#6D5B3F", "#C6A664", "#F1E6CE", "#7B2C3B"],
  },
  {
    key: "renkli",
    name: "Renkli",
    colors: ["#FF5C6C", "#FFB627", "#37C978", "#2D9CDB", "#9B51E0", "#FF7AC8"],
  },
];

export const FONT_OPTIONS = [
  { label: "Modern (Sans)", value: "'Segoe UI', system-ui, sans-serif" },
  { label: "Klasik (Serif)", value: "Georgia, 'Times New Roman', serif" },
  { label: "El Yazısı", value: "'Brush Script MT', 'Segoe Script', cursive" },
  { label: "Daktilo", value: "'Courier New', monospace" },
  { label: "Geniş Başlık", value: "Impact, 'Arial Black', sans-serif" },
];
