import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { LiveRoomStage } from "@/components/live-room-stage";

export default function LiveRoomPage() {
  return (
    <AppShell
      currentPath="/live"
      title="Live room"
      description="Two phones, one shared countdown, and one shared final strip."
    >
      <Suspense fallback={<div className="panel p-6 text-sm text-rose-700/80">Loading live room...</div>}>
        <LiveRoomStage />
      </Suspense>
    </AppShell>
  );
}
