<script>
let storageObjectName = 'TEST_TOKEN';

// Testing localStorage object
function setToLocalStorage() {
  var tmp = document.getElementById("localIpt").value;
  if (tmp) {
    window.localStorage.setItem(storageObjectName, tmp);
    document.getElementById("localIpt").value = '';
    localStorageValue = getFromLocalStorage();
  }
}

function getFromLocalStorage() {
  var tmp = window.localStorage.getItem(storageObjectName);
  if (tmp) {
    return tmp;
  }
}

let localStorageValue = getFromLocalStorage();

// Testing sessionStorage object
function setToSessionStorage() {
  var tmp = document.getElementById("sessoionIpt").value;
  if (tmp) {
    window.sessionStorage.setItem(storageObjectName, tmp);
    document.getElementById("sessoionIpt").value = '';
    sessionStorageValue = getFromSessionStorage();
  }
}

function getFromSessionStorage() {
  var tmp = window.sessionStorage.getItem(storageObjectName);
  if (tmp) {
    return tmp;
  }
}

let sessionStorageValue = getFromSessionStorage();
</script>

<div class="page-header italic text-base md:text-xl">
  Playing with HTML Web Storage API
</div>
<br>

<div class="card">
	<div class="notes">
		<p><b>1. Checking if HTML Web Storage API can be used.</b></p>
    <cite>
      Note: Before using the HTML web storage API, best practice would be to check if the given browser supports it. If its not supported, a warning/disclaimer should be shown.
    </cite>
		<div class="notes-content">
			<code>
        -- Two types of web storage objects that can be used <br>
        window.localStorage <br>
        window.sessionStorage <br>
        <br>
				if (typeof(&lsaquo;&lsaquo;storage type&rsaquo;&rsaquo;) !== "undefined") &lbrace; <br>
          &emsp;&emsp;// Code for localStorage/sessionStorage. <br>
        &rbrace; else &lbrace; <br>
          &emsp;&emsp;// Sorry! No Web Storage support.. <br>
        &rbrace;
			</code>
		</div>
	</div>
</div>

<div class="card">
	<div class="notes">
		<p>
			<b>2. Using localStorage API.</b>
			<br>
			<cite>
				The localStorage object stores the data with no expiration date. The data will not be deleted when the browser is closed, and will be available the next day, week, or year.
			</cite>
		</p>
		<div class="notes-content">
			<code>
				-- Done in the script portion.<br>
        let storageObjectName = 'TEST_TOKEN';<br>
        let localStorageValue = getFromLocalStorage();<br>

        function setToLocalStorage() &lbrace;<br>
          &emsp;&emsp;var tmp = document.getElementById("localIpt").value;<br>
          &emsp;&emsp;if (tmp) &lbrace;<br>
            &emsp;&emsp;&emsp;&emsp;window.localStorage.setItem(storageObjectName, tmp);<br>
            &emsp;&emsp;&emsp;&emsp;document.getElementById("localIpt").value = '';<br>
            &emsp;&emsp;&emsp;&emsp;localStorageValue = getFromLocalStorage();<br>
          &emsp;&emsp;&rbrace;<br>
        &rbrace;<br>

        function getFromLocalStorage() &lbrace;<br>
          &emsp;&emsp;var tmp = window.localStorage.getItem(storageObjectName);<br>
          &emsp;&emsp;if (tmp) &lbrace;<br>
            &emsp;&emsp;&emsp;&emsp;return tmp;<br>
          &emsp;&emsp;&rbrace;<br>
        &rbrace;<br><br>
        -- Done in the html portion.<br>
        &lsaquo;input id="localIpt" size="20" /&rsaquo;<br>
        &lsaquo;button on:click=&lbrace;setToLocalStorage&rbrace;&rsaquo;Add to local storage&lsaquo;/button&rsaquo;
			</code>
		</div>
		<br>
    <p>Stored value: {localStorageValue}</p>
    <br>
    <input id="localIpt" size="20" />
    <button on:click={setToLocalStorage}>Add to local storage</button>
    <br>
	</div>
</div>

<div class="card">
	<div class="notes">
		<p>
			<b>3. Using sessionStorage API.</b>
			<br>
			<cite>
				The sessionStorage object is equal to the localStorage object, except that it stores the data for only one session. The data is deleted when the user closes the specific browser tab.
        This does not get deleted however when the page refreshes.
			</cite>
		</p>
		<div class="notes-content">
			<code>
				-- Done in the script portion.<br>
        let storageObjectName = 'TEST_TOKEN';<br>
        let sessionStorageValue = getFromSessionStorage();<br>

        function setToSessionStorage() &lbrace;<br>
          &emsp;&emsp;var tmp = document.getElementById("sessoionIpt").value;<br>
          &emsp;&emsp;if (tmp) &lbrace;<br>
            &emsp;&emsp;&emsp;&emsp;window.sessionStorage.setItem(storageObjectName, tmp);<br>
            &emsp;&emsp;&emsp;&emsp;document.getElementById("sessoionIpt").value = '';<br>
            &emsp;&emsp;&emsp;&emsp;sessionStorageValue = getFromSessionStorage();<br>
          &emsp;&emsp;&rbrace;<br>
        &rbrace;<br>

        function getFromSessionStorage() &lbrace;<br>
          &emsp;&emsp;var tmp = window.sessionStorage.getItem(storageObjectName);<br>
          &emsp;&emsp;if (tmp) &lbrace;<br>
            &emsp;&emsp;&emsp;&emsp;return tmp;<br>
          &emsp;&emsp;&rbrace;<br>
        &rbrace;<br><br>
        -- Done in the html portion.<br>
        &lsaquo;input id="sessoionIpt" size="20" /&rsaquo;<br>
        &lsaquo;button on:click=&lbrace;setToLocalStorage&rbrace;&rsaquo;Add to local storage&lsaquo;/button&rsaquo;
			</code>
		</div>
		<br>
    <p>Stored value: {sessionStorageValue}</p>
    <br>
    <input id="sessoionIpt" size="20" />
    <button on:click={setToSessionStorage}>Add to session storage</button>
    <br>
	</div>
</div>