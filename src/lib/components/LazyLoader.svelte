<script lang="ts">
  import { onMount } from 'svelte';
  
  interface Props {
    children: any;
    threshold?: number;
    rootMargin?: string;
    fallback?: any;
  }
  
  let { 
    children, 
    threshold = 0.1, 
    rootMargin = '50px',
    fallback 
  }: Props = $props();
  
  let container: HTMLDivElement;
  let isVisible = $state(false);
  let observer: IntersectionObserver;
  
  onMount(() => {
    if (!container) return;
    
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            isVisible = true;
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );
    
    observer.observe(container);
    
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  });
</script>

<div bind:this={container}>
  {#if isVisible}
    {@render children()}
  {:else if fallback}
    {@render fallback()}
  {:else}
    <div class="animate-pulse bg-gray-200 rounded h-20"></div>
  {/if}
</div>
