import React from 'react'
import { redirect } from "next/navigation";

import { auth0 } from '@/lib/authentication/auth0';
import { NavMenuProvider } from "@/lib/context/navMenuContext";
import SessionProvider from "@/lib/context/sessionContext";

import Header from "@/components/headerComponent/header";
import ContentLayout from "@/components/layoutComponent/contentLayout";
import NavMenu from "@/components/navMenuComponent/navMenu";

export default async function myrecipes() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/")
  }

  return (
    <SessionProvider>
      <NavMenuProvider>
        <Header />
        <NavMenu />
        <ContentLayout>
          <h1>My Recipe</h1>
        </ContentLayout>
      </NavMenuProvider>
    </SessionProvider>
  )
}
