import styles from './menu.module.css';
import NavMenuButton from './navMenuButton/navMenuButton';
import Register from "./regMenuButton/register";
import SignIn from "./sigMenuButton/signIn";
import SignOut from './signOutMenuButton/signOut';
import { initServerSideSession } from '@/lib/api/authentication/serverSession'; 

const Menu = async () => {
    const { isAuthenticated } = await initServerSideSession(); 

    if (!isAuthenticated) {
        return (
            <div className={styles.container}>
                <SignIn />
                <Register />
                <NavMenuButton />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <SignOut />
            <NavMenuButton />
        </div>
    );
};

export default Menu;