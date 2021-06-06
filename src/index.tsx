import { AnimateSharedLayout } from "framer-motion";
import React, { lazy, Suspense } from "react";
import { render } from "react-dom";
import { BrowserRouter as Router, Route } from "react-router-dom";
import { AnimatedRoutes } from "./components/routing/animated-routes";
import { RouteTransition } from "./components/routing/route-transition";
import { ROUTES } from "./constants/routes";
import "./styles.module.scss";

const About = lazy(() => import("./pages/about"));
const Contact = lazy(() => import("./pages/contact"));
const Home = lazy(() => import("./pages/home"));
const Projects = lazy(() => import("./pages/projects"));

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
