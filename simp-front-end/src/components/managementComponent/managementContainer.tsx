"use client";

import React from "react";
import styles from "./managementContainer.module.css"; // Assuming you have styles defined
import { Plus } from "lucide-react"; // <-- Restored import

// --- Updated Props Interface ---
interface ManagementContainerProps {
  title: string;
  children: React.ReactNode;
  actionButton?: React.ReactNode;
  isLoading?: boolean;
  errorMessage?: string | null;
}

const ManagementContainer: React.FC<ManagementContainerProps> = ({
  title,
  children,
  actionButton,
  isLoading = false,
  errorMessage = null
}) => {
  return (
    <div className={styles.managementContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {/* Render the actionButton passed from the parent */}
        {actionButton && <div className={styles.actionButton}>{actionButton}</div>}
      </div>

      {/* --- Conditional Loading/Error Display --- */}
      <div className={styles.statusSection}>
          {isLoading && (
              <div className={styles.loadingIndicator}>
                  Loading...
              </div>
          )}
          {!isLoading && errorMessage && (
              <div className={styles.errorMessage}>
                  Error: {errorMessage}
              </div>
          )}
      </div>

      {/* --- Main Content Area --- */}
       <div className={styles.content}>{children}</div>
       {/* Or hide children when loading: */}
       {/* {!isLoading && <div className={styles.content}>{children}</div>} */}

    </div>
  );
};

export default ManagementContainer;

// Note: While Plus is imported here, this component only renders the 'actionButton'.
// The component *passing* the actionButton (like NutrientManagement) is responsible
// for importing any icons *it uses* within that button/node.
// Keeping the import here ensures compatibility if it was expected.