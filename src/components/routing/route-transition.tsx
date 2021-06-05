import { HTMLMotionProps, motion } from "framer-motion";
import React from "react";
import { Route, RouteProps } from "react-router-dom";

export const RouteTransition: React.FC<RouteProps & HTMLMotionProps<"div">> = ({
  children,
  exact,
  path,
  initial,
  animate,
  exit,
  transition,
  ...rest
}) => (
  <Route exact={exact} path={path} {...rest}>
    <motion.div
      initial={initial ?? { x: 25, opacity: 0 }}
      animate={animate ?? { x: 0, opacity: 1 }}
      exit={exit ?? { x: -25, opacity: 0 }}
      style={{ height: "100%" }}
      transition={transition ?? { ease: "easeInOut", duration: 0.2 }}
    >
      {children}
    </motion.div>
  </Route>
);
