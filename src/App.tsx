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
  const helpButtonRef = useRef<HTMLButtonElement>(null)
  const helpPanelRef = useRef<HTMLDivElement>(null)

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
      setIsInputExpanded(false) // 送信後はAsk画面を閉じる
      handleSubmit(e as any)
    }
    if (e.key === 'Escape') {
      setIsInputExpanded(false)
      setInputValue("")
      setShowHelp(false) // Escape時はHelpも非表示
    }
  }

  // 機能ボタンのハンドラー
  const handleListenToggle = async () => {
    try {
      if (isListening) {
        await window.electronAPI?.stopRealtimeRecording()
      } else {
        await window.electronAPI?.startRealtimeRecording(true)
      }
    } catch (error) {
      console.error("音声録音の切り替えエラー:", error)
    }
  }

  const handleAskPrompt = () => {
    setIsInputExpanded(true)
    setShowHelp(false) // Ask画面を開くときはHelp非表示
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
  }

  const handleShowHide = () => {
    window.electronAPI?.toggleWindow()
  }

  const handleQuitApp = () => {
    window.electronAPI?.quitApp()
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
  const hasContent = messages.length > 0 || isStreaming

  // Helpパネル表示のハンドラー
  const handleMouseEnterHelp = () => {
    console.log('Help mouse enter')
    setShowHelp(true)
  }

  const handleMouseLeaveHelp = () => {
    console.log('Help mouse leave')
    // パネル内にマウスがあるかチェック
    setTimeout(() => {
      const helpButton = helpButtonRef.current
      const helpPanel = helpPanelRef.current
      
      if (helpButton && helpPanel) {
        const isMouseOverButton = helpButton.matches(':hover')
        const isMouseOverPanel = helpPanel.matches(':hover')
        
        if (!isMouseOverButton && !isMouseOverPanel) {
          setShowHelp(false)
        }
      } else {
        setShowHelp(false)
      }
    }, 100)
  }

  const handleMouseEnterPanel = () => {
    setShowHelp(true)
  }

  const handleMouseLeavePanel = () => {
    setTimeout(() => {
      const helpButton = helpButtonRef.current
      const helpPanel = helpPanelRef.current
      
      if (helpButton && helpPanel) {
        const isMouseOverButton = helpButton.matches(':hover')
        const isMouseOverPanel = helpPanel.matches(':hover')
        
        if (!isMouseOverButton && !isMouseOverPanel) {
          setShowHelp(false)
        }
      }
    }, 100)
  }

  return (
    <div 
      ref={containerRef}
      className="transition-all duration-300 ease-in-out w-auto mx-auto"
      style={{ cursor: 'default' }}
    >
      {/* 常にミニマルタブを表示 */}
      <div 
        className="relative flex items-center justify-center gap-10 px-2 py-2 bg-black/20 backdrop-blur-md rounded-lg border border-white/10 shadow-lg"
        style={{ minWidth: '280px', maxWidth: '500px' }}
      >
        <button
          onClick={handleListenToggle}
          className={`text-sm font-medium transition-colors ${
            isListening ? 'text-green-400' : 'text-white/80 hover:text-white'
          }`}
          style={{ cursor: 'default' }}
        >
          {isListening ? 'listening' : 'listen'} ⌘+M
        </button>
        <button
          onClick={handleAskPrompt}
          className="text-white/60 hover:text-white text-sm transition-colors"
          style={{ cursor: 'default' }}
        >
          ask ⌘+↩︎
        </button>
        <button
          onClick={handleShowHide}
          className="text-white/60 hover:text-white text-sm transition-colors"
          style={{ cursor: 'default' }}
        >
          show/hide ⌘+B
        </button>
        <button 
          ref={helpButtonRef}
          onMouseEnter={handleMouseEnterHelp}
          onMouseLeave={handleMouseLeaveHelp}
          className="text-white/60 hover:text-white/80 text-sm transition-colors"
          style={{ cursor: 'default' }}
        >
          help {showHelp ? '✓' : ''}
        </button>
        {showHelp && (
          <div 
            ref={helpPanelRef}
            onMouseEnter={handleMouseEnterPanel}
            onMouseLeave={handleMouseLeavePanel}
            className="absolute top-full right-0 mt-2 p-3 bg-black/96 backdrop-blur-lg rounded-lg border border-white/25 shadow-xl z-[100] text-xs text-white/85 w-[240px]"
          >
            <div className="space-y-2">
              {/* コンパクトなショートカット一覧 */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-white/75 text-xs">表示切替</span>
                  <span className="text-blue-300 font-mono text-xs">⌘B</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/75 text-xs">画面分析</span>
                  <span className="text-blue-300 font-mono text-xs">⌘↩︎</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/75 text-xs">履歴削除</span>
                  <span className="text-blue-300 font-mono text-xs">⌘R</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/75 text-xs">音声録音</span>
                  <span className="text-blue-300 font-mono text-xs">⌘M</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/75 text-xs">スクショ</span>
                  <span className="text-blue-300 font-mono text-xs">⌘H</span>
                </div>
              </div>
              
              {/* コンパクトなQuitボタン */}
              <div className="border-t border-white/20 pt-2 mt-3">
                <button
                  onClick={handleQuitApp}
                  className="w-full px-2 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors"
                  style={{ cursor: 'default' }}
                >
                  ✕ 終了
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 入力エリア - タブの下に追加表示 */}
      {isInputExpanded && (
        <div 
          className="mt-2 bg-black/20 backdrop-blur-md rounded-lg border border-white/10 shadow-lg"
          style={{ minWidth: '280px', maxWidth: '500px' }}
        >
          <form onSubmit={handleSubmit} className="p-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="画面について質問する..."
              disabled={isStreaming}
              rows={2}
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent disabled:opacity-50 resize-none"
              style={{ cursor: 'text' }}
            />
          </form>
        </div>
      )}

      {/* メッセージエリア - メッセージがある場合のみ表示 */}
      {hasContent && (
        <div 
          className="mt-2 bg-black/20 backdrop-blur-md rounded-lg border border-white/10 shadow-lg max-w-3xl"
        >
          <div className="px-4 py-3 max-h-96 overflow-y-auto">
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

          {/* ヘルプボタン */}
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
                  <div><span className="text-white/60">Command + R:</span> チャット履歴全消去・新しいチャット開始</div>
                  <div><span className="text-white/60">Command + M:</span> 音声録音の開始/停止</div>
                  <div><span className="text-white/60">Command + H:</span> スクリーンショット撮影</div>
                  <div><span className="text-white/60">Shift + Enter:</span> 改行</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App