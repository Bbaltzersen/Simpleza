"use client";

import React from "react";
import { useAuthWindow } from "@/lib/context/authWindowContext";
import styles from "./signIn.module.css";

function SignIn() {
  const { openWindow } = useAuthWindow();

  return (
    <button className={styles.container} onClick={() => openWindow("signin")}>
      Sign In
    </button>
  );
}

export default SignIn;
