import { NextResponse, type NextRequest } from "next/server"

import { auth0 } from "./lib/authentication/auth0"

export async function middleware(request: NextRequest) {
    const authRes = await auth0.middleware(request)
  
    if (request.nextUrl.pathname.startsWith("/auth")) {
      return authRes
    }

    fetchProtectedData()

    return authRes
  }

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}


async function fetchProtectedData() {
  const token = await auth0.getAccessToken(); // Get the token dynamically

  const response = await fetch("http://127.0.0.1:8000/protected", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token.token}`, // Send token in Authorization header
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }

  return response.json();
}
