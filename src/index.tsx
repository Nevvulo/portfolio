import { AnimateSharedLayout } from "framer-motion";
import React, { Suspense } from "react";
import { render } from "react-dom";
import { BrowserRouter as Router, Route } from "react-router-dom";
import { AnimatedRoutes } from "./components/routing/animated-routes";
import { RouteTransition } from "./components/routing/route-transition";
import { ROUTES } from "./constants/routes";
import About from "./pages/about";
import Blog from "./pages/blog";
import Post from "./pages/blog/post";
import Contact from "./pages/contact";
import Home from "./pages/home";
import Projects from "./pages/projects";
import "./styles.module.scss";

const Content: React.FC = () => {
  return (
    <>
      <AnimatedRoutes exitBeforeEnter={true} initial={true}>
        <RouteTransition exact path={ROUTES.ROOT}>
          <Home />
        </RouteTransition>
        <RouteTransition exact path={ROUTES.ABOUT}>
          <About />
        </RouteTransition>
        <RouteTransition exact path={ROUTES.CONTACT}>
          <Contact />
        </RouteTransition>
        <RouteTransition exact path={ROUTES.BLOG.ROOT}>
          <Blog />
        </RouteTransition>
        <RouteTransition path={ROUTES.BLOG.POST}>
          <Post />
        </RouteTransition>
        <RouteTransition
          animate={{}}
          exit={{}}
          initial={{}}
          exact
          path={[ROUTES.PROJECTS.ROOT, ROUTES.PROJECTS.PROJECT]}
        >
          <Projects />
        </RouteTransition>
      </AnimatedRoutes>
    </>
  );
};

const Application: React.FC = () => {
  return (
    <React.StrictMode>
      <Suspense fallback={<></>}>
        <AnimateSharedLayout type="crossfade">
          <Router>
            <Content />
          </Router>
        </AnimateSharedLayout>
      </Suspense>
    </React.StrictMode>
  );
};

render(<Application />, document.getElementById("root"));
