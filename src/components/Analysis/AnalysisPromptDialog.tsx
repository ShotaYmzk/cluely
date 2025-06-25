// src/components/Analysis/AnalysisPromptDialog.tsx
import React, { useState, useEffect, useRef } from "react"
import { IoClose, IoSend, IoImage, IoSparkles, IoTime } from "react-icons/io5"

interface AnalysisPromptDialogProps {
  isVisible: boolean
  onClose: () => void
  onSubmit: (prompt: string, autoCapture: boolean) => Promise<void>
  isLoading: boolean
}

const AnalysisPromptDialog: React.FC<AnalysisPromptDialogProps> = ({
  isVisible,
  onClose,
  onSubmit,
  isLoading
}) => {
  const [prompt, setPrompt] = useState("")
  const [autoCapture, setAutoCapture] = useState(true)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isVisible])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isVisible) return

      if (event.key === "Escape") {
        handleClose()
      } else if (event.key === "Enter") {
        if (event.metaKey || event.ctrlKey) {
          // Cmd/Ctrl + Enter で送信
          event.preventDefault()
          handleSubmit()
        } else if (!event.shiftKey) {
          // Enterのみで送信（Shift+Enterは改行）
          event.preventDefault()
          handleSubmit()
        }
      }
    }

    if (isVisible) {
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVisible, prompt, autoCapture])

  const handleClose = () => {
    if (!isLoading) {
      setPrompt("")
      onClose()
    }
  }

  const handleSubmit = async () => {
    if (isLoading) return

    try {
      await onSubmit(prompt.trim(), autoCapture)
      setPrompt("")
    } catch (error) {
      console.error("Analysis submission failed:", error)
    }
  }

  const handleAutoAnalysis = async () => {
    if (isLoading) return

    try {
      // 空のプロンプトで自動分析を実行
      await onSubmit("", true)
      setPrompt("")
    } catch (error) {
      console.error("Auto analysis failed:", error)
    }
  }

  const hasPrompt = prompt.trim().length > 0

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <IoSparkles className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">画面分析</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
          >
            <IoClose className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Auto Capture Option */}
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded border border-white/10">
            <input
              type="checkbox"
              id="autoCapture"
              checked={autoCapture}
              onChange={(e) => setAutoCapture(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 text-blue-500 bg-transparent border-white/30 rounded focus:ring-blue-500/50 disabled:opacity-50"
            />
            <label htmlFor="autoCapture" className="flex items-center gap-2 text-white/90 text-sm cursor-pointer">
              <IoImage className="w-4 h-4" />
              <span>自動でスクリーンショットを撮影</span>
            </label>
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="block text-white/90 text-sm font-medium">
              質問・指示内容 (省略可)
            </label>
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
              placeholder="画面について質問したいことを入力してください。空白の場合は自動で分析します。"
              className="w-full h-24 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/50 resize-none disabled:opacity-50"
            />
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>Enter: 送信 | Shift+Enter: 改行 | Esc: キャンセル</span>
              <span>{prompt.length}/500</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Auto Analysis Button */}
            <button
              onClick={handleAutoAnalysis}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/80 hover:bg-blue-500/90 text-white text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>分析中...</span>
                </>
              ) : (
                <>
                  <IoSparkles className="w-4 h-4" />
                  <span>自動分析</span>
                </>
              )}
            </button>

            {/* Submit with Prompt Button */}
            {hasPrompt && (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/80 hover:bg-green-500/90 text-white text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>分析中...</span>
                  </>
                ) : (
                  <>
                    <IoSend className="w-4 h-4" />
                    <span>質問して分析</span>
                  </>
                )}
              </button>
            )}

            {/* Cancel Button */}
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-white/70 hover:text-white/90 text-sm transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
          </div>

          {/* Help Text */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded text-blue-300 text-sm">
            <h4 className="font-medium mb-1">使い方</h4>
            <ul className="space-y-1 text-xs text-blue-300/80">
              <li>• <strong>自動分析:</strong> 画面の内容を自動で分析し、問題点や改善案を提案</li>
              <li>• <strong>質問して分析:</strong> 具体的な質問を入力して、その内容に特化した分析</li>
              <li>• <strong>ショートカット:</strong> Cmd/Ctrl+Enter でこのダイアログを開けます</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalysisPromptDialog
