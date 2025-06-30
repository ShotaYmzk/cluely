"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeechHelper = void 0;
const AudioHelper_1 = require("./AudioHelper");
class SpeechHelper {
    llmHelper;
    audioHelper; // publicに変更してmain.tsからアクセス可能に
    mainWindow;
    isRecording = false;
    systemAudioSetup = false;
    constructor(llmHelper, mainWindow) {
        this.llmHelper = llmHelper;
        this.audioHelper = new AudioHelper_1.AudioHelper();
        this.mainWindow = mainWindow;
    }
    setMainWindow(mainWindow) {
        this.mainWindow = mainWindow;
    }
    // このメソッドはレンダラーから呼び出されることを想定
    async startRealtimeRecording(includeSystemAudio = true) {
        if (this.isRecording) {
            console.log("Already recording");
            return;
        }
        // システム音声のセットアップのみMainプロセスで行う
        if (includeSystemAudio && this.audioHelper.isBlackHoleInstalled()) {
            const setupSuccess = await this.audioHelper.setupSystemAudioCapture();
            this.systemAudioSetup = setupSuccess;
            this.sendToRenderer('speech-system-audio-setup', { success: setupSuccess });
        }
        this.isRecording = true;
        // 実際の録音開始はレンダラーに通知
        this.sendToRenderer('speech-recording-started', {
            timestamp: Date.now(),
            includeSystemAudio: includeSystemAudio && this.systemAudioSetup,
            blackHoleAvailable: this.audioHelper.isBlackHoleInstalled()
        });
        console.log("Realtime recording initiated from main process.");
    }
    stopRealtimeRecording() {
        if (!this.isRecording) {
            return;
        }
        this.isRecording = false;
        // システム音声のセットアップを解除
        if (this.systemAudioSetup) {
            this.audioHelper.teardownSystemAudioCapture();
            this.systemAudioSetup = false;
        }
        // 録音停止をレンダラーに通知
        this.sendToRenderer('speech-recording-stopped', {
            timestamp: Date.now()
        });
        console.log("Realtime recording stopped from main process.");
    }
    // AI分析はMainプロセスで行う
    async analyzeAudioChunk(base64Data, mimeType) {
        try {
            const result = await this.llmHelper.analyzeAudioFromBase64(base64Data, mimeType);
            this.sendToRenderer('speech-final-analysis', result);
        }
        catch (error) {
            console.error("Error analyzing audio chunk:", error);
            this.sendToRenderer('speech-error', { error: "音声チャンクの分析に失敗しました" });
        }
    }
    sendToRenderer(event, data) {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(event, data);
        }
    }
    isCurrentlyRecording() {
        return this.isRecording;
    }
    clearTranscript() {
        this.sendToRenderer('speech-transcript-cleared', {
            timestamp: Date.now()
        });
    }
    // AudioHelperのメソッドをラップして公開
    async getAudioDevices() {
        return await this.audioHelper.getAvailableAudioDevices();
    }
    isBlackHoleInstalled() {
        return this.audioHelper.isBlackHoleInstalled();
    }
    async installBlackHole() {
        return await this.audioHelper.installBlackHole();
    }
    async testSystemAudioCapture() {
        return await this.audioHelper.testSystemAudioCapture();
    }
    async checkAudioPermissions() {
        return await this.audioHelper.checkAudioPermissions();
    }
    async setupSystemAudio() {
        if (this.audioHelper.isBlackHoleInstalled()) {
            const success = await this.audioHelper.setupSystemAudioCapture();
            this.systemAudioSetup = success;
            return success;
        }
        return false;
    }
    async teardownSystemAudio() {
        await this.audioHelper.teardownSystemAudioCapture();
        this.systemAudioSetup = false;
    }
}
exports.SpeechHelper = SpeechHelper;
//# sourceMappingURL=SpeechHelper.js.map