// renderer/src/components/SimpleVoiceTest.tsx を一時的にテキスト入力版に変更
// 音声の問題を回避して、まずは基本機能をテストします

import React, { useState, useRef, useEffect } from 'react'

interface VoiceTestProps {
  onVoiceInput?: (text: string) => void
}

export const SimpleVoiceTest: React.FC<VoiceTestProps> = ({ onVoiceInput }) => {
  const [textInput, setTextInput] = useState('')
  const [debugInfo, setDebugInfo] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // command+enter で input にフォーカス
  useEffect(() => {
    console.log('🔧 ショートカットハンドラーを設定中...')
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('🔧 キー押下:', e.key, 'metaKey:', e.metaKey, 'ctrlKey:', e.ctrlKey)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        console.log('🔧 command+enter が検出されました！')
        e.preventDefault()
        if (inputRef.current) {
          console.log('🔧 input要素にフォーカス中...')
          inputRef.current.focus()
          console.log('🔧 フォーカス完了')
        } else {
          console.log('❌ input要素が見つかりません')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    console.log('🔧 ショートカットハンドラー設定完了')
    return () => {
      console.log('🔧 ショートカットハンドラーを削除中...')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

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
    <div className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
            <span className="text-white text-lg">🔧</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              Cluely 機能テスト
            </h3>
            <p className="text-sm text-gray-600">テキスト入力でAI機能をテストできます</p>
          </div>
        </div>
        <button
          onClick={clearResults}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          <span>🗑️</span>
          <span>クリア</span>
        </button>
      </div>

      {/* メイン入力エリア */}
      <div className="mb-6 p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          💬 質問を入力してください
        </label>
        <div className="flex gap-3">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="例: この問題の答えは何ですか？画面の内容を説明してください。"
            className="flex-1 p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                testFullIntegration()
              }
            }}
          />
          <button
            onClick={testFullIntegration}
            disabled={!textInput.trim() || isProcessing}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
              !textInput.trim() || isProcessing
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-sm hover:shadow-md transform hover:scale-105'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>処理中</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>🚀</span>
                <span>実行</span>
              </div>
            )}
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          💡 <kbd className="px-1 py-0.5 bg-gray-100 rounded">Enter</kbd> で実行 | 
          <kbd className="px-1 py-0.5 bg-gray-100 rounded ml-1">Shift+Enter</kbd> で改行
        </div>
      </div>

      {/* デバッグテストボタン */}
      <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
          <span>🔧</span>
          <span>個別機能テスト</span>
        </h4>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={testElectronAPI}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            <span>1️⃣</span>
            <span>ElectronAPI</span>
          </button>
          <button
            onClick={testVoiceOnly}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            <span>2️⃣</span>
            <span>音声処理</span>
          </button>
          <button
            onClick={testScreenshot}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            <span>3️⃣</span>
            <span>スクリーンショット</span>
          </button>
        </div>
      </div>

      {/* デバッグ情報表示 */}
      {debugInfo && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700 text-sm">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium">🔧 {debugInfo}</span>
          </div>
        </div>
      )}

      {/* テスト結果一覧 */}
      {testResults.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>📊</span>
            <span>テスト結果</span>
          </label>
          <div className="max-h-48 p-4 border border-gray-200 rounded-lg bg-gray-50 overflow-y-auto space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-white rounded border text-sm">
                <div className="flex items-center justify-center w-5 h-5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  {result}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 使い方ガイド */}
      <div className="text-xs text-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
        <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-800">
          <span>💡</span>
          <span>テスト手順</span>
        </h4>
        <ol className="list-decimal list-inside space-y-1 text-blue-700">
          <li>🔧 「個別機能テスト」を順番に実行 (1→2→3)</li>
          <li>📝 テキスト欄に質問を入力 (例: この画面について説明して)</li>
          <li>🚀 「実行」ボタンをクリック または Enter キーを押す</li>
          <li>✅ AI回答が表示されることを確認</li>
        </ol>
        <div className="mt-3 p-2 bg-white rounded border border-blue-100">
          <p className="text-blue-600 font-medium">
            ✅ 音声認識の代わりにテキスト入力を使用 | ✅ 完全無料 | ✅ デバッグ機能付き
          </p>
        </div>
      </div>
    </div>
  )
}