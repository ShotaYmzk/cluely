"use strict";
const electron = require("electron");
const PROCESSING_EVENTS = {
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
};
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // --- General ---
  updateContentDimensions: (dimensions) => electron.ipcRenderer.invoke("update-content-dimensions", dimensions),
  quitApp: () => electron.ipcRenderer.invoke("quit-app"),
  toggleWindow: () => electron.ipcRenderer.invoke("toggle-window"),
  // --- Screenshots ---
  takeScreenshot: () => electron.ipcRenderer.invoke("take-screenshot"),
  getScreenshots: () => electron.ipcRenderer.invoke("get-screenshots"),
  deleteScreenshot: (path) => electron.ipcRenderer.invoke("delete-screenshot", path),
  processScreenshots: () => electron.ipcRenderer.invoke("process-screenshots"),
  processExtraScreenshots: () => electron.ipcRenderer.invoke("process-extra-screenshots"),
  getImagePreview: (filepath) => electron.ipcRenderer.invoke("get-image-preview", filepath),
  // --- Window Movement ---
  moveWindow: (deltaX, deltaY) => electron.ipcRenderer.invoke("move-window", deltaX, deltaY),
  moveWindowLeft: () => electron.ipcRenderer.invoke("move-window-left"),
  moveWindowRight: () => electron.ipcRenderer.invoke("move-window-right"),
  // --- Audio ---
  startRealtimeRecording: (includeSystemAudio = true) => electron.ipcRenderer.invoke("start-realtime-recording", includeSystemAudio),
  stopRealtimeRecording: () => electron.ipcRenderer.invoke("stop-realtime-recording"),
  startRecording: () => electron.ipcRenderer.invoke("start-realtime-recording", true),
  stopRecording: () => electron.ipcRenderer.invoke("stop-realtime-recording"),
  isRecording: () => electron.ipcRenderer.invoke("is-recording"),
  clearSpeechTranscript: () => electron.ipcRenderer.invoke("clear-speech-transcript"),
  analyzeAudioChunk: (args) => electron.ipcRenderer.invoke("analyze-audio-chunk", args),
  // --- Audio Devices ---
  getAudioDevices: () => electron.ipcRenderer.invoke("get-audio-devices"),
  isBlackHoleInstalled: () => electron.ipcRenderer.invoke("is-blackhole-installed"),
  installBlackHole: () => electron.ipcRenderer.invoke("install-blackhole"),
  testSystemAudioCapture: () => electron.ipcRenderer.invoke("test-system-audio-capture"),
  checkAudioPermissions: () => electron.ipcRenderer.invoke("check-audio-permissions"),
  setupSystemAudio: () => electron.ipcRenderer.invoke("setup-system-audio"),
  teardownSystemAudio: () => electron.ipcRenderer.invoke("teardown-system-audio"),
  // --- Screen Analysis ---
  analyzeScreenAutomatically: (imagePath) => electron.ipcRenderer.invoke("analyze-screen-automatically", imagePath),
  analyzeScreenWithPrompt: (imagePath, prompt) => electron.ipcRenderer.invoke("analyze-screen-with-prompt", imagePath, prompt),
  analyzeCurrentScreen: () => electron.ipcRenderer.invoke("analyze-current-screen"),
  // --- Thinking Mode ---
  setThinkingMode: (enabled) => electron.ipcRenderer.invoke("set-thinking-mode", enabled),
  getThinkingMode: () => electron.ipcRenderer.invoke("get-thinking-mode"),
  // --- Event Listeners ---
  onScreenshotTaken: (callback) => {
    const handler = (_, path) => callback(path);
    electron.ipcRenderer.on("screenshot-taken", handler);
    return () => electron.ipcRenderer.removeListener("screenshot-taken", handler);
  },
  onScreenshotError: (callback) => {
    const handler = (_, error) => callback(error);
    electron.ipcRenderer.on("screenshot-error", handler);
    return () => electron.ipcRenderer.removeListener("screenshot-error", handler);
  },
  onProblemExtracted: (callback) => {
    const handler = (_, data) => callback(data);
    electron.ipcRenderer.on(PROCESSING_EVENTS.PROBLEM_EXTRACTED, handler);
    return () => electron.ipcRenderer.removeListener(PROCESSING_EVENTS.PROBLEM_EXTRACTED, handler);
  },
  onSolutionSuccess: (callback) => {
    const handler = (_, data) => callback(data);
    electron.ipcRenderer.on(PROCESSING_EVENTS.SOLUTION_SUCCESS, handler);
    return () => electron.ipcRenderer.removeListener(PROCESSING_EVENTS.SOLUTION_SUCCESS, handler);
  },
  onActionResponseGenerated: (callback) => {
    const handler = (_, data) => callback(data);
    electron.ipcRenderer.on(PROCESSING_EVENTS.ACTION_RESPONSE_GENERATED, handler);
    return () => electron.ipcRenderer.removeListener(PROCESSING_EVENTS.ACTION_RESPONSE_GENERATED, handler);
  },
  onActionResponseError: (callback) => {
    const handler = (_, error) => callback(error);
    electron.ipcRenderer.on(PROCESSING_EVENTS.ACTION_RESPONSE_ERROR, handler);
    return () => electron.ipcRenderer.removeListener(PROCESSING_EVENTS.ACTION_RESPONSE_ERROR, handler);
  },
  onResetView: (callback) => {
    electron.ipcRenderer.on("reset-view", callback);
    return () => electron.ipcRenderer.removeListener("reset-view", callback);
  },
  onSolutionError: (callback) => {
    const handler = (_, error) => callback(error);
    electron.ipcRenderer.on(PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR, handler);
    return () => electron.ipcRenderer.removeListener(PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR, handler);
  },
  onProcessingNoScreenshots: (callback) => {
    electron.ipcRenderer.on(PROCESSING_EVENTS.NO_SCREENSHOTS, callback);
    return () => electron.ipcRenderer.removeListener(PROCESSING_EVENTS.NO_SCREENSHOTS, callback);
  },
  onUnauthorized: (callback) => {
    electron.ipcRenderer.on(PROCESSING_EVENTS.UNAUTHORIZED, callback);
    return () => electron.ipcRenderer.removeListener(PROCESSING_EVENTS.UNAUTHORIZED, callback);
  },
  // ★★★ エラーの原因だった箇所 ★★★
  // 未定義だったリスナーをすべて追加
  onSolutionStart: (callback) => {
    electron.ipcRenderer.on(PROCESSING_EVENTS.INITIAL_START, callback);
    return () => electron.ipcRenderer.removeListener(PROCESSING_EVENTS.INITIAL_START, callback);
  },
  onDebugStart: (callback) => {
    electron.ipcRenderer.on(PROCESSING_EVENTS.DEBUG_START, callback);
    return () => electron.ipcRenderer.removeListener(PROCESSING_EVENTS.DEBUG_START, callback);
  },
  onDebugSuccess: (callback) => {
    const handler = (_, data) => callback(data);
    electron.ipcRenderer.on(PROCESSING_EVENTS.DEBUG_SUCCESS, handler);
    return () => electron.ipcRenderer.removeListener(PROCESSING_EVENTS.DEBUG_SUCCESS, handler);
  },
  onDebugError: (callback) => {
    const handler = (_, error) => callback(error);
    electron.ipcRenderer.on(PROCESSING_EVENTS.DEBUG_ERROR, handler);
    return () => electron.ipcRenderer.removeListener(PROCESSING_EVENTS.DEBUG_ERROR, handler);
  },
  // --- Streaming ---
  onLlmChunk: (callback) => {
    const handler = (_, chunk) => callback(chunk);
    electron.ipcRenderer.on("llm-chunk", handler);
    return () => electron.ipcRenderer.removeListener("llm-chunk", handler);
  },
  onLlmStreamEnd: (callback) => {
    electron.ipcRenderer.on("llm-stream-end", callback);
    return () => electron.ipcRenderer.removeListener("llm-stream-end", callback);
  },
  onLlmError: (callback) => {
    const handler = (_, error) => callback(error);
    electron.ipcRenderer.on("llm-error", handler);
    return () => electron.ipcRenderer.removeListener("llm-error", handler);
  },
  // --- Speech Events ---
  onSpeechRecordingStarted: (callback) => {
    electron.ipcRenderer.on("speech-recording-started", (_, data) => callback(data));
    return () => electron.ipcRenderer.removeAllListeners("speech-recording-started");
  },
  onSpeechRecordingStopped: (callback) => {
    electron.ipcRenderer.on("speech-recording-stopped", (_, data) => callback(data));
    return () => electron.ipcRenderer.removeAllListeners("speech-recording-stopped");
  },
  onSpeechInterimResult: (callback) => {
    electron.ipcRenderer.on("speech-interim-result", (_, data) => callback(data));
    return () => electron.ipcRenderer.removeAllListeners("speech-interim-result");
  },
  onSpeechFinalResult: (callback) => {
    electron.ipcRenderer.on("speech-final-result", (_, data) => callback(data));
    return () => electron.ipcRenderer.removeAllListeners("speech-final-result");
  },
  onSpeechFinalAnalysis: (callback) => {
    electron.ipcRenderer.on("speech-final-analysis", (_, data) => callback(data));
    return () => electron.ipcRenderer.removeAllListeners("speech-final-analysis");
  },
  onSpeechTranscriptCleared: (callback) => {
    electron.ipcRenderer.on("speech-transcript-cleared", (_, data) => callback(data));
    return () => electron.ipcRenderer.removeAllListeners("speech-transcript-cleared");
  },
  onSpeechError: (callback) => {
    electron.ipcRenderer.on("speech-error", (_, data) => callback(data));
    return () => electron.ipcRenderer.removeAllListeners("speech-error");
  },
  onSpeechSystemAudioSetup: (callback) => {
    electron.ipcRenderer.on("speech-system-audio-setup", (_, data) => callback(data));
    return () => electron.ipcRenderer.removeAllListeners("speech-system-audio-setup");
  },
  // --- Shortcut Events ---
  onShowAnalysisPrompt: (callback) => {
    electron.ipcRenderer.on("show-analysis-prompt", callback);
    return () => electron.ipcRenderer.removeListener("show-analysis-prompt", callback);
  },
  onQuickSolveStarted: (callback) => {
    electron.ipcRenderer.on("quick-solve-started", callback);
    return () => electron.ipcRenderer.removeListener("quick-solve-started", callback);
  },
  onQuickSolveResult: (callback) => {
    const handler = (_, data) => callback(data);
    electron.ipcRenderer.on("quick-solve-result", handler);
    return () => electron.ipcRenderer.removeListener("quick-solve-result", handler);
  },
  onQuickSolveError: (callback) => {
    const handler = (_, data) => callback(data);
    electron.ipcRenderer.on("quick-solve-error", handler);
    return () => electron.ipcRenderer.removeListener("quick-solve-error", handler);
  }
});
