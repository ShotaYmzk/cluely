import React, { useState, useRef, useEffect } from 'react'

interface PromptInputModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (text: string) => void
  thinkingMode: boolean
  onThinkingModeChange: (enabled: boolean) => void
}

export const PromptInputModal: React.FC<PromptInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  thinkingMode,
  onThinkingModeChange
}) => {
  const [inputText, setInputText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // モーダルが開いたらinputに自動フォーカス
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // 少し遅延を入れてフォーカス（モーダルのレンダリング完了を待つ）
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleClose = () => {
    setInputText('')
    onClose()
  }

  const handleSubmit = () => {
    if (inputText.trim()) {
      onSubmit(inputText.trim())
      setInputText('')
      onClose()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />
      
      {/* モーダル本体 */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            🤖 AI に質問する
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Thinking Mode Toggle */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-800">🧠 Thinking Mode</span>
              <span className="text-xs text-blue-600">
                (より深く考えて回答)
              </span>
            </div>
            <button
              onClick={() => onThinkingModeChange(!thinkingMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                thinkingMode ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  thinkingMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {thinkingMode && (
            <div className="mt-2 text-xs text-blue-600">
              ✅ AIが思考過程を表示し、より正確な回答を提供します
            </div>
          )}
        </div>

        {/* 入力欄 */}
        <div className="mb-4">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="例: この問題の答えは何ですか？"
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        {/* ボタン */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={!inputText.trim()}
            className={`px-4 py-2 rounded-lg font-medium ${
              inputText.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            送信
          </button>
        </div>

        {/* ショートカットヒント */}
        <div className="mt-3 text-xs text-gray-500 text-center">
          💡 <kbd className="px-1 py-0.5 bg-gray-200 rounded">Enter</kbd> で送信 | 
          <kbd className="px-1 py-0.5 bg-gray-200 rounded">Shift+Enter</kbd> で改行 |
          <kbd className="px-1 py-0.5 bg-gray-200 rounded">Esc</kbd> で閉じる
        </div>
      </div>
    </div>
  )
} 