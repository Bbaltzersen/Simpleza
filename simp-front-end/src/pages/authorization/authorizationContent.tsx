"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function AuthorizationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Detect the initial form state before redirecting
  const hasSignin = searchParams?.has("signin");
  const hasRegister = searchParams?.has("register");

  // Store the form type in state to avoid UI shifts
  const [formType, setFormType] = useState<"signin" | "register">(
    hasSignin ? "signin" : hasRegister ? "register" : "signin"
  );

  useEffect(() => {
    if (!hasSignin && !hasRegister) {
      router.replace("/authorization?signin"); 
    }
  }, [hasSignin, hasRegister, router]);

  return formType === "signin" ? <SigninForm /> : <RegisterForm />;
}

function SigninForm() {
  return (
    <div>
      <h2>Sign In</h2>
      <form>
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
}

function RegisterForm() {
  return (
    <div>
      <h2>Register</h2>
      <form>
        <input type="text" placeholder="Username" />
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default AuthorizationContent;
