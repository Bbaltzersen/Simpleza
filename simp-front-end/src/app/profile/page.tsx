import React from 'react'
import { redirect } from "next/navigation";

import { NavMenuProvider } from "@/lib/context/navMenuContext";

import Header from "@/components/headerComponent/header";
import ContentLayout from "@/components/layoutComponent/contentLayout";
import NavMenu from "@/components/navMenuComponent/navMenu";

export default async function Profile() {
  const initialUser = null;

  return (
      <NavMenuProvider>
        <Header />
        <NavMenu />
        <ContentLayout>
          <h1>Profile</h1>
        </ContentLayout>
      </NavMenuProvider>
  )
}
