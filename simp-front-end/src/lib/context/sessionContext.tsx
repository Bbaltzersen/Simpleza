// SessionProvider.tsx (Server Component)
import Layout from "../../app/layout";
import { SessionHandler } from "@/lib/context/sessionHandler";

// Replace this with your own getSession function
async function getSession() {
  try {
    const response = await fetch("http://127.0.0.1:8000/v1/protected", {
      method: "GET",
      credentials: "include", 
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      console.error("Failed to fetch session:", response.statusText);
      return null;
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching session:", error);
    return null;
  }
}

export default async function SessionProvider({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <SessionHandler session={session}>
      <Layout>{children}</Layout>
    </SessionHandler>
  );
}
