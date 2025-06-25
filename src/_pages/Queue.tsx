// src/_pages/Queue.tsx

/// <reference path="../types/electron.d.ts" />

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
  const contentRef = useRef<HTMLDivElement>(null)

  const { data: screenshots = [], refetch } = useQuery<Array<{ path: string; preview: string }>, Error>(
    ["screenshots"],
    async () => {
      // electronAPIが存在するかチェックしてから呼び出す
      if (window.electronAPI) {
        try {
          const existing = await window.electronAPI.getScreenshots()
          return existing
        } catch (error) {
          console.error("スクリーンショットの読み込みエラー:", error)
          showToast("エラー", "既存のスクリーンショットの読み込みに失敗しました", "error")
          return []
        }
      }
      return [] // electronAPIがない場合は空を返す
    },
    {
      staleTime: Infinity,
      cacheTime: Infinity,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      enabled: !!window.electronAPI // electronAPIが利用可能になってからクエリを実行
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
      // オプショナルチェイニングで安全に呼び出す
      const response = await window.electronAPI?.deleteScreenshot(
        screenshotToDelete.path
      )

      if (response?.success) {
        refetch()
      } else {
        console.error("スクリーンショットの削除に失敗:", response?.error)
        showToast("エラー", "スクリーンショットファイルの削除に失敗しました", "error")
      }
    } catch (error) {
      console.error("スクリーンショット削除エラー:", error)
    }
  }

  useEffect(() => {
    // APIが利用できない場合は何もしない
    if (!window.electronAPI) return;

    const updateDimensions = () => {
      if (contentRef.current) {
        let contentHeight = contentRef.current.scrollHeight
        const contentWidth = contentRef.current.scrollWidth
        if (isTooltipVisible) {
          contentHeight += tooltipHeight
        }
        // オプショナルチェイニングで安全に呼び出す
        window.electronAPI?.updateContentDimensions({
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
    ].filter(Boolean) // 存在しない可能性のある関数をフィルタリング

    return () => {
      resizeObserver.disconnect()
      cleanupFunctions.forEach((cleanup) => cleanup && cleanup())
    }
  }, [isTooltipVisible, tooltipHeight, refetch, setView])

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
          </div>
        </div>
      </div>
    </div>
  )
}

export default Queue