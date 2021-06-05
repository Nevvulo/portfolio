import React from "react";
import "@testing-library/jest-dom";
import { screen, render } from "@testing-library/react";
import ProjectPage, { Projects } from "../../pages/projects";
import { BrowserRouter } from "react-router-dom";
import { ROUTES } from "../../constants/routes";

const ProjectsContents = () => (
  <BrowserRouter>
    <ProjectPage />
  </BrowserRouter>
);

describe("projects page", () => {
  it('should render "Projects" title', () => {
    render(<ProjectsContents />);
    expect(screen.queryByRole("heading")).toHaveTextContent("Projects");
  });
  it("should render back button", () => {
    render(<ProjectsContents />);
    // should take users back to home page
    expect(screen.getByRole("link")).toHaveAttribute("href", ROUTES.ROOT);
  });
  it("should show all projects on page load", () => {
    render(<ProjectsContents />);
    // should take users back to home page
    expect(screen.getByRole("link")).toHaveAttribute("href", ROUTES.ROOT);
    expect(screen.getAllByTestId("project")).toHaveLength(Projects.length);
  });
});
