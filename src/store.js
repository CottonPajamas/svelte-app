import { writable } from 'svelte/store';

// Here we are setting a variable to the store and referencing it to globalValue attribute.
// We need to export so that it will be accessible by any other components (provided they import 'store.js').
// NOTE: It needs to be CONSTANT!!! Remember the constant thing here is the object. NOT THE VALUE that the object is holding/storing.
export const globalValue = writable('This is the original stored value.');

// Note:
// - You can use .set() to set a new value.
// - Use .update() to get access to the current value and then compute a new value to be updated.
//    eg: globalValue.update(v => v + 1);
// - If you just want to listen/view the value, just gotta .subscribe() to it. But REMEMBER, since this is an observable, you need to manage
//    your subscriptions carefully (e.g. remember to delete them when component no longer in use). Otherwise, there will be memory leaks.
// - To avoid memory leaks, use '$' to easily view/subscribe to the observable as Svelte has made it easier to manage observables.
//    eg: { $globalValue }