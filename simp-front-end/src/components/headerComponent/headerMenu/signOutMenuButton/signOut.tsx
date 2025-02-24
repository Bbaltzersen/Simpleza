"use client";

import React from 'react';
import { useAuth } from '@/lib/context/authContext';
import { useRouter } from 'next/navigation';

const SignOut: React.FC = () => {
  const { logout } = useAuth();
  const router = useRouter();

  const handleSignOut = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    await logout();
    try {
      router.push("/");
    } catch (error) {
      window.location.href = "/";
    }
  };

  return (
    <a href="#" onClick={handleSignOut}>
      Sign out
    </a>
  );
};

export default SignOut;
