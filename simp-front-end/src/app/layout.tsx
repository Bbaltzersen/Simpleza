import type { Metadata } from "next";
import "./globals.css";

import { AuthProvider } from "@/lib/context/authContext";
import AuthWindow from "@/lib/providers/authWindowProvider";
import AuthModal from "@/components/authWindow/authWindow";

export const metadata: Metadata = {
  title: "Simpleza",
  description: "One step at a time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
