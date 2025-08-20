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
    <AnimatePresence key="routes" mode={exitBeforeEnter ? "wait" : "sync"}>
      <m.div
        key={currentRoute.concat("animate")}
        style={{ height: "100%" }}
        initial={{
          opacity: 0,
          y: 8,
        }}
        animate={{
          opacity: 1,
          y: 0,
          transition: { 
            duration: 0.25, 
            ease: [0.25, 0.1, 0.25, 1.0]
          },
        }}
        exit={{
          opacity: 0,
          y: -8,
          transition: { 
            duration: 0.2,
            ease: [0.6, 0.04, 0.98, 0.34]
          },
        }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
