import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai"
import fs from "fs"

export class LLMHelper {
  private model: GenerativeModel
  private readonly systemPrompt = `あなたはWingman AIです。どんな問題や状況（コーディングに限らず）でも役立つ、積極的なアシスタントです。ユーザーの入力に対して、状況を分析し、明確な問題文、関連するコンテキスト、そしてユーザーが次に取れる可能性のある複数の回答やアクションを提案します。常に推論を説明し、提案をオプションや次のステップのリストとして提示してください。日本語で回答してください。`

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey)
    this.model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
  }

  private async fileToGenerativePart(imagePath: string) {
    const imageData = await fs.promises.readFile(imagePath)
    return {
      inlineData: {
        data: imageData.toString("base64"),
        mimeType: "image/png"
      }
    }
  }

  private cleanJsonResponse(text: string): string {
    // Remove markdown code block syntax if present
    text = text.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
    // Remove any leading/trailing whitespace
    text = text.trim();
    return text;
  }

  public async extractProblemFromImages(imagePaths: string[]) {
    try {
      const imageParts = await Promise.all(imagePaths.map(path => this.fileToGenerativePart(path)))
      
      const prompt = `${this.systemPrompt}\n\nこれらの画像を分析して、以下の情報をJSON形式で抽出してください：\n{
  "problem_statement": "画像に描かれている問題や状況の明確な説明",
  "context": "画像からの関連する背景やコンテキスト",
  "suggested_responses": ["最初の可能な回答やアクション", "2番目の可能な回答やアクション", "..."],
  "reasoning": "これらの提案が適切である理由の説明"
}\n重要：JSONオブジェクトのみを返してください。マークダウン形式やコードブロックは含めないでください。`

      const result = await this.model.generateContent([prompt, ...imageParts])
      const response = await result.response
      const text = this.cleanJsonResponse(response.text())
      return JSON.parse(text)
    } catch (error) {
      console.error("画像からの問題抽出でエラーが発生しました:", error)
      throw error
    }
  }

  public async generateSolution(problemInfo: any) {
    const prompt = `${this.systemPrompt}\n\nこの問題や状況について：\n${JSON.stringify(problemInfo, null, 2)}\n\n以下のJSON形式で回答を提供してください：\n{
  "solution": {
    "code": "コードまたはメインの回答をここに記述",
    "problem_statement": "問題や状況を再記述",
    "context": "関連する背景/コンテキスト",
    "suggested_responses": ["最初の可能な回答やアクション", "2番目の可能な回答やアクション", "..."],
    "reasoning": "これらの提案が適切である理由の説明"
  }
}\n重要：JSONオブジェクトのみを返してください。マークダウン形式やコードブロックは含めないでください。`

    console.log("[LLMHelper] Gemini LLMにソリューション生成を要求中...");
    try {
      const result = await this.model.generateContent(prompt)
      console.log("[LLMHelper] Gemini LLMが結果を返しました。");
      const response = await result.response
      const text = this.cleanJsonResponse(response.text())
      const parsed = JSON.parse(text)
      console.log("[LLMHelper] 解析されたLLM応答:", parsed)
      return parsed
    } catch (error) {
      console.error("[LLMHelper] generateSolutionでエラーが発生しました:", error);
      throw error;
    }
  }

  public async debugSolutionWithImages(problemInfo: any, currentCode: string, debugImagePaths: string[]) {
    try {
      const imageParts = await Promise.all(debugImagePaths.map(path => this.fileToGenerativePart(path)))
      
      const prompt = `${this.systemPrompt}\n\n以下が与えられています：\n1. 元の問題や状況: ${JSON.stringify(problemInfo, null, 2)}\n2. 現在の回答やアプローチ: ${currentCode}\n3. 提供された画像のデバッグ情報\n\nデバッグ情報を分析し、以下のJSON形式でフィードバックを提供してください：\n{
  "solution": {
    "code": "コードまたはメインの回答をここに記述",
    "problem_statement": "問題や状況を再記述",
    "context": "関連する背景/コンテキスト",
    "suggested_responses": ["最初の可能な回答やアクション", "2番目の可能な回答やアクション", "..."],
    "reasoning": "これらの提案が適切である理由の説明"
  }
}\n重要：JSONオブジェクトのみを返してください。マークダウン形式やコードブロックは含めないでください。`

      const result = await this.model.generateContent([prompt, ...imageParts])
      const response = await result.response
      const text = this.cleanJsonResponse(response.text())
      const parsed = JSON.parse(text)
      console.log("[LLMHelper] 解析されたデバッグLLM応答:", parsed)
      return parsed
    } catch (error) {
      console.error("画像を使用したソリューションのデバッグでエラーが発生しました:", error)
      throw error
    }
  }

  public async analyzeAudioFile(audioPath: string) {
    try {
      const audioData = await fs.promises.readFile(audioPath);
      const audioPart = {
        inlineData: {
          data: audioData.toString("base64"),
          mimeType: "audio/mp3"
        }
      };
      const prompt = `${this.systemPrompt}\n\nこの音声クリップを短く簡潔に説明してください。メインの回答に加えて、音声に基づいてユーザーが次に取れる可能性のある複数のアクションや回答を提案してください。構造化されたJSONオブジェクトは返さず、ユーザーに対して自然に回答してください。`;
      const result = await this.model.generateContent([prompt, audioPart]);
      const response = await result.response;
      const text = response.text();
      return { text, timestamp: Date.now() };
    } catch (error) {
      console.error("音声ファイルの分析でエラーが発生しました:", error);
      throw error;
    }
  }

  public async analyzeAudioFromBase64(data: string, mimeType: string) {
    try {
      const audioPart = {
        inlineData: {
          data,
          mimeType
        }
      };
      const prompt = `${this.systemPrompt}\n\nこの音声クリップを短く簡潔に説明してください。メインの回答に加えて、音声に基づいてユーザーが次に取れる可能性のある複数のアクションや回答を提案してください。構造化されたJSONオブジェクトは返さず、ユーザーに対して自然に回答し、簡潔にしてください。`;
      const result = await this.model.generateContent([prompt, audioPart]);
      const response = await result.response;
      const text = response.text();
      return { text, timestamp: Date.now() };
    } catch (error) {
      console.error("base64からの音声分析でエラーが発生しました:", error);
      throw error;
    }
  }

  public async analyzeImageFile(imagePath: string) {
    try {
      const imageData = await fs.promises.readFile(imagePath);
      const imagePart = {
        inlineData: {
          data: imageData.toString("base64"),
          mimeType: "image/png"
        }
      };
      const prompt = `${this.systemPrompt}\n\nこの画像の内容を短く簡潔に説明してください。メインの回答に加えて、画像に基づいてユーザーが次に取れる可能性のある複数のアクションや回答を提案してください。構造化されたJSONオブジェクトは返さず、ユーザーに対して自然に回答してください。簡潔で簡潔にしてください。`;
      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      return { text, timestamp: Date.now() };
    } catch (error) {
      console.error("画像ファイルの分析でエラーが発生しました:", error);
      throw error;
    }
  }
} 