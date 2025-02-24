"use client";

import React from 'react';
import { useAuth } from '@/lib/context/authContext';

const SignOut: React.FC = () => {
  const { logout } = useAuth();

  const handleSignOut = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    await logout();
    // Optionally, redirect or reload the page after logging out
    window.location.reload();
  };

  return (
    <a href="#" onClick={handleSignOut}>
      Sign out
    </a>
  );
};

export default SignOut;
