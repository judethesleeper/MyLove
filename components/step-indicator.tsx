import clsx from "clsx";

export function StepIndicator({
  steps,
  currentStep
}: {
  steps: { label: string; href: string }[];
  currentStep: string;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {steps.map((step, index) => {
        const active = step.href === currentStep;
        return (
          <div
            key={step.href}
            className={clsx(
              "flex items-center gap-3 rounded-full border px-3 py-2 text-sm",
              active ? "border-berry bg-berry text-white" : "border-white/80 bg-white/70 text-roseInk"
            )}
          >
            <span
              className={clsx(
                "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                active ? "bg-white/20 text-white" : "bg-rose-100 text-roseInk"
              )}
            >
              {index + 1}
            </span>
            <span>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
