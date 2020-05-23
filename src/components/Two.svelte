<script>
export let msg;

import { globalValue } from '../store';
import Child from './Child.svelte';

let randos = [];

function setRando() {
	const rando = Math.round(Math.random() * 100);
	randos = [...randos, rando];
}

let rand = 0;

function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function executeDelay() {
	rand = delay(2000).then(v => Math.random());
}

// Simulate data obtained from the database/backend.
let data = {
	userId: 123456789,
	name: "Jack Doe Junior",
	email: "hello@potatorus.io"
}
</script>

<div class="page-header italic text-base md:text-xl">
	{msg.app.pagetwo.pageheader}
</div>
<br>

<div class="card">
	<div class="notes">
		<p><b>1. Proper way of setting new values to array/object. Randos counter: {randos.length}</b>
			<br>
			<cite>
				Remember! Svelte is reactive based on assignment. So if we have an array and push new items to the array, we won't get any actual changes in the DOM.
				'Cos we're just mutating the array and we're not actually assigning the variable.
				<br><br>
				So if you want the app to react to changes to an array or an object, best to use the spread syntax. i.e. '[...arr, newValue]'. This here does the same thing as an
				array push but also reassign the variable causing the app to react and update the DOM.
			</cite>
		</p>
		<div class="notes-content">
			<code>
				let randos = [];
				<br><br>
				[ Wrong way ]<br>
				function setRando() &lbrace;<br>
					&emsp;&emsp;const rando = Math.round(Math.random() * 100);<br>
					&emsp;&emsp;randos.push(rando);<br>
				&rbrace;
				<br><br>
				[ Correct way ]<br>
				function setRando() &lbrace;<br>
					&emsp;&emsp;const rando = Math.round(Math.random() * 100);<br>
					&emsp;&emsp;randos = [...randos, rando];<br>
				&rbrace;
			</code>
		</div>
		<br><button on:click={setRando}>Add to counter</button><br>
	</div>
</div>

<div class="card">
	<div class="notes">
		<p><b>2. Looping with Svelte by using the 'each' block.</b></p>
		<div class="notes-content">
			<code>
				-- Done in the html portion.<br>
				&lbrace;#each randos as val, idx&rbrace;<br>
					&emsp;&emsp;&lsaquo;li&rsaquo;No. &lbrace;idx + 1&rbrace;: value = &lbrace;val&rbrace;&lsaquo;/li&rsaquo;<br>
				&lbrace;/each&rbrace;<br>
			</code>
		</div>
		<br>
		<ul>
			{#each randos as val, idx}
				<li>No. {idx + 1}: value = {val}</li>
			{/each}
		</ul>
		<br><button on:click={setRando}>Add to counter</button><br>
	</div>
</div>

<div class="card">
	<div class="notes">
		<p>
			<b>3. Handle promises using the 'await' block.</b><br>
			<cite>Useful when performing HTTP requests.</cite>
		</p>
		<div class="notes-content">
			<code>
				-- Done in the script portion.<br>
				let rand = 0;<br>
				function delay(ms) &lbrace;<br>
					&emsp;&emsp;return new Promise(resolve => setTimeout(resolve, ms));<br>
				&rbrace;<br>
				function executeDelay() &lbrace;<br>
					&emsp;&emsp;rand = delay(2000).then(v => Math.random());<br>
				&rbrace;
				<br><br>
				-- Done in the html portion.<br>
				&lbrace;#await rand&rbrace;<br>
					&emsp;&emsp;&lsaquo;p&rsaquo;Thinking about it...&lsaquo;/p&rsaquo;<br>
				&lbrace;:then number&rbrace;<br>
					&emsp;&emsp;&lsaquo;p&rsaquo;Result: &lbrace;number&rbrace;&lsaquo;/p&rsaquo;<br>
				&lbrace;:catch error&rbrace;<br>
					&emsp;&emsp;&lsaquo;p&rsaquo;&lbrace;error.message&rbrace;&lsaquo;/p&rsaquo;<br>
				&lbrace;/await&rbrace;
			</code>
		</div>
		<br>
		{#await rand}
			<p>Thinking about it...</p>
		{:then number}
			<p>Result: {number}</p>
		{:catch error}
			<p>{error.message}</p>
		{/await}
		<br><button on:click={executeDelay}>Click</button><br>
	</div>
</div>

<div class="card">
	<div class="notes">
		<p>
			<b>4. Using svelte/store as a global variable handler.</b><br>
			<cite>
				Think 'public static String HELLO_WORLD = ...' kind of thing. This is useful when you have many components and each
				wanting to use that same variable.
			</cite>
			<br><br>
		</p>
		<p class="text-left text-xs">
			<b>Notes for svelte/store: </b><br>
			- You can use .set() to set a new value. <br>
			- Use .update() to get access to the current value and then compute a new value to be updated. <br>
				&emsp;&emsp;eg: globalValue.update(v => v + 1); <br>
			- If you just want to listen/view the value, just gotta .subscribe() to it. But REMEMBER, since this is an observable, you need to manage
				your subscriptions carefully (e.g. remember to delete them when component no longer in use). Otherwise, there will be memory leaks. <br>
			- To avoid memory leaks, use '$' to easily view/subscribe to the observable as Svelte has made it easier to manage them. <br>
				&emsp;&emsp;eg: &lbrace; $globalValue &rbrace; <br>
			- Data stored here is not persistent. Will be gone once page refreshes.
		</p>
		<br>
		<div class="notes-content">
			<code>
				-- Create a new store.js file in the 'src' folder and enter the following.<br>
				import &lbrace; writable &rbrace; from 'svelte/store';<br>
				export const globalValue = writable('This is the original stored value.');
				<br><br>
				-- Done in the script portion of a Svelte component.<br>
				import &lbrace; globalValue &rbrace; from '../store';
				<br><br>
				-- Done in the html portion of a Svelte component.<br>
				&lbrace; $globalValue &rbrace;
			</code>
		</div>
		<br>
		<b>Global variable value: </b>
		{ $globalValue }
		<br>
		<br><button on:click={() => globalValue.set(Math.round(Math.random() * 100))}>Set random number to global variable</button><br>
	</div>
</div>

<div class="card">
	<div class="notes">
		<p>
			<b>5. Passing objects from child component to the parent component using the Svelte spread syntax.</b>
			<br>
			<cite>
				Parent component here will be this page two component while child component will be Child.svelte.
			</cite>
		</p>
		<div class="notes-content">
			<code>
				-- Done in Child.svelte.<br>
				&lsaquo;script&rsaquo;<br>
					&emsp;&emsp;export let userId;<br>
					&emsp;&emsp;export let name;<br>
					&emsp;&emsp;export let email;<br>
				&lsaquo;/script&rsaquo;<br>
				&lsaquo;p&rsaquo;UserID: &lbrace;userId&rbrace;&lsaquo;/p&rsaquo;<br>
				&lsaquo;p&rsaquo;Name: &lbrace;name&rbrace;&lsaquo;/p&rsaquo;<br>
				&lsaquo;p&rsaquo;Email: &lbrace;email&rbrace;&lsaquo;/p&rsaquo;
				<br><br>
				-- Done in the script portion of the Parent component.<br>
				import Child from './Child.svelte';<br>
				// Simulate data retrieval from the backend/database etc. <br>
				let data = &lbrace;<br>
					&emsp;&emsp;userId: 123456789,<br>
					&emsp;&emsp;name: "Jack Doe Junior",<br>
					&emsp;&emsp;email: "hello@potatorus.io"<br>
				&rbrace;
				<br><br>
				-- Done in the html portion of the Parent component.<br>
				&lsaquo;Child &lbrace;...data&rbrace; /&rsaquo;
			</code>
		</div>
		<br>
		<Child {...data} />
	</div>
</div>