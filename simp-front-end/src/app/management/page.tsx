import { NavMenuProvider } from "@/lib/context/navMenuContext";
import Header from "@/components/headerComponent/header";
import ContentLayout from "@/components/layoutComponent/contentLayout";
import NavMenu from "@/components/navMenuComponent/navMenu";
import AuthWindow from "@/lib/providers/authWindowProvider";
import AuthModal from "@/components/authWindow/authWindow";
import { redirect } from "next/navigation";
import { initServerSideSession } from "@/lib/api/authentication/serverSession"; // Adjust path as needed
import ManagementContent from "@/pages/ingredients/managementContent";

export default async function IngredientsPage() {
  // Get the session details on the server.
  const { user, isAuthenticated } = await initServerSideSession();

  // If not authenticated or the user role is not admin, redirect to home.
  if (!isAuthenticated || user?.role !== "admin") {
    redirect("/");
  }

  return (
    <AuthWindow>
      <NavMenuProvider>
        <Header />
        <NavMenu />
        <ContentLayout>
          <ManagementContent />
        </ContentLayout>
        <AuthModal />
      </NavMenuProvider>
      </AuthWindow>
  );
}
