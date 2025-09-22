import { writable } from 'svelte/store';
import type { ChatState, Message, ModelConfig, ModelOption, LocalModelFile } from '../types/index.js';
import AIService from '../services/AIService.js';

// 预定义的模型选项
export const availableModels: ModelOption[] = [
  {
    id: 'gemma2-2b',
    name: 'Gemma2-2B-IT',
    description: '轻量级模型，适合快速对话',
    path: 'gemma2-2b-it-int8-web.task.bin',
    size: '~1.2GB',
    supportsMultimodal: false,
    defaultConfig: {
      maxTokens: 1000,
      topK: 40,
      temperature: 0.8,
      randomSeed: 101,
    }
  },
  {
    id: 'gemma3-1b',
    name: 'Gemma3-1B-IT',
    description: '最新的轻量级模型',
    path: 'gemma3-1b-it-int4-web.task',
    size: '~800MB',
    supportsMultimodal: false,
    defaultConfig: {
      maxTokens: 1000,
      topK: 40,
      temperature: 0.8,
      randomSeed: 101,
    }
  },
  {
    id: 'gemma3-e2b',
    name: 'Gemma-3n-E2B',
    description: '支持文本、图片和音频输入的多模态模型',
    path: 'gemma-3n-E2B-it-litert-lm-web.task',
    size: '~2.5GB',
    supportsMultimodal: true,
    defaultConfig: {
      maxTokens: 1000,
      topK: 40,
      temperature: 0.8,
      randomSeed: 101,
    }
  },
  {
    id: 'gemma3-e4b',
    name: 'Gemma-3n-E4B',
    description: '高性能多模态模型，支持文本、图片和音频输入',
    path: 'gemma-3n-E4B-it-litert-lm-web.task',
    size: '~4.2GB',
    supportsMultimodal: true,
    defaultConfig: {
      maxTokens: 1000,
      topK: 40,
      temperature: 0.8,
      randomSeed: 101,
    }
  }
];

// 初始状态
const initialState: ChatState = {
  messages: [],
  isLoading: false,
  currentModel: null,
  isModelLoading: false,
  error: null,
  contextLength: 10,
  enableContext: true,
};

// 创建 store
function createChatStore() {
  const { subscribe, set, update } = writable<ChatState>(initialState);
  const aiService = new AIService();

  return {
    subscribe,

    // 加载模型
    async loadModel(modelOption: ModelOption): Promise<void> {
      update(state => ({ ...state, isModelLoading: true, error: null }));

      try {
        const modelConfig: ModelConfig = {
          name: modelOption.name,
          path: modelOption.path,
          supportsMultimodal: modelOption.supportsMultimodal,
          ...modelOption.defaultConfig,
        };

        await aiService.initializeModel(modelConfig);

        update(state => ({
          ...state,
          currentModel: modelConfig,
          isModelLoading: false,
          error: null,
        }));
      } catch (error) {
        update(state => ({
          ...state,
          isModelLoading: false,
          error: error instanceof Error ? error.message : '模型加载失败',
        }));
        throw error;
      }
    },

    // 设置上下文长度
    setContextLength(length: number): void {
      aiService.setContextLength(length);
      update(state => ({ ...state, contextLength: length }));
    },

    // 切换上下文启用状态
    toggleContext(): void {
      update(state => ({ ...state, enableContext: !state.enableContext }));
    },

    // 清除聊天历史
    clearChatHistory(): void {
      aiService.clearChatHistory();
      update(state => ({ ...state, messages: [] }));
    },

    // 获取聊天历史
    getChatHistory(): Message[] {
      return aiService.getChatHistory();
    },

    // 从本地文件加载模型
    async loadLocalModel(file: File, modelName?: string): Promise<void> {
      update(state => ({ ...state, isModelLoading: true, error: null }));

      try {
        // 检测模型类型（基于文件名）
        const fileName = file.name.toLowerCase();
        const supportsMultimodal = fileName.includes('e2b') || fileName.includes('e4b') || fileName.includes('multimodal');

        const modelConfig: ModelConfig = {
          name: modelName || file.name,
          path: file.name, // 使用文件名作为路径标识
          supportsMultimodal,
          isLocalFile: true,
          modelFile:file,
          maxTokens: 1000,
          topK: 40,
          temperature: 0.8,
          randomSeed: 101,
        };

        await aiService.initializeModel(modelConfig);

        update(state => ({
          ...state,
          currentModel: modelConfig,
          isModelLoading: false,
          error: null,
        }));
      } catch (error) {
        update(state => ({
          ...state,
          isModelLoading: false,
          error: error instanceof Error ? error.message : '本地模型加载失败',
        }));
        throw error;
      }
    },

    // 发送消息
    async sendMessage(content: string, attachments?: Message['attachments']): Promise<void> {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        content,
        role: 'user',
        timestamp: new Date(),
        type: attachments && attachments.length > 0 ? attachments[0].type : 'text',
        attachments,
      };

      // 添加用户消息
      update(state => ({
        ...state,
        messages: [...state.messages, userMessage],
        isLoading: true,
        error: null,
      }));

      try {
        // 处理附件数据，转换为 File 对象
        let imageFile: File | undefined;
        let audioFile: File | undefined;

        if (attachments && attachments.length > 0) {
          const imageAttachment = attachments.find(a => a.type === 'image');
          const audioAttachment = attachments.find(a => a.type === 'audio');

          if (imageAttachment) {
            imageFile = new File([imageAttachment.data], imageAttachment.name || 'image', {
              type: 'image/jpeg' // 默认类型，实际应该根据文件类型设置
            });
          }

          if (audioAttachment) {
            audioFile = new File([audioAttachment.data], audioAttachment.name || 'audio', {
              type: 'audio/wav' // 默认类型，实际应该根据文件类型设置
            });
          }
        }

        // 使用统一的 generateResponse 方法
        await aiService.generateResponse(
          content,
          imageFile,
          audioFile,
          (partial, done) => {
            // 更新部分响应
            update(state => {
              const messages = [...state.messages];
              const lastMessage = messages[messages.length - 1];

              if (lastMessage && lastMessage.role === 'assistant') {
                lastMessage.content = lastMessage.content + partial;
              } else {
                messages.push({
                  id: crypto.randomUUID(),
                  content: partial,
                  role: 'assistant',
                  timestamp: new Date(),
                  type: 'text',
                });
              }

              return { ...state, messages };
            });
          }
        );

        update(state => {
          return {
            ...state,
            isLoading: false,
          };
        });
      } catch (error) {
        update(state => ({
          ...state,
          isLoading: false,
          error: error instanceof Error ? error.message : '发送消息失败',
        }));
        throw error;
      }
    },

    // 清空对话
    clearMessages(): void {
      update(state => ({ ...state, messages: [] }));
    },

    // 更新模型配置
    updateModelConfig(config: Partial<ModelConfig>): void {
      try {
        aiService.updateModelConfig(config);
        update(state => ({
          ...state,
          currentModel: state.currentModel ? { ...state.currentModel, ...config } : null,
        }));
      } catch (error) {
        update(state => ({
          ...state,
          error: error instanceof Error ? error.message : '更新模型配置失败',
        }));
      }
    },

    // 清除错误
    clearError(): void {
      update(state => ({ ...state, error: null }));
    },

    // 获取可用模型
    getAvailableModels(): ModelOption[] {
      return availableModels;
    },

    // 销毁服务
    dispose(): void {
      aiService.dispose();
    },
  };
}

export const chatStore = createChatStore();
export default chatStore;
