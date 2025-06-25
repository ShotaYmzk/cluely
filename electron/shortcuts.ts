// electron/shortcuts.ts

import { globalShortcut, app } from "electron"
import { AppState } from "./main"

export class ShortcutsHelper {
  private appState: AppState

  constructor(appState: AppState) {
    this.appState = appState
  }

  public registerGlobalShortcuts(): void {
    globalShortcut.register("CommandOrControl+H", async () => {
      const mainWindow = this.appState.getMainWindow()
      if (mainWindow) {
        console.log("Taking screenshot...")
        try {
          const screenshotPath = await this.appState.takeScreenshot()
          const preview = await this.appState.getImagePreview(screenshotPath)
          mainWindow.webContents.send("screenshot-taken", {
            path: screenshotPath,
            preview
          })
        } catch (error) {
          console.error("Error capturing screenshot:", error)
        }
      }
    })

    // This shortcut now starts the streaming process
    globalShortcut.register("CommandOrControl+Enter", async () => {
      await this.appState.processingHelper.processInputs()
    })

    globalShortcut.register("CommandOrControl+R", () => {
      console.log("Command + R pressed. Resetting...")
      this.appState.processingHelper.cancelOngoingRequests()
      this.appState.clearQueues()
      const mainWindow = this.appState.getMainWindow()
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("reset-view")
      }
    })

    // Window movement shortcuts
    globalShortcut.register("CommandOrControl+Left", () => this.appState.moveWindowLeft())
    globalShortcut.register("CommandOrControl+Right", () => this.appState.moveWindowRight())
    globalShortcut.register("CommandOrControl+Down", () => this.appState.moveWindowDown())
    globalShortcut.register("CommandOrControl+Up", () => this.appState.moveWindowUp())

    globalShortcut.register("CommandOrControl+B", () => {
      this.appState.toggleMainWindow()
      const mainWindow = this.appState.getMainWindow()
      if (mainWindow && this.appState.isVisible()) {
        mainWindow.focus()
        mainWindow.moveTop()
      }
    })

    app.on("will-quit", () => {
      globalShortcut.unregisterAll()
    })
  }
}