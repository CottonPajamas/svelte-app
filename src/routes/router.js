import Home from '../components/Home.svelte';
import One from '../components/One.svelte';
import Two from '../components/Two.svelte';
import Three from '../components/Three.svelte';
import { writable } from 'svelte/store';
// ^ svelte/store here, simplifies  the creation of an object with a subscribe method.
// This allows interested parties to be notified whenever the store value changes.
// Objects created using store acts as a single source of truth that any Svelte Component can subscribe to, access(view) or even update it.

// The constant router variable here will act as an index for the available routes in our app.
const router = {
  '/': Home,
  '/one': One,
  '/two': Two,
  '/three': Three
}

// We then export the router index variable so it can be used in App.svelte.
export default router;

// Do not get confused! The const here is referring to the curRoute object created from the writable function.
// So the object is a constant. But the value that contains it i.e. '/' or 'one' or etc.. can be changed.
// To see how the value is being set after initialization, refer to RouterLink.svelte.
export const curRoute = writable('/');
// This is to capture and set a constant variable containing the primary/main URL for the applicaton.
// Used for updating the history in RouterLink.svelte, such that the URL path will always be the same as the landing URL.
export const originalPath = window.location.href;
console.log(originalPath);