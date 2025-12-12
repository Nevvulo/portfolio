/**
 * Basic word filter blocklist for user bios
 * Keep minimal - focus on obvious cases
 */

// Common slurs and offensive terms (lowercase for case-insensitive matching)
export const BLOCKED_WORDS: string[] = [
  // Racial slurs
  "nigger",
  "nigga",
  "chink",
  "spic",
  "kike",
  "gook",
  "wetback",
  // Homophobic slurs
  "faggot",
  "fag",
  "dyke",
  "tranny",
  // Other offensive
  "retard",
  "retarded",
];

// Spam patterns (regex)
export const SPAM_PATTERNS: RegExp[] = [
  // 5+ repeated characters (e.g., "aaaaaaa")
  /(.)\1{4,}/i,
  // Excessive punctuation spam
  /[!?]{5,}/,
  // URL spam patterns
  /(?:https?:\/\/)?(?:www\.)?[\w-]+\.(?:com|net|org|io|xyz|click|link)\/\S*/gi,
  // Discord invite spam
  /discord\.gg\/\S+/gi,
  // Telegram spam
  /t\.me\/\S+/gi,
];

// Maximum bio length
export const MAX_BIO_LENGTH = 200;
