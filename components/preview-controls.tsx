"use client";

import { Monitor, Smartphone, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { usePhotobooth } from "./photobooth-provider";

export function PreviewControls() {
  const { state, dispatch } = usePhotobooth();

  return (
    <div className="panel p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-roseInk">Preview controls</h2>
        <p className="text-sm text-rose-700/80">Switch device mode, zoom the preview, or fit it back to the screen.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          className="button-secondary gap-2"
          onClick={() => dispatch({ type: "set-preview-mode", mode: "desktop" })}
        >
          <Monitor className="h-4 w-4" />
          Desktop
        </button>
        <button
          className="button-secondary gap-2"
          onClick={() => dispatch({ type: "set-preview-mode", mode: "mobile" })}
        >
          <Smartphone className="h-4 w-4" />
          Mobile
        </button>
        <button
          className="button-secondary gap-2"
          onClick={() =>
            dispatch({ type: "set-preview-zoom", zoom: Math.max(0.6, Number((state.previewZoom - 0.1).toFixed(2))) })
          }
        >
          <ZoomOut className="h-4 w-4" />
          Zoom out
        </button>
        <button
          className="button-secondary gap-2"
          onClick={() =>
            dispatch({ type: "set-preview-zoom", zoom: Math.min(1.8, Number((state.previewZoom + 0.1).toFixed(2))) })
          }
        >
          <ZoomIn className="h-4 w-4" />
          Zoom in
        </button>
        <button className="button-secondary gap-2" onClick={() => dispatch({ type: "set-preview-zoom", zoom: 1 })}>
          <Maximize2 className="h-4 w-4" />
          Fit
        </button>
      </div>
    </div>
  );
}
