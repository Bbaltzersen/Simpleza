import React from 'react'
import { redirect } from "next/navigation";

import { auth0 } from '@/lib/api/authentication/auth';
import { NavMenuProvider } from "@/lib/context/navMenuContext";
import SessionProvider from "@/lib/context/sessionContext";

import Header from "@/components/headerComponent/header";
import ContentLayout from "@/components/layoutComponent/contentLayout";
import NavMenu from "@/components/navMenuComponent/navMenu";

export default async function Profile() {
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
          <h1>Profile</h1>
        </ContentLayout>
      </NavMenuProvider>
    </SessionProvider>
  )
}
