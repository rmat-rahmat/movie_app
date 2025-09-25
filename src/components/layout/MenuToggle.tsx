"use client";

import { FiMenu } from "react-icons/fi";
import { useTranslation } from 'react-i18next';

interface MenuToggleProps {
  onToggle: () => void;
  className?: string;
}

export default function MenuToggle({ onToggle, className = "" }: MenuToggleProps) {
  const { t } = useTranslation('common');

  return (
    <button
      className={`ml-4 z-100 flex items-center justify-center p-2 rounded text-gray-200 ${className}`}
      onClick={onToggle}
      aria-label={t('navigation.openMenu')}
    >
      <FiMenu size={28} />
    </button>
  );
}