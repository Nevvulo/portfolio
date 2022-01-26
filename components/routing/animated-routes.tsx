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
    <AnimatePresence exitBeforeEnter={exitBeforeEnter}>
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
          transition: { duration: 0.1 },
        }}
        exit={{
          transformOrigin: "center",
          opacity: 0,
          transition: { duration: 0.2 },
        }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
