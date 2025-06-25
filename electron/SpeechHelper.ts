// electron/SpeechHelper.ts
import { BrowserWindow } from "electron"
import { LLMHelper } from "./LLMHelper"
import { AudioHelper } from "./AudioHelper"

export class SpeechHelper {
  private llmHelper: LLMHelper
  public audioHelper: AudioHelper // publicに変更してmain.tsからアクセス可能に
  private mainWindow: BrowserWindow | null
  private isRecording: boolean = false
  private systemAudioSetup: boolean = false

  constructor(llmHelper: LLMHelper, mainWindow: BrowserWindow | null) {
    this.llmHelper = llmHelper
    this.audioHelper = new AudioHelper()
    this.mainWindow = mainWindow
  }

  public setMainWindow(mainWindow: BrowserWindow | null): void {
    this.mainWindow = mainWindow
  }

  // このメソッドはレンダラーから呼び出されることを想定
  public async startRealtimeRecording(includeSystemAudio: boolean = true): Promise<void> {
    if (this.isRecording) {
      console.log("Already recording")
      return
    }
    
    // システム音声のセットアップのみMainプロセスで行う
    if (includeSystemAudio && this.audioHelper.isBlackHoleInstalled()) {
      const setupSuccess = await this.audioHelper.setupSystemAudioCapture()
      this.systemAudioSetup = setupSuccess
      this.sendToRenderer('speech-system-audio-setup', { success: setupSuccess })
    }
    
    this.isRecording = true
    // 実際の録音開始はレンダラーに通知
    this.sendToRenderer('speech-recording-started', {
      timestamp: Date.now(),
      includeSystemAudio: includeSystemAudio && this.systemAudioSetup,
      blackHoleAvailable: this.audioHelper.isBlackHoleInstalled()
    })
    console.log("Realtime recording initiated from main process.")
  }

  public stopRealtimeRecording(): void {
    if (!this.isRecording) {
      return
    }
    this.isRecording = false

    // システム音声のセットアップを解除
    if (this.systemAudioSetup) {
      this.audioHelper.teardownSystemAudioCapture()
      this.systemAudioSetup = false
    }

    // 録音停止をレンダラーに通知
    this.sendToRenderer('speech-recording-stopped', {
      timestamp: Date.now()
    })
    console.log("Realtime recording stopped from main process.")
  }

  // AI分析はMainプロセスで行う
  public async analyzeAudioChunk(base64Data: string, mimeType: string): Promise<void> {
    try {
      const result = await this.llmHelper.analyzeAudioFromBase64(base64Data, mimeType)
      this.sendToRenderer('speech-final-analysis', result)
    } catch (error) {
      console.error("Error analyzing audio chunk:", error)
      this.sendToRenderer('speech-error', { error: "音声チャンクの分析に失敗しました" })
    }
  }

  private sendToRenderer(event: string, data: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(event, data)
    }
  }

  public isCurrentlyRecording(): boolean {
    return this.isRecording
  }

  public clearTranscript(): void {
    this.sendToRenderer('speech-transcript-cleared', {
      timestamp: Date.now()
    })
  }

  // AudioHelperのメソッドをラップして公開
  public async getAudioDevices() {
    return await this.audioHelper.getAvailableAudioDevices()
  }

  public isBlackHoleInstalled(): boolean {
    return this.audioHelper.isBlackHoleInstalled()
  }

  public async installBlackHole() {
    return await this.audioHelper.installBlackHole()
  }

  public async testSystemAudioCapture() {
    return await this.audioHelper.testSystemAudioCapture()
  }

  public async checkAudioPermissions() {
    return await this.audioHelper.checkAudioPermissions()
  }
  
  public async setupSystemAudio(): Promise<boolean> {
      if (this.audioHelper.isBlackHoleInstalled()) {
          const success = await this.audioHelper.setupSystemAudioCapture();
          this.systemAudioSetup = success;
          return success;
      }
      return false;
  }
  
  public async teardownSystemAudio(): Promise<void> {
      await this.audioHelper.teardownSystemAudioCapture();
      this.systemAudioSetup = false;
  }
}