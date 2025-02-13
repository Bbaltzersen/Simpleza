import React from 'react'
import styles from './navLinks.module.css'
import { useSession } from "@/lib/context/sessionHandler";
import { auth0 } from '@/lib/api/authentication/auth'

export default function NavLinks() {
    const session = useSession();
    return (
        <>
            {session ? <a href="/profile" className={styles.navLink}>Profile</a> : <></>}
            {session ? <a href="/dashboard" className={styles.navLink}>My Recipes</a> : <></>}
            <a href="/findrecipes" className={styles.navLink}>Find Recipes</a>
        </>
    )
}
