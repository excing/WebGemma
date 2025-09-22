<script lang="ts">
  import type { ModelOption } from '../types/index.js';
  
  interface Props {
    model: ModelOption;
    onClose: () => void;
  }
  
  let { model, onClose }: Props = $props();
  
  const downloadSteps = [
    {
      step: 1,
      title: '访问 Hugging Face',
      description: `前往 ${getHuggingFaceUrl(model.id)} 下载模型文件`
    },
    {
      step: 2,
      title: '下载模型文件',
      description: `下载文件名包含 "web" 的 .task 或 .task.bin 文件`
    },
    {
      step: 3,
      title: '放置文件',
      description: `将下载的文件重命名为 "${model.path}" 并放置在项目的 static 目录中`
    },
    {
      step: 4,
      title: '刷新页面',
      description: '刷新页面后即可选择并加载该模型'
    }
  ];
  
  function getHuggingFaceUrl(modelId: string): string {
    const urls: Record<string, string> = {
      'gemma2-2b': 'https://huggingface.co/litert-community/Gemma2-2B-IT/tree/main',
      'gemma3-1b': 'https://huggingface.co/litert-community/Gemma3-1B-IT/tree/main',
      'gemma3-e2b': 'https://huggingface.co/google/gemma-3n-E2B-it-litert-lm/tree/main',
      'gemma3-e4b': 'https://huggingface.co/google/gemma-3n-E4B-it-litert-lm/tree/main'
    };
    return urls[modelId] || 'https://huggingface.co';
  }
  
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // 可以添加复制成功的提示
    });
  }
</script>

<!-- Modal Backdrop -->
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
  <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
    <!-- Header -->
    <div class="flex items-center justify-between p-6 border-b">
      <h2 class="text-xl font-semibold text-gray-900">
        下载 {model.name}
      </h2>
      <button
        onclick={onClose}
        class="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="关闭"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    
    <!-- Content -->
    <div class="p-6">
      <!-- Model Info -->
      <div class="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 class="font-medium text-gray-900 mb-2">{model.name}</h3>
        <p class="text-gray-600 text-sm mb-2">{model.description}</p>
        <div class="flex items-center gap-4 text-sm">
          <span class="text-gray-500">文件大小: {model.size}</span>
          {#if model.supportsMultimodal}
            <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
              多模态支持
            </span>
          {/if}
        </div>
      </div>
      
      <!-- Download Steps -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">下载步骤</h3>
        
        {#each downloadSteps as step}
          <div class="flex gap-4">
            <div class="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
              {step.step}
            </div>
            <div class="flex-1">
              <h4 class="font-medium text-gray-900 mb-1">{step.title}</h4>
              <p class="text-gray-600 text-sm">{step.description}</p>
              
              {#if step.step === 1}
                <div class="mt-2">
                  <a
                    href={getHuggingFaceUrl(model.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                    访问下载页面
                  </a>
                </div>
              {/if}
              
              {#if step.step === 3}
                <div class="mt-2 p-2 bg-gray-100 rounded font-mono text-sm">
                  <div class="flex items-center justify-between">
                    <span>{model.path}</span>
                    <button
                      onclick={() => copyToClipboard(model.path)}
                      class="text-gray-500 hover:text-gray-700"
                      title="复制文件名"
                      aria-label="复制文件名"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
      
      <!-- Important Notes -->
      <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 class="font-medium text-yellow-800 mb-2">重要提示</h4>
        <ul class="text-yellow-700 text-sm space-y-1">
          <li>• 确保下载的文件名包含 "web" 字样，这些是专为浏览器优化的版本</li>
          <li>• 模型文件较大，请确保网络连接稳定</li>
          <li>• 文件必须放置在 static 目录中才能被正确加载</li>
          <li>• 如果文件名不匹配，请重命名为指定的文件名</li>
        </ul>
      </div>
      
      <!-- Alternative Models -->
      <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 class="font-medium text-blue-800 mb-2">其他可用模型</h4>
        <p class="text-blue-700 text-sm mb-2">
          如果当前模型下载困难，您也可以尝试其他模型：
        </p>
        <ul class="text-blue-700 text-sm space-y-1">
          <li>• Gemma2-2B-IT: 轻量级，适合快速体验</li>
          <li>• Gemma3-1B-IT: 最新轻量级模型</li>
          <li>• Gemma-3n-E2B: 支持多模态输入</li>
          <li>• Gemma-3n-E4B: 高性能多模态模型</li>
        </ul>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="flex justify-end gap-3 p-6 border-t">
      <button
        onclick={onClose}
        class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        关闭
      </button>
      <a
        href={getHuggingFaceUrl(model.id)}
        target="_blank"
        rel="noopener noreferrer"
        class="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors"
      >
        前往下载
      </a>
    </div>
  </div>
</div>
