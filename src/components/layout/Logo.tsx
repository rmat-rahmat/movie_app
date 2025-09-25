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
      <Image src="/logo_dark.svg" className="mx-2" alt="Logo" width={40} height={40} />
      <span className="font-bold text-lg lg:text-3xl text-white">{t('navigation.brand')}</span>
    </Link>
  );
}