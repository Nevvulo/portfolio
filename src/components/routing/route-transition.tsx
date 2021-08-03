import { HTMLMotionProps, motion } from "framer-motion";
import React from "react";
import { Route, RouteProps } from "react-router-dom";

export const RouteTransition: React.FC<
  RouteProps & HTMLMotionProps<"div"> & { doAnimate?: boolean }
> = ({
  children,
  exact,
  path,
  initial,
  animate,
  exit,
  transition,
  doAnimate = true,
  ...rest
}) => (
  <Route exact={exact} path={path} {...rest}>
    {doAnimate ? (
      <motion.div
        initial={initial ?? { y: 50, opacity: 0.1 }}
        animate={
          animate ?? {
            y: 0,
            opacity: 1,
            transition: { type: "spring", damping: 11, duration: 0.1 },
          }
        }
        exit={
          exit ?? {
            y: -100,
            opacity: 0,
            transition: { type: "spring", duration: 0.2 },
          }
        }
        style={{ height: "100%" }}
      >
        {children}
      </motion.div>
    ) : (
      children
    )}
  </Route>
);
