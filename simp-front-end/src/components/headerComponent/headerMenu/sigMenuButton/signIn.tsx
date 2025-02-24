"use client";

import React from "react";
import { useAuthWindow } from "@/lib/context/authWindowContext";
import styles from "./signIn.module.css";

const SignIn = () => {
  const { openWindow } = useAuthWindow();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    openWindow("signin");
  };

  return (
    <a href="#" className={styles.container} onClick={handleClick}>
      Sign In
    </a>
  );
};

export default SignIn;