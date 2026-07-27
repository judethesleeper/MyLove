"use client";

import clsx from "clsx";
import { CSSProperties, useMemo, useRef, useState } from "react";
import { FONT_CLASSES, PHOTO_TEMPLATES, STICKER_LIBRARY } from "@/lib/photobooth-data";
import { getFilterCss, getTemplate } from "@/lib/photobooth-utils";
import { usePhotobooth } from "./photobooth-provider";

export function PhotoStripStage({
  editable = true,
  clean = false
}: {
  editable?: boolean;
  clean?: boolean;
}) {
  const { state, dispatch } = usePhotobooth();
  const template = useMemo(() => getTemplate(state.templateId), [state.templateId]);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [draggingStickerId, setDraggingStickerId] = useState<string | null>(null);

  const photosById = useMemo(
    () => Object.fromEntries(state.photos.map((photo) => [photo.id, photo])),
    [state.photos]
  );

  const stageStyle: CSSProperties = {
    aspectRatio: template.aspectRatio.toString(),
    background: state.frame.backgroundColor,
    transform: `scale(${state.previewZoom})`,
    transformOrigin: "top center"
  };

  const innerPadding = `${state.frame.outerPadding / 6}%`;

  const onDropPhoto = (slotId: string, photoId: string) => {
    dispatch({ type: "assign-photo", slotId, photoId });
  };

  const handleStickerPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    stickerId: string
  ) => {
    if (!editable || !stageRef.current) {
      return;
    }
    dispatch({ type: "set-selected-sticker", stickerId });
    setDraggingStickerId(stickerId);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleStickerPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggingStickerId || !stageRef.current) {
      return;
    }
    const rect = stageRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    dispatch({
      type: "update-sticker",
      stickerId: draggingStickerId,
      patch: {
        x: Math.max(5, Math.min(95, x)),
        y: Math.max(8, Math.min(92, y))
      }
    });
  };

  return (
    <div className={clsx("panel overflow-hidden p-5", clean && "bg-white")}>
      {!clean && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-roseInk">Live strip editor</h2>
            <p className="text-sm text-rose-700/80">
              Drag photos into slots, then fine tune zoom, crop, rotation, text, and stickers.
            </p>
          </div>
        </div>
      )}
      <div
        className={clsx(
          "mx-auto flex justify-center overflow-auto rounded-[28px] p-6",
          clean ? "bg-transparent p-0" : "bg-[radial-gradient(circle_at_top,_#fffef9,_#ffe9f2)]"
        )}
      >
        <div
          ref={stageRef}
          className={clsx(
            "relative w-full max-w-[420px] rounded-[32px] shadow-dreamy transition",
            state.frame.cornerStyle === "rounded" ? "overflow-hidden" : "overflow-visible"
          )}
          style={stageStyle}
        >
          <div className="absolute inset-0" style={{ padding: innerPadding }}>
            <div
              className={clsx("absolute left-1/2 top-[5%] z-10 -translate-x-1/2 text-center", FONT_CLASSES[state.frame.font])}
              style={{ color: state.frame.textColor }}
            >
              <div className="text-[clamp(18px,3vw,28px)] font-semibold">{state.frame.title}</div>
            </div>

            {template.slots.map((slot) => {
              const placement = state.placements[slot.id];
              const photo = placement ? photosById[placement.photoId] : null;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => {
                    if (editable && state.selectedPhotoId) {
                      dispatch({ type: "assign-photo", slotId: slot.id, photoId: state.selectedPhotoId });
                    } else {
                      dispatch({ type: "set-selected-slot", slotId: slot.id });
                    }
                  }}
                  onDragOver={(event) => editable && event.preventDefault()}
                  onDrop={(event) => {
                    if (!editable) return;
                    event.preventDefault();
                    const photoId = event.dataTransfer.getData("text/photo-id");
                    if (photoId) onDropPhoto(slot.id, photoId);
                  }}
                  className={clsx(
                    "absolute overflow-hidden border text-left transition",
                    state.selectedSlotId === slot.id
                      ? "border-berry ring-2 ring-rose-200"
                      : "border-white/70"
                  )}
                  style={{
                    left: `${slot.x * 100}%`,
                    top: `${slot.y * 100}%`,
                    width: `calc(${slot.width * 100}% - ${state.frame.gap}px)`,
                    height: `calc(${slot.height * 100}% - ${state.frame.gap}px)`,
                    borderWidth: state.frame.borderThickness,
                    borderColor: state.frame.borderColor,
                    borderRadius:
                      state.frame.cornerStyle === "rounded" ? `${slot.radius ?? 24}px` : "6px",
                    background: photo ? "#fff" : "rgba(255,255,255,0.65)"
                  }}
                  title="Drop or assign a photo here"
                >
                  {photo && placement ? (
                    <img
                      src={photo.dataUrl}
                      alt="Placed photobooth capture"
                      className="h-full w-full object-cover"
                      style={{
                        filter: getFilterCss(placement.filter),
                        transform: `translate(${placement.offsetX}px, ${placement.offsetY}px) scale(${placement.zoom}) rotate(${placement.rotation}deg)`,
                        transformOrigin: "center"
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-center text-xs font-medium uppercase tracking-[0.18em] text-rose-400">
                      Drop photo
                    </div>
                  )}
                </button>
              );
            })}

            {[...state.stickers]
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  className={clsx(
                    "absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-center",
                    editable && state.selectedStickerId === sticker.id && "ring-2 ring-rose-300"
                  )}
                  style={{
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    color: sticker.color,
                    fontSize: `${42 * sticker.scale}px`,
                    transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`
                  }}
                  onClick={() => dispatch({ type: "set-selected-sticker", stickerId: sticker.id })}
                  onPointerDown={(event) => handleStickerPointerDown(event, sticker.id)}
                  onPointerMove={handleStickerPointerMove}
                  onPointerUp={() => setDraggingStickerId(null)}
                >
                  {sticker.label}
                </button>
              ))}

            <div
              className={clsx("absolute bottom-[4%] left-1/2 z-10 -translate-x-1/2 text-center", FONT_CLASSES[state.frame.font])}
              style={{ color: state.frame.textColor }}
            >
              <div className="text-sm">{state.frame.message}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.24em]">{state.frame.dateText}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
