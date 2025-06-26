// renderer/src/App.tsx を更新
// 既存の内容を以下に置き換え

import React, { useState } from 'react'
import './App.css'
import { SimpleVoiceTest } from '../components/SimpleVoiceTest'

function App() {
  const [voiceInputHistory, setVoiceInputHistory] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiResponse, setAiResponse] = useState('')

  // 音声入力を受け取った時の処理
  const handleVoiceInput = async (voiceText: string) => {
    console.log('🎤 音声入力を受け取りました:', voiceText)
    
    // 音声入力履歴に追加
    setVoiceInputHistory(prev => [...prev.slice(-4), voiceText])
    
    // AI処理開始
    setIsProcessing(true)
    
    try {
      // 既存のElectron IPC経由でスクリーンショット取得
      const screenshotResult = await (window as any).electronAPI?.takeScreenshot()
      
      if (screenshotResult && screenshotResult.success && screenshotResult.path) {
        // 音声入力とスクリーンショットを組み合わせてAI処理
        const response = await processVoiceAndScreenshot(voiceText, screenshotResult.path)
        setAiResponse(response)
      } else {
        // スクリーンショットなしで音声のみ処理
        const response = await processVoiceOnly(voiceText)
        setAiResponse(response)
      }
    } catch (error: unknown) {
      console.error('AI処理エラー:', error)
      // エラーオブジェクトの型ガード
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setAiResponse('処理中にエラーが発生しました: ' + errorMessage)
    }
    
    setIsProcessing(false)
  }

  // 音声とスクリーンショットを組み合わせて処理
  const processVoiceAndScreenshot = async (voiceText: string, screenshotPath: string): Promise<string> => {
    try {
      // 既存のLLMHelperを使用
      const result = await (window as any).electronAPI?.invoke('process-voice-and-screenshot', {
        voiceText,
        screenshotPath
      })
      
      return result?.solution?.answer || result?.answer || 'AI応答を取得できませんでした'
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error('音声+画面解析処理に失敗しました: ' + errorMessage)
    }
  }

  // 音声のみで処理
  const processVoiceOnly = async (voiceText: string): Promise<string> => {
    try {
      // シンプルな音声のみの処理
      const result = await (window as any).electronAPI?.invoke('process-voice-only', {
        voiceText
      })
      
      return result?.solution?.answer || result?.answer || `音声入力「${voiceText}」を受け取りました。画面をキャプチャして詳細な分析を行うには、スクリーンショット機能と組み合わせてください。`
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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            🚀 Cluely (無料版)
          </h1>
          <p className="text-gray-600">
            音声認識 + 画面解析 + AI回答の統合システム
          </p>
        </header>

        {/* 音声認識コンポーネント */}
        <div className="mb-6">
          <SimpleVoiceTest onVoiceInput={handleVoiceInput} />
        </div>

        {/* 処理状態表示 */}
        {isProcessing && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-blue-800 font-medium">
                AI処理中... 画面を解析しています
              </span>
            </div>
          </div>
        )}

        {/* AI応答表示 */}
        {aiResponse && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-bold text-green-800 mb-3">
              🤖 AI応答
            </h3>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-green-700 bg-white p-3 rounded border">
                {aiResponse}
              </pre>
            </div>
          </div>
        )}

        {/* 音声入力履歴 */}
        {voiceInputHistory.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              📝 音声入力履歴
            </h3>
            <div className="space-y-2">
              {voiceInputHistory.map((input, index) => (
                <div key={index} className="p-2 bg-white rounded border text-sm">
                  <span className="text-gray-500">#{index + 1}:</span> {input}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 機能説明 */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-bold text-blue-800 mb-3">
            💡 使い方
          </h3>
          <div className="space-y-2 text-blue-700 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-medium">🎤 音声入力:</span>
              <span>「この問題の答えは何ですか」「このコードを説明して」など</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">📸 自動画面解析:</span>
              <span>音声入力と同時に画面をキャプチャしてAIが解析</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">🤖 AI応答:</span>
              <span>Gemini 1.5 Flash（無料）が音声+画面の内容を総合的に回答</span>
            </div>
          </div>
        </div>

        {/* 既存の機能との連携案内 */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
          <strong>🔧 開発中:</strong> 
          既存のスクリーンショット機能との統合、ステルス性向上、プロンプト管理など
        </div>
      </div>
    </div>
  )
}

export default App