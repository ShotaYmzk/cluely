"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROCESSING_EVENTS = void 0;
const electron_1 = require("electron");
exports.PROCESSING_EVENTS = {
    // Global states
    UNAUTHORIZED: "procesing-unauthorized",
    NO_SCREENSHOTS: "processing-no-screenshots",
    // States for generating the initial solution
    INITIAL_START: "initial-start",
    PROBLEM_EXTRACTED: "problem-extracted",
    SOLUTION_SUCCESS: "solution-success",
    INITIAL_SOLUTION_ERROR: "solution-error",
    // States for processing the debugging
    DEBUG_START: "debug-start",
    DEBUG_SUCCESS: "debug-success",
    DEBUG_ERROR: "debug-error",
    // States for processing action responses
    ACTION_RESPONSE_GENERATED: "action-response-generated",
    ACTION_RESPONSE_ERROR: "action-response-error"
};
// Expose protected methods that allow the renderer process to use
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    updateContentDimensions: (dimensions) => electron_1.ipcRenderer.invoke("update-content-dimensions", dimensions),
    takeScreenshot: () => electron_1.ipcRenderer.invoke("take-screenshot"),
    getScreenshots: () => electron_1.ipcRenderer.invoke("get-screenshots"),
    deleteScreenshot: (path) => electron_1.ipcRenderer.invoke("delete-screenshot", path),
    processScreenshots: () => electron_1.ipcRenderer.invoke("process-screenshots"),
    processExtraScreenshots: () => electron_1.ipcRenderer.invoke("process-extra-screenshots"),
    getImagePreview: (filepath) => electron_1.ipcRenderer.invoke("get-image-preview", filepath),
    // Event listeners
    onScreenshotTaken: (callback) => {
        const subscription = (_, screenshotPath) => callback(screenshotPath);
        electron_1.ipcRenderer.on("screenshot-taken", subscription);
        return () => {
            electron_1.ipcRenderer.removeListener("screenshot-taken", subscription);
        };
    },
    onScreenshotError: (callback) => {
        const subscription = (_, error) => callback(error);
        electron_1.ipcRenderer.on("screenshot-error", subscription);
        return () => {
            electron_1.ipcRenderer.removeListener("screenshot-error", subscription);
        };
    },
    onResetView: (callback) => {
        const subscription = () => callback();
        electron_1.ipcRenderer.on("reset-view", subscription);
        return () => {
            electron_1.ipcRenderer.removeListener("reset-view", subscription);
        };
    },
    onDebugStart: (callback) => {
        const subscription = () => callback();
        electron_1.ipcRenderer.on(exports.PROCESSING_EVENTS.DEBUG_START, subscription);
        return () => {
            electron_1.ipcRenderer.removeListener(exports.PROCESSING_EVENTS.DEBUG_START, subscription);
        };
    },
    onDebugSuccess: (callback) => {
        const subscription = (_, data) => callback(data);
        electron_1.ipcRenderer.on(exports.PROCESSING_EVENTS.DEBUG_SUCCESS, subscription);
        return () => {
            electron_1.ipcRenderer.removeListener(exports.PROCESSING_EVENTS.DEBUG_SUCCESS, subscription);
        };
    },
    onDebugError: (callback) => {
        const subscription = (_, error) => callback(error);
        electron_1.ipcRenderer.on(exports.PROCESSING_EVENTS.DEBUG_ERROR, subscription);
        return () => {
            electron_1.ipcRenderer.removeListener(exports.PROCESSING_EVENTS.DEBUG_ERROR, subscription);
        };
    },
    onSolutionError: (callback) => {
        const subscription = (_, error) => callback(error);
        electron_1.ipcRenderer.on(exports.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR, subscription);
        return () => {
            electron_1.ipcRenderer.removeListener(exports.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR, subscription);
        };
    },
    onProcessingNoScreenshots: (callback) => {
        const subscription = () => callback();
        electron_1.ipcRenderer.on(exports.PROCESSING_EVENTS.NO_SCREENSHOTS, subscription);
        return () => {
            electron_1.ipcRenderer.removeListener(exports.PROCESSING_EVENTS.NO_SCREENSHOTS, subscription);
        };
    },
    onProblemExtracted: (callback) => {
        const subscription = (_, data) => callback(data);
        electron_1.ipcRenderer.on(exports.PROCESSING_EVENTS.PROBLEM_EXTRACTED, subscription);
        return () => {
            electron_1.ipcRenderer.removeListener(exports.PROCESSING_EVENTS.PROBLEM_EXTRACTED, subscription);
        };
    },
    onSolutionSuccess: (callback) => {
        const subscription = (_, data) => callback(data);
        electron_1.ipcRenderer.on(exports.PROCESSING_EVENTS.SOLUTION_SUCCESS, subscription);
        return () => {
            electron_1.ipcRenderer.removeListener(exports.PROCESSING_EVENTS.SOLUTION_SUCCESS, subscription);
        };
    },
    onUnauthorized: (callback) => {
        const subscription = () => callback();
        electron_1.ipcRenderer.on(exports.PROCESSING_EVENTS.UNAUTHORIZED, subscription);
        return () => {
            electron_1.ipcRenderer.removeListener(exports.PROCESSING_EVENTS.UNAUTHORIZED, subscription);
        };
    },
    onActionResponseGenerated: (callback) => {
        const subscription = (_, data) => callback(data);
        electron_1.ipcRenderer.on(exports.PROCESSING_EVENTS.ACTION_RESPONSE_GENERATED, subscription);
        return () => {
            electron_1.ipcRenderer.removeListener(exports.PROCESSING_EVENTS.ACTION_RESPONSE_GENERATED, subscription);
        };
    },
    onActionResponseError: (callback) => {
        const subscription = (_, error) => callback(error);
        electron_1.ipcRenderer.on(exports.PROCESSING_EVENTS.ACTION_RESPONSE_ERROR, subscription);
        return () => {
            electron_1.ipcRenderer.removeListener(exports.PROCESSING_EVENTS.ACTION_RESPONSE_ERROR, subscription);
        };
    },
    // **新規追加: リアルタイム音声録音IPC**
    startRealtimeRecording: (includeSystemAudio = true) => electron_1.ipcRenderer.invoke("start-realtime-recording", includeSystemAudio),
    stopRealtimeRecording: () => electron_1.ipcRenderer.invoke("stop-realtime-recording"),
    isRecording: () => electron_1.ipcRenderer.invoke("is-recording"),
    clearSpeechTranscript: () => electron_1.ipcRenderer.invoke("clear-speech-transcript"),
    // **新規追加: オーディオデバイス管理IPC**
    getAudioDevices: () => electron_1.ipcRenderer.invoke("get-audio-devices"),
    isBlackHoleInstalled: () => electron_1.ipcRenderer.invoke("is-blackhole-installed"),
    installBlackHole: () => electron_1.ipcRenderer.invoke("install-blackhole"),
    testSystemAudioCapture: () => electron_1.ipcRenderer.invoke("test-system-audio-capture"),
    checkAudioPermissions: () => electron_1.ipcRenderer.invoke("check-audio-permissions"),
    setupSystemAudio: () => electron_1.ipcRenderer.invoke("setup-system-audio"),
    teardownSystemAudio: () => electron_1.ipcRenderer.invoke("teardown-system-audio"),
    // **新規追加: 音声関連イベントリスナー**
    onSpeechRecordingStarted: (callback) => {
        const subscription = (_, data) => callback(data);
        electron_1.ipcRenderer.on("speech-recording-started", subscription);
        return () => {
            electron_1.ipcRenderer.removeListener("speech-recording-started", subscription);
        };
    },
    onSpeechRecordingStopped: (callback) => {
        const subscription = (_, data) => callback(data);
        electron_1.ipcRenderer.on("speech-recording-stopped", subscription);
        return () => {
            electron_1.ipcRenderer.removeListener("speech-recording-stopped", subscription);
        };
    },
    onSpeechInterimResult: (callback) => {
        const subscription = (_, data) => callback(data);
        electron_1.ipcRenderer.on("speech-interim-result", subscription);
        return () => {
            electron_1.ipcRenderer.removeListener("speech-interim-result", subscription);
        };
    },
    onSpeechFinalResult: (callback) => {
        const subscription = (_, data) => callback(data);
        electron_1.ipcRenderer.on("speech-final-result", subscription);
        return () => {
            electron_1.ipcRenderer.removeListener("speech-final-result", subscription);
        };
    },
    onSpeechFinalAnalysis: (callback) => {
        const subscription = (_, data) => callback(data);
        electron_1.ipcRenderer.on("speech-final-analysis", subscription);
        return () => {
            electron_1.ipcRenderer.removeListener("speech-final-analysis", subscription);
        };
    },
    onSpeechTranscriptCleared: (callback) => {
        const subscription = (_, data) => callback(data);
        electron_1.ipcRenderer.on("speech-transcript-cleared", subscription);
        return () => {
            electron_1.ipcRenderer.removeListener("speech-transcript-cleared", subscription);
        };
    },
    onSpeechError: (callback) => {
        const subscription = (_, data) => callback(data);
        electron_1.ipcRenderer.on("speech-error", subscription);
        return () => {
            electron_1.ipcRenderer.removeListener("speech-error", subscription);
        };
    },
    // Window movement
    moveWindowLeft: () => electron_1.ipcRenderer.invoke("move-window-left"),
    moveWindowRight: () => electron_1.ipcRenderer.invoke("move-window-right"),
    moveWindow: (deltaX, deltaY) => electron_1.ipcRenderer.invoke("move-window", deltaX, deltaY),
    // Audio analysis (existing)
    analyzeAudioFromBase64: (data, mimeType) => electron_1.ipcRenderer.invoke("analyze-audio-base64", data, mimeType),
    analyzeAudioFile: (path) => electron_1.ipcRenderer.invoke("analyze-audio-file", path),
    analyzeImageFile: (path) => electron_1.ipcRenderer.invoke("analyze-image-file", path),
    processActionResponse: (action) => electron_1.ipcRenderer.invoke("process-action-response", action),
    // **新規追加: 画面分析IPC**
    analyzeScreenAutomatically: (imagePath) => electron_1.ipcRenderer.invoke("analyze-screen-automatically", imagePath),
    analyzeScreenWithPrompt: (imagePath, prompt) => electron_1.ipcRenderer.invoke("analyze-screen-with-prompt", imagePath, prompt),
    // **新規追加: ショートカット関連イベントリスナー**
    onShowAnalysisPrompt: (callback) => {
        const subscription = () => callback();
        electron_1.ipcRenderer.on("show-analysis-prompt", subscription);
        return () => {
            electron_1.ipcRenderer.removeListener("show-analysis-prompt", subscription);
        };
    },
    onQuickSolveStarted: (callback) => {
        const subscription = () => callback();
        electron_1.ipcRenderer.on("quick-solve-started", subscription);
        return () => {
            electron_1.ipcRenderer.removeListener("quick-solve-started", subscription);
        };
    },
    onQuickSolveResult: (callback) => {
        const subscription = (_, data) => callback(data);
        electron_1.ipcRenderer.on("quick-solve-result", subscription);
        return () => {
            electron_1.ipcRenderer.removeListener("quick-solve-result", subscription);
        };
    },
    onQuickSolveError: (callback) => {
        const subscription = (_, data) => callback(data);
        electron_1.ipcRenderer.on("quick-solve-error", subscription);
        return () => {
            electron_1.ipcRenderer.removeListener("quick-solve-error", subscription);
        };
    },
    // Streaming events
    onLlmChunk: (callback) => {
        const subscription = (_, chunk) => callback(chunk);
        electron_1.ipcRenderer.on("llm-chunk", subscription);
        return () => {
            electron_1.ipcRenderer.removeListener("llm-chunk", subscription);
        };
    },
    onLlmStreamEnd: () => {
        const subscription = () => { };
        electron_1.ipcRenderer.on("llm-stream-end", subscription);
        return () => {
            electron_1.ipcRenderer.removeListener("llm-stream-end", subscription);
        };
    },
    onLlmError: (callback) => {
        const subscription = (_, error) => callback(error);
        electron_1.ipcRenderer.on("llm-error", subscription);
        return () => {
            electron_1.ipcRenderer.removeListener("llm-error", subscription);
        };
    },
    quitApp: () => electron_1.ipcRenderer.invoke("quit-app")
});
//# sourceMappingURL=preload.js.map