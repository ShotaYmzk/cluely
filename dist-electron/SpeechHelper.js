"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeechHelper = void 0;
const AudioHelper_1 = require("./AudioHelper");
class SpeechHelper {
    llmHelper;
    audioHelper;
    mainWindow;
    isRecording = false;
    mediaRecorder = null;
    audioChunks = [];
    recordingStartTime = 0;
    silenceTimer = null;
    currentTranscript = "";
    systemAudioSetup = false;
    constructor(llmHelper, mainWindow) {
        this.llmHelper = llmHelper;
        this.audioHelper = new AudioHelper_1.AudioHelper();
        this.mainWindow = mainWindow;
    }
    setMainWindow(mainWindow) {
        this.mainWindow = mainWindow;
    }
    async startRealtimeRecording(includeSystemAudio = true) {
        if (this.isRecording) {
            console.log("Already recording");
            return;
        }
        try {
            // システム音声録音のセットアップ（オプション）
            if (includeSystemAudio && this.audioHelper.isBlackHoleInstalled()) {
                const setupSuccess = await this.audioHelper.setupSystemAudioCapture();
                this.systemAudioSetup = setupSuccess;
                if (setupSuccess) {
                    this.sendToRenderer('speech-system-audio-setup', { success: true });
                }
                else {
                    this.sendToRenderer('speech-system-audio-setup', {
                        success: false,
                        message: 'システム音声録音のセットアップに失敗しました'
                    });
                }
            }
            // マイクと（可能であれば）システム音声の両方を取得
            const micStream = await this.getMicrophoneStream();
            const systemStream = includeSystemAudio ? await this.getSystemAudioStream() : null;
            // ストリームを合成
            const combinedStream = this.combineAudioStreams(micStream, systemStream);
            this.mediaRecorder = new MediaRecorder(combinedStream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            this.audioChunks = [];
            this.recordingStartTime = Date.now();
            this.isRecording = true;
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                    this.processAudioChunk(event.data);
                }
            };
            this.mediaRecorder.onstop = () => {
                this.processCompleteRecording();
            };
            // 100ms間隔で音声データを処理（リアルタイム性を向上）
            this.mediaRecorder.start(100);
            // UI更新
            this.sendToRenderer('speech-recording-started', {
                timestamp: this.recordingStartTime,
                includeSystemAudio: includeSystemAudio && (systemStream !== null),
                blackHoleAvailable: this.audioHelper.isBlackHoleInstalled()
            });
            console.log("Realtime recording started");
        }
        catch (error) {
            console.error("Failed to start realtime recording:", error);
            this.sendToRenderer('speech-error', {
                error: 'マイクアクセスに失敗しました。ブラウザの設定でマイクの使用を許可してください。'
            });
        }
    }
    stopRealtimeRecording() {
        if (!this.isRecording || !this.mediaRecorder) {
            return;
        }
        this.mediaRecorder.stop();
        this.isRecording = false;
        if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
        }
        // ストリームを停止
        const tracks = this.mediaRecorder.stream.getTracks();
        tracks.forEach(track => track.stop());
        // システム音声録音のセットアップを解除
        if (this.systemAudioSetup) {
            this.audioHelper.teardownSystemAudioCapture();
            this.systemAudioSetup = false;
        }
        // UI更新
        this.sendToRenderer('speech-recording-stopped', {
            finalTranscript: this.currentTranscript,
            timestamp: Date.now()
        });
        console.log("Realtime recording stopped");
    }
    async getMicrophoneStream() {
        const optimizedSettings = this.audioHelper.getOptimizedAudioSettings();
        return await navigator.mediaDevices.getUserMedia({
            audio: {
                ...optimizedSettings,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 16000 // 音声認識用に16kHzに最適化
            }
        });
    }
    async getSystemAudioStream() {
        try {
            // macOSでBlackHoleデバイスを使用してシステム音声をキャプチャ
            const devices = await navigator.mediaDevices.enumerateDevices();
            const blackHoleDevice = devices.find(device => device.kind === 'audioinput' &&
                (device.label.includes('BlackHole') || device.label.includes('Soundflower')));
            if (blackHoleDevice) {
                return await navigator.mediaDevices.getUserMedia({
                    audio: {
                        deviceId: blackHoleDevice.deviceId,
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false
                    }
                });
            }
        }
        catch (error) {
            console.log("System audio not available, using microphone only:", error);
        }
        return null;
    }
    combineAudioStreams(micStream, systemStream) {
        if (!systemStream) {
            return micStream;
        }
        // Web Audio APIを使用して音声ストリームを合成
        const audioContext = new AudioContext();
        const micSource = audioContext.createMediaStreamSource(micStream);
        const systemSource = audioContext.createMediaStreamSource(systemStream);
        const merger = audioContext.createChannelMerger(2);
        const destination = audioContext.createMediaStreamDestination();
        micSource.connect(merger, 0, 0);
        systemSource.connect(merger, 0, 1);
        merger.connect(destination);
        return destination.stream;
    }
    async processAudioChunk(chunk) {
        try {
            // 音声チャンクをBase64に変換
            const base64Data = await this.blobToBase64(chunk);
            // Google Speech-to-TextまたはWeb Speech APIでリアルタイム認識
            const result = await this.recognizeSpeech(base64Data, chunk.type);
            if (result) {
                this.currentTranscript = result.text;
                // リアルタイムでUIに送信
                this.sendToRenderer('speech-interim-result', {
                    text: result.text,
                    isInterim: result.isInterim,
                    timestamp: result.timestamp
                });
                // 音声が途切れた場合の処理
                this.resetSilenceTimer();
            }
        }
        catch (error) {
            console.error("Error processing audio chunk:", error);
        }
    }
    async recognizeSpeech(base64Data, mimeType) {
        try {
            // Google Gemini APIで音声認識（既存の実装を活用）
            const result = await this.llmHelper.analyzeAudioFromBase64(base64Data, mimeType);
            return {
                text: result.text,
                isInterim: false, // Gemini APIの結果は最終結果
                timestamp: Date.now()
            };
        }
        catch (error) {
            console.error("Speech recognition error:", error);
            return null;
        }
    }
    resetSilenceTimer() {
        if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
        }
        // 2秒間無音が続いたら文字起こしを確定
        this.silenceTimer = setTimeout(() => {
            if (this.currentTranscript.trim()) {
                this.sendToRenderer('speech-final-result', {
                    text: this.currentTranscript,
                    timestamp: Date.now()
                });
                // トランスクリプトをクリア
                this.currentTranscript = "";
            }
        }, 2000);
    }
    async processCompleteRecording() {
        if (this.audioChunks.length === 0) {
            return;
        }
        try {
            // 最終的な音声ファイルを作成
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            const base64Data = await this.blobToBase64(audioBlob);
            // 最終的な分析
            const finalResult = await this.llmHelper.analyzeAudioFromBase64(base64Data, audioBlob.type);
            this.sendToRenderer('speech-final-analysis', {
                text: finalResult.text,
                timestamp: Date.now(),
                duration: Date.now() - this.recordingStartTime
            });
        }
        catch (error) {
            console.error("Error processing complete recording:", error);
        }
    }
    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result.split(',')[1]);
                }
                else {
                    reject(new Error('Failed to convert blob to base64'));
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
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
        this.currentTranscript = "";
        this.sendToRenderer('speech-transcript-cleared', {
            timestamp: Date.now()
        });
    }
    // **新規追加: AudioHelper機能の公開**
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