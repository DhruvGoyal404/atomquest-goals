import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "AtomQuest Goals — Enterprise Goal Setting & Tracking",
    template: "%s — AtomQuest Goals",
  },
  description:
    "Plan, approve, and track employee goals across every department. FY 2026-27 goal management with real-time analytics, AI suggestions, and Microsoft Teams integration.",
  keywords: [
    "goal management",
    "OKR",
    "performance tracking",
    "employee goals",
    "HR portal",
    "AtomQuest",
    "hackathon 2026",
  ],
  authors: [{ name: "Dhruv Goyal" }],
  creator: "Dhruv Goyal",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "AtomQuest Goals",
    title: "AtomQuest Goals — Enterprise Goal Setting & Tracking",
    description:
      "Plan, approve, and track employee goals across every department. FY 2026-27 goal management with real-time analytics, AI suggestions, and Microsoft Teams integration.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AtomQuest Goals",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AtomQuest Goals — Enterprise Goal Setting & Tracking",
    description:
      "Plan, approve, and track employee goals across every department. Real-time analytics, AI suggestions, Microsoft Teams integration.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
