// src/types/electron.d.ts

// ElectronAPIの型定義がグローバルスコープで利用できるようにする
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

  // Window Movement
  moveWindow: (deltaX: number, deltaY: number) => Promise<void>;

  // Non-streaming analysis
  analyzeAudioFromBase64: (data: string, mimeType: string) => Promise<{ text: string; timestamp: number }>;
  processActionResponse: (action: string) => Promise<void>;
  
  // --- Event Listeners ---
  onScreenshotTaken: (callback: (data: { path: string; preview: string }) => void) => () => void;
  onResetView: (callback: () => void) => () => void;
  onSolutionStart: (callback: () => void) => () => void;
  onProcessingNoScreenshots: (callback: () => void) => () => void;

  // --- NEW Streaming API Listeners ---
  onLlmChunk: (callback: (chunk: string) => void) => () => void;
  onLlmStreamEnd: (callback: () => void) => () => void;
  onLlmError: (callback: (error: string) => void) => () => void;
}