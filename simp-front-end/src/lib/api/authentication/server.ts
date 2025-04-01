// src/lib/auth/server.ts - CORRECTED with await cookies()

// Ensure this import is correct
import { cookies } from 'next/headers';

// Define your User type (ideally share this type definition)
export interface User {
  user_id: string;
  username: string;
  email: string;
  role: string;
}

const SESSION_COOKIE_NAME = 'sessionid'; // Replace if needed
const CSRF_COOKIE_NAME = 'csrf_token';   // Replace if needed

// validateSessionAndGetUser function should remain the same
// It accepts the cookie values and performs the API call
async function validateSessionAndGetUser(
    sessionId: string | undefined,
    csrfTokenFromCookie: string | undefined
): Promise<User | null> {
    // (Implementation from previous steps - check sessionID, API_BASE_URL, fetch, handle response)
    if (!sessionId) {
        console.log("[Server Auth] No session cookie found in validate function.");
        return null;
    }
    if (!process.env.API_BASE_URL) {
        console.error("[Server Auth] API_BASE_URL environment variable is not set.");
        return null;
    }
    const apiUrl = `${process.env.API_BASE_URL}/authentication/protected`;
    console.log(`[Server Auth] Calling API inside validate: ${apiUrl}`);
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Cookie': `${SESSION_COOKIE_NAME}=${sessionId}`,
                'X-CSRF-Token': csrfTokenFromCookie || '',
                'Accept': 'application/json',
            },
            cache: 'no-store',
        });
        console.log(`[Server Auth] API response status inside validate: ${response.status}`);
        if (response.ok) {
             const data = await response.json() as { user?: User, details?: string };
             if (data.user) {
                console.log("[Server Auth] User validated successfully inside validate.");
                return data.user;
             }
        }
        return null; // Default return if not found or error
    } catch (error) {
        console.error("[Server Auth] Error during server-side API call inside validate:", error);
        return null;
    }
}


export async function getCurrentUser(): Promise<User | null> {
    console.log("[Server Auth] getCurrentUser: Attempting to read cookies server-side...");

    try {
        // --- FIX: Await cookies() first, then call .get() ---
        // Await the cookies() function if it returns a Promise in your context
        const cookieStore = await cookies();
        console.log("[Server Auth] getCurrentUser: Awaited cookie store obtained.");

        // Call .get() synchronously on the resolved cookie store instance
        const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
        const csrfCookie = cookieStore.get(CSRF_COOKIE_NAME);
        // --- End FIX ---

        console.log(`[Server Auth] getCurrentUser: Found session cookie present: ${!!sessionCookie?.value}`);
        console.log(`[Server Auth] getCurrentUser: Found CSRF cookie present: ${!!csrfCookie?.value}`);

        // Pass the retrieved values to the validation function
        const user = await validateSessionAndGetUser(sessionCookie?.value, csrfCookie?.value);

        if (user) {
            console.log(`[Server Auth] getCurrentUser: User ${user.username} authenticated.`);
        } else {
            console.log("[Server Auth] getCurrentUser: User not authenticated.");
        }
        return user;

    } catch (error) {
        console.error("[Server Auth] Error occurred in getCurrentUser (potentially awaiting cookies):", error);
        // Catch potential errors during the cookie reading or validation process
        return null;
    }
}