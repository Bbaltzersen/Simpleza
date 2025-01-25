import Logo from './headerLogo/logo'
import Menu from './headerMenu/menu'
import styles from './header.module.css'

const Header = () => {
    return (
        <div className={styles.container}>
            <Logo/>
            <Menu/>
        </div>
    );
};

export default Header;
