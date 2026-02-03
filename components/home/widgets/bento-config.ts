export type BentoWidgetSize = "small" | "medium" | "large" | "wide";

export const BENTO_SIZES: Record<BentoWidgetSize, { cols: number }> = {
  small:  { cols: 1 },
  medium: { cols: 1 },
  large:  { cols: 2 },
  wide:   { cols: 3 },
};

/** Downsizing order: wide→large→medium→small */
const DOWNSIZE: Record<BentoWidgetSize, BentoWidgetSize | null> = {
  wide: "large",
  large: "medium",
  medium: "small",
  small: null,
};

export function downsizeWidget(size: BentoWidgetSize): BentoWidgetSize {
  return DOWNSIZE[size] ?? size;
}

export interface WidgetDefinition {
  id: string;
  defaultSize: BentoWidgetSize;
  /** Minimum size this widget supports — won't be downsized past this */
  minSize: BentoWidgetSize;
  promotedSize?: BentoWidgetSize;
  promotionThreshold?: number;
}

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  { id: "latest-content", defaultSize: "large",  minSize: "medium" },
  { id: "music",          defaultSize: "small",  minSize: "small" },
  { id: "live",            defaultSize: "medium", minSize: "small",  promotedSize: "large",  promotionThreshold: 15 },
  { id: "activity",       defaultSize: "medium", minSize: "small",  promotedSize: "large",  promotionThreshold: 25 },
  { id: "community",      defaultSize: "medium", minSize: "small" },
  { id: "integrations",   defaultSize: "medium", minSize: "medium", promotedSize: "large",  promotionThreshold: 15 },
  { id: "perks",          defaultSize: "medium", minSize: "small" },
  { id: "videos",         defaultSize: "large",  minSize: "medium" },
  { id: "software",       defaultSize: "large",  minSize: "medium" },
  { id: "games",          defaultSize: "small",  minSize: "small" },
];
