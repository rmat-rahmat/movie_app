'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthWrapper from "@/components/auth/AuthWrapper";
import I18nProvider from "@/components/i18n/I18nProvider";
import { useEffect } from "react";
import { initializeAuthInterceptor } from "@/lib/authInterceptor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  useEffect(() => {
    // Initialize auth interceptor for automatic token refresh
    // initializeAuthInterceptor();
    
    // Set meta tags dynamically for SPA
    document.title = "OTalk.TV";
    
    const metaTags = [
      { name: "description", content: "Watch your favorite movies and TV shows on OTalk.TV - Your ultimate streaming destination" },
      { name: "keywords", content: "movies, tv shows, streaming, entertainment, watch online" },
      { name: "author", content: "OTalk.TV" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" },
      { name: "theme-color", content: "#FBAF32" },
      { name: "color-scheme", content: "dark light" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { property: "og:url", content: "https://otalk.tv" },
      { property: "og:site_name", content: "OTalk.TV" },
      { property: "og:title", content: "OTalk.TV - Watch Movies & TV Shows" },
      { property: "og:description", content: "Watch your favorite movies and TV shows on OTalk.TV - Your ultimate streaming destination" },
      { property: "og:image", content: "/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "OTalk.TV - Your Ultimate Streaming Destination" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@otalk_tv" },
      { name: "twitter:creator", content: "@otalk_tv" },
      { name: "twitter:title", content: "OTalk.TV - Watch Movies & TV Shows" },
      { name: "twitter:description", content: "Watch your favorite movies and TV shows on OTalk.TV - Your ultimate streaming destination" },
      { name: "twitter:image", content: "/twitter-image.png" },
    ];

    // Remove existing meta tags and add new ones
    metaTags.forEach(({ name, property, content }) => {
      const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
      const existingTag = document.querySelector(selector);
      if (existingTag) {
        existingTag.setAttribute('content', content);
      } else {
        const meta = document.createElement('meta');
        if (name) meta.name = name;
        if (property) meta.setAttribute('property', property);
        meta.content = content;
        document.head.appendChild(meta);
      }
    });

    // Set up favicons and links
    const links = [
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "canonical", href: "https://otalk.tv" }
    ];

    links.forEach(({ rel, href, type, sizes }) => {
      const existingLink = document.querySelector(`link[rel="${rel}"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = rel;
        link.href = href;
        if (type) link.type = type;
        if (sizes) link.setAttribute('sizes', sizes);
        document.head.appendChild(link);
      }
    });
  }, []);

  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider>
          <AuthWrapper>
            {children}
          </AuthWrapper>
        </I18nProvider>
      </body>
    </html>
  );
}
