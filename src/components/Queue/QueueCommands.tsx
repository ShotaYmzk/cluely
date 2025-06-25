// src/components/Queue/QueueCommands.tsx
import React, { useState, useEffect, useRef } from "react"
import { IoLogOutOutline, IoMic, IoMicOff, IoSettings, IoVolumeHigh, IoSettingsSharp, IoRefresh } from "react-icons/io5"
import VoiceRecording from "./VoiceRecording"
import AudioSettings from "../../Audio/AudioSettings"
import MarkdownRenderer from "../ui/MarkdownRenderer"

interface QueueCommandsProps {
  onTooltipVisibilityChange: (visible: boolean, height: number) => void
  screenshots: Array<{ path: string; preview: string }>
}

interface VoiceTranscript {
  text: string
  timestamp: number
  isInterim: boolean
  isFinal: boolean
}

const QueueCommands: React.FC<QueueCommandsProps> = ({
  onTooltipVisibilityChange,
  screenshots
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showVoicePanel, setShowVoicePanel] = useState(false)
  const [showAudioSettings, setShowAudioSettings] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState("")
  const [includeSystemAudio, setIncludeSystemAudio] = useState(true)
  const [blackHoleAvailable, setBlackHoleAvailable] = useState(false)
  
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let tooltipHeight = 0
    if (tooltipRef.current && isTooltipVisible) {
      tooltipHeight = tooltipRef.current.offsetHeight + 10
    }
    onTooltipVisibilityChange(isTooltipVisible, tooltipHeight)
  }, [isTooltipVisible, onTooltipVisibilityChange])

  useEffect(() => {
    // Set up keyboard shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      // Command/Ctrl + R でトランスクリプトクリア
      if ((event.metaKey || event.ctrlKey) && event.key === 'r') {
        event.preventDefault()
        handleClearTranscript()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    // Listen for recording state changes
    const cleanups = [
      window.electronAPI.onSpeechRecordingStarted((data) => {
        setIsRecording(true)
        setShowVoicePanel(true)
        // Check if BlackHole is available and system audio is included
        if (data.blackHoleAvailable !== undefined) {
          setBlackHoleAvailable(data.blackHoleAvailable)
        }
      }),
      window.electronAPI.onSpeechRecordingStopped(() => {
        setIsRecording(false)
      })
    ]

    return () => {
      cleanups.forEach(cleanup => cleanup())
    }
  }, [])

  useEffect(() => {
    // Check BlackHole availability on component mount
    const checkBlackHole = async () => {
      try {
        const result = await window.electronAPI.isBlackHoleInstalled()
        if (result.success) {
          setBlackHoleAvailable(result.installed || false)
        }
      } catch (error) {
        console.error("Failed to check BlackHole status:", error)
      }
    }

    checkBlackHole()
  }, [])

  const handleMouseEnter = () => {
    setIsTooltipVisible(true)
  }

  const handleMouseLeave = () => {
    setIsTooltipVisible(false)
  }

  const handleVoiceToggle = async () => {
    if (isRecording) {
      // Stop recording
      try {
        await window.electronAPI.stopRealtimeRecording()
      } catch (error) {
        console.error("Failed to stop recording:", error)
      }
    } else {
      // Start recording with system audio option
      try {
        setShowVoicePanel(true)
        await window.electronAPI.startRealtimeRecording(includeSystemAudio)
      } catch (error) {
        console.error("Failed to start recording:", error)
      }
    }
  }

  const handleClearTranscript = async () => {
    try {
      await window.electronAPI.clearSpeechTranscript()
      setCurrentTranscript("")
    } catch (error) {
      console.error("Failed to clear transcript:", error)
    }
  }

  const handleTranscriptChange = (transcript: string) => {
    setCurrentTranscript(transcript)
  }

  return (
    <div className="pt-2 w-fit">
      <div className="text-xs text-white/90 backdrop-blur-md bg-black/60 rounded-lg py-2 px-4 flex items-center justify-center gap-4">
        {/* Show/Hide */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] leading-none">表示/<br />非表示</span>
          <div className="flex gap-1">
            <button className="bg-white/10 hover:bg-white/20 transition-colors rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
              ⌘
            </button>
            <button className="bg-white/10 hover:bg-white/20 transition-colors rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
              B
            </button>
          </div>
        </div>

        {/* Screenshot */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] leading-none truncate">
            {screenshots.length === 0 ? "最初のスクリーンショットを撮影" : "スクリーンショット"}
          </span>
          <div className="flex gap-1">
            <button className="bg-white/10 hover:bg-white/20 transition-colors rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
              ⌘
            </button>
            <button className="bg-white/10 hover:bg-white/20 transition-colors rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
              H
            </button>
          </div>
        </div>

        {/* Solve Command */}
        {screenshots.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] leading-none">解決</span>
            <div className="flex gap-1">
              <button className="bg-white/10 hover:bg-white/20 transition-colors rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                ⌘
              </button>
              <button className="bg-white/10 hover:bg-white/20 transition-colors rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                ↵
              </button>
            </div>
          </div>
        )}

        {/* Voice Recording Button - Improved */}
        <div className="flex items-center gap-2">
          <button
            className={`transition-all rounded-md px-3 py-1.5 text-[11px] leading-none flex items-center gap-1.5 font-medium ${
              isRecording 
                ? 'bg-red-500/80 hover:bg-red-500/90 text-white shadow-lg shadow-red-500/25' 
                : 'bg-white/10 hover:bg-white/20 text-white/80'
            }`}
            onClick={handleVoiceToggle}
            type="button"
            title={isRecording ? "音声録音を停止" : "リアルタイム音声録音を開始"}
          >
            {isRecording ? (
              <>
                <IoMicOff className="w-3 h-3" />
                <span className="animate-pulse">録音中</span>
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              </>
            ) : (
              <>
                <IoMic className="w-3 h-3" />
                <span>音声録音</span>
                {blackHoleAvailable && includeSystemAudio && (
                  <span className="text-[9px] bg-blue-500/30 px-1 py-0.5 rounded">SYS</span>
                )}
              </>
            )}
          </button>

          {/* Audio Settings Button */}
          <button
            onClick={() => setShowAudioSettings(true)}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
            title="音声設定"
          >
            <IoSettings className="w-3 h-3 text-white/70" />
          </button>
        </div>

        {/* Voice Panel Toggle */}
        {currentTranscript && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVoicePanel(!showVoicePanel)}
              className="text-[11px] leading-none text-white/60 hover:text-white/80 transition-colors"
            >
              {showVoicePanel ? "音声パネルを隠す" : "音声パネルを表示"}
            </button>
          </div>
        )}

        {/* Question mark with tooltip */}
        <div
          className="relative inline-block"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors flex items-center justify-center cursor-help z-10">
            <span className="text-xs text-white/70">?</span>
          </div>

          {/* Tooltip Content */}
          {isTooltipVisible && (
            <div
              ref={tooltipRef}
              className="absolute top-full right-0 mt-2 w-80"
            >
              <div className="p-3 text-xs bg-black/80 backdrop-blur-md rounded-lg border border-white/10 text-white/90 shadow-lg">
                <div className="space-y-4">
                  <h3 className="font-medium truncate">キーボードショートカット</h3>
                  <div className="space-y-3">
                    {/* Toggle Command */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate">ウィンドウ切り替え</span>
                        <div className="flex gap-1 flex-shrink-0">
                          <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] leading-none">
                            ⌘
                          </span>
                          <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] leading-none">
                            B
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] leading-relaxed text-white/70 truncate">
                        このウィンドウを表示または非表示にします。
                      </p>
                    </div>
                    {/* Screenshot Command */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate">スクリーンショット撮影</span>
                        <div className="flex gap-1 flex-shrink-0">
                          <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] leading-none">
                            ⌘
                          </span>
                          <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] leading-none">
                            H
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] leading-relaxed text-white/70 truncate">
                        問題の説明のスクリーンショットを撮影します。ツールは問題を抽出・分析します。最新の5つのスクリーンショットが保存されます。
                      </p>
                    </div>

                    {/* Solve Command */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate">問題解決</span>
                        <div className="flex gap-1 flex-shrink-0">
                          <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] leading-none">
                            ⌘
                          </span>
                          <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] leading-none">
                            ↵
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] leading-relaxed text-white/70 truncate">
                        現在の問題に基づいてソリューションを生成します。
                      </p>
                    </div>

                    {/* Voice Commands */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate">音声録音</span>
                        <div className="flex gap-1 flex-shrink-0">
                          <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] leading-none">
                            🎤
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] leading-relaxed text-white/70">
                        リアルタイム音声録音と文字起こし。マイクとシステム音声の両方を録音できます。
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate">トランスクリプトクリア</span>
                        <div className="flex gap-1 flex-shrink-0">
                          <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] leading-none">
                            ⌘
                          </span>
                          <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] leading-none">
                            R
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] leading-relaxed text-white/70 truncate">
                        音声文字起こしの履歴をクリアします。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="mx-2 h-4 w-px bg-white/20" />

        {/* Sign Out Button - Moved to end */}
        <button
          className="text-red-500/70 hover:text-red-500/90 transition-colors hover:cursor-pointer"
          title="サインアウト"
          onClick={() => window.electronAPI.quitApp()}
        >
          <IoLogOutOutline className="w-4 h-4" />
        </button>
      </div>

      {/* Voice Recording Panel */}
      {showVoicePanel && (
        <div className="mt-3 w-full min-w-96 max-w-2xl">
          <VoiceRecording
            onTranscriptChange={handleTranscriptChange}
            className="w-full"
          />
        </div>
      )}

      {/* Audio Settings Modal */}
      <AudioSettings
        isVisible={showAudioSettings}
        onClose={() => setShowAudioSettings(false)}
      />
    </div>
  )
}

export default QueueCommands