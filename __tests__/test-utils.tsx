/// <reference lib="dom" />
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
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

// Theme-only wrapper for components that don't need auth
function ThemeOnlyProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={LightTheme}>{children}</ThemeProvider>;
}

// Full provider stack for complex pages (Theme, ReactQuery)
function FullProvider({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={LightTheme}>{children}</ThemeProvider>
    </QueryClientProvider>
  );
}

/**
 * Render with all providers (ReactQuery, Theme)
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

// Re-export everything from testing-library
export * from "@testing-library/react";
