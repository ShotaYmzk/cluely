// electron/main.ts

import { app, BrowserWindow } from "electron"
import { initializeIpcHandlers } from "./ipcHandlers"
import { WindowHelper } from "./WindowHelper"
import { ScreenshotHelper } from "./ScreenshotHelper"
import { ShortcutsHelper } from "./shortcuts"
import { ProcessingHelper } from "./ProcessingHelper"
import { SpeechHelper } from "./SpeechHelper"
import { LLMHelper } from "./LLMHelper"
import dotenv from "dotenv"

dotenv.config()

export class AppState {
  private static instance: AppState | null = null

  private windowHelper: WindowHelper
  private screenshotHelper: ScreenshotHelper
  public shortcutsHelper: ShortcutsHelper
  public processingHelper: ProcessingHelper
  public speechHelper: SpeechHelper
  private llmHelper: LLMHelper

  // View management
  private view: "queue" | "solutions" = "queue"

  private problemInfo: {
    problem_statement: string
    input_format: Record<string, any>
    output_format: Record<string, any>
    constraints: Array<Record<string, any>>
    test_cases: Array<Record<string, any>>
  } | null = null // Allow null

  private hasDebugged: boolean = false

  // Processing events
  public readonly PROCESSING_EVENTS = {
    //global states
    UNAUTHORIZED: "procesing-unauthorized",
    NO_SCREENSHOTS: "processing-no-screenshots",

    //states for generating the initial solution
    INITIAL_START: "initial-start",
    PROBLEM_EXTRACTED: "problem-extracted",
    SOLUTION_SUCCESS: "solution-success",
    INITIAL_SOLUTION_ERROR: "solution-error",

    //states for processing the debugging
    DEBUG_START: "debug-start",
    DEBUG_SUCCESS: "debug-success",
    DEBUG_ERROR: "debug-error",

    //states for processing action responses
    ACTION_RESPONSE_GENERATED: "action-response-generated",
    ACTION_RESPONSE_ERROR: "action-response-error"
  } as const

  constructor() {
    // Initialize LLMHelper first
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not found in environment variables")
    }
    this.llmHelper = new LLMHelper(apiKey)

    // Initialize WindowHelper with this
    this.windowHelper = new WindowHelper(this)

    // Initialize ScreenshotHelper
    this.screenshotHelper = new ScreenshotHelper(this.view)

    // Initialize ProcessingHelper
    this.processingHelper = new ProcessingHelper(this)

    // Initialize SpeechHelper
    this.speechHelper = new SpeechHelper(this.llmHelper, null)

    // Initialize ShortcutsHelper
    this.shortcutsHelper = new ShortcutsHelper(this)
  }

  public static getInstance(): AppState {
    if (!AppState.instance) {
      AppState.instance = new AppState()
    }
    return AppState.instance
  }

  // Getters and Setters
  public getMainWindow(): BrowserWindow | null {
    return this.windowHelper.getMainWindow()
  }

  public getLLMHelper(): LLMHelper {
    return this.llmHelper
  }

  public getView(): "queue" | "solutions" {
    return this.view
  }

  public setView(view: "queue" | "solutions"): void {
    this.view = view
    this.screenshotHelper.setView(view)
  }

  public isVisible(): boolean {
    return this.windowHelper.isVisible()
  }

  public getScreenshotHelper(): ScreenshotHelper {
    return this.screenshotHelper
  }

  public getProblemInfo(): any {
    return this.problemInfo
  }

  public setProblemInfo(problemInfo: any): void {
    this.problemInfo = problemInfo
  }

  public getScreenshotQueue(): string[] {
    return this.screenshotHelper.getScreenshotQueue()
  }

  public getExtraScreenshotQueue(): string[] {
    return this.screenshotHelper.getExtraScreenshotQueue()
  }

  public createWindow(): void {
    this.windowHelper.createWindow()
    // Update SpeechHelper with the new window reference
    this.speechHelper.setMainWindow(this.getMainWindow())
  }

  public showMainWindow(): void {
    this.windowHelper.showMainWindow()
  }

  public hideMainWindow(): void {
    this.windowHelper.hideMainWindow()
  }

  public updateContentDimensions(dimensions: {
    width: number
    height: number
  }): void {
    this.windowHelper.setWindowDimensions(dimensions.width, dimensions.height)
  }

  public async takeScreenshot(): Promise<string> {
    const screenshotPath = await this.screenshotHelper.takeScreenshot(
      () => this.hideMainWindow(),
      () => this.showMainWindow()
    )
    console.log(`🖼️  Screenshot saved: ${screenshotPath}`)
    const mainWindow = this.getMainWindow()
    if (mainWindow) {
      mainWindow.webContents.send("screenshot-taken", screenshotPath)
    }
    return screenshotPath
  }

  public async getScreenshots(): Promise<
    Array<{ path: string; preview: string }>
  > {
    return this.screenshotHelper.getScreenshots()
  }

  public async getImagePreview(filepath: string): Promise<string> {
    return this.screenshotHelper.getImagePreview(filepath)
  }

  public async deleteScreenshot(path: string): Promise<{ success: boolean; error?: string }> {
    return this.screenshotHelper.deleteScreenshot(path)
  }

  // New methods to move the window
  public moveWindowLeft(): void {
    this.windowHelper.moveWindowLeft()
  }

  public moveWindowRight(): void {
    this.windowHelper.moveWindowRight()
  }
  public moveWindowDown(): void {
    this.windowHelper.moveWindowDown()
  }
  public moveWindowUp(): void {
    this.windowHelper.moveWindowUp()
  }

  public moveWindow(deltaX: number, deltaY: number): void {
    this.windowHelper.moveWindow(deltaX, deltaY)
  }

  public setHasDebugged(value: boolean): void {
    this.hasDebugged = value
  }

  public getHasDebugged(): boolean {
    return this.hasDebugged
  }

  // Speech methods
  public async startRealtimeRecording(includeSystemAudio: boolean = true): Promise<void> {
    return this.speechHelper.startRealtimeRecording(includeSystemAudio)
  }

  public stopRealtimeRecording(): void {
    this.speechHelper.stopRealtimeRecording()
  }

  public isRecording(): boolean {
    return this.speechHelper.isCurrentlyRecording()
  }

  public clearSpeechTranscript(): void {
    this.speechHelper.clearTranscript()
  }

  // **新規追加: Audio Helper methods**
  public async getAudioDevices() {
    return this.speechHelper.getAudioDevices()
  }

  public isBlackHoleInstalled(): boolean {
    return this.speechHelper.isBlackHoleInstalled()
  }

  public async installBlackHole() {
    return this.speechHelper.installBlackHole()
  }

  public async testSystemAudioCapture() {
    return this.speechHelper.testSystemAudioCapture()
  }

  public async checkAudioPermissions() {
    return this.speechHelper.checkAudioPermissions()
  }

  public async setupSystemAudio(): Promise<boolean> {
    return this.speechHelper.setupSystemAudio()
  }

  public async teardownSystemAudio(): Promise<void> {
    return this.speechHelper.teardownSystemAudio()
  }

  // **新規追加: 画面分析機能**
  public async analyzeScreenAutomatically(imagePath: string) {
    return this.llmHelper.analyzeScreenAutomatically(imagePath)
  }

  public async analyzeScreenWithPrompt(imagePath: string, prompt: string) {
    return this.llmHelper.analyzeScreenWithPrompt(imagePath, prompt)
  }
}

// Application initialization
async function initializeApp() {
  const appState = AppState.getInstance()

  // Initialize IPC handlers before window creation
  initializeIpcHandlers(appState)

  app.whenReady().then(() => {
    console.log("🎤 音声処理IPCハンドラーが登録されました")
    console.log("App is ready")
    appState.createWindow()
    // Register global shortcuts using ShortcutsHelper
    appState.shortcutsHelper.registerGlobalShortcuts()
  })

  app.on("activate", () => {
    console.log("App activated")
    if (appState.getMainWindow() === null) {
      appState.createWindow()
    }
  })

  // Quit when all windows are closed, except on macOS
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit()
    }
  })

  app.dock?.hide() // Hide dock icon (optional)
  app.commandLine.appendSwitch("disable-background-timer-throttling")
}

// Start the application
initializeApp().catch(console.error)