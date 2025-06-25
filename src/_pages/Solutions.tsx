// src/_pages/Solutions.tsx

/// <reference path="../types/electron.d.ts" />

import React, { useState, useEffect, useRef } from "react"
import MarkdownRenderer from "../components/ui/MarkdownRenderer"
import SolutionCommands from "../components/Solutions/SolutionCommands"
import {
  Toast,
  ToastDescription,
  ToastMessage,
  ToastTitle,
  ToastVariant
} from "../components/ui/toast"

interface SolutionsProps {
  setView: React.Dispatch<React.SetStateAction<"queue" | "solutions" | "debug">>
}

const Solutions: React.FC<SolutionsProps> = ({ setView }) => {
  const [llmResponse, setLlmResponse] = useState("")
  const [isStreaming, setIsStreaming] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<ToastMessage>({ title: "", description: "", variant: "neutral" })
  
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const showToast = (title: string, description: string, variant: ToastVariant) => {
    setToastMessage({ title, description, variant })
    setToastOpen(true)
  }

  useEffect(() => {
    // ストリーミングイベントの購読
    const cleanupFunctions = [
      window.electronAPI.onLlmChunk((chunk: string) => {
        setIsStreaming(true)
        setError(null) // 新しいデータが来たらエラーをクリア
        setLlmResponse((prev) => prev + chunk)
      }),
      window.electronAPI.onLlmStreamEnd(() => {
        setIsStreaming(false)
      }),
      window.electronAPI.onLlmError((errorMessage: string) => {
        setError(errorMessage)
        setIsStreaming(false)
        showToast("エラー", "応答の生成中にエラーが発生しました。", "error")
      }),
      window.electronAPI.onResetView(() => {
        setView("queue")
      })
    ]

    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [setView])

  useEffect(() => {
    // コンテンツの高さに応じてウィンドウサイズを調整し、自動スクロール
    const updateAndScroll = () => {
      if (contentRef.current) {
        const contentHeight = contentRef.current.scrollHeight
        const contentWidth = contentRef.current.scrollWidth
        window.electronAPI.updateContentDimensions({
          width: contentWidth,
          height: contentHeight
        })
      }
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }
    
    updateAndScroll();

    const resizeObserver = new ResizeObserver(updateAndScroll)
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [llmResponse, error]) // レスポンスかエラーが更新されるたびに実行

  return (
    <div ref={contentRef} className="w-full h-full">
      <div className="relative space-y-3 px-4 py-3">
        <Toast
          open={toastOpen}
          onOpenChange={setToastOpen}
          variant={toastMessage.variant}
          duration={3000}
        >
          <ToastTitle>{toastMessage.title}</ToastTitle>
          <ToastDescription>{toastMessage.description}</ToastDescription>
        </Toast>

        <SolutionCommands extraScreenshots={[]} />

        <div 
          ref={scrollRef} 
          className="w-full text-sm text-white bg-black/60 rounded-md overflow-y-auto max-h-[80vh]"
        >
          <div className="p-4 min-h-[50px]">
            {llmResponse ? (
              <MarkdownRenderer content={llmResponse} className="text-[13px]" />
            ) : isStreaming ? (
              <p className="text-gray-300 animate-pulse">応答を生成中...</p>
            ) : null}
            
            {isStreaming && !error && (
              <div className="inline-block h-4 w-1 bg-white animate-pulse ml-1 align-bottom" />
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-md">
                <p className="text-red-300 font-semibold">エラーが発生しました:</p>
                <p className="text-red-400 text-xs mt-1 whitespace-pre-wrap">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Solutions