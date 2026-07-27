import Link from "next/link";
import { Camera, LayoutTemplate, Sparkles, Sticker, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export default function LandingPage() {
  return (
    <AppShell
      currentPath="/"
      title="Cute Online Photobooth"
      description="A complete responsive photobooth app inspired by modern social photobooth flows: templates, live camera capture, filters, stickers, editing, preview, and download."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="panel p-6 sm:p-8">
          <div className="inline-flex rounded-full border border-rose-200 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-berry">
            Start here
          </div>
          <h2 className="mt-5 text-4xl font-semibold tracking-tight text-roseInk sm:text-5xl">
            Make a photobooth strip that feels playful, polished, and yours.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-rose-700/80">
            Pick a template, capture multiple photos, drag them into place, decorate with stickers, tweak the frame,
            then export a high-resolution strip. Everything stays in the browser for the first version.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/camera" className="button-primary">
              Start Photobooth
            </Link>
            <Link href="/live" className="button-secondary">
              2-person live mode
            </Link>
            <Link href="/editor" className="button-secondary">
              Skip to editor
            </Link>
          </div>

          <div className="mt-8 rounded-[28px] border border-rose-100 bg-white/70 p-5 text-sm leading-7 text-rose-700/80">
            <p className="font-semibold text-roseInk">Camera permission note</p>
            <p>
              When you reach the camera step, your browser will ask for webcam permission. You can switch front or back
              cameras on supported phones, and the app shows a clear message if access is denied or no camera exists.
            </p>
          </div>
        </section>

        <section className="grid gap-4">
          {[
            {
              icon: LayoutTemplate,
              title: "Template-first flow",
              description: "Classic strips, grids, postcards, and auto-placement into empty slots."
            },
            {
              icon: Camera,
              title: "Capture with countdown",
              description: "3s or 5s timer, flash animation, live preview, retakes, and thumbnail gallery."
            },
            {
              icon: Sparkles,
              title: "Filters and cute presets",
              description: "Pastel styles, film strip mood, text editing, border controls, and live preview."
            },
            {
              icon: Sticker,
              title: "Decorate and export",
              description: "Drag stickers around, adjust them, preview clean output, and download PNG or JPG."
            },
            {
              icon: Users,
              title: "Live room mode",
              description: "Create a shared room, invite your partner, and capture one strip together from two phones."
            }
          ].map((item) => (
            <div key={item.title} className="panel p-5">
              <item.icon className="h-8 w-8 text-berry" />
              <h3 className="mt-4 text-xl font-semibold text-roseInk">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-rose-700/80">{item.description}</p>
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
