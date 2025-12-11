import { AnimatePresence, m } from "framer-motion";
import { type PropsWithChildren, useRef } from "react";

interface AnimatedRoutesProps {
  exitBeforeEnter?: boolean;
  initial?: boolean;
  currentRoute: string;
  skipAnimation?: boolean;
}

export function AnimatedRoutes({
  children,
  exitBeforeEnter: _exitBeforeEnter = true,
  currentRoute,
  skipAnimation = false,
}: PropsWithChildren<AnimatedRoutesProps>) {
  const isFirstRender = useRef(true);
  const shouldSkipInitial = isFirstRender.current;
  isFirstRender.current = false;

  const isHomepage = currentRoute === "/" || currentRoute === "";

  if (skipAnimation) {
    return (
      <div
        id="scroll-container"
        style={{ height: "100%", overflowX: "clip", overflowY: isHomepage ? "hidden" : "auto" }}
      >
        {children}
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={currentRoute}
        id="scroll-container"
        initial={shouldSkipInitial ? false : { opacity: 0, y: 8 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.25,
            ease: [0.25, 0.1, 0.25, 1.0],
          },
        }}
        exit={{
          opacity: 0,
          y: -8,
          transition: {
            duration: 0.15,
            ease: [0.6, 0.04, 0.98, 0.34],
          },
        }}
        style={{ height: "100%", overflowX: "clip", overflowY: isHomepage ? "hidden" : "auto" }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
