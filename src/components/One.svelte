<script>
	// These are directives that allows you to compute css animations based on the logic in your page.
	import { fade, slide, blur, fly } from 'svelte/transition';

	// If we don't specify the 'export' keyword, we will have a private variable within this component. (Think export=public in Java and no export = private.)
	let rando = 0;

	// Here we are defining the computed value using '$'. This will tell Svelte to calculate this value when this app reacts. Result stored here would be a string containing the emoji.
	$: result = Math.round(rando) ? '🤗' : '👻';

	function setRando() {			// Create a function to randomly populate our private variable.
		rando = Math.random();
	}

	function setRandoVal(val) {
		rando = val;
	}

	function genRandom(min, max) {
		return Math.random()*(max-min)+min;
	}
</script>

<div class="text-orange-700 italic text-base md:text-xl">
	Some basic stuff on how to use Svelte :D
</div>
<br>

<div class="card">
	<div class="container">
		<p><b>1. Just outputting a simple private variable: {rando}</b></p>
		<div class="notes">
			<code>
				-- Done in the script portion.<br>
				let rando = 0;
				<br><br>-- Done in the html portion.<br>
				Just outputting a simple private variable: &lbrace; rando &rbrace;
			</code>
		</div>
		<!-- Add button to invoke an event that will change our 'rando' value. -->
		<br><button on:click={setRando}>Randomize me!</button><br>
	</div>
</div>

<div class="card">
	<div class="container">
		<p>
			<b>2. Adding logic to our random output: {Math.round(rando) ? '🤗' : '👻'}</b>
			<br>
			<cite>If it rounds to 1 its a winner, if it rounds to 0 its a loser.</cite>
		</p>
		<div class="notes">
			<code>
				Adding logic to our random output: &lbrace; Math.round(rando) ? '🤗' : '👻' &rbrace;
			</code>
		</div>
		<br><button on:click={setRando}>Randomize me!</button><br>
	</div>
</div>

<div class="card">
	<div class="container">
		<p>
			<b>3. Simplifying code reuse: {result} | {result} | {result} | {result}</b>
			<br>
			<cite>
				Unfortunately, the above code in 2 is not going to scale very well. If you want to show that same value somewhere else in the page,
				you will have to duplicate the logic everywhere. i.e.
				<br>
				&lsaquo;p&rsaquo;Adding logic to our random output: &lbrace; Math.round(rando) ? '🤗' : '👻' &rbrace;&lsaquo;/p&rsaquo;
				<br>
				&lsaquo;p&rsaquo;Adding logic to our random output: &lbrace; Math.round(rando) ? '🤗' : '👻' &rbrace;&lsaquo;/p&rsaquo;
				<br><br>
				Best way for such situations would be to define the computed value using '$'. This will tell Svelte to calculate this value when the value 'rando' changes.
			</cite>
		</p>
		<div class="notes">
			<code>
				-- Done in the script portion, just once.<br>
				$: result = Math.round(rando) ? '🤗' : '👻';
				<br><br>-- Done in the html portion.<br>
				&lsaquo;p&rsaquo;&lbrace; result &rbrace;&lsaquo;/p&rsaquo;<br>
				&lsaquo;p&rsaquo;&lbrace; result &rbrace;&lsaquo;/p&rsaquo;<br>
				&lsaquo;p&rsaquo;&lbrace; result &rbrace;&lsaquo;/p&rsaquo;
			</code>
		</div>
		<br><button on:click={setRando}>Randomize me!</button><br>
	</div>
</div>

<div class="card">
	<div class="container">
		<p>
			<b>4. Binding attributes to DOM elements: {Math.round(rando) ? '🤗' : '👻'}</b>
			<br>
			<cite>
				For instance, we want to bind the 'rando' variable to the value of a form input, we can do it like so.
				This will directly change the value of the variable whenever the value of the given input box changes.
			</cite>
		</p>
		<div class="notes">
			<code>
				&lsaquo;input bind:value=&lbrace; rando &rbrace;&rsaquo;
			</code>
		</div>
		<br><input bind:value={rando} size="10"><br>
	</div>
</div>

<div class="card">
	<div class="container">
		<p>
			<b>5. Advance on:event directive: {Math.round(rando) ? '🤗' : '👻'}</b>
			<br>
			<cite>
				We can set value directly to a variable using the on:event directive by forwarding DOM events. Here we are randomly
				generating a number between the min and max values specified in the function parameters and setting it to the 'rando' variable.
			</cite>
		</p>
		<div class="notes">
			<code>
				&lsaquo;button on:click=&lbrace;() => setVal(genRandom(0.51, 0.74))&rbrace;&rsaquo;Btw 0.76 to 1&lsaquo;/button&rsaquo;
			</code>
		</div>
		<br>
		<!-- We can set value directly to a variable from an on:event directive. -->
		<button on:click={() => setRandoVal(genRandom(0.76, 1))}>Btw 0.76 to 1</button>&emsp;&emsp;
		<button on:click={() => setRandoVal(genRandom(0.50, 0.75))}>Btw 0.50 to 0.75</button>&emsp;&emsp;
		<button on:click={() => setRandoVal(genRandom(0.25, 0.49))}>Btw 0.25 to 0.49</button>&emsp;&emsp;
		<button on:click={() => setRandoVal(genRandom(0, 0.24))}>Btw 0 to 0.24</button>&emsp;&emsp;
		<br>
	</div>
</div>

<div class="card">
	<div class="container">
		<p>
			<b>6. Dynamically changing page template using if-else if-else syntax.</b>
			<br>
			<cite>
				Think JSP Standard Tag Library (JSTL) but for Svelte.
			</cite>
		</p>
		<div class="notes">
			<code>
				&lbrace;#if rando &rsaquo; 0.75&rbrace;<br>
					&emsp;&emsp;&lsaquo;p&rsaquo;Value is more than 0.75.&lsaquo;/p&rsaquo;<br>
				&lbrace;:else if rando &rsaquo;= 0.5&rbrace;<br>
					&emsp;&emsp;&lsaquo;p&rsaquo;Value ranges from 0.50 to 0.75.&lsaquo;/p&rsaquo;<br>
				&lbrace;:else if rando &rsaquo;= 0.25&rbrace;<br>
					&emsp;&emsp;&lsaquo;p&rsaquo;Value ranges from 0.25 to 0.49.&lsaquo;/p&rsaquo;<br>
				&lbrace;:else&rbrace;<br>
					&emsp;&emsp;&lsaquo;p&rsaquo;Value is less than 0.25.&lsaquo;/p&rsaquo;<br>
				&lbrace;/if&rbrace;
			</code>
		</div>
		<br>
		{#if rando > 0.75}
			<p>Value is more than 0.75.</p>
		{:else if rando >= 0.5}
			<p>Value ranges from 0.50 to 0.75.</p>
		{:else if rando >= 0.25}
			<p>Value ranges from 0.25 to 0.49.</p>
		{:else}
			<p>Value is less than 0.25.</p>
		{/if}
		<br><input bind:value={rando} size="10"><br>
	</div>
</div>

<div class="card">
	<div class="container">
		<p>
			<b>7. Using Svelte's transition directives</b>
			<br>
			<cite>
				These are directives that allows you to compute css animations based on the logic in your page.
			</cite>
		</p>
		<div class="notes">
			<code>
				-- Done in the script portion. Will need to import the transition library.<br>
				import &lbrace; fade, fly &rbrace; from 'svelte/transition';
				<br><br>-- Done in the html portion.<br>
				&lbrace;#if rando &rsaquo; 0.75&rbrace;<br>
					&emsp;&emsp;&lsaquo;p <br>
						&emsp;&emsp;&emsp;&emsp;in:fade=&lbrace;&lbrace; delay: 200, duration:4000 &rbrace;&rbrace;<br>
						&emsp;&emsp;&emsp;&emsp;out:fade=&lbrace;&lbrace; delay: 200, duration:4000 &rbrace;&rbrace;<br>
					&emsp;&emsp;&rsaquo;Fading&lsaquo;/p&rsaquo;<br>
				&lbrace;:else if rando &rsaquo;= 0.5&rbrace;<br>
					&emsp;&emsp;&lsaquo;p <br>
						&emsp;&emsp;&emsp;&emsp;in:slide=&lbrace;&lbrace; delay: 200, duration:4000 &rbrace;&rbrace;<br>
						&emsp;&emsp;&emsp;&emsp;out:slide=&lbrace;&lbrace; delay: 200, duration:4000 &rbrace;&rbrace;<br>
					&emsp;&emsp;&rsaquo;Sliding&lsaquo;/p&rsaquo;<br>
				&lbrace;:else if rando &rsaquo;= 0.25&rbrace;<br>
					&emsp;&emsp;&lsaquo;p <br>
						&emsp;&emsp;&emsp;&emsp;in:blur=&lbrace;&lbrace; delay: 200, duration:4000 &rbrace;&rbrace;<br>
						&emsp;&emsp;&emsp;&emsp;out:blur=&lbrace;&lbrace; delay: 200, duration:4000 &rbrace;&rbrace;<br>
					&emsp;&emsp;&rsaquo;Bluring&lsaquo;/p&rsaquo;<br>
				&lbrace;:else&rbrace;<br>
					&emsp;&emsp;&lsaquo;p <br>
						&emsp;&emsp;&emsp;&emsp;in:fly=&lbrace;&lbrace; delay: 200, x: 500, duration:4000 &rbrace;&rbrace;<br>
						&emsp;&emsp;&emsp;&emsp;out:fly=&lbrace;&lbrace; delay: 200, x: -250, duration:4000 &rbrace;&rbrace;<br>
					&emsp;&emsp;&rsaquo;Flying&lsaquo;/p&rsaquo;<br>
				&lbrace;/if&rbrace;<br>
			</code>
		</div>
		<br>
		<button on:click={() => setRandoVal(genRandom(0.76, 1))}>Fade</button>&emsp;&emsp;
		<button on:click={() => setRandoVal(genRandom(0.51, 0.74))}>Slide</button>&emsp;&emsp;
		<button on:click={() => setRandoVal(genRandom(0.26, 0.49))}>Blur</button>&emsp;&emsp;
		<button on:click={() => setRandoVal(genRandom(0, 0.24))}>Fly</button>&emsp;&emsp;
		<br>
		{#if rando > 0.75}
			<p 
				in:fade={{ delay: 200, duration:4000 }}
				out:fade={{ delay: 200, duration:300 }}
			>Fading</p>
		{:else if rando >= 0.5}
			<p 
				in:slide={{ delay: 200, duration:4000 }}
				out:slide={{ delay: 200, duration:300 }}
			>Sliding</p>
		{:else if rando >= 0.25}
			<p 
				in:blur={{ delay: 200, duration:4000 }}
				out:blur={{ delay: 200, duration:300 }}
			>Bluring</p>
		{:else}
			<p 
				in:fly={{ delay: 200, x: 500, duration:4000 }}
				out:fly={{ delay: 200, x: -250, duration:300 }}
			>Flying</p>
		{/if}
		<br>
	</div>
</div>



	<!-- Add button to invoke an event that will change our 'rando' value. -->
	<button on:click={setRando}>Randomize me!</button>
	<br><br><button disabled>Unclickable!</button>


<style>
	/* 
		Any custom css written here will only be accessible from this component only.
		To allow sharing of custom css, add inside the global css instead.
	*/
</style>