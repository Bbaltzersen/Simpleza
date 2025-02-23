"use client";

import React from "react";
import Link from "next/link";
import styles from "./signIn.module.css";

function SignIn() {
  return (
      <a href="/authorization?signin" className={styles.container}>Sign In</a>
  );
}

export default SignIn;