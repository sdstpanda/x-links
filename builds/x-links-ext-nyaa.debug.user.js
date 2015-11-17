// ==UserScript==
// @name        X-links Extension - Nyaa Torrents (debug)
// @namespace   dnsev-h
// @author      dnsev-h
// @version     1.0.0.2.-0xDB
// @description Linkify and format nyaa.se links
// @include     http://boards.4chan.org/*
// @include     https://boards.4chan.org/*
// @include     http://8ch.net/*
// @include     https://8ch.net/*
// @include     http://desustorage.org/*
// @include     https://desustorage.org/*
// @include     http://fgts.jp/*
// @include     https://fgts.jp/*
// @include     http://boards.38chan.net/*
// @include     http://forums.e-hentai.org/*
// @include     https://forums.e-hentai.org/*
// @homepage    https://dnsev-h.github.io/x-links/
// @supportURL  https://github.com/dnsev-h/x-links/issues
// @icon        data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAA4klEQVR4Ae2ZoQ7CMBRF+VIMBjGDwSAwmImZGcQUYoYPq32fAPK8LCSleZCmzb3JcUtzD+ndBDslHuVVQr0zJdCAQHoaQEggTQYj9C8ggRVCAqPBDfoUkMBq8HAs4J8vLZ2uEH/VSqC6QEZmMbg7ZgiWzu2wJQEJZGRmgwn+cNf9jxXcRn0BCZA/33VKb848OfbQioAEikqni+MMpRugdGADFQQkEL7rlN7c3QG+2EZgrPUEJPD7V+RgcHQcoGAXDQlIoLx0/kxKhwbahoAEPn5ZYwKU7ldAAvqLSQLNRlEU5Q1O5fOjZV4u4AAAAABJRU5ErkJggg==
// @icon64      data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAOVBMVEUBAAAAAADmce/ml+/mje/mku/mhO/mY+/mbO/mdu/me+/mie/mXu/mm+/mpe/mf+/mqu/maO/moe9+hYmYAAAAAXRSTlMAQObYZgAAAJRJREFUeF7t1zkOAzEMBEFRe9+2//9YtzOCIOR8oEoX7GCgZEtXigWtb8qBF36ywIgD8gHcyAIHZqgHbnxwwRCPH1igEvCRCwMmZMd+cKVAjEwY0RpvgDkKAe/feANmVJxQC8TjHRssqDBHI5CPt6FihR8zjicQaD6eFW8sMEcxEI99fEG2vFrgwY4scEI/0P8X0HVf06IrwbJZHiwAAAAASUVORK5CYII=
// @run-at      document-start
// ==/UserScript==
(function () {
	"use strict";

	var timing = (function () {
		var perf = window.performance,
			now, fn;

		if (!perf || !(now = perf.now || perf.mozNow || perf.msNow || perf.oNow || perf.webkitNow)) {
			perf = Date;
			now = perf.now;
		}

		fn = function () { return now.call(perf); };
		fn.start = now.call(perf);
		return fn;
	})();
	(function (simple) {
		var error_node = null,
			function_names = [],
			total_counter = 0,
			function_counters = {},
			timing_init = timing();

		var set_timeout_0ms = (function () {
			var callbacks = {},
				origin = window.location.protocol + "//" + window.location.host;

			var random_gen = function (count) {
				var s = "",
					i;

				for (i = 0; i < count; ++i) s += ("" + Math.random()).replace(/\./, "");

				return s;
			};

			window.addEventListener("message", function (event) {
				if (event.origin === origin && event.data !== null && typeof(event.data) === "object") {
					var key = event.data.set_timeout_0ms;
					if (key in callbacks) {
						callbacks[key].call(null);
						delete callbacks[key];
					}
				}
			}, false);

			var fn = function (callback) {
				var key = random_gen(4);
				callbacks[key] = callback;
				try {
					window.postMessage({ set_timeout_0ms: key }, origin);
				}
				catch (e) {
					delete callbacks[key];
					setTimeout(function () {
						callback.call(null);
					}, 1);
				}
				return key;
			};
			fn.clear = function (key) {
				delete callbacks[key];
			};
			return fn;
		})();

		var format_stack = function (stack) {
			var output = "",
				line_number = 0,
				line, i, ii, p;

			stack = stack.trim().replace(/\r\n/g, "\n").split("\n");
			for (i = 0, ii = stack.length; i < ii; ++i) {
				line = stack[i];
				if ((p = line.indexOf("@")) >= 0) {
					++p;
					line = line.substr(0, p) + line.substr(p).replace(/[\w\-]+:(?:[\w\W]*?)([^\/]+?\.js)/ig, "$1");
				}

				if (!/^\s*Function\.prototype\._w/.test(line)) {
					if (line_number++ > 0) output += "\n";
					output += line;
				}
			}

			return output;
		};
		var log = function (exception) {
			if (error_node === null) {
				var n0 = document.body || document.documentElement,
					n1 = document.createElement("div"),
					n2 = document.createElement("textarea");

				n1.setAttribute("style", "position:fixed!important;right:0!important;top:0!important;bottom:0!important;width:20em!important;opacity:0.8!important;background:#fff!important;color:#000!important;z-index:999999999!important;");
				n2.setAttribute("style", "position:absolute!important;left:0!important;top:0!important;width:100%!important;height:100%!important;padding:0.5em!important;margin:0!important;color:inherit!important;background:transparent!important;font-family:inherit!important;font-size:8px!important;line-height:1.1em!important;border:none!important;resize:none!important;font-family:Courier,monospace!important;box-sizing:border-box!important;cursor:initial!important;");
				n2.spellcheck = false;
				n2.readOnly = true;
				n2.wrap = "off";
				n1.appendChild(n2);
				if (n0) n0.appendChild(n1);

				error_node = n2;
			}

			var s = "";
			if (error_node.value.length > 0) s += "\n====================\n";
			s += "" + exception + "\n" + (format_stack("" + exception.stack));
			error_node.value += s;

			console.log("Exception:", exception);
		};

		var increase_counter = function (fn_index) {
			++total_counter;
			if (fn_index in function_counters) {
				++function_counters[fn_index];
			}
			else {
				function_counters[fn_index] = 1;

				if (log_calls_timer === null) {
					log_calls_timer = set_timeout_0ms(log_calls);
				}
			}
		};

		var log_calls_timer = null;
		var log_calls = function () {
			log_calls_timer = null;

			// Sort keys by name
			var time_diff = timing() - timing_init,
				keys = Object.keys(function_counters),
				sortable = [],
				count, i;

			for (i = 0; i < keys.length; ++i) {
				sortable.push([ function_counters[keys[i]], parseInt(keys[i], 10) ]);
			}

			sortable.sort(function (a, b) {
				if (a[0] > b[0]) return -1;
				if (a[0] < b[0]) return 1;
				if (a[1] > b[1]) return -1;
				if (a[1] < b[1]) return 1;
				return 0;
			});

			for (i = 0; i < sortable.length; ++i) {
				sortable[i] = function_names[sortable[i][1]] + ": " + sortable[i][0];
			}

			count = total_counter;
			total_counter = 0;
			function_counters = {};

			if (time_diff >= 10000) {
				time_diff = (time_diff / 1000).toFixed(1) + "s";
			}
			else {
				time_diff = time_diff.toFixed(0) + "ms";
			}

			// Log
			console.log("[Debug Function Call Counter] Init+" + time_diff + ": call_count=" + count + ";", sortable);
		};

		var last_error;
		var last_error_clear_timer = false;
		var last_error_clear = function () {
			last_error = undefined;
			last_error_clear_timer = false;
		};
		Function.prototype._w = function (fn_index) {
			var fn = this;
			return function () {
				if (!simple) increase_counter(fn_index);

				try {
					return fn.apply(this, arguments);
				}
				catch (e) {
					if (last_error !== e) {
						if (!last_error_clear_timer) {
							last_error_clear_timer = true;
							set_timeout_0ms(last_error_clear);
						}
						last_error = e;
						log(e);
					}
					throw e;
				}
			};
		};
	})(true);

	var xlinks_api = (function () {
		"use strict";

		// Private
		var ready = (function () {

			var callbacks = [],
				check_interval = null,
				check_interval_time = 250;

			var callback_check = function () {
				if (
					(document.readyState === "interactive" || document.readyState === "complete") &&
					callbacks !== null
				) {
					var cbs = callbacks,
						cb_count = cbs.length,
						i;

					callbacks = null;

					for (i = 0; i < cb_count; ++i) {
						cbs[i].call(null);
					}

					window.removeEventListener("load", callback_check, false);
					window.removeEventListener("DOMContentLoaded", callback_check, false);
					document.removeEventListener("readystatechange", callback_check, false);

					if (check_interval !== null) {
						clearInterval(check_interval);
						check_interval = null;
					}

					return true;
				}

				return false;
			}._w(3);

			window.addEventListener("load", callback_check, false);
			window.addEventListener("DOMContentLoaded", callback_check, false);
			document.addEventListener("readystatechange", callback_check, false);

			return function (cb) {
				if (callbacks === null) {
					cb.call(null);
				}
				else {
					callbacks.push(cb);
					if (check_interval === null && callback_check() !== true) {
						check_interval = setInterval(callback_check, check_interval_time);
					}
				}
			}._w(4);

		}._w(2))();

		var ttl_1_hour = 60 * 60 * 1000;
		var ttl_1_day = 24 * ttl_1_hour;
		var ttl_1_year = 365 * ttl_1_day;

		var cache_prefix = "";
		var cache_storage = window.localStorage;
		var cache_set = function (key, data, ttl) {
			cache_storage.setItem(cache_prefix + "ext-" + key, JSON.stringify({
				expires: Date.now() + ttl,
				data: data
			}));
		}._w(5);
		var cache_get = function (key) {
			var json = parse_json(cache_storage.getItem(cache_prefix + "ext-" + key), null);

			if (
				json !== null &&
				typeof(json) === "object" &&
				Date.now() < json.expires &&
				typeof(json.data) === "object"
			) {
				return json.data;
			}

			cache_storage.removeItem(key);
			return null;
		}._w(6);

		var random_string_alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		var random_string = function (count) {
			var alpha_len = random_string_alphabet.length,
				s = "",
				i;
			for (i = 0; i < count; ++i) {
				s += random_string_alphabet[Math.floor(Math.random() * alpha_len)];
			}
			return s;
		}._w(7);

		var is_object = function (obj) {
			return (obj !== null && typeof(obj) === "object");
		}._w(8);

		var create_temp_storage = function () {
			var data = {};

			var fn = {
				length: 0,
				key: function (index) {
					return Object.keys(data)[index];
				}._w(10),
				getItem: function (key) {
					if (Object.prototype.hasOwnProperty.call(data, key)) {
						return data[key];
					}
					return null;
				}._w(11),
				setItem: function (key, value) {
					if (!Object.prototype.hasOwnProperty.call(data, key)) {
						++fn.length;
					}
					data[key] = value;
				}._w(12),
				removeItem: function (key) {
					if (Object.prototype.hasOwnProperty.call(data, key)) {
						delete data[key];
						--fn.length;
					}
				}._w(13),
				clear: function () {
					data = {};
					fn.length = 0;
				}._w(14)
			};

			return fn;
		}._w(9);

		var set_shared_node = function (node) {
			var par = document.querySelector(".xl-extension-sharing-elements"),
				id = random_string(32);

			if (par === null) {
				par = document.createElement("div");
				par.className = "xl-extension-sharing-elements";
				par.style.setProperty("display", "none", "important");
				document.body.appendChild(par);
			}

			try {
				node.setAttribute("data-xl-sharing-id", id);
				par.appendChild(node);
			}
			catch (e) {
				return null;
			}

			return id;
		}._w(15);

		var settings_descriptor_info_normalize = function (input) {
			var info = {},
				opt, label, desc, a, i, ii, v;

			if (typeof(input.type) === "string") {
				info.type = input.type;
			}
			if (Array.isArray((a = input.options))) {
				info.options = [];
				for (i = 0, ii = a.length; i < ii; ++i) {
					v = a[i];
					if (
						Array.isArray(v) &&
						v.length >= 2 &&
						typeof((label = v[1])) === "string"
					) {
						opt = [ v[0], v[1] ];
						if (typeof((desc = v[2])) === "string") {
							opt.push(desc);
						}
						info.options.push(opt);
					}
				}
			}

			return info;
		}._w(16);

		var config = {};

		var api = null;
		var API = function (info) {
			this.origin = window.location.protocol + "//" + window.location.host;
			this.timeout_delay = 1000;

			this.init_state = 0;
			this.api_name = info.namespace || info.name || "";
			this.api_key = random_string(64);
			this.action = null;
			this.reply_id = null;
			this.reply_callbacks = {};

			this.handlers = API.handlers_init;
			this.functions = {};
			this.url_info_functions = {};
			this.url_info_to_data_functions = {};
			this.details_functions = {};
			this.actions_functions = {};

			var self = this;
			this.on_window_message_bind = function (event) {
				return self.on_window_message(event);
			}._w(18);
			window.addEventListener("message", this.on_window_message_bind, false);
		}._w(17);
		API.prototype.on_window_message = function (event) {
			var data = event.data,
				action_data, reply_id, fn;

			if (
				event.origin === this.origin &&
				is_object(data) &&
				typeof((this.action = data.xlinks_action)) === "string" &&
				data.extension === false &&
				data.key === this.api_key &&
				data.name === this.api_name &&
				(action_data = data.data) !== undefined
			) {
				this.reply_id = data.id;

				if (typeof((reply_id = data.reply)) === "string") {
					if (typeof((fn = this.reply_callbacks[reply_id])) === "function") {
						delete this.reply_callbacks[reply_id];
						fn.call(this, null, action_data);
					}
				}
				else if (typeof((fn = this.handlers[this.action])) === "function") {
					fn.call(this, action_data);
				}

				this.reply_id = null;
			}

			this.action = null;
		}._w(19);
		API.prototype.send = function (action, data, reply_to, on_reply) {
			var self = this,
				id = null,
				timeout = null,
				cb, i;

			if (on_reply !== undefined) {
				for (i = 0; i < 10; ++i) {
					id = random_string(32);
					if (!Object.prototype.hasOwnProperty.call(this.reply_callbacks)) break;
				}

				cb = function () {
					if (timeout !== null) {
						clearTimeout(timeout);
						timeout = null;
					}

					on_reply.apply(this, arguments);
				}._w(21);

				this.reply_callbacks[id] = cb;
				cb = null;

				if (this.timeout_delay >= 0) {
					timeout = setTimeout(function () {
						timeout = null;
						delete self.reply_callbacks[id];
						on_reply.call(self, "Response timeout");
					}._w(22), this.timeout_delay);
				}
			}

			this.post_message({
				xlinks_action: action,
				extension: true,
				id: id,
				reply: reply_to || null,
				key: this.api_key,
				name: this.api_name,
				data: data
			});
		}._w(20);
		API.prototype.post_message = function (msg) {
			try {
				window.postMessage(msg, this.origin);
			}
			catch (e) {
				// Tampermonkey bug
				try {
					unsafeWindow.postMessage(msg, this.origin);
				}
				catch (e2) {
					console.log("window.postMessage failed! Your userscript manager may need to be updated!");
					console.log("window.postMessage exception:", e, e2);
				}
			}
		}._w(23);
		API.prototype.init = function (info, callback) {
			if (this.init_state !== 0) {
				if (typeof(callback) === "function") callback.call(null, this.init_state === 1 ? "Init active" : "Already started");
				return;
			}

			this.init_state = 1;

			var self = this,
				de = document.documentElement,
				count = info.registrations,
				send_info = {},
				a, v, i;

			if (typeof((v = info.name)) === "string") send_info.name = v;
			if (typeof((v = info.author)) === "string") send_info.author = v;
			if (typeof((v = info.description)) === "string") send_info.description = v;
			if (Array.isArray((v = info.version))) {
				for (i = 0; i < v.length; ++i) {
					if (typeof(v[i]) !== "number") break;
				}
				if (i === v.length) send_info.version = v.slice(0);
			}

			if (typeof(count) !== "number" || count < 0) {
				count = 1;
			}

			if (de) {
				a = de.getAttribute("data-xlinks-extensions-waiting");
				a = (a ? (parseInt(a, 10) || 0) : 0) + count;
				de.setAttribute("data-xlinks-extensions-waiting", a);
				de = null;
			}

			ready(function () {
				self.send("start", send_info, null, function (err, data) {
					err = self.on_init(err, data);
					if (typeof(callback) === "function") callback.call(null, err);
				}._w(26));
			}._w(25));
		}._w(24);
		API.prototype.on_init = function (err, data) {
			var v;

			if (err === null) {
				if (!is_object(data)) {
					err = "Could not generate extension key";
				}
				else if (typeof((err = data.err)) !== "string") {
					if (typeof((v = data.key)) !== "string") {
						err = "Could not generate extension key";
					}
					else {
						err = null;
						this.api_key = v;
						this.handlers = API.handlers;

						if (typeof((v = data.cache_prefix)) === "string") {
							cache_prefix = v;
						}
						if (typeof((v = data.cache_mode)) === "string") {
							if (v === "session") {
								cache_storage = window.sessionStorage;
							}
							else if (v === "none") {
								cache_storage = create_temp_storage();
							}
						}
					}
				}
			}

			this.init_state = (err === null) ? 2 : 0;
			return err;
		}._w(27);
		API.prototype.register = function (data, callback) {
			if (this.init_state !== 2) {
				if (typeof(callback) === "function") callback.call(null, "API not init'd", 0);
				return;
			}

			// Data
			var send_data = {
				name: this.api_name,
				author: "",
				description: "",
				settings: {},
				request_apis: [],
				linkifiers: [],
				commands: [],
			};

			var request_apis_response = [],
				command_fns = [],
				array, entry, fn_map, a_data, a, i, ii, k, o, v;

			// Settings
			o = data.settings;
			if (is_object(o)) {
				for (k in o) {
					a = o[k];
					if (Array.isArray(a)) {
						send_data.settings[k] = a_data = [];
						for (i = 0, ii = a.length; i < ii; ++i) {
							v = a[i];
							if (Array.isArray(v) && typeof(v[0]) === "string") {
								entry = [ v[0] ];
								if (v.length > 1) {
									entry.push(
										(v[1] === undefined ? null : v[1]),
										"" + (v[2] || ""),
										"" + (v[3] || "")
									);
									if (v.length > 4 && is_object(v[4])) {
										entry.push(settings_descriptor_info_normalize(v[4]));
									}
								}
								a_data.push(entry);
							}
						}
					}
				}
			}

			// Request APIs
			array = data.request_apis;
			if (Array.isArray(array)) {
				for (i = 0, ii = array.length; i < ii; ++i) {
					a = array[i];
					fn_map = {};
					a_data = {
						group: "other",
						namespace: "other",
						type: "other",
						count: 1,
						concurrent: 1,
						delays: { okay: 200, error: 5000 },
						functions: []
					};
					if (typeof((v = a.group)) === "string") a_data.group = v;
					if (typeof((v = a.namespace)) === "string") a_data.namespace = v;
					if (typeof((v = a.type)) === "string") a_data.type = v;
					if (typeof((v = a.count)) === "number") a_data.count = Math.max(1, v);
					if (typeof((v = a.concurrent)) === "number") a_data.concurrent = Math.max(1, v);
					if (typeof((v = a.delay_okay)) === "number") a_data.delay_okay = Math.max(0, v);
					if (typeof((v = a.delay_error)) === "number") a_data.delay_error = Math.max(0, v);
					if (is_object((o = a.functions))) {
						for (k in o) {
							v = o[k];
							if (typeof(v) === "function") {
								a_data.functions.push(k);
								fn_map[k] = v;
							}
						}
					}

					request_apis_response.push({
						functions: fn_map
					});
					send_data.request_apis.push(a_data);
				}
			}

			// Linkifiers
			array = data.linkifiers;
			if (Array.isArray(array)) {
				for (i = 0, ii = array.length; i < ii; ++i) {
					a = array[i];
					a_data = {
						regex: null,
						prefix_group: 0,
						prefix: ""
					};

					v = a.regex;
					if (typeof(v) === "string") {
						a_data.regex = [ v ];
					}
					else if (v instanceof RegExp) {
						a_data.regex = [ v.source, v.flags ];
					}
					else if (Array.isArray(v)) {
						if (typeof(v[0]) === "string") {
							if (typeof(v[1]) === "string") {
								a_data.regex = [ v[0], v[1] ];
							}
							else {
								a_data.regex = [ v[0] ];
							}
						}
					}

					if (typeof((v = a.prefix_group)) === "number") a_data.prefix_group = v;
					if (typeof((v = a.prefix)) === "string") a_data.prefix = v;

					send_data.linkifiers.push(a_data);
				}
			}

			// URL info functions
			array = data.commands;
			if (Array.isArray(array)) {
				for (i = 0, ii = array.length; i < ii; ++i) {
					a = array[i];
					a_data = {
						url_info: false,
						to_data: false,
						actions: false,
						details: false
					};
					o = {
						url_info: null,
						to_data: null,
						actions: null,
						details: null
					};

					if (typeof((v = a.url_info)) === "function") {
						a_data.url_info = true;
						o.url_info = v;
					}
					if (typeof((v = a.to_data)) === "function") {
						a_data.to_data = true;
						o.to_data = v;
					}
					if (typeof((v = a.actions)) === "function") {
						a_data.actions = true;
						o.actions = v;
					}
					if (typeof((v = a.details)) === "function") {
						a_data.details = true;
						o.details = v;
					}

					command_fns.push(o);
					send_data.commands.push(a_data);
				}
			}

			// Send
			this.send("register", send_data, null, function (err, data) {
				var o;
				if (err !== null) {
					if (typeof(callback) === "function") callback.call(null, err, 0);
				}
				else if (!is_object(data) || !is_object((o = data.response))) {
					if (typeof(callback) === "function") callback.call(null, "Invalid extension response", 0);
				}
				else {
					var okay = this.register_complete(o, request_apis_response, command_fns, send_data.settings);
					if (typeof(callback) === "function") callback.call(null, null, okay);
				}
			}._w(29));
		}._w(28);
		API.prototype.register_complete = function (data, request_apis, command_fns, settings) {
			var reg_count = 0,
				setting_ns, errors, name, fn, e, o, i, ii, k, v;

			// Request APIs
			errors = [];
			i = 0;
			if (Array.isArray((o = data.request_apis))) {
				for (ii = o.length; i < ii; ++i) {
					e = o[i];
					if (i >= request_apis.length) {
						errors.push("Invalid");
					}
					else if (typeof(e) === "string") {
						errors.push(e);
					}
					else if (!is_object(e)) {
						errors.push("Invalid");
					}
					else {
						++reg_count;
						for (k in e) {
							if (Object.prototype.hasOwnProperty.call(e, k) && Object.prototype.hasOwnProperty.call(request_apis[i].functions, k)) {
								fn = request_apis[i].functions[k];
								this.functions[e[k]] = fn;
							}
						}
					}
				}
			}
			for (ii = request_apis.length; i < ii; ++i) {
				errors.push("Invalid");
			}

			// URL infos
			errors = [];
			i = 0;
			if (Array.isArray((o = data.commands))) {
				for (ii = o.length; i < ii; ++i) {
					e = o[i];
					if (i >= command_fns.length) {
						errors.push("Invalid");
					}
					else if (typeof(e) === "string") {
						errors.push(e);
					}
					else if (!is_object(e) || typeof((k = e.id)) !== "string") {
						errors.push("Invalid");
					}
					else {
						++reg_count;
						this.url_info_functions[k] = command_fns[i].url_info;
						this.url_info_to_data_functions[k] = command_fns[i].to_data;
						if (command_fns[i].actions !== null) this.actions_functions[k] = command_fns[i].actions;
						if (command_fns[i].details !== null) this.details_functions[k] = command_fns[i].details;
					}
				}
			}
			for (ii = command_fns.length; i < ii; ++i) {
				errors.push("Invalid");
			}

			// Settings
			for (k in settings) {
				setting_ns = settings[k];
				for (i = 0, ii = setting_ns.length; i < ii; ++i) {
					name = setting_ns[i][0];
					if (
						!is_object(data.settings) ||
						!is_object((o = data.settings[k])) ||
						(v = o[name]) === undefined
					) {
						v = (setting_ns[i].length > 1) ? setting_ns[i][1] : false;
					}

					o = config[k];
					if (o === undefined) config[k] = o = {};
					o[name] = v;
				}
			}

			return reg_count;
		}._w(30);

		API.handlers_init = {};
		API.handlers = {
			request_end: function (data) {
				var id;

				if (
					is_object(data) &&
					typeof((id = data.id)) === "string"
				) {
					// Remove request
					delete requests_active[id];
				}
			}._w(31),
			api_function: function (data) {
				var self = this,
					action = this.action,
					reply_id = this.reply_id,
					req = null,
					state, id, args, fn, ret;

				if (
					!is_object(data) ||
					typeof((id = data.id)) !== "string" ||
					!Array.isArray((args = data.args))
				) {
					// Error
					this.send(this.action, { err: "Invalid extension data" }, this.reply_id);
					return;
				}

				// Exists
				if (!Array.prototype.hasOwnProperty.call(this.functions, id)) {
					// Error
					this.send(this.action, { err: "Invalid extension function" }, this.reply_id);
					return;
				}
				fn = this.functions[id];

				// State
				if (is_object((state = data.state))) {
					id = state.id;
					req = requests_active[id];
					if (req === undefined) {
						requests_active[id] = req = new Request();
					}
					load_request_state(req, state);
				}

				// Callback
				args = Array.prototype.slice.call(args);
				args.push(function () {
					// Err
					self.send(action, {
						err: null,
						args: Array.prototype.slice.call(arguments)
					}, reply_id);
				}._w(33));

				// Call
				ret = fn.apply(req, args);
			}._w(32),
			url_info: function (data) {
				var self = this,
					action = this.action,
					reply_id = this.reply_id,
					id, url, fn;

				if (
					!is_object(data) ||
					typeof((id = data.id)) !== "string" ||
					typeof((url = data.url)) !== "string"
				) {
					// Error
					this.send(this.action, { err: "Invalid extension data" }, this.reply_id);
					return;
				}

				// Exists
				if (!Array.prototype.hasOwnProperty.call(this.url_info_functions, id)) {
					// Error
					this.send(this.action, { err: "Invalid extension function" }, this.reply_id);
					return;
				}
				fn = this.url_info_functions[id];

				// Call
				fn(url, function (err, data) {
					self.send(action, {
						err: err,
						data: data
					}, reply_id);
				}._w(35));
			}._w(34),
			url_info_to_data: function (data) {
				var self = this,
					action = this.action,
					reply_id = this.reply_id,
					id, url_info, fn;

				if (
					!is_object(data) ||
					typeof((id = data.id)) !== "string" ||
					!is_object((url_info = data.url))
				) {
					// Error
					this.send(this.action, { err: "Invalid extension data" }, this.reply_id);
					return;
				}

				// Exists
				if (!Array.prototype.hasOwnProperty.call(this.url_info_to_data_functions, id)) {
					// Error
					this.send(this.action, { err: "Invalid extension function" }, this.reply_id);
					return;
				}
				fn = this.url_info_to_data_functions[id];

				// Call
				fn(url_info, function (err, data) {
					self.send(action, {
						err: err,
						data: data
					}, reply_id);
				}._w(37));
			}._w(36),
			create_actions: function (data) {
				var self = this,
					action = this.action,
					reply_id = this.reply_id,
					id, fn, fn_data, fn_info;

				if (
					!is_object(data) ||
					typeof((id = data.id)) !== "string" ||
					!is_object((fn_data = data.data)) ||
					!is_object((fn_info = data.info))
				) {
					// Error
					this.send(this.action, { err: "Invalid extension data" }, this.reply_id);
					return;
				}

				// Exists
				if (!Array.prototype.hasOwnProperty.call(this.actions_functions, id)) {
					// Error
					this.send(this.action, { err: "Invalid extension function" }, this.reply_id);
					return;
				}
				fn = this.actions_functions[id];

				// Call
				fn(fn_data, fn_info, function (err, data) {
					self.send(action, {
						err: err,
						data: data
					}, reply_id);
				}._w(39));
			}._w(38),
			create_details: function (data) {
				var self = this,
					action = this.action,
					reply_id = this.reply_id,
					id, fn, fn_data, fn_info;

				if (
					!is_object(data) ||
					typeof((id = data.id)) !== "string" ||
					!is_object((fn_data = data.data)) ||
					!is_object((fn_info = data.info))
				) {
					// Error
					this.send(this.action, { err: "Invalid extension data" }, this.reply_id);
					return;
				}

				// Exists
				if (!Array.prototype.hasOwnProperty.call(this.details_functions, id)) {
					// Error
					this.send(this.action, { err: "Invalid extension function" }, this.reply_id);
					return;
				}
				fn = this.details_functions[id];

				// Call
				fn(fn_data, fn_info, function (err, data) {
					self.send(action, {
						err: err,
						data: set_shared_node(data)
					}, reply_id);
				}._w(41));
			}._w(40),
		};

		var RequestErrorMode = {
			None: 0,
			NoCache: 1,
			Save: 2
		};

		var ImageFlags = {
			None: 0x0,
			NoLeech: 0x1
		};

		var requests_active = {};
		var Request = function () {
		}._w(42);

		var load_request_state = function (request, state) {
			for (var k in state) {
				request[k] = state[k];
			}
		}._w(43);


		// Public
		var init = function (info, callback) {
			if (api === null) api = new API(info);
			api.init(info, callback);
		}._w(44);

		var register = function (data, callback) {
			if (api === null) {
				callback.call(null, "API not init'd", 0);
				return;
			}

			api.register(data, callback);
		}._w(45);

		var request = function (namespace, type, unique_id, info, callback) {
			if (api === null) {
				callback.call(null, "API not init'd", null);
				return;
			}

			var d = api.timeout_delay;
			api.timeout_delay = -1;

			api.send("request", {
				namespace: namespace,
				type: type,
				id: unique_id,
				info: info
			}, null, function (err, data) {
				if (err !== null) {
					data = null;
				}
				else {
					if ((err = data.err) !== null) {
						data = null;
					}
					else if ((data = data.data) === null) {
						err = "Invalid extension data";
					}
				}
				callback.call(null, err, data);
			}._w(47));

			api.timeout_delay = d;
		}._w(46);

		var insert_styles = function (styles) {
			var head = document.head,
				n;
			if (!head) return false;
			n = document.createElement("style");
			n.textContent = styles;
			head.appendChild(n);
			return true;
		}._w(48);

		var parse_json = function (text, def) {
			try {
				return JSON.parse(text);
			}
			catch (e) {
				return def;
			}
		}._w(49);
		var parse_html = function (text, def) {
			try {
				return (new DOMParser()).parseFromString(text, "text/html");
			}
			catch (e) {
				return def;
			}
		}._w(50);

		var get_domain = function (url) {
			var m = /^(?:[\w\-]+):\/*((?:[\w\-]+\.)*)([\w\-]+\.[\w\-]+)/i.exec(url);
			return (m === null) ? [ "", "" ] : [ m[1].toLowerCase(), m[2].toLowerCase() ];
		}._w(51);

		var get_image = function (url, flags, callback) {
			if (api === null || api.init_state !== 2) {
				callback.call(null, "API not init'd", null);
				return;
			}

			// Send
			var d = api.timeout_delay;
			api.timeout_delay = 10000;
			api.send("get_image", { url: url, flags: flags }, null, function (err, data) {
				if (err !== null) {
					data = null;
				}
				else if (!is_object(data)) {
					err = "Invalid data";
				}
				else if (typeof((err = data.err)) !== "string" && typeof((data = data.url)) !== "string") {
					data = null;
					err = "Invalid data";
				}

				callback.call(null, err, data);
			}._w(53));
			api.timeout_delay = d;
		}._w(52);


		// Exports
		return {
			RequestErrorMode: RequestErrorMode,
			ImageFlags: ImageFlags,
			init: init,
			config: config,
			register: register,
			request: request,
			get_image: get_image,
			insert_styles: insert_styles,
			parse_json: parse_json,
			parse_html: parse_html,
			get_domain: get_domain,
			random_string: random_string,
			is_object: is_object,
			ttl_1_hour: ttl_1_hour,
			ttl_1_day: ttl_1_day,
			ttl_1_year: ttl_1_year,
			cache_set: cache_set,
			cache_get: cache_get
		};

	}._w(1))();




	var $$ = function (selector, root) {
		return (root || document).querySelectorAll(selector);
	}._w(54);
	var $ = (function () {

		var d = document;

		var Module = function (selector, root) {
			return (root || d).querySelector(selector);
		}._w(56);

		Module.add = function (parent, child) {
			return parent.appendChild(child);
		}._w(57);
		Module.tnode = function (text) {
			return d.createTextNode(text);
		}._w(58);
		Module.node = function (tag, class_name, text) {
			var elem = d.createElement(tag);
			elem.className = class_name;
			if (text !== undefined) {
				elem.textContent = text;
			}
			return elem;
		}._w(59);
		Module.node_ns = function (namespace, tag, class_name) {
			var elem = d.createElementNS(namespace, tag);
			elem.setAttribute("class", class_name);
			return elem;
		}._w(60);
		Module.node_simple = function (tag) {
			return d.createElement(tag);
		}._w(61);

		return Module;

	}._w(55))();

	var re_html = /[<>&]/g,
		re_html_full = /[<>&'"]/g,
		html_replace_map = {
			"<": "&lt;",
			">": "&gt;",
			"&": "&amp;",
			"'": "&apos;",
			"\"": "&quot"
		};

	var escape_html = function (text, regex) {
		return text.replace(regex, function (m) {
			return html_replace_map[m];
		}._w(63));
	}._w(62);

	var innerhtml_to_safe_text = function (node) {
		var text = "",
			tag_stack = [],
			children, par, next, n, t;

		par = node;
		n = par.firstChild;
		if (n === null) return text;

		done:
		while (true) {
			if (n.nodeType === Node.ELEMENT_NODE) {
				// Format tags
				children = false;
				if (n.tagName === "DIV" || n.tagName === "SPAN") {
					children = true;
				}
				else if (n.tagName === "B" || n.tagName === "I") {
					t = n.tagName.toLowerCase();
					text += "<" + t + ">";
					tag_stack.push(n, "</" + t + ">");
					children = true;
				}
				else if (n.tagName === "BR") {
					text += "<br />";
				}
				else if (n.tagName === "A") {
					text += "<a href=\"" + escape_html(n.getAttribute("href") || "", re_html_full) + "\">";
					tag_stack.push(n, "</a>");
					children = true;
				}
				else if (n.tagName === "INPUT") {
					if (n.getAttribute("type") === "button") {
						text += "<button>" + escape_html(n.getAttribute("value") || "", re_html) + "</button>";
					}
				}
				else if (n.tagName === "IMG") {
					text += "[Image] ";
				}

				// Visit children
				if (children) {
					par = n;
					n = n.firstChild;
				}
				else {
					n = n.nextSibling;
				}
			}
			else {
				// Text node or other
				next = n.nextSibling;
				if (n.nodeType === Node.TEXT_NODE) {
					// Update text
					text += escape_html(n.nodeValue, re_html);
				}
				n = next;
			}

			// Next node
			while (n === null) {
				n = par;
				if (n === node) break done;

				if (tag_stack.length > 0) {
					if (n === tag_stack[tag_stack.length - 2]) {
						text += tag_stack[tag_stack.length - 1];
						tag_stack.splice(tag_stack.length - 2, 2);
					}
				}

				par = n.parentNode;
				n = n.nextSibling;
			}
		}

		return text;
	}._w(64);
	var apply_safe_text_to_node = function (node, safe_text) {
		// Safe version of: node.innerHTML = safe_text;
		// Cannot inject any <script> tags or similar
		var re_start = /&(\w+);|<(\/?)([\w\-]+)/g,
			re_attr = /\s*(\/?)>|\s*([\w\-]+)="([^"]*)"/g,
			re_entity = /&(\w+);/g,
			pos = 0,
			text = "",
			parents = [ node ],
			current = node,
			attrs, close, auto_close, a, m, k, t, n;

		var entity_replace_fn = function (m, entity) {
			var e = apply_safe_text_to_node.entities[entity];
			return (e === undefined) ? m : e;
		}._w(66);

		while (true) {
			re_start.lastIndex = pos;
			m = re_start.exec(safe_text);
			if (m === null) break;

			text += safe_text.substr(pos, m.index - pos);
			pos = re_start.lastIndex;

			if ((k = m[1]) !== undefined) {
				if ((t = apply_safe_text_to_node.entities[k]) === undefined) {
					t = m[0];
				}
			}
			else {
				k = m[3];
				if ((t = apply_safe_text_to_node.tags[k]) === undefined) {
					t = m[0];
				}
				else {
					attrs = {};
					close = (m[2].length > 0);
					auto_close = (t === null);

					while (true) {
						re_attr.lastIndex = pos;
						m = re_attr.exec(safe_text);

						if (m === null) {
							pos = safe_text.length;
							break;
						}

						pos = re_attr.lastIndex;

						if (m[1] !== undefined) {
							auto_close = (m[1].length > 0);
							break;
						}

						attrs[m[2]] = m[3].replace(re_entity, entity_replace_fn);
					}

					if (text.length > 0) {
						current.appendChild(document.createTextNode(text));
						text = "";
					}

					if (close) {
						if (parents.length > 1) {
							parents.pop();
							current = parents[parents.length - 1];
						}
					}
					else {
						n = document.createElement(k);
						if (t !== null) {
							for (k in t) {
								a = attrs[k];
								if (a !== undefined) {
									n.setAttribute(k, a);
								}
							}
						}

						current.appendChild(n);

						if (!auto_close) {
							parents.push(n);
							current = n;
						}
					}

					continue;
				}
			}

			text += t;
		}

		text += safe_text.substr(pos);
		if (text.length > 0) {
			current.appendChild(document.createTextNode(text));
		}
	}._w(65);
	apply_safe_text_to_node.tags = {
		a: { href: true },
		b: {},
		i: {},
		br: null,
		button: {},
	};
	apply_safe_text_to_node.entities = {
		"lt": "<",
		"gt": ">",
		"amp": "&",
		"apos": "'",
		"quot": "\""
	};

	var table_info_fns = {
		submitter: function (node, data) {
			var n = $("a", node),
				m;
			if (n !== null) {
				data.uploader = n.textContent.trim();
				if ((m = /user=(\d+)/.exec(n.getAttribute("href"))) !== null) {
					data.uploader_id = parseInt(m[1], 10);
				}
				if ((n = $("span", n)) !== null) {
					m = n.getAttribute("href") || "";
					if (/color:\s*green/i.test(m)) {
						data.uploader_class = "trusted";
					}
					else if (/color:\s*#4169E1/i.test(m)) {
						data.uploader_class = "admin";
					}
				}
			}
		}._w(67),
		information: function (node, data) {
			data.information = innerhtml_to_safe_text(node);
		}._w(68),
		stardom: function (node, data) {
			var n = node.querySelector("b");
			if (n !== null) {
				data.fans = parseInt(n.textContent.trim(), 10) || 0;
			}
		}._w(69),
		date: function (node, data) {
			var m = /(\d+)-(\d+)-(\d+),\s*(\d+):(\d+)/.exec(node.textContent);
			if (m !== null) {
				data.date_created = new Date(
					parseInt(m[1], 10),
					parseInt(m[2], 10) - 1,
					parseInt(m[3], 10),
					parseInt(m[4], 10),
					parseInt(m[5], 10),
					0,
					0
				).getTime();
			}
		}._w(70),
		seeders: function (node, data) {
			if ($("b", node) !== null) {
				data.seeders = -1;
			}
			else {
				data.seeders = parseInt(node.textContent.trim(), 10) || 0;
			}
		}._w(71),
		leechers: function (node, data) {
			if ($("b", node) !== null) {
				data.leechers = -1;
			}
			else {
				data.leechers = parseInt(node.textContent.trim(), 10) || 0;
			}
		}._w(72),
		downloads: function (node, data) {
			data.downloads = parseInt(node.textContent.trim(), 10) || 0;
		}._w(73),
		"file size": function (node, data) {
			data.file_size = file_size_text_to_number(node.textContent.trim());
		}._w(74)
	};

	var pad = function (n, sep) {
		return (n < 10 ? "0" : "") + n + sep;
	}._w(75);
	var format_date = function (timestamp) {
		var d = new Date(timestamp);
		return d.getUTCFullYear() + "-" +
			pad(d.getUTCMonth() + 1, "-") +
			pad(d.getUTCDate(), " ") +
			pad(d.getUTCHours(), ":") +
			pad(d.getUTCMinutes(), "");
	}._w(76);

	var file_size_scale = {
		k: 1024,
		m: 1024 * 1024,
		g: 1024 * 1024 * 1024,
		t: 1024 * 1024 * 1024 * 1024
	};
	var file_size_labels = [ "B", "KiB", "MiB", "GiB", "TiB" ];
	var file_size_text_to_number = function (text) {
		var m = /(\d+(?:\.\d+)?)\s*(?:B|([KMGT])i?B)?/i.exec(text),
			v = 0;

		if (m !== null) {
			v = parseFloat(m[1]);
			if ((m = m[2]) !== undefined) {
				m = m.toLowerCase();
				v *= file_size_scale[m];
			}
			v = Math.round(v);
		}

		return v;
	}._w(77);
	var file_size_number_to_text = function (size) {
		var scale = 1024,
			i, ii;

		for (i = 0, ii = file_size_labels.length - 1; i < ii && size >= 1024; ++i) {
			size /= 1024;
		}

		return size.toFixed(3).replace(/\.?0+$/, "") + " " + file_size_labels[i];
	}._w(78);

	var category_to_button_style_map = {
		"english-translated anime": "cosplay",
		"raw anime": "misc",
		"non-english-translated anime": "western",
		"anime music video": "cosplay",
		"lossless audio": "artistcg",
		"lossy audio": "doujinshi",
		"raw literature": "gamecg",
		"non-english-translated literature": "manga",
		"english-translated literature": "western",
		"english-translated Live Action": "",
		"raw live action": "misc",
		"non-english-translated live action": "non-h",
		"live action promotional video": "artistcg",
		"applications": "imageset",
		"games": "imageset",
		"photos": "asianporn",
		"graphics": "asianporn"
	};
	var category_to_button_style = function (data) {
		if (data.sukebei) return "doujinshi";
		var subcat = category_to_button_style_map[data.subcategory.toLowerCase()];
		return (subcat === undefined ? "misc" : subcat);
	}._w(79);

	var nyaa_get_data = function (info, callback) {
		var data = xlinks_api.cache_get(info.id);
		callback(null, data);
	}._w(80);
	var nyaa_set_data = function (data, info, callback) {
		xlinks_api.cache_set(info.id, data, xlinks_api.ttl_1_day);
		callback(null);
	}._w(81);
	var nyaa_setup_xhr = function (callback) {
		var info = this.infos[0];
		callback(null, {
			method: "GET",
			url: "http://" + (info.sukebei ? "sukebei" : "www") + ".nyaa.se/?page=view&tid=" + info.gid + "&showfiles=1"
		});
	}._w(82);
	var nyaa_parse_response = function (xhr, callback) {
		var html = xlinks_api.parse_html(xhr.responseText),
			info = this.infos[0],
			data, fn, n1, n2, ns, i, ii, m, t;

		if (html === null) {
			callback("Invalid response");
			return;
		}

		data = {
			type: "nyaa",
			subtype: "torrent",
			gid: info.gid,
			sukebei: info.sukebei,
			title: "",
			tags: [],
			description: "",
			information: "",
			files: [],
			state: "normal",
			comments_key: null,
			category: "",
			category_id: "",
			subcategory: "",
			subcategory_id: "",
			uploader: "",
			uploader_id: 0,
			uploader_class: "normal",
			date_created: 0,
			seeders: 0,
			leechers: 0,
			downloads: 0,
			file_size: 0,
			fans: 0
		};

		if ((n1 = $(".viewtorrentname", html)) !== null) {
			data.title = n1.textContent.trim();
		}
		else {
			callback(null, [ { error: "Invalid torrent" } ]);
			return;
		}

		if ((n1 = $(".content", html)) !== null) {
			if (
				n1.classList.contains((t = "aplus")) ||
				n1.classList.contains((t = "trusted")) ||
				n1.classList.contains((t = "remake")) ||
				n1.classList.contains((t = "hidden"))
			) {
				data.state = t;
			}
		}
		if ((n1 = $(".viewdescription", html)) !== null) {
			data.description = innerhtml_to_safe_text(n1);
		}
		if (
			(n1 = $(".viewfiletable", html)) !== null &&
			(ns = $$(".fileentry", n1)).length > 0
		) {
			for (i = 0, ii = ns.length; i < ii; ++i) {
				if (
					(n1 = $(".fileentryname", ns[i])) !== null &&
					(n2 = $(".fileentrysize", ns[i])) !== null
				) {
					data.files.push([
						n1.textContent.trim(),
						file_size_text_to_number(n2.textContent.trim())
					]);
				}
			}
		}

		if ((ns = $$(".viewshowhide", html)).length >= 2) {
			m = /showcomments=(\w+)/.exec(ns[1].getAttribute("href") || "");
			if (m !== null) {
				data.comments_key = m[1];
			}
		}

		if ((n1 = $(".viewcategory>a:nth-of-type(1)", html)) !== null) {
			data.category = n1.textContent.trim();
			if ((m = /cats=([\w_]+)/.exec(n1.getAttribute("href") || "")) !== null) {
				data.category_id = m[1];
			}
		}

		if ((n1 = $(".viewcategory>a:nth-of-type(2)", html)) !== null) {
			data.subcategory = n1.textContent.trim();
			if ((m = /cats=([\w_]+)/.exec(n1.getAttribute("href") || "")) !== null) {
				data.subcategory_id = m[1];
			}
		}

		ns = $$("td.tname", html);
		for (i = 0, ii = ns.length; i < ii; ++i) {
			n1 = ns[i];
			if ((n2 = n1.nextSibling) !== null && n2.tagName === "TD") {
				t = n1.textContent.trim().toLowerCase();
				if (t[t.length - 1] === ":") t = t.substr(0, t.length - 1);
				if ((fn = table_info_fns[t]) !== undefined) {
					fn(n2, data);
				}
			}
		}

		callback(null, [ data ]);
	}._w(83);

	var url_get_info = function (url, callback) {
		var m = /^(?:https?:\/*)?((www\.|sukebei\.)?nyaa\.se)(?:\/[^\?\#]*)?(\?[^\#]*)?(?:\#[^\w\W]*)?/i.exec(url),
			s, m2;
		if (m !== null && m[3] !== undefined && (m2 = /[\?\&]tid=(\d+)/.exec(m[3])) !== null) {
			s = (m[2] === "sukebei.");
			callback(null, {
				id: "nyaa_" + (s ? "sukebei_" : "") + m2[1],
				site: "nyaa",
				sukebei: s,
				gid: parseInt(m2[1], 10),
				domain: m[1],
				tag: "Nyaa"
			});
		}
		else {
			callback(null, null);
		}
	}._w(84);
	var url_info_to_data = function (url_info, callback) {
		xlinks_api.request("nyaa", "torrent", url_info.id, url_info, callback);
	}._w(85);
	var create_actions = function (data, info, callback) {
		var urls = [],
			url_base = "http://" + (info.sukebei ? "sukebei" : "www") + ".nyaa.se/";

		urls.push([ "View on:", url_base + "?page=view&tid=" + info.gid + "&showfiles=1" + (data.comments_key ? "&showcomments=" + data.comments_key : ""), "Nyaa.se" ]);
		urls.push(null);
		urls.push([ "Download as:", url_base + "?page=download&tid=" + info.gid, "Torrent" ]);
		urls.push([ null, url_base + "?page=download&tid=" + info.gid + "&magnet=1", "Magnet" ]);
		urls.push([ null, url_base + "?page=download&tid=" + info.gid + "&txt=1", "Txt File" ]);

		callback(null, urls);
	}._w(86);
	var create_details = function (data, info, callback) {
		var container = $.node("div", "xl-details-limited-size"),
			n1, n2;

		// Sidebar
		$.add(container, n1 = $.node("div", "xl-details-side-panel"));

		$.add(n1, n2 = $.node("div", "xl-theme xl-button xl-button-eh xl-button-" + category_to_button_style(data)));
		$.add(n2, $.node("div", "xl-noise", data.category));

		$.add(n1, n2 = $.node("div", "xl-details-side-box xl-details-side-box-rating xl-theme"));
		$.add(n2, $.node("div", "xl-details-file-count", data.files.length + " file" + (data.files.length === 1 ? "" : "s")));
		if (data.file_size >= 0) {
			$.add(n2, $.node("div", "xl-details-file-size", "(" + file_size_number_to_text(data.file_size) + ")"));
		}

		$.add(n1, n2 = $.node("div", "xl-details-side-box xl-details-side-box-rating xl-theme"));
		$.add(n2, $.node("div", "xl-details-seeders", "Seeders: " + data.seeders));
		$.add(n2, $.node("div", "xl-details-leechers", "Leechers: " + data.leechers));
		$.add(n2, $.node("div", "xl-details-downloads", "Dls: " + data.downloads));

		// Title
		$.add(container, n1 = $.node("div", "xl-details-title-container xl-theme"));
		$.add(n1, n2 = $.node("a", "xl-details-title xl-theme xl-highlight", data.title));
		n2.href = "#";
		n2.setAttribute("data-xl-highlight", "title");

		// Upload info
		$.add(container, n1 = $.node("div", "xl-details-upload-info xl-theme"));
		$.add(n1, $.tnode("Uploaded by"));
		$.add(n1, n2 = $.node("strong", "xl-details-uploader xl-theme xl-highlight", data.uploader));
		n2.setAttribute("data-xl-highlight", "uploader");
		$.add(n1, $.tnode("on"));
		$.add(n1, $.node("strong", "xl-details-upload-date", format_date(data.date_created)));

		// Content
		$.add(container, n1 = $.node("div", "xl-details-description"));
		apply_safe_text_to_node(n1, data.description);

		// Done
		callback(null, container);
	}._w(87);

	xlinks_api.init({
		namespace: "nyaa_torrents",
		name: "Nyaa Torrents",
		author: "dnsev-h",
		description: "Linkify and format nyaa.se links",
		version: [1,0,0,2,-0xDB],
		registrations: 1
	}, function (err) {
		if (err === null) {
			xlinks_api.register({
				settings: {
					sites: [ // namespace
						// name, default, title, description, descriptor?
						[ "nyaa", true, "nyaa.se", "Enable link processing for nyaa.se" ],
						// descriptor: { type: string, options: <array of [string:value, string:label, string:description]> }
						// for pre-existing vars: [ "name" ]
					]
				},
				request_apis: [{
					group: "nyaa",
					namespace: "nyaa",
					type: "torrent",
					count: 1,
					concurrent: 1,
					delay_okay: 500,
					delay_error: 5000,
					functions: {
						get_data: nyaa_get_data,
						set_data: nyaa_set_data,
						setup_xhr: nyaa_setup_xhr,
						parse_response: nyaa_parse_response
					},
				}],
				linkifiers: [{
					regex: /(https?:\/*)?(?:www\.|sukebei\.)?nyaa\.se(?:\/[^<>\s\'\"]*)?/i,
					prefix_group: 1,
					prefix: "http://",
				}],
				commands: [{
					url_info: url_get_info,
					to_data: url_info_to_data,
					actions: create_actions,
					details: create_details
				}]
			});
		}
	}._w(88));

})();

