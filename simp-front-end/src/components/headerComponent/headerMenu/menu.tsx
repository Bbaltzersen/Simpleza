"use client";

import React from "react";
import styles from "./menu.module.css";
import NavMenuButton from "./navMenuButton/navMenuButton";
import Register from "./regMenuButton/register";
import SignIn from "./sigMenuButton/signIn";
import SignOut from "./signOutMenuButton/signOut";
import { useAuth } from "@/lib/context/authContext"; // Adjust the path as needed

const Menu = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <div className={styles.container}>
      {isAuthenticated ? <SignOut /> : (
        <>
          <SignIn />
          <Register />
        </>
      )}
      <NavMenuButton />
    </div>
  );
};

export default Menu;
