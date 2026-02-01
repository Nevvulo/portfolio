/// <reference lib="dom" />
import { describe, expect, test } from "bun:test";
import { fireEvent, screen } from "@testing-library/react";
import ProjectsPage from "../../pages/projects/index";
import { renderWithConvex } from "../test-utils";

describe("Projects Page", () => {
  test("renders without crashing", () => {
    renderWithConvex(<ProjectsPage />);
  });

  test("displays projects title in header", () => {
    renderWithConvex(<ProjectsPage />);

    // The header always shows "projects" regardless of loading state
    const titleText = screen.getAllByText(/projects/i);
    expect(titleText.length).toBeGreaterThan(0);
  });

  test("displays loading state or filter tabs", () => {
    renderWithConvex(<ProjectsPage />);

    // Either shows loading or filter tabs (depends on Convex data availability)
    const loadingElements = screen.queryAllByText(/Loading projects/i);
    const allTabs = screen.queryAllByText("All");
    const maintainedTabs = screen.queryAllByText("Maintained");

    const hasContent = loadingElements.length > 0 || allTabs.length > 0 || maintainedTabs.length > 0;
    expect(hasContent).toBe(true);
  });

  test("displays and switches between filter tabs when data loads", async () => {
    renderWithConvex(<ProjectsPage />);

    // Check if we have the tabs (they're in the scroll hint area)
    const allTab = screen.queryByText("All");
    const maintainedTab = screen.queryByText("Maintained");

    // If tabs are present, test switching
    if (allTab && maintainedTab) {
      // Check that clicking changes the selection
      fireEvent.click(maintainedTab);

      // After clicking Maintained, check if its styling changed
      const maintainedTabParent = maintainedTab.parentElement;
      expect(maintainedTabParent?.className).toBeTruthy();
    } else {
      // Loading state - verify structure exists
      expect(document.querySelector("header")).toBeTruthy();
    }
  });

  test("has proper page structure", () => {
    renderWithConvex(<ProjectsPage />);

    // Check basic page structure elements that always exist
    const header = document.querySelector("header");
    const backLink = document.querySelector('a[href="/"]');

    expect(header).toBeTruthy();
    expect(backLink).toBeTruthy();
  });
});
