import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "supabase url and anon key are not set" }, { status: 500 });
  }

  const { intent, email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "email and password are required" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, anonKey);

  if (intent === "signup") {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    if (data.user && serviceKey) {
      const admin = createClient(supabaseUrl, serviceKey);
      await admin.from("profiles").upsert({
        auth_user_id: data.user.id,
        display_name: email.split("@")[0]
      }, { onConflict: "auth_user_id" });
    }

    return NextResponse.json({
      message: data.session ? "account created and signed in" : "account created. check email if confirmation is enabled.",
      userId: data.user?.id ?? null
    });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return NextResponse.json({ error: error.message }, { status: 401 });

  const response = NextResponse.json({
    message: "signed in. this workspace can now attach saved data to your account.",
    userId: data.user.id
  });

  response.cookies.set("dl_access_token", data.session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: data.session.expires_in
  });

  response.cookies.set("dl_refresh_token", data.session.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  return response;
}
