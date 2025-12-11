/**
 * Canvas Animation Utilities for Homepage Intro
 * Provides easing functions, grid calculations, and animation helpers
 */

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const easeOutQuart = (t: number): number => {
  return 1 - Math.pow(1 - t, 4);
};

export const easeInOutQuart = (t: number): number => {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
};

export const easeOutExpo = (t: number): number => {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

// ============================================================================
// SKULL PIXEL DATA
// ============================================================================

/**
 * Low-resolution skull pixel art (side-facing)
 * 24 columns x 24 rows
 * true = skull pixel, false = empty
 */
export const SKULL_PIXELS: boolean[][] = [
  // Row 0-3: Top of cranium
  [false, false, false, false, true, true, true, true, true, true, true, true, false, false, false, false, false, false, false, false, false, false, false, false],
  [false, false, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false, false, false, false, false, false],
  [false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false, false, false, false, false],
  [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false, false, false, false],

  // Row 4-7: Upper cranium and forehead
  [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false, false, false, false],
  [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false, false, false, false],
  [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false, false, false, false],
  [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false, false, false, false, false],

  // Row 8-11: Eye socket area
  [true, true, true, true, false, false, false, false, false, true, true, true, true, true, false, false, false, false, false, false, false, false, false, false],
  [true, true, true, false, false, false, false, false, false, false, true, true, true, false, false, false, false, false, false, false, false, false, false, false],
  [true, true, false, false, false, false, false, false, false, false, false, true, true, false, false, false, false, false, false, false, false, false, false, false],
  [true, true, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false],

  // Row 12-14: Nose cavity and cheekbone
  [true, true, true, false, false, false, false, false, false, false, true, true, false, false, false, false, false, false, false, false, false, false, false, false],
  [true, true, true, true, false, false, false, false, false, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false],
  [true, true, true, true, true, false, false, false, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false],

  // Row 15-17: Upper jaw
  [true, true, true, true, true, true, true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
  [true, true, true, true, true, true, true, true, false, false, false, false, false, false, false, true, true, true, true, false, false, false, false, false],
  [true, true, true, true, true, true, true, false, false, false, false, false, false, false, true, true, true, true, true, true, false, false, false, false],

  // Row 18-20: Teeth and lower jaw
  [true, true, true, true, true, true, true, false, false, false, false, false, false, true, true, true, true, true, true, true, true, false, false, false],
  [false, true, true, true, true, true, true, true, false, false, false, false, true, true, true, true, true, true, true, true, true, true, false, false],
  [false, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false],

  // Row 21-23: Chin and bottom jaw
  [false, false, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false],
  [false, false, false, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false],
  [false, false, false, false, false, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false, false],
];

export const SKULL_WIDTH = 24;
export const SKULL_HEIGHT = 24;

/**
 * Shuffle array using Fisher-Yates algorithm
 * Used for randomized skull pixel reveal
 */
export const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
};

// ============================================================================
// GRID CALCULATION
// ============================================================================

export interface GridDimensions {
  cols: number;
  rows: number;
  squareSize: number;
  totalWidth: number;
  totalHeight: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Calculate optimal grid dimensions based on viewport
 * Max 600px wide, max 1200px tall, maintains aspect ratio
 */
export const calculateGridDimensions = (
  viewportWidth: number,
  viewportHeight: number,
  squareSize = 8
): GridDimensions => {
  // Determine available space (with constraints)
  const maxWidth = Math.min(viewportWidth, 600);
  const maxHeight = Math.min(viewportHeight, 1200);

  // Calculate grid dimensions
  const cols = Math.floor(maxWidth / squareSize);
  const rows = Math.floor(maxHeight / squareSize);

  // Calculate actual dimensions
  const totalWidth = cols * squareSize;
  const totalHeight = rows * squareSize;

  // Center the grid
  const offsetX = (viewportWidth - totalWidth) / 2;
  const offsetY = (viewportHeight - totalHeight) / 2;

  return {
    cols,
    rows,
    squareSize,
    totalWidth,
    totalHeight,
    offsetX,
    offsetY,
  };
};

// ============================================================================
// CAMERA TRANSFORMATION
// ============================================================================

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export const applyCameraTransform = (
  ctx: CanvasRenderingContext2D,
  camera: CameraState,
  canvasWidth: number,
  canvasHeight: number
) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
  ctx.translate(canvasWidth / 2, canvasHeight / 2); // Move to center
  ctx.scale(camera.zoom, camera.zoom); // Apply zoom
  ctx.translate(-camera.x, -camera.y); // Apply camera position
};

// ============================================================================
// BINARY GLITCH UTILITIES
// ============================================================================

export const BINARY_CHARS = ['0', '1'];

export interface GlitchBit {
  x: number;
  y: number;
  char: string;
  opacity: number;
  life: number;
  maxLife: number;
}

/**
 * Generate random glitch bits between grid squares
 */
export const generateGlitchBits = (
  grid: GridDimensions,
  count: number
): GlitchBit[] => {
  const bits: GlitchBit[] = [];

  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * BINARY_CHARS.length);
    bits.push({
      x: Math.random() * grid.totalWidth - grid.totalWidth / 2,
      y: Math.random() * grid.totalHeight - grid.totalHeight / 2,
      char: BINARY_CHARS[randomIndex]!,
      opacity: Math.random() * 0.8 + 0.2,
      life: 0,
      maxLife: Math.random() * 500 + 200, // 200-700ms lifetime
    });
  }

  return bits;
};

/**
 * Update glitch bits with delta time
 */
export const updateGlitchBits = (
  bits: GlitchBit[],
  deltaTime: number
): GlitchBit[] => {
  return bits
    .map(bit => ({
      ...bit,
      life: bit.life + deltaTime,
      opacity: bit.life < bit.maxLife
        ? Math.sin((bit.life / bit.maxLife) * Math.PI) * 0.8 + 0.2
        : 0,
    }))
    .filter(bit => bit.life < bit.maxLife);
};

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export class PerformanceMonitor {
  private frameTimes: number[] = [];
  private readonly maxSamples = 60;
  private lastTime = 0;

  update(currentTime: number): void {
    if (this.lastTime > 0) {
      const frameTime = currentTime - this.lastTime;
      this.frameTimes.push(frameTime);

      if (this.frameTimes.length > this.maxSamples) {
        this.frameTimes.shift();
      }
    }

    this.lastTime = currentTime;
  }

  getAverageFPS(): number {
    if (this.frameTimes.length === 0) return 60;

    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    return Math.round(1000 / avgFrameTime);
  }

  isPerformanceGood(): boolean {
    return this.getAverageFPS() >= 50; // Allow 50+ fps
  }

  shouldReduceComplexity(): boolean {
    return this.getAverageFPS() < 45; // Reduce complexity if below 45fps
  }

  reset(): void {
    this.frameTimes = [];
    this.lastTime = 0;
  }
}

// ============================================================================
// ANIMATION PHASE UTILITIES
// ============================================================================

export enum AnimationPhase {
  SINGLE_SQUARE = 'single_square',      // 0-300ms
  SINGLE_ROW = 'single_row',            // 300-600ms
  GRID_EXPAND = 'grid_expand',          // 600-1200ms
  CAMERA_ZOOM = 'camera_zoom',          // 1200-1800ms (first zoom)
  SKULL_REVEAL = 'skull_reveal',        // 1800-3000ms (skull pixels appear)
  ZOOM_OUT_REVEAL = 'zoom_out_reveal',  // 3000-3800ms (second zoom + text)
  HOLD_FRAME = 'hold_frame',            // 3800-4300ms (static display)
  FADE_OUT = 'fade_out',                // 4300-4700ms
  COMPLETE = 'complete',                // 4700ms+
}

export interface PhaseConfig {
  phase: AnimationPhase;
  startTime: number;
  endTime: number;
  duration: number;
}

export const ANIMATION_PHASES: PhaseConfig[] = [
  { phase: AnimationPhase.SINGLE_SQUARE, startTime: 0, endTime: 300, duration: 300 },
  { phase: AnimationPhase.SINGLE_ROW, startTime: 300, endTime: 600, duration: 300 },
  { phase: AnimationPhase.GRID_EXPAND, startTime: 600, endTime: 1200, duration: 600 },
  { phase: AnimationPhase.CAMERA_ZOOM, startTime: 1200, endTime: 1800, duration: 600 },
  { phase: AnimationPhase.SKULL_REVEAL, startTime: 1800, endTime: 3000, duration: 1200 },
  { phase: AnimationPhase.ZOOM_OUT_REVEAL, startTime: 3000, endTime: 3800, duration: 800 },
  { phase: AnimationPhase.HOLD_FRAME, startTime: 3800, endTime: 4300, duration: 500 },
  { phase: AnimationPhase.FADE_OUT, startTime: 4300, endTime: 4700, duration: 400 },
  { phase: AnimationPhase.COMPLETE, startTime: 4700, endTime: Infinity, duration: 0 },
];

// Reduced motion: 50% slower
export const REDUCED_MOTION_PHASES: PhaseConfig[] = ANIMATION_PHASES.map(phase => ({
  ...phase,
  startTime: phase.startTime * 1.5,
  endTime: phase.endTime === Infinity ? Infinity : phase.endTime * 1.5,
  duration: phase.duration * 1.5,
}));

export const getCurrentPhase = (
  elapsedTime: number,
  phases: PhaseConfig[]
): PhaseConfig => {
  return (
    phases.find(
      phase => elapsedTime >= phase.startTime && elapsedTime < phase.endTime
    ) ?? phases[phases.length - 1]!
  );
};

export const getPhaseProgress = (
  elapsedTime: number,
  phase: PhaseConfig
): number => {
  if (phase.duration === 0) return 1;
  const progress = (elapsedTime - phase.startTime) / phase.duration;
  return Math.max(0, Math.min(1, progress));
};

// ============================================================================
// COLOR UTILITIES
// ============================================================================

export interface ColorScheme {
  background: string;
  squareFill: string;
  squareStroke: string;
  glitchColor: string;
}

export const getColorScheme = (isDarkMode: boolean): ColorScheme => {
  if (isDarkMode) {
    return {
      background: '#100d1b', // Deep purple from theme
      squareFill: '#ffffff', // WHITE squares
      squareStroke: '#ffffff', // WHITE borders
      glitchColor: '#ffffff',
    };
  }

  return {
    background: '#ffffff',
    squareFill: '#000000', // BLACK squares for light mode
    squareStroke: '#000000',
    glitchColor: '#000000',
  };
};

// ============================================================================
// DEVICE DETECTION
// ============================================================================

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const getOptimalSquareSize = (isMobile: boolean, reducedMotion: boolean): number => {
  if (reducedMotion) return 12; // Larger, fewer squares
  if (isMobile) return 10; // Medium for mobile
  return 8; // Smallest for desktop (more detail)
};
