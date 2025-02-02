"use client";

import React, { useRef, useState, useEffect } from "react";
import { effect, signal } from "@preact/signals-react"
import { isOpen } from "../headerComponent/headerMenu/navMenuButton/navMenuButton";
import styles from "./navMenu.module.css";

const NavMenu: React.FC = () => {
  const navMenuRef = useRef<HTMLDivElement>(null);
  const [, setRender] = useState(false);

  useEffect(() => {
    const rerender = () => setRender(prev => !prev);
    return isOpen.subscribe(rerender);
  }, []);

  return (
    <nav ref={navMenuRef} className={`${styles.navMenu} ${isOpen.value ? styles.open : ""}`}>
      <a href="#" className={styles.navLink}>Home</a>
      <a href="#" className={styles.navLink}>About</a>
      <a href="#" className={styles.navLink}>Contact</a>
    </nav>
  );
};

export default NavMenu;



  // useEffect(() => {
  //   const handleToggle = (state: boolean) => setIsOpen(state);
  //   const handleClose = () => setIsOpen(false); // Close the menu when clicked outside

  //   eventEmitter.on("menuToggle", handleToggle);
  //   eventEmitter.on("menuClose", handleClose);

  //   return () => {
  //     eventEmitter.off("menuToggle", handleToggle);
  //     eventEmitter.off("menuClose", handleClose);
  //   };
  // }, []);