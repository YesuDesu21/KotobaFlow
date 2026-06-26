/**
 * KotobaFlow AI — Pitch Accent Visual Overlay
 *
 * Shadow DOM overlay that renders SVG pitch contour graphs above
 * Japanese text. Triggered by the "Show Pitch Accent" context menu action.
 * Receives PITCH_ACCENT_RESULT from the background worker and renders
 * each word's H/L pitch sequence as an inline SVG path.
 */
import type { BackgroundToContentMessage, TokenData } from '../shared/types';

// ============================================================================
// SVG Pitch Contour Engine (mirrors pitch-parser.ts sequenceToSVG logic)
// ============================================================================

interface SVGOutput {
  path: string;
  viewBox: string;
  width: number;
  height: number;
}

function pitchSequenceToSVG(sequence: ('H' | 'L')[]): SVGOutput {
  const HIGH_Y = 10;
  const LOW_Y = 40;
  const SPACING = 50;
  const START_X = 20;
  const n = sequence.length;

  const points: Array<{ x: number; y: number }> = [];
  const pathCmds: string[] = [];

  for (let i = 0; i < n; i++) {
    const x = START_X + i * SPACING;
    const y = sequence[i] === 'H' ? HIGH_Y : LOW_Y;
    points.push({ x, y });
  }

  if (points.length === 0) {
    return { path: '', viewBox: '0 0 0 0', width: 0, height: 0 };
  }

  pathCmds.push(`M ${points[0].x} ${points[0].y}`);
  for (let i = 1; i < points.length; i++) {
    pathCmds.push(`L ${points[i].x} ${points[i].y}`);
  }

  const last = points[points.length - 1];
  const finalX = last.x + SPACING / 2;
  pathCmds.push(`L ${finalX} ${last.y}`);

  const w = finalX + 20;
  const h = 50;

  return { path: pathCmds.join(' '), viewBox: `0 0 ${w} ${h}`, width: w, height: h };
}

// ============================================================================
// Shadow DOM Overlay
// ============================================================================

const STYLES = `
:host {
  all: initial;
  display: block;
  position: fixed;
  z-index: 2147483647;
  inset: 0;
  font-family: "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
}

#backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.2s ease;
}

#panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 520px;
  max-height: 80vh;
  width: 90%;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  overflow-y: auto;
  animation: slideUp 0.25s ease;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translate(-50%, -40%); } to { opacity: 1; transform: translate(-50%, -50%); } }

#header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #f3f4f6;
}

#header h2 {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

#header h2 span { color: #4F46E5; }

#close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #f3f4f6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  line-height: 28px;
  text-align: center;
  color: #6b7280;
  transition: background 0.15s;
}

#close-btn:hover { background: #e5e7eb; color: #1f2937; }

#body {
  padding: 16px 18px;
}

.word-card {
  margin-bottom: 14px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  padding: 12px;
}

.word-card:last-child { margin-bottom: 0; }

.word-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
}

.word-surface {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.word-reading {
  font-size: 13px;
  color: #6b7280;
}

.pattern-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 4px;
  margin-left: auto;
  white-space: nowrap;
}

.badge-Heiban   { background: #dbeafe; color: #1d4ed8; }
.badge-Atamadaka { background: #fce7f3; color: #be185d; }
.badge-Nakadaka  { background: #fef3c7; color: #b45309; }
.badge-Odaka     { background: #d1fae5; color: #047857; }

.word-svg {
  display: block;
  width: 100%;
  height: auto;
}

.word-svg path { stroke-width: 2.5; fill: none; stroke-linejoin: round; }

.mora-dot-H { fill: #4F46E5; r: 4; }
.mora-dot-L { fill: #9ca3af; r: 3.5; }

.mora-label {
  font-size: 9px;
  fill: #6b7280;
  text-anchor: middle;
}

.no-data {
  text-align: center;
  padding: 24px 0;
  color: #9ca3af;
  font-size: 13px;
}
`;

let overlayRoot: ShadowRoot | null = null;

/**
 * Creates or returns the existing shadow DOM overlay container.
 */
function ensureOverlay(): ShadowRoot {
  if (overlayRoot) return overlayRoot;

  const host = document.createElement('div');
  const root = host.attachShadow({ mode: 'closed' });
  document.body.appendChild(host);
  overlayRoot = root;
  return root;
}

/**
 * Renders the pitch accent overlay panel with SVG contours for each token.
 */
function renderOverlay(tokens: TokenData[]): void {
  const root = ensureOverlay();
  const hasPitchData = tokens.some(t => t.pitchAccent);

  root.innerHTML = `
    <style>${STYLES}</style>
    <div id="backdrop"></div>
    <div id="panel" role="dialog" aria-label="Pitch Accent Results">
      <div id="header">
        <h2><span>KotobaFlow</span> — Pitch Accent</h2>
        <button id="close-btn" aria-label="Close">&times;</button>
      </div>
      <div id="body">
        ${hasPitchData ? tokens.filter(t => t.pitchAccent).map(renderWordCard).join('') : '<div class="no-data">No pitch accent data available for this selection.</div>'}
      </div>
    </div>
  `;

  // Event handlers
  const panel = root.getElementById('panel')!;
  const closeBtn = root.getElementById('close-btn')!;
  const backdrop = root.getElementById('backdrop')!;

  const dismiss = () => {
    panel.style.animation = 'none';
    const host = root.host as HTMLElement;
    host.remove();
    overlayRoot = null;
  };

  closeBtn.addEventListener('click', dismiss);
  backdrop.addEventListener('click', dismiss);
}

/**
 * Builds the HTML for a single word card including its SVG pitch contour.
 */
function renderWordCard(token: TokenData): string {
  const pa = token.pitchAccent!;
  const svg = pitchSequenceToSVG(pa.pitchPattern.sequence);

  return `
    <div class="word-card">
      <div class="word-header">
        <span class="word-surface">${escapeHtml(token.surface)}</span>
        <span class="word-reading">${escapeHtml(pa.reading)}</span>
        <span class="pattern-badge badge-${pa.pitchPattern.type}">${pa.pitchPattern.type}</span>
      </div>
      <svg class="word-svg" viewBox="${svg.viewBox}" width="${svg.width}" height="${svg.height}"
           xmlns="http://www.w3.org/2000/svg">
        <path d="${svg.path}" stroke="#4F46E5"/>
        ${pa.pitchPattern.sequence.map((p, i) => {
          const x = 20 + i * 50;
          const y = p === 'H' ? 10 : 40;
          return `<circle class="mora-dot-${p}" cx="${x}" cy="${y}"/>`;
        }).join('')}
        ${pa.pitchPattern.sequence.map((_, i) => {
          const x = 20 + i * 50;
          return `<text class="mora-label" x="${x}" y="48">${i + 1}</text>`;
        }).join('')}
      </svg>
    </div>
  `;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, c => map[c] || c);
}

// ============================================================================
// Message Listener — triggered by "Show Pitch Accent" context menu action
// ============================================================================

chrome.runtime.onMessage.addListener((message: BackgroundToContentMessage) => {
  if (message.action === 'PITCH_ACCENT_RESULT' && message.requestAction === 'SHOW_PITCH_ACCENT') {
    renderOverlay(message.result.tokens);
  }
});