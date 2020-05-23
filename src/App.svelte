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


// INTERNATIONALIZATION SUPPORT
import { message } from './messages.js';
let msg = message;

// You can pass text from the child component to be used by the parent component's method like so
function getMessage(event) {
	getMessageSupport(event.detail.name, event.detail.value);
}

function getMessageSupport(storageName, lang) {
	let request = new XMLHttpRequest();
	request.overrideMimeType("application/json");
	request.open('GET', '/i18n/messages_' + lang + '.json', true);
	request.onload = function() {
		if (request.responseText) {
			msg = JSON.parse(request.responseText);
			if (storageName) {	// only store if not null - if null ignore
				window.localStorage.setItem(storageName, lang);
			}
		}
		// console.log(msg);
		// console.log(msg.comments.actions.approve.all.success);
	};
	request.send();
}

// Alternative to onload event - USEFUL for Svelte cos everything is pre-compiled
// Here we gotta retrieve the language properties when the whole page loads
window.document.onreadystatechange = function () {
	if (document.readyState === 'complete') {
		var val = window.localStorage.getItem('APP_LANGUAGE');
		if (val) {
			getMessageSupport(null, val);
		}
	}
}
</script>

<!-- Event handler to handle 'back' button events -->
<svelte:window on:popstate={handlerBackNavigation} />
<main class="text-center px-1 m-0">
	<h1 class="title-header uppercase font-hairline m-0 p-4 text-5xl md:text-6xl lg:text-6xl">{msg.app.title + ' ' + name}!</h1>
	<div class="nav-header font-medium text-sm md:text-base lg:text-base pl-4 pr-4">
		<RouterLink page={{path: '/', name: msg.app.navbar.homepage}} />&emsp;&emsp;|&emsp;&emsp;
		<RouterLink page={{path: '/one', name: msg.app.navbar.pageone}} />&emsp;&emsp;|&emsp;&emsp;
		<RouterLink page={{path: '/two', name: msg.app.navbar.pagetwo}} />&emsp;&emsp;|&emsp;&emsp;
		<RouterLink page={{path: '/three', name: msg.app.navbar.pagethree}} />
	</div>
	<br>
	<div id="pageContent" class="container max-w-xs sm:max-w-2xl md:max-w-4xl">
		<!-- Page component updates here -->
		<svelte:component this={router[$curRoute]} {msg} on:toggleLang={getMessage}/>
		<!-- Note:
			THIS IS HOW YOU CALL A METHOD IN THE PARENT COMPONENT FROM CHILD COMPONENT.

			The 'on:toggleLang={getMessage}' part is only used by Home.svelte (child) when its triggering an event
			to change the application's overall langugage. The child components do not use it.
		 -->
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