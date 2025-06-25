// electron/ProcessingHelper.ts

import { AppState } from "./main"
import { LLMHelper } from "./LLMHelper"
import dotenv from "dotenv"

dotenv.config()

export class ProcessingHelper {
  private appState: AppState
  public llmHelper: LLMHelper
  private currentProcessingAbortController: AbortController | null = null

  constructor(appState: AppState) {
    this.appState = appState
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not found in environment variables")
    }
    this.llmHelper = new LLMHelper(apiKey)
  }

  // Add missing methods that are referenced in ipcHandlers.ts
  public async processScreenshots(): Promise<void> {
    await this.processInputs()
  }

  public async processExtraScreenshots(): Promise<void> {
    await this.processInputs()
  }

  public async processInputs(): Promise<void> {
    const mainWindow = this.appState.getMainWindow()
    if (!mainWindow || mainWindow.isDestroyed()) return

    this.cancelOngoingRequests()
    this.currentProcessingAbortController = new AbortController()
    
    const screenshotQueue = this.appState.getScreenshotQueue()
    if (screenshotQueue.length === 0) {
      mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.NO_SCREENSHOTS)
      return
    }

    mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.INITIAL_START)
    this.appState.setView("solutions")

    const lastInputPath = screenshotQueue[screenshotQueue.length - 1]
    const isAudio = lastInputPath.endsWith('.mp3') || lastInputPath.endsWith('.wav')

    const onChunk = (chunk: string) => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('llm-chunk', chunk)
      }
    }
    const onError = (error: Error) => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('llm-error', error.message)
      }
      this.currentProcessingAbortController = null
    }
    const onEnd = () => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('llm-stream-end')
      }
      this.currentProcessingAbortController = null
    }

    if (isAudio) {
      // Use existing analyzeAudioFile method instead of non-existent generateStreamFromAudio
      try {
        const result = await this.llmHelper.analyzeAudioFile(lastInputPath)
        onChunk(result.text)
        onEnd()
      } catch (error: any) {
        onError(error)
      }
    } else {
      // Use existing extractProblemFromImages method instead of non-existent generateStreamFromImages
      try {
        const result = await this.llmHelper.extractProblemFromImages(screenshotQueue)
        onChunk(JSON.stringify(result, null, 2))
        onEnd()
      } catch (error: any) {
        onError(error)
      }
    }
  }

  public cancelOngoingRequests(): void {
    if (this.currentProcessingAbortController) {
      this.currentProcessingAbortController.abort()
      this.currentProcessingAbortController = null
      console.log("進行中のリクエストをキャンセルしました。")
    }
  }
  
  // These methods call the non-streaming methods in LLMHelper to fix compile errors
  public async processAudioBase64(data: string, mimeType: string) {
    return this.llmHelper.analyzeAudioFromBase64(data, mimeType);
  }

  public async processAudioFile(filePath: string) {
    return this.llmHelper.analyzeAudioFile(filePath);
  }

  public getLLMHelper() {
    return this.llmHelper;
  }

  public async processActionResponse(action: string) {
    const mainWindow = this.appState.getMainWindow()
    if (!mainWindow) return

    const problemInfo = this.appState.getProblemInfo()
    if (!problemInfo) {
      console.error("No problem info available for action response")
      return
    }

    try {
      // Use analyzeImageFile method since generateActionResponse doesn't exist
      const imagePaths = this.appState.getScreenshotQueue()
      if (imagePaths.length > 0) {
        const actionResponse = await this.llmHelper.analyzeImageFile(imagePaths[imagePaths.length - 1])
        mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.ACTION_RESPONSE_GENERATED, actionResponse)
      }
    } catch (error: any) {
      console.error("Action response processing error:", error)
      mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.ACTION_RESPONSE_ERROR, error.message)
    }
  }
}