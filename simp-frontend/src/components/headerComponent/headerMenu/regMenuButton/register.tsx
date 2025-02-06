import React from 'react'
import styles from './register.module.css'

function Register() {
  return (
    <a href='/auth/login?screen_hint=signup' className={styles.container}>Register</a>
  )
}

export default Register