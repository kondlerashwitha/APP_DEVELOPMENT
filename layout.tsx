import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { CosmicAnalyticsProvider } from "cosmic-analytics";

const primaryFont = Geist({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

// Change the title and description to your own.
export const metadata: Metadata = {
  title: "SignBoard Reader - Assistive Technology App",
  description: "An innovative app that reads text from signboards and documents aloud in Telugu, Hindi, and English. Designed for visually impaired users with clap activation.",
};

export default function RootLayout({
  children,
  
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={primaryFont.className}>
      <body className="antialiased">
        <main className="h-screen">
          <CosmicAnalyticsProvider>
            {children}
          </CosmicAnalyticsProvider>
        </main>
      </body>
    </html>
  );
}
