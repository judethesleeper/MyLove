"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ExportControls } from "@/components/export-controls";
import { PhotoStripStage } from "@/components/photo-strip-stage";
import { PreviewControls } from "@/components/preview-controls";

export default function PreviewPage() {
  return (
    <AppShell
      currentPath="/preview"
      title="Preview and download"
      description="See the clean final result without editing controls, switch desktop and mobile preview modes, then export the strip."
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <PhotoStripStage editable={false} clean />
          <PreviewControls />
        </div>
        <div className="space-y-6">
          <ExportControls />
          <div className="panel p-5">
            <p className="text-sm leading-7 text-rose-700/80">
              Need more edits? Go back to the editor to swap template layouts, tweak filters, or move stickers around.
            </p>
            <div className="mt-4 flex gap-3">
              <Link href="/editor" className="button-secondary">
                Back to editor
              </Link>
              <Link href="/camera" className="button-secondary">
                Capture more photos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
