import { NavMenuProvider } from "@/lib/context/navMenuContext";
import SessionProvider from "@/lib/context/sessionContext";

import Header from "@/components/headerComponent/header";
import ContentLayout from "@/components/layoutComponent/contentLayout";
import NavMenu from "@/components/navMenuComponent/navMenu";

export default function Home() {
  return (
    <SessionProvider>
      <NavMenuProvider>
        <Header />
        <NavMenu />
        <ContentLayout>
          <h1>Hello, World!</h1>
        </ContentLayout>
      </NavMenuProvider>
    </SessionProvider>
  )
}