import { ipcMain, app } from "electron"
import { AppState } from "./main"

export function initializeIpcHandlers(appState: AppState) {
  // Existing handlers...
  ipcMain.handle("take-screenshot", async () => {
    try {
      const screenshotPath = await appState.takeScreenshot()
      return { success: true, path: screenshotPath }
    } catch (error: any) {
      console.error("Error taking screenshot:", error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle("get-screenshots", async () => {
    try {
      const screenshots = await appState.getScreenshots()
      return screenshots
    } catch (error: any) {
      console.error("Error getting screenshots:", error)
      return []
    }
  })

  ipcMain.handle("get-image-preview", async (event, filepath: string) => {
    try {
      const preview = await appState.getImagePreview(filepath)
      return preview
    } catch (error: any) {
      console.error("Error getting image preview:", error)
      return null
    }
  })

  ipcMain.handle("delete-screenshot", async (event, path: string) => {
    try {
      const result = await appState.deleteScreenshot(path)
      return result
    } catch (error: any) {
      console.error("Error deleting screenshot:", error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle("update-content-dimensions", async (event, dimensions: { width: number; height: number }) => {
    try {
      appState.updateContentDimensions(dimensions)
      return { success: true }
    } catch (error: any) {
      console.error("Error updating content dimensions:", error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle("process-screenshots", async () => {
    try {
      await appState.processingHelper.processScreenshots()
      return { success: true }
    } catch (error: any) {
      console.error("Error processing screenshots:", error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle("process-extra-screenshots", async () => {
    try {
      await appState.processingHelper.processExtraScreenshots()
      return { success: true }
    } catch (error: any) {
      console.error("Error processing extra screenshots:", error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle("reset-queues", async () => {
    try {
      const screenshotHelper = appState.getScreenshotHelper()
      screenshotHelper.resetQueues()
      return { success: true }
    } catch (error: any) {
      console.error("Error resetting queues:", error)
      return { success: false, error: error.message }
    }
  })

  // **新規追加: 音声録音関連のIPCハンドラー**
  
  // リアルタイム録音開始（システム音声オプション付き）
  ipcMain.handle("start-realtime-recording", async (event, includeSystemAudio: boolean = true) => {
    try {
      await appState.startRealtimeRecording(includeSystemAudio)
      return { success: true }
    } catch (error: any) {
      console.error("Error starting realtime recording:", error)
      return { success: false, error: error.message }
    }
  })

  // リアルタイム録音停止
  ipcMain.handle("stop-realtime-recording", async () => {
    try {
      appState.stopRealtimeRecording()
      return { success: true }
    } catch (error: any) {
      console.error("Error stopping realtime recording:", error)
      return { success: false, error: error.message }
    }
  })

  // 録音状態確認
  ipcMain.handle("is-recording", async () => {
    try {
      const isRecording = appState.isRecording()
      return { success: true, isRecording }
    } catch (error: any) {
      console.error("Error checking recording status:", error)
      return { success: false, error: error.message }
    }
  })

  // トランスクリプトクリア
  ipcMain.handle("clear-speech-transcript", async () => {
    try {
      appState.clearSpeechTranscript()
      return { success: true }
    } catch (error: any) {
      console.error("Error clearing transcript:", error)
      return { success: false, error: error.message }
    }
  })

  // **新規追加: オーディオデバイス関連のIPCハンドラー**
  
  // 利用可能な音声デバイス一覧取得
  ipcMain.handle("get-audio-devices", async () => {
    try {
      const devices = await appState.getAudioDevices()
      return { success: true, devices }
    } catch (error: any) {
      console.error("Error getting audio devices:", error)
      return { success: false, error: error.message }
    }
  })

  // BlackHoleインストール状況確認
  ipcMain.handle("is-blackhole-installed", async () => {
    try {
      const installed = appState.isBlackHoleInstalled()
      return { success: true, installed }
    } catch (error: any) {
      console.error("Error checking BlackHole installation:", error)
      return { success: false, error: error.message }
    }
  })

  // BlackHoleインストール
  ipcMain.handle("install-blackhole", async () => {
    try {
      const result = await appState.installBlackHole()
      return { success: result.success, message: result.message }
    } catch (error: any) {
      console.error("Error installing BlackHole:", error)
      return { success: false, error: error.message }
    }
  })

  // システム音声録音テスト
  ipcMain.handle("test-system-audio-capture", async () => {
    try {
      const result = await appState.testSystemAudioCapture()
      return { success: result.success, message: result.message }
    } catch (error: any) {
      console.error("Error testing system audio capture:", error)
      return { success: false, error: error.message }
    }
  })

  // 音声権限確認
  ipcMain.handle("check-audio-permissions", async () => {
    try {
      const permissions = await appState.checkAudioPermissions()
      return { success: true, permissions }
    } catch (error: any) {
      console.error("Error checking audio permissions:", error)
      return { success: false, error: error.message }
    }
  })

  // システム音声セットアップ
  ipcMain.handle("setup-system-audio", async () => {
    try {
      const success = await appState.setupSystemAudio()
      return { success }
    } catch (error: any) {
      console.error("Error setting up system audio:", error)
      return { success: false, error: error.message }
    }
  })

  // システム音声セットアップ解除
  ipcMain.handle("teardown-system-audio", async () => {
    try {
      await appState.teardownSystemAudio()
      return { success: true }
    } catch (error: any) {
      console.error("Error tearing down system audio:", error)
      return { success: false, error: error.message }
    }
  })

  // IPC handler for analyzing audio from base64 data
  ipcMain.handle("analyze-audio-base64", async (event, data: string, mimeType: string) => {
    try {
      const result = await appState.processingHelper.processAudioBase64(data, mimeType)
      return result
    } catch (error: any) {
      console.error("Error in analyze-audio-base64 handler:", error)
      throw error
    }
  })

  // IPC handler for analyzing audio from file path
  ipcMain.handle("analyze-audio-file", async (event, path: string) => {
    try {
      const result = await appState.processingHelper.processAudioFile(path)
      return result
    } catch (error: any) {
      console.error("Error in analyze-audio-file handler:", error)
      throw error
    }
  })

  // IPC handler for analyzing image from file path
  ipcMain.handle("analyze-image-file", async (event, path: string) => {
    try {
      const result = await appState.processingHelper.getLLMHelper().analyzeImageFile(path)
      return result
    } catch (error: any) {
      console.error("Error in analyze-image-file handler:", error)
      throw error
    }
  })

  // **新規追加: 画面分析関連のIPCハンドラー**
  
  // 自動画面分析
  ipcMain.handle("analyze-screen-automatically", async (event, imagePath: string) => {
    try {
      const result = await appState.analyzeScreenAutomatically(imagePath)
      return { success: true, ...result }
    } catch (error: any) {
      console.error("Error in automatic screen analysis:", error)
      return { success: false, error: error.message }
    }
  })

  // プロンプト付き画面分析
  ipcMain.handle("analyze-screen-with-prompt", async (event, imagePath: string, prompt: string) => {
    try {
      const result = await appState.analyzeScreenWithPrompt(imagePath, prompt)
      return { success: true, ...result }
    } catch (error: any) {
      console.error("Error in prompted screen analysis:", error)
      return { success: false, error: error.message }
    }
  })

  // IPC handler for processing action responses
  ipcMain.handle("process-action-response", async (event, action: string) => {
    try {
      await appState.processingHelper.processActionResponse(action)
      return { success: true }
    } catch (error: any) {
      console.error("Error in process-action-response handler:", error)
      throw error
    }
  })

  ipcMain.handle("quit-app", () => {
    app.quit()
  })

  // Window movement handlers
  ipcMain.handle("move-window-left", async () => {
    appState.moveWindowLeft()
  })

  ipcMain.handle("move-window-right", async () => {
    appState.moveWindowRight()
  })

  ipcMain.handle("move-window", async (event, deltaX: number, deltaY: number) => {
    appState.moveWindow(deltaX, deltaY)
  })
}