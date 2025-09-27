import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider } from "@/contexts/user-context";
import { AuthGuard } from "@/components/auth-guard";
import { AppLayout } from "@/components/app-layout";
import { ConsoleFilter } from "@/components/console-filter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pacific Paper Cups - Business Management System",
  description: "Modern business management system for Pacific Paper Cups with customer management, invoicing, and document creation.",
  keywords: ["Pacific Paper Cups", "business", "management", "dashboard", "customers", "invoices"],
  authors: [{ name: "Pacific Paper Cups Team" }],
  openGraph: {
    title: "Pacific Paper Cups",
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
              <AppLayout>
                {children}
              </AppLayout>
            </AuthGuard>
          </UserProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
