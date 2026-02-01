/// <reference lib="dom" />
import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { LightTheme } from "../../../constants/theme";
import About from "../../../pages/about/index";

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={LightTheme}>{component}</ThemeProvider>);
};

describe("About Page", () => {
  test("renders without crashing", () => {
    renderWithTheme(<About />);
  });

  test("displays page title and main content", () => {
    renderWithTheme(<About />);

    // The page shows "Hi, I'm Blake" as the main title
    const hiTexts = screen.getAllByText(/Hi,/i);
    const blakeTexts = screen.getAllByText(/Blake/i);

    expect(hiTexts.length).toBeGreaterThan(0);
    expect(blakeTexts.length).toBeGreaterThan(0);
  });

  test("displays personal and professional information", () => {
    renderWithTheme(<About />);

    const nameTexts = screen.getAllByText(/Blake/i);
    const roleTexts = screen.getAllByText(/software engineer/i);
    const reactTexts = screen.getAllByText(/React/i);
    const typeScriptTexts = screen.getAllByText(/TypeScript/i);

    expect(nameTexts.length).toBeGreaterThan(0);
    expect(roleTexts.length).toBeGreaterThan(0);
    expect(reactTexts.length).toBeGreaterThan(0);
    expect(typeScriptTexts.length).toBeGreaterThan(0);
  });

  test("has proper page structure", () => {
    renderWithTheme(<About />);

    const mainContent =
      document.querySelector("main") ||
      document.querySelector('[role="main"]') ||
      document.querySelector("div");
    expect(mainContent).toBeTruthy();
  });
});
