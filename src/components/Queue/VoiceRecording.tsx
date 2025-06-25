// src/components/Queue/VoiceRecording.tsx
import React, { useState, useEffect, useRef } from "react"
import { IoMic, IoTrash } from "react-icons/io5"
import MarkdownRenderer from "../ui/MarkdownRenderer"

interface VoiceRecordingProps {
  onTranscriptChange?: (transcript: string) => void
  className?: string
}

const VoiceRecording: React.FC<VoiceRecordingProps> = ({ className = "" }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [finalAnalysis, setFinalAnalysis] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const startRecording = async () => {
    setError(null)
    setFinalAnalysis(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const base64Data = await blobToBase64(audioBlob)
        window.electronAPI.analyzeAudioChunk({ base64Data, mimeType: audioBlob.type })
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (err) {
      console.error("Failed to start recording:", err)
      setError("マイクへのアクセスに失敗しました。権限を確認してください。")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
      // ストリームのトラックを停止してマイクを解放
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false)
  }

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const handleClear = () => {
    setError(null)
    setFinalAnalysis(null)
    if (isRecording) {
      stopRecording()
    }
  }

  useEffect(() => {
    const cleanups = [
      window.electronAPI.onSpeechFinalAnalysis((data: any) => {
        setFinalAnalysis(data.text)
      }),
      window.electronAPI.onSpeechError((data: { error: string }) => {
        setError(data.error)
      }),
    ]
    return () => {
      cleanups.forEach(cleanup => cleanup())
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    }
  }, [])

  return (
    <div className={`bg-black/60 backdrop-blur-md rounded-lg ${className}`}>
      <div className="flex items-center gap-3 p-3 border-b border-white/10">
        <button
          onClick={handleToggleRecording}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
            isRecording ? "bg-red-500 hover:bg-red-600 text-white" : "bg-white/10 hover:bg-white/20 text-white/80"
          }`}
        >
          <IoMic className="w-4 h-4" />
          {isRecording ? "録音停止" : "録音開始"}
        </button>
        {(error || finalAnalysis) && (
          <button onClick={handleClear} className="flex items-center gap-1 p-2 text-xs text-white/60 hover:text-white/80 hover:bg-white/10 rounded">
            <IoTrash className="w-3 h-3" />
            クリア
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-500/20 text-red-300 text-sm">
          <strong>エラー:</strong> {error}
        </div>
      )}

      {finalAnalysis && (
        <div className="p-3 space-y-2">
          <h4 className="text-xs font-medium text-white/60">AI 分析結果</h4>
          <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20 text-sm">
            <MarkdownRenderer content={finalAnalysis} className="text-white/90" />
          </div>
        </div>
      )}

      {!isRecording && !finalAnalysis && !error && (
        <div className="p-6 text-center text-white/40 text-sm">
          <p>録音ボタンを押して音声分析を開始します</p>
        </div>
      )}
    </div>
  )
}

export default VoiceRecording