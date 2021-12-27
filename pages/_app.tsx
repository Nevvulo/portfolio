import * as Fathom from "fathom-client";
import {
  AnimatePresence,
  AnimateSharedLayout,
  domAnimation,
  LazyMotion,
  m,
} from "framer-motion";
import { SessionProvider } from "next-auth/react";
import { AppProps } from "next/app";
import Head from "next/head";
import Router, { useRouter } from "next/router";
import NProgress from "nprogress"; //nprogress module
import React, { useEffect } from "react";
import { createGlobalStyle, ThemeProvider } from "styled-components";
import { useTheme } from "../hooks/useTheme";
import "./nprogress.css"; //styles of nprogress

//Binding events.
Router.events.on("routeChangeStart", () => NProgress.start());
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

const BodyStyle = createGlobalStyle`
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

const DarkTheme = {
  background: "#151515",
  foreground: "#fff",
  contrast: "#fff",
  pure: "#fff",
  textColor: "#bdbdbd",
  postBackground: "rgba(50, 50, 50, 0.5)",
  linkColor: "#9074f2",
  postImageBoxShadow: "rgba(0, 0, 0, 0.5)",
};

const LightTheme = {
  background: "#fff",
  foreground: "#212121",
  contrast: "#000",
  pure: "#fff",
  textColor: "#212121",
  linkColor: "#9074f2",
  postBackground: "rgba(225, 225, 225, 0.5)",
  postImageBoxShadow: "rgba(210, 210, 210, 0.5)",
};

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  // Fathom analytics
  useEffect(() => {
    Fathom.load("NBVZGEFK", {
      includedDomains: ["nevulo.xyz", "www.nevulo.xyz"],
    });

    function onRouteChangeComplete() {
      Fathom.trackPageview();
    }
    // Record a pageview when route changes
    router.events.on("routeChangeComplete", onRouteChangeComplete);

    // Unassign event listener
    return () => {
      router.events.off("routeChangeComplete", onRouteChangeComplete);
    };
  }, []);

  const [theme] = useTheme();
  const mode = theme === "light" ? LightTheme : DarkTheme;
  return (
    <React.StrictMode>
      <LazyMotion strict features={domAnimation}>
        <AnimateSharedLayout type="crossfade">
          <SessionProvider session={pageProps.session}>
            <ThemeProvider theme={mode}>
              <BodyStyle />
              <Content />
              <AnimatePresence exitBeforeEnter>
                <m.div
                  key={router.route.concat("animate")}
                  style={{ height: "100%" }}
                  initial={{
                    transformOrigin: "center",
                    opacity: 0.5,
                  }}
                  animate={{
                    transformOrigin: "center",
                    opacity: 1,
                    transition: { duration: 0.1 },
                  }}
                  exit={{
                    transformOrigin: "center",
                    opacity: 0,
                    transition: { duration: 0.2 },
                  }}
                >
                  <Component {...pageProps} />
                </m.div>
              </AnimatePresence>
            </ThemeProvider>
          </SessionProvider>
        </AnimateSharedLayout>
      </LazyMotion>
    </React.StrictMode>
  );
}

function Content() {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Hi there, I'm Blake!" />
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta
          http-equiv="Content-Type"
          content="text/html; charset=ISO-8859-1"
        ></meta>
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
        <link rel="icon" href="favicon.ico" />
        <title>Nevulo</title>

        <style jsx>
          {`
            @import url("https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700;800&family=Roboto+Condensed:wght@700&family=Space+Grotesk:wght@300;400;600;700&display=swap");
            @import url("https://fonts.googleapis.com/css2?family=Cousine:wght@700&display=swap");
            @import url("https://fonts.googleapis.com/css2?family=Fira+Code:wght@200;300;400;500;600;700;800&display=swap");
          `}
        </style>
      </Head>
    </>
  );
}
