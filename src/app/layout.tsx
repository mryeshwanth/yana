import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yana",
  description: "Park first, then choose a broader road.",
  applicationName: "Yana",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Yana",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f97316",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-paper font-sans text-ink antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
