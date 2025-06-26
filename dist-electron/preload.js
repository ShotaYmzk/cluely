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
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    // --- General ---
    updateContentDimensions: (dimensions) => electron_1.ipcRenderer.invoke("update-content-dimensions", dimensions),
    quitApp: () => electron_1.ipcRenderer.invoke("quit-app"),
    // --- Screenshots ---
    takeScreenshot: () => electron_1.ipcRenderer.invoke("take-screenshot"),
    getScreenshots: () => electron_1.ipcRenderer.invoke("get-screenshots"),
    deleteScreenshot: (path) => electron_1.ipcRenderer.invoke("delete-screenshot", path),
    processScreenshots: () => electron_1.ipcRenderer.invoke("process-screenshots"),
    processExtraScreenshots: () => electron_1.ipcRenderer.invoke("process-extra-screenshots"),
    getImagePreview: (filepath) => electron_1.ipcRenderer.invoke("get-image-preview", filepath),
    // --- Window Movement ---
    moveWindow: (deltaX, deltaY) => electron_1.ipcRenderer.invoke("move-window", deltaX, deltaY),
    moveWindowLeft: () => electron_1.ipcRenderer.invoke("move-window-left"),
    moveWindowRight: () => electron_1.ipcRenderer.invoke("move-window-right"),
    // --- Audio ---
    startRealtimeRecording: (includeSystemAudio = true) => electron_1.ipcRenderer.invoke("start-realtime-recording", includeSystemAudio),
    stopRealtimeRecording: () => electron_1.ipcRenderer.invoke("stop-realtime-recording"),
    isRecording: () => electron_1.ipcRenderer.invoke("is-recording"),
    clearSpeechTranscript: () => electron_1.ipcRenderer.invoke("clear-speech-transcript"),
    analyzeAudioChunk: (args) => electron_1.ipcRenderer.invoke("analyze-audio-chunk", args),
    // --- Audio Devices ---
    getAudioDevices: () => electron_1.ipcRenderer.invoke("get-audio-devices"),
    isBlackHoleInstalled: () => electron_1.ipcRenderer.invoke("is-blackhole-installed"),
    installBlackHole: () => electron_1.ipcRenderer.invoke("install-blackhole"),
    testSystemAudioCapture: () => electron_1.ipcRenderer.invoke("test-system-audio-capture"),
    checkAudioPermissions: () => electron_1.ipcRenderer.invoke("check-audio-permissions"),
    setupSystemAudio: () => electron_1.ipcRenderer.invoke("setup-system-audio"),
    teardownSystemAudio: () => electron_1.ipcRenderer.invoke("teardown-system-audio"),
    // --- Screen Analysis ---
    analyzeScreenAutomatically: (imagePath) => electron_1.ipcRenderer.invoke("analyze-screen-automatically", imagePath),
    analyzeScreenWithPrompt: (imagePath, prompt) => electron_1.ipcRenderer.invoke("analyze-screen-with-prompt", imagePath, prompt),
    // --- Event Listeners ---
    onScreenshotTaken: (callback) => {
        const handler = (_, path) => callback(path);
        electron_1.ipcRenderer.on("screenshot-taken", handler);
        return () => electron_1.ipcRenderer.removeListener("screenshot-taken", handler);
    },
    onScreenshotError: (callback) => {
        const handler = (_, error) => callback(error);
        electron_1.ipcRenderer.on("screenshot-error", handler);
        return () => electron_1.ipcRenderer.removeListener("screenshot-error", handler);
    },
    onProblemExtracted: (callback) => {
        const handler = (_, data) => callback(data);
        electron_1.ipcRenderer.on(exports.PROCESSING_EVENTS.PROBLEM_EXTRACTED, handler);
        return () => electron_1.ipcRenderer.removeListener(exports.PROCESSING_EVENTS.PROBLEM_EXTRACTED, handler);
    },
    onSolutionSuccess: (callback) => {
        const handler = (_, data) => callback(data);
        electron_1.ipcRenderer.on(exports.PROCESSING_EVENTS.SOLUTION_SUCCESS, handler);
        return () => electron_1.ipcRenderer.removeListener(exports.PROCESSING_EVENTS.SOLUTION_SUCCESS, handler);
    },
    onActionResponseGenerated: (callback) => {
        const handler = (_, data) => callback(data);
        electron_1.ipcRenderer.on(exports.PROCESSING_EVENTS.ACTION_RESPONSE_GENERATED, handler);
        return () => electron_1.ipcRenderer.removeListener(exports.PROCESSING_EVENTS.ACTION_RESPONSE_GENERATED, handler);
    },
    onActionResponseError: (callback) => {
        const handler = (_, error) => callback(error);
        electron_1.ipcRenderer.on(exports.PROCESSING_EVENTS.ACTION_RESPONSE_ERROR, handler);
        return () => electron_1.ipcRenderer.removeListener(exports.PROCESSING_EVENTS.ACTION_RESPONSE_ERROR, handler);
    },
    onResetView: (callback) => {
        electron_1.ipcRenderer.on("reset-view", callback);
        return () => electron_1.ipcRenderer.removeListener("reset-view", callback);
    },
    onSolutionError: (callback) => {
        const handler = (_, error) => callback(error);
        electron_1.ipcRenderer.on(exports.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR, handler);
        return () => electron_1.ipcRenderer.removeListener(exports.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR, handler);
    },
    onProcessingNoScreenshots: (callback) => {
        electron_1.ipcRenderer.on(exports.PROCESSING_EVENTS.NO_SCREENSHOTS, callback);
        return () => electron_1.ipcRenderer.removeListener(exports.PROCESSING_EVENTS.NO_SCREENSHOTS, callback);
    },
    onUnauthorized: (callback) => {
        electron_1.ipcRenderer.on(exports.PROCESSING_EVENTS.UNAUTHORIZED, callback);
        return () => electron_1.ipcRenderer.removeListener(exports.PROCESSING_EVENTS.UNAUTHORIZED, callback);
    },
    // ★★★ エラーの原因だった箇所 ★★★
    // 未定義だったリスナーをすべて追加
    onSolutionStart: (callback) => {
        electron_1.ipcRenderer.on(exports.PROCESSING_EVENTS.INITIAL_START, callback);
        return () => electron_1.ipcRenderer.removeListener(exports.PROCESSING_EVENTS.INITIAL_START, callback);
    },
    onDebugStart: (callback) => {
        electron_1.ipcRenderer.on(exports.PROCESSING_EVENTS.DEBUG_START, callback);
        return () => electron_1.ipcRenderer.removeListener(exports.PROCESSING_EVENTS.DEBUG_START, callback);
    },
    onDebugSuccess: (callback) => {
        const handler = (_, data) => callback(data);
        electron_1.ipcRenderer.on(exports.PROCESSING_EVENTS.DEBUG_SUCCESS, handler);
        return () => electron_1.ipcRenderer.removeListener(exports.PROCESSING_EVENTS.DEBUG_SUCCESS, handler);
    },
    onDebugError: (callback) => {
        const handler = (_, error) => callback(error);
        electron_1.ipcRenderer.on(exports.PROCESSING_EVENTS.DEBUG_ERROR, handler);
        return () => electron_1.ipcRenderer.removeListener(exports.PROCESSING_EVENTS.DEBUG_ERROR, handler);
    },
    // --- Streaming ---
    onLlmChunk: (callback) => {
        const handler = (_, chunk) => callback(chunk);
        electron_1.ipcRenderer.on("llm-chunk", handler);
        return () => electron_1.ipcRenderer.removeListener("llm-chunk", handler);
    },
    onLlmStreamEnd: (callback) => {
        electron_1.ipcRenderer.on("llm-stream-end", callback);
        return () => electron_1.ipcRenderer.removeListener("llm-stream-end", callback);
    },
    onLlmError: (callback) => {
        const handler = (_, error) => callback(error);
        electron_1.ipcRenderer.on("llm-error", handler);
        return () => electron_1.ipcRenderer.removeListener("llm-error", handler);
    },
    // --- Speech Events ---
    onSpeechRecordingStarted: (callback) => {
        electron_1.ipcRenderer.on("speech-recording-started", (_, data) => callback(data));
        return () => electron_1.ipcRenderer.removeAllListeners("speech-recording-started");
    },
    onSpeechRecordingStopped: (callback) => {
        electron_1.ipcRenderer.on("speech-recording-stopped", (_, data) => callback(data));
        return () => electron_1.ipcRenderer.removeAllListeners("speech-recording-stopped");
    },
    onSpeechInterimResult: (callback) => {
        electron_1.ipcRenderer.on("speech-interim-result", (_, data) => callback(data));
        return () => electron_1.ipcRenderer.removeAllListeners("speech-interim-result");
    },
    onSpeechFinalResult: (callback) => {
        electron_1.ipcRenderer.on("speech-final-result", (_, data) => callback(data));
        return () => electron_1.ipcRenderer.removeAllListeners("speech-final-result");
    },
    onSpeechFinalAnalysis: (callback) => {
        electron_1.ipcRenderer.on("speech-final-analysis", (_, data) => callback(data));
        return () => electron_1.ipcRenderer.removeAllListeners("speech-final-analysis");
    },
    onSpeechTranscriptCleared: (callback) => {
        electron_1.ipcRenderer.on("speech-transcript-cleared", (_, data) => callback(data));
        return () => electron_1.ipcRenderer.removeAllListeners("speech-transcript-cleared");
    },
    onSpeechError: (callback) => {
        electron_1.ipcRenderer.on("speech-error", (_, data) => callback(data));
        return () => electron_1.ipcRenderer.removeAllListeners("speech-error");
    },
    onSpeechSystemAudioSetup: (callback) => {
        electron_1.ipcRenderer.on("speech-system-audio-setup", (_, data) => callback(data));
        return () => electron_1.ipcRenderer.removeAllListeners("speech-system-audio-setup");
    },
    // --- Shortcut Events ---
    onShowAnalysisPrompt: (callback) => {
        electron_1.ipcRenderer.on("show-analysis-prompt", callback);
        return () => electron_1.ipcRenderer.removeListener("show-analysis-prompt", callback);
    },
    onQuickSolveStarted: (callback) => {
        electron_1.ipcRenderer.on("quick-solve-started", callback);
        return () => electron_1.ipcRenderer.removeListener("quick-solve-started", callback);
    },
    onQuickSolveResult: (callback) => {
        const handler = (_, data) => callback(data);
        electron_1.ipcRenderer.on("quick-solve-result", handler);
        return () => electron_1.ipcRenderer.removeListener("quick-solve-result", handler);
    },
    onQuickSolveError: (callback) => {
        const handler = (_, data) => callback(data);
        electron_1.ipcRenderer.on("quick-solve-error", handler);
        return () => electron_1.ipcRenderer.removeListener("quick-solve-error", handler);
    },
});
//# sourceMappingURL=preload.js.map