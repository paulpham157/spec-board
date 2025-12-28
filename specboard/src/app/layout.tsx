import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
