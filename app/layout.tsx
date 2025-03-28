import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";



export const metadata: Metadata = {
  title: "FitTrack Pro - Gym Management Platform",
  description: "Streamline your gym operations with our comprehensive management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
      >
      
        <main className="min-h-screen">{children}</main>
        <Toaster />

      </body>
    </html>
  );
}