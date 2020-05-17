<script>
import { curRoute, originalPath } from './router.js';
export let page = {path: '/', name: 'Home'}
// ^ Here we specify the variables to take into this component when being called in App.svelte.

function redirectTo(event) {  // Method for redirecting the page.
  // change current router path  
  curRoute.set(event.target.pathname);

  // push the path into web browser history API  
  // Note that 'page.path' contains where we were previously. But since we do not want any changes to URL directory
  // in the browser, we just put 'window.location.href' a.k.a. 'originalPath' as our third parameter.
  window.history.pushState({path: page.path}, '', originalPath);
}
</script>

<a href={page.path} on:click|preventDefault={redirectTo}>{page.name}</a>