import React from "react";
import ContentWrapper from "./contentwrapper/contentWrapper"; 
import styles from './contentLayout.module.css'

interface ContentLayoutProps {
  children: React.ReactNode;
}

export default function ContentLayout({ children }: ContentLayoutProps) {
  return (
    <ContentWrapper>
      <div className={styles.contentContainer}>{children}</div>
    </ContentWrapper>
  );
}