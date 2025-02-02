import React from 'react'
import styles from './navLinks.module.css'
import { useSession } from "@/lib/context/sessionHandler";
import { auth0 } from '@/lib/auth0'

export default function NavLinks() {
    const session = useSession();
    return (
        <>
            {session ? <a href="#" className={styles.navLink}>Profile</a> : <></>}
            {session ? <a href="/myrecipes" className={styles.navLink}>My Recipes</a> : <></>}
            <a href="#" className={styles.navLink}>Find Recipes</a>
        </>
    )
}
