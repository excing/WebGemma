<script lang="ts">
  import AudioRecorder from '$lib/components/AudioRecorder.svelte';
  import type { FileUpload } from '$lib/types/index.js';

  let recordings: FileUpload[] = $state([]);

  function handleRecordingComplete(audioFile: File) {
    console.log('录音完成:', audioFile);
    
    const fileUpload: FileUpload = {
      file: audioFile,
      type: 'audio'
    };
    
    recordings = [...recordings, fileUpload];
  }

  function playAudio(file: File) {
    const audio = new Audio(URL.createObjectURL(file));
    audio.play();
  }

  function downloadAudio(file: File) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function removeRecording(index: number) {
    recordings = recordings.filter((_, i) => i !== index);
  }
</script>

<svelte:head>
  <title>录音功能测试 - Gemma AI</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-2xl mx-auto px-4">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">录音功能测试</h1>
      <p class="text-gray-600">测试 Gemma AI 助手的录音功能</p>
    </div>

    <!-- Recording Section -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">开始录音</h2>
      
      <div class="flex items-center justify-center">
        <AudioRecorder
          onRecordingComplete={handleRecordingComplete}
          disabled={false}
        />
        <span class="ml-3 text-gray-600">点击麦克风图标开始录音</span>
      </div>
      
      <div class="mt-4 text-sm text-gray-500 text-center">
        <p>• 首次使用需要授权麦克风访问权限</p>
        <p>• 支持暂停、继续和取消操作</p>
        <p>• 录音完成后会自动添加到下方列表</p>
      </div>
    </div>

    <!-- Recordings List -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">
        录音列表 ({recordings.length})
      </h2>
      
      {#if recordings.length === 0}
        <div class="text-center py-8 text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
          </svg>
          <p>还没有录音</p>
          <p class="text-sm">点击上方的麦克风图标开始录音</p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each recordings as recording, index}
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div class="flex items-center gap-3">
                <!-- Audio Icon -->
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                </div>
                
                <!-- File Info -->
                <div>
                  <p class="font-medium text-gray-900">{recording.file.name}</p>
                  <p class="text-sm text-gray-500">
                    {(recording.file.size / 1024).toFixed(1)} KB • {recording.file.type}
                  </p>
                </div>
              </div>
              
              <!-- Actions -->
              <div class="flex items-center gap-2">
                <!-- Play Button -->
                <button
                  onclick={() => playAudio(recording.file)}
                  class="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                  title="播放录音"
                  aria-label="播放录音"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
                
                <!-- Download Button -->
                <button
                  onclick={() => downloadAudio(recording.file)}
                  class="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  title="下载录音"
                  aria-label="下载录音"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </button>
                
                <!-- Remove Button -->
                <button
                  onclick={() => removeRecording(index)}
                  class="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="删除录音"
                  aria-label="删除录音"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>
          {/each}
        </div>
        
        <!-- Clear All Button -->
        <div class="mt-4 text-center">
          <button
            onclick={() => recordings = []}
            class="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 
                   border border-red-200 rounded-lg transition-colors"
          >
            清除所有录音
          </button>
        </div>
      {/if}
    </div>

    <!-- Browser Support Info -->
    <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 class="text-sm font-medium text-blue-900 mb-2">浏览器支持说明</h3>
      <div class="text-sm text-blue-700 space-y-1">
        <p>• <strong>Chrome/Edge</strong>: 完全支持，推荐使用</p>
        <p>• <strong>Firefox</strong>: 支持 WebM 格式录音</p>
        <p>• <strong>Safari</strong>: 支持 MP4/WAV 格式录音</p>
        <p>• <strong>移动端</strong>: iOS 14.3+ 和 Android Chrome 支持</p>
      </div>
    </div>

    <!-- Back to Main -->
    <div class="mt-6 text-center">
      <a 
        href="/"
        class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 
               bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        返回主界面
      </a>
    </div>
  </div>
</div>
