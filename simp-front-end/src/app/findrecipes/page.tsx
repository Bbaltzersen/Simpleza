import React from 'react'

import { NavMenuProvider } from "@/lib/context/navMenuContext";
import SessionProvider from "@/lib/context/authContext";

import Header from "@/components/headerComponent/header";
import ContentLayout from "@/components/layoutComponent/contentLayout";
import NavMenu from "@/components/navMenuComponent/navMenu";

export default function FindRecipes() {
  return (
    <SessionProvider>
      <NavMenuProvider>
        <Header />
        <NavMenu />
        <ContentLayout>
          <h1>Find Recipes</h1>
        </ContentLayout>
      </NavMenuProvider>
    </SessionProvider>
  )
}
