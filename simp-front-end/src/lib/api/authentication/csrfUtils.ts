/**
 * Retrieve CSRF token from cookies (Client-Side Only)
 */
export function getCSRFTokenFromCookies(): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(/(^| )csrf_token=([^;]+)/);
    return match ? decodeURIComponent(match[2]) : null;
  }
  