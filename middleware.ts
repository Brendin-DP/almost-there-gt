import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { getSessionSecretKey } from "@/lib/auth/session-secret";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const secret = getSessionSecretKey();
    try {
      await jwtVerify(token, secret, { algorithms: ["HS256"] });
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
