import { AnimatePresence } from "framer-motion";
import React from "react";

interface AnimatedRoutesProps {
  exitBeforeEnter?: boolean;
  initial?: boolean;
}
export const AnimatedRoutes: React.FC<AnimatedRoutesProps> = ({
  children,
  exitBeforeEnter,
  initial,
}) => {
  return (
    <AnimatePresence exitBeforeEnter={exitBeforeEnter} initial={initial}>
      {/* <Switch location={location} key={location.pathname}> */}
      {children}
      {/* </Switch> */}
    </AnimatePresence>
  );
};
