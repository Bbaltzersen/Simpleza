import styles from './menu.module.css'

const Menu = () => {
    return (
        <div className={styles.container}>
            <a>Sign in</a>
            <a>Register</a>
        </div>
    );
};

export default Menu;
