import React from 'react'

import { NavMenuProvider } from "@/lib/context/navMenuContext";
import AuthProvider from "@/lib/context/authContext";

import Header from "@/components/headerComponent/header";
import ContentLayout from "@/components/layoutComponent/contentLayout";
import NavMenu from "@/components/navMenuComponent/navMenu";

import AuthorizationContent from '@/pages/authorization/authorizationContent';

export default function Authorization() {
  const initialUser = null; 

  return (
    <AuthProvider initialUser={initialUser}>
      <NavMenuProvider>
        <Header />
        <NavMenu />
        <ContentLayout>
          <AuthorizationContent />
        </ContentLayout>
      </NavMenuProvider>
    </AuthProvider>
  );
}

