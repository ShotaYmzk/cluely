"use strict";
// ipcHandlers.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeIpcHandlers = initializeIpcHandlers;
const electron_1 = require("electron");
function initializeIpcHandlers(appState) {
    electron_1.ipcMain.handle("update-content-dimensions", async (event, { width, height }) => {
        if (width && height) {
            appState.setWindowDimensions(width, height);
        }
    });
    electron_1.ipcMain.handle("delete-screenshot", async (event, path) => {
        return appState.deleteScreenshot(path);
    });
    electron_1.ipcMain.handle("take-screenshot", async () => {
        try {
            const screenshotPath = await appState.takeScreenshot();
            const preview = await appState.getImagePreview(screenshotPath);
            return { path: screenshotPath, preview };
        }
        catch (error) {
            console.error("Error taking screenshot:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("get-screenshots", async () => {
        console.log({ view: appState.getView() });
        try {
            let previews = [];
            if (appState.getView() === "queue") {
                previews = await Promise.all(appState.getScreenshotQueue().map(async (path) => ({
                    path,
                    preview: await appState.getImagePreview(path)
                })));
            }
            else {
                previews = await Promise.all(appState.getExtraScreenshotQueue().map(async (path) => ({
                    path,
                    preview: await appState.getImagePreview(path)
                })));
            }
            previews.forEach((preview) => console.log(preview.path));
            return previews;
        }
        catch (error) {
            console.error("Error getting screenshots:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("toggle-window", async () => {
        appState.toggleMainWindow();
    });
    electron_1.ipcMain.handle("reset-queues", async () => {
        try {
            appState.clearQueues();
            console.log("Screenshot queues have been cleared.");
            return { success: true };
        }
        catch (error) {
            console.error("Error resetting queues:", error);
            return { success: false, error: error.message };
        }
    });
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
    electron_1.ipcMain.handle("quit-app", () => {
        electron_1.app.quit();
    });
    // Window movement handlers
    electron_1.ipcMain.handle("move-window-left", async () => {
        appState.moveWindowLeft();
    });
    electron_1.ipcMain.handle("move-window-right", async () => {
        appState.moveWindowRight();
    });
    electron_1.ipcMain.handle("move-window", async (event, deltaX, deltaY) => {
        appState.moveWindow(deltaX, deltaY);
    });
    // 🎤 音声+スクリーンショット統合処理
    electron_1.ipcMain.handle("process-voice-and-screenshot", async (event, { voiceText, screenshotPath }) => {
        try {
            console.log("🎤 音声+画面解析処理開始:", { voiceText, screenshotPath });
            // スクリーンショットパスを確認
            if (!screenshotPath || !screenshotPath.path) {
                throw new Error("スクリーンショットパスが無効です");
            }
            const imagePath = screenshotPath.path || screenshotPath;
            // LLMHelperを使用して画像から問題を抽出
            const problemInfo = await appState.processingHelper.getLLMHelper().extractProblemFromImages([imagePath]);
            // 音声入力をプロンプトに追加
            const enhancedProblemInfo = {
                ...problemInfo,
                voice_input: voiceText,
                problem_statement: `${problemInfo.problem_statement}\n\n音声での質問: "${voiceText}"`,
                context: `${problemInfo.context}\n\nユーザーが音声で「${voiceText}」と質問しています。画面の内容と音声の質問を総合的に考慮して回答してください。`
            };
            // AI回答生成
            const solution = await appState.processingHelper.getLLMHelper().generateSolution(enhancedProblemInfo);
            console.log("🤖 音声+画面解析処理完了");
            return {
                success: true,
                solution,
                problemInfo: enhancedProblemInfo,
                voiceText,
                screenshotPath: imagePath
            };
        }
        catch (error) {
            console.error("音声+画面解析処理でエラー:", error);
            return {
                success: false,
                error: error.message,
                solution: {
                    answer: `処理中にエラーが発生しました: ${error.message}`
                }
            };
        }
    });
    // 🎤 音声のみ処理
    electron_1.ipcMain.handle("process-voice-only", async (event, { voiceText }) => {
        try {
            console.log("🎤 音声のみ処理開始:", voiceText);
            // 音声入力のみの場合の処理（型を明示的に指定）
            const problemInfo = {
                problem_statement: `ユーザーからの音声質問: "${voiceText}"`,
                context: "音声のみでの質問です。画面情報は利用できません。",
                voice_input: voiceText,
                answer: "",
                explanation: "",
                suggested_responses: [],
                reasoning: ""
            };
            // AI回答生成
            const solution = await appState.processingHelper.getLLMHelper().generateSolution(problemInfo);
            console.log("🤖 音声のみ処理完了");
            return {
                success: true,
                solution,
                problemInfo,
                voiceText
            };
        }
        catch (error) {
            console.error("音声のみ処理でエラー:", error);
            return {
                success: false,
                error: error.message,
                solution: {
                    answer: `音声処理中にエラーが発生しました: ${error.message}。スクリーンショット機能と組み合わせてより詳細な分析を行ってください。`
                }
            };
        }
    });
    // 🎤 音声認識テスト用（デバッグ）
    electron_1.ipcMain.handle("test-voice-recognition", async (event, { testText }) => {
        try {
            console.log("🎤 音声認識テスト:", testText);
            return {
                success: true,
                received: testText,
                timestamp: new Date().toISOString(),
                message: "音声認識テストが正常に動作しています！"
            };
        }
        catch (error) {
            console.error("音声認識テストエラー:", error);
            return {
                success: false,
                error: error.message
            };
        }
    });
    console.log("🎤 音声処理IPCハンドラーが登録されました"); // デバッグ用ログ
}
// electron/ipcHandlers.ts の最後に追加
// 🔧 接続テスト用pingハンドラー
electron_1.ipcMain.handle("ping", async () => {
    console.log("🔧 Ping受信 - ElectronAPI正常動作");
    return "pong - ElectronAPI接続OK!";
});
//# sourceMappingURL=ipcHandlers.js.map