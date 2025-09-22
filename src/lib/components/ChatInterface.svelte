<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import ChatMessage from './ChatMessage.svelte';
  import MessageInput from './MessageInput.svelte';
  import ModelSelector from './ModelSelector.svelte';
  import ChatContextSettings from './ChatContextSettings.svelte';
  import { chatStore } from '../stores/ChatStore.js';
  import type { FileUpload } from '../types/index.js';
  
  let chatContainer: HTMLDivElement;
  let showModelSelector = $state(false);
  
  // 订阅 store
  const chatState = chatStore;
  
  onMount(() => {
    // 滚动到底部
    scrollToBottom();
  });
  
  onDestroy(() => {
    // 清理资源
    chatStore.dispose();
  });
  
  function scrollToBottom() {
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }
  
  // 当消息更新时滚动到底部
  $effect(() => {
    if ($chatState.messages) {
      setTimeout(scrollToBottom, 100);
    }
  });
  
  async function handleSendMessage(message: string, uploads?: FileUpload[]) {
    try {
      // 转换文件上传为消息附件
      let attachments;
      if (uploads && uploads.length > 0) {
        attachments = await Promise.all(
          uploads
            .filter(upload => upload.type === 'image' || upload.type === 'audio')
            .map(async (upload) => {
              const arrayBuffer = await upload.file.arrayBuffer();
              return {
                type: upload.type as 'image' | 'audio',
                data: arrayBuffer,
                name: upload.file.name,
              };
            })
        );
      }
      
      await chatStore.sendMessage(message, attachments);
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  }
  
  async function handleModelSelect(model: any) {
    try {
      await chatStore.loadModel(model);
      showModelSelector = false;
    } catch (error) {
      console.error('加载模型失败:', error);
    }
  }

  async function handleLocalModelLoad(file: File, modelName?: string) {
    try {
      await chatStore.loadLocalModel(file, modelName);
      showModelSelector = false;
    } catch (error) {
      console.error('本地模型加载失败:', error);
      throw error;
    }
  }
  
  function handleConfigUpdate(config: any) {
    try {
      chatStore.updateModelConfig(config);
    } catch (error) {
      console.error('更新配置失败:', error);
    }
  }

  function handleContextLengthChange(length: number) {
    chatStore.setContextLength(length);
  }

  function handleToggleContext() {
    chatStore.toggleContext();
  }

  function handleClearHistory() {
    chatStore.clearChatHistory();
  }
  
  function clearChat() {
    chatStore.clearMessages();
  }
  
  function dismissError() {
    chatStore.clearError();
  }
</script>

<div class="flex flex-col h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white border-b shadow-sm">
    <div class="flex items-center justify-between p-3 sm:p-4">
      <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <h1 class="text-lg sm:text-xl font-semibold text-gray-900 truncate">
          Gemma AI 助手
        </h1>
        {#if $chatState.currentModel}
          <span class="hidden sm:inline-flex px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
            {$chatState.currentModel.name}
          </span>
        {/if}
      </div>

      <div class="flex items-center gap-1 sm:gap-2">
        <!-- Clear Chat Button -->
        {#if $chatState.messages.length > 0}
          <button
            onclick={handleClearHistory}
            class="p-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100
                   rounded-lg transition-colors"
            title="清空对话"
            aria-label="清空对话"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        {/if}

        <!-- Context Settings -->
        <div class="relative">
          <ChatContextSettings
            chatState={$chatState}
            onContextLengthChange={handleContextLengthChange}
            onToggleContext={handleToggleContext}
            onClearHistory={handleClearHistory}
          />
        </div>

        <!-- Model Selector Toggle -->
        <button
          onclick={() => showModelSelector = !showModelSelector}
          class="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100
                 rounded-lg transition-colors"
          title="模型设置"
          aria-label="模型设置"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Model Status -->
    {#if $chatState.currentModel}
      <div class="sm:hidden px-3 pb-2">
        <span class="inline-flex px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
          {$chatState.currentModel.name}
        </span>
      </div>
    {/if}
  </header>
  
  <!-- Model Selector Panel -->
  {#if showModelSelector}
    <ModelSelector
      availableModels={chatStore.getAvailableModels()}
      currentModel={$chatState.currentModel}
      isLoading={$chatState.isModelLoading}
      onModelSelect={handleModelSelect}
      onLocalModelLoad={handleLocalModelLoad}
      onConfigUpdate={handleConfigUpdate}
    />
  {/if}
  
  <!-- Error Banner -->
  {#if $chatState.error}
    <div class="bg-red-50 border-l-4 border-red-400 p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
          <span class="text-red-700">{$chatState.error}</span>
        </div>
        <button
          onclick={dismissError}
          class="text-red-400 hover:text-red-600"
          aria-label="关闭错误提示"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    </div>
  {/if}
  
  <!-- Chat Messages -->
  <div 
    bind:this={chatContainer}
    class="flex-1 overflow-y-auto"
  >
    {#if $chatState.messages.length === 0}
      <!-- Welcome Message -->
      <div class="flex items-center justify-center h-full">
        <div class="text-center max-w-md mx-auto p-6">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">欢迎使用 Gemma AI 助手</h2>
          <p class="text-gray-600 mb-4">
            这是一个本地离线的 AI 对话应用，使用 Google Gemma 模型。
          </p>
          {#if !$chatState.currentModel}
            <p class="text-sm text-gray-500">
              请先选择并加载一个模型开始对话。
            </p>
          {:else}
            <p class="text-sm text-gray-500">
              开始输入消息与 AI 对话吧！
            </p>
          {/if}
        </div>
      </div>
    {:else}
      <!-- Messages List -->
      <div class="space-y-1">
        {#each $chatState.messages as message (message.id)}
          <ChatMessage {message} />
        {/each}
        
        <!-- Loading Indicator -->
        {#if $chatState.isLoading}
          <div class="flex justify-start p-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">
                AI
              </div>
              <div class="flex items-center gap-1 bg-gray-100 rounded-2xl px-4 py-3">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
  
  <!-- Message Input -->
  <MessageInput
    onSend={handleSendMessage}
    disabled={!$chatState.currentModel || $chatState.isLoading || $chatState.isModelLoading}
    supportsMultimodal={$chatState.currentModel?.supportsMultimodal || false}
  />
</div>
