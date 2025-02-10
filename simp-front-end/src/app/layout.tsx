import type { Metadata } from "next";
import { Abril_Fatface, Merriweather, Lobster } from "next/font/google";
import "./globals.css";

const abrilFatface = Abril_Fatface({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-abril',
});

const merriweather = Merriweather({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-merriweather',
});


const lobster = Lobster({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-allura",
});

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
      <body className={`${abrilFatface.variable} ${merriweather.variable} ${lobster.variable}`}>
        {children}
      </body>
    </html>
  );
}
