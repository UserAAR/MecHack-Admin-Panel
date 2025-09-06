import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const PUBLIC_AUTH_PATHS = ["/auth/sign-in", "/auth/forgot-password", "/auth/reset-password"];

function isAuthPath(pathname: string) {
  return PUBLIC_AUTH_PATHS.some((p) => pathname.startsWith(p));
}

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/logo")
  );
}

function getWebsiteURL() {
  return process.env.NEXT_PUBLIC_PUBLIC_WEBSITE_URL || "/auth/sign-in";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicAsset(pathname)) {
    return NextResponse.next();
  }

  // If not an auth path and no auth cookie, redirect immediately
  if (!isAuthPath(pathname)) {
    const hasAccessToken = req.cookies.has("sb-access-token");
    const hasRefreshToken = req.cookies.has("sb-refresh-token");
    if (!hasAccessToken || !hasRefreshToken) {
      const url = new URL("/auth/sign-in", req.url);
      return NextResponse.redirect(url);
    }
  }

  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow auth pages for unauthenticated
  if (isAuthPath(pathname)) {
    if (user) {
      // If logged in and tries to visit sign-in, redirect to home
      return NextResponse.redirect(new URL("/", req.url));
    }
    return res;
  }

  // For all other pages, require auth and role guard
  if (!user) {
    return NextResponse.redirect(new URL("/auth/sign-in", req.url));
  }

  // Fetch profile with RLS (user can read own)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role as "user" | "admin" | "superadmin" | undefined;

  if (!role || (role !== "admin" && role !== "superadmin")) {
    // not allowed in admin panel, redirect to main site
    return NextResponse.redirect(new URL(getWebsiteURL(), req.url));
  }

  // superadmin-only sections guard
  const superAdminOnly = ["/users", "/system"]; // exact prefixes
  if (superAdminOnly.some((p) => pathname.startsWith(p)) && role !== "superadmin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

export const config = {
  matcher: "/:path*",
}; 