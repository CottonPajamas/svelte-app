<script>
import { curRoute } from './router.js';
export let page = {path: '/home',name: 'Home'}
// ^ Here we specify the variables to take into this component when being called in App.svelte.

function redirectTo(event) {  // Method for redirecting the page.
  // change current router path  
  curRoute.set(event.target.pathname);

  // push the path into web browser history API  
  window.history.pushState({path: page.path}, '', window.location.origin + page.path);
}
</script>

<a href={page.path} on:click|preventDefault={redirectTo}>{page.name}</a>