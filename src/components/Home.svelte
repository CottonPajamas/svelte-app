<script>
export let msg;
let localStorageThemeName = 'APP_THEME';
let localStorageLangName = 'APP_LANGUAGE';

// Custom logic used for switching between light and dark mode
function toggleTheme() {
  var checkbox = document.querySelector("input[name=theme]");
  var currentTheme = document.documentElement.getAttribute("data-theme");
  if (currentTheme == undefined || currentTheme == null || currentTheme == 'light') {
    trans();
    document.documentElement.setAttribute("data-theme", "dark");
    window.localStorage.setItem(localStorageThemeName, 'dark');
    checkbox.checked = true;
  } else {
    trans();
    document.documentElement.setAttribute("data-theme", "light");
    window.localStorage.setItem(localStorageThemeName, 'light');
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

// INVOKING A PARENT METHOD FROM THIS CHILD CLASS
import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher();

function dispatchToParent(lang) {
  dispatch('toggleLang', {
      name: localStorageLangName,
      value: lang
  });
}

function toggleLang() {
  var checkbox = document.querySelector("input[name=lang]");
  var currentLang = window.localStorage.getItem(localStorageLangName);
  if (currentLang == undefined || currentLang == null || currentLang == 'en') {
    trans();
    dispatchToParent('es');
    checkbox.checked = true;
  } else {
    trans();
    dispatchToParent('en');
    checkbox.checked = false;
  }
}
</script>

<h2 class="page-header text-xl md:text-4xl italic">{msg.app.homepage.pageheader}</h2>

<div class="text-container m-5 p-5 md:m-10 md:p-10" >
  <h1>Light / Dark Mode</h1>
  <div>
    {#if window.localStorage.getItem(localStorageThemeName) == 'dark'}
      <input hidden type="checkbox" checked id="themeSwitch" name="theme" on:click={toggleTheme}/>
    {:else if document.documentElement.getAttribute("data-theme") == 'dark'}
      <input hidden type="checkbox" checked id="themeSwitch" name="theme" on:click={toggleTheme}/>
    {:else}
      <input hidden type="checkbox" id="themeSwitch" name="theme" on:click={toggleTheme}/>
    {/if}
    <label for="themeSwitch">Toggle</label>
	</div>
  <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos ducimus repellendus dolorem eum consequatur id exercitationem nesciunt, inventore modi perferendis impedit esse, tempora officia, ipsam quae libero. Nostrum, alias dignissimos.</p>
</div>

<div class="text-container m-5 p-5 md:m-10 md:p-10" >
  <h1>English / Spanish</h1>
  <div>
    {#if window.localStorage.getItem(localStorageLangName) == 'es'}
      <input hidden type="checkbox" checked id="langSwitch" name="lang" on:click={toggleLang}/>
    {:else}
      <input hidden type="checkbox" id="langSwitch" name="lang" on:click={toggleLang}/>
    {/if}
    <label for="langSwitch">Toggle</label>
	</div>
  <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos ducimus repellendus dolorem eum consequatur id exercitationem nesciunt, inventore modi perferendis impedit esse, tempora officia, ipsam quae libero. Nostrum, alias dignissimos.</p>
</div>