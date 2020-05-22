var app=function(){"use strict";function t(){}const n=t=>t;function e(t,n){for(const e in n)t[e]=n[e];return t}function o(t){return t()}function r(){return Object.create(null)}function a(t){t.forEach(o)}function i(t){return"function"==typeof t}function s(t,n){return t!=t?n==n:t!==n||t&&"object"==typeof t||"function"==typeof t}function l(n,e,o){n.$$.on_destroy.push(function(n,...e){if(null==n)return t;const o=n.subscribe(...e);return o.unsubscribe?()=>o.unsubscribe():o}(e,o))}const c="undefined"!=typeof window;let u=c?()=>window.performance.now():()=>Date.now(),d=c?t=>requestAnimationFrame(t):t;const b=new Set;function p(t){b.forEach(n=>{n.c(t)||(b.delete(n),n.f())}),0!==b.size&&d(p)}function f(t){let n;return 0===b.size&&d(p),{promise:new Promise(e=>{b.add(n={c:t,f:e})}),abort(){b.delete(n)}}}function h(t,n){t.appendChild(n)}function m(t,n,e){t.insertBefore(n,e||null)}function g(t){t.parentNode.removeChild(t)}function v(t){return document.createElement(t)}function y(t){return document.createTextNode(t)}function x(){return y(" ")}function $(t,n,e,o){return t.addEventListener(n,e,o),()=>t.removeEventListener(n,e,o)}function w(t,n,e){null==e?t.removeAttribute(n):t.getAttribute(n)!==e&&t.setAttribute(n,e)}function k(t,n){n=""+n,t.data!==n&&(t.data=n)}function C(t,n){(null!=n||t.value)&&(t.value=n)}const M=new Set;let T,_=0;function S(t,n,e,o,r,a,i,s=0){const l=16.666/o;let c="{\n";for(let t=0;t<=1;t+=l){const o=n+(e-n)*a(t);c+=100*t+`%{${i(o,1-o)}}\n`}const u=c+`100% {${i(e,1-e)}}\n}`,d=`__svelte_${function(t){let n=5381,e=t.length;for(;e--;)n=(n<<5)-n^t.charCodeAt(e);return n>>>0}(u)}_${s}`,b=t.ownerDocument;M.add(b);const p=b.__svelte_stylesheet||(b.__svelte_stylesheet=b.head.appendChild(v("style")).sheet),f=b.__svelte_rules||(b.__svelte_rules={});f[d]||(f[d]=!0,p.insertRule(`@keyframes ${d} ${u}`,p.cssRules.length));const h=t.style.animation||"";return t.style.animation=`${h?h+", ":""}${d} ${o}ms linear ${r}ms 1 both`,_+=1,d}function D(t,n){const e=(t.style.animation||"").split(", "),o=e.filter(n?t=>t.indexOf(n)<0:t=>-1===t.indexOf("__svelte")),r=e.length-o.length;r&&(t.style.animation=o.join(", "),_-=r,_||d(()=>{_||(M.forEach(t=>{const n=t.__svelte_stylesheet;let e=n.cssRules.length;for(;e--;)n.deleteRule(e);t.__svelte_rules={}}),M.clear())}))}function L(t){T=t}function H(){if(!T)throw new Error("Function called outside component initialization");return T}const E=[],R=[],B=[],F=[],P=Promise.resolve();let V=!1;function j(t){B.push(t)}let A=!1;const I=new Set;function O(){if(!A){A=!0;do{for(let t=0;t<E.length;t+=1){const n=E[t];L(n),z(n.$$)}for(E.length=0;R.length;)R.pop()();for(let t=0;t<B.length;t+=1){const n=B[t];I.has(n)||(I.add(n),n())}B.length=0}while(E.length);for(;F.length;)F.pop()();V=!1,A=!1,I.clear()}}function z(t){if(null!==t.fragment){t.update(),a(t.before_update);const n=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,n),t.after_update.forEach(j)}}let J;function N(){return J||(J=Promise.resolve(),J.then(()=>{J=null})),J}function U(t,n,e){t.dispatchEvent(function(t,n){const e=document.createEvent("CustomEvent");return e.initCustomEvent(t,!1,!1,n),e}(`${n?"intro":"outro"}${e}`))}const q=new Set;let W;function G(){W={r:0,c:[],p:W}}function Y(){W.r||a(W.c),W=W.p}function K(t,n){t&&t.i&&(q.delete(t),t.i(n))}function Q(t,n,e,o){if(t&&t.o){if(q.has(t))return;q.add(t),W.c.push(()=>{q.delete(t),o&&(e&&t.d(1),o())}),t.o(n)}}const X={duration:0};function Z(e,o,r){let a,s,l=o(e,r),c=!1,d=0;function b(){a&&D(e,a)}function p(){const{delay:o=0,duration:r=300,easing:i=n,tick:p=t,css:h}=l||X;h&&(a=S(e,0,1,r,o,i,h,d++)),p(0,1);const m=u()+o,g=m+r;s&&s.abort(),c=!0,j(()=>U(e,!0,"start")),s=f(t=>{if(c){if(t>=g)return p(1,0),U(e,!0,"end"),b(),c=!1;if(t>=m){const n=i((t-m)/r);p(n,1-n)}}return c})}let h=!1;return{start(){h||(D(e),i(l)?(l=l(),N().then(p)):p())},invalidate(){h=!1},end(){c&&(b(),c=!1)}}}function tt(e,o,r){let s,l=o(e,r),c=!0;const d=W;function b(){const{delay:o=0,duration:r=300,easing:i=n,tick:b=t,css:p}=l||X;p&&(s=S(e,1,0,r,o,i,p));const h=u()+o,m=h+r;j(()=>U(e,!1,"start")),f(t=>{if(c){if(t>=m)return b(0,1),U(e,!1,"end"),--d.r||a(d.c),!1;if(t>=h){const n=i((t-h)/r);b(1-n,n)}}return c})}return d.r+=1,i(l)?N().then(()=>{l=l(),b()}):b(),{end(t){t&&l.tick&&l.tick(1,0),c&&(s&&D(e,s),c=!1)}}}function nt(t,n){const e=n.token={};function o(t,o,r,a){if(n.token!==e)return;n.resolved=a;let i=n.ctx;void 0!==r&&(i=i.slice(),i[r]=a);const s=t&&(n.current=t)(i);let l=!1;n.block&&(n.blocks?n.blocks.forEach((t,e)=>{e!==o&&t&&(G(),Q(t,1,1,()=>{n.blocks[e]=null}),Y())}):n.block.d(1),s.c(),K(s,1),s.m(n.mount(),n.anchor),l=!0),n.block=s,n.blocks&&(n.blocks[o]=s),l&&O()}if((r=t)&&"object"==typeof r&&"function"==typeof r.then){const e=H();if(t.then(t=>{L(e),o(n.then,1,n.value,t),L(null)},t=>{L(e),o(n.catch,2,n.error,t),L(null)}),n.current!==n.pending)return o(n.pending,0),!0}else{if(n.current!==n.then)return o(n.then,1,n.value,t),!0;n.resolved=t}var r}function et(t){t&&t.c()}function ot(t,n,e){const{fragment:r,on_mount:s,on_destroy:l,after_update:c}=t.$$;r&&r.m(n,e),j(()=>{const n=s.map(o).filter(i);l?l.push(...n):a(n),t.$$.on_mount=[]}),c.forEach(j)}function rt(t,n){const e=t.$$;null!==e.fragment&&(a(e.on_destroy),e.fragment&&e.fragment.d(n),e.on_destroy=e.fragment=null,e.ctx=[])}function at(t,n){-1===t.$$.dirty[0]&&(E.push(t),V||(V=!0,P.then(O)),t.$$.dirty.fill(0)),t.$$.dirty[n/31|0]|=1<<n%31}function it(n,e,o,i,s,l,c=[-1]){const u=T;L(n);const d=e.props||{},b=n.$$={fragment:null,ctx:null,props:l,update:t,not_equal:s,bound:r(),on_mount:[],on_destroy:[],before_update:[],after_update:[],context:new Map(u?u.$$.context:[]),callbacks:r(),dirty:c};let p=!1;if(b.ctx=o?o(n,d,(t,e,...o)=>{const r=o.length?o[0]:e;return b.ctx&&s(b.ctx[t],b.ctx[t]=r)&&(b.bound[t]&&b.bound[t](r),p&&at(n,t)),e}):[],b.update(),p=!0,a(b.before_update),b.fragment=!!i&&i(b.ctx),e.target){if(e.hydrate){const t=function(t){return Array.from(t.childNodes)}(e.target);b.fragment&&b.fragment.l(t),t.forEach(g)}else b.fragment&&b.fragment.c();e.intro&&K(n.$$.fragment),ot(n,e.target,e.anchor),O()}L(u)}class st{$destroy(){rt(this,1),this.$destroy=t}$on(t,n){const e=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return e.push(n),()=>{const t=e.indexOf(n);-1!==t&&e.splice(t,1)}}$set(){}}function lt(n){let e;return{c(){e=v("h2"),e.textContent="This is the home page.",w(e,"class","text-orange-600 text-3xl italic")},m(t,n){m(t,e,n)},p:t,i:t,o:t,d(t){t&&g(e)}}}function ct(t){return t<.5?4*t*t*t:.5*Math.pow(2*t-2,3)+1}function ut(t){const n=t-1;return n*n*n+1}function dt(t,{delay:n=0,duration:e=400,easing:o=ct,amount:r=5,opacity:a=0}){const i=getComputedStyle(t),s=+i.opacity,l="none"===i.filter?"":i.filter,c=s*(1-a);return{delay:n,duration:e,easing:o,css:(t,n)=>`opacity: ${s-c*n}; filter: ${l} blur(${n*r}px);`}}function bt(t,{delay:e=0,duration:o=400,easing:r=n}){const a=+getComputedStyle(t).opacity;return{delay:e,duration:o,easing:r,css:t=>"opacity: "+t*a}}function pt(t,{delay:n=0,duration:e=400,easing:o=ut,x:r=0,y:a=0,opacity:i=0}){const s=getComputedStyle(t),l=+s.opacity,c="none"===s.transform?"":s.transform,u=l*(1-i);return{delay:n,duration:e,easing:o,css:(t,n)=>`\n\t\t\ttransform: ${c} translate(${(1-t)*r}px, ${(1-t)*a}px);\n\t\t\topacity: ${l-u*n}`}}function ft(t,{delay:n=0,duration:e=400,easing:o=ut}){const r=getComputedStyle(t),a=+r.opacity,i=parseFloat(r.height),s=parseFloat(r.paddingTop),l=parseFloat(r.paddingBottom),c=parseFloat(r.marginTop),u=parseFloat(r.marginBottom),d=parseFloat(r.borderTopWidth),b=parseFloat(r.borderBottomWidth);return{delay:n,duration:e,easing:o,css:t=>`overflow: hidden;opacity: ${Math.min(20*t,1)*a};height: ${t*i}px;padding-top: ${t*s}px;padding-bottom: ${t*l}px;margin-top: ${t*c}px;margin-bottom: ${t*u}px;border-top-width: ${t*d}px;border-bottom-width: ${t*b}px;`}}function ht(t){let n;return{c(){n=v("p"),n.textContent="Value is less than 0.25."},m(t,e){m(t,n,e)},d(t){t&&g(n)}}}function mt(t){let n;return{c(){n=v("p"),n.textContent="Value ranges from 0.25 to 0.49."},m(t,e){m(t,n,e)},d(t){t&&g(n)}}}function gt(t){let n;return{c(){n=v("p"),n.textContent="Value ranges from 0.50 to 0.75."},m(t,e){m(t,n,e)},d(t){t&&g(n)}}}function vt(t){let n;return{c(){n=v("p"),n.textContent="Value is more than 0.75."},m(t,e){m(t,n,e)},d(t){t&&g(n)}}}function yt(t){let n,e,o,r;return{c(){n=v("p"),n.textContent="Flying"},m(t,e){m(t,n,e),r=!0},i(t){r||(j(()=>{o&&o.end(1),e||(e=Z(n,pt,{delay:200,x:500,duration:4e3})),e.start()}),r=!0)},o(t){e&&e.invalidate(),o=tt(n,pt,{delay:200,x:-250,duration:300}),r=!1},d(t){t&&g(n),t&&o&&o.end()}}}function xt(t){let n,e,o,r;return{c(){n=v("p"),n.textContent="Bluring"},m(t,e){m(t,n,e),r=!0},i(t){r||(j(()=>{o&&o.end(1),e||(e=Z(n,dt,{delay:200,duration:4e3})),e.start()}),r=!0)},o(t){e&&e.invalidate(),o=tt(n,dt,{delay:200,duration:300}),r=!1},d(t){t&&g(n),t&&o&&o.end()}}}function $t(t){let n,e,o,r;return{c(){n=v("p"),n.textContent="Sliding"},m(t,e){m(t,n,e),r=!0},i(t){r||(j(()=>{o&&o.end(1),e||(e=Z(n,ft,{delay:200,duration:4e3})),e.start()}),r=!0)},o(t){e&&e.invalidate(),o=tt(n,ft,{delay:200,duration:300}),r=!1},d(t){t&&g(n),t&&o&&o.end()}}}function wt(t){let n,e,o,r;return{c(){n=v("p"),n.textContent="Fading"},m(t,e){m(t,n,e),r=!0},i(t){r||(j(()=>{o&&o.end(1),e||(e=Z(n,bt,{delay:200,duration:4e3})),e.start()}),r=!0)},o(t){e&&e.invalidate(),o=tt(n,bt,{delay:200,duration:300}),r=!1},d(t){t&&g(n),t&&o&&o.end()}}}function kt(t){let n,e,o,r,i,s,l,c,u,d,b,p,f,M,T,_,S,D,L,H,E,R,B,F,P,V,j,A,I,O,z,J,N,U,q,W,X,Z,tt,nt,et,ot,rt,at,it,st,lt,ct,ut,dt,bt,pt,ft,kt,Ct,Mt,Tt,_t,St,Dt,Lt,Ht,Et,Rt,Bt,Ft,Pt,Vt,jt,At,It,Ot,zt,Jt,Nt,Ut,qt,Wt,Gt,Yt,Kt,Qt,Xt,Zt,tn,nn,en,on,rn,an,sn,ln,cn,un,dn,bn,pn,fn,hn,mn,gn,vn,yn,xn,$n,wn,kn,Cn,Mn,Tn,_n,Sn,Dn,Ln,Hn,En,Rn,Bn,Fn,Pn,Vn,jn,An,In,On,zn,Jn,Nn,Un,qn,Wn,Gn,Yn,Kn,Qn,Xn,Zn,te,ne,ee,oe,re,ae=Math.round(t[0])?"🤗":"👻",ie=Math.round(t[0])?"🤗":"👻",se=Math.round(t[0])?"🤗":"👻";function le(t,n){return t[0]>.75?vt:t[0]>=.5?gt:t[0]>=.25?mt:ht}let ce=le(t),ue=ce(t);const de=[wt,$t,xt,yt],be=[];function pe(t,n){return t[0]>.75?0:t[0]>=.5?1:t[0]>=.25?2:3}return Wn=pe(t),Gn=be[Wn]=de[Wn](t),{c(){n=v("div"),n.textContent="Some basic stuff on how to use Svelte :D",e=x(),o=v("br"),r=x(),i=v("div"),s=v("div"),l=v("p"),c=v("b"),u=y("1. Just outputting a simple private variable: "),d=y(t[0]),b=x(),p=v("div"),p.innerHTML="<code>\n\t\t\t\t-- Done in the script portion.<br>\n\t\t\t\tlet rando = 0;\n\t\t\t\t<br><br>-- Done in the html portion.<br>\n\t\t\t\tJust outputting a simple private variable: { rando }\n\t\t\t</code>",f=x(),M=v("br"),T=v("button"),T.textContent="Randomize me!",_=v("br"),S=x(),D=v("div"),L=v("div"),H=v("p"),E=v("b"),R=y("2. Adding logic to our random output: "),B=y(ae),F=x(),P=v("br"),V=x(),j=v("cite"),j.textContent="If it rounds to 1 its a winner, if it rounds to 0 its a loser.",A=x(),I=v("div"),I.innerHTML="<code>\n\t\t\t\tAdding logic to our random output: { Math.round(rando) ? &#39;🤗&#39; : &#39;👻&#39; }\n\t\t\t</code>",O=x(),z=v("br"),J=v("button"),J.textContent="Randomize me!",N=v("br"),U=x(),q=v("div"),W=v("div"),X=v("p"),Z=v("b"),tt=y("3. Simplifying code reuse: "),nt=y(t[1]),et=y(" | "),ot=y(t[1]),rt=y(" | "),at=y(t[1]),it=y(" | "),st=y(t[1]),lt=x(),ct=v("br"),ut=x(),dt=v("cite"),dt.innerHTML="\n\t\t\t\tUnfortunately, the above code in 2 is not going to scale very well. If you want to show that same value somewhere else in the page,\n\t\t\t\tyou will have to duplicate the logic everywhere. i.e.\n\t\t\t\t<br>\n\t\t\t\t‹p›Adding logic to our random output: { Math.round(rando) ? &#39;🤗&#39; : &#39;👻&#39; }‹/p›\n\t\t\t\t<br>\n\t\t\t\t‹p›Adding logic to our random output: { Math.round(rando) ? &#39;🤗&#39; : &#39;👻&#39; }‹/p›\n\t\t\t\t<br><br>\n\t\t\t\tBest way for such situations would be to define the computed value using &#39;$&#39;. This will tell Svelte to calculate this value when the value &#39;rando&#39; changes.\n\t\t\t",bt=x(),pt=v("div"),pt.innerHTML="<code>\n\t\t\t\t-- Done in the script portion, just once.<br>\n\t\t\t\t$: result = Math.round(rando) ? &#39;🤗&#39; : &#39;👻&#39;;\n\t\t\t\t<br><br>-- Done in the html portion.<br>\n\t\t\t\t‹p›{ result }‹/p›<br>\n\t\t\t\t‹p›{ result }‹/p›<br>\n\t\t\t\t‹p›{ result }‹/p›\n\t\t\t</code>",ft=x(),kt=v("br"),Ct=v("button"),Ct.textContent="Randomize me!",Mt=v("br"),Tt=x(),_t=v("div"),St=v("div"),Dt=v("p"),Lt=v("b"),Ht=y("4. Binding attributes to DOM elements: "),Et=y(ie),Rt=x(),Bt=v("br"),Ft=x(),Pt=v("cite"),Pt.textContent="For instance, we want to bind the 'rando' variable to the value of a form input, we can do it like so.\n\t\t\t\tThis will directly change the value of the variable whenever the value of the given input box changes.",Vt=x(),jt=v("div"),jt.innerHTML="<code>\n\t\t\t\t‹input bind:value={ rando }›\n\t\t\t</code>",At=x(),It=v("br"),Ot=v("input"),zt=v("br"),Jt=x(),Nt=v("div"),Ut=v("div"),qt=v("p"),Wt=v("b"),Gt=y("5. Advance on:event directive: "),Yt=y(se),Kt=x(),Qt=v("br"),Xt=x(),Zt=v("cite"),Zt.textContent="We can set value directly to a variable using the on:event directive by forwarding DOM events. Here we are randomly\n\t\t\t\tgenerating a number between the min and max values specified in the function parameters and setting it to the 'rando' variable.",tn=x(),nn=v("div"),nn.innerHTML="<code>\n\t\t\t\t‹button on:click={() =&gt; setVal(genRandom(0.51, 0.74))}›Btw 0.76 to 1‹/button›\n\t\t\t</code>",en=x(),on=v("br"),rn=x(),an=v("button"),an.textContent="Btw 0.76 to 1",sn=x(),ln=v("button"),ln.textContent="Btw 0.50 to 0.75",cn=x(),un=v("button"),un.textContent="Btw 0.25 to 0.49",dn=x(),bn=v("button"),bn.textContent="Btw 0 to 0.24",pn=x(),fn=v("br"),hn=x(),mn=v("div"),gn=v("div"),vn=v("p"),vn.innerHTML="<b>6. Dynamically changing page template using if-else if-else syntax.</b> \n\t\t\t<br> \n\t\t\t<cite>\n\t\t\t\tThink JSP Standard Tag Library (JSTL) but for Svelte.\n\t\t\t</cite>",yn=x(),xn=v("div"),xn.innerHTML="<code>\n\t\t\t\t{#if rando › 0.75}<br>\n\t\t\t\t\t  ‹p›Value is more than 0.75.‹/p›<br>\n\t\t\t\t{:else if rando ›= 0.5}<br>\n\t\t\t\t\t  ‹p›Value ranges from 0.50 to 0.75.‹/p›<br>\n\t\t\t\t{:else if rando ›= 0.25}<br>\n\t\t\t\t\t  ‹p›Value ranges from 0.25 to 0.49.‹/p›<br>\n\t\t\t\t{:else}<br>\n\t\t\t\t\t  ‹p›Value is less than 0.25.‹/p›<br>\n\t\t\t\t{/if}\n\t\t\t</code>",$n=x(),wn=v("br"),kn=x(),ue.c(),Cn=x(),Mn=v("br"),Tn=v("input"),_n=v("br"),Sn=x(),Dn=v("div"),Ln=v("div"),Hn=v("p"),Hn.innerHTML="<b>7. Using Svelte&#39;s transition directives</b> \n\t\t\t<br> \n\t\t\t<cite>\n\t\t\t\tThese are directives that allows you to compute css animations based on the logic in your page.\n\t\t\t</cite>",En=x(),Rn=v("div"),Rn.innerHTML="<code>\n\t\t\t\t-- Done in the script portion. Will need to import the transition library.<br>\n\t\t\t\timport { fade, fly } from &#39;svelte/transition&#39;;\n\t\t\t\t<br><br>-- Done in the html portion.<br>\n\t\t\t\t{#if rando › 0.75}<br>\n\t\t\t\t\t  ‹p <br>\n\t\t\t\t\t\t    in:fade={{ delay: 200, duration:4000 }}<br>\n\t\t\t\t\t\t    out:fade={{ delay: 200, duration:4000 }}<br>\n\t\t\t\t\t  ›Fading‹/p›<br>\n\t\t\t\t{:else if rando ›= 0.5}<br>\n\t\t\t\t\t  ‹p <br>\n\t\t\t\t\t\t    in:slide={{ delay: 200, duration:4000 }}<br>\n\t\t\t\t\t\t    out:slide={{ delay: 200, duration:4000 }}<br>\n\t\t\t\t\t  ›Sliding‹/p›<br>\n\t\t\t\t{:else if rando ›= 0.25}<br>\n\t\t\t\t\t  ‹p <br>\n\t\t\t\t\t\t    in:blur={{ delay: 200, duration:4000 }}<br>\n\t\t\t\t\t\t    out:blur={{ delay: 200, duration:4000 }}<br>\n\t\t\t\t\t  ›Bluring‹/p›<br>\n\t\t\t\t{:else}<br>\n\t\t\t\t\t  ‹p <br>\n\t\t\t\t\t\t    in:fly={{ delay: 200, x: 500, duration:4000 }}<br>\n\t\t\t\t\t\t    out:fly={{ delay: 200, x: -250, duration:4000 }}<br>\n\t\t\t\t\t  ›Flying‹/p›<br>\n\t\t\t\t{/if}<br></code>",Bn=x(),Fn=v("br"),Pn=x(),Vn=v("button"),Vn.textContent="Fade",jn=x(),An=v("button"),An.textContent="Slide",In=x(),On=v("button"),On.textContent="Blur",zn=x(),Jn=v("button"),Jn.textContent="Fly",Nn=x(),Un=v("br"),qn=x(),Gn.c(),Yn=x(),Kn=v("br"),Qn=x(),Xn=v("button"),Xn.textContent="Randomize me!",Zn=x(),te=v("br"),ne=v("br"),ee=v("button"),ee.textContent="Unclickable!",w(n,"class","text-orange-700 italic text-base md:text-xl"),w(p,"class","notes"),w(s,"class","container"),w(i,"class","card"),w(I,"class","notes"),w(L,"class","container"),w(D,"class","card"),w(pt,"class","notes"),w(W,"class","container"),w(q,"class","card"),w(jt,"class","notes"),w(Ot,"size","10"),w(St,"class","container"),w(_t,"class","card"),w(nn,"class","notes"),w(Ut,"class","container"),w(Nt,"class","card"),w(xn,"class","notes"),w(Tn,"size","10"),w(gn,"class","container"),w(mn,"class","card"),w(Rn,"class","notes"),w(Ln,"class","container"),w(Dn,"class","card"),ee.disabled=!0},m(g,v,y){m(g,n,v),m(g,e,v),m(g,o,v),m(g,r,v),m(g,i,v),h(i,s),h(s,l),h(l,c),h(c,u),h(c,d),h(s,b),h(s,p),h(s,f),h(s,M),h(s,T),h(s,_),m(g,S,v),m(g,D,v),h(D,L),h(L,H),h(H,E),h(E,R),h(E,B),h(H,F),h(H,P),h(H,V),h(H,j),h(L,A),h(L,I),h(L,O),h(L,z),h(L,J),h(L,N),m(g,U,v),m(g,q,v),h(q,W),h(W,X),h(X,Z),h(Z,tt),h(Z,nt),h(Z,et),h(Z,ot),h(Z,rt),h(Z,at),h(Z,it),h(Z,st),h(X,lt),h(X,ct),h(X,ut),h(X,dt),h(W,bt),h(W,pt),h(W,ft),h(W,kt),h(W,Ct),h(W,Mt),m(g,Tt,v),m(g,_t,v),h(_t,St),h(St,Dt),h(Dt,Lt),h(Lt,Ht),h(Lt,Et),h(Dt,Rt),h(Dt,Bt),h(Dt,Ft),h(Dt,Pt),h(St,Vt),h(St,jt),h(St,At),h(St,It),h(St,Ot),C(Ot,t[0]),h(St,zt),m(g,Jt,v),m(g,Nt,v),h(Nt,Ut),h(Ut,qt),h(qt,Wt),h(Wt,Gt),h(Wt,Yt),h(qt,Kt),h(qt,Qt),h(qt,Xt),h(qt,Zt),h(Ut,tn),h(Ut,nn),h(Ut,en),h(Ut,on),h(Ut,rn),h(Ut,an),h(Ut,sn),h(Ut,ln),h(Ut,cn),h(Ut,un),h(Ut,dn),h(Ut,bn),h(Ut,pn),h(Ut,fn),m(g,hn,v),m(g,mn,v),h(mn,gn),h(gn,vn),h(gn,yn),h(gn,xn),h(gn,$n),h(gn,wn),h(gn,kn),ue.m(gn,null),h(gn,Cn),h(gn,Mn),h(gn,Tn),C(Tn,t[0]),h(gn,_n),m(g,Sn,v),m(g,Dn,v),h(Dn,Ln),h(Ln,Hn),h(Ln,En),h(Ln,Rn),h(Ln,Bn),h(Ln,Fn),h(Ln,Pn),h(Ln,Vn),h(Ln,jn),h(Ln,An),h(Ln,In),h(Ln,On),h(Ln,zn),h(Ln,Jn),h(Ln,Nn),h(Ln,Un),h(Ln,qn),be[Wn].m(Ln,null),h(Ln,Yn),h(Ln,Kn),m(g,Qn,v),m(g,Xn,v),m(g,Zn,v),m(g,te,v),m(g,ne,v),m(g,ee,v),oe=!0,y&&a(re),re=[$(T,"click",t[2]),$(J,"click",t[2]),$(Ct,"click",t[2]),$(Ot,"input",t[4]),$(an,"click",t[5]),$(ln,"click",t[6]),$(un,"click",t[7]),$(bn,"click",t[8]),$(Tn,"input",t[9]),$(Vn,"click",t[10]),$(An,"click",t[11]),$(On,"click",t[12]),$(Jn,"click",t[13]),$(Xn,"click",t[2])]},p(t,[n]){(!oe||1&n)&&k(d,t[0]),(!oe||1&n)&&ae!==(ae=Math.round(t[0])?"🤗":"👻")&&k(B,ae),(!oe||2&n)&&k(nt,t[1]),(!oe||2&n)&&k(ot,t[1]),(!oe||2&n)&&k(at,t[1]),(!oe||2&n)&&k(st,t[1]),(!oe||1&n)&&ie!==(ie=Math.round(t[0])?"🤗":"👻")&&k(Et,ie),1&n&&Ot.value!==t[0]&&C(Ot,t[0]),(!oe||1&n)&&se!==(se=Math.round(t[0])?"🤗":"👻")&&k(Yt,se),ce!==(ce=le(t))&&(ue.d(1),ue=ce(t),ue&&(ue.c(),ue.m(gn,Cn))),1&n&&Tn.value!==t[0]&&C(Tn,t[0]);let e=Wn;Wn=pe(t),Wn!==e&&(G(),Q(be[e],1,1,()=>{be[e]=null}),Y(),Gn=be[Wn],Gn||(Gn=be[Wn]=de[Wn](t),Gn.c()),K(Gn,1),Gn.m(Ln,Yn))},i(t){oe||(K(Gn),oe=!0)},o(t){Q(Gn),oe=!1},d(t){t&&g(n),t&&g(e),t&&g(o),t&&g(r),t&&g(i),t&&g(S),t&&g(D),t&&g(U),t&&g(q),t&&g(Tt),t&&g(_t),t&&g(Jt),t&&g(Nt),t&&g(hn),t&&g(mn),ue.d(),t&&g(Sn),t&&g(Dn),be[Wn].d(),t&&g(Qn),t&&g(Xn),t&&g(Zn),t&&g(te),t&&g(ne),t&&g(ee),a(re)}}}function Ct(t,n){return Math.random()*(n-t)+t}function Mt(t,n,e){let o=0;function r(t){e(0,o=t)}let a;return t.$$.update=()=>{1&t.$$.dirty&&e(1,a=Math.round(o)?"🤗":"👻")},[o,a,function(){e(0,o=Math.random())},r,function(){o=this.value,e(0,o)},()=>r(Ct(.76,1)),()=>r(Ct(.5,.75)),()=>r(Ct(.25,.49)),()=>r(Ct(0,.24)),function(){o=this.value,e(0,o)},()=>r(Ct(.76,1)),()=>r(Ct(.51,.74)),()=>r(Ct(.26,.49)),()=>r(Ct(0,.24))]}const Tt=[];function _t(n,e=t){let o;const r=[];function a(t){if(s(n,t)&&(n=t,o)){const t=!Tt.length;for(let t=0;t<r.length;t+=1){const e=r[t];e[1](),Tt.push(e,n)}if(t){for(let t=0;t<Tt.length;t+=2)Tt[t][0](Tt[t+1]);Tt.length=0}}}return{set:a,update:function(t){a(t(n))},subscribe:function(i,s=t){const l=[i,s];return r.push(l),1===r.length&&(o=e(a)||t),i(n),()=>{const t=r.indexOf(l);-1!==t&&r.splice(t,1),0===r.length&&(o(),o=null)}}}}const St=_t("This is the original stored value.");function Dt(n){let e,o,r,a,i,s,l,c,u,d,b;return{c(){e=v("p"),o=y("UserID: "),r=y(n[0]),a=x(),i=v("p"),s=y("Name: "),l=y(n[1]),c=x(),u=v("p"),d=y("Email: "),b=y(n[2])},m(t,n){m(t,e,n),h(e,o),h(e,r),m(t,a,n),m(t,i,n),h(i,s),h(i,l),m(t,c,n),m(t,u,n),h(u,d),h(u,b)},p(t,[n]){1&n&&k(r,t[0]),2&n&&k(l,t[1]),4&n&&k(b,t[2])},i:t,o:t,d(t){t&&g(e),t&&g(a),t&&g(i),t&&g(c),t&&g(u)}}}function Lt(t,n,e){let{userId:o}=n,{name:r}=n,{email:a}=n;return t.$set=t=>{"userId"in t&&e(0,o=t.userId),"name"in t&&e(1,r=t.name),"email"in t&&e(2,a=t.email)},[o,r,a]}class Ht extends st{constructor(t){super(),it(this,t,Lt,Dt,s,{userId:0,name:1,email:2})}}function Et(t,n,e){const o=t.slice();return o[9]=n[e],o[11]=e,o}function Rt(t){let n,e,o,r,a,i=t[11]+1+"",s=t[9]+"";return{c(){n=v("li"),e=y("No. "),o=y(i),r=y(": value = "),a=y(s)},m(t,i){m(t,n,i),h(n,e),h(n,o),h(n,r),h(n,a)},p(t,n){1&n&&s!==(s=t[9]+"")&&k(a,s)},d(t){t&&g(n)}}}function Bt(t){let n,e,o=t[8].message+"";return{c(){n=v("p"),e=y(o)},m(t,o){m(t,n,o),h(n,e)},p(t,n){2&n&&o!==(o=t[8].message+"")&&k(e,o)},d(t){t&&g(n)}}}function Ft(t){let n,e,o,r=t[7]+"";return{c(){n=v("p"),e=y("Result: "),o=y(r)},m(t,r){m(t,n,r),h(n,e),h(n,o)},p(t,n){2&n&&r!==(r=t[7]+"")&&k(o,r)},d(t){t&&g(n)}}}function Pt(n){let e;return{c(){e=v("p"),e.textContent="Thinking about it..."},m(t,n){m(t,e,n)},p:t,d(t){t&&g(e)}}}function Vt(t){let n,o,r,i,s,l,c,u,d,b,p,f,C,M,T,_,S,D,L,H,E,R,B,F,P,V,j,A,I,O,z,J,N,U,q,W,G,Y,X,Z,tt,at,it,st,lt,ct,ut,dt,bt,pt,ft,ht,mt,gt,vt,yt,xt,$t,wt,kt,Ct,Mt,Tt,_t,St,Dt,Lt,Vt,jt,At,It,Ot,zt,Jt,Nt,Ut,qt,Wt,Gt,Yt,Kt,Qt=t[0].length+"",Xt=t[0],Zt=[];for(let n=0;n<Xt.length;n+=1)Zt[n]=Rt(Et(t,Xt,n));let tn={ctx:t,current:null,token:null,pending:Pt,then:Ft,catch:Bt,value:7,error:8};nt(st=t[1],tn);const nn=[t[5]];let en={};for(let t=0;t<nn.length;t+=1)en=e(en,nn[t]);const on=new Ht({props:en});return{c(){n=v("div"),n.textContent="Moar stuff on using Svelte :P",o=x(),r=v("br"),i=x(),s=v("div"),l=v("div"),c=v("p"),u=v("b"),d=y("1. Proper way of setting new values to array/object. Randos counter: "),b=y(Qt),p=x(),f=v("br"),C=x(),M=v("cite"),M.innerHTML="\n\t\t\t\tRemember! Svelte is reactive based on assignment. So if we have an array and push new items to the array, we won&#39;t get any actual changes in the DOM.\n\t\t\t\t&#39;Cos we&#39;re just mutating the array and we&#39;re not actually assigning the variable.\n\t\t\t\t<br><br>\n\t\t\t\tSo if you want the app to react to changes to an array or an object, best to use the spread syntax. i.e. &#39;[...arr, newValue]&#39;. This here does the same thing as an\n\t\t\t\tarray push but also reassign the variable causing the app to react and update the DOM.\n\t\t\t",T=x(),_=v("div"),_.innerHTML="<code>\n\t\t\t\tlet randos = [];\n\t\t\t\t<br><br>\n\t\t\t\t[ Wrong way ]<br>\n\t\t\t\tfunction setRando() {<br>\n\t\t\t\t\t  const rando = Math.round(Math.random() * 100);<br>\n\t\t\t\t\t  randos.push(rando);<br>\n\t\t\t\t}\n\t\t\t\t<br><br>\n\t\t\t\t[ Correct way ]<br>\n\t\t\t\tfunction setRando() {<br>\n\t\t\t\t\t  const rando = Math.round(Math.random() * 100);<br>\n\t\t\t\t\t  randos = [...randos, rando];<br>\n\t\t\t\t}\n\t\t\t</code>",S=x(),D=v("br"),L=v("button"),L.textContent="Add to counter",H=v("br"),E=x(),R=v("div"),B=v("div"),F=v("p"),F.innerHTML="<b>2. Looping with Svelte by using the &#39;each&#39; block.</b>",P=x(),V=v("div"),V.innerHTML="<code>\n\t\t\t\t-- Done in the html portion.<br>\n\t\t\t\t{#each randos as val, idx}<br>\n\t\t\t\t\t  ‹li›No. {idx + 1}: value = {val}‹/li›<br>\n\t\t\t\t{/each}<br></code>",j=x(),A=v("br"),I=x(),O=v("ul");for(let t=0;t<Zt.length;t+=1)Zt[t].c();z=x(),J=v("br"),N=v("button"),N.textContent="Add to counter",U=v("br"),q=x(),W=v("div"),G=v("div"),Y=v("p"),Y.innerHTML="<b>3. Handle promises using the &#39;await&#39; block.</b><br> \n\t\t\t<cite>Useful when performing HTTP requests.</cite>",X=x(),Z=v("div"),Z.innerHTML="<code>\n\t\t\t\t-- Done in the script portion.<br>\n\t\t\t\tlet rand = 0;<br>\n\t\t\t\tfunction delay(ms) {<br>\n\t\t\t\t\t  return new Promise(resolve =&gt; setTimeout(resolve, ms));<br>\n\t\t\t\t}<br>\n\t\t\t\tfunction executeDelay() {<br>\n\t\t\t\t\t  rand = delay(2000).then(v =&gt; Math.random());<br>\n\t\t\t\t}\n\t\t\t\t<br><br>\n\t\t\t\t-- Done in the html portion.<br>\n\t\t\t\t{#await rand}<br>\n\t\t\t\t\t  ‹p›Thinking about it...‹/p›<br>\n\t\t\t\t{:then number}<br>\n\t\t\t\t\t  ‹p›Result: {number}‹/p›<br>\n\t\t\t\t{:catch error}<br>\n\t\t\t\t\t  ‹p›{error.message}‹/p›<br>\n\t\t\t\t{/await}\n\t\t\t</code>",tt=x(),at=v("br"),it=x(),tn.block.c(),lt=x(),ct=v("br"),ut=v("button"),ut.textContent="Click",dt=v("br"),bt=x(),pt=v("div"),ft=v("div"),ht=v("p"),ht.innerHTML="<b>4. Using svelte/store as a global variable handler.</b><br> \n\t\t\t<cite>\n\t\t\t\tThink &#39;public static String HELLO_WORLD = ...&#39; kind of thing. This is useful when you have many components and each\n\t\t\t\twanting to use that same variable.\n\t\t\t</cite> \n\t\t\t<br><br>",mt=x(),gt=v("p"),gt.innerHTML="<b>Notes for svelte/store: </b><br>\n\t\t\t- You can use .set() to set a new value. <br>\n\t\t\t- Use .update() to get access to the current value and then compute a new value to be updated. <br>\n\t\t\t\t  eg: globalValue.update(v =&gt; v + 1); <br>\n\t\t\t- If you just want to listen/view the value, just gotta .subscribe() to it. But REMEMBER, since this is an observable, you need to manage\n\t\t\t\tyour subscriptions carefully (e.g. remember to delete them when component no longer in use). Otherwise, there will be memory leaks. <br>\n\t\t\t- To avoid memory leaks, use &#39;$&#39; to easily view/subscribe to the observable as Svelte has made it easier to manage them. <br>\n\t\t\t\t  eg: { $globalValue } <br>\n\t\t\t- Data stored here is not persistent. Will be gone once page refreshes.\n\t\t",vt=x(),yt=v("br"),xt=x(),$t=v("div"),$t.innerHTML="<code>\n\t\t\t\t-- Create a new store.js file in the &#39;src&#39; folder and enter the following.<br>\n\t\t\t\timport { writable } from &#39;svelte/store&#39;;<br>\n\t\t\t\texport const globalValue = writable(&#39;This is the original stored value.&#39;);\n\t\t\t\t<br><br>\n\t\t\t\t-- Done in the script portion of a Svelte component.<br>\n\t\t\t\timport { globalValue } from &#39;../store&#39;;\n\t\t\t\t<br><br>\n\t\t\t\t-- Done in the html portion of a Svelte component.<br>\n\t\t\t\t{ $globalValue }\n\t\t\t</code>",wt=x(),kt=v("br"),Ct=x(),Mt=v("b"),Mt.textContent="Global variable value:",Tt=x(),_t=y(t[2]),St=x(),Dt=v("br"),Lt=x(),Vt=v("br"),jt=v("button"),jt.textContent="Set random number to global variable",At=v("br"),It=x(),Ot=v("div"),zt=v("div"),Jt=v("p"),Jt.innerHTML="<b>5. Passing objects from child component to the parent component using the Svelte spread syntax.</b> \n\t\t\t<br> \n\t\t\t<cite>\n\t\t\t\tParent component here will be this page two component while child component will be Child.svelte.\n\t\t\t</cite>",Nt=x(),Ut=v("div"),Ut.innerHTML="<code>\n\t\t\t\t-- Done in Child.svelte.<br>\n\t\t\t\t‹script›<br>\n\t\t\t\t\t  export let userId;<br>\n\t\t\t\t\t  export let name;<br>\n\t\t\t\t\t  export let email;<br>\n\t\t\t\t‹/script›<br>\n\t\t\t\t‹p›UserID: {userId}‹/p›<br>\n\t\t\t\t‹p›Name: {name}‹/p›<br>\n\t\t\t\t‹p›Email: {email}‹/p›\n\t\t\t\t<br><br>\n\t\t\t\t-- Done in the script portion of the Parent component.<br>\n\t\t\t\timport Child from &#39;./Child.svelte&#39;;<br>\n\t\t\t\t// Simulate data retrieval from the backend/database etc. <br>\n\t\t\t\tlet data = {<br>\n\t\t\t\t\t  userId: 123456789,<br>\n\t\t\t\t\t  name: &quot;Jack Doe Junior&quot;,<br>\n\t\t\t\t\t  email: &quot;hello@potatorus.io&quot;<br>\n\t\t\t\t}\n\t\t\t\t<br><br>\n\t\t\t\t-- Done in the html portion of the Parent component.<br>\n\t\t\t\t‹Child {...data} /›\n\t\t\t</code>",qt=x(),Wt=v("br"),Gt=x(),et(on.$$.fragment),w(n,"class","text-orange-700 italic text-base md:text-xl"),w(_,"class","notes"),w(l,"class","container"),w(s,"class","card"),w(V,"class","notes"),w(B,"class","container"),w(R,"class","card"),w(Z,"class","notes"),w(G,"class","container"),w(W,"class","card"),w(gt,"class","text-left text-xs"),w($t,"class","notes"),w(ft,"class","container"),w(pt,"class","card"),w(Ut,"class","notes"),w(zt,"class","container"),w(Ot,"class","card")},m(e,g,v){m(e,n,g),m(e,o,g),m(e,r,g),m(e,i,g),m(e,s,g),h(s,l),h(l,c),h(c,u),h(u,d),h(u,b),h(c,p),h(c,f),h(c,C),h(c,M),h(l,T),h(l,_),h(l,S),h(l,D),h(l,L),h(l,H),m(e,E,g),m(e,R,g),h(R,B),h(B,F),h(B,P),h(B,V),h(B,j),h(B,A),h(B,I),h(B,O);for(let t=0;t<Zt.length;t+=1)Zt[t].m(O,null);h(B,z),h(B,J),h(B,N),h(B,U),m(e,q,g),m(e,W,g),h(W,G),h(G,Y),h(G,X),h(G,Z),h(G,tt),h(G,at),h(G,it),tn.block.m(G,tn.anchor=null),tn.mount=()=>G,tn.anchor=lt,h(G,lt),h(G,ct),h(G,ut),h(G,dt),m(e,bt,g),m(e,pt,g),h(pt,ft),h(ft,ht),h(ft,mt),h(ft,gt),h(ft,vt),h(ft,yt),h(ft,xt),h(ft,$t),h(ft,wt),h(ft,kt),h(ft,Ct),h(ft,Mt),h(ft,Tt),h(ft,_t),h(ft,St),h(ft,Dt),h(ft,Lt),h(ft,Vt),h(ft,jt),h(ft,At),m(e,It,g),m(e,Ot,g),h(Ot,zt),h(zt,Jt),h(zt,Nt),h(zt,Ut),h(zt,qt),h(zt,Wt),h(zt,Gt),ot(on,zt,null),Yt=!0,v&&a(Kt),Kt=[$(L,"click",t[3]),$(N,"click",t[3]),$(ut,"click",t[4]),$(jt,"click",t[6])]},p(n,[e]){if(t=n,(!Yt||1&e)&&Qt!==(Qt=t[0].length+"")&&k(b,Qt),1&e){let n;for(Xt=t[0],n=0;n<Xt.length;n+=1){const o=Et(t,Xt,n);Zt[n]?Zt[n].p(o,e):(Zt[n]=Rt(o),Zt[n].c(),Zt[n].m(O,null))}for(;n<Zt.length;n+=1)Zt[n].d(1);Zt.length=Xt.length}if(tn.ctx=t,2&e&&st!==(st=t[1])&&nt(st,tn));else{const n=t.slice();n[7]=tn.resolved,tn.block.p(n,e)}(!Yt||4&e)&&k(_t,t[2]);const o=32&e?function(t,n){const e={},o={},r={$$scope:1};let a=t.length;for(;a--;){const i=t[a],s=n[a];if(s){for(const t in i)t in s||(o[t]=1);for(const t in s)r[t]||(e[t]=s[t],r[t]=1);t[a]=s}else for(const t in i)r[t]=1}for(const t in o)t in e||(e[t]=void 0);return e}(nn,[(r=t[5],"object"==typeof r&&null!==r?r:{})]):{};var r;on.$set(o)},i(t){Yt||(K(on.$$.fragment,t),Yt=!0)},o(t){Q(on.$$.fragment,t),Yt=!1},d(t){t&&g(n),t&&g(o),t&&g(r),t&&g(i),t&&g(s),t&&g(E),t&&g(R),function(t,n){for(let e=0;e<t.length;e+=1)t[e]&&t[e].d(n)}(Zt,t),t&&g(q),t&&g(W),tn.block.d(),tn.token=null,tn=null,t&&g(bt),t&&g(pt),t&&g(It),t&&g(Ot),rt(on),a(Kt)}}}function jt(t,n,e){let o;l(t,St,t=>e(2,o=t));let r=[];let a=0;return[r,a,o,function(){const t=Math.round(100*Math.random());e(0,r=[...r,t])},function(){var t;e(1,a=(t=2e3,new Promise(n=>setTimeout(n,t))).then(t=>Math.random()))},{userId:123456789,name:"Jack Doe Junior",email:"hello@potatorus.io"},()=>St.set(Math.round(100*Math.random()))]}function At(n){let e,o,r;return{c(){e=v("div"),e.textContent="This is page three.",o=x(),r=v("br"),w(e,"class","text-orange-700 italic text-base md:text-xl")},m(t,n){m(t,e,n),m(t,o,n),m(t,r,n)},p:t,i:t,o:t,d(t){t&&g(e),t&&g(o),t&&g(r)}}}const It={"/":class extends st{constructor(t){super(),it(this,t,null,lt,s,{})}},"/one":class extends st{constructor(t){super(),it(this,t,Mt,kt,s,{})}},"/two":class extends st{constructor(t){super(),it(this,t,jt,Vt,s,{})}},"/three":class extends st{constructor(t){super(),it(this,t,null,At,s,{})}}},Ot=_t("/"),zt=window.location.href;function Jt(n){let e,o,r,a,i=n[0].name+"";return{c(){e=v("a"),o=y(i),w(e,"href",r=n[0].path)},m(t,r,i){var s;m(t,e,r),h(e,o),i&&a(),a=$(e,"click",(s=n[1],function(t){return t.preventDefault(),s.call(this,t)}))},p(t,[n]){1&n&&i!==(i=t[0].name+"")&&k(o,i),1&n&&r!==(r=t[0].path)&&w(e,"href",r)},i:t,o:t,d(t){t&&g(e),a()}}}function Nt(t,n,e){let{page:o={path:"/",name:"Home"}}=n;return t.$set=t=>{"page"in t&&e(0,o=t.page)},[o,function(t){Ot.set(t.target.pathname),window.history.pushState({path:o.path},"",zt)}]}class Ut extends st{constructor(t){super(),it(this,t,Nt,Jt,s,{page:0})}}function qt(t){let n,e,o,r,a,i,s,l,c,u,d,b,p,f,C,M;const T=new Ut({props:{page:{path:"/",name:"Home"}}}),_=new Ut({props:{page:{path:"/one",name:"Page One"}}}),S=new Ut({props:{page:{path:"/two",name:"Page Two"}}}),D=new Ut({props:{page:{path:"/three",name:"Page Three"}}});var L=It[t[1]];if(L)var H=new L({});return{c(){n=v("main"),e=v("h1"),o=y("Hello "),r=y(t[0]),a=y("!"),i=x(),s=v("div"),et(T.$$.fragment),l=y("  |  \n\t\t"),et(_.$$.fragment),c=y("  |  \n\t\t"),et(S.$$.fragment),u=y("  |  \n\t\t"),et(D.$$.fragment),d=x(),b=v("br"),p=x(),f=v("div"),H&&et(H.$$.fragment),w(e,"class","uppercase font-hairline m-0 p-4 text-red-600 text-5xl md:text-6xl lg:text-6xl"),w(s,"class","font-medium text-red-800 text-sm md:text-base lg:text-base pl-4 pr-4"),w(f,"id","pageContent"),w(n,"class","text-center px-1 m-0 svelte-1w5elwo")},m(g,v,y){m(g,n,v),h(n,e),h(e,o),h(e,r),h(e,a),h(n,i),h(n,s),ot(T,s,null),h(s,l),ot(_,s,null),h(s,c),ot(S,s,null),h(s,u),ot(D,s,null),h(n,d),h(n,b),h(n,p),h(n,f),H&&ot(H,f,null),C=!0,y&&M(),M=$(window,"popstate",t[2])},p(t,[n]){if((!C||1&n)&&k(r,t[0]),L!==(L=It[t[1]])){if(H){G();const t=H;Q(t.$$.fragment,1,0,()=>{rt(t,1)}),Y()}L?(et((H=new L({})).$$.fragment),K(H.$$.fragment,1),ot(H,f,null)):H=null}},i(t){C||(K(T.$$.fragment,t),K(_.$$.fragment,t),K(S.$$.fragment,t),K(D.$$.fragment,t),H&&K(H.$$.fragment,t),C=!0)},o(t){Q(T.$$.fragment,t),Q(_.$$.fragment,t),Q(S.$$.fragment,t),Q(D.$$.fragment,t),H&&Q(H.$$.fragment,t),C=!1},d(t){t&&g(n),rt(T),rt(_),rt(S),rt(D),H&&rt(H),M()}}}function Wt(t,n,e){let o;l(t,Ot,t=>e(1,o=t));let{name:r}=n;return t.$set=t=>{"name"in t&&e(0,r=t.name)},[r,o,function(t){t&&t.state&&t.state.path?Ot.set(t.state.path):Ot.set("/")}]}return new class extends st{constructor(t){super(),it(this,t,Wt,qt,s,{name:0})}}({target:document.body,props:{name:"svelte"}})}();
//# sourceMappingURL=bundle.js.map
