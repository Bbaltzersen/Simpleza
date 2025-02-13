"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// Define your own session data type (adjust properties as needed)
export interface SessionData {
  user: {
    id: string;
    username: string;
    // Add additional user properties here.
  };
  token: string;
}

const SessionContext = createContext<SessionData | null>(null);

async function fetchProtectedData(): Promise<SessionData> {
  const response = await fetch("http://127.0.0.1:8000/v1/protected", {
    method: "GET",
    credentials: "include", // ensures cookies are sent
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch session data");
  }

  return response.json();
}

export function useSession() {
  return useContext(SessionContext);
}

export function SessionHandler({
  session,
  children,
}: {
  session: SessionData | null;
  children: React.ReactNode;
}) {
  const [sessionData, setSessionData] = useState<SessionData | null>(session);

  useEffect(() => {
    async function fetchSession() {
      try {
        const data = await fetchProtectedData();
        setSessionData(data);
      } catch (error) {
        console.error("Failed to fetch session", error);
      }
    }
    if (!sessionData) {
      fetchSession();
    }
  }, [sessionData]);

  return <SessionContext.Provider value={sessionData}>{children}</SessionContext.Provider>;
}
