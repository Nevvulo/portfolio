/// <reference lib="dom" />
import { mock } from "bun:test";
import React from "react";

// Mock Next.js router
mock.module("next/router", () => ({
  useRouter() {
    return {
      route: "/",
      pathname: "/",
      query: {},
      asPath: "/",
      push: () => Promise.resolve(),
      prefetch: () => Promise.resolve(),
      replace: () => Promise.resolve(),
      reload: () => {},
      back: () => {},
      forward: () => {},
      events: {
        on: () => {},
        off: () => {},
        emit: () => {},
      },
      beforePopState: () => {},
      isFallback: false,
      isLocaleDomain: false,
      isReady: true,
      isPreview: false,
    };
  },
}));

// Mock Next.js Image component
interface ImageProps {
  src: string | { src: string };
  loading?: string;
  blurDataURL?: string;
  placeholder?: string;
  quality?: number;
  priority?: boolean;
  unoptimized?: boolean;
  [key: string]: unknown;
}

mock.module("next/image", () => ({
  default: (props: ImageProps) => {
    const {
      loading,
      priority: _priority,
      placeholder: _placeholder,
      blurDataURL: _blurDataURL,
      quality: _quality,
      unoptimized: _unoptimized,
      fill: _fill,
      sizes: _sizes,
      ...rest
    } = props;
    const src = typeof props.src === "object" ? props.src.src : props.src;

    return React.createElement("img", {
      ...rest,
      src: src,
      loading: loading || "lazy",
    });
  },
}));

// Mock Next.js Link component
interface LinkProps {
  children: React.ReactNode;
  href: string;
  passHref?: boolean;
  legacyBehavior?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  replace?: boolean;
  prefetch?: boolean;
  locale?: string;
  [key: string]: unknown;
}

mock.module("next/link", () => ({
  default: ({
    children,
    href,
    passHref: _passHref,
    legacyBehavior: _legacyBehavior,
    scroll: _scroll,
    shallow: _shallow,
    replace: _replace,
    prefetch: _prefetch,
    locale: _locale,
    ...props
  }: LinkProps) => {
    // Remove Next.js specific props that shouldn't be on DOM elements
    return React.createElement("a", { href, ...props }, children);
  },
}));

// Mock IntersectionObserver
if (typeof global.IntersectionObserver === "undefined") {
  global.IntersectionObserver = class IntersectionObserver {
    observe() {
      return null;
    }
    unobserve() {
      return null;
    }
    disconnect() {
      return null;
    }
  } as unknown as typeof IntersectionObserver;
}

// Mock window.matchMedia
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
      addListener: () => {},
      removeListener: () => {},
    }),
  });
}

// Mock fetch for Next.js Image optimization
if (typeof global.fetch === "undefined") {
  const mockFetch = (() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(""),
      blob: () => Promise.resolve(new Blob()),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      headers: new Headers(),
    } as Response)) as unknown as typeof fetch;

  global.fetch = mockFetch;
}
