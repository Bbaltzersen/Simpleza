import React from 'react'

import { NavMenuProvider } from "@/lib/context/navMenuContext";

import Header from "@/components/headerComponent/header";
import ContentLayout from "@/components/layoutComponent/contentLayout";
import NavMenu from "@/components/navMenuComponent/navMenu";
import AuthWindow from '@/lib/providers/authWindowProvider';
import AuthModal from '@/components/authWindow/authWindow';

export default function FindRecipes() {
  const initialUser = null; // Replace with actual user data if available

  return (
    <AuthWindow>
      <NavMenuProvider>
        <AuthModal />
        <Header />
        <NavMenu />
        <ContentLayout>
          <h1>Find Recipes</h1>
        </ContentLayout>
      </NavMenuProvider>
    </AuthWindow>
  );
}

