import { AnimateSharedLayout } from "framer-motion";
import React from "react";
import { render } from "react-dom";
import { BrowserRouter as Router, Route } from "react-router-dom";
import { createGlobalStyle } from "styled-components";
import { AnimatedRoutes } from "./components/routing/animated-routes";
import { RouteTransition } from "./components/routing/route-transition";
import { ROUTES } from "./constants/routes";
import About from "./pages/about";
import Contact from "./pages/contact";
import Home from "./pages/home";
import Projects from "./pages/projects";
import "./styles.module.scss";

const GlobalStyle = createGlobalStyle`
  @media (prefers-color-scheme: dark) {
    body {
      background: #151515;
      color: white;
    }

    h1, svg[data-icon='arrow-left'] {
      color: white !important;
    }
  }
`;

const Application: React.FC = () => {
  return (
    <React.StrictMode>
      <Router>
        <GlobalStyle />
        <AnimateSharedLayout type="crossfade">
          <AnimatedRoutes exitBeforeEnter initial={false}>
            <RouteTransition exact path={ROUTES.ROOT}>
              <Home />
            </RouteTransition>
            <RouteTransition exact path={ROUTES.ABOUT}>
              <About />
            </RouteTransition>
            <RouteTransition exact path={ROUTES.CONTACT}>
              <Contact />
            </RouteTransition>
          </AnimatedRoutes>
          <Route path={[ROUTES.PROJECTS.PROJECT, ROUTES.PROJECTS.ROOT]}>
            <Projects />
          </Route>
        </AnimateSharedLayout>
      </Router>
    </React.StrictMode>
  );
};

render(<Application />, document.getElementById("root"));
