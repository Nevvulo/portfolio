/// <reference lib="dom" />
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactElement, ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { LightTheme } from "../constants/theme";

// Create a QueryClient for tests
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

// Mock Convex client for testing - use a test deployment URL if available
const mockConvexClient = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://test-deployment.convex.cloud",
);

// Theme-only wrapper for components that don't need auth/convex
function ThemeOnlyProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={LightTheme}>{children}</ThemeProvider>;
}

// Full provider stack for complex pages (Convex, Theme, ReactQuery)
function FullProvider({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ConvexProvider client={mockConvexClient}>
        <ThemeProvider theme={LightTheme}>{children}</ThemeProvider>
      </ConvexProvider>
    </QueryClientProvider>
  );
}

// Convex + Theme wrapper (no React Query)
function ConvexThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={mockConvexClient}>
      <ThemeProvider theme={LightTheme}>{children}</ThemeProvider>
    </ConvexProvider>
  );
}

/**
 * Render with all providers (ReactQuery, Convex, Theme)
 * Use this for complex pages that need all providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: FullProvider, ...options });
}

/**
 * Render with theme only
 * Use for simple presentational components
 */
export function renderWithTheme(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: ThemeOnlyProvider, ...options });
}

/**
 * Render with Convex and theme (no auth, no React Query)
 * Use for components that fetch Convex data but don't need React Query
 */
export function renderWithConvex(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: ConvexThemeProvider, ...options });
}

// Re-export everything from testing-library
export * from "@testing-library/react";
