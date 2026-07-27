"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Copy, Download, LoaderCircle, WandSparkles } from "lucide-react";
import {
  advanceRoom,
  saveRoundImage,
  setParticipantReady,
  startCountdown,
  subscribeToLiveRoom,
  subscribeToRound
} from "@/lib/live-booth-service";
import type { LiveRole, LiveRoom, LiveRoundData } from "@/types/live-booth";
import { getTemplate } from "@/lib/photobooth-utils";
import { usePhotobooth } from "./photobooth-provider";

type RoundMap = Record<number, LiveRoundData>;

function emptyRound(round: number): LiveRoundData {
  return {
    round,
    hostImage: null,
    guestImage: null
  };
}

export function LiveRoomStage() {
  const router = useRouter();
  const params = useSearchParams();
  const { importComposedStrip } = usePhotobooth();
  const roomId = (params.get("room") || "").toUpperCase();
  const role = (params.get("role") === "guest" ? "guest" : "host") as LiveRole;
  const displayName = params.get("name") || (role === "host" ? "Host" : "Guest");
  const partnerRole = role === "host" ? "guest" : "host";

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [room, setRoom] = useState<LiveRoom | null>(null);
  const [rounds, setRounds] = useState<RoundMap>({});
  const [status, setStatus] = useState("Loading room...");
  const [cameraReady, setCameraReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);
  const [finalStrip, setFinalStrip] = useState<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const handledRoundsRef = useRef<Set<number>>(new Set());
  const activeTemplate = useMemo(() => getTemplate(room?.templateId ?? "strip4"), [room?.templateId]);
  const roundNumbers = useMemo(
    () => Array.from({ length: activeTemplate.slots.length }, (_, index) => index + 1),
    [activeTemplate.slots.length]
  );
  const totalRounds = roundNumbers.length;

  useEffect(() => {
    if (!roomId) {
      setStatus("Missing room code.");
      return;
    }

    const unsubs = [
      subscribeToLiveRoom(roomId, (nextRoom) => {
        setRoom(nextRoom);
        if (!nextRoom) {
          setStatus("Room not found.");
          return;
        }

        const partner = nextRoom.participants[partnerRole];
        if (nextRoom.phase === "waiting") {
          setStatus(
            partner.joined
              ? "Both phones are in the room. Press ready on both, then the host starts the round."
              : "Waiting for your partner to join the room."
          );
        } else if (nextRoom.phase === "countdown") {
          setStatus(`Round ${nextRoom.currentRound} countdown started.`);
        } else if (nextRoom.phase === "complete") {
          setStatus("Final strip is ready. Download it on both phones.");
        }
      }),
      ...roundNumbers.map((roundNumber) =>
        subscribeToRound(roomId, roundNumber, (round) => {
          if (!round) return;
          setRounds((current) => ({ ...current, [roundNumber]: round }));
        })
      )
    ];

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, [partnerRole, roomId, roundNumbers]);

  useEffect(() => {
    if (!room || room.phase !== "countdown" || !room.countdownStartsAt) {
      return;
    }

    const key = `${room.currentRound}-${room.countdownStartsAt}`;
    if ((window as any).__liveCountdownKey === key) {
      return;
    }
    (window as any).__liveCountdownKey = key;

    const run = async () => {
      const delay = Math.max(0, room.countdownStartsAt! - Date.now());
      if (delay) {
        await new Promise((resolve) => window.setTimeout(resolve, delay));
      }
      for (let value = 3; value >= 1; value -= 1) {
        setCountdown(value);
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
      }
      setCountdown(null);
      await captureAndUpload(room.currentRound);
    };

    void run();
  }, [room]);

  useEffect(() => {
    if (!room || role !== "host") return;
    const currentRound = room.currentRound;
    const round = rounds[currentRound];
    if (!round?.hostImage || !round?.guestImage) return;
    if (handledRoundsRef.current.has(currentRound)) return;

    handledRoundsRef.current.add(currentRound);
    if (currentRound < totalRounds) {
      void advanceRoom(roomId, "waiting", currentRound + 1);
      return;
    }
    void buildFinalStrip();
  }, [role, room, roomId, rounds, totalRounds]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 960 },
          height: { ideal: 1200 }
        },
        audio: false
      });
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
      setStatus("Camera ready. Press ready when you want to start.");
    } catch {
      setStatus("Camera access failed. Allow camera permission and try again.");
    }
  };

  const captureAndUpload = async (roundNumber: number) => {
    if (!videoRef.current || !captureCanvasRef.current) return;
    const canvas = captureCanvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;
    canvas.width = width;
    canvas.height = height;
    context.save();
    context.translate(width, 0);
    context.scale(-1, 1);
    context.drawImage(videoRef.current, 0, 0, width, height);
    context.restore();

    const scaledCanvas = document.createElement("canvas");
    scaledCanvas.width = 480;
    scaledCanvas.height = Math.round((height / width) * 480);
    scaledCanvas.getContext("2d")?.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);

    setFlash(true);
    window.setTimeout(() => setFlash(false), 220);

    const dataUrl = scaledCanvas.toDataURL("image/jpeg", 0.58);
    await saveRoundImage(roomId, roundNumber, role, dataUrl);
    setStatus("Your round photo is saved. Waiting for the other phone.");
  };

  const copyInvite = async () => {
    const link = `${window.location.origin}/live/room?room=${roomId}&role=guest&name=Partner`;
    await navigator.clipboard.writeText(link);
    setStatus("Invite link copied.");
  };

  const readyUp = async () => {
    await setParticipantReady(roomId, role, true);
    setStatus("Ready sent.");
  };

  const startRound = async () => {
    if (!room) return;
    setBusy(true);
    try {
      await startCountdown(roomId, room.currentRound);
    } finally {
      setBusy(false);
    }
  };

  const buildFinalStrip = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1100;
    canvas.height = Math.round(canvas.width / activeTemplate.aspectRatio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
      });

    const drawRoundedRect = (
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    ctx.fillStyle = "#ffe9f2";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#b34d7e";
    ctx.font = "76px cursive";
    ctx.textAlign = "center";
    ctx.fillText("Our Live Booth", canvas.width / 2, 120);

    ctx.fillStyle = "#d97aa5";
    ctx.fillRect(canvas.width * 0.2, 156, canvas.width * 0.6, 12);

    const contentTop = 220;
    const contentBottom = 170;
    const contentHeight = canvas.height - contentTop - contentBottom;

    for (const [index, slot] of activeTemplate.slots.entries()) {
      const round = index + 1;
      const data = rounds[round];
      if (!data.hostImage || !data.guestImage) return;
      const hostImage = await loadImage(data.hostImage);
      const guestImage = await loadImage(data.guestImage);
      const cardX = slot.x * canvas.width;
      const cardY = contentTop + slot.y * contentHeight;
      const cardWidth = slot.width * canvas.width;
      const cardHeight = slot.height * contentHeight;
      const radius = slot.radius ?? 24;
      const innerPadding = Math.max(16, Math.min(cardWidth, cardHeight) * 0.06);
      const innerGap = Math.max(10, innerPadding * 0.55);
      const labelHeight = Math.max(18, Math.min(42, cardHeight * 0.18));
      const photoAreaHeight = cardHeight - innerPadding * 2 - labelHeight;
      const photoWidth = (cardWidth - innerPadding * 2 - innerGap) / 2;
      const photoHeight = Math.max(40, photoAreaHeight);
      const photoY = cardY + innerPadding + labelHeight;

      ctx.fillStyle = "#fff8fb";
      drawRoundedRect(cardX, cardY, cardWidth, cardHeight, radius);
      ctx.fill();
      ctx.fillStyle = "#b9537f";
      ctx.font = `${Math.max(18, Math.min(30, cardHeight * 0.14))}px sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(`Round ${round}`, cardX + innerPadding, cardY + innerPadding + labelHeight * 0.7);

      const leftX = cardX + innerPadding;
      const rightX = leftX + photoWidth + innerGap;

      [hostImage, guestImage].forEach((image, index) => {
        const x = index === 0 ? leftX : rightX;
        ctx.save();
        drawRoundedRect(x, photoY, photoWidth, photoHeight, Math.max(16, radius * 0.7));
        ctx.clip();
        ctx.drawImage(image, x, photoY, photoWidth, photoHeight);
        ctx.restore();
      });
    }

    ctx.fillStyle = "#a45b7b";
    ctx.font = "34px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Download before leaving the room", canvas.width / 2, canvas.height - 42);

    const dataUrl = canvas.toDataURL("image/png");
    setFinalStrip(dataUrl);
    await advanceRoom(roomId, "complete", totalRounds);
  };

  const downloadStrip = () => {
    if (!finalStrip) return;
    const link = document.createElement("a");
    link.href = finalStrip;
    link.download = `${roomId.toLowerCase()}-live-strip.png`;
    link.click();
  };

  const editStrip = () => {
    if (!finalStrip) return;
    importComposedStrip(finalStrip, {
      title: `${roomId} Live Booth`,
      message: "Edited after our live session"
    });
    router.push("/editor");
  };

  const partner = room?.participants[partnerRole];
  const bothReady = Boolean(room?.participants.host.ready && room?.participants.guest.ready);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-berry">Live room {roomId}</div>
            <h2 className="mt-2 text-3xl font-semibold text-roseInk">{displayName} • {role}</h2>
            <p className="mt-2 text-sm text-rose-700/80">
              Partner: {partner?.joined ? `${partner.name} • ${partner.ready ? "Ready" : "Connected"}` : "Waiting"}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-rose-500">
              Template: {activeTemplate.name} • {totalRounds} rounds
            </p>
          </div>
          <button className="button-secondary gap-2" onClick={copyInvite}>
            <Copy className="h-4 w-4" />
            Copy invite link
          </button>
        </div>

        <div className="relative overflow-hidden rounded-[28px] bg-rose-950">
          <video ref={videoRef} className="aspect-[3/4] w-full object-cover [transform:scaleX(-1)]" muted playsInline />
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-[120px] font-bold text-white">
              {countdown}
            </div>
          )}
          {flash && <div className="absolute inset-0 bg-white/80" />}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button className="button-secondary" onClick={startCamera}>
            Start camera
          </button>
          <button className="button-secondary" onClick={readyUp} disabled={!cameraReady}>
            I&apos;m ready
          </button>
          <button
            className="button-primary"
            onClick={startRound}
            disabled={!cameraReady || role !== "host" || !bothReady || busy || room?.phase === "complete"}
          >
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            Start round
          </button>
        </div>

        <div className="mt-4 rounded-[24px] border border-rose-100 bg-white/70 p-4 text-sm leading-7 text-rose-700/80">
          {status}
        </div>
      </div>

      <div className="space-y-6">
        <div className="panel p-5">
          <h3 className="text-lg font-semibold text-roseInk">Shared strip progress</h3>
          <div className="mt-4 grid gap-4">
            {roundNumbers.map((roundNumber) => {
              const round = rounds[roundNumber] ?? emptyRound(roundNumber);
              return (
                <div key={roundNumber} className="rounded-[24px] border border-rose-100 bg-white/70 p-4">
                  <p className="mb-3 font-medium text-roseInk">Round {roundNumber}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Host", src: round.hostImage },
                      { label: "Guest", src: round.guestImage }
                    ].map((item) => (
                      <div key={item.label} className="overflow-hidden rounded-[20px] border border-rose-100 bg-rose-50">
                        {item.src ? (
                          <img src={item.src} alt={`${item.label} round ${roundNumber}`} className="aspect-[3/4] w-full object-cover" />
                        ) : (
                          <div className="flex aspect-[3/4] items-center justify-center text-sm text-rose-400">
                            {item.label} photo
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel p-5">
          <h3 className="text-lg font-semibold text-roseInk">Final strip</h3>
          {finalStrip ? (
            <>
              <img src={finalStrip} alt="Final live booth strip" className="mt-4 w-full rounded-[24px] border border-rose-100" />
              <button className="button-primary mt-4 gap-2" onClick={downloadStrip}>
                <Download className="h-4 w-4" />
                Download strip
              </button>
              <button className="button-secondary mt-3 gap-2" onClick={editStrip}>
                <WandSparkles className="h-4 w-4" />
                Edit in editor
              </button>
            </>
          ) : (
            <p className="mt-3 text-sm text-rose-700/80">
              Complete all {totalRounds} rounds and the final strip will appear here for both people.
            </p>
          )}
        </div>
      </div>

      <canvas ref={captureCanvasRef} className="hidden" />
    </div>
  );
}
