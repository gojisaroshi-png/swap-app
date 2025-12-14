import type { Metadata } from "next";
import "./globals.css";
import { TopBar } from "@/components/ui/top-bar";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/contexts/LanguageContext";

export const metadata: Metadata = {
  title: "Blockchain Lavka",
  description: "Secure, fast, private cryptocurrency exchange - No KYC required",
  icons: {
    icon: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body style={{ fontFamily: '"Helvetica Neue 65 Medium", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <LanguageProvider>
          <TopBar />
          <Toaster />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
