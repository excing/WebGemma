<script lang="ts">
  import type { ModelOption, ModelConfig } from '../types/index.js';
  import ModelDownloadGuide from './ModelDownloadGuide.svelte';
  import LocalModelLoader from './LocalModelLoader.svelte';

  interface Props {
    availableModels: ModelOption[];
    currentModel: ModelConfig | null;
    isLoading: boolean;
    onModelSelect: (model: ModelOption) => void;
    onLocalModelLoad: (file: File, modelName?: string) => Promise<void>;
    onConfigUpdate?: (config: Partial<ModelConfig>) => void;
  }
  
  let {
    availableModels,
    currentModel,
    isLoading,
    onModelSelect,
    onLocalModelLoad,
    onConfigUpdate
  }: Props = $props();
  
  let showAdvanced = $state(false);
  let showDownloadGuide = $state(false);
  let showLocalLoader = $state(false);
  let selectedDownloadModel = $state<ModelOption | null>(null);
  let selectedModelId = $state(currentModel ?
    availableModels.find(m => m.path === currentModel.path)?.id || '' : '');
  
  // 临时配置状态
  let tempConfig = $state({
    maxTokens: currentModel?.maxTokens || 1000,
    topK: currentModel?.topK || 40,
    temperature: currentModel?.temperature || 0.8,
    randomSeed: currentModel?.randomSeed || 101,
  });
  
  // 当当前模型改变时更新临时配置
  $effect(() => {
    if (currentModel) {
      tempConfig = {
        maxTokens: currentModel.maxTokens,
        topK: currentModel.topK,
        temperature: currentModel.temperature,
        randomSeed: currentModel.randomSeed,
      };
      selectedModelId = availableModels.find(m => m.path === currentModel.path)?.id || '';
    }
  });
  
  function handleModelChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const modelId = target.value;
    const model = availableModels.find(m => m.id === modelId);
    
    if (model) {
      selectedModelId = modelId;
      onModelSelect(model);
    }
  }
  
  function handleConfigChange() {
    if (onConfigUpdate) {
      onConfigUpdate(tempConfig);
    }
  }
  
  function resetToDefaults() {
    const currentModelOption = availableModels.find(m => m.id === selectedModelId);
    if (currentModelOption) {
      tempConfig = { ...currentModelOption.defaultConfig };
      handleConfigChange();
    }
  }

  function showModelDownloadGuide(model: ModelOption) {
    selectedDownloadModel = model;
    showDownloadGuide = true;
  }

  function closeDownloadGuide() {
    showDownloadGuide = false;
    selectedDownloadModel = null;
  }

  function openLocalLoader() {
    showLocalLoader = true;
  }

  function closeLocalLoader() {
    showLocalLoader = false;
  }

  async function handleLocalModelLoad(file: File, modelName?: string) {
    try {
      await onLocalModelLoad(file, modelName);
      closeLocalLoader();
    } catch (error) {
      console.error('本地模型加载失败:', error);
      throw error;
    }
  }
</script>

<div class="bg-white border-b p-4 space-y-4">
  <!-- Model Selection -->
  <div>
    <label for="model-select" class="block text-sm font-medium text-gray-700 mb-2">
      选择模型
    </label>
    <div class="space-y-3">
      <select
        id="model-select"
        value={selectedModelId}
        onchange={handleModelChange}
        disabled={isLoading}
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none
               focus:ring-2 focus:ring-blue-500 focus:border-transparent
               disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">请选择预设模型...</option>
        {#each availableModels as model}
          <option value={model.id}>
            {model.name} ({model.size})
          </option>
        {/each}
      </select>

      <!-- Local Model Load Button -->
      <button
        onclick={openLocalLoader}
        disabled={isLoading}
        class="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg
               text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50
               transition-colors disabled:opacity-50 disabled:cursor-not-allowed
               flex items-center justify-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
        </svg>
        从本地加载模型文件
      </button>
    </div>
    
    {#if selectedModelId}
      {@const selectedModel = availableModels.find(m => m.id === selectedModelId)}
      {#if selectedModel}
        <div class="mt-2 flex items-start justify-between">
          <div class="flex-1">
            <p class="text-sm text-gray-600">
              {selectedModel.description}
              {#if selectedModel.supportsMultimodal}
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 ml-2">
                  多模态
                </span>
              {/if}
            </p>
          </div>
          <button
            onclick={() => showModelDownloadGuide(selectedModel)}
            class="ml-3 text-xs text-blue-600 hover:text-blue-800 underline"
          >
            下载指南
          </button>
        </div>
      {/if}
    {/if}
  </div>
  
  <!-- Loading Indicator -->
  {#if isLoading}
    <div class="flex items-center gap-2 text-blue-600">
      <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="text-sm">正在加载模型...</span>
    </div>
  {/if}
  
  <!-- Current Model Status -->
  {#if currentModel && !isLoading}
    <div class="flex items-center gap-2 text-green-600">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
      </svg>
      <span class="text-sm">模型已就绪: {currentModel.name}</span>
    </div>
  {/if}
  
  <!-- Advanced Settings Toggle -->
  {#if currentModel}
    <button
      onclick={() => showAdvanced = !showAdvanced}
      class="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
    >
      <svg 
        class="w-4 h-4 transition-transform {showAdvanced ? 'rotate-90' : ''}" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
      </svg>
      高级设置
    </button>
  {/if}
  
  <!-- Advanced Settings Panel -->
  {#if showAdvanced && currentModel}
    <div class="space-y-4 p-4 bg-gray-50 rounded-lg">
      <!-- Max Tokens -->
      <div>
        <label for="max-tokens" class="block text-sm font-medium text-gray-700 mb-1">
          最大令牌数: {tempConfig.maxTokens}
        </label>
        <input
          id="max-tokens"
          type="range"
          min="100"
          max="4000"
          step="100"
          bind:value={tempConfig.maxTokens}
          onchange={handleConfigChange}
          class="w-full"
        />
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>100</span>
          <span>4000</span>
        </div>
      </div>
      
      <!-- Temperature -->
      <div>
        <label for="temperature" class="block text-sm font-medium text-gray-700 mb-1">
          温度 (创造性): {tempConfig.temperature}
        </label>
        <input
          id="temperature"
          type="range"
          min="0.1"
          max="2.0"
          step="0.1"
          bind:value={tempConfig.temperature}
          onchange={handleConfigChange}
          class="w-full"
        />
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>0.1 (保守)</span>
          <span>2.0 (创造)</span>
        </div>
      </div>
      
      <!-- Top K -->
      <div>
        <label for="top-k" class="block text-sm font-medium text-gray-700 mb-1">
          Top-K: {tempConfig.topK}
        </label>
        <input
          id="top-k"
          type="range"
          min="1"
          max="100"
          step="1"
          bind:value={tempConfig.topK}
          onchange={handleConfigChange}
          class="w-full"
        />
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>1</span>
          <span>100</span>
        </div>
      </div>
      
      <!-- Random Seed -->
      <div>
        <label for="random-seed" class="block text-sm font-medium text-gray-700 mb-1">
          随机种子
        </label>
        <input
          id="random-seed"
          type="number"
          min="1"
          max="999999"
          bind:value={tempConfig.randomSeed}
          onchange={handleConfigChange}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none 
                 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <!-- Reset Button -->
      <button
        onclick={resetToDefaults}
        class="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg
               hover:bg-gray-50 transition-colors"
      >
        重置为默认值
      </button>
    </div>
  {/if}
</div>

<!-- Download Guide Modal -->
{#if showDownloadGuide && selectedDownloadModel}
  <ModelDownloadGuide
    model={selectedDownloadModel}
    onClose={closeDownloadGuide}
  />
{/if}

<!-- Local Model Loader Modal -->
{#if showLocalLoader}
  <LocalModelLoader
    onClose={closeLocalLoader}
    onModelLoad={handleLocalModelLoad}
    isLoading={isLoading}
  />
{/if}
