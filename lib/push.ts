import webpush, { PushSubscription } from "web-push";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
};

function getVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const contact = process.env.PUSH_CONTACT_EMAIL || "mailto:push@woolzip.app";
  if (!publicKey || !privateKey) {
    throw new Error("Missing VAPID keys. Set NEXT_PUBLIC_VAPID_KEY and VAPID_PRIVATE_KEY.");
  }
  return { publicKey, privateKey, contact };
}

let vapidInitialized = false;
function ensureVapid() {
  if (vapidInitialized) return;
  const { publicKey, privateKey, contact } = getVapid();
  webpush.setVapidDetails(contact.startsWith("mailto:") ? contact : `mailto:${contact}`, publicKey, privateKey);
  vapidInitialized = true;
}

export async function sendWebPush(subscriptionJson: string, payload: PushPayload) {
  ensureVapid();
  let subscription: PushSubscription;
  try {
    subscription = JSON.parse(subscriptionJson);
  } catch {
    throw new Error("Invalid push subscription");
  }

  await webpush.sendNotification(subscription, JSON.stringify(payload), { TTL: 60 * 60 });
}
