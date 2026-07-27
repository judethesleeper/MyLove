"use client";

import { STICKER_LIBRARY } from "@/lib/photobooth-data";
import { usePhotobooth } from "./photobooth-provider";

const STICKER_CONTROLS = [
  { label: "Scale", key: "scale", min: 0.4, max: 2.5, step: 0.1 },
  { label: "Rotation", key: "rotation", min: -180, max: 180, step: 1 },
  { label: "Horizontal", key: "x", min: 0, max: 100, step: 1 },
  { label: "Vertical", key: "y", min: 0, max: 100, step: 1 }
] as const;

export function StickerPanel() {
  const { state, dispatch } = usePhotobooth();
  const selectedSticker = state.stickers.find((item) => item.id === state.selectedStickerId) ?? null;

  return (
    <div className="panel p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-roseInk">Stickers & decorations</h2>
        <p className="text-sm text-rose-700/80">
          Add cute little details, then drag them around the stage or fine tune them here.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {STICKER_LIBRARY.map((sticker) => (
          <button
            key={sticker.kind}
            className="button-secondary flex-col gap-1 rounded-[24px] py-4"
            onClick={() => dispatch({ type: "add-sticker", kind: sticker.kind })}
            title={`Add ${sticker.label}`}
          >
            <span className="text-2xl" style={{ color: sticker.color }}>
              {sticker.symbol}
            </span>
            <span className="text-xs">{sticker.label}</span>
          </button>
        ))}
      </div>

      {selectedSticker && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-roseInk">Sticker text / label</label>
            <input
              className="input-base"
              value={selectedSticker.label}
              onChange={(event) =>
                dispatch({
                  type: "update-sticker",
                  stickerId: selectedSticker.id,
                  patch: { label: event.target.value }
                })
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-roseInk">Sticker color</label>
            <input
              type="color"
              className="h-12 w-full rounded-2xl border border-rose-200 bg-white/80 p-1"
              value={selectedSticker.color ?? "#d7568c"}
              onChange={(event) =>
                dispatch({
                  type: "update-sticker",
                  stickerId: selectedSticker.id,
                  patch: { color: event.target.value }
                })
              }
            />
          </div>
          {STICKER_CONTROLS.map((control) => (
            <div key={control.key}>
              <label className="mb-1 block text-sm font-medium text-roseInk">{control.label}</label>
              <input
                type="range"
                min={control.min}
                max={control.max}
                step={control.step}
                value={selectedSticker[control.key]}
                onChange={(event) =>
                  dispatch({
                    type: "update-sticker",
                    stickerId: selectedSticker.id,
                    patch: { [control.key]: Number(event.target.value) }
                  })
                }
                className="w-full accent-rose-500"
              />
            </div>
          ))}
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <button
              className="button-secondary"
              onClick={() =>
                dispatch({ type: "bring-sticker", stickerId: selectedSticker.id, direction: "forward" })
              }
            >
              Bring forward
            </button>
            <button
              className="button-secondary"
              onClick={() =>
                dispatch({ type: "bring-sticker", stickerId: selectedSticker.id, direction: "backward" })
              }
            >
              Send backward
            </button>
            <button
              className="button-secondary"
              onClick={() => dispatch({ type: "delete-sticker", stickerId: selectedSticker.id })}
            >
              Delete sticker
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
