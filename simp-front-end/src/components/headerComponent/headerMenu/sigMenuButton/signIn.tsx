"use client";

import React from "react";
import Link from "next/link";
import styles from "./signIn.module.css";

function SignIn() {
  return (
      <a href="/authorization" className={styles.container}>Sign In</a>
  );
}

export default SignIn;