"use client";

import React, { createContext, useContext } from "react";
import { SessionData } from "@auth0/nextjs-auth0/types";

const SessionContext = createContext<SessionData | null>(null);

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ session, children }: { session: SessionData | null; children: React.ReactNode }) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}
