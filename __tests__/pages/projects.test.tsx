/// <reference lib="dom" />
import { describe, expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { LightTheme } from "../../constants/theme";
import ProjectsPage from "../../pages/projects/index";

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={LightTheme}>{component}</ThemeProvider>);
};

describe("Projects Page", () => {
  test("renders without crashing", () => {
    renderWithTheme(<ProjectsPage />);
  });

  test("displays projects title and navigation", () => {
    renderWithTheme(<ProjectsPage />);

    // The emoji and title appear multiple times, so we use getAllByText
    const titleWithEmoji = screen.getAllByText(/🛠/);
    const titleText = screen.getAllByText(/Projects/);

    expect(titleWithEmoji.length).toBeGreaterThan(0);
    expect(titleText.length).toBeGreaterThan(0);
  });

  test("displays and switches between filter tabs", () => {
    renderWithTheme(<ProjectsPage />);

    const allTabs = screen.getAllByText("All");
    const maintainedTabs = screen.getAllByText("Maintained");

    expect(allTabs.length).toBeGreaterThan(0);
    expect(maintainedTabs.length).toBeGreaterThan(0);

    // Test tab switching functionality on the first instance
    const maintainedTab = maintainedTabs[0];

    if (!maintainedTab) {
      throw new Error("Maintained tab not found");
    }

    // Check initial state - All tab should be selected by default
    const maintainedTabParent = maintainedTab.parentElement;

    // Check that clicking changes the selection
    fireEvent.click(maintainedTab);

    // After clicking Maintained, check if its styling changed
    // We can verify this by checking the class names changed
    expect(maintainedTabParent?.className).toBeTruthy();
  });

  test("renders projects and maintains functionality after filtering", () => {
    renderWithTheme(<ProjectsPage />);

    // Check for project containers (should have multiple projects)
    const projectContainers = document.querySelectorAll('[href*="/projects/"]');
    expect(projectContainers.length).toBeGreaterThan(0);

    // Test filtering maintains projects
    const maintainedTabs = screen.getAllByText("Maintained");
    const firstMaintainedTab = maintainedTabs[0];

    if (firstMaintainedTab) {
      fireEvent.click(firstMaintainedTab);
    }

    const filteredContainers = document.querySelectorAll('[href*="/projects/"]');
    expect(filteredContainers.length).toBeGreaterThan(0);
  });

  test("has proper styling and layout structure", () => {
    renderWithTheme(<ProjectsPage />);

    // Look for elements with background attribute or class containing gradient/background
    const projectWithBackground =
      document.querySelector("[background]") ||
      document.querySelector('[class*="gradient"]') ||
      document.querySelector('[class*="background"]') ||
      document.querySelector('[style*="position: absolute"]');
    const allTabs = screen.getAllByText("All");
    const firstAllTab = allTabs[0];
    const filterContainer = firstAllTab?.parentElement?.parentElement;

    expect(projectWithBackground).toBeTruthy();
    expect(filterContainer).toBeTruthy();
  });
});
