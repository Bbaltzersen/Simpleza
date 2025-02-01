"use client";

import React, { useState, useEffect } from "react";
import eventEmitter from "@/lib/eventEmitter";
import styles from "./contentWrapper.module.css";

interface ContentWrapperProps {
  children: React.ReactNode;
}

export default function ContentWrapper({ children }: ContentWrapperProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleToggle = (state: boolean) => setIsMenuOpen(state);
    
    eventEmitter.on("menuToggle", handleToggle);
    eventEmitter.on("menuClose", () => setIsMenuOpen(false));

    return () => {
      eventEmitter.off("menuToggle", handleToggle);
      eventEmitter.off("menuClose", () => setIsMenuOpen(false));
    };
  }, []);

  return (
    <div
      className={`${styles.contentWrapper} ${isMenuOpen ? styles.overlay : ""}`}
      onClick={isMenuOpen ? () => eventEmitter.emit("menuClose") : undefined} // Only track clicks if the menu is open
    >
      {children}
    </div>
  );
}
