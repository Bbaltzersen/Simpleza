import React from 'react';
import styles from './navLinks.module.css';
import { useAuth } from "@/lib/context/authContext"; // Use new AuthContext

export default function NavLinks() {
  const { user } = useAuth(); // Get authenticated user

  return (
    <>
      {user && (
        <>
          <a href="/profile" className={styles.navLink}>Profile</a>
          <a href="/dashboard" className={styles.navLink}>Dashboard</a>
          {user.role === "admin" && (
            <a href="/ingredients" className={styles.navLink}>Ingredients</a>
          )}
        </>
      )}
      <a href="/findrecipes" className={styles.navLink}>Find Recipes</a>
    </>
  );
}