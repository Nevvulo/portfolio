/// <reference lib="dom" />
import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { LightTheme } from "../../../constants/theme";
import Blog from "../../../pages/blog/index";
import type { Blogmap } from "../../../types/blog";

const mockPosts: Blogmap = [
  {
    slug: "test-post-1",
    title: "Test Post 1",
    description: "This is a test post about React and JavaScript",
    image: "test-image-1.jpg",
    createdAt: "2024-01-01T00:00:00Z",
    labels: ["javascript", "react"],
    location: "posts/test-post-1.mdx",
    difficulty: "beginner",
    readTimeMins: 5,
    discussionId: "D_123",
    discussionNo: 1,
    mediumId: "medium123",
    mediumUrl: "https://medium.com/test",
    hashnodeId: "hashnode123",
    hashnodeUrl: "https://hashnode.com/test",
    devToUrl: "https://dev.to/test",
  },
  {
    slug: "test-post-2",
    title: "Test Post 2",
    description: "Another test post about TypeScript",
    image: "test-image-2.jpg",
    createdAt: "2024-01-02T00:00:00Z",
    labels: ["typescript", "nodejs"],
    location: "posts/test-post-2.mdx",
    difficulty: "intermediate",
    readTimeMins: 10,
    discussionId: "D_124",
    discussionNo: 2,
    mediumId: "medium124",
    mediumUrl: "https://medium.com/test2",
    hashnodeId: "hashnode124",
    hashnodeUrl: "https://hashnode.com/test2",
    devToUrl: "https://dev.to/test2",
  },
];

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={LightTheme}>{component}</ThemeProvider>);
};

describe("Blog Page", () => {
  test("renders without crashing", () => {
    renderWithTheme(<Blog posts={mockPosts} />);
  });

  test("displays blog title and content", () => {
    renderWithTheme(<Blog posts={mockPosts} />);

    // SimpleNavbar renders "Blog" without emoji
    const title = screen.getAllByText(/Blog/i);
    expect(title.length).toBeGreaterThan(0);
  });

  test("renders all blog posts with content", () => {
    renderWithTheme(<Blog posts={mockPosts} />);

    expect(screen.getAllByText("Test Post 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Test Post 2").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("This is a test post about React and JavaScript").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Another test post about TypeScript").length).toBeGreaterThan(0);
  });

  test("displays post labels and read times", () => {
    renderWithTheme(<Blog posts={mockPosts} />);

    expect(screen.getAllByText("javascript").length).toBeGreaterThan(0);
    expect(screen.getAllByText("react").length).toBeGreaterThan(0);
    expect(screen.getAllByText("typescript").length).toBeGreaterThan(0);
    expect(screen.getAllByText("nodejs").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/5 mins/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/10 mins/i).length).toBeGreaterThan(0);
  });

  test("handles empty posts array gracefully", () => {
    renderWithTheme(<Blog posts={[]} />);

    // SimpleNavbar renders "Blog" without emoji
    const navbar = screen.getAllByText(/Blog/i);
    expect(navbar.length).toBeGreaterThan(0);
  });
});
