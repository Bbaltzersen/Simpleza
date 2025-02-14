import React from 'react'
import { redirect } from "next/navigation";

import { auth0 } from '@/lib/api/authentication/auth';
import { NavMenuProvider } from "@/lib/context/navMenuContext";
import SessionProvider from "@/lib/context/authContext";

import Header from "@/components/headerComponent/header";
import ContentLayout from "@/components/layoutComponent/contentLayout";
import NavMenu from "@/components/navMenuComponent/navMenu";

import DashboardContent from '@/pages/dashboard/dashboardContent';

export default async function Dashboard() {
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
          <DashboardContent/>
        </ContentLayout>
      </NavMenuProvider>
    </SessionProvider>
  )
}
