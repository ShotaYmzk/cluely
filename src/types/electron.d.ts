// src/types/electron.d.ts

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export interface ElectronAPI {
  // General
  updateContentDimensions: (dimensions: { width: number; height: number; }) => Promise<void>;
  quitApp: () => Promise<void>;

  // Screenshots
  takeScreenshot: () => Promise<{ path: string; preview: string }>;
  getScreenshots: () => Promise<Array<{ path: string; preview: string }>>;
  deleteScreenshot: (path: string) => Promise<{ success: boolean; error?: string }>;
  processScreenshots: () => Promise<{ success: boolean; error?: string }>;
  processExtraScreenshots: () => Promise<{ success: boolean; error?: string }>;

  // Window Movement
  moveWindow: (deltaX: number, deltaY: number) => Promise<void>;

  // Non-streaming analysis
  analyzeAudioFromBase64: (data: string, mimeType: string) => Promise<{ text: string; timestamp: number }>;
  processActionResponse: (action: string) => Promise<void>;
  
  // Audio recording
  startRealtimeRecording: (includeSystemAudio?: boolean) => Promise<{ success: boolean; error?: string }>;
  stopRealtimeRecording: () => Promise<{ success: boolean; error?: string }>;
  isRecording: () => Promise<{ success: boolean; isRecording?: boolean; error?: string }>;
  clearSpeechTranscript: () => Promise<{ success: boolean; error?: string }>;

  // Audio devices
  getAudioDevices: () => Promise<{ success: boolean; devices?: any[]; error?: string }>;
  isBlackHoleInstalled: () => Promise<{ success: boolean; installed?: boolean; error?: string }>;
  installBlackHole: () => Promise<{ success: boolean; message?: string; error?: string }>;
  testSystemAudioCapture: () => Promise<{ success: boolean; message?: string; error?: string }>;
  checkAudioPermissions: () => Promise<{ success: boolean; permissions?: { microphone: boolean; systemAudio: boolean }; error?: string }>;
  setupSystemAudio: () => Promise<{ success: boolean; error?: string }>;
  teardownSystemAudio: () => Promise<{ success: boolean; error?: string }>;

  // Screen analysis
  analyzeScreenAutomatically: (imagePath: string) => Promise<{ success: boolean; text?: string; error?: string }>;
  analyzeScreenWithPrompt: (imagePath: string, prompt: string) => Promise<{ success: boolean; text?: string; error?: string }>;
  
  // --- Event Listeners ---
  onScreenshotTaken: (callback: (data: { path: string; preview: string }) => void) => () => void;
  onResetView: (callback: () => void) => () => void;
  onSolutionStart: (callback: () => void) => () => void;
  onProcessingNoScreenshots: (callback: () => void) => () => void;

  // --- NEW Streaming API Listeners ---
  onLlmChunk: (callback: (chunk: string) => void) => () => void;
  onLlmStreamEnd: (callback: () => void) => () => void;
  onLlmError: (callback: (error: string) => void) => () => void;

  // Speech event listeners
  onSpeechRecordingStarted: (callback: (data: { timestamp: number; includeSystemAudio?: boolean; blackHoleAvailable?: boolean }) => void) => () => void;
  onSpeechRecordingStopped: (callback: (data: { finalTranscript: string; timestamp: number }) => void) => () => void;
  onSpeechInterimResult: (callback: (data: { text: string; isInterim: boolean; timestamp: number }) => void) => () => void;
  onSpeechFinalResult: (callback: (data: { text: string; timestamp: number }) => void) => () => void;
  onSpeechFinalAnalysis: (callback: (data: { text: string; timestamp: number; duration: number }) => void) => () => void;
  onSpeechTranscriptCleared: (callback: (data: { timestamp: number }) => void) => () => void;
  onSpeechError: (callback: (data: { error: string }) => void) => () => void;

  // Shortcut event listeners
  onShowAnalysisPrompt: (callback: () => void) => () => void;
  onQuickSolveStarted: (callback: () => void) => () => void;
  onQuickSolveResult: (callback: (data: any) => void) => () => void;
  onQuickSolveError: (callback: (data: any) => void) => () => void;

  // --- ERROR FIX: Add back missing definitions for compatibility ---
  onSolutionError: (callback: (error: string) => void) => () => void;
  onUnauthorized: (callback: () => void) => () => void;
}