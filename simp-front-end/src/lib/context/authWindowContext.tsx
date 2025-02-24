"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface AuthWindowContextType {
  isOpen: boolean;
  windowType: "signin" | "register" | null;
  openWindow: (type: "signin" | "register") => void;
  closeWindow: () => void;
}

const AuthWindowContext = createContext<AuthWindowContextType | undefined>(undefined);

export const AuthWindowProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [windowType, setWindowType] = useState<"signin" | "register" | null>(null);

  const openWindow = (type: "signin" | "register") => {
    setWindowType(type);
    setIsOpen(true);
  };

  const closeWindow = () => {
    setWindowType(null);
    setIsOpen(false);
  };

  return (
    <AuthWindowContext.Provider value={{ isOpen, windowType, openWindow, closeWindow }}>
      {children}
    </AuthWindowContext.Provider>
  );
};

export const useAuthWindow = () => {
  const context = useContext(AuthWindowContext);
  if (!context) {
    throw new Error("useAuthWindow must be used within an AuthWindowProvider");
  }
  return context;
};