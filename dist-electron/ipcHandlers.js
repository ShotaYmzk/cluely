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
    electron_1.ipcMain.handle("quit-app", () => electron_1.app.quit());
    // Window movement handlers
    electron_1.ipcMain.handle("move-window-left", () => appState.moveWindowLeft());
    electron_1.ipcMain.handle("move-window-right", () => appState.moveWindowRight());
    electron_1.ipcMain.handle("move-window", (event, deltaX, deltaY) => appState.moveWindow(deltaX, deltaY));
}
//# sourceMappingURL=ipcHandlers.js.map