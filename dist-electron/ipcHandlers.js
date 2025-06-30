"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeIpcHandlers = initializeIpcHandlers;
const electron_1 = require("electron");
function initializeIpcHandlers(appState) {
    // Existing handlers...
    electron_1.ipcMain.handle("take-screenshot", async () => {
        try {
            const screenshotPath = await appState.takeScreenshot();
            return { success: true, path: screenshotPath };
        }
        catch (error) {
            console.error("Error taking screenshot:", error);
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle("get-screenshots", async () => {
        try {
            const screenshots = await appState.getScreenshots();
            return screenshots;
        }
        catch (error) {
            console.error("Error getting screenshots:", error);
            return [];
        }
    });
    electron_1.ipcMain.handle("get-image-preview", async (event, filepath) => {
        try {
            const preview = await appState.getImagePreview(filepath);
            return preview;
        }
        catch (error) {
            console.error("Error getting image preview:", error);
            return null;
        }
    });
    electron_1.ipcMain.handle("delete-screenshot", async (event, path) => {
        try {
            const result = await appState.deleteScreenshot(path);
            return result;
        }
        catch (error) {
            console.error("Error deleting screenshot:", error);
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle("update-content-dimensions", async (event, dimensions) => {
        try {
            appState.updateContentDimensions(dimensions);
            return { success: true };
        }
        catch (error) {
            console.error("Error updating content dimensions:", error);
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle("process-screenshots", async () => {
        try {
            await appState.processingHelper.processScreenshots();
            return { success: true };
        }
        catch (error) {
            console.error("Error processing screenshots:", error);
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle("process-extra-screenshots", async () => {
        try {
            await appState.processingHelper.processExtraScreenshots();
            return { success: true };
        }
        catch (error) {
            console.error("Error processing extra screenshots:", error);
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle("reset-queues", async () => {
        try {
            const screenshotHelper = appState.getScreenshotHelper();
            screenshotHelper.resetQueues();
            return { success: true };
        }
        catch (error) {
            console.error("Error resetting queues:", error);
            return { success: false, error: error.message };
        }
    });
    // **音声録音関連**
    electron_1.ipcMain.handle("start-realtime-recording", (event, includeSystemAudio) => appState.startRealtimeRecording(includeSystemAudio));
    electron_1.ipcMain.handle("stop-realtime-recording", () => appState.stopRealtimeRecording());
    electron_1.ipcMain.handle("is-recording", () => appState.isRecording());
    electron_1.ipcMain.handle("clear-speech-transcript", () => appState.clearSpeechTranscript());
    // **音声分析用ハンドラー (新規追加)**
    electron_1.ipcMain.handle("analyze-audio-chunk", async (event, { base64Data, mimeType }) => {
        try {
            await appState.speechHelper.analyzeAudioChunk(base64Data, mimeType);
            return { success: true };
        }
        catch (error) {
            console.error("Error analyzing audio chunk in IPC handler:", error);
            return { success: false, error: error.message };
        }
    });
    // **オーディオデバイス関連**
    electron_1.ipcMain.handle("get-audio-devices", () => appState.getAudioDevices());
    electron_1.ipcMain.handle("is-blackhole-installed", () => appState.isBlackHoleInstalled());
    electron_1.ipcMain.handle("install-blackhole", () => appState.installBlackHole());
    electron_1.ipcMain.handle("test-system-audio-capture", () => appState.testSystemAudioCapture());
    electron_1.ipcMain.handle("check-audio-permissions", () => appState.checkAudioPermissions());
    electron_1.ipcMain.handle("setup-system-audio", () => appState.setupSystemAudio());
    electron_1.ipcMain.handle("teardown-system-audio", () => appState.teardownSystemAudio());
    // IPC handler for analyzing audio from base64 data
    electron_1.ipcMain.handle("analyze-audio-base64", async (event, data, mimeType) => {
        try {
            const result = await appState.processingHelper.processAudioBase64(data, mimeType);
            return result;
        }
        catch (error) {
            console.error("Error in analyze-audio-base64 handler:", error);
            throw error;
        }
    });
    // IPC handler for analyzing audio from file path
    electron_1.ipcMain.handle("analyze-audio-file", async (event, path) => {
        try {
            const result = await appState.processingHelper.processAudioFile(path);
            return result;
        }
        catch (error) {
            console.error("Error in analyze-audio-file handler:", error);
            throw error;
        }
    });
    // IPC handler for analyzing image from file path
    electron_1.ipcMain.handle("analyze-image-file", async (event, path) => {
        try {
            const result = await appState.processingHelper.getLLMHelper().analyzeImageFile(path);
            return result;
        }
        catch (error) {
            console.error("Error in analyze-image-file handler:", error);
            throw error;
        }
    });
    // **画面分析関連**
    electron_1.ipcMain.handle("analyze-screen-automatically", async (event, imagePath) => {
        try {
            const result = await appState.analyzeScreenAutomatically(imagePath);
            return { success: true, ...result };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle("analyze-screen-with-prompt", async (event, imagePath, prompt) => {
        try {
            const result = await appState.analyzeScreenWithPrompt(imagePath, prompt);
            return { success: true, ...result };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    });
    // **現在の画面を自動分析**
    electron_1.ipcMain.handle("analyze-current-screen", async () => {
        try {
            // スクリーンショット撮影
            const screenshotPath = await appState.takeScreenshot();
            // 音声が録音中の場合、音声も含めて分析
            let prompt = "画面の内容を詳しく分析してください。";
            if (appState.isRecording()) {
                prompt += " 現在音声も録音中です。画面の情報と合わせて総合的に分析してください。";
            }
            // 画面分析実行
            const result = await appState.analyzeScreenWithPrompt(screenshotPath, prompt);
            return result.text || "分析結果を取得できませんでした。";
        }
        catch (error) {
            console.error("Error in analyze-current-screen handler:", error);
            return "画面分析中にエラーが発生しました。";
        }
    });
    // **ウィンドウ表示/非表示切り替え**
    electron_1.ipcMain.handle("toggle-window", () => {
        try {
            if (appState.isVisible()) {
                appState.hideMainWindow();
            }
            else {
                appState.showMainWindow();
            }
        }
        catch (error) {
            console.error("Error toggling window:", error);
        }
    });
    // **Thinking Mode設定**
    electron_1.ipcMain.handle("set-thinking-mode", async (event, enabled) => {
        try {
            const llmHelper = appState.processingHelper.getLLMHelper();
            llmHelper.setThinkingMode(enabled);
            return { success: true, thinkingMode: enabled };
        }
        catch (error) {
            console.error("Error setting thinking mode:", error);
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle("get-thinking-mode", async () => {
        try {
            const llmHelper = appState.processingHelper.getLLMHelper();
            return { success: true, thinkingMode: llmHelper.getThinkingMode() };
        }
        catch (error) {
            console.error("Error getting thinking mode:", error);
            return { success: false, error: error.message };
        }
    });
    // IPC handler for processing action responses
    electron_1.ipcMain.handle("process-action-response", async (event, action) => {
        try {
            await appState.processingHelper.processActionResponse(action);
            return { success: true };
        }
        catch (error) {
            console.error("Error in process-action-response handler:", error);
            throw error;
        }
    });
    // **音声+スクリーンショット処理**
    electron_1.ipcMain.handle("process-voice-and-screenshot", async (event, { voiceText, screenshotPath }) => {
        try {
            const result = await appState.processingHelper.processVoiceAndScreenshot(voiceText, screenshotPath);
            return { success: true, solution: result };
        }
        catch (error) {
            console.error("Error in process-voice-and-screenshot handler:", error);
            return { success: false, error: error.message };
        }
    });
    // **音声のみ処理**
    electron_1.ipcMain.handle("process-voice-only", async (event, { voiceText }) => {
        try {
            const result = await appState.processingHelper.processVoiceOnly(voiceText);
            return { success: true, solution: result };
        }
        catch (error) {
            console.error("Error in process-voice-only handler:", error);
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle("quit-app", () => electron_1.app.quit());
    // Window movement handlers
    electron_1.ipcMain.handle("move-window-left", () => appState.moveWindowLeft());
    electron_1.ipcMain.handle("move-window-right", () => appState.moveWindowRight());
    electron_1.ipcMain.handle("move-window", (event, deltaX, deltaY) => appState.moveWindow(deltaX, deltaY));
}
//# sourceMappingURL=ipcHandlers.js.map