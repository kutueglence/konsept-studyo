"use client";

import { create } from "zustand";
import type { Product } from "@/db/schema";
import {
  DEFAULT_ROOM,
  type DesignMeta,
  type MaterialLine,
  type ProductSceneItem,
  type RoomConfig,
  type SceneItem,
  type TextSceneItem,
} from "@/lib/types";

export type ViewMode = "2d" | "3d";

export interface CameraState {
  yaw: number;
  pitch: number;
  zoom: number;
  panX: number;
  panY: number;
}

interface Snapshot {
  items: SceneItem[];
  room: RoomConfig;
}

interface EditorState {
  designId: number | null;
  meta: DesignMeta;
  room: RoomConfig;
  items: SceneItem[];
  selectedIds: string[];
  view: ViewMode;
  camera: CameraState;
  past: Snapshot[];
  future: Snapshot[];
  dirty: boolean;

  setView: (v: ViewMode) => void;
  setCamera: (patch: Partial<CameraState>) => void;
  resetCamera: () => void;
  setMeta: (patch: Partial<DesignMeta>) => void;
  setRoom: (patch: Partial<RoomConfig>, history?: boolean) => void;

  addProduct: (product: Product, pos?: { x: number; y: number; z?: number }) => string;
  addCustomImage: (imageUrl: string, filename: string, width?: number, height?: number, pos?: { x: number; y: number }) => string;
  addText: (partial?: Partial<TextSceneItem>) => string;
  addItems: (items: SceneItem[]) => void;

  select: (ids: string[]) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;

  updateItems: (ids: string[], patch: Partial<SceneItem>, history?: boolean) => void;
  commit: () => void;
  moveBy: (ids: string[], dx: number, dy: number, history?: boolean) => void;
  deleteItems: (ids: string[]) => void;
  duplicateItems: (ids: string[]) => void;
  reorder: (ids: string[], action: "front" | "back" | "forward" | "backward") => void;
  align: (ids: string[], mode: AlignMode) => void;
  distribute: (ids: string[], axis: "x" | "y") => void;

  undo: () => void;
  redo: () => void;
  clearScene: () => void;
  loadDesign: (payload: {
    id: number | null;
    meta: DesignMeta;
    room: RoomConfig;
    items: SceneItem[];
  }) => void;
  markSaved: (id: number) => void;
}

export type AlignMode =
  | "left"
  | "right"
  | "centerX"
  | "top"
  | "bottom"
  | "centerY"
  | "wallCenter"
  | "floor";

const uid = () => `it_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;

const emptyMeta: DesignMeta = {
  name: "Yeni Konsept",
  customerName: "",
  customerPhone: "",
  eventType: "Doğum Günü",
  eventDate: "",
  notes: "",
};

function snapshot(state: EditorState): Snapshot {
  return { items: state.items.map((i) => ({ ...i })), room: { ...state.room } };
}

const MAX_HISTORY = 60;

export const useEditor = create<EditorState>((set, get) => ({
  designId: null,
  meta: { ...emptyMeta },
  room: { ...DEFAULT_ROOM },
  items: [],
  selectedIds: [],
  view: "2d",
  camera: { yaw: 0, pitch: 8, zoom: 1, panX: 0, panY: 0 },
  past: [],
  future: [],
  dirty: false,

  setView: (v) => set({ view: v }),
  setCamera: (patch) => set((s) => ({ camera: { ...s.camera, ...patch } })),
  resetCamera: () => set({ camera: { yaw: 0, pitch: 8, zoom: 1, panX: 0, panY: 0 } }),
  setMeta: (patch) => set((s) => ({ meta: { ...s.meta, ...patch }, dirty: true })),

  setRoom: (patch, history = true) =>
    set((s) => ({
      past: history ? [...s.past.slice(-MAX_HISTORY), snapshot(s)] : s.past,
      future: history ? [] : s.future,
      room: { ...s.room, ...patch },
      dirty: true,
    })),

  addProduct: (product, pos) => {
    const id = uid();
    const state = get();
    const plane = (product.plane as ProductSceneItem["plane"]) ?? "wall";
    const defaultY =
      plane === "floor"
        ? product.height / 2
        : plane === "ceiling"
          ? state.room.wallHeight - product.height / 2 - 5
          : Math.min(state.room.wallHeight * 0.55, state.room.wallHeight - product.height / 2);
    const item: ProductSceneItem = {
      id,
      kind: "product",
      name: product.name,
      productId: product.id,
      shape: product.shape,
      imageUrl: product.imageUrl,
      plane,
      x: pos?.x ?? state.room.wallWidth / 2,
      y: pos?.y ?? defaultY,
      z: pos?.z ?? (plane === "floor" ? Math.min(40, state.room.floorDepth / 4) : 0),
      width: product.width,
      height: product.height,
      rotation: 0,
      scale: 1,
      color: product.color,
      opacity: 1,
      layer: state.items.length + 1,
      qty: 1,
      locked: false,
      visible: true,
      price: product.price,
      category: product.tags,
    };
    set((s) => ({
      past: [...s.past.slice(-MAX_HISTORY), snapshot(s)],
      future: [],
      items: [...s.items, item],
      selectedIds: [id],
      dirty: true,
    }));
    return id;
  },

  addCustomImage: (imageUrl: string, filename: string, width?: number, height?: number, pos?: { x: number; y: number }) => {
    const id = uid();
    const state = get();
    const w = width ?? 60;
    const h = height ?? 60;
    const item: ProductSceneItem = {
      id,
      kind: "product",
      name: filename || "Yüklenen Görsel",
      productId: 0,
      shape: "kutu",
      imageUrl,
      plane: "wall",
      x: pos?.x ?? state.room.wallWidth / 2,
      y: pos?.y ?? state.room.wallHeight * 0.55,
      z: 0,
      width: w,
      height: h,
      rotation: 0,
      scale: 1,
      color: "#ffffff",
      opacity: 1,
      layer: state.items.length + 1,
      qty: 1,
      locked: false,
      visible: true,
      price: 0,
      category: "Yüklenen Görsel",
    };
    set((s) => ({
      past: [...s.past.slice(-MAX_HISTORY), snapshot(s)],
      future: [],
      items: [...s.items, item],
      selectedIds: [id],
      dirty: true,
    }));
    return id;
  },

  addText: (partial) => {
    const id = uid();
    const state = get();
    const item: TextSceneItem = {
      id,
      kind: "text",
      name: partial?.text ?? "İYİ Kİ DOĞDUN",
      text: partial?.text ?? "İYİ Kİ DOĞDUN",
      plane: "wall",
      x: partial?.x ?? state.room.wallWidth / 2,
      y: partial?.y ?? state.room.wallHeight * 0.7,
      z: 2,
      width: partial?.width ?? 160,
      height: partial?.height ?? 40,
      rotation: 0,
      scale: 1,
      color: partial?.color ?? "#d4af37",
      opacity: 1,
      layer: state.items.length + 1,
      qty: 1,
      locked: false,
      visible: true,
      price: partial?.price ?? 0,
      fontFamily: partial?.fontFamily ?? "'Segoe UI', system-ui, sans-serif",
      fontSize: partial?.fontSize ?? 30,
      fontWeight: partial?.fontWeight ?? 700,
      letterSpacing: partial?.letterSpacing ?? 2,
      glow: partial?.glow ?? false,
    };
    set((s) => ({
      past: [...s.past.slice(-MAX_HISTORY), snapshot(s)],
      future: [],
      items: [...s.items, item],
      selectedIds: [id],
      dirty: true,
    }));
    return id;
  },

  addItems: (items) =>
    set((s) => ({
      past: [...s.past.slice(-MAX_HISTORY), snapshot(s)],
      future: [],
      items: [...s.items, ...items],
      selectedIds: items.map((i) => i.id),
      dirty: true,
    })),

  select: (ids) => set({ selectedIds: ids }),
  toggleSelect: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((x) => x !== id)
        : [...s.selectedIds, id],
    })),
  clearSelection: () => set({ selectedIds: [] }),

  commit: () => set((s) => ({ past: [...s.past.slice(-MAX_HISTORY), snapshot(s)], future: [] })),

  updateItems: (ids, patch, history = true) =>
    set((s) => ({
      past: history ? [...s.past.slice(-MAX_HISTORY), snapshot(s)] : s.past,
      future: history ? [] : s.future,
      items: s.items.map((i) => (ids.includes(i.id) ? ({ ...i, ...patch } as SceneItem) : i)),
      dirty: true,
    })),

  moveBy: (ids, dx, dy, history = false) =>
    set((s) => ({
      past: history ? [...s.past.slice(-MAX_HISTORY), snapshot(s)] : s.past,
      future: history ? [] : s.future,
      items: s.items.map((i) => (ids.includes(i.id) ? { ...i, x: i.x + dx, y: i.y + dy } : i)),
      dirty: true,
    })),

  deleteItems: (ids) =>
    set((s) => ({
      past: [...s.past.slice(-MAX_HISTORY), snapshot(s)],
      future: [],
      items: s.items.filter((i) => !ids.includes(i.id)),
      selectedIds: [],
      dirty: true,
    })),

  duplicateItems: (ids) => {
    const state = get();
    const copies = state.items
      .filter((i) => ids.includes(i.id))
      .map((i, idx) => ({
        ...i,
        id: uid(),
        x: i.x + 20,
        y: i.y - 10,
        layer: state.items.length + 1 + idx,
      })) as SceneItem[];
    if (!copies.length) return;
    set((s) => ({
      past: [...s.past.slice(-MAX_HISTORY), snapshot(s)],
      future: [],
      items: [...s.items, ...copies],
      selectedIds: copies.map((c) => c.id),
      dirty: true,
    }));
  },

  reorder: (ids, action) =>
    set((s) => {
      const layers = s.items.map((i) => i.layer);
      const max = layers.length ? Math.max(...layers) : 1;
      const min = layers.length ? Math.min(...layers) : 1;
      const items = s.items.map((i) => {
        if (!ids.includes(i.id)) return i;
        if (action === "front") return { ...i, layer: max + 1 };
        if (action === "back") return { ...i, layer: min - 1 };
        if (action === "forward") return { ...i, layer: i.layer + 1.5 };
        return { ...i, layer: i.layer - 1.5 };
      });
      const normalized = [...items]
        .sort((a, b) => a.layer - b.layer)
        .map((i, idx) => ({ ...i, layer: idx + 1 }));
      return {
        past: [...s.past.slice(-MAX_HISTORY), snapshot(s)],
        future: [],
        items: s.items.map((i) => normalized.find((n) => n.id === i.id) ?? i),
        dirty: true,
      };
    }),

  align: (ids, mode) =>
    set((s) => {
      const targets = s.items.filter((i) => ids.includes(i.id));
      if (!targets.length) return {};
      const w = (i: SceneItem) => i.width * i.scale;
      const h = (i: SceneItem) => i.height * i.scale;
      const lefts = targets.map((i) => i.x - w(i) / 2);
      const rights = targets.map((i) => i.x + w(i) / 2);
      const tops = targets.map((i) => i.y + h(i) / 2);
      const bottoms = targets.map((i) => i.y - h(i) / 2);
      const minL = Math.min(...lefts);
      const maxR = Math.max(...rights);
      const maxT = Math.max(...tops);
      const minB = Math.min(...bottoms);
      const avgX = targets.reduce((a, i) => a + i.x, 0) / targets.length;
      const avgY = targets.reduce((a, i) => a + i.y, 0) / targets.length;

      const items = s.items.map((i) => {
        if (!ids.includes(i.id)) return i;
        switch (mode) {
          case "left":
            return { ...i, x: minL + w(i) / 2 };
          case "right":
            return { ...i, x: maxR - w(i) / 2 };
          case "centerX":
            return { ...i, x: avgX };
          case "top":
            return { ...i, y: maxT - h(i) / 2 };
          case "bottom":
            return { ...i, y: minB + h(i) / 2 };
          case "centerY":
            return { ...i, y: avgY };
          case "wallCenter":
            return { ...i, x: s.room.wallWidth / 2 };
          case "floor":
            return { ...i, y: h(i) / 2 };
          default:
            return i;
        }
      });
      return {
        past: [...s.past.slice(-MAX_HISTORY), snapshot(s)],
        future: [],
        items,
        dirty: true,
      };
    }),

  distribute: (ids, axis) =>
    set((s) => {
      const targets = s.items.filter((i) => ids.includes(i.id));
      if (targets.length < 3) return {};
      const sorted = [...targets].sort((a, b) => (axis === "x" ? a.x - b.x : a.y - b.y));
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const start = axis === "x" ? first.x : first.y;
      const end = axis === "x" ? last.x : last.y;
      const step = (end - start) / (sorted.length - 1);
      const positions = new Map<string, number>();
      sorted.forEach((item, idx) => positions.set(item.id, start + step * idx));
      const items = s.items.map((i) => {
        const p = positions.get(i.id);
        if (p === undefined) return i;
        return axis === "x" ? { ...i, x: p } : { ...i, y: p };
      });
      return {
        past: [...s.past.slice(-MAX_HISTORY), snapshot(s)],
        future: [],
        items,
        dirty: true,
      };
    }),

  undo: () =>
    set((s) => {
      if (!s.past.length) return {};
      const previous = s.past[s.past.length - 1];
      return {
        past: s.past.slice(0, -1),
        future: [snapshot(s), ...s.future].slice(0, MAX_HISTORY),
        items: previous.items,
        room: previous.room,
        selectedIds: [],
        dirty: true,
      };
    }),

  redo: () =>
    set((s) => {
      if (!s.future.length) return {};
      const next = s.future[0];
      return {
        past: [...s.past.slice(-MAX_HISTORY), snapshot(s)],
        future: s.future.slice(1),
        items: next.items,
        room: next.room,
        selectedIds: [],
        dirty: true,
      };
    }),

  clearScene: () =>
    set((s) => ({
      past: [...s.past.slice(-MAX_HISTORY), snapshot(s)],
      future: [],
      items: [],
      selectedIds: [],
      dirty: true,
    })),

  loadDesign: ({ id, meta, room, items }) =>
    set({
      designId: id,
      meta,
      room: { ...DEFAULT_ROOM, ...room },
      items,
      selectedIds: [],
      past: [],
      future: [],
      dirty: false,
    }),

  markSaved: (id) => set({ designId: id, dirty: false }),
}));

/** Malzeme listesi: aynı ürün tek satırda toplanır. */
export function buildMaterialLines(items: SceneItem[]): MaterialLine[] {
  const map = new Map<string, MaterialLine>();
  for (const item of items) {
    const key = item.kind === "product" ? `p-${item.productId}` : `t-${item.name}`;
    const existing = map.get(key);
    const qty = item.qty || 1;
    if (existing) {
      existing.qty += qty;
      existing.total = existing.qty * existing.unitPrice;
    } else {
      map.set(key, {
        key,
        name: item.kind === "product" ? item.name : `Yazı: ${item.name}`,
        qty,
        unitPrice: item.price ?? 0,
        total: (item.price ?? 0) * qty,
        category: item.kind === "product" ? item.category : "Kişisel Yazı",
      });
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export function totalOf(items: SceneItem[]) {
  return items.reduce((sum, i) => sum + (i.price ?? 0) * (i.qty || 1), 0);
}

export function totalCount(items: SceneItem[]) {
  return items.reduce((sum, i) => sum + (i.qty || 1), 0);
}
