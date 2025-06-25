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
  public screenshotHelper: ScreenshotHelper // public for shortcuts
  public shortcutsHelper: ShortcutsHelper
  public processingHelper: ProcessingHelper
  public speechHelper: SpeechHelper
  private llmHelper: LLMHelper

  private view: "queue" | "solutions" = "queue"
  private problemInfo: any | null = null
  private hasDebugged: boolean = false

  public readonly PROCESSING_EVENTS = {
    UNAUTHORIZED: "procesing-unauthorized",
    NO_SCREENSHOTS: "processing-no-screenshots",
    INITIAL_START: "initial-start",
    PROBLEM_EXTRACTED: "problem-extracted",
    SOLUTION_SUCCESS: "solution-success",
    INITIAL_SOLUTION_ERROR: "solution-error",
    DEBUG_START: "debug-start",
    DEBUG_SUCCESS: "debug-success",
    DEBUG_ERROR: "debug-error",
    ACTION_RESPONSE_GENERATED: "action-response-generated",
    ACTION_RESPONSE_ERROR: "action-response-error"
  } as const

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not found in environment variables")
    }
    this.llmHelper = new LLMHelper(apiKey)
    this.windowHelper = new WindowHelper(this)
    this.screenshotHelper = new ScreenshotHelper(this.view)
    this.processingHelper = new ProcessingHelper(this)
    this.speechHelper = new SpeechHelper(this.llmHelper, null)
    this.shortcutsHelper = new ShortcutsHelper(this)
  }

  public static getInstance(): AppState {
    if (!AppState.instance) {
      AppState.instance = new AppState()
    }
    return AppState.instance
  }

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
    this.speechHelper.setMainWindow(this.getMainWindow())
  }

  public showMainWindow(): void {
    this.windowHelper.showMainWindow()
  }

  public hideMainWindow(): void {
    this.windowHelper.hideMainWindow()
  }

  public updateContentDimensions(dimensions: { width: number; height: number }): void {
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

  public async getScreenshots(): Promise<Array<{ path: string; preview: string }>> {
    return this.screenshotHelper.getScreenshots()
  }

  public async getImagePreview(filepath: string): Promise<string> {
    return this.screenshotHelper.getImagePreview(filepath)
  }

  public async deleteScreenshot(path: string): Promise<{ success: boolean; error?: string }> {
    return this.screenshotHelper.deleteScreenshot(path)
  }

  public moveWindowLeft(): void { this.windowHelper.moveWindowLeft() }
  public moveWindowRight(): void { this.windowHelper.moveWindowRight() }
  public moveWindowDown(): void { this.windowHelper.moveWindowDown() }
  public moveWindowUp(): void { this.windowHelper.moveWindowUp() }
  public moveWindow(deltaX: number, deltaY: number): void { this.windowHelper.moveWindow(deltaX, deltaY) }

  public setHasDebugged(value: boolean): void { this.hasDebugged = value }
  public getHasDebugged(): boolean { return this.hasDebugged }

  // Speech methods (delegating to SpeechHelper)
  public async startRealtimeRecording(includeSystemAudio: boolean = true): Promise<void> {
    return this.speechHelper.startRealtimeRecording(includeSystemAudio)
  }
  public stopRealtimeRecording(): void { this.speechHelper.stopRealtimeRecording() }
  public isRecording(): boolean { return this.speechHelper.isCurrentlyRecording() }
  public clearSpeechTranscript(): void { this.speechHelper.clearTranscript() }

  // Audio Helper methods
  public async getAudioDevices() { return this.speechHelper.getAudioDevices() }
  public isBlackHoleInstalled(): boolean { return this.speechHelper.isBlackHoleInstalled() }
  public async installBlackHole() { return this.speechHelper.installBlackHole() }
  public async testSystemAudioCapture() { return this.speechHelper.testSystemAudioCapture() }
  public async checkAudioPermissions() { return this.speechHelper.checkAudioPermissions() }
  public async setupSystemAudio(): Promise<boolean> { return this.speechHelper.setupSystemAudio() }
  public async teardownSystemAudio(): Promise<void> { return this.speechHelper.teardownSystemAudio() }

  // Screen analysis
  public async analyzeScreenAutomatically(imagePath: string) {
    return this.llmHelper.analyzeScreenAutomatically(imagePath)
  }
  public async analyzeScreenWithPrompt(imagePath: string, prompt: string) {
    return this.llmHelper.analyzeScreenWithPrompt(imagePath, prompt)
  }
}

async function initializeApp() {
  const appState = AppState.getInstance()
  initializeIpcHandlers(appState)

  app.whenReady().then(() => {
    console.log("App is ready")
    appState.createWindow()
    appState.shortcutsHelper.registerGlobalShortcuts()
  })

  app.on("activate", () => {
    if (appState.getMainWindow() === null) {
      appState.createWindow()
    }
  })

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit()
    }
  })

  app.dock?.hide()
  app.commandLine.appendSwitch("disable-background-timer-throttling")
}

initializeApp().catch(console.error)