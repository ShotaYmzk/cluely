// src/_pages/Queue.tsx
import React, { useState, useEffect, useRef } from "react"
import { useQuery } from "react-query"
import ScreenshotQueue from "../components/Queue/ScreenshotQueue"
import {
  Toast,
  ToastTitle,
  ToastDescription,
  ToastVariant,
  ToastMessage
} from "../components/ui/toast"
import QueueCommands from "../components/Queue/QueueCommands"
import AnalysisPromptDialog from "../components/Analysis/AnalysisPromptDialog"

interface QueueProps {
  setView: React.Dispatch<React.SetStateAction<"queue" | "solutions" | "debug">>
}

const Queue: React.FC<QueueProps> = ({ setView }) => {
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<ToastMessage>({
    title: "",
    description: "",
    variant: "neutral"
  })

  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const [tooltipHeight, setTooltipHeight] = useState(0)
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  
  const contentRef = useRef<HTMLDivElement>(null)

  const { data: screenshots = [], refetch } = useQuery<Array<{ path: string; preview: string }>, Error>(
    ["screenshots"],
    async () => {
      try {
        const existing = await window.electronAPI.getScreenshots()
        return existing
      } catch (error) {
        console.error("スクリーンショットの読み込みエラー:", error)
        showToast("エラー", "既存のスクリーンショットの読み込みに失敗しました", "error")
        return []
      }
    },
    {
      staleTime: Infinity,
      cacheTime: Infinity,
      refetchOnWindowFocus: true,
      refetchOnMount: true
    }
  )

  const showToast = (
    title: string,
    description: string,
    variant: ToastVariant
  ) => {
    setToastMessage({ title, description, variant })
    setToastOpen(true)
  }

  const handleDeleteScreenshot = async (index: number) => {
    const screenshotToDelete = screenshots[index]

    try {
      const result = await window.electronAPI.deleteScreenshot(screenshotToDelete.path)
      if (result && result.success) {
        refetch()
      } else {
        console.error("スクリーンショットの削除に失敗:", result?.error || "削除処理が成功しませんでした")
        showToast("エラー", "スクリーンショットファイルの削除に失敗しました", "error")
      }
    } catch (error) {
      console.error("削除エラー:", error)
      showToast("エラー", "スクリーンショットファイルの削除に失敗しました", "error")
    }
  }

  const handleAnalysisSubmit = async (prompt: string, autoCapture: boolean): Promise<void> => {
    setIsAnalyzing(true)
    setAnalysisResult(null)

    try {
      let screenshotPath: string | null = null

      // 必要に応じてスクリーンショット撮影
      if (autoCapture) {
        const result = await window.electronAPI.takeScreenshot()
        if (result && result.success && result.path) {
          screenshotPath = result.path
          refetch() // スクリーンショット一覧を更新
        } else {
          throw new Error(result?.error || "スクリーンショットの撮影に失敗しました")
        }
      } else if (screenshots.length > 0) {
        // 最新のスクリーンショットを使用
        screenshotPath = screenshots[screenshots.length - 1].path
      } else {
        throw new Error("分析するスクリーンショットがありません")
      }

      // 分析実行
      let analysisResult
      if (prompt.trim()) {
        // プロンプト付き分析
        analysisResult = await window.electronAPI.analyzeScreenWithPrompt(screenshotPath, prompt)
      } else {
        // 自動分析
        analysisResult = await window.electronAPI.analyzeScreenAutomatically(screenshotPath)
      }

      if (analysisResult && analysisResult.success) {
        setAnalysisResult(analysisResult.text || "分析結果を取得できませんでした")
      } else {
        throw new Error(analysisResult?.error || "画面分析に失敗しました")
      }
      setShowAnalysisDialog(false)
      showToast("分析完了", "画面分析が完了しました", "success")

    } catch (error: any) {
      console.error("Analysis failed:", error)
      showToast("分析失敗", error.message || "画面分析に失敗しました", "error")
    } finally {
      setIsAnalyzing(false)
    }
  }

  useEffect(() => {
    const updateDimensions = () => {
      if (contentRef.current) {
        let contentHeight = contentRef.current.scrollHeight
        const contentWidth = contentRef.current.scrollWidth
        if (isTooltipVisible) {
          contentHeight += tooltipHeight
        }
        window.electronAPI.updateContentDimensions({
          width: contentWidth,
          height: contentHeight
        })
      }
    }

    const resizeObserver = new ResizeObserver(updateDimensions)
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }
    updateDimensions()

    const cleanupFunctions = [
      window.electronAPI.onScreenshotTaken(() => refetch()),
      window.electronAPI.onResetView(() => refetch()),
      window.electronAPI.onSolutionError((error: string) => {
        showToast(
          "処理失敗",
          "スクリーンショットの処理中にエラーが発生しました。",
          "error"
        )
        setView("queue")
        console.error("処理エラー:", error)
      }),
      window.electronAPI.onProcessingNoScreenshots(() => {
        showToast(
          "スクリーンショットなし",
          "処理するスクリーンショットがありません。",
          "neutral"
        )
      })
    ]

    return () => {
      resizeObserver.disconnect()
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [isTooltipVisible, tooltipHeight])

  useEffect(() => {
    // Event listeners for shortcut-triggered analysis
    const unsubscribers: (() => void)[] = []

    // Analysis prompt dialog trigger
    if (window.electronAPI.onShowAnalysisPrompt) {
      const unsubscribe = window.electronAPI.onShowAnalysisPrompt(() => {
        setShowAnalysisDialog(true)
      })
      unsubscribers.push(unsubscribe)
    }

    // Quick solve events
    if (window.electronAPI.onQuickSolveStarted) {
      const unsubscribe = window.electronAPI.onQuickSolveStarted(() => {
        setIsAnalyzing(true)
        setAnalysisResult(null)
      })
      unsubscribers.push(unsubscribe)
    }

    if (window.electronAPI.onQuickSolveResult) {
      const unsubscribe = window.electronAPI.onQuickSolveResult((data) => {
        setAnalysisResult(data.analysis)
        setIsAnalyzing(false)
      })
      unsubscribers.push(unsubscribe)
    }

    if (window.electronAPI.onQuickSolveError) {
      const unsubscribe = window.electronAPI.onQuickSolveError((data) => {
        setAnalysisResult(`エラー: ${data.error}\n詳細: ${data.details || '詳細情報なし'}`)
        setIsAnalyzing(false)
      })
      unsubscribers.push(unsubscribe)
    }

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [])

  const handleTooltipVisibilityChange = (visible: boolean, height: number) => {
    setIsTooltipVisible(visible)
    setTooltipHeight(height)
  }

  return (
    <div className="w-full h-full">
      <div ref={contentRef} className={`bg-transparent w-1/2`}>
        <div className="px-4 py-3">
          <Toast
            open={toastOpen}
            onOpenChange={setToastOpen}
            variant={toastMessage.variant}
            duration={3000}
          >
            <ToastTitle>{toastMessage.title}</ToastTitle>
            <ToastDescription>{toastMessage.description}</ToastDescription>
          </Toast>

          <div className="space-y-3 w-fit">
            <ScreenshotQueue
              isLoading={false}
              screenshots={screenshots}
              onDeleteScreenshot={handleDeleteScreenshot}
            />
            <QueueCommands
              screenshots={screenshots}
              onTooltipVisibilityChange={handleTooltipVisibilityChange}
            />

            {/* Analysis Result Display */}
            {analysisResult && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    分析結果
                  </h3>
                  <button
                    onClick={() => setAnalysisResult(null)}
                    className="text-white/60 hover:text-white/80 text-sm"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-white/90 text-sm whitespace-pre-wrap">
                  {analysisResult}
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isAnalyzing && (
              <div className="mt-4 p-4 bg-black/40 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-white/80 text-sm">画面を分析中...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Prompt Dialog */}
      <AnalysisPromptDialog
        isVisible={showAnalysisDialog}
        onClose={() => setShowAnalysisDialog(false)}
        onSubmit={handleAnalysisSubmit}
        isLoading={isAnalyzing}
      />
    </div>
  )
}

export default Queue