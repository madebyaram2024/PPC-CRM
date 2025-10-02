import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider } from "@/contexts/user-context";
import { AuthGuard } from "@/components/auth-guard";
import { AppLayout } from "@/components/app-layout";
import { ConsoleFilter } from "@/components/console-filter";
import { NotificationsProvider } from "@/components/notifications-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "US PAPER CUP FACTORY - Business Management System",
  description: "Modern business management system for US PAPER CUP FACTORY with customer management, invoicing, and document creation.",
  keywords: ["US PAPER CUP FACTORY", "business", "management", "dashboard", "customers", "invoices"],
  authors: [{ name: "US PAPER CUP FACTORY Team" }],
  openGraph: {
    title: "US PAPER CUP FACTORY",
    description: "Business Management System",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConsoleFilter />
          <UserProvider>
            <AuthGuard>
              <NotificationsProvider>
                <AppLayout>
                  {children}
                </AppLayout>
              </NotificationsProvider>
            </AuthGuard>
          </UserProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
