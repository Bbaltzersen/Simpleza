import { NavMenuProvider } from "@/lib/context/navMenuContext";
import Header from "@/components/headerComponent/header";
import ContentLayout from "@/components/layoutComponent/contentLayout";
import NavMenu from "@/components/navMenuComponent/navMenu";
import AuthWindow from "@/lib/providers/authWindowProvider";
import AuthModal from "@/components/authWindow/authWindow";
import Footer from "@/components/footerComponent/footer";

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
        <Footer />
        <AuthModal />
      </NavMenuProvider>
      </AuthWindow>
  );
}
