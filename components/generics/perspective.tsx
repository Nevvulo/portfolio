import type React from "react";
import { type PropsWithChildren, useRef, useState } from "react";

const scale = "1.025";
const perspective = "1500px";
export function Perspective({ children }: PropsWithChildren<unknown>) {
  const DEFAULT_STYLE = `perspective(${perspective}) scale(1) rotateX(0deg) rotateY(0deg)`;
  const ref = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<number>();
  const [style, setStyle] = useState<string>(DEFAULT_STYLE);

  const onMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => update(e);
  const onMouseLeave = () => setStyle(DEFAULT_STYLE);
  const update = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const xVal = event.nativeEvent.offsetX;
    const yVal = event.nativeEvent.offsetY;
    const yRotation = 20 * ((xVal - rect.width / 2) / rect.width);
    const xRotation = -20 * ((yVal - rect.height / 2) / rect.height);
    setStyle(
      `perspective(${perspective}) rotateX(${xRotation}deg) rotateY(${yRotation}deg) scale3d(${scale}, ${scale}, ${scale})`,
    );
  };
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    e.persist();
    if (frame !== undefined) window.cancelAnimationFrame(frame);
    setFrame(requestAnimationFrame(() => update(e)));
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: This is a visual effect only
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
      style={{ transform: style, transition: "0.1s" }}
    >
      {children}
    </div>
  );
}
