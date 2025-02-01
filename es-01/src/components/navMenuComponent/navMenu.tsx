"use client";

import React, { useEffect, useState, useRef } from "react";
import eventEmitter from "@/lib/eventEmitter";
import styles from "./navMenu.module.css";

const NavMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleToggle = (state: boolean) => setIsOpen(state);
    const handleClose = () => setIsOpen(false); // Close the menu when clicked outside

    eventEmitter.on("menuToggle", handleToggle);
    eventEmitter.on("menuClose", handleClose);

    return () => {
      eventEmitter.off("menuToggle", handleToggle);
      eventEmitter.off("menuClose", handleClose);
    };
  }, []);

  return (
    <nav
      ref={navMenuRef}
      className={`${styles.navMenu} ${isOpen ? styles.open : ""}`}
    >
      <a href="#" className={styles.navLink}>
        Home
      </a>
      <a href="#" className={styles.navLink}>
        About
      </a>
      <a href="#" className={styles.navLink}>
        Contact
      </a>
    </nav>
  );
};

export default NavMenu;