import { contextBridge, ipcRenderer } from "electron"

interface ScreenshotResult {
  success: boolean
  path?: string
  error?: string
}

interface DeleteResult {
  success: boolean
  error?: string
}

interface SpeechResult {
  success: boolean
  error?: string
  isRecording?: boolean
}

interface ElectronAPI {
  // Screenshot operations
  takeScreenshot: () => Promise<ScreenshotResult>
  getScreenshots: () => Promise<Array<{ path: string; preview: string }>>
  getImagePreview: (filepath: string) => Promise<string | null>
  deleteScreenshot: (path: string) => Promise<DeleteResult>
  updateContentDimensions: (dimensions: {
    width: number
    height: number
  }) => Promise<{ success: boolean }>
  processScreenshots: () => Promise<{ success: boolean; error?: string }>
  processExtraScreenshots: () => Promise<{
    success: boolean
    error?: string
  }>

  // Event listeners
  onScreenshotTaken: (
    callback: (screenshotPath: string) => void
  ) => () => void
  onScreenshotError: (callback: (error: string) => void) => () => void
  onResetView: (callback: () => void) => () => void
  onDebugStart: (callback: () => void) => () => void
  onDebugError: (callback: (error: string) => void) => () => void
  onSolutionError: (callback: (error: string) => void) => () => void
  onProcessingNoScreenshots: (callback: () => void) => () => void
  onProblemExtracted: (callback: (data: any) => void) => () => void
  onSolutionSuccess: (callback: (data: any) => void) => () => void
  onUnauthorized: (callback: () => void) => () => void
  onActionResponseGenerated: (callback: (data: any) => void) => () => void
  onActionResponseError: (callback: (error: string) => void) => () => void

  // Window operations
  moveWindowLeft: () => Promise<void>
  moveWindowRight: () => Promise<void>
  moveWindow: (deltaX: number, deltaY: number) => Promise<void>

  // Audio analysis (existing)
  analyzeAudioFromBase64: (data: string, mimeType: string) => Promise<any>
  analyzeAudioFile: (path: string) => Promise<any>
  analyzeImageFile: (path: string) => Promise<any>
  processActionResponse: (action: string) => Promise<{ success: boolean }>

  // **新規追加: リアルタイム音声録音機能**
  startRealtimeRecording: (includeSystemAudio?: boolean) => Promise<SpeechResult>
  stopRealtimeRecording: () => Promise<SpeechResult>
  isRecording: () => Promise<SpeechResult>
  clearSpeechTranscript: () => Promise<SpeechResult>

  // **新規追加: オーディオデバイス管理機能**
  getAudioDevices: () => Promise<{ success: boolean; devices?: any[]; error?: string }>
  isBlackHoleInstalled: () => Promise<{ success: boolean; installed?: boolean; error?: string }>
  installBlackHole: () => Promise<{ success: boolean; message?: string; error?: string }>
  testSystemAudioCapture: () => Promise<{ success: boolean; message?: string; error?: string }>
  checkAudioPermissions: () => Promise<{ success: boolean; permissions?: { microphone: boolean; systemAudio: boolean }; error?: string }>
  setupSystemAudio: () => Promise<{ success: boolean; error?: string }>
  teardownSystemAudio: () => Promise<{ success: boolean; error?: string }>

  // **新規追加: 音声関連イベントリスナー**
  onSpeechRecordingStarted: (callback: (data: { timestamp: number; includeSystemAudio?: boolean; blackHoleAvailable?: boolean }) => void) => () => void
  onSpeechRecordingStopped: (callback: (data: { finalTranscript: string; timestamp: number }) => void) => () => void
  onSpeechInterimResult: (callback: (data: { text: string; isInterim: boolean; timestamp: number }) => void) => () => void
  onSpeechFinalResult: (callback: (data: { text: string; timestamp: number }) => void) => () => void
  onSpeechFinalAnalysis: (callback: (data: { text: string; timestamp: number; duration: number }) => void) => () => void
  onSpeechTranscriptCleared: (callback: (data: { timestamp: number }) => void) => () => void
  onSpeechError: (callback: (data: { error: string }) => void) => () => void

  // **新規追加: 画面分析機能**
  analyzeScreenAutomatically: (imagePath: string) => Promise<{ success: boolean; text?: string; error?: string }>
  analyzeScreenWithPrompt: (imagePath: string, prompt: string) => Promise<{ success: boolean; text?: string; error?: string }>

  // **新規追加: ショートカット関連イベントリスナー**
  onShowAnalysisPrompt?: (callback: () => void) => () => void
  onQuickSolveStarted?: (callback: () => void) => () => void
  onQuickSolveResult?: (callback: (data: any) => void) => () => void
  onQuickSolveError?: (callback: (data: any) => void) => () => void

  // Streaming events
  onLlmChunk: (callback: (chunk: string) => void) => () => void
  onLlmStreamEnd: () => () => void
  onLlmError: (callback: (error: string) => void) => () => void

  quitApp: () => Promise<void>
}

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

// Expose protected methods that allow the renderer process to use
contextBridge.exposeInMainWorld("electronAPI", {
  updateContentDimensions: (dimensions: { width: number; height: number }) =>
    ipcRenderer.invoke("update-content-dimensions", dimensions),
  takeScreenshot: () => ipcRenderer.invoke("take-screenshot"),
  getScreenshots: () => ipcRenderer.invoke("get-screenshots"),
  deleteScreenshot: (path: string) => ipcRenderer.invoke("delete-screenshot", path),
  processScreenshots: () => ipcRenderer.invoke("process-screenshots"),
  processExtraScreenshots: () => ipcRenderer.invoke("process-extra-screenshots"),
  getImagePreview: (filepath: string) =>
    ipcRenderer.invoke("get-image-preview", filepath),

  // Event listeners
  onScreenshotTaken: (
    callback: (screenshotPath: string) => void
  ) => {
    const subscription = (_: any, screenshotPath: string) =>
      callback(screenshotPath)
    ipcRenderer.on("screenshot-taken", subscription)
    return () => {
      ipcRenderer.removeListener("screenshot-taken", subscription)
    }
  },
  onScreenshotError: (callback: (error: string) => void) => {
    const subscription = (_: any, error: string) => callback(error)
    ipcRenderer.on("screenshot-error", subscription)
    return () => {
      ipcRenderer.removeListener("screenshot-error", subscription)
    }
  },
  onResetView: (callback: () => void) => {
    const subscription = () => callback()
    ipcRenderer.on("reset-view", subscription)
    return () => {
      ipcRenderer.removeListener("reset-view", subscription)
    }
  },
  onDebugStart: (callback: () => void) => {
    const subscription = () => callback()
    ipcRenderer.on(PROCESSING_EVENTS.DEBUG_START, subscription)
    return () => {
      ipcRenderer.removeListener(PROCESSING_EVENTS.DEBUG_START, subscription)
    }
  },
  onDebugSuccess: (callback: (data: any) => void) => {
    const subscription = (_: any, data: any) => callback(data)
    ipcRenderer.on(PROCESSING_EVENTS.DEBUG_SUCCESS, subscription)
    return () => {
      ipcRenderer.removeListener(PROCESSING_EVENTS.DEBUG_SUCCESS, subscription)
    }
  },
  onDebugError: (callback: (error: string) => void) => {
    const subscription = (_: any, error: string) => callback(error)
    ipcRenderer.on(PROCESSING_EVENTS.DEBUG_ERROR, subscription)
    return () => {
      ipcRenderer.removeListener(PROCESSING_EVENTS.DEBUG_ERROR, subscription)
    }
  },
  onSolutionError: (callback: (error: string) => void) => {
    const subscription = (_: any, error: string) => callback(error)
    ipcRenderer.on(PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR, subscription)
    return () => {
      ipcRenderer.removeListener(
        PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR,
        subscription
      )
    }
  },
  onProcessingNoScreenshots: (callback: () => void) => {
    const subscription = () => callback()
    ipcRenderer.on(PROCESSING_EVENTS.NO_SCREENSHOTS, subscription)
    return () => {
      ipcRenderer.removeListener(PROCESSING_EVENTS.NO_SCREENSHOTS, subscription)
    }
  },
  onProblemExtracted: (callback: (data: any) => void) => {
    const subscription = (_: any, data: any) => callback(data)
    ipcRenderer.on(PROCESSING_EVENTS.PROBLEM_EXTRACTED, subscription)
    return () => {
      ipcRenderer.removeListener(
        PROCESSING_EVENTS.PROBLEM_EXTRACTED,
        subscription
      )
    }
  },
  onSolutionSuccess: (callback: (data: any) => void) => {
    const subscription = (_: any, data: any) => callback(data)
    ipcRenderer.on(PROCESSING_EVENTS.SOLUTION_SUCCESS, subscription)
    return () => {
      ipcRenderer.removeListener(
        PROCESSING_EVENTS.SOLUTION_SUCCESS,
        subscription
      )
    }
  },
  onUnauthorized: (callback: () => void) => {
    const subscription = () => callback()
    ipcRenderer.on(PROCESSING_EVENTS.UNAUTHORIZED, subscription)
    return () => {
      ipcRenderer.removeListener(PROCESSING_EVENTS.UNAUTHORIZED, subscription)
    }
  },
  onActionResponseGenerated: (callback: (data: any) => void) => {
    const subscription = (_: any, data: any) => callback(data)
    ipcRenderer.on(PROCESSING_EVENTS.ACTION_RESPONSE_GENERATED, subscription)
    return () => {
      ipcRenderer.removeListener(PROCESSING_EVENTS.ACTION_RESPONSE_GENERATED, subscription)
    }
  },
  onActionResponseError: (callback: (error: string) => void) => {
    const subscription = (_: any, error: string) => callback(error)
    ipcRenderer.on(PROCESSING_EVENTS.ACTION_RESPONSE_ERROR, subscription)
    return () => {
      ipcRenderer.removeListener(PROCESSING_EVENTS.ACTION_RESPONSE_ERROR, subscription)
    }
  },

  // **新規追加: リアルタイム音声録音IPC**
  startRealtimeRecording: (includeSystemAudio: boolean = true) => ipcRenderer.invoke("start-realtime-recording", includeSystemAudio),
  stopRealtimeRecording: () => ipcRenderer.invoke("stop-realtime-recording"),
  isRecording: () => ipcRenderer.invoke("is-recording"),
  clearSpeechTranscript: () => ipcRenderer.invoke("clear-speech-transcript"),

  // **新規追加: オーディオデバイス管理IPC**
  getAudioDevices: () => ipcRenderer.invoke("get-audio-devices"),
  isBlackHoleInstalled: () => ipcRenderer.invoke("is-blackhole-installed"),
  installBlackHole: () => ipcRenderer.invoke("install-blackhole"),
  testSystemAudioCapture: () => ipcRenderer.invoke("test-system-audio-capture"),
  checkAudioPermissions: () => ipcRenderer.invoke("check-audio-permissions"),
  setupSystemAudio: () => ipcRenderer.invoke("setup-system-audio"),
  teardownSystemAudio: () => ipcRenderer.invoke("teardown-system-audio"),

  // **新規追加: 音声関連イベントリスナー**
  onSpeechRecordingStarted: (callback: (data: { timestamp: number; includeSystemAudio?: boolean; blackHoleAvailable?: boolean }) => void) => {
    const subscription = (_: any, data: { timestamp: number; includeSystemAudio?: boolean; blackHoleAvailable?: boolean }) => callback(data)
    ipcRenderer.on("speech-recording-started", subscription)
    return () => {
      ipcRenderer.removeListener("speech-recording-started", subscription)
    }
  },
  onSpeechRecordingStopped: (callback: (data: { finalTranscript: string; timestamp: number }) => void) => {
    const subscription = (_: any, data: { finalTranscript: string; timestamp: number }) => callback(data)
    ipcRenderer.on("speech-recording-stopped", subscription)
    return () => {
      ipcRenderer.removeListener("speech-recording-stopped", subscription)
    }
  },
  onSpeechInterimResult: (callback: (data: { text: string; isInterim: boolean; timestamp: number }) => void) => {
    const subscription = (_: any, data: { text: string; isInterim: boolean; timestamp: number }) => callback(data)
    ipcRenderer.on("speech-interim-result", subscription)
    return () => {
      ipcRenderer.removeListener("speech-interim-result", subscription)
    }
  },
  onSpeechFinalResult: (callback: (data: { text: string; timestamp: number }) => void) => {
    const subscription = (_: any, data: { text: string; timestamp: number }) => callback(data)
    ipcRenderer.on("speech-final-result", subscription)
    return () => {
      ipcRenderer.removeListener("speech-final-result", subscription)
    }
  },
  onSpeechFinalAnalysis: (callback: (data: { text: string; timestamp: number; duration: number }) => void) => {
    const subscription = (_: any, data: { text: string; timestamp: number; duration: number }) => callback(data)
    ipcRenderer.on("speech-final-analysis", subscription)
    return () => {
      ipcRenderer.removeListener("speech-final-analysis", subscription)
    }
  },
  onSpeechTranscriptCleared: (callback: (data: { timestamp: number }) => void) => {
    const subscription = (_: any, data: { timestamp: number }) => callback(data)
    ipcRenderer.on("speech-transcript-cleared", subscription)
    return () => {
      ipcRenderer.removeListener("speech-transcript-cleared", subscription)
    }
  },
  onSpeechError: (callback: (data: { error: string }) => void) => {
    const subscription = (_: any, data: { error: string }) => callback(data)
    ipcRenderer.on("speech-error", subscription)
    return () => {
      ipcRenderer.removeListener("speech-error", subscription)
    }
  },

  // Window movement
  moveWindowLeft: () => ipcRenderer.invoke("move-window-left"),
  moveWindowRight: () => ipcRenderer.invoke("move-window-right"),
  moveWindow: (deltaX: number, deltaY: number) => ipcRenderer.invoke("move-window", deltaX, deltaY),

  // Audio analysis (existing)
  analyzeAudioFromBase64: (data: string, mimeType: string) => ipcRenderer.invoke("analyze-audio-base64", data, mimeType),
  analyzeAudioFile: (path: string) => ipcRenderer.invoke("analyze-audio-file", path),
  analyzeImageFile: (path: string) => ipcRenderer.invoke("analyze-image-file", path),
  processActionResponse: (action: string) => ipcRenderer.invoke("process-action-response", action),

  // **新規追加: 画面分析IPC**
  analyzeScreenAutomatically: (imagePath: string) => ipcRenderer.invoke("analyze-screen-automatically", imagePath),
  analyzeScreenWithPrompt: (imagePath: string, prompt: string) => ipcRenderer.invoke("analyze-screen-with-prompt", imagePath, prompt),

  // **新規追加: ショートカット関連イベントリスナー**
  onShowAnalysisPrompt: (callback: () => void) => {
    const subscription = () => callback()
    ipcRenderer.on("show-analysis-prompt", subscription)
    return () => {
      ipcRenderer.removeListener("show-analysis-prompt", subscription)
    }
  },
  onQuickSolveStarted: (callback: () => void) => {
    const subscription = () => callback()
    ipcRenderer.on("quick-solve-started", subscription)
    return () => {
      ipcRenderer.removeListener("quick-solve-started", subscription)
    }
  },
  onQuickSolveResult: (callback: (data: any) => void) => {
    const subscription = (_: any, data: any) => callback(data)
    ipcRenderer.on("quick-solve-result", subscription)
    return () => {
      ipcRenderer.removeListener("quick-solve-result", subscription)
    }
  },
  onQuickSolveError: (callback: (data: any) => void) => {
    const subscription = (_: any, data: any) => callback(data)
    ipcRenderer.on("quick-solve-error", subscription)
    return () => {
      ipcRenderer.removeListener("quick-solve-error", subscription)
    }
  },

  // Streaming events
  onLlmChunk: (callback: (chunk: string) => void) => {
    const subscription = (_: any, chunk: string) => callback(chunk)
    ipcRenderer.on("llm-chunk", subscription)
    return () => {
      ipcRenderer.removeListener("llm-chunk", subscription)
    }
  },
  onLlmStreamEnd: () => {
    const subscription = () => {}
    ipcRenderer.on("llm-stream-end", subscription)
    return () => {
      ipcRenderer.removeListener("llm-stream-end", subscription)
    }
  },
  onLlmError: (callback: (error: string) => void) => {
    const subscription = (_: any, error: string) => callback(error)
    ipcRenderer.on("llm-error", subscription)
    return () => {
      ipcRenderer.removeListener("llm-error", subscription)
    }
  },

  quitApp: () => ipcRenderer.invoke("quit-app")
} as ElectronAPI)