/**
 * KotobaFlow AI — Google Docs Furigana Layer
 *
 * Monitors the Google Docs workspace surface using a debounced idle-detection
 * loop (1.5–2s after typing pauses). Extracts text from the document's
 * paragraph renderer DOM, sends it through the analysis pipeline, and injects
 * furigana overlays above structural Kanji words.
 */
import type { AnalysisResult, BackgroundToContentMessage } from '../shared/types';

// ============================================================================
// Constants
// ============================================================================

const IDLE_DELAY_MS = 1800;
const DOCS_APP_SELECTOR = '.kix-appview-editor';
const PARAGRAPH_SELECTOR = '.kix-paragraphrenderer';

// ============================================================================
// State
// ============================================================================

let idleTimer: ReturnType<typeof setTimeout> | null = null;
let lastText = '';

// ============================================================================
// Initialization — wait for Google Docs to be ready
// ============================================================================

function waitForDocsContainer(): Promise<Element> {
  return new Promise(resolve => {
    const check = () => {
      const el = document.querySelector(DOCS_APP_SELECTOR);
      if (el) resolve(el);
      else setTimeout(check, 300);
    };
    check();
  });
}

async function init(): Promise<void> {
  const container = await waitForDocsContainer();

  new MutationObserver(() => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(onIdleDetected, IDLE_DELAY_MS);
  }).observe(container, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

// ============================================================================
// Text Extraction
// ============================================================================

function extractDocumentText(): string {
  const paragraphs = document.querySelectorAll(PARAGRAPH_SELECTOR);
  return Array.from(paragraphs)
    .map(p => p.textContent || '')
    .join('\n')
    .trim();
}

// ============================================================================
// Idle Detection Handler
// ============================================================================

function onIdleDetected(): void {
  const text = extractDocumentText();
  if (!text || text === lastText) return;

  lastText = text;
  chrome.runtime.sendMessage({ action: 'ANALYZE_TEXT', text });
}

// ============================================================================
// Furigana Overlay Rendering
// ============================================================================

function getOrCreateOverlay(): HTMLElement {
  let overlay = document.getElementById('kotobaflow-furigana-bar');
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = 'kotobaflow-furigana-bar';
  overlay.style.cssText = [
    'position: fixed',
    'top: 0',
    'left: 0',
    'right: 0',
    'z-index: 2147483647',
    'background: rgba(255, 255, 255, 0.97)',
    'border-bottom: 1px solid #e5e7eb',
    'padding: 8px 16px',
    'font-family: "Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif',
    'font-size: 14px',
    'line-height: 1.8',
    'color: #1f2937',
    'box-shadow: 0 2px 8px rgba(0,0,0,0.08)',
    'max-height: 120px',
    'overflow-y: auto',
    'transition: opacity 0.3s ease',
  ].join(';');

  const label = document.createElement('div');
  label.style.cssText = 'font-size: 11px; color: #6b7280; margin-bottom: 4px;';
  label.textContent = 'KotobaFlow Furigana';
  overlay.appendChild(label);

  const content = document.createElement('div');
  content.id = 'kotobaflow-furigana-content';
  overlay.appendChild(content);

  document.body.appendChild(overlay);
  return overlay;
}

function renderFurigana(result: AnalysisResult): void {
  const content = document.querySelector('#kotobaflow-furigana-content');
  if (!content) return;

  let html = '';
  for (const token of result.tokens) {
    if (token.pitchAccent?.reading && token.surface !== token.pitchAccent.reading) {
      html += `<ruby style="ruby-position:over">${escapeHtml(token.surface)}<rt>${escapeHtml(token.pitchAccent.reading)}</rt></ruby>`;
    } else if (token.isParticle) {
      html += `<span style="color:#9ca3af">${escapeHtml(token.surface)}</span>`;
    } else {
      html += escapeHtml(token.surface);
    }
  }

  content.innerHTML = html;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, c => map[c] || c);
}

// ============================================================================
// Message Listener (from background worker)
// ============================================================================

chrome.runtime.onMessage.addListener((message: BackgroundToContentMessage) => {
  if (message.action === 'PITCH_ACCENT_RESULT' && message.requestAction === 'ANALYZE_TEXT') {
    getOrCreateOverlay();
    renderFurigana(message.result);
  }
});

// ============================================================================
// Start
// ============================================================================

init().catch(console.error);