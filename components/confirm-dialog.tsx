"use client";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-rose-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[32px] border border-white/70 bg-white p-6 shadow-dreamy">
        <h2 className="text-xl font-semibold text-roseInk">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-rose-700/80">{description}</p>
        <div className="mt-6 flex gap-3">
          <button className="button-secondary flex-1" onClick={onCancel}>
            Cancel
          </button>
          <button className="button-primary flex-1" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
