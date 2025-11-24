"use client";

import { useEffect, useMemo, useState } from "react";

type Status = "idle" | "granted" | "denied" | "loading" | "error";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

function detectDevice(): "ios" | "android" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}

async function registerDevice(pushToken: string, deviceType: "ios" | "android" | "desktop") {
  const res = await fetch("/api/devices/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pushToken, device_type: deviceType }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error?.message || "디바이스 등록에 실패했습니다");
  }
}

export default function PushPermissionToggle() {
  const vapidKey = useMemo(() => process.env.NEXT_PUBLIC_VAPID_KEY || "", []);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setStatus("error");
      setMessage("이 브라우저는 알림을 지원하지 않아요");
      return;
    }
    const perm = Notification.permission;
    if (perm === "granted") {
      setStatus("granted");
    } else if (perm === "denied") {
      setStatus("denied");
    } else {
      setStatus("idle");
    }
  }, []);

  const ensureSubscribed = async () => {
    if (!vapidKey) throw new Error("VAPID 키가 설정되지 않았습니다");
    if (!("serviceWorker" in navigator)) throw new Error("서비스워커를 지원하지 않습니다");

    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    let sub = existing;
    if (!sub) {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }
    await registerDevice(JSON.stringify(sub.toJSON()), detectDevice());
  };

  const requestPermission = async () => {
    try {
      setStatus("loading");
      setMessage(null);

      const result = await Notification.requestPermission();
      if (result !== "granted") {
        setStatus("denied");
        setMessage("알림 권한이 거부되었어요. 브라우저 설정에서 다시 허용해주세요.");
        return;
      }

      await ensureSubscribed();
      setStatus("granted");
      setMessage("푸시 알림이 활성화되었어요.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "푸시 설정 중 오류가 발생했습니다");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="font-medium">푸시 알림</div>
          <div className="text-xs text-token-text-secondary">
            설치된 앱에서 가족 알림을 바로 받아요
          </div>
        </div>
        <button
          type="button"
          onClick={requestPermission}
          disabled={status === "loading" || status === "granted"}
          className={`btn btn-primary h-10 px-3 text-sm ${
            status === "granted" ? "opacity-60 cursor-default" : ""
          }`}
        >
          {status === "granted" ? "활성화됨" : status === "loading" ? "설정 중..." : "활성화"}
        </button>
      </div>
      {message && <div className="text-xs text-token-text-secondary">{message}</div>}
      {status === "denied" && (
        <div className="text-xs text-token-signal-red">
          알림을 사용하려면 브라우저 설정에서 권한을 허용해주세요.
        </div>
      )}
    </div>
  );
}
