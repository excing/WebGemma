import { FilesetResolver, LlmInference } from "@mediapipe/tasks-genai";
import type { ModelConfig, Message, ChatContext } from '../types/index.js';

export class AIService {
  private llmInference: LlmInference | null = null;
  private isInitialized = false;
  private chatHistory: Message[] = [];
  private maxContextLength = 10; // 默认保留最近10轮对话
  private currentModel: ModelConfig | null = null;

  async initializeModel(modelConfig: ModelConfig): Promise<void> {
    try {
      // 释放之前的模型
      if (this.llmInference) {
        this.llmInference.close();
        this.llmInference = null;
      }

      const genai = await FilesetResolver.forGenAiTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@latest/wasm",
      );

      // 根据是否为本地文件选择不同的初始化方式
      const baseOptions = modelConfig.isLocalFile && modelConfig.modelFile
        ? { modelAssetPath: URL.createObjectURL(modelConfig.modelFile) }
        : { modelAssetPath: modelConfig.path };

      this.llmInference = await LlmInference.createFromOptions(genai, {
        baseOptions,
        maxTokens: modelConfig.maxTokens,
        topK: modelConfig.topK,
        temperature: modelConfig.temperature,
        randomSeed: modelConfig.randomSeed,
        maxNumImages: 1,
        supportAudio: true,
      });

      this.currentModel = modelConfig;
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize model:', error);
      throw new Error(`模型初始化失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 构建聊天上下文提示
  private buildContextPrompt(
    text: string,
    includeContext = true
  ): string {
    let prompt = '';

    // 添加聊天历史上下文
    if (includeContext && this.chatHistory.length > 0) {
      const recentHistory = this.chatHistory.slice(-this.maxContextLength);

      for (const message of recentHistory) {
        if (message.role === 'user') {
          prompt += `User: ${message.content}\n`;
        } else if (message.role === 'assistant') {
          prompt += `Assistant: ${message.content}\n`;
        }
      }
    }

    // 添加当前用户输入
    prompt += `User: ${text}\n`;
    prompt += 'Assistant:';

    return prompt;
  }

  // 构建多模态提示（简化版本）
  private async buildMultimodalPrompt(
    text: string,
    imageData?: File,
    audioData?: File
  ): Promise<any[]> {
    const promptParts: any[] = [];

    // 构建文本上下文
    const contextPrompt = this.buildContextPrompt(text);
    promptParts.push(contextPrompt);

    // 添加多媒体内容
    if (imageData) {
      const img = new Image();
      img.src = URL.createObjectURL(imageData);
      promptParts.push({
        imageSource: img
      });
    }

    if (audioData) {
      // 处理音频文件以符合 MediaPipe 要求
      try {
        const processedAudio = await this.processAudioForMediaPipe(audioData);
        promptParts.push({
          audioSource: processedAudio
        });
      } catch (error) {
        console.error('音频处理失败:', error);
        // 如果音频处理失败，尝试使用原始文件
        promptParts.push({
          audioSource: URL.createObjectURL(audioData)
        });
      }
    }

    return promptParts;
  }

  /**
   * 处理音频文件以符合 MediaPipe 要求
   * - 单声道
   * - 16kHz 采样率
   * - 32位浮点数据，范围 [-1, 1]
   */
  private async processAudioForMediaPipe(audioFile: File): Promise<AudioBuffer> {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const fileReader = new FileReader();

      fileReader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;

          // 解码音频数据
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          // 转换为单声道 16kHz Float32Array
          const processedAudio = this.convertAudioToRequiredFormat(audioBuffer, audioContext);

          // 创建AudioBuffer
          const audioBufferNew = audioContext.createBuffer(
            1,                    // 声道数量 (1 = 单声道)
            processedAudio.length,  // 采样点数量
            16000           // 采样率
          );

          // 将Float32Array数据复制到AudioBuffer
          audioBufferNew.copyToChannel(processedAudio, 0);

          resolve(audioBufferNew);
        } catch (error) {
          reject(new Error(`音频处理失败: ${error instanceof Error ? error.message : '未知错误'}`));
        }
      };

      fileReader.onerror = () => {
        reject(new Error('音频文件读取失败'));
      };

      fileReader.readAsArrayBuffer(audioFile);
    });
  }

  /**
   * 将音频转换为 MediaPipe 要求的格式
   */
  private convertAudioToRequiredFormat(audioBuffer: AudioBuffer, audioContext: AudioContext): Float32Array<ArrayBuffer> {
    const targetSampleRate = 16000; // 16kHz
    const originalSampleRate = audioBuffer.sampleRate;

    // 获取音频数据（转换为单声道）
    let audioData: Float32Array<ArrayBuffer>;

    if (audioBuffer.numberOfChannels === 1) {
      // 已经是单声道
      audioData = audioBuffer.getChannelData(0);
    } else {
      // 多声道转单声道（平均值）
      const length = audioBuffer.length;
      audioData = new Float32Array(length);

      for (let i = 0; i < length; i++) {
        let sum = 0;
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          sum += audioBuffer.getChannelData(channel)[i];
        }
        audioData[i] = sum / audioBuffer.numberOfChannels;
      }
    }

    // 重采样到 16kHz（如果需要）
    if (originalSampleRate !== targetSampleRate) {
      audioData = this.resampleAudio(audioData, originalSampleRate, targetSampleRate);
    }

    // 确保数据在 [-1, 1] 范围内
    const maxValue = Math.max(...Array.from(audioData).map(Math.abs));
    if (maxValue > 1.0) {
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = audioData[i] / maxValue;
      }
    }

    return audioData;
  }

  /**
   * 简单的线性重采样（用于音频采样率转换）
   */
  private resampleAudio(audioData: Float32Array<ArrayBuffer>, originalRate: number, targetRate: number): Float32Array<ArrayBuffer> {
    if (originalRate === targetRate) {
      return audioData;
    }

    const ratio = originalRate / targetRate;
    const newLength = Math.round(audioData.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const originalIndex = i * ratio;
      const index = Math.floor(originalIndex);
      const fraction = originalIndex - index;

      if (index + 1 < audioData.length) {
        // 线性插值
        result[i] = audioData[index] * (1 - fraction) + audioData[index + 1] * fraction;
      } else {
        result[i] = audioData[index] || 0;
      }
    }

    return result;
  }

  // 更新聊天历史
  private updateChatHistory(userMessage: Message, assistantResponse: string): void {
    // 添加用户消息
    this.chatHistory.push(userMessage);

    // 添加助手回复
    this.chatHistory.push({
      id: Date.now().toString() + '_assistant',
      role: 'assistant',
      content: assistantResponse,
      timestamp: new Date(),
      type: 'text'
    });

    // 限制历史长度
    if (this.chatHistory.length > this.maxContextLength * 2) {
      this.chatHistory = this.chatHistory.slice(-this.maxContextLength * 2);
    }
  }

  // 设置上下文长度
  setContextLength(length: number): void {
    this.maxContextLength = Math.max(1, Math.min(50, length)); // 限制在1-50之间
  }

  // 清除聊天历史
  clearChatHistory(): void {
    this.chatHistory = [];
  }

  // 获取聊天历史
  getChatHistory(): Message[] {
    return [...this.chatHistory];
  }

  async generateResponse(
    text: string,
    imageData?: File,
    audioData?: File,
    onPartialResponse?: (partial: string, done: boolean) => void
  ): Promise<string> {
    if (!this.isInitialized || !this.llmInference) {
      throw new Error('模型未初始化，请先加载模型');
    }

    try {
      // 创建用户消息记录
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        timestamp: new Date(),
        type: imageData ? 'image' : audioData ? 'audio' : 'text',
        imageData,
        audioData
      };

      let response: string;

      // 根据是否有多媒体内容选择不同的处理方式
      if (imageData || audioData) {
        // 多模态输入
        const promptParts = await this.buildMultimodalPrompt(text, imageData, audioData);

        if (onPartialResponse) {
          response = await new Promise((resolve, reject) => {
            let fullResponse = '';
            this.llmInference!.generateResponse(promptParts, (partialResult, done) => {
              fullResponse = partialResult;
              onPartialResponse(partialResult, done);
              if (done) {
                resolve(fullResponse);
              }
            });
          });
        } else {
          response = await this.llmInference.generateResponse(promptParts);
        }
      } else {
        // 纯文本输入，使用上下文
        const contextPrompt = this.buildContextPrompt(text);

        if (onPartialResponse) {
          response = await new Promise((resolve, reject) => {
            let fullResponse = '';
            this.llmInference!.generateResponse(contextPrompt, (partialResult, done) => {
              fullResponse = partialResult;
              onPartialResponse(partialResult, done);
              if (done) {
                resolve(fullResponse);
              }
            });
          });
        } else {
          response = await this.llmInference.generateResponse(contextPrompt);
        }
      }

      // 更新聊天历史
      this.updateChatHistory(userMessage, response);

      return response;
    } catch (error) {
      console.error('Failed to generate response:', error);
      throw new Error(`生成响应失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 兼容旧的单参数调用
  async generateTextResponse(
    prompt: string,
    onPartialResponse?: (partial: string, done: boolean) => void
  ): Promise<string> {
    return this.generateResponse(prompt, undefined, undefined, onPartialResponse);
  }

  async generateMultimodalResponse(
    text: string,
    imageData?: File,
    audioData?: File,
    onPartialResponse?: (partial: string, done: boolean) => void
  ): Promise<string> {
    return this.generateResponse(text, imageData, audioData, onPartialResponse);
  }

  updateModelConfig(config: Partial<ModelConfig>): void {
    if (!this.currentModel) {
      throw new Error('没有加载的模型可以更新配置');
    }

    this.currentModel = { ...this.currentModel, ...config };

    // 重新初始化模型以应用新配置
    this.initializeModel(this.currentModel);
  }

  getCurrentModel(): ModelConfig | null {
    return this.currentModel;
  }

  isModelReady(): boolean {
    return this.isInitialized && this.llmInference !== null;
  }

  dispose(): void {
    if (this.llmInference) {
      this.llmInference.close();
      this.llmInference = null;
    }
    this.isInitialized = false;
    this.currentModel = null;
  }
}

export default AIService;
