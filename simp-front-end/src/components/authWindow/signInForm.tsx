"use client";

import React, { useState } from "react";
import styles from "./signInForm.module.css"; // Create this CSS module for custom styles if desired
import { useRouter } from 'next/navigation';

const SignInForm: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    
    e.preventDefault();
    setError(null);
    try {
      // The login endpoint expects form data (using x-www-form-urlencoded)
      const response = await fetch("http://localhost:8000/v1/authentication/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        credentials: "include",
        body: new URLSearchParams({
          username,
          password,
        }).toString(),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.detail || "Sign in failed.");
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      setError(err.message || "Sign in failed.");
    }
  };

  return (
    <div className={styles.container}>
      <h2>Sign In</h2>
      {error && <div className={styles.error}>{error}

      </div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Sign In</button>
        </form>
    </div>
  );
};

export default SignInForm;
