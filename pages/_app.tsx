import { AnimateSharedLayout, LazyMotion } from "framer-motion";
import { AppProps } from "next/app";
import Head from "next/head";
import Router from "next/router";
import NProgress from "nprogress";
import React from "react";
import { createGlobalStyle, ThemeProvider } from "styled-components";
import { AnimatedRoutes } from "../components/routing/animated-routes";
import { DarkTheme, LightTheme } from "../constants/theme";
import { useAnalytics } from "../hooks/useAnalytics";
import { useTheme } from "../hooks/useTheme";
import "./nprogress.css"; //styles for nprogress

export default function MyApp({ Component, router, pageProps }: AppProps) {
  const [userTheme] = useTheme();
  useAnalytics("NBVZGEFK");
  const theme = userTheme === "light" ? LightTheme : DarkTheme;

  return (
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <LazyMotion strict features={loadMotionFeatures}>
          <AnimateSharedLayout type="crossfade">
            <GlobalStyle />
            <MainHead />
            <AnimatedRoutes currentRoute={router.route}>
              <Component {...pageProps} />
            </AnimatedRoutes>
          </AnimateSharedLayout>
        </LazyMotion>
      </ThemeProvider>
    </React.StrictMode>
  );
}

function MainHead() {
  return (
    <Head key="main">
      <title>Nevulo</title>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="crossorigin"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500;600;700;800&family=Roboto+Condensed:wght@700&family=Work+Sans:wght@800"
        rel="stylesheet preconnect"
      />
      <link rel="icon" href="favicon.ico" />

      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <meta property="og:title" content="Hi there, I'm Blake!" />
      <meta
        property="og:description"
        content="I'm a software engineer based in Australia working at Flux. Click this link to learn more about me!"
      />
      <meta property="og:url" content="https://nevulo.xyz" />
      <meta
        property="og:image"
        content="https://massive-legend.nevulo.xyz/2aRAq5aL.png"
      />
      <meta name="theme-color" content="#9074f2" />
    </Head>
  );
}

// Progress bar binding events
Router.events.on("routeChangeStart", () => NProgress.start());
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

const GlobalStyle = createGlobalStyle`
  html,
  #__next,
  #root,
  body {
    height: 100%;
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
