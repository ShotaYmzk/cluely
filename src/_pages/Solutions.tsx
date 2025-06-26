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
// ★★★ 変更点: 新しいコンポーネントをインポート ★★★
import { ContentSection } from "../components/Solutions/ContentSection"
import { ComplexitySection } from "../components/Solutions/ComplexitySection"
import { useQueryClient } from "react-query"

interface SolutionsProps {
  setView: React.Dispatch<React.SetStateAction<"queue" | "solutions" | "debug">>
}

const Solutions: React.FC<SolutionsProps> = ({ setView }) => {
  const [llmResponse, setLlmResponse] = useState("")
  const [isStreaming, setIsStreaming] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // ソリューションデータを管理するStateを追加
  const [solutionData, setSolutionData] = useState<any>(null)

  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<ToastMessage>({ title: "", description: "", variant: "neutral" })
  
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient();

  const showToast = (title: string, description: string, variant: ToastVariant) => {
    setToastMessage({ title, description, variant })
    setToastOpen(true)
  }

  useEffect(() => {
    let accumulatedData = "";
    const cleanupFunctions = [
      window.electronAPI.onLlmChunk((chunk: string) => {
        setIsStreaming(true)
        setError(null)
        accumulatedData += chunk;
        setLlmResponse(accumulatedData)
      }),
      window.electronAPI.onLlmStreamEnd(() => {
        setIsStreaming(false)
        try {
          // ストリーミング完了後にJSONとしてパース
          const parsedData = JSON.parse(accumulatedData);
          setSolutionData(parsedData);
          queryClient.setQueryData("solution", parsedData); // React Queryにキャッシュ
        } catch (e) {
          console.error("Failed to parse LLM response JSON:", e);
          setError("AIからの応答形式が正しくありません。");
          setSolutionData({ answer: accumulatedData }); // パース失敗時はテキストとして表示
        }
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
  }, [setView, queryClient])

  useEffect(() => {
    const updateAndScroll = () => {
      if (contentRef.current) {
        window.electronAPI.updateContentDimensions({
          width: contentRef.current.scrollWidth,
          height: contentRef.current.scrollHeight
        })
      }
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }
    
    updateAndScroll();
    const resizeObserver = new ResizeObserver(updateAndScroll)
    if (contentRef.current) resizeObserver.observe(contentRef.current)
    return () => resizeObserver.disconnect()
  }, [llmResponse, error, solutionData])

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
          className="w-full text-sm text-white bg-black/60 rounded-md overflow-y-auto max-h-[90vh]"
        >
          <div className="p-4 space-y-4 min-h-[50px]">
            {isStreaming && !solutionData && (
              <p className="text-gray-300 animate-pulse">AIが応答を生成中...</p>
            )}

            {solutionData && (
              <>
                <ContentSection
                  title="問題の要約"
                  isLoading={false}
                  content={
                    <MarkdownRenderer 
                      content={solutionData.problem_statement || "要約がありません。"} 
                      className="text-[13px]" 
                    />
                  }
                />
                <ContentSection
                  title="解決策"
                  isLoading={false}
                  content={
                    <MarkdownRenderer 
                      content={solutionData.answer || "解決策がありません。"} 
                      className="text-[13px]" 
                    />
                  }
                />
                <ContentSection
                  title="説明"
                  isLoading={false}
                  content={
                    <MarkdownRenderer 
                      content={solutionData.explanation || "説明がありません。"} 
                      className="text-[13px]" 
                    />
                  }
                />
                <ComplexitySection
                  isLoading={false}
                  timeComplexity={solutionData.complexity?.time || "N/A"}
                  spaceComplexity={solutionData.complexity?.space || "N/A"}
                />
              </>
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