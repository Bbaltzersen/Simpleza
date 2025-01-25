import type { Metadata } from "next";
import { Abril_Fatface, Merriweather } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Esencial",
  description: "One step at a time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${abrilFatface.variable} ${merriweather.variable}`}>
        {children}
      </body>
    </html>
  );
}