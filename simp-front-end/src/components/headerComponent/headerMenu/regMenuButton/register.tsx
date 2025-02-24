"use client";

import React from "react";
import { useAuthWindow } from "@/lib/context/authWindowContext";
import styles from "./register.module.css";

const Register = () => {
  const { openWindow } = useAuthWindow();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    openWindow("register");
  };

  return (
    <a href="#" className={styles.container} onClick={handleClick}>
      Register
    </a>
  );
};

export default Register;
