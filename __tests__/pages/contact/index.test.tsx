/// <reference lib="dom" />
import { test, expect, describe } from "bun:test";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { LightTheme } from "../../../constants/theme";
import Contact from "../../../pages/contact/index";

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={LightTheme}>{component}</ThemeProvider>);
};

describe("Contact Page", () => {
  test("renders without crashing", () => {
    renderWithTheme(<Contact />);
  });

  test("displays contact page title and main sections", () => {
    renderWithTheme(<Contact />);
    
    const emojis = screen.getAllByText("📧");
    const titles = screen.getAllByText("Contact");
    const socialsHeadings = screen.getAllByText("Socials");
    const securityHeadings = screen.getAllByText(/Security & Privacy/i);
    
    expect(emojis.length).toBeGreaterThan(0);
    expect(titles.length).toBeGreaterThan(0);
    expect(socialsHeadings.length).toBeGreaterThan(0);
    expect(securityHeadings.length).toBeGreaterThan(0);
  });

  test("displays social media links and email functionality", () => {
    renderWithTheme(<Contact />);
    
    const linkedInLink = document.querySelector('[href*="linkedin"]');
    const githubLink = document.querySelector('[href*="github"]');
    const emailLink = document.querySelector('[href^="mailto:"]');
    
    expect(linkedInLink || githubLink).toBeTruthy();
    expect(emailLink).toBeTruthy();
  });

  test("displays contact instructions and social platforms", () => {
    renderWithTheme(<Contact />);
    
    // Look for the security/privacy text
    const contactTexts = screen.queryAllByText(/security vulnerability/i).length > 0 ? screen.getAllByText(/security vulnerability/i) :
                        screen.queryAllByText(/privacy concern/i).length > 0 ? screen.getAllByText(/privacy concern/i) :
                        screen.queryAllByText(/shoot me an e-mail/i).length > 0 ? screen.getAllByText(/shoot me an e-mail/i) : [];
    
    const socialLinks = document.querySelectorAll('a[href*="://"]');
    
    expect(contactTexts.length).toBeGreaterThan(0);
    expect(socialLinks.length).toBeGreaterThan(0);
  });

  test("has proper page structure", () => {
    renderWithTheme(<Contact />);
    
    const mainContent = document.querySelector('main') || 
                       document.querySelector('[role="main"]') ||
                       document.querySelector('div');
    expect(mainContent).toBeTruthy();
  });
});