<script lang="ts">
  import type { FileUpload } from '../types/index.js';
  import {
    validateFile,
    createImagePreview
  } from '../utils/fileUtils.js';
  import AudioRecorder from './AudioRecorder.svelte';

  interface Props {
    onSend: (message: string, attachments?: FileUpload[]) => void;
    disabled?: boolean;
    supportsMultimodal?: boolean;
  }

  let { onSend, disabled = false, supportsMultimodal = false }: Props = $props();

  let message = $state('');
  let attachments: FileUpload[] = $state([]);
  let fileInput: HTMLInputElement;
  let textArea: HTMLTextAreaElement;
  let dragContainer: HTMLDivElement;
  let isDragging = $state(false);
  let uploadError = $state<string | null>(null);

  function handleSubmit() {
    if (!message.trim() && attachments.length === 0) return;
    if (disabled) return;

    onSend(message.trim(), attachments.length > 0 ? attachments : undefined);
    message = '';
    attachments = [];
    uploadError = null;

    // 重置文本框高度
    if (textArea) {
      textArea.style.height = 'auto';
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  async function processFiles(files: FileList) {
    uploadError = null;

    for (const file of Array.from(files)) {
      const validation = validateFile(file);

      if (!validation.isValid) {
        uploadError = validation.error || '文件验证失败';
        continue;
      }

      try {
        const fileUpload: FileUpload = {
          file,
          type: validation.fileType!
        };

        // 为图片创建预览
        if (validation.fileType === 'image') {
          fileUpload.preview = await createImagePreview(file);
        }

        attachments = [...attachments, fileUpload];
      } catch (error) {
        uploadError = error instanceof Error ? error.message : '文件处理失败';
      }
    }
  }

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (files) {
      processFiles(files);
    }

    // 清空文件输入
    target.value = '';
  }
  
  function removeAttachment(index: number) {
    attachments = attachments.filter((_, i) => i !== index);
  }

  function handleRecordingComplete(audioFile: File) {
    const fileUpload: FileUpload = {
      file: audioFile,
      type: 'audio'
    };

    attachments = [...attachments, fileUpload];
  }

  function autoResize() {
    if (textArea) {
      textArea.style.height = 'auto';
      textArea.style.height = Math.min(textArea.scrollHeight, 120) + 'px';
    }
  }

  // 拖拽处理
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (!supportsMultimodal || disabled) return;
    isDragging = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    // 只有当离开整个容器时才设置为 false
    if (!dragContainer?.contains(event.relatedTarget as Node)) {
      isDragging = false;
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;

    if (!supportsMultimodal || disabled) return;

    const files = event.dataTransfer?.files;
    if (files) {
      processFiles(files);
    }
  }

  $effect(() => {
    autoResize();
  });
</script>

<div
  bind:this={dragContainer}
  class="border-t bg-white p-4 {isDragging ? 'bg-blue-50 border-blue-300' : ''}"
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  role="region"
  aria-label="消息输入区域"
>
  <!-- Error Message -->
  {#if uploadError}
    <div class="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>
        <span class="text-sm text-red-700">{uploadError}</span>
        <button
          onclick={() => uploadError = null}
          class="ml-auto text-red-400 hover:text-red-600"
          aria-label="关闭错误提示"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    </div>
  {/if}

  <!-- Drag Drop Overlay -->
  {#if isDragging}
    <div class="absolute inset-0 bg-blue-50/90 border-2 border-dashed border-blue-300 rounded-lg
                flex items-center justify-center z-10">
      <div class="text-center">
        <svg class="w-12 h-12 text-blue-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
        </svg>
        <p class="text-blue-700 font-medium">拖拽文件到这里上传</p>
        <p class="text-blue-600 text-sm">支持图片和音频文件</p>
      </div>
    </div>
  {/if}

  <!-- Attachments Preview -->
  {#if attachments.length > 0}
    <div class="mb-3 flex flex-wrap gap-2">
      {#each attachments as attachment, index}
        <div class="relative group">
          {#if attachment.type === 'image' && attachment.preview}
            <div class="relative">
              <img 
                src={attachment.preview} 
                alt={attachment.file.name}
                class="w-16 h-16 object-cover rounded-lg border"
              />
              <button
                onclick={() => removeAttachment(index)}
                class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs
                       flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            </div>
          {:else}
            <div class="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg border">
              <svg class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                {#if attachment.type === 'audio'}
                  <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clip-rule="evenodd"></path>
                {:else}
                  <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                {/if}
              </svg>
              <span class="text-sm text-gray-700 max-w-20 truncate">
                {attachment.file.name}
              </span>
              <button
                onclick={() => removeAttachment(index)}
                class="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors"
              >
                ×
              </button>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
  
  <!-- Input Area -->
  <div class="flex items-end gap-2 sm:gap-3">
    <!-- File Upload Button -->
    {#if supportsMultimodal}
      <button
        onclick={() => fileInput.click()}
        disabled={disabled}
        class="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100
               rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="上传文件"
        aria-label="上传文件"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
        </svg>
      </button>

      <!-- Audio Recorder Button -->
      <AudioRecorder
        onRecordingComplete={handleRecordingComplete}
        disabled={disabled}
      />

      <input
        bind:this={fileInput}
        type="file"
        accept="image/*,audio/*"
        multiple
        onchange={handleFileSelect}
        class="hidden"
      />
    {/if}
    
    <!-- Text Input -->
    <div class="flex-1 relative">
      <textarea
        bind:this={textArea}
        bind:value={message}
        onkeydown={handleKeyDown}
        oninput={autoResize}
        placeholder="输入消息... (Shift+Enter 换行)"
        disabled={disabled}
        class="w-full px-3 py-2 pr-10 sm:px-4 sm:py-3 sm:pr-12 border border-gray-300 rounded-2xl resize-none
               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
               disabled:opacity-50 disabled:cursor-not-allowed
               min-h-[40px] sm:min-h-[48px] max-h-[120px] text-sm sm:text-base"
        rows="1"
      ></textarea>
      
      <!-- Send Button -->
      <button
        onclick={handleSubmit}
        disabled={disabled || (!message.trim() && attachments.length === 0)}
        class="absolute right-1 bottom-2 sm:right-2 sm:bottom-3 p-1.5 sm:p-2 bg-blue-500 text-white rounded-full
               hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
               disabled:hover:bg-blue-500"
        title="发送消息"
        aria-label="发送消息"
      >
        <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
        </svg>
      </button>
    </div>
  </div>
  
  <!-- Input Hints -->
  <div class="mt-2 text-xs text-gray-500">
    {#if supportsMultimodal}
      支持文本、图片和音频输入
    {:else}
      仅支持文本输入
    {/if}
    • Enter 发送，Shift+Enter 换行
  </div>
</div>
