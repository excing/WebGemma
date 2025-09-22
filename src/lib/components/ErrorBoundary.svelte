<script lang="ts">
  import { onMount } from 'svelte';
  
  interface Props {
    children: any;
    fallback?: any;
    onError?: (error: Error) => void;
  }
  
  let { children, fallback, onError }: Props = $props();
  
  let hasError = $state(false);
  let error = $state<Error | null>(null);
  
  function handleError(event: ErrorEvent) {
    hasError = true;
    error = new Error(event.message);
    
    if (onError) {
      onError(error);
    }
    
    console.error('Error caught by ErrorBoundary:', error);
  }
  
  function handleUnhandledRejection(event: PromiseRejectionEvent) {
    hasError = true;
    error = new Error(event.reason?.message || 'Unhandled promise rejection');
    
    if (onError) {
      onError(error);
    }
    
    console.error('Promise rejection caught by ErrorBoundary:', error);
  }
  
  function retry() {
    hasError = false;
    error = null;
  }
  
  onMount(() => {
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  });
</script>

{#if hasError}
  {#if fallback}
    {@render fallback({ error, retry })}
  {:else}
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
        </div>
        
        <h2 class="text-xl font-semibold text-gray-900 mb-2">出现了错误</h2>
        <p class="text-gray-600 mb-4">
          应用遇到了意外错误，请尝试刷新页面或重试。
        </p>
        
        {#if error}
          <details class="mb-4 text-left">
            <summary class="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              查看错误详情
            </summary>
            <pre class="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-700 overflow-auto">
              {error.message}
            </pre>
          </details>
        {/if}
        
        <div class="flex gap-3 justify-center">
          <button
            onclick={retry}
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            重试
          </button>
          <button
            onclick={() => window.location.reload()}
            class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            刷新页面
          </button>
        </div>
      </div>
    </div>
  {/if}
{:else}
  {@render children()}
{/if}
