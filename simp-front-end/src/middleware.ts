import { NextResponse, NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
  runtime: "nodejs",
};
