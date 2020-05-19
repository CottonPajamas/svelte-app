
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.22.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/Home.svelte generated by Svelte v3.22.2 */

    const file = "src/components/Home.svelte";

    function create_fragment(ctx) {
    	let h2;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "This is the home page.";
    			attr_dev(h2, "class", "text-orange-600 text-3xl italic");
    			add_location(h2, file, 4, 0, 21);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Home", $$slots, []);
    	return [];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    function cubicInOut(t) {
        return t < 0.5 ? 4.0 * t * t * t : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0;
    }
    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function blur(node, { delay = 0, duration = 400, easing = cubicInOut, amount = 5, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const f = style.filter === 'none' ? '' : style.filter;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `opacity: ${target_opacity - (od * u)}; filter: ${f} blur(${u * amount}px);`
        };
    }
    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut }) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => `overflow: hidden;` +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    /* src/components/One.svelte generated by Svelte v3.22.2 */
    const file$1 = "src/components/One.svelte";

    // (164:3) {:else}
    function create_else_block_1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Value is less than 0.25.";
    			add_location(p, file$1, 164, 4, 5955);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(164:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (162:27) 
    function create_if_block_5(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Value ranges from 0.25 to 0.49.";
    			add_location(p, file$1, 162, 4, 5901);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(162:27) ",
    		ctx
    	});

    	return block;
    }

    // (160:26) 
    function create_if_block_4(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Value ranges from 0.50 to 0.75.";
    			add_location(p, file$1, 160, 4, 5830);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(160:26) ",
    		ctx
    	});

    	return block;
    }

    // (158:3) {#if rando > 0.75}
    function create_if_block_3(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Value is more than 0.75.";
    			add_location(p, file$1, 158, 4, 5767);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(158:3) {#if rando > 0.75}",
    		ctx
    	});

    	return block;
    }

    // (229:3) {:else}
    function create_else_block(ctx) {
    	let p;
    	let p_intro;
    	let p_outro;
    	let current;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Flying";
    			add_location(p, file$1, 229, 4, 8780);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (p_outro) p_outro.end(1);
    				if (!p_intro) p_intro = create_in_transition(p, fly, { delay: 200, x: 500, duration: 4000 });
    				p_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (p_intro) p_intro.invalidate();
    			p_outro = create_out_transition(p, fly, { delay: 200, x: -250, duration: 300 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching && p_outro) p_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(229:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (224:27) 
    function create_if_block_2(ctx) {
    	let p;
    	let p_intro;
    	let p_outro;
    	let current;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Bluring";
    			add_location(p, file$1, 224, 4, 8654);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (p_outro) p_outro.end(1);
    				if (!p_intro) p_intro = create_in_transition(p, blur, { delay: 200, duration: 4000 });
    				p_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (p_intro) p_intro.invalidate();
    			p_outro = create_out_transition(p, blur, { delay: 200, duration: 300 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching && p_outro) p_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(224:27) ",
    		ctx
    	});

    	return block;
    }

    // (219:26) 
    function create_if_block_1(ctx) {
    	let p;
    	let p_intro;
    	let p_outro;
    	let current;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Sliding";
    			add_location(p, file$1, 219, 4, 8509);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (p_outro) p_outro.end(1);
    				if (!p_intro) p_intro = create_in_transition(p, slide, { delay: 200, duration: 4000 });
    				p_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (p_intro) p_intro.invalidate();
    			p_outro = create_out_transition(p, slide, { delay: 200, duration: 300 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching && p_outro) p_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(219:26) ",
    		ctx
    	});

    	return block;
    }

    // (214:3) {#if rando > 0.75}
    function create_if_block(ctx) {
    	let p;
    	let p_intro;
    	let p_outro;
    	let current;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Fading";
    			add_location(p, file$1, 214, 4, 8368);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (p_outro) p_outro.end(1);
    				if (!p_intro) p_intro = create_in_transition(p, fade, { delay: 200, duration: 4000 });
    				p_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (p_intro) p_intro.invalidate();
    			p_outro = create_out_transition(p, fade, { delay: 200, duration: 300 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching && p_outro) p_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(214:3) {#if rando > 0.75}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div0;
    	let t1;
    	let br0;
    	let t2;
    	let div3;
    	let div2;
    	let p0;
    	let b0;
    	let t3;
    	let t4;
    	let t5;
    	let div1;
    	let code0;
    	let t6;
    	let br1;
    	let t7;
    	let br2;
    	let br3;
    	let t8;
    	let br4;
    	let t9;
    	let t10;
    	let br5;
    	let button0;
    	let br6;
    	let t12;
    	let div6;
    	let div5;
    	let p1;
    	let b1;
    	let t13;
    	let t14_value = (Math.round(/*rando*/ ctx[0]) ? "🤗" : "👻") + "";
    	let t14;
    	let t15;
    	let br7;
    	let t16;
    	let cite0;
    	let t18;
    	let div4;
    	let code1;
    	let t20;
    	let br8;
    	let button1;
    	let br9;
    	let t22;
    	let div9;
    	let div8;
    	let p2;
    	let b2;
    	let t23;
    	let t24;
    	let t25;
    	let t26;
    	let t27;
    	let t28;
    	let t29;
    	let t30;
    	let t31;
    	let br10;
    	let t32;
    	let cite1;
    	let t33;
    	let br11;
    	let t34;
    	let br12;
    	let t35;
    	let br13;
    	let br14;
    	let t36;
    	let t37;
    	let div7;
    	let code2;
    	let t38;
    	let br15;
    	let t39;
    	let br16;
    	let br17;
    	let t40;
    	let br18;
    	let t41;
    	let br19;
    	let t42;
    	let br20;
    	let t43;
    	let t44;
    	let br21;
    	let button2;
    	let br22;
    	let t46;
    	let div12;
    	let div11;
    	let p3;
    	let b3;
    	let t47;
    	let t48_value = (Math.round(/*rando*/ ctx[0]) ? "🤗" : "👻") + "";
    	let t48;
    	let t49;
    	let br23;
    	let t50;
    	let cite2;
    	let t52;
    	let div10;
    	let code3;
    	let t54;
    	let br24;
    	let input0;
    	let br25;
    	let t55;
    	let div15;
    	let div14;
    	let p4;
    	let b4;
    	let t56;
    	let t57_value = (Math.round(/*rando*/ ctx[0]) ? "🤗" : "👻") + "";
    	let t57;
    	let t58;
    	let br26;
    	let t59;
    	let cite3;
    	let t61;
    	let div13;
    	let code4;
    	let t63;
    	let br27;
    	let t64;
    	let button3;
    	let t66;
    	let button4;
    	let t68;
    	let button5;
    	let t70;
    	let button6;
    	let t72;
    	let br28;
    	let t73;
    	let div18;
    	let div17;
    	let p5;
    	let b5;
    	let t75;
    	let br29;
    	let t76;
    	let cite4;
    	let t78;
    	let div16;
    	let code5;
    	let t79;
    	let br30;
    	let t80;
    	let br31;
    	let t81;
    	let br32;
    	let t82;
    	let br33;
    	let t83;
    	let br34;
    	let t84;
    	let br35;
    	let t85;
    	let br36;
    	let t86;
    	let br37;
    	let t87;
    	let t88;
    	let br38;
    	let t89;
    	let t90;
    	let br39;
    	let input1;
    	let br40;
    	let t91;
    	let div21;
    	let div20;
    	let p6;
    	let b6;
    	let t93;
    	let br41;
    	let t94;
    	let cite5;
    	let t96;
    	let div19;
    	let code6;
    	let t97;
    	let br42;
    	let t98;
    	let br43;
    	let br44;
    	let t99;
    	let br45;
    	let t100;
    	let br46;
    	let t101;
    	let br47;
    	let t102;
    	let br48;
    	let t103;
    	let br49;
    	let t104;
    	let br50;
    	let t105;
    	let br51;
    	let t106;
    	let br52;
    	let t107;
    	let br53;
    	let t108;
    	let br54;
    	let t109;
    	let br55;
    	let t110;
    	let br56;
    	let t111;
    	let br57;
    	let t112;
    	let br58;
    	let t113;
    	let br59;
    	let t114;
    	let br60;
    	let t115;
    	let br61;
    	let t116;
    	let br62;
    	let t117;
    	let br63;
    	let t118;
    	let br64;
    	let t119;
    	let br65;
    	let t120;
    	let br66;
    	let t121;
    	let br67;
    	let t122;
    	let button7;
    	let t124;
    	let button8;
    	let t126;
    	let button9;
    	let t128;
    	let button10;
    	let t130;
    	let br68;
    	let t131;
    	let current_block_type_index;
    	let if_block1;
    	let t132;
    	let br69;
    	let t133;
    	let button11;
    	let current;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*rando*/ ctx[0] > 0.75) return create_if_block_3;
    		if (/*rando*/ ctx[0] >= 0.5) return create_if_block_4;
    		if (/*rando*/ ctx[0] >= 0.25) return create_if_block_5;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	const if_block_creators = [create_if_block, create_if_block_1, create_if_block_2, create_else_block];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*rando*/ ctx[0] > 0.75) return 0;
    		if (/*rando*/ ctx[0] >= 0.5) return 1;
    		if (/*rando*/ ctx[0] >= 0.25) return 2;
    		return 3;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div0.textContent = "Some basic stuff on how to use Svelte :D";
    			t1 = space();
    			br0 = element("br");
    			t2 = space();
    			div3 = element("div");
    			div2 = element("div");
    			p0 = element("p");
    			b0 = element("b");
    			t3 = text("1. Just outputting a simple private variable: ");
    			t4 = text(/*rando*/ ctx[0]);
    			t5 = space();
    			div1 = element("div");
    			code0 = element("code");
    			t6 = text("-- Done in the script portion.");
    			br1 = element("br");
    			t7 = text("\n\t\t\t\t\tlet rando = 0;\n\t\t\t\t\t");
    			br2 = element("br");
    			br3 = element("br");
    			t8 = text("-- Done in the html portion.");
    			br4 = element("br");
    			t9 = text("\n\t\t\t\t\tJust outputting a simple private variable: { rando }");
    			t10 = space();
    			br5 = element("br");
    			button0 = element("button");
    			button0.textContent = "Randomize me!";
    			br6 = element("br");
    			t12 = space();
    			div6 = element("div");
    			div5 = element("div");
    			p1 = element("p");
    			b1 = element("b");
    			t13 = text("2. Adding logic to our random output: ");
    			t14 = text(t14_value);
    			t15 = space();
    			br7 = element("br");
    			t16 = space();
    			cite0 = element("cite");
    			cite0.textContent = "If it rounds to 1 its a winner, if it rounds to 0 its a loser.";
    			t18 = space();
    			div4 = element("div");
    			code1 = element("code");
    			code1.textContent = "Adding logic to our random output: { Math.round(rando) ? '🤗' : '👻' }";
    			t20 = space();
    			br8 = element("br");
    			button1 = element("button");
    			button1.textContent = "Randomize me!";
    			br9 = element("br");
    			t22 = space();
    			div9 = element("div");
    			div8 = element("div");
    			p2 = element("p");
    			b2 = element("b");
    			t23 = text("3. Simplifying code reuse: ");
    			t24 = text(/*result*/ ctx[1]);
    			t25 = text(" | ");
    			t26 = text(/*result*/ ctx[1]);
    			t27 = text(" | ");
    			t28 = text(/*result*/ ctx[1]);
    			t29 = text(" | ");
    			t30 = text(/*result*/ ctx[1]);
    			t31 = space();
    			br10 = element("br");
    			t32 = space();
    			cite1 = element("cite");
    			t33 = text("Unfortunately, the above code in 2 is not going to scale very well. If you want to show that same value somewhere else in the page,\n\t\t\t\t\tyou will have to duplicate the logic everywhere. i.e.\n\t\t\t\t\t");
    			br11 = element("br");
    			t34 = text("\n\t\t\t\t\t‹p›Adding logic to our random output: { Math.round(rando) ? '🤗' : '👻' }‹/p›\n\t\t\t\t\t");
    			br12 = element("br");
    			t35 = text("\n\t\t\t\t\t‹p›Adding logic to our random output: { Math.round(rando) ? '🤗' : '👻' }‹/p›\n\t\t\t\t\t");
    			br13 = element("br");
    			br14 = element("br");
    			t36 = text("\n\t\t\t\t\tBest way for such situations would be to define the computed value using '$'. This will tell Svelte to calculate this value when the value 'rando' changes.");
    			t37 = space();
    			div7 = element("div");
    			code2 = element("code");
    			t38 = text("-- Done in the script portion, just once.");
    			br15 = element("br");
    			t39 = text("\n\t\t\t\t\t$: result = Math.round(rando) ? '🤗' : '👻';\n\t\t\t\t\t");
    			br16 = element("br");
    			br17 = element("br");
    			t40 = text("-- Done in the html portion.");
    			br18 = element("br");
    			t41 = text("\n\t\t\t\t\t‹p›{ result }‹/p›");
    			br19 = element("br");
    			t42 = text("\n\t\t\t\t\t‹p›{ result }‹/p›");
    			br20 = element("br");
    			t43 = text("\n\t\t\t\t\t‹p›{ result }‹/p›");
    			t44 = space();
    			br21 = element("br");
    			button2 = element("button");
    			button2.textContent = "Randomize me!";
    			br22 = element("br");
    			t46 = space();
    			div12 = element("div");
    			div11 = element("div");
    			p3 = element("p");
    			b3 = element("b");
    			t47 = text("4. Binding attributes to DOM elements: ");
    			t48 = text(t48_value);
    			t49 = space();
    			br23 = element("br");
    			t50 = space();
    			cite2 = element("cite");
    			cite2.textContent = "For instance, we want to bind the 'rando' variable to the value of a form input, we can do it like so.\n\t\t\t\t\tThis will directly change the value of the variable whenever the value of the given input box changes.";
    			t52 = space();
    			div10 = element("div");
    			code3 = element("code");
    			code3.textContent = "‹input bind:value={ rando }›";
    			t54 = space();
    			br24 = element("br");
    			input0 = element("input");
    			br25 = element("br");
    			t55 = space();
    			div15 = element("div");
    			div14 = element("div");
    			p4 = element("p");
    			b4 = element("b");
    			t56 = text("5. Advance on:event directive: ");
    			t57 = text(t57_value);
    			t58 = space();
    			br26 = element("br");
    			t59 = space();
    			cite3 = element("cite");
    			cite3.textContent = "We can set value directly to a variable using the on:event directive by forwarding DOM events. Here we are randomly\n\t\t\t\t\tgenerating a number between the min and max values specified in the function parameters and setting it to the 'rando' variable.";
    			t61 = space();
    			div13 = element("div");
    			code4 = element("code");
    			code4.textContent = "‹button on:click={() => setVal(genRandom(0.51, 0.74))}›Btw 0.76 to 1‹/button›";
    			t63 = space();
    			br27 = element("br");
    			t64 = space();
    			button3 = element("button");
    			button3.textContent = "Btw 0.76 to 1";
    			t66 = space();
    			button4 = element("button");
    			button4.textContent = "Btw 0.50 to 0.75";
    			t68 = space();
    			button5 = element("button");
    			button5.textContent = "Btw 0.25 to 0.49";
    			t70 = space();
    			button6 = element("button");
    			button6.textContent = "Btw 0 to 0.24";
    			t72 = space();
    			br28 = element("br");
    			t73 = space();
    			div18 = element("div");
    			div17 = element("div");
    			p5 = element("p");
    			b5 = element("b");
    			b5.textContent = "6. Dynamically changing page template using if-else if-else syntax.";
    			t75 = space();
    			br29 = element("br");
    			t76 = space();
    			cite4 = element("cite");
    			cite4.textContent = "Think JSP Standard Tag Library (JSTL) but for Svelte.";
    			t78 = space();
    			div16 = element("div");
    			code5 = element("code");
    			t79 = text("{#if rando › 0.75}");
    			br30 = element("br");
    			t80 = text("\n\t\t\t\t\t\t  ‹p›Value is more than 0.75.‹/p›");
    			br31 = element("br");
    			t81 = text("\n\t\t\t\t\t{:else if rando ›= 0.5}");
    			br32 = element("br");
    			t82 = text("\n\t\t\t\t\t\t  ‹p›Value ranges from 0.50 to 0.75.‹/p›");
    			br33 = element("br");
    			t83 = text("\n\t\t\t\t\t{:else if rando ›= 0.25}");
    			br34 = element("br");
    			t84 = text("\n\t\t\t\t\t\t  ‹p›Value ranges from 0.25 to 0.49.‹/p›");
    			br35 = element("br");
    			t85 = text("\n\t\t\t\t\t{:else}");
    			br36 = element("br");
    			t86 = text("\n\t\t\t\t\t\t  ‹p›Value is less than 0.25.‹/p›");
    			br37 = element("br");
    			t87 = text("\n\t\t\t\t\t{/if}");
    			t88 = space();
    			br38 = element("br");
    			t89 = space();
    			if_block0.c();
    			t90 = space();
    			br39 = element("br");
    			input1 = element("input");
    			br40 = element("br");
    			t91 = space();
    			div21 = element("div");
    			div20 = element("div");
    			p6 = element("p");
    			b6 = element("b");
    			b6.textContent = "7. Using Svelte's transition directives";
    			t93 = space();
    			br41 = element("br");
    			t94 = space();
    			cite5 = element("cite");
    			cite5.textContent = "These are directives that allows you to compute css animations based on the logic in your page.";
    			t96 = space();
    			div19 = element("div");
    			code6 = element("code");
    			t97 = text("-- Done in the script portion. Will need to import the transition library.");
    			br42 = element("br");
    			t98 = text("\n\t\t\t\t\timport { fade, fly } from 'svelte/transition';\n\t\t\t\t\t");
    			br43 = element("br");
    			br44 = element("br");
    			t99 = text("-- Done in the html portion.");
    			br45 = element("br");
    			t100 = text("\n\t\t\t\t\t{#if rando › 0.75}");
    			br46 = element("br");
    			t101 = text("\n\t\t\t\t\t\t  ‹p ");
    			br47 = element("br");
    			t102 = text("\n\t\t\t\t\t\t\t    in:fade={{ delay: 200, duration:4000 }}");
    			br48 = element("br");
    			t103 = text("\n\t\t\t\t\t\t\t    out:fade={{ delay: 200, duration:4000 }}");
    			br49 = element("br");
    			t104 = text("\n\t\t\t\t\t\t  ›Fading‹/p›");
    			br50 = element("br");
    			t105 = text("\n\t\t\t\t\t{:else if rando ›= 0.5}");
    			br51 = element("br");
    			t106 = text("\n\t\t\t\t\t\t  ‹p ");
    			br52 = element("br");
    			t107 = text("\n\t\t\t\t\t\t\t    in:slide={{ delay: 200, duration:4000 }}");
    			br53 = element("br");
    			t108 = text("\n\t\t\t\t\t\t\t    out:slide={{ delay: 200, duration:4000 }}");
    			br54 = element("br");
    			t109 = text("\n\t\t\t\t\t\t  ›Sliding‹/p›");
    			br55 = element("br");
    			t110 = text("\n\t\t\t\t\t{:else if rando ›= 0.25}");
    			br56 = element("br");
    			t111 = text("\n\t\t\t\t\t\t  ‹p ");
    			br57 = element("br");
    			t112 = text("\n\t\t\t\t\t\t\t    in:blur={{ delay: 200, duration:4000 }}");
    			br58 = element("br");
    			t113 = text("\n\t\t\t\t\t\t\t    out:blur={{ delay: 200, duration:4000 }}");
    			br59 = element("br");
    			t114 = text("\n\t\t\t\t\t\t  ›Bluring‹/p›");
    			br60 = element("br");
    			t115 = text("\n\t\t\t\t\t{:else}");
    			br61 = element("br");
    			t116 = text("\n\t\t\t\t\t\t  ‹p ");
    			br62 = element("br");
    			t117 = text("\n\t\t\t\t\t\t\t    in:fly={{ delay: 200, x: 500, duration:4000 }}");
    			br63 = element("br");
    			t118 = text("\n\t\t\t\t\t\t\t    out:fly={{ delay: 200, x: -250, duration:4000 }}");
    			br64 = element("br");
    			t119 = text("\n\t\t\t\t\t\t  ›Flying‹/p›");
    			br65 = element("br");
    			t120 = text("\n\t\t\t\t\t{/if}");
    			br66 = element("br");
    			t121 = space();
    			br67 = element("br");
    			t122 = space();
    			button7 = element("button");
    			button7.textContent = "Fade";
    			t124 = space();
    			button8 = element("button");
    			button8.textContent = "Slide";
    			t126 = space();
    			button9 = element("button");
    			button9.textContent = "Blur";
    			t128 = space();
    			button10 = element("button");
    			button10.textContent = "Fly";
    			t130 = space();
    			br68 = element("br");
    			t131 = space();
    			if_block1.c();
    			t132 = space();
    			br69 = element("br");
    			t133 = space();
    			button11 = element("button");
    			button11.textContent = "Randomize me!";
    			attr_dev(div0, "class", "text-orange-700 italic text-base md:text-xl");
    			add_location(div0, file$1, 23, 0, 823);
    			add_location(br0, file$1, 26, 0, 930);
    			add_location(b0, file$1, 30, 6, 987);
    			add_location(p0, file$1, 30, 3, 984);
    			add_location(br1, file$1, 33, 35, 1121);
    			add_location(br2, file$1, 35, 5, 1151);
    			add_location(br3, file$1, 35, 9, 1155);
    			add_location(br4, file$1, 35, 41, 1187);
    			add_location(code0, file$1, 32, 4, 1079);
    			attr_dev(div1, "class", "notes svelte-6q65hp");
    			add_location(div1, file$1, 31, 3, 1055);
    			add_location(br5, file$1, 40, 3, 1367);
    			add_location(button0, file$1, 40, 7, 1371);
    			add_location(br6, file$1, 40, 57, 1421);
    			attr_dev(div2, "class", "container svelte-6q65hp");
    			add_location(div2, file$1, 29, 2, 957);
    			attr_dev(div3, "class", "card svelte-6q65hp");
    			add_location(div3, file$1, 28, 0, 936);
    			add_location(b1, file$1, 47, 4, 1501);
    			add_location(br7, file$1, 48, 4, 1584);
    			attr_dev(cite0, "class", "svelte-6q65hp");
    			add_location(cite0, file$1, 49, 4, 1593);
    			add_location(p1, file$1, 46, 3, 1493);
    			add_location(code1, file$1, 52, 4, 1704);
    			attr_dev(div4, "class", "notes svelte-6q65hp");
    			add_location(div4, file$1, 51, 3, 1680);
    			add_location(br8, file$1, 56, 3, 1826);
    			add_location(button1, file$1, 56, 7, 1830);
    			add_location(br9, file$1, 56, 57, 1880);
    			attr_dev(div5, "class", "container svelte-6q65hp");
    			add_location(div5, file$1, 45, 2, 1466);
    			attr_dev(div6, "class", "card svelte-6q65hp");
    			add_location(div6, file$1, 44, 1, 1445);
    			add_location(b2, file$1, 63, 4, 1960);
    			add_location(br10, file$1, 64, 4, 2040);
    			add_location(br11, file$1, 68, 5, 2257);
    			add_location(br12, file$1, 70, 5, 2392);
    			add_location(br13, file$1, 72, 5, 2527);
    			add_location(br14, file$1, 72, 9, 2531);
    			attr_dev(cite1, "class", "svelte-6q65hp");
    			add_location(cite1, file$1, 65, 4, 2049);
    			add_location(p2, file$1, 62, 3, 1952);
    			add_location(br15, file$1, 78, 46, 2797);
    			add_location(br16, file$1, 80, 5, 2857);
    			add_location(br17, file$1, 80, 9, 2861);
    			add_location(br18, file$1, 80, 41, 2893);
    			add_location(br19, file$1, 81, 64, 2962);
    			add_location(br20, file$1, 82, 64, 3031);
    			add_location(code2, file$1, 77, 4, 2744);
    			attr_dev(div7, "class", "notes svelte-6q65hp");
    			add_location(div7, file$1, 76, 3, 2720);
    			add_location(br21, file$1, 86, 3, 3126);
    			add_location(button2, file$1, 86, 7, 3130);
    			add_location(br22, file$1, 86, 57, 3180);
    			attr_dev(div8, "class", "container svelte-6q65hp");
    			add_location(div8, file$1, 61, 2, 1925);
    			attr_dev(div9, "class", "card svelte-6q65hp");
    			add_location(div9, file$1, 60, 1, 1904);
    			add_location(b3, file$1, 93, 4, 3260);
    			add_location(br23, file$1, 94, 4, 3344);
    			attr_dev(cite2, "class", "svelte-6q65hp");
    			add_location(cite2, file$1, 95, 4, 3353);
    			add_location(p3, file$1, 92, 3, 3252);
    			add_location(code3, file$1, 101, 4, 3623);
    			attr_dev(div10, "class", "notes svelte-6q65hp");
    			add_location(div10, file$1, 100, 3, 3599);
    			add_location(br24, file$1, 105, 3, 3717);
    			attr_dev(input0, "size", "10");
    			add_location(input0, file$1, 105, 7, 3721);
    			add_location(br25, file$1, 105, 43, 3757);
    			attr_dev(div11, "class", "container svelte-6q65hp");
    			add_location(div11, file$1, 91, 2, 3225);
    			attr_dev(div12, "class", "card svelte-6q65hp");
    			add_location(div12, file$1, 90, 1, 3204);
    			add_location(b4, file$1, 112, 4, 3837);
    			add_location(br26, file$1, 113, 4, 3913);
    			attr_dev(cite3, "class", "svelte-6q65hp");
    			add_location(cite3, file$1, 114, 4, 3922);
    			add_location(p4, file$1, 111, 3, 3829);
    			add_location(code4, file$1, 120, 4, 4230);
    			attr_dev(div13, "class", "notes svelte-6q65hp");
    			add_location(div13, file$1, 119, 3, 4206);
    			add_location(br27, file$1, 124, 3, 4387);
    			add_location(button3, file$1, 126, 3, 4475);
    			add_location(button4, file$1, 127, 3, 4570);
    			add_location(button5, file$1, 128, 3, 4671);
    			add_location(button6, file$1, 129, 3, 4772);
    			add_location(br28, file$1, 130, 3, 4867);
    			attr_dev(div14, "class", "container svelte-6q65hp");
    			add_location(div14, file$1, 110, 2, 3802);
    			attr_dev(div15, "class", "card svelte-6q65hp");
    			add_location(div15, file$1, 109, 1, 3781);
    			add_location(b5, file$1, 137, 4, 4947);
    			add_location(br29, file$1, 138, 4, 5026);
    			attr_dev(cite4, "class", "svelte-6q65hp");
    			add_location(cite4, file$1, 139, 4, 5035);
    			add_location(p5, file$1, 136, 3, 4939);
    			add_location(br30, file$1, 145, 44, 5199);
    			add_location(br31, file$1, 146, 77, 5281);
    			add_location(br32, file$1, 147, 49, 5335);
    			add_location(br33, file$1, 148, 84, 5424);
    			add_location(br34, file$1, 149, 50, 5479);
    			add_location(br35, file$1, 150, 84, 5568);
    			add_location(br36, file$1, 151, 26, 5599);
    			add_location(br37, file$1, 152, 77, 5681);
    			add_location(code5, file$1, 144, 4, 5148);
    			attr_dev(div16, "class", "notes svelte-6q65hp");
    			add_location(div16, file$1, 143, 3, 5124);
    			add_location(br38, file$1, 156, 3, 5736);
    			add_location(br39, file$1, 166, 3, 5999);
    			attr_dev(input1, "size", "10");
    			add_location(input1, file$1, 166, 7, 6003);
    			add_location(br40, file$1, 166, 43, 6039);
    			attr_dev(div17, "class", "container svelte-6q65hp");
    			add_location(div17, file$1, 135, 2, 4912);
    			attr_dev(div18, "class", "card svelte-6q65hp");
    			add_location(div18, file$1, 134, 1, 4891);
    			add_location(b6, file$1, 173, 4, 6119);
    			add_location(br41, file$1, 174, 4, 6170);
    			attr_dev(cite5, "class", "svelte-6q65hp");
    			add_location(cite5, file$1, 175, 4, 6179);
    			add_location(p6, file$1, 172, 3, 6111);
    			add_location(br42, file$1, 181, 79, 6420);
    			add_location(br43, file$1, 183, 5, 6496);
    			add_location(br44, file$1, 183, 9, 6500);
    			add_location(br45, file$1, 183, 41, 6532);
    			add_location(br46, file$1, 184, 44, 6581);
    			add_location(br47, file$1, 185, 28, 6614);
    			add_location(br48, file$1, 186, 98, 6717);
    			add_location(br49, file$1, 187, 99, 6821);
    			add_location(br50, file$1, 188, 50, 6876);
    			add_location(br51, file$1, 189, 49, 6930);
    			add_location(br52, file$1, 190, 28, 6963);
    			add_location(br53, file$1, 191, 99, 7067);
    			add_location(br54, file$1, 192, 100, 7172);
    			add_location(br55, file$1, 193, 51, 7228);
    			add_location(br56, file$1, 194, 50, 7283);
    			add_location(br57, file$1, 195, 28, 7316);
    			add_location(br58, file$1, 196, 98, 7419);
    			add_location(br59, file$1, 197, 99, 7523);
    			add_location(br60, file$1, 198, 51, 7579);
    			add_location(br61, file$1, 199, 26, 7610);
    			add_location(br62, file$1, 200, 28, 7643);
    			add_location(br63, file$1, 201, 105, 7753);
    			add_location(br64, file$1, 202, 107, 7865);
    			add_location(br65, file$1, 203, 50, 7920);
    			add_location(br66, file$1, 204, 24, 7949);
    			add_location(code6, file$1, 180, 4, 6334);
    			attr_dev(div19, "class", "notes svelte-6q65hp");
    			add_location(div19, file$1, 179, 3, 6310);
    			add_location(br67, file$1, 207, 3, 7979);
    			add_location(button7, file$1, 208, 3, 7987);
    			add_location(button8, file$1, 209, 3, 8073);
    			add_location(button9, file$1, 210, 3, 8163);
    			add_location(button10, file$1, 211, 3, 8252);
    			add_location(br68, file$1, 212, 3, 8337);
    			add_location(br69, file$1, 234, 3, 8917);
    			attr_dev(div20, "class", "container svelte-6q65hp");
    			add_location(div20, file$1, 171, 2, 6084);
    			attr_dev(div21, "class", "card svelte-6q65hp");
    			add_location(div21, file$1, 170, 1, 6063);
    			add_location(button11, file$1, 241, 1, 9019);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, p0);
    			append_dev(p0, b0);
    			append_dev(b0, t3);
    			append_dev(b0, t4);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, code0);
    			append_dev(code0, t6);
    			append_dev(code0, br1);
    			append_dev(code0, t7);
    			append_dev(code0, br2);
    			append_dev(code0, br3);
    			append_dev(code0, t8);
    			append_dev(code0, br4);
    			append_dev(code0, t9);
    			append_dev(div2, t10);
    			append_dev(div2, br5);
    			append_dev(div2, button0);
    			append_dev(div2, br6);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div5);
    			append_dev(div5, p1);
    			append_dev(p1, b1);
    			append_dev(b1, t13);
    			append_dev(b1, t14);
    			append_dev(p1, t15);
    			append_dev(p1, br7);
    			append_dev(p1, t16);
    			append_dev(p1, cite0);
    			append_dev(div5, t18);
    			append_dev(div5, div4);
    			append_dev(div4, code1);
    			append_dev(div5, t20);
    			append_dev(div5, br8);
    			append_dev(div5, button1);
    			append_dev(div5, br9);
    			insert_dev(target, t22, anchor);
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div8);
    			append_dev(div8, p2);
    			append_dev(p2, b2);
    			append_dev(b2, t23);
    			append_dev(b2, t24);
    			append_dev(b2, t25);
    			append_dev(b2, t26);
    			append_dev(b2, t27);
    			append_dev(b2, t28);
    			append_dev(b2, t29);
    			append_dev(b2, t30);
    			append_dev(p2, t31);
    			append_dev(p2, br10);
    			append_dev(p2, t32);
    			append_dev(p2, cite1);
    			append_dev(cite1, t33);
    			append_dev(cite1, br11);
    			append_dev(cite1, t34);
    			append_dev(cite1, br12);
    			append_dev(cite1, t35);
    			append_dev(cite1, br13);
    			append_dev(cite1, br14);
    			append_dev(cite1, t36);
    			append_dev(div8, t37);
    			append_dev(div8, div7);
    			append_dev(div7, code2);
    			append_dev(code2, t38);
    			append_dev(code2, br15);
    			append_dev(code2, t39);
    			append_dev(code2, br16);
    			append_dev(code2, br17);
    			append_dev(code2, t40);
    			append_dev(code2, br18);
    			append_dev(code2, t41);
    			append_dev(code2, br19);
    			append_dev(code2, t42);
    			append_dev(code2, br20);
    			append_dev(code2, t43);
    			append_dev(div8, t44);
    			append_dev(div8, br21);
    			append_dev(div8, button2);
    			append_dev(div8, br22);
    			insert_dev(target, t46, anchor);
    			insert_dev(target, div12, anchor);
    			append_dev(div12, div11);
    			append_dev(div11, p3);
    			append_dev(p3, b3);
    			append_dev(b3, t47);
    			append_dev(b3, t48);
    			append_dev(p3, t49);
    			append_dev(p3, br23);
    			append_dev(p3, t50);
    			append_dev(p3, cite2);
    			append_dev(div11, t52);
    			append_dev(div11, div10);
    			append_dev(div10, code3);
    			append_dev(div11, t54);
    			append_dev(div11, br24);
    			append_dev(div11, input0);
    			set_input_value(input0, /*rando*/ ctx[0]);
    			append_dev(div11, br25);
    			insert_dev(target, t55, anchor);
    			insert_dev(target, div15, anchor);
    			append_dev(div15, div14);
    			append_dev(div14, p4);
    			append_dev(p4, b4);
    			append_dev(b4, t56);
    			append_dev(b4, t57);
    			append_dev(p4, t58);
    			append_dev(p4, br26);
    			append_dev(p4, t59);
    			append_dev(p4, cite3);
    			append_dev(div14, t61);
    			append_dev(div14, div13);
    			append_dev(div13, code4);
    			append_dev(div14, t63);
    			append_dev(div14, br27);
    			append_dev(div14, t64);
    			append_dev(div14, button3);
    			append_dev(div14, t66);
    			append_dev(div14, button4);
    			append_dev(div14, t68);
    			append_dev(div14, button5);
    			append_dev(div14, t70);
    			append_dev(div14, button6);
    			append_dev(div14, t72);
    			append_dev(div14, br28);
    			insert_dev(target, t73, anchor);
    			insert_dev(target, div18, anchor);
    			append_dev(div18, div17);
    			append_dev(div17, p5);
    			append_dev(p5, b5);
    			append_dev(p5, t75);
    			append_dev(p5, br29);
    			append_dev(p5, t76);
    			append_dev(p5, cite4);
    			append_dev(div17, t78);
    			append_dev(div17, div16);
    			append_dev(div16, code5);
    			append_dev(code5, t79);
    			append_dev(code5, br30);
    			append_dev(code5, t80);
    			append_dev(code5, br31);
    			append_dev(code5, t81);
    			append_dev(code5, br32);
    			append_dev(code5, t82);
    			append_dev(code5, br33);
    			append_dev(code5, t83);
    			append_dev(code5, br34);
    			append_dev(code5, t84);
    			append_dev(code5, br35);
    			append_dev(code5, t85);
    			append_dev(code5, br36);
    			append_dev(code5, t86);
    			append_dev(code5, br37);
    			append_dev(code5, t87);
    			append_dev(div17, t88);
    			append_dev(div17, br38);
    			append_dev(div17, t89);
    			if_block0.m(div17, null);
    			append_dev(div17, t90);
    			append_dev(div17, br39);
    			append_dev(div17, input1);
    			set_input_value(input1, /*rando*/ ctx[0]);
    			append_dev(div17, br40);
    			insert_dev(target, t91, anchor);
    			insert_dev(target, div21, anchor);
    			append_dev(div21, div20);
    			append_dev(div20, p6);
    			append_dev(p6, b6);
    			append_dev(p6, t93);
    			append_dev(p6, br41);
    			append_dev(p6, t94);
    			append_dev(p6, cite5);
    			append_dev(div20, t96);
    			append_dev(div20, div19);
    			append_dev(div19, code6);
    			append_dev(code6, t97);
    			append_dev(code6, br42);
    			append_dev(code6, t98);
    			append_dev(code6, br43);
    			append_dev(code6, br44);
    			append_dev(code6, t99);
    			append_dev(code6, br45);
    			append_dev(code6, t100);
    			append_dev(code6, br46);
    			append_dev(code6, t101);
    			append_dev(code6, br47);
    			append_dev(code6, t102);
    			append_dev(code6, br48);
    			append_dev(code6, t103);
    			append_dev(code6, br49);
    			append_dev(code6, t104);
    			append_dev(code6, br50);
    			append_dev(code6, t105);
    			append_dev(code6, br51);
    			append_dev(code6, t106);
    			append_dev(code6, br52);
    			append_dev(code6, t107);
    			append_dev(code6, br53);
    			append_dev(code6, t108);
    			append_dev(code6, br54);
    			append_dev(code6, t109);
    			append_dev(code6, br55);
    			append_dev(code6, t110);
    			append_dev(code6, br56);
    			append_dev(code6, t111);
    			append_dev(code6, br57);
    			append_dev(code6, t112);
    			append_dev(code6, br58);
    			append_dev(code6, t113);
    			append_dev(code6, br59);
    			append_dev(code6, t114);
    			append_dev(code6, br60);
    			append_dev(code6, t115);
    			append_dev(code6, br61);
    			append_dev(code6, t116);
    			append_dev(code6, br62);
    			append_dev(code6, t117);
    			append_dev(code6, br63);
    			append_dev(code6, t118);
    			append_dev(code6, br64);
    			append_dev(code6, t119);
    			append_dev(code6, br65);
    			append_dev(code6, t120);
    			append_dev(code6, br66);
    			append_dev(div20, t121);
    			append_dev(div20, br67);
    			append_dev(div20, t122);
    			append_dev(div20, button7);
    			append_dev(div20, t124);
    			append_dev(div20, button8);
    			append_dev(div20, t126);
    			append_dev(div20, button9);
    			append_dev(div20, t128);
    			append_dev(div20, button10);
    			append_dev(div20, t130);
    			append_dev(div20, br68);
    			append_dev(div20, t131);
    			if_blocks[current_block_type_index].m(div20, null);
    			append_dev(div20, t132);
    			append_dev(div20, br69);
    			insert_dev(target, t133, anchor);
    			insert_dev(target, button11, anchor);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button0, "click", /*setRando*/ ctx[2], false, false, false),
    				listen_dev(button1, "click", /*setRando*/ ctx[2], false, false, false),
    				listen_dev(button2, "click", /*setRando*/ ctx[2], false, false, false),
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[4]),
    				listen_dev(button3, "click", /*click_handler*/ ctx[5], false, false, false),
    				listen_dev(button4, "click", /*click_handler_1*/ ctx[6], false, false, false),
    				listen_dev(button5, "click", /*click_handler_2*/ ctx[7], false, false, false),
    				listen_dev(button6, "click", /*click_handler_3*/ ctx[8], false, false, false),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[9]),
    				listen_dev(button7, "click", /*click_handler_4*/ ctx[10], false, false, false),
    				listen_dev(button8, "click", /*click_handler_5*/ ctx[11], false, false, false),
    				listen_dev(button9, "click", /*click_handler_6*/ ctx[12], false, false, false),
    				listen_dev(button10, "click", /*click_handler_7*/ ctx[13], false, false, false),
    				listen_dev(button11, "click", /*setRando*/ ctx[2], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*rando*/ 1) set_data_dev(t4, /*rando*/ ctx[0]);
    			if ((!current || dirty & /*rando*/ 1) && t14_value !== (t14_value = (Math.round(/*rando*/ ctx[0]) ? "🤗" : "👻") + "")) set_data_dev(t14, t14_value);
    			if (!current || dirty & /*result*/ 2) set_data_dev(t24, /*result*/ ctx[1]);
    			if (!current || dirty & /*result*/ 2) set_data_dev(t26, /*result*/ ctx[1]);
    			if (!current || dirty & /*result*/ 2) set_data_dev(t28, /*result*/ ctx[1]);
    			if (!current || dirty & /*result*/ 2) set_data_dev(t30, /*result*/ ctx[1]);
    			if ((!current || dirty & /*rando*/ 1) && t48_value !== (t48_value = (Math.round(/*rando*/ ctx[0]) ? "🤗" : "👻") + "")) set_data_dev(t48, t48_value);

    			if (dirty & /*rando*/ 1 && input0.value !== /*rando*/ ctx[0]) {
    				set_input_value(input0, /*rando*/ ctx[0]);
    			}

    			if ((!current || dirty & /*rando*/ 1) && t57_value !== (t57_value = (Math.round(/*rando*/ ctx[0]) ? "🤗" : "👻") + "")) set_data_dev(t57, t57_value);

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div17, t90);
    				}
    			}

    			if (dirty & /*rando*/ 1 && input1.value !== /*rando*/ ctx[0]) {
    				set_input_value(input1, /*rando*/ ctx[0]);
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div20, t132);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(div6);
    			if (detaching) detach_dev(t22);
    			if (detaching) detach_dev(div9);
    			if (detaching) detach_dev(t46);
    			if (detaching) detach_dev(div12);
    			if (detaching) detach_dev(t55);
    			if (detaching) detach_dev(div15);
    			if (detaching) detach_dev(t73);
    			if (detaching) detach_dev(div18);
    			if_block0.d();
    			if (detaching) detach_dev(t91);
    			if (detaching) detach_dev(div21);
    			if_blocks[current_block_type_index].d();
    			if (detaching) detach_dev(t133);
    			if (detaching) detach_dev(button11);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function genRandom(min, max) {
    	return Math.random() * (max - min) + min;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let rando = 0;

    	function setRando() {
    		// Create a function to randomly populate our private variable.
    		$$invalidate(0, rando = Math.random());
    	}

    	function setRandoVal(val) {
    		$$invalidate(0, rando = val);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<One> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("One", $$slots, []);

    	function input0_input_handler() {
    		rando = this.value;
    		$$invalidate(0, rando);
    	}

    	const click_handler = () => setRandoVal(genRandom(0.76, 1));
    	const click_handler_1 = () => setRandoVal(genRandom(0.5, 0.75));
    	const click_handler_2 = () => setRandoVal(genRandom(0.25, 0.49));
    	const click_handler_3 = () => setRandoVal(genRandom(0, 0.24));

    	function input1_input_handler() {
    		rando = this.value;
    		$$invalidate(0, rando);
    	}

    	const click_handler_4 = () => setRandoVal(genRandom(0.76, 1));
    	const click_handler_5 = () => setRandoVal(genRandom(0.51, 0.74));
    	const click_handler_6 = () => setRandoVal(genRandom(0.26, 0.49));
    	const click_handler_7 = () => setRandoVal(genRandom(0, 0.24));

    	$$self.$capture_state = () => ({
    		fade,
    		slide,
    		blur,
    		fly,
    		rando,
    		setRando,
    		setRandoVal,
    		genRandom,
    		result
    	});

    	$$self.$inject_state = $$props => {
    		if ("rando" in $$props) $$invalidate(0, rando = $$props.rando);
    		if ("result" in $$props) $$invalidate(1, result = $$props.result);
    	};

    	let result;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*rando*/ 1) {
    			// Here we are defining the computed value using '$'. This will tell Svelte to calculate this value when this app reacts. Result stored here would be a string containing the emoji.
    			 $$invalidate(1, result = Math.round(rando) ? "🤗" : "👻");
    		}
    	};

    	return [
    		rando,
    		result,
    		setRando,
    		setRandoVal,
    		input0_input_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		input1_input_handler,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7
    	];
    }

    class One extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "One",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/components/Two.svelte generated by Svelte v3.22.2 */

    const file$2 = "src/components/Two.svelte";

    function create_fragment$2(ctx) {
    	let div0;
    	let t1;
    	let br;
    	let t2;
    	let div4;
    	let div1;
    	let t4;
    	let div2;
    	let t6;
    	let div3;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div0.textContent = "Moar stuff on using Svelte :P";
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			div4 = element("div");
    			div1 = element("div");
    			div1.textContent = "1";
    			t4 = space();
    			div2 = element("div");
    			div2.textContent = "2";
    			t6 = space();
    			div3 = element("div");
    			div3.textContent = "3";
    			attr_dev(div0, "class", "text-orange-700 italic text-base md:text-xl");
    			add_location(div0, file$2, 4, 0, 21);
    			add_location(br, file$2, 7, 0, 117);
    			attr_dev(div1, "class", "text-gray-700 text-center bg-gray-400 px-4 py-2 m-2");
    			add_location(div1, file$2, 10, 2, 169);
    			attr_dev(div2, "class", "text-gray-700 text-center bg-gray-400 px-4 py-2 m-2");
    			add_location(div2, file$2, 11, 2, 244);
    			attr_dev(div3, "class", "text-gray-700 text-center bg-gray-400 px-4 py-2 m-2");
    			add_location(div3, file$2, 12, 2, 319);
    			attr_dev(div4, "class", "flex flex-col bg-gray-200 m-5");
    			add_location(div4, file$2, 9, 0, 123);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div1);
    			append_dev(div4, t4);
    			append_dev(div4, div2);
    			append_dev(div4, t6);
    			append_dev(div4, div3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Two> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Two", $$slots, []);
    	return [];
    }

    class Two extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Two",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Three.svelte generated by Svelte v3.22.2 */

    const file$3 = "src/components/Three.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let t1;
    	let br;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "This is page three.";
    			t1 = space();
    			br = element("br");
    			attr_dev(div, "class", "text-orange-700 italic text-base md:text-xl");
    			add_location(div, file$3, 5, 0, 22);
    			add_location(br, file$3, 8, 0, 109);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Three> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Three", $$slots, []);
    	return [];
    }

    class Three extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Three",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    // ^ svelte/store here, simplifies  the creation of an object with a subscribe method.
    // This allows interested parties to be notified whenever the store value changes.
    // Objects created using store acts as a single source of truth that any Svelte Component can subscribe to, access(view) or even update it.

    // The constant router variable here will act as an index for the available routes in our app.
    const router = {
      '/': Home,
      '/one': One,
      '/two': Two,
      '/three': Three
    };

    // Do not get confused! The const here is referring to the curRoute object created from the writable function.
    // So the object is a constant. But the value that contains it i.e. '/' or 'one' or etc.. can be changed.
    // To see how the value is being set after initialization, refer to RouterLink.svelte.
    const curRoute = writable('/');
    // This is to capture and set a constant variable containing the primary/main URL for the applicaton.
    // Used for updating the history in RouterLink.svelte, such that the URL path will always be the same as the landing URL.
    const originalPath = window.location.href;

    /* src/routes/RouterLink.svelte generated by Svelte v3.22.2 */
    const file$4 = "src/routes/RouterLink.svelte";

    function create_fragment$4(ctx) {
    	let a;
    	let t_value = /*page*/ ctx[0].name + "";
    	let t;
    	let a_href_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = /*page*/ ctx[0].path);
    			add_location(a, file$4, 16, 0, 690);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    			if (remount) dispose();
    			dispose = listen_dev(a, "click", prevent_default(/*redirectTo*/ ctx[1]), false, true, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*page*/ 1 && t_value !== (t_value = /*page*/ ctx[0].name + "")) set_data_dev(t, t_value);

    			if (dirty & /*page*/ 1 && a_href_value !== (a_href_value = /*page*/ ctx[0].path)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { page = { path: "/", name: "Home" } } = $$props;

    	// ^ Here we specify the variables to take into this component when being called in App.svelte.
    	function redirectTo(event) {
    		// Method for redirecting the page.
    		// change current router path  
    		curRoute.set(event.target.pathname);

    		// push the path into web browser history API  
    		// Note that 'page.path' contains where we were previously. But since we do not want any changes to URL directory
    		// in the browser, we just put 'window.location.href' a.k.a. 'originalPath' as our third parameter.
    		window.history.pushState({ path: page.path }, "", originalPath);
    	}

    	const writable_props = ["page"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<RouterLink> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("RouterLink", $$slots, []);

    	$$self.$set = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    	};

    	$$self.$capture_state = () => ({ curRoute, originalPath, page, redirectTo });

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page, redirectTo];
    }

    class RouterLink extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { page: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RouterLink",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get page() {
    		throw new Error("<RouterLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set page(value) {
    		throw new Error("<RouterLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.22.2 */
    const file$5 = "src/App.svelte";

    function create_fragment$5(ctx) {
    	let main;
    	let h1;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let div0;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let br;
    	let t8;
    	let div1;
    	let current;
    	let dispose;

    	const routerlink0 = new RouterLink({
    			props: { page: { path: "/", name: "Home" } },
    			$$inline: true
    		});

    	const routerlink1 = new RouterLink({
    			props: { page: { path: "/one", name: "Page One" } },
    			$$inline: true
    		});

    	const routerlink2 = new RouterLink({
    			props: { page: { path: "/two", name: "Page Two" } },
    			$$inline: true
    		});

    	const routerlink3 = new RouterLink({
    			props: {
    				page: { path: "/three", name: "Page Three" }
    			},
    			$$inline: true
    		});

    	var switch_value = router[/*$curRoute*/ ctx[1]];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			t0 = text("Hello ");
    			t1 = text(/*name*/ ctx[0]);
    			t2 = text("!");
    			t3 = space();
    			div0 = element("div");
    			create_component(routerlink0.$$.fragment);
    			t4 = text("  |  \n\t\t");
    			create_component(routerlink1.$$.fragment);
    			t5 = text("  |  \n\t\t");
    			create_component(routerlink2.$$.fragment);
    			t6 = text("  |  \n\t\t");
    			create_component(routerlink3.$$.fragment);
    			t7 = space();
    			br = element("br");
    			t8 = space();
    			div1 = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr_dev(h1, "class", "uppercase font-hairline m-0 p-4 text-red-600 text-5xl md:text-6xl lg:text-6xl");
    			add_location(h1, file$5, 29, 1, 1081);
    			attr_dev(div0, "class", "font-medium text-red-800 text-sm md:text-base lg:text-base pl-4 pr-4");
    			add_location(div0, file$5, 30, 1, 1191);
    			add_location(br, file$5, 36, 1, 1583);
    			attr_dev(div1, "id", "pageContent");
    			add_location(div1, file$5, 37, 1, 1589);
    			attr_dev(main, "class", "text-center px-1 m-0 svelte-1w5elwo");
    			add_location(main, file$5, 28, 0, 1044);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(main, t3);
    			append_dev(main, div0);
    			mount_component(routerlink0, div0, null);
    			append_dev(div0, t4);
    			mount_component(routerlink1, div0, null);
    			append_dev(div0, t5);
    			mount_component(routerlink2, div0, null);
    			append_dev(div0, t6);
    			mount_component(routerlink3, div0, null);
    			append_dev(main, t7);
    			append_dev(main, br);
    			append_dev(main, t8);
    			append_dev(main, div1);

    			if (switch_instance) {
    				mount_component(switch_instance, div1, null);
    			}

    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(window, "popstate", /*handlerBackNavigation*/ ctx[2], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*name*/ 1) set_data_dev(t1, /*name*/ ctx[0]);

    			if (switch_value !== (switch_value = router[/*$curRoute*/ ctx[1]])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div1, null);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(routerlink0.$$.fragment, local);
    			transition_in(routerlink1.$$.fragment, local);
    			transition_in(routerlink2.$$.fragment, local);
    			transition_in(routerlink3.$$.fragment, local);
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(routerlink0.$$.fragment, local);
    			transition_out(routerlink1.$$.fragment, local);
    			transition_out(routerlink2.$$.fragment, local);
    			transition_out(routerlink3.$$.fragment, local);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(routerlink0);
    			destroy_component(routerlink1);
    			destroy_component(routerlink2);
    			destroy_component(routerlink3);
    			if (switch_instance) destroy_component(switch_instance);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $curRoute;
    	validate_store(curRoute, "curRoute");
    	component_subscribe($$self, curRoute, $$value => $$invalidate(1, $curRoute = $$value));

    	function handlerBackNavigation(event) {
    		if (!event || !event.state || !event.state.path) {
    			curRoute.set("/"); // If null, go back to main page.
    		} else {
    			curRoute.set(event.state.path);
    		}
    	}

    	let { name } = $$props;
    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		router,
    		curRoute,
    		RouterLink,
    		handlerBackNavigation,
    		name,
    		$curRoute
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, $curRoute, handlerBackNavigation];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'svelte'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
