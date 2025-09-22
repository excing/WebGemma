<script lang="ts">
  import type { ChatState } from '../types/index.js';
  
  interface Props {
    chatState: ChatState;
    onContextLengthChange: (length: number) => void;
    onToggleContext: () => void;
    onClearHistory: () => void;
  }
  
  let { chatState, onContextLengthChange, onToggleContext, onClearHistory }: Props = $props();
  
  let showSettings = $state(false);
  let tempContextLength = $state(chatState.contextLength);
  
  function handleContextLengthChange() {
    if (tempContextLength !== chatState.contextLength) {
      onContextLengthChange(tempContextLength);
    }
  }
  
  function handleClearHistory() {
    if (confirm('确定要清除所有聊天历史吗？此操作不可撤销。')) {
      onClearHistory();
      showSettings = false;
    }
  }
</script>

<!-- Settings Button -->
<button
  onclick={() => showSettings = !showSettings}
  class="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
  title="聊天上下文设置"
  aria-label="聊天上下文设置"
>
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
  </svg>
</button>

<!-- Settings Panel -->
{#if showSettings}
  <div class="absolute top-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 z-10">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h3 class="font-medium text-gray-900">聊天上下文设置</h3>
        <button
          onclick={() => showSettings = false}
          class="text-gray-400 hover:text-gray-600"
          aria-label="关闭设置"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <!-- Context Toggle -->
      <div class="flex items-center justify-between">
        <label for="enable-context" class="text-sm font-medium text-gray-700">
          启用上下文记忆
        </label>
        <button
          id="enable-context"
          onclick={onToggleContext}
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                 {chatState.enableContext ? 'bg-blue-600' : 'bg-gray-200'}"
          role="switch"
          aria-checked={chatState.enableContext}
          aria-label="切换上下文记忆"
        >
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                   {chatState.enableContext ? 'translate-x-6' : 'translate-x-1'}"
          ></span>
        </button>
      </div>
      
      <!-- Context Length -->
      <div class="space-y-2">
        <label for="context-length" class="block text-sm font-medium text-gray-700">
          上下文长度: {tempContextLength} 轮对话
        </label>
        <input
          id="context-length"
          type="range"
          min="1"
          max="50"
          bind:value={tempContextLength}
          onchange={handleContextLengthChange}
          disabled={!chatState.enableContext}
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                 disabled:opacity-50 disabled:cursor-not-allowed
                 slider:bg-blue-600"
        />
        <div class="flex justify-between text-xs text-gray-500">
          <span>1</span>
          <span>25</span>
          <span>50</span>
        </div>
      </div>
      
      <!-- Context Info -->
      <div class="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
        <p class="mb-2">
          <strong>上下文记忆</strong>：AI 会记住之前的对话内容，提供更连贯的回复。
        </p>
        <p class="mb-2">
          <strong>上下文长度</strong>：保留最近 N 轮对话作为上下文。数值越大，AI 记忆越长，但可能影响响应速度。
        </p>
        <p>
          <strong>建议</strong>：日常对话使用 5-10 轮，复杂任务使用 15-25 轮。
        </p>
      </div>
      
      <!-- Current Status -->
      <div class="border-t pt-3">
        <div class="text-sm text-gray-600 space-y-1">
          <div class="flex justify-between">
            <span>当前消息数：</span>
            <span class="font-medium">{chatState.messages.length}</span>
          </div>
          <div class="flex justify-between">
            <span>上下文状态：</span>
            <span class="font-medium {chatState.enableContext ? 'text-green-600' : 'text-gray-400'}">
              {chatState.enableContext ? '已启用' : '已禁用'}
            </span>
          </div>
          <div class="flex justify-between">
            <span>记忆长度：</span>
            <span class="font-medium">{chatState.enableContext ? chatState.contextLength : 0} 轮</span>
          </div>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="border-t pt-3 space-y-2">
        <button
          onclick={handleClearHistory}
          disabled={chatState.messages.length === 0}
          class="w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50
                 border border-red-200 rounded-lg transition-colors
                 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          清除聊天历史
        </button>
        
        <p class="text-xs text-gray-500 text-center">
          清除历史不会影响当前模型的加载状态
        </p>
      </div>
    </div>
  </div>
{/if}

<style>
  /* 自定义滑块样式 */
  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  input[type="range"]::-moz-range-thumb {
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  input[type="range"]:disabled::-webkit-slider-thumb {
    background: #9ca3af;
  }
  
  input[type="range"]:disabled::-moz-range-thumb {
    background: #9ca3af;
  }
</style>
