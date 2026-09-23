"use client";

import type { CSSProperties } from "react";
import { panelShapePathD } from "@/lib/editor/panel-image";

export const SHAPE_OPTIONS: { value: string; label: string }[] = [
  { value: "balon", label: "Balon" },
  { value: "balon-kemer", label: "Balon Kemeri" },
  { value: "balon-sutun", label: "Balon Sütunu" },
  { value: "kalp", label: "Kalp" },
  { value: "yildiz", label: "Yıldız" },
  { value: "panel-yuvarlak", label: "Yuvarlak Panel" },
  { value: "panel-kemer", label: "Kemer Panel" },
  { value: "panel-dikdortgen", label: "Dikdörtgen Panel" },
  { value: "cicek", label: "Çiçek" },
  { value: "yaprak", label: "Yeşillik" },
  { value: "neon-yazi", label: "Neon Yazı" },
  { value: "isik-zinciri", label: "Işık Zinciri" },
  { value: "ampul", label: "Sarkıt Ampul" },
  { value: "mum", label: "Mum" },
  { value: "harf", label: "Harf" },
  { value: "rakam", label: "Rakam" },
  { value: "masa", label: "Masa" },
  { value: "silindir-masa", label: "Silindir Masa" },
  { value: "pasta", label: "Pasta" },
  { value: "cupcake", label: "Pasta Standı" },
  { value: "sandalye", label: "Sandalye" },
  { value: "koltuk", label: "Puf / Koltuk" },
  { value: "hediye", label: "Hediye Kutusu" },
  { value: "ayi", label: "Peluş Ayı" },
  { value: "bulut", label: "Bulut" },
  { value: "kutu", label: "Genel Kutu" },
];

function clampHex(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function shade(hex: string, amount: number) {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean.padEnd(6, "0").slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const f = (v: number) => clampHex(amount >= 0 ? v + (255 - v) * amount : v * (1 + amount));
  return `#${[f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

interface Props {
  shape: string;
  color: string;
  className?: string;
  style?: CSSProperties;
}

export default function ProductGlyph({ shape, color, className, style }: Props) {
  const light = shade(color, 0.35);
  const dark = shade(color, -0.3);
  const deep = shade(color, -0.5);

  const balloon = (cx: number, cy: number, r: number, c: string) => (
    <g key={`${cx}-${cy}-${r}`}>
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 1.1} fill={c} />
      <ellipse cx={cx - r * 0.35} cy={cy - r * 0.4} rx={r * 0.22} ry={r * 0.3} fill="#ffffff" opacity="0.45" />
    </g>
  );

  let content: React.ReactNode;

  switch (shape) {
    case "balon":
      content = (
        <>
          {balloon(50, 44, 34, color)}
          <path d="M50 80 q6 10 0 20" stroke={dark} strokeWidth="2" fill="none" />
          <path d="M44 78 h12 l-6 6 z" fill={dark} />
        </>
      );
      break;
    case "balon-kemer":
      content = (
        <>
          {Array.from({ length: 16 }).map((_, i) => {
            const t = i / 15;
            const x = 8 + t * 84;
            const y = 92 - Math.sin(t * Math.PI) * 74;
            const palette = [color, light, dark, shade(color, 0.15)];
            return balloon(x, y, 8 + (i % 3) * 2, palette[i % palette.length]);
          })}
        </>
      );
      break;
    case "balon-sutun":
      content = (
        <>
          {Array.from({ length: 7 }).map((_, i) =>
            balloon(50 + (i % 2 ? 9 : -9), 90 - i * 13, 10, i % 2 ? light : color),
          )}
        </>
      );
      break;
    case "kalp":
      content = (
        <path
          d="M50 88 C10 60 12 24 34 18 C44 15 50 24 50 30 C50 24 56 15 66 18 C88 24 90 60 50 88 Z"
          fill={color}
          stroke={dark}
          strokeWidth="1.5"
        />
      );
      break;
    case "yildiz":
      content = (
        <polygon
          points="50,6 62,38 96,38 68,58 79,92 50,72 21,92 32,58 4,38 38,38"
          fill={color}
          stroke={dark}
          strokeWidth="1.5"
        />
      );
      break;
    case "panel-yuvarlak":
      content = (
        <>
          <circle cx="50" cy="50" r="46" fill={color} stroke={dark} strokeWidth="2" />
          <circle cx="50" cy="50" r="36" fill={light} opacity="0.55" />
        </>
      );
      break;
    case "panel-kemer":
      content = (
        <path d="M14 98 V46 a36 40 0 0 1 72 0 V98 Z" fill={color} stroke={dark} strokeWidth="2" />
      );
      break;
    case "panel-dikdortgen":
      content = <rect x="10" y="6" width="80" height="88" rx="6" fill={color} stroke={dark} strokeWidth="2" />;
      break;
    case "panel-oval":
      content = (
        <>
          <ellipse cx="50" cy="50" rx="46" ry="42" fill={color} stroke={dark} strokeWidth="2" />
          <ellipse cx="50" cy="50" rx="36" ry="32" fill={light} opacity="0.55" />
        </>
      );
      break;
    case "panel-kare":
      content = (
        <>
          <rect x="7" y="7" width="86" height="86" rx="6" fill={color} stroke={dark} strokeWidth="2" />
          <rect x="17" y="17" width="66" height="66" rx="4" fill={light} opacity="0.55" />
        </>
      );
      break;
    case "panel-dalga":
      content = (
        <>
          <path
            d={panelShapePathD("panel-dalga", 100, 100)}
            fill={color}
            stroke={dark}
            strokeWidth="2"
            transform="translate(0,0)"
          />
          <path d={panelShapePathD("panel-dalga", 64, 64)} fill={light} opacity="0.55" transform="translate(18,18)" />
        </>
      );
      break;
    case "cicek":
      content = (
        <>
          {[
            [30, 30],
            [70, 28],
            [50, 55],
            [24, 70],
            [76, 72],
          ].map(([cx, cy], idx) => (
            <g key={idx}>
              {Array.from({ length: 6 }).map((_, p) => {
                const a = (p / 6) * Math.PI * 2;
                return (
                  <ellipse
                    key={p}
                    cx={cx + Math.cos(a) * 9}
                    cy={cy + Math.sin(a) * 9}
                    rx="7"
                    ry="7"
                    fill={idx % 2 ? light : color}
                  />
                );
              })}
              <circle cx={cx} cy={cy} r="5" fill={shade("#f6c453", 0)} />
            </g>
          ))}
        </>
      );
      break;
    case "yaprak":
      content = (
        <>
          <path d="M50 96 C50 60 50 30 50 6" stroke={deep} strokeWidth="3" fill="none" />
          {Array.from({ length: 7 }).map((_, i) => (
            <g key={i}>
              <ellipse cx={30} cy={16 + i * 12} rx="18" ry="7" fill={i % 2 ? light : color} transform={`rotate(-20 30 ${16 + i * 12})`} />
              <ellipse cx={70} cy={22 + i * 12} rx="18" ry="7" fill={i % 2 ? color : light} transform={`rotate(20 70 ${22 + i * 12})`} />
            </g>
          ))}
        </>
      );
      break;
    case "neon-yazi":
      content = (
        <>
          <rect x="4" y="18" width="92" height="64" rx="12" fill="#10121a" opacity="0.08" />
          <path
            d="M14 62 q10 -30 20 0 q10 -34 20 0 q10 -30 20 0 q6 -18 12 -4"
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.35"
          />
          <path
            d="M14 62 q10 -30 20 0 q10 -34 20 0 q10 -30 20 0 q6 -18 12 -4"
            fill="none"
            stroke={light}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      );
      break;
    case "isik-zinciri":
      content = (
        <>
          {[0, 1, 2].map((row) => (
            <g key={row}>
              <path
                d={`M2 ${18 + row * 28} q25 ${16 + row * 2} 48 0 q25 -16 48 0`}
                fill="none"
                stroke={dark}
                strokeWidth="1"
              />
              {Array.from({ length: 9 }).map((_, i) => (
                <circle key={i} cx={6 + i * 11} cy={22 + row * 28 + (i % 2 ? 5 : 0)} r="3.5" fill={color} />
              ))}
            </g>
          ))}
        </>
      );
      break;
    case "ampul":
      content = (
        <>
          {[20, 50, 80].map((x, i) => (
            <g key={x}>
              <line x1={x} y1="0" x2={x} y2={30 + i * 14} stroke={dark} strokeWidth="1.5" />
              <circle cx={x} cy={40 + i * 14} r="10" fill={color} />
              <rect x={x - 4} y={28 + i * 14} width="8" height="6" fill={deep} rx="1" />
            </g>
          ))}
        </>
      );
      break;
    case "mum":
      content = (
        <>
          {[26, 50, 74].map((x, i) => (
            <g key={x}>
              <rect x={x - 8} y={40 + i * 8} width="16" height={56 - i * 8} rx="3" fill={color} />
              <ellipse cx={x} cy={32 + i * 8} rx="5" ry="9" fill="#ffb74d" />
              <ellipse cx={x} cy={34 + i * 8} rx="2.5" ry="5" fill="#fff3c4" />
            </g>
          ))}
        </>
      );
      break;
    case "harf":
      content = (
        <>
          <rect x="8" y="8" width="84" height="84" rx="10" fill={light} opacity="0.4" />
          <text x="50" y="74" textAnchor="middle" fontSize="70" fontWeight="800" fill={color} fontFamily="Georgia, serif">
            A
          </text>
        </>
      );
      break;
    case "rakam":
      content = (
        <>
          <rect x="8" y="8" width="84" height="84" rx="10" fill={light} opacity="0.4" />
          <text x="50" y="76" textAnchor="middle" fontSize="76" fontWeight="800" fill={color} fontFamily="Georgia, serif">
            1
          </text>
        </>
      );
      break;
    case "masa":
      content = (
        <>
          <rect x="4" y="30" width="92" height="14" rx="6" fill={color} />
          <rect x="12" y="44" width="8" height="52" fill={dark} />
          <rect x="80" y="44" width="8" height="52" fill={dark} />
          <rect x="20" y="52" width="60" height="6" fill={dark} opacity="0.6" />
        </>
      );
      break;
    case "silindir-masa":
      content = (
        <>
          <rect x="22" y="18" width="56" height="74" fill={color} />
          <ellipse cx="50" cy="18" rx="28" ry="9" fill={light} />
          <ellipse cx="50" cy="92" rx="28" ry="9" fill={dark} />
        </>
      );
      break;
    case "pasta":
      content = (
        <>
          <rect x="18" y="56" width="64" height="30" rx="6" fill={color} />
          <rect x="28" y="34" width="44" height="24" rx="6" fill={light} />
          <ellipse cx="50" cy="34" rx="22" ry="7" fill={shade(color, 0.6)} />
          <line x1="50" y1="14" x2="50" y2="30" stroke={dark} strokeWidth="3" />
          <ellipse cx="50" cy="12" rx="4" ry="7" fill="#ffb74d" />
          <ellipse cx="50" cy="86" rx="32" ry="8" fill={dark} />
        </>
      );
      break;
    case "cupcake":
      content = (
        <>
          <rect x="46" y="20" width="8" height="70" fill={dark} />
          <ellipse cx="50" cy="26" rx="22" ry="5" fill={color} />
          <ellipse cx="50" cy="54" rx="32" ry="6" fill={light} />
          <ellipse cx="50" cy="84" rx="40" ry="7" fill={color} />
        </>
      );
      break;
    case "sandalye":
      content = (
        <>
          <rect x="26" y="8" width="48" height="44" rx="8" fill={color} />
          <rect x="18" y="52" width="64" height="10" rx="4" fill={light} />
          <rect x="22" y="62" width="8" height="34" fill={dark} />
          <rect x="70" y="62" width="8" height="34" fill={dark} />
        </>
      );
      break;
    case "koltuk":
      content = (
        <>
          <rect x="8" y="40" width="84" height="44" rx="18" fill={color} />
          <rect x="16" y="30" width="68" height="26" rx="13" fill={light} />
          <rect x="18" y="82" width="10" height="12" rx="3" fill={dark} />
          <rect x="72" y="82" width="10" height="12" rx="3" fill={dark} />
        </>
      );
      break;
    case "hediye":
      content = (
        <>
          <rect x="12" y="34" width="76" height="60" rx="6" fill={color} />
          <rect x="6" y="22" width="88" height="16" rx="5" fill={light} />
          <rect x="44" y="22" width="12" height="72" fill={dark} />
          <path d="M50 22 C36 4 20 18 50 24 C80 18 64 4 50 22Z" fill={dark} />
        </>
      );
      break;
    case "ayi":
      content = (
        <>
          <circle cx="28" cy="24" r="12" fill={dark} />
          <circle cx="72" cy="24" r="12" fill={dark} />
          <circle cx="50" cy="38" r="26" fill={color} />
          <ellipse cx="50" cy="76" rx="30" ry="22" fill={color} />
          <circle cx="42" cy="34" r="3.5" fill="#3b2b23" />
          <circle cx="58" cy="34" r="3.5" fill="#3b2b23" />
          <ellipse cx="50" cy="44" rx="9" ry="7" fill={light} />
          <circle cx="50" cy="42" r="3" fill="#3b2b23" />
        </>
      );
      break;
    case "bulut":
      content = (
        <>
          <ellipse cx="34" cy="58" rx="24" ry="20" fill={color} />
          <ellipse cx="60" cy="52" rx="28" ry="24" fill={light} />
          <ellipse cx="50" cy="66" rx="34" ry="18" fill={color} />
        </>
      );
      break;
    default:
      content = (
        <>
          <rect x="10" y="14" width="80" height="76" rx="10" fill={color} stroke={dark} strokeWidth="2" />
          <rect x="22" y="26" width="56" height="18" rx="6" fill={light} opacity="0.7" />
        </>
      );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {content}
    </svg>
  );
}
