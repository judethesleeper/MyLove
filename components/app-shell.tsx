import Link from "next/link";
import { StepIndicator } from "./step-indicator";

const steps = [
  { label: "Landing", href: "/" },
  { label: "Camera", href: "/camera" },
  { label: "Editor", href: "/editor" },
  { label: "Preview", href: "/preview" }
];

export function AppShell({
  currentPath,
  title,
  description,
  children
}: {
  currentPath: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 rounded-[32px] border border-white/60 bg-white/60 p-5 shadow-dreamy backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/" className="text-sm font-semibold uppercase tracking-[0.2em] text-berry">
            Cute Online Photobooth
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-roseInk sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-rose-700/80 sm:text-base">{description}</p>
        </div>
        <StepIndicator steps={steps} currentStep={currentPath} />
      </div>
      {children}
    </main>
  );
}
