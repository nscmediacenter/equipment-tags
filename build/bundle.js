
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function init_binding_group(group) {
        let _inputs;
        return {
            /* push */ p(...inputs) {
                _inputs = inputs;
                _inputs.forEach(input => group.push(input));
            },
            /* remove */ r() {
                _inputs.forEach(input => group.splice(group.indexOf(input), 1));
            }
        };
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value == null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
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
        else if (callback) {
            callback();
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    var barcodes = {};

    var CODE39$1 = {};

    var Barcode$1 = {};

    Object.defineProperty(Barcode$1, "__esModule", {
    	value: true
    });

    function _classCallCheck$s(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var Barcode = function Barcode(data, options) {
    	_classCallCheck$s(this, Barcode);

    	this.data = data;
    	this.text = options.text || data;
    	this.options = options;
    };

    Barcode$1.default = Barcode;

    Object.defineProperty(CODE39$1, "__esModule", {
    	value: true
    });
    CODE39$1.CODE39 = undefined;

    var _createClass$l = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _Barcode2$b = Barcode$1;

    var _Barcode3$b = _interopRequireDefault$x(_Barcode2$b);

    function _interopRequireDefault$x(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$r(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn$n(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits$n(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Encoding documentation:
    // https://en.wikipedia.org/wiki/Code_39#Encoding

    var CODE39 = function (_Barcode) {
    	_inherits$n(CODE39, _Barcode);

    	function CODE39(data, options) {
    		_classCallCheck$r(this, CODE39);

    		data = data.toUpperCase();

    		// Calculate mod43 checksum if enabled
    		if (options.mod43) {
    			data += getCharacter(mod43checksum(data));
    		}

    		return _possibleConstructorReturn$n(this, (CODE39.__proto__ || Object.getPrototypeOf(CODE39)).call(this, data, options));
    	}

    	_createClass$l(CODE39, [{
    		key: "encode",
    		value: function encode() {
    			// First character is always a *
    			var result = getEncoding("*");

    			// Take every character and add the binary representation to the result
    			for (var i = 0; i < this.data.length; i++) {
    				result += getEncoding(this.data[i]) + "0";
    			}

    			// Last character is always a *
    			result += getEncoding("*");

    			return {
    				data: result,
    				text: this.text
    			};
    		}
    	}, {
    		key: "valid",
    		value: function valid() {
    			return this.data.search(/^[0-9A-Z\-\.\ \$\/\+\%]+$/) !== -1;
    		}
    	}]);

    	return CODE39;
    }(_Barcode3$b.default);

    // All characters. The position in the array is the (checksum) value


    var characters = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "-", ".", " ", "$", "/", "+", "%", "*"];

    // The decimal representation of the characters, is converted to the
    // corresponding binary with the getEncoding function
    var encodings = [20957, 29783, 23639, 30485, 20951, 29813, 23669, 20855, 29789, 23645, 29975, 23831, 30533, 22295, 30149, 24005, 21623, 29981, 23837, 22301, 30023, 23879, 30545, 22343, 30161, 24017, 21959, 30065, 23921, 22385, 29015, 18263, 29141, 17879, 29045, 18293, 17783, 29021, 18269, 17477, 17489, 17681, 20753, 35770];

    // Get the binary representation of a character by converting the encodings
    // from decimal to binary
    function getEncoding(character) {
    	return getBinary(characterValue(character));
    }

    function getBinary(characterValue) {
    	return encodings[characterValue].toString(2);
    }

    function getCharacter(characterValue) {
    	return characters[characterValue];
    }

    function characterValue(character) {
    	return characters.indexOf(character);
    }

    function mod43checksum(data) {
    	var checksum = 0;
    	for (var i = 0; i < data.length; i++) {
    		checksum += characterValue(data[i]);
    	}

    	checksum = checksum % 43;
    	return checksum;
    }

    CODE39$1.CODE39 = CODE39;

    var CODE128$2 = {};

    var CODE128_AUTO = {};

    var CODE128$1 = {};

    var constants$2 = {};

    Object.defineProperty(constants$2, "__esModule", {
    	value: true
    });

    var _SET_BY_CODE;

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

    // constants for internal usage
    var SET_A = constants$2.SET_A = 0;
    var SET_B = constants$2.SET_B = 1;
    var SET_C = constants$2.SET_C = 2;

    // Special characters
    constants$2.SHIFT = 98;
    var START_A = constants$2.START_A = 103;
    var START_B = constants$2.START_B = 104;
    var START_C = constants$2.START_C = 105;
    constants$2.MODULO = 103;
    constants$2.STOP = 106;
    constants$2.FNC1 = 207;

    // Get set by start code
    constants$2.SET_BY_CODE = (_SET_BY_CODE = {}, _defineProperty(_SET_BY_CODE, START_A, SET_A), _defineProperty(_SET_BY_CODE, START_B, SET_B), _defineProperty(_SET_BY_CODE, START_C, SET_C), _SET_BY_CODE);

    // Get next set by code
    constants$2.SWAP = {
    	101: SET_A,
    	100: SET_B,
    	99: SET_C
    };

    constants$2.A_START_CHAR = String.fromCharCode(208); // START_A + 105
    constants$2.B_START_CHAR = String.fromCharCode(209); // START_B + 105
    constants$2.C_START_CHAR = String.fromCharCode(210); // START_C + 105

    // 128A (Code Set A)
    // ASCII characters 00 to 95 (0–9, A–Z and control codes), special characters, and FNC 1–4
    constants$2.A_CHARS = "[\x00-\x5F\xC8-\xCF]";

    // 128B (Code Set B)
    // ASCII characters 32 to 127 (0–9, A–Z, a–z), special characters, and FNC 1–4
    constants$2.B_CHARS = "[\x20-\x7F\xC8-\xCF]";

    // 128C (Code Set C)
    // 00–99 (encodes two digits with a single code point) and FNC1
    constants$2.C_CHARS = "(\xCF*[0-9]{2}\xCF*)";

    // CODE128 includes 107 symbols:
    // 103 data symbols, 3 start symbols (A, B and C), and 1 stop symbol (the last one)
    // Each symbol consist of three black bars (1) and three white spaces (0).
    constants$2.BARS = [11011001100, 11001101100, 11001100110, 10010011000, 10010001100, 10001001100, 10011001000, 10011000100, 10001100100, 11001001000, 11001000100, 11000100100, 10110011100, 10011011100, 10011001110, 10111001100, 10011101100, 10011100110, 11001110010, 11001011100, 11001001110, 11011100100, 11001110100, 11101101110, 11101001100, 11100101100, 11100100110, 11101100100, 11100110100, 11100110010, 11011011000, 11011000110, 11000110110, 10100011000, 10001011000, 10001000110, 10110001000, 10001101000, 10001100010, 11010001000, 11000101000, 11000100010, 10110111000, 10110001110, 10001101110, 10111011000, 10111000110, 10001110110, 11101110110, 11010001110, 11000101110, 11011101000, 11011100010, 11011101110, 11101011000, 11101000110, 11100010110, 11101101000, 11101100010, 11100011010, 11101111010, 11001000010, 11110001010, 10100110000, 10100001100, 10010110000, 10010000110, 10000101100, 10000100110, 10110010000, 10110000100, 10011010000, 10011000010, 10000110100, 10000110010, 11000010010, 11001010000, 11110111010, 11000010100, 10001111010, 10100111100, 10010111100, 10010011110, 10111100100, 10011110100, 10011110010, 11110100100, 11110010100, 11110010010, 11011011110, 11011110110, 11110110110, 10101111000, 10100011110, 10001011110, 10111101000, 10111100010, 11110101000, 11110100010, 10111011110, 10111101110, 11101011110, 11110101110, 11010000100, 11010010000, 11010011100, 1100011101011];

    Object.defineProperty(CODE128$1, "__esModule", {
    	value: true
    });

    var _createClass$k = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _Barcode2$a = Barcode$1;

    var _Barcode3$a = _interopRequireDefault$w(_Barcode2$a);

    var _constants$a = constants$2;

    function _interopRequireDefault$w(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$q(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn$m(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits$m(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    // This is the master class,
    // it does require the start code to be included in the string
    var CODE128 = function (_Barcode) {
    	_inherits$m(CODE128, _Barcode);

    	function CODE128(data, options) {
    		_classCallCheck$q(this, CODE128);

    		// Get array of ascii codes from data
    		var _this = _possibleConstructorReturn$m(this, (CODE128.__proto__ || Object.getPrototypeOf(CODE128)).call(this, data.substring(1), options));

    		_this.bytes = data.split('').map(function (char) {
    			return char.charCodeAt(0);
    		});
    		return _this;
    	}

    	_createClass$k(CODE128, [{
    		key: 'valid',
    		value: function valid() {
    			// ASCII value ranges 0-127, 200-211
    			return (/^[\x00-\x7F\xC8-\xD3]+$/.test(this.data)
    			);
    		}

    		// The public encoding function

    	}, {
    		key: 'encode',
    		value: function encode() {
    			var bytes = this.bytes;
    			// Remove the start code from the bytes and set its index
    			var startIndex = bytes.shift() - 105;
    			// Get start set by index
    			var startSet = _constants$a.SET_BY_CODE[startIndex];

    			if (startSet === undefined) {
    				throw new RangeError('The encoding does not start with a start character.');
    			}

    			if (this.shouldEncodeAsEan128() === true) {
    				bytes.unshift(_constants$a.FNC1);
    			}

    			// Start encode with the right type
    			var encodingResult = CODE128.next(bytes, 1, startSet);

    			return {
    				text: this.text === this.data ? this.text.replace(/[^\x20-\x7E]/g, '') : this.text,
    				data:
    				// Add the start bits
    				CODE128.getBar(startIndex) +
    				// Add the encoded bits
    				encodingResult.result +
    				// Add the checksum
    				CODE128.getBar((encodingResult.checksum + startIndex) % _constants$a.MODULO) +
    				// Add the end bits
    				CODE128.getBar(_constants$a.STOP)
    			};
    		}

    		// GS1-128/EAN-128

    	}, {
    		key: 'shouldEncodeAsEan128',
    		value: function shouldEncodeAsEan128() {
    			var isEAN128 = this.options.ean128 || false;
    			if (typeof isEAN128 === 'string') {
    				isEAN128 = isEAN128.toLowerCase() === 'true';
    			}
    			return isEAN128;
    		}

    		// Get a bar symbol by index

    	}], [{
    		key: 'getBar',
    		value: function getBar(index) {
    			return _constants$a.BARS[index] ? _constants$a.BARS[index].toString() : '';
    		}

    		// Correct an index by a set and shift it from the bytes array

    	}, {
    		key: 'correctIndex',
    		value: function correctIndex(bytes, set) {
    			if (set === _constants$a.SET_A) {
    				var charCode = bytes.shift();
    				return charCode < 32 ? charCode + 64 : charCode - 32;
    			} else if (set === _constants$a.SET_B) {
    				return bytes.shift() - 32;
    			} else {
    				return (bytes.shift() - 48) * 10 + bytes.shift() - 48;
    			}
    		}
    	}, {
    		key: 'next',
    		value: function next(bytes, pos, set) {
    			if (!bytes.length) {
    				return { result: '', checksum: 0 };
    			}

    			var nextCode = void 0,
    			    index = void 0;

    			// Special characters
    			if (bytes[0] >= 200) {
    				index = bytes.shift() - 105;
    				var nextSet = _constants$a.SWAP[index];

    				// Swap to other set
    				if (nextSet !== undefined) {
    					nextCode = CODE128.next(bytes, pos + 1, nextSet);
    				}
    				// Continue on current set but encode a special character
    				else {
    						// Shift
    						if ((set === _constants$a.SET_A || set === _constants$a.SET_B) && index === _constants$a.SHIFT) {
    							// Convert the next character so that is encoded correctly
    							bytes[0] = set === _constants$a.SET_A ? bytes[0] > 95 ? bytes[0] - 96 : bytes[0] : bytes[0] < 32 ? bytes[0] + 96 : bytes[0];
    						}
    						nextCode = CODE128.next(bytes, pos + 1, set);
    					}
    			}
    			// Continue encoding
    			else {
    					index = CODE128.correctIndex(bytes, set);
    					nextCode = CODE128.next(bytes, pos + 1, set);
    				}

    			// Get the correct binary encoding and calculate the weight
    			var enc = CODE128.getBar(index);
    			var weight = index * pos;

    			return {
    				result: enc + nextCode.result,
    				checksum: weight + nextCode.checksum
    			};
    		}
    	}]);

    	return CODE128;
    }(_Barcode3$a.default);

    CODE128$1.default = CODE128;

    var auto = {};

    Object.defineProperty(auto, "__esModule", {
    	value: true
    });

    var _constants$9 = constants$2;

    // Match Set functions
    var matchSetALength = function matchSetALength(string) {
    	return string.match(new RegExp('^' + _constants$9.A_CHARS + '*'))[0].length;
    };
    var matchSetBLength = function matchSetBLength(string) {
    	return string.match(new RegExp('^' + _constants$9.B_CHARS + '*'))[0].length;
    };
    var matchSetC = function matchSetC(string) {
    	return string.match(new RegExp('^' + _constants$9.C_CHARS + '*'))[0];
    };

    // CODE128A or CODE128B
    function autoSelectFromAB(string, isA) {
    	var ranges = isA ? _constants$9.A_CHARS : _constants$9.B_CHARS;
    	var untilC = string.match(new RegExp('^(' + ranges + '+?)(([0-9]{2}){2,})([^0-9]|$)'));

    	if (untilC) {
    		return untilC[1] + String.fromCharCode(204) + autoSelectFromC(string.substring(untilC[1].length));
    	}

    	var chars = string.match(new RegExp('^' + ranges + '+'))[0];

    	if (chars.length === string.length) {
    		return string;
    	}

    	return chars + String.fromCharCode(isA ? 205 : 206) + autoSelectFromAB(string.substring(chars.length), !isA);
    }

    // CODE128C
    function autoSelectFromC(string) {
    	var cMatch = matchSetC(string);
    	var length = cMatch.length;

    	if (length === string.length) {
    		return string;
    	}

    	string = string.substring(length);

    	// Select A/B depending on the longest match
    	var isA = matchSetALength(string) >= matchSetBLength(string);
    	return cMatch + String.fromCharCode(isA ? 206 : 205) + autoSelectFromAB(string, isA);
    }

    // Detect Code Set (A, B or C) and format the string

    auto.default = function (string) {
    	var newString = void 0;
    	var cLength = matchSetC(string).length;

    	// Select 128C if the string start with enough digits
    	if (cLength >= 2) {
    		newString = _constants$9.C_START_CHAR + autoSelectFromC(string);
    	} else {
    		// Select A/B depending on the longest match
    		var isA = matchSetALength(string) > matchSetBLength(string);
    		newString = (isA ? _constants$9.A_START_CHAR : _constants$9.B_START_CHAR) + autoSelectFromAB(string, isA);
    	}

    	return newString.replace(/[\xCD\xCE]([^])[\xCD\xCE]/, // Any sequence between 205 and 206 characters
    	function (match, char) {
    		return String.fromCharCode(203) + char;
    	});
    };

    Object.defineProperty(CODE128_AUTO, "__esModule", {
    	value: true
    });

    var _CODE2$4 = CODE128$1;

    var _CODE3$3 = _interopRequireDefault$v(_CODE2$4);

    var _auto = auto;

    var _auto2 = _interopRequireDefault$v(_auto);

    function _interopRequireDefault$v(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$p(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn$l(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits$l(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var CODE128AUTO = function (_CODE) {
    	_inherits$l(CODE128AUTO, _CODE);

    	function CODE128AUTO(data, options) {
    		_classCallCheck$p(this, CODE128AUTO);

    		// ASCII value ranges 0-127, 200-211
    		if (/^[\x00-\x7F\xC8-\xD3]+$/.test(data)) {
    			var _this = _possibleConstructorReturn$l(this, (CODE128AUTO.__proto__ || Object.getPrototypeOf(CODE128AUTO)).call(this, (0, _auto2.default)(data), options));
    		} else {
    			var _this = _possibleConstructorReturn$l(this, (CODE128AUTO.__proto__ || Object.getPrototypeOf(CODE128AUTO)).call(this, data, options));
    		}
    		return _possibleConstructorReturn$l(_this);
    	}

    	return CODE128AUTO;
    }(_CODE3$3.default);

    CODE128_AUTO.default = CODE128AUTO;

    var CODE128A$1 = {};

    Object.defineProperty(CODE128A$1, "__esModule", {
    	value: true
    });

    var _createClass$j = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _CODE2$3 = CODE128$1;

    var _CODE3$2 = _interopRequireDefault$u(_CODE2$3);

    var _constants$8 = constants$2;

    function _interopRequireDefault$u(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$o(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn$k(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits$k(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var CODE128A = function (_CODE) {
    	_inherits$k(CODE128A, _CODE);

    	function CODE128A(string, options) {
    		_classCallCheck$o(this, CODE128A);

    		return _possibleConstructorReturn$k(this, (CODE128A.__proto__ || Object.getPrototypeOf(CODE128A)).call(this, _constants$8.A_START_CHAR + string, options));
    	}

    	_createClass$j(CODE128A, [{
    		key: 'valid',
    		value: function valid() {
    			return new RegExp('^' + _constants$8.A_CHARS + '+$').test(this.data);
    		}
    	}]);

    	return CODE128A;
    }(_CODE3$2.default);

    CODE128A$1.default = CODE128A;

    var CODE128B$1 = {};

    Object.defineProperty(CODE128B$1, "__esModule", {
    	value: true
    });

    var _createClass$i = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _CODE2$2 = CODE128$1;

    var _CODE3$1 = _interopRequireDefault$t(_CODE2$2);

    var _constants$7 = constants$2;

    function _interopRequireDefault$t(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$n(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn$j(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits$j(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var CODE128B = function (_CODE) {
    	_inherits$j(CODE128B, _CODE);

    	function CODE128B(string, options) {
    		_classCallCheck$n(this, CODE128B);

    		return _possibleConstructorReturn$j(this, (CODE128B.__proto__ || Object.getPrototypeOf(CODE128B)).call(this, _constants$7.B_START_CHAR + string, options));
    	}

    	_createClass$i(CODE128B, [{
    		key: 'valid',
    		value: function valid() {
    			return new RegExp('^' + _constants$7.B_CHARS + '+$').test(this.data);
    		}
    	}]);

    	return CODE128B;
    }(_CODE3$1.default);

    CODE128B$1.default = CODE128B;

    var CODE128C$1 = {};

    Object.defineProperty(CODE128C$1, "__esModule", {
    	value: true
    });

    var _createClass$h = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _CODE2$1 = CODE128$1;

    var _CODE3 = _interopRequireDefault$s(_CODE2$1);

    var _constants$6 = constants$2;

    function _interopRequireDefault$s(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$m(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn$i(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits$i(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var CODE128C = function (_CODE) {
    	_inherits$i(CODE128C, _CODE);

    	function CODE128C(string, options) {
    		_classCallCheck$m(this, CODE128C);

    		return _possibleConstructorReturn$i(this, (CODE128C.__proto__ || Object.getPrototypeOf(CODE128C)).call(this, _constants$6.C_START_CHAR + string, options));
    	}

    	_createClass$h(CODE128C, [{
    		key: 'valid',
    		value: function valid() {
    			return new RegExp('^' + _constants$6.C_CHARS + '+$').test(this.data);
    		}
    	}]);

    	return CODE128C;
    }(_CODE3.default);

    CODE128C$1.default = CODE128C;

    Object.defineProperty(CODE128$2, "__esModule", {
      value: true
    });
    CODE128$2.CODE128C = CODE128$2.CODE128B = CODE128$2.CODE128A = CODE128$2.CODE128 = undefined;

    var _CODE128_AUTO = CODE128_AUTO;

    var _CODE128_AUTO2 = _interopRequireDefault$r(_CODE128_AUTO);

    var _CODE128A = CODE128A$1;

    var _CODE128A2 = _interopRequireDefault$r(_CODE128A);

    var _CODE128B = CODE128B$1;

    var _CODE128B2 = _interopRequireDefault$r(_CODE128B);

    var _CODE128C = CODE128C$1;

    var _CODE128C2 = _interopRequireDefault$r(_CODE128C);

    function _interopRequireDefault$r(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    CODE128$2.CODE128 = _CODE128_AUTO2.default;
    CODE128$2.CODE128A = _CODE128A2.default;
    CODE128$2.CODE128B = _CODE128B2.default;
    CODE128$2.CODE128C = _CODE128C2.default;

    var EAN_UPC = {};

    var EAN13$1 = {};

    var constants$1 = {};

    Object.defineProperty(constants$1, "__esModule", {
    	value: true
    });
    // Standard start end and middle bits
    constants$1.SIDE_BIN = '101';
    constants$1.MIDDLE_BIN = '01010';

    constants$1.BINARIES = {
    	'L': [// The L (left) type of encoding
    	'0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'],
    	'G': [// The G type of encoding
    	'0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'],
    	'R': [// The R (right) type of encoding
    	'1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'],
    	'O': [// The O (odd) encoding for UPC-E
    	'0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'],
    	'E': [// The E (even) encoding for UPC-E
    	'0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111']
    };

    // Define the EAN-2 structure
    constants$1.EAN2_STRUCTURE = ['LL', 'LG', 'GL', 'GG'];

    // Define the EAN-5 structure
    constants$1.EAN5_STRUCTURE = ['GGLLL', 'GLGLL', 'GLLGL', 'GLLLG', 'LGGLL', 'LLGGL', 'LLLGG', 'LGLGL', 'LGLLG', 'LLGLG'];

    // Define the EAN-13 structure
    constants$1.EAN13_STRUCTURE = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

    var EAN$1 = {};

    var encoder = {};

    Object.defineProperty(encoder, "__esModule", {
    	value: true
    });

    var _constants$5 = constants$1;

    // Encode data string
    var encode$1 = function encode(data, structure, separator) {
    	var encoded = data.split('').map(function (val, idx) {
    		return _constants$5.BINARIES[structure[idx]];
    	}).map(function (val, idx) {
    		return val ? val[data[idx]] : '';
    	});

    	if (separator) {
    		var last = data.length - 1;
    		encoded = encoded.map(function (val, idx) {
    			return idx < last ? val + separator : val;
    		});
    	}

    	return encoded.join('');
    };

    encoder.default = encode$1;

    Object.defineProperty(EAN$1, "__esModule", {
    	value: true
    });

    var _createClass$g = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _constants$4 = constants$1;

    var _encoder$4 = encoder;

    var _encoder2$4 = _interopRequireDefault$q(_encoder$4);

    var _Barcode2$9 = Barcode$1;

    var _Barcode3$9 = _interopRequireDefault$q(_Barcode2$9);

    function _interopRequireDefault$q(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$l(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn$h(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits$h(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    // Base class for EAN8 & EAN13
    var EAN = function (_Barcode) {
    	_inherits$h(EAN, _Barcode);

    	function EAN(data, options) {
    		_classCallCheck$l(this, EAN);

    		// Make sure the font is not bigger than the space between the guard bars
    		var _this = _possibleConstructorReturn$h(this, (EAN.__proto__ || Object.getPrototypeOf(EAN)).call(this, data, options));

    		_this.fontSize = !options.flat && options.fontSize > options.width * 10 ? options.width * 10 : options.fontSize;

    		// Make the guard bars go down half the way of the text
    		_this.guardHeight = options.height + _this.fontSize / 2 + options.textMargin;
    		return _this;
    	}

    	_createClass$g(EAN, [{
    		key: 'encode',
    		value: function encode() {
    			return this.options.flat ? this.encodeFlat() : this.encodeGuarded();
    		}
    	}, {
    		key: 'leftText',
    		value: function leftText(from, to) {
    			return this.text.substr(from, to);
    		}
    	}, {
    		key: 'leftEncode',
    		value: function leftEncode(data, structure) {
    			return (0, _encoder2$4.default)(data, structure);
    		}
    	}, {
    		key: 'rightText',
    		value: function rightText(from, to) {
    			return this.text.substr(from, to);
    		}
    	}, {
    		key: 'rightEncode',
    		value: function rightEncode(data, structure) {
    			return (0, _encoder2$4.default)(data, structure);
    		}
    	}, {
    		key: 'encodeGuarded',
    		value: function encodeGuarded() {
    			var textOptions = { fontSize: this.fontSize };
    			var guardOptions = { height: this.guardHeight };

    			return [{ data: _constants$4.SIDE_BIN, options: guardOptions }, { data: this.leftEncode(), text: this.leftText(), options: textOptions }, { data: _constants$4.MIDDLE_BIN, options: guardOptions }, { data: this.rightEncode(), text: this.rightText(), options: textOptions }, { data: _constants$4.SIDE_BIN, options: guardOptions }];
    		}
    	}, {
    		key: 'encodeFlat',
    		value: function encodeFlat() {
    			var data = [_constants$4.SIDE_BIN, this.leftEncode(), _constants$4.MIDDLE_BIN, this.rightEncode(), _constants$4.SIDE_BIN];

    			return {
    				data: data.join(''),
    				text: this.text
    			};
    		}
    	}]);

    	return EAN;
    }(_Barcode3$9.default);

    EAN$1.default = EAN;

    Object.defineProperty(EAN13$1, "__esModule", {
    	value: true
    });

    var _createClass$f = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get$1 = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _constants$3 = constants$1;

    var _EAN2$2 = EAN$1;

    var _EAN3$2 = _interopRequireDefault$p(_EAN2$2);

    function _interopRequireDefault$p(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$k(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn$g(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits$g(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Encoding documentation:
    // https://en.wikipedia.org/wiki/International_Article_Number_(EAN)#Binary_encoding_of_data_digits_into_EAN-13_barcode

    // Calculate the checksum digit
    // https://en.wikipedia.org/wiki/International_Article_Number_(EAN)#Calculation_of_checksum_digit
    var checksum$4 = function checksum(number) {
    	var res = number.substr(0, 12).split('').map(function (n) {
    		return +n;
    	}).reduce(function (sum, a, idx) {
    		return idx % 2 ? sum + a * 3 : sum + a;
    	}, 0);

    	return (10 - res % 10) % 10;
    };

    var EAN13 = function (_EAN) {
    	_inherits$g(EAN13, _EAN);

    	function EAN13(data, options) {
    		_classCallCheck$k(this, EAN13);

    		// Add checksum if it does not exist
    		if (data.search(/^[0-9]{12}$/) !== -1) {
    			data += checksum$4(data);
    		}

    		// Adds a last character to the end of the barcode
    		var _this = _possibleConstructorReturn$g(this, (EAN13.__proto__ || Object.getPrototypeOf(EAN13)).call(this, data, options));

    		_this.lastChar = options.lastChar;
    		return _this;
    	}

    	_createClass$f(EAN13, [{
    		key: 'valid',
    		value: function valid() {
    			return this.data.search(/^[0-9]{13}$/) !== -1 && +this.data[12] === checksum$4(this.data);
    		}
    	}, {
    		key: 'leftText',
    		value: function leftText() {
    			return _get$1(EAN13.prototype.__proto__ || Object.getPrototypeOf(EAN13.prototype), 'leftText', this).call(this, 1, 6);
    		}
    	}, {
    		key: 'leftEncode',
    		value: function leftEncode() {
    			var data = this.data.substr(1, 6);
    			var structure = _constants$3.EAN13_STRUCTURE[this.data[0]];
    			return _get$1(EAN13.prototype.__proto__ || Object.getPrototypeOf(EAN13.prototype), 'leftEncode', this).call(this, data, structure);
    		}
    	}, {
    		key: 'rightText',
    		value: function rightText() {
    			return _get$1(EAN13.prototype.__proto__ || Object.getPrototypeOf(EAN13.prototype), 'rightText', this).call(this, 7, 6);
    		}
    	}, {
    		key: 'rightEncode',
    		value: function rightEncode() {
    			var data = this.data.substr(7, 6);
    			return _get$1(EAN13.prototype.__proto__ || Object.getPrototypeOf(EAN13.prototype), 'rightEncode', this).call(this, data, 'RRRRRR');
    		}

    		// The "standard" way of printing EAN13 barcodes with guard bars

    	}, {
    		key: 'encodeGuarded',
    		value: function encodeGuarded() {
    			var data = _get$1(EAN13.prototype.__proto__ || Object.getPrototypeOf(EAN13.prototype), 'encodeGuarded', this).call(this);

    			// Extend data with left digit & last character
    			if (this.options.displayValue) {
    				data.unshift({
    					data: '000000000000',
    					text: this.text.substr(0, 1),
    					options: { textAlign: 'left', fontSize: this.fontSize }
    				});

    				if (this.options.lastChar) {
    					data.push({
    						data: '00'
    					});
    					data.push({
    						data: '00000',
    						text: this.options.lastChar,
    						options: { fontSize: this.fontSize }
    					});
    				}
    			}

    			return data;
    		}
    	}]);

    	return EAN13;
    }(_EAN3$2.default);

    EAN13$1.default = EAN13;

    var EAN8$1 = {};

    Object.defineProperty(EAN8$1, "__esModule", {
    	value: true
    });

    var _createClass$e = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _EAN2$1 = EAN$1;

    var _EAN3$1 = _interopRequireDefault$o(_EAN2$1);

    function _interopRequireDefault$o(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$j(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn$f(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits$f(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Encoding documentation:
    // http://www.barcodeisland.com/ean8.phtml

    // Calculate the checksum digit
    var checksum$3 = function checksum(number) {
    	var res = number.substr(0, 7).split('').map(function (n) {
    		return +n;
    	}).reduce(function (sum, a, idx) {
    		return idx % 2 ? sum + a : sum + a * 3;
    	}, 0);

    	return (10 - res % 10) % 10;
    };

    var EAN8 = function (_EAN) {
    	_inherits$f(EAN8, _EAN);

    	function EAN8(data, options) {
    		_classCallCheck$j(this, EAN8);

    		// Add checksum if it does not exist
    		if (data.search(/^[0-9]{7}$/) !== -1) {
    			data += checksum$3(data);
    		}

    		return _possibleConstructorReturn$f(this, (EAN8.__proto__ || Object.getPrototypeOf(EAN8)).call(this, data, options));
    	}

    	_createClass$e(EAN8, [{
    		key: 'valid',
    		value: function valid() {
    			return this.data.search(/^[0-9]{8}$/) !== -1 && +this.data[7] === checksum$3(this.data);
    		}
    	}, {
    		key: 'leftText',
    		value: function leftText() {
    			return _get(EAN8.prototype.__proto__ || Object.getPrototypeOf(EAN8.prototype), 'leftText', this).call(this, 0, 4);
    		}
    	}, {
    		key: 'leftEncode',
    		value: function leftEncode() {
    			var data = this.data.substr(0, 4);
    			return _get(EAN8.prototype.__proto__ || Object.getPrototypeOf(EAN8.prototype), 'leftEncode', this).call(this, data, 'LLLL');
    		}
    	}, {
    		key: 'rightText',
    		value: function rightText() {
    			return _get(EAN8.prototype.__proto__ || Object.getPrototypeOf(EAN8.prototype), 'rightText', this).call(this, 4, 4);
    		}
    	}, {
    		key: 'rightEncode',
    		value: function rightEncode() {
    			var data = this.data.substr(4, 4);
    			return _get(EAN8.prototype.__proto__ || Object.getPrototypeOf(EAN8.prototype), 'rightEncode', this).call(this, data, 'RRRR');
    		}
    	}]);

    	return EAN8;
    }(_EAN3$1.default);

    EAN8$1.default = EAN8;

    var EAN5$1 = {};

    Object.defineProperty(EAN5$1, "__esModule", {
    	value: true
    });

    var _createClass$d = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _constants$2 = constants$1;

    var _encoder$3 = encoder;

    var _encoder2$3 = _interopRequireDefault$n(_encoder$3);

    var _Barcode2$8 = Barcode$1;

    var _Barcode3$8 = _interopRequireDefault$n(_Barcode2$8);

    function _interopRequireDefault$n(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$i(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn$e(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits$e(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Encoding documentation:
    // https://en.wikipedia.org/wiki/EAN_5#Encoding

    var checksum$2 = function checksum(data) {
    	var result = data.split('').map(function (n) {
    		return +n;
    	}).reduce(function (sum, a, idx) {
    		return idx % 2 ? sum + a * 9 : sum + a * 3;
    	}, 0);
    	return result % 10;
    };

    var EAN5 = function (_Barcode) {
    	_inherits$e(EAN5, _Barcode);

    	function EAN5(data, options) {
    		_classCallCheck$i(this, EAN5);

    		return _possibleConstructorReturn$e(this, (EAN5.__proto__ || Object.getPrototypeOf(EAN5)).call(this, data, options));
    	}

    	_createClass$d(EAN5, [{
    		key: 'valid',
    		value: function valid() {
    			return this.data.search(/^[0-9]{5}$/) !== -1;
    		}
    	}, {
    		key: 'encode',
    		value: function encode() {
    			var structure = _constants$2.EAN5_STRUCTURE[checksum$2(this.data)];
    			return {
    				data: '1011' + (0, _encoder2$3.default)(this.data, structure, '01'),
    				text: this.text
    			};
    		}
    	}]);

    	return EAN5;
    }(_Barcode3$8.default);

    EAN5$1.default = EAN5;

    var EAN2$1 = {};

    Object.defineProperty(EAN2$1, "__esModule", {
    	value: true
    });

    var _createClass$c = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _constants$1 = constants$1;

    var _encoder$2 = encoder;

    var _encoder2$2 = _interopRequireDefault$m(_encoder$2);

    var _Barcode2$7 = Barcode$1;

    var _Barcode3$7 = _interopRequireDefault$m(_Barcode2$7);

    function _interopRequireDefault$m(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$h(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn$d(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits$d(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Encoding documentation:
    // https://en.wikipedia.org/wiki/EAN_2#Encoding

    var EAN2 = function (_Barcode) {
    	_inherits$d(EAN2, _Barcode);

    	function EAN2(data, options) {
    		_classCallCheck$h(this, EAN2);

    		return _possibleConstructorReturn$d(this, (EAN2.__proto__ || Object.getPrototypeOf(EAN2)).call(this, data, options));
    	}

    	_createClass$c(EAN2, [{
    		key: 'valid',
    		value: function valid() {
    			return this.data.search(/^[0-9]{2}$/) !== -1;
    		}
    	}, {
    		key: 'encode',
    		value: function encode() {
    			// Choose the structure based on the number mod 4
    			var structure = _constants$1.EAN2_STRUCTURE[parseInt(this.data) % 4];
    			return {
    				// Start bits + Encode the two digits with 01 in between
    				data: '1011' + (0, _encoder2$2.default)(this.data, structure, '01'),
    				text: this.text
    			};
    		}
    	}]);

    	return EAN2;
    }(_Barcode3$7.default);

    EAN2$1.default = EAN2;

    var UPC$1 = {};

    Object.defineProperty(UPC$1, "__esModule", {
    	value: true
    });

    var _createClass$b = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    UPC$1.checksum = checksum$1;

    var _encoder$1 = encoder;

    var _encoder2$1 = _interopRequireDefault$l(_encoder$1);

    var _Barcode2$6 = Barcode$1;

    var _Barcode3$6 = _interopRequireDefault$l(_Barcode2$6);

    function _interopRequireDefault$l(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$g(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn$c(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits$c(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Encoding documentation:
    // https://en.wikipedia.org/wiki/Universal_Product_Code#Encoding

    var UPC = function (_Barcode) {
    	_inherits$c(UPC, _Barcode);

    	function UPC(data, options) {
    		_classCallCheck$g(this, UPC);

    		// Add checksum if it does not exist
    		if (data.search(/^[0-9]{11}$/) !== -1) {
    			data += checksum$1(data);
    		}

    		var _this = _possibleConstructorReturn$c(this, (UPC.__proto__ || Object.getPrototypeOf(UPC)).call(this, data, options));

    		_this.displayValue = options.displayValue;

    		// Make sure the font is not bigger than the space between the guard bars
    		if (options.fontSize > options.width * 10) {
    			_this.fontSize = options.width * 10;
    		} else {
    			_this.fontSize = options.fontSize;
    		}

    		// Make the guard bars go down half the way of the text
    		_this.guardHeight = options.height + _this.fontSize / 2 + options.textMargin;
    		return _this;
    	}

    	_createClass$b(UPC, [{
    		key: "valid",
    		value: function valid() {
    			return this.data.search(/^[0-9]{12}$/) !== -1 && this.data[11] == checksum$1(this.data);
    		}
    	}, {
    		key: "encode",
    		value: function encode() {
    			if (this.options.flat) {
    				return this.flatEncoding();
    			} else {
    				return this.guardedEncoding();
    			}
    		}
    	}, {
    		key: "flatEncoding",
    		value: function flatEncoding() {
    			var result = "";

    			result += "101";
    			result += (0, _encoder2$1.default)(this.data.substr(0, 6), "LLLLLL");
    			result += "01010";
    			result += (0, _encoder2$1.default)(this.data.substr(6, 6), "RRRRRR");
    			result += "101";

    			return {
    				data: result,
    				text: this.text
    			};
    		}
    	}, {
    		key: "guardedEncoding",
    		value: function guardedEncoding() {
    			var result = [];

    			// Add the first digit
    			if (this.displayValue) {
    				result.push({
    					data: "00000000",
    					text: this.text.substr(0, 1),
    					options: { textAlign: "left", fontSize: this.fontSize }
    				});
    			}

    			// Add the guard bars
    			result.push({
    				data: "101" + (0, _encoder2$1.default)(this.data[0], "L"),
    				options: { height: this.guardHeight }
    			});

    			// Add the left side
    			result.push({
    				data: (0, _encoder2$1.default)(this.data.substr(1, 5), "LLLLL"),
    				text: this.text.substr(1, 5),
    				options: { fontSize: this.fontSize }
    			});

    			// Add the middle bits
    			result.push({
    				data: "01010",
    				options: { height: this.guardHeight }
    			});

    			// Add the right side
    			result.push({
    				data: (0, _encoder2$1.default)(this.data.substr(6, 5), "RRRRR"),
    				text: this.text.substr(6, 5),
    				options: { fontSize: this.fontSize }
    			});

    			// Add the end bits
    			result.push({
    				data: (0, _encoder2$1.default)(this.data[11], "R") + "101",
    				options: { height: this.guardHeight }
    			});

    			// Add the last digit
    			if (this.displayValue) {
    				result.push({
    					data: "00000000",
    					text: this.text.substr(11, 1),
    					options: { textAlign: "right", fontSize: this.fontSize }
    				});
    			}

    			return result;
    		}
    	}]);

    	return UPC;
    }(_Barcode3$6.default);

    // Calulate the checksum digit
    // https://en.wikipedia.org/wiki/International_Article_Number_(EAN)#Calculation_of_checksum_digit


    function checksum$1(number) {
    	var result = 0;

    	var i;
    	for (i = 1; i < 11; i += 2) {
    		result += parseInt(number[i]);
    	}
    	for (i = 0; i < 11; i += 2) {
    		result += parseInt(number[i]) * 3;
    	}

    	return (10 - result % 10) % 10;
    }

    UPC$1.default = UPC;

    var UPCE$1 = {};

    Object.defineProperty(UPCE$1, "__esModule", {
    	value: true
    });

    var _createClass$a = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _encoder = encoder;

    var _encoder2 = _interopRequireDefault$k(_encoder);

    var _Barcode2$5 = Barcode$1;

    var _Barcode3$5 = _interopRequireDefault$k(_Barcode2$5);

    var _UPC$1 = UPC$1;

    function _interopRequireDefault$k(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$f(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn$b(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits$b(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Encoding documentation:
    // https://en.wikipedia.org/wiki/Universal_Product_Code#Encoding
    //
    // UPC-E documentation:
    // https://en.wikipedia.org/wiki/Universal_Product_Code#UPC-E

    var EXPANSIONS = ["XX00000XXX", "XX10000XXX", "XX20000XXX", "XXX00000XX", "XXXX00000X", "XXXXX00005", "XXXXX00006", "XXXXX00007", "XXXXX00008", "XXXXX00009"];

    var PARITIES = [["EEEOOO", "OOOEEE"], ["EEOEOO", "OOEOEE"], ["EEOOEO", "OOEEOE"], ["EEOOOE", "OOEEEO"], ["EOEEOO", "OEOOEE"], ["EOOEEO", "OEEOOE"], ["EOOOEE", "OEEEOO"], ["EOEOEO", "OEOEOE"], ["EOEOOE", "OEOEEO"], ["EOOEOE", "OEEOEO"]];

    var UPCE = function (_Barcode) {
    	_inherits$b(UPCE, _Barcode);

    	function UPCE(data, options) {
    		_classCallCheck$f(this, UPCE);

    		var _this = _possibleConstructorReturn$b(this, (UPCE.__proto__ || Object.getPrototypeOf(UPCE)).call(this, data, options));
    		// Code may be 6 or 8 digits;
    		// A 7 digit code is ambiguous as to whether the extra digit
    		// is a UPC-A check or number system digit.


    		_this.isValid = false;
    		if (data.search(/^[0-9]{6}$/) !== -1) {
    			_this.middleDigits = data;
    			_this.upcA = expandToUPCA(data, "0");
    			_this.text = options.text || '' + _this.upcA[0] + data + _this.upcA[_this.upcA.length - 1];
    			_this.isValid = true;
    		} else if (data.search(/^[01][0-9]{7}$/) !== -1) {
    			_this.middleDigits = data.substring(1, data.length - 1);
    			_this.upcA = expandToUPCA(_this.middleDigits, data[0]);

    			if (_this.upcA[_this.upcA.length - 1] === data[data.length - 1]) {
    				_this.isValid = true;
    			} else {
    				// checksum mismatch
    				return _possibleConstructorReturn$b(_this);
    			}
    		} else {
    			return _possibleConstructorReturn$b(_this);
    		}

    		_this.displayValue = options.displayValue;

    		// Make sure the font is not bigger than the space between the guard bars
    		if (options.fontSize > options.width * 10) {
    			_this.fontSize = options.width * 10;
    		} else {
    			_this.fontSize = options.fontSize;
    		}

    		// Make the guard bars go down half the way of the text
    		_this.guardHeight = options.height + _this.fontSize / 2 + options.textMargin;
    		return _this;
    	}

    	_createClass$a(UPCE, [{
    		key: 'valid',
    		value: function valid() {
    			return this.isValid;
    		}
    	}, {
    		key: 'encode',
    		value: function encode() {
    			if (this.options.flat) {
    				return this.flatEncoding();
    			} else {
    				return this.guardedEncoding();
    			}
    		}
    	}, {
    		key: 'flatEncoding',
    		value: function flatEncoding() {
    			var result = "";

    			result += "101";
    			result += this.encodeMiddleDigits();
    			result += "010101";

    			return {
    				data: result,
    				text: this.text
    			};
    		}
    	}, {
    		key: 'guardedEncoding',
    		value: function guardedEncoding() {
    			var result = [];

    			// Add the UPC-A number system digit beneath the quiet zone
    			if (this.displayValue) {
    				result.push({
    					data: "00000000",
    					text: this.text[0],
    					options: { textAlign: "left", fontSize: this.fontSize }
    				});
    			}

    			// Add the guard bars
    			result.push({
    				data: "101",
    				options: { height: this.guardHeight }
    			});

    			// Add the 6 UPC-E digits
    			result.push({
    				data: this.encodeMiddleDigits(),
    				text: this.text.substring(1, 7),
    				options: { fontSize: this.fontSize }
    			});

    			// Add the end bits
    			result.push({
    				data: "010101",
    				options: { height: this.guardHeight }
    			});

    			// Add the UPC-A check digit beneath the quiet zone
    			if (this.displayValue) {
    				result.push({
    					data: "00000000",
    					text: this.text[7],
    					options: { textAlign: "right", fontSize: this.fontSize }
    				});
    			}

    			return result;
    		}
    	}, {
    		key: 'encodeMiddleDigits',
    		value: function encodeMiddleDigits() {
    			var numberSystem = this.upcA[0];
    			var checkDigit = this.upcA[this.upcA.length - 1];
    			var parity = PARITIES[parseInt(checkDigit)][parseInt(numberSystem)];
    			return (0, _encoder2.default)(this.middleDigits, parity);
    		}
    	}]);

    	return UPCE;
    }(_Barcode3$5.default);

    function expandToUPCA(middleDigits, numberSystem) {
    	var lastUpcE = parseInt(middleDigits[middleDigits.length - 1]);
    	var expansion = EXPANSIONS[lastUpcE];

    	var result = "";
    	var digitIndex = 0;
    	for (var i = 0; i < expansion.length; i++) {
    		var c = expansion[i];
    		if (c === 'X') {
    			result += middleDigits[digitIndex++];
    		} else {
    			result += c;
    		}
    	}

    	result = '' + numberSystem + result;
    	return '' + result + (0, _UPC$1.checksum)(result);
    }

    UPCE$1.default = UPCE;

    Object.defineProperty(EAN_UPC, "__esModule", {
      value: true
    });
    EAN_UPC.UPCE = EAN_UPC.UPC = EAN_UPC.EAN2 = EAN_UPC.EAN5 = EAN_UPC.EAN8 = EAN_UPC.EAN13 = undefined;

    var _EAN = EAN13$1;

    var _EAN2 = _interopRequireDefault$j(_EAN);

    var _EAN3 = EAN8$1;

    var _EAN4 = _interopRequireDefault$j(_EAN3);

    var _EAN5 = EAN5$1;

    var _EAN6 = _interopRequireDefault$j(_EAN5);

    var _EAN7 = EAN2$1;

    var _EAN8 = _interopRequireDefault$j(_EAN7);

    var _UPC = UPC$1;

    var _UPC2 = _interopRequireDefault$j(_UPC);

    var _UPCE = UPCE$1;

    var _UPCE2 = _interopRequireDefault$j(_UPCE);

    function _interopRequireDefault$j(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    EAN_UPC.EAN13 = _EAN2.default;
    EAN_UPC.EAN8 = _EAN4.default;
    EAN_UPC.EAN5 = _EAN6.default;
    EAN_UPC.EAN2 = _EAN8.default;
    EAN_UPC.UPC = _UPC2.default;
    EAN_UPC.UPCE = _UPCE2.default;

    var ITF$2 = {};

    var ITF$1 = {};

    var constants = {};

    Object.defineProperty(constants, "__esModule", {
    	value: true
    });
    constants.START_BIN = '1010';
    constants.END_BIN = '11101';

    constants.BINARIES = ['00110', '10001', '01001', '11000', '00101', '10100', '01100', '00011', '10010', '01010'];

    Object.defineProperty(ITF$1, "__esModule", {
    	value: true
    });

    var _createClass$9 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _constants = constants;

    var _Barcode2$4 = Barcode$1;

    var _Barcode3$4 = _interopRequireDefault$i(_Barcode2$4);

    function _interopRequireDefault$i(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$e(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn$a(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits$a(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var ITF = function (_Barcode) {
    	_inherits$a(ITF, _Barcode);

    	function ITF() {
    		_classCallCheck$e(this, ITF);

    		return _possibleConstructorReturn$a(this, (ITF.__proto__ || Object.getPrototypeOf(ITF)).apply(this, arguments));
    	}

    	_createClass$9(ITF, [{
    		key: 'valid',
    		value: function valid() {
    			return this.data.search(/^([0-9]{2})+$/) !== -1;
    		}
    	}, {
    		key: 'encode',
    		value: function encode() {
    			var _this2 = this;

    			// Calculate all the digit pairs
    			var encoded = this.data.match(/.{2}/g).map(function (pair) {
    				return _this2.encodePair(pair);
    			}).join('');

    			return {
    				data: _constants.START_BIN + encoded + _constants.END_BIN,
    				text: this.text
    			};
    		}

    		// Calculate the data of a number pair

    	}, {
    		key: 'encodePair',
    		value: function encodePair(pair) {
    			var second = _constants.BINARIES[pair[1]];

    			return _constants.BINARIES[pair[0]].split('').map(function (first, idx) {
    				return (first === '1' ? '111' : '1') + (second[idx] === '1' ? '000' : '0');
    			}).join('');
    		}
    	}]);

    	return ITF;
    }(_Barcode3$4.default);

    ITF$1.default = ITF;

    var ITF14$1 = {};

    Object.defineProperty(ITF14$1, "__esModule", {
    	value: true
    });

    var _createClass$8 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _ITF2$1 = ITF$1;

    var _ITF3$1 = _interopRequireDefault$h(_ITF2$1);

    function _interopRequireDefault$h(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$d(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn$9(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits$9(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    // Calculate the checksum digit
    var checksum = function checksum(data) {
    	var res = data.substr(0, 13).split('').map(function (num) {
    		return parseInt(num, 10);
    	}).reduce(function (sum, n, idx) {
    		return sum + n * (3 - idx % 2 * 2);
    	}, 0);

    	return Math.ceil(res / 10) * 10 - res;
    };

    var ITF14 = function (_ITF) {
    	_inherits$9(ITF14, _ITF);

    	function ITF14(data, options) {
    		_classCallCheck$d(this, ITF14);

    		// Add checksum if it does not exist
    		if (data.search(/^[0-9]{13}$/) !== -1) {
    			data += checksum(data);
    		}
    		return _possibleConstructorReturn$9(this, (ITF14.__proto__ || Object.getPrototypeOf(ITF14)).call(this, data, options));
    	}

    	_createClass$8(ITF14, [{
    		key: 'valid',
    		value: function valid() {
    			return this.data.search(/^[0-9]{14}$/) !== -1 && +this.data[13] === checksum(this.data);
    		}
    	}]);

    	return ITF14;
    }(_ITF3$1.default);

    ITF14$1.default = ITF14;

    Object.defineProperty(ITF$2, "__esModule", {
      value: true
    });
    ITF$2.ITF14 = ITF$2.ITF = undefined;

    var _ITF$1 = ITF$1;

    var _ITF2 = _interopRequireDefault$g(_ITF$1);

    var _ITF3 = ITF14$1;

    var _ITF4 = _interopRequireDefault$g(_ITF3);

    function _interopRequireDefault$g(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    ITF$2.ITF = _ITF2.default;
    ITF$2.ITF14 = _ITF4.default;

    var MSI$2 = {};

    var MSI$1 = {};

    Object.defineProperty(MSI$1, "__esModule", {
    	value: true
    });

    var _createClass$7 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _Barcode2$3 = Barcode$1;

    var _Barcode3$3 = _interopRequireDefault$f(_Barcode2$3);

    function _interopRequireDefault$f(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$c(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn$8(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits$8(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Encoding documentation
    // https://en.wikipedia.org/wiki/MSI_Barcode#Character_set_and_binary_lookup

    var MSI = function (_Barcode) {
    	_inherits$8(MSI, _Barcode);

    	function MSI(data, options) {
    		_classCallCheck$c(this, MSI);

    		return _possibleConstructorReturn$8(this, (MSI.__proto__ || Object.getPrototypeOf(MSI)).call(this, data, options));
    	}

    	_createClass$7(MSI, [{
    		key: "encode",
    		value: function encode() {
    			// Start bits
    			var ret = "110";

    			for (var i = 0; i < this.data.length; i++) {
    				// Convert the character to binary (always 4 binary digits)
    				var digit = parseInt(this.data[i]);
    				var bin = digit.toString(2);
    				bin = addZeroes(bin, 4 - bin.length);

    				// Add 100 for every zero and 110 for every 1
    				for (var b = 0; b < bin.length; b++) {
    					ret += bin[b] == "0" ? "100" : "110";
    				}
    			}

    			// End bits
    			ret += "1001";

    			return {
    				data: ret,
    				text: this.text
    			};
    		}
    	}, {
    		key: "valid",
    		value: function valid() {
    			return this.data.search(/^[0-9]+$/) !== -1;
    		}
    	}]);

    	return MSI;
    }(_Barcode3$3.default);

    function addZeroes(number, n) {
    	for (var i = 0; i < n; i++) {
    		number = "0" + number;
    	}
    	return number;
    }

    MSI$1.default = MSI;

    var MSI10$1 = {};

    var checksums = {};

    Object.defineProperty(checksums, "__esModule", {
    	value: true
    });
    checksums.mod10 = mod10;
    checksums.mod11 = mod11;
    function mod10(number) {
    	var sum = 0;
    	for (var i = 0; i < number.length; i++) {
    		var n = parseInt(number[i]);
    		if ((i + number.length) % 2 === 0) {
    			sum += n;
    		} else {
    			sum += n * 2 % 10 + Math.floor(n * 2 / 10);
    		}
    	}
    	return (10 - sum % 10) % 10;
    }

    function mod11(number) {
    	var sum = 0;
    	var weights = [2, 3, 4, 5, 6, 7];
    	for (var i = 0; i < number.length; i++) {
    		var n = parseInt(number[number.length - 1 - i]);
    		sum += weights[i % weights.length] * n;
    	}
    	return (11 - sum % 11) % 11;
    }

    Object.defineProperty(MSI10$1, "__esModule", {
    	value: true
    });

    var _MSI2$4 = MSI$1;

    var _MSI3$4 = _interopRequireDefault$e(_MSI2$4);

    var _checksums$3 = checksums;

    function _interopRequireDefault$e(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$b(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn$7(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits$7(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var MSI10 = function (_MSI) {
    	_inherits$7(MSI10, _MSI);

    	function MSI10(data, options) {
    		_classCallCheck$b(this, MSI10);

    		return _possibleConstructorReturn$7(this, (MSI10.__proto__ || Object.getPrototypeOf(MSI10)).call(this, data + (0, _checksums$3.mod10)(data), options));
    	}

    	return MSI10;
    }(_MSI3$4.default);

    MSI10$1.default = MSI10;

    var MSI11$1 = {};

    Object.defineProperty(MSI11$1, "__esModule", {
    	value: true
    });

    var _MSI2$3 = MSI$1;

    var _MSI3$3 = _interopRequireDefault$d(_MSI2$3);

    var _checksums$2 = checksums;

    function _interopRequireDefault$d(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$a(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn$6(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits$6(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var MSI11 = function (_MSI) {
    	_inherits$6(MSI11, _MSI);

    	function MSI11(data, options) {
    		_classCallCheck$a(this, MSI11);

    		return _possibleConstructorReturn$6(this, (MSI11.__proto__ || Object.getPrototypeOf(MSI11)).call(this, data + (0, _checksums$2.mod11)(data), options));
    	}

    	return MSI11;
    }(_MSI3$3.default);

    MSI11$1.default = MSI11;

    var MSI1010$1 = {};

    Object.defineProperty(MSI1010$1, "__esModule", {
    	value: true
    });

    var _MSI2$2 = MSI$1;

    var _MSI3$2 = _interopRequireDefault$c(_MSI2$2);

    var _checksums$1 = checksums;

    function _interopRequireDefault$c(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$9(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn$5(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits$5(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var MSI1010 = function (_MSI) {
    	_inherits$5(MSI1010, _MSI);

    	function MSI1010(data, options) {
    		_classCallCheck$9(this, MSI1010);

    		data += (0, _checksums$1.mod10)(data);
    		data += (0, _checksums$1.mod10)(data);
    		return _possibleConstructorReturn$5(this, (MSI1010.__proto__ || Object.getPrototypeOf(MSI1010)).call(this, data, options));
    	}

    	return MSI1010;
    }(_MSI3$2.default);

    MSI1010$1.default = MSI1010;

    var MSI1110$1 = {};

    Object.defineProperty(MSI1110$1, "__esModule", {
    	value: true
    });

    var _MSI2$1 = MSI$1;

    var _MSI3$1 = _interopRequireDefault$b(_MSI2$1);

    var _checksums = checksums;

    function _interopRequireDefault$b(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$8(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn$4(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits$4(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var MSI1110 = function (_MSI) {
    	_inherits$4(MSI1110, _MSI);

    	function MSI1110(data, options) {
    		_classCallCheck$8(this, MSI1110);

    		data += (0, _checksums.mod11)(data);
    		data += (0, _checksums.mod10)(data);
    		return _possibleConstructorReturn$4(this, (MSI1110.__proto__ || Object.getPrototypeOf(MSI1110)).call(this, data, options));
    	}

    	return MSI1110;
    }(_MSI3$1.default);

    MSI1110$1.default = MSI1110;

    Object.defineProperty(MSI$2, "__esModule", {
      value: true
    });
    MSI$2.MSI1110 = MSI$2.MSI1010 = MSI$2.MSI11 = MSI$2.MSI10 = MSI$2.MSI = undefined;

    var _MSI$1 = MSI$1;

    var _MSI2 = _interopRequireDefault$a(_MSI$1);

    var _MSI3 = MSI10$1;

    var _MSI4 = _interopRequireDefault$a(_MSI3);

    var _MSI5 = MSI11$1;

    var _MSI6 = _interopRequireDefault$a(_MSI5);

    var _MSI7 = MSI1010$1;

    var _MSI8 = _interopRequireDefault$a(_MSI7);

    var _MSI9 = MSI1110$1;

    var _MSI10 = _interopRequireDefault$a(_MSI9);

    function _interopRequireDefault$a(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    MSI$2.MSI = _MSI2.default;
    MSI$2.MSI10 = _MSI4.default;
    MSI$2.MSI11 = _MSI6.default;
    MSI$2.MSI1010 = _MSI8.default;
    MSI$2.MSI1110 = _MSI10.default;

    var pharmacode$1 = {};

    Object.defineProperty(pharmacode$1, "__esModule", {
    	value: true
    });
    pharmacode$1.pharmacode = undefined;

    var _createClass$6 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _Barcode2$2 = Barcode$1;

    var _Barcode3$2 = _interopRequireDefault$9(_Barcode2$2);

    function _interopRequireDefault$9(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$7(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn$3(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits$3(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Encoding documentation
    // http://www.gomaro.ch/ftproot/Laetus_PHARMA-CODE.pdf

    var pharmacode = function (_Barcode) {
    	_inherits$3(pharmacode, _Barcode);

    	function pharmacode(data, options) {
    		_classCallCheck$7(this, pharmacode);

    		var _this = _possibleConstructorReturn$3(this, (pharmacode.__proto__ || Object.getPrototypeOf(pharmacode)).call(this, data, options));

    		_this.number = parseInt(data, 10);
    		return _this;
    	}

    	_createClass$6(pharmacode, [{
    		key: "encode",
    		value: function encode() {
    			var z = this.number;
    			var result = "";

    			// http://i.imgur.com/RMm4UDJ.png
    			// (source: http://www.gomaro.ch/ftproot/Laetus_PHARMA-CODE.pdf, page: 34)
    			while (!isNaN(z) && z != 0) {
    				if (z % 2 === 0) {
    					// Even
    					result = "11100" + result;
    					z = (z - 2) / 2;
    				} else {
    					// Odd
    					result = "100" + result;
    					z = (z - 1) / 2;
    				}
    			}

    			// Remove the two last zeroes
    			result = result.slice(0, -2);

    			return {
    				data: result,
    				text: this.text
    			};
    		}
    	}, {
    		key: "valid",
    		value: function valid() {
    			return this.number >= 3 && this.number <= 131070;
    		}
    	}]);

    	return pharmacode;
    }(_Barcode3$2.default);

    pharmacode$1.pharmacode = pharmacode;

    var codabar$1 = {};

    Object.defineProperty(codabar$1, "__esModule", {
    	value: true
    });
    codabar$1.codabar = undefined;

    var _createClass$5 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _Barcode2$1 = Barcode$1;

    var _Barcode3$1 = _interopRequireDefault$8(_Barcode2$1);

    function _interopRequireDefault$8(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$6(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn$2(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits$2(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Encoding specification:
    // http://www.barcodeisland.com/codabar.phtml

    var codabar = function (_Barcode) {
    	_inherits$2(codabar, _Barcode);

    	function codabar(data, options) {
    		_classCallCheck$6(this, codabar);

    		if (data.search(/^[0-9\-\$\:\.\+\/]+$/) === 0) {
    			data = "A" + data + "A";
    		}

    		var _this = _possibleConstructorReturn$2(this, (codabar.__proto__ || Object.getPrototypeOf(codabar)).call(this, data.toUpperCase(), options));

    		_this.text = _this.options.text || _this.text.replace(/[A-D]/g, '');
    		return _this;
    	}

    	_createClass$5(codabar, [{
    		key: "valid",
    		value: function valid() {
    			return this.data.search(/^[A-D][0-9\-\$\:\.\+\/]+[A-D]$/) !== -1;
    		}
    	}, {
    		key: "encode",
    		value: function encode() {
    			var result = [];
    			var encodings = this.getEncodings();
    			for (var i = 0; i < this.data.length; i++) {
    				result.push(encodings[this.data.charAt(i)]);
    				// for all characters except the last, append a narrow-space ("0")
    				if (i !== this.data.length - 1) {
    					result.push("0");
    				}
    			}
    			return {
    				text: this.text,
    				data: result.join('')
    			};
    		}
    	}, {
    		key: "getEncodings",
    		value: function getEncodings() {
    			return {
    				"0": "101010011",
    				"1": "101011001",
    				"2": "101001011",
    				"3": "110010101",
    				"4": "101101001",
    				"5": "110101001",
    				"6": "100101011",
    				"7": "100101101",
    				"8": "100110101",
    				"9": "110100101",
    				"-": "101001101",
    				"$": "101100101",
    				":": "1101011011",
    				"/": "1101101011",
    				".": "1101101101",
    				"+": "1011011011",
    				"A": "1011001001",
    				"B": "1001001011",
    				"C": "1010010011",
    				"D": "1010011001"
    			};
    		}
    	}]);

    	return codabar;
    }(_Barcode3$1.default);

    codabar$1.codabar = codabar;

    var GenericBarcode$1 = {};

    Object.defineProperty(GenericBarcode$1, "__esModule", {
    	value: true
    });
    GenericBarcode$1.GenericBarcode = undefined;

    var _createClass$4 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _Barcode2 = Barcode$1;

    var _Barcode3 = _interopRequireDefault$7(_Barcode2);

    function _interopRequireDefault$7(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$5(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn$1(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits$1(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var GenericBarcode = function (_Barcode) {
    	_inherits$1(GenericBarcode, _Barcode);

    	function GenericBarcode(data, options) {
    		_classCallCheck$5(this, GenericBarcode);

    		return _possibleConstructorReturn$1(this, (GenericBarcode.__proto__ || Object.getPrototypeOf(GenericBarcode)).call(this, data, options)); // Sets this.data and this.text
    	}

    	// Return the corresponding binary numbers for the data provided


    	_createClass$4(GenericBarcode, [{
    		key: "encode",
    		value: function encode() {
    			return {
    				data: "10101010101010101010101010101010101010101",
    				text: this.text
    			};
    		}

    		// Resturn true/false if the string provided is valid for this encoder

    	}, {
    		key: "valid",
    		value: function valid() {
    			return true;
    		}
    	}]);

    	return GenericBarcode;
    }(_Barcode3.default);

    GenericBarcode$1.GenericBarcode = GenericBarcode;

    Object.defineProperty(barcodes, "__esModule", {
    	value: true
    });

    var _CODE = CODE39$1;

    var _CODE2 = CODE128$2;

    var _EAN_UPC = EAN_UPC;

    var _ITF = ITF$2;

    var _MSI = MSI$2;

    var _pharmacode = pharmacode$1;

    var _codabar = codabar$1;

    var _GenericBarcode = GenericBarcode$1;

    barcodes.default = {
    	CODE39: _CODE.CODE39,
    	CODE128: _CODE2.CODE128, CODE128A: _CODE2.CODE128A, CODE128B: _CODE2.CODE128B, CODE128C: _CODE2.CODE128C,
    	EAN13: _EAN_UPC.EAN13, EAN8: _EAN_UPC.EAN8, EAN5: _EAN_UPC.EAN5, EAN2: _EAN_UPC.EAN2, UPC: _EAN_UPC.UPC, UPCE: _EAN_UPC.UPCE,
    	ITF14: _ITF.ITF14,
    	ITF: _ITF.ITF,
    	MSI: _MSI.MSI, MSI10: _MSI.MSI10, MSI11: _MSI.MSI11, MSI1010: _MSI.MSI1010, MSI1110: _MSI.MSI1110,
    	pharmacode: _pharmacode.pharmacode,
    	codabar: _codabar.codabar,
    	GenericBarcode: _GenericBarcode.GenericBarcode
    };

    var merge = {};

    Object.defineProperty(merge, "__esModule", {
      value: true
    });

    var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

    merge.default = function (old, replaceObj) {
      return _extends({}, old, replaceObj);
    };

    var linearizeEncodings$1 = {};

    Object.defineProperty(linearizeEncodings$1, "__esModule", {
    	value: true
    });
    linearizeEncodings$1.default = linearizeEncodings;

    // Encodings can be nestled like [[1-1, 1-2], 2, [3-1, 3-2]
    // Convert to [1-1, 1-2, 2, 3-1, 3-2]

    function linearizeEncodings(encodings) {
    	var linearEncodings = [];
    	function nextLevel(encoded) {
    		if (Array.isArray(encoded)) {
    			for (var i = 0; i < encoded.length; i++) {
    				nextLevel(encoded[i]);
    			}
    		} else {
    			encoded.text = encoded.text || "";
    			encoded.data = encoded.data || "";
    			linearEncodings.push(encoded);
    		}
    	}
    	nextLevel(encodings);

    	return linearEncodings;
    }

    var fixOptions$1 = {};

    Object.defineProperty(fixOptions$1, "__esModule", {
    	value: true
    });
    fixOptions$1.default = fixOptions;


    function fixOptions(options) {
    	// Fix the margins
    	options.marginTop = options.marginTop || options.margin;
    	options.marginBottom = options.marginBottom || options.margin;
    	options.marginRight = options.marginRight || options.margin;
    	options.marginLeft = options.marginLeft || options.margin;

    	return options;
    }

    var getRenderProperties$1 = {};

    var getOptionsFromElement$1 = {};

    var optionsFromStrings$1 = {};

    Object.defineProperty(optionsFromStrings$1, "__esModule", {
    	value: true
    });
    optionsFromStrings$1.default = optionsFromStrings;

    // Convert string to integers/booleans where it should be

    function optionsFromStrings(options) {
    	var intOptions = ["width", "height", "textMargin", "fontSize", "margin", "marginTop", "marginBottom", "marginLeft", "marginRight"];

    	for (var intOption in intOptions) {
    		if (intOptions.hasOwnProperty(intOption)) {
    			intOption = intOptions[intOption];
    			if (typeof options[intOption] === "string") {
    				options[intOption] = parseInt(options[intOption], 10);
    			}
    		}
    	}

    	if (typeof options["displayValue"] === "string") {
    		options["displayValue"] = options["displayValue"] != "false";
    	}

    	return options;
    }

    var defaults$1 = {};

    Object.defineProperty(defaults$1, "__esModule", {
    	value: true
    });
    var defaults = {
    	width: 2,
    	height: 100,
    	format: "auto",
    	displayValue: true,
    	fontOptions: "",
    	font: "monospace",
    	text: undefined,
    	textAlign: "center",
    	textPosition: "bottom",
    	textMargin: 2,
    	fontSize: 20,
    	background: "#ffffff",
    	lineColor: "#000000",
    	margin: 10,
    	marginTop: undefined,
    	marginBottom: undefined,
    	marginLeft: undefined,
    	marginRight: undefined,
    	valid: function valid() {}
    };

    defaults$1.default = defaults;

    Object.defineProperty(getOptionsFromElement$1, "__esModule", {
    	value: true
    });

    var _optionsFromStrings$1 = optionsFromStrings$1;

    var _optionsFromStrings2$1 = _interopRequireDefault$6(_optionsFromStrings$1);

    var _defaults$1 = defaults$1;

    var _defaults2$1 = _interopRequireDefault$6(_defaults$1);

    function _interopRequireDefault$6(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function getOptionsFromElement(element) {
    	var options = {};
    	for (var property in _defaults2$1.default) {
    		if (_defaults2$1.default.hasOwnProperty(property)) {
    			// jsbarcode-*
    			if (element.hasAttribute("jsbarcode-" + property.toLowerCase())) {
    				options[property] = element.getAttribute("jsbarcode-" + property.toLowerCase());
    			}

    			// data-*
    			if (element.hasAttribute("data-" + property.toLowerCase())) {
    				options[property] = element.getAttribute("data-" + property.toLowerCase());
    			}
    		}
    	}

    	options["value"] = element.getAttribute("jsbarcode-value") || element.getAttribute("data-value");

    	// Since all atributes are string they need to be converted to integers
    	options = (0, _optionsFromStrings2$1.default)(options);

    	return options;
    }

    getOptionsFromElement$1.default = getOptionsFromElement;

    var renderers = {};

    var canvas = {};

    var shared = {};

    Object.defineProperty(shared, "__esModule", {
    	value: true
    });
    shared.getTotalWidthOfEncodings = shared.calculateEncodingAttributes = shared.getBarcodePadding = shared.getEncodingHeight = shared.getMaximumHeightOfEncodings = undefined;

    var _merge$3 = merge;

    var _merge2$3 = _interopRequireDefault$5(_merge$3);

    function _interopRequireDefault$5(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function getEncodingHeight(encoding, options) {
    	return options.height + (options.displayValue && encoding.text.length > 0 ? options.fontSize + options.textMargin : 0) + options.marginTop + options.marginBottom;
    }

    function getBarcodePadding(textWidth, barcodeWidth, options) {
    	if (options.displayValue && barcodeWidth < textWidth) {
    		if (options.textAlign == "center") {
    			return Math.floor((textWidth - barcodeWidth) / 2);
    		} else if (options.textAlign == "left") {
    			return 0;
    		} else if (options.textAlign == "right") {
    			return Math.floor(textWidth - barcodeWidth);
    		}
    	}
    	return 0;
    }

    function calculateEncodingAttributes(encodings, barcodeOptions, context) {
    	for (var i = 0; i < encodings.length; i++) {
    		var encoding = encodings[i];
    		var options = (0, _merge2$3.default)(barcodeOptions, encoding.options);

    		// Calculate the width of the encoding
    		var textWidth;
    		if (options.displayValue) {
    			textWidth = messureText(encoding.text, options, context);
    		} else {
    			textWidth = 0;
    		}

    		var barcodeWidth = encoding.data.length * options.width;
    		encoding.width = Math.ceil(Math.max(textWidth, barcodeWidth));

    		encoding.height = getEncodingHeight(encoding, options);

    		encoding.barcodePadding = getBarcodePadding(textWidth, barcodeWidth, options);
    	}
    }

    function getTotalWidthOfEncodings(encodings) {
    	var totalWidth = 0;
    	for (var i = 0; i < encodings.length; i++) {
    		totalWidth += encodings[i].width;
    	}
    	return totalWidth;
    }

    function getMaximumHeightOfEncodings(encodings) {
    	var maxHeight = 0;
    	for (var i = 0; i < encodings.length; i++) {
    		if (encodings[i].height > maxHeight) {
    			maxHeight = encodings[i].height;
    		}
    	}
    	return maxHeight;
    }

    function messureText(string, options, context) {
    	var ctx;

    	if (context) {
    		ctx = context;
    	} else if (typeof document !== "undefined") {
    		ctx = document.createElement("canvas").getContext("2d");
    	} else {
    		// If the text cannot be messured we will return 0.
    		// This will make some barcode with big text render incorrectly
    		return 0;
    	}
    	ctx.font = options.fontOptions + " " + options.fontSize + "px " + options.font;

    	// Calculate the width of the encoding
    	var measureTextResult = ctx.measureText(string);
    	if (!measureTextResult) {
    		// Some implementations don't implement measureText and return undefined.
    		// If the text cannot be measured we will return 0.
    		// This will make some barcode with big text render incorrectly
    		return 0;
    	}
    	var size = measureTextResult.width;
    	return size;
    }

    shared.getMaximumHeightOfEncodings = getMaximumHeightOfEncodings;
    shared.getEncodingHeight = getEncodingHeight;
    shared.getBarcodePadding = getBarcodePadding;
    shared.calculateEncodingAttributes = calculateEncodingAttributes;
    shared.getTotalWidthOfEncodings = getTotalWidthOfEncodings;

    Object.defineProperty(canvas, "__esModule", {
    	value: true
    });

    var _createClass$3 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _merge$2 = merge;

    var _merge2$2 = _interopRequireDefault$4(_merge$2);

    var _shared$1 = shared;

    function _interopRequireDefault$4(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$4(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var CanvasRenderer = function () {
    	function CanvasRenderer(canvas, encodings, options) {
    		_classCallCheck$4(this, CanvasRenderer);

    		this.canvas = canvas;
    		this.encodings = encodings;
    		this.options = options;
    	}

    	_createClass$3(CanvasRenderer, [{
    		key: "render",
    		value: function render() {
    			// Abort if the browser does not support HTML5 canvas
    			if (!this.canvas.getContext) {
    				throw new Error('The browser does not support canvas.');
    			}

    			this.prepareCanvas();
    			for (var i = 0; i < this.encodings.length; i++) {
    				var encodingOptions = (0, _merge2$2.default)(this.options, this.encodings[i].options);

    				this.drawCanvasBarcode(encodingOptions, this.encodings[i]);
    				this.drawCanvasText(encodingOptions, this.encodings[i]);

    				this.moveCanvasDrawing(this.encodings[i]);
    			}

    			this.restoreCanvas();
    		}
    	}, {
    		key: "prepareCanvas",
    		value: function prepareCanvas() {
    			// Get the canvas context
    			var ctx = this.canvas.getContext("2d");

    			ctx.save();

    			(0, _shared$1.calculateEncodingAttributes)(this.encodings, this.options, ctx);
    			var totalWidth = (0, _shared$1.getTotalWidthOfEncodings)(this.encodings);
    			var maxHeight = (0, _shared$1.getMaximumHeightOfEncodings)(this.encodings);

    			this.canvas.width = totalWidth + this.options.marginLeft + this.options.marginRight;

    			this.canvas.height = maxHeight;

    			// Paint the canvas
    			ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    			if (this.options.background) {
    				ctx.fillStyle = this.options.background;
    				ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    			}

    			ctx.translate(this.options.marginLeft, 0);
    		}
    	}, {
    		key: "drawCanvasBarcode",
    		value: function drawCanvasBarcode(options, encoding) {
    			// Get the canvas context
    			var ctx = this.canvas.getContext("2d");

    			var binary = encoding.data;

    			// Creates the barcode out of the encoded binary
    			var yFrom;
    			if (options.textPosition == "top") {
    				yFrom = options.marginTop + options.fontSize + options.textMargin;
    			} else {
    				yFrom = options.marginTop;
    			}

    			ctx.fillStyle = options.lineColor;

    			for (var b = 0; b < binary.length; b++) {
    				var x = b * options.width + encoding.barcodePadding;

    				if (binary[b] === "1") {
    					ctx.fillRect(x, yFrom, options.width, options.height);
    				} else if (binary[b]) {
    					ctx.fillRect(x, yFrom, options.width, options.height * binary[b]);
    				}
    			}
    		}
    	}, {
    		key: "drawCanvasText",
    		value: function drawCanvasText(options, encoding) {
    			// Get the canvas context
    			var ctx = this.canvas.getContext("2d");

    			var font = options.fontOptions + " " + options.fontSize + "px " + options.font;

    			// Draw the text if displayValue is set
    			if (options.displayValue) {
    				var x, y;

    				if (options.textPosition == "top") {
    					y = options.marginTop + options.fontSize - options.textMargin;
    				} else {
    					y = options.height + options.textMargin + options.marginTop + options.fontSize;
    				}

    				ctx.font = font;

    				// Draw the text in the correct X depending on the textAlign option
    				if (options.textAlign == "left" || encoding.barcodePadding > 0) {
    					x = 0;
    					ctx.textAlign = 'left';
    				} else if (options.textAlign == "right") {
    					x = encoding.width - 1;
    					ctx.textAlign = 'right';
    				}
    				// In all other cases, center the text
    				else {
    						x = encoding.width / 2;
    						ctx.textAlign = 'center';
    					}

    				ctx.fillText(encoding.text, x, y);
    			}
    		}
    	}, {
    		key: "moveCanvasDrawing",
    		value: function moveCanvasDrawing(encoding) {
    			var ctx = this.canvas.getContext("2d");

    			ctx.translate(encoding.width, 0);
    		}
    	}, {
    		key: "restoreCanvas",
    		value: function restoreCanvas() {
    			// Get the canvas context
    			var ctx = this.canvas.getContext("2d");

    			ctx.restore();
    		}
    	}]);

    	return CanvasRenderer;
    }();

    canvas.default = CanvasRenderer;

    var svg = {};

    Object.defineProperty(svg, "__esModule", {
    	value: true
    });

    var _createClass$2 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _merge$1 = merge;

    var _merge2$1 = _interopRequireDefault$3(_merge$1);

    var _shared = shared;

    function _interopRequireDefault$3(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck$3(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var svgns = "http://www.w3.org/2000/svg";

    var SVGRenderer = function () {
    	function SVGRenderer(svg, encodings, options) {
    		_classCallCheck$3(this, SVGRenderer);

    		this.svg = svg;
    		this.encodings = encodings;
    		this.options = options;
    		this.document = options.xmlDocument || document;
    	}

    	_createClass$2(SVGRenderer, [{
    		key: "render",
    		value: function render() {
    			var currentX = this.options.marginLeft;

    			this.prepareSVG();
    			for (var i = 0; i < this.encodings.length; i++) {
    				var encoding = this.encodings[i];
    				var encodingOptions = (0, _merge2$1.default)(this.options, encoding.options);

    				var group = this.createGroup(currentX, encodingOptions.marginTop, this.svg);

    				this.setGroupOptions(group, encodingOptions);

    				this.drawSvgBarcode(group, encodingOptions, encoding);
    				this.drawSVGText(group, encodingOptions, encoding);

    				currentX += encoding.width;
    			}
    		}
    	}, {
    		key: "prepareSVG",
    		value: function prepareSVG() {
    			// Clear the SVG
    			while (this.svg.firstChild) {
    				this.svg.removeChild(this.svg.firstChild);
    			}

    			(0, _shared.calculateEncodingAttributes)(this.encodings, this.options);
    			var totalWidth = (0, _shared.getTotalWidthOfEncodings)(this.encodings);
    			var maxHeight = (0, _shared.getMaximumHeightOfEncodings)(this.encodings);

    			var width = totalWidth + this.options.marginLeft + this.options.marginRight;
    			this.setSvgAttributes(width, maxHeight);

    			if (this.options.background) {
    				this.drawRect(0, 0, width, maxHeight, this.svg).setAttribute("style", "fill:" + this.options.background + ";");
    			}
    		}
    	}, {
    		key: "drawSvgBarcode",
    		value: function drawSvgBarcode(parent, options, encoding) {
    			var binary = encoding.data;

    			// Creates the barcode out of the encoded binary
    			var yFrom;
    			if (options.textPosition == "top") {
    				yFrom = options.fontSize + options.textMargin;
    			} else {
    				yFrom = 0;
    			}

    			var barWidth = 0;
    			var x = 0;
    			for (var b = 0; b < binary.length; b++) {
    				x = b * options.width + encoding.barcodePadding;

    				if (binary[b] === "1") {
    					barWidth++;
    				} else if (barWidth > 0) {
    					this.drawRect(x - options.width * barWidth, yFrom, options.width * barWidth, options.height, parent);
    					barWidth = 0;
    				}
    			}

    			// Last draw is needed since the barcode ends with 1
    			if (barWidth > 0) {
    				this.drawRect(x - options.width * (barWidth - 1), yFrom, options.width * barWidth, options.height, parent);
    			}
    		}
    	}, {
    		key: "drawSVGText",
    		value: function drawSVGText(parent, options, encoding) {
    			var textElem = this.document.createElementNS(svgns, 'text');

    			// Draw the text if displayValue is set
    			if (options.displayValue) {
    				var x, y;

    				textElem.setAttribute("style", "font:" + options.fontOptions + " " + options.fontSize + "px " + options.font);

    				if (options.textPosition == "top") {
    					y = options.fontSize - options.textMargin;
    				} else {
    					y = options.height + options.textMargin + options.fontSize;
    				}

    				// Draw the text in the correct X depending on the textAlign option
    				if (options.textAlign == "left" || encoding.barcodePadding > 0) {
    					x = 0;
    					textElem.setAttribute("text-anchor", "start");
    				} else if (options.textAlign == "right") {
    					x = encoding.width - 1;
    					textElem.setAttribute("text-anchor", "end");
    				}
    				// In all other cases, center the text
    				else {
    						x = encoding.width / 2;
    						textElem.setAttribute("text-anchor", "middle");
    					}

    				textElem.setAttribute("x", x);
    				textElem.setAttribute("y", y);

    				textElem.appendChild(this.document.createTextNode(encoding.text));

    				parent.appendChild(textElem);
    			}
    		}
    	}, {
    		key: "setSvgAttributes",
    		value: function setSvgAttributes(width, height) {
    			var svg = this.svg;
    			svg.setAttribute("width", width + "px");
    			svg.setAttribute("height", height + "px");
    			svg.setAttribute("x", "0px");
    			svg.setAttribute("y", "0px");
    			svg.setAttribute("viewBox", "0 0 " + width + " " + height);

    			svg.setAttribute("xmlns", svgns);
    			svg.setAttribute("version", "1.1");

    			svg.setAttribute("style", "transform: translate(0,0)");
    		}
    	}, {
    		key: "createGroup",
    		value: function createGroup(x, y, parent) {
    			var group = this.document.createElementNS(svgns, 'g');
    			group.setAttribute("transform", "translate(" + x + ", " + y + ")");

    			parent.appendChild(group);

    			return group;
    		}
    	}, {
    		key: "setGroupOptions",
    		value: function setGroupOptions(group, options) {
    			group.setAttribute("style", "fill:" + options.lineColor + ";");
    		}
    	}, {
    		key: "drawRect",
    		value: function drawRect(x, y, width, height, parent) {
    			var rect = this.document.createElementNS(svgns, 'rect');

    			rect.setAttribute("x", x);
    			rect.setAttribute("y", y);
    			rect.setAttribute("width", width);
    			rect.setAttribute("height", height);

    			parent.appendChild(rect);

    			return rect;
    		}
    	}]);

    	return SVGRenderer;
    }();

    svg.default = SVGRenderer;

    var object = {};

    Object.defineProperty(object, "__esModule", {
    	value: true
    });

    var _createClass$1 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    function _classCallCheck$2(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var ObjectRenderer = function () {
    	function ObjectRenderer(object, encodings, options) {
    		_classCallCheck$2(this, ObjectRenderer);

    		this.object = object;
    		this.encodings = encodings;
    		this.options = options;
    	}

    	_createClass$1(ObjectRenderer, [{
    		key: "render",
    		value: function render() {
    			this.object.encodings = this.encodings;
    		}
    	}]);

    	return ObjectRenderer;
    }();

    object.default = ObjectRenderer;

    Object.defineProperty(renderers, "__esModule", {
      value: true
    });

    var _canvas = canvas;

    var _canvas2 = _interopRequireDefault$2(_canvas);

    var _svg = svg;

    var _svg2 = _interopRequireDefault$2(_svg);

    var _object = object;

    var _object2 = _interopRequireDefault$2(_object);

    function _interopRequireDefault$2(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    renderers.default = { CanvasRenderer: _canvas2.default, SVGRenderer: _svg2.default, ObjectRenderer: _object2.default };

    var exceptions = {};

    Object.defineProperty(exceptions, "__esModule", {
    	value: true
    });

    function _classCallCheck$1(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var InvalidInputException = function (_Error) {
    	_inherits(InvalidInputException, _Error);

    	function InvalidInputException(symbology, input) {
    		_classCallCheck$1(this, InvalidInputException);

    		var _this = _possibleConstructorReturn(this, (InvalidInputException.__proto__ || Object.getPrototypeOf(InvalidInputException)).call(this));

    		_this.name = "InvalidInputException";

    		_this.symbology = symbology;
    		_this.input = input;

    		_this.message = '"' + _this.input + '" is not a valid input for ' + _this.symbology;
    		return _this;
    	}

    	return InvalidInputException;
    }(Error);

    var InvalidElementException = function (_Error2) {
    	_inherits(InvalidElementException, _Error2);

    	function InvalidElementException() {
    		_classCallCheck$1(this, InvalidElementException);

    		var _this2 = _possibleConstructorReturn(this, (InvalidElementException.__proto__ || Object.getPrototypeOf(InvalidElementException)).call(this));

    		_this2.name = "InvalidElementException";
    		_this2.message = "Not supported type to render on";
    		return _this2;
    	}

    	return InvalidElementException;
    }(Error);

    var NoElementException = function (_Error3) {
    	_inherits(NoElementException, _Error3);

    	function NoElementException() {
    		_classCallCheck$1(this, NoElementException);

    		var _this3 = _possibleConstructorReturn(this, (NoElementException.__proto__ || Object.getPrototypeOf(NoElementException)).call(this));

    		_this3.name = "NoElementException";
    		_this3.message = "No element to render on.";
    		return _this3;
    	}

    	return NoElementException;
    }(Error);

    exceptions.InvalidInputException = InvalidInputException;
    exceptions.InvalidElementException = InvalidElementException;
    exceptions.NoElementException = NoElementException;

    Object.defineProperty(getRenderProperties$1, "__esModule", {
    	value: true
    });

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /* global HTMLImageElement */
    /* global HTMLCanvasElement */
    /* global SVGElement */

    var _getOptionsFromElement = getOptionsFromElement$1;

    var _getOptionsFromElement2 = _interopRequireDefault$1(_getOptionsFromElement);

    var _renderers = renderers;

    var _renderers2 = _interopRequireDefault$1(_renderers);

    var _exceptions$1 = exceptions;

    function _interopRequireDefault$1(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    // Takes an element and returns an object with information about how
    // it should be rendered
    // This could also return an array with these objects
    // {
    //   element: The element that the renderer should draw on
    //   renderer: The name of the renderer
    //   afterRender (optional): If something has to done after the renderer
    //     completed, calls afterRender (function)
    //   options (optional): Options that can be defined in the element
    // }

    function getRenderProperties(element) {
    	// If the element is a string, query select call again
    	if (typeof element === "string") {
    		return querySelectedRenderProperties(element);
    	}
    	// If element is array. Recursivly call with every object in the array
    	else if (Array.isArray(element)) {
    			var returnArray = [];
    			for (var i = 0; i < element.length; i++) {
    				returnArray.push(getRenderProperties(element[i]));
    			}
    			return returnArray;
    		}
    		// If element, render on canvas and set the uri as src
    		else if (typeof HTMLCanvasElement !== 'undefined' && element instanceof HTMLImageElement) {
    				return newCanvasRenderProperties(element);
    			}
    			// If SVG
    			else if (element && element.nodeName && element.nodeName.toLowerCase() === 'svg' || typeof SVGElement !== 'undefined' && element instanceof SVGElement) {
    					return {
    						element: element,
    						options: (0, _getOptionsFromElement2.default)(element),
    						renderer: _renderers2.default.SVGRenderer
    					};
    				}
    				// If canvas (in browser)
    				else if (typeof HTMLCanvasElement !== 'undefined' && element instanceof HTMLCanvasElement) {
    						return {
    							element: element,
    							options: (0, _getOptionsFromElement2.default)(element),
    							renderer: _renderers2.default.CanvasRenderer
    						};
    					}
    					// If canvas (in node)
    					else if (element && element.getContext) {
    							return {
    								element: element,
    								renderer: _renderers2.default.CanvasRenderer
    							};
    						} else if (element && (typeof element === "undefined" ? "undefined" : _typeof(element)) === 'object' && !element.nodeName) {
    							return {
    								element: element,
    								renderer: _renderers2.default.ObjectRenderer
    							};
    						} else {
    							throw new _exceptions$1.InvalidElementException();
    						}
    }

    function querySelectedRenderProperties(string) {
    	var selector = document.querySelectorAll(string);
    	if (selector.length === 0) {
    		return undefined;
    	} else {
    		var returnArray = [];
    		for (var i = 0; i < selector.length; i++) {
    			returnArray.push(getRenderProperties(selector[i]));
    		}
    		return returnArray;
    	}
    }

    function newCanvasRenderProperties(imgElement) {
    	var canvas = document.createElement('canvas');
    	return {
    		element: canvas,
    		options: (0, _getOptionsFromElement2.default)(imgElement),
    		renderer: _renderers2.default.CanvasRenderer,
    		afterRender: function afterRender() {
    			imgElement.setAttribute("src", canvas.toDataURL());
    		}
    	};
    }

    getRenderProperties$1.default = getRenderProperties;

    var ErrorHandler$1 = {};

    Object.defineProperty(ErrorHandler$1, "__esModule", {
    	value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    /*eslint no-console: 0 */

    var ErrorHandler = function () {
    	function ErrorHandler(api) {
    		_classCallCheck(this, ErrorHandler);

    		this.api = api;
    	}

    	_createClass(ErrorHandler, [{
    		key: "handleCatch",
    		value: function handleCatch(e) {
    			// If babel supported extending of Error in a correct way instanceof would be used here
    			if (e.name === "InvalidInputException") {
    				if (this.api._options.valid !== this.api._defaults.valid) {
    					this.api._options.valid(false);
    				} else {
    					throw e.message;
    				}
    			} else {
    				throw e;
    			}

    			this.api.render = function () {};
    		}
    	}, {
    		key: "wrapBarcodeCall",
    		value: function wrapBarcodeCall(func) {
    			try {
    				var result = func.apply(undefined, arguments);
    				this.api._options.valid(true);
    				return result;
    			} catch (e) {
    				this.handleCatch(e);

    				return this.api;
    			}
    		}
    	}]);

    	return ErrorHandler;
    }();

    ErrorHandler$1.default = ErrorHandler;

    var _barcodes = barcodes;

    var _barcodes2 = _interopRequireDefault(_barcodes);

    var _merge = merge;

    var _merge2 = _interopRequireDefault(_merge);

    var _linearizeEncodings = linearizeEncodings$1;

    var _linearizeEncodings2 = _interopRequireDefault(_linearizeEncodings);

    var _fixOptions = fixOptions$1;

    var _fixOptions2 = _interopRequireDefault(_fixOptions);

    var _getRenderProperties = getRenderProperties$1;

    var _getRenderProperties2 = _interopRequireDefault(_getRenderProperties);

    var _optionsFromStrings = optionsFromStrings$1;

    var _optionsFromStrings2 = _interopRequireDefault(_optionsFromStrings);

    var _ErrorHandler = ErrorHandler$1;

    var _ErrorHandler2 = _interopRequireDefault(_ErrorHandler);

    var _exceptions = exceptions;

    var _defaults = defaults$1;

    var _defaults2 = _interopRequireDefault(_defaults);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    // The protype of the object returned from the JsBarcode() call


    // Help functions
    var API = function API() {};

    // The first call of the library API
    // Will return an object with all barcodes calls and the data that is used
    // by the renderers


    // Default values


    // Exceptions
    // Import all the barcodes
    var JsBarcode = function JsBarcode(element, text, options) {
    	var api = new API();

    	if (typeof element === "undefined") {
    		throw Error("No element to render on was provided.");
    	}

    	// Variables that will be pased through the API calls
    	api._renderProperties = (0, _getRenderProperties2.default)(element);
    	api._encodings = [];
    	api._options = _defaults2.default;
    	api._errorHandler = new _ErrorHandler2.default(api);

    	// If text is set, use the simple syntax (render the barcode directly)
    	if (typeof text !== "undefined") {
    		options = options || {};

    		if (!options.format) {
    			options.format = autoSelectBarcode();
    		}

    		api.options(options)[options.format](text, options).render();
    	}

    	return api;
    };

    // To make tests work TODO: remove
    JsBarcode.getModule = function (name) {
    	return _barcodes2.default[name];
    };

    // Register all barcodes
    for (var name in _barcodes2.default) {
    	if (_barcodes2.default.hasOwnProperty(name)) {
    		// Security check if the propery is a prototype property
    		registerBarcode(_barcodes2.default, name);
    	}
    }
    function registerBarcode(barcodes, name) {
    	API.prototype[name] = API.prototype[name.toUpperCase()] = API.prototype[name.toLowerCase()] = function (text, options) {
    		var api = this;
    		return api._errorHandler.wrapBarcodeCall(function () {
    			// Ensure text is options.text
    			options.text = typeof options.text === 'undefined' ? undefined : '' + options.text;

    			var newOptions = (0, _merge2.default)(api._options, options);
    			newOptions = (0, _optionsFromStrings2.default)(newOptions);
    			var Encoder = barcodes[name];
    			var encoded = encode(text, Encoder, newOptions);
    			api._encodings.push(encoded);

    			return api;
    		});
    	};
    }

    // encode() handles the Encoder call and builds the binary string to be rendered
    function encode(text, Encoder, options) {
    	// Ensure that text is a string
    	text = "" + text;

    	var encoder = new Encoder(text, options);

    	// If the input is not valid for the encoder, throw error.
    	// If the valid callback option is set, call it instead of throwing error
    	if (!encoder.valid()) {
    		throw new _exceptions.InvalidInputException(encoder.constructor.name, text);
    	}

    	// Make a request for the binary data (and other infromation) that should be rendered
    	var encoded = encoder.encode();

    	// Encodings can be nestled like [[1-1, 1-2], 2, [3-1, 3-2]
    	// Convert to [1-1, 1-2, 2, 3-1, 3-2]
    	encoded = (0, _linearizeEncodings2.default)(encoded);

    	// Merge
    	for (var i = 0; i < encoded.length; i++) {
    		encoded[i].options = (0, _merge2.default)(options, encoded[i].options);
    	}

    	return encoded;
    }

    function autoSelectBarcode() {
    	// If CODE128 exists. Use it
    	if (_barcodes2.default["CODE128"]) {
    		return "CODE128";
    	}

    	// Else, take the first (probably only) barcode
    	return Object.keys(_barcodes2.default)[0];
    }

    // Sets global encoder options
    // Added to the api by the JsBarcode function
    API.prototype.options = function (options) {
    	this._options = (0, _merge2.default)(this._options, options);
    	return this;
    };

    // Will create a blank space (usually in between barcodes)
    API.prototype.blank = function (size) {
    	var zeroes = new Array(size + 1).join("0");
    	this._encodings.push({ data: zeroes });
    	return this;
    };

    // Initialize JsBarcode on all HTML elements defined.
    API.prototype.init = function () {
    	// Should do nothing if no elements where found
    	if (!this._renderProperties) {
    		return;
    	}

    	// Make sure renderProperies is an array
    	if (!Array.isArray(this._renderProperties)) {
    		this._renderProperties = [this._renderProperties];
    	}

    	var renderProperty;
    	for (var i in this._renderProperties) {
    		renderProperty = this._renderProperties[i];
    		var options = (0, _merge2.default)(this._options, renderProperty.options);

    		if (options.format == "auto") {
    			options.format = autoSelectBarcode();
    		}

    		this._errorHandler.wrapBarcodeCall(function () {
    			var text = options.value;
    			var Encoder = _barcodes2.default[options.format.toUpperCase()];
    			var encoded = encode(text, Encoder, options);

    			render(renderProperty, encoded, options);
    		});
    	}
    };

    // The render API call. Calls the real render function.
    API.prototype.render = function () {
    	if (!this._renderProperties) {
    		throw new _exceptions.NoElementException();
    	}

    	if (Array.isArray(this._renderProperties)) {
    		for (var i = 0; i < this._renderProperties.length; i++) {
    			render(this._renderProperties[i], this._encodings, this._options);
    		}
    	} else {
    		render(this._renderProperties, this._encodings, this._options);
    	}

    	return this;
    };

    API.prototype._defaults = _defaults2.default;

    // Prepares the encodings and calls the renderer
    function render(renderProperties, encodings, options) {
    	encodings = (0, _linearizeEncodings2.default)(encodings);

    	for (var i = 0; i < encodings.length; i++) {
    		encodings[i].options = (0, _merge2.default)(options, encodings[i].options);
    		(0, _fixOptions2.default)(encodings[i].options);
    	}

    	(0, _fixOptions2.default)(options);

    	var Renderer = renderProperties.renderer;
    	var renderer = new Renderer(renderProperties.element, encodings, options);
    	renderer.render();

    	if (renderProperties.afterRender) {
    		renderProperties.afterRender();
    	}
    }

    // Export to browser
    if (typeof window !== "undefined") {
    	window.JsBarcode = JsBarcode;
    }

    // Export to jQuery
    /*global jQuery */
    if (typeof jQuery !== 'undefined') {
    	jQuery.fn.JsBarcode = function (content, options) {
    		var elementArray = [];
    		jQuery(this).each(function () {
    			elementArray.push(this);
    		});
    		return JsBarcode(elementArray, content, options);
    	};
    }

    // Export to commonJS
    var JsBarcode_1 = JsBarcode;

    var JsBarcode$1 = /*@__PURE__*/getDefaultExportFromCjs(JsBarcode_1);

    /* src\ListItem.svelte generated by Svelte v3.59.2 */

    const file$2 = "src\\ListItem.svelte";

    // (74:4) {#if definedOwner === ""}
    function create_if_block$2(ctx) {
    	let div;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			attr_dev(input, "class", "input-field svelte-bnlsiy");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Owner");
    			add_location(input, file$2, 75, 8, 1496);
    			attr_dev(div, "class", "custom-owner svelte-bnlsiy");
    			add_location(div, file$2, 74, 6, 1460);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			set_input_value(input, /*customOwner*/ ctx[3]);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[11]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*customOwner*/ 8 && input.value !== /*customOwner*/ ctx[3]) {
    				set_input_value(input, /*customOwner*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(74:4) {#if definedOwner === \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div1;
    	let input0;
    	let t0;
    	let input1;
    	let t1;
    	let div0;
    	let label0;
    	let input2;
    	let t2;
    	let t3;
    	let label1;
    	let input3;
    	let t4;
    	let t5;
    	let label2;
    	let input4;
    	let t6;
    	let t7;
    	let binding_group;
    	let mounted;
    	let dispose;
    	let if_block = /*definedOwner*/ ctx[2] === "" && create_if_block$2(ctx);
    	binding_group = init_binding_group(/*$$binding_groups*/ ctx[8][0]);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			input0 = element("input");
    			t0 = space();
    			input1 = element("input");
    			t1 = space();
    			div0 = element("div");
    			label0 = element("label");
    			input2 = element("input");
    			t2 = text("\r\n        SMC");
    			t3 = space();
    			label1 = element("label");
    			input3 = element("input");
    			t4 = text("\r\n        ART");
    			t5 = space();
    			label2 = element("label");
    			input4 = element("input");
    			t6 = text("\r\n        Custom");
    			t7 = space();
    			if (if_block) if_block.c();
    			attr_dev(input0, "class", "input-field svelte-bnlsiy");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Item Name");
    			add_location(input0, file$2, 42, 4, 773);
    			attr_dev(input1, "class", "input-field svelte-bnlsiy");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "placeholder", "Barcode Number");
    			add_location(input1, file$2, 49, 4, 899);
    			attr_dev(input2, "type", "radio");
    			input2.__value = "SMC";
    			input2.value = input2.__value;
    			add_location(input2, file$2, 58, 8, 1083);
    			add_location(label0, file$2, 57, 6, 1066);
    			attr_dev(input3, "type", "radio");
    			input3.__value = "ART";
    			input3.value = input3.__value;
    			add_location(input3, file$2, 63, 8, 1200);
    			add_location(label1, file$2, 62, 6, 1183);
    			attr_dev(input4, "type", "radio");
    			input4.__value = "";
    			input4.value = input4.__value;
    			add_location(input4, file$2, 68, 8, 1317);
    			add_location(label2, file$2, 67, 6, 1300);
    			attr_dev(div0, "class", "radio-group svelte-bnlsiy");
    			add_location(div0, file$2, 56, 4, 1033);
    			attr_dev(div1, "class", "form-container svelte-bnlsiy");
    			add_location(div1, file$2, 41, 2, 739);
    			binding_group.p(input2, input3, input4);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, input0);
    			set_input_value(input0, /*name*/ ctx[0]);
    			append_dev(div1, t0);
    			append_dev(div1, input1);
    			set_input_value(input1, /*barcode*/ ctx[1]);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, label0);
    			append_dev(label0, input2);
    			input2.checked = input2.__value === /*definedOwner*/ ctx[2];
    			append_dev(label0, t2);
    			append_dev(div0, t3);
    			append_dev(div0, label1);
    			append_dev(label1, input3);
    			input3.checked = input3.__value === /*definedOwner*/ ctx[2];
    			append_dev(label1, t4);
    			append_dev(div0, t5);
    			append_dev(div0, label2);
    			append_dev(label2, input4);
    			input4.checked = input4.__value === /*definedOwner*/ ctx[2];
    			append_dev(label2, t6);
    			append_dev(div1, t7);
    			if (if_block) if_block.m(div1, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[5]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[6]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[7]),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[9]),
    					listen_dev(input4, "change", /*input4_change_handler*/ ctx[10])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1 && input0.value !== /*name*/ ctx[0]) {
    				set_input_value(input0, /*name*/ ctx[0]);
    			}

    			if (dirty & /*barcode*/ 2 && input1.value !== /*barcode*/ ctx[1]) {
    				set_input_value(input1, /*barcode*/ ctx[1]);
    			}

    			if (dirty & /*definedOwner*/ 4) {
    				input2.checked = input2.__value === /*definedOwner*/ ctx[2];
    			}

    			if (dirty & /*definedOwner*/ 4) {
    				input3.checked = input3.__value === /*definedOwner*/ ctx[2];
    			}

    			if (dirty & /*definedOwner*/ 4) {
    				input4.checked = input4.__value === /*definedOwner*/ ctx[2];
    			}

    			if (/*definedOwner*/ ctx[2] === "") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			binding_group.r();
    			mounted = false;
    			run_all(dispose);
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

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ListItem', slots, []);
    	let definedOwner = 'SMC';
    	let customOwner;
    	let { name } = $$props;
    	let { owner = customOwner || definedOwner } = $$props;
    	let { barcode } = $$props;

    	if (owner === 'SMC' || owner === 'ART') {
    		definedOwner = owner;
    	} else {
    		customOwner = owner;
    	}

    	$$self.$$.on_mount.push(function () {
    		if (name === undefined && !('name' in $$props || $$self.$$.bound[$$self.$$.props['name']])) {
    			console.warn("<ListItem> was created without expected prop 'name'");
    		}

    		if (barcode === undefined && !('barcode' in $$props || $$self.$$.bound[$$self.$$.props['barcode']])) {
    			console.warn("<ListItem> was created without expected prop 'barcode'");
    		}
    	});

    	const writable_props = ['name', 'owner', 'barcode'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ListItem> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[]];

    	function input0_input_handler() {
    		name = this.value;
    		$$invalidate(0, name);
    	}

    	function input1_input_handler() {
    		barcode = this.value;
    		$$invalidate(1, barcode);
    	}

    	function input2_change_handler() {
    		definedOwner = this.__value;
    		$$invalidate(2, definedOwner);
    	}

    	function input3_change_handler() {
    		definedOwner = this.__value;
    		$$invalidate(2, definedOwner);
    	}

    	function input4_change_handler() {
    		definedOwner = this.__value;
    		$$invalidate(2, definedOwner);
    	}

    	function input_input_handler() {
    		customOwner = this.value;
    		$$invalidate(3, customOwner);
    	}

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('owner' in $$props) $$invalidate(4, owner = $$props.owner);
    		if ('barcode' in $$props) $$invalidate(1, barcode = $$props.barcode);
    	};

    	$$self.$capture_state = () => ({
    		definedOwner,
    		customOwner,
    		name,
    		owner,
    		barcode
    	});

    	$$self.$inject_state = $$props => {
    		if ('definedOwner' in $$props) $$invalidate(2, definedOwner = $$props.definedOwner);
    		if ('customOwner' in $$props) $$invalidate(3, customOwner = $$props.customOwner);
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('owner' in $$props) $$invalidate(4, owner = $$props.owner);
    		if ('barcode' in $$props) $$invalidate(1, barcode = $$props.barcode);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*definedOwner, customOwner*/ 12) {
    			$$invalidate(4, owner = definedOwner || customOwner);
    		}
    	};

    	return [
    		name,
    		barcode,
    		definedOwner,
    		customOwner,
    		owner,
    		input0_input_handler,
    		input1_input_handler,
    		input2_change_handler,
    		$$binding_groups,
    		input3_change_handler,
    		input4_change_handler,
    		input_input_handler
    	];
    }

    class ListItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { name: 0, owner: 4, barcode: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ListItem",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get name() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get owner() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set owner(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get barcode() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set barcode(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\mdi-svelte\src\Index.svelte generated by Svelte v3.59.2 */

    const file$1 = "node_modules\\mdi-svelte\\src\\Index.svelte";

    // (59:0) {#if title}
    function create_if_block_2$1(ctx) {
    	let title_1;
    	let t;

    	const block = {
    		c: function create() {
    			title_1 = svg_element("title");
    			t = text(/*title*/ ctx[2]);
    			add_location(title_1, file$1, 58, 11, 1419);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, title_1, anchor);
    			append_dev(title_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 4) set_data_dev(t, /*title*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(title_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(59:0) {#if title}",
    		ctx
    	});

    	return block;
    }

    // (69:3) {:else}
    function create_else_block_1(ctx) {
    	let path_1;

    	const block = {
    		c: function create() {
    			path_1 = svg_element("path");
    			attr_dev(path_1, "d", /*path*/ ctx[0]);
    			add_location(path_1, file$1, 69, 2, 1802);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path_1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*path*/ 1) {
    				attr_dev(path_1, "d", /*path*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(69:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (60:0) {#if spin !== false}
    function create_if_block$1(ctx) {
    	let g;
    	let path_1;
    	let g_style_value;

    	function select_block_type_1(ctx, dirty) {
    		if (/*inverse*/ ctx[3]) return create_if_block_1$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			g = svg_element("g");
    			path_1 = svg_element("path");
    			attr_dev(path_1, "d", /*path*/ ctx[0]);
    			add_location(path_1, file$1, 66, 6, 1757);
    			attr_dev(g, "style", g_style_value = `animation: ${/*spinfunc*/ ctx[5]} linear ${/*spintime*/ ctx[6]}s infinite; transform-origin: center`);
    			add_location(g, file$1, 65, 4, 1659);
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, g, anchor);
    			append_dev(g, path_1);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type_1(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(g.parentNode, g);
    				}
    			}

    			if (dirty & /*path*/ 1) {
    				attr_dev(path_1, "d", /*path*/ ctx[0]);
    			}

    			if (dirty & /*spinfunc, spintime*/ 96 && g_style_value !== (g_style_value = `animation: ${/*spinfunc*/ ctx[5]} linear ${/*spintime*/ ctx[6]}s infinite; transform-origin: center`)) {
    				attr_dev(g, "style", g_style_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(g);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(60:0) {#if spin !== false}",
    		ctx
    	});

    	return block;
    }

    // (63:2) {:else}
    function create_else_block(ctx) {
    	let style_1;
    	let t;

    	const block = {
    		c: function create() {
    			style_1 = svg_element("style");
    			t = text("@keyframes spin { to { transform: rotate(360deg) } }");
    			add_location(style_1, file$1, 63, 4, 1579);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, style_1, anchor);
    			append_dev(style_1, t);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(style_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(63:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (61:2) {#if inverse}
    function create_if_block_1$1(ctx) {
    	let style_1;
    	let t;

    	const block = {
    		c: function create() {
    			style_1 = svg_element("style");
    			t = text("@keyframes spin-inverse { to { transform: rotate(-360deg) } }");
    			add_location(style_1, file$1, 61, 4, 1488);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, style_1, anchor);
    			append_dev(style_1, t);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(style_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(61:2) {#if inverse}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let svg;
    	let if_block0_anchor;
    	let if_block0 = /*title*/ ctx[2] && create_if_block_2$1(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*spin*/ ctx[1] !== false) return create_if_block$1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			if (if_block0) if_block0.c();
    			if_block0_anchor = empty();
    			if_block1.c();
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "style", /*style*/ ctx[4]);
    			attr_dev(svg, "class", "svelte-dmmfjb");
    			add_location(svg, file$1, 57, 0, 1374);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			if (if_block0) if_block0.m(svg, null);
    			append_dev(svg, if_block0_anchor);
    			if_block1.m(svg, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*title*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					if_block0.m(svg, if_block0_anchor);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(svg, null);
    				}
    			}

    			if (dirty & /*style*/ 16) {
    				attr_dev(svg, "style", /*style*/ ctx[4]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (if_block0) if_block0.d();
    			if_block1.d();
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

    function instance$1($$self, $$props, $$invalidate) {
    	let inverse;
    	let spintime;
    	let spinfunc;
    	let style;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Index', slots, []);
    	let { path } = $$props;
    	let { size = 1 } = $$props;
    	let { color = null } = $$props;
    	let { flip = null } = $$props;
    	let { rotate = 0 } = $$props;
    	let { spin = false } = $$props;
    	let { title = '' } = $$props;

    	// size
    	if (Number(size)) size = Number(size);

    	const getStyles = () => {
    		const transform = [];
    		const styles = [];

    		if (size !== null) {
    			const width = typeof size === "string" ? size : `${size * 1.5}rem`;
    			styles.push(['width', width]);
    			styles.push(['height', width]);
    		}

    		styles.push(['fill', color !== null ? color : 'currentColor']);

    		if (flip === true || flip === 'h') {
    			transform.push("scaleX(-1)");
    		}

    		if (flip === true || flip === 'v') {
    			transform.push("scaleY(-1)");
    		}

    		if (rotate != 0) {
    			transform.push(`rotate(${rotate}deg)`);
    		}

    		if (transform.length > 0) {
    			styles.push(['transform', transform.join(' ')]);
    			styles.push(['transform-origin', 'center']);
    		}

    		return styles.reduce(
    			(cur, item) => {
    				return `${cur} ${item[0]}:${item[1]};`;
    			},
    			''
    		);
    	};

    	$$self.$$.on_mount.push(function () {
    		if (path === undefined && !('path' in $$props || $$self.$$.bound[$$self.$$.props['path']])) {
    			console.warn("<Index> was created without expected prop 'path'");
    		}
    	});

    	const writable_props = ['path', 'size', 'color', 'flip', 'rotate', 'spin', 'title'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('path' in $$props) $$invalidate(0, path = $$props.path);
    		if ('size' in $$props) $$invalidate(7, size = $$props.size);
    		if ('color' in $$props) $$invalidate(8, color = $$props.color);
    		if ('flip' in $$props) $$invalidate(9, flip = $$props.flip);
    		if ('rotate' in $$props) $$invalidate(10, rotate = $$props.rotate);
    		if ('spin' in $$props) $$invalidate(1, spin = $$props.spin);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    	};

    	$$self.$capture_state = () => ({
    		path,
    		size,
    		color,
    		flip,
    		rotate,
    		spin,
    		title,
    		getStyles,
    		style,
    		inverse,
    		spinfunc,
    		spintime
    	});

    	$$self.$inject_state = $$props => {
    		if ('path' in $$props) $$invalidate(0, path = $$props.path);
    		if ('size' in $$props) $$invalidate(7, size = $$props.size);
    		if ('color' in $$props) $$invalidate(8, color = $$props.color);
    		if ('flip' in $$props) $$invalidate(9, flip = $$props.flip);
    		if ('rotate' in $$props) $$invalidate(10, rotate = $$props.rotate);
    		if ('spin' in $$props) $$invalidate(1, spin = $$props.spin);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('style' in $$props) $$invalidate(4, style = $$props.style);
    		if ('inverse' in $$props) $$invalidate(3, inverse = $$props.inverse);
    		if ('spinfunc' in $$props) $$invalidate(5, spinfunc = $$props.spinfunc);
    		if ('spintime' in $$props) $$invalidate(6, spintime = $$props.spintime);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*spin*/ 2) {
    			// SPIN properties
    			$$invalidate(3, inverse = typeof spin !== "boolean" && spin < 0 ? true : false);
    		}

    		if ($$self.$$.dirty & /*spin*/ 2) {
    			$$invalidate(6, spintime = Math.abs(spin === true ? 2 : spin));
    		}

    		if ($$self.$$.dirty & /*inverse*/ 8) {
    			$$invalidate(5, spinfunc = inverse ? 'spin-inverse' : 'spin');
    		}

    		if ($$self.$$.dirty & /*size, color, flip, rotate*/ 1920) {
    			$$invalidate(4, style = getStyles());
    		}
    	};

    	return [
    		path,
    		spin,
    		title,
    		inverse,
    		style,
    		spinfunc,
    		spintime,
    		size,
    		color,
    		flip,
    		rotate
    	];
    }

    class Index extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			path: 0,
    			size: 7,
    			color: 8,
    			flip: 9,
    			rotate: 10,
    			spin: 1,
    			title: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get path() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get flip() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set flip(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rotate() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rotate(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get spin() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set spin(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // Material Design Icons v7.4.47
    var mdiClose = "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z";
    var mdiCodeTags = "M14.6,16.6L19.2,12L14.6,7.4L16,6L22,12L16,18L14.6,16.6M9.4,16.6L4.8,12L9.4,7.4L8,6L2,12L8,18L9.4,16.6Z";
    var mdiContentCopy = "M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z";
    var mdiEraser = "M16.24,3.56L21.19,8.5C21.97,9.29 21.97,10.55 21.19,11.34L12,20.53C10.44,22.09 7.91,22.09 6.34,20.53L2.81,17C2.03,16.21 2.03,14.95 2.81,14.16L13.41,3.56C14.2,2.78 15.46,2.78 16.24,3.56M4.22,15.58L7.76,19.11C8.54,19.9 9.8,19.9 10.59,19.11L14.12,15.58L9.17,10.63L4.22,15.58Z";
    var mdiFileDocumentCheck = "M23.5 17L18.5 22L15 18.5L16.5 17L18.5 19L22 15.5L23.5 17M6 2C4.89 2 4 2.89 4 4V20C4 21.11 4.89 22 6 22H13.81C13.28 21.09 13 20.05 13 19C13 18.67 13.03 18.33 13.08 18H6V16H13.81C14.27 15.2 14.91 14.5 15.68 14H6V12H18V13.08C18.33 13.03 18.67 13 19 13C19.34 13 19.67 13.03 20 13.08V8L14 2M13 3.5L18.5 9H13Z";
    var mdiPlus = "M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z";

    /* src\App.svelte generated by Svelte v3.59.2 */

    const { document: document_1 } = globals;

    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[24] = list;
    	child_ctx[25] = i;
    	return child_ctx;
    }

    // (237:0) {#if popupVisible}
    function create_if_block_2(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let b;
    	let t1;
    	let br;
    	let t2;
    	let div1;
    	let textarea;
    	let t3;
    	let div2;
    	let button0;
    	let icon0;
    	let t4;
    	let t5;
    	let button1;
    	let icon1;
    	let t6;
    	let current;
    	let mounted;
    	let dispose;

    	icon0 = new Index({
    			props: { path: mdiPlus, size: 1 },
    			$$inline: true
    		});

    	icon1 = new Index({
    			props: { path: mdiClose, size: 1 },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			b = element("b");
    			b.textContent = "Enter advanced input here:";
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			div1 = element("div");
    			textarea = element("textarea");
    			t3 = space();
    			div2 = element("div");
    			button0 = element("button");
    			create_component(icon0.$$.fragment);
    			t4 = text(" Add & Save");
    			t5 = space();
    			button1 = element("button");
    			create_component(icon1.$$.fragment);
    			t6 = text(" Close");
    			add_location(b, file, 240, 3, 6427);
    			add_location(br, file, 241, 3, 6464);
    			set_style(div0, "padding-bottom", "1em");
    			add_location(div0, file, 239, 2, 6390);
    			set_style(textarea, "width", "30vw");
    			set_style(textarea, "height", "20vh");
    			add_location(textarea, file, 245, 3, 6573);
    			set_style(div1, "flex-grow", "4");
    			set_style(div1, "padding-bottom", "0.5em");
    			add_location(div1, file, 244, 2, 6521);
    			attr_dev(button0, "class", "svelte-1e1qinl");
    			add_location(button0, file, 248, 3, 6740);
    			attr_dev(button1, "class", "svelte-1e1qinl");
    			add_location(button1, file, 249, 3, 6832);
    			set_style(div2, "display", "flex");
    			set_style(div2, "flex-direction", "row");
    			set_style(div2, "justify-content", "flex-end");
    			add_location(div2, file, 247, 2, 6665);
    			attr_dev(div3, "class", "popup-content svelte-1e1qinl");
    			add_location(div3, file, 238, 1, 6360);
    			attr_dev(div4, "class", "popup svelte-1e1qinl");
    			add_location(div4, file, 237, 0, 6339);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, b);
    			append_dev(div0, t1);
    			append_dev(div0, br);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			append_dev(div1, textarea);
    			set_input_value(textarea, /*advancedInput*/ ctx[2]);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, button0);
    			mount_component(icon0, button0, null);
    			append_dev(button0, t4);
    			append_dev(div2, t5);
    			append_dev(div2, button1);
    			mount_component(icon1, button1, null);
    			append_dev(button1, t6);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[12]),
    					listen_dev(button0, "click", /*runAdvanced*/ ctx[10], false, false, false, false),
    					listen_dev(button1, "click", /*closeAdvanced*/ ctx[11], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*advancedInput*/ 4) {
    				set_input_value(textarea, /*advancedInput*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(icon0);
    			destroy_component(icon1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(237:0) {#if popupVisible}",
    		ctx
    	});

    	return block;
    }

    // (266:2) {#if items.length < 1}
    function create_if_block_1(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			i.textContent = "No items";
    			set_style(i, "color", "rgba(0,0,0,0.5)");
    			add_location(i, file, 266, 2, 7429);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(266:2) {#if items.length < 1}",
    		ctx
    	});

    	return block;
    }

    // (269:2) {#each items as item}
    function create_each_block(ctx) {
    	let li;
    	let listitem;
    	let updating_name;
    	let updating_barcode;
    	let updating_owner;
    	let t0;
    	let button0;
    	let icon0;
    	let t1;
    	let button1;
    	let icon1;
    	let t2;
    	let current;
    	let mounted;
    	let dispose;

    	function listitem_name_binding(value) {
    		/*listitem_name_binding*/ ctx[13](value, /*item*/ ctx[23]);
    	}

    	function listitem_barcode_binding(value) {
    		/*listitem_barcode_binding*/ ctx[14](value, /*item*/ ctx[23]);
    	}

    	function listitem_owner_binding(value) {
    		/*listitem_owner_binding*/ ctx[15](value, /*item*/ ctx[23]);
    	}

    	let listitem_props = {};

    	if (/*item*/ ctx[23].name !== void 0) {
    		listitem_props.name = /*item*/ ctx[23].name;
    	}

    	if (/*item*/ ctx[23].barcode !== void 0) {
    		listitem_props.barcode = /*item*/ ctx[23].barcode;
    	}

    	if (/*item*/ ctx[23].owner !== void 0) {
    		listitem_props.owner = /*item*/ ctx[23].owner;
    	}

    	listitem = new ListItem({ props: listitem_props, $$inline: true });
    	binding_callbacks.push(() => bind(listitem, 'name', listitem_name_binding));
    	binding_callbacks.push(() => bind(listitem, 'barcode', listitem_barcode_binding));
    	binding_callbacks.push(() => bind(listitem, 'owner', listitem_owner_binding));

    	icon0 = new Index({
    			props: { path: mdiContentCopy, size: 1 },
    			$$inline: true
    		});

    	icon1 = new Index({
    			props: { path: mdiClose, size: 1 },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			li = element("li");
    			create_component(listitem.$$.fragment);
    			t0 = space();
    			button0 = element("button");
    			create_component(icon0.$$.fragment);
    			t1 = space();
    			button1 = element("button");
    			create_component(icon1.$$.fragment);
    			t2 = space();
    			attr_dev(button0, "class", "svelte-1e1qinl");
    			add_location(button0, file, 271, 3, 7621);
    			attr_dev(button1, "class", "delete-button svelte-1e1qinl");
    			add_location(button1, file, 272, 3, 7713);
    			attr_dev(li, "class", "item svelte-1e1qinl");
    			add_location(li, file, 269, 2, 7511);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(listitem, li, null);
    			append_dev(li, t0);
    			append_dev(li, button0);
    			mount_component(icon0, button0, null);
    			append_dev(li, t1);
    			append_dev(li, button1);
    			mount_component(icon1, button1, null);
    			append_dev(li, t2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*cloneItem*/ ctx[7](/*item*/ ctx[23]))) /*cloneItem*/ ctx[7](/*item*/ ctx[23]).apply(this, arguments);
    						},
    						false,
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*removeItem*/ ctx[6](/*item*/ ctx[23]))) /*removeItem*/ ctx[6](/*item*/ ctx[23]).apply(this, arguments);
    						},
    						false,
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const listitem_changes = {};

    			if (!updating_name && dirty & /*items*/ 1) {
    				updating_name = true;
    				listitem_changes.name = /*item*/ ctx[23].name;
    				add_flush_callback(() => updating_name = false);
    			}

    			if (!updating_barcode && dirty & /*items*/ 1) {
    				updating_barcode = true;
    				listitem_changes.barcode = /*item*/ ctx[23].barcode;
    				add_flush_callback(() => updating_barcode = false);
    			}

    			if (!updating_owner && dirty & /*items*/ 1) {
    				updating_owner = true;
    				listitem_changes.owner = /*item*/ ctx[23].owner;
    				add_flush_callback(() => updating_owner = false);
    			}

    			listitem.$set(listitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(listitem.$$.fragment, local);
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(listitem.$$.fragment, local);
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(listitem);
    			destroy_component(icon0);
    			destroy_component(icon1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(269:2) {#each items as item}",
    		ctx
    	});

    	return block;
    }

    // (280:1) {#if imageUrl}
    function create_if_block(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*imageUrl*/ ctx[3])) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "100%");
    			attr_dev(img, "alt", "Printout");
    			add_location(img, file, 280, 1, 7991);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*imageUrl*/ 8 && !src_url_equal(img.src, img_src_value = /*imageUrl*/ ctx[3])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(280:1) {#if imageUrl}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let link0;
    	let link1;
    	let link2;
    	let t0;
    	let t1;
    	let main;
    	let img;
    	let img_src_value;
    	let t2;
    	let h3;
    	let t4;
    	let div;
    	let button0;
    	let icon0;
    	let t5;
    	let t6;
    	let button1;
    	let icon1;
    	let t7;
    	let t8;
    	let button2;
    	let icon2;
    	let t9;
    	let t10;
    	let br0;
    	let t11;
    	let ul;
    	let t12;
    	let t13;
    	let br1;
    	let t14;
    	let button3;
    	let icon3;
    	let t15;
    	let t16;
    	let br2;
    	let t17;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*popupVisible*/ ctx[1] && create_if_block_2(ctx);

    	icon0 = new Index({
    			props: { path: mdiPlus, size: 1 },
    			$$inline: true
    		});

    	icon1 = new Index({
    			props: { path: mdiEraser, size: 1 },
    			$$inline: true
    		});

    	icon2 = new Index({
    			props: { path: mdiCodeTags, size: 1 },
    			$$inline: true
    		});

    	let if_block1 = /*items*/ ctx[0].length < 1 && create_if_block_1(ctx);
    	let each_value = /*items*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	icon3 = new Index({
    			props: { path: mdiFileDocumentCheck, size: 1 },
    			$$inline: true
    		});

    	let if_block2 = /*imageUrl*/ ctx[3] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			link0 = element("link");
    			link1 = element("link");
    			link2 = element("link");
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			main = element("main");
    			img = element("img");
    			t2 = space();
    			h3 = element("h3");
    			h3.textContent = "Enter items below:";
    			t4 = space();
    			div = element("div");
    			button0 = element("button");
    			create_component(icon0.$$.fragment);
    			t5 = text(" New Item");
    			t6 = space();
    			button1 = element("button");
    			create_component(icon1.$$.fragment);
    			t7 = text(" Clear Items");
    			t8 = space();
    			button2 = element("button");
    			create_component(icon2.$$.fragment);
    			t9 = text(" Advanced");
    			t10 = space();
    			br0 = element("br");
    			t11 = space();
    			ul = element("ul");
    			if (if_block1) if_block1.c();
    			t12 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t13 = space();
    			br1 = element("br");
    			t14 = space();
    			button3 = element("button");
    			create_component(icon3.$$.fragment);
    			t15 = text(" Save & Generate Sheet");
    			t16 = space();
    			br2 = element("br");
    			t17 = space();
    			if (if_block2) if_block2.c();
    			document_1.title = "SMC Equipment Tags";
    			attr_dev(link0, "rel", "preconnect");
    			attr_dev(link0, "href", "https://fonts.googleapis.com");
    			add_location(link0, file, 231, 1, 6044);
    			attr_dev(link1, "rel", "preconnect");
    			attr_dev(link1, "href", "https://fonts.gstatic.com");
    			attr_dev(link1, "crossorigin", "");
    			add_location(link1, file, 232, 1, 6105);
    			attr_dev(link2, "href", "https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap");
    			attr_dev(link2, "rel", "stylesheet");
    			add_location(link2, file, 233, 1, 6175);
    			if (!src_url_equal(img.src, img_src_value = "assets/logo_white.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "filter", "invert(1)");
    			set_style(img, "width", "20em");
    			attr_dev(img, "alt", "logo");
    			add_location(img, file, 256, 1, 6958);
    			add_location(h3, file, 257, 1, 7041);
    			attr_dev(button0, "class", "svelte-1e1qinl");
    			add_location(button0, file, 259, 2, 7078);
    			attr_dev(button1, "class", "svelte-1e1qinl");
    			add_location(button1, file, 260, 2, 7163);
    			attr_dev(button2, "class", "svelte-1e1qinl");
    			add_location(button2, file, 261, 2, 7258);
    			add_location(div, file, 258, 1, 7070);
    			add_location(br0, file, 263, 1, 7359);
    			set_style(ul, "display", "inline-block");
    			add_location(ul, file, 264, 1, 7366);
    			add_location(br1, file, 276, 1, 7845);
    			attr_dev(button3, "class", "svelte-1e1qinl");
    			add_location(button3, file, 277, 1, 7852);
    			add_location(br2, file, 278, 1, 7968);
    			attr_dev(main, "class", "svelte-1e1qinl");
    			add_location(main, file, 255, 0, 6950);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document_1.head, link0);
    			append_dev(document_1.head, link1);
    			append_dev(document_1.head, link2);
    			insert_dev(target, t0, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, img);
    			append_dev(main, t2);
    			append_dev(main, h3);
    			append_dev(main, t4);
    			append_dev(main, div);
    			append_dev(div, button0);
    			mount_component(icon0, button0, null);
    			append_dev(button0, t5);
    			append_dev(div, t6);
    			append_dev(div, button1);
    			mount_component(icon1, button1, null);
    			append_dev(button1, t7);
    			append_dev(div, t8);
    			append_dev(div, button2);
    			mount_component(icon2, button2, null);
    			append_dev(button2, t9);
    			append_dev(main, t10);
    			append_dev(main, br0);
    			append_dev(main, t11);
    			append_dev(main, ul);
    			if (if_block1) if_block1.m(ul, null);
    			append_dev(ul, t12);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ul, null);
    				}
    			}

    			append_dev(main, t13);
    			append_dev(main, br1);
    			append_dev(main, t14);
    			append_dev(main, button3);
    			mount_component(icon3, button3, null);
    			append_dev(button3, t15);
    			append_dev(main, t16);
    			append_dev(main, br2);
    			append_dev(main, t17);
    			if (if_block2) if_block2.m(main, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*newItem*/ ctx[4], false, false, false, false),
    					listen_dev(button1, "click", /*confirmClear*/ ctx[5], false, false, false, false),
    					listen_dev(button2, "click", /*openAdvanced*/ ctx[9], false, false, false, false),
    					listen_dev(button3, "click", /*generatePrint*/ ctx[8], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*popupVisible*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*popupVisible*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t1.parentNode, t1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*items*/ ctx[0].length < 1) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(ul, t12);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*removeItem, items, mdiClose, cloneItem, mdiContentCopy*/ 193) {
    				each_value = /*items*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (/*imageUrl*/ ctx[3]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					if_block2.m(main, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			transition_in(icon2.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(icon3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			transition_out(icon2.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(icon3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(link0);
    			detach_dev(link1);
    			detach_dev(link2);
    			if (detaching) detach_dev(t0);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(main);
    			destroy_component(icon0);
    			destroy_component(icon1);
    			destroy_component(icon2);
    			if (if_block1) if_block1.d();
    			destroy_each(each_blocks, detaching);
    			destroy_component(icon3);
    			if (if_block2) if_block2.d();
    			mounted = false;
    			run_all(dispose);
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

    function formatBarcodeText(value) {
    	if (value.length < 9) return value;
    	return `${value[0]} ${value.slice(1, 4)} ${value.slice(4, 6)} ${value.slice(6, -3)}${value.slice(-3)}`;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let dpi = 300;
    	let savedItems = localStorage.getItem('itemList');
    	let items = [];
    	if (savedItems) items = JSON.parse(savedItems);
    	let popupVisible = false;
    	let advancedInput = "";
    	let imageUrl = '';

    	function saveItemList() {
    		if (items.length > 0) {
    			localStorage.setItem('itemList', JSON.stringify(items));
    		} else {
    			localStorage.removeItem('itemList');
    		}
    	}

    	function newItem() {
    		$$invalidate(0, items = [...items, { name: '', barcode: '', owner: '' }]);
    		saveItemList();
    	}

    	function confirmClear() {
    		if (confirm("Clear the item list?")) clearItems();
    	}

    	function clearItems() {
    		$$invalidate(0, items = []);
    		saveItemList();
    	}

    	const logoImage = new Image();
    	logoImage.src = 'assets/logo_white.png';

    	function removeItem(value) {
    		$$invalidate(0, items = items.filter(item => item !== value));
    		saveItemList();
    	}

    	function cloneItem(value) {
    		const index = items.indexOf(value);
    		const copy = { ...value };
    		items.splice(index, 0, copy);
    		$$invalidate(0, items); // hack to make Svelte recognize something has changed
    		saveItemList();
    	}

    	function generateBarcode(barcodeValue) {
    		if (barcodeValue.trim() !== '') {
    			const barcodeCanvas = document.createElement('canvas');

    			JsBarcode$1(barcodeCanvas, barcodeValue, {
    				format: "CODE128",
    				displayValue: false,
    				height: 70,
    				width: 4,
    				margin: 10,
    				background: "#ffffff"
    			});

    			const barcodeHeight = barcodeCanvas.height;
    			const extraSpace = 80;
    			const canvas = document.createElement('canvas');
    			canvas.width = barcodeCanvas.width;
    			canvas.height = barcodeHeight + extraSpace;
    			const ctx = canvas.getContext('2d');
    			ctx.drawImage(barcodeCanvas, 0, 0);
    			ctx.font = "bold 42px 'Roboto Mono', monospace";
    			const formattedText = formatBarcodeText(barcodeValue);
    			const fullTextWidth = ctx.measureText(formattedText).width;
    			const leftMargin = (canvas.width - fullTextWidth) / 2;
    			ctx.fillStyle = "black";
    			ctx.fillText(formattedText.slice(0, -3), leftMargin, canvas.height - extraSpace / 2);
    			ctx.fillStyle = "red";
    			ctx.fillText(formattedText.slice(-3), ctx.measureText(formattedText.slice(0, -3)).width + leftMargin, canvas.height - extraSpace / 2);
    			return canvas;
    		}
    	}

    	function generateTag(item) {
    		const canvas = document.createElement('canvas');
    		const ctx = canvas.getContext('2d');
    		canvas.width = 2.75 * dpi;
    		canvas.height = 1.75 * dpi;
    		let barcodeImage = generateBarcode(item.barcode);
    		ctx.drawImage(barcodeImage, 0.2 * dpi, 0.9 * dpi);
    		ctx.fillStyle = '#487ABE';
    		ctx.lineWidth = 0;
    		ctx.fillRect(0, 0, 2.75 * dpi, 0.67 * dpi);
    		ctx.drawImage(logoImage, 0.5 * dpi, 0.26 * dpi, 1.6 * dpi, 0.4 * dpi);

    		///
    		// ctx.fillStyle = 'black';
    		// ctx.lineWidth = 4;
    		// ctx.globalAlpha = 0.1;
    		// ctx.fillRect(0.125 * dpi, 0.25 * dpi, 2.385 * dpi, 1.25 * dpi);
    		///
    		ctx.globalAlpha = 1;

    		ctx.fillStyle = 'black';
    		let nameFontSize = 52;
    		ctx.font = `bold ${nameFontSize}px Arial`;
    		let nameWidth = ctx.measureText(item.name).width;

    		while (nameWidth > 2.325 * dpi) {
    			nameFontSize -= 2;
    			ctx.font = `bold ${nameFontSize}px Arial`;
    			nameWidth = ctx.measureText(item.name).width;
    		}

    		ctx.fillText(item.name, 0.15 * dpi + (2.325 * dpi - nameWidth) / 2, 0.865 * dpi);
    		ctx.font = "bold 42px Arial";
    		ctx.fillText('Owner:', 1.875 * dpi + 4, 1.0625 * dpi);
    		let ownerFontSize = 38;
    		ctx.font = `${ownerFontSize}px Arial`;
    		let ownerWidth = ctx.measureText(item.owner).width;

    		while (ownerWidth > 0.5 * dpi) {
    			ownerFontSize -= 2;
    			ctx.font = `${ownerFontSize}px Arial`;
    			ownerWidth = ctx.measureText(item.owner).width;
    		}
    		ctx.fillText(item.owner, 1.875 * dpi + (0.5 * dpi - ownerWidth) / 2, 1.2 * dpi);
    		return canvas;
    	}

    	function generatePrint() {
    		localStorage.setItem('itemList', JSON.stringify(items));
    		const canvas = document.createElement('canvas');
    		const ctx = canvas.getContext('2d');
    		canvas.width = 11 * dpi;
    		canvas.height = 8.5 * dpi;
    		ctx.fillStyle = 'white';
    		ctx.fillRect(0, 0, 11 * dpi, 8.5 * dpi);
    		let n = 0;
    		let x = 0.25 * dpi;
    		let y = 0.25 * dpi;
    		ctx.strokeStyle = 'black';
    		ctx.lineWidth = 1;
    		let numExcluded = 0;

    		items.forEach(item => {
    			if (!item.name || !item.barcode || !item.owner) {
    				numExcluded += 1;
    				return;
    			}

    			ctx.strokeRect(x, y, 2.75 * dpi, 1.75 * dpi);
    			ctx.drawImage(generateTag(item), x, y);
    			n += 1;

    			if (n % 3 == 0) {
    				x = 0.25 * dpi;
    				y += 1.75 * dpi;
    			} else {
    				x += 2.75 * dpi;
    			}
    		});

    		if (numExcluded > 0) alert(`${numExcluded} items were excluded because one or more fields were empty in the item list!`);

    		canvas.toBlob(blob => {
    			$$invalidate(3, imageUrl = URL.createObjectURL(blob));
    			navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    		});
    	}

    	function openAdvanced() {
    		$$invalidate(1, popupVisible = true);
    	}

    	function runAdvanced() {
    		let currentName = "";
    		let currentOwner = "";

    		for (const line of advancedInput.split("\n")) {
    			const stripped = line.trim();

    			if (stripped.startsWith("N:")) {
    				currentName = stripped.slice(2);
    			} else if (stripped.startsWith("O:")) {
    				currentOwner = stripped.slice(2);
    			} else if (!isNaN(stripped)) {
    				$$invalidate(0, items = [
    					...items,
    					{
    						name: currentName,
    						owner: currentOwner,
    						barcode: stripped
    					}
    				]);
    			}
    		}

    		saveItemList();
    		$$invalidate(1, popupVisible = false);
    	}

    	function closeAdvanced() {
    		$$invalidate(1, popupVisible = false);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function textarea_input_handler() {
    		advancedInput = this.value;
    		$$invalidate(2, advancedInput);
    	}

    	function listitem_name_binding(value, item) {
    		if ($$self.$$.not_equal(item.name, value)) {
    			item.name = value;
    			$$invalidate(0, items);
    		}
    	}

    	function listitem_barcode_binding(value, item) {
    		if ($$self.$$.not_equal(item.barcode, value)) {
    			item.barcode = value;
    			$$invalidate(0, items);
    		}
    	}

    	function listitem_owner_binding(value, item) {
    		if ($$self.$$.not_equal(item.owner, value)) {
    			item.owner = value;
    			$$invalidate(0, items);
    		}
    	}

    	$$self.$capture_state = () => ({
    		JsBarcode: JsBarcode$1,
    		ListItem,
    		Icon: Index,
    		mdiClose,
    		mdiContentCopy,
    		mdiPlus,
    		mdiFileDocumentCheck,
    		mdiEraser,
    		mdiCodeTags,
    		dpi,
    		savedItems,
    		items,
    		popupVisible,
    		advancedInput,
    		imageUrl,
    		saveItemList,
    		newItem,
    		confirmClear,
    		clearItems,
    		logoImage,
    		removeItem,
    		cloneItem,
    		formatBarcodeText,
    		generateBarcode,
    		generateTag,
    		generatePrint,
    		openAdvanced,
    		runAdvanced,
    		closeAdvanced
    	});

    	$$self.$inject_state = $$props => {
    		if ('dpi' in $$props) dpi = $$props.dpi;
    		if ('savedItems' in $$props) savedItems = $$props.savedItems;
    		if ('items' in $$props) $$invalidate(0, items = $$props.items);
    		if ('popupVisible' in $$props) $$invalidate(1, popupVisible = $$props.popupVisible);
    		if ('advancedInput' in $$props) $$invalidate(2, advancedInput = $$props.advancedInput);
    		if ('imageUrl' in $$props) $$invalidate(3, imageUrl = $$props.imageUrl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		items,
    		popupVisible,
    		advancedInput,
    		imageUrl,
    		newItem,
    		confirmClear,
    		removeItem,
    		cloneItem,
    		generatePrint,
    		openAdvanced,
    		runAdvanced,
    		closeAdvanced,
    		textarea_input_handler,
    		listitem_name_binding,
    		listitem_barcode_binding,
    		listitem_owner_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
