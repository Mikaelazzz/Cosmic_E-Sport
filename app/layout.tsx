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
  // description: siteConfig.description,
  icons: {
    icon: "/logc.png",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        {/* Essential Meta Tags for Mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
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
            <div className="relative flex flex-col min-h-screen">
              <NavbarWrapper />
              <main className="flex-grow">
                {children}
              </main>
              <footer className="w-full border-t border-blue-900 pt-8 pb-2 px-4">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-white pb-4">
                  {/* Tentang */}
                  <div>
                    <h3 className="text-[#FFD700] font-bold text-lg mb-2">Cosmic</h3>
                    <p className="text-sm leading-relaxed text-gray-200 text-justify">
                      COSMIC didirikan pada tahun 2023 sebagai wadah bagi para gamer kampus untuk mengembangkan bakat dan meraih prestasi di dunia e-sport. Kami percaya bahwa setiap pemain memiliki potensi untuk menjadi bintang.
                    </p>
                  </div>
                  {/* Quick Links */}
                  <div>
                    <h3 className="text-[#FFD700] font-bold text-lg mb-2">Quick Links</h3>
                    <ul className="space-y-1">
                      <li><a href="/#tentang" className="hover:text-[#FFD700] transition-colors">Tentang Kami</a></li>
                      <li><a href="/#pengurus" className="hover:text-[#FFD700] transition-colors">Pengurus</a></li>
                      <li><a href="/#prestasi" className="hover:text-[#FFD700] transition-colors">Prestasi</a></li>
                    </ul>
                  </div>
                  {/* Follow Us */}
                  <div>
                    <h3 className="text-[#FFD700] font-bold text-lg mb-2">Follow Us</h3>
                    <div className="flex flex-col text-lg space-x-4 mt-2">
                      <ul className="space-y-1">
                      <li><a href="#" target="blank" className="hover:text-[#FFD700] transition-colors">Discord Cosmic</a></li>
                      <li><a href="https://www.instagram.com/cosmic.ukdc/" target="blank" className="hover:text-[#FFD700] transition-colors">Instagram Cosmic</a></li>
                      <li><a href="#" target="blank" className="hover:text-[#FFD700] transition-colors">Whatsapp Cosmic</a></li>
                    </ul>
                    </div>
                  </div>
                </div>
                <div className="border-t border-blue-900 my-2"></div>
                <div className="text-center text-gray-400 text-sm pb-2">
                  © 2025 Cosmic E-Sports. All rights reserved
                </div>
              </footer>
            </div>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}