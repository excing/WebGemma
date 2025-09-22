<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href='/favicon.svg' />
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />

	<!-- Preload critical resources -->
	<link rel="preconnect" href="https://cdn.jsdelivr.net" />
	<link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />

	<!-- PWA manifest -->
	<!-- <link rel="manifest" href="/manifest.json" /> -->

	<!-- Apple touch icon -->
	<link rel="apple-touch-icon" href='/favicon.svg' />
</svelte:head>

{@render children?.()}
