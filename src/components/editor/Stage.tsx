"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import SceneItemView from "./SceneItemView";
import { useEditor } from "@/lib/editor/store";
import { buildWallPatternLayer } from "@/lib/editor/wall-pattern";
import type { SceneItem } from "@/lib/types";

interface Props {
  stageRef: RefObject<HTMLDivElement | null>;
  onDropProduct: (payload: { productId: number; x: number; y: number }) => void;
  onDropImage?: (file: File, x: number, y: number) => void;
  watermark?: { show: boolean; title: string; customer: string; date: string };
}

const SNAP_TOLERANCE_CM = 4;

export default function Stage({ stageRef, onDropProduct, onDropImage, watermark }: Props) {
  const room = useEditor((s) => s.room);
  const items = useEditor((s) => s.items);
  const selectedIds = useEditor((s) => s.selectedIds);
  const view = useEditor((s) => s.view);
  const camera = useEditor((s) => s.camera);

  const select = useEditor((s) => s.select);
  const toggleSelect = useEditor((s) => s.toggleSelect);
  const clearSelection = useEditor((s) => s.clearSelection);
  const updateItems = useEditor((s) => s.updateItems);
  const commit = useEditor((s) => s.commit);
  const setCamera = useEditor((s) => s.setCamera);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const roomRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 900, h: 560 });
  const [guides, setGuides] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const baseScale = Math.min(
    (size.w * 0.82) / Math.max(room.wallWidth, 1),
    (size.h * (view === "3d" ? 0.62 : 0.8)) / Math.max(room.wallHeight, 1),
  );
  const s = Math.max(baseScale * camera.zoom, 0.05);
  const Wpx = room.wallWidth * s;
  const Hpx = room.wallHeight * s;
  const Dpx = room.floorDepth * s;

  const toRoomCm = useCallback(
    (clientX: number, clientY: number) => {
      const rect = roomRef.current?.getBoundingClientRect();
      if (!rect) return { x: room.wallWidth / 2, y: room.wallHeight / 2 };
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const x = (px / Math.max(rect.width, 1)) * room.wallWidth;
      const y = room.wallHeight - (py / Math.max(rect.height, 1)) * room.wallHeight;
      return { x, y };
    },
    [room.wallWidth, room.wallHeight],
  );

  const snapPosition = useCallback(
    (movingIds: string[], nx: number, ny: number, item: SceneItem) => {
      let x = nx;
      let y = ny;
      let guideX: number | null = null;
      let guideY: number | null = null;
      const others = items.filter((i) => !movingIds.includes(i.id) && i.visible);
      const xTargets: number[] = [room.wallWidth / 2, ...others.map((o) => o.x)];
      const yTargets: number[] = [...others.map((o) => o.y)];
      const halfH = (item.height * item.scale) / 2;
      yTargets.push(halfH);

      for (const t of xTargets) {
        if (Math.abs(t - x) <= SNAP_TOLERANCE_CM) {
          x = t;
          guideX = t;
          break;
        }
      }
      for (const t of yTargets) {
        if (Math.abs(t - y) <= SNAP_TOLERANCE_CM) {
          y = t;
          guideY = t;
          break;
        }
      }
      if (room.snapEnabled) {
        if (guideX === null) x = Math.round(x / room.snapSize) * room.snapSize;
        if (guideY === null) y = Math.round(y / room.snapSize) * room.snapSize;
      }
      return { x, y, guideX, guideY };
    },
    [items, room.snapEnabled, room.snapSize, room.wallWidth],
  );

  /* ----------------------------- item dragging ---------------------------- */
  const handleItemPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>, item: SceneItem) => {
      e.stopPropagation();
      if (item.locked) return;
      const additive = e.shiftKey || e.ctrlKey || e.metaKey;
      let ids: string[];
      if (additive) {
        toggleSelect(item.id);
        ids = selectedIds.includes(item.id)
          ? selectedIds.filter((x) => x !== item.id)
          : [...selectedIds, item.id];
      } else if (selectedIds.includes(item.id)) {
        ids = selectedIds;
      } else {
        select([item.id]);
        ids = [item.id];
      }
      if (!ids.length) return;
      commit();

      const startClientX = e.clientX;
      const startClientY = e.clientY;
      const origin = new Map(
        useEditor
          .getState()
          .items.filter((i) => ids.includes(i.id))
          .map((i) => [i.id, { x: i.x, y: i.y }]),
      );
      const yawRad = (camera.yaw * Math.PI) / 180;
      const pitchRad = (camera.pitch * Math.PI) / 180;
      const fx = view === "3d" ? Math.max(Math.abs(Math.cos(yawRad)), 0.35) : 1;
      const fy = view === "3d" ? Math.max(Math.abs(Math.cos(pitchRad)), 0.35) : 1;

      const move = (ev: PointerEvent) => {
        const dx = (ev.clientX - startClientX) / s / fx;
        const dy = -(ev.clientY - startClientY) / s / fy;
        const lead = origin.get(item.id) ?? { x: item.x, y: item.y };
        const snapped = snapPosition(ids, lead.x + dx, lead.y + dy, item);
        const realDx = snapped.x - lead.x;
        const realDy = snapped.y - lead.y;
        setGuides({ x: snapped.guideX, y: snapped.guideY });
        const patchedItems = useEditor.getState().items.map((i) => {
          const o = origin.get(i.id);
          if (!o) return i;
          return { ...i, x: o.x + realDx, y: o.y + realDy };
        });
        useEditor.setState({ items: patchedItems, dirty: true });
      };
      const up = () => {
        setGuides({ x: null, y: null });
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [camera.pitch, camera.yaw, commit, s, select, selectedIds, snapPosition, toggleSelect, view],
  );

  const handleHandleDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>, mode: "scale" | "rotate") => {
      const id = selectedIds[0];
      const item = items.find((i) => i.id === id);
      if (!item) return;
      commit();
      const rect = roomRef.current?.getBoundingClientRect();
      if (!rect) return;
      const centerX = rect.left + item.x * s;
      const centerY = rect.top + (room.wallHeight - item.y) * s;
      const startDist = Math.hypot(e.clientX - centerX, e.clientY - centerY) || 1;
      const startScale = item.scale;
      const startAngle = (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) / Math.PI;
      const startRotation = item.rotation;

      const move = (ev: PointerEvent) => {
        if (mode === "scale") {
          const dist = Math.hypot(ev.clientX - centerX, ev.clientY - centerY);
          const next = Math.min(8, Math.max(0.1, (startScale * dist) / startDist));
          updateItems([id], { scale: Math.round(next * 100) / 100 }, false);
        } else {
          const angle = (Math.atan2(ev.clientY - centerY, ev.clientX - centerX) * 180) / Math.PI;
          let next = startRotation + (angle - startAngle);
          if (ev.shiftKey) next = Math.round(next / 15) * 15;
          updateItems([id], { rotation: Math.round(next) }, false);
        }
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [commit, items, room.wallHeight, s, selectedIds, updateItems],
  );

  /* --------------------------- background pointer -------------------------- */
  const handleBackgroundDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;

      const orbitMode = view === "3d" && !e.shiftKey;
      const panMode = (view === "2d" && (e.shiftKey || e.button === 1)) || (view === "3d" && e.shiftKey);

      if (panMode) {
        const startPan = { x: camera.panX, y: camera.panY };
        const move = (ev: PointerEvent) => {
          setCamera({ panX: startPan.x + (ev.clientX - startX), panY: startPan.y + (ev.clientY - startY) });
        };
        const up = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        return;
      }

      if (orbitMode) {
        clearSelection();
        const startCam = { yaw: camera.yaw, pitch: camera.pitch };
        const move = (ev: PointerEvent) => {
          setCamera({
            yaw: Math.max(-55, Math.min(55, startCam.yaw + (ev.clientX - startX) * 0.22)),
            pitch: Math.max(-25, Math.min(45, startCam.pitch - (ev.clientY - startY) * 0.18)),
          });
        };
        const up = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        return;
      }

      // 2D marquee selection
      clearSelection();
      const originX = startX - rect.left;
      const originY = startY - rect.top;
      const move = (ev: PointerEvent) => {
        const cx = ev.clientX - rect.left;
        const cy = ev.clientY - rect.top;
        setMarquee({
          x: Math.min(originX, cx),
          y: Math.min(originY, cy),
          w: Math.abs(cx - originX),
          h: Math.abs(cy - originY),
        });
      };
      const up = (ev: PointerEvent) => {
        const a = toRoomCm(startX, startY);
        const b = toRoomCm(ev.clientX, ev.clientY);
        const minX = Math.min(a.x, b.x);
        const maxX = Math.max(a.x, b.x);
        const minY = Math.min(a.y, b.y);
        const maxY = Math.max(a.y, b.y);
        if (Math.abs(maxX - minX) > 3 && Math.abs(maxY - minY) > 3) {
          const hits = useEditor
            .getState()
            .items.filter((i) => i.x >= minX && i.x <= maxX && i.y >= minY && i.y <= maxY)
            .map((i) => i.id);
          select(hits);
        }
        setMarquee(null);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [camera.panX, camera.panY, camera.pitch, camera.yaw, clearSelection, select, setCamera, toRoomCm, view],
  );

  const gridPx = 50 * s;

  // Duvar deseni: gerçek santimetreyle ölçeklenen, ızgaradan bağımsız katman.
  const wallPattern = useMemo(
    () => buildWallPatternLayer(room.wallPattern, s),
    [room.wallPattern, s],
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden select-none"
      style={{ background: room.backgroundColor, touchAction: "none" }}
      onPointerDown={handleBackgroundDown}
      onWheel={(e) => {
        const next = Math.min(3, Math.max(0.3, camera.zoom * (e.deltaY > 0 ? 0.93 : 1.07)));
        setCamera({ zoom: Math.round(next * 100) / 100 });
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(e) => {
        e.preventDefault();
        const raw = e.dataTransfer.getData("application/x-product");
        if (raw) {
          const productId = Number(raw);
          if (!Number.isFinite(productId)) return;
          const pos = toRoomCm(e.clientX, e.clientY);
          onDropProduct({ productId, x: pos.x, y: pos.y });
          return;
        }
        const files = e.dataTransfer.files;
        if (files.length && onDropImage) {
          const file = files[0];
          if (file.type.startsWith("image/")) {
            const pos = toRoomCm(e.clientX, e.clientY);
            onDropImage(file, pos.x, pos.y);
          }
        }
      }}
    >
      <div
        ref={stageRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{ filter: `brightness(${room.ambientLight})` }}
      >
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ perspective: view === "3d" ? "1600px" : undefined }}
        >
          <div
            ref={roomRef}
            style={{
              position: "relative",
              width: Wpx,
              height: Hpx,
              transformStyle: "preserve-3d",
              transform: `translate(${camera.panX}px, ${camera.panY}px) ${
                view === "3d"
                  ? `translateY(${-Dpx * 0.12}px) rotateX(${camera.pitch}deg) rotateY(${camera.yaw}deg)`
                  : ""
              }`,
              transition: "width 120ms ease, height 120ms ease",
            }}
          >
            {/* duvar */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(160deg, ${room.wallColor} 0%, ${room.wallColor2} 100%)`,
                boxShadow: "inset 0 -30px 60px rgba(0,0,0,0.06)",
                backgroundImage: room.gridVisible
                  ? `linear-gradient(to right, rgba(99,102,241,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(99,102,241,0.10) 1px, transparent 1px), linear-gradient(160deg, ${room.wallColor} 0%, ${room.wallColor2} 100%)`
                  : undefined,
                backgroundSize: room.gridVisible ? `${gridPx}px ${gridPx}px, ${gridPx}px ${gridPx}px, 100% 100%` : undefined,
              }}
            />

            {/* duvar deseni — ızgaradan ayrı katman */}
            {wallPattern && (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  zIndex: 1,
                  backgroundImage: wallPattern.backgroundImage,
                  backgroundSize: wallPattern.backgroundSize,
                  backgroundPosition: wallPattern.backgroundPosition,
                  backgroundRepeat: wallPattern.backgroundRepeat,
                  opacity: wallPattern.opacity,
                }}
              />
            )}

            {/* zemin */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: Hpx,
                width: Wpx,
                height: view === "3d" ? Dpx : Math.min(Dpx * 0.22, 70),
                transformOrigin: "0 0",
                transform: view === "3d" ? "rotateX(90deg)" : "none",
                background: `linear-gradient(to bottom, ${room.floorColor} 0%, ${shadeSimple(room.floorColor)} 100%)`,
                boxShadow: "inset 0 10px 24px rgba(0,0,0,0.12)",
                borderTop: view === "2d" ? "1px solid rgba(15,23,42,0.12)" : undefined,
                zIndex: 2,
              }}
            />

            {/* tavan */}
            {room.showCeiling && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: Wpx,
                  height: Dpx,
                  transformOrigin: "0 0",
                  transform: "rotateX(-90deg) translateY(-100%)",
                  background: room.ceilingColor,
                  opacity: 0.95,
                  zIndex: 2,
                }}
              />
            )}

            {/* hizalama kılavuzları */}
            {guides.x !== null && (
              <div
                style={{
                  position: "absolute",
                  left: guides.x * s,
                  top: 0,
                  width: 1,
                  height: Hpx,
                  background: "#ef4444",
                  zIndex: 9999,
                }}
              />
            )}
            {guides.y !== null && (
              <div
                style={{
                  position: "absolute",
                  top: (room.wallHeight - guides.y) * s,
                  left: 0,
                  height: 1,
                  width: Wpx,
                  background: "#ef4444",
                  zIndex: 9999,
                }}
              />
            )}

            {items.map((item) => (
              <SceneItemView
                key={item.id}
                item={item}
                scale={s}
                wallHeight={room.wallHeight}
                selected={selectedIds.includes(item.id)}
                view={view}
                onPointerDown={handleItemPointerDown}
                onHandleDown={handleHandleDown}
              />
            ))}
          </div>
        </div>

        {watermark?.show && (
          <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl bg-white/85 px-4 py-2 text-xs text-slate-700 shadow">
            <div className="text-sm font-semibold text-slate-900">{watermark.title || "Konsept Tasarım"}</div>
            {watermark.customer ? <div>Müşteri: {watermark.customer}</div> : null}
            {watermark.date ? <div>Tarih: {watermark.date}</div> : null}
          </div>
        )}
      </div>

      {marquee && (
        <div
          className="pointer-events-none absolute border border-indigo-500 bg-indigo-500/10"
          style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }}
        />
      )}

      <div className="pointer-events-none absolute right-3 top-3 rounded-lg bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
        {room.wallWidth} × {room.wallHeight} cm · %{Math.round(camera.zoom * 100)}
      </div>
    </div>
  );
}

function shadeSimple(hex: string) {
  const clean = hex.replace("#", "").padEnd(6, "0").slice(0, 6);
  const nums = [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16));
  return `#${nums.map((n) => Math.max(0, Math.round(n * 0.78)).toString(16).padStart(2, "0")).join("")}`;
}
