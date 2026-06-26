import type { AnalysisResult } from '../shared/types';

const GENKIT_API_BASE = 'http://localhost:4000';
const ANALYZE_FLOW_PATH = '/api/flow/analyzeSentence';

const MENU_PARENT = 'kotobaflow-parent';
const MENU_SHOW_PITCH = 'show-pitch-accent';
const MENU_PREPARE_PRINT = 'prepare-for-print';

console.log('[KotobaFlow] Service worker started');
console.log('[KotobaFlow] contextMenus API available:', !!chrome.contextMenus);

// Create parent menu first, then children in its callback
chrome.contextMenus.removeAll(() => {
  chrome.contextMenus.create({
    id: MENU_PARENT,
    title: 'KotobaFlow AI',
    contexts: ['selection'],
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('[KotobaFlow] Parent menu error:', chrome.runtime.lastError);
      return;
    }
    console.log('[KotobaFlow] Parent menu created');
    chrome.contextMenus.create({
      id: MENU_SHOW_PITCH,
      parentId: MENU_PARENT,
      title: 'Show Pitch Accent',
      contexts: ['selection'],
    }, () => {
      if (chrome.runtime.lastError) console.error('[KotobaFlow] Show pitch error:', chrome.runtime.lastError);
      else console.log('[KotobaFlow] Show Pitch menu created');
    });
    chrome.contextMenus.create({
      id: MENU_PREPARE_PRINT,
      parentId: MENU_PARENT,
      title: 'Prepare for Print',
      contexts: ['selection'],
    }, () => {
      if (chrome.runtime.lastError) console.error('[KotobaFlow] Print menu error:', chrome.runtime.lastError);
      else console.log('[KotobaFlow] Print menu created');
    });
  });
});

// ============================================================================
// Context Menu Click Handler
// ============================================================================

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id || !info.selectionText) return;

  switch (info.menuItemId) {
    case MENU_SHOW_PITCH:
      handleShowPitchAccent(info.selectionText, tab.id);
      break;
    case MENU_PREPARE_PRINT:
      handlePreparePrint(info.selectionText, tab.id);
      break;
  }
});

// ============================================================================
// Message Handler (from content scripts)
// ============================================================================

chrome.runtime.onMessage.addListener((message: any, sender) => {
  if (message.action === 'ANALYZE_TEXT') {
    if (sender.tab?.id) {
      handleAnalyzeText(message.text, sender.tab.id, message.seq);
    }
  }
});

// ============================================================================
// Handler Implementations
// ============================================================================

async function handleShowPitchAccent(text: string, tabId: number): Promise<void> {
  try {
    const result = await callAnalyzeFlow(text);
    await chrome.tabs.sendMessage(tabId, {
      action: 'PITCH_ACCENT_RESULT',
      requestAction: 'SHOW_PITCH_ACCENT',
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await chrome.tabs.sendMessage(tabId, {
      action: 'ANALYSIS_ERROR',
      requestAction: 'SHOW_PITCH_ACCENT',
      error: message,
    }).catch(() => {});
  }
}

async function handleAnalyzeText(text: string, tabId: number, seq?: number): Promise<void> {
  try {
    const result = await callAnalyzeFlow(text, seq);
    await chrome.tabs.sendMessage(tabId, {
      action: 'PITCH_ACCENT_RESULT',
      requestAction: 'ANALYZE_TEXT',
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await chrome.tabs.sendMessage(tabId, {
      action: 'ANALYSIS_ERROR',
      requestAction: 'ANALYZE_TEXT',
      error: message,
    }).catch(() => {});
  }
}

async function handlePreparePrint(text: string, tabId: number): Promise<void> {
  try {
    const result = await callAnalyzeFlow(text);
    await chrome.storage.session.set({
      printData: { text, tokens: result.tokens },
    });
    await chrome.tabs.create({
      url: chrome.runtime.getURL('print-template.html'),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await chrome.tabs.sendMessage(tabId, {
      action: 'ANALYSIS_ERROR',
      requestAction: 'PREPARE_FOR_PRINT',
      error: message,
    }).catch(() => {});
  }
}

// ============================================================================
// Genkit API Client
// ============================================================================

async function callAnalyzeFlow(sentence: string, seq?: number): Promise<AnalysisResult> {
  const url = `${GENKIT_API_BASE}${ANALYZE_FLOW_PATH}`;
  const body: Record<string, unknown> = { sentence };
  if (seq !== undefined) body.seq = seq;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Genkit API returned ${response.status}: ${body}`);
  }

  return response.json();
}