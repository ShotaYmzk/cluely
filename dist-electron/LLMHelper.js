"use strict";
// electron/LLMHelper.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMHelper = void 0;
const generative_ai_1 = require("@google/generative-ai");
const fs_1 = __importDefault(require("fs"));
class LLMHelper {
    model;
    systemPromptText = `あなたはWingman AIです。どんな問題や状況（コーディングに限らず）でも役立つ、積極的なアシスタントです。ユーザーの入力に対して、状況を分析し、明確な問題文、関連するコンテキストを理解し、具体的な回答や解決策を直接提供してください。

**重要な指示**:
- 問題が明確な場合は、必ず具体的な回答や解決策を提供してください
- 「自分で考えましょう」「まず理解しましょう」のような一般的なアドバイスは避けてください
- 選択肢がある場合は、正しい選択肢を選んで回答してください
- 数学問題の場合は、計算過程を含めて具体的な答えを提供してください
- プログラミング問題の場合は、実際のコードを提供してください
- クイズやテスト問題の場合は、正しい答えを直接示してください
- 常に推論を説明し、なぜその回答が正しいのかを明確にしてください

そしてユーザーが次に取れる可能性のある複数の具体的なアクションや次のステップを提案します。日本語で回答してください。

**重要**: 回答は必ずMarkdown形式で提供してください。見出し、リスト、強調、コードブロックなどを適切に使用して、読みやすく構造化された回答を作成してください。`;
    constructor(apiKey) {
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        // 古いライブラリバージョンとの互換性のため、systemInstructionは使用しない
        this.model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-lite-preview-06-17",
        });
    }
    createContentWithSystemPrompt(userParts) {
        return [
            { role: "user", parts: [{ text: this.systemPromptText }] },
            { role: "model", parts: [{ text: "はい、承知いたしました。どのようなご用件でしょうか？" }] },
            { role: "user", parts: userParts }
        ];
    }
    async fileToGenerativePart(path, mimeType) {
        const fileData = await fs_1.default.promises.readFile(path);
        return {
            inlineData: {
                data: fileData.toString("base64"),
                mimeType: mimeType
            }
        };
    }
    // --- NEW: Streaming Methods ---
    async generateStreamFromImages(imagePaths, onChunk, onError, onEnd) {
        try {
            const imageParts = await Promise.all(imagePaths.map(path => this.fileToGenerativePart(path, "image/png")));
            const userPromptPart = { text: "これらの画像を分析し、問題点、解決策、そして次のステップを提案してください。" };
            const content = this.createContentWithSystemPrompt([userPromptPart, ...imageParts]);
            const result = await this.model.generateContentStream({ contents: content });
            for await (const chunk of result.stream) {
                onChunk(chunk.text());
            }
            onEnd();
        }
        catch (error) {
            console.error("画像からのストリーム生成でエラーが発生しました:", error);
            onError(error);
        }
    }
    async generateStreamFromAudio(audioPath, onChunk, onError, onEnd) {
        try {
            const audioPart = await this.fileToGenerativePart(audioPath, "audio/mp3");
            const userPromptPart = { text: "この音声の内容を分析し、要点と次のアクションを提案してください。" };
            const content = this.createContentWithSystemPrompt([userPromptPart, audioPart]);
            const result = await this.model.generateContentStream({ contents: content });
            for await (const chunk of result.stream) {
                onChunk(chunk.text());
            }
            onEnd();
        }
        catch (error) {
            console.error("音声からのストリーム生成でエラーが発生しました:", error);
            onError(error);
        }
    }
    // --- LEGACY: Non-Streaming Methods ---
    async generateNonStreamResponse(userParts) {
        const content = this.createContentWithSystemPrompt(userParts);
        const result = await this.model.generateContent({ contents: content });
        const response = await result.response;
        return { text: response.text() };
    }
    async analyzeAudioFile(audioPath) {
        const audioPart = await this.fileToGenerativePart(audioPath, "audio/mp3");
        const promptPart = { text: "この音声クリップを短く簡潔に説明してください。" };
        const result = await this.generateNonStreamResponse([promptPart, audioPart]);
        return { text: result.text, timestamp: Date.now() };
    }
    async analyzeAudioFromBase64(data, mimeType) {
        // TODO: Implement actual logic
        return "analyzeAudioFromBase64: Not implemented";
    }
    async analyzeImageFile(imagePath) {
        const imagePart = await this.fileToGenerativePart(imagePath, "image/png");
        const promptPart = { text: "この画像の内容を短く簡潔に説明してください。" };
        const result = await this.generateNonStreamResponse([promptPart, imagePart]);
        return { text: result.text, timestamp: Date.now() };
    }
    async generateActionResponse(problemInfo, action) {
        const promptText = `ユーザーは以下の状況で「${action}」というアクションを選択しました。\n状況: ${JSON.stringify(problemInfo)}\n\nこのアクションに対する具体的で役立つ応答を生成してください。`;
        const result = await this.generateNonStreamResponse([{ text: promptText }]);
        return { action_response: { concrete_answer: result.text } };
    }
    async extractProblemFromImages(imagePaths) {
        // TODO: Implement actual logic
        return {
            problem_statement: "ダミー問題文",
            context: "ダミーコンテキスト"
        };
    }
    async generateSolution(problemInfo) {
        // TODO: Implement actual logic
        return {
            answer: "ダミー回答",
            explanation: "ダミー解説",
            suggested_responses: [],
            reasoning: "ダミー推論"
        };
    }
}
exports.LLMHelper = LLMHelper;
//# sourceMappingURL=LLMHelper.js.map