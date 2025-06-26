// src/_pages/Debug.tsx
import React, { useState, useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "react-query"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism"
// ★★★ 変更点: 正しい場所からインポート ★★★
import { ContentSection } from "../components/Solutions/ContentSection"
import { ComplexitySection } from "../components/Solutions/ComplexitySection"
import ScreenshotQueue from "../components/Queue/ScreenshotQueue"
import {
  Toast,
  ToastDescription,
  ToastMessage,
  ToastTitle,
  ToastVariant
} from "../components/ui/toast"
import ExtraScreenshotsQueueHelper from "../components/Solutions/SolutionCommands"
import { diffLines } from "diff"

type DiffLine = {
  value: string
  added?: boolean
  removed?: boolean
}

const CodeComparisonSection = ({
  oldCode,
  newCode,
  isLoading
}: {
  oldCode: string | null
  newCode: string | null
  isLoading: boolean
}) => {
  const computeDiff = () => {
    if (!oldCode || !newCode) return { leftLines: [], rightLines: [] }

    const normalizeCode = (code: string) => code.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    const normalizedOldCode = normalizeCode(oldCode)
    const normalizedNewCode = normalizeCode(newCode)
    const diff = diffLines(normalizedOldCode, normalizedNewCode, { newlineIsToken: true, ignoreWhitespace: true });
    
    const leftLines: DiffLine[] = []
    const rightLines: DiffLine[] = []

    diff.forEach((part) => {
      const lines = part.value.split("\n").filter(line => line.length > 0);
      if (part.added) {
        leftLines.push(...Array(lines.length).fill({ value: "" }));
        rightLines.push(...lines.map(line => ({ value: line, added: true })));
      } else if (part.removed) {
        leftLines.push(...lines.map(line => ({ value: line, removed: true })));
        rightLines.push(...Array(lines.length).fill({ value: "" }));
      } else {
        leftLines.push(...lines.map(line => ({ value: line })));
        rightLines.push(...lines.map(line => ({ value: line })));
      }
    });

    return { leftLines, rightLines }
  }

  const { leftLines, rightLines } = computeDiff()
  const renderCode = (lines: DiffLine[]) => lines.map((line) => line.value).join("\n");

  return (
    <div className="space-y-1.5">
      <h2 className="text-[13px] font-medium text-white tracking-wide">
        コード比較
      </h2>
      {isLoading ? (
        <div className="mt-3 flex">
          <p className="text-xs bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent animate-pulse">
            コード比較を読み込み中...
          </p>
        </div>
      ) : (
        <div className="flex flex-row gap-0.5 bg-[#161b22] rounded-lg overflow-hidden">
          {/* Previous Code */}
          <div className="w-1/2 border-r border-gray-700">
            <div className="bg-[#2d333b] px-3 py-1.5">
              <h3 className="text-[11px] font-medium text-gray-200">前のバージョン</h3>
            </div>
            <div className="p-3 overflow-x-auto">
              <SyntaxHighlighter language="python" style={dracula} customStyle={{ margin: 0, padding: "1rem", whiteSpace: "pre-wrap", wordBreak: "break-all" }} showLineNumbers>
                {renderCode(leftLines)}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* New Code */}
          <div className="w-1/2">
            <div className="bg-[#2d333b] px-3 py-1.5">
              <h3 className="text-[11px] font-medium text-gray-200">新しいバージョン</h3>
            </div>
            <div className="p-3 overflow-x-auto">
              <SyntaxHighlighter language="python" style={dracula} customStyle={{ margin: 0, padding: "1rem", whiteSpace: "pre-wrap", wordBreak: "break-all" }} showLineNumbers>
                {renderCode(rightLines)}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface DebugProps {
  isProcessing: boolean
  setIsProcessing: (isProcessing: boolean) => void
}

const Debug: React.FC<DebugProps> = ({ isProcessing, setIsProcessing }) => {
  const queryClient = useQueryClient()
  const contentRef = useRef<HTMLDivElement>(null)

  const [debugData, setDebugData] = useState<any>(null);

  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<ToastMessage>({ title: "", description: "", variant: "neutral" })

  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const [tooltipHeight, setTooltipHeight] = useState(0)

  const { data: extraScreenshots = [], refetch } = useQuery({
    queryKey: ["extras"],
    queryFn: async () => window.electronAPI.getScreenshots(),
    staleTime: Infinity,
    cacheTime: Infinity
  })

  const showToast = (title: string, description: string, variant: ToastVariant) => {
    setToastMessage({ title, description, variant })
    setToastOpen(true)
  }

  const handleDeleteExtraScreenshot = async (index: number) => {
    const screenshotToDelete = extraScreenshots[index]
    try {
      const response = await window.electronAPI.deleteScreenshot(screenshotToDelete.path)
      if (response.success) refetch()
    } catch (error) {
      console.error("追加スクリーンショット削除エラー:", error)
    }
  }

  useEffect(() => {
    const newSolution = queryClient.getQueryData("new_solution") as any
    if (newSolution) {
      setDebugData(newSolution);
      setIsProcessing(false)
    }

    const cleanupFunctions = [
      window.electronAPI.onScreenshotTaken(() => refetch()),
      window.electronAPI.onResetView(() => refetch()),
      window.electronAPI.onDebugSuccess((data) => {
        setDebugData(data);
        setIsProcessing(false)
      }),
      window.electronAPI.onDebugStart(() => {
        setIsProcessing(true)
      }),
      window.electronAPI.onDebugError((error: string) => {
        showToast("処理失敗", "コードのデバッグ中にエラーが発生しました。", "error")
        setIsProcessing(false)
      })
    ]

    const updateDimensions = () => {
      if (contentRef.current) {
        let contentHeight = contentRef.current.scrollHeight + (isTooltipVisible ? tooltipHeight : 0)
        window.electronAPI.updateContentDimensions({ width: contentRef.current.scrollWidth, height: contentHeight })
      }
    }

    const resizeObserver = new ResizeObserver(updateDimensions)
    if (contentRef.current) resizeObserver.observe(contentRef.current)
    updateDimensions()

    return () => {
      resizeObserver.disconnect()
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [queryClient, isTooltipVisible, tooltipHeight, setIsProcessing])

  const handleTooltipVisibilityChange = (visible: boolean, height: number) => {
    setIsTooltipVisible(visible)
    setTooltipHeight(height)
  }

  return (
    <div className="w-full h-full">
      <div ref={contentRef} className="relative space-y-3 px-4 py-3 ">
        <Toast open={toastOpen} onOpenChange={setToastOpen} variant={toastMessage.variant} duration={3000}>
          <ToastTitle>{toastMessage.title}</ToastTitle>
          <ToastDescription>{toastMessage.description}</ToastDescription>
        </Toast>

        <div className="bg-transparent w-fit">
          <div className="pb-3">
            <div className="space-y-3 w-fit">
              <ScreenshotQueue screenshots={extraScreenshots} onDeleteScreenshot={handleDeleteExtraScreenshot} isLoading={isProcessing} />
            </div>
          </div>
        </div>

        <ExtraScreenshotsQueueHelper extraScreenshots={extraScreenshots} onTooltipVisibilityChange={handleTooltipVisibilityChange} />

        <div className="w-full text-sm text-black bg-black/60 rounded-md">
          <div className="rounded-lg overflow-hidden">
            <div className="px-4 py-3 space-y-4">
              <ContentSection
                title="変更内容"
                content={<div className="space-y-1">{debugData?.thoughts?.map((thought: string, index: number) => <div key={index} className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-blue-400/80 mt-2 shrink-0" /><div>{thought}</div></div>)}</div>}
                isLoading={!debugData}
              />
              <CodeComparisonSection
                oldCode={debugData?.old_code}
                newCode={debugData?.new_code}
                isLoading={!debugData}
              />
              <ComplexitySection
                timeComplexity={debugData?.time_complexity}
                spaceComplexity={debugData?.space_complexity}
                isLoading={!debugData}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Debug