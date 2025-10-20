"use client";

import { AutoGenerateProvider } from "@/contexts/auto-generate-context";

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AutoGenerateProvider>
      {children}
    </AutoGenerateProvider>
  );
}
