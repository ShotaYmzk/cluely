"use strict";
// electron/main.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppState = void 0;
const electron_1 = require("electron");
const ipcHandlers_1 = require("./ipcHandlers");
const WindowHelper_1 = require("./WindowHelper");
const ScreenshotHelper_1 = require("./ScreenshotHelper");
const shortcuts_1 = require("./shortcuts");
const ProcessingHelper_1 = require("./ProcessingHelper");
const SpeechHelper_1 = require("./SpeechHelper");
const LLMHelper_1 = require("./LLMHelper");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class AppState {
    static instance = null;
    windowHelper;
    screenshotHelper; // public for shortcuts
    shortcutsHelper;
    processingHelper;
    speechHelper;
    llmHelper;
    view = "queue";
    problemInfo = null;
    hasDebugged = false;
    PROCESSING_EVENTS = {
        UNAUTHORIZED: "procesing-unauthorized",
        NO_SCREENSHOTS: "processing-no-screenshots",
        INITIAL_START: "initial-start",
        PROBLEM_EXTRACTED: "problem-extracted",
        SOLUTION_SUCCESS: "solution-success",
        INITIAL_SOLUTION_ERROR: "solution-error",
        DEBUG_START: "debug-start",
        DEBUG_SUCCESS: "debug-success",
        DEBUG_ERROR: "debug-error",
        ACTION_RESPONSE_GENERATED: "action-response-generated",
        ACTION_RESPONSE_ERROR: "action-response-error"
    };
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY not found in environment variables");
        }
        this.llmHelper = new LLMHelper_1.LLMHelper(apiKey);
        this.windowHelper = new WindowHelper_1.WindowHelper(this);
        this.screenshotHelper = new ScreenshotHelper_1.ScreenshotHelper(this.view);
        this.processingHelper = new ProcessingHelper_1.ProcessingHelper(this);
        this.speechHelper = new SpeechHelper_1.SpeechHelper(this.llmHelper, null);
        this.shortcutsHelper = new shortcuts_1.ShortcutsHelper(this);
    }
    static getInstance() {
        if (!AppState.instance) {
            AppState.instance = new AppState();
        }
        return AppState.instance;
    }
    getMainWindow() {
        return this.windowHelper.getMainWindow();
    }
    getLLMHelper() {
        return this.llmHelper;
    }
    getView() {
        return this.view;
    }
    setView(view) {
        this.view = view;
        this.screenshotHelper.setView(view);
    }
    isVisible() {
        return this.windowHelper.isVisible();
    }
    getScreenshotHelper() {
        return this.screenshotHelper;
    }
    getProblemInfo() {
        return this.problemInfo;
    }
    setProblemInfo(problemInfo) {
        this.problemInfo = problemInfo;
    }
    getScreenshotQueue() {
        return this.screenshotHelper.getScreenshotQueue();
    }
    getExtraScreenshotQueue() {
        return this.screenshotHelper.getExtraScreenshotQueue();
    }
    createWindow() {
        this.windowHelper.createWindow();
        this.speechHelper.setMainWindow(this.getMainWindow());
    }
    showMainWindow() {
        this.windowHelper.showMainWindow();
    }
    hideMainWindow() {
        this.windowHelper.hideMainWindow();
    }
    updateContentDimensions(dimensions) {
        this.windowHelper.setWindowDimensions(dimensions.width, dimensions.height);
    }
    async takeScreenshot() {
        const screenshotPath = await this.screenshotHelper.takeScreenshot(() => this.hideMainWindow(), () => this.showMainWindow());
        console.log(`🖼️  Screenshot saved: ${screenshotPath}`);
        const mainWindow = this.getMainWindow();
        if (mainWindow) {
            mainWindow.webContents.send("screenshot-taken", screenshotPath);
        }
        return screenshotPath;
    }
    async getScreenshots() {
        return this.screenshotHelper.getScreenshots();
    }
    async getImagePreview(filepath) {
        return this.screenshotHelper.getImagePreview(filepath);
    }
    async deleteScreenshot(path) {
        return this.screenshotHelper.deleteScreenshot(path);
    }
    moveWindowLeft() { this.windowHelper.moveWindowLeft(); }
    moveWindowRight() { this.windowHelper.moveWindowRight(); }
    moveWindowDown() { this.windowHelper.moveWindowDown(); }
    moveWindowUp() { this.windowHelper.moveWindowUp(); }
    moveWindow(deltaX, deltaY) { this.windowHelper.moveWindow(deltaX, deltaY); }
    setHasDebugged(value) { this.hasDebugged = value; }
    getHasDebugged() { return this.hasDebugged; }
    // Speech methods (delegating to SpeechHelper)
    async startRealtimeRecording(includeSystemAudio = true) {
        return this.speechHelper.startRealtimeRecording(includeSystemAudio);
    }
    stopRealtimeRecording() { this.speechHelper.stopRealtimeRecording(); }
    isRecording() { return this.speechHelper.isCurrentlyRecording(); }
    clearSpeechTranscript() { this.speechHelper.clearTranscript(); }
    // Audio Helper methods
    async getAudioDevices() { return this.speechHelper.getAudioDevices(); }
    isBlackHoleInstalled() { return this.speechHelper.isBlackHoleInstalled(); }
    async installBlackHole() { return this.speechHelper.installBlackHole(); }
    async testSystemAudioCapture() { return this.speechHelper.testSystemAudioCapture(); }
    async checkAudioPermissions() { return this.speechHelper.checkAudioPermissions(); }
    async setupSystemAudio() { return this.speechHelper.setupSystemAudio(); }
    async teardownSystemAudio() { return this.speechHelper.teardownSystemAudio(); }
    // Screen analysis
    async analyzeScreenAutomatically(imagePath) {
        return this.llmHelper.analyzeScreenAutomatically(imagePath);
    }
    async analyzeScreenWithPrompt(imagePath, prompt) {
        return this.llmHelper.analyzeScreenWithPrompt(imagePath, prompt);
    }
}
exports.AppState = AppState;
async function initializeApp() {
    const appState = AppState.getInstance();
    (0, ipcHandlers_1.initializeIpcHandlers)(appState);
    electron_1.app.whenReady().then(() => {
        console.log("App is ready");
        appState.createWindow();
        appState.shortcutsHelper.registerGlobalShortcuts();
    });
    electron_1.app.on("activate", () => {
        if (appState.getMainWindow() === null) {
            appState.createWindow();
        }
    });
    electron_1.app.on("window-all-closed", () => {
        if (process.platform !== "darwin") {
            electron_1.app.quit();
        }
    });
    electron_1.app.dock?.hide();
    electron_1.app.commandLine.appendSwitch("disable-background-timer-throttling");
}
initializeApp().catch(console.error);
//# sourceMappingURL=main.js.map