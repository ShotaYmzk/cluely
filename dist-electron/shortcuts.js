"use strict";
// electron/shortcuts.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShortcutsHelper = void 0;
const electron_1 = require("electron");
class ShortcutsHelper {
    appState;
    constructor(appState) {
        this.appState = appState;
    }
    registerGlobalShortcuts() {
        electron_1.globalShortcut.register("CommandOrControl+H", async () => {
            const mainWindow = this.appState.getMainWindow();
            if (mainWindow) {
                console.log("Taking screenshot...");
                try {
                    const screenshotPath = await this.appState.takeScreenshot();
                    const preview = await this.appState.getImagePreview(screenshotPath);
                    mainWindow.webContents.send("screenshot-taken", {
                        path: screenshotPath,
                        preview
                    });
                }
                catch (error) {
                    console.error("Error capturing screenshot:", error);
                }
            }
        });
        // This shortcut now starts the streaming process
        electron_1.globalShortcut.register("CommandOrControl+Enter", async () => {
            await this.appState.processingHelper.processInputs();
        });
        electron_1.globalShortcut.register("CommandOrControl+R", () => {
            console.log("Command + R pressed. Resetting...");
            this.appState.processingHelper.cancelOngoingRequests();
            this.appState.clearQueues();
            const mainWindow = this.appState.getMainWindow();
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send("reset-view");
            }
        });
        // Window movement shortcuts
        electron_1.globalShortcut.register("CommandOrControl+Left", () => this.appState.moveWindowLeft());
        electron_1.globalShortcut.register("CommandOrControl+Right", () => this.appState.moveWindowRight());
        electron_1.globalShortcut.register("CommandOrControl+Down", () => this.appState.moveWindowDown());
        electron_1.globalShortcut.register("CommandOrControl+Up", () => this.appState.moveWindowUp());
        electron_1.globalShortcut.register("CommandOrControl+B", () => {
            this.appState.toggleMainWindow();
            const mainWindow = this.appState.getMainWindow();
            if (mainWindow && this.appState.isVisible()) {
                mainWindow.focus();
                mainWindow.moveTop();
            }
        });
        electron_1.app.on("will-quit", () => {
            electron_1.globalShortcut.unregisterAll();
        });
    }
}
exports.ShortcutsHelper = ShortcutsHelper;
//# sourceMappingURL=shortcuts.js.map