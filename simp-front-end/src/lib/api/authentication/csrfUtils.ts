// src/api/authentication/csrfUtils.ts (Example)

export function getCSRFTokenFromCookies(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  // --- !!! MAKE SURE THIS NAME MATCHES YOUR COOKIE !!! ---
  const cookieName = 'csrf_token'; // Or 'XSRF-TOKEN', or whatever your backend sets
  // --- !!! ---

  let csrfToken: string | null = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.startsWith(cookieName + '=')) {
        csrfToken = decodeURIComponent(cookie.substring(cookieName.length + 1));
        break;
      }
    }
  }
  // Add a log here for debugging if needed:
  // console.log(`getCSRFTokenFromCookies: Found token for name '${cookieName}'?`, csrfToken ? 'Yes' : 'No');
  return csrfToken;
}