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
      initial={initial ?? { y: 20, opacity: 0 }}
      animate={
        animate ?? {
          y: 0,
          opacity: 1,
          transition: { duration: 0.2 },
        }
      }
      exit={
        exit ?? {
          y: -10,
          opacity: 0,
          transition: { duration: 0.23 },
        }
      }
      style={{
        height: "100%",
        width: "100%",
        justifyContent: "center",
        display: "flex",
      }}
    >
      {children}
    </motion.div>
  </Route>
);
