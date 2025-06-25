// src/App.tsx

/// <reference path="./types/electron.d.ts" />

import { ToastProvider } from "./components/ui/toast"
import Queue from "./_pages/Queue"
import { ToastViewport } from "@radix-ui/react-toast"
import { useEffect, useRef, useState } from "react"
import Solutions from "./_pages/Solutions"
import { QueryClient, QueryClientProvider } from "react-query"

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
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateHeight = () => {
      if (!containerRef.current) return
      const height = containerRef.current.scrollHeight
      const width = containerRef.current.scrollWidth
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
    // electronAPIが利用可能になってからリスナーを設定する
    if (window.electronAPI) {
      const cleanups = [
        window.electronAPI.onResetView(() => {
          console.log("Received 'reset-view' message from main process.")
          queryClient.invalidateQueries() // すべてのクエリを無効化
          setView("queue")
        }),
        window.electronAPI.onSolutionStart(() => {
          setView("solutions")
          console.log("starting processing")
        }),
        window.electronAPI.onUnauthorized?.(() => { // 念のためオプショナルに
          queryClient.removeQueries()
          setView("queue")
          console.log("Unauthorized")
        }),
      ].filter(Boolean) as (() => void)[]; // undefinedを除外

      return () => {
        cleanups.forEach(cleanup => cleanup());
      }
    }
  }, [queryClient]);


  return (
    <div ref={containerRef} className="min-h-0">
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {view === "queue" ? (
            <Queue setView={setView} />
          ) : view === "solutions" ? (
            <Solutions setView={setView} />
          ) : (
            <></>
          )}
          <ToastViewport />
        </ToastProvider>
      </QueryClientProvider>
    </div>
  )
}

export default App