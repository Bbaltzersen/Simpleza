"use client";

import React from "react";
import { useNavMenu } from "@/context/navMenuContext";
import styles from "./contentWrapper.module.css";

interface ContentWrapperProps {
  children: React.ReactNode;
}

export default function ContentWrapper({ children }: ContentWrapperProps) {
  const { isOpen, closeMenu } = useNavMenu(); 

  return (
    <div
      className={`${styles.contentWrapper} ${isOpen ? styles.overlay : ""}`}
      onClick={isOpen ? closeMenu : undefined}
    >
      {children}
    </div>
  );
}
