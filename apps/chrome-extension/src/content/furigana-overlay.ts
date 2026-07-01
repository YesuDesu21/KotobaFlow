/**
 * KotobaFlow AI — Furigana Overlay Renderer
 *
 * Creates and positions floating furigana reading labels directly above
 * Kanji characters in the Google Docs viewport. Implements:
 *   - Inline positioned labels (primary renderer)
 *   - Legacy fixed top bar (fallback when no position data)
 *   - Scroll-triggered position recalculation
 */
import type { AnalysisResult, TokenData } from '../shared/types';
import type { CharRect } from './furigana-extraction';
import { escapeHtml, hasKanji } from './furigana-helpers';

// ============================================================================
// Constants
// ============================================================================

const OVERLAY_CONTAINER_ID = 'kotobaflow-furigana-overlay';
const BAR_ID = 'kotobaflow-furigana-bar';
const BAR_CONTENT_ID = 'kotobaflow-furigana-content';

/** CSS for a single inline furigana label. */
const LABEL_CSS = [
  'position: fixed',
  'height: 16px',
  'display: flex',
  'align-items: flex-end',
  'justify-content: center',
  'font-family: "Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif',
  'font-size: 10px',
  'line-height: 1',
  'color: #4F46E5',
  'font-weight: 500',
  'text-align: center',
  'white-space: nowrap',
  'overflow: hidden',
  'text-overflow: ellipsis',
  'pointer-events: none',
  'user-select: none',
  'text-shadow: 0 0 3px rgba(255,255,255,0.9), 0 0 3px rgba(255,255,255,0.9)',
  'opacity: 0.85',
].join(';');

// ============================================================================
// Module State
// ============================================================================

let overlayContainer: HTMLElement | null = null;
let furiganaLabels: HTMLElement[] = [];
let charPositions: CharRect[] = [];
let lastResult: AnalysisResult | null = null;

// ============================================================================
// Public API
// ============================================================================

export function setCharPositions(positions: CharRect[]): void {
  charPositions = positions;
}

export function removeAllLabels(): void {
  for (const el of furiganaLabels) el.remove();
  furiganaLabels = [];
}

export function removeOverlayContainer(): void {
  if (overlayContainer) {
    overlayContainer.remove();
    overlayContainer = null;
  }
}

/**
 * Main render entry point. Creates inline positioned furigana labels
 * when position data is available, otherwise falls back to the top bar.
 */
export function renderFurigana(result: AnalysisResult): void {
  removeAllLabels();
  lastResult = result;

  if (charPositions.length === 0) {
    renderBar(result);
    return;
  }

  const container = getOrCreateContainer();
  for (const token of result.tokens) {
    const reading = token.pitchAccent?.reading || token.reading;
    if (!reading || token.surface === reading || token.isParticle) continue;
    if (!hasKanji(token.surface)) continue;

    const label = createLabel(token, reading);
    if (label) {
      container.appendChild(label);
      furiganaLabels.push(label);
    }
  }
}

/**
 * Recalculates label positions after editor scroll by re-rendering
 * from the cached last analysis result.
 */
export function recalculatePositions(): void {
  if (lastResult && charPositions.length > 0 && furiganaLabels.length > 0) {
    renderFurigana(lastResult);
  }
}

// ============================================================================
// Overlay Container
// ============================================================================

function getOrCreateContainer(): HTMLElement {
  let el = document.getElementById(OVERLAY_CONTAINER_ID);
  if (el) return el;

  el = document.createElement('div');
  el.id = OVERLAY_CONTAINER_ID;
  el.style.cssText = 'position:fixed;inset:0;z-index:2147483646;pointer-events:none;overflow:hidden;';
  document.body.appendChild(el);
  overlayContainer = el;
  return el;
}

// ============================================================================
// Label Creation
// ============================================================================

function createLabel(token: TokenData, reading: string): HTMLElement | null {
  const startIdx = token.position;
  const endIdx = startIdx + token.surface.length;
  const startRect = charPositions.find(p => p.index === startIdx);
  const endRect = charPositions.find(p => p.index === endIdx - 1);

  if (!startRect || !endRect) {
    return createLabelBySubstring(token, reading);
  }
  return buildLabelElement(startRect.rect, endRect.rect, reading);
}

/** Fallback: match token surface text in charPositions by substring search. */
function createLabelBySubstring(token: TokenData, reading: string): HTMLElement | null {
  if (charPositions.length === 0) return null;

  const fullText = charPositions.map(p => p.char).join('');
  const searchStart = Math.max(0, token.position - 5);
  const searchEnd = Math.min(fullText.length, token.position + token.surface.length + 5);
  const matchIdx = fullText.slice(searchStart, searchEnd).indexOf(token.surface);
  if (matchIdx === -1) return null;

  const actualStart = searchStart + matchIdx;
  const actualEnd = actualStart + token.surface.length;
  const startPos = charPositions[actualStart];
  const endPos = charPositions[actualEnd - 1];
  if (!startPos || !endPos) return null;

  return buildLabelElement(startPos.rect, endPos.rect, reading);
}

function buildLabelElement(startRect: DOMRect, endRect: DOMRect, reading: string): HTMLElement | null {
  const left = startRect.left;
  const right = endRect.right;
  const top = startRect.top;
  const width = right - left;

  if (width <= 0 || top <= 0) return null;

  const el = document.createElement('kotobaflow-label');
  el.style.cssText = [
    LABEL_CSS,
    `left: ${left}px`,
    `top: ${top - 18}px`,
    `width: ${width}px`,
  ].join(';');
  el.textContent = reading;
  return el;
}

// ============================================================================
// Legacy Top-Bar Fallback
// ============================================================================

function renderBar(result: AnalysisResult): void {
  let bar = document.getElementById(BAR_ID);
  if (!bar) {
    bar = document.createElement('div');
    bar.id = BAR_ID;
    bar.style.cssText = [
      'position: fixed', 'top: 0', 'left: 0', 'right: 0',
      'z-index: 2147483647', 'background: rgba(255, 255, 255, 0.97)',
      'border-bottom: 1px solid #e5e7eb', 'padding: 8px 16px',
      'font-family: "Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif',
      'font-size: 14px', 'line-height: 1.8', 'color: #1f2937',
      'box-shadow: 0 2px 8px rgba(0,0,0,0.08)',
      'max-height: 120px', 'overflow-y: auto', 'transition: opacity 0.3s ease',
    ].join(';');

    const label = document.createElement('div');
    label.style.cssText = 'font-size: 11px; color: #6b7280; margin-bottom: 4px;';
    label.textContent = 'KotobaFlow Furigana';
    bar.appendChild(label);

    const content = document.createElement('div');
    content.id = BAR_CONTENT_ID;
    bar.appendChild(content);
    document.body.appendChild(bar);
  }

  const content = bar.querySelector(`#${BAR_CONTENT_ID}`);
  if (!content) return;

  let html = '';
  for (const token of result.tokens) {
    const reading = token.pitchAccent?.reading || token.reading;
    if (reading && token.surface !== reading) {
      html += `<ruby style="ruby-position:over">${escapeHtml(token.surface)}<rt>${escapeHtml(reading)}</rt></ruby>`;
    } else if (token.isParticle) {
      html += `<span style="color:#9ca3af">${escapeHtml(token.surface)}</span>`;
    } else {
      html += escapeHtml(token.surface);
    }
  }
  content.innerHTML = html;
}
