
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
    			attr_dev(h2, "class", "text-red-500 text-xs italic");
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

    // (160:3) {:else}
    function create_else_block_1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Value is less than 0.25.";
    			add_location(p, file$1, 160, 4, 5843);
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
    		source: "(160:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (158:27) 
    function create_if_block_5(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Value ranges from 0.25 to 0.49.";
    			add_location(p, file$1, 158, 4, 5789);
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
    		source: "(158:27) ",
    		ctx
    	});

    	return block;
    }

    // (156:26) 
    function create_if_block_4(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Value ranges from 0.50 to 0.75.";
    			add_location(p, file$1, 156, 4, 5718);
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
    		source: "(156:26) ",
    		ctx
    	});

    	return block;
    }

    // (154:3) {#if rando > 0.75}
    function create_if_block_3(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Value is more than 0.75.";
    			add_location(p, file$1, 154, 4, 5655);
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
    		source: "(154:3) {#if rando > 0.75}",
    		ctx
    	});

    	return block;
    }

    // (225:3) {:else}
    function create_else_block(ctx) {
    	let p;
    	let p_intro;
    	let p_outro;
    	let current;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Flying";
    			add_location(p, file$1, 225, 4, 8668);
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
    		source: "(225:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (220:27) 
    function create_if_block_2(ctx) {
    	let p;
    	let p_intro;
    	let p_outro;
    	let current;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Bluring";
    			add_location(p, file$1, 220, 4, 8542);
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
    		source: "(220:27) ",
    		ctx
    	});

    	return block;
    }

    // (215:26) 
    function create_if_block_1(ctx) {
    	let p;
    	let p_intro;
    	let p_outro;
    	let current;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Sliding";
    			add_location(p, file$1, 215, 4, 8397);
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
    		source: "(215:26) ",
    		ctx
    	});

    	return block;
    }

    // (210:3) {#if rando > 0.75}
    function create_if_block(ctx) {
    	let p;
    	let p_intro;
    	let p_outro;
    	let current;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Fading";
    			add_location(p, file$1, 210, 4, 8256);
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
    		source: "(210:3) {#if rando > 0.75}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div2;
    	let div1;
    	let p0;
    	let b0;
    	let t0;
    	let t1;
    	let t2;
    	let div0;
    	let code0;
    	let t3;
    	let br0;
    	let t4;
    	let br1;
    	let br2;
    	let t5;
    	let br3;
    	let t6;
    	let t7;
    	let br4;
    	let button0;
    	let br5;
    	let t9;
    	let div5;
    	let div4;
    	let p1;
    	let b1;
    	let t10;
    	let t11_value = (Math.round(/*rando*/ ctx[0]) ? "🤗" : "👻") + "";
    	let t11;
    	let t12;
    	let br6;
    	let t13;
    	let cite0;
    	let t15;
    	let div3;
    	let code1;
    	let t17;
    	let br7;
    	let button1;
    	let br8;
    	let t19;
    	let div8;
    	let div7;
    	let p2;
    	let b2;
    	let t20;
    	let t21;
    	let t22;
    	let t23;
    	let t24;
    	let t25;
    	let t26;
    	let t27;
    	let t28;
    	let br9;
    	let t29;
    	let cite1;
    	let t30;
    	let br10;
    	let t31;
    	let br11;
    	let t32;
    	let br12;
    	let br13;
    	let t33;
    	let t34;
    	let div6;
    	let code2;
    	let t35;
    	let br14;
    	let t36;
    	let br15;
    	let br16;
    	let t37;
    	let br17;
    	let t38;
    	let br18;
    	let t39;
    	let br19;
    	let t40;
    	let t41;
    	let br20;
    	let button2;
    	let br21;
    	let t43;
    	let div11;
    	let div10;
    	let p3;
    	let b3;
    	let t44;
    	let t45_value = (Math.round(/*rando*/ ctx[0]) ? "🤗" : "👻") + "";
    	let t45;
    	let t46;
    	let br22;
    	let t47;
    	let cite2;
    	let t49;
    	let div9;
    	let code3;
    	let t51;
    	let br23;
    	let input0;
    	let br24;
    	let t52;
    	let div14;
    	let div13;
    	let p4;
    	let b4;
    	let t53;
    	let t54_value = (Math.round(/*rando*/ ctx[0]) ? "🤗" : "👻") + "";
    	let t54;
    	let t55;
    	let br25;
    	let t56;
    	let cite3;
    	let t58;
    	let div12;
    	let code4;
    	let t60;
    	let br26;
    	let t61;
    	let button3;
    	let t63;
    	let button4;
    	let t65;
    	let button5;
    	let t67;
    	let button6;
    	let t69;
    	let br27;
    	let t70;
    	let div17;
    	let div16;
    	let p5;
    	let b5;
    	let t72;
    	let br28;
    	let t73;
    	let cite4;
    	let t75;
    	let div15;
    	let code5;
    	let t76;
    	let br29;
    	let t77;
    	let br30;
    	let t78;
    	let br31;
    	let t79;
    	let br32;
    	let t80;
    	let br33;
    	let t81;
    	let br34;
    	let t82;
    	let br35;
    	let t83;
    	let br36;
    	let t84;
    	let t85;
    	let br37;
    	let t86;
    	let t87;
    	let br38;
    	let input1;
    	let br39;
    	let t88;
    	let div20;
    	let div19;
    	let p6;
    	let b6;
    	let t90;
    	let br40;
    	let t91;
    	let cite5;
    	let t93;
    	let div18;
    	let code6;
    	let t94;
    	let br41;
    	let t95;
    	let br42;
    	let br43;
    	let t96;
    	let br44;
    	let t97;
    	let br45;
    	let t98;
    	let br46;
    	let t99;
    	let br47;
    	let t100;
    	let br48;
    	let t101;
    	let br49;
    	let t102;
    	let br50;
    	let t103;
    	let br51;
    	let t104;
    	let br52;
    	let t105;
    	let br53;
    	let t106;
    	let br54;
    	let t107;
    	let br55;
    	let t108;
    	let br56;
    	let t109;
    	let br57;
    	let t110;
    	let br58;
    	let t111;
    	let br59;
    	let t112;
    	let br60;
    	let t113;
    	let br61;
    	let t114;
    	let br62;
    	let t115;
    	let br63;
    	let t116;
    	let br64;
    	let t117;
    	let br65;
    	let t118;
    	let br66;
    	let t119;
    	let button7;
    	let t121;
    	let button8;
    	let t123;
    	let button9;
    	let t125;
    	let button10;
    	let t127;
    	let br67;
    	let t128;
    	let current_block_type_index;
    	let if_block1;
    	let t129;
    	let br68;
    	let t130;
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
    			div2 = element("div");
    			div1 = element("div");
    			p0 = element("p");
    			b0 = element("b");
    			t0 = text("1. Just outputting a simple private variable: ");
    			t1 = text(/*rando*/ ctx[0]);
    			t2 = space();
    			div0 = element("div");
    			code0 = element("code");
    			t3 = text("-- Done in the script portion.");
    			br0 = element("br");
    			t4 = text("\n\t\t\t\t\tlet rando = 0;\n\t\t\t\t\t");
    			br1 = element("br");
    			br2 = element("br");
    			t5 = text("-- Done in the html portion.");
    			br3 = element("br");
    			t6 = text("\n\t\t\t\t\tJust outputting a simple private variable: { rando }");
    			t7 = space();
    			br4 = element("br");
    			button0 = element("button");
    			button0.textContent = "Randomize me!";
    			br5 = element("br");
    			t9 = space();
    			div5 = element("div");
    			div4 = element("div");
    			p1 = element("p");
    			b1 = element("b");
    			t10 = text("2. Adding logic to our random output: ");
    			t11 = text(t11_value);
    			t12 = space();
    			br6 = element("br");
    			t13 = space();
    			cite0 = element("cite");
    			cite0.textContent = "If it rounds to 1 its a winner, if it rounds to 0 its a loser.";
    			t15 = space();
    			div3 = element("div");
    			code1 = element("code");
    			code1.textContent = "Adding logic to our random output: { Math.round(rando) ? '🤗' : '👻' }";
    			t17 = space();
    			br7 = element("br");
    			button1 = element("button");
    			button1.textContent = "Randomize me!";
    			br8 = element("br");
    			t19 = space();
    			div8 = element("div");
    			div7 = element("div");
    			p2 = element("p");
    			b2 = element("b");
    			t20 = text("3. Simplifying code reuse: ");
    			t21 = text(/*result*/ ctx[1]);
    			t22 = text(" | ");
    			t23 = text(/*result*/ ctx[1]);
    			t24 = text(" | ");
    			t25 = text(/*result*/ ctx[1]);
    			t26 = text(" | ");
    			t27 = text(/*result*/ ctx[1]);
    			t28 = space();
    			br9 = element("br");
    			t29 = space();
    			cite1 = element("cite");
    			t30 = text("Unfortunately, the above code in 2 is not going to scale very well. If you want to show that same value somewhere else in the page,\n\t\t\t\t\tyou will have to duplicate the logic everywhere. i.e.\n\t\t\t\t\t");
    			br10 = element("br");
    			t31 = text("\n\t\t\t\t\t‹p›Adding logic to our random output: { Math.round(rando) ? '🤗' : '👻' }‹/p›\n\t\t\t\t\t");
    			br11 = element("br");
    			t32 = text("\n\t\t\t\t\t‹p›Adding logic to our random output: { Math.round(rando) ? '🤗' : '👻' }‹/p›\n\t\t\t\t\t");
    			br12 = element("br");
    			br13 = element("br");
    			t33 = text("\n\t\t\t\t\tBest way for such situations would be to define the computed value using '$'. This will tell Svelte to calculate this value when the value 'rando' changes.");
    			t34 = space();
    			div6 = element("div");
    			code2 = element("code");
    			t35 = text("-- Done in the script portion, just once.");
    			br14 = element("br");
    			t36 = text("\n\t\t\t\t\t$: result = Math.round(rando) ? '🤗' : '👻';\n\t\t\t\t\t");
    			br15 = element("br");
    			br16 = element("br");
    			t37 = text("-- Done in the html portion.");
    			br17 = element("br");
    			t38 = text("\n\t\t\t\t\t‹p›{ result }‹/p›");
    			br18 = element("br");
    			t39 = text("\n\t\t\t\t\t‹p›{ result }‹/p›");
    			br19 = element("br");
    			t40 = text("\n\t\t\t\t\t‹p›{ result }‹/p›");
    			t41 = space();
    			br20 = element("br");
    			button2 = element("button");
    			button2.textContent = "Randomize me!";
    			br21 = element("br");
    			t43 = space();
    			div11 = element("div");
    			div10 = element("div");
    			p3 = element("p");
    			b3 = element("b");
    			t44 = text("4. Binding attributes to DOM elements: ");
    			t45 = text(t45_value);
    			t46 = space();
    			br22 = element("br");
    			t47 = space();
    			cite2 = element("cite");
    			cite2.textContent = "For instance, we want to bind the 'rando' variable to the value of a form input, we can do it like so.\n\t\t\t\t\tThis will directly change the value of the variable whenever the value of the given input box changes.";
    			t49 = space();
    			div9 = element("div");
    			code3 = element("code");
    			code3.textContent = "‹input bind:value={ rando }›";
    			t51 = space();
    			br23 = element("br");
    			input0 = element("input");
    			br24 = element("br");
    			t52 = space();
    			div14 = element("div");
    			div13 = element("div");
    			p4 = element("p");
    			b4 = element("b");
    			t53 = text("5. Advance on:event directive: ");
    			t54 = text(t54_value);
    			t55 = space();
    			br25 = element("br");
    			t56 = space();
    			cite3 = element("cite");
    			cite3.textContent = "We can set value directly to a variable using the on:event directive by forwarding DOM events. Here we are randomly\n\t\t\t\t\tgenerating a number between the min and max values specified in the function parameters and setting it to the 'rando' variable.";
    			t58 = space();
    			div12 = element("div");
    			code4 = element("code");
    			code4.textContent = "‹button on:click={() => setVal(genRandom(0.51, 0.74))}›Btw 0.76 to 1‹/button›";
    			t60 = space();
    			br26 = element("br");
    			t61 = space();
    			button3 = element("button");
    			button3.textContent = "Btw 0.76 to 1";
    			t63 = space();
    			button4 = element("button");
    			button4.textContent = "Btw 0.50 to 0.75";
    			t65 = space();
    			button5 = element("button");
    			button5.textContent = "Btw 0.25 to 0.49";
    			t67 = space();
    			button6 = element("button");
    			button6.textContent = "Btw 0 to 0.24";
    			t69 = space();
    			br27 = element("br");
    			t70 = space();
    			div17 = element("div");
    			div16 = element("div");
    			p5 = element("p");
    			b5 = element("b");
    			b5.textContent = "6. Dynamically changing page template using if-else if-else syntax.";
    			t72 = space();
    			br28 = element("br");
    			t73 = space();
    			cite4 = element("cite");
    			cite4.textContent = "Think JSP Standard Tag Library (JSTL) but for Svelte.";
    			t75 = space();
    			div15 = element("div");
    			code5 = element("code");
    			t76 = text("{#if rando › 0.75}");
    			br29 = element("br");
    			t77 = text("\n\t\t\t\t\t\t  ‹p›Value is more than 0.75.‹/p›");
    			br30 = element("br");
    			t78 = text("\n\t\t\t\t\t{:else if rando ›= 0.5}");
    			br31 = element("br");
    			t79 = text("\n\t\t\t\t\t\t  ‹p›Value ranges from 0.50 to 0.75.‹/p›");
    			br32 = element("br");
    			t80 = text("\n\t\t\t\t\t{:else if rando ›= 0.25}");
    			br33 = element("br");
    			t81 = text("\n\t\t\t\t\t\t  ‹p›Value ranges from 0.25 to 0.49.‹/p›");
    			br34 = element("br");
    			t82 = text("\n\t\t\t\t\t{:else}");
    			br35 = element("br");
    			t83 = text("\n\t\t\t\t\t\t  ‹p›Value is less than 0.25.‹/p›");
    			br36 = element("br");
    			t84 = text("\n\t\t\t\t\t{/if}");
    			t85 = space();
    			br37 = element("br");
    			t86 = space();
    			if_block0.c();
    			t87 = space();
    			br38 = element("br");
    			input1 = element("input");
    			br39 = element("br");
    			t88 = space();
    			div20 = element("div");
    			div19 = element("div");
    			p6 = element("p");
    			b6 = element("b");
    			b6.textContent = "7. Using Svelte's transition directives";
    			t90 = space();
    			br40 = element("br");
    			t91 = space();
    			cite5 = element("cite");
    			cite5.textContent = "These are directives that allows you to compute css animations based on the logic in your page.";
    			t93 = space();
    			div18 = element("div");
    			code6 = element("code");
    			t94 = text("-- Done in the script portion. Will need to import the transition library.");
    			br41 = element("br");
    			t95 = text("\n\t\t\t\t\timport { fade, fly } from 'svelte/transition';\n\t\t\t\t\t");
    			br42 = element("br");
    			br43 = element("br");
    			t96 = text("-- Done in the html portion.");
    			br44 = element("br");
    			t97 = text("\n\t\t\t\t\t{#if rando › 0.75}");
    			br45 = element("br");
    			t98 = text("\n\t\t\t\t\t\t  ‹p ");
    			br46 = element("br");
    			t99 = text("\n\t\t\t\t\t\t\t    in:fade={{ delay: 200, duration:4000 }}");
    			br47 = element("br");
    			t100 = text("\n\t\t\t\t\t\t\t    out:fade={{ delay: 200, duration:4000 }}");
    			br48 = element("br");
    			t101 = text("\n\t\t\t\t\t\t  ›Fading‹/p›");
    			br49 = element("br");
    			t102 = text("\n\t\t\t\t\t{:else if rando ›= 0.5}");
    			br50 = element("br");
    			t103 = text("\n\t\t\t\t\t\t  ‹p ");
    			br51 = element("br");
    			t104 = text("\n\t\t\t\t\t\t\t    in:slide={{ delay: 200, duration:4000 }}");
    			br52 = element("br");
    			t105 = text("\n\t\t\t\t\t\t\t    out:slide={{ delay: 200, duration:4000 }}");
    			br53 = element("br");
    			t106 = text("\n\t\t\t\t\t\t  ›Sliding‹/p›");
    			br54 = element("br");
    			t107 = text("\n\t\t\t\t\t{:else if rando ›= 0.25}");
    			br55 = element("br");
    			t108 = text("\n\t\t\t\t\t\t  ‹p ");
    			br56 = element("br");
    			t109 = text("\n\t\t\t\t\t\t\t    in:blur={{ delay: 200, duration:4000 }}");
    			br57 = element("br");
    			t110 = text("\n\t\t\t\t\t\t\t    out:blur={{ delay: 200, duration:4000 }}");
    			br58 = element("br");
    			t111 = text("\n\t\t\t\t\t\t  ›Bluring‹/p›");
    			br59 = element("br");
    			t112 = text("\n\t\t\t\t\t{:else}");
    			br60 = element("br");
    			t113 = text("\n\t\t\t\t\t\t  ‹p ");
    			br61 = element("br");
    			t114 = text("\n\t\t\t\t\t\t\t    in:fly={{ delay: 200, x: 500, duration:4000 }}");
    			br62 = element("br");
    			t115 = text("\n\t\t\t\t\t\t\t    out:fly={{ delay: 200, x: -250, duration:4000 }}");
    			br63 = element("br");
    			t116 = text("\n\t\t\t\t\t\t  ›Flying‹/p›");
    			br64 = element("br");
    			t117 = text("\n\t\t\t\t\t{/if}");
    			br65 = element("br");
    			t118 = space();
    			br66 = element("br");
    			t119 = space();
    			button7 = element("button");
    			button7.textContent = "Fade";
    			t121 = space();
    			button8 = element("button");
    			button8.textContent = "Slide";
    			t123 = space();
    			button9 = element("button");
    			button9.textContent = "Blur";
    			t125 = space();
    			button10 = element("button");
    			button10.textContent = "Fly";
    			t127 = space();
    			br67 = element("br");
    			t128 = space();
    			if_block1.c();
    			t129 = space();
    			br68 = element("br");
    			t130 = space();
    			button11 = element("button");
    			button11.textContent = "Randomize me!";
    			add_location(b0, file$1, 26, 6, 875);
    			add_location(p0, file$1, 26, 3, 872);
    			add_location(br0, file$1, 29, 35, 1009);
    			add_location(br1, file$1, 31, 5, 1039);
    			add_location(br2, file$1, 31, 9, 1043);
    			add_location(br3, file$1, 31, 41, 1075);
    			add_location(code0, file$1, 28, 4, 967);
    			attr_dev(div0, "class", "notes svelte-6q65hp");
    			add_location(div0, file$1, 27, 3, 943);
    			add_location(br4, file$1, 36, 3, 1255);
    			add_location(button0, file$1, 36, 7, 1259);
    			add_location(br5, file$1, 36, 57, 1309);
    			attr_dev(div1, "class", "container svelte-6q65hp");
    			add_location(div1, file$1, 25, 2, 845);
    			attr_dev(div2, "class", "card svelte-6q65hp");
    			add_location(div2, file$1, 24, 0, 824);
    			add_location(b1, file$1, 43, 4, 1389);
    			add_location(br6, file$1, 44, 4, 1472);
    			attr_dev(cite0, "class", "svelte-6q65hp");
    			add_location(cite0, file$1, 45, 4, 1481);
    			add_location(p1, file$1, 42, 3, 1381);
    			add_location(code1, file$1, 48, 4, 1592);
    			attr_dev(div3, "class", "notes svelte-6q65hp");
    			add_location(div3, file$1, 47, 3, 1568);
    			add_location(br7, file$1, 52, 3, 1714);
    			add_location(button1, file$1, 52, 7, 1718);
    			add_location(br8, file$1, 52, 57, 1768);
    			attr_dev(div4, "class", "container svelte-6q65hp");
    			add_location(div4, file$1, 41, 2, 1354);
    			attr_dev(div5, "class", "card svelte-6q65hp");
    			add_location(div5, file$1, 40, 1, 1333);
    			add_location(b2, file$1, 59, 4, 1848);
    			add_location(br9, file$1, 60, 4, 1928);
    			add_location(br10, file$1, 64, 5, 2145);
    			add_location(br11, file$1, 66, 5, 2280);
    			add_location(br12, file$1, 68, 5, 2415);
    			add_location(br13, file$1, 68, 9, 2419);
    			attr_dev(cite1, "class", "svelte-6q65hp");
    			add_location(cite1, file$1, 61, 4, 1937);
    			add_location(p2, file$1, 58, 3, 1840);
    			add_location(br14, file$1, 74, 46, 2685);
    			add_location(br15, file$1, 76, 5, 2745);
    			add_location(br16, file$1, 76, 9, 2749);
    			add_location(br17, file$1, 76, 41, 2781);
    			add_location(br18, file$1, 77, 64, 2850);
    			add_location(br19, file$1, 78, 64, 2919);
    			add_location(code2, file$1, 73, 4, 2632);
    			attr_dev(div6, "class", "notes svelte-6q65hp");
    			add_location(div6, file$1, 72, 3, 2608);
    			add_location(br20, file$1, 82, 3, 3014);
    			add_location(button2, file$1, 82, 7, 3018);
    			add_location(br21, file$1, 82, 57, 3068);
    			attr_dev(div7, "class", "container svelte-6q65hp");
    			add_location(div7, file$1, 57, 2, 1813);
    			attr_dev(div8, "class", "card svelte-6q65hp");
    			add_location(div8, file$1, 56, 1, 1792);
    			add_location(b3, file$1, 89, 4, 3148);
    			add_location(br22, file$1, 90, 4, 3232);
    			attr_dev(cite2, "class", "svelte-6q65hp");
    			add_location(cite2, file$1, 91, 4, 3241);
    			add_location(p3, file$1, 88, 3, 3140);
    			add_location(code3, file$1, 97, 4, 3511);
    			attr_dev(div9, "class", "notes svelte-6q65hp");
    			add_location(div9, file$1, 96, 3, 3487);
    			add_location(br23, file$1, 101, 3, 3605);
    			attr_dev(input0, "size", "10");
    			add_location(input0, file$1, 101, 7, 3609);
    			add_location(br24, file$1, 101, 43, 3645);
    			attr_dev(div10, "class", "container svelte-6q65hp");
    			add_location(div10, file$1, 87, 2, 3113);
    			attr_dev(div11, "class", "card svelte-6q65hp");
    			add_location(div11, file$1, 86, 1, 3092);
    			add_location(b4, file$1, 108, 4, 3725);
    			add_location(br25, file$1, 109, 4, 3801);
    			attr_dev(cite3, "class", "svelte-6q65hp");
    			add_location(cite3, file$1, 110, 4, 3810);
    			add_location(p4, file$1, 107, 3, 3717);
    			add_location(code4, file$1, 116, 4, 4118);
    			attr_dev(div12, "class", "notes svelte-6q65hp");
    			add_location(div12, file$1, 115, 3, 4094);
    			add_location(br26, file$1, 120, 3, 4275);
    			add_location(button3, file$1, 122, 3, 4363);
    			add_location(button4, file$1, 123, 3, 4458);
    			add_location(button5, file$1, 124, 3, 4559);
    			add_location(button6, file$1, 125, 3, 4660);
    			add_location(br27, file$1, 126, 3, 4755);
    			attr_dev(div13, "class", "container svelte-6q65hp");
    			add_location(div13, file$1, 106, 2, 3690);
    			attr_dev(div14, "class", "card svelte-6q65hp");
    			add_location(div14, file$1, 105, 1, 3669);
    			add_location(b5, file$1, 133, 4, 4835);
    			add_location(br28, file$1, 134, 4, 4914);
    			attr_dev(cite4, "class", "svelte-6q65hp");
    			add_location(cite4, file$1, 135, 4, 4923);
    			add_location(p5, file$1, 132, 3, 4827);
    			add_location(br29, file$1, 141, 44, 5087);
    			add_location(br30, file$1, 142, 77, 5169);
    			add_location(br31, file$1, 143, 49, 5223);
    			add_location(br32, file$1, 144, 84, 5312);
    			add_location(br33, file$1, 145, 50, 5367);
    			add_location(br34, file$1, 146, 84, 5456);
    			add_location(br35, file$1, 147, 26, 5487);
    			add_location(br36, file$1, 148, 77, 5569);
    			add_location(code5, file$1, 140, 4, 5036);
    			attr_dev(div15, "class", "notes svelte-6q65hp");
    			add_location(div15, file$1, 139, 3, 5012);
    			add_location(br37, file$1, 152, 3, 5624);
    			add_location(br38, file$1, 162, 3, 5887);
    			attr_dev(input1, "size", "10");
    			add_location(input1, file$1, 162, 7, 5891);
    			add_location(br39, file$1, 162, 43, 5927);
    			attr_dev(div16, "class", "container svelte-6q65hp");
    			add_location(div16, file$1, 131, 2, 4800);
    			attr_dev(div17, "class", "card svelte-6q65hp");
    			add_location(div17, file$1, 130, 1, 4779);
    			add_location(b6, file$1, 169, 4, 6007);
    			add_location(br40, file$1, 170, 4, 6058);
    			attr_dev(cite5, "class", "svelte-6q65hp");
    			add_location(cite5, file$1, 171, 4, 6067);
    			add_location(p6, file$1, 168, 3, 5999);
    			add_location(br41, file$1, 177, 79, 6308);
    			add_location(br42, file$1, 179, 5, 6384);
    			add_location(br43, file$1, 179, 9, 6388);
    			add_location(br44, file$1, 179, 41, 6420);
    			add_location(br45, file$1, 180, 44, 6469);
    			add_location(br46, file$1, 181, 28, 6502);
    			add_location(br47, file$1, 182, 98, 6605);
    			add_location(br48, file$1, 183, 99, 6709);
    			add_location(br49, file$1, 184, 50, 6764);
    			add_location(br50, file$1, 185, 49, 6818);
    			add_location(br51, file$1, 186, 28, 6851);
    			add_location(br52, file$1, 187, 99, 6955);
    			add_location(br53, file$1, 188, 100, 7060);
    			add_location(br54, file$1, 189, 51, 7116);
    			add_location(br55, file$1, 190, 50, 7171);
    			add_location(br56, file$1, 191, 28, 7204);
    			add_location(br57, file$1, 192, 98, 7307);
    			add_location(br58, file$1, 193, 99, 7411);
    			add_location(br59, file$1, 194, 51, 7467);
    			add_location(br60, file$1, 195, 26, 7498);
    			add_location(br61, file$1, 196, 28, 7531);
    			add_location(br62, file$1, 197, 105, 7641);
    			add_location(br63, file$1, 198, 107, 7753);
    			add_location(br64, file$1, 199, 50, 7808);
    			add_location(br65, file$1, 200, 24, 7837);
    			add_location(code6, file$1, 176, 4, 6222);
    			attr_dev(div18, "class", "notes svelte-6q65hp");
    			add_location(div18, file$1, 175, 3, 6198);
    			add_location(br66, file$1, 203, 3, 7867);
    			add_location(button7, file$1, 204, 3, 7875);
    			add_location(button8, file$1, 205, 3, 7961);
    			add_location(button9, file$1, 206, 3, 8051);
    			add_location(button10, file$1, 207, 3, 8140);
    			add_location(br67, file$1, 208, 3, 8225);
    			add_location(br68, file$1, 230, 3, 8805);
    			attr_dev(div19, "class", "container svelte-6q65hp");
    			add_location(div19, file$1, 167, 2, 5972);
    			attr_dev(div20, "class", "card svelte-6q65hp");
    			add_location(div20, file$1, 166, 1, 5951);
    			add_location(button11, file$1, 237, 1, 8907);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, p0);
    			append_dev(p0, b0);
    			append_dev(b0, t0);
    			append_dev(b0, t1);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, code0);
    			append_dev(code0, t3);
    			append_dev(code0, br0);
    			append_dev(code0, t4);
    			append_dev(code0, br1);
    			append_dev(code0, br2);
    			append_dev(code0, t5);
    			append_dev(code0, br3);
    			append_dev(code0, t6);
    			append_dev(div1, t7);
    			append_dev(div1, br4);
    			append_dev(div1, button0);
    			append_dev(div1, br5);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, p1);
    			append_dev(p1, b1);
    			append_dev(b1, t10);
    			append_dev(b1, t11);
    			append_dev(p1, t12);
    			append_dev(p1, br6);
    			append_dev(p1, t13);
    			append_dev(p1, cite0);
    			append_dev(div4, t15);
    			append_dev(div4, div3);
    			append_dev(div3, code1);
    			append_dev(div4, t17);
    			append_dev(div4, br7);
    			append_dev(div4, button1);
    			append_dev(div4, br8);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div7);
    			append_dev(div7, p2);
    			append_dev(p2, b2);
    			append_dev(b2, t20);
    			append_dev(b2, t21);
    			append_dev(b2, t22);
    			append_dev(b2, t23);
    			append_dev(b2, t24);
    			append_dev(b2, t25);
    			append_dev(b2, t26);
    			append_dev(b2, t27);
    			append_dev(p2, t28);
    			append_dev(p2, br9);
    			append_dev(p2, t29);
    			append_dev(p2, cite1);
    			append_dev(cite1, t30);
    			append_dev(cite1, br10);
    			append_dev(cite1, t31);
    			append_dev(cite1, br11);
    			append_dev(cite1, t32);
    			append_dev(cite1, br12);
    			append_dev(cite1, br13);
    			append_dev(cite1, t33);
    			append_dev(div7, t34);
    			append_dev(div7, div6);
    			append_dev(div6, code2);
    			append_dev(code2, t35);
    			append_dev(code2, br14);
    			append_dev(code2, t36);
    			append_dev(code2, br15);
    			append_dev(code2, br16);
    			append_dev(code2, t37);
    			append_dev(code2, br17);
    			append_dev(code2, t38);
    			append_dev(code2, br18);
    			append_dev(code2, t39);
    			append_dev(code2, br19);
    			append_dev(code2, t40);
    			append_dev(div7, t41);
    			append_dev(div7, br20);
    			append_dev(div7, button2);
    			append_dev(div7, br21);
    			insert_dev(target, t43, anchor);
    			insert_dev(target, div11, anchor);
    			append_dev(div11, div10);
    			append_dev(div10, p3);
    			append_dev(p3, b3);
    			append_dev(b3, t44);
    			append_dev(b3, t45);
    			append_dev(p3, t46);
    			append_dev(p3, br22);
    			append_dev(p3, t47);
    			append_dev(p3, cite2);
    			append_dev(div10, t49);
    			append_dev(div10, div9);
    			append_dev(div9, code3);
    			append_dev(div10, t51);
    			append_dev(div10, br23);
    			append_dev(div10, input0);
    			set_input_value(input0, /*rando*/ ctx[0]);
    			append_dev(div10, br24);
    			insert_dev(target, t52, anchor);
    			insert_dev(target, div14, anchor);
    			append_dev(div14, div13);
    			append_dev(div13, p4);
    			append_dev(p4, b4);
    			append_dev(b4, t53);
    			append_dev(b4, t54);
    			append_dev(p4, t55);
    			append_dev(p4, br25);
    			append_dev(p4, t56);
    			append_dev(p4, cite3);
    			append_dev(div13, t58);
    			append_dev(div13, div12);
    			append_dev(div12, code4);
    			append_dev(div13, t60);
    			append_dev(div13, br26);
    			append_dev(div13, t61);
    			append_dev(div13, button3);
    			append_dev(div13, t63);
    			append_dev(div13, button4);
    			append_dev(div13, t65);
    			append_dev(div13, button5);
    			append_dev(div13, t67);
    			append_dev(div13, button6);
    			append_dev(div13, t69);
    			append_dev(div13, br27);
    			insert_dev(target, t70, anchor);
    			insert_dev(target, div17, anchor);
    			append_dev(div17, div16);
    			append_dev(div16, p5);
    			append_dev(p5, b5);
    			append_dev(p5, t72);
    			append_dev(p5, br28);
    			append_dev(p5, t73);
    			append_dev(p5, cite4);
    			append_dev(div16, t75);
    			append_dev(div16, div15);
    			append_dev(div15, code5);
    			append_dev(code5, t76);
    			append_dev(code5, br29);
    			append_dev(code5, t77);
    			append_dev(code5, br30);
    			append_dev(code5, t78);
    			append_dev(code5, br31);
    			append_dev(code5, t79);
    			append_dev(code5, br32);
    			append_dev(code5, t80);
    			append_dev(code5, br33);
    			append_dev(code5, t81);
    			append_dev(code5, br34);
    			append_dev(code5, t82);
    			append_dev(code5, br35);
    			append_dev(code5, t83);
    			append_dev(code5, br36);
    			append_dev(code5, t84);
    			append_dev(div16, t85);
    			append_dev(div16, br37);
    			append_dev(div16, t86);
    			if_block0.m(div16, null);
    			append_dev(div16, t87);
    			append_dev(div16, br38);
    			append_dev(div16, input1);
    			set_input_value(input1, /*rando*/ ctx[0]);
    			append_dev(div16, br39);
    			insert_dev(target, t88, anchor);
    			insert_dev(target, div20, anchor);
    			append_dev(div20, div19);
    			append_dev(div19, p6);
    			append_dev(p6, b6);
    			append_dev(p6, t90);
    			append_dev(p6, br40);
    			append_dev(p6, t91);
    			append_dev(p6, cite5);
    			append_dev(div19, t93);
    			append_dev(div19, div18);
    			append_dev(div18, code6);
    			append_dev(code6, t94);
    			append_dev(code6, br41);
    			append_dev(code6, t95);
    			append_dev(code6, br42);
    			append_dev(code6, br43);
    			append_dev(code6, t96);
    			append_dev(code6, br44);
    			append_dev(code6, t97);
    			append_dev(code6, br45);
    			append_dev(code6, t98);
    			append_dev(code6, br46);
    			append_dev(code6, t99);
    			append_dev(code6, br47);
    			append_dev(code6, t100);
    			append_dev(code6, br48);
    			append_dev(code6, t101);
    			append_dev(code6, br49);
    			append_dev(code6, t102);
    			append_dev(code6, br50);
    			append_dev(code6, t103);
    			append_dev(code6, br51);
    			append_dev(code6, t104);
    			append_dev(code6, br52);
    			append_dev(code6, t105);
    			append_dev(code6, br53);
    			append_dev(code6, t106);
    			append_dev(code6, br54);
    			append_dev(code6, t107);
    			append_dev(code6, br55);
    			append_dev(code6, t108);
    			append_dev(code6, br56);
    			append_dev(code6, t109);
    			append_dev(code6, br57);
    			append_dev(code6, t110);
    			append_dev(code6, br58);
    			append_dev(code6, t111);
    			append_dev(code6, br59);
    			append_dev(code6, t112);
    			append_dev(code6, br60);
    			append_dev(code6, t113);
    			append_dev(code6, br61);
    			append_dev(code6, t114);
    			append_dev(code6, br62);
    			append_dev(code6, t115);
    			append_dev(code6, br63);
    			append_dev(code6, t116);
    			append_dev(code6, br64);
    			append_dev(code6, t117);
    			append_dev(code6, br65);
    			append_dev(div19, t118);
    			append_dev(div19, br66);
    			append_dev(div19, t119);
    			append_dev(div19, button7);
    			append_dev(div19, t121);
    			append_dev(div19, button8);
    			append_dev(div19, t123);
    			append_dev(div19, button9);
    			append_dev(div19, t125);
    			append_dev(div19, button10);
    			append_dev(div19, t127);
    			append_dev(div19, br67);
    			append_dev(div19, t128);
    			if_blocks[current_block_type_index].m(div19, null);
    			append_dev(div19, t129);
    			append_dev(div19, br68);
    			insert_dev(target, t130, anchor);
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
    			if (!current || dirty & /*rando*/ 1) set_data_dev(t1, /*rando*/ ctx[0]);
    			if ((!current || dirty & /*rando*/ 1) && t11_value !== (t11_value = (Math.round(/*rando*/ ctx[0]) ? "🤗" : "👻") + "")) set_data_dev(t11, t11_value);
    			if (!current || dirty & /*result*/ 2) set_data_dev(t21, /*result*/ ctx[1]);
    			if (!current || dirty & /*result*/ 2) set_data_dev(t23, /*result*/ ctx[1]);
    			if (!current || dirty & /*result*/ 2) set_data_dev(t25, /*result*/ ctx[1]);
    			if (!current || dirty & /*result*/ 2) set_data_dev(t27, /*result*/ ctx[1]);
    			if ((!current || dirty & /*rando*/ 1) && t45_value !== (t45_value = (Math.round(/*rando*/ ctx[0]) ? "🤗" : "👻") + "")) set_data_dev(t45, t45_value);

    			if (dirty & /*rando*/ 1 && input0.value !== /*rando*/ ctx[0]) {
    				set_input_value(input0, /*rando*/ ctx[0]);
    			}

    			if ((!current || dirty & /*rando*/ 1) && t54_value !== (t54_value = (Math.round(/*rando*/ ctx[0]) ? "🤗" : "👻") + "")) set_data_dev(t54, t54_value);

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div16, t87);
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
    				if_block1.m(div19, t129);
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
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div5);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(div8);
    			if (detaching) detach_dev(t43);
    			if (detaching) detach_dev(div11);
    			if (detaching) detach_dev(t52);
    			if (detaching) detach_dev(div14);
    			if (detaching) detach_dev(t70);
    			if (detaching) detach_dev(div17);
    			if_block0.d();
    			if (detaching) detach_dev(t88);
    			if (detaching) detach_dev(div20);
    			if_blocks[current_block_type_index].d();
    			if (detaching) detach_dev(t130);
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
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "This is page two.";
    			add_location(h1, file$2, 5, 0, 22);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
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
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "This is page three.";
    			add_location(h1, file$3, 5, 0, 22);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
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
    			div1 = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr_dev(h1, "class", "svelte-1tky8bj");
    			add_location(h1, file$5, 30, 1, 1001);
    			add_location(div0, file$5, 31, 1, 1025);
    			attr_dev(div1, "id", "pageContent");
    			add_location(div1, file$5, 37, 1, 1340);
    			attr_dev(main, "class", "svelte-1tky8bj");
    			add_location(main, file$5, 29, 0, 993);
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
