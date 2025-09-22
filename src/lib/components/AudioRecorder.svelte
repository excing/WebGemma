<script lang="ts">
  import { onDestroy } from 'svelte';
  import AudioRecorder, { type RecordingState } from '../utils/audioRecorder.js';

  interface Props {
    onRecordingComplete: (audioFile: File) => void;
    disabled?: boolean;
  }

  let { onRecordingComplete, disabled = false }: Props = $props();

  let recorder: AudioRecorder | null = null;
  let recordingState: RecordingState = $state({
    isRecording: false,
    isPaused: false,
    duration: 0,
    error: null
  });
  let showRecorder = $state(false);

  // 检查浏览器支持
  const isSupported = AudioRecorder.isSupported();

  function initRecorder() {
    if (!recorder) {
      recorder = new AudioRecorder();
      
      recorder.onStateChange = (state) => {
        recordingState = state;
      };
      
      recorder.onDataAvailable = (audioBlob) => {
        const audioFile = AudioRecorder.blobToFile(audioBlob, `recording_${Date.now()}`);
        onRecordingComplete(audioFile);
        showRecorder = false;
      };
      
      recorder.onError = (error) => {
        console.error('录音错误:', error);
        showRecorder = false;
      };
    }
  }

  async function startRecording() {
    if (!isSupported) {
      alert('您的浏览器不支持录音功能');
      return;
    }

    initRecorder();
    showRecorder = true;
    
    try {
      await recorder?.startRecording();
    } catch (error) {
      console.error('开始录音失败:', error);
      showRecorder = false;
    }
  }

  function pauseRecording() {
    recorder?.pauseRecording();
  }

  function resumeRecording() {
    recorder?.resumeRecording();
  }

  function stopRecording() {
    recorder?.stopRecording();
  }

  function cancelRecording() {
    recorder?.cancelRecording();
    showRecorder = false;
  }

  function toggleRecording() {
    if (recordingState.isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  }

  onDestroy(() => {
    recorder?.cancelRecording();
  });
</script>

<!-- Recording Button -->
<button
  onclick={startRecording}
  disabled={disabled || !isSupported}
  class="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100
         rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  title={isSupported ? "录音" : "浏览器不支持录音"}
  aria-label="录音"
>
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
  </svg>
</button>

<!-- Recording Modal -->
{#if showRecorder}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">录音</h3>
        <button
          onclick={cancelRecording}
          class="text-gray-400 hover:text-gray-600"
          aria-label="取消录音"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Recording Status -->
      <div class="text-center mb-6">
        {#if recordingState.error}
          <div class="text-red-600 text-sm mb-2">
            {recordingState.error}
          </div>
        {:else}
          <!-- Recording Animation -->
          <div class="flex items-center justify-center mb-4">
            <div class="relative">
              <div class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center
                          {recordingState.isRecording && !recordingState.isPaused ? 'animate-pulse' : ''}">
                <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </div>
              
              {#if recordingState.isRecording && !recordingState.isPaused}
                <div class="absolute inset-0 w-16 h-16 bg-red-500 rounded-full animate-ping opacity-25"></div>
              {/if}
            </div>
          </div>

          <!-- Duration -->
          <div class="text-2xl font-mono font-bold text-gray-900 mb-2">
            {AudioRecorder.formatDuration(recordingState.duration)}
          </div>

          <!-- Status Text -->
          <div class="text-sm text-gray-600">
            {#if recordingState.isPaused}
              录音已暂停
            {:else if recordingState.isRecording}
              正在录音...
            {:else}
              准备录音
            {/if}
          </div>
        {/if}
      </div>

      <!-- Controls -->
      <div class="flex items-center justify-center gap-4">
        {#if recordingState.isRecording}
          <!-- Pause/Resume Button -->
          <button
            onclick={toggleRecording}
            class="p-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full transition-colors"
            title={recordingState.isPaused ? "继续录音" : "暂停录音"}
            aria-label={recordingState.isPaused ? "继续录音" : "暂停录音"}
          >
            {#if recordingState.isPaused}
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            {:else}
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            {/if}
          </button>

          <!-- Stop Button -->
          <button
            onclick={stopRecording}
            class="p-3 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
            title="完成录音"
            aria-label="完成录音"
          >
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z"/>
            </svg>
          </button>
        {/if}

        <!-- Cancel Button -->
        <button
          onclick={cancelRecording}
          class="p-3 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors"
          title="取消录音"
          aria-label="取消录音"
        >
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <!-- Instructions -->
      {#if !recordingState.isRecording && !recordingState.error}
        <div class="mt-4 text-xs text-gray-500 text-center">
          <p>点击录音按钮开始录制音频</p>
          <p>支持暂停、继续和取消操作</p>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  @keyframes ping {
    75%, 100% {
      transform: scale(2);
      opacity: 0;
    }
  }
  
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  .animate-ping {
    animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
</style>
