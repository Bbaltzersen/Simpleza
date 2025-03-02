"use client";

import React from "react";
import styles from "./managementContainer.module.css"; 

interface ManagementContainerProps {
  title: string;
  children: React.ReactNode;
}

const ManagementContainer: React.FC<ManagementContainerProps> = ({ title, children }) => {
  return (
    <div className={styles.container}>
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  );
};

export default ManagementContainer;