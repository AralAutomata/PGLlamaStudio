import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PG Studio - PostgreSQL Client",
  description: "A modern browser-based PostgreSQL client with Drizzle ORM integration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  );
}