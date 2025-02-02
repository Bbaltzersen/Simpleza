"use client";

import React, { createContext, useContext, useState } from "react";

interface NavMenuContextType {
  isOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
}

const NavMenuContext = createContext<NavMenuContextType | undefined>(undefined);

export const NavMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(prev => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <NavMenuContext.Provider value={{ isOpen, toggleMenu, closeMenu }}>
      {children}
    </NavMenuContext.Provider>
  );
};

export const useNavMenu = (): NavMenuContextType => {
  const context = useContext(NavMenuContext);
  if (!context) {
    throw new Error("useNavMenu must be used within a NavMenuProvider");
  }
  return context;
};