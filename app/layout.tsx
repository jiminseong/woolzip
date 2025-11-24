import type { Metadata } from "next";
import "./globals.css";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

export const metadata: Metadata = {
  title: "울집 Woolzip",
  description: "하루 10초, 우리 가족 안심",
  applicationName: "울집 Woolzip",
  manifest: "/manifest.webmanifest",
  themeColor: "#10b981",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
    other: [
      {
        rel: "apple-touch-startup-image",
        url: "/splash_screens/iPhone_17_Pro_Max__iPhone_16_Pro_Max_portrait.png",
        media:
          "screen and (device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/splash_screens/iPhone_17_Pro__iPhone_17__iPhone_16_Pro_portrait.png",
        media:
          "screen and (device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/splash_screens/iPhone_16_Plus__iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max_portrait.png",
        media:
          "screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/splash_screens/iPhone_16__iPhone_15_Pro__iPhone_15__iPhone_14_Pro_portrait.png",
        media:
          "screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/splash_screens/iPhone_14_Plus__iPhone_13_Pro_Max__iPhone_12_Pro_Max_portrait.png",
        media:
          "screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/splash_screens/iPhone_16e__iPhone_14__iPhone_13_Pro__iPhone_13__iPhone_12_Pro__iPhone_12_portrait.png",
        media:
          "screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/splash_screens/iPhone_13_mini__iPhone_12_mini__iPhone_11_Pro__iPhone_XS__iPhone_X_portrait.png",
        media:
          "screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/splash_screens/iPhone_11_Pro_Max__iPhone_XS_Max_portrait.png",
        media:
          "screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/splash_screens/iPhone_11__iPhone_XR_portrait.png",
        media:
          "screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/splash_screens/iPhone_8_Plus__iPhone_7_Plus__iPhone_6s_Plus__iPhone_6_Plus_portrait.png",
        media:
          "screen and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/splash_screens/iPhone_8__iPhone_7__iPhone_6s__iPhone_6__4.7__iPhone_SE_portrait.png",
        media:
          "screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        rel: "apple-touch-startup-image",
        url: "/splash_screens/4__iPhone_SE__iPod_touch_5th_generation_and_later_portrait.png",
        media:
          "screen and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "울집",
    statusBarStyle: "default",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-font="md" data-contrast="false">
      <body className="bg-token-bg-subtle text-token-text-primary min-h-dvh">
        <div className="mx-auto max-w-md min-h-dvh flex flex-col">{children}</div>
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
