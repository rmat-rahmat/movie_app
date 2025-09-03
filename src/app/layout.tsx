import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthWrapper from "@/components/auth/AuthWrapper";
import I18nProvider from "@/components/i18n/I18nProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "OTalk.TV",
    template: "%s | OTalk.TV"
  },
  description: "Watch your favorite movies and TV shows on OTalk.TV - Your ultimate streaming destination",
  keywords: ["movies", "tv shows", "streaming", "entertainment", "watch online"],
  authors: [{ name: "OTalk.TV" }],
  creator: "OTalk.TV",
  publisher: "OTalk.TV",
  
  // Open Graph metadata for social sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://otalk.tv",
    siteName: "OTalk.TV",
    title: "OTalk.TV - Watch Movies & TV Shows",
    description: "Watch your favorite movies and TV shows on OTalk.TV - Your ultimate streaming destination",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OTalk.TV - Your Ultimate Streaming Destination",
      },
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "OTalk.TV Logo",
      }
    ],
  },
  
  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    site: "@otalk_tv",
    creator: "@otalk_tv",
    title: "OTalk.TV - Watch Movies & TV Shows",
    description: "Watch your favorite movies and TV shows on OTalk.TV - Your ultimate streaming destination",
    images: ["/twitter-image.png"],
  },
  
  // Icons and manifest
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
    other: [
      { rel: "mask-icon", url: "/favicon.svg", color: "#FBAF32" }
    ]
  },
  
  manifest: "/manifest.json",
  
  // Additional metadata
  metadataBase: new URL("https://otalk.tv"),
  alternates: {
    canonical: "https://otalk.tv",
  },
  
  // Verification (add your actual verification codes)
  verification: {
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  
  // App-specific metadata
  applicationName: "OTalk.TV",
  category: "entertainment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#FBAF32" />
        <meta name="color-scheme" content="dark light" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
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
