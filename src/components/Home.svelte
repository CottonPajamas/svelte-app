<script>
  // Custom logic used for switching between light and dark mode
  function toggleTheme() {
    var checkbox = document.querySelector("input[name=theme]");
    var currentTheme = document.documentElement.getAttribute("data-theme");
    if (currentTheme == undefined || currentTheme == null || currentTheme == 'light') {
      trans();
      document.documentElement.setAttribute("data-theme", "dark");
      checkbox.checked = true;
    } else {
      trans();
      document.documentElement.setAttribute("data-theme", "light");
      checkbox.checked = false;
    }
  }

  // Adds a little delay when performing a theme transition
  let trans = () => {
    document.documentElement.classList.add("transition");
    window.setTimeout(() => {
      document.documentElement.classList.remove("transition");
    }, 1000);
  };
</script>

<h2 class="text-orange-600 text-xl md:text-4xl italic">This is the home page.</h2>

<div class="text-container absolute m-8 p-8 md:m-20 md:p-20" >
  <h1>Light / Dark Mode</h1>
  <div>
    {#if document.documentElement.getAttribute("data-theme") == 'dark'}
      <input hidden type="checkbox" checked id="switch" name="theme" on:click={toggleTheme}/>
    {:else}
      <input hidden type="checkbox" id="switch" name="theme" on:click={toggleTheme}/>
    {/if}
    <label for="switch">Toggle</label>
	</div>
  <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos ducimus repellendus dolorem eum consequatur id exercitationem nesciunt, inventore modi perferendis impedit esse, tempora officia, ipsam quae libero. Nostrum, alias dignissimos.</p>
</div>