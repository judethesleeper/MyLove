"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CapturedPhotoGallery } from "@/components/captured-photo-gallery";
import { EditorToolbar } from "@/components/editor-toolbar";
import { FilterPanel } from "@/components/filter-panel";
import { FrameCustomizer } from "@/components/frame-customizer";
import { PhotoStripStage } from "@/components/photo-strip-stage";
import { StickerPanel } from "@/components/sticker-panel";
import { TemplateSelector } from "@/components/template-selector";

export default function EditorPage() {
  return (
    <AppShell
      currentPath="/editor"
      title="Edit your photo strip"
      description="Drag photos into slots, adjust crop and rotation, customize the frame, apply filters, and decorate it."
    >
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <TemplateSelector />
          <CapturedPhotoGallery />
          <div className="panel p-5">
            <p className="text-sm leading-7 text-rose-700/80">
              Tip: On desktop you can drag a thumbnail into a slot. On mobile you can select a thumbnail first, then tap a slot.
            </p>
            <div className="mt-4 flex gap-3">
              <Link href="/camera" className="button-secondary">
                Back to camera
              </Link>
              <Link href="/preview" className="button-primary">
                Open preview
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <PhotoStripStage />
          <EditorToolbar />
          <FrameCustomizer />
          <FilterPanel />
          <StickerPanel />
        </div>
      </div>
    </AppShell>
  );
}
