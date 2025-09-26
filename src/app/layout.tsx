import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { NavigationSidebar } from "@/components/navigation-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProvider } from "@/contexts/user-context";
import { UserMenu } from "@/components/user-menu";

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
          <UserProvider>
            <div className="flex h-screen">
              <NavigationSidebar />
              <main className="flex-1 overflow-auto">
                <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                  <UserMenu />
                  <ThemeToggle />
                </div>
                {children}
              </main>
            </div>
          </UserProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
