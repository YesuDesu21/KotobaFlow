/**
 * KotobaFlow AI — Background Service Worker
 *
 * Manifest V3 service worker responsibilities:
 * 1. Create right-click context menus for pitch accent and print actions
 * 2. Broker messages between content scripts and the Genkit backend
 * 3. Manage the print-template tab lifecycle
 */
import type { AnalysisResult } from '../shared/types';

// ============================================================================
// Configuration
// ============================================================================

const GENKIT_API_BASE = 'http://localhost:4000';
const ANALYZE_FLOW_PATH = '/api/flow/analyzeSentence';

// ============================================================================
// Context Menu IDs
// ============================================================================

const MENU_PARENT = 'kotobaflow-parent';
const MENU_SHOW_PITCH = 'show-pitch-accent';
const MENU_PREPARE_PRINT = 'prepare-for-print';

// ============================================================================
// Initialization
// ============================================================================

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_PARENT,
    title: 'KotobaFlow AI',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: MENU_SHOW_PITCH,
    parentId: MENU_PARENT,
    title: 'Show Pitch Accent',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: MENU_PREPARE_PRINT,
    parentId: MENU_PARENT,
    title: 'Prepare for Print',
    contexts: ['selection'],
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

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'ANALYZE_TEXT') {
    if (sender.tab?.id) {
      handleAnalyzeText(message.text, sender.tab.id);
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

async function handleAnalyzeText(text: string, tabId: number): Promise<void> {
  try {
    const result = await callAnalyzeFlow(text);
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
      url: chrome.runtime.getURL('public/print-template.html'),
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

async function callAnalyzeFlow(sentence: string): Promise<AnalysisResult> {
  const url = `${GENKIT_API_BASE}${ANALYZE_FLOW_PATH}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sentence }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Genkit API returned ${response.status}: ${body}`);
  }

  return response.json();
}