// Solutions.tsx
import React, { useState, useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "react-query"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism"

import ScreenshotQueue from "../components/Queue/ScreenshotQueue"
import {
  Toast,
  ToastDescription,
  ToastMessage,
  ToastTitle,
  ToastVariant
} from "../components/ui/toast"
import { ProblemStatementData } from "../types/solutions"
import { AudioResult } from "../types/audio"
import SolutionCommands from "../components/Solutions/SolutionCommands"
import Debug from "./Debug"
import ExtraScreenshotsQueueHelper from "../components/Solutions/SolutionCommands"
import { diffLines } from "diff"
import MarkdownRenderer from "../components/ui/MarkdownRenderer"

// (Using global ElectronAPI type from src/types/electron.d.ts)

export const ContentSection = ({
  title,
  content,
  isLoading,
  useMarkdown = true
}: {
  title: string
  content: React.ReactNode
  isLoading: boolean
  useMarkdown?: boolean
}) => (
  <div className="space-y-2">
    <h2 className="text-[13px] font-medium text-white tracking-wide">
      {title}
    </h2>
    {isLoading ? (
      <div className="mt-4 flex">
        <p className="text-xs bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent animate-pulse">
          問題文を抽出中...
        </p>
      </div>
    ) : (
      <div className="text-[13px] leading-[1.4] text-gray-100 max-w-[600px]">
        {useMarkdown && typeof content === 'string' ? (
          <MarkdownRenderer content={content} className="text-[13px]" />
        ) : (
          content
        )}
      </div>
    )}
  </div>
)
const SolutionSection = ({
  title,
  content,
  isLoading
}: {
  title: string
  content: React.ReactNode
  isLoading: boolean
}) => (
  <div className="space-y-2">
    <h2 className="text-[13px] font-medium text-white tracking-wide">
      {title}
    </h2>
    {isLoading ? (
      <div className="space-y-1.5">
        <div className="mt-4 flex">
          <p className="text-xs bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent animate-pulse">
            ソリューションを読み込み中...
          </p>
        </div>
      </div>
    ) : (
      <div className="w-full">
        <SyntaxHighlighter
          showLineNumbers
          language="python"
          style={dracula}
          customStyle={{
            maxWidth: "100%",
            margin: 0,
            padding: "1rem",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all"
          }}
          wrapLongLines={true}
        >
          {content as string}
        </SyntaxHighlighter>
      </div>
    )}
  </div>
)

export const ComplexitySection = ({
  timeComplexity,
  spaceComplexity,
  isLoading
}: {
  timeComplexity: string | null
  spaceComplexity: string | null
  isLoading: boolean
}) => (
  <div className="space-y-2">
    <h2 className="text-[13px] font-medium text-white tracking-wide">
      複雑度（更新済み）
    </h2>
    {isLoading ? (
      <p className="text-xs bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent animate-pulse">
        複雑度を計算中...
      </p>
    ) : (
      <div className="space-y-1">
        <div className="flex items-start gap-2 text-[13px] leading-[1.4] text-gray-100">
          <div className="w-1 h-1 rounded-full bg-blue-400/80 mt-2 shrink-0" />
          <div>
            <strong>時間:</strong> {timeComplexity}
          </div>
        </div>
        <div className="flex items-start gap-2 text-[13px] leading-[1.4] text-gray-100">
          <div className="w-1 h-1 rounded-full bg-blue-400/80 mt-2 shrink-0" />
          <div>
            <strong>空間:</strong> {spaceComplexity}
          </div>
        </div>
      </div>
    )}
  </div>
)

interface SolutionsProps {
  setView: React.Dispatch<React.SetStateAction<"queue" | "solutions" | "debug">>
}
const Solutions: React.FC<SolutionsProps> = ({ setView }) => {
  const queryClient = useQueryClient()
  const contentRef = useRef<HTMLDivElement>(null)

  // Audio recording state
  const [audioRecording, setAudioRecording] = useState(false)
  const [audioResult, setAudioResult] = useState<AudioResult | null>(null)

  const [debugProcessing, setDebugProcessing] = useState(false)
  const [problemStatementData, setProblemStatementData] =
    useState<ProblemStatementData | null>(null)
  const [solutionData, setSolutionData] = useState<string | null>(null)
  const [thoughtsData, setThoughtsData] = useState<string[] | null>(null)
  const [timeComplexityData, setTimeComplexityData] = useState<string | null>(
    null
  )
  const [spaceComplexityData, setSpaceComplexityData] = useState<string | null>(
    null
  )
  const [customContent, setCustomContent] = useState<string | null>(null)
  const [answerData, setAnswerData] = useState<string | null>(null)
  const [explanationData, setExplanationData] = useState<string | null>(null)
  const [contextData, setContextData] = useState<string | null>(null)
  const [suggestedResponsesData, setSuggestedResponsesData] = useState<string[] | null>(null)
  const [reasoningData, setReasoningData] = useState<string | null>(null)
  const [actionResponseData, setActionResponseData] = useState<any>(null)
  const [isActionProcessing, setIsActionProcessing] = useState(false)

  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<ToastMessage>({
    title: "",
    description: "",
    variant: "neutral"
  })

  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const [tooltipHeight, setTooltipHeight] = useState(0)

  const [isResetting, setIsResetting] = useState(false)

  const { data: extraScreenshots = [], refetch } = useQuery<Array<{ path: string; preview: string }>, Error>(
    ["extras"],
    async () => {
      try {
        const existing = await window.electronAPI.getScreenshots()
        return existing
      } catch (error) {
        console.error("追加スクリーンショットの読み込みエラー:", error)
        return []
      }
    },
    {
      staleTime: Infinity,
      cacheTime: Infinity
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

  const handleDeleteExtraScreenshot = async (index: number) => {
    try {
      const result = await window.electronAPI.deleteScreenshot(extraScreenshots[index].path)
      if (result.success) {
        refetch()
      } else {
        console.error("Failed to delete screenshot:", result.error)
      }
    } catch (error) {
      console.error("Error deleting screenshot:", error)
    }
  }

  const handleActionClick = async (action: string) => {
    setIsActionProcessing(true)
    setActionResponseData(null)
    try {
      await window.electronAPI.processActionResponse(action)
    } catch (error) {
      console.error("Error processing action:", error)
      setIsActionProcessing(false)
      showToast(
        "アクション処理エラー",
        "アクションの処理中にエラーが発生しました。",
        "error"
      )
    }
  }

  useEffect(() => {
    // Height update logic
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

    // Initialize resize observer
    const resizeObserver = new ResizeObserver(updateDimensions)
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }
    updateDimensions()

    // Set up event listeners
    const cleanupFunctions = [
      window.electronAPI.onScreenshotTaken(() => refetch()),
      window.electronAPI.onResetView(() => {
        // Set resetting state first
        setIsResetting(true)

        // Clear the queries
        queryClient.removeQueries(["solution"])
        queryClient.removeQueries(["new_solution"])

        // Reset other states
        refetch()

        // After a small delay, clear the resetting state
        setTimeout(() => {
          setIsResetting(false)
        }, 0)
      }),
      window.electronAPI.onSolutionStart(async () => {
        // Reset UI state for a new solution
        setSolutionData(null)
        setThoughtsData(null)
        setTimeComplexityData(null)
        setSpaceComplexityData(null)
        setCustomContent(null)
        setAudioResult(null)
        setAnswerData(null)
        setExplanationData(null)
        setContextData(null)
        setSuggestedResponsesData(null)
        setReasoningData(null)

        // Start audio recording from user's microphone
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          const mediaRecorder = new MediaRecorder(stream)
          const chunks: Blob[] = []
          mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
          mediaRecorder.start()
          setAudioRecording(true)
          // Record for 5 seconds (or adjust as needed)
          setTimeout(() => mediaRecorder.stop(), 5000)
          mediaRecorder.onstop = async () => {
            setAudioRecording(false)
            const blob = new Blob(chunks, { type: chunks[0]?.type || 'audio/webm' })
            const reader = new FileReader()
            reader.onloadend = async () => {
              const base64Data = (reader.result as string).split(',')[1]
              // Send audio to Gemini for analysis
              try {
                const result = await window.electronAPI.analyzeAudioFromBase64(
                  base64Data,
                  blob.type
                )
                // Store result in react-query cache
                queryClient.setQueryData(["audio_result"], result)
                setAudioResult(result)
              } catch (err) {
                console.error('Audio analysis failed:', err)
              }
            }
            reader.readAsDataURL(blob)
          }
        } catch (err) {
          console.error('Audio recording error:', err)
        }

        // Simulate receiving custom content shortly after start
        setTimeout(() => {
          setCustomContent(
            "This is the dynamically generated content appearing after loading starts."
          )
        }, 1500) // Example delay
      }),
      //if there was an error processing the initial solution
      window.electronAPI.onSolutionError((error: string) => {
        showToast(
          "Processing Failed",
          "There was an error processing your extra screenshots.",
          "error"
        )
        // Reset solutions in the cache (even though this shouldn't ever happen) and complexities to previous states
        const solution = queryClient.getQueryData(["solution"]) as {
          code: string
          thoughts: string[]
          time_complexity: string
          space_complexity: string
        } | null
        if (!solution) {
          setView("queue") //make sure that this is correct. or like make sure there's a toast or something
        }
        setSolutionData(solution?.code || null)
        setThoughtsData(solution?.thoughts || null)
        setTimeComplexityData(solution?.time_complexity || null)
        setSpaceComplexityData(solution?.space_complexity || null)
        console.error("Processing error:", error)
      }),
      //when the initial solution is generated, we'll set the solution data to that
      window.electronAPI.onSolutionSuccess((data) => {
        if (!data?.solution) {
          console.warn("Received empty or invalid solution data")
          return
        }

        console.log({ solution: data.solution })

        const solutionData = {
          code: data.solution.code,
          thoughts: data.solution.thoughts,
          time_complexity: data.solution.time_complexity,
          space_complexity: data.solution.space_complexity
        }

        queryClient.setQueryData(["solution"], solutionData)
        setSolutionData(solutionData.code || null)
        setThoughtsData(solutionData.thoughts || null)
        setTimeComplexityData(solutionData.time_complexity || null)
        setSpaceComplexityData(solutionData.space_complexity || null)
      }),

      //########################################################
      //DEBUG EVENTS
      //########################################################
      window.electronAPI.onDebugStart(() => {
        //we'll set the debug processing state to true and use that to render a little loader
        setDebugProcessing(true)
      }),
      //the first time debugging works, we'll set the view to debug and populate the cache with the data
      window.electronAPI.onDebugSuccess((data) => {
        console.log({ debug_data: data })

        queryClient.setQueryData(["new_solution"], data.solution)
        setDebugProcessing(false)
      }),
      //when there was an error in the initial debugging, we'll show a toast and stop the little generating pulsing thing.
      window.electronAPI.onDebugError(() => {
        showToast(
          "Processing Failed",
          "There was an error debugging your code.",
          "error"
        )
        setDebugProcessing(false)
      }),
      window.electronAPI.onProcessingNoScreenshots(() => {
        showToast(
          "スクリーンショットなし",
          "処理する追加スクリーンショットがありません。",
          "neutral"
        )
      }),

      window.electronAPI.onActionResponseGenerated((data) => {
        setActionResponseData(data)
        setIsActionProcessing(false)
        showToast(
          "アクション応答完了",
          "選択したアクションに対する回答が生成されました。",
          "success"
        )
      }),

      window.electronAPI.onActionResponseError((error) => {
        setIsActionProcessing(false)
        showToast(
          "アクション応答エラー",
          `アクション応答の生成中にエラーが発生しました: ${error}`,
          "error"
        )
      })
    ]

    return () => {
      resizeObserver.disconnect()
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [isTooltipVisible, tooltipHeight])

  useEffect(() => {
    setProblemStatementData(
      queryClient.getQueryData(["problem_statement"]) || null
    )
    setSolutionData(queryClient.getQueryData(["solution"]) || null)

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.query.queryKey[0] === "problem_statement") {
        const problemData = queryClient.getQueryData(["problem_statement"]) as any
        setProblemStatementData(problemData || null)
        
        // Extract answer and explanation from problem data
        if (problemData) {
          setAnswerData(problemData.answer || null)
          setExplanationData(problemData.explanation || null)
          setContextData(problemData.context || null)
          setSuggestedResponsesData(problemData.suggested_responses || null)
          setReasoningData(problemData.reasoning || null)
        }
        
        // If this is from audio processing, show it in the custom content section
        const audioResult = queryClient.getQueryData(["audio_result"]) as AudioResult | undefined;
        if (audioResult) {
          // Update all relevant sections when audio result is received
          setProblemStatementData({
            problem_statement: audioResult.text,
            input_format: {
              description: "Generated from audio input",
              parameters: []
            },
            output_format: {
              description: "Generated from audio input",
              type: "string",
              subtype: "text"
            },
            complexity: {
              time: "N/A",
              space: "N/A"
            },
            test_cases: [],
            validation_type: "manual",
            difficulty: "custom"
          });
          setSolutionData(null); // Reset solution to trigger loading state
          setThoughtsData(null);
          setTimeComplexityData(null);
          setSpaceComplexityData(null);
          setAnswerData(null);
          setExplanationData(null);
        }
      }
      if (event?.query.queryKey[0] === "solution") {
        const solution = queryClient.getQueryData(["solution"]) as {
          code: string
          thoughts: string[]
          time_complexity: string
          space_complexity: string
          answer?: string
          explanation?: string
        } | null

        setSolutionData(solution?.code ?? null)
        setThoughtsData(solution?.thoughts ?? null)
        setTimeComplexityData(solution?.time_complexity ?? null)
        setSpaceComplexityData(solution?.space_complexity ?? null)
        setAnswerData(solution?.answer ?? null)
        setExplanationData(solution?.explanation ?? null)
      }
    })
    return () => unsubscribe()
  }, [queryClient])

  const handleTooltipVisibilityChange = (visible: boolean, height: number) => {
    setIsTooltipVisible(visible)
    setTooltipHeight(height)
  }

  return (
    <>
      {!isResetting && queryClient.getQueryData(["new_solution"]) ? (
        <>
          <Debug
            isProcessing={debugProcessing}
            setIsProcessing={setDebugProcessing}
          />
        </>
      ) : (
        <div className="w-full h-full">
          <div ref={contentRef} className="relative space-y-3 px-4 py-3">
            <Toast
              open={toastOpen}
              onOpenChange={setToastOpen}
              variant={toastMessage.variant}
              duration={3000}
            >
              <ToastTitle>{toastMessage.title}</ToastTitle>
              <ToastDescription>{toastMessage.description}</ToastDescription>
            </Toast>

            {/* Conditionally render the screenshot queue if solutionData is available */}
            {solutionData && (
              <div className="bg-transparent w-fit">
                <div className="pb-3">
                  <div className="space-y-3 w-fit">
                    <ScreenshotQueue
                      isLoading={debugProcessing}
                      screenshots={extraScreenshots}
                      onDeleteScreenshot={handleDeleteExtraScreenshot}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navbar of commands with the SolutionsHelper */}
            <SolutionCommands
              extraScreenshots={extraScreenshots}
              onTooltipVisibilityChange={handleTooltipVisibilityChange}
            />

            {/* Main Content - Modified width constraints */}
            <div className="w-full text-sm text-black bg-black/60 rounded-md">
              <div className="rounded-lg overflow-hidden">
                <div className="px-4 py-3 space-y-4 max-w-full">
                  {/* Show Screenshot or Audio Result as main output if validation_type is manual */}
                  {problemStatementData?.validation_type === "manual" ? (
                    <>
                      <ContentSection
                        title={problemStatementData?.output_format?.subtype === "voice" ? "音声分析結果" : "スクリーンショット結果"}
                        content={problemStatementData.problem_statement}
                        isLoading={false}
                      />
                      {contextData && (
                        <ContentSection
                          title="背景・コンテキスト"
                          content={contextData}
                          isLoading={false}
                        />
                      )}
                      {answerData && (
                        <ContentSection
                          title="回答"
                          content={answerData}
                          isLoading={false}
                        />
                      )}
                      {explanationData && (
                        <ContentSection
                          title="説明"
                          content={explanationData}
                          isLoading={false}
                        />
                      )}
                      {suggestedResponsesData && suggestedResponsesData.length > 0 && (
                        <ContentSection
                          title="推奨アクション"
                          content={
                            <div className="space-y-2">
                              {suggestedResponsesData.map((response, index) => (
                                <div key={index} className="flex items-start gap-2">
                                  <div className="w-1 h-1 rounded-full bg-blue-400/80 mt-2 shrink-0" />
                                  <button
                                    onClick={() => handleActionClick(response)}
                                    disabled={isActionProcessing}
                                    className="text-left hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {response}
                                  </button>
                                </div>
                              ))}
                            </div>
                          }
                          isLoading={false}
                          useMarkdown={false}
                        />
                      )}
                      {reasoningData && (
                        <ContentSection
                          title="推論・理由"
                          content={reasoningData}
                          isLoading={false}
                        />
                      )}
                      {isActionProcessing && (
                        <ContentSection
                          title="アクション処理中"
                          content={
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                              <span>アクションを処理中...</span>
                            </div>
                          }
                          isLoading={false}
                          useMarkdown={false}
                        />
                      )}
                      {actionResponseData && (
                        <ContentSection
                          title={`アクション応答: ${actionResponseData.action_response?.action || '選択されたアクション'}`}
                          content={
                            <div className="space-y-4">
                              {actionResponseData.action_response?.concrete_answer && (
                                <div>
                                  <h4 className="font-semibold text-sm mb-2">具体的な回答:</h4>
                                  <div className="text-sm">{actionResponseData.action_response.concrete_answer}</div>
                                </div>
                              )}
                              {actionResponseData.action_response?.detailed_explanation && (
                                <div>
                                  <h4 className="font-semibold text-sm mb-2">詳細な説明:</h4>
                                  <div className="text-sm">{actionResponseData.action_response.detailed_explanation}</div>
                                </div>
                              )}
                              {actionResponseData.action_response?.step_by_step && actionResponseData.action_response.step_by_step.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-sm mb-2">ステップバイステップ:</h4>
                                  <div className="space-y-1">
                                    {actionResponseData.action_response.step_by_step.map((step: string, index: number) => (
                                      <div key={index} className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-green-400/80 mt-2 shrink-0" />
                                        <div className="text-sm">{step}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {actionResponseData.action_response?.additional_context && (
                                <div>
                                  <h4 className="font-semibold text-sm mb-2">追加コンテキスト:</h4>
                                  <div className="text-sm">{actionResponseData.action_response.additional_context}</div>
                                </div>
                              )}
                              {actionResponseData.action_response?.next_actions && actionResponseData.action_response.next_actions.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-sm mb-2">次のアクション:</h4>
                                  <div className="space-y-1">
                                    {actionResponseData.action_response.next_actions.map((action: string, index: number) => (
                                      <div key={index} className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-purple-400/80 mt-2 shrink-0" />
                                        <button
                                          onClick={() => handleActionClick(action)}
                                          disabled={isActionProcessing}
                                          className="text-left hover:text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                        >
                                          {action}
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          }
                          isLoading={false}
                          useMarkdown={false}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      {/* Problem Statement Section - Only for non-manual */}
                      <ContentSection
                        title={problemStatementData?.output_format?.subtype === "voice" ? "音声入力" : "問題文"}
                        content={problemStatementData?.problem_statement}
                        isLoading={!problemStatementData}
                      />
                      {/* Show loading state when waiting for solution */}
                      {problemStatementData && !solutionData && (
                        <div className="mt-4 flex">
                          <p className="text-xs bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent animate-pulse">
                            {problemStatementData?.output_format?.subtype === "voice" 
                              ? "音声入力を処理中..." 
                              : "ソリューションを生成中..."}
                          </p>
                        </div>
                      )}
                      {/* Solution Sections (legacy, only for non-manual) */}
                      {solutionData && (
                        <>
                          <ContentSection
                            title="分析"
                            content={
                              thoughtsData && (
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    {thoughtsData.map((thought, index) => (
                                      <div
                                        key={index}
                                        className="flex items-start gap-2"
                                      >
                                        <div className="w-1 h-1 rounded-full bg-blue-400/80 mt-2 shrink-0" />
                                        <div>{thought}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            }
                            isLoading={!thoughtsData}
                          />
                          <SolutionSection
                            title={problemStatementData?.output_format?.subtype === "voice" ? "回答" : "ソリューション"}
                            content={solutionData}
                            isLoading={!solutionData}
                          />
                          {problemStatementData?.output_format?.subtype !== "voice" && (
                            <ComplexitySection
                              timeComplexity={timeComplexityData}
                              spaceComplexity={spaceComplexityData}
                              isLoading={!timeComplexityData || !spaceComplexityData}
                            />
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Solutions

