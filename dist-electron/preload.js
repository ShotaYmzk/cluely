"use strict";
// electron/preload.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROCESSING_EVENTS = void 0;
const electron_1 = require("electron");
exports.PROCESSING_EVENTS = {
    UNAUTHORIZED: "procesing-unauthorized",
    NO_SCREENSHOTS: "processing-no-screenshots",
    INITIAL_START: "initial-start",
    ACTION_RESPONSE_GENERATED: "action-response-generated",
    ACTION_RESPONSE_ERROR: "action-response-error"
};
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    // General
    updateContentDimensions: (dims) => electron_1.ipcRenderer.invoke("update-content-dimensions", dims),
    quitApp: () => electron_1.ipcRenderer.invoke("quit-app"),
    // Screenshots
    takeScreenshot: () => electron_1.ipcRenderer.invoke("take-screenshot"),
    getScreenshots: () => electron_1.ipcRenderer.invoke("get-screenshots"),
    deleteScreenshot: (path) => electron_1.ipcRenderer.invoke("delete-screenshot", path),
    // Window Movement
    moveWindow: (deltaX, deltaY) => electron_1.ipcRenderer.invoke("move-window", deltaX, deltaY),
    // Non-streaming analysis (for compatibility)
    analyzeAudioFromBase64: (data, mimeType) => electron_1.ipcRenderer.invoke("analyze-audio-base64", data, mimeType),
    processActionResponse: (action) => electron_1.ipcRenderer.invoke("process-action-response", action),
    // --- Event Listeners ---
    onScreenshotTaken: (callback) => {
        const sub = (_, data) => callback(data);
        electron_1.ipcRenderer.on("screenshot-taken", sub);
        return () => electron_1.ipcRenderer.removeListener("screenshot-taken", sub);
    },
    onResetView: (callback) => {
        const sub = () => callback();
        electron_1.ipcRenderer.on("reset-view", sub);
        return () => electron_1.ipcRenderer.removeListener("reset-view", sub);
    },
    onSolutionStart: (callback) => {
        const sub = () => callback();
        electron_1.ipcRenderer.on(exports.PROCESSING_EVENTS.INITIAL_START, sub);
        return () => electron_1.ipcRenderer.removeListener(exports.PROCESSING_EVENTS.INITIAL_START, sub);
    },
    onProcessingNoScreenshots: (callback) => {
        const sub = () => callback();
        electron_1.ipcRenderer.on(exports.PROCESSING_EVENTS.NO_SCREENSHOTS, sub);
        return () => electron_1.ipcRenderer.removeListener(exports.PROCESSING_EVENTS.NO_SCREENSHOTS, sub);
    },
    // --- NEW Streaming API Listeners ---
    onLlmChunk: (callback) => {
        const subscription = (_, chunk) => callback(chunk);
        electron_1.ipcRenderer.on('llm-chunk', subscription);
        return () => electron_1.ipcRenderer.removeListener('llm-chunk', subscription);
    },
    onLlmStreamEnd: (callback) => {
        const subscription = () => callback();
        electron_1.ipcRenderer.on('llm-stream-end', subscription);
        return () => electron_1.ipcRenderer.removeListener('llm-stream-end', subscription);
    },
    onLlmError: (callback) => {
        const subscription = (_, error) => callback(error);
        electron_1.ipcRenderer.on('llm-error', subscription);
        return () => electron_1.ipcRenderer.removeListener('llm-error', subscription);
    },
});
//# sourceMappingURL=preload.js.map