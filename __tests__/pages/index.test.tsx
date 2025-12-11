/// <reference lib="dom" />
import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { LightTheme } from "../../constants/theme";
import Home from "../../pages/index";

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={LightTheme}>{component}</ThemeProvider>);
};

describe("Home Page", () => {
  test("renders without crashing", () => {
    renderWithTheme(<Home discordWidget={null} isLive={false} />);
  });

  test("displays main content with name and location", () => {
    renderWithTheme(<Home discordWidget={null} isLive={false} />);

    const nameElements = screen.getAllByText(/Blake/i);
    const subtitles = screen.getAllByText(/software engineer based in Melbourne, Australia/i);

    expect(nameElements.length).toBeGreaterThan(0);
    expect(subtitles.length).toBeGreaterThan(0);
  });

  test("has all navigation buttons", () => {
    renderWithTheme(<Home discordWidget={null} isLive={false} />);

    expect(screen.getAllByText("📖 Blog").length).toBeGreaterThan(0);
    expect(screen.getAllByText("🛠 Projects").length).toBeGreaterThan(0);
    expect(screen.getAllByText("👋 About Me").length).toBeGreaterThan(0);
    expect(screen.getAllByText("📧 Contact").length).toBeGreaterThan(0);
  });

  test("displays social links", () => {
    renderWithTheme(<Home discordWidget={null} isLive={false} />);

    const socialLinksContainer = document.querySelector('[href*="github.com"]');

    expect(socialLinksContainer).toBeTruthy();
  });

  test("renders avatar image", () => {
    renderWithTheme(<Home discordWidget={null} isLive={false} />);

    const avatarImg =
      document.querySelector('img[alt*="Avatar"]') || document.querySelector('img[src*="nevulo"]');
    expect(avatarImg).toBeTruthy();
  });
});
