"use client";

import React, { useEffect } from "react";
import { useAuthWindow } from "@/lib/context/authWindowContext";
import "./authWindow.module.css"; // Ensure this file exists for styling

const AuthWindow = () => {
  const { isOpen, windowType, closeWindow } = useAuthWindow();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeWindow();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeWindow]);

  if (!isOpen) return null;

  return (
    <div className="auth-overlay" onClick={closeWindow}>
      <div className="auth-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={closeWindow}>✖</button>
        {windowType === "signin" ? <SigninForm /> : <RegisterForm />}
      </div>
    </div>
  );
};

const SigninForm = () => (
  <div>
    <h2>Sign In</h2>
    <form>
      <input type="email" placeholder="Email" />
      <input type="password" placeholder="Password" />
      <button type="submit">Sign In</button>
    </form>
  </div>
);

const RegisterForm = () => (
  <div>
    <h2>Register</h2>
    <form>
      <input type="text" placeholder="Username" />
      <input type="email" placeholder="Email" />
      <input type="password" placeholder="Password" />
      <button type="submit">Register</button>
    </form>
  </div>
);

export default AuthWindow;