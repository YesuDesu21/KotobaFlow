// ============================================================================
// Action Discriminators — all messages use 'action' as the discriminant field
// ============================================================================

export type ExtensionAction =
  | 'ANALYZE_TEXT'
  | 'SHOW_PITCH_ACCENT'
  | 'PREPARE_FOR_PRINT'
  | 'GET_SELECTED_TEXT'
  | 'PITCH_ACCENT_RESULT'
  | 'ANALYSIS_ERROR';

// ============================================================================
// Pitch Accent Data Types (mirrors backend-core output)
// ============================================================================

export interface PitchPattern {
  type: 'Heiban' | 'Atamadaka' | 'Nakadaka' | 'Odaka';
  downstepIndex: number;
  sequence: ('H' | 'L')[];
}

export interface PitchAccentData {
  kanji: string | null;
  reading: string;
  englishDefinition: string;
  partOfSpeech: string;
  moraCount: number;
  pitchPattern: PitchPattern;
}

export interface TokenData {
  surface: string;
  reading: string;
  partOfSpeech: string;
  isParticle: boolean;
  position: number;
  pitchAccent?: PitchAccentData;
}

export interface AnalysisResult {
  tokens: TokenData[];
  sentence: string;
  timestamp: number;
}

// ============================================================================
// Content Script → Background Worker Messages
// ============================================================================

export interface AnalyzeTextRequest {
  action: 'ANALYZE_TEXT';
  text: string;
}

export interface ShowPitchAccentRequest {
  action: 'SHOW_PITCH_ACCENT';
  text: string;
}

export interface PrepareForPrintRequest {
  action: 'PREPARE_FOR_PRINT';
  text: string;
  tokens: TokenData[];
}

/** Fired by the background worker to ask the content script for selected text */
export interface GetSelectedTextRequest {
  action: 'GET_SELECTED_TEXT';
}

export type ContentToBackgroundMessage =
  | AnalyzeTextRequest
  | ShowPitchAccentRequest
  | PrepareForPrintRequest;

// ============================================================================
// Background Worker → Content Script Messages
// ============================================================================

export interface PitchAccentResultMessage {
  action: 'PITCH_ACCENT_RESULT';
  requestAction: Extract<ExtensionAction, 'ANALYZE_TEXT' | 'SHOW_PITCH_ACCENT'>;
  result: AnalysisResult;
}

export interface AnalysisErrorMessage {
  action: 'ANALYSIS_ERROR';
  requestAction: ExtensionAction;
  error: string;
}

export interface SelectedTextResponse {
  action: 'GET_SELECTED_TEXT';
  text: string;
}

export type BackgroundToContentMessage =
  | PitchAccentResultMessage
  | AnalysisErrorMessage
  | SelectedTextResponse;

// ============================================================================
// Runtime Message Union (for use with onMessage listeners)
// ============================================================================

export type ExtensionMessage =
  | ContentToBackgroundMessage
  | BackgroundToContentMessage;

// ============================================================================
// SendMessage return type for the Promise-based API
// ============================================================================

export type SendMessageResponse =
  | { success: true; data: AnalysisResult }
  | { success: false; error: string };
