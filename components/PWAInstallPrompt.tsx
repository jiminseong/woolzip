"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error - iOS Safari specific
    window.navigator.standalone === true
  );
}

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

const INSTALL_DISMISS_KEY = "pwa-install-dismissed";
const IOS_DISMISS_KEY = "pwa-ios-dismissed";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setStandalone(isStandalone());
    const media = window.matchMedia("(display-mode: standalone)");
    const handler = () => setStandalone(isStandalone());
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  // Register service worker
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  // Android/Desktop install prompt
  useEffect(() => {
    if (standalone) return;
    const dismissed = localStorage.getItem(INSTALL_DISMISS_KEY) === "1";
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [standalone]);

  // iOS add-to-home-screen hint
  useEffect(() => {
    if (standalone) return;
    if (!isIosSafari()) return;
    const dismissed = localStorage.getItem(IOS_DISMISS_KEY) === "1";
    if (!dismissed) {
      setShowIosHint(true);
    }
  }, [standalone]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setShowInstall(false);
      return;
    }
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    localStorage.setItem(INSTALL_DISMISS_KEY, "1");
    setShowInstall(false);
    setDeferredPrompt(null);
  };

  const dismissInstall = () => {
    localStorage.setItem(INSTALL_DISMISS_KEY, "1");
    setShowInstall(false);
  };

  const dismissIos = () => {
    localStorage.setItem(IOS_DISMISS_KEY, "1");
    setShowIosHint(false);
  };

  if (standalone) return null;

  return (
    <>
      {showInstall && (
        <div className="fixed bottom-4 right-4 max-w-xs rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
          <div className="text-sm font-semibold">울집을 설치해 알림 받기</div>
          <p className="mt-1 text-xs text-token-text-secondary">
            빠른 실행과 푸시 알림을 위해 홈 화면에 추가하세요.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button onClick={handleInstall} className="btn btn-primary flex-1 h-10">
              설치하기
            </button>
            <button
              onClick={dismissInstall}
              className="text-xs text-token-text-secondary hover:text-token-signal-green"
            >
              나중에
            </button>
          </div>
        </div>
      )}

      {showIosHint && (
        <div className="fixed bottom-4 left-4 right-4 mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">iOS 홈 화면에 추가</div>
              <p className="mt-1 text-xs text-token-text-secondary">
                Safari 공유 아이콘 → “홈 화면에 추가”를 눌러주세요. 설치 후 푸시 알림을 켤 수 있어요.
              </p>
            </div>
            <button
              onClick={dismissIos}
              className="text-xs text-token-text-secondary hover:text-token-signal-green"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
