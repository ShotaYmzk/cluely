"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowHelper = void 0;
// electron/WindowHelper.ts
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
// より確実な開発モード判定
const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development" || !process.env.PROD;
// URLの決定
const startUrl = isDev
    ? "http://localhost:5173"
    : `file://${node_path_1.default.join(__dirname, "../dist/index.html")}`;
// デバッグ情報をコンソールに出力
console.log("🔍 Environment Debug Info:");
console.log("   NODE_ENV:", process.env.NODE_ENV);
console.log("   isDev:", isDev);
console.log("   Target URL:", startUrl);
console.log("   __dirname:", __dirname);
class WindowHelper {
    mainWindow = null;
    isWindowVisible = false;
    windowPosition = null;
    windowSize = null;
    appState;
    screenWidth = 0;
    screenHeight = 0;
    step = 0;
    currentX = 0;
    currentY = 0;
    constructor(appState) {
        this.appState = appState;
    }
    setWindowDimensions(width, height) {
        if (!this.mainWindow || this.mainWindow.isDestroyed())
            return;
        const [currentX, currentY] = this.mainWindow.getPosition();
        const workArea = electron_1.screen.getPrimaryDisplay().workAreaSize;
        const maxAllowedWidth = Math.floor(workArea.width * (this.appState.getHasDebugged() ? 0.75 : 0.5));
        const newWidth = Math.min(width + 32, maxAllowedWidth);
        const newHeight = Math.ceil(height);
        const maxX = workArea.width - newWidth;
        const newX = Math.min(Math.max(currentX, 0), maxX);
        this.mainWindow.setBounds({ x: newX, y: currentY, width: newWidth, height: newHeight });
        this.windowPosition = { x: newX, y: currentY };
        this.windowSize = { width: newWidth, height: newHeight };
        this.currentX = newX;
    }
    createWindow() {
        if (this.mainWindow !== null)
            return;
        const primaryDisplay = electron_1.screen.getPrimaryDisplay();
        const workArea = primaryDisplay.workAreaSize;
        this.screenWidth = workArea.width;
        this.screenHeight = workArea.height;
        this.step = Math.floor(this.screenWidth / 10);
        this.currentX = 0;
        this.mainWindow = new electron_1.BrowserWindow({
            height: 600,
            x: this.currentX,
            y: 0,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: node_path_1.default.join(__dirname, "preload.js"),
                webSecurity: !isDev,
            },
            show: true,
            alwaysOnTop: true,
            frame: false,
            transparent: true,
            fullscreenable: false,
            hasShadow: false,
            backgroundColor: "#00000000",
            focusable: true,
            movable: true,
            skipTaskbar: true,
        });
        if (isDev) {
            this.mainWindow.webContents.openDevTools({ mode: 'detach' });
            console.log("🛠️  DevTools opened for debugging");
        }
        this.mainWindow.setContentProtection(true);
        if (process.platform === "darwin") {
            this.mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
            this.mainWindow.setHiddenInMissionControl(true);
            this.mainWindow.setAlwaysOnTop(true, "floating");
        }
        this.loadApp();
        const bounds = this.mainWindow.getBounds();
        this.windowPosition = { x: bounds.x, y: bounds.y };
        this.windowSize = { width: bounds.width, height: bounds.height };
        this.currentX = bounds.x;
        this.currentY = bounds.y;
        this.setupWindowListeners();
        this.isWindowVisible = true;
    }
    async loadApp() {
        if (!this.mainWindow)
            return;
        console.log(`🌐 Loading URL: ${startUrl}`);
        try {
            await this.mainWindow.loadURL(startUrl);
            console.log("✅ URL loaded successfully.");
        }
        catch (error) {
            console.error("❌ Failed to load URL:", startUrl, error);
            this.showErrorPage(isDev
                ? "Vite開発サーバーが起動していません。"
                : "プロダクションビルドが見つかりません。");
        }
    }
    showErrorPage(message) {
        if (!this.mainWindow)
            return;
        const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cluely - Error</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #111; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .container { background: #222; border: 1px solid #444; border-radius: 12px; padding: 40px; text-align: center; max-width: 600px; }
          h1 { color: #ff4d4d; margin-bottom: 20px; }
          .code { background: #333; padding: 10px; border-radius: 5px; margin: 20px 0; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚨 アプリケーション起動エラー</h1>
          <p><strong>問題:</strong> ${message}</p>
          ${isDev ? `
            <h3>🔧 解決方法:</h3>
            <ol style="text-align: left;">
              <li>新しいターミナルを開きます。</li>
              <li>プロジェクトフォルダに移動します: <div class="code">cd ${process.cwd()}</div></li>
              <li>開発サーバーを起動します: <div class="code">npm run dev</div></li>
              <li>"Local: http://localhost:5173/" というメッセージが表示されたら、このアプリを再起動してください。</li>
            </ol>
          ` : `
            <h3>🔧 解決方法:</h3>
            <p>アプリケーションをビルドしてください: <code class="code">npm run build</code></p>
          `}
        </div>
      </body>
      </html>
    `;
        this.mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
    }
    setupWindowListeners() {
        if (!this.mainWindow)
            return;
        this.mainWindow.on("move", () => {
            if (this.mainWindow) {
                const bounds = this.mainWindow.getBounds();
                this.windowPosition = { x: bounds.x, y: bounds.y };
                this.currentX = bounds.x;
                this.currentY = bounds.y;
            }
        });
        this.mainWindow.on("resize", () => {
            if (this.mainWindow) {
                const bounds = this.mainWindow.getBounds();
                this.windowSize = { width: bounds.width, height: bounds.height };
            }
        });
        this.mainWindow.on("closed", () => {
            this.mainWindow = null;
            this.isWindowVisible = false;
        });
    }
    getMainWindow() {
        return this.mainWindow;
    }
    isVisible() {
        return this.isWindowVisible;
    }
    hideMainWindow() {
        if (!this.mainWindow || this.mainWindow.isDestroyed())
            return;
        this.mainWindow.hide();
        this.isWindowVisible = false;
    }
    showMainWindow() {
        if (!this.mainWindow || this.mainWindow.isDestroyed()) {
            this.createWindow();
        }
        else {
            this.mainWindow.show();
        }
        this.isWindowVisible = true;
    }
    moveWindowLeft() {
        if (!this.mainWindow || this.mainWindow.isDestroyed())
            return;
        this.currentX = Math.max(0, this.currentX - this.step);
        const bounds = this.mainWindow.getBounds();
        this.mainWindow.setBounds({ x: this.currentX, y: bounds.y, width: bounds.width, height: bounds.height });
    }
    moveWindowRight() {
        if (!this.mainWindow || this.mainWindow.isDestroyed())
            return;
        const maxX = this.screenWidth - this.mainWindow.getBounds().width;
        this.currentX = Math.min(maxX, this.currentX + this.step);
        const bounds = this.mainWindow.getBounds();
        this.mainWindow.setBounds({ x: this.currentX, y: bounds.y, width: bounds.width, height: bounds.height });
    }
    moveWindowDown() {
        if (!this.mainWindow || this.mainWindow.isDestroyed())
            return;
        const maxY = this.screenHeight - this.mainWindow.getBounds().height;
        this.currentY = Math.min(maxY, this.currentY + this.step);
        const bounds = this.mainWindow.getBounds();
        this.mainWindow.setBounds({ x: bounds.x, y: this.currentY, width: bounds.width, height: bounds.height });
    }
    moveWindowUp() {
        if (!this.mainWindow || this.mainWindow.isDestroyed())
            return;
        this.currentY = Math.max(0, this.currentY - this.step);
        const bounds = this.mainWindow.getBounds();
        this.mainWindow.setBounds({ x: bounds.x, y: this.currentY, width: bounds.width, height: bounds.height });
    }
    moveWindow(deltaX, deltaY) {
        if (!this.mainWindow || this.mainWindow.isDestroyed())
            return;
        const bounds = this.mainWindow.getBounds();
        const newX = Math.max(0, Math.min(this.screenWidth - bounds.width, bounds.x + deltaX));
        const newY = Math.max(0, Math.min(this.screenHeight - bounds.height, bounds.y + deltaY));
        this.mainWindow.setBounds({ x: newX, y: newY, width: bounds.width, height: bounds.height });
        this.currentX = newX;
        this.currentY = newY;
    }
}
exports.WindowHelper = WindowHelper;
//# sourceMappingURL=WindowHelper.js.map