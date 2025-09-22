<script lang="ts">
  import type { Message } from '../types/index.js';
  
  interface Props {
    message: Message;
  }
  
  let { message }: Props = $props();
  
  function formatTime(date: Date): string {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  function formatContent(content: string): string {
    // 简单的 markdown 渲染：换行和代码块
    return content
      .replace(/\n/g, '<br>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/```([^```]+)```/g, '<pre class="bg-gray-100 p-3 rounded-lg overflow-x-auto"><code>$1</code></pre>');
  }
</script>

<div class="flex gap-2 sm:gap-3 p-3 sm:p-4 {message.role === 'user' ? 'justify-end' : 'justify-start'}">
  <!-- Avatar -->
  <div class="flex-shrink-0 {message.role === 'user' ? 'order-2' : 'order-1'}">
    <div class="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium
                {message.role === 'user' ? 'bg-blue-500' : 'bg-green-500'}">
      {message.role === 'user' ? '你' : 'AI'}
    </div>
  </div>

  <!-- Message Content -->
  <div class="flex-1 max-w-[85%] sm:max-w-[70%] {message.role === 'user' ? 'order-1' : 'order-2'}">
    <div class="rounded-2xl px-3 py-2 sm:px-4 sm:py-3 {message.role === 'user'
      ? 'bg-blue-500 text-white ml-auto'
      : 'bg-gray-100 text-gray-900'}">
      
      <!-- Attachments -->
      {#if message.attachments && message.attachments.length > 0}
        <div class="mb-3 space-y-2">
          {#each message.attachments as attachment}
            {#if attachment.type === 'image'}
              <div class="rounded-lg overflow-hidden max-w-48 sm:max-w-xs">
                <img
                  src={typeof attachment.data === 'string' ? attachment.data : URL.createObjectURL(new Blob([attachment.data]))}
                  alt={attachment.name || '上传的图片'}
                  class="w-full h-auto"
                />
              </div>
            {:else if attachment.type === 'audio'}
              <div class="flex items-center gap-2 p-2 bg-black/10 rounded-lg">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
                <span class="text-sm">{attachment.name || '音频文件'}</span>
              </div>
            {/if}
          {/each}
        </div>
      {/if}
      
      <!-- Text Content -->
      {#if message.content}
        <div class="prose prose-sm max-w-none {message.role === 'user' ? 'prose-invert' : ''}">
          {@html formatContent(message.content)}
        </div>
      {/if}
    </div>
    
    <!-- Timestamp -->
    <div class="text-xs text-gray-500 mt-1 {message.role === 'user' ? 'text-right' : 'text-left'}">
      {formatTime(message.timestamp)}
    </div>
  </div>
</div>

<style>
  :global(.prose code) {
    background-color: rgb(229 231 235);
    color: rgb(31 41 55);
  }

  :global(.prose-invert code) {
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
  }

  :global(.prose pre) {
    background-color: rgb(229 231 235);
    color: rgb(31 41 55);
  }

  :global(.prose-invert pre) {
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
  }
</style>
