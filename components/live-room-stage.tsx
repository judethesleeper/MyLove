"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Copy, Download, LoaderCircle } from "lucide-react";
import {
  advanceRoom,
  saveRoundImage,
  setParticipantReady,
  startCountdown,
  subscribeToLiveRoom,
  subscribeToRound
} from "@/lib/live-booth-service";
import type { LiveRole, LiveRoom, LiveRoundData } from "@/types/live-booth";

type RoundMap = Record<number, LiveRoundData>;

const EMPTY_ROUNDS: RoundMap = {
  1: { round: 1, hostImage: null, guestImage: null },
  2: { round: 2, hostImage: null, guestImage: null },
  3: { round: 3, hostImage: null, guestImage: null },
  4: { round: 4, hostImage: null, guestImage: null }
};

export function LiveRoomStage() {
  const params = useSearchParams();
  const roomId = (params.get("room") || "").toUpperCase();
  const role = (params.get("role") === "guest" ? "guest" : "host") as LiveRole;
  const displayName = params.get("name") || (role === "host" ? "Host" : "Guest");
  const partnerRole = role === "host" ? "guest" : "host";

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [room, setRoom] = useState<LiveRoom | null>(null);
  const [rounds, setRounds] = useState<RoundMap>(EMPTY_ROUNDS);
  const [status, setStatus] = useState("Loading room...");
  const [cameraReady, setCameraReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);
  const [finalStrip, setFinalStrip] = useState<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const handledRoundsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
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
      ...[1, 2, 3, 4].map((roundNumber) =>
        subscribeToRound(roomId, roundNumber, (round) => {
          if (!round) return;
          setRounds((current) => ({ ...current, [roundNumber]: round }));
        })
      )
    ];

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, [partnerRole, roomId]);

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
    if (currentRound < 4) {
      void advanceRoom(roomId, "waiting", currentRound + 1);
      return;
    }
    void buildFinalStrip();
  }, [role, room, roomId, rounds]);

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
    canvas.height = 2500;
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

    ctx.fillStyle = "#fff8fb";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#d94881";
    ctx.font = "76px cursive";
    ctx.textAlign = "center";
    ctx.fillText("Our Live Booth", canvas.width / 2, 120);

    for (let round = 1; round <= 4; round += 1) {
      const data = rounds[round];
      if (!data.hostImage || !data.guestImage) return;
      const hostImage = await loadImage(data.hostImage);
      const guestImage = await loadImage(data.guestImage);
      const cardX = 60;
      const cardY = 180 + (round - 1) * 580;
      const cardWidth = canvas.width - 120;
      const cardHeight = 520;
      const innerGap = 24;
      const photoWidth = (cardWidth - 64 - innerGap) / 2;
      const photoHeight = 408;
      const photoY = cardY + 72;

      ctx.fillStyle = "#ffeaf3";
      drawRoundedRect(cardX, cardY, cardWidth, cardHeight, 30);
      ctx.fill();
      ctx.fillStyle = "#b9537f";
      ctx.font = "30px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Round ${round}`, cardX + 24, cardY + 42);

      const leftX = cardX + 20;
      const rightX = leftX + photoWidth + innerGap;

      [hostImage, guestImage].forEach((image, index) => {
        const x = index === 0 ? leftX : rightX;
        ctx.save();
        drawRoundedRect(x, photoY, photoWidth, photoHeight, 24);
        ctx.clip();
        ctx.drawImage(image, x, photoY, photoWidth, photoHeight);
        ctx.restore();
      });
    }

    ctx.fillStyle = "#a45b7b";
    ctx.font = "34px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Download before leaving the room", canvas.width / 2, 2440);

    const dataUrl = canvas.toDataURL("image/png");
    setFinalStrip(dataUrl);
    await advanceRoom(roomId, "complete", 4);
  };

  const downloadStrip = () => {
    if (!finalStrip) return;
    const link = document.createElement("a");
    link.href = finalStrip;
    link.download = `${roomId.toLowerCase()}-live-strip.png`;
    link.click();
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
            {[1, 2, 3, 4].map((roundNumber) => {
              const round = rounds[roundNumber];
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
            </>
          ) : (
            <p className="mt-3 text-sm text-rose-700/80">
              Complete all 4 rounds and the final strip will appear here for both people.
            </p>
          )}
        </div>
      </div>

      <canvas ref={captureCanvasRef} className="hidden" />
    </div>
  );
}
