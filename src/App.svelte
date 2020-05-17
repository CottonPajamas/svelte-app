<!-- Just some notes: -->
<!-- 
	- For Svelte, the focus of our work shoudl be on the src folder only.
	- As the public folder is where the static and built files will be stored at.
	- App.svelte is our root component.
 -->
 
<script>
	import router, { curRoute } from './routes/router.js';
	import RouterLink from './routes/RouterLink.svelte';
	
	function handlerBackNavigation(event){
		if (!event || !event.state || !event.state.path) {
			curRoute.set('/')		// If null, go back to main page.
		} else {
			curRoute.set(event.state.path)
		}
	}

	// Using the 'export' keyword allows a variable to be passed down from the parent component. Here the parent is main.js where we specify the property 'name' = 'world'.
	export let name;
</script>

	<svelte:window on:popstate={handlerBackNavigation} />


<main>
	<h1>Hello {name}!</h1>
	<div>
		<RouterLink page={{path: '/', name: 'Home'}} />&emsp;&emsp;|&emsp;&emsp;
		<RouterLink page={{path: '/one', name: 'Page One'}} />&emsp;&emsp;|&emsp;&emsp;
		<RouterLink page={{path: '/two', name: 'Page Two'}} />&emsp;&emsp;|&emsp;&emsp;
		<RouterLink page={{path: '/three', name: 'Page Three'}} />
	</div>
	<div id="pageContent">
		<!-- Page component updates here -->
		<svelte:component this={router[$curRoute]} />
	</div>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>