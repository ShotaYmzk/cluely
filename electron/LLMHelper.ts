import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai"
import fs from "fs"

export class LLMHelper {
  private model: GenerativeModel
  private readonly systemPrompt = `あなたはWingman AIです。どんな問題や状況（コーディングに限らず）でも役立つ、積極的なアシスタントです。ユーザーの入力に対して、状況を分析し、明確な問題文、関連するコンテキストを理解し、具体的な回答や解決策を直接提供してください。

**重要な指示**:
- 問題が明確な場合は、必ず具体的な回答や解決策を提供してください
- 「自分で考えましょう」「まず理解しましょう」のような一般的なアドバイスは避けてください
- 選択肢がある場合は、正しい選択肢を選んで回答してください
- 数学問題の場合は、計算過程を含めて具体的な答えを提供してください
- プログラミング問題の場合は、実際のコードを提供してください
- クイズやテスト問題の場合は、正しい答えを直接示してください
- 常に推論を説明し、なぜその回答が正しいのかを明確にしてください

そしてユーザーが次に取れる可能性のある複数の具体的なアクションや次のステップを提案します。日本語で回答してください。

**重要**: 回答は必ずMarkdown形式で提供してください。見出し、リスト、強調、コードブロックなどを適切に使用して、読みやすく構造化された回答を作成してください。`

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey)
    this.model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-06-17" })//gemini-2.0-flash
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
  "answer": "問題に対する具体的な回答や正しい選択肢。選択肢がある場合は正しい選択肢を選んで回答してください。数学問題の場合は計算過程を含めて具体的な答えを、プログラミング問題の場合は実際のコードを、クイズの場合は正しい答えを直接示してください。",
  "explanation": "回答の理由や説明。なぜその回答が正しいのかを明確に説明してください。",
  "suggested_responses": ["具体的な次のステップやアクション1", "具体的な次のステップやアクション2", "..."],
  "reasoning": "これらの提案が適切である理由の説明"
}\n\n重要：\n- 問題文が明確な場合は、その問題に対する具体的な回答を必ず提供してください\n- 「自分で考えましょう」のような一般的なアドバイスは避けてください\n- 選択肢がある場合は、正しい選択肢を選んで回答してください\n- 数学問題の場合は、計算過程を含めて具体的な答えを提供してください\n- プログラミング問題の場合は、実際のコードを提供してください\n- クイズやテスト問題の場合は、正しい答えを直接示してください\n- 回答が複数ある場合は、最も適切な回答を選んでください\n- JSONオブジェクトのみを返してください。マークダウン形式やコードブロックは含めないでください。`

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
    "code": "コードが必要な場合はここに記述。コードが不要な場合は空文字列にしてください。",
    "answer": "問題に対する具体的な回答。既に回答がある場合は、それを詳細に説明してください。数学問題の場合は計算過程を含めて具体的な答えを、プログラミング問題の場合は実際のコードを、クイズの場合は正しい答えを直接示してください。",
    "explanation": "回答の詳細な説明や理由。なぜその回答が正しいのかを明確に説明してください。",
    "problem_statement": "問題や状況を再記述",
    "context": "関連する背景/コンテキスト",
    "suggested_responses": ["具体的な次のステップやアクション1", "具体的な次のステップやアクション2", "..."],
    "reasoning": "これらの提案が適切である理由の説明"
  }
}\n\n重要：\n- 既に回答がある場合は、その回答を詳細に説明してください\n- 「自分で考えましょう」のような一般的なアドバイスは避けてください\n- コードが必要な問題の場合は、実際のコードを提供してください\n- 選択肢がある場合は、正しい選択肢を選んで回答してください\n- 数学問題の場合は、計算過程を含めて具体的な答えを提供してください\n- クイズやテスト問題の場合は、正しい答えを直接示してください\n- JSONオブジェクトのみを返してください。マークダウン形式やコードブロックは含めないでください。`

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
      const prompt = `${this.systemPrompt}\n\nこの音声クリップを短く簡潔に説明してください。メインの回答に加えて、音声に基づいてユーザーが次に取れる可能性のある複数の具体的なアクションや回答を提案してください。「自分で考えましょう」のような一般的なアドバイスは避けて、具体的で実用的な回答を提供してください。構造化されたJSONオブジェクトは返さず、ユーザーに対して自然に回答してください。Markdown形式で見出し、リスト、強調などを使用して読みやすく構造化してください。`;
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
      const prompt = `${this.systemPrompt}\n\nこの音声クリップを短く簡潔に説明してください。メインの回答に加えて、音声に基づいてユーザーが次に取れる可能性のある複数の具体的なアクションや回答を提案してください。「自分で考えましょう」のような一般的なアドバイスは避けて、具体的で実用的な回答を提供してください。構造化されたJSONオブジェクトは返さず、ユーザーに対して自然に回答し、簡潔にしてください。Markdown形式で見出し、リスト、強調などを使用して読みやすく構造化してください。`;
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
      const prompt = `${this.systemPrompt}\n\nこの画像の内容を短く簡潔に説明してください。メインの回答に加えて、画像に基づいてユーザーが次に取れる可能性のある複数の具体的なアクションや回答を提案してください。「自分で考えましょう」のような一般的なアドバイスは避けて、具体的で実用的な回答を提供してください。構造化されたJSONオブジェクトは返さず、ユーザーに対して自然に回答してください。Markdown形式で見出し、リスト、強調などを使用して読みやすく構造化してください。`;
      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      return { text, timestamp: Date.now() };
    } catch (error) {
      console.error("画像ファイルの分析でエラーが発生しました:", error);
      throw error;
    }
  }

  public async generateActionResponse(problemInfo: any, action: string) {
    const prompt = `${this.systemPrompt}\n\n以下の問題や状況について：\n${JSON.stringify(problemInfo, null, 2)}\n\nユーザーが選択したアクション：「${action}」\n\nこのアクションに基づいて、以下のJSON形式で具体的な回答を提供してください：\n{
  "action_response": {
    "action": "選択されたアクション",
    "concrete_answer": "このアクションに対する具体的な回答や解決策。問題を解く系のアクションの場合は、必ず問題の答えを提供してください。数学問題の場合は計算過程を含めて具体的な答えを、プログラミング問題の場合は実際のコードを、クイズの場合は正しい答えを直接示してください。",
    "detailed_explanation": "回答の詳細な説明や理由。なぜその回答が正しいのかを明確に説明してください。",
    "step_by_step": ["ステップ1", "ステップ2", "ステップ3", "..."],
    "additional_context": "関連する追加情報や背景",
    "next_actions": ["次の可能なアクション1", "次の可能なアクション2", "..."]
  }
}\n\n重要：\n- アクションが「問題を解く」「解答する」「答えを教えて」などの場合は、必ず問題の具体的な答えを提供してください\n- 「自分で考えましょう」のような一般的なアドバイスは避けてください\n- 数学問題の場合は、計算過程を含めて具体的な答えを提供してください\n- プログラミング問題の場合は、実際のコードを提供してください\n- クイズやテスト問題の場合は、正しい答えを直接示してください\n- 選択肢がある場合は、正しい選択肢を選んで回答してください\n- JSONオブジェクトのみを返してください。マークダウン形式やコードブロックは含めないでください。`

    console.log("[LLMHelper] アクション応答生成を要求中...");
    try {
      const result = await this.model.generateContent(prompt)
      console.log("[LLMHelper] アクション応答が返されました。");
      const response = await result.response
      const text = this.cleanJsonResponse(response.text())
      const parsed = JSON.parse(text)
      console.log("[LLMHelper] 解析されたアクション応答:", parsed)
      return parsed
    } catch (error) {
      console.error("[LLMHelper] generateActionResponseでエラーが発生しました:", error);
      throw error;
    }
  }
} 