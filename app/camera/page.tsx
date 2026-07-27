"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CameraPreview } from "@/components/camera-preview";
import { CapturedPhotoGallery } from "@/components/captured-photo-gallery";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TemplateSelector } from "@/components/template-selector";
import { usePhotobooth } from "@/components/photobooth-provider";

export default function CameraPage() {
  const { state, dispatch } = usePhotobooth();
  const [retakePhotoId, setRetakePhotoId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <AppShell
      currentPath="/camera"
      title="Capture your shots"
      description="Use the webcam, switch cameras, retake selected images, and keep capturing until your template is full."
    >
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <TemplateSelector />
          <div className="panel p-5 text-sm leading-7 text-rose-700/80">
            <p className="font-semibold text-roseInk">Session progress</p>
            <p>
              You have {state.photos.length} captured photo{state.photos.length === 1 ? "" : "s"} and the current template needs{" "}
              {state.templateId === "postcard"
                ? 1
                : state.templateId === "strip2"
                  ? 2
                  : state.templateId === "strip3"
                    ? 3
                    : 4} slot
              {state.templateId === "postcard" ? "" : "s"}.
            </p>
            <div className="mt-4 flex gap-3">
              <Link href="/editor" className="button-primary">
                Go to editor
              </Link>
              <Link href="/preview" className="button-secondary">
                Preview
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <CameraPreview
            retakePhotoId={retakePhotoId}
            onRetakeComplete={() => {
              setRetakePhotoId(null);
            }}
          />
          <CapturedPhotoGallery
            onRetakeSelected={() => setRetakePhotoId(state.selectedPhotoId)}
            onClearAll={() => setConfirmClear(true)}
          />
        </div>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Delete all captured photos?"
        description="This clears the gallery and removes any placed photos from the strip too."
        confirmLabel="Delete all"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          dispatch({ type: "clear-photos" });
          setConfirmClear(false);
        }}
      />
    </AppShell>
  );
}
