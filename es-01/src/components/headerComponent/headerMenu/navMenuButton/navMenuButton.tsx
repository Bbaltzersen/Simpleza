"use client";

import React, { useEffect, useState } from "react";
import { signal } from "@preact/signals-react";
import styles from "./navMenuButton.module.css";

export const isOpen = signal(false);

const NavMenuButton: React.FC = () => {
  const [, setRender] = useState(false);

  useEffect(() => {
    const rerender = () => setRender(prev => !prev);
    const unsubscribe = isOpen.subscribe(rerender);
    return unsubscribe;
  }, []);

  const handleToggle = () => {
    isOpen.value = !isOpen.value;
  };

  return (
    <div className={styles.menuWrapper} onClick={handleToggle}>
      <div className={`${styles.menuButton} ${isOpen.value ? styles.open : ""}`}>
        <span className={styles.menuLine} />
        <span className={styles.menuLine} />
        <span className={styles.menuLine} />
      </div>
    </div>
  );
};

export default NavMenuButton;
