import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

export const metadata: Metadata = {
  title: "울집 Woolzip",
  description: "하루 10초, 우리 가족 안심",
  applicationName: "울집 Woolzip",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192-apple.png",
  },
  appleWebApp: {
    capable: true,
    title: "울집",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-font="lg" data-contrast="false">
      <body className="bg-token-bg-subtle text-token-text-primary min-h-dvh">
        <div className="mx-auto max-w-md min-h-dvh flex flex-col">{children}</div>
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
