import { STICKER_LIBRARY } from "./photobooth-data";
import { getFilterCss, getTemplate } from "./photobooth-utils";
import { SessionState } from "@/types/photobooth";

async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
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
}

function getFontFamily(fontId: SessionState["frame"]["font"]) {
  if (fontId === "script") {
    return "Brush Script MT, Segoe Script, cursive";
  }
  if (fontId === "serif") {
    return "Georgia, serif";
  }
  return "Arial, sans-serif";
}

export async function exportPhotoboothImage(
  state: SessionState,
  quality: "standard" | "high",
  format: "png" | "jpg"
) {
  const template = getTemplate(state.templateId);
  const width = quality === "high" ? 1800 : 1080;
  const height = Math.round(width / template.aspectRatio);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas export is not supported.");
  }

  const { frame } = state;
  ctx.fillStyle = frame.backgroundColor;
  ctx.fillRect(0, 0, width, height);

  const basePadding = frame.outerPadding * (width / 1080);
  const borderRadius = frame.cornerStyle === "rounded" ? 42 : 4;
  const scaleUnit = width / 1080;
  const availableWidth = width - basePadding * 2;
  const availableHeight = height - basePadding * 2;

  ctx.fillStyle = frame.textColor;
  ctx.textAlign = "center";
  ctx.font = `${42 * scaleUnit}px ${getFontFamily(frame.font)}`;
  ctx.fillText(frame.title || "Photobooth", width / 2, basePadding * 0.9);

  const photosById = Object.fromEntries(state.photos.map((photo) => [photo.id, photo]));

  for (const slot of template.slots) {
    const placement = state.placements[slot.id];
    const x = basePadding + slot.x * availableWidth;
    const y = basePadding + slot.y * availableHeight;
    const slotWidth = slot.width * availableWidth - frame.gap * scaleUnit;
    const slotHeight = slot.height * availableHeight - frame.gap * scaleUnit;
    const radius = frame.cornerStyle === "rounded" ? (slot.radius ?? 28) * scaleUnit : 2;

    ctx.save();
    drawRoundedRect(ctx, x, y, slotWidth, slotHeight, radius);
    ctx.fillStyle = "#fffaf7";
    ctx.fill();
    ctx.lineWidth = frame.borderThickness * scaleUnit;
    ctx.strokeStyle = frame.borderColor;
    ctx.stroke();

    if (placement) {
      const photo = photosById[placement.photoId];
      if (photo) {
        const image = await loadImage(photo.dataUrl);
        ctx.save();
        drawRoundedRect(ctx, x, y, slotWidth, slotHeight, radius);
        ctx.clip();
        ctx.filter = getFilterCss(placement.filter);
        ctx.translate(x + slotWidth / 2 + placement.offsetX * scaleUnit, y + slotHeight / 2 + placement.offsetY * scaleUnit);
        ctx.rotate((placement.rotation * Math.PI) / 180);
        const coverScale = Math.max(slotWidth / image.width, slotHeight / image.height) * placement.zoom;
        ctx.drawImage(
          image,
          (-image.width * coverScale) / 2,
          (-image.height * coverScale) / 2,
          image.width * coverScale,
          image.height * coverScale
        );
        ctx.filter = "none";
        ctx.restore();
      }
    }

    ctx.restore();
  }

  const footerY = height - basePadding * 1.2;
  ctx.fillStyle = frame.textColor;
  ctx.font = `${28 * scaleUnit}px ${getFontFamily(frame.font)}`;
  ctx.fillText(frame.message || "Made with love", width / 2, footerY - 36 * scaleUnit);
  ctx.font = `${22 * scaleUnit}px ${getFontFamily(frame.font)}`;
  ctx.fillText(frame.dateText, width / 2, footerY);

  const sortedStickers = [...state.stickers].sort((a, b) => a.zIndex - b.zIndex);
  for (const sticker of sortedStickers) {
    const library = STICKER_LIBRARY.find((item) => item.kind === sticker.kind);
    ctx.save();
    ctx.translate((sticker.x / 100) * width, (sticker.y / 100) * height);
    ctx.rotate((sticker.rotation * Math.PI) / 180);
    ctx.fillStyle = sticker.color ?? library?.color ?? frame.textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${72 * sticker.scale * scaleUnit}px ${getFontFamily(frame.font)}`;
    ctx.fillText(sticker.label, 0, 0);
    ctx.restore();
  }

  if (format === "jpg") {
    return canvas.toDataURL("image/jpeg", quality === "high" ? 0.95 : 0.88);
  }
  return canvas.toDataURL("image/png");
}
