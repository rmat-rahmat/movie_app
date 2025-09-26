"use client";

import { ReactNode } from 'react';

interface NavigationBarProps {
  scrolled: boolean;
  children: ReactNode;
  className?: string;
}

export default function NavigationBar({ scrolled, children, className = "" }: NavigationBarProps) {
  return (
    <nav
      className={` w-[100vw] flex items-center justify-between py-4 px-4 fixed top-0 left-0 lg:left-auto lg:right-0 z-50 transition-colors duration-300 
        ${scrolled ? "bg-gradient-to-b from-black to-black/30" : "bg-gradient-to-b from-black via-black to-transparent"}
        ${className}
      `}
    >
      {children}
    </nav>
  );
}