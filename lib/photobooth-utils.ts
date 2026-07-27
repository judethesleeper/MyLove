import {
  CapturedPhoto,
  FilterId,
  FrameSettings,
  SessionState,
  SlotPhotoPlacement,
  StickerItem,
  TemplateId
} from "@/types/photobooth";
import {
  DEFAULT_FRAME,
  FILTERS,
  PHOTO_TEMPLATES,
  SESSION_STORAGE_KEY,
  STYLE_PRESETS,
  STICKER_LIBRARY
} from "./photobooth-data";

export function createId(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getTemplate(templateId: TemplateId) {
  return PHOTO_TEMPLATES.find((template) => template.id === templateId) ?? PHOTO_TEMPLATES[0];
}

export function getFilterCss(filterId: FilterId) {
  return FILTERS.find((filter) => filter.id === filterId)?.css ?? "none";
}

export function defaultSessionState(): SessionState {
  return {
    photos: [],
    templateId: "strip4",
    placements: {},
    frame: DEFAULT_FRAME,
    stickers: [],
    selectedPhotoId: null,
    selectedSlotId: null,
    selectedStickerId: null,
    cameraFacingMode: "user",
    countdownSeconds: 3,
    previewZoom: 1,
    previewMode: "mobile",
    lastSavedAt: Date.now()
  };
}

export function saveSessionState(state: SessionState) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
}

export function loadSessionState(): SessionState | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<SessionState>;
    const base = defaultSessionState();
    const photos = parsed.photos ?? [];
    const templateId = parsed.templateId ?? base.templateId;
    const placements = autoplacePhotos(parsed.placements ?? {}, templateId, photos);

    return {
      ...base,
      ...parsed,
      photos,
      templateId,
      placements,
      frame: {
        ...base.frame,
        ...(parsed.frame ?? {})
      },
      stickers: parsed.stickers ?? [],
      selectedPhotoId: parsed.selectedPhotoId ?? null,
      selectedSlotId: parsed.selectedSlotId ?? null,
      selectedStickerId: parsed.selectedStickerId ?? null
    };
  } catch {
    return null;
  }
}

export function applyPreset(frame: FrameSettings, presetId: keyof typeof STYLE_PRESETS): FrameSettings {
  return {
    ...frame,
    ...STYLE_PRESETS[presetId],
    presetId
  };
}

export function autoplacePhotos(
  placements: Record<string, SlotPhotoPlacement | undefined>,
  templateId: TemplateId,
  photos: CapturedPhoto[]
) {
  const nextPlacements = { ...placements };
  const template = getTemplate(templateId);
  const placedPhotoIds = new Set(
    Object.values(nextPlacements)
      .filter(Boolean)
      .map((placement) => placement!.photoId)
  );

  for (const slot of template.slots) {
    if (nextPlacements[slot.id]) {
      continue;
    }
    const photo = photos.find((item) => !placedPhotoIds.has(item.id));
    if (!photo) {
      continue;
    }
    nextPlacements[slot.id] = {
      photoId: photo.id,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      filter: "original"
    };
    placedPhotoIds.add(photo.id);
  }

  return nextPlacements;
}

export function addStickerDefaults(kind: StickerItem["kind"]): StickerItem {
  const item = STICKER_LIBRARY.find((sticker) => sticker.kind === kind) ?? STICKER_LIBRARY[0];
  return {
    id: createId("sticker"),
    kind,
    label: item.symbol,
    color: item.color,
    x: 50,
    y: 50,
    scale: 1,
    rotation: 0,
    zIndex: Date.now()
  };
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
