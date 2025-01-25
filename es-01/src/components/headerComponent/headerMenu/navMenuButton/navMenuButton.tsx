import React from "react";
import styles from "./navMenuButton.module.css";

const NavMenuButton: React.FC = () => {
  return (
    <div className={styles.menuWrapper}>
      <input type="checkbox" id="menu-toggle" className={styles.menuCheckbox} />
      <label htmlFor="menu-toggle" className={styles.menuButton}>
        <span className={styles.menuLine}></span>
        <span className={styles.menuLine}></span>
        <span className={styles.menuLine}></span>
      </label>
    </div>
  );
};

export default NavMenuButton;
