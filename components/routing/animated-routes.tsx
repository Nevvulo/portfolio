import { AnimatePresence, m } from "framer-motion";
import React, { PropsWithChildren } from "react";

interface AnimatedRoutesProps {
  exitBeforeEnter?: boolean;
  initial?: boolean;
  currentRoute: string;
}
export function AnimatedRoutes({
  children,
  exitBeforeEnter = true,
  initial,
  currentRoute,
}: PropsWithChildren<AnimatedRoutesProps>) {
  return (
    <AnimatePresence key="routes" exitBeforeEnter={exitBeforeEnter}>
      <m.div
        key={currentRoute.concat("animate")}
        style={{ height: "100%" }}
        initial={{
          transformOrigin: "center",
          opacity: 1,
        }}
        animate={{
          transformOrigin: "center",
          opacity: 1,
          filter: "blur(0px)",
          transition: { duration: 0.2 },
        }}
        exit={{
          transformOrigin: "center",
          opacity: 0,
          filter: "blur(2px)",
          transition: { duration: 0.25 },
        }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
