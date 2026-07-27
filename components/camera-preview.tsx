"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, FlipHorizontal2, LoaderCircle, TimerReset } from "lucide-react";
import { usePhotobooth } from "./photobooth-provider";
import { PermissionError } from "./permission-error";

export function CameraPreview({
  retakePhotoId,
  onRetakeComplete
}: {
  retakePhotoId?: string | null;
  onRetakeComplete?: () => void;
}) {
  const { state, dispatch, addCapturedPhoto, replaceCapturedPhoto } = usePhotobooth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownRef = useRef<number | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready">("idle");
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let active = true;

    async function initCamera() {
      setStatus("loading");
      setError(null);

      try {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: state.cameraFacingMode },
            width: { ideal: 1280 },
            height: { ideal: 1600 }
          },
          audio: false
        });

        if (!active || !videoRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus("ready");
      } catch (cameraError) {
        setStatus("idle");
        setError(
          cameraError instanceof Error
            ? cameraError.message
            : "Camera permission was denied or no camera is available."
        );
      }
    }

    void initCamera();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [state.cameraFacingMode]);

  const takePhoto = async () => {
    if (!videoRef.current) {
      return;
    }

    for (let current = state.countdownSeconds; current > 0; current -= 1) {
      setCountdown(current);
      await new Promise((resolve) => {
        countdownRef.current = window.setTimeout(resolve, 1000);
      });
    }

    setCountdown(null);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 250);

    const canvas = document.createElement("canvas");
    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    context.save();
    context.translate(width, 0);
    context.scale(-1, 1);
    context.drawImage(videoRef.current, 0, 0, width, height);
    context.restore();

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    if (retakePhotoId) {
      replaceCapturedPhoto(retakePhotoId, dataUrl);
      onRetakeComplete?.();
      return;
    }
    addCapturedPhoto(dataUrl);
  };

  return (
    <div className="panel overflow-hidden p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-roseInk">Camera</h2>
          <p className="text-sm text-rose-700/80">
            {retakePhotoId ? "Capture a replacement for the selected photo." : "Choose front or back camera, then capture your shots."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="button-secondary gap-2"
            onClick={() =>
              dispatch({
                type: "set-camera-facing",
                facing: state.cameraFacingMode === "user" ? "environment" : "user"
              })
            }
            title="Switch camera"
          >
            <FlipHorizontal2 className="h-4 w-4" />
            Switch
          </button>
          <button
            className="button-secondary gap-2"
            onClick={() =>
              dispatch({
                type: "set-countdown",
                countdown: state.countdownSeconds === 3 ? 5 : 3
              })
            }
            title="Toggle countdown"
          >
            <TimerReset className="h-4 w-4" />
            {state.countdownSeconds}s
          </button>
        </div>
      </div>

      {error ? <PermissionError message={error} /> : null}

      <div className="relative mt-4 overflow-hidden rounded-[28px] bg-rose-950">
        <video ref={videoRef} className="aspect-[3/4] w-full object-cover [transform:scaleX(-1)]" muted playsInline />
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-rose-950/35 text-white">
            <LoaderCircle className="h-8 w-8 animate-spin" />
          </div>
        )}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/25 text-[120px] font-bold text-white">
            {countdown}
          </div>
        )}
        {flash && <div className="absolute inset-0 animate-pulse bg-white/80" />}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-rose-700/80">
          Camera access stays in the browser only. If permission is denied, use your browser site settings to allow it.
        </p>
        <button className="button-primary gap-2" onClick={takePhoto} disabled={status !== "ready"}>
          <Camera className="h-4 w-4" />
          {retakePhotoId ? "Retake photo" : "Capture"}
        </button>
      </div>
    </div>
  );
}
