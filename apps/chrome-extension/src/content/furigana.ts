/**
 * KotobaFlow AI — Google Docs Furigana Content Script
 *
 * Entry point for the auto-furigana feature. Monitors Google Docs for
 * text changes, extracts Japanese text with per-character viewport
 * coordinates, sends it to the Genkit analysis pipeline, and renders
 * floating furigana reading labels positioned above Kanji characters.
 *
 * Architecture:
 *   furigana-helpers.ts    — DOM utilities, escaping, heuristics
 *   furigana-extraction.ts — text extraction with position capture (9 strategies)
 *   furigana-overlay.ts    — inline label rendering + legacy bar fallback
 */
import type { BackgroundToContentMessage } from '../shared/types';
import { extractDocumentText, DOCS_APP_SELECTOR } from './furigana-extraction';
import {
  renderFurigana,
  setCharPositions,
  removeAllLabels,
  removeOverlayContainer,
  recalculatePositions,
} from './furigana-overlay';
import { escapeHtml, throttle } from './furigana-helpers';

console.log('[KotobaFlow] Furigana content script loaded (inline overlay mode)');

// ============================================================================
// Constants
// ============================================================================

const IDLE_DELAY_MS = 1800;
const SCROLL_RECALC_THROTTLE_MS = 100;

// ============================================================================
// Module State
// ============================================================================

let idleTimer: ReturnType<typeof setTimeout> | null = null;
let observer: MutationObserver | null = null;
let lastText = '';
let requestSeq = 0;
let invalidated = false;
let scrollHandler: (() => void) | null = null;

// ============================================================================
// Lifecycle
// ============================================================================

function waitForDocsContainer(): Promise<Element> {
  return new Promise(resolve => {
    const check = () => {
      const el = document.querySelector(DOCS_APP_SELECTOR);
      if (el) { resolve(el); } else { setTimeout(check, 300); }
    };
    check();
  });
}

function dispose(): void {
  invalidated = true;
  if (observer) { observer.disconnect(); observer = null; }
  if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
  if (scrollHandler) {
    const container = document.querySelector(DOCS_APP_SELECTOR);
    if (container) container.removeEventListener('scroll', scrollHandler);
    scrollHandler = null;
  }
  removeAllLabels();
  removeOverlayContainer();
  setCharPositions([]);
}

async function init(): Promise<void> {
  // Inject annotate.js to request annotated Canvas mode (MAIN world)
  try {
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('annotate.js');
    s.setAttribute('data-ext-id', chrome.runtime.id);
    document.documentElement.appendChild(s);
  } catch { /* non-critical */ }

  const container = await waitForDocsContainer();

  observer = new MutationObserver(() => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(onIdleDetected, IDLE_DELAY_MS);
  });
  observer.observe(container, { childList: true, subtree: true, characterData: true });

  container.addEventListener('input', () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(onIdleDetected, IDLE_DELAY_MS);
  });

  scrollHandler = throttle(() => recalculatePositions(), SCROLL_RECALC_THROTTLE_MS);
  container.addEventListener('scroll', scrollHandler, { passive: true });

  onIdleDetected();
}

// ============================================================================
// Idle Detection → Extract → Send
// ============================================================================

function onIdleDetected(): void {
  if (invalidated) return;

  const { text, positions } = extractDocumentText();
  if (!text || text === lastText) return;

  lastText = text;
  setCharPositions(positions);
  requestSeq++;

  try {
    chrome.runtime.sendMessage({ action: 'ANALYZE_TEXT', text, seq: requestSeq }).catch((err: unknown) => {
      const msg = String(err);
      if (msg.includes('context invalidated') || msg.includes('No SW')) {
        dispose();
      } else {
        console.warn('[KotobaFlow] sendMessage failed:', msg);
      }
    });
  } catch (err: unknown) {
    const msg = String(err);
    if (msg.includes('context invalidated') || msg.includes('No SW')) {
      dispose();
    } else {
      console.warn('[KotobaFlow] sendMessage threw:', msg);
    }
  }
}

// ============================================================================
// Message Listener
// ============================================================================

function showErrorToast(text: string): void {
  const el = document.createElement('div');
  el.style.cssText = [
    'position: fixed', 'top: 12px', 'left: 50%', 'transform: translateX(-50%)',
    'padding: 8px 16px', 'background: #fef2f2', 'border: 1px solid #fecaca',
    'border-radius: 8px', 'font-size: 12px', 'color: #dc2626',
    'font-family: "Noto Sans JP", sans-serif', 'z-index: 2147483647',
    'pointer-events: auto',
  ].join(';');
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

chrome.runtime.onMessage.addListener((message: BackgroundToContentMessage) => {
  // ── Auto-furigana analysis result ──
  if (message.action === 'PITCH_ACCENT_RESULT' && message.requestAction === 'ANALYZE_TEXT') {
    if (message.result.seq !== undefined && message.result.seq !== requestSeq) {
      console.log('[KotobaFlow] Skipping stale result (seq mismatch)');
      return;
    }
    console.log('[KotobaFlow] Rendering furigana —', message.result.tokens?.length, 'tokens');
    renderFurigana(message.result);
  }

  // ── Auto-furigana analysis error ──
  if (message.action === 'ANALYSIS_ERROR' && message.requestAction === 'ANALYZE_TEXT') {
    showErrorToast(`Analysis error: ${escapeHtml(message.error)}`);
  }

  // ── Print preparation error ──
  if (message.action === 'ANALYSIS_ERROR' && message.requestAction === 'PREPARE_FOR_PRINT') {
    showErrorToast(`Print error: ${escapeHtml(message.error)}`);
  }
});

// ============================================================================
// Bootstrap
// ============================================================================

init().catch((err) => {
  console.error('[KotobaFlow] init failed:', err);
  dispose();
});
