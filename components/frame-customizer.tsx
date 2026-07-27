"use client";

import { STYLE_PRESETS } from "@/lib/photobooth-data";
import { FrameSettings, FontId, StylePresetId } from "@/types/photobooth";
import { usePhotobooth } from "./photobooth-provider";

const RANGE_FIELDS: { label: string; key: keyof Pick<FrameSettings, "borderThickness" | "gap" | "outerPadding">; min: number; max: number }[] = [
  { label: "Border thickness", key: "borderThickness", min: 0, max: 12 },
  { label: "Space between photos", key: "gap", min: 4, max: 32 },
  { label: "Outer padding", key: "outerPadding", min: 14, max: 52 }
];

export function FrameCustomizer() {
  const { state, dispatch } = usePhotobooth();

  return (
    <div className="panel p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-roseInk">Frame customisation</h2>
        <p className="text-sm text-rose-700/80">Colors, borders, spacing, text, corners, and preset looks.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-roseInk">Preset style</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(STYLE_PRESETS).map((presetId) => (
              <button
                key={presetId}
                className="button-secondary justify-start"
                onClick={() => dispatch({ type: "apply-preset", presetId: presetId as StylePresetId })}
              >
                {presetId}
              </button>
            ))}
          </div>
          <label className="block text-sm font-medium text-roseInk">Title</label>
          <input
            className="input-base"
            value={state.frame.title}
            onChange={(event) => dispatch({ type: "set-frame", patch: { title: event.target.value } })}
          />
          <label className="block text-sm font-medium text-roseInk">Message</label>
          <textarea
            className="textarea-base min-h-24"
            value={state.frame.message}
            onChange={(event) => dispatch({ type: "set-frame", patch: { message: event.target.value } })}
          />
          <label className="block text-sm font-medium text-roseInk">Date text</label>
          <input
            className="input-base"
            value={state.frame.dateText}
            onChange={(event) => dispatch({ type: "set-frame", patch: { dateText: event.target.value } })}
          />
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-roseInk">Background</label>
              <input
                type="color"
                className="h-12 w-full rounded-2xl border border-rose-200 bg-white/80 p-1"
                value={state.frame.backgroundColor}
                onChange={(event) =>
                  dispatch({ type: "set-frame", patch: { backgroundColor: event.target.value } })
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-roseInk">Border</label>
              <input
                type="color"
                className="h-12 w-full rounded-2xl border border-rose-200 bg-white/80 p-1"
                value={state.frame.borderColor}
                onChange={(event) =>
                  dispatch({ type: "set-frame", patch: { borderColor: event.target.value } })
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-roseInk">Text</label>
              <input
                type="color"
                className="h-12 w-full rounded-2xl border border-rose-200 bg-white/80 p-1"
                value={state.frame.textColor}
                onChange={(event) =>
                  dispatch({ type: "set-frame", patch: { textColor: event.target.value } })
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-roseInk">Font</label>
              <select
                className="select-base"
                value={state.frame.font}
                onChange={(event) =>
                  dispatch({ type: "set-frame", patch: { font: event.target.value as FontId } })
                }
              >
                <option value="sans">Sans</option>
                <option value="serif">Serif</option>
                <option value="script">Script</option>
              </select>
            </div>
          </div>

          {RANGE_FIELDS.map((item) => (
            <div key={item.key}>
              <label className="mb-1 block text-sm font-medium text-roseInk">{item.label}</label>
              <input
                type="range"
                min={item.min}
                max={item.max}
                value={state.frame[item.key as keyof typeof state.frame] as number}
                onChange={(event) =>
                  dispatch({
                    type: "set-frame",
                    patch: { [item.key]: Number(event.target.value) } as Pick<FrameSettings, typeof item.key>
                  })
                }
                className="w-full accent-rose-500"
              />
            </div>
          ))}

          <div>
            <label className="mb-1 block text-sm font-medium text-roseInk">Corner style</label>
            <div className="flex gap-2">
              <button
                className="button-secondary"
                onClick={() => dispatch({ type: "set-frame", patch: { cornerStyle: "rounded" } })}
              >
                Rounded
              </button>
              <button
                className="button-secondary"
                onClick={() => dispatch({ type: "set-frame", patch: { cornerStyle: "square" } })}
              >
                Square
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
