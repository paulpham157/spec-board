import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ShortcutsProvider } from "@/components/shortcuts-provider";

export const metadata: Metadata = {
  title: "SpecBoard - Kanban for Spec-Kit",
  description: "Visual dashboard for spec-kit task management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body className="antialiased min-h-screen">
        <ThemeProvider>
          <ShortcutsProvider>{children}</ShortcutsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
