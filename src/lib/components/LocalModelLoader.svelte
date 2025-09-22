<script lang="ts">
  import { formatFileSize } from '../utils/fileUtils.js';
  
  interface Props {
    onClose: () => void;
    onModelLoad: (file: File, modelName?: string) => Promise<void>;
    isLoading?: boolean;
  }
  
  let { onClose, onModelLoad, isLoading = false }: Props = $props();
  
  let fileInput: HTMLInputElement;
  let selectedFile: File | null = $state(null);
  let modelName = $state('');
  let dragActive = $state(false);
  let uploadError = $state<string | null>(null);
  let loadingProgress = $state<string>('');
  
  // 支持的模型文件扩展名
  const SUPPORTED_EXTENSIONS = ['.task', '.bin', '.tflite', ".litertlm"];
  
  function validateModelFile(file: File): { isValid: boolean; error?: string } {
    // 检查文件扩展名
    const fileName = file.name.toLowerCase();
    const hasValidExtension = SUPPORTED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      return {
        isValid: false,
        error: `不支持的文件格式。支持的格式: ${SUPPORTED_EXTENSIONS.join(', ')}`
      };
    }
    
    // 检查文件大小（最大 10GB）
    const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `文件过大。最大支持 10GB，当前文件: ${formatFileSize(file.size)}`
      };
    }
    
    // 检查是否为空文件
    if (file.size === 0) {
      return {
        isValid: false,
        error: '文件为空'
      };
    }
    
    return { isValid: true };
  }
  
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    
    // 清空输入
    target.value = '';
  }
  
  function processFile(file: File) {
    uploadError = null;
    
    const validation = validateModelFile(file);
    if (!validation.isValid) {
      uploadError = validation.error || '文件验证失败';
      return;
    }
    
    selectedFile = file;
    
    // 自动生成模型名称
    if (!modelName) {
      modelName = file.name.replace(/\.(task|bin|tflite|litertlm)$/i, '');
    }
  }
  
  // 拖拽处理
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragActive = true;
  }
  
  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    dragActive = false;
  }
  
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragActive = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }
  
  async function handleLoadModel() {
    if (!selectedFile) return;
    
    try {
      loadingProgress = '正在加载模型...';
      await onModelLoad(selectedFile, modelName || undefined);
      onClose();
    } catch (error) {
      uploadError = error instanceof Error ? error.message : '模型加载失败';
    } finally {
      loadingProgress = '';
    }
  }
  
  function clearSelection() {
    selectedFile = null;
    modelName = '';
    uploadError = null;
  }
  
  function detectModelType(fileName: string): string {
    const name = fileName.toLowerCase();
    if (name.includes('e2b') || name.includes('e4b')) {
      return '多模态模型';
    } else if (name.includes('gemma')) {
      return 'Gemma 文本模型';
    } else if (name.includes('web') || name.includes('task')) {
      return 'Web 优化模型';
    }
    return '未知模型类型';
  }
</script>

<!-- Modal Backdrop -->
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
  <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
    <!-- Header -->
    <div class="flex items-center justify-between p-6 border-b">
      <h2 class="text-xl font-semibold text-gray-900">
        加载本地模型
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
      <!-- Instructions -->
      <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 class="font-medium text-blue-800 mb-2">使用说明</h3>
        <ul class="text-blue-700 text-sm space-y-1">
          <li>• 支持 .task、.bin、.tflite、.litertlm 格式的模型文件</li>
          <li>• 推荐使用文件名包含 "web" 的浏览器优化版本</li>
          <li>• 文件名包含 "E2B" 或 "E4B" 的为多模态模型</li>
          <li>• 最大支持 10GB 的模型文件</li>
        </ul>
      </div>
      
      <!-- File Upload Area -->
      <div 
        class="border-2 border-dashed rounded-lg p-8 text-center transition-colors
               {dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
               {selectedFile ? 'border-green-400 bg-green-50' : ''}"
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
        role="button"
        tabindex="0"
        aria-label="文件上传区域"
      >
        {#if selectedFile}
          <!-- Selected File Display -->
          <div class="space-y-4">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            
            <div>
              <h3 class="text-lg font-medium text-gray-900">{selectedFile.name}</h3>
              <p class="text-gray-600">大小: {formatFileSize(selectedFile.size)}</p>
              <p class="text-gray-600">类型: {detectModelType(selectedFile.name)}</p>
            </div>
            
            <button
              onclick={clearSelection}
              class="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              重新选择文件
            </button>
          </div>
        {:else}
          <!-- Upload Prompt -->
          <div class="space-y-4">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
            </div>
            
            <div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">选择模型文件</h3>
              <p class="text-gray-600 mb-4">
                拖拽文件到这里，或点击下方按钮选择文件
              </p>
              
              <button
                onclick={() => fileInput.click()}
                class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                浏览文件
              </button>
            </div>
          </div>
        {/if}
      </div>
      
      <!-- Hidden File Input -->
      <input
        bind:this={fileInput}
        type="file"
        accept=".task,.bin,.tflite,.litertlm"
        onchange={handleFileSelect}
        class="hidden"
      />
      
      <!-- Model Name Input -->
      {#if selectedFile}
        <div class="mt-6">
          <label for="model-name" class="block text-sm font-medium text-gray-700 mb-2">
            模型名称（可选）
          </label>
          <input
            id="model-name"
            type="text"
            bind:value={modelName}
            placeholder="输入自定义模型名称"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none 
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p class="mt-1 text-sm text-gray-500">
            如果不填写，将使用文件名作为模型名称
          </p>
        </div>
      {/if}
      
      <!-- Error Display -->
      {#if uploadError}
        <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-sm text-red-700">{uploadError}</span>
          </div>
        </div>
      {/if}
      
      <!-- Loading Progress -->
      {#if loadingProgress}
        <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-center gap-2">
            <svg class="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-sm text-blue-700">{loadingProgress}</span>
          </div>
        </div>
      {/if}
    </div>
    
    <!-- Footer -->
    <div class="flex justify-end gap-3 p-6 border-t">
      <button
        onclick={onClose}
        disabled={isLoading}
        class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors
               disabled:opacity-50 disabled:cursor-not-allowed"
      >
        取消
      </button>
      <button
        onclick={handleLoadModel}
        disabled={!selectedFile || isLoading}
        class="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors
               disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? '加载中...' : '加载模型'}
      </button>
    </div>
  </div>
</div>
