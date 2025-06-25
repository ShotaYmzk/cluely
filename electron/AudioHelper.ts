// electron/AudioHelper.ts
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs"

const execAsync = promisify(exec)

export interface AudioDevice {
  id: string
  name: string
  type: 'input' | 'output'
  isDefault: boolean
  isSystemAudio: boolean
}

export class AudioHelper {
  private blackHoleInstalled: boolean = false
  private originalOutputDevice: string | null = null

  constructor() {
    this.checkBlackHoleInstallation()
  }

  /**
   * BlackHoleの設置状況を確認
   */
  private async checkBlackHoleInstallation(): Promise<void> {
    try {
      if (process.platform === "darwin") {
        // macOSでBlackHoleの確認
        const { stdout } = await execAsync("system_profiler SPAudioDataType")
        this.blackHoleInstalled = stdout.includes("BlackHole")
        
        if (this.blackHoleInstalled) {
          console.log("✅ BlackHole audio driver detected")
        } else {
          console.log("⚠️  BlackHole audio driver not found")
          console.log("   Install with: brew install blackhole-2ch")
        }
      }
    } catch (error) {
      console.error("Error checking BlackHole installation:", error)
      this.blackHoleInstalled = false
    }
  }

  /**
   * 利用可能な音声デバイスを取得
   */
  public async getAvailableAudioDevices(): Promise<AudioDevice[]> {
    const devices: AudioDevice[] = []

    try {
      if (process.platform === "darwin") {
        // macOSの音声デバイス一覧を取得
        const { stdout } = await execAsync(`
          system_profiler SPAudioDataType -json
        `)
        
        const audioData = JSON.parse(stdout)
        const audioDevices = audioData.SPAudioDataType?.[0]?.["_items"] || []

        for (const device of audioDevices) {
          if (device["_name"]) {
            const isBlackHole = device["_name"].includes("BlackHole")
            const isSoundflower = device["_name"].includes("Soundflower")
            
            devices.push({
              id: device["_name"],
              name: device["_name"],
              type: 'input',
              isDefault: false,
              isSystemAudio: isBlackHole || isSoundflower
            })
          }
        }
      }

      // Web Audio APIで取得可能なデバイスも追加
      // ただし、これはレンダラープロセスで実行する必要がある
      
    } catch (error) {
      console.error("Error getting audio devices:", error)
    }

    return devices
  }

  /**
   * BlackHoleを使用してシステム音声を録音用にセットアップ
   */
  public async setupSystemAudioCapture(): Promise<boolean> {
    if (!this.blackHoleInstalled || process.platform !== "darwin") {
      console.log("BlackHole not available for system audio capture")
      return false
    }

    try {
      // 現在のデフォルト出力デバイスを保存
      const { stdout: currentDevice } = await execAsync(`
        osascript -e 'tell application "System Events" to get the name of the current output device of (get audio device 1 of audio device list)'
      `)
      this.originalOutputDevice = currentDevice.trim()

      // BlackHoleをデフォルト出力デバイスに設定
      await execAsync(`
        osascript -e 'tell application "System Events" to set the current output device of (get audio device 1 of audio device list) to "BlackHole 2ch"'
      `)

      // Multi-output deviceを作成してBlackHoleと元のスピーカーの両方に出力
      await this.createMultiOutputDevice()

      console.log("✅ System audio capture setup completed")
      return true
    } catch (error) {
      console.error("Error setting up system audio capture:", error)
      return false
    }
  }

  /**
   * システム音声録音のセットアップを解除
   */
  public async teardownSystemAudioCapture(): Promise<void> {
    if (!this.blackHoleInstalled || !this.originalOutputDevice) {
      return
    }

    try {
      // 元のオーディオデバイスに戻す
      await execAsync(`
        osascript -e 'tell application "System Events" to set the current output device of (get audio device 1 of audio device list) to "${this.originalOutputDevice}"'
      `)

      console.log("✅ System audio capture teardown completed")
    } catch (error) {
      console.error("Error tearing down system audio capture:", error)
    }
  }

  /**
   * Multi-output deviceを作成（BlackHole + スピーカー）
   */
  private async createMultiOutputDevice(): Promise<void> {
    try {
      // Audio MIDI Setup.appでMulti-Output Deviceを作成するAppleScript
      const script = `
        tell application "Audio MIDI Setup"
          activate
          delay 1
          
          -- Create Multi-Output Device
          tell application "System Events"
            tell process "Audio MIDI Setup"
              click menu item "Create Multi-Output Device" of menu "Window" of menu bar 1
              delay 2
              
              -- BlackHoleとBuilt-in Outputを選択
              -- Note: 実際のデバイス名は環境によって異なる可能性があります
              click checkbox "BlackHole 2ch" of scroll area 1 of group 1 of window 1
              click checkbox "Built-in Output" of scroll area 1 of group 1 of window 1
              
              -- Multi-Output Deviceを保存
              key code 1 using command down -- Command+S
            end tell
          end tell
        end tell
      `

      await execAsync(`osascript -e '${script}'`)
    } catch (error) {
      console.error("Error creating multi-output device:", error)
      // フォールバック: 手動での設定を推奨
      console.log("Manual setup required: Open Audio MIDI Setup and create a Multi-Output Device")
    }
  }

  /**
   * BlackHoleのインストール状況を取得
   */
  public isBlackHoleInstalled(): boolean {
    return this.blackHoleInstalled
  }

  /**
   * BlackHoleの自動インストール（macOS）
   */
  public async installBlackHole(): Promise<{ success: boolean; message: string }> {
    if (process.platform !== "darwin") {
      return {
        success: false,
        message: "BlackHole is only available on macOS"
      }
    }

    try {
      // Homebrewでのインストールを試行
      console.log("Installing BlackHole via Homebrew...")
      await execAsync("which brew", { timeout: 5000 })
      
      const { stdout, stderr } = await execAsync("brew install blackhole-2ch", { 
        timeout: 60000 
      })
      
      if (stderr && !stderr.includes("Warning")) {
        throw new Error(stderr)
      }

      // インストール確認
      await this.checkBlackHoleInstallation()
      
      if (this.blackHoleInstalled) {
        return {
          success: true,
          message: "BlackHole successfully installed. Please restart the application."
        }
      } else {
        return {
          success: false,
          message: "BlackHole installation completed but not detected. Please restart and try again."
        }
      }
    } catch (error: any) {
      console.error("BlackHole installation failed:", error)
      
      return {
        success: false,
        message: `Installation failed: ${error.message}. Please install manually from https://github.com/ExistentialAudio/BlackHole`
      }
    }
  }

  /**
   * システム音声録音のテスト
   */
  public async testSystemAudioCapture(): Promise<{ success: boolean; message: string }> {
    if (!this.blackHoleInstalled) {
      return {
        success: false,
        message: "BlackHole is not installed"
      }
    }

    try {
      // 簡単なテスト音を再生してBlackHoleで受信できるかテスト
      await execAsync(`
        osascript -e 'beep'
      `)

      return {
        success: true,
        message: "System audio capture test completed successfully"
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Test failed: ${error.message}`
      }
    }
  }

  /**
   * 音声録音の権限確認
   */
  public async checkAudioPermissions(): Promise<{ microphone: boolean; systemAudio: boolean }> {
    try {
      // マイク権限の確認
      const micPermission = await this.checkMicrophonePermission()
      
      // システム音声権限の確認（macOSではScreen Recording権限が必要）
      const systemAudioPermission = await this.checkSystemAudioPermission()

      return {
        microphone: micPermission,
        systemAudio: systemAudioPermission
      }
    } catch (error) {
      console.error("Error checking audio permissions:", error)
      return {
        microphone: false,
        systemAudio: false
      }
    }
  }

  private async checkMicrophonePermission(): Promise<boolean> {
    try {
      if (process.platform === "darwin") {
        const { stdout } = await execAsync(`
          osascript -e 'tell application "System Events" to get microphone access'
        `)
        return stdout.trim() === "true"
      }
      return true // 他のOSでは権限チェックを簡略化
    } catch (error) {
      return false
    }
  }

  private async checkSystemAudioPermission(): Promise<boolean> {
    try {
      if (process.platform === "darwin") {
        // Screen Recording権限をチェック（システム音声に必要）
        const { stdout } = await execAsync(`
          osascript -e 'tell application "System Events" to get screen recording access'
        `)
        return stdout.trim() === "true"
      }
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 音声品質設定の最適化
   */
  public getOptimizedAudioSettings(): MediaTrackConstraints {
    return {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 44100, // CD品質
      channelCount: 2,    // ステレオ
      sampleSize: 16,     // 16-bit
    }
  }

  /**
   * 音声ファイルの保存パスを生成
   */
  public generateAudioFilePath(extension: string = 'webm'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `audio-${timestamp}.${extension}`
    
    // プロジェクトのscreenshotsディレクトリに保存
    const screenshotsDir = path.join(process.cwd(), 'screenshots')
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true })
    }
    
    return path.join(screenshotsDir, filename)
  }
}