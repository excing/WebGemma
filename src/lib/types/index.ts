export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type: 'text' | 'image' | 'audio';
  attachments?: {
    type: 'image' | 'audio';
    data: string | ArrayBuffer;
    name?: string;
  }[];
  // 新增：支持多媒体文件
  imageData?: File;
  audioData?: File;
}

export interface ModelConfig {
  name: string;
  path: string;
  maxTokens: number;
  topK: number;
  temperature: number;
  randomSeed: number;
  supportsMultimodal: boolean;
  // 新增：支持本地文件
  isLocalFile?: boolean;
  modelFile?: File;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentModel: ModelConfig | null;
  isModelLoading: boolean;
  error: string | null;
  // 新增：聊天上下文配置
  contextLength: number;
  enableContext: boolean;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  path: string;
  size: string;
  supportsMultimodal: boolean;
  defaultConfig: Omit<ModelConfig, 'name' | 'path' | 'supportsMultimodal' | 'isLocalFile' | 'fileBuffer'>;
  // 新增：标识是否为本地文件选项
  isLocalFile?: boolean;
}

// 本地模型文件信息
export interface LocalModelFile {
  file: File;
  name: string;
  size: number;
  supportsMultimodal: boolean;
}

export type InputType = 'text' | 'image' | 'audio';

export interface FileUpload {
  file: File;
  type: InputType;
  preview?: string;
}

// MediaPipe 多模态提示类型（与 MediaPipe 兼容）
export type MediaPipePromptPart = string | {
  imageSource: {
    imageFile?: File;
    imageUrl?: string;
  };
} | {
  audioSource: {
    audioFile?: File;
    audioUrl?: string;
  };
};

export type MediaPipePrompt = MediaPipePromptPart | MediaPipePromptPart[];

// 聊天上下文管理
export interface ChatContext {
  messages: Message[];
  maxLength: number;
  includeSystemPrompt: boolean;
}

// 录音状态
export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  error: string | null;
}
