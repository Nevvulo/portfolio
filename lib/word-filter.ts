import { BLOCKED_WORDS, MAX_BIO_LENGTH, SPAM_PATTERNS } from "../constants/word-filter";
export interface BioFilterResult {
  isValid: boolean;
  reason?: string;
  filtered?: string;
}

/**
 * Check if text contains any blocked words (whole word, case-insensitive)
 */
function containsBlockedWord(text: string): string | null {
  const lowerText = text.toLowerCase();

  for (const word of BLOCKED_WORDS) {
    // Match whole words only using word boundary
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
    if (regex.test(lowerText)) {
      return word;
    }
  }

  return null;
}

/**
 * Check if text matches any spam patterns
 */
function matchesSpamPattern(text: string): boolean {
  return SPAM_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Validate and filter bio text
 * Returns validation result with reason if invalid
 */
export function filterBio(text: string): BioFilterResult {
  // Trim whitespace
  const trimmed = text.trim();

  // Check length
  if (trimmed.length > MAX_BIO_LENGTH) {
    return {
      isValid: false,
      reason: `Bio must be ${MAX_BIO_LENGTH} characters or less`,
    };
  }

  // Check for blocked words
  const blockedWord = containsBlockedWord(trimmed);
  if (blockedWord) {
    return {
      isValid: false,
      reason: "Bio contains inappropriate language",
    };
  }

  // Check for spam patterns
  if (matchesSpamPattern(trimmed)) {
    return {
      isValid: false,
      reason: "Bio contains spam or disallowed content",
    };
  }

  return {
    isValid: true,
    filtered: trimmed,
  };
}

/**
 * Quick check if bio is valid (without detailed reason)
 */
export function isValidBio(text: string): boolean {
  return filterBio(text).isValid;
}

/**
 * Censor blocked words in text (for preview purposes)
 * Replaces blocked words with asterisks
 */
export function censorText(text: string): string {
  let result = text;

  for (const word of BLOCKED_WORDS) {
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, "gi");
    result = result.replace(regex, "*".repeat(word.length));
  }

  return result;
}
