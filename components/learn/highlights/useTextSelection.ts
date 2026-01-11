import { useState, useEffect, useCallback, useRef } from "react";
import { extractAnchor, TextAnchor } from "./textAnchor";

export interface SelectionState {
  /** The selected text */
  text: string;
  /** Text anchor data for storing the highlight */
  anchor: TextAnchor | null;
  /** Bounding rect for positioning the toolbar */
  rect: DOMRect | null;
  /** Whether there's an active selection */
  isActive: boolean;
}

interface UseTextSelectionOptions {
  /** Container element ref - selection only tracked within this element */
  containerRef: React.RefObject<HTMLElement>;
  /** Debounce delay in ms before considering selection stable */
  debounceMs?: number;
  /** Callback when selection changes */
  onSelectionChange?: (state: SelectionState) => void;
}

const INITIAL_STATE: SelectionState = {
  text: "",
  anchor: null,
  rect: null,
  isActive: false,
};

/**
 * Hook to track text selection within a container element.
 * Returns selection state and anchor data for creating highlights.
 */
export function useTextSelection({
  containerRef,
  debounceMs = 150,
  onSelectionChange,
}: UseTextSelectionOptions): SelectionState & {
  clearSelection: () => void;
} {
  const [state, setState] = useState<SelectionState>(INITIAL_STATE);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRectRef = useRef<DOMRect | null>(null);

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setState(INITIAL_STATE);
    lastRectRef.current = null;
  }, []);

  const handleSelectionChange = useCallback(() => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the selection change
    timeoutRef.current = setTimeout(() => {
      // Ignore selection changes when focus is on form elements
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.tagName === "SELECT" ||
          (activeElement as HTMLElement).isContentEditable)
      ) {
        return;
      }

      const selection = window.getSelection();
      const container = containerRef.current;

      if (!selection || !container) {
        if (state.isActive) {
          setState(INITIAL_STATE);
          onSelectionChange?.(INITIAL_STATE);
        }
        return;
      }

      // Check if selection is collapsed (no text selected)
      if (selection.isCollapsed || selection.rangeCount === 0) {
        if (state.isActive) {
          setState(INITIAL_STATE);
          onSelectionChange?.(INITIAL_STATE);
        }
        return;
      }

      // Check if selection is within our container
      const range = selection.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) {
        if (state.isActive) {
          setState(INITIAL_STATE);
          onSelectionChange?.(INITIAL_STATE);
        }
        return;
      }

      const text = selection.toString().trim();
      if (text.length === 0) {
        if (state.isActive) {
          setState(INITIAL_STATE);
          onSelectionChange?.(INITIAL_STATE);
        }
        return;
      }

      // Extract anchor data
      const anchor = extractAnchor(selection, container);
      if (!anchor) {
        if (state.isActive) {
          setState(INITIAL_STATE);
          onSelectionChange?.(INITIAL_STATE);
        }
        return;
      }

      // Get bounding rect for toolbar positioning
      const rect = range.getBoundingClientRect();

      // Only update if rect has actually changed (avoid unnecessary rerenders)
      const hasRectChanged =
        !lastRectRef.current ||
        Math.abs(lastRectRef.current.top - rect.top) > 5 ||
        Math.abs(lastRectRef.current.left - rect.left) > 5 ||
        Math.abs(lastRectRef.current.width - rect.width) > 5;

      if (hasRectChanged || text !== state.text) {
        lastRectRef.current = rect;
        const newState: SelectionState = {
          text,
          anchor,
          rect,
          isActive: true,
        };
        setState(newState);
        onSelectionChange?.(newState);
      }
    }, debounceMs);
  }, [containerRef, debounceMs, onSelectionChange, state.isActive, state.text]);

  // Listen to selection changes
  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleSelectionChange]);

  // Clear selection on mousedown outside container or on toolbar
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const container = containerRef.current;
      const target = e.target as HTMLElement;

      // Don't interfere with form elements - let them handle their own focus
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable ||
        target.closest("input, textarea, select, [contenteditable]")
      ) {
        return;
      }

      // Don't clear if clicking inside the toolbar
      if (target.closest("[data-selection-toolbar]")) {
        return;
      }

      // Clear if clicking outside the container
      if (container && !container.contains(target)) {
        // Small delay to allow toolbar clicks to register
        setTimeout(() => {
          if (!target.closest("[data-selection-toolbar]")) {
            clearSelection();
          }
        }, 10);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [containerRef, clearSelection]);

  // Clear selection on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state.isActive) {
        clearSelection();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [state.isActive, clearSelection]);

  return {
    ...state,
    clearSelection,
  };
}

/**
 * Hook to manage highlight data fetching and mutations.
 */
export function useHighlights(postId: string | undefined) {
  // This will be implemented with Convex hooks in the component
  // Placeholder for the interface
  return {
    highlights: [],
    isLoading: false,
    createHighlight: async (_anchor: TextAnchor) => {},
    removeHighlight: async (_id: string) => {},
  };
}
