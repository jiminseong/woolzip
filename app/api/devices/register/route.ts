import { NextResponse } from "next/server";
import { createSupabaseServerClient, getSession } from "@/lib/supabase/server";

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

  return NextResponse.json({ ok: true });
}
