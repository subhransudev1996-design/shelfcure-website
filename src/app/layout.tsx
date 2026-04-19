import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

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
  openGraph: {
    title: "ShelfCure — AI-Powered Pharmacy Management",
    description:
      "Transform your pharmacy with intelligent inventory management and AI-driven analytics.",
    type: "website",
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
      className={`${manrope.variable} ${inter.variable} antialiased`}
    >
      <body>
        <div style={{ background: "var(--color-surface)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <Header />
          <main style={{ flex: 1 }}>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
