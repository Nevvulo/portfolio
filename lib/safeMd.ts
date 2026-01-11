/**
 * Limited Markdown Parser for User Feed
 * Only allows: bold (**text** or __text__) and italics (*text* or _text_)
 * Strips all HTML and other markdown syntax for security
 */

// Escape HTML entities to prevent XSS
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Parse limited markdown (bold and italics only) to HTML
 * All input is sanitized to prevent XSS
 */
export function parseSafeMarkdown(input: string): string {
  // First, escape all HTML to prevent injection
  let result = escapeHtml(input);

  // Parse bold: **text** or __text__
  result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/__([^_]+)__/g, "<strong>$1</strong>");

  // Parse italics: *text* or _text_ (but not inside words for underscores)
  // Single asterisk italics - but not if followed by space or at start/end
  result = result.replace(/\*([^*\s][^*]*[^*\s])\*/g, "<em>$1</em>");
  result = result.replace(/\*([^*\s])\*/g, "<em>$1</em>");

  // Single underscore italics - only at word boundaries
  result = result.replace(/(?<![a-zA-Z0-9])_([^_\s][^_]*[^_\s])_(?![a-zA-Z0-9])/g, "<em>$1</em>");
  result = result.replace(/(?<![a-zA-Z0-9])_([^_\s])_(?![a-zA-Z0-9])/g, "<em>$1</em>");

  // Convert newlines to <br> for display
  result = result.replace(/\n/g, "<br>");

  return result;
}

/**
 * Strip all markdown and return plain text
 * Useful for previews or search indexing
 */
export function stripMarkdown(input: string): string {
  return input
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\n/g, " ")
    .trim();
}

/**
 * Validate content doesn't contain disallowed elements
 * Returns true if content is safe
 */
export function validateContent(input: string): { valid: boolean; reason?: string } {
  // Check for HTML tags (even though we escape them, warn the user)
  if (/<[^>]+>/g.test(input)) {
    return { valid: false, reason: "HTML tags are not allowed" };
  }

  // Check for markdown links [text](url) - not allowed
  if (/\[([^\]]+)\]\(([^)]+)\)/g.test(input)) {
    return { valid: false, reason: "Links are not allowed in feed posts" };
  }

  // Check for code blocks
  if (/```[\s\S]*```/g.test(input) || /`[^`]+`/g.test(input)) {
    return { valid: false, reason: "Code blocks are not allowed" };
  }

  // Check for headers
  if (/^#{1,6}\s/gm.test(input)) {
    return { valid: false, reason: "Headers are not allowed" };
  }

  return { valid: true };
}

/**
 * Component-friendly React render function
 * Returns an object with __html for dangerouslySetInnerHTML
 */
export function renderSafeMarkdown(input: string): { __html: string } {
  return { __html: parseSafeMarkdown(input) };
}

/**
 * Truncate content with ellipsis, preserving word boundaries
 */
export function truncateContent(input: string, maxLength: number = 280): string {
  if (input.length <= maxLength) return input;

  const truncated = input.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace) + "...";
  }

  return truncated + "...";
}
