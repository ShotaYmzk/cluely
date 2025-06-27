// renderer/src/App.tsx を更新
// 既存の内容を以下に置き換え

import React, { useState, useEffect } from 'react'
import './App.css'
import { SimpleVoiceTest } from '../components/SimpleVoiceTest'
import { PromptInputModal } from '../components/PromptInputModal'

function App() {
  const [voiceInputHistory, setVoiceInputHistory] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiResponse, setAiResponse] = useState('')
  const [aiThoughts, setAiThoughts] = useState('')
  const [isPromptModalOpen, setPromptModalOpen] = useState(false)
  const [thinkingMode, setThinkingMode] = useState(false)

  // command+enterでプロンプトモーダルを開く
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        console.log('🔧 command+enter でプロンプトモーダルを開きます')
        e.preventDefault()
        setPromptModalOpen(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    console.log('🔧 グローバルショートカット（command+enter）を設定しました')
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      console.log('🔧 グローバルショートカットを削除しました')
    }
  }, [])

  // thinking modeの変更をLLMHelperに通知
  const handleThinkingModeChange = async (enabled: boolean) => {
    setThinkingMode(enabled)
    try {
      await (window as any).electronAPI?.invoke('set-thinking-mode', enabled)
      console.log(`🧠 Thinking mode設定: ${enabled ? 'ON' : 'OFF'}`)
    } catch (error) {
      console.error('Thinking mode設定エラー:', error)
    }
  }

  // 音声入力を受け取った時の処理（既存のロジック + モーダルからの入力も対応）
  const handleVoiceInput = async (voiceText: string) => {
    console.log('🎤 音声入力を受け取りました:', voiceText)
    
    // 音声入力履歴に追加
    setVoiceInputHistory(prev => [...prev.slice(-4), voiceText])
    
    // AI処理開始
    setIsProcessing(true)
    setAiThoughts('')
    
    try {
      // 既存のElectron IPC経由でスクリーンショット取得
      const screenshotResult = await (window as any).electronAPI?.takeScreenshot()
      
      if (screenshotResult && screenshotResult.success && screenshotResult.path) {
        // 音声入力とスクリーンショットを組み合わせてAI処理
        const response = await processVoiceAndScreenshot(voiceText, screenshotResult.path)
        setAiResponse(response.text || response)
        if (response.thoughts) {
          setAiThoughts(response.thoughts)
        }
      } else {
        // スクリーンショットなしで音声のみ処理
        const response = await processVoiceOnly(voiceText)
        setAiResponse(response.text || response)
        if (response.thoughts) {
          setAiThoughts(response.thoughts)
        }
      }
    } catch (error: unknown) {
      console.error('AI処理エラー:', error)
      // エラーオブジェクトの型ガード
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setAiResponse('処理中にエラーが発生しました: ' + errorMessage)
    }
    
    setIsProcessing(false)
  }

  // プロンプトモーダルからの送信処理
  const handlePromptSubmit = async (promptText: string) => {
    console.log('💬 プロンプトモーダルから送信:', promptText)
    await handleVoiceInput(promptText)
  }

  // 音声とスクリーンショットを組み合わせて処理
  const processVoiceAndScreenshot = async (voiceText: string, screenshotPath: string): Promise<any> => {
    try {
      // 既存のLLMHelperを使用
      const result = await (window as any).electronAPI?.invoke('process-voice-and-screenshot', {
        voiceText,
        screenshotPath
      })
      
      return result?.solution || result || { text: 'AI応答を取得できませんでした' }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error('音声+画面解析処理に失敗しました: ' + errorMessage)
    }
  }

  // 音声のみで処理
  const processVoiceOnly = async (voiceText: string): Promise<any> => {
    try {
      // シンプルな音声のみの処理
      const result = await (window as any).electronAPI?.invoke('process-voice-only', {
        voiceText
      })
      
      return result?.solution || result || { text: `音声入力「${voiceText}」を受け取りました。画面をキャプチャして詳細な分析を行うには、スクリーンショット機能と組み合わせてください。` }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error('音声処理に失敗しました: ' + errorMessage)
    }
  }

  return (
    <div className="App">
      <div className="p-4 max-w-4xl mx-auto">
        {/* ヘッダー */}
        <header className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                🚀 Cluely 
                <span className="text-base font-normal px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  無料版
                </span>
              </h1>
              <p className="text-gray-600 mb-3">
                音声認識 + 画面解析 + AI回答の統合システム
              </p>
              
              {/* クイックアクション */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-blue-600">💡 Ask</span>
                  <kbd className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono">
                    ⌘+↩︎
                  </kbd>
                </div>
                
                {/* Thinking Mode Toggle - Compact */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg transition-all hover:shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-purple-700">🧠</span>
                    <span className="text-xs font-medium text-purple-700">
                      {thinkingMode ? 'Deep Think' : 'Fast Mode'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleThinkingModeChange(!thinkingMode)}
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-all duration-200 ${
                      thinkingMode 
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 shadow-sm' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    title={thinkingMode ? 'Thinking Mode ON - より深く考えて回答' : 'Thinking Mode OFF - 高速で回答'}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
                        thinkingMode ? 'translate-x-3.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* ステータス表示 */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Ready</span>
                  </div>
                  <span>|</span>
                  <span>Gemini 2.5 Flash-Lite</span>
                </div>
              </div>
            </div>
            
            {/* 右側のクイックアクション */}
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => setPromptModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
              >
                <span>✨</span>
                <span>クイック質問</span>
              </button>
              
              {/* 処理状態インジケータ */}
              {isProcessing && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>{thinkingMode ? '深く思考中...' : '処理中...'}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 音声認識コンポーネント */}
        <div className="mb-6">
          <SimpleVoiceTest onVoiceInput={handleVoiceInput} />
        </div>

        {/* AI思考過程表示 */}
        {aiThoughts && (
          <div className="mb-4 p-5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                <span className="text-purple-600">🧠</span>
              </div>
              <h3 className="text-lg font-bold text-purple-800">
                AI の思考過程
              </h3>
              <div className="flex-1"></div>
              <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                Deep Think モード
              </span>
            </div>
            <div className="bg-white p-4 rounded-lg border border-purple-100 shadow-sm">
              <pre className="whitespace-pre-wrap text-purple-700 text-sm leading-relaxed font-mono">
                {aiThoughts}
              </pre>
            </div>
          </div>
        )}

        {/* AI応答表示 */}
        {aiResponse && (
          <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                <span className="text-green-600">🤖</span>
              </div>
              <h3 className="text-lg font-bold text-green-800">
                AI応答
              </h3>
              <div className="flex-1"></div>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                Gemini 2.5 Flash-Lite
              </span>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
              <div className="prose prose-sm max-w-none text-green-800 leading-relaxed">
                <pre className="whitespace-pre-wrap font-sans">
                  {aiResponse}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* 音声入力履歴 */}
        {voiceInputHistory.length > 0 && (
          <div className="mb-6 p-5 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                <span className="text-gray-600">📝</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                音声入力履歴
              </h3>
              <div className="flex-1"></div>
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                最新 {voiceInputHistory.length} 件
              </span>
            </div>
            <div className="space-y-3">
              {voiceInputHistory.map((input, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 text-sm text-gray-700 leading-relaxed">
                    {input}
                  </div>
                  <div className="text-xs text-gray-400">
                    履歴
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 機能説明 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
              <span className="text-blue-600">💡</span>
            </div>
            <h3 className="text-lg font-bold text-blue-800">
              使い方ガイド
            </h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-sm">
                  ⌘
                </div>
                <div>
                  <div className="font-medium text-blue-800 text-sm">クイック質問</div>
                  <div className="text-blue-600 text-xs">⌘+Enter でどこからでも質問開始</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-purple-100">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full text-sm">
                  🧠
                </div>
                <div>
                  <div className="font-medium text-purple-800 text-sm">Deep Think モード</div>
                  <div className="text-purple-600 text-xs">AIが思考過程を表示し、より正確な回答</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-100">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full text-sm">
                  🎤
                </div>
                <div>
                  <div className="font-medium text-green-800 text-sm">音声入力</div>
                  <div className="text-green-600 text-xs">「この問題の答えは？」など自然に話しかけ</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-100">
                <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full text-sm">
                  📸
                </div>
                <div>
                  <div className="font-medium text-orange-800 text-sm">自動画面解析</div>
                  <div className="text-orange-600 text-xs">音声と同時に画面を自動キャプチャ</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-emerald-100">
                <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full text-sm">
                  🤖
                </div>
                <div>
                  <div className="font-medium text-emerald-800 text-sm">AI応答</div>
                  <div className="text-emerald-600 text-xs">Gemini 2.5 Flash-Lite による高速回答</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-pink-100">
                <div className="flex items-center justify-center w-8 h-8 bg-pink-100 rounded-full text-sm">
                  ✨
                </div>
                <div>
                  <div className="font-medium text-pink-800 text-sm">完全無料</div>
                  <div className="text-pink-600 text-xs">制限なしで使い放題</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 開発情報 */}
        <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 text-yellow-800">
            <span className="text-lg">🔧</span>
            <strong>開発中の機能:</strong> 
            <span className="text-sm">ステルス性向上、プロンプト管理、音声品質向上、マルチ言語対応</span>
          </div>
        </div>
      </div>

      {/* プロンプト入力モーダル */}
      <PromptInputModal
        isOpen={isPromptModalOpen}
        onClose={() => setPromptModalOpen(false)}
        onSubmit={handlePromptSubmit}
        thinkingMode={thinkingMode}
        onThinkingModeChange={handleThinkingModeChange}
      />
    </div>
  )
}

export default App