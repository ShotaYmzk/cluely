// electron/preload.ts

import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron"

export const PROCESSING_EVENTS = {
  UNAUTHORIZED: "procesing-unauthorized",
  NO_SCREENSHOTS: "processing-no-screenshots",
  INITIAL_START: "initial-start",
  ACTION_RESPONSE_GENERATED: "action-response-generated",
  ACTION_RESPONSE_ERROR: "action-response-error",
  // 以前の定義から追加
  INITIAL_SOLUTION_ERROR: "solution-error",
} as const

// 型定義: ElectronAPI
// export type ElectronAPI = { ... } を削除し、interfaceのみ残す

// より詳細なインターフェース定義
export interface ElectronAPI {
  // ... 既存のメソッド

  // 🎤 音声処理メソッド（新規追加）
  processVoiceAndScreenshot: (voiceText: string, screenshotPath: string) => Promise<{
    success: boolean
    solution?: {
      answer: string
      explanation: string
      code?: string
      suggested_responses?: string[]
    }
    problemInfo?: any
    voiceText?: string
    screenshotPath?: string
    error?: string
  }>

  processVoiceOnly: (voiceText: string) => Promise<{
    success: boolean
    solution?: {
      answer: string
      explanation: string
      suggested_responses?: string[]
    }
    problemInfo?: any
    voiceText?: string
    error?: string
  }>

  testVoiceRecognition: (testText: string) => Promise<{
    success: boolean
    received?: string
    timestamp?: string
    message?: string
    error?: string
  }>

  ping: () => Promise<string>
}

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

  // --- ERROR FIX: Add back missing listeners for compatibility ---
  onSolutionError: (callback: (error: string) => void) => {
    const sub = (_: IpcRendererEvent, error: string) => callback(error);
    ipcRenderer.on(PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR, sub);
    return () => ipcRenderer.removeListener(PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR, sub);
  },
  onUnauthorized: (callback: () => void) => {
    const sub = () => callback();
    ipcRenderer.on(PROCESSING_EVENTS.UNAUTHORIZED, sub);
    return () => ipcRenderer.removeListener(PROCESSING_EVENTS.UNAUTHORIZED, sub);
  },

  // 🎤 音声処理API
  processVoiceAndScreenshot: (voiceText: string, screenshotPath: string) => 
    ipcRenderer.invoke("process-voice-and-screenshot", { voiceText, screenshotPath }),
  
  processVoiceOnly: (voiceText: string) => 
    ipcRenderer.invoke("process-voice-only", { voiceText }),
  
  testVoiceRecognition: (testText: string) => 
    ipcRenderer.invoke("test-voice-recognition", { testText }),

  // 🔧 デバッグ用（ElectronAPI接続確認）
  ping: () => ipcRenderer.invoke("ping"),

} as ElectronAPI)

// デバッグ用ログ
console.log("🔧 Preload.ts: ElectronAPIが初期化されました")

// ElectronAPIの型定義も更新
export interface ElectronAPI {
  // ... 既存のメソッド

  // 🎤 音声処理メソッド（型定義）
  processVoiceAndScreenshot: (voiceText: string, screenshotPath: string) => Promise<{
    success: boolean
    solution?: {
      answer: string
      explanation: string
      code?: string
      suggested_responses?: string[]
    }
    problemInfo?: any
    voiceText?: string
    screenshotPath?: string
    error?: string
  }>

  processVoiceOnly: (voiceText: string) => Promise<{
    success: boolean
    solution?: {
      answer: string
      explanation: string
      suggested_responses?: string[]
    }
    problemInfo?: any
    voiceText?: string
    error?: string
  }>

  testVoiceRecognition: (testText: string) => Promise<{
    success: boolean
    received?: string
    timestamp?: string
    message?: string
    error?: string
  }>

  ping: () => Promise<string>
}