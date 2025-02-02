import React from 'react'
import { useRouter } from "next/navigation";
import styles from './signIn.module.css'

function SignIn() {
  return (
    <a href='/auth/login'>Sign In</a>
  )
}

export default SignIn