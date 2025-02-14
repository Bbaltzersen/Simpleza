import { NextResponse, NextRequest } from "next/server";
import { retrieveAuth, clearAuth } from "@/lib/api/authentication/auth";

export async function middleware(request: NextRequest) {
}

// ** Force middleware to run in Node.js runtime instead of Edge **
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
  runtime: "nodejs",
};
