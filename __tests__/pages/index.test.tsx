/// <reference lib="dom" />
import { describe, expect, mock, test } from "bun:test";
import { screen } from "@testing-library/react";

// Mock Clerk components to avoid router dependency
mock.module("@clerk/nextjs", () => ({
  SignedIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignedOut: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  UserButton: () => null,
  useAuth: () => ({ isSignedIn: false, userId: null }),
  useUser: () => ({ user: null, isLoaded: true }),
}));

import Home from "../../pages/index";
import { renderWithProviders } from "../test-utils";

describe("Home Page", () => {
  test("renders without crashing", () => {
    renderWithProviders(<Home discordWidget={null} isLive={false} staticLearnPosts={null} staticProjects={null} staticFeaturedSoftware={null} staticStreamSettings={null} staticUpcomingEvents={null} />);
  });

  test("displays hero section", () => {
    renderWithProviders(<Home discordWidget={null} isLive={false} staticLearnPosts={null} staticProjects={null} staticFeaturedSoftware={null} staticStreamSettings={null} staticUpcomingEvents={null} />);

    // Check for main title/branding (may appear multiple times)
    const titles = screen.queryAllByText(/nevulo/i);
    expect(titles.length).toBeGreaterThan(0);
  });

  test("displays navigation links", () => {
    renderWithProviders(<Home discordWidget={null} isLive={false} staticLearnPosts={null} staticProjects={null} staticFeaturedSoftware={null} staticStreamSettings={null} staticUpcomingEvents={null} />);

    // Check for nav links that are always present
    const aboutLink = document.querySelector('a[href*="about"]');
    const contactLink = document.querySelector('a[href*="contact"]');
    const projectsLink = document.querySelector('a[href*="projects"]');

    expect(aboutLink || contactLink || projectsLink).toBeTruthy();
  });

  test("displays social links", () => {
    renderWithProviders(<Home discordWidget={null} isLive={false} staticLearnPosts={null} staticProjects={null} staticFeaturedSoftware={null} staticStreamSettings={null} staticUpcomingEvents={null} />);

    const socialLinksContainer = document.querySelector('[href*="github.com"]');
    expect(socialLinksContainer).toBeTruthy();
  });

  test("has proper page structure", () => {
    renderWithProviders(<Home discordWidget={null} isLive={false} staticLearnPosts={null} staticProjects={null} staticFeaturedSoftware={null} staticStreamSettings={null} staticUpcomingEvents={null} />);

    // Check that page sections exist
    const sections = document.querySelectorAll("section");
    expect(sections.length).toBeGreaterThan(0);
  });
});
