import React from 'react'
import { redirect } from "next/navigation";

import { NavMenuProvider } from "@/lib/context/navMenuContext";
import AuthProvider from "@/lib/context/authContext";

import Header from "@/components/headerComponent/header";
import ContentLayout from "@/components/layoutComponent/contentLayout";
import NavMenu from "@/components/navMenuComponent/navMenu";

import DashboardContent from '@/pages/dashboard/dashboardContent';

export default async function Dashboard() {
  const initialUser = null;

  return (
    <AuthProvider initialUser={initialUser}>
      <NavMenuProvider>
        <Header />
        <NavMenu />
        <ContentLayout>
          <DashboardContent/>
        </ContentLayout>
      </NavMenuProvider>
    </AuthProvider>
  )
}
