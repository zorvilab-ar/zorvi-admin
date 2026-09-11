import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isAuthRequired,
  isSupabaseConfigured,
} from "./config";
import { isAllowedAdmin } from "@/lib/auth/admins";

const PUBLIC_PATHS = ["/login", "/auth/callback"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-zorvi-path", request.nextUrl.pathname);

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (!isAuthRequired()) return response;

  if (!isSupabaseConfigured()) {
    if (isPublicPath(request.nextUrl.pathname)) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "config");
    return NextResponse.redirect(url);
  }

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request: { headers: requestHeaders },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isPublicPath(request.nextUrl.pathname)) {
    if (user && isAllowedAdmin(user.email) && request.nextUrl.pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (!user || !isAllowedAdmin(user.email)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (user && !isAllowedAdmin(user.email)) {
      url.searchParams.set("error", "forbidden");
      await supabase.auth.signOut();
    }
    return NextResponse.redirect(url);
  }

  return response;
}
