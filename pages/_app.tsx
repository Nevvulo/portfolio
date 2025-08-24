import { Analytics } from "@vercel/analytics/react";
import { LazyMotion } from "framer-motion";
import { SessionProvider } from "next-auth/react";
import { AppProps } from "next/app";
import Head from "next/head";
import Router from "next/router";
import NProgress from "nprogress";
import React from "react";
import { createGlobalStyle, ThemeProvider } from "styled-components";
import { AnimatedRoutes } from "../components/routing/animated-routes";
import { DarkTheme, LightTheme } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import "./nprogress.css"; //styles for nprogress

export default function MyApp({ Component, router, pageProps }: AppProps) {
  const [userTheme] = useTheme();
  const theme = userTheme === "light" ? LightTheme : DarkTheme;

  return (
    <React.StrictMode>
      <SessionProvider>
        <ThemeProvider theme={theme}>
          <LazyMotion key="app" strict features={loadMotionFeatures}>
            <GlobalStyle />
            <MainHead />
            <AnimatedRoutes currentRoute={router.route}>
              <Component {...pageProps} />
            </AnimatedRoutes>
            <Analytics />
          </LazyMotion>
        </ThemeProvider>
      </SessionProvider>
    </React.StrictMode>
  );
}

function MainHead() {
  return (
    <Head key="main">
      <title>Nevulo</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>
  );
}

// Progress bar binding events
Router.events.on("routeChangeStart", () => NProgress.start());
Router.events.on("routeChangeComplete", (url) => {
  if (url.startsWith("/blog/")) window.scroll({ top: 0 });
  NProgress.done();
});
Router.events.on("routeChangeError", () => NProgress.done());

const GlobalStyle = createGlobalStyle`
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

const loadMotionFeatures = () =>
  import("../utils/animation").then((res) => res.animationFeatures);
