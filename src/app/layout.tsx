import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yana — park first, then choose the road",
  description:
    "Find practical parking before you arrive, then compare broader roads instead of always taking the shortest route.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f4efe4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} h-full`}>
      <body className="min-h-full bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
