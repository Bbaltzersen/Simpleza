import React from 'react'
import { redirect } from "next/navigation";

import { NavMenuProvider } from "@/lib/context/navMenuContext";

import Header from "@/components/headerComponent/header";
import ContentLayout from "@/components/layoutComponent/contentLayout";
import NavMenu from "@/components/navMenuComponent/navMenu";

import DashboardContent from '@/pages/dashboard/dashboardContent';
import AuthWindow from '@/lib/providers/authWindowProvider';
import AuthModal from '@/components/authWindow/authWindow';

export default async function TermsAndConditions() {
  const initialUser = null;

  return (
    <AuthWindow>
      <NavMenuProvider>
        <AuthModal/>
        <Header />
        <NavMenu />
        <ContentLayout>
            <h1>Terms and Conditions</h1>
        </ContentLayout>
      </NavMenuProvider>
    </AuthWindow>
  )
}
