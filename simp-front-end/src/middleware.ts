import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
    const token = await fetchAccessToken();

    if (!token) {
        console.error("Failed to retrieve access token.");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const protectedData = await fetchProtectedData(token);
        console.log("Protected Data:", protectedData);
    } catch (error) {
        console.error("Error fetching protected data:", error);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    ],
};

async function fetchAccessToken() {
    try {
        const response = await fetch("http://127.0.0.1:8000/token");
        
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

async function fetchProtectedData(token: string) {
    try {
        console.log("Using Token:", token); // Debugging

        const response = await fetch("http://127.0.0.1:8000/protected", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`, 
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch protected data: ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error("Error in fetchProtectedData:", error);
        throw error;
    }
}
