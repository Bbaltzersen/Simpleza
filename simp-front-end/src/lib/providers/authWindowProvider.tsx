// File: /lib/providers/authWindowProvider.tsx
"use client";

import React from "react";
import { AuthWindowProvider } from "@/lib/context/authWindowContext";

export default function AuthWindow({ children }: { children: React.ReactNode }) {
  return <AuthWindowProvider>{children}</AuthWindowProvider>;
}
