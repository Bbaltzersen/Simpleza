// File: /components/authWindow/signIn.tsx
"use client";

import React from "react";
import { useAuthWindow } from "@/lib/context/authWindowContext";
import styles from "./signIn.module.css";

const SignIn = () => {
  const { openWindow } = useAuthWindow();

  const handleClick = () => {
    console.log("SignIn button clicked");
    openWindow("signin");
  };

  return (
    <button className={styles.container} onClick={handleClick}>
      Sign In
    </button>
  );
};

export default SignIn;
