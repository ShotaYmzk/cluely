import { contextBridge, ipcRenderer } from "electron"

export const PROCESSING_EVENTS = {
  // Global states
  UNAUTHORIZED: "procesing-unauthorized",
  NO_SCREENSHOTS: "processing-no-screenshots",

  // States for generating the initial solution
  INITIAL_START: "initial-start",
  PROBLEM_EXTRACTED: "problem-extracted",
  SOLUTION_SUCCESS: "solution-success",
  INITIAL_SOLUTION_ERROR: "solution-error",

  // States for processing the debugging
  DEBUG_START: "debug-start",
  DEBUG_SUCCESS: "debug-success",
  DEBUG_ERROR: "debug-error",

  // States for processing action responses
  ACTION_RESPONSE_GENERATED: "action-response-generated",
  ACTION_RESPONSE_ERROR: "action-response-error"
} as const

contextBridge.exposeInMainWorld("electronAPI", {
  // --- General ---
  updateContentDimensions: (dimensions: { width: number; height: number }) =>
    ipcRenderer.invoke("update-content-dimensions", dimensions),
  quitApp: () => ipcRenderer.invoke("quit-app"),
  
  // --- Screenshots ---
  takeScreenshot: () => ipcRenderer.invoke("take-screenshot"),
  getScreenshots: () => ipcRenderer.invoke("get-screenshots"),
  deleteScreenshot: (path: string) => ipcRenderer.invoke("delete-screenshot", path),
  processScreenshots: () => ipcRenderer.invoke("process-screenshots"),
  processExtraScreenshots: () => ipcRenderer.invoke("process-extra-screenshots"),
  getImagePreview: (filepath: string) => ipcRenderer.invoke("get-image-preview", filepath),

  // --- Window Movement ---
  moveWindow: (deltaX: number, deltaY: number) => ipcRenderer.invoke("move-window", deltaX, deltaY),
  moveWindowLeft: () => ipcRenderer.invoke("move-window-left"),
  moveWindowRight: () => ipcRenderer.invoke("move-window-right"),

  // --- Audio ---
  startRealtimeRecording: (includeSystemAudio: boolean = true) => ipcRenderer.invoke("start-realtime-recording", includeSystemAudio),
  stopRealtimeRecording: () => ipcRenderer.invoke("stop-realtime-recording"),
  isRecording: () => ipcRenderer.invoke("is-recording"),
  clearSpeechTranscript: () => ipcRenderer.invoke("clear-speech-transcript"),
  analyzeAudioChunk: (args: { base64Data: string; mimeType: string }) => ipcRenderer.invoke("analyze-audio-chunk", args),

  // --- Audio Devices ---
  getAudioDevices: () => ipcRenderer.invoke("get-audio-devices"),
  isBlackHoleInstalled: () => ipcRenderer.invoke("is-blackhole-installed"),
  installBlackHole: () => ipcRenderer.invoke("install-blackhole"),
  testSystemAudioCapture: () => ipcRenderer.invoke("test-system-audio-capture"),
  checkAudioPermissions: () => ipcRenderer.invoke("check-audio-permissions"),
  setupSystemAudio: () => ipcRenderer.invoke("setup-system-audio"),
  teardownSystemAudio: () => ipcRenderer.invoke("teardown-system-audio"),

  // --- Screen Analysis ---
  analyzeScreenAutomatically: (imagePath: string) => ipcRenderer.invoke("analyze-screen-automatically", imagePath),
  analyzeScreenWithPrompt: (imagePath: string, prompt: string) => ipcRenderer.invoke("analyze-screen-with-prompt", imagePath, prompt),

  // --- Event Listeners ---
  onScreenshotTaken: (callback: (path: string) => void) => {
    const handler = (_: any, path: string) => callback(path);
    ipcRenderer.on("screenshot-taken", handler);
    return () => ipcRenderer.removeListener("screenshot-taken", handler);
  },
  onResetView: (callback: () => void) => {
    ipcRenderer.on("reset-view", callback);
    return () => ipcRenderer.removeListener("reset-view", callback);
  },
  onSolutionError: (callback: (error: string) => void) => {
    const handler = (_: any, error: string) => callback(error);
    ipcRenderer.on(PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR, handler);
    return () => ipcRenderer.removeListener(PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR, handler);
  },
  onProcessingNoScreenshots: (callback: () => void) => {
    ipcRenderer.on(PROCESSING_EVENTS.NO_SCREENSHOTS, callback);
    return () => ipcRenderer.removeListener(PROCESSING_EVENTS.NO_SCREENSHOTS, callback);
  },
  onUnauthorized: (callback: () => void) => {
    ipcRenderer.on(PROCESSING_EVENTS.UNAUTHORIZED, callback);
    return () => ipcRenderer.removeListener(PROCESSING_EVENTS.UNAUTHORIZED, callback);
  },
  
  // ★★★ エラーの原因だった箇所 ★★★
  // 未定義だったリスナーをすべて追加
  onSolutionStart: (callback: () => void) => {
    ipcRenderer.on(PROCESSING_EVENTS.INITIAL_START, callback);
    return () => ipcRenderer.removeListener(PROCESSING_EVENTS.INITIAL_START, callback);
  },
  onDebugStart: (callback: () => void) => {
    ipcRenderer.on(PROCESSING_EVENTS.DEBUG_START, callback);
    return () => ipcRenderer.removeListener(PROCESSING_EVENTS.DEBUG_START, callback);
  },
  onDebugSuccess: (callback: (data: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on(PROCESSING_EVENTS.DEBUG_SUCCESS, handler);
    return () => ipcRenderer.removeListener(PROCESSING_EVENTS.DEBUG_SUCCESS, handler);
  },
  onDebugError: (callback: (error: string) => void) => {
    const handler = (_: any, error: string) => callback(error);
    ipcRenderer.on(PROCESSING_EVENTS.DEBUG_ERROR, handler);
    return () => ipcRenderer.removeListener(PROCESSING_EVENTS.DEBUG_ERROR, handler);
  },

  // --- Streaming ---
  onLlmChunk: (callback: (chunk: string) => void) => {
    const handler = (_: any, chunk: string) => callback(chunk);
    ipcRenderer.on("llm-chunk", handler);
    return () => ipcRenderer.removeListener("llm-chunk", handler);
  },
  onLlmStreamEnd: (callback: () => void) => {
    ipcRenderer.on("llm-stream-end", callback);
    return () => ipcRenderer.removeListener("llm-stream-end", callback);
  },
  onLlmError: (callback: (error: string) => void) => {
    const handler = (_: any, error: string) => callback(error);
    ipcRenderer.on("llm-error", handler);
    return () => ipcRenderer.removeListener("llm-error", handler);
  },

  // --- Speech Events ---
  onSpeechRecordingStarted: (callback: (data: any) => void) => {
    ipcRenderer.on("speech-recording-started", (_, data) => callback(data));
    return () => ipcRenderer.removeAllListeners("speech-recording-started");
  },
  onSpeechRecordingStopped: (callback: (data: any) => void) => {
    ipcRenderer.on("speech-recording-stopped", (_, data) => callback(data));
    return () => ipcRenderer.removeAllListeners("speech-recording-stopped");
  },
  onSpeechInterimResult: (callback: (data: any) => void) => {
    ipcRenderer.on("speech-interim-result", (_, data) => callback(data));
    return () => ipcRenderer.removeAllListeners("speech-interim-result");
  },
  onSpeechFinalResult: (callback: (data: any) => void) => {
    ipcRenderer.on("speech-final-result", (_, data) => callback(data));
    return () => ipcRenderer.removeAllListeners("speech-final-result");
  },
  onSpeechFinalAnalysis: (callback: (data: any) => void) => {
    ipcRenderer.on("speech-final-analysis", (_, data) => callback(data));
    return () => ipcRenderer.removeAllListeners("speech-final-analysis");
  },
  onSpeechTranscriptCleared: (callback: (data: any) => void) => {
    ipcRenderer.on("speech-transcript-cleared", (_, data) => callback(data));
    return () => ipcRenderer.removeAllListeners("speech-transcript-cleared");
  },
  onSpeechError: (callback: (data: any) => void) => {
    ipcRenderer.on("speech-error", (_, data) => callback(data));
    return () => ipcRenderer.removeAllListeners("speech-error");
  },
  onSpeechSystemAudioSetup: (callback: (data: any) => void) => {
    ipcRenderer.on("speech-system-audio-setup", (_, data) => callback(data));
    return () => ipcRenderer.removeAllListeners("speech-system-audio-setup");
  },

  // --- Shortcut Events ---
  onShowAnalysisPrompt: (callback: () => void) => {
    ipcRenderer.on("show-analysis-prompt", callback);
    return () => ipcRenderer.removeListener("show-analysis-prompt", callback);
  },
  onQuickSolveStarted: (callback: () => void) => {
    ipcRenderer.on("quick-solve-started", callback);
    return () => ipcRenderer.removeListener("quick-solve-started", callback);
  },
  onQuickSolveResult: (callback: (data: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on("quick-solve-result", handler);
    return () => ipcRenderer.removeListener("quick-solve-result", handler);
  },
  onQuickSolveError: (callback: (data: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on("quick-solve-error", handler);
    return () => ipcRenderer.removeListener("quick-solve-error", handler);
  },
});