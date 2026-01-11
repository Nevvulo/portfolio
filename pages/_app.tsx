import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false; // Prevent FA from adding CSS (we import it above)

import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { LazyMotion } from "framer-motion";
import type { AppProps } from "next/app";
import Head from "next/head";
import Router from "next/router";
import NProgress from "nprogress";
import React, { useState, useEffect } from "react";
import { createGlobalStyle, ThemeProvider } from "styled-components";
import { DarkTheme, LightTheme } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { ConvexClientProvider } from "../lib/convex";
import { LiveKitProvider } from "../lib/lounge/LiveKitContext";
import { JungleMiniPlayer } from "../components/lounge/JungleMiniPlayer";
import "../styles/globals.css"; // Tailwind CSS
import "./nprogress.css"; //styles for nprogress

// Clerk appearance to match site theme
const clerkAppearance = {
  variables: {
    colorPrimary: "#4f4dc1",
    colorBackground: "#100d1b",
    colorText: "#fff",
    colorTextSecondary: "#fff",
    colorTextOnPrimaryBackground: "#fff",
    colorInputBackground: "rgba(50, 50, 50, 0.5)",
    colorInputText: "#fff",
    colorNeutral: "#fff",
    borderRadius: "8px",
  },
  elements: {
    card: {
      backgroundColor: "rgba(30, 30, 40, 0.9)",
      border: "1px solid rgba(79, 77, 193, 0.3)",
      backdropFilter: "blur(10px)",
    },
    formButtonPrimary: {
      background: "linear-gradient(135deg, #4f4dc1, #6b69d6)",
      "&:hover": {
        background: "linear-gradient(135deg, #5d5bcf, #7977e4)",
      },
    },
    socialButtonsBlockButton: {
      border: "1px solid rgba(79, 77, 193, 0.3)",
      color: "#fff",
    },
    socialButtonsBlockButtonText: {
      color: "#fff",
    },
    userButtonPopoverActionButton: {
      color: "#fff",
      "&:hover": {
        color: "#fff",
        backgroundColor: "rgba(79, 77, 193, 0.3)",
      },
    },
    userButtonPopoverActionButtonText: {
      color: "#fff",
    },
    userButtonPopoverActionButtonIcon: {
      color: "#fff",
    },
    "userButtonPopoverActionButton:hover": {
      color: "#fff",
    },
    userButtonPopoverFooter: {
      color: "#bdbdbd",
    },
    navbarButton: {
      color: "#fff",
    },
    navbarButtonIcon: {
      color: "#fff",
    },
    tabsListTabButton: {
      color: "#bdbdbd",
      "&[data-active='true']": {
        color: "#fff",
      },
    },
    billingTabsListTab: {
      color: "#bdbdbd",
    },
    billingTabsListTabActive: {
      color: "#fff",
    },
    "billingTabsListTab__selected": {
      color: "#fff",
    },
    profileSectionContent: {
      color: "#fff",
    },
  },
};

export default function MyApp({ Component, router, pageProps }: AppProps) {
  const [userTheme] = useTheme();
  const theme = userTheme === "light" ? LightTheme : DarkTheme;
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  // FOUC prevention - mark fonts as loaded
  useEffect(() => {
    if (typeof document !== "undefined") {
      // Check if fonts are already loaded (cached)
      if (document.fonts.status === "loaded") {
        document.documentElement.classList.add("fonts-loaded");
      } else {
        document.fonts.ready.then(() => {
          document.documentElement.classList.add("fonts-loaded");
        });
      }
    }
  }, []);

  // Prevent html from scrolling on homepage (scroll happens in #scroll-container)
  useEffect(() => {
    if (typeof document !== "undefined") {
      const isHomepage = router.route === "/" || router.route === "";
      if (isHomepage) {
        document.documentElement.classList.add("page-homepage");
      } else {
        document.documentElement.classList.remove("page-homepage");
      }
    }
  }, [router.route]);

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ClerkProvider appearance={clerkAppearance}>
          <ConvexClientProvider>
            <LiveKitProvider>
              <ThemeProvider theme={theme}>
                <LazyMotion key="app" strict features={loadMotionFeatures}>
                  <GlobalStyle />
                  <MainHead />
                  <div id="scroll-container">
                    <Component {...pageProps} />
                  </div>
                  <JungleMiniPlayer />
                  <Analytics />
                  <SpeedInsights />
                </LazyMotion>
              </ThemeProvider>
            </LiveKitProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

function MainHead() {
  return (
    <Head key="main">
      <title>Nevulo</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="author" content="Blake" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href="https://nev.so" />
    </Head>
  );
}

// Progress bar binding events
Router.events.on("routeChangeStart", () => NProgress.start());
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

const GlobalStyle = createGlobalStyle`
  @property --bled {
    syntax: "<number>";
    initial-value: 0;
    inherits: false;
  }

  @property --scan {
    syntax: "<number>";
    initial-value: 0;
    inherits: false;
  }

  html,
  #__next,
  #root,
  body {
    margin: 0;
    padding: 0;
  }

  body {
    background: ${(props) => props.theme.background};
    color: ${(props) => props.theme.foreground};
  }
`;

const loadMotionFeatures = () => import("../utils/animation").then((res) => res.animationFeatures);
