import { NextResponse, NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let token = request.cookies.get("auth_token");

  if (!token) {
    // Perform hardcoded login
    const loginResponse = await fetch("http://127.0.0.1:8000/v1/authentication/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username: "admin",
        password: "password123",
      }).toString(),
    });

    if (loginResponse.ok) {
      const setCookie = loginResponse.headers.get("set-cookie");
      if (setCookie) {
        const response = NextResponse.next();
        response.headers.append("Set-Cookie", setCookie);
        return response;
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authResponse = await fetch("http://127.0.0.1:8000/v1/protected", {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!authResponse.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
