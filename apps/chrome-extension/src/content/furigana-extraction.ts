/**
 * KotobaFlow AI — Google Docs Text Extraction
 *
 * Extracts Japanese text from the Google Docs editor across 9 strategies
 * (annotated Canvas SVG rects, textarea, contenteditable, data-text, ARIA,
 * legacy DOM, lineview, leaf text nodes). Strategy 1 (SVG rects with
 * aria-label) also captures per-character viewport coordinates for inline
 * overlay positioning.
 */
import {
  isHiddenOrOffscreen,
  isInsideExcludedUi,
  looksLikeJapaneseDocument,
} from './furigana-helpers';

// ============================================================================
// Constants
// ============================================================================

export const DOCS_APP_SELECTOR = '.kix-appview-editor';

// ============================================================================
// Types
// ============================================================================

/** Per-character viewport coordinate captured from an SVG <rect>. */
export interface CharRect {
  /** The character (single glyph) from aria-label. */
  char: string;
  /** Viewport-relative bounding rectangle of the SVG rect element. */
  rect: DOMRect;
  /** Zero-based index in the concatenated document text. */
  index: number;
}

/** Result of document text extraction with optional position data. */
export interface ExtractionResult {
  text: string;
  positions: CharRect[];
}

// ============================================================================
// Main Extraction Function
// ============================================================================

/**
 * Extracts Japanese text from the Google Docs editor AND captures
 * per-character viewport coordinates when the annotated Canvas mode
 * is active (SVG rects with aria-label attributes).
 *
 * Priority order:
 *   0. Canvas accessibility elements (text-only)
 *   1. Annotated Canvas SVG rects (text + positions)
 *   2–9. Fallback strategies (text-only, in order of reliability)
 */
export function extractDocumentText(): ExtractionResult {
  const container = document.querySelector(DOCS_APP_SELECTOR);
  if (!container) return { text: '', positions: [] };

  // ── Strategy 0: Canvas accessibility elements ──
  const textOnly = tryCanvasAccessibility();
  if (textOnly) return textOnly;

  // ── Strategy 1: Annotated Canvas SVG rects (positions available) ──
  const canvasResult = tryCanvasTileRects(container);
  if (canvasResult) return canvasResult;

  // ── Strategies 2–9: Text-only fallbacks ──
  return extractTextOnly(container);
}

// ============================================================================
// Strategy 0: Canvas Accessibility
// ============================================================================

function tryCanvasAccessibility(): ExtractionResult | null {
  const candidates = document.querySelectorAll<HTMLElement>(
    '[class*="kix-canvas"], [class*="kix-print"], .kix-print-selection, [role="document"], [aria-roledescription]'
  );
  for (const el of candidates) {
    const text = el.textContent?.trim();
    if (text && looksLikeJapaneseDocument(text)) {
      console.log('[KotobaFlow] extract: canvas accessibility (text-only)');
      return { text, positions: [] };
    }
  }
  return null;
}

// ============================================================================
// Strategy 1: Annotated Canvas — SVG rects with aria-label
// ============================================================================

function tryCanvasTileRects(container: Element): ExtractionResult | null {
  const canvasTile = container.querySelector('.kix-canvas-tile-content');
  const rects = canvasTile
    ? canvasTile.querySelectorAll<SVGRectElement>('svg g rect[aria-label]')
    : container.querySelectorAll<SVGRectElement>('rect[aria-label]');

  if (rects.length === 0) return null;

  const positions: CharRect[] = [];
  const chars: string[] = [];
  let index = 0;

  for (const rect of Array.from(rects)) {
    const label = (rect.getAttribute('aria-label') || '').trim();
    if (!label) continue;

    const bbox = rect.getBoundingClientRect();

    // aria-label may contain multiple characters — distribute them
    // across copies of the same bounding box so each has a position.
    for (const char of [...label]) {
      if (char.trim() === '') continue;
      positions.push({ char, rect: DOMRect.fromRect(bbox), index });
      chars.push(char);
      index++;
    }
  }

  const text = chars.join('').trim();
  if (text) {
    console.log('[KotobaFlow] extract: canvas tile —', positions.length, 'char positions, text length:', text.length);
    return { text, positions };
  }
  return null;
}

// ============================================================================
// Strategies 2–9: Text-Only Fallbacks
// ============================================================================

function extractTextOnly(container: Element): ExtractionResult {
  const empty: ExtractionResult = { text: '', positions: [] };

  // Strategy 2: Hidden textarea (keyboard input in Canvas mode)
  const textarea = container.querySelector(
    'textarea.kix-texteventtarget, textarea[aria-hidden], textarea'
  );
  if (textarea) {
    const val = (textarea as HTMLTextAreaElement).value?.trim();
    if (val) {
      console.log('[KotobaFlow] extract: textarea (text-only)');
      return { text: val, positions: [] };
    }
  }

  // Strategy 3: contenteditable
  const editable = container.querySelector('[contenteditable="true"]');
  if (editable) {
    const text = (editable as HTMLElement).textContent?.trim();
    if (text) {
      console.log('[KotobaFlow] extract: contenteditable (text-only)');
      return { text, positions: [] };
    }
  }

  // Strategy 4: data-text attributes
  const dataTextEls = container.querySelectorAll('[data-text]');
  if (dataTextEls.length > 0) {
    const text = Array.from(dataTextEls)
      .map(el => el.getAttribute('data-text') || '')
      .join('')
      .trim();
    if (text) {
      console.log('[KotobaFlow] extract: data-text (text-only)');
      return { text, positions: [] };
    }
  }

  // Strategy 5: role="textbox"
  const ariaTextbox = container.querySelector('[role="textbox"]');
  if (ariaTextbox) {
    const text = (ariaTextbox as HTMLElement).textContent?.trim();
    if (text) {
      console.log('[KotobaFlow] extract: role=textbox (text-only)');
      return { text, positions: [] };
    }
  }

  // Strategy 6: aria-label elements (filtered)
  const ariaLabelEls = container.querySelectorAll('[aria-label]');
  if (ariaLabelEls.length > 0) {
    const filtered = Array.from(ariaLabelEls).filter(
      el => !isInsideExcludedUi(el, container) && !isHiddenOrOffscreen(el)
    );
    const text = filtered
      .map(el => el.getAttribute('aria-label') || '')
      .filter(Boolean)
      .join('\n')
      .trim();
    if (text) {
      console.log('[KotobaFlow] extract: aria-label (text-only)');
      return { text, positions: [] };
    }
  }

  // Strategy 7: Legacy paragraph selectors
  const legacySelectors = [
    '.kix-paragraphrenderer', '.docs-textelement', '.kix-wordprocessor',
    '[class*="kix-paragraph"]', '.kix-page p',
  ];
  for (const sel of legacySelectors) {
    const els = container.querySelectorAll(sel);
    if (els.length > 0) {
      const text = Array.from(els)
        .map(el => (el as HTMLElement).textContent || '')
        .join('\n')
        .trim();
      if (text) {
        console.log('[KotobaFlow] extract: legacy —', sel, '(text-only)');
        return { text, positions: [] };
      }
    }
  }

  // Strategy 8: lineview text blocks
  const lineBlocks = container.querySelectorAll('[class*="kix-lineview-text-block"]');
  if (lineBlocks.length > 0) {
    const text = Array.from(lineBlocks)
      .map(el => (el as HTMLElement).textContent || '')
      .join('\n')
      .trim();
    if (text) {
      console.log('[KotobaFlow] extract: lineview (text-only)');
      return { text, positions: [] };
    }
  }

  // Strategy 9 (last resort): Leaf text nodes with strict exclusion
  const allElements = container.querySelectorAll('*');
  const texts: string[] = [];
  for (const el of Array.from(allElements)) {
    if ((el as HTMLElement).children.length > 0) continue;
    if (isHiddenOrOffscreen(el)) continue;
    if (isInsideExcludedUi(el, container)) continue;
    const text = (el as HTMLElement).textContent?.trim();
    if (!text) continue;
    texts.push(text);
  }
  if (texts.length > 0) {
    const joined = texts.join('\n').replace(/\s+/g, ' ').trim();
    if (!looksLikeJapaneseDocument(joined)) {
      console.log('[KotobaFlow] extract: no usable text found');
      return empty;
    }
    console.log('[KotobaFlow] extract: leaf nodes (text-only)');
    return { text: joined, positions: [] };
  }

  console.log('[KotobaFlow] extract: no text found');
  return empty;
}
