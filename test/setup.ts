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
mock.module("next/image", () => ({
  default: (props: any) => {
    const { blurDataURL, placeholder, quality, priority, loading, unoptimized, ...rest } = props;
    const src = typeof props.src === "object" ? props.src.src || props.src : props.src;
    
    return React.createElement("img", {
      ...rest,
      src: src,
      loading: loading || "lazy",
    });
  },
}));

// Mock Next.js Link component
mock.module("next/link", () => ({
  default: ({ children, href, passHref, legacyBehavior, scroll, shallow, replace, prefetch, locale, ...props }: any) => {
    // Remove Next.js specific props that shouldn't be on DOM elements
    return React.createElement("a", { href, ...props }, children);
  },
}));

// Mock IntersectionObserver
if (typeof global.IntersectionObserver === "undefined") {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {
      return null;
    }
    unobserve() {
      return null;
    }
    disconnect() {
      return null;
    }
  } as any;
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
  global.fetch = () =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(""),
      blob: () => Promise.resolve(new Blob()),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      headers: new Headers(),
    } as Response);
}