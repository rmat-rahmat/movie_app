 'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usePathname, useRouter } from 'next/navigation';
import { shallow } from 'zustand/shallow';
import GuestLayout from '@/components/auth/GuestLayout';
import ProtectedLayout from '@/components/auth/ProtectedLayout';
import LoadingPage from '@/components/ui/LoadingPage';

interface AuthWrapperProps {
  children: React.ReactNode;
}

// Routes that don't require authentication
const publicRoutes = ['/auth/login', '/auth/register', '/', '/about', '/movies'];

// Routes that require authentication
const protectedRoutes = ['/profile', '/settings', '/upload'];

// Routes that can be accessed by both authenticated and unauthenticated users
// but show different layouts
const hybridRoutes = ['/', '/about', '/movies', '/category', '/search','/videoplayer'];

export default function AuthWrapper({ children }: AuthWrapperProps) {
  // Select only the fields we need to avoid re-renders when unrelated parts of the store change
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();
  const router = useRouter();

  // Run initial auth check once on mount
  useEffect(() => {
    let mounted = true;
    const doInit = async () => {
      // run checkAuth but avoid causing render-time side effects
      try {
        await checkAuth();
        if (mounted) {
          // use getState only for debug - keep logs in effect
          const state = useAuthStore.getState();
          console.debug('[AuthWrapper] init done', { isAuthenticated: state.isAuthenticated });
        }
      } catch (e) {
        // ignore
      }
    };
    doInit();
    return () => {
      mounted = false;
    };
  }, [checkAuth]);

  // Redirects must run in effects to avoid render-side navigation and extra renders
  useEffect(() => {
    if (!pathname) return;

    // Protected route redirect when not authenticated and not loading
    if (protectedRoutes.some((r) => pathname.startsWith(r))) {
      if (!isLoading && !isAuthenticated) {
        router.push('/auth/login');
      }
      return;
    }

    // Exact auth pages (login/register) and other /auth/* behavior
    if (pathname === '/auth/login' || pathname === '/auth/register' || pathname.startsWith('/auth/')) {
      if (!isLoading && isAuthenticated) {
        router.push('/');
      }
      return;
    }
  }, [pathname, isAuthenticated, isLoading, router]);


  // While auth is being determined, show loading
  if (isLoading) return <LoadingPage />;
  
  // If pathname is not available yet, show a loading placeholder
  if (!pathname) return <GuestLayout>{children}</GuestLayout>;


  // Protected routes - if not authenticated we already redirected above; show layout for authenticated users
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) return <LoadingPage />; // fallback while redirect happens
    return <ProtectedLayout>{children}</ProtectedLayout>;
  }

  // Auth pages (login/register) - render raw children when not authenticated
  if (pathname === '/auth/login' || pathname === '/auth/register') {
    if (isAuthenticated) return <LoadingPage />; // redirect is handled in effect
    return <>{children}</>;
  }

  // For other /auth/* routes
  if (pathname.startsWith('/auth/')) {
    if (isAuthenticated) return <LoadingPage />;
    return <GuestLayout>{children}</GuestLayout>;
  }

  // Hybrid routes: show ProtectedLayout for authenticated users, GuestLayout otherwise
  if (hybridRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    return isAuthenticated ? <ProtectedLayout>{children}</ProtectedLayout> : <GuestLayout>{children}</GuestLayout>;
  }

  // Default to guest layout
  return <GuestLayout>{children}</GuestLayout>;
}
