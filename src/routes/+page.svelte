<script lang="ts">
    import ChatInterface from '$lib/components/ChatInterface.svelte';
    import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
</script>

<svelte:head>
    <title>Gemma AI 助手 - 本地离线 AI 对话</title>
    <meta name="description" content="使用 Google Gemma 模型的本地离线 AI 对话应用，支持文本、图片和音频输入。" />
    <meta name="keywords" content="AI, Gemma, 本地, 离线, 对话, 聊天, 多模态" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Open Graph -->
    <meta property="og:title" content="Gemma AI 助手" />
    <meta property="og:description" content="本地离线 AI 对话应用" />
    <meta property="og:type" content="website" />

    <!-- PWA -->
    <meta name="theme-color" content="#3B82F6" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
</svelte:head>

<ErrorBoundary>
    <ChatInterface />
</ErrorBoundary>
