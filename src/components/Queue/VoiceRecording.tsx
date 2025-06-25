// src/components/Queue/VoiceRecording.tsx
import React, { useState, useEffect, useRef } from "react"
import { IoMic, IoMicOff, IoVolumeHigh, IoTrash } from "react-icons/io5"
import MarkdownRenderer from "../ui/MarkdownRenderer"

interface VoiceRecordingProps {
  onTranscriptChange?: (transcript: string) => void
  className?: string
}

interface TranscriptSegment {
  text: string
  timestamp: number
  isInterim: boolean
  isFinal: boolean
}

const VoiceRecording: React.FC<VoiceRecordingProps> = ({
  onTranscriptChange,
  className = ""
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([])
  const [currentInterim, setCurrentInterim] = useState("")
  const [finalAnalysis, setFinalAnalysis] = useState<string | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)

  const transcriptRef = useRef<HTMLDivElement>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const recordingStartTimeRef = useRef<number>(0)

  // Clean up function for event listeners
  const cleanupFunctions = useRef<Array<() => void>>([])

  useEffect(() => {
    // Set up event listeners
    const cleanups = [
      window.electronAPI.onSpeechRecordingStarted((data: { timestamp: number }) => {
        console.log("Recording started:", data)
        setIsRecording(true)
        setError(null)
        recordingStartTimeRef.current = data.timestamp
        startDurationTimer()
      }),

      window.electronAPI.onSpeechRecordingStopped((data: { finalTranscript: string; timestamp: number }) => {
        console.log("Recording stopped:", data)
        setIsRecording(false)
        stopDurationTimer()
        if (data.finalTranscript) {
          addToTranscript(data.finalTranscript, data.timestamp, false, true)
        }
      }),

      window.electronAPI.onSpeechInterimResult((data: { text: string; isInterim: boolean; timestamp: number }) => {
        console.log("Interim result:", data)
        setCurrentInterim(data.text)
      }),

      window.electronAPI.onSpeechFinalResult((data: { text: string; timestamp: number }) => {
        console.log("Final result:", data)
        addToTranscript(data.text, data.timestamp, false, true)
        setCurrentInterim("")
      }),

      window.electronAPI.onSpeechFinalAnalysis((data: { text: string; timestamp: number; duration: number }) => {
        console.log("Final analysis:", data)
        setFinalAnalysis(data.text)
        setIsLoading(false)
      }),

      window.electronAPI.onSpeechTranscriptCleared(() => {
        console.log("Transcript cleared")
        setTranscript([])
        setCurrentInterim("")
        setFinalAnalysis(null)
      }),

      window.electronAPI.onSpeechError((data: { error: string }) => {
        console.error("Speech error:", data)
        setError(data.error)
        setIsRecording(false)
        setIsLoading(false)
        stopDurationTimer()
      })
    ]

    cleanupFunctions.current = cleanups

    return () => {
      cleanups.forEach(cleanup => cleanup())
      stopDurationTimer()
    }
  }, [])

  useEffect(() => {
    // Scroll to bottom when new transcript is added
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [transcript, currentInterim])

  useEffect(() => {
    // Notify parent of transcript changes
    const fullTranscript = transcript
      .filter(segment => segment.isFinal)
      .map(segment => segment.text)
      .join(' ')
    onTranscriptChange?.(fullTranscript)
  }, [transcript, onTranscriptChange])

  const startDurationTimer = () => {
    durationIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - recordingStartTimeRef.current
      setRecordingDuration(Math.floor(elapsed / 1000))
    }, 1000)
  }

  const stopDurationTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }
    setRecordingDuration(0)
  }

  const addToTranscript = (text: string, timestamp: number, isInterim: boolean, isFinal: boolean) => {
    if (!text.trim()) return

    const newSegment: TranscriptSegment = {
      text: text.trim(),
      timestamp,
      isInterim,
      isFinal
    }

    setTranscript(prev => [...prev, newSegment])
  }

  const handleToggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      setIsLoading(true)
      try {
        const result = await window.electronAPI.stopRealtimeRecording()
        if (!result.success) {
          setError(result.error || "録音停止に失敗しました")
        }
      } catch (err) {
        setError("録音停止中にエラーが発生しました")
        setIsLoading(false)
      }
    } else {
      // Start recording
      setError(null)
      setFinalAnalysis(null)
      try {
        const result = await window.electronAPI.startRealtimeRecording()
        if (!result.success) {
          setError(result.error || "録音開始に失敗しました")
        }
      } catch (err) {
        setError("録音開始中にエラーが発生しました")
      }
    }
  }

  const handleClearTranscript = async () => {
    try {
      await window.electronAPI.clearSpeechTranscript()
    } catch (err) {
      console.error("Failed to clear transcript:", err)
    }
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const hasContent = transcript.length > 0 || currentInterim || finalAnalysis

  return (
    <div className={`voice-recording bg-black/60 backdrop-blur-md rounded-lg ${className}`}>
      {/* Control Panel */}
      <div className="flex items-center gap-3 p-3 border-b border-white/10">
        {/* Recording Button */}
        <button
          onClick={handleToggleRecording}
          disabled={isLoading}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
            isRecording
              ? "bg-red-500/80 hover:bg-red-500/90 text-white"
              : "bg-white/10 hover:bg-white/20 text-white/80"
          } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isRecording ? (
            <IoMicOff className="w-4 h-4" />
          ) : (
            <IoMic className="w-4 h-4" />
          )}
          {isLoading ? "処理中..." : isRecording ? "停止" : "録音開始"}
        </button>

        {/* Recording Duration */}
        {isRecording && (
          <div className="flex items-center gap-1 text-sm text-red-400">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span>{formatDuration(recordingDuration)}</span>
          </div>
        )}

        {/* Clear Button */}
        {hasContent && (
          <button
            onClick={handleClearTranscript}
            className="flex items-center gap-1 px-2 py-1 text-xs text-white/60 hover:text-white/80 hover:bg-white/10 rounded transition-colors"
            title="トランスクリプトをクリア"
          >
            <IoTrash className="w-3 h-3" />
            クリア
          </button>
        )}

        {/* Keyboard Shortcut Hint */}
        <div className="flex-1" />
        <div className="text-xs text-white/40">
          ⌘ + R でクリア
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-500/20 border-l-4 border-red-500 text-red-300 text-sm">
          <strong>エラー:</strong> {error}
        </div>
      )}

      {/* Transcript Display */}
      {hasContent && (
        <div className="p-3 space-y-3">
          {/* Real-time Transcript */}
          {(transcript.length > 0 || currentInterim) && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-white/60 flex items-center gap-1">
                <IoVolumeHigh className="w-3 h-3" />
                リアルタイム文字起こし
              </h4>
              <div
                ref={transcriptRef}
                className="max-h-32 overflow-y-auto p-3 bg-white/5 rounded border border-white/10 text-sm text-white/90 leading-relaxed"
              >
                {transcript
                  .filter(segment => segment.isFinal)
                  .map((segment, index) => (
                    <span key={index} className="block mb-1">
                      {segment.text}
                    </span>
                  ))}
                {currentInterim && (
                  <span className="text-white/60 italic">
                    {currentInterim}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* AI Analysis Result */}
          {finalAnalysis && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-white/60">
                AI 分析結果
              </h4>
              <div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded border border-blue-500/20 text-sm">
                <MarkdownRenderer content={finalAnalysis} className="text-white/90" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Placeholder when no content */}
      {!hasContent && !isRecording && (
        <div className="p-6 text-center text-white/40 text-sm">
          <IoMic className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>音声録音を開始してリアルタイム文字起こしを体験</p>
          <p className="text-xs mt-1">マイクボタンをクリックまたは上記のショートカットを使用</p>
        </div>
      )}
    </div>
  )
}

export default VoiceRecording