/**
 * Text anchoring utilities for resilient highlight positioning.
 * Highlights are stored with context (prefix/suffix) and can be found
 * even after minor content edits using fuzzy matching.
 */

export interface TextAnchor {
  highlightedText: string;
  prefix: string;
  suffix: string;
}

export interface HighlightPosition {
  start: number;
  end: number;
}

/**
 * Calculate Levenshtein distance between two strings.
 * Used for fuzzy matching when exact matches fail.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score between two strings (0-1).
 */
function similarity(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const distance = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  return 1 - distance / maxLen;
}

/**
 * Find the best fuzzy match for a pattern in text.
 * Uses a sliding window approach with similarity scoring.
 */
function fuzzyFind(
  text: string,
  pattern: string,
  threshold: number = 0.75
): { start: number; end: number; score: number } | null {
  if (pattern.length === 0) return null;
  if (text.length === 0) return null;

  // For very short patterns, require higher threshold
  const adjustedThreshold = pattern.length < 10 ? Math.max(threshold, 0.85) : threshold;

  const windowSize = pattern.length;
  let bestMatch: { start: number; end: number; score: number } | null = null;

  // Sliding window with some tolerance for length variation
  const minWindow = Math.floor(windowSize * 0.8);
  const maxWindow = Math.ceil(windowSize * 1.2);

  for (let size = minWindow; size <= maxWindow; size++) {
    for (let i = 0; i <= text.length - size; i++) {
      const window = text.slice(i, i + size);
      const score = similarity(window, pattern);

      if (score >= adjustedThreshold && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { start: i, end: i + size, score };
      }
    }
  }

  return bestMatch;
}

/**
 * Extract a text anchor from a Selection object.
 * Call this when the user makes a text selection.
 */
export function extractAnchor(
  selection: Selection,
  containerElement: HTMLElement
): TextAnchor | null {
  if (selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const highlightedText = range.toString();

  if (highlightedText.trim().length === 0) {
    return null;
  }

  // Get the full text content of the container
  const fullText = containerElement.textContent || "";

  // Find the position of the selection in the full text
  const preRange = document.createRange();
  preRange.setStart(containerElement, 0);
  preRange.setEnd(range.startContainer, range.startOffset);
  const startIndex = preRange.toString().length;
  const endIndex = startIndex + highlightedText.length;

  // Extract prefix and suffix (up to 80 chars each)
  const prefix = fullText.slice(Math.max(0, startIndex - 80), startIndex);
  const suffix = fullText.slice(endIndex, endIndex + 80);

  return {
    highlightedText,
    prefix,
    suffix,
  };
}

/**
 * Find a highlight's position in text content.
 * Tries exact match first, then falls back to fuzzy matching.
 */
export function findHighlightPosition(
  fullText: string,
  anchor: TextAnchor
): HighlightPosition | null {
  const { highlightedText, prefix, suffix } = anchor;

  // Strategy 1: Exact match of full pattern (prefix + text + suffix)
  const exactPattern = prefix + highlightedText + suffix;
  const exactIndex = fullText.indexOf(exactPattern);
  if (exactIndex !== -1) {
    const start = exactIndex + prefix.length;
    return { start, end: start + highlightedText.length };
  }

  // Strategy 2: Exact match of just the highlighted text with context check
  const textMatches: number[] = [];
  let searchStart = 0;
  while (true) {
    const idx = fullText.indexOf(highlightedText, searchStart);
    if (idx === -1) break;
    textMatches.push(idx);
    searchStart = idx + 1;
  }

  // If we found exact text matches, score them by context similarity
  if (textMatches.length > 0) {
    let bestMatch: { index: number; score: number } | null = null;

    for (const idx of textMatches) {
      const actualPrefix = fullText.slice(Math.max(0, idx - prefix.length), idx);
      const actualSuffix = fullText.slice(
        idx + highlightedText.length,
        idx + highlightedText.length + suffix.length
      );

      const prefixScore = prefix.length > 0 ? similarity(actualPrefix, prefix) : 1;
      const suffixScore = suffix.length > 0 ? similarity(actualSuffix, suffix) : 1;
      const avgScore = (prefixScore + suffixScore) / 2;

      if (!bestMatch || avgScore > bestMatch.score) {
        bestMatch = { index: idx, score: avgScore };
      }
    }

    if (bestMatch && bestMatch.score >= 0.5) {
      return {
        start: bestMatch.index,
        end: bestMatch.index + highlightedText.length,
      };
    }
  }

  // Strategy 3: Fuzzy match using prefix + suffix anchoring
  // Find prefix location first
  const prefixMatch = fuzzyFind(fullText, prefix, 0.7);
  if (!prefixMatch) {
    // Try finding just the highlighted text with fuzzy matching
    const textMatch = fuzzyFind(fullText, highlightedText, 0.8);
    return textMatch ? { start: textMatch.start, end: textMatch.end } : null;
  }

  // Search for suffix after the prefix
  const searchAfterPrefix = fullText.slice(prefixMatch.end);
  const suffixMatch = fuzzyFind(searchAfterPrefix, suffix, 0.7);

  if (suffixMatch) {
    // The highlighted text should be between prefix end and suffix start
    const start = prefixMatch.end;
    const end = prefixMatch.end + suffixMatch.start;

    // Validate that the text between is similar to what we're looking for
    const foundText = fullText.slice(start, end);
    const textSimilarity = similarity(foundText, highlightedText);

    if (textSimilarity >= 0.6) {
      return { start, end };
    }
  }

  // Strategy 4: Just fuzzy match the highlighted text itself
  const textMatch = fuzzyFind(fullText, highlightedText, 0.75);
  return textMatch ? { start: textMatch.start, end: textMatch.end } : null;
}

/**
 * Find positions for multiple highlights in content.
 * Returns a map of highlight ID to position.
 */
export function findAllHighlightPositions(
  fullText: string,
  highlights: Array<{ _id: string } & TextAnchor>
): Map<string, HighlightPosition> {
  const positions = new Map<string, HighlightPosition>();

  for (const highlight of highlights) {
    const position = findHighlightPosition(fullText, {
      highlightedText: highlight.highlightedText,
      prefix: highlight.prefix,
      suffix: highlight.suffix,
    });

    if (position) {
      positions.set(highlight._id, position);
    }
  }

  return positions;
}

/**
 * Check if two highlight positions overlap.
 */
export function positionsOverlap(
  a: HighlightPosition,
  b: HighlightPosition
): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Merge overlapping highlight positions.
 * Returns non-overlapping segments with references to original highlights.
 */
export function mergeOverlappingPositions(
  positions: Array<{ id: string; position: HighlightPosition }>
): Array<{ ids: string[]; start: number; end: number }> {
  if (positions.length === 0) return [];

  // Sort by start position
  const sorted = [...positions].sort((a, b) => a.position.start - b.position.start);

  const merged: Array<{ ids: string[]; start: number; end: number }> = [];
  let current = {
    ids: [sorted[0].id],
    start: sorted[0].position.start,
    end: sorted[0].position.end,
  };

  for (let i = 1; i < sorted.length; i++) {
    const { id, position } = sorted[i];

    if (position.start <= current.end) {
      // Overlapping - merge
      current.ids.push(id);
      current.end = Math.max(current.end, position.end);
    } else {
      // Non-overlapping - push current and start new
      merged.push(current);
      current = {
        ids: [id],
        start: position.start,
        end: position.end,
      };
    }
  }

  merged.push(current);
  return merged;
}
