import ProtectedLayout from "./ProtectedLayout";
import GuestLayout from "./GuestLayout";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

import { ReactNode } from "react";

const NavigationFrame = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthStore();

  return user ? <ProtectedLayout>{children}</ProtectedLayout> : <GuestLayout>{children}</GuestLayout>;
};

export default NavigationFrame;