import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast/ToastProvider";
import { AuthProvider } from "@/lib/auth-context";
import { ClientAuthGuard } from "@/components/auth/ClientAuthGuard";
import { GsapInteractionsProvider } from "@/components/GsapInteractionsProvider";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/lib/theme-context";

import "./globals.css";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "KVO Nagpur — Community Platform",
  description:
    "The official digital platform of KVO Nagpur. Connect with community members, explore the directory, and preserve our heritage together.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* Inline script prevents flash-of-wrong-theme before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <ClientAuthGuard>
                <GsapInteractionsProvider>
                  {children}

                </GsapInteractionsProvider>
              </ClientAuthGuard>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
