"use client";

import React, { useRef } from "react";
import { useNavMenu } from "@/context/navMenuContext";
import styles from "./navMenu.module.css";

const NavMenu: React.FC = () => {
  const navMenuRef = useRef<HTMLDivElement>(null);
  const { isOpen } = useNavMenu();

  return (
    <nav ref={navMenuRef} className={`${styles.navMenu} ${isOpen ? styles.open : ""}`}>
      <a href="#" className={styles.navLink}>Home</a>
      <a href="#" className={styles.navLink}>About</a>
      <a href="#" className={styles.navLink}>Contact</a>
    </nav>
  );
};

export default NavMenu;