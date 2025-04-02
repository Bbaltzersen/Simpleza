"use client";

import React from "react";
import styles from "./managementContainer.module.css";

// No need to import Plus here unless used directly in this component

interface ManagementContainerProps {
  title: string;
  children: React.ReactNode;
  actionButton?: React.ReactNode; // Existing action button (e.g., for 'New')
  headerContent?: React.ReactNode; // New prop for additional header content (e.g., validation toggle)
}

const ManagementContainer: React.FC<ManagementContainerProps> = ({
  title,
  children,
  actionButton,
  headerContent, // Destructure the new prop
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>

        {/* Wrapper for right-aligned header items */}
        <div className={styles.headerActionsArea}>
          {/* Render the headerContent (validation button) if provided */}
          {headerContent}

          {/* Render the actionButton (e.g., 'New' button) if provided */}
          {/* Note: The actionButton prop itself might be a button already,
              no need for the extra div with styles.actionButton here
              unless that class specifically targets the button style itself */}
          {actionButton}
        </div>
      </div>
      {/* Render main content */}
      <div>{children}</div>
    </div>
  );
};

export default ManagementContainer;