"use strict";
// electron/ProcessingHelper.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessingHelper = void 0;
const LLMHelper_1 = require("./LLMHelper");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class ProcessingHelper {
    appState;
    llmHelper;
    currentProcessingAbortController = null;
    constructor(appState) {
        this.appState = appState;
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY not found in environment variables");
        }
        this.llmHelper = new LLMHelper_1.LLMHelper(apiKey);
    }
    // Add missing methods that are referenced in ipcHandlers.ts
    async processScreenshots() {
        await this.processInputs();
    }
    async processExtraScreenshots() {
        await this.processInputs();
    }
    async processInputs() {
        const mainWindow = this.appState.getMainWindow();
        if (!mainWindow || mainWindow.isDestroyed())
            return;
        this.cancelOngoingRequests();
        this.currentProcessingAbortController = new AbortController();
        const screenshotQueue = this.appState.getScreenshotQueue();
        if (screenshotQueue.length === 0) {
            mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.NO_SCREENSHOTS);
            return;
        }
        mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.INITIAL_START);
        this.appState.setView("solutions");
        const lastInputPath = screenshotQueue[screenshotQueue.length - 1];
        const isAudio = lastInputPath.endsWith('.mp3') || lastInputPath.endsWith('.wav');
        const onChunk = (chunk) => {
            if (!mainWindow.isDestroyed()) {
                mainWindow.webContents.send('llm-chunk', chunk);
            }
        };
        const onError = (error) => {
            if (!mainWindow.isDestroyed()) {
                mainWindow.webContents.send('llm-error', error.message);
            }
            this.currentProcessingAbortController = null;
        };
        const onEnd = () => {
            if (!mainWindow.isDestroyed()) {
                mainWindow.webContents.send('llm-stream-end');
            }
            this.currentProcessingAbortController = null;
        };
        if (isAudio) {
            // Use existing analyzeAudioFile method instead of non-existent generateStreamFromAudio
            try {
                const result = await this.llmHelper.analyzeAudioFile(lastInputPath);
                onChunk(result.text);
                onEnd();
            }
            catch (error) {
                onError(error);
            }
        }
        else {
            // Use existing extractProblemFromImages method instead of non-existent generateStreamFromImages
            try {
                const result = await this.llmHelper.extractProblemFromImages(screenshotQueue);
                onChunk(JSON.stringify(result, null, 2));
                onEnd();
            }
            catch (error) {
                onError(error);
            }
        }
    }
    cancelOngoingRequests() {
        if (this.currentProcessingAbortController) {
            this.currentProcessingAbortController.abort();
            this.currentProcessingAbortController = null;
            console.log("進行中のリクエストをキャンセルしました。");
        }
    }
    // These methods call the non-streaming methods in LLMHelper to fix compile errors
    async processAudioBase64(data, mimeType) {
        return this.llmHelper.analyzeAudioFromBase64(data, mimeType);
    }
    async processAudioFile(filePath) {
        return this.llmHelper.analyzeAudioFile(filePath);
    }
    getLLMHelper() {
        return this.llmHelper;
    }
    async processActionResponse(action) {
        const mainWindow = this.appState.getMainWindow();
        if (!mainWindow)
            return;
        const problemInfo = this.appState.getProblemInfo();
        if (!problemInfo) {
            console.error("No problem info available for action response");
            return;
        }
        try {
            // Use analyzeImageFile method since generateActionResponse doesn't exist
            const imagePaths = this.appState.getScreenshotQueue();
            if (imagePaths.length > 0) {
                const actionResponse = await this.llmHelper.analyzeImageFile(imagePaths[imagePaths.length - 1]);
                mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.ACTION_RESPONSE_GENERATED, actionResponse);
            }
        }
        catch (error) {
            console.error("Action response processing error:", error);
            mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.ACTION_RESPONSE_ERROR, error.message);
        }
    }
    // **音声+スクリーンショット処理**
    async processVoiceAndScreenshot(voiceText, screenshotPath) {
        try {
            return await this.llmHelper.analyzeScreenWithPrompt(screenshotPath, voiceText);
        }
        catch (error) {
            console.error("Error processing voice and screenshot:", error);
            throw error;
        }
    }
    // **音声のみ処理**
    async processVoiceOnly(voiceText) {
        try {
            // 音声のみの場合は、テキストをそのまま分析
            const response = {
                text: `音声入力を受け取りました: "${voiceText}"\n\n画面をキャプチャして詳細な分析を行うには、スクリーンショット機能と組み合わせてください。`,
                timestamp: Date.now(),
                type: 'voice-only'
            };
            return response;
        }
        catch (error) {
            console.error("Error processing voice only:", error);
            throw error;
        }
    }
}
exports.ProcessingHelper = ProcessingHelper;
//# sourceMappingURL=ProcessingHelper.js.map