"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMHelper = void 0;
// electron/LLMHelper.ts
const genai_1 = require("@google/genai");
const fs_1 = __importDefault(require("fs"));
class LLMHelper {
    ai;
    systemPrompt = `あなたはWingman AIです。どんな問題や状況（コーディングに限らず）でも役立つ、積極的なアシスタントです。ユーザーの入力に対して、状況を分析し、明確な問題文、関連するコンテキストを理解し、具体的な回答や解決策を直接提供してください。

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
        // ★★★ エラーの原因だった箇所 ★★★
        this.ai = new genai_1.GoogleGenAI({ apiKey });
    }
    async fileToGenerativePart(imagePath) {
        const imageData = await fs_1.default.promises.readFile(imagePath);
        return {
            inlineData: {
                data: imageData.toString("base64"),
                mimeType: "image/png"
            }
        };
    }
    cleanJsonResponse(text) {
        text = text.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
        text = text.trim();
        return text;
    }
    async extractProblemFromImages(imagePaths) {
        try {
            const imageParts = await Promise.all(imagePaths.map(path => this.fileToGenerativePart(path)));
            const prompt = `${this.systemPrompt}\n\nこれらの画像を分析して、以下の情報をJSON形式で抽出してください：\n{
  "problem_statement": "画像に描かれている問題や状況の明確な説明",
  "context": "画像からの関連する背景やコンテキスト",
  "answer": "問題に対する具体的な回答や正しい選択肢。選択肢がある場合は正しい選択肢を選んで回答してください。数学問題の場合は計算過程を含めて具体的な答えを、プログラミング問題の場合は実際のコードを、クイズの場合は正しい答えを直接示してください。",
  "explanation": "回答の理由や説明。なぜその回答が正しいのかを明確に説明してください。",
  "suggested_responses": ["具体的な次のステップやアクション1", "具体的な次のステップやアクション2", "..."],
  "reasoning": "これらの提案が適切である理由の説明"
}\n\n重要：\n- 問題文が明確な場合は、その問題に対する具体的な回答を必ず提供してください\n- 「自分で考えましょう」のような一般的なアドバイスは避けてください\n- 選択肢がある場合は、正しい選択肢を選んで回答してください\n- 数学問題の場合は、計算過程を含めて具体的な答えを提供してください\n- プログラミング問題の場合は、実際のコードを提供してください\n- クイズやテスト問題の場合は、正しい答えを直接示してください\n- 回答が複数ある場合は、最も適切な回答を選んでください\n- JSONオブジェクトのみを返してください。マークダウン形式やコードブロックは含めないでください。`;
            const response = await this.ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [prompt, ...imageParts]
            });
            const text = response.text;
            const cleanedText = this.cleanJsonResponse(text);
            try {
                const jsonResponse = JSON.parse(cleanedText);
                return jsonResponse;
            }
            catch (parseError) {
                console.error("JSON parsing failed, returning raw text:", parseError);
                return { error: "Failed to parse JSON response", raw_text: cleanedText };
            }
        }
        catch (error) {
            console.error("画像から問題を抽出する際にエラーが発生しました:", error);
            throw error;
        }
    }
    async analyzeAudioFromBase64(data, mimeType) {
        try {
            const audioPart = {
                inlineData: {
                    data,
                    mimeType
                }
            };
            const prompt = `${this.systemPrompt}\n\nこの音声クリップを短く簡潔に説明してください。メインの回答に加えて、音声に基づいてユーザーが次に取れる可能性のある複数の具体的なアクションや回答を提案してください。「自分で考えましょう」のような一般的なアドバイスは避けて、具体的で実用的な回答を提供してください。構造化されたJSONオブジェクトは返さず、ユーザーに対して自然に回答し、簡潔にしてください。Markdown形式で見出し、リスト、強調などを使用して読みやすく構造化してください。`;
            const response = await this.ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [prompt, audioPart]
            });
            const text = response.text;
            return { text, timestamp: Date.now() };
        }
        catch (error) {
            console.error("base64からの音声分析でエラーが発生しました:", error);
            throw error;
        }
    }
    async analyzeImageFile(imagePath) {
        try {
            const imageData = await fs_1.default.promises.readFile(imagePath);
            const imagePart = {
                inlineData: {
                    data: imageData.toString("base64"),
                    mimeType: "image/png"
                }
            };
            const prompt = `${this.systemPrompt}\n\nこの画像の内容を短く簡潔に説明してください。メインの回答に加えて、画像に基づいてユーザーが次に取れる可能性のある複数の具体的なアクションや回答を提案してください。「自分で考えましょう」のような一般的なアドバイスは避けて、具体的で実用的な回答を提供してください。構造化されたJSONオブジェクトは返さず、ユーザーに対して自然に回答してください。Markdown形式で見出し、リスト、強調などを使用して読みやすく構造化してください。`;
            const response = await this.ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [prompt, imagePart]
            });
            const text = response.text;
            return { text, timestamp: Date.now() };
        }
        catch (error) {
            console.error("画像ファイル分析でエラーが発生しました:", error);
            throw error;
        }
    }
    async analyzeAudioFile(path) {
        try {
            const audioData = await fs_1.default.promises.readFile(path);
            const audioPart = {
                inlineData: {
                    data: audioData.toString("base64"),
                    mimeType: `audio/${path.split('.').pop() || 'mp3'}`
                }
            };
            const prompt = `${this.systemPrompt}\n\nこの音声ファイルを分析して内容を説明してください。メインの回答に加えて、音声の内容に基づいてユーザーが次に取れる可能性のある複数の具体的なアクションや回答を提案してください。「自分で考えましょう」のような一般的なアドバイスは避けて、具体的で実用的な回答を提供してください。Markdown形式で見出し、リスト、強調などを使用して読みやすく構造化してください。`;
            const response = await this.ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [prompt, audioPart]
            });
            const text = response.text;
            return { text, timestamp: Date.now() };
        }
        catch (error) {
            console.error("音声ファイル分析でエラーが発生しました:", error);
            throw error;
        }
    }
    async analyzeScreenAutomatically(imagePath) {
        try {
            const imageData = await fs_1.default.promises.readFile(imagePath);
            const imagePart = {
                inlineData: {
                    data: imageData.toString("base64"),
                    mimeType: "image/png"
                }
            };
            const prompt = `${this.systemPrompt}

この画面を分析して、以下を判断してください：

**分析項目：**
1. **画面の状況** - 現在表示されている内容の要約
2. **問題の特定** - 解決すべき問題やエラーはありますか？
3. **次のアクション** - 推奨される具体的な次のステップ
4. **追加情報** - 注意すべき点や補足事項

**回答形式：**
- 具体的で実用的な回答を提供してください
- 「自分で考えましょう」のような一般的なアドバイスは避けてください
- 画面に問題が見当たらない場合は、現在の状況と可能な改善点を提案してください
- Markdown形式で見出し、リスト、強調を適切に使用してください

画面の内容に基づいて、直接的で有用な分析と提案を提供してください。`;
            const response = await this.ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [prompt, imagePart]
            });
            const text = response.text;
            return {
                text,
                timestamp: Date.now(),
                type: 'auto-analysis',
                imagePath
            };
        }
        catch (error) {
            console.error("自動画面分析でエラーが発生しました:", error);
            throw error;
        }
    }
    async analyzeScreenWithPrompt(imagePath, userPrompt) {
        try {
            const imageData = await fs_1.default.promises.readFile(imagePath);
            const imagePart = {
                inlineData: {
                    data: imageData.toString("base64"),
                    mimeType: "image/png"
                }
            };
            const prompt = `${this.systemPrompt}

ユーザーからの質問：「${userPrompt}」

この画面を分析して、ユーザーの質問に具体的に回答してください：

**回答要件：**
- ユーザーの質問に直接回答してください
- 画面に表示されている情報を活用してください
- 具体的で実用的な回答を提供してください
- 必要に応じて手順や解決策を示してください
- Markdown形式で構造化された回答を作成してください

画面の内容とユーザーの質問の両方を考慮して、最も有用な回答を提供してください。`;
            const response = await this.ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [prompt, imagePart]
            });
            const text = response.text;
            return {
                text,
                timestamp: Date.now(),
                type: 'prompt-analysis',
                imagePath,
                userPrompt
            };
        }
        catch (error) {
            console.error("プロンプト付き画面分析でエラーが発生しました:", error);
            throw error;
        }
    }
}
exports.LLMHelper = LLMHelper;
//# sourceMappingURL=LLMHelper.js.map