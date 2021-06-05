import { AnimatePresence } from "framer-motion";
import React from "react";
import { Switch, useLocation } from "react-router-dom";

interface AnimatedRoutesProps {
  exitBeforeEnter?: boolean;
  initial?: boolean;
}
export const AnimatedRoutes: React.FC<AnimatedRoutesProps> = ({
  children,
  exitBeforeEnter,
  initial,
}) => {
  const location = useLocation();
  return (
    <AnimatePresence exitBeforeEnter={exitBeforeEnter} initial={initial}>
      <Switch location={location} key={location.pathname}>
        {children}
      </Switch>
    </AnimatePresence>
  );
};
