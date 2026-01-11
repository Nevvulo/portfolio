import type React from "react";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useTheme } from "@/hooks/useTheme";
import {
  ANIMATION_PHASES,
  AnimationPhase,
  applyCameraTransform,
  type CameraState,
  type ColorScheme,
  calculateGridDimensions,
  easeInOutCubic,
  easeInOutQuart,
  easeOutExpo,
  easeOutQuart,
  type GridDimensions,
  getColorScheme,
  getCurrentPhase,
  getOptimalSquareSize,
  getPhaseProgress,
  isMobileDevice,
  PerformanceMonitor,
  prefersReducedMotion,
  REDUCED_MOTION_PHASES,
  SKULL_HEIGHT,
  SKULL_PIXELS,
  SKULL_WIDTH,
  shuffleArray,
} from "@/utils/canvas-animations";

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const CanvasContainer = styled.div<{ $isVisible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  opacity: ${(props) => (props.$isVisible ? 1 : 0)};
  transition: opacity 0.4s ease-out;
  pointer-events: ${(props) => (props.$isVisible ? "auto" : "none")};
`;

const Canvas = styled.canvas`
  display: block;
  width: 100%;
  height: 100%;
`;

// ============================================================================
// COMPONENT
// ============================================================================

interface CanvasIntroProps {
  onComplete: () => void;
}

export const CanvasIntro: React.FC<CanvasIntroProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const performanceMonitorRef = useRef(new PerformanceMonitor());
  const [isVisible, setIsVisible] = useState(true);

  const [theme] = useTheme();
  const isDarkMode = theme === "dark";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Copy ref to local variable for cleanup
    const performanceMonitor = performanceMonitorRef.current;

    // Set canvas size
    const updateCanvasSize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Detect motion preferences and device
    const reducedMotion = prefersReducedMotion();
    const isMobile = isMobileDevice();
    const phases = reducedMotion ? REDUCED_MOTION_PHASES : ANIMATION_PHASES;
    const squareSize = getOptimalSquareSize(isMobile, reducedMotion);

    // Calculate grid dimensions
    const grid = calculateGridDimensions(canvas.width, canvas.height, squareSize);

    // Color scheme
    const colors = getColorScheme(isDarkMode);

    // Camera state (center of world is 0,0)
    const camera: CameraState = {
      x: 0,
      y: 0,
      zoom: 1,
    };

    let complexityReduced = false;

    // Skull pixel reveal state
    const skullPixelIndices: number[] = [];
    for (let row = 0; row < SKULL_HEIGHT; row++) {
      for (let col = 0; col < SKULL_WIDTH; col++) {
        if (SKULL_PIXELS[row]![col]) {
          skullPixelIndices.push(skullPixelIndices.length);
        }
      }
    }
    const shuffledSkullPixels = shuffleArray(skullPixelIndices);
    const revealedSkullPixels = new Set<number>();

    // ========================================================================
    // DRAWING FUNCTIONS
    // ========================================================================

    const drawSquare = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      colors: ColorScheme,
      opacity: number = 1,
      blinkOpacity: number = 1,
    ) => {
      ctx.save();
      ctx.globalAlpha = opacity * blinkOpacity;

      // Add gap between squares (reduce size by 20%)
      const gapSize = size * 0.8;
      const gap = (size - gapSize) / 2;

      // Fill - WHITE squares with gaps
      ctx.fillStyle = colors.squareFill;
      ctx.fillRect(x - size / 2 + gap, y - size / 2 + gap, gapSize, gapSize);

      ctx.restore();
    };

    // Glitch bit functionality disabled (incomplete implementation)
    // const drawGlitchBit = (
    //   ctx: CanvasRenderingContext2D,
    //   bit: any,
    //   colors: ColorScheme
    // ) => {
    //   ctx.save();
    //   ctx.globalAlpha = bit.opacity;
    //   ctx.fillStyle = colors.glitchColor;
    //   ctx.font = `${grid.squareSize * 0.6}px monospace`;
    //   ctx.textAlign = 'center';
    //   ctx.textBaseline = 'middle';
    //   ctx.fillText(bit.char, bit.x, bit.y);
    //   ctx.restore();
    // };

    const drawGrid = (
      ctx: CanvasRenderingContext2D,
      grid: GridDimensions,
      colors: ColorScheme,
      visibleRows: number,
      visibleCols: number,
      opacity: number = 1,
      blinkOpacity: number = 1,
    ) => {
      const startCol = Math.floor((grid.cols - visibleCols) / 2);
      const startRow = Math.floor((grid.rows - visibleRows) / 2);

      for (let row = 0; row < visibleRows; row++) {
        for (let col = 0; col < visibleCols; col++) {
          const x = (startCol + col - grid.cols / 2) * grid.squareSize + grid.squareSize / 2;
          const y = (startRow + row - grid.rows / 2) * grid.squareSize + grid.squareSize / 2;

          drawSquare(ctx, x, y, grid.squareSize, colors, opacity, blinkOpacity);
        }
      }
    };

    const drawSkull = (
      ctx: CanvasRenderingContext2D,
      grid: GridDimensions,
      colors: ColorScheme,
      _revealProgress: number,
      blinkOpacity: number,
      revealedPixels: Set<number>,
    ) => {
      // Calculate skull size based on grid square size
      const skullSquareSize = grid.squareSize * 2; // Make skull pixels 2x larger for visibility

      // Center skull in grid
      const skullTotalWidth = SKULL_WIDTH * skullSquareSize;
      const skullTotalHeight = SKULL_HEIGHT * skullSquareSize;
      const skullOffsetX = -skullTotalWidth / 2;
      const skullOffsetY = -skullTotalHeight / 2;

      // Draw revealed skull pixels
      let pixelIndex = 0;
      for (let row = 0; row < SKULL_HEIGHT; row++) {
        for (let col = 0; col < SKULL_WIDTH; col++) {
          if (SKULL_PIXELS[row]![col]) {
            // This is a skull pixel
            if (revealedPixels.has(pixelIndex)) {
              const x = skullOffsetX + col * skullSquareSize + skullSquareSize / 2;
              const y = skullOffsetY + row * skullSquareSize + skullSquareSize / 2;

              drawSquare(ctx, x, y, skullSquareSize, colors, 1, blinkOpacity);
            }
            pixelIndex++;
          }
        }
      }
    };

    const drawNevuloText = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      colors: ColorScheme,
      opacity: number,
    ) => {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = colors.glitchColor; // White in dark mode
      ctx.font = '72px "Sixtyfour", monospace';
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("nevulo", x, y);
      ctx.restore();
    };

    // ========================================================================
    // ANIMATION LOOP
    // ========================================================================

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsedTime = currentTime - startTimeRef.current;
      const currentPhase = getCurrentPhase(elapsedTime, phases);
      const progress = getPhaseProgress(elapsedTime, currentPhase);

      // Performance monitoring
      performanceMonitor.update(currentTime);

      if (performanceMonitor.shouldReduceComplexity() && !complexityReduced) {
        complexityReduced = true;
        console.log("Canvas intro: Reducing complexity for performance");
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Save context
      ctx.save();

      // Apply camera transform
      applyCameraTransform(ctx, camera, canvas.width, canvas.height);

      // ======================================================================
      // PHASE-SPECIFIC RENDERING
      // ======================================================================

      let globalOpacity = 1;

      // Calculate blinking effect (subtle pulse)
      const blinkSpeed = 3; // cycles per second
      const blinkOpacity = 0.7 + 0.3 * Math.sin((elapsedTime * blinkSpeed * Math.PI) / 1000);

      switch (currentPhase.phase) {
        case AnimationPhase.SINGLE_SQUARE: {
          // Single square fades in at center
          const opacity = easeOutQuart(progress);
          drawSquare(ctx, 0, 0, grid.squareSize, colors, opacity, blinkOpacity);
          break;
        }

        case AnimationPhase.SINGLE_ROW: {
          // Expand to single row
          const easedProgress = easeInOutCubic(progress);
          const visibleCols = Math.ceil(1 + easedProgress * (grid.cols - 1));
          drawGrid(ctx, grid, colors, 1, visibleCols, 1, blinkOpacity);
          break;
        }

        case AnimationPhase.GRID_EXPAND: {
          // Rows multiply from center
          const easedProgress = easeInOutQuart(progress);
          const visibleRows = Math.ceil(1 + easedProgress * (grid.rows - 1));
          drawGrid(ctx, grid, colors, visibleRows, grid.cols, 1, blinkOpacity);
          break;
        }

        case AnimationPhase.CAMERA_ZOOM: {
          // Zoom out and center on grid
          const easedProgress = easeOutExpo(progress);

          // Calculate target zoom to fit entire grid
          const targetZoom =
            Math.min(canvas.width / grid.totalWidth, canvas.height / grid.totalHeight) * 0.9; // 90% to add padding

          camera.zoom = 1 + (targetZoom - 1) * easedProgress;

          // Draw full grid
          drawGrid(ctx, grid, colors, grid.rows, grid.cols, 1, blinkOpacity);
          break;
        }

        case AnimationPhase.SKULL_REVEAL: {
          // Reveal skull pixels randomly over time
          const easedProgress = easeInOutQuart(progress);
          const pixelsToReveal = Math.floor(easedProgress * shuffledSkullPixels.length);

          // Add newly revealed pixels
          for (let i = revealedSkullPixels.size; i < pixelsToReveal; i++) {
            revealedSkullPixels.add(shuffledSkullPixels[i]!);
          }

          // Draw background grid at reduced opacity
          drawGrid(ctx, grid, colors, grid.rows, grid.cols, 0.3, blinkOpacity);

          // Draw skull
          drawSkull(ctx, grid, colors, easedProgress, blinkOpacity, revealedSkullPixels);
          break;
        }

        case AnimationPhase.ZOOM_OUT_REVEAL: {
          // Second zoom out + text reveal
          const easedProgress = easeOutExpo(progress);

          // Calculate second zoom target (smaller zoom to fit skull + text)
          const secondZoomTarget =
            Math.min(canvas.width / (grid.totalWidth * 3), canvas.height / (grid.totalHeight * 2)) *
            0.9;

          // Interpolate camera zoom and position
          const currentZoom = camera.zoom;
          camera.zoom = currentZoom + (secondZoomTarget - currentZoom) * easedProgress;

          // Shift camera left to make room for text
          const targetCameraX = -canvas.width / 6;
          camera.x = targetCameraX * easedProgress;

          // Draw skull (fully revealed)
          drawSkull(ctx, grid, colors, 1, blinkOpacity, revealedSkullPixels);

          // Calculate text position (world space, right side)
          const textX = canvas.width / 3;

          // Fade in text
          const textOpacity = easedProgress;

          // Temporarily reset transform to draw text in screen space
          ctx.restore();
          ctx.save();

          drawNevuloText(ctx, textX, canvas.height / 2, colors, textOpacity);

          // Restore camera transform for next frame
          applyCameraTransform(ctx, camera, canvas.width, canvas.height);
          break;
        }

        case AnimationPhase.HOLD_FRAME: {
          // Static display of skull + text
          drawSkull(ctx, grid, colors, 1, blinkOpacity, revealedSkullPixels);

          // Draw text in screen space
          ctx.restore();
          ctx.save();

          const textX = canvas.width / 3;
          drawNevuloText(ctx, textX, canvas.height / 2, colors, 1);

          // Restore camera transform
          applyCameraTransform(ctx, camera, canvas.width, canvas.height);
          break;
        }

        case AnimationPhase.FADE_OUT: {
          // Fade out skull + text
          drawSkull(ctx, grid, colors, 1, blinkOpacity, revealedSkullPixels);

          // Draw text in screen space
          ctx.restore();
          ctx.save();

          const textX = canvas.width / 3;
          const fadeProgress = 1 - easeInOutCubic(progress);
          drawNevuloText(ctx, textX, canvas.height / 2, colors, fadeProgress);

          // Restore camera transform
          applyCameraTransform(ctx, camera, canvas.width, canvas.height);

          globalOpacity = fadeProgress;
          break;
        }

        case AnimationPhase.COMPLETE: {
          // Animation complete
          ctx.restore();
          setIsVisible(false);
          setTimeout(() => {
            onComplete();
          }, 400); // Wait for fade out transition
          return;
        }
      }

      // Apply global opacity for fade out
      if (globalOpacity < 1) {
        ctx.globalAlpha = globalOpacity;
      }

      ctx.restore();

      // Continue animation
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("resize", updateCanvasSize);
      performanceMonitor.reset();
    };
  }, [isDarkMode, onComplete]);

  return (
    <CanvasContainer $isVisible={isVisible}>
      <Canvas ref={canvasRef} />
    </CanvasContainer>
  );
};
