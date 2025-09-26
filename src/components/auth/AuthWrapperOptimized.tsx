 'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usePathname, useRouter } from 'next/navigation';
import BaseLayout from '@/components/layout/BaseLayout';
import LoadingPage from '@/components/ui/LoadingPage';
import { getImageById } from "@/lib/uploadAPI";

interface AuthWrapperOptimizedProps {
  children: React.ReactNode;
}

// Routes that don't require authentication
const publicRoutes = ['/auth/login', '/auth/register', '/', '/about', '/movies'];

// Routes that require authentication
const protectedRoutes = ['/profile', '/settings', '/upload'];

// Function to check if a pathname matches a protected route more precisely
const isProtectedRoute = (pathname: string) => {
  return protectedRoutes.some(route => {
    if (route === '/profile') {
      // Only match /profile exactly, not /profileempty or other variations
      return pathname === '/profile' || pathname.startsWith('/profile/');
    }
    return pathname.startsWith(route);
  });
};

// Routes that can be accessed by both authenticated and unauthenticated users
// but show different layouts
const hybridRoutes = ['/', '/about', '/movies', '/category', '/search','/videoplayer',
  '/viewmore', '/profileempty'
];

export default function AuthWrapperOptimized({ children }: AuthWrapperOptimizedProps) {
  // Select only the fields we need to avoid re-renders when unrelated parts of the store change
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();
  const router = useRouter();
  
  // State for user avatar
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  // Derive display name and avatar
  const displayName = (user && (user.nickname || user.name || (user.email && user.email.split('@')[0]))) || 'User';
  const initials = displayName
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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

  // Fetch user avatar when user changes
  useEffect(() => {
    const fetchAvatar = async () => {
      if (user) {
        let avatar = user.avatar || '';
        if (user.avatar && !user.avatar.startsWith('http')) {
          // fetch full URL from upload API
          const imageUrl = await getImageById(user.avatar, '360')
          avatar = imageUrl.url || '';
        }
        setAvatarUrl(avatar);
      } else {
        setAvatarUrl('');
      }
    };
    fetchAvatar();
  }, [user]);

  // Redirects must run in effects to avoid render-side navigation and extra renders
  useEffect(() => {
    if (!pathname) return;

    // Protected route redirect when not authenticated and not loading
    if (isProtectedRoute(pathname)) {
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
  if (!pathname) return <BaseLayout type="guest">{children}</BaseLayout>;

  // Protected routes - if not authenticated we already redirected above; show layout for authenticated users
  if (isProtectedRoute(pathname)) {
    if (!isAuthenticated) return <LoadingPage />; // fallback while redirect happens
    return (
      <BaseLayout 
        type="protected" 
        user={user} 
        avatarUrl={avatarUrl} 
        displayName={displayName} 
        initials={initials}
      >
        {children}
      </BaseLayout>
    );
  }

  // Auth pages (login/register) - render raw children without BaseLayout
  if (pathname === '/auth/login' || pathname === '/auth/register') {
    if (isAuthenticated) return <LoadingPage />; // redirect is handled in effect
    return <>{children}</>;
  }

  // For other /auth/* routes - also render without BaseLayout
  if (pathname.startsWith('/auth/')) {
    if (isAuthenticated) return <LoadingPage />;
    return <>{children}</>;
  }

  // Hybrid routes: show ProtectedLayout for authenticated users, GuestLayout otherwise
  if (hybridRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    if (isAuthenticated) {
      return (
        <BaseLayout 
          type="protected" 
          user={user} 
          avatarUrl={avatarUrl} 
          displayName={displayName} 
          initials={initials}
        >
          {children}
        </BaseLayout>
      );
    } else {
      return <BaseLayout type="guest">{children}</BaseLayout>;
    }
  }

  // Default to guest layout
  return <BaseLayout type="guest">{children}</BaseLayout>;
}