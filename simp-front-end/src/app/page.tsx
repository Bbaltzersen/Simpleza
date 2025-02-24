import { NavMenuProvider } from "@/lib/context/navMenuContext";
import Header from "@/components/headerComponent/header";
import ContentLayout from "@/components/layoutComponent/contentLayout";
import NavMenu from "@/components/navMenuComponent/navMenu";
import AuthWindow from "@/lib/providers/authWindowProvider";
import AuthModal from "@/components/authWindow/authWindow";

export default function Home() {
  const initialUser = null;

  return (
    <AuthWindow>
      <NavMenuProvider>
        <Header />
        <NavMenu />
        <ContentLayout>
          <h1>Hello, World!</h1>
        </ContentLayout>
        <AuthModal />
      </NavMenuProvider>
      </AuthWindow>
  );
}
