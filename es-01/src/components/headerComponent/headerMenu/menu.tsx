"use client"

import React, { useState } from "react";
import styles from './menu.module.css'
import NavMenuButton from './navMenuButton/navMenuButton';
import Register from "./regMenuButton/register";
import SignIn from "./sigMenuButton/signIn";

const Menu = () => {
    return (
        <div className={styles.container}>
            <SignIn/>
            <Register/>
            <NavMenuButton/>
        </div>
    );
};

export default Menu;
