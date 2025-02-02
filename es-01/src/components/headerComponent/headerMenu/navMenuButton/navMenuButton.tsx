"use client";

import React from "react";
import { useNavMenu } from "@/context/navMenuContext";
import styles from "./navMenuButton.module.css";

const NavMenuButton: React.FC = () => {
  const { isOpen, toggleMenu } = useNavMenu();

  return (
    <div className={styles.menuWrapper} onClick={toggleMenu}>
      <div className={`${styles.menuButton} ${isOpen ? styles.open : ""}`}>
        <span className={styles.menuLine} />
        <span className={styles.menuLine} />
        <span className={styles.menuLine} />
      </div>
    </div>
  );
};

export default NavMenuButton;