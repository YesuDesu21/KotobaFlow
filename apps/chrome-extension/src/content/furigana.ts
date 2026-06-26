import type { AnalysisResult, BackgroundToContentMessage } from '../shared/types';

console.log('[KotobaFlow] Furigana content script loaded');

const IDLE_DELAY_MS = 1800;
const DOCS_APP_SELECTOR = '.kix-appview-editor';

let idleTimer: ReturnType<typeof setTimeout> | null = null;
let observer: MutationObserver | null = null;
let lastText = '';
let requestSeq = 0;
let invalidated = false;

function waitForDocsContainer(): Promise<Element> {
  return new Promise(resolve => {
    const check = () => {
      const el = document.querySelector(DOCS_APP_SELECTOR);
      if (el) {
        console.log('[KotobaFlow] Docs container found');
        resolve(el);
      } else {
        console.log('[KotobaFlow] Waiting for docs container...');
        setTimeout(check, 300);
      }
    };
    check();
  });
}

function dispose(): void {
  invalidated = true;
  if (observer) { observer.disconnect(); observer = null; }
  if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
  const bar = document.getElementById('kotobaflow-furigana-bar');
  if (bar) bar.remove();
}

async function init(): Promise<void> {
  console.log('[KotobaFlow] init() called');

  // Inject annotate.js to request annotated Canvas mode — runs in MAIN world context
  // and sets _docs_annotate_canvas_by_ext before Google Docs initializes
  try {
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('annotate.js');
    s.setAttribute('data-ext-id', chrome.runtime.id);
    document.documentElement.appendChild(s);
  } catch { /* non-critical */ }

  const container = await waitForDocsContainer();
  console.log('[KotobaFlow] Setting up MutationObserver');

  observer = new MutationObserver(() => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(onIdleDetected, IDLE_DELAY_MS);
  });
  observer.observe(container, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  container.addEventListener('input', () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(onIdleDetected, IDLE_DELAY_MS);
  });

  onIdleDetected();
}

// Elements/containers that are NEVER part of the actual document body,
// even though they can live inside .kix-appview-editor's DOM subtree.
const UI_EXCLUDE_SELECTORS = [
  '[class*="menu"]', '[class*="toolbar"]', '[class*="sidebar"]',
  '[class*="scrollbar"]', '[id*="punch"]', '[class*="docs-homescreen"]',
  '[class*="docs-material-gm"]',
  '[class*="header-footer"]', '[class*="docs-headerfooterdialog"]',
  '[class*="gemini"]', '[class*="docs-gm"]', '[class*="side-panel"]',
  '[class*="comment"]', '[class*="discussion"]', '[class*="suggestion"]',
  '[class*="docs-notes"]', '[class*="smart-notes"]',
  '[class*="tooltip"]', '[class*="docs-tooltip"]',
  '[aria-hidden="true"]',
  '[role="dialog"]', '[role="tooltip"]', '[role="menu"]', '[role="menuitem"]', '[role="button"]',
];

function isHiddenOrOffscreen(el: Element): boolean {
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return true;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return true;
  // Off-screen techniques (left: -9999px, etc.)
  if (rect.right < 0 || rect.bottom < 0) return true;
  return false;
}

function isInsideExcludedUi(el: Element, container: Element): boolean {
  let parent: Element | null = el;
  while (parent && parent !== container) {
    for (const sel of UI_EXCLUDE_SELECTORS) {
      if (parent.matches(sel)) return true;
    }
    parent = parent.parentElement;
  }
  return false;
}

function looksLikeJapaneseDocument(text: string): boolean {
  const japaneseCharCount = (text.match(/[\u3040-\u30ff\u4e00-\u9fff]/g) || []).length;
  if (text.length === 0) return false;
  return japaneseCharCount / text.length >= 0.1;
}

function extractDocumentText(): string {
  const container = document.querySelector(DOCS_APP_SELECTOR);
  if (!container) return '';

  // Strategy 0: search ANY element in the full document for Japanese text
  // (Canvas mode may hide text in unexpected places for accessibility)
  const docCandidates = document.querySelectorAll<HTMLElement>('[class*="kix-canvas"], [class*="kix-print"], .kix-print-selection, [role="document"], [aria-roledescription]');
  for (const el of docCandidates) {
    const text = el.textContent?.trim();
    if (text && looksLikeJapaneseDocument(text)) {
      console.log('[KotobaFlow] extract: canvas accessibility');
      return text;
    }
  }

  // Strategy 1: Annotated Canvas — text in aria-label on SVG rects inside .kix-canvas-tile-content
  const canvasTile = container.querySelector('.kix-canvas-tile-content');
  if (canvasTile) {
    const rects = canvasTile.querySelectorAll<SVGRectElement>('svg g rect[aria-label]');
    if (rects.length > 0) {
      const text = Array.from(rects).map(r => r.getAttribute('aria-label') || '').join('').trim();
      if (text) { console.log('[KotobaFlow] extract: canvas tile'); return text; }
    }
  }
  // Also search for any SVG rect with aria-label
  const allRects = container.querySelectorAll<SVGRectElement>('rect[aria-label]');
  if (allRects.length > 0) {
    const text = Array.from(allRects).map(r => r.getAttribute('aria-label') || '').join('').trim();
    if (text) { console.log('[KotobaFlow] extract: canvas rects'); return text; }
  }

  // Strategy 2: hidden textarea used by Google Docs Canvas mode for keyboard input
  const textarea = container.querySelector('textarea.kix-texteventtarget, textarea[aria-hidden], textarea');
  console.log('[KotobaFlow] strategy 1 (textarea) found element:', !!textarea, 'value:', JSON.stringify((textarea as HTMLTextAreaElement)?.value));
  if (textarea) {
    const val = (textarea as HTMLTextAreaElement).value?.trim();
    if (val) { console.log('[KotobaFlow] extract: textarea'); return val; }
  }

  // Strategy 2: contenteditable elements (used in some Google Docs modes)
  const editable = container.querySelector('[contenteditable="true"]');
  console.log('[KotobaFlow] strategy 2 (contenteditable) found element:', !!editable, 'textLen:', (editable as HTMLElement)?.textContent?.length);
  if (editable) {
    const text = (editable as HTMLElement).textContent?.trim();
    if (text) { console.log('[KotobaFlow] extract: contenteditable'); return text; }
  }

  // Strategy 3: Canvas-based Google Docs — text in data-text attributes
  const canvasTextEls = container.querySelectorAll('[data-text]');
  console.log('[KotobaFlow] strategy 3 (data-text) candidate count:', canvasTextEls.length);
  if (canvasTextEls.length > 0) {
    const text = Array.from(canvasTextEls)
      .map(el => el.getAttribute('data-text') || '')
      .join('')
      .trim();
    if (text) { console.log('[KotobaFlow] extract: data-text'); return text; }
  }

  // Strategy 4: ARIA textbox — accessibility layer for Canvas-rendered docs
  const ariaTextbox = container.querySelector('[role="textbox"]');
  console.log('[KotobaFlow] strategy 4 (role=textbox) found element:', !!ariaTextbox, 'textLen:', (ariaTextbox as HTMLElement)?.textContent?.length);
  if (ariaTextbox) {
    const text = (ariaTextbox as HTMLElement).textContent?.trim();
    if (text) { console.log('[KotobaFlow] extract: role=textbox'); return text; }
  }

  // Strategy 5: aria-label on canvas tiles
  const ariaLabelEls = container.querySelectorAll('[aria-label]');
  console.log(
    '[KotobaFlow] strategy 5 (aria-label) candidate count:', ariaLabelEls.length,
    'sample labels:', Array.from(ariaLabelEls).slice(0, 5).map(el => el.getAttribute('aria-label')),
  );
  if (ariaLabelEls.length > 0) {
    const filtered = Array.from(ariaLabelEls).filter(
      el => !isInsideExcludedUi(el, container) && !isHiddenOrOffscreen(el),
    );
    const text = filtered
      .map(el => el.getAttribute('aria-label') || '')
      .filter(Boolean)
      .join('\n')
      .trim();
    if (text) { console.log('[KotobaFlow] extract: aria-label'); return text; }
  }

  // Strategy 6: Legacy paragraph-level selectors (older non-canvas Google Docs DOM)
  const legacySelectors = [
    '.kix-paragraphrenderer',
    '.docs-textelement',
    '.kix-wordprocessor',
    '[class*="kix-paragraph"]',
    '.kix-page p',
  ];
  for (const sel of legacySelectors) {
    const els = container.querySelectorAll(sel);
    console.log('[KotobaFlow] strategy 6 (legacy', sel, ') candidate count:', els.length);
    if (els.length > 0) {
      const text = Array.from(els)
        .map(el => (el as HTMLElement).textContent || '')
        .join('\n')
        .trim();
      if (text) { console.log('[KotobaFlow] extract: legacy —', sel); return text; }
    }
  }

  // Strategy 7: Line-view text blocks
  const lineBlocks = container.querySelectorAll('[class*="kix-lineview-text-block"]');
  console.log('[KotobaFlow] strategy 7 (lineview) candidate count:', lineBlocks.length);
  if (lineBlocks.length > 0) {
    const text = Array.from(lineBlocks)
      .map(el => (el as HTMLElement).textContent || '')
      .join('\n')
      .trim();
    if (text) { console.log('[KotobaFlow] extract: lineview'); return text; }
  }

  // Strategy 8 (last resort): Collect text from leaf text nodes, excluding UI chrome.
  // This sweeps the *entire* editor subtree, so it is the most likely strategy to
  // accidentally pick up hidden/off-screen UI copy (toolbars, comment popovers,
  // Gemini side-panel chips, header/footer dialogs, etc). Be strict here.
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
      console.warn(
        '[KotobaFlow] strategy 8 result rejected — looks like UI chrome, not document text:',
        JSON.stringify(joined.slice(0, 120)),
      );
      console.log('[KotobaFlow] extract: no usable text found');
      return '';
    }
    console.log('[KotobaFlow] extract: strategy 8 hit (leaf nodes)');
    return joined;
  }

  console.log('[KotobaFlow] extract: no text found');
  return '';
}

function onIdleDetected(): void {
  if (invalidated) return;

  const text = extractDocumentText();
  console.log('[KotobaFlow] onIdleDetected - text length:', text.length, 'lastText length:', lastText.length, 'text:', JSON.stringify(text));
  if (!text || text === lastText) return;

  lastText = text;
  requestSeq++;
  try {
    chrome.runtime.sendMessage({ action: 'ANALYZE_TEXT', text, seq: requestSeq }).catch((err: unknown) => {
      const msg = String(err);
      if (msg.includes('context invalidated') || msg.includes('No SW')) {
        console.log('[KotobaFlow] Extension context invalidated — cleaning up');
        dispose();
      } else {
        console.warn('[KotobaFlow] sendMessage failed:', msg);
      }
    });
  } catch (err: unknown) {
    const msg = String(err);
    if (msg.includes('context invalidated') || msg.includes('No SW')) {
      console.log('[KotobaFlow] Extension context invalidated — cleaning up');
      dispose();
    } else {
      console.warn('[KotobaFlow] sendMessage threw:', msg);
    }
  }
}

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
    // Use pitch accent reading from DB, or fall back to tokenizer reading
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

function escapeHtml(text: string | null | undefined): string {
  if (text == null) return '';
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, c => map[c] || c);
}

chrome.runtime.onMessage.addListener((message: BackgroundToContentMessage) => {
  if (message.action === 'PITCH_ACCENT_RESULT' && message.requestAction === 'ANALYZE_TEXT') {
    if (message.result.seq !== undefined && message.result.seq !== requestSeq) {
      console.log('[KotobaFlow] Skipping stale PITCH_ACCENT_RESULT (expected seq:', requestSeq, 'got:', message.result.seq, ')');
      return;
    }
    console.log('[KotobaFlow] Received PITCH_ACCENT_RESULT — tokens:', message.result.tokens?.length, 'sample:', JSON.stringify(message.result.tokens?.[0]?.surface), 'reading:', JSON.stringify(message.result.tokens?.[0]?.pitchAccent?.reading), 'sentence:', JSON.stringify(message.result.sentence));
    getOrCreateOverlay();
    renderFurigana(message.result);
    const content = document.querySelector('#kotobaflow-furigana-content');
    console.log('[KotobaFlow] Content innerHTML length:', content?.innerHTML?.length);
  }
  if (message.action === 'ANALYSIS_ERROR' && message.requestAction === 'ANALYZE_TEXT') {
    console.log('[KotobaFlow] Received ANALYSIS_ERROR:', message.error);
    getOrCreateOverlay();
    const content = document.querySelector('#kotobaflow-furigana-content');
    if (content) {
      content.innerHTML = `<span style="color:#ef4444">Error: ${escapeHtml(message.error)}</span>`;
    }
  }
  if (message.action === 'ANALYSIS_ERROR' && message.requestAction === 'PREPARE_FOR_PRINT') {
    console.log('[KotobaFlow] Print preparation failed:', message.error);
    getOrCreateOverlay();
    const content = document.querySelector('#kotobaflow-furigana-content');
    if (content) {
      content.innerHTML = `<span style="color:#ef4444">Print error: ${escapeHtml(message.error)}</span>`;
    }
  }
});

init().catch((err) => {
  console.error('[KotobaFlow] init failed:', err);
  dispose();
});