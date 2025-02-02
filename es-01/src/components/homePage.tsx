import Header from "./headerComponent/header";
import { NavMenuProvider } from "@/context/navMenuContext";
import ContentLayout from "./layoutComponent/contentLayout";
import NavMenu from "./navMenuComponent/navMenu";


export default function HomePage() {
    return (
        <>
            <NavMenuProvider>
                <Header />
                <NavMenu/>
                <ContentLayout>
                   <h1>Hello, World!</h1>
                </ContentLayout>
            </NavMenuProvider>
        </>
    );
}
