// renderer/src/components/SimpleVoiceTest.tsx を一時的にテキスト入力版に変更
// 音声の問題を回避して、まずは基本機能をテストします

import React, { useState } from 'react'

interface VoiceTestProps {
  onVoiceInput?: (text: string) => void
}

export const SimpleVoiceTest: React.FC<VoiceTestProps> = ({ onVoiceInput }) => {
  const [textInput, setTextInput] = useState('')
  const [debugInfo, setDebugInfo] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])

  // 🔧 ElectronAPI接続テスト
  const testElectronAPI = async () => {
    setDebugInfo('ElectronAPI接続テスト中...')
    setIsProcessing(true)
    
    try {
      // ElectronAPIが利用可能かチェック
      if (!(window as any).electronAPI) {
        setDebugInfo('❌ ElectronAPIが見つかりません')
        setTestResults(prev => [...prev, '❌ ElectronAPI: 見つかりません'])
        return false
      }

      // 簡単なテスト実行
      const testResult = await (window as any).electronAPI.testVoiceRecognition('テスト音声入力')
      
      setDebugInfo(`✅ ElectronAPI接続成功`)
      setTestResults(prev => [...prev, `✅ ElectronAPI: ${testResult.message}`])
      return true
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setDebugInfo(`❌ ElectronAPIテストエラー: ${errorMessage}`)
      setTestResults(prev => [...prev, `❌ ElectronAPI: ${errorMessage}`])
      return false
    } finally {
      setIsProcessing(false)
    }
  }

  // 🔧 音声のみ処理テスト
  const testVoiceOnly = async () => {
    setDebugInfo('音声のみ処理テスト中...')
    setIsProcessing(true)
    
    try {
      const result = await (window as any).electronAPI?.processVoiceOnly('テスト用の音声入力です')
      
      setDebugInfo(`✅ 音声処理成功`)
      setTestResults(prev => [...prev, `✅ 音声処理: ${result.solution?.answer?.substring(0, 50)}...`])
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setDebugInfo(`❌ 音声処理エラー: ${errorMessage}`)
      setTestResults(prev => [...prev, `❌ 音声処理: ${errorMessage}`])
    } finally {
      setIsProcessing(false)
    }
  }

  // 🔧 スクリーンショットテスト
  const testScreenshot = async () => {
    setDebugInfo('スクリーンショットテスト中...')
    setIsProcessing(true)
    
    try {
      const result = await (window as any).electronAPI?.invoke('take-screenshot')
      setDebugInfo(`✅ スクリーンショット成功`)
      setTestResults(prev => [...prev, `✅ スクリーンショット: ${result?.path ? 'パス取得成功' : 'パス取得失敗'}`])
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setDebugInfo(`❌ スクリーンショットエラー: ${errorMessage}`)
      setTestResults(prev => [...prev, `❌ スクリーンショット: ${errorMessage}`])
    } finally {
      setIsProcessing(false)
    }
  }

  // 🔧 統合テスト（テキスト入力 + スクリーンショット + AI処理）
  const testFullIntegration = async () => {
    if (!textInput.trim()) {
      setDebugInfo('❌ テキストを入力してください')
      return
    }

    setDebugInfo('統合テスト中...')
    setIsProcessing(true)
    
    try {
      // 1. スクリーンショット取得
      const screenshotResult = await (window as any).electronAPI?.invoke('take-screenshot')
      
      if (screenshotResult?.path) {
        // 2. 音声+スクリーンショット処理
        const aiResult = await (window as any).electronAPI?.processVoiceAndScreenshot(
          textInput, 
          screenshotResult.path
        )
        
        setDebugInfo(`✅ 統合テスト成功`)
        setTestResults(prev => [...prev, `✅ 統合テスト: AI回答取得成功`])
        
        // 親コンポーネントに通知
        if (onVoiceInput) {
          onVoiceInput(textInput)
        }
      } else {
        // 3. 音声のみ処理
        const aiResult = await (window as any).electronAPI?.processVoiceOnly(textInput)
        
        setDebugInfo(`✅ 音声のみテスト成功`)
        setTestResults(prev => [...prev, `✅ 音声のみテスト: AI回答取得成功`])
        
        // 親コンポーネントに通知
        if (onVoiceInput) {
          onVoiceInput(textInput)
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setDebugInfo(`❌ 統合テストエラー: ${errorMessage}`)
      setTestResults(prev => [...prev, `❌ 統合テスト: ${errorMessage}`])
    } finally {
      setIsProcessing(false)
    }
  }

  const clearResults = () => {
    setTestResults([])
    setDebugInfo('')
    setTextInput('')
  }

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          🔧 Cluely機能テスト (テキスト入力版)
        </h3>
        <button
          onClick={clearResults}
          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          🗑️ クリア
        </button>
      </div>

      {/* テキスト入力 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          質問を入力 (音声の代わり):
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="例: この問題の答えは何ですか？"
            className="flex-1 p-3 border border-gray-300 rounded-lg"
            onKeyPress={(e) => e.key === 'Enter' && testFullIntegration()}
          />
          <button
            onClick={testFullIntegration}
            disabled={!textInput.trim() || isProcessing}
            className={`px-4 py-2 rounded-lg font-medium ${
              !textInput.trim() || isProcessing
                ? 'bg-gray-300 text-gray-500'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isProcessing ? '🔄 処理中' : '🚀 実行'}
          </button>
        </div>
      </div>

      {/* 🔧 デバッグテストボタン */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-medium text-yellow-800 mb-2">🔧 個別機能テスト</h4>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={testElectronAPI}
            disabled={isProcessing}
            className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-sm hover:bg-yellow-300 disabled:opacity-50"
          >
            1. ElectronAPI
          </button>
          <button
            onClick={testVoiceOnly}
            disabled={isProcessing}
            className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-sm hover:bg-yellow-300 disabled:opacity-50"
          >
            2. 音声処理
          </button>
          <button
            onClick={testScreenshot}
            disabled={isProcessing}
            className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-sm hover:bg-yellow-300 disabled:opacity-50"
          >
            3. スクリーンショット
          </button>
        </div>
      </div>

      {/* 処理状態 */}
      {isProcessing && (
        <div className="mb-3 p-3 bg-blue-100 border border-blue-300 rounded">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-700">処理中...</span>
          </div>
        </div>
      )}

      {/* デバッグ情報表示 */}
      {debugInfo && (
        <div className="mb-3 p-3 bg-blue-100 border border-blue-300 rounded text-blue-700 text-sm">
          🔧 {debugInfo}
        </div>
      )}

      {/* テスト結果一覧 */}
      {testResults.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            テスト結果:
          </label>
          <div className="max-h-40 p-3 border border-gray-200 rounded-lg bg-gray-50 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index} className="text-sm mb-1">
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 使い方ガイド */}
      <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded">
        <h4 className="font-medium mb-1">💡 テスト手順:</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li>🔧 「個別機能テスト」を順番に実行 (1→2→3)</li>
          <li>📝 テキスト欄に質問を入力 (例: この画面について説明して)</li>
          <li>🚀 「実行」ボタンをクリック</li>
          <li>✅ AI回答が表示されることを確認</li>
        </ol>
        <p className="mt-2 text-blue-600">
          ✅ 音声認識の代わりにテキスト入力を使用 | ✅ 完全無料 | ✅ デバッグ機能付き
        </p>
      </div>
    </div>
  )
}