import type { AppPropsType, AppType } from "next/dist/shared/lib/utils";
import Document, { type DocumentContext, Head, Html, Main, NextScript } from "next/document";
import { ServerStyleSheet } from "styled-components";

export default class MyDocument extends Document {
  static override async getInitialProps(ctx: DocumentContext) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App: AppType) => (props: AppPropsType) =>
            sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);
      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </>
        ),
      };
    } finally {
      sheet.seal();
    }
  }

  override render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          {/* Preload critical fonts for faster LCP */}
          <link
            rel="preload"
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap"
            as="style"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap"
            rel="stylesheet"
            media="print"
            // @ts-expect-error - onLoad sets media to all after load
            onLoad="this.media='all'"
          />
          {/* Non-critical fonts loaded async */}
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;500&family=Fira+Code:wght@400;500;600&family=Roboto+Condensed:wght@700&family=Work+Sans:wght@800&family=Sixtyfour&display=swap"
            rel="stylesheet"
            media="print"
            // @ts-expect-error - onLoad sets media to all after load
            onLoad="this.media='all'"
          />
          <noscript>
            <link
              href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500;600&family=Roboto+Condensed:wght@700&family=Work+Sans:wght@800&family=Sixtyfour&display=swap"
              rel="stylesheet"
            />
          </noscript>
          <link rel="icon" href="/nevulo-logo.svg" type="image/svg+xml" />
          <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
          <meta charSet="utf-8" />

          <meta name="theme-color" content="#9074f2" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
