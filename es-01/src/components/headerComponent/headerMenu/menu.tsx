import styles from './menu.module.css'
import NavMenuButton from './navMenuButton/navMenuButton';
import Register from "./regMenuButton/register";
import SignIn from "./sigMenuButton/signIn";
import { auth0 } from '@/lib/auth0';

const Menu = async () => {
    const session = await auth0.getSession();

    if(!session){
    return (
        <div className={styles.container}>
            <SignIn/>
            <Register/>
            <NavMenuButton/>
        </div>
    );
    }

    return(
        <div className={styles.container}>
            <NavMenuButton/>
        </div>
    )
};

export default Menu;
