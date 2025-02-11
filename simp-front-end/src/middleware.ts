import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "./lib/authentication/auth0";

export async function middleware(request: NextRequest) {
  // Attempt to retrieve an access token from our API
  const token = await fetchAccessToken();

  if (!token) {
    console.error("Failed to retrieve access token.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify if the token is valid and corresponds to an authenticated user
  try {
    const user = await fetchUserFromToken(token);
    console.log("Authenticated User:", user);

    // If the user is logged in (valid token), continue processing
  } catch (error) {
    console.error("User authentication failed:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Finally, delegate to the Auth0 middleware for additional security checks
  return auth0.middleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

async function fetchAccessToken(): Promise<string | null> {
  try {
    const response = await fetch("http://127.0.0.1:8000/v1/token");
    if (!response.ok) {
      throw new Error(`Failed to fetch token: ${response.statusText}`);
    }
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error fetching access token:", error);
    return null;
  }
}

// Fetch and verify user details using the token
async function fetchUserFromToken(token: string): Promise<any> {
  try {
    const response = await fetch("http://127.0.0.1:8000/v1/protected", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.statusText}`);
    }
    const user = await response.json();
    return user;  // If the response is valid, the user is logged in
  } catch (error) {
    console.error("Error verifying user from token:", error);
    throw new Error("User authentication failed.");
  }
}
