"use client";

import React, { useEffect } from "react";
import { useAuthWindow } from "@/lib/context/authWindowContext";
import SignInForm from "./signInForm"; // ensure this exists and renders something visible
import RegisterForm from "./registerForm";
import styles from "./authWindow.module.css";

const AuthModal: React.FC = () => {
  const { isOpen, windowType, closeWindow } = useAuthWindow();
  
  useEffect(() => {
    console.log("AuthModal rendered:", { isOpen, windowType });
  }, [isOpen, windowType]);

  // Check if modal should be rendered at all
  if (!isOpen || !windowType) {
    return null;
  }
  
  // Additional check: ensure windowType is either "signin" or "register"
  if (windowType !== "signin" && windowType !== "register") {
    console.error("Invalid windowType provided:", windowType);
    return null;
  }

  return (
    <div
      className={styles["auth-overlay"]}
      onClick={closeWindow}
      // Temporary red border to debug overlay
      style={{ border: "3px solid red" }}
    >
      <div className={styles["auth-content"]} onClick={(e) => e.stopPropagation()}>
        <button className={styles["auth-close"]} onClick={closeWindow}>
          ×
        </button>
        {windowType === "signin" ? <SignInForm /> : <RegisterForm />}
      </div>
    </div>
  );
};

export default AuthModal;