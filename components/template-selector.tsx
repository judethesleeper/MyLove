"use client";

import clsx from "clsx";
import { PHOTO_TEMPLATES } from "@/lib/photobooth-data";
import { usePhotobooth } from "./photobooth-provider";

export function TemplateSelector() {
  const { state, dispatch } = usePhotobooth();

  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-roseInk">Templates</h2>
          <p className="text-sm text-rose-700/80">Choose a layout and the editor updates instantly.</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {PHOTO_TEMPLATES.map((template) => {
          const active = template.id === state.templateId;
          return (
            <button
              key={template.id}
              onClick={() => dispatch({ type: "set-template", templateId: template.id })}
              className={clsx(
                "rounded-[24px] border p-4 text-left transition",
                active ? "border-berry bg-rose-50" : "border-rose-100 bg-white/80"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-roseInk">{template.name}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-rose-500">{template.slots.length} slots</p>
                </div>
                <div
                  className="grid w-20 shrink-0 gap-1 rounded-2xl bg-rose-100/70 p-2"
                  style={{
                    aspectRatio: template.aspectRatio.toString(),
                    gridTemplateColumns:
                      template.id === "grid2x2" ? "repeat(2, minmax(0, 1fr))" : "1fr"
                  }}
                >
                  {template.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="rounded-xl border border-rose-200 bg-white"
                      style={{
                        minHeight:
                          template.id === "grid2x2"
                            ? "1.8rem"
                            : template.id === "postcard"
                              ? "4rem"
                              : template.id === "strip2"
                                ? "2.6rem"
                                : "1.9rem"
                      }}
                    />
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
