import { NavMenuProvider } from "@/lib/context/navMenuContext";
import Header from "@/components/headerComponent/header";
import ContentLayout from "@/components/layoutComponent/contentLayout";
import NavMenu from "@/components/navMenuComponent/navMenu";

export default function Home() {
  const initialUser = null;

  return (
      <NavMenuProvider>
        <Header />
        <NavMenu />
        <ContentLayout>
          <h1>Hello, World!</h1>
        </ContentLayout>
      </NavMenuProvider>
  );
}
