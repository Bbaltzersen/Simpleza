import Header from "./headerComponent/header";
import { NavMenuProvider } from "@/lib/context/navMenuContext";
import ContentLayout from "./layoutComponent/contentLayout";
import NavMenu from "./navMenuComponent/navMenu";
import SessionLayout from "@/app/sessionLayout";


export default function HomePage() {
    return (
        <>
            <SessionLayout>
                <NavMenuProvider>
                    <Header />
                    <NavMenu />
                    <ContentLayout>
                        <h1>Hello, World!</h1>
                    </ContentLayout>
                </NavMenuProvider>
            </SessionLayout>
        </>
    );
}
