import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { isAllowedAdmin } from "@/lib/auth/admins";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code && isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && isAllowedAdmin(data.user?.email)) {
      return NextResponse.redirect(new URL(next, origin));
    }
    if (data.user && !isAllowedAdmin(data.user.email)) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login?error=forbidden", origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", origin));
}
