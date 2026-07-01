/**
 * KotobaFlow AI — DOM Utility Helpers
 *
 * Shared helpers for Google Docs UI exclusion, visibility detection,
 * Japanese text heuristics, and HTML escaping. Used by both the
 * extraction and overlay rendering modules.
 */

// ============================================================================
// UI Exclusion — selectors that are NEVER document body content
// ============================================================================

export const UI_EXCLUDE_SELECTORS = [
  '[class*="menu"]', '[class*="toolbar"]', '[class*="sidebar"]',
  '[class*="scrollbar"]', '[id*="punch"]', '[class*="docs-homescreen"]',
  '[class*="docs-material-gm"]',
  '[class*="header-footer"]', '[class*="docs-headerfooterdialog"]',
  '[class*="gemini"]', '[class*="docs-gm"]', '[class*="side-panel"]',
  '[class*="comment"]', '[class*="discussion"]', '[class*="suggestion"]',
  '[class*="docs-notes"]', '[class*="smart-notes"]',
  '[class*="tooltip"]', '[class*="docs-tooltip"]',
  '[aria-hidden="true"]',
  '[role="dialog"]', '[role="tooltip"]', '[role="menu"]',
  '[role="menuitem"]', '[role="button"]',
];

// ============================================================================
// Visibility Checks
// ============================================================================

export function isHiddenOrOffscreen(el: Element): boolean {
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return true;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return true;
  if (rect.right < 0 || rect.bottom < 0) return true;
  return false;
}

export function isInsideExcludedUi(el: Element, container: Element): boolean {
  let parent: Element | null = el;
  while (parent && parent !== container) {
    for (const sel of UI_EXCLUDE_SELECTORS) {
      if (parent.matches(sel)) return true;
    }
    parent = parent.parentElement;
  }
  return false;
}

// ============================================================================
// Japanese Text Heuristics
// ============================================================================

export function looksLikeJapaneseDocument(text: string): boolean {
  const japaneseCharCount = (text.match(/[\u3040-\u30ff\u4e00-\u9fff]/g) || []).length;
  if (text.length === 0) return false;
  return japaneseCharCount / text.length >= 0.1;
}

// ============================================================================
// HTML Escaping
// ============================================================================

export function escapeHtml(text: string | null | undefined): string {
  if (text == null) return '';
  const map: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, c => map[c] || c);
}

// ============================================================================
// Kanji Detection
// ============================================================================

export function hasKanji(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

// ============================================================================
// Throttle Utility
// ============================================================================

export function throttle(fn: () => void, _ms: number): () => void {
  let pending = false;
  return () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      fn();
      pending = false;
    });
  };
}
