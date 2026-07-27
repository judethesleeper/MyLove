"use client";

import { RotateCcw, Trash2, Undo2, Redo2 } from "lucide-react";
import { usePhotobooth } from "./photobooth-provider";

const SLOT_CONTROLS = [
  { label: "Zoom", key: "zoom", min: 0.6, max: 2.6, step: 0.05 },
  { label: "Horizontal", key: "offsetX", min: -140, max: 140, step: 1 },
  { label: "Vertical", key: "offsetY", min: -140, max: 140, step: 1 },
  { label: "Rotation", key: "rotation", min: -180, max: 180, step: 1 }
] as const;

export function EditorToolbar() {
  const { state, dispatch, canUndo, canRedo, undo, redo, resetSession } = usePhotobooth();
  const selectedPlacement = state.selectedSlotId ? state.placements[state.selectedSlotId] : null;

  return (
    <div className="panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-roseInk">Editor tools</h2>
          <p className="text-sm text-rose-700/80">Use undo, redo, slot controls, and session reset while you style the strip.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="button-secondary gap-2" onClick={undo} disabled={!canUndo}>
            <Undo2 className="h-4 w-4" />
            Undo
          </button>
          <button className="button-secondary gap-2" onClick={redo} disabled={!canRedo}>
            <Redo2 className="h-4 w-4" />
            Redo
          </button>
          <button className="button-secondary gap-2" onClick={resetSession}>
            <Trash2 className="h-4 w-4" />
            Reset session
          </button>
        </div>
      </div>

      {selectedPlacement && state.selectedSlotId ? (
        <div className="grid gap-4 md:grid-cols-2">
          {SLOT_CONTROLS.map((control) => (
            <div key={control.key}>
              <label className="mb-1 block text-sm font-medium text-roseInk">{control.label}</label>
              <input
                type="range"
                min={control.min}
                max={control.max}
                step={control.step}
                value={selectedPlacement[control.key]}
                onChange={(event) =>
                  dispatch({
                    type: "update-slot",
                    slotId: state.selectedSlotId!,
                    patch: { [control.key]: Number(event.target.value) }
                  })
                }
                className="w-full accent-rose-500"
              />
            </div>
          ))}
          <div className="md:col-span-2 flex flex-wrap gap-2">
            <button
              className="button-secondary gap-2"
              onClick={() =>
                dispatch({
                  type: "update-slot",
                  slotId: state.selectedSlotId!,
                  patch: { zoom: 1, offsetX: 0, offsetY: 0, rotation: 0 }
                })
              }
            >
              <RotateCcw className="h-4 w-4" />
              Reset adjustments
            </button>
            <button
              className="button-secondary gap-2"
              onClick={() => dispatch({ type: "remove-slot-photo", slotId: state.selectedSlotId! })}
            >
              <Trash2 className="h-4 w-4" />
              Remove from slot
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-rose-200 bg-white/50 p-5 text-sm text-rose-600">
          Select a filled slot to zoom, rotate, reposition, or clear that photo.
        </div>
      )}
    </div>
  );
}
