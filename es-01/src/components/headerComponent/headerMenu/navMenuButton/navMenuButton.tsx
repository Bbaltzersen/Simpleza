"use client";

import React, { useEffect, useRef } from "react";
import eventEmitter from "@/lib/eventEmitter";
import styles from "./navMenuButton.module.css";

const NavMenuButton: React.FC = () => {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleMenuClose = () => {
      if (checkboxRef.current) {
        checkboxRef.current.checked = false;
      }
    };

    eventEmitter.on("menuClose", handleMenuClose);
    return () => eventEmitter.off("menuClose", handleMenuClose);
  }, []);

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isOpen = e.target.checked;
    eventEmitter.emit("menuToggle", isOpen);
  };

  return (
    <div className={styles.menuWrapper}>
      <input
        type="checkbox"
        id="menu-toggle"
        className={styles.menuCheckbox}
        onChange={handleToggle}
        ref={checkboxRef}
      />
      <label htmlFor="menu-toggle" className={styles.menuButton}>
        <span className={styles.menuLine} />
        <span className={styles.menuLine} />
        <span className={styles.menuLine} />
      </label>
    </div>
  );
};

export default NavMenuButton;
