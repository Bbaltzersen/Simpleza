"use client"

import React, { useState } from "react";
import styles from './menu.module.css'
import NavMenuButton from './navMenuButton/navMenuButton';

const Menu = () => {
    return (
        <div className={styles.container}>
            <a>Sign in</a>
            <a>Register</a>
            <NavMenuButton/>
        </div>
    );
};

export default Menu;
