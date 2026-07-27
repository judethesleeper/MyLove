"use client";

import { useState } from "react";
import { Clipboard, Download, RefreshCcw } from "lucide-react";
import { exportPhotoboothImage } from "@/lib/photobooth-export";
import { usePhotobooth } from "./photobooth-provider";

export function ExportControls() {
  const { state, resetSession } = usePhotobooth();
  const [resolution, setResolution] = useState<"standard" | "high">("high");
  const [format, setFormat] = useState<"png" | "jpg">("png");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const generate = async () => {
    setBusy(true);
    try {
      const dataUrl = await exportPhotoboothImage(state, resolution, format);
      return dataUrl;
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    const dataUrl = await generate();
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `cute-photobooth.${format}`;
    link.click();
    setMessage("Downloaded. You can start a fresh session whenever you want.");
  };

  const copyToClipboard = async () => {
    try {
      const dataUrl = await generate();
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setMessage("Copied to clipboard.");
    } catch {
      setMessage("Clipboard copy is not supported in this browser.");
    }
  };

  return (
    <div className="panel p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-roseInk">Export & download</h2>
        <p className="text-sm text-rose-700/80">
          Export photos, frame, filters, stickers, and text as a clean final strip.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-roseInk">File format</label>
          <select
            className="select-base"
            value={format}
            onChange={(event) => setFormat(event.target.value as "png" | "jpg")}
          >
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-roseInk">Resolution</label>
          <select
            className="select-base"
            value={resolution}
            onChange={(event) => setResolution(event.target.value as "standard" | "high")}
          >
            <option value="standard">Standard</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button className="button-primary gap-2" onClick={download} disabled={busy}>
          <Download className="h-4 w-4" />
          Download
        </button>
        <button className="button-secondary gap-2" onClick={copyToClipboard} disabled={busy}>
          <Clipboard className="h-4 w-4" />
          Copy image
        </button>
        <button className="button-secondary gap-2" onClick={resetSession}>
          <RefreshCcw className="h-4 w-4" />
          Start new session
        </button>
      </div>

      {message && <p className="mt-4 text-sm text-rose-700/80">{message}</p>}
    </div>
  );
}
