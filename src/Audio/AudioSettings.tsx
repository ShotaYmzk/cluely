// src/components/Audio/AudioSettings.tsx
import React, { useState, useEffect } from "react"
import { 
  IoCheckmarkCircle, 
  IoWarning, 
  IoDownload, 
  IoSettings, 
  IoMic, 
  IoVolumeHigh,
  IoRefresh,
  IoPlay,
  IoClose
} from "react-icons/io5"

interface AudioDevice {
  id: string
  name: string
  type: 'input' | 'output'
  isDefault: boolean
  isSystemAudio: boolean
}

interface AudioSettingsProps {
  isVisible: boolean
  onClose: () => void
}

const AudioSettings: React.FC<AudioSettingsProps> = ({ isVisible, onClose }) => {
  const [blackHoleInstalled, setBlackHoleInstalled] = useState(false)
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([])
  const [permissions, setPermissions] = useState({ microphone: false, systemAudio: false })
  const [isLoading, setIsLoading] = useState(false)
  const [installMessage, setInstallMessage] = useState("")
  const [testMessage, setTestMessage] = useState("")

  useEffect(() => {
    if (isVisible) {
      checkAudioStatus()
    }
  }, [isVisible])

  const checkAudioStatus = async () => {
    setIsLoading(true)
    try {
      // BlackHole インストール状況確認
      const blackHoleResult = await window.electronAPI.isBlackHoleInstalled()
      if (blackHoleResult.success) {
        setBlackHoleInstalled(blackHoleResult.installed || false)
      }

      // 音声デバイス一覧取得
      const devicesResult = await window.electronAPI.getAudioDevices()
      if (devicesResult.success) {
        setAudioDevices(devicesResult.devices || [])
      }

      // 権限確認
      const permissionsResult = await window.electronAPI.checkAudioPermissions()
      if (permissionsResult.success) {
        setPermissions(permissionsResult.permissions || { microphone: false, systemAudio: false })
      }
    } catch (error) {
      console.error("Error checking audio status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInstallBlackHole = async () => {
    setIsLoading(true)
    setInstallMessage("")
    
    try {
      const result = await window.electronAPI.installBlackHole()
      setInstallMessage(result.message || "")
      
      if (result.success) {
        // インストール成功後に状態を更新
        setTimeout(() => {
          checkAudioStatus()
        }, 2000)
      }
    } catch (error) {
      setInstallMessage("インストール中にエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestSystemAudio = async () => {
    setIsLoading(true)
    setTestMessage("")
    
    try {
      const result = await window.electronAPI.testSystemAudioCapture()
      setTestMessage(result.message || "")
    } catch (error) {
      setTestMessage("テスト中にエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetupSystemAudio = async () => {
    setIsLoading(true)
    
    try {
      const result = await window.electronAPI.setupSystemAudio()
      if (result.success) {
        setTestMessage("システム音声録音が設定されました")
      } else {
        setTestMessage("システム音声録音の設定に失敗しました")
      }
    } catch (error) {
      setTestMessage("設定中にエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  const systemAudioDevices = audioDevices.filter(device => device.isSystemAudio)
  const hasSystemAudioDevices = systemAudioDevices.length > 0

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <IoSettings className="w-5 h-5 text-white" />
            <h2 className="text-lg font-semibold text-white">音声設定</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <IoClose className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(80vh-4rem)]">
          {isLoading && (
            <div className="text-center py-4">
              <div className="inline-block w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <p className="text-white/60 text-sm mt-2">読み込み中...</p>
            </div>
          )}

          {/* BlackHole Status */}
          <div className="space-y-3">
            <h3 className="text-white font-medium flex items-center gap-2">
              <IoVolumeHigh className="w-4 h-4" />
              BlackHole オーディオドライバー
            </h3>
            
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded border border-white/10">
              {blackHoleInstalled ? (
                <IoCheckmarkCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              ) : (
                <IoWarning className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              )}
              
              <div className="flex-1">
                <p className="text-white text-sm">
                  {blackHoleInstalled 
                    ? "BlackHoleがインストールされています" 
                    : "BlackHoleが必要です（システム音声録音用）"
                  }
                </p>
                <p className="text-white/60 text-xs mt-1">
                  {blackHoleInstalled
                    ? "システム音声とマイク音声の両方を録音できます"
                    : "マイク音声のみ録音可能です"
                  }
                </p>
              </div>

              {!blackHoleInstalled && (
                <button
                  onClick={handleInstallBlackHole}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/80 hover:bg-blue-500/90 text-white text-sm rounded transition-colors disabled:opacity-50"
                >
                  <IoDownload className="w-3 h-3" />
                  インストール
                </button>
              )}
            </div>

            {installMessage && (
              <div className={`p-3 rounded text-sm ${
                installMessage.includes("successfully") || installMessage.includes("成功")
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : "bg-red-500/20 text-red-300 border border-red-500/30"
              }`}>
                {installMessage}
              </div>
            )}
          </div>

          {/* Audio Permissions */}
          <div className="space-y-3">
            <h3 className="text-white font-medium flex items-center gap-2">
              <IoMic className="w-4 h-4" />
              音声権限
            </h3>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-white/5 rounded">
                {permissions.microphone ? (
                  <IoCheckmarkCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <IoWarning className="w-4 h-4 text-yellow-400" />
                )}
                <span className="text-white text-sm">マイクアクセス</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  permissions.microphone ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"
                }`}>
                  {permissions.microphone ? "許可済み" : "未許可"}
                </span>
              </div>

              <div className="flex items-center gap-3 p-2 bg-white/5 rounded">
                {permissions.systemAudio ? (
                  <IoCheckmarkCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <IoWarning className="w-4 h-4 text-yellow-400" />
                )}
                <span className="text-white text-sm">システム音声アクセス</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  permissions.systemAudio ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"
                }`}>
                  {permissions.systemAudio ? "許可済み" : "未許可"}
                </span>
              </div>
            </div>

            {(!permissions.microphone || !permissions.systemAudio) && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-300 text-sm">
                <p className="font-medium mb-1">権限が必要です</p>
                <p>システム環境設定 → セキュリティとプライバシー → プライバシー で音声録音とスクリーン録画を許可してください。</p>
              </div>
            )}
          </div>

          {/* Audio Devices */}
          {audioDevices.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-white font-medium">検出された音声デバイス</h3>
              
              <div className="space-y-2">
                {audioDevices.map((device, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-white/5 rounded">
                    <div className={`w-2 h-2 rounded-full ${
                      device.isSystemAudio ? "bg-blue-400" : 
                      device.isDefault ? "bg-green-400" : "bg-white/40"
                    }`} />
                    <span className="text-white text-sm flex-1">{device.name}</span>
                    {device.isSystemAudio && (
                      <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                        システム音声
                      </span>
                    )}
                    {device.isDefault && (
                      <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded">
                        デフォルト
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Audio Test */}
          {blackHoleInstalled && (
            <div className="space-y-3">
              <h3 className="text-white font-medium">システム音声テスト</h3>
              
              <div className="flex gap-2">
                <button
                  onClick={handleTestSystemAudio}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-3 py-2 bg-green-500/80 hover:bg-green-500/90 text-white text-sm rounded transition-colors disabled:opacity-50"
                >
                  <IoPlay className="w-3 h-3" />
                  テスト実行
                </button>

                <button
                  onClick={handleSetupSystemAudio}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-500/80 hover:bg-blue-500/90 text-white text-sm rounded transition-colors disabled:opacity-50"
                >
                  <IoSettings className="w-3 h-3" />
                  セットアップ
                </button>
              </div>

              {testMessage && (
                <div className={`p-3 rounded text-sm ${
                  testMessage.includes("successfully") || testMessage.includes("成功")
                    ? "bg-green-500/20 text-green-300 border border-green-500/30"
                    : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                }`}>
                  {testMessage}
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-3">
            <h3 className="text-white font-medium">使用方法</h3>
            <div className="space-y-2 text-sm text-white/80">
              <div className="flex gap-2">
                <span className="text-white/60">1.</span>
                <span>BlackHoleをインストールして音声権限を許可</span>
              </div>
              <div className="flex gap-2">
                <span className="text-white/60">2.</span>
                <span>音声録音ボタンでリアルタイム録音を開始</span>
              </div>
              <div className="flex gap-2">
                <span className="text-white/60">3.</span>
                <span>マイクとシステム音声の両方が自動で録音されます</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10">
          <button
            onClick={checkAudioStatus}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-2 text-white/60 hover:text-white/80 text-sm transition-colors disabled:opacity-50"
          >
            <IoRefresh className="w-3 h-3" />
            更新
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}

export default AudioSettings