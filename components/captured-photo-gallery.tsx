"use client";

import clsx from "clsx";
import { RefreshCcw, Trash2 } from "lucide-react";
import { usePhotobooth } from "./photobooth-provider";

export function CapturedPhotoGallery({
  onRetakeSelected,
  onClearAll
}: {
  onRetakeSelected?: () => void;
  onClearAll?: () => void;
}) {
  const { state, dispatch } = usePhotobooth();

  return (
    <div className="panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-roseInk">Captured photos</h2>
          <p className="text-sm text-rose-700/80">
            Select one to place it, retake it, or drop it onto a slot.
          </p>
        </div>
        <div className="flex gap-2">
          {onRetakeSelected && (
            <button
              className="button-secondary gap-2"
              onClick={onRetakeSelected}
              disabled={!state.selectedPhotoId}
              title="Retake selected photo"
            >
              <RefreshCcw className="h-4 w-4" />
              Retake
            </button>
          )}
          <button
            className="button-secondary gap-2"
            onClick={onClearAll}
            disabled={state.photos.length === 0}
            title="Delete all photos"
          >
            <Trash2 className="h-4 w-4" />
            Clear all
          </button>
        </div>
      </div>

      {state.photos.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-rose-200 bg-white/50 p-6 text-center text-sm text-rose-600">
          No photos yet. Capture one from the camera step to start filling your template.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {state.photos.map((photo) => (
            <div
              key={photo.id}
              draggable
              onDragStart={(event) => event.dataTransfer.setData("text/photo-id", photo.id)}
              className={clsx(
                "group rounded-[24px] border p-2 transition",
                state.selectedPhotoId === photo.id
                  ? "border-berry bg-rose-50"
                  : "border-rose-100 bg-white/80"
              )}
            >
              <button
                onClick={() => dispatch({ type: "set-selected-photo", photoId: photo.id })}
                className="w-full text-left"
              >
                <img
                  src={photo.dataUrl}
                  alt="Captured photobooth shot"
                  className="aspect-[3/4] w-full rounded-[18px] object-cover"
                />
              </button>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-rose-500">
                  {new Date(photo.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <button
                  title="Delete photo"
                  onClick={() => dispatch({ type: "delete-photo", photoId: photo.id })}
                  className="rounded-full p-2 text-rose-500 transition hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
