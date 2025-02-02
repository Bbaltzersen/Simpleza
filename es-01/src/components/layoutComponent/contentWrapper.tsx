"use client";

import React, { useRef, useState, useEffect } from "react";
import { isOpen } from "../headerComponent/headerMenu/navMenuButton/navMenuButton";
import styles from "./contentWrapper.module.css";

interface ContentWrapperProps {
  children: React.ReactNode;
}

export default function ContentWrapper({ children }: ContentWrapperProps) {
  const [, setRender] = useState(false);
  
    useEffect(() => {
      const rerender = () => setRender(prev => !prev);
      return isOpen.subscribe(rerender);
    }, []);
    
  return (
    <div
      className={`${styles.contentWrapper} ${isOpen.value ? styles.overlay : ""}`}
      onClick={isOpen.value ? () => (isOpen.value = false) : undefined}
    >
      {children}
    </div>
  );
}
