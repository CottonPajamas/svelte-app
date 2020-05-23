<!-- Just some notes: -->
<!-- 
	- For Svelte, the focus of our work shoudl be on the src folder only.
	- As the public folder is where the static and built files will be stored at.
	- App.svelte is our root component.
	- For running svelte in localhost: npm run dev
	- To build svelte project into production-ready static files: npm run build		(Then pick up all the files created in the public folder.)
	- 
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

<!-- Event handler to handle 'back' button events -->
<svelte:window on:popstate={handlerBackNavigation} />
<main class="text-center px-1 m-0">
	<h1 class="title-header uppercase font-hairline m-0 p-4 text-5xl md:text-6xl lg:text-6xl">Hello {name}!</h1>
	<div class="nav-header font-medium text-sm md:text-base lg:text-base pl-4 pr-4">
		<RouterLink page={{path: '/', name: 'Home'}} />&emsp;&emsp;|&emsp;&emsp;
		<RouterLink page={{path: '/one', name: 'Page One'}} />&emsp;&emsp;|&emsp;&emsp;
		<RouterLink page={{path: '/two', name: 'Page Two'}} />&emsp;&emsp;|&emsp;&emsp;
		<RouterLink page={{path: '/three', name: 'Page Three'}} />
	</div>
	<br>
	<div id="pageContent" class="container max-w-xs md:max-w-4xl">
		<!-- Page component updates here -->
		<svelte:component this={router[$curRoute]} />
	</div>
</main>

<style>
	/* main {
		text-align: center;
		padding: 1em;
		max-width: 80%;
		margin: 0 auto;
	} */

	/* h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	} */

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>