// electron/SpeechHelper.ts
import { BrowserWindow } from "electron"
import { LLMHelper } from "./LLMHelper"
import { AudioHelper } from "./AudioHelper"
import fs from "fs"

export interface SpeechResult {
  text: string
  isInterim: boolean
  timestamp: number
}

export class SpeechHelper {
  private llmHelper: LLMHelper
  private audioHelper: AudioHelper
  private mainWindow: BrowserWindow | null
  private isRecording: boolean = false
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private recordingStartTime: number = 0
  private silenceTimer: NodeJS.Timeout | null = null
  private currentTranscript: string = ""
  private systemAudioSetup: boolean = false

  constructor(llmHelper: LLMHelper, mainWindow: BrowserWindow | null) {
    this.llmHelper = llmHelper
    this.audioHelper = new AudioHelper()
    this.mainWindow = mainWindow
  }

  public setMainWindow(mainWindow: BrowserWindow | null): void {
    this.mainWindow = mainWindow
  }

  public async startRealtimeRecording(includeSystemAudio: boolean = true): Promise<void> {
    if (this.isRecording) {
      console.log("Already recording")
      return
    }

    try {
      // システム音声録音のセットアップ（オプション）
      if (includeSystemAudio && this.audioHelper.isBlackHoleInstalled()) {
        const setupSuccess = await this.audioHelper.setupSystemAudioCapture()
        this.systemAudioSetup = setupSuccess
        
        if (setupSuccess) {
          this.sendToRenderer('speech-system-audio-setup', { success: true })
        } else {
          this.sendToRenderer('speech-system-audio-setup', { 
            success: false, 
            message: 'システム音声録音のセットアップに失敗しました' 
          })
        }
      }

      // マイクと（可能であれば）システム音声の両方を取得
      const micStream = await this.getMicrophoneStream()
      const systemStream = includeSystemAudio ? await this.getSystemAudioStream() : null
      
      // ストリームを合成
      const combinedStream = this.combineAudioStreams(micStream, systemStream)
      
      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      this.audioChunks = []
      this.recordingStartTime = Date.now()
      this.isRecording = true

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
          this.processAudioChunk(event.data)
        }
      }

      this.mediaRecorder.onstop = () => {
        this.processCompleteRecording()
      }

      // 100ms間隔で音声データを処理（リアルタイム性を向上）
      this.mediaRecorder.start(100)

      // UI更新
      this.sendToRenderer('speech-recording-started', {
        timestamp: this.recordingStartTime,
        includeSystemAudio: includeSystemAudio && (systemStream !== null),
        blackHoleAvailable: this.audioHelper.isBlackHoleInstalled()
      })

      console.log("Realtime recording started")
    } catch (error) {
      console.error("Failed to start realtime recording:", error)
      this.sendToRenderer('speech-error', {
        error: 'マイクアクセスに失敗しました。ブラウザの設定でマイクの使用を許可してください。'
      })
    }
  }

  public stopRealtimeRecording(): void {
    if (!this.isRecording || !this.mediaRecorder) {
      return
    }

    this.mediaRecorder.stop()
    this.isRecording = false

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer)
      this.silenceTimer = null
    }

    // ストリームを停止
    const tracks = this.mediaRecorder.stream.getTracks()
    tracks.forEach(track => track.stop())

    // システム音声録音のセットアップを解除
    if (this.systemAudioSetup) {
      this.audioHelper.teardownSystemAudioCapture()
      this.systemAudioSetup = false
    }

    // UI更新
    this.sendToRenderer('speech-recording-stopped', {
      finalTranscript: this.currentTranscript,
      timestamp: Date.now()
    })

    console.log("Realtime recording stopped")
  }

  private async getMicrophoneStream(): Promise<MediaStream> {
    const optimizedSettings = this.audioHelper.getOptimizedAudioSettings()
    
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        ...optimizedSettings,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000 // 音声認識用に16kHzに最適化
      }
    })
  }

  private async getSystemAudioStream(): Promise<MediaStream | null> {
    try {
      // macOSでBlackHoleデバイスを使用してシステム音声をキャプチャ
      const devices = await navigator.mediaDevices.enumerateDevices()
      const blackHoleDevice = devices.find(device => 
        device.kind === 'audioinput' && 
        (device.label.includes('BlackHole') || device.label.includes('Soundflower'))
      )

      if (blackHoleDevice) {
        return await navigator.mediaDevices.getUserMedia({
          audio: { 
            deviceId: blackHoleDevice.deviceId,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        })
      }
    } catch (error) {
      console.log("System audio not available, using microphone only:", error)
    }
    
    return null
  }

  private combineAudioStreams(micStream: MediaStream, systemStream: MediaStream | null): MediaStream {
    if (!systemStream) {
      return micStream
    }

    // Web Audio APIを使用して音声ストリームを合成
    const audioContext = new AudioContext()
    const micSource = audioContext.createMediaStreamSource(micStream)
    const systemSource = audioContext.createMediaStreamSource(systemStream)
    const merger = audioContext.createChannelMerger(2)
    const destination = audioContext.createMediaStreamDestination()

    micSource.connect(merger, 0, 0)
    systemSource.connect(merger, 0, 1)
    merger.connect(destination)

    return destination.stream
  }

  private async processAudioChunk(chunk: Blob): Promise<void> {
    try {
      // 音声チャンクをBase64に変換
      const base64Data = await this.blobToBase64(chunk)
      
      // Google Speech-to-TextまたはWeb Speech APIでリアルタイム認識
      const result = await this.recognizeSpeech(base64Data, chunk.type)
      
      if (result) {
        this.currentTranscript = result.text
        
        // リアルタイムでUIに送信
        this.sendToRenderer('speech-interim-result', {
          text: result.text,
          isInterim: result.isInterim,
          timestamp: result.timestamp
        })

        // 音声が途切れた場合の処理
        this.resetSilenceTimer()
      }
    } catch (error) {
      console.error("Error processing audio chunk:", error)
    }
  }

  private async recognizeSpeech(base64Data: string, mimeType: string): Promise<SpeechResult | null> {
    try {
      // Google Gemini APIで音声認識（既存の実装を活用）
      const result = await this.llmHelper.analyzeAudioFromBase64(base64Data, mimeType)
      
      return {
        text: result.text,
        isInterim: false, // Gemini APIの結果は最終結果
        timestamp: Date.now()
      }
    } catch (error) {
      console.error("Speech recognition error:", error)
      return null
    }
  }

  private resetSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer)
    }

    // 2秒間無音が続いたら文字起こしを確定
    this.silenceTimer = setTimeout(() => {
      if (this.currentTranscript.trim()) {
        this.sendToRenderer('speech-final-result', {
          text: this.currentTranscript,
          timestamp: Date.now()
        })
        
        // トランスクリプトをクリア
        this.currentTranscript = ""
      }
    }, 2000)
  }

  private async processCompleteRecording(): Promise<void> {
    if (this.audioChunks.length === 0) {
      return
    }

    try {
      // 最終的な音声ファイルを作成
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
      const base64Data = await this.blobToBase64(audioBlob)
      
      // 最終的な分析
      const finalResult = await this.llmHelper.analyzeAudioFromBase64(base64Data, audioBlob.type)
      
      this.sendToRenderer('speech-final-analysis', {
        text: finalResult.text,
        timestamp: Date.now(),
        duration: Date.now() - this.recordingStartTime
      })
    } catch (error) {
      console.error("Error processing complete recording:", error)
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1])
        } else {
          reject(new Error('Failed to convert blob to base64'))
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
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
    this.currentTranscript = ""
    this.sendToRenderer('speech-transcript-cleared', {
      timestamp: Date.now()
    })
  }

  // **新規追加: AudioHelper機能の公開**
  
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
      const success = await this.audioHelper.setupSystemAudioCapture()
      this.systemAudioSetup = success
      return success
    }
    return false
  }

  public async teardownSystemAudio(): Promise<void> {
    await this.audioHelper.teardownSystemAudioCapture()
    this.systemAudioSetup = false
  }

}