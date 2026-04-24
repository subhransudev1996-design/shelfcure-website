import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShelfCure — AI-Powered Pharmacy Management",
  description:
    "Transform your pharmacy with ShelfCure's intelligent inventory management, AI-driven analytics, and seamless billing. Smart Pharmacy. Simple Care.",
  keywords: [
    "pharmacy management",
    "inventory management",
    "pharmacy software",
    "AI analytics",
    "pharmacy billing",
    "medicine tracking",
  ],
  icons: {
    icon: "/Icon.png",
    shortcut: "/Icon.png",
    apple: "/Icon.png",
  },
  openGraph: {
    title: "ShelfCure — AI-Powered Pharmacy Management",
    description:
      "Transform your pharmacy with intelligent inventory management and AI-driven analytics.",
    type: "website",
  },
};

import { MainLayoutWrapper } from "@/components/MainLayoutWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${inter.variable} antialiased`}
      data-scroll-behavior="smooth"
    >
      <body suppressHydrationWarning>
        <MainLayoutWrapper>{children}</MainLayoutWrapper>
      </body>
    </html>
  );
}
