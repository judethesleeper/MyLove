"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type Dispatch
} from "react";
import {
  CapturedPhoto,
  DeviceMode,
  FilterId,
  FrameSettings,
  SessionState,
  SlotPhotoPlacement,
  StickerItem,
  StylePresetId,
  TemplateId
} from "@/types/photobooth";
import {
  addStickerDefaults,
  applyPreset,
  autoplacePhotos,
  createId,
  defaultSessionState,
  loadSessionState,
  saveSessionState
} from "@/lib/photobooth-utils";

type Action =
  | { type: "hydrate"; payload: SessionState }
  | { type: "set-template"; templateId: TemplateId }
  | { type: "add-photos"; photos: CapturedPhoto[] }
  | { type: "replace-photo"; photoId: string; dataUrl: string }
  | { type: "delete-photo"; photoId: string }
  | { type: "clear-photos" }
  | { type: "assign-photo"; slotId: string; photoId: string }
  | { type: "update-slot"; slotId: string; patch: Partial<SlotPhotoPlacement> }
  | { type: "remove-slot-photo"; slotId: string }
  | { type: "set-frame"; patch: Partial<FrameSettings> }
  | { type: "apply-preset"; presetId: StylePresetId }
  | { type: "set-selected-photo"; photoId: string | null }
  | { type: "set-selected-slot"; slotId: string | null }
  | { type: "set-selected-sticker"; stickerId: string | null }
  | { type: "add-sticker"; kind: StickerItem["kind"] }
  | { type: "update-sticker"; stickerId: string; patch: Partial<StickerItem> }
  | { type: "delete-sticker"; stickerId: string }
  | { type: "bring-sticker"; stickerId: string; direction: "forward" | "backward" }
  | { type: "apply-filter-all"; filter: FilterId }
  | { type: "set-camera-facing"; facing: "user" | "environment" }
  | { type: "set-countdown"; countdown: 3 | 5 }
  | { type: "set-preview-zoom"; zoom: number }
  | { type: "set-preview-mode"; mode: DeviceMode }
  | { type: "reset-session" };

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case "hydrate":
      return action.payload;
    case "set-template": {
      const placements = autoplacePhotos(state.placements, action.templateId, state.photos);
      return {
        ...state,
        templateId: action.templateId,
        placements,
        selectedSlotId: null,
        lastSavedAt: Date.now()
      };
    }
    case "add-photos": {
      const photos = [...state.photos, ...action.photos];
      return {
        ...state,
        photos,
        placements: autoplacePhotos(state.placements, state.templateId, photos),
        selectedPhotoId: action.photos.at(-1)?.id ?? state.selectedPhotoId,
        lastSavedAt: Date.now()
      };
    }
    case "replace-photo":
      return {
        ...state,
        photos: state.photos.map((photo) =>
          photo.id === action.photoId ? { ...photo, dataUrl: action.dataUrl } : photo
        ),
        lastSavedAt: Date.now()
      };
    case "delete-photo": {
      const placements = Object.fromEntries(
        Object.entries(state.placements).map(([slotId, placement]) => [
          slotId,
          placement?.photoId === action.photoId ? undefined : placement
        ])
      );
      return {
        ...state,
        photos: state.photos.filter((photo) => photo.id !== action.photoId),
        placements,
        selectedPhotoId: state.selectedPhotoId === action.photoId ? null : state.selectedPhotoId,
        lastSavedAt: Date.now()
      };
    }
    case "clear-photos":
      return {
        ...state,
        photos: [],
        placements: {},
        selectedPhotoId: null,
        selectedSlotId: null,
        lastSavedAt: Date.now()
      };
    case "assign-photo":
      return {
        ...state,
        placements: {
          ...state.placements,
          [action.slotId]: {
            photoId: action.photoId,
            zoom: 1,
            offsetX: 0,
            offsetY: 0,
            rotation: 0,
            filter: state.placements[action.slotId]?.filter ?? "original"
          }
        },
        selectedSlotId: action.slotId,
        selectedPhotoId: action.photoId,
        lastSavedAt: Date.now()
      };
    case "update-slot":
      if (!state.placements[action.slotId]) {
        return state;
      }
      return {
        ...state,
        placements: {
          ...state.placements,
          [action.slotId]: {
            ...state.placements[action.slotId]!,
            ...action.patch
          }
        },
        lastSavedAt: Date.now()
      };
    case "remove-slot-photo":
      return {
        ...state,
        placements: { ...state.placements, [action.slotId]: undefined },
        lastSavedAt: Date.now()
      };
    case "set-frame":
      return { ...state, frame: { ...state.frame, ...action.patch }, lastSavedAt: Date.now() };
    case "apply-preset":
      return { ...state, frame: applyPreset(state.frame, action.presetId), lastSavedAt: Date.now() };
    case "set-selected-photo":
      return { ...state, selectedPhotoId: action.photoId };
    case "set-selected-slot":
      return { ...state, selectedSlotId: action.slotId };
    case "set-selected-sticker":
      return { ...state, selectedStickerId: action.stickerId };
    case "add-sticker": {
      const sticker = addStickerDefaults(action.kind);
      return {
        ...state,
        stickers: [...state.stickers, sticker],
        selectedStickerId: sticker.id,
        lastSavedAt: Date.now()
      };
    }
    case "update-sticker":
      return {
        ...state,
        stickers: state.stickers.map((sticker) =>
          sticker.id === action.stickerId ? { ...sticker, ...action.patch } : sticker
        ),
        lastSavedAt: Date.now()
      };
    case "delete-sticker":
      return {
        ...state,
        stickers: state.stickers.filter((sticker) => sticker.id !== action.stickerId),
        selectedStickerId:
          state.selectedStickerId === action.stickerId ? null : state.selectedStickerId,
        lastSavedAt: Date.now()
      };
    case "bring-sticker": {
      const target = state.stickers.find((item) => item.id === action.stickerId);
      if (!target) {
        return state;
      }
      const delta = action.direction === "forward" ? 1 : -1;
      return {
        ...state,
        stickers: state.stickers.map((sticker) =>
          sticker.id === action.stickerId
            ? { ...sticker, zIndex: Math.max(0, sticker.zIndex + delta) }
            : sticker
        ),
        lastSavedAt: Date.now()
      };
    }
    case "apply-filter-all":
      return {
        ...state,
        placements: Object.fromEntries(
          Object.entries(state.placements).map(([slotId, placement]) => [
            slotId,
            placement ? { ...placement, filter: action.filter } : undefined
          ])
        ),
        lastSavedAt: Date.now()
      };
    case "set-camera-facing":
      return { ...state, cameraFacingMode: action.facing };
    case "set-countdown":
      return { ...state, countdownSeconds: action.countdown };
    case "set-preview-zoom":
      return { ...state, previewZoom: action.zoom };
    case "set-preview-mode":
      return { ...state, previewMode: action.mode };
    case "reset-session":
      return defaultSessionState();
    default:
      return state;
  }
}

type PhotoboothContextValue = {
  state: SessionState;
  canUndo: boolean;
  canRedo: boolean;
  dispatch: Dispatch<Action>;
  addCapturedPhoto: (dataUrl: string) => void;
  replaceCapturedPhoto: (photoId: string, dataUrl: string) => void;
  undo: () => void;
  redo: () => void;
  resetSession: () => void;
};

const PhotoboothContext = createContext<PhotoboothContextValue | null>(null);

export function PhotoboothProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, defaultSessionState);
  const historyRef = useRef<SessionState[]>([]);
  const futureRef = useRef<SessionState[]>([]);
  const hydratedRef = useRef(false);

  useEffect(() => {
    const saved = loadSessionState();
    if (saved) {
      dispatch({ type: "hydrate", payload: saved });
    }
    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) {
      return;
    }
    saveSessionState(state);
  }, [state]);

  const pushHistory = useCallback(() => {
    historyRef.current = [...historyRef.current.slice(-19), state];
    futureRef.current = [];
  }, [state]);

  const wrappedDispatch = useCallback(
    (action: Action) => {
      if (action.type !== "hydrate" && action.type !== "set-selected-photo" && action.type !== "set-selected-slot" && action.type !== "set-selected-sticker") {
        pushHistory();
      }
      dispatch(action);
    },
    [pushHistory]
  );

  const addCapturedPhoto = useCallback(
    (dataUrl: string) => {
      wrappedDispatch({
        type: "add-photos",
        photos: [{ id: createId("photo"), dataUrl, createdAt: Date.now() }]
      });
    },
    [wrappedDispatch]
  );

  const replaceCapturedPhoto = useCallback(
    (photoId: string, dataUrl: string) => {
      wrappedDispatch({ type: "replace-photo", photoId, dataUrl });
    },
    [wrappedDispatch]
  );

  const undo = useCallback(() => {
    const previous = historyRef.current.at(-1);
    if (!previous) {
      return;
    }
    historyRef.current = historyRef.current.slice(0, -1);
    futureRef.current = [state, ...futureRef.current.slice(0, 19)];
    dispatch({ type: "hydrate", payload: previous });
  }, [state]);

  const redo = useCallback(() => {
    const next = futureRef.current.at(0);
    if (!next) {
      return;
    }
    futureRef.current = futureRef.current.slice(1);
    historyRef.current = [...historyRef.current.slice(-19), state];
    dispatch({ type: "hydrate", payload: next });
  }, [state]);

  const resetSession = useCallback(() => {
    pushHistory();
    dispatch({ type: "reset-session" });
  }, [pushHistory]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isMeta = event.metaKey || event.ctrlKey;
      if (!isMeta) {
        return;
      }
      if (event.key.toLowerCase() === "z" && event.shiftKey) {
        event.preventDefault();
        redo();
      } else if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [redo, undo]);

  const value = useMemo<PhotoboothContextValue>(
    () => ({
      state,
      canUndo: historyRef.current.length > 0,
      canRedo: futureRef.current.length > 0,
      dispatch: wrappedDispatch,
      addCapturedPhoto,
      replaceCapturedPhoto,
      undo,
      redo,
      resetSession
    }),
    [state, wrappedDispatch, addCapturedPhoto, replaceCapturedPhoto, undo, redo, resetSession]
  );

  return <PhotoboothContext.Provider value={value}>{children}</PhotoboothContext.Provider>;
}

export function usePhotobooth() {
  const context = useContext(PhotoboothContext);
  if (!context) {
    throw new Error("usePhotobooth must be used within a PhotoboothProvider");
  }
  return context;
}
