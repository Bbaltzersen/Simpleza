import React from "react";
import Logo from "./headerLogo/logo";
import Menu from "./headerMenu/menu";
import styles from "./header.module.css";
import { AuthWindowProvider } from "@/lib/context/authWindowContext";

const Header: React.FC = () => {
  return (
    <>
      <AuthWindowProvider>      <div className={styles.container} data-header>
        <Logo />
        <Menu />
      </div>
        <div className={styles.spacer} />
      </AuthWindowProvider>
    </>
  );
};

export default Header;
