"use client";

import React from "react";
import eventEmitter from "@/lib/eventEmitter";
import styles from "./navMenuButton.module.css";

const NavMenuButton: React.FC = () => {
  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isOpen = e.target.checked; // Get the current state of the checkbox
    eventEmitter.emit("menuToggle", isOpen); // Emit the state
  };

  return (
    <div className={styles.menuWrapper}>
      <input
        type="checkbox"
        id="menu-toggle"
        className={styles.menuCheckbox}
        onChange={handleToggle}
      />
      <label htmlFor="menu-toggle" className={styles.menuButton}>
        <span className={styles.menuLine}></span>
        <span className={styles.menuLine}></span>
        <span className={styles.menuLine}></span>
      </label>
    </div>
  );
};

export default NavMenuButton;
