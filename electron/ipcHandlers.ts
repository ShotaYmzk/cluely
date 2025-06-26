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

  // **音声録音関連**
  ipcMain.handle("start-realtime-recording", (event, includeSystemAudio: boolean) => appState.startRealtimeRecording(includeSystemAudio))
  ipcMain.handle("stop-realtime-recording", () => appState.stopRealtimeRecording())
  ipcMain.handle("is-recording", () => appState.isRecording())
  ipcMain.handle("clear-speech-transcript", () => appState.clearSpeechTranscript())
  
  // **音声分析用ハンドラー (新規追加)**
  ipcMain.handle("analyze-audio-chunk", async (event, { base64Data, mimeType }) => {
    try {
      await appState.speechHelper.analyzeAudioChunk(base64Data, mimeType)
      return { success: true }
    } catch (error: any) {
      console.error("Error analyzing audio chunk in IPC handler:", error)
      return { success: false, error: error.message }
    }
  })

  // **オーディオデバイス関連**
  ipcMain.handle("get-audio-devices", () => appState.getAudioDevices())
  ipcMain.handle("is-blackhole-installed", () => appState.isBlackHoleInstalled())
  ipcMain.handle("install-blackhole", () => appState.installBlackHole())
  ipcMain.handle("test-system-audio-capture", () => appState.testSystemAudioCapture())
  ipcMain.handle("check-audio-permissions", () => appState.checkAudioPermissions())
  ipcMain.handle("setup-system-audio", () => appState.setupSystemAudio())
  ipcMain.handle("teardown-system-audio", () => appState.teardownSystemAudio())

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

  // **画面分析関連**
  ipcMain.handle("analyze-screen-automatically", async (event, imagePath: string) => {
    try {
      const result = await appState.analyzeScreenAutomatically(imagePath)
      return { success: true, ...result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
  ipcMain.handle("analyze-screen-with-prompt", async (event, imagePath: string, prompt: string) => {
    try {
      const result = await appState.analyzeScreenWithPrompt(imagePath, prompt)
      return { success: true, ...result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // **現在の画面を自動分析**
  ipcMain.handle("analyze-current-screen", async () => {
    try {
      // スクリーンショット撮影
      const screenshotPath = await appState.takeScreenshot()
      
      // 音声が録音中の場合、音声も含めて分析
      let prompt = "画面の内容を詳しく分析してください。"
      if (appState.isRecording()) {
        prompt += " 現在音声も録音中です。画面の情報と合わせて総合的に分析してください。"
      }
      
      // 画面分析実行
      const result = await appState.analyzeScreenWithPrompt(screenshotPath, prompt)
      return result.text || "分析結果を取得できませんでした。"
    } catch (error: any) {
      console.error("Error in analyze-current-screen handler:", error)
      return "画面分析中にエラーが発生しました。"
    }
  })

  // **ウィンドウ表示/非表示切り替え**
  ipcMain.handle("toggle-window", () => {
    try {
      if (appState.isVisible()) {
        appState.hideMainWindow()
      } else {
        appState.showMainWindow()
      }
    } catch (error: any) {
      console.error("Error toggling window:", error)
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

  ipcMain.handle("quit-app", () => app.quit())

  // Window movement handlers
  ipcMain.handle("move-window-left", () => appState.moveWindowLeft())
  ipcMain.handle("move-window-right", () => appState.moveWindowRight())
  ipcMain.handle("move-window", (event, deltaX, deltaY) => appState.moveWindow(deltaX, deltaY))
}