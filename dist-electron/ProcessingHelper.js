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
            await this.llmHelper.generateStreamFromAudio(lastInputPath, onChunk, onError, onEnd);
        }
        else {
            await this.llmHelper.generateStreamFromImages(screenshotQueue, onChunk, onError, onEnd);
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
            const actionResponse = await this.llmHelper.generateActionResponse(problemInfo, action);
            mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.ACTION_RESPONSE_GENERATED, actionResponse);
        }
        catch (error) {
            console.error("Action response processing error:", error);
            mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.ACTION_RESPONSE_ERROR, error.message);
        }
    }
}
exports.ProcessingHelper = ProcessingHelper;
//# sourceMappingURL=ProcessingHelper.js.map