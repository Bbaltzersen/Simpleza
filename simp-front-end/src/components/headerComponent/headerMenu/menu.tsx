"use client";

import React from "react";
import styles from "./menu.module.css";
import NavMenuButton from "./navMenuButton/navMenuButton";
import Register from "./regMenuButton/register";
import SignIn from "./sigMenuButton/signIn";
import SignOut from "./signOutMenuButton/signOut";
import { useAuth } from "@/lib/context/authContext"; // Adjust the path as needed



// Optional: Create a simple error display component
const ErrorDisplay = ({ message }: { message: string | null }) => (
  <div className={styles.error}>
    {message || "An error occurred"}
    {/* Optionally add a retry button if your context supports it */}
  </div>
);

const Menu = () => {
  // Destructure all relevant states from the context
  const { isAuthenticated, loading, error, user } = useAuth();

  // --- 1. Determine the Authentication-Specific Content ---
  // This variable will hold SignIn/Register OR SignOut OR Loading/Error indicator
  let authRelatedContent = null;

  if (loading) {
    // State: Loading authentication status
    // Show a loading indicator instead of null
    console.log("Menu: Rendering Loading Indicator");
  } else if (error) {
    // State: An error occurred fetching authentication status
    // Show an error message
    console.error("Menu: Rendering Error Display:", error);
    // Note: We still render NavMenuButton below unless the design requires hiding everything on error.
  } else if (isAuthenticated) {
    // State: Successfully loaded, user is authenticated
    // Show SignOut button (and potentially user info if desired)
    console.log("Menu: Rendering SignOut for user:", user?.username);
    authRelatedContent = <SignOut />;
  } else {
    // State: Successfully loaded, user is not authenticated
    // Show SignIn and Register buttons
    console.log("Menu: Rendering SignIn and Register");
    authRelatedContent = (
      <>
        <SignIn />
        <Register />
      </>
    );
  }

  // --- 2. Render the Menu Structure ---
  // The main container and potentially non-auth-related items (like NavMenuButton)
  // are rendered outside the specific auth state checks (unless the error state
  // should hide everything).
  return (
    <div className={styles.container}>
      {authRelatedContent}
      {/* Render NavMenuButton unless there was an error and we decided to hide it */}
      {!error && <NavMenuButton />}
      {/* If NavMenuButton should ALWAYS show, even on error, remove the {!error && ...} condition */}
      {/* <NavMenuButton /> */}
    </div>
  );
};

export default Menu;