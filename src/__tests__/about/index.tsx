import React from "react";
import "@testing-library/jest-dom";
import { screen, render } from "@testing-library/react";
import About from "../../pages/about";
import { BrowserRouter } from "react-router-dom";
import { ROUTES } from "../../constants/routes";

const AboutContents = () => (
  <BrowserRouter>
    <About />
  </BrowserRouter>
);

describe("about page", () => {
  it('should render "About" title', () => {
    render(<AboutContents />);
    expect(screen.queryByRole("heading")).toHaveTextContent("About Me");
  });
  it("should render back button", () => {
    render(<AboutContents />);
    // should take users back to home page
    expect(screen.getByRole("link")).toHaveAttribute("href", ROUTES.ROOT);
  });
});
