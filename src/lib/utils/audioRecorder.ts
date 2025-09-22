/**
 * 音频录制工具类
 * 支持录制音频并转换为文件格式
 */

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  error: string | null;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;
  private pausedDuration: number = 0;
  private animationFrame: number | null = null;

  // 事件回调
  public onStateChange?: (state: RecordingState) => void;
  public onDataAvailable?: (audioBlob: Blob) => void;
  public onError?: (error: string) => void;

  private state: RecordingState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
    error: null
  };

  /**
   * 开始录音
   */
  async startRecording(): Promise<void> {
    try {
      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('您的浏览器不支持录音功能');
      }

      // 请求麦克风权限 - 优化为 Gemma 推荐的设置
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,  // 16kHz 采样率（Gemma 推荐）
          channelCount: 1     // 单声道（Gemma 要求）
        }
      });

      // 创建 MediaRecorder - 优化为 Gemma 兼容设置
      const options: MediaRecorderOptions = {
        mimeType: this.getSupportedMimeType(),
        audioBitsPerSecond: 64000  // 降低比特率，适合语音
      };

      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.audioChunks = [];

      // 设置事件监听器
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { 
          type: this.getSupportedMimeType() 
        });
        this.onDataAvailable?.(audioBlob);
        this.cleanup();
      };

      this.mediaRecorder.onerror = (event) => {
        const error = '录音过程中发生错误';
        this.updateState({ error });
        this.onError?.(error);
        this.cleanup();
      };

      // 开始录音
      this.mediaRecorder.start(100); // 每100ms收集一次数据
      this.startTime = Date.now();
      this.pausedDuration = 0;
      
      this.updateState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        error: null
      });

      // 开始更新时长
      this.updateDuration();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '无法访问麦克风';
      this.updateState({ error: errorMessage });
      this.onError?.(errorMessage);
      this.cleanup();
    }
  }

  /**
   * 暂停录音
   */
  pauseRecording(): void {
    if (this.mediaRecorder && this.state.isRecording && !this.state.isPaused) {
      this.mediaRecorder.pause();
      this.pausedDuration += Date.now() - this.startTime;
      this.updateState({ isPaused: true });
      
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }
    }
  }

  /**
   * 恢复录音
   */
  resumeRecording(): void {
    if (this.mediaRecorder && this.state.isRecording && this.state.isPaused) {
      this.mediaRecorder.resume();
      this.startTime = Date.now();
      this.updateState({ isPaused: false });
      this.updateDuration();
    }
  }

  /**
   * 停止录音
   */
  stopRecording(): void {
    if (this.mediaRecorder && this.state.isRecording) {
      this.mediaRecorder.stop();
      this.updateState({
        isRecording: false,
        isPaused: false
      });
      
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }
    }
  }

  /**
   * 取消录音
   */
  cancelRecording(): void {
    if (this.mediaRecorder && this.state.isRecording) {
      this.mediaRecorder.stop();
      this.audioChunks = []; // 清空录音数据
      this.cleanup();
    }
  }

  /**
   * 获取当前状态
   */
  getState(): RecordingState {
    return { ...this.state };
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.mediaRecorder = null;
    this.updateState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      error: null
    });
  }

  /**
   * 更新录音时长
   */
  private updateDuration(): void {
    if (this.state.isRecording && !this.state.isPaused) {
      const currentDuration = this.pausedDuration + (Date.now() - this.startTime);
      this.updateState({ duration: Math.floor(currentDuration / 1000) });
      
      this.animationFrame = requestAnimationFrame(() => this.updateDuration());
    }
  }

  /**
   * 更新状态并触发回调
   */
  private updateState(updates: Partial<RecordingState>): void {
    this.state = { ...this.state, ...updates };
    this.onStateChange?.(this.state);
  }

  /**
   * 获取支持的音频格式
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/wav',
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // 默认格式
  }

  /**
   * 将录音转换为文件
   */
  static blobToFile(blob: Blob, filename: string = 'recording'): File {
    const extension = blob.type.includes('webm') ? 'webm' : 
                     blob.type.includes('mp4') ? 'mp4' : 
                     blob.type.includes('wav') ? 'wav' : 'webm';
    
    return new File([blob], `${filename}.${extension}`, {
      type: blob.type,
      lastModified: Date.now()
    });
  }

  /**
   * 格式化时长显示
   */
  static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * 检查浏览器是否支持录音
   */
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && 
              navigator.mediaDevices.getUserMedia && 
              window.MediaRecorder);
  }
}

export default AudioRecorder;
