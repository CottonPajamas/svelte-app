import App from './App.svelte';

// TODO: Transfer the logic for language retrieval to be done here
const app = new App({
	target: document.body,
	props: {
		name: 'svelte'
	}
});

export default app;