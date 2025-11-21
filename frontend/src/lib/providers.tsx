"use client";

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  console.log("Rendering Providers");
  return <SessionProvider>{children}</SessionProvider>;
}