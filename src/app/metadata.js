// src/app/metadata.js
//
// Sumber tunggal metadata SEO + PWA SuperPOS.
// File ini BUKAN konvensi bawaan Next.js (tidak dibaca otomatis), jadi
// diimpor & di-re-export oleh `src/app/layout.js`.
// Nilai yang dipakai bersama ada di `src/lib/site.js`.

import {
  LOCALE,
  OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  THEME_COLOR,
  TWITTER_CARD,
} from "@/lib/site";

export const metadata = {
  metadataBase: new URL(SITE_URL),

  // ── SEO dasar ────────────────────────────────────────────────────────
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: `${SITE_NAME} Team` }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "business",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // Canonical TIDAK dipasang di root agar setiap halaman tidak dianggap
  // duplikat dari beranda. Canonical diatur per halaman publik yang relevan
  // (lihat src/app/welcome/layout.js dan src/app/auth/*/layout.js).

  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: LOCALE,
    images: [OG_IMAGE],
  },
  twitter: {
    card: TWITTER_CARD,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  // Verifikasi Google Search Console (opsional).
  // Set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION di .env.local dengan nilai
  // dari metode "HTML tag" — cukup kodenya saja, tanpa tag <meta>.
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google:
            process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION.trim(),
        },
      }
    : {}),

  // ── PWA ──────────────────────────────────────────────────────────────
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  icons: {
    icon: [
      { url: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/favicon.ico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: THEME_COLOR,
};
