/**
 * KotobaFlow AI — Root Layout
 *
 * Sets up the global HTML shell for the web-companion site:
 * - Google Fonts: Geist (sans/mono) and Noto Sans JP (Japanese)
 * - SEO metadata including OpenGraph and Japanese keywords
 * - Top navigation bar with links to Home and Word List
 * - Footer
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "KotobaFlow AI - Japanese Pitch Accent & Furigana for Google Docs",
    template: "%s | KotobaFlow AI",
  },
  description:
    "Free Chrome extension for real-time Japanese pitch accent visualization and furigana overlays in Google Docs. Master standard Japanese pronunciation with AI-powered analysis.",
  keywords: [
    "Japanese pitch accent",
    "furigana",
    "Google Docs Japanese",
    "Japanese pronunciation",
    "標準語 ピッチアクセント",
    "振り仮名",
  ],
  openGraph: {
    title: "KotobaFlow AI - Japanese Pitch Accent & Furigana",
    description:
      "Real-time pitch accent visualization and furigana overlays in Google Docs.",
    siteName: "KotobaFlow AI",
    type: "website",
    locale: "ja_JP",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansJP.variable} h-full antialiased`}
    >
      <body className="font-sans min-h-full flex flex-col">
        <header className="border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2">
            <span className="text-indigo-600 font-bold text-lg">KotobaFlow</span>
            <span className="text-xs text-gray-400 font-medium">AI</span>
            <nav className="ml-auto flex gap-6 text-sm text-gray-500">
              <Link href="/" className="hover:text-indigo-600 transition-colors">
                Home
              </Link>
              <Link
                href="/japanese-pitch-accent"
                className="hover:text-indigo-600 transition-colors"
              >
                Word List
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
          <div className="max-w-6xl mx-auto px-4">
            <p>&copy; {new Date().getFullYear()} KotobaFlow AI. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
