import React, { useState, useEffect, useRef } from "react"
import MarkdownRenderer from "./components/ui/MarkdownRenderer"
import "./index.css"

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: number
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [isInputExpanded, setIsInputExpanded] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自動サイズ調整
  useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      if (!containerRef.current) return
      const height = containerRef.current.scrollHeight
      const width = containerRef.current.scrollWidth
      window.electronAPI?.updateContentDimensions({ width, height })
    }

    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(containerRef.current)
    updateDimensions()

    return () => resizeObserver.disconnect()
  }, [messages, streamingContent, isInputExpanded])

  // メッセージを最下部にスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  // Electronイベントハンドラー
  useEffect(() => {
    if (!window.electronAPI) return

    const cleanupFunctions = [
      // Command+R でチャット履歴をクリア
      window.electronAPI.onResetView(() => {
        console.log("履歴をクリア")
        setMessages([])
        setStreamingContent("")
        setIsStreaming(false)
        setIsInputExpanded(false)
      }),

      // Command+Enter での分析プロンプト表示時に入力画面を展開
      window.electronAPI.onShowAnalysisPrompt ? window.electronAPI.onShowAnalysisPrompt(() => {
        setIsInputExpanded(true)
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus()
          }
        }, 100)
      }) : (() => {}),

      // アプリ表示時に最小状態に
      ...(window.electronAPI.onShow ? [window.electronAPI.onShow(() => {
        // アプリ表示時は最小状態から開始
      })] : [])
    ]

    return () => cleanupFunctions.filter(Boolean).forEach(cleanup => cleanup?.())
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedInput = inputValue.trim()
    
    if (isStreaming) return

    // テキストがない場合は画面分析のみ実行
    if (!trimmedInput) {
      await handleScreenAnalysis()
      return
    }

    // テキストがある場合は従来の処理
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: trimmedInput,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsStreaming(true)
    setStreamingContent("")

    try {
      // 画面+テキストプロンプトをLLMに送信
      const response = await handleScreenAnalysisWithPrompt(trimmedInput)
      
      // ストリーミング効果
      let index = 0
      const streamInterval = setInterval(() => {
        setStreamingContent(response.slice(0, index))
        index += Math.floor(Math.random() * 3) + 1
        
        if (index >= response.length) {
          setStreamingContent(response)
          clearInterval(streamInterval)
          
          // 最終的なメッセージを追加
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: response,
            timestamp: Date.now()
          }
          
          setMessages(prev => [...prev, assistantMessage])
          setStreamingContent("")
          setIsStreaming(false)
          
          // 入力フィールドにフォーカスを戻す
          if (inputRef.current) {
            inputRef.current.focus()
          }
        }
      }, 30)

    } catch (error) {
      console.error("AI応答エラー:", error)
      setIsStreaming(false)
      setStreamingContent("")
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "申し訳ございませんが、エラーが発生しました。もう一度お試しください。",
        timestamp: Date.now()
      }
      
      setMessages(prev => [...prev, errorMessage])
    }
  }

  // 画面分析のみの処理
  const handleScreenAnalysis = async () => {
    setIsStreaming(true)
    setStreamingContent("")

    try {
      // スクリーンショット撮影 + 音声（リスニング中の場合）をLLMに送信
      const response = await window.electronAPI?.analyzeCurrentScreen()
      
      // ストリーミング効果
      let index = 0
      const streamInterval = setInterval(() => {
        setStreamingContent(response.slice(0, index))
        index += Math.floor(Math.random() * 3) + 1
        
        if (index >= response.length) {
          setStreamingContent(response)
          clearInterval(streamInterval)
          
          const assistantMessage: Message = {
            id: Date.now().toString(),
            type: 'assistant',
            content: response,
            timestamp: Date.now()
          }
          
          setMessages(prev => [...prev, assistantMessage])
          setStreamingContent("")
          setIsStreaming(false)
          
          if (inputRef.current) {
            inputRef.current.focus()
          }
        }
      }, 30)

    } catch (error) {
      console.error("画面分析エラー:", error)
      setIsStreaming(false)
      setStreamingContent("")
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: "画面分析中にエラーが発生しました。",
        timestamp: Date.now()
      }
      
      setMessages(prev => [...prev, errorMessage])
    }
  }

  // 画面分析+テキストプロンプトの処理
  const handleScreenAnalysisWithPrompt = async (prompt: string): Promise<string> => {
    try {
      // スクリーンショットを撮って、プロンプトと一緒に分析
      const screenshotResult = await window.electronAPI?.takeScreenshot()
      if (screenshotResult?.success && screenshotResult.path) {
        const response = await window.electronAPI?.analyzeScreenWithPrompt(screenshotResult.path, prompt)
        return response?.text || "分析結果を取得できませんでした。"
      } else {
        throw new Error("スクリーンショットの撮影に失敗しました。")
      }
    } catch (error) {
      throw error
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
    if (e.key === 'Escape') {
      setIsInputExpanded(false)
      setInputValue("")
    }
  }

  // 機能ボタンのハンドラー
  const handleListenToggle = async () => {
    try {
      if (isListening) {
        const result = await window.electronAPI?.stopRecording()
        if (result?.success) {
          setIsListening(false)
        }
      } else {
        const result = await window.electronAPI?.startRecording()
        if (result?.success) {
          setIsListening(true)
        }
      }
    } catch (error) {
      console.error("音声録音エラー:", error)
    }
  }

  const handleAskPrompt = () => {
    setIsInputExpanded(true)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
  }

  const handleShowHide = () => {
    window.electronAPI?.toggleWindow()
  }

  // 録音状態の監視
  useEffect(() => {
    if (!window.electronAPI) return

    const checkRecordingStatus = async () => {
      try {
        const result = await window.electronAPI.isRecording()
        setIsListening(result?.isRecording || false)
      } catch (error) {
        console.error("録音状態の確認エラー:", error)
      }
    }

    // 初期状態を確認
    checkRecordingStatus()

    // 録音状態の変更をリッスン
    const cleanupRecordingStarted = window.electronAPI.onSpeechRecordingStarted?.(() => {
      setIsListening(true)
    })

    const cleanupRecordingStopped = window.electronAPI.onSpeechRecordingStopped?.(() => {
      setIsListening(false)
    })

    return () => {
      cleanupRecordingStarted?.()
      cleanupRecordingStopped?.()
    }
  }, [])

  // メインコンテンツが表示されているかどうか
  const hasContent = messages.length > 0 || isStreaming || isInputExpanded

  return (
    <div 
      ref={containerRef}
      className={`transition-all duration-300 ease-in-out ${
        hasContent 
          ? "min-h-0 max-w-lg mx-auto bg-black/20 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl" 
          : "w-auto mx-auto"
      }`}
      style={{ cursor: 'default' }}
    >
      {!hasContent ? (
        // ミニマル表示状態
        <div 
          className="flex items-center justify-center gap-2 px-2 py-2 bg-black/20 backdrop-blur-md rounded-lg border border-white/10 shadow-lg"
          style={{ minWidth: '280px', maxWidth: '320px' }}
        >
          <button
            onClick={handleListenToggle}
            className={`text-sm font-medium transition-colors ${
              isListening ? 'text-green-400' : 'text-white/80 hover:text-white'
            }`}
            style={{ cursor: 'default' }}
          >
            {isListening ? 'listening' : 'listen'}
          </button>
          
          <button
            onClick={handleAskPrompt}
            className="text-white/60 hover:text-white text-sm transition-colors"
            style={{ cursor: 'default' }}
          >
            ask⌘+↩︎
          </button>
          
          <button
            onClick={handleShowHide}
            className="text-white/60 hover:text-white text-sm transition-colors"
            style={{ cursor: 'default' }}
          >
            show/hide ⌘+B
          </button>
          
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="text-white/60 hover:text-white/80 text-sm transition-colors"
            style={{ cursor: 'default' }}
          >
            ...
          </button>
          
          {showHelp && (
            <div className="absolute top-full left-0 mt-2 p-3 bg-black/90 backdrop-blur-md rounded-lg border border-white/20 shadow-xl z-50 text-xs text-white/80 whitespace-nowrap">
              <div className="space-y-1">
                <div><span className="text-white/60">Command + B:</span> アプリの表示/非表示切り替え</div>
                <div><span className="text-white/60">Command + Enter:</span> 画面分析（音声録音中なら音声+画面分析）</div>
                <div><span className="text-white/60">Command + R:</span> 音声録音の開始/停止</div>
                <div><span className="text-white/60">Command + H:</span> スクリーンショット撮影</div>
                <div><span className="text-white/60">Shift + Enter:</span> 改行</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // 展開表示状態
        <>
          {/* メッセージエリア - 入力画面のみの場合は非表示 */}
          {(messages.length > 0 || isStreaming) && (
            <div className="px-4 py-3 max-h-96 overflow-y-auto border-b border-white/10">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 ${message.type === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <div
                    className={`inline-block max-w-[80%] p-3 rounded-lg text-sm ${
                      message.type === 'user'
                        ? 'bg-blue-600/80 text-white ml-auto'
                        : 'bg-white/10 text-white/90 mr-auto'
                    }`}
                  >
                    {message.type === 'assistant' ? (
                      <MarkdownRenderer 
                        content={message.content} 
                        className="text-sm leading-relaxed"
                      />
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}
                  </div>
                </div>
              ))}

              {/* ストリーミング中のメッセージ */}
              {isStreaming && (
                <div className="mb-4 text-left">
                  <div className="inline-block max-w-[80%] p-3 rounded-lg text-sm bg-white/10 text-white/90 mr-auto">
                    <MarkdownRenderer 
                      content={streamingContent} 
                      className="text-sm leading-relaxed"
                    />
                    <span className="inline-block w-2 h-4 bg-white/60 ml-1 animate-pulse" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* 入力エリア */}
          {isInputExpanded && (
            <div className="p-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="画面について質問する（空白のままEnterで画面分析のみ実行）..."
                  disabled={isStreaming}
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent disabled:opacity-50 resize-none"
                  style={{ cursor: 'text' }}
                />
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsInputExpanded(false)
                      setInputValue("")
                    }}
                    className="px-3 py-1 text-xs text-white/60 hover:text-white/80 transition-colors"
                    style={{ cursor: 'default' }}
                  >
                    ESC: 閉じる
                  </button>
                  <button
                    type="submit"
                    disabled={isStreaming}
                    className="px-4 py-2 bg-blue-600/80 hover:bg-blue-600/90 disabled:bg-white/10 disabled:text-white/30 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                    style={{ cursor: 'default' }}
                  >
                    {isStreaming ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      inputValue.trim() ? "分析" : "画面分析"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ミニマルヘッダー */}
          <div className="absolute top-2 right-2 flex items-center gap-2">
            <button 
              onClick={() => setShowHelp(!showHelp)}
              className="text-white/40 hover:text-white/60 text-xs transition-colors"
              style={{ cursor: 'default' }}
            >
              ...
            </button>
            {showHelp && (
              <div className="absolute top-full right-0 mt-2 p-3 bg-black/90 backdrop-blur-md rounded-lg border border-white/20 shadow-xl z-50 text-xs text-white/80 whitespace-nowrap">
                <div className="space-y-1">
                  <div><span className="text-white/60">Command + B:</span> アプリの表示/非表示切り替え</div>
                  <div><span className="text-white/60">Command + Enter:</span> 画面分析（音声録音中なら音声+画面分析）</div>
                  <div><span className="text-white/60">Command + R:</span> 音声録音の開始/停止</div>
                  <div><span className="text-white/60">Command + H:</span> スクリーンショット撮影</div>
                  <div><span className="text-white/60">Shift + Enter:</span> 改行</div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default App