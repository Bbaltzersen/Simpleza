"use client";

import React, { useEffect, useState } from "react";
import eventEmitter from "@/lib/eventEmitter";
import styles from "./navMenu.module.css";

const NavMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = (state: boolean) => {
      console.log("Received event with state:", state);
      setIsOpen(state);
    };

    eventEmitter.on("menuToggle", handleToggle);

    return () => {
      eventEmitter.off("menuToggle", handleToggle);
    };
  }, []);

  return (
    <nav className={`${styles.navMenu} ${isOpen ? styles.open : ""}`}>
      <a href="#" className={styles.navLink}>Home</a>
      <a href="#" className={styles.navLink}>About</a>
      <a href="#" className={styles.navLink}>Contact</a>
    </nav>
  );
};

export default NavMenu;
