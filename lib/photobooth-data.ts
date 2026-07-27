import {
  FilterId,
  FontId,
  FrameSettings,
  PhotoTemplate,
  StickerKind,
  StylePresetId,
  TemplateId
} from "@/types/photobooth";

export const PHOTO_TEMPLATES: PhotoTemplate[] = [
  {
    id: "strip4",
    name: "Classic 4 Strip",
    aspectRatio: 0.42,
    slots: [
      { id: "slot-1", x: 0.12, y: 0.14, width: 0.76, height: 0.17, radius: 28 },
      { id: "slot-2", x: 0.12, y: 0.34, width: 0.76, height: 0.17, radius: 28 },
      { id: "slot-3", x: 0.12, y: 0.54, width: 0.76, height: 0.17, radius: 28 },
      { id: "slot-4", x: 0.12, y: 0.74, width: 0.76, height: 0.17, radius: 28 }
    ]
  },
  {
    id: "strip3",
    name: "3 Photo Strip",
    aspectRatio: 0.48,
    slots: [
      { id: "slot-1", x: 0.11, y: 0.18, width: 0.78, height: 0.2, radius: 26 },
      { id: "slot-2", x: 0.11, y: 0.42, width: 0.78, height: 0.2, radius: 26 },
      { id: "slot-3", x: 0.11, y: 0.66, width: 0.78, height: 0.2, radius: 26 }
    ]
  },
  {
    id: "grid2x2",
    name: "2x2 Grid",
    aspectRatio: 0.82,
    slots: [
      { id: "slot-1", x: 0.09, y: 0.14, width: 0.37, height: 0.29, radius: 22 },
      { id: "slot-2", x: 0.54, y: 0.14, width: 0.37, height: 0.29, radius: 22 },
      { id: "slot-3", x: 0.09, y: 0.51, width: 0.37, height: 0.29, radius: 22 },
      { id: "slot-4", x: 0.54, y: 0.51, width: 0.37, height: 0.29, radius: 22 }
    ]
  },
  {
    id: "strip2",
    name: "2 Photo Strip",
    aspectRatio: 0.56,
    slots: [
      { id: "slot-1", x: 0.11, y: 0.2, width: 0.78, height: 0.24, radius: 26 },
      { id: "slot-2", x: 0.11, y: 0.5, width: 0.78, height: 0.24, radius: 26 }
    ]
  },
  {
    id: "postcard",
    name: "Postcard",
    aspectRatio: 1.38,
    slots: [{ id: "slot-1", x: 0.08, y: 0.16, width: 0.84, height: 0.58, radius: 24 }]
  }
];

export const FILTERS: { id: FilterId; label: string; css: string }[] = [
  { id: "original", label: "Original", css: "none" },
  { id: "bw", label: "Black & White", css: "grayscale(1)" },
  { id: "sepia", label: "Sepia", css: "sepia(0.85)" },
  { id: "warm", label: "Warm", css: "sepia(0.25) saturate(1.2) hue-rotate(-10deg)" },
  { id: "cool", label: "Cool", css: "saturate(1.1) hue-rotate(18deg)" },
  { id: "vintage", label: "Vintage", css: "sepia(0.35) contrast(0.95) brightness(0.92)" },
  { id: "contrast", label: "High Contrast", css: "contrast(1.3) saturate(1.08)" },
  { id: "soft", label: "Soft Brightness", css: "brightness(1.08) saturate(0.92)" }
];

export const FONT_CLASSES: Record<FontId, string> = {
  sans: "font-sans",
  serif: "font-serif",
  script: "font-['Brush_Script_MT','Segoe_Script',cursive]"
};

export const STYLE_PRESETS: Record<StylePresetId, Partial<FrameSettings>> = {
  minimal: {
    backgroundColor: "#ffffff",
    borderColor: "#f4d9e5",
    borderThickness: 1,
    cornerStyle: "rounded",
    gap: 20,
    outerPadding: 28,
    textColor: "#5e3a4f",
    font: "sans"
  },
  pastelPink: {
    backgroundColor: "#ffe9f2",
    borderColor: "#f6a8c7",
    borderThickness: 4,
    cornerStyle: "rounded",
    gap: 18,
    outerPadding: 30,
    textColor: "#8c4665",
    font: "script"
  },
  pastelBlue: {
    backgroundColor: "#e8f4ff",
    borderColor: "#9dd4f4",
    borderThickness: 4,
    cornerStyle: "rounded",
    gap: 18,
    outerPadding: 28,
    textColor: "#3d6286",
    font: "serif"
  },
  film: {
    backgroundColor: "#171717",
    borderColor: "#2a2a2a",
    borderThickness: 6,
    cornerStyle: "square",
    gap: 20,
    outerPadding: 26,
    textColor: "#f7f3ef",
    font: "sans"
  },
  retro: {
    backgroundColor: "#fff4df",
    borderColor: "#ddbf8c",
    borderThickness: 5,
    cornerStyle: "rounded",
    gap: 22,
    outerPadding: 32,
    textColor: "#7d5d33",
    font: "serif"
  },
  hearts: {
    backgroundColor: "#fff1f6",
    borderColor: "#ff7fac",
    borderThickness: 5,
    cornerStyle: "rounded",
    gap: 18,
    outerPadding: 34,
    textColor: "#b34d7e",
    font: "script"
  },
  polaroid: {
    backgroundColor: "#ffffff",
    borderColor: "#f0f0f0",
    borderThickness: 3,
    cornerStyle: "square",
    gap: 18,
    outerPadding: 38,
    textColor: "#444444",
    font: "sans"
  }
};

export const STICKER_LIBRARY: { kind: StickerKind; label: string; symbol: string; color: string }[] = [
  { kind: "heart", label: "Heart", symbol: "❤", color: "#ff5b97" },
  { kind: "star", label: "Star", symbol: "★", color: "#ffce54" },
  { kind: "sparkle", label: "Sparkle", symbol: "✦", color: "#ffd8f2" },
  { kind: "flower", label: "Flower", symbol: "✿", color: "#ff89c1" },
  { kind: "bow", label: "Bow", symbol: "🎀", color: "#ff8eb5" },
  { kind: "smile", label: "Smiley", symbol: "☺", color: "#ffb547" },
  { kind: "text", label: "Text", symbol: "LOVE", color: "#d7568c" }
];

export const DEFAULT_FRAME: FrameSettings = {
  backgroundColor: "#ffe9f2",
  borderColor: "#f6a8c7",
  borderThickness: 4,
  cornerStyle: "rounded",
  gap: 18,
  outerPadding: 30,
  title: "Photobooth",
  dateText: new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date()),
  message: "Made with love",
  textColor: "#8c4665",
  font: "script",
  presetId: "pastelPink"
};

export const SESSION_STORAGE_KEY = "cute-photobooth-session-v1";
