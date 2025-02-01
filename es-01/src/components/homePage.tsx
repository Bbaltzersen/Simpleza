import Header from "./headerComponent/header";
import ContentLayout from "./layoutComponent/contentLayout";
import Content from "./layoutComponent/contentLayout";
import NavMenu from "./navMenuComponent/navMenu";

export default function HomePage() {
    return (
        <>
            <Header />
            <ContentLayout>
                <h1>Hello, World!</h1>
            </ContentLayout>
        </>
    );
}
