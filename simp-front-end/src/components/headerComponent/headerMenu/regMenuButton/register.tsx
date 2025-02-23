import React from 'react'
import styles from './register.module.css'

function Register() {
  return (
    <a href='/authorization?register' className={styles.container}>Register</a>
  )
}

export default Register