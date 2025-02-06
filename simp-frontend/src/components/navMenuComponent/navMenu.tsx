"use client";

import React, { useRef } from "react";
import NavLinks from "./navLinks/navLinks";
import { useNavMenu } from "@/lib/context/navMenuContext";
import styles from "./navMenu.module.css";

const NavMenu: React.FC = () => {
  const navMenuRef = useRef<HTMLDivElement>(null);
  const { isOpen } = useNavMenu();

  return (
    <nav ref={navMenuRef} className={`${styles.navMenu} ${isOpen ? styles.open : ""}`}>
      <NavLinks/>
    </nav>
  );
};

export default NavMenu;