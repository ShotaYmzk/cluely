"use strict";
const electron = require("electron");
const PROCESSING_EVENTS = {
  UNAUTHORIZED: "procesing-unauthorized",
  NO_SCREENSHOTS: "processing-no-screenshots",
  INITIAL_START: "initial-start",
  // 以前の定義から追加
  INITIAL_SOLUTION_ERROR: "solution-error"
};
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // General
  updateContentDimensions: (dims) => electron.ipcRenderer.invoke("update-content-dimensions", dims),
  quitApp: () => electron.ipcRenderer.invoke("quit-app"),
  // Screenshots
  takeScreenshot: () => electron.ipcRenderer.invoke("take-screenshot"),
  getScreenshots: () => electron.ipcRenderer.invoke("get-screenshots"),
  deleteScreenshot: (path) => electron.ipcRenderer.invoke("delete-screenshot", path),
  // Window Movement
  moveWindow: (deltaX, deltaY) => electron.ipcRenderer.invoke("move-window", deltaX, deltaY),
  // Non-streaming analysis (for compatibility)
  analyzeAudioFromBase64: (data, mimeType) => electron.ipcRenderer.invoke("analyze-audio-base64", data, mimeType),
  processActionResponse: (action) => electron.ipcRenderer.invoke("process-action-response", action),
  // --- Event Listeners ---
  onScreenshotTaken: (callback) => {
    const sub = (_, data) => callback(data);
    electron.ipcRenderer.on("screenshot-taken", sub);
    return () => electron.ipcRenderer.removeListener("screenshot-taken", sub);
  },
  onResetView: (callback) => {
    const sub = () => callback();
    electron.ipcRenderer.on("reset-view", sub);
    return () => electron.ipcRenderer.removeListener("reset-view", sub);
  },
  onSolutionStart: (callback) => {
    const sub = () => callback();
    electron.ipcRenderer.on(PROCESSING_EVENTS.INITIAL_START, sub);
    return () => electron.ipcRenderer.removeListener(PROCESSING_EVENTS.INITIAL_START, sub);
  },
  onProcessingNoScreenshots: (callback) => {
    const sub = () => callback();
    electron.ipcRenderer.on(PROCESSING_EVENTS.NO_SCREENSHOTS, sub);
    return () => electron.ipcRenderer.removeListener(PROCESSING_EVENTS.NO_SCREENSHOTS, sub);
  },
  // --- NEW Streaming API Listeners ---
  onLlmChunk: (callback) => {
    const subscription = (_, chunk) => callback(chunk);
    electron.ipcRenderer.on("llm-chunk", subscription);
    return () => electron.ipcRenderer.removeListener("llm-chunk", subscription);
  },
  onLlmStreamEnd: (callback) => {
    const subscription = () => callback();
    electron.ipcRenderer.on("llm-stream-end", subscription);
    return () => electron.ipcRenderer.removeListener("llm-stream-end", subscription);
  },
  onLlmError: (callback) => {
    const subscription = (_, error) => callback(error);
    electron.ipcRenderer.on("llm-error", subscription);
    return () => electron.ipcRenderer.removeListener("llm-error", subscription);
  },
  // --- ERROR FIX: Add back missing listeners for compatibility ---
  onSolutionError: (callback) => {
    const sub = (_, error) => callback(error);
    electron.ipcRenderer.on(PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR, sub);
    return () => electron.ipcRenderer.removeListener(PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR, sub);
  },
  onUnauthorized: (callback) => {
    const sub = () => callback();
    electron.ipcRenderer.on(PROCESSING_EVENTS.UNAUTHORIZED, sub);
    return () => electron.ipcRenderer.removeListener(PROCESSING_EVENTS.UNAUTHORIZED, sub);
  },
  // 🎤 音声処理API
  processVoiceAndScreenshot: (voiceText, screenshotPath) => electron.ipcRenderer.invoke("process-voice-and-screenshot", { voiceText, screenshotPath }),
  processVoiceOnly: (voiceText) => electron.ipcRenderer.invoke("process-voice-only", { voiceText }),
  testVoiceRecognition: (testText) => electron.ipcRenderer.invoke("test-voice-recognition", { testText }),
  // 🔧 デバッグ用（ElectronAPI接続確認）
  ping: () => electron.ipcRenderer.invoke("ping")
});
console.log("🔧 Preload.ts: ElectronAPIが初期化されました");
