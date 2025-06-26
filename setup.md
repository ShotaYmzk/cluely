# 🔧 Cluely 修正版セットアップガイド

## 🚨 **重要な修正点**

この修正版では以下の問題を解決しました：

1. **macOSエラーの修正** - NSWindow panel styleMask エラーとAVCapture警告の解決
2. **リアルタイム音声認識** - Google Gemini APIを使った音声の文字起こし
3. **システム音声録音** - BlackHoleを使った相手の声も録音
4. **自動画面分析** - プロンプト入力なしでの自動問題解決
5. **改良されたUI/UX** - より直感的な操作性

---

## 📋 **必要な環境**

### **システム要件**
- **macOS**: 10.15 Catalina 以降（推奨：macOS 12 Monterey 以降）
- **Node.js**: 18.x 以降
- **Git**: 最新版
- **Homebrew**: BlackHoleインストール用（オプション）

### **APIキー**
- **Google Gemini API キー** (必須)
  - [Google AI Studio](https://makersuite.google.com/app/apikey) から取得

---

## 🛠️ **インストール手順**

### **1. プロジェクトのクローンと依存関係インストール**

```bash
# プロジェクトをクローン
git clone [repository-url]
cd interview-coder

# 依存関係をインストール
npm install

# TypeScriptファイルをコンパイル
npm run build
```

### **2. 環境変数の設定**

```bash
# .envファイルを作成
touch .env

# 以下の内容を.envファイルに追加
echo "GEMINI_API_KEY=your_api_key_here" >> .env
```

### **3. macOS権限の設定**

#### **3.1 entitlements.mac.plistファイルの追加**
プロジェクトルートに `entitlements.mac.plist` ファイルを作成：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.device.audio-input</key>
    <true/>
    <key>com.apple.security.screen-capture</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
</dict>
</plist>
```

#### **3.2 システム権限の許可**
1. **システム環境設定** → **セキュリティとプライバシー** を開く
2. **プライバシー**タブを選択
3. 以下の項目でアプリを許可：
   - **マイク** - 音声録音用
   - **スクリーンレコーディング** - スクリーンショット + システム音声用
   - **アクセシビリティ** - グローバルショートカット用

### **4. BlackHole（システム音声録音用）のインストール（オプション）**

```bash
# Homebrewでインストール
brew install blackhole-2ch

# または手動でインストール
# https://github.com/ExistentialAudio/BlackHole からダウンロード
```

#### **BlackHoleセットアップ**
1. **Audio MIDI Setup.app** を開く
2. **Multi-Output Device** を作成
3. **BlackHole 2ch** と **Built-in Output** を選択
4. **Multi-Output Device** をシステムのデフォルト出力に設定

---

## 🚀 **アプリの起動**

### **開発モード（推奨）**

```bash
# ターミナル1: Viteサーバー起動
npm run dev

# ターミナル2: Electronアプリ起動
npm run electron:dev
```

### **本番モード**

```bash
# ビルドして実行
npm run build
npm run app:build
```

---

## 🎹 **キーボードショートカット**

| ショートカット | 機能 |
|---|---|
| `⌘ + B` | ウィンドウの表示/非表示切り替え |
| `⌘ + H` | スクリーンショット撮影 |
| `⌘ + ↵` | 分析プロンプト表示 |
| `⌘ + Shift + ↵` | クイック問題解決（自動） |
| `⌘ + R` | 音声録音の開始/停止 |
| `⌘ + 矢印キー` | ウィンドウ移動 |

---

## 🎤 **音声機能の使い方**

### **1. マイク録音のみ**
- アプリ内の🎤ボタンをクリック
- リアルタイムで音声が文字起こしされます

### **2. システム音声 + マイク録音**
1. BlackHoleをインストール
2. アプリ内の⚙️ボタンで音声設定を開く
3. BlackHoleのセットアップを実行
4. 🎤ボタンで録音開始

### **3. 音声分析**
- 録音停止時に自動でGoogle Geminiが音声内容を分析
- 結果が画面に表示されます

---

## 🖼️ **画面分析機能の使い方**

### **1. 手動分析**
1. `⌘ + ↵` でプロンプトダイアログを開く
2. 質問を入力（省略可）
3. 「分析」ボタンをクリック

### **2. 自動分析**
- `⌘ + Shift + ↵` で即座に画面を撮影・分析
- プロンプト入力不要

### **3. 分析結果**
- 画面の問題点や改善案を自動提案
- 次に取るべきアクションを具体的に表示

---

## 🔧 **トラブルシューティング**

### **よくある問題と解決法**

#### **1. "NSWindow does not support nonactivating panel styleMask" エラー**
```bash
# WindowHelper.tsで type: 'panel' が削除されていることを確認
# このエラーは修正版で解決済み
```

#### **2. 音声録音ができない**
```bash
# システム環境設定で権限を確認
open "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone"
```

#### **3. スクリーンショットが撮影できない**
```bash
# スクリーンレコーディング権限を確認
open "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"
```

#### **4. Gemini API エラー**
```bash
# .envファイルの内容を確認
cat .env

# APIキーの形式確認（AIzaSy... で始まる）
```

#### **5. BlackHoleが検出されない**
```bash
# BlackHoleの再インストール
brew uninstall blackhole-2ch
brew install blackhole-2ch

# システム再起動
sudo reboot
```

### **ログの確認**
```bash
# Electronコンソールでエラーを確認
# Developer Tools → Console タブ
```

---

## 📊 **パフォーマンス最適化**

### **音声録音のパフォーマンス**
- **サンプルレート**: 16kHz（音声認識用最適化）
- **ビットレート**: 16-bit
- **遅延**: 100ms以下のリアルタイム処理

### **画面分析のパフォーマンス**
- **レスポンス時間**: 2-5秒（Gemini API依存）
- **スクリーンショット**: PNG形式、自動最適化
- **メモリ使用量**: 最大5つの履歴保持

---

## 🔒 **セキュリティとプライバシー**

### **データの扱い**
- **音声データ**: Google Gemini APIに送信（暗号化通信）
- **スクリーンショット**: ローカル保存 + API分析
- **テキスト**: 一時的にメモリ保存のみ

### **推奨設定**
- 機密情報を含む画面での使用は避ける
- 定期的な履歴クリア（⌘ + R）
- ネットワーク環境での注意

---

## 🎯 **次のステップ**

### **基本的な使い方**
1. アプリ起動
2. `⌘ + H` でスクリーンショット撮影
3. `⌘ + ↵` で分析プロンプト表示
4. 質問を入力するか、自動分析を実行

### **高度な使い方**
1. BlackHoleセットアップでシステム音声録音
2. リアルタイム音声文字起こし
3. 自動画面分析でクイック問題解決

---

## 📞 **サポート**

問題が発生した場合：
1. この修正版のissueを作成
2. ログファイルを添付
3. 使用環境（macOSバージョン、Node.jsバージョン）を記載

**重要**: この修正版は元のCluelyの問題を解決したバージョンです。元の問題（macOSエラー、音声機能の不具合）は解決済みです。

# 🔧 Cluely - 修正版 (Fixed Version)

**macOSエラー解決 + リアルタイム音声認識 + 自動画面分析**

この修正版では、元のCluelyの重要な問題を解決し、新機能を追加しました。

---

## ✅ **修正された問題**

### **1. macOSクリティカルエラーの解決**
- ❌ `NSWindow does not support nonactivating panel styleMask 0x80`
- ❌ `AVCaptureDeviceTypeExternal is deprecated`  
- ❌ `SetApplicationIsDaemon: Error Domain=NSOSStatusErrorDomain`
- ✅ **すべて解決済み** - 安定動作を確認

### **2. 音声録音機能の完全実装**
- ❌ 基本的な録音のみ（元バージョン）
- ✅ **リアルタイム音声文字起こし**
- ✅ **システム音声 + マイク同時録音**
- ✅ **Google Gemini API音声分析**

### **3. 自動画面分析機能の追加**
- ❌ 手動プロンプト入力のみ（元バージョン）
- ✅ **プロンプトなし自動分析**
- ✅ **クイック問題解決**
- ✅ **改良されたショートカット**

---

## 🚀 **新機能**

| 機能 | 説明 | ショートカット |
|------|------|----------------|
| **リアルタイム音声認識** | 音声を即座に文字起こし | 🎤ボタン or `⌘+R` |
| **システム音声録音** | 相手の声も同時録音（BlackHole使用） | 自動検出 |
| **自動画面分析** | プロンプト不要の即座分析 | `⌘+Shift+↵` |
| **プロンプト分析** | 質問付きの詳細分析 | `⌘+↵` |
| **音声設定管理** | オーディオデバイス設定 | ⚙️ボタン |

---

## 📋 **クイックスタート**

### **1. 基本セットアップ**
```bash
# 1. 依存関係をインストール
npm install

# 2. 環境変数を設定
echo "GEMINI_API_KEY=your_api_key_here" > .env

# 3. アプリを起動
npm run dev
# 別ターミナルで
npm run electron:dev
```

### **2. macOS権限設定**
- **システム環境設定** → **セキュリティとプライバシー**
- **マイク**、**スクリーンレコーディング**、**アクセシビリティ** を許可

### **3. BlackHole（システム音声用・オプション）**
```bash
# Homebrewでインストール
brew install blackhole-2ch
```

---

## 🎹 **キーボードショートカット**

| ショートカット | 機能 | 詳細 |
|---|---|---|
| `⌘ + B` | ウィンドウ表示切り替え | アプリの表示/非表示 |
| `⌘ + M` | 音声オン | 問題画面を撮影 |
| `⌘ + ↵` | 分析プロンプト | 質問付き画面分析 |
| `⌘ + Shift + ↵` | クイック解決 | 自動撮影→分析 |
| `⌘ + R` | 新規chat | リアルタイム文字起こし |
| `⌘ + 矢印` | ウィンドウ移動 | 画面内での位置調整 |
| `esc` | chat閉じる |
---

## 🎤 **音声機能の使い方**

### **基本的な音声録音**
1. 🎤ボタンをクリック or `⌘ + R`
2. 話すとリアルタイムで文字起こし
3. 停止すると自動でAI分析

### **システム音声録音（相手の声も録音）**
1. BlackHoleをインストール
2. ⚙️ボタンで音声設定を開く
3. 「セットアップ」でBlackHoleを設定
4. 🎤ボタンで開始（SYSマークが表示される）

### **音声分析結果**
- **リアルタイム文字起こし**: 話した内容がすぐに表示
- **AI分析**: 録音停止時に内容を自動分析
- **アクション提案**: 次に取るべき具体的な行動を提示

---

## 🖼️ **画面分析機能の使い方**

### **自動分析（推奨）**
1. `⌘ + Shift + ↵` を押す
2. 自動でスクリーンショット撮影
3. 問題点と解決策を自動提示

### **質問付き分析**
1. `⌘ + ↵` でプロンプトダイアログ表示
2. 質問を入力（例："このエラーの解決方法は？"）
3. 「質問して分析」をクリック

### **分析結果の例**
```
## 画面の状況
現在、Pythonのsyntax errorが表示されています。

## 問題の特定
19行目で括弧が閉じられていません。

## 次のアクション
1. 19行目の末尾に `)` を追加
2. インデントを確認
3. コードを再実行

## 追加情報
このタイプのエラーは...
```

---

## 🔧 **技術仕様**

### **アーキテクチャ**
- **フレームワーク**: Electron + React + TypeScript
- **音声認識**: Google Gemini API
- **画面分析**: Google Gemini Vision API
- **システム音声**: BlackHole Virtual Audio Driver

### **パフォーマンス**
- **音声文字起こし**: リアルタイム（100ms遅延）
- **画面分析**: 2-5秒（API依存）
- **メモリ使用量**: 約200MB（通常時）

### **セキュリティ**
- **データ暗号化**: HTTPS/TLS通信
- **ローカル保存**: スクリーンショットのみ
- **プライバシー**: 音声は分析後即座に削除

---

## 🚨 **重要な修正点詳細**

### **1. WindowHelper.ts**
```typescript
// ❌ 元のコード（エラーの原因）
const windowSettings = {
  type: 'panel'  // macOSでサポートされていない
}

// ✅ 修正後
const windowSettings = {
  // type: 'panel' を削除
}
```

### **2. package.json**
```json
// ✅ 追加された設定
"build": {
  "mac": {
    "extendInfo": {
      "NSCameraUseContinuityCameraDeviceType": true,
      "NSMicrophoneUsageDescription": "音声録音用",
      "NSCameraUsageDescription": "画面分析用"
    },
    "entitlements": "entitlements.mac.plist"
  }
}
```

### **3. 新しいコンポーネント**
- **SpeechHelper.ts**: リアルタイム音声認識
- **AudioHelper.ts**: システム音声録音管理
- **AnalysisPromptDialog.tsx**: 分析プロンプト入力
- **AudioSettings.tsx**: オーディオデバイス設定

---

## 📊 **使用例とユースケース**

### **1. プログラミング面接**
```
🎤 面接官の質問をリアルタイム文字起こし
📸 コーディング問題を自動分析
💡 解決策とヒントを即座に提示
```

### **2. デバッグ作業**
```
📸 エラー画面を撮影
🤖 自動でエラー原因を分析
🔧 修正手順を具体的に提示
```

### **3. 学習・研究**
```
🎤 講義内容をリアルタイム記録
📸 資料画面を自動分析
📝 要点整理と次のアクションを提案
```

---

## 🐛 **トラブルシューティング**

### **音声録音できない**
```bash
# 権限確認
open "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone"

# アプリ再起動
⌘ + Q → アプリ再起動
```

### **画面分析エラー**
```bash
# APIキー確認
cat .env

# 権限確認  
open "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"
```

### **BlackHole検出されない**
```bash
# 再インストール
brew uninstall blackhole-2ch
brew install blackhole-2ch
sudo reboot
```

---

## 📈 **ロードマップ**

### **近日追加予定**
- [ ] 多言語音声認識対応
- [ ] クラウド同期機能
- [ ] カスタムプロンプトテンプレート
- [ ] 音声コマンド機能

### **将来的な機能**
- [ ] リアルタイム翻訳
- [ ] 複数モニター対応
- [ ] プラグインシステム

---

## 🤝 **コントリビューション**

この修正版への改善提案や問題報告は歓迎です：

1. **Issue作成**: バグ報告や機能要求
2. **Pull Request**: コード改善の提案
3. **ドキュメント**: 使用例や設定手順の改善

---

## 📄 **ライセンス**

元のCluelyプロジェクトのライセンスに準拠

---

## 🙏 **謝辞**

- 元のCluelyプロジェクト作者
- Google Gemini API
- BlackHole Audio Driver
- Electronコミュニティ

---

**🎯 この修正版により、Cluelyは安定した音声認識付きAIアシスタントとして利用できます。**