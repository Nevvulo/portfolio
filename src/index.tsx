import { AnimateSharedLayout } from "framer-motion";
import React, { lazy, Suspense } from "react";
import { render } from "react-dom";
import { BrowserRouter as Router, Route } from "react-router-dom";
import { AnimatedRoutes } from "./components/routing/animated-routes";
import { RouteTransition } from "./components/routing/route-transition";
import { ROUTES } from "./constants/routes";
import "./styles.module.scss";
import About from "./pages/about";
import Projects from "./pages/projects";
import Contact from "./pages/contact";
import Home from "./pages/home";

const Content: React.FC = () => {
  return (
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
  );
};

const Application: React.FC = () => {
  return (
    <React.StrictMode>
      <Suspense fallback={<></>}>
        <Router>
          <Content />
        </Router>
      </Suspense>
    </React.StrictMode>
  );
};

render(<Application />, document.getElementById("root"));
