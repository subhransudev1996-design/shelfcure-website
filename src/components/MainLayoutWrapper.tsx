"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Don't render marketing header/footer inside the panel dashboard (but keep it on auth pages)
  const isPanel =
    pathname?.startsWith("/panel") &&
    pathname !== "/panel/login" &&
    pathname !== "/panel/register";

  if (isPanel) {
    return <>{children}</>;
  }

  return (
    <div style={{ background: "var(--color-surface)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  );
}
