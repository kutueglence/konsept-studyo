"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import ProductGlyph from "@/components/ProductGlyph";
import type { SceneItem } from "@/lib/types";

interface Props {
  item: SceneItem;
  scale: number; // px per cm
  wallHeight: number;
  selected: boolean;
  view: "2d" | "3d";
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>, item: SceneItem) => void;
  onHandleDown?: (e: ReactPointerEvent<HTMLDivElement>, mode: "scale" | "rotate") => void;
}

export default function SceneItemView({
  item,
  scale,
  wallHeight,
  selected,
  view,
  onPointerDown,
  onHandleDown,
}: Props) {
  if (!item.visible) return null;
  const w = item.width * item.scale * scale;
  const h = item.height * item.scale * scale;
  const left = item.x * scale;
  const top = (wallHeight - item.y) * scale;
  const depthPx = item.z * scale;

  return (
    <div
      data-scene-item={item.id}
      onPointerDown={(e) => onPointerDown(e, item)}
      style={{
        position: "absolute",
        left,
        top,
        width: w,
        height: h,
        marginLeft: -w / 2,
        marginTop: -h / 2,
        transform: `translateZ(${depthPx}px) rotate(${item.rotation}deg)`,
        transformStyle: "preserve-3d",
        zIndex: Math.round(item.layer) + 10,
        opacity: item.opacity,
        cursor: item.locked ? "not-allowed" : "grab",
        touchAction: "none",
        filter: selected ? "drop-shadow(0 6px 12px rgba(15,23,42,0.25))" : "drop-shadow(0 3px 6px rgba(15,23,42,0.14))",
      }}
    >
      {item.kind === "product" ? (
        item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            draggable={false}
            style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }}
          />
        ) : (
          <ProductGlyph
            shape={item.shape}
            color={item.color}
            style={{ width: "100%", height: "100%", pointerEvents: "none" }}
          />
        )
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: item.color,
            fontFamily: item.fontFamily,
            fontSize: item.fontSize * item.scale * scale,
            fontWeight: item.fontWeight,
            letterSpacing: item.letterSpacing * item.scale * scale * 0.1,
            lineHeight: 1.05,
            whiteSpace: "nowrap",
            textShadow: item.glow
              ? `0 0 ${6 * scale}px ${item.color}, 0 0 ${14 * scale}px ${item.color}`
              : "none",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {item.text}
        </div>
      )}

      {selected && (
        <>
          <div
            style={{
              position: "absolute",
              inset: -4,
              border: "1.5px dashed #6366f1",
              borderRadius: 6,
              pointerEvents: "none",
            }}
          />
          {view === "2d" && onHandleDown && (
            <>
              <div
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onHandleDown(e, "scale");
                }}
                title="Boyutlandır"
                style={{
                  position: "absolute",
                  right: -8,
                  bottom: -8,
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  background: "#fff",
                  border: "2px solid #6366f1",
                  cursor: "nwse-resize",
                  touchAction: "none",
                }}
              />
              <div
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onHandleDown(e, "rotate");
                }}
                title="Döndür"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: -26,
                  marginLeft: -7,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#fff",
                  border: "2px solid #10b981",
                  cursor: "grab",
                  touchAction: "none",
                }}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
