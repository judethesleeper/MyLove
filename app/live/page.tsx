import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { LiveBoothHome } from "@/components/live-booth-home";

export default function LivePage() {
  return (
    <AppShell
      currentPath="/live"
      title="Live two-person photobooth"
      description="Create a room, send the link, and capture a shared strip together from two phones."
    >
      <LiveBoothHome />
      <div className="mt-6 panel p-5 text-sm leading-7 text-rose-700/80">
        Want the single-user editor too?{" "}
        <Link href="/editor" className="font-semibold text-berry">
          Open the classic editor
        </Link>
        .
      </div>
    </AppShell>
  );
}
