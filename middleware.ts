import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/login", "/signup"];

async function isAuthenticated(req: NextRequest) {
  const token = req.cookies.get("mq_session")?.value;
  if (!token) return false;
  const raw = process.env.AUTH_SECRET;
  if (!raw) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(raw));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/socket.io") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const authed = await isAuthenticated(req);

  if (!authed && !PUBLIC_PATHS.includes(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (authed && PUBLIC_PATHS.includes(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
