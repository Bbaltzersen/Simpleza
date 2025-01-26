"use client";

import React, { useEffect, useState, useRef } from "react";
import eventEmitter from "@/lib/eventEmitter";
import styles from "./navMenu.module.css";

const NavMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleToggle = (state: boolean) => {
      setIsOpen(state);

      // Attach or detach the click listener based on the menu state
      if (state) {
        document.addEventListener("mousedown", handleClickOutside);
      } else {
        document.removeEventListener("mousedown", handleClickOutside);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if the click is outside the menu
      if (
        navMenuRef.current &&
        !navMenuRef.current.contains(target) &&
        !target.closest("header") // Allow clicks inside the header
      ) {
        setIsOpen(false);
        eventEmitter.emit("menuClose", undefined); // Emit event to untoggle the button
      }
    };

    eventEmitter.on("menuToggle", handleToggle);

    // Cleanup the event listener when the component unmounts
    return () => {
      eventEmitter.off("menuToggle", handleToggle);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav
      ref={navMenuRef}
      className={`${styles.navMenu} ${isOpen ? styles.open : ""}`}
    >
      <a href="#" className={styles.navLink}>Home</a>
      <a href="#" className={styles.navLink}>About</a>
      <a href="#" className={styles.navLink}>Contact</a>
    </nav>
  );
};

export default NavMenu;
