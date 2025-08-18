import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { Link } from "@heroui/link";
import clsx from "clsx";

import { Providers } from "./providers";
import { AuthProvider } from "@/context/AuthContext";
import SessionManager from "@/components/SessionManager";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { NavbarWrapper } from "@/components/NavbarWrapper";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head>
        {/* Google Fonts untuk Orbitron */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <AuthProvider>
            {/* <SessionManager /> */}
            <div className="relative flex flex-col h-screen">
              <NavbarWrapper />
              <main className="flex-grow">
                {children}
              </main>
              <footer className="w-full flex items-center justify-center py-3 bg-gray-900 text-gray-400">
                <div className="text-center">
                  <p className="text-sm">
                    © 2024 {siteConfig.name}. All rights reserved.
                  </p>
                </div>
              </footer>
            </div>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}