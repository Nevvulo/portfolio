import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import StyledComponentsRegistry from "./registry";
import Providers from "./providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Nevulo",
    template: "%s | Nevulo",
  },
  description: "Blake's personal portfolio — articles, projects, software, and more.",
  metadataBase: new URL("https://nev.so"),
  authors: [{ name: "Blake" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nev.so",
    siteName: "Nevulo",
    title: "Nevulo",
    description: "Blake's personal portfolio — articles, projects, software, and more.",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/nevulo-logo.svg",
  },
  other: {
    "theme-color": "#100d1b",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@300;400;500;600;700;800&family=Roboto+Condensed:wght@700&family=Work+Sans:wght@800&family=Protest+Revolution&family=Sixtyfour&display=swap"
          rel="stylesheet"
        />
        <link rel="me" href="https://lounge.nev.so/@nevulo" />
        <link rel="me" href="https://github.com/Nevvulo" />
      </head>
      <body>
        <StyledComponentsRegistry>
          <Providers>
            <div id="scroll-container">{children}</div>
            <Analytics />
            <SpeedInsights />
          </Providers>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
