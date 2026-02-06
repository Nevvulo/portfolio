"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { createGlobalStyle, ThemeProvider } from "styled-components";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DarkTheme, LightTheme } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

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
    socialButtonsBlockButtonText: { color: "#fff" },
    userButtonPopoverActionButton: {
      color: "#fff",
      "&:hover": { color: "#fff", backgroundColor: "rgba(79, 77, 193, 0.3)" },
    },
    userButtonPopoverActionButtonText: { color: "#fff" },
    userButtonPopoverActionButtonIcon: { color: "#fff" },
    userButtonPopoverCustomItemButton: {
      color: "#fff",
      "&:hover": { color: "#fff", backgroundColor: "rgba(79, 77, 193, 0.3)" },
    },
    userButtonPopoverCustomItemButtonText: { color: "#fff" },
    userButtonPopoverCustomItemButtonIcon: { color: "#fff" },
    userButtonPopoverFooter: { color: "#bdbdbd" },
    navbarButton: { color: "#fff" },
    navbarButtonIcon: { color: "#fff" },
    tabsListTabButton: {
      color: "#bdbdbd",
      "&[data-active='true']": { color: "#fff" },
    },
    billingTabsListTab: { color: "#bdbdbd" },
    billingTabsListTabActive: { color: "#fff" },
    billingTabsListTab__selected: { color: "#fff" },
    profileSectionContent: { color: "#fff" },
  },
};

const loadMotionFeatures = () => import("@/utils/animation").then((res) => res.animationFeatures);

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

export default function Providers({ children }: { children: React.ReactNode }) {
  const [userTheme] = useTheme();
  const theme = userTheme === "light" ? LightTheme : DarkTheme;
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  // FOUC prevention
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (document.fonts.status === "loaded") {
        document.documentElement.classList.add("fonts-loaded");
      } else {
        document.fonts.ready.then(() => {
          document.documentElement.classList.add("fonts-loaded");
        });
      }
    }
  }, []);

  return (
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ClerkProvider appearance={clerkAppearance}>
            <ThemeProvider theme={theme}>
              <LazyMotion strict features={loadMotionFeatures}>
                <GlobalStyle />
                {children}
              </LazyMotion>
            </ThemeProvider>
          </ClerkProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
