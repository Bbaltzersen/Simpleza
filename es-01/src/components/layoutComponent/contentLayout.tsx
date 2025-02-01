import React from "react";
import ContentWrapper from "./contentWrapper"; // Import the Client Component

interface ContentLayoutProps {
  children: React.ReactNode;
}

export default function ContentLayout({ children }: ContentLayoutProps) {
  return <ContentWrapper>{children}</ContentWrapper>;
}
