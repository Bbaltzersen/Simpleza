"use client";

import React from "react";
import Link from "next/link";
import styles from "./signIn.module.css";

function SignIn() {
  return (
      <a href="/auth/login" className={styles.container}>Sign In</a>
  );
}

export default SignIn;