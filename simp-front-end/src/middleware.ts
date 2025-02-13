import { NextResponse, NextRequest } from "next/server";
import { retrieveAuth, clearAuth } from "@/lib/authentication/auth";

export async function middleware(request: NextRequest) {
  try {
    console.debug("Middleware invoked.");

    // Check for authentication
    const user = await retrieveAuth();

    if (!user) {
      console.error("Unauthorized: No valid auth session found.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.debug(`User authenticated: ${user.username} (Role: ${user.role})`);
    return NextResponse.next();
  } catch (error: any) {
    console.error("Middleware encountered an error:", error);
    
    // Optionally clear auth session if something goes wrong
    await clearAuth();

    return NextResponse.json({ error: "Middleware error: " + error.message }, { status: 500 });
  }
}

// ** Force middleware to run in Node.js runtime instead of Edge **
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
  runtime: "nodejs",
};
