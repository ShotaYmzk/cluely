// src/App.tsx

/// <reference path="./types/electron.d.ts" />

import { ToastProvider } from "./components/ui/toast"
import Queue from "./_pages/Queue"
import { ToastViewport } from "./components/ui/toast" // 直接インポート
import { useEffect, useRef, useState } from "react"
import Solutions from "./_pages/Solutions"
import { QueryClient, QueryClientProvider } from "react-query"
import Debug from "./_pages/Debug" // Debugコンポーネントをインポート

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      cacheTime: Infinity
    }
  }
})

const App: React.FC = () => {
  const [view, setView] = useState<"queue" | "solutions" | "debug">("queue")
  const [isProcessing, setIsProcessing] = useState(false) // isProcessingをAppレベルで管理
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateHeight = () => {
      if (!containerRef.current) return
      const height = containerRef.current.scrollHeight
      const width = containerRef.current.scrollWidth
      // APIが存在することを確認してから呼び出す
      window.electronAPI?.updateContentDimensions({ width, height })
    }

    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(updateHeight)
      resizeObserver.observe(containerRef.current)
      
      const mutationObserver = new MutationObserver(updateHeight)
      mutationObserver.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      })
      
      updateHeight()

      return () => {
        resizeObserver.disconnect()
        mutationObserver.disconnect()
      }
    }
  }, [view])

  useEffect(() => {
    // electronAPIが利用可能になってからリスナーを登録
    if (window.electronAPI) {
      const cleanups = [
        window.electronAPI.onResetView(() => {
          console.log("Received 'reset-view' message from main process.")
          queryClient.invalidateQueries()
          setView("queue")
        }),
        window.electronAPI.onSolutionStart(() => {
          setView("solutions")
          console.log("starting processing")
        }),
        window.electronAPI.onUnauthorized(() => {
          queryClient.removeQueries()
          setView("queue")
          console.log("Unauthorized")
        }),
        // Debugビューへの切り替えリスナーを追加
        window.electronAPI.onDebugStart(() => {
          setView("debug")
          setIsProcessing(true)
        })
      ].filter(Boolean) as (() => void)[];

      return () => {
        cleanups.forEach(cleanup => cleanup());
      }
    }
  }, [queryClient]);


  return (
    <div ref={containerRef} className="min-h-0">
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {view === "queue" && <Queue setView={setView} />}
          {view === "solutions" && <Solutions setView={setView} />}
          {view === "debug" && <Debug isProcessing={isProcessing} setIsProcessing={setIsProcessing} />}
          <ToastViewport />
        </ToastProvider>
      </QueryClientProvider>
    </div>
  )
}

export default App