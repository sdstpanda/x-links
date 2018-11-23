// ==UserScript==
// @name        X-links Extension - FAKKU (debug)
// @namespace   dnsev-h
// @author      dnsev-h
// @version     1.0.0.2.-0xDB
// @description Linkify and format FAKKU links
// @include     http://boards.4chan.org/*
// @include     https://boards.4chan.org/*
// @include     http://boards.4channel.org/*
// @include     https://boards.4channel.org/*
// @include     http://8ch.net/*
// @include     https://8ch.net/*
// @include     https://archived.moe/*
// @include     https://boards.fireden.net/*
// @include     http://desuarchive.org/*
// @include     https://desuarchive.org/*
// @include     http://fgts.jp/*
// @include     https://fgts.jp/*
// @include     http://boards.38chan.net/*
// @include     http://forums.e-hentai.org/*
// @include     https://forums.e-hentai.org/*
// @include     https://meguca.org/*
// @homepage    https://dnsev-h.github.io/x-links/
// @supportURL  https://github.com/dnsev-h/x-links/issues
// @icon        data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAA4klEQVR4Ae2ZoQ7CMBRF+VIMBjGDwSAwmImZGcQUYoYPq32fAPK8LCSleZCmzb3JcUtzD+ndBDslHuVVQr0zJdCAQHoaQEggTQYj9C8ggRVCAqPBDfoUkMBq8HAs4J8vLZ2uEH/VSqC6QEZmMbg7ZgiWzu2wJQEJZGRmgwn+cNf9jxXcRn0BCZA/33VKb848OfbQioAEikqni+MMpRugdGADFQQkEL7rlN7c3QG+2EZgrPUEJPD7V+RgcHQcoGAXDQlIoLx0/kxKhwbahoAEPn5ZYwKU7ldAAvqLSQLNRlEU5Q1O5fOjZV4u4AAAAABJRU5ErkJggg==
// @icon64      data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAOVBMVEUBAAAAAADmce/ml+/mje/mku/mhO/mY+/mbO/mdu/me+/mie/mXu/mm+/mpe/mf+/mqu/maO/moe9+hYmYAAAAAXRSTlMAQObYZgAAAJRJREFUeF7t1zkOAzEMBEFRe9+2//9YtzOCIOR8oEoX7GCgZEtXigWtb8qBF36ywIgD8gHcyAIHZqgHbnxwwRCPH1igEvCRCwMmZMd+cKVAjEwY0RpvgDkKAe/feANmVJxQC8TjHRssqDBHI5CPt6FihR8zjicQaD6eFW8sMEcxEI99fEG2vFrgwY4scEI/0P8X0HVf06IrwbJZHiwAAAAASUVORK5CYII=
// @grant       none
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

		var get_regex_flags = function (regex) {
			var s = "";
			if (regex.global) s += "g";
			if (regex.ignoreCase) s += "i";
			if (regex.multiline) s += "m";
			return s;
		}._w(9);

		var create_temp_storage = function () {
			var data = {};

			var fn = {
				length: 0,
				key: function (index) {
					return Object.keys(data)[index];
				}._w(11),
				getItem: function (key) {
					if (Object.prototype.hasOwnProperty.call(data, key)) {
						return data[key];
					}
					return null;
				}._w(12),
				setItem: function (key, value) {
					if (!Object.prototype.hasOwnProperty.call(data, key)) {
						++fn.length;
					}
					data[key] = value;
				}._w(13),
				removeItem: function (key) {
					if (Object.prototype.hasOwnProperty.call(data, key)) {
						delete data[key];
						--fn.length;
					}
				}._w(14),
				clear: function () {
					data = {};
					fn.length = 0;
				}._w(15)
			};

			return fn;
		}._w(10);

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
		}._w(16);

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
		}._w(17);

		var config = {};


		var CommunicationChannel = function (name, key, is_extension, channel, callback) {
			var self = this;

			this.port = null;
			this.port_other = null;
			this.post = null;
			this.on_message = null;
			this.origin = null;
			this.name_key = null;
			this.is_extension = is_extension;
			this.name = name;
			this.key = key;
			this.callback = callback;

			if (channel === null) {
				this.name_key = name;
				if (key !== null) {
					this.name_key += "_";
					this.name_key += key;
				}
				this.origin = window.location.protocol + "//" + window.location.host;
				this.post = this.post_window;
				this.on_message = function (event) {
					self.on_window_message(event);
				}._w(19);
				window.addEventListener("message", this.on_message, false);
			}
			else {
				this.port = channel.port1;
				this.port_other = channel.port2;
				this.post = this.post_channel;
				this.on_message = function (event) {
					self.on_port_message(event);
				}._w(20);
				this.port.addEventListener("message", this.on_message, false);
				this.port.start();
			}
		}._w(18);

		CommunicationChannel.prototype.post_window = function (message, transfer) {
			var msg = {
				ext: this.is_extension,
				key: this.name_key,
				data: message
			};

			try {
				window.postMessage(msg, this.origin, transfer);
			}
			catch (e) {
				// Tampermonkey bug
				try {
					unsafeWindow.postMessage(msg, this.origin, transfer);
				}
				catch (e2) {}
			}
		}._w(21);
		CommunicationChannel.prototype.post_channel = function (message, transfer) {
			this.port.postMessage(message, transfer);
		}._w(22);
		CommunicationChannel.prototype.post_null = function () {
		}._w(23);
		CommunicationChannel.prototype.on_window_message = function (event) {
			var data = event.data;
			if (
				event.origin === this.origin &&
				is_object(data) &&
				data.ext === (!this.is_extension) && // jshint ignore:line
				data.key === this.name_key &&
				is_object((data = data.data))
			) {
				this.callback(event, data, this);
			}
		}._w(24);
		CommunicationChannel.prototype.on_port_message = function (event) {
			var data = event.data;
			if (is_object(data)) {
				this.callback(event, data, this);
			}
		}._w(25);
		CommunicationChannel.prototype.close = function () {
			if (this.on_message !== null) {
				if (this.port === null) {
					window.removeEventListener("message", this.on_message, false);
				}
				else {
					this.port.removeEventListener("message", this.on_message, false);
					this.port.close();
					this.port = null;
				}
				this.on_message = null;
				this.post = this.post_null;
			}
		}._w(26);


		var api = null;
		var API = function () {
			this.event = null;
			this.reply_callbacks = {};

			this.init_state = 0;

			this.handlers = API.handlers_init;
			this.functions = {};
			this.url_info_functions = {};
			this.url_info_to_data_functions = {};
			this.details_functions = {};
			this.actions_functions = {};

			var self = this;
			this.channel = new CommunicationChannel(
				"xlinks_broadcast",
				null,
				true,
				null,
				function (event, data, channel) {
					self.on_message(event, data, channel, {});
				}._w(28)
			);
		}._w(27);
		API.prototype.on_message = function (event, data, channel, handlers) {
			var action = data.xlinks_action,
				action_is_null = (action === null),
				action_data, reply, fn, err;

			if (
				(action_is_null || typeof(action) === "string") &&
				is_object((action_data = data.data))
			) {
				reply = data.reply;
				if (typeof(reply) === "string") {
					if (Object.prototype.hasOwnProperty.call(this.reply_callbacks, reply)) {
						fn = this.reply_callbacks[reply];
						delete this.reply_callbacks[reply];
						this.event = event;
						fn.call(this, null, action_data);
						this.event = null;
					}
					else {
						err = "Cannot reply to extension";
					}
				}
				else if (action_is_null) {
					err = "Missing extension action";
				}
				else if (Object.prototype.hasOwnProperty.call(handlers, action)) {
					handlers[action].call(this, action_data, channel, data.id);
				}
				else {
					err = "Invalid extension call";
				}

				if (err !== undefined && typeof((reply = data.id)) === "string") {
					this.send(
						channel,
						null,
						reply,
						{ err: "Invalid extension call" }
					);
				}
			}
		}._w(29);
		API.prototype.send = function (channel, action, reply_to, data, timeout_delay, on_reply) {
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
				}._w(31);

				this.reply_callbacks[id] = cb;
				cb = null;

				if (timeout_delay >= 0) {
					timeout = setTimeout(function () {
						timeout = null;
						delete self.reply_callbacks[id];
						on_reply.call(self, "Response timeout");
					}._w(32), timeout_delay);
				}
			}

			channel.post({
				xlinks_action: action,
				data: data,
				id: id,
				reply: reply_to
			});
		}._w(30);
		API.prototype.reply_error = function (channel, reply_to, err) {
			channel.post({
				xlinks_action: null,
				data: { err: err },
				id: null,
				reply: reply_to
			});
		}._w(33);
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
		}._w(34);
		API.prototype.init = function (info, callback) {
			if (this.init_state !== 0) {
				if (typeof(callback) === "function") callback.call(null, this.init_state === 1 ? "Init active" : "Already started");
				return;
			}

			this.init_state = 1;

			var self = this,
				de = document.documentElement,
				count = info.registrations,
				namespace = info.namespace || "",
				send_info = {
					namespace: namespace
				},
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

			send_info.registrations = count;

			send_info.main = (typeof(info.main) === "function") ? info.main.toString() : null;

			if (de) {
				a = de.getAttribute("data-xlinks-extensions-waiting");
				a = (a ? (parseInt(a, 10) || 0) : 0) + count;
				de.setAttribute("data-xlinks-extensions-waiting", a);
				de = null;
			}

			ready(function () {
				self.send(
					self.channel,
					"init",
					null,
					send_info,
					10000,
					function (err, data) {
						err = self.on_init(err, data, namespace);
						if (err === "Internal") {
							self.channel.close();
							this.init_state = 3;
						}
						if (typeof(callback) === "function") callback.call(null, err);
					}._w(37)
				);
			}._w(36));
		}._w(35);
		API.prototype.on_init = function (err, data, namespace) {
			var self = this,
				api_key, ch, v;

			if (err === null) {
				if (!is_object(data)) {
					err = "Could not generate extension key";
				}
				else if (typeof((err = data.err)) !== "string") {
					if (typeof((api_key = data.key)) !== "string") {
						err = "Could not generate extension key";
					}
					else {
						// Valid
						err = null;

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

						// New channel
						ch = (this.event.ports && this.event.ports.length === 1) ? {
							port1: this.event.ports[0],
							port2: null
						} : null;

						this.channel.close();
						this.channel = new CommunicationChannel(
							namespace,
							api_key,
							true,
							ch,
							function (event, data, channel) {
								self.on_message(event, data, channel, API.handlers);
							}._w(39)
						);
					}
				}
			}

			this.init_state = (err === null) ? 2 : 0;
			return err;
		}._w(38);
		API.prototype.register = function (data, callback) {
			if (this.init_state !== 2) {
				if (typeof(callback) === "function") callback.call(null, "API not init'd", 0);
				return;
			}

			// Data
			var send_data = {
				settings: {},
				request_apis: [],
				linkifiers: [],
				commands: [],
				create_url: null
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
						a_data.regex = [ v.source, get_regex_flags(v) ];
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

			// URL create functions
			o = data.create_url;
			if (is_object(o)) {
				send_data.create_url = o;
			}

			// Send
			this.send(
				this.channel,
				"register",
				null,
				send_data,
				10000,
				function (err, data) {
					var o;
					if (err !== null || (err = data.err) !== null) {
						if (typeof(callback) === "function") callback.call(null, err, 0);
					}
					else if (!is_object((o = data.response))) {
						if (typeof(callback) === "function") callback.call(null, "Invalid extension response", 0);
					}
					else {
						var okay = this.register_complete(o, request_apis_response, command_fns, send_data.settings);
						if (typeof(callback) === "function") callback.call(null, null, okay);
					}
				}._w(41)
			);
		}._w(40);
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
		}._w(42);

		API.handlers_init = {};
		API.handlers = {
			request_end: function (data) {
				var id = data.id;
				if (typeof(id) === "string") {
					// Remove request
					delete requests_active[id];
				}
			}._w(43),
			api_function: function (data, channel, reply) {
				var self = this,
					req = null,
					state, id, args, fn, ret;

				if (
					typeof((id = data.id)) !== "string" ||
					!Array.isArray((args = data.args))
				) {
					// Error
					this.reply_error(channel, reply, "Invalid extension data");
					return;
				}

				// Exists
				if (!Array.prototype.hasOwnProperty.call(this.functions, id)) {
					// Error
					this.reply_error(channel, reply, "Invalid extension function");
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
					var i = 0,
						ii = arguments.length,
						arguments_copy = new Array(ii);

					for (; i < ii; ++i) arguments_copy[i] = arguments[i];

					self.send(
						channel,
						null,
						reply,
						{
							err: null,
							args: arguments_copy
						}
					);
				}._w(45));

				// Call
				ret = fn.apply(req, args);
			}._w(44),
			url_info: function (data, channel, reply) {
				var self = this,
					id, url, fn;

				if (
					typeof((id = data.id)) !== "string" ||
					typeof((url = data.url)) !== "string"
				) {
					// Error
					this.reply_error(channel, reply, "Invalid extension data");
					return;
				}

				// Exists
				if (!Array.prototype.hasOwnProperty.call(this.url_info_functions, id)) {
					// Error
					this.reply_error(channel, reply, "Invalid extension function");
					return;
				}
				fn = this.url_info_functions[id];

				// Call
				fn(url, function (err, data) {
					self.send(
						channel,
						null,
						reply,
						{
							err: err,
							data: data
						}
					);
				}._w(47));
			}._w(46),
			url_info_to_data: function (data, channel, reply) {
				var self = this,
					id, url_info;

				if (
					typeof((id = data.id)) !== "string" ||
					!is_object((url_info = data.url))
				) {
					// Error
					this.reply_error(channel, reply, "Invalid extension data");
					return;
				}

				// Exists
				if (!Array.prototype.hasOwnProperty.call(this.url_info_to_data_functions, id)) {
					// Error
					this.reply_error(channel, reply, "Invalid extension function");
					return;
				}

				// Call
				this.url_info_to_data_functions[id](url_info, function (err, data) {
					self.send(
						channel,
						null,
						reply,
						{
							err: err,
							data: data
						}
					);
				}._w(49));
			}._w(48),
			create_actions: function (data, channel, reply) {
				var self = this,
					id, fn_data, fn_info;

				if (
					typeof((id = data.id)) !== "string" ||
					!is_object((fn_data = data.data)) ||
					!is_object((fn_info = data.info))
				) {
					// Error
					this.reply_error(channel, reply, "Invalid extension data");
					return;
				}

				// Exists
				if (!Array.prototype.hasOwnProperty.call(this.actions_functions, id)) {
					// Error
					this.reply_error(channel, reply, "Invalid extension function");
					return;
				}

				// Call
				this.actions_functions[id](fn_data, fn_info, function (err, data) {
					self.send(
						channel,
						null,
						reply,
						{
							err: err,
							data: data
						}
					);
				}._w(51));
			}._w(50),
			create_details: function (data, channel, reply) {
				var self = this,
					id, fn_data, fn_info;

				if (
					typeof((id = data.id)) !== "string" ||
					!is_object((fn_data = data.data)) ||
					!is_object((fn_info = data.info))
				) {
					// Error
					this.reply_error(channel, reply, "Invalid extension data");
					return;
				}

				// Exists
				if (!Array.prototype.hasOwnProperty.call(this.details_functions, id)) {
					// Error
					this.reply_error(channel, reply, "Invalid extension function");
					return;
				}

				// Call
				this.details_functions[id](fn_data, fn_info, function (err, data) {
					self.send(
						channel,
						null,
						reply,
						{
							err: err,
							data: set_shared_node(data)
						}
					);
				}._w(53));
			}._w(52),
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
		}._w(54);

		var load_request_state = function (request, state) {
			for (var k in state) {
				request[k] = state[k];
			}
		}._w(55);


		// Public
		var init = function (info, callback) {
			if (api === null) api = new API();
			api.init(info, callback);
		}._w(56);

		var register = function (data, callback) {
			if (api === null) {
				callback.call(null, "API not init'd", 0);
				return;
			}

			api.register(data, callback);
		}._w(57);

		var request = function (namespace, type, unique_id, info, callback) {
			if (api === null || api.init_state !== 2) {
				callback.call(null, "API not init'd", null);
				return;
			}

			api.send(
				api.channel,
				"request",
				null,
				{
					namespace: namespace,
					type: type,
					id: unique_id,
					info: info
				},
				-1,
				function (err, data) {
					if (err !== null || (err = data.err) !== null) {
						data = null;
					}
					else if ((data = data.data) === null) {
						err = "Invalid extension data";
					}
					callback.call(null, err, data);
				}._w(59)
			);
		}._w(58);

		var insert_styles = function (styles) {
			var head = document.head,
				n;
			if (head) {
				n = document.createElement("style");
				n.textContent = styles;
				head.appendChild(n);
			}
		}._w(60);

		var parse_json = function (text, def) {
			try {
				return JSON.parse(text);
			}
			catch (e) {}
			return def;
		}._w(61);
		var parse_html = function (text, def) {
			try {
				return new DOMParser().parseFromString(text, "text/html");
			}
			catch (e) {}
			return def;
		}._w(62);
		var parse_xml = function (text, def) {
			try {
				return new DOMParser().parseFromString(text, "text/xml");
			}
			catch (e) {}
			return def;
		}._w(63);

		var get_domain = function (url) {
			var m = /^(?:[\w\-]+):\/*((?:[\w\-]+\.)*)([\w\-]+\.[\w\-]+)/i.exec(url);
			return (m === null) ? [ "", "" ] : [ m[1].toLowerCase(), m[2].toLowerCase() ];
		}._w(64);

		var get_image = function (url, flags, callback) {
			if (api === null || api.init_state !== 2) {
				callback.call(null, "API not init'd", null);
				return;
			}

			// Send
			api.send(
				api.channel,
				"get_image",
				null,
				{ url: url, flags: flags },
				10000,
				function (err, data) {
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
				}._w(66)
			);
		}._w(65);


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
			parse_xml: parse_xml,
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

	var main = function main_fn(xlinks_api) {

	var $$ = function (selector, root) {
		return (root || document).querySelectorAll(selector);
	}._w(68);
	var $ = function (selector, root) {
		return (root || document).querySelector(selector);
	}._w(69);
	$.html_parse_safe = function (text, def) {
		try {
			return new DOMParser().parseFromString(text, "text/html");
		}
		catch (e) {}
		return def;
	}._w(70);

	var domains = {
		fakku: "fakku.net",
		www_fakku: "www.fakku.net",
		fakku_thumbs: "t.fakku.net",
		panda_chaika: "\x70\x61\x6e\x64\x61\x2e\x63\x68\x61\x69\x6b\x61\x2e\x6d\x6f\x65"
	};

	var create_url_to_gallery = function (data) {
		return "https://" + domains.www_fakku + "/" + data.name_class + "/" + data.name;
	}._w(71);
	var create_url_to_chaika_search = function (data) {
		return "https://" + domains.panda_chaika + "/search/?title=" + data.title;
	}._w(72);


	// Date
	var date_months = {
		jan: 0,
		feb: 1,
		mar: 2,
		apr: 3,
		may: 4,
		jun: 5,
		jul: 6,
		aug: 7,
		sep: 8,
		oct: 9,
		nov: 10,
		dec: 11,
		january: 0,
		february: 1,
		march: 2,
		april: 3,
		// may: 4,
		june: 5,
		july: 6,
		august: 7,
		september: 8,
		october: 9,
		november: 10,
		december: 11
	};

	var create_empty_gallery_info = function (type) {
		return {
			type: type,
			subtype: "gallery",
			gid: 0,
			token: null,
			title: "",
			title_jpn: null,
			uploader: "",
			category: "misc",
			thumbnail: null,

			flags: 0,
			date_created: 0,
			file_count: 0,
			total_size: -1,
			favorites: -1,
			favorite_category: null,
			rating: -1,
			torrent_count: -1,

			full: false,
			visible: null,
			removed: null,
			archiver_key: null,

			tags: null,
			tags_ns: null
		};
	}._w(73);

	var fakku_parse_info = function (html, info) {
		var mag = false,
			tags_full, tags, tags_list, data, content, map, n, n1, n2, ns, i, ii, m, v;

		content = $(".content>.row", html);

		if (content === null) {
			content = $(".attribute-header", html);
			if (
				content === null ||
				(n = $(".attribute-title", content)) === null
			) {
				return { error: "Could not find info" };
			}
			mag = true;
		}

		// Create data
		data = create_empty_gallery_info("fakku");
		// data.flags |= ImageFlags.ThumbnailNoLeech; // no cross origin thumbnails
		data.uploader = "FAKKU";
		data.full = true;
		data.tags = tags = [];
		data.tags_ns = tags_full = {};
		data.category = "manga";
		data.name = info.name;
		data.name_class = info.name_class;
		// data.date_created

		// Mag info
		if (mag) {
			data.file_count = -1;

			// Title
			data.title = n.textContent.trim();

			//  Thumbnail
			if ((n = $("img", content)) !== null) {
				data.thumbnail = n.getAttribute("src");
			}

			// Artists
			ns = $$("b", content);
			for (i = 0, ii = ns.length; i < ii; ++i) {
				n = ns[i];
				if (/^\s*artists:/.test(n.textContent)) {
					n = n.nextSibling;
					if (n.nodeType === Node.TEXT_NODE) {
						m = n.nodeValue.trim().split(",");
						tags_list = [];
						for (i = 0, ii = m.length; i < ii; ++i) {
							v = m[i].trim();
							if (v.length > 0) {
								tags.push(v);
								tags_list.push(v);
							}
						}
						if (tags_list.length > 0) {
							tags_full.artist = tags_list;
						}
					}
					break;
				}
			}

			// Remaining content
			content = $("#content>.row", html);
		}

		// Other info
		if (content !== null) {
			// Title
			if (!mag && (n = $(".content-name>h1", content)) !== null) {
				data.title = n.textContent.trim();
			}

			// Image
			if (data.thumbnail === null && (n = $("img.cover", content)) !== null) {
				data.thumbnail = "https:" + n.getAttribute("src");
			}

			// Stats
			map = {};
			ns = $$(mag ? ".content-meta .row" : ".content-right .row", content);
			for (i = 0, ii = ns.length; i < ii; ++i) {
				n = ns[i];
				if (
					(n1 = $(".left", n)) !== null &&
					(n2 = $(".right", n)) !== null
				) {
					map[n1.textContent.trim().toLowerCase()] = n2;
				}
			}
			if (tags_full.artist !== undefined && (n = map.artist) !== undefined) {
				v = n.textContent.trim();
				tags.push(v);
				tags_full.artist = [ v ];
			}
			if ((n = map.publisher) !== undefined) {
				data.uploader = n.textContent.trim();
			}
			if ((n = map.language) !== undefined) {
				v = n.textContent.trim().toLowerCase();
				tags.push(v);
				tags_full.language = [ v ];
			}
			if ((n = map.pages) !== undefined && (m = /\d+/.exec(n.textContent)) !== null) {
				data.file_count = parseInt(m[0], 10);
			}
			if ((n = map.favorites) !== undefined && (m = /\d+/.exec(n.textContent)) !== null) {
				data.favorites = parseInt(m[0], 10);
			}
			if ((n = map.tags) !== undefined) {
				ns = $$("a:not(.more-tags)", n);
				tags_list = [];
				for (i = 0, ii = ns.length; i < ii; ++i) {
					v = ns[i].textContent.trim();
					tags.push(v);
					tags_list.push(v);
				}
				if (tags_list.length > 0) {
					tags_full.tags = tags_list;
				}
			}
		}

		// Date approximation
		if ((n = $(".comment-time", html)) !== null) {
			m = /(\w+)\s+(\d+)\s*,\s*(\d+)\s*,\s*(\d+):(\d+)\s*(am|pm)/i.exec(n.textContent);
			if (
				m !== null &&
				(v = date_months[m[1].toLowerCase()]) !== null
			) {
				data.date_created = new Date(
					parseInt(m[3], 10),
					v,
					parseInt(m[2], 10),
					parseInt(m[4], 10) - 1 + (m[6].toLowerCase() === "pm" ? 12 : 0),
					parseInt(m[5], 10),
					0,
					0
				).getTime();
			}
		}
		else if (content !== null && (n = $(".content-time", content)) !== null) {
			m = /(\d+)\s+(day|week|month|year)s\s+ago/i.exec(n.textContent);
			v = new Date();
			var year = v.getFullYear(),
				month = v.getMonth(),
				day = v.getDate();
			if (m !== null) {
				i = parseInt(m[1], 10);
				var s = m[2].toLowerCase();
				if (s === "month") {
					month -= i;
				}
				else if (s === "week") {
					day -= i * 7;
				}
				else if (s === "day") {
					day -= i;
				}
				else if (s === "year") {
					year -= i;
				}
			}
			data.date_created = new Date(year, month, day, 0, 0, 0, 0).getTime();
		}

		// Done
		return data;
	}._w(74);


	var get_fakku_gallery_page_thumb = function (name, page, callback) {
		var s = "" + page;
		while (s.length < 3) s = "0" + s;
		callback(null, [{
			url: "https://" + domains.fakku_thumbs + "/images/manga/p/" + name + "/thumbs/" + s + ".thumb.jpg",
			left: 0,
			top: 0,
			width: -1,
			height: -1,
			flags: xlinks_api.ImageFlags.None
		}]);
	}._w(75);


	var fakku_get_data = function (info, callback) {
		var data = xlinks_api.cache_get(info.id);
		callback(null, data);
	}._w(76);
	var fakku_set_data = function (data, info, callback) {
		xlinks_api.cache_set(info.id, data, xlinks_api.ttl_1_day);
		callback(null);
	}._w(77);
	var fakku_setup_xhr = function (callback) {
		var i = this.infos[0];
		callback(null, {
			method: "GET",
			url: "https://" + domains.www_fakku + "/" + i.name_class + "/" + i.name
		});
	}._w(78);
	var fakku_parse_response = function (xhr, callback) {
		var html = $.html_parse_safe(xhr.responseText, null);
		if (html === null) {
			callback("Invalid response");
		}
		else {
			callback(null, [ fakku_parse_info(html, this.infos[0], xhr.finalUrl) ]);
		}
	}._w(79);

	var url_get_info = function (url, callback) {
		var m = /\/(hentai|manga|magazines)\/([^\/#?]*)(?:\/read\/page\/([0-9]+))?/.exec(url),
			data;

		if (m !== null) {
			data = {
				id: "fakku_" + m[1].toLowerCase() + "_" + m[2],
				site: "fakku",
				type: "gallery",
				name: m[2],
				name_class: m[1].toLowerCase(),
				domain: domains.fakku,
				tag: "FAKKU"
			};
			if (m[3] !== undefined) {
				data.page = parseInt(m[3], 10);
			}
			if (xlinks_api.config.general.iconify) {
				data.icon = "fakku";
			}
			callback(null, data);
		}
		else {
			callback(null, null);
		}
	}._w(80);
	var url_info_to_data = function (url_info, callback) {
		xlinks_api.request("fakku", "gallery", url_info.id, url_info, callback);
	}._w(81);
	var create_actions = function (data, info, callback) {
		callback(null, [
			[ "View on:", create_url_to_gallery(data), "fakku.net" ],
			[ "Search on:", create_url_to_chaika_search(data), "Chaika" ]
		]);
	}._w(82);

	xlinks_api.init({
		namespace: "fakku",
		name: "FAKKU",
		author: "dnsev-h",
		description: "Linkify and format FAKKU links",
		version: [1,0,0,2,-0xDB],
		registrations: 1,
		main: main_fn
	}, function (err) {
		if (err === null) {
			var base_url = "https://" + domains.www_fakku + "/";

			xlinks_api.insert_styles(".xl-site-tag-icon[data-xl-site-tag-icon=fakku]{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgAgMAAAAOFJJnAAAACVBMVEUAAAD///+dCgqcN6lGAAAAAXRSTlMAQObYZgAAAENJREFUGFdlxqEBADAIBLE37Ic5w36Yn7IWaFSkTwAEjNjucJ+wA9ROKsrMAHbO2LhPyq0ZKLOSgfPEfGmd1A4pmPk8CYJP9+McG6wAAAAASUVORK5CYII=)}");

			xlinks_api.register({
				settings: {
					general: [
						[ "iconify" ],
					],
					sites: [
						[ "fakku", true, "fakku.net", "Enable link processing for fakku.net" ],
					]
				},
				request_apis: [{
					group: "fakku",
					namespace: "fakku",
					type: "gallery",
					count: 1,
					concurrent: 1,
					delay_okay: 200,
					delay_error: 5000,
					functions: {
						get_data: fakku_get_data,
						set_data: fakku_set_data,
						setup_xhr: fakku_setup_xhr,
						parse_response: fakku_parse_response
					},
				}],
				linkifiers: [{
					regex: /(https?:\/*)?(?:www\.)?fakku\.net(?:\/[^<>()\s\'\"]*)?/i,
					prefix_group: 1,
					prefix: "https://",
				}],
				commands: [{
					url_info: url_get_info,
					to_data: url_info_to_data,
					actions: create_actions
				}],
				create_url: {
					fakku: {
						to_gallery: base_url + "{data.name_class}/{data.name}",
						to_uploader: base_url,
						to_category: base_url,
						to_tag: base_url + "tags/{tag}",
						to_tag_ns: [
							[ base_url + "artist/{tag}", "namespace", "===", "artist" ],
							[ base_url + "manga/{tag}", "namespace", "===", "language" ],
							base_url + "tags/{tag}"
						]
					}
				}
			});
		}
	}._w(83));

	}._w(67);
	main(xlinks_api);

})();

