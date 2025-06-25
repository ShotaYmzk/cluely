import { BrowserWindow, screen } from "electron"
import { AppState } from "main"
import path from "node:path"

// より確実な開発モード判定
const isDev = process.env.NODE_ENV === "development" || 
              process.env.ELECTRON_IS_DEV === "true" || 
              process.env.ELECTRON_IS_DEV === "true" ||
              !process.env.NODE_ENV ||
              process.argv.includes('--dev') ||
              !__dirname.includes('app.asar')

// 開発モードURLを強制的に優先
const startUrl = isDev
  ? "http://localhost:5173"
  : `file://${path.join(__dirname, "../dist/index.html")}`

// デバッグ情報をコンソールに出力
console.log("🔍 Environment Debug Info:")
console.log("   NODE_ENV:", process.env.NODE_ENV)
console.log("   ELECTRON_IS_DEV:", process.env.ELECTRON_IS_DEV)
console.log("   __dirname:", __dirname)
console.log("   process.argv:", process.argv.slice(0, 3))
console.log("   Calculated isDev:", isDev)
console.log("   Target URL:", startUrl)

export class WindowHelper {
  private mainWindow: BrowserWindow | null = null
  private isWindowVisible: boolean = false
  private windowPosition: { x: number; y: number } | null = null
  private windowSize: { width: number; height: number } | null = null
  private appState: AppState

  // Initialize with explicit number type and 0 value
  private screenWidth: number = 0
  private screenHeight: number = 0
  private step: number = 0
  private currentX: number = 0
  private currentY: number = 0

  constructor(appState: AppState) {
    this.appState = appState
  }

  public setWindowDimensions(width: number, height: number): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return

    // Get current window position
    const [currentX, currentY] = this.mainWindow.getPosition()

    // Get screen dimensions
    const primaryDisplay = screen.getPrimaryDisplay()
    const workArea = primaryDisplay.workAreaSize

    // Use 75% width if debugging has occurred, otherwise use 60%
    const maxAllowedWidth = Math.floor(
      workArea.width * (this.appState.getHasDebugged() ? 0.75 : 0.5)
    )

    // Ensure width doesn't exceed max allowed width and height is reasonable
    const newWidth = Math.min(width + 32, maxAllowedWidth)
    const newHeight = Math.ceil(height)

    // Center the window horizontally if it would go off screen
    const maxX = workArea.width - newWidth
    const newX = Math.min(Math.max(currentX, 0), maxX)

    // Update window bounds
    this.mainWindow.setBounds({
      x: newX,
      y: currentY,
      width: newWidth,
      height: newHeight
    })

    // Update internal state
    this.windowPosition = { x: newX, y: currentY }
    this.windowSize = { width: newWidth, height: newHeight }
    this.currentX = newX
  }

  public createWindow(): void {
    if (this.mainWindow !== null) return

    const primaryDisplay = screen.getPrimaryDisplay()
    const workArea = primaryDisplay.workAreaSize
    this.screenWidth = workArea.width
    this.screenHeight = workArea.height

    this.step = Math.floor(this.screenWidth / 10) // 10 steps
    this.currentX = 0 // Start at the left

    const windowSettings: Electron.BrowserWindowConstructorOptions = {
      height: 600,
      minWidth: undefined,
      maxWidth: undefined,
      x: this.currentX,
      y: 0,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js"),
        // 開発モードでのセキュリティ設定を緩和
        webSecurity: !isDev,
        // 追加の開発モード設定
        allowRunningInsecureContent: isDev,
        experimentalFeatures: isDev
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
      // type: 'panel' を削除 - macOSの NSWindow panel styleMask エラーの原因
    }

    this.mainWindow = new BrowserWindow(windowSettings)
    
    // 開発モードでDevToolsを開く（デバッグ用）
    if (isDev) {
      this.mainWindow.webContents.openDevTools()
      console.log("🛠️  DevTools opened for debugging")
    }
    
    this.mainWindow.setContentProtection(true)

    if (process.platform === "darwin") {
      this.mainWindow.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true
      })
      this.mainWindow.setHiddenInMissionControl(true)
      this.mainWindow.setAlwaysOnTop(true, "floating")
    }
    if (process.platform === "linux") {
      // Linux-specific optimizations for stealth overlays
      if (this.mainWindow.setHasShadow) {
        this.mainWindow.setHasShadow(false)
      }
      this.mainWindow.setFocusable(false)
    } 
    this.mainWindow.setSkipTaskbar(true)
    this.mainWindow.setAlwaysOnTop(true)

    // URL読み込みのエラーハンドリングを追加
    console.log(`🌐 Loading URL: ${startUrl}`)
    console.log(`📍 Development mode: ${isDev}`)
    
    // 開発モードの場合、Viteサーバーが起動していることを確認
    if (isDev) {
      this.checkViteServerAndLoad()
    } else {
      this.loadProductionApp()
    }

    const bounds = this.mainWindow.getBounds()
    this.windowPosition = { x: bounds.x, y: bounds.y }
    this.windowSize = { width: bounds.width, height: bounds.height }
    this.currentX = bounds.x
    this.currentY = bounds.y

    this.setupWindowListeners()
    this.isWindowVisible = true
  }

  private async checkViteServerAndLoad(): Promise<void> {
    if (!this.mainWindow) return

    console.log("🔍 Checking if Vite server is running...")
    
    try {
      // Viteサーバーの動作確認
      const response = await fetch("http://localhost:5173")
      if (response.ok) {
        console.log("✅ Vite server is running, loading development URL")
        this.mainWindow.loadURL("http://localhost:5173").catch(this.handleLoadError.bind(this))
      } else {
        throw new Error("Vite server not responding")
      }
    } catch (error) {
      console.error("❌ Vite server is not running!")
      console.error("🚨 Please run 'npm run dev' in another terminal first")
      
      // フォールバック: エラーページを表示
      this.showErrorPage("Vite server not running. Please run 'npm run dev' first.")
    }
  }

  private loadProductionApp(): void {
    if (!this.mainWindow) return

    const productionPath = path.join(__dirname, "../dist/index.html")
    console.log(`📦 Loading production app from: ${productionPath}`)
    
    this.mainWindow.loadFile(productionPath).catch((error) => {
      console.error("❌ Failed to load production app:", error)
      this.showErrorPage("Production build not found. Please run 'npm run build' first.")
    })
  }

  private showErrorPage(message: string): void {
    if (!this.mainWindow) return

    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cluely - Error</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
          }
          .error-container {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 15px;
            padding: 40px;
            text-align: center;
            max-width: 500px;
            backdrop-filter: blur(10px);
          }
          h1 { color: #ff6b6b; margin-bottom: 20px; }
          .code { background: rgba(0,0,0,0.5); padding: 10px; border-radius: 5px; margin: 20px 0; }
          .steps { text-align: left; margin: 20px 0; }
          .steps li { margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h1>🚨 Cluely Startup Error</h1>
          <p><strong>Problem:</strong> ${message}</p>
          
          <div class="steps">
            <h3>🔧 How to fix:</h3>
            <ol>
              <li><strong>Open a new terminal</strong></li>
              <li><strong>Navigate to project folder:</strong>
                <div class="code">cd ${process.cwd()}</div>
              </li>
              <li><strong>Start Vite server:</strong>
                <div class="code">npm run dev</div>
              </li>
              <li><strong>Wait for "Local: http://localhost:5173/" message</strong></li>
              <li><strong>Then restart this app</strong></li>
            </ol>
          </div>
          
          <p><small>Or use: <code>npm run app:dev</code> for automatic startup</small></p>
        </div>
      </body>
      </html>
    `
    
    this.mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`)
  }

  private handleLoadError(error: any): void {
    console.error("❌ Failed to load URL:", error)
    console.error("🔍 Attempted URL:", startUrl)
    
    if (isDev) {
      console.error("🚨 Vite server not running! Please run 'npm run dev' in another terminal")
      this.showErrorPage("Vite development server is not running")
    } else {
      console.error("🚨 Production build not found! Please run 'npm run build' first")
      this.showErrorPage("Production build not found")
    }
  }

  private setupWindowListeners(): void {
    if (!this.mainWindow) return

    // Webコンテンツの読み込み完了時のログ
    this.mainWindow.webContents.once('did-finish-load', () => {
      console.log("✅ Window content loaded successfully")
    })

    // エラー時のログ
    this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error("❌ Failed to load content:")
      console.error("   Error Code:", errorCode)
      console.error("   Description:", errorDescription)
      console.error("   URL:", validatedURL)
      
      if (isDev && validatedURL.includes("localhost:5173")) {
        console.error("🚨 Vite server not running! Please run 'npm run dev' in another terminal")
      }
    })

    this.mainWindow.on("move", () => {
      if (this.mainWindow) {
        const bounds = this.mainWindow.getBounds()
        this.windowPosition = { x: bounds.x, y: bounds.y }
        this.currentX = bounds.x
        this.currentY = bounds.y
      }
    })

    this.mainWindow.on("resize", () => {
      if (this.mainWindow) {
        const bounds = this.mainWindow.getBounds()
        this.windowSize = { width: bounds.width, height: bounds.height }
      }
    })

    this.mainWindow.on("closed", () => {
      this.mainWindow = null
      this.isWindowVisible = false
      this.windowPosition = null
      this.windowSize = null
    })
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow
  }

  public isVisible(): boolean {
    return this.isWindowVisible
  }

  public hideMainWindow(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      console.warn("Main window does not exist or is destroyed.")
      return
    }

    const bounds = this.mainWindow.getBounds()
    this.windowPosition = { x: bounds.x, y: bounds.y }
    this.windowSize = { width: bounds.width, height: bounds.height }
    this.mainWindow.hide()
    this.isWindowVisible = false
  }

  public showMainWindow(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      console.warn("Main window does not exist or is destroyed.")
      return
    }

    if (this.windowPosition && this.windowSize) {
      this.mainWindow.setBounds({
        x: this.windowPosition.x,
        y: this.windowPosition.y,
        width: this.windowSize.width,
        height: this.windowSize.height
      })
    }

    this.mainWindow.show()
    this.isWindowVisible = true
  }

  public moveWindowLeft(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return

    this.currentX = Math.max(0, this.currentX - this.step)
    const bounds = this.mainWindow.getBounds()
    this.mainWindow.setBounds({
      x: this.currentX,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height
    })
  }

  public moveWindowRight(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return

    const maxX = this.screenWidth - this.mainWindow.getBounds().width
    this.currentX = Math.min(maxX, this.currentX + this.step)
    const bounds = this.mainWindow.getBounds()
    this.mainWindow.setBounds({
      x: this.currentX,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height
    })
  }

  public moveWindowDown(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return

    const maxY = this.screenHeight - this.mainWindow.getBounds().height
    this.currentY = Math.min(maxY, this.currentY + this.step)
    const bounds = this.mainWindow.getBounds()
    this.mainWindow.setBounds({
      x: bounds.x,
      y: this.currentY,
      width: bounds.width,
      height: bounds.height
    })
  }

  public moveWindowUp(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return

    this.currentY = Math.max(0, this.currentY - this.step)
    const bounds = this.mainWindow.getBounds()
    this.mainWindow.setBounds({
      x: bounds.x,
      y: this.currentY,
      width: bounds.width,
      height: bounds.height
    })
  }

  public moveWindow(deltaX: number, deltaY: number): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return

    const bounds = this.mainWindow.getBounds()
    const newX = Math.max(0, Math.min(this.screenWidth - bounds.width, bounds.x + deltaX))
    const newY = Math.max(0, Math.min(this.screenHeight - bounds.height, bounds.y + deltaY))

    this.mainWindow.setBounds({
      x: newX,
      y: newY,
      width: bounds.width,
      height: bounds.height
    })

    this.currentX = newX
    this.currentY = newY
  }
}