import { AppShell } from "@/components/app-shell";
import { LiveRoomStage } from "@/components/live-room-stage";

export default function LiveRoomPage() {
  return (
    <AppShell
      currentPath="/live"
      title="Live room"
      description="Two phones, one shared countdown, and one shared final strip."
    >
      <LiveRoomStage />
    </AppShell>
  );
}
