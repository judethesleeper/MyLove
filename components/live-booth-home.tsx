"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Users, Link2 } from "lucide-react";
import { createLiveRoom, createRandomRoomId, joinLiveRoom } from "@/lib/live-booth-service";
import { PHOTO_TEMPLATES } from "@/lib/photobooth-data";
import type { TemplateId } from "@/types/photobooth";

export function LiveBoothHome() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [templateId, setTemplateId] = useState<TemplateId>("strip4");
  const [status, setStatus] = useState("Create a room or join one from your partner.");
  const [busy, setBusy] = useState(false);

  const createRoom = async () => {
    setBusy(true);
    try {
      const nextRoomId = createRandomRoomId();
      await createLiveRoom(nextRoomId, displayName || "Host", templateId);
      router.push(`/live/room?room=${nextRoomId}&role=host&name=${encodeURIComponent(displayName || "Host")}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not create room.");
    } finally {
      setBusy(false);
    }
  };

  const joinRoom = async () => {
    if (!roomId.trim()) {
      setStatus("Enter a room code first.");
      return;
    }
    setBusy(true);
    try {
      const normalized = roomId.trim().toUpperCase();
      await joinLiveRoom(normalized, displayName || "Guest");
      router.push(`/live/room?room=${normalized}&role=guest&name=${encodeURIComponent(displayName || "Guest")}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not join room.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="panel p-6">
        <div className="inline-flex rounded-full border border-rose-200 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-berry">
          Online mode
        </div>
        <h2 className="mt-5 text-4xl font-semibold tracking-tight text-roseInk sm:text-5xl">
          Two phones. One shared strip.
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-8 text-rose-700/80">
          This mode works like your earlier live booth: one person creates a room, the other joins with a link,
          both phones do the same countdown, and every round fills a shared photobooth strip.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[28px] border border-rose-100 bg-white/70 p-5">
            <Users className="h-8 w-8 text-berry" />
            <h3 className="mt-3 text-lg font-semibold text-roseInk">Shared countdown</h3>
            <p className="mt-2 text-sm leading-7 text-rose-700/80">
              Both phones wait in the same room, hit ready, and start each round together.
            </p>
          </div>
          <div className="rounded-[28px] border border-rose-100 bg-white/70 p-5">
            <Link2 className="h-8 w-8 text-berry" />
            <h3 className="mt-3 text-lg font-semibold text-roseInk">Same final strip</h3>
            <p className="mt-2 text-sm leading-7 text-rose-700/80">
              Each round stores one host photo and one guest photo in the room, then the final strip is generated.
            </p>
          </div>
        </div>
      </div>

      <div className="panel p-6">
        <div className="space-y-4">
          <div>
            <p className="mb-3 block text-sm font-medium text-roseInk">Choose your live template first</p>
            <div className="grid gap-3">
              {PHOTO_TEMPLATES.map((template) => {
                const active = template.id === templateId;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setTemplateId(template.id)}
                    className={clsx(
                      "rounded-[24px] border p-4 text-left transition",
                      active ? "border-berry bg-rose-50" : "border-rose-100 bg-white/80"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-roseInk">{template.name}</p>
                        <p className="text-xs uppercase tracking-[0.2em] text-rose-500">
                          {template.slots.length} rounds
                        </p>
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

          <div>
            <label className="mb-1 block text-sm font-medium text-roseInk">Your name</label>
            <input
              className="input-base"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Your name"
            />
          </div>

          <button className="button-primary w-full justify-center" onClick={createRoom} disabled={busy}>
            Create live room
          </button>

          <div className="relative py-2 text-center text-sm text-rose-500">
            <span className="bg-white px-3">or</span>
            <div className="absolute left-0 right-0 top-1/2 -z-10 h-px bg-rose-100" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-roseInk">Room code</label>
            <input
              className="input-base uppercase"
              value={roomId}
              onChange={(event) => setRoomId(event.target.value.toUpperCase())}
              placeholder="LOVE4821"
            />
          </div>

          <button className="button-secondary w-full justify-center" onClick={joinRoom} disabled={busy}>
            Join room
          </button>
        </div>

        <div className="mt-5 rounded-[24px] border border-rose-100 bg-white/70 p-4 text-sm leading-7 text-rose-700/80">
          {status}
        </div>
      </div>
    </div>
  );
}
