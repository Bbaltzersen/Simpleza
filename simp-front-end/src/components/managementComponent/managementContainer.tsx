"use client";

import React from "react";
import styles from "./managementContainer.module.css";

import { Plus } from "lucide-react";

interface ManagementContainerProps {
  title: string;
  children: React.ReactNode;
  actionButton?: React.ReactNode;
}

const ManagementContainer: React.FC<ManagementContainerProps> = ({ title, children, actionButton }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {actionButton && <div className={styles.actionButton}>{actionButton}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
};

export default ManagementContainer;