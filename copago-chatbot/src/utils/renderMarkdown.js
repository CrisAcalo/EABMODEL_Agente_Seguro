/**
 * Simple markdown-to-HTML renderer for bot messages.
 * Sanitizes HTML first (XSS-safe), then applies formatting.
 */
export function renderMarkdown(text) {
  if (!text) return "";

  // 1. Escape HTML entities to prevent XSS
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Bold: **text**
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // 3. Italic: *text* (single asterisk, not already consumed)
  html = html.replace(/\*([^*\n]+?)\*/g, "<em>$1</em>");

  // 4. Newlines → <br>
  html = html.replace(/\n/g, "<br />");

  return html;
}
