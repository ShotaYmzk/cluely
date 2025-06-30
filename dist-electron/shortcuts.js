"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShortcutsHelper = void 0;
const electron_1 = require("electron");
class ShortcutsHelper {
    appState;
    registeredShortcuts = [];
    constructor(appState) {
        this.appState = appState;
    }
    registerGlobalShortcuts() {
        try {
            // Clear existing shortcuts first
            electron_1.globalShortcut.unregisterAll();
            this.registeredShortcuts = [];
            // ウィンドウの表示/非表示切り替え - Cmd/Ctrl + B
            const toggleShortcut = "CommandOrControl+B";
            try {
                electron_1.globalShortcut.register(toggleShortcut, () => {
                    console.log(`${toggleShortcut} pressed - toggling window`);
                    if (this.appState.isVisible()) {
                        this.appState.hideMainWindow();
                    }
                    else {
                        this.appState.showMainWindow();
                    }
                });
                this.registeredShortcuts.push(toggleShortcut);
                console.log(`✅ Registered shortcut: ${toggleShortcut}`);
            }
            catch (error) {
                console.error(`❌ Failed to register shortcut: ${toggleShortcut}`, error);
            }
            // スクリーンショット撮影 - Cmd/Ctrl + H
            const screenshotShortcut = "CommandOrControl+H";
            try {
                electron_1.globalShortcut.register(screenshotShortcut, async () => {
                    console.log(`${screenshotShortcut} pressed - taking screenshot`);
                    try {
                        await this.appState.takeScreenshot();
                    }
                    catch (error) {
                        console.error("Error taking screenshot:", error);
                    }
                });
                this.registeredShortcuts.push(screenshotShortcut);
                console.log(`✅ Registered shortcut: ${screenshotShortcut}`);
            }
            catch (error) {
                console.error(`❌ Failed to register shortcut: ${screenshotShortcut}`, error);
            }
            // **自動分析機能 - Cmd/Ctrl + Enter**
            const autoAnalyzeShortcut = "CommandOrControl+Return";
            try {
                electron_1.globalShortcut.register(autoAnalyzeShortcut, async () => {
                    console.log(`${autoAnalyzeShortcut} pressed - starting auto analysis`);
                    try {
                        // プロンプト入力ダイアログを表示
                        await this.showAnalysisPromptDialog();
                    }
                    catch (error) {
                        console.error("Error in auto analysis:", error);
                    }
                });
                this.registeredShortcuts.push(autoAnalyzeShortcut);
                console.log(`✅ Registered shortcut: ${autoAnalyzeShortcut}`);
            }
            catch (error) {
                console.error(`❌ Failed to register shortcut: ${autoAnalyzeShortcut}`, error);
            }
            // **チャット履歴全消去 - Cmd/Ctrl + R**
            const resetChatShortcut = "CommandOrControl+R";
            try {
                electron_1.globalShortcut.register(resetChatShortcut, async () => {
                    console.log(`${resetChatShortcut} pressed - clearing chat history`);
                    try {
                        // チャット履歴をリセット
                        this.appState.sendToRenderer("reset-view");
                    }
                    catch (error) {
                        console.error("Error clearing chat history:", error);
                    }
                });
                this.registeredShortcuts.push(resetChatShortcut);
                console.log(`✅ Registered shortcut: ${resetChatShortcut}`);
            }
            catch (error) {
                console.error(`❌ Failed to register shortcut: ${resetChatShortcut}`, error);
            }
            // **音声録音切り替え - Cmd/Ctrl + M**
            const voiceToggleShortcut = "CommandOrControl+M";
            try {
                electron_1.globalShortcut.register(voiceToggleShortcut, async () => {
                    console.log(`${voiceToggleShortcut} pressed - toggling voice recording`);
                    try {
                        if (this.appState.isRecording()) {
                            this.appState.stopRealtimeRecording();
                        }
                        else {
                            await this.appState.startRealtimeRecording(true); // システム音声込み
                        }
                    }
                    catch (error) {
                        console.error("Error toggling voice recording:", error);
                    }
                });
                this.registeredShortcuts.push(voiceToggleShortcut);
                console.log(`✅ Registered shortcut: ${voiceToggleShortcut}`);
            }
            catch (error) {
                console.error(`❌ Failed to register shortcut: ${voiceToggleShortcut}`, error);
            }
            // **クイック問題解決 - Cmd/Ctrl + Shift + Enter**
            const quickSolveShortcut = "CommandOrControl+Shift+Return";
            try {
                electron_1.globalShortcut.register(quickSolveShortcut, async () => {
                    console.log(`${quickSolveShortcut} pressed - quick problem solving`);
                    try {
                        // スクリーンショット撮影 → 自動分析 → 解決策提示の一連の流れ
                        await this.executeQuickSolve();
                    }
                    catch (error) {
                        console.error("Error in quick solve:", error);
                    }
                });
                this.registeredShortcuts.push(quickSolveShortcut);
                console.log(`✅ Registered shortcut: ${quickSolveShortcut}`);
            }
            catch (error) {
                console.error(`❌ Failed to register shortcut: ${quickSolveShortcut}`, error);
            }
            // ウィンドウ移動ショートカット
            this.registerWindowMovementShortcuts();
            console.log(`🎹 Registered ${this.registeredShortcuts.length} global shortcuts`);
        }
        catch (error) {
            console.error("Error registering shortcuts:", error);
        }
    }
    registerWindowMovementShortcuts() {
        const movementShortcuts = [
            {
                key: "CommandOrControl+Left",
                action: () => { this.appState.moveWindowLeft(); },
                description: "Move window left"
            },
            {
                key: "CommandOrControl+Right",
                action: () => { this.appState.moveWindowRight(); },
                description: "Move window right"
            },
            {
                key: "CommandOrControl+Up",
                action: () => { this.appState.moveWindowUp(); },
                description: "Move window up"
            },
            {
                key: "CommandOrControl+Down",
                action: () => { this.appState.moveWindowDown(); },
                description: "Move window down"
            }
        ];
        movementShortcuts.forEach(({ key, action, description }) => {
            try {
                electron_1.globalShortcut.register(key, () => {
                    console.log(`${key} pressed - ${description}`);
                    action();
                });
                this.registeredShortcuts.push(key);
                console.log(`✅ Registered shortcut: ${key}`);
            }
            catch (error) {
                console.error(`❌ Failed to register shortcut: ${key}`, error);
            }
        });
    }
    /**
     * 分析プロンプトダイアログを表示
     */
    async showAnalysisPromptDialog() {
        const mainWindow = this.appState.getMainWindow();
        if (!mainWindow)
            return;
        // ウィンドウを表示して、プロンプト入力モードに切り替える
        if (!this.appState.isVisible()) {
            this.appState.showMainWindow();
        }
        // レンダラープロセスにプロンプト入力ダイアログの表示を要求
        mainWindow.webContents.send("show-analysis-prompt");
    }
    /**
     * クイック問題解決の実行
     */
    async executeQuickSolve() {
        const mainWindow = this.appState.getMainWindow();
        if (!mainWindow)
            return;
        try {
            // 1. ウィンドウを表示
            if (!this.appState.isVisible()) {
                this.appState.showMainWindow();
            }
            // 2. 処理開始の通知
            mainWindow.webContents.send("quick-solve-started");
            // 3. スクリーンショットを撮影
            const screenshotPath = await this.appState.takeScreenshot();
            console.log("Screenshot taken for quick solve:", screenshotPath);
            // 4. 自動分析を実行
            const analysis = await this.appState.getLLMHelper().analyzeScreenAutomatically(screenshotPath);
            // 5. 結果をUIに送信
            mainWindow.webContents.send("quick-solve-result", {
                screenshot: screenshotPath,
                analysis: analysis,
                timestamp: Date.now()
            });
            console.log("Quick solve completed successfully");
        }
        catch (error) {
            console.error("Quick solve failed:", error);
            // エラーをUIに通知
            if (mainWindow) {
                mainWindow.webContents.send("quick-solve-error", {
                    error: "自動問題解決に失敗しました",
                    details: error instanceof Error ? error.message : String(error)
                });
            }
        }
    }
    /**
     * 登録されたショートカットをすべて解除
     */
    unregisterAllShortcuts() {
        try {
            electron_1.globalShortcut.unregisterAll();
            this.registeredShortcuts = [];
            console.log("🗑️  Unregistered all shortcuts");
        }
        catch (error) {
            console.error("Error unregistering all shortcuts:", error);
        }
    }
    /**
     * 特定のショートカットを解除
     */
    unregisterShortcut(shortcut) {
        try {
            electron_1.globalShortcut.unregister(shortcut);
            this.registeredShortcuts = this.registeredShortcuts.filter(s => s !== shortcut);
            console.log(`🗑️  Unregistered shortcut: ${shortcut}`);
            return true;
        }
        catch (error) {
            console.error(`Error unregistering shortcut ${shortcut}:`, error);
            return false;
        }
    }
    /**
     * 登録されているショートカット一覧を取得
     */
    getRegisteredShortcuts() {
        return [...this.registeredShortcuts];
    }
    /**
     * ショートカットが登録されているかチェック
     */
    isShortcutRegistered(shortcut) {
        return electron_1.globalShortcut.isRegistered(shortcut);
    }
    /**
     * ショートカットのヘルプ情報を取得
     */
    getShortcutHelp() {
        return {
            "CommandOrControl+B": "ウィンドウの表示/非表示切り替え",
            "CommandOrControl+H": "スクリーンショット撮影",
            "CommandOrControl+Return": "分析プロンプト表示（スクリーンショット分析）",
            "CommandOrControl+Shift+Return": "クイック問題解決（自動スクリーンショット + 分析）",
            "CommandOrControl+R": "チャット履歴全消去・新しいチャット開始",
            "CommandOrControl+M": "音声録音の開始/停止",
            "CommandOrControl+Left": "ウィンドウを左に移動",
            "CommandOrControl+Right": "ウィンドウを右に移動",
            "CommandOrControl+Up": "ウィンドウを上に移動",
            "CommandOrControl+Down": "ウィンドウを下に移動"
        };
    }
}
exports.ShortcutsHelper = ShortcutsHelper;
//# sourceMappingURL=shortcuts.js.map