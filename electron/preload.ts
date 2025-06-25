// electron/preload.ts

import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron"

export const PROCESSING_EVENTS = {
  UNAUTHORIZED: "procesing-unauthorized",
  NO_SCREENSHOTS: "processing-no-screenshots",
  INITIAL_START: "initial-start",
  ACTION_RESPONSE_GENERATED: "action-response-generated",
  ACTION_RESPONSE_ERROR: "action-response-error"
} as const

contextBridge.exposeInMainWorld("electronAPI", {
  // General
  updateContentDimensions: (dims: { width: number; height: number }) => ipcRenderer.invoke("update-content-dimensions", dims),
  quitApp: () => ipcRenderer.invoke("quit-app"),
  
  // Screenshots
  takeScreenshot: () => ipcRenderer.invoke("take-screenshot"),
  getScreenshots: () => ipcRenderer.invoke("get-screenshots"),
  deleteScreenshot: (path: string) => ipcRenderer.invoke("delete-screenshot", path),

  // Window Movement
  moveWindow: (deltaX: number, deltaY: number) => ipcRenderer.invoke("move-window", deltaX, deltaY),

  // Non-streaming analysis (for compatibility)
  analyzeAudioFromBase64: (data: string, mimeType: string) => ipcRenderer.invoke("analyze-audio-base64", data, mimeType),
  processActionResponse: (action: string) => ipcRenderer.invoke("process-action-response", action),

  // --- Event Listeners ---
  onScreenshotTaken: (callback: (data: { path: string, preview: string }) => void) => {
    const sub = (_: IpcRendererEvent, data: { path: string, preview: string }) => callback(data)
    ipcRenderer.on("screenshot-taken", sub)
    return () => ipcRenderer.removeListener("screenshot-taken", sub)
  },
  onResetView: (callback: () => void) => {
    const sub = () => callback()
    ipcRenderer.on("reset-view", sub)
    return () => ipcRenderer.removeListener("reset-view", sub)
  },
  onSolutionStart: (callback: () => void) => {
    const sub = () => callback()
    ipcRenderer.on(PROCESSING_EVENTS.INITIAL_START, sub)
    return () => ipcRenderer.removeListener(PROCESSING_EVENTS.INITIAL_START, sub)
  },
  onProcessingNoScreenshots: (callback: () => void) => {
    const sub = () => callback()
    ipcRenderer.on(PROCESSING_EVENTS.NO_SCREENSHOTS, sub)
    return () => ipcRenderer.removeListener(PROCESSING_EVENTS.NO_SCREENSHOTS, sub)
  },
  
  // --- NEW Streaming API Listeners ---
  onLlmChunk: (callback: (chunk: string) => void) => {
    const subscription = (_: IpcRendererEvent, chunk: string) => callback(chunk)
    ipcRenderer.on('llm-chunk', subscription)
    return () => ipcRenderer.removeListener('llm-chunk', subscription)
  },
  onLlmStreamEnd: (callback: () => void) => {
    const subscription = () => callback()
    ipcRenderer.on('llm-stream-end', subscription)
    return () => ipcRenderer.removeListener('llm-stream-end', subscription)
  },
  onLlmError: (callback: (error: string) => void) => {
    const subscription = (_: IpcRendererEvent, error: string) => callback(error)
    ipcRenderer.on('llm-error', subscription)
    return () => ipcRenderer.removeListener('llm-error', subscription)
  },
});