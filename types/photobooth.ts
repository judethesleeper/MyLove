export type FilterId =
  | "original"
  | "bw"
  | "sepia"
  | "warm"
  | "cool"
  | "vintage"
  | "contrast"
  | "soft";

export type TemplateId = "strip4" | "strip3" | "grid2x2" | "strip2" | "postcard";

export type FontId = "sans" | "serif" | "script";

export type StylePresetId =
  | "minimal"
  | "pastelPink"
  | "pastelBlue"
  | "film"
  | "retro"
  | "hearts"
  | "polaroid";

export type StickerKind =
  | "heart"
  | "star"
  | "sparkle"
  | "flower"
  | "bow"
  | "smile"
  | "text";

export type DeviceMode = "mobile" | "desktop";

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  createdAt: number;
}

export interface TemplateSlot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
}

export interface PhotoTemplate {
  id: TemplateId;
  name: string;
  aspectRatio: number;
  slots: TemplateSlot[];
}

export interface SlotPhotoPlacement {
  photoId: string;
  zoom: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  filter: FilterId;
}

export interface FrameSettings {
  backgroundColor: string;
  borderColor: string;
  borderThickness: number;
  cornerStyle: "rounded" | "square";
  gap: number;
  outerPadding: number;
  title: string;
  dateText: string;
  message: string;
  textColor: string;
  font: FontId;
  presetId: StylePresetId;
}

export interface StickerItem {
  id: string;
  kind: StickerKind;
  label: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
  color?: string;
}

export interface SessionState {
  photos: CapturedPhoto[];
  templateId: TemplateId;
  placements: Record<string, SlotPhotoPlacement | undefined>;
  frame: FrameSettings;
  stickers: StickerItem[];
  selectedPhotoId: string | null;
  selectedSlotId: string | null;
  selectedStickerId: string | null;
  cameraFacingMode: "user" | "environment";
  countdownSeconds: 3 | 5;
  previewZoom: number;
  previewMode: DeviceMode;
  lastSavedAt: number;
}
