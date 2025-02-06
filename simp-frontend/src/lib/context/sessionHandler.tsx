"use client";

import React, { createContext, useContext } from "react";
import { SessionData } from "@auth0/nextjs-auth0/types";

const SessionContext = createContext<SessionData | null>(null);

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


export function useSession() {
  return useContext(SessionContext);
}

export function SessionHandler({ session, children }: { session: SessionData | null; children: React.ReactNode }) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}
