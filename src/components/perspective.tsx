import React, { useRef, useState } from "react";

export const Perspective: React.FC = ({ children }) => {
  const scale = "1.025";
  const perspective = "1500px";
  const DEFAULT_STYLE = `perspective(${perspective}) scale(1) rotateX(0deg) rotateY(0deg)`;

  const ref = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<number>();
  const [style, setStyle] = useState<string>(DEFAULT_STYLE);
  const onMouseEnter = (e: any) => update(e);
  const onMouseLeave = () => setStyle(DEFAULT_STYLE);
  const update = (event: any) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const xVal = event.nativeEvent.layerX;
    const yVal = event.nativeEvent.layerY;
    const yRotation = 20 * ((xVal - rect.width / 2) / rect.width);
    const xRotation = -20 * ((yVal - rect.height / 2) / rect.height);
    setStyle(
      `perspective(${perspective}) rotateX(${xRotation}deg) rotateY(${yRotation}deg) scale3d(${scale}, ${scale}, ${scale})`
    );
  };
  const onMouseMove = (e: any) => {
    e.persist();
    if (frame !== undefined) window.cancelAnimationFrame(frame);
    setFrame(requestAnimationFrame(() => update(e)));
  };
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
      style={{ transform: style, transition: "0.1s" }}
    >
      {children}
    </div>
  );
};
