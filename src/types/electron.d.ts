export interface ElectronAPI {
  // --- General ---
  updateContentDimensions: (dimensions: { width: number; height: number }) => Promise<{ success: boolean }>
  quitApp: () => Promise<void>
  toggleWindow: () => Promise<void>
  
  // --- Screenshots ---
  takeScreenshot: () => Promise<{ success: boolean; path?: string; error?: string }>
  getScreenshots: () => Promise<Array<{ path: string; preview: string }>>
  deleteScreenshot: (path: string) => Promise<{ success: boolean; error?: string }>
  processScreenshots: () => Promise<{ success: boolean; error?: string }>
  processExtraScreenshots: () => Promise<{ success: boolean; error?: string }>
  getImagePreview: (filepath: string) => Promise<string | null>

  // --- Window Movement ---
  moveWindow: (deltaX: number, deltaY: number) => Promise<void>
  moveWindowLeft: () => Promise<void>
  moveWindowRight: () => Promise<void>

  // --- Audio ---
  startRealtimeRecording: (includeSystemAudio?: boolean) => Promise<{ success: boolean; error?: string; isRecording?: boolean }>
  stopRealtimeRecording: () => Promise<{ success: boolean; error?: string }>
  startRecording: () => Promise<{ success: boolean; error?: string; isRecording?: boolean }>
  stopRecording: () => Promise<{ success: boolean; error?: string }>
  isRecording: () => Promise<{ success: boolean; error?: string; isRecording?: boolean }>
  clearSpeechTranscript: () => Promise<{ success: boolean; error?: string }>
  analyzeAudioChunk: (args: { base64Data: string; mimeType: string }) => Promise<{ success: boolean; error?: string }>

  // --- Audio Devices ---
  getAudioDevices: () => Promise<{ success: boolean; devices?: any[]; error?: string }>
  isBlackHoleInstalled: () => Promise<{ success: boolean; installed?: boolean; error?: string }>
  installBlackHole: () => Promise<{ success: boolean; message?: string; error?: string }>
  testSystemAudioCapture: () => Promise<{ success: boolean; message?: string; error?: string }>
  checkAudioPermissions: () => Promise<{ success: boolean; permissions?: { microphone: boolean; systemAudio: boolean }; error?: string }>
  setupSystemAudio: () => Promise<{ success: boolean; error?: string }>
  teardownSystemAudio: () => Promise<{ success: boolean; error?: string }>

  // --- Screen Analysis ---
  analyzeScreenAutomatically: (imagePath: string) => Promise<{ success: boolean; text?: string; error?: string }>
  analyzeScreenWithPrompt: (imagePath: string, prompt: string) => Promise<{ success: boolean; text?: string; error?: string }>
  analyzeCurrentScreen: () => Promise<string>

  // --- Audio Analysis (Legacy) ---
  analyzeAudioFromBase64: (data: string, mimeType: string) => Promise<{ text: string; timestamp: number }>
  analyzeAudioFile: (path: string) => Promise<{ text: string; timestamp: number }>
  analyzeImageFile: (path: string) => Promise<{ text: string; timestamp: number }>
  processActionResponse: (action: string) => Promise<{ success: boolean }>

  // --- Event Listeners ---
  onScreenshotTaken: (callback: (path: string) => void) => () => void
  onScreenshotError: (callback: (error: string) => void) => () => void
  onResetView: (callback: () => void) => () => void
  onSolutionError: (callback: (error: string) => void) => () => void
  onProcessingNoScreenshots: (callback: () => void) => () => void
  onUnauthorized: (callback: () => void) => () => void
  
  // Missing event listeners that were causing errors
  onSolutionStart: (callback: () => void) => () => void
  onDebugStart: (callback: () => void) => () => void
  onDebugSuccess: (callback: (data: any) => void) => () => void
  onDebugError: (callback: (error: string) => void) => () => void
  onProblemExtracted: (callback: (data: any) => void) => () => void
  onSolutionSuccess: (callback: (data: any) => void) => () => void
  onActionResponseGenerated: (callback: (data: any) => void) => () => void
  onActionResponseError: (callback: (error: string) => void) => () => void

  // --- Streaming ---
  onLlmChunk: (callback: (chunk: string) => void) => () => void
  onLlmStreamEnd: (callback: () => void) => () => void
  onLlmError: (callback: (error: string) => void) => () => void

  // --- Speech Events ---
  onSpeechRecordingStarted: (callback: (data: any) => void) => () => void
  onSpeechRecordingStopped: (callback: (data: any) => void) => () => void
  onSpeechInterimResult: (callback: (data: any) => void) => () => void
  onSpeechFinalResult: (callback: (data: any) => void) => () => void
  onSpeechFinalAnalysis: (callback: (data: any) => void) => () => void
  onSpeechTranscriptCleared: (callback: (data: any) => void) => () => void
  onSpeechError: (callback: (data: any) => void) => () => void
  onSpeechSystemAudioSetup: (callback: (data: any) => void) => () => void

  // --- Shortcut Events ---
  onShowAnalysisPrompt: (callback: () => void) => () => void
  onQuickSolveStarted: (callback: () => void) => () => void
  onQuickSolveResult: (callback: (data: any) => void) => () => void
  onQuickSolveError: (callback: (data: any) => void) => () => void

  // --- Chat Features (New) ---
  sendChatMessage?: (message: string) => Promise<string>
  onChatResponse?: (callback: (response: string) => void) => () => void
  onChatError?: (callback: (error: string) => void) => () => void
  onShow?: (callback: () => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}