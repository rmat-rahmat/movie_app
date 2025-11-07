"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from 'react-i18next';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  const { t } = useTranslation('common');

  return (
    <Link href="/" className={`flex items-center gap-2 cursor-pointer ${className}`}>
      <Image src="/logo_dark.svg" className="ml-2" alt="Logo" width={35} height={35} />
      <span className="ml-[-6px] font-bold text-2xl lg:text-3xl text-[#fbb033]">Talk</span>
    </Link>
  );
}