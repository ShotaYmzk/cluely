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
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
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
  }, [messages, streamingContent])

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
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }),

      // アプリ表示時に入力フィールドにフォーカス
      ...(window.electronAPI.onShow ? [window.electronAPI.onShow(() => {
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus()
          }
        }, 100)
      })] : [])
    ]

    return () => cleanupFunctions.forEach(cleanup => cleanup())
  }, [])

  // アプリ起動時に入力フィールドにフォーカス
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedInput = inputValue.trim()
    if (!trimmedInput || isStreaming) return

    // ユーザーメッセージを追加
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
      // AIにメッセージを送信（仮実装 - 実際のAPI呼び出しに置き換え）
      const response = await simulateAIResponse(trimmedInput)
      
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

  // 仮のAI応答シミュレーション（実際のAPI呼び出しに置き換え）
  const simulateAIResponse = async (input: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (input.toLowerCase().includes("hello") || input.toLowerCase().includes("こんにちは")) {
      return "こんにちは！何かお手伝いできることはありますか？"
    }
    
    if (input.toLowerCase().includes("code") || input.toLowerCase().includes("コード")) {
      return `コードについて質問いただきありがとうございます。\n\n例えば、以下のようなJavaScriptコードがあります：\n\n\`\`\`javascript\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet("World"));\n\`\`\`\n\nこのコードは引数として渡された名前を使って挨拶メッセージを生成します。何か特定のコードについて質問がありますか？`
    }
    
    return `「${input}」について回答します。\n\nこれは画面のコンテキストを理解して、リアルタイムで応答するAIアシスタントのデモです。\n\n**特徴：**\n- ミニマルなデザイン\n- 即座の応答\n- ストリーミング表示\n- キーボードショートカット対応\n\n何か他にご質問はありますか？`
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-0 max-w-2xl mx-auto bg-black/20 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl"
      style={{ cursor: 'default' }}
    >
      {/* ヘッダー - ドラッグ可能エリア */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-white/10 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="text-white/90 font-medium text-sm">
            AI Assistant
          </div>
          <div className="text-xs text-white/50">
            ⌘+B: 表示切替 | ⌘+R: 履歴クリア
          </div>
        </div>
      </div>

      {/* メッセージエリア */}
      <div className="px-4 py-3 max-h-96 overflow-y-auto">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center py-8">
            <div className="text-white/60 text-sm mb-2">
              画面について質問してください
            </div>
            <div className="text-white/40 text-xs">
              Command + Enterで送信
            </div>
          </div>
        )}

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

      {/* 入力エリア */}
      <div className="p-4 border-t border-white/10 bg-gradient-to-r from-white/5 to-white/10 rounded-b-xl">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="画面について質問する..."
            disabled={isStreaming}
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent disabled:opacity-50"
            style={{ cursor: 'default' }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isStreaming}
            className="px-4 py-2 bg-blue-600/80 hover:bg-blue-600/90 disabled:bg-white/10 disabled:text-white/30 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
            style={{ cursor: 'default' }}
          >
            {isStreaming ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "送信"
            )}
          </button>
        </form>
        
        <div className="mt-2 text-xs text-white/40 text-center">
          Enter: 送信 | Shift+Enter: 改行
        </div>
      </div>
    </div>
  )
}

export default App