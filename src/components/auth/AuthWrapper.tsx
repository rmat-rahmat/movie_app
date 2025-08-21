'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usePathname, useRouter } from 'next/navigation';
import GuestLayout from '@/components/auth/GuestLayout';
import ProtectedLayout from '@/components/auth/ProtectedLayout';
import LoadingPage from '@/components/ui/LoadingPage';

interface AuthWrapperProps {
  children: React.ReactNode;
}

// Routes that don't require authentication
const publicRoutes = ['/auth/login', '/auth/register', '/', '/about', '/movies'];

// Routes that require authentication
const protectedRoutes = ['/profile'];

// Routes that can be accessed by both authenticated and unauthenticated users
// but show different layouts
const hybridRoutes = ['/', '/about', '/movies'];

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Check authentication status on mount
    console.log("Checking auth status...");
    checkAuth();
    console.log("Auth status checked:", { isAuthenticated, user });
  }, [checkAuth]);

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingPage />;
  }

  // Handle protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return <LoadingPage />;
    }
    return <ProtectedLayout>{children}</ProtectedLayout>;
  }

  // Handle auth routes (login/register) - redirect if already authenticated
  // Only for exact login/register routes we should render children without any layout.
  if (pathname === '/auth/login' || pathname === '/auth/register') {
    if (isAuthenticated) {
      router.push('/');
      return <LoadingPage />;
    }
    // Render raw children (no GuestLayout) for auth pages
    return <>{children}</>;
  }

  // For other /auth/* routes (if any), keep previous behavior: redirect if authenticated or use GuestLayout
  if (pathname.startsWith('/auth/')) {
    if (isAuthenticated) {
      router.push('/');
      return <LoadingPage />;
    }
    return <GuestLayout>{children}</GuestLayout>;
  }

  // Handle hybrid routes (/, /about, /movies)
  if (hybridRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {

    console.log(isAuthenticated)
    console.log(user)
    if (isAuthenticated) {
      return <ProtectedLayout>{children}</ProtectedLayout>;
    } else {
      return <GuestLayout>{children}</GuestLayout>;
    }
  }

  // Default: use GuestLayout for any other routes
  return <GuestLayout>{children}</GuestLayout>;
}
