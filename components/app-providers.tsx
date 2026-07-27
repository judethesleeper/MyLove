"use client";

import { PhotoboothProvider } from "@/components/photobooth-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <PhotoboothProvider>{children}</PhotoboothProvider>;
}
