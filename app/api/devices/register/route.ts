import { NextResponse } from "next/server";
import { createSupabaseServerClient, getSession } from "@/lib/supabase/server";
import { sendWebPush } from "@/lib/push";

type RegisterBody = {
  pushToken?: string;
  device_type?: "ios" | "android" | "desktop" | string;
};

export async function POST(req: Request) {
  const { session } = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: { code: "unauthorized", message: "로그인이 필요합니다" } },
      { status: 401 }
    );
  }

  let body: RegisterBody;
  try {
    body = (await req.json()) as RegisterBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "bad_request", message: "잘못된 요청 본문입니다" } },
      { status: 400 }
    );
  }

  const pushToken = typeof body.pushToken === "string" ? body.pushToken : "";
  const deviceTypeRaw = body.device_type?.toLowerCase();
  const deviceType: "ios" | "android" | "desktop" =
    deviceTypeRaw === "ios" || deviceTypeRaw === "android" ? deviceTypeRaw : "desktop";

  if (!pushToken || pushToken.length < 10) {
    return NextResponse.json(
      { ok: false, error: { code: "bad_request", message: "푸시 토큰이 없습니다" } },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await (supabase.from("devices") as any).upsert(
    {
      user_id: session.user.id,
      device_type: deviceType,
      push_token: pushToken,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "push_token" }
  );

  if (error) {
    return NextResponse.json(
      { ok: false, error: { code: "db_error", message: error.message } },
      { status: 500 }
    );
  }

  // push_opt_in 플래그 활성화 (설정이 없으면 upsert)
  await (supabase.from("settings") as any)
    .upsert({ user_id: session.user.id, push_opt_in: true }, { onConflict: "user_id" })
    .eq("user_id", session.user.id);

  // 테스트 푸시 전송 (사용자 디바이스에 확인용)
  try {
    await sendWebPush(pushToken, {
      title: "울집 푸시 알림이 켜졌어요",
      body: "알림을 받을 준비가 되었습니다.",
      url: "/",
      icon: "/icons/icon-192.png",
    });
  } catch (pushErr) {
    console.error("test push send error", pushErr);
    // 테스트 푸시 실패는 무시
  }

  return NextResponse.json({ ok: true });
}
