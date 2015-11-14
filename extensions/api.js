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
		};

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
		};

	})();

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
	};
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
	};

	var random_string_alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	var random_string = function (count) {
		var alpha_len = random_string_alphabet.length,
			s = "",
			i;
		for (i = 0; i < count; ++i) {
			s += random_string_alphabet[Math.floor(Math.random() * alpha_len)];
		}
		return s;
	};

	var is_object = function (obj) {
		return (obj !== null && typeof(obj) === "object");
	};

	var create_temp_storage = function () {
		var data = {};

		var fn = {
			length: 0,
			key: function (index) {
				return Object.keys(data)[index];
			},
			getItem: function (key) {
				if (Object.prototype.hasOwnProperty.call(data, key)) {
					return data[key];
				}
				return null;
			},
			setItem: function (key, value) {
				if (!Object.prototype.hasOwnProperty.call(data, key)) {
					++fn.length;
				}
				data[key] = value;
			},
			removeItem: function (key) {
				if (Object.prototype.hasOwnProperty.call(data, key)) {
					delete data[key];
					--fn.length;
				}
			},
			clear: function () {
				data = {};
				fn.length = 0;
			}
		};

		return fn;
	};

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
	};

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
	};

	var config = {};

	var api = null;
	var API = function (api_name, api_key) {
		this.origin = window.location.protocol + "//" + window.location.host;
		this.timeout_delay = 1000;

		this.init_state = 0;
		this.api_name = api_name;
		this.api_key = api_key;
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
		};
		window.addEventListener("message", this.on_window_message_bind, false);
	};
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
	};
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
			};

			this.reply_callbacks[id] = cb;
			cb = null;

			if (this.timeout_delay >= 0) {
				timeout = setTimeout(function () {
					timeout = null;
					delete self.reply_callbacks[id];
					on_reply.call(self, "Response timeout");
				}, this.timeout_delay);
			}
		}

		window.postMessage({
			xlinks_action: action,
			extension: true,
			id: id,
			reply: reply_to || null,
			key: this.api_key,
			name: this.api_name,
			data: data
		}, this.origin);
	};
	API.prototype.init = function (callback) {
		if (this.init_state !== 0) {
			callback.call(null, this.init_state === 1 ? "Init active" : "Already started");
			return;
		}

		this.init_state = 1;

		var self = this,
			de = document.documentElement,
			a;

		if (de) {
			a = de.getAttribute("data-xlinks-extensions-waiting");
			a = (a ? (parseInt(a, 10) || 0) : 0) + 1;
			de.setAttribute("data-xlinks-extensions-waiting", a);
			de = null;
		}

		ready(function () {
			self.send("start", null, null, function (err, data) {
				self.on_init(err, data);
				callback.call(null, err);
			});
		});
	};
	API.prototype.on_init = function (err, data) {
		var v;

		if (err === null && is_object(data) && typeof(data.key) === "string") {
			this.init_state = 2;
			this.api_key = data.key;
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
		else {
			this.init_state = 0;
		}
	};
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

		// Name
		if (typeof((v = data.name)) === "string") send_data.name = v;
		if (typeof((v = data.author)) === "string") send_data.author = v;
		if (typeof((v = data.description)) === "string") send_data.description = v;

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
		});
	};
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
	};

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
		},
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
			});

			// Call
			ret = fn.apply(req, args);
		},
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
			});
		},
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
			});
		},
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
			});
		},
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
			});
		},
	};

	var RequestErrorMode = {
		None: 0,
		NoCache: 1,
		Save: 2
	};

	var requests_active = {};
	var Request = function () {
	};

	var load_request_state = function (request, state) {
		for (var k in state) {
			request[k] = state[k];
		}
	};


	// Public
	var init = function (name, callback) {
		if (api === null) api = new API(name, random_string(64));
		api.init(callback);
	};

	var register = function (data, callback) {
		if (api === null) {
			callback.call(null, "API not init'd", 0);
			return;
		}

		api.register(data, callback);
	};

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
		});

		api.timeout_delay = d;
	};

	var insert_styles = function (styles) {
		var head = document.head,
			n;
		if (!head) return false;
		n = document.createElement("style");
		n.textContent = styles;
		head.appendChild(n);
		return true;
	};

	var select = function (selector, root) {
		return (root || document).querySelector(selector);
	};
	var select_all = function (selector, root) {
		return (root || document).querySelectorAll(selector);
	};
	var parse_json = function (text, def) {
		try {
			return JSON.parse(text);
		}
		catch (e) {
			return def;
		}
	};
	var parse_html = function (text, def) {
		try {
			return (new DOMParser()).parseFromString(text, "text/html");
		}
		catch (e) {
			return def;
		}
	};

	var get_domain = function (url) {
		var m = /^(?:[\w\-]+):\/*((?:[\w\-]+\.)*)([\w\-]+\.[\w\-]+)/i.exec(url);
		return (m === null) ? [ "", "" ] : [ m[1].toLowerCase(), m[2].toLowerCase() ];
	};


	// Exports
	return {
		RequestErrorMode: RequestErrorMode,
		init: init,
		config: config,
		register: register,
		request: request,
		insert_styles: insert_styles,
		select: select,
		select_all: select_all,
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

})();


