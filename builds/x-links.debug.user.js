// ==UserScript==
// @name        X-links (debug)
// @namespace   dnsev-h
// @author      dnsev-h
// @version     1.2.1.1.0xDB
// @description Making your browsing experience on 4chan and friends more pleasurable
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
// @icon        data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAA6klEQVR4Ae2ZoQ7CQBBE+VIMBoHBYBAYDKLmDAKFwPBha/sJIGebMMld9hK2l9nkmaa5vpdcr6Kb+Gg0nzb6rzlMgALsPf8kEmDTDG5AAeMHvEAowEnbFQwZoAAvbU/HA/j7W6XtAgYJUACP8dJ2dxQQkKYwH48CsgbwmDKDCUSkcWTTd2y55gmQmGQBCuh/RPJ3rAAmbQeQN0ABAWk7A75fQau0bUHaAAUE9vrywUfA9y6ISf8/QAH9j0gvsXfsAImpllZAzoBm6Yo1IV0rx64rIH0A+bIGAyDdvr8VsLYA/WJSgEaj0axtvoTvtkB/WJNGAAAAAElFTkSuQmCC
// @icon64      data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAOVBMVEUBAADmje/mku/mqu/mie/mXu/mdu/mbO/mhO/mm+/mf+/mY+/me+8AAADmpe/maO/mce/ml+/moe+i3TygAAAAAXRSTlMAQObYZgAAAJ9JREFUeF7tl0kKxDAQxCbJrPvy/8eOCqYgmMYPqFjXRrqUc8gONs+joXdLDix/qsAEe9hC4AlVQPIZ0gOSv3ABSa18heSAI5I/MEMlG8dFUsARyRNU8gJeSbcjyEkK9B6PV5rB8glyArV8B08lWvkAOYF6Pslv8FyikgMC3ccj+QU3cGQtJwVaeX2TvJYspwX88VQBye10eYHxvwCDwQ+bGFfRy77HgQAAAABJRU5ErkJggg==
// @grant       GM_xmlhttpRequest
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_listValues
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
				window.postMessage({ set_timeout_0ms: key }, origin);
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

		var last_error = undefined;
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

	var d = document;
	var browser = {
		is_opera: /presto/i.test("" + navigator.userAgent),
		is_firefox: /firefox/i.test("" + navigator.userAgent)
	};
	var domains = {
		exhentai: "exhentai.org",
		gehentai: "g.e-hentai.org",
		ehentai: "e-hentai.org",
		nhentai: "nhentai.net",
		hitomi: "hitomi.la"
	};
	var domain_info = {
		"exhentai.org": { tag: "Ex", g_domain: "exhentai.org", type: "ehentai" },
		"e-hentai.org": { tag: "EH", g_domain: "g.e-hentai.org", type: "ehentai" },
		"nhentai.net": { tag: "n", g_domain: "nhentai.net", type: "nhentai" },
		"hitomi.la": { tag: "Hi", g_domain: "hitomi.la", type: "hitomi" }
	};
	var options = {
		general: [
			// [ name, default, label, description, old_name, info? ]
			[ "automatic_processing", true,
				"Automatic link processing", "Get data and format links automatically",
				"Automatic Processing"
			],
			[ "changelog_on_update", true,
				"Show changelog on update", "Show the changelog after an update",
				"Show Changelog on Update"
			],
			[ "external_resources", true,
				"Allow external resources", "Enable the usage of web-fonts provided by Google servers",
				"Use Extenral Resources" // [sic]
			],
			[ "image_leeching_disabled", false,
				"Hide referrer for thumbnails", "Thumbnails fetching should not send referrer information",
				"Disable Image Leeching"
			],
			[ "rewrite_links", "none",
				"Rewrite link URLs", "Rewrite all E*Hentai links to use a specific site",
				"Rewrite Links",
				{
					type: "select",
					options: [ // [ value, label_text, description? ]
						[ "none", "Disabled" ],
						[ "smart", "Smart", "All links lead to " + domains.gehentai + " unless they have fjording tags" ],
						[ domains.ehentai, domains.gehentai ],
						[ domains.exhentai, domains.exhentai ]
					]
				}
			],
		],
		sites: [
			[ "ehentai", true,
				"e*hentai.org", "Enable link processing for E-Hentai and ExHentai",
				null
			],
			[ "ehentai_ext", true,
				"e*hentai.org extended", "Fetch complete gallery info for E*Hentai, including tag namespaces",
				"Extended Info"
			],
			[ "nhentai", true,
				"nhentai.net", "Enable link processing for nhentai.net",
				null
			],
			[ "hitomi", true,
				"hitomi.la", "Enable link processing for hitomi.la",
				null
			],
		],
		details: [
			[ "enabled", true,
				"Enabled", "Show details for gallery links on hover",
				"Gallery Details"
			],
			[ "hover_position", -0.25,
				"Hovering position", "Change the horizontal offset of the gallery details from the cursor",
				"Details Hover Position",
				{
					type: "select",
					options: [ // [ value, label_text, description? ]
						[ -0.25, "Default", "Offset slightly from the cursor" ],
						[ 0.0, "ExLinks", "Use the original ExLinks style positioning" ]
					],
					set: function (v) { return parseFloat(v) || 0.0; }._w(3)
				}
			],
		],
		actions: [
			[ "enabled", true,
				"Enabled", "Generate gallery actions for links",
				"Gallery Actions"
			],
			[ "close_on_click", true,
				"Close on click", "Close gallery actions after clicking anywhere",
				null
			],
		],
		sauce: [
			[ "enabled", true,
				"Enabled", "Add ExSauce reverse image search to posts containing images",
				"ExSauce"
			],
			[ "expunged", false,
				"Search expunged", "Search expunged galleries for source",
				"Search Expunged"
			],
			[ "label", "",
				"Custom label", "Use a custom label instead of the site name (e-hentai/exhentai)",
				"Custom Label Text",
				{ type: "textbox" }
			],
			[ "lookup_domain", domains.exhentai,
				"Lookup domain", "The site to use for the reverse image search",
				"Lookup Domain",
				{
					type: "select",
					options: [ // [ value, label_text, description? ]
						[ domains.ehentai, domains.gehentai ],
						[ domains.exhentai, domains.exhentai ]
					]
				}
			],
		],
		filter: [
			[ "enabled", true,
				"Enabled", "Enable filtering of galleries",
				null
			],
			[ "full_highlighting", false,
				"Full highlighting", "Highlight of all the text instead of just the matching portion",
				"Full Highlighting"
			],
			[ "good_tag_marker", "!",
				"Good tag marker", "Text to mark a good [Ex]/[EH] tag with",
				"Good Tag Marker",
				{ type: "textbox" },
			],
			[ "bad_tag_marker", "",
				"Bad tag marker", "Text to mark a bad [Ex]/[EH] tag with",
				"Bad Tag Marker",
				{ type: "textbox" },
			],
			[ "filters",
				( //{
					"# Highlight all doujinshi and manga galleries with (C88) in the name:\n" +
					"# /\\(C88\\)/i;only:doujinshi,manga;link-color:red;color:#FF0000;title\n" +
					"# Highlight \"english\" and \"translated\" tags in non-western non-non-h galleries:\n" +
					"# /english|translated/i;not:western,non-h;colors:#4080F0;tag\n" +
					"# Highlight galleries tagged with \"touhou project\":\n" +
					"# /touhou project/i;underlines:rgba(255,128,64,1);tag;title\n" +
					"# Highlight releases translated by {5 a.m.}:\n" +
					"# /\\{?5\\s*a[\\.,]?m[\\.,]?\\}?/i;title;bgs:#3BC620;colors:#FDFA18;\n" +
					"# Don't highlight anything uploaded by \"CGrascal\"\n" +
					"# /CGrascal/i;bad:yes;uploader;title;"
				), //}
				"Filters", "",
				"Filters",
				{ type: "textarea" },
			],
		],
		debug: [
			[ "enabled", false,
				"Enabled", "Enable logging to the browser console",
				"Debug Mode"
			],
			[ "cache_mode", "local",
				"Caching mode", "Change how your browser caches link information",
				function (config_old) {
					if (config_old["Disable Caching"]) return "none";
					if (config_old["Disable Local Storage Cache"]) return "session";
					return "local";
				}._w(4),
				{
					type: "select",
					options: [ // [ value, label_text, description? ]
						[ "local", "Local storage", "Data is cached per website" ],
						[ "session", "Session storage", "Data is cached per browser tab" ],
						[ "none", "Disabled", "Data is not cached" ],
					]
				}
			],
		],
	};
	var config = { version: null, settings_version: 1 };

	var MutationObserver = (function () {

		var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver || null;

		if (MutationObserver === null) {
			// Partial polyfill
			var on_body_node_add = function (event) {
				var node = event.target;
				this.callback.call(this, [{
					target: node.parentNode,
					addedNodes: [ node ],
					removedNodes: [],
					nextSibling: node.nextSibling,
					previousSibling: node.previousSibling
				}]);
			}._w(6);
			var on_body_node_remove = function (event) {
				var node = event.target;
				this.callback.call(this, [{
					target: node.parentNode,
					addedNodes: [],
					removedNodes: [ node ],
					nextSibling: node.nextSibling,
					previousSibling: node.previousSibling
				}]);
			}._w(7);

			MutationObserver = function (callback) {
				this.on_body_node_add = $.bind(on_body_node_add, this);
				this.on_body_node_remove = $.bind(on_body_node_remove, this);
				this.callback = callback;
				this.nodes = [];
			}._w(8);
			MutationObserver.prototype.observe = function (node, data) {
				this.nodes.push(node);
				if (data.childList) {
					$.on(node, "DOMNodeInserted", this.on_body_node_add);
					$.on(node, "DOMNodeRemoved", this.on_body_node_remove);
				}
			}._w(9);
			MutationObserver.prototype.disconnect = function () {
				var node, i, ii;
				for (i = 0, ii = this.nodes.length; i < ii; ++i) {
					node = this.nodes[i];
					$.off(node, "DOMNodeInserted", this.on_body_node_add);
					$.off(node, "DOMNodeRemoved", this.on_body_node_remove);
				}
				this.nodes = [];
			}._w(10);
		}

		return MutationObserver;

	}._w(5))();
	var $$ = function (selector, root) {
		return (root || d).querySelectorAll(selector);
	}._w(11);
	var $ = (function () {

		var re_short_domain = /^(?:[\w\-]+):\/*(?:[\w-]+\.)*([\w-]+\.[\w]+)/i,
			re_change_domain = /^([\w\-]+:\/*)([\w\-]+(?:\.[\w\-]+)*)([\w\W]*)$/i;

		var Module = function (selector, root) {
			return (root || d).querySelector(selector);
		}._w(13);

		Module.ready = (function () {

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
			}._w(15);

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
			}._w(16);

		}._w(14))();

		Module.frag = function (content) {
			var frag = d.createDocumentFragment(),
				div = $.node_simple("div"),
				n, next;

			div.innerHTML = content;
			for (n = div.firstChild; n !== null; n = next) {
				next = n.nextSibling;
				frag.appendChild(n);
			}
			return frag;
		}._w(17);
		Module.prepend = function (parent, child) {
			return parent.insertBefore(child, parent.firstChild);
		}._w(18);
		Module.add = function (parent, child) {
			return parent.appendChild(child);
		}._w(19);
		Module.before = function (root, next, node) {
			return root.insertBefore(node, next);
		}._w(20);
		Module.after = function (root, prev, node) {
			return root.insertBefore(node, prev.nextSibling);
		}._w(21);
		Module.replace = function (root, elem) {
			return root.parentNode.replaceChild(elem, root);
		}._w(22);
		Module.remove = function (elem) {
			return elem.parentNode.removeChild(elem);
		}._w(23);
		Module.tnode = function (text) {
			return d.createTextNode(text);
		}._w(24);
		Module.node = function (tag, class_name, text) {
			var elem = d.createElement(tag);
			elem.className = class_name;
			if (text !== undefined) {
				elem.textContent = text;
			}
			return elem;
		}._w(25);
		Module.node_ns = function (namespace, tag, class_name) {
			var elem = d.createElementNS(namespace, tag);
			elem.setAttribute("class", class_name);
			return elem;
		}._w(26);
		Module.node_simple = function (tag) {
			return d.createElement(tag);
		}._w(27);
		Module.link = function (href, class_name, text) {
			var elem = d.createElement("a");
			if (href !== undefined) {
				elem.href = href;
				elem.target = "_blank";
				elem.rel = "noreferrer";
			}
			if (class_name !== undefined) {
				elem.className = class_name;
			}
			if (text !== undefined) {
				elem.textContent = text;
			}
			return elem;
		}._w(28);
		Module.on = function (elem, eventlist, handler) {
			var event, i, ii;
			if (eventlist instanceof Array) {
				for (i = 0, ii = eventlist.length; i < ii; ++i) {
					event = eventlist[i];
					elem.addEventListener(event[0], event[1], false);
				}
			}
			else {
				elem.addEventListener(eventlist, handler, false);
			}
		}._w(29);
		Module.off = function (elem, eventlist, handler) {
			var event, i, ii;
			if (eventlist instanceof Array) {
				for (i = 0, ii = eventlist.length; i < ii; ++i) {
					event = eventlist[i];
					elem.removeEventListener(event[0], event[1], false);
				}
			}
			else {
				elem.removeEventListener(eventlist, handler, false);
			}
		}._w(30);
		Module.test = function (elem, selector) {
			try {
				if (elem.matches) return elem.matches(selector);
				return elem.matchesSelector(selector);
			}
			catch (e) {}
			return false;
		}._w(31);
		Module.unwrap = function (node) {
			var par = node.parentNode,
				next, n;

			if (par !== null) {
				next = node.nextSibling;
				while ((n = node.firstChild) !== null) {
					par.insertBefore(n, next);
				}
				par.removeChild(node);
			}
		}._w(32);

		Module.scroll_focus = function (element) {
			// Focus
			var n = $.node_simple("textarea");
			$.prepend(element, n);
			n.focus();
			n.blur();
			$.remove(n);

			// Scroll to top
			element.scrollTop = 0;
			element.scrollLeft = 0;
		}._w(33);
		Module.clamp = function (value, min, max) {
			return Math.min(max, Math.max(min, value));
		}._w(34);
		Module.is_left_mouse = function (event) {
			return (event.which === undefined || event.which === 1);
		}._w(35);
		Module.push_many = function (target, new_entries) {
			var max_push = 1000;
			if (new_entries.length < max_push) {
				Array.prototype.push.apply(target, new_entries);
			}
			else {
				for (var i = 0, ii = new_entries.length; i < ii; i += max_push) {
					Array.prototype.push.apply(target, Array.prototype.slice.call(new_entries, i, i + max_push));
				}
			}
		}._w(36);
		Module.bind = function (fn, self) {
			if (arguments.length > 2) {
				var args = Array.prototype.slice.call(arguments, 2);

				return function () {
					var full_args = Array.prototype.slice.call(args);
					Array.prototype.push.apply(full_args, arguments);

					return fn.apply(self, full_args);
				}._w(38);
			}
			else {
				return function () {
					return fn.apply(self, arguments);
				}._w(39);
			}
		}._w(37);

		var mouseenterleave_event_validate = function (parent) {
			try {
				for (; parent; parent = parent.parentNode) {
					if (parent === this) return false;
				}
				return true;
			}
			catch (e) {}
			return false;
		}._w(40);
		Module.wrap_mouseenterleave_event = function (fn) {
			return function (event) {
				return mouseenterleave_event_validate.call(this, event.relatedTarget) ? fn.call(this, event) : undefined;
			}._w(42);
		}._w(41);

		var parse_url = function (url) {
			var ret = {
					protocol: null,
					host: null,
					pathname: null,
					search: null,
					hash: null
				},
				m = /^[\w\-]+:/.exec(url);

			if (m !== null) {
				ret.protocol = m[0];
				m = /^\/{0,2}([^\/\?\#]*)(\/[^\?\#]*)?(\?[^\#]*)?(\#[\w\W]*)?/.exec(url.substr(m.index + m[0].length));
			}
			else {
				m = /^(?:\/\/([^\/\?\#]*))?([^\?\#]+)?(\?[^\#]*)?(\#[\w\W]*)?/.exec(url);
			}

			if (m !== null) {
				if (m[1] !== undefined) {
					ret.host = m[1];
					ret.pathname = m[2] || "/";
					ret.search = m[3] || "";
					ret.hash = m[4] || "";
				}
				else if (m[2] !== undefined) {
					ret.pathname = m[2];
					ret.search = m[3] || "";
					ret.hash = m[4] || "";
				}
				else if (m[3] !== undefined) {
					ret.search = m[3];
					ret.hash = m[4] || "";
				}
				else if (m[4] !== undefined) {
					ret.hash = m[4];
				}
			}

			return ret;
		}._w(43);
		Module.resolve = function (url, from) {
			var url_loc = parse_url(url || ""),
				from_loc = parse_url(from !== undefined ? from : window.location.href),
				url_path = url_loc.pathname,
				from_path = from_loc.pathname;

			if (url_loc.protocol === null) url_loc.protocol = from_loc.protocol;
			if (url_loc.host === null) url_loc.host = from_loc.host;
			if (url_loc.search === null) url_loc.search = from_loc.search;
			if (url_loc.hash === null) url_loc.hash = from_loc.hash;

			if (url_path === null) {
				url_path = from_path;
			}
			else if (from_path !== null) {
				if (url_path.length === 0) {
					url_path = from_path;
				}
				else if (url_path[0] !== "/") {
					url_path = from_path.replace(/[^\/]*$/, "") + url_path;
				}
			}

			url = "";
			if (url_loc.protocol !== null) url += url_loc.protocol;
			if (url_loc.host !== null) url += "//" + url_loc.host;
			if (url_path !== null) url += url_path;
			if (url_loc.search !== null) url += url_loc.search;
			if (url_loc.hash !== null) url += url_loc.hash;

			return url;
		}._w(44);

		Module.regex_escape = function (text) {
			return text.replace(/[\$\(\)\*\+\-\.\/\?\[\\\]\^\{\|\}]/g, "\\$&");
		}._w(45);
		Module.json_parse_safe = function (text, def) {
			try {
				return JSON.parse(text);
			}
			catch (e) {
				return def;
			}
		}._w(46);
		Module.html_parse_safe = function (text, def) {
			try {
				return (new DOMParser()).parseFromString(text, "text/html");
			}
			catch (e) {
				return def;
			}
		}._w(47);
		Module.get_domain = function (url) {
			var m = re_short_domain.exec(url);
			return (m === null) ? "" : m[1].toLowerCase();
		}._w(48);
		Module.change_url_domain = function (url, new_domain) {
			var m = re_change_domain.exec(url);
			return (m === null) ? url : m[1] + new_domain + m[3];
		}._w(49);

		return Module;

	}._w(12))();
	var Debug = (function () {

		var started = false,
			timer_names = null;

		var dummy_fn = function () {}._w(51);
		var log = dummy_fn;
		var timer_log = function (label, timer) {
			var t = timing(),
				value;

			if (typeof(timer) === "string") timer = timer_names[timer];

			value = (timer === undefined) ? "???ms" : (t - timer).toFixed(3) + "ms";

			if (!started) return [ label, value ];
			log(label, value);
		}._w(52);

		var init = function () {
			started = true;

			if (!config.debug.enabled) {
				timer_log = dummy_fn;
				Module.timer_log = timer_log;
				return;
			}

			// Debug functions
			Module.enabled = true;

			timer_names = {};
			log = function () {
				var args = [ "X-links " + Main.version.join(".") + ":" ].concat(Array.prototype.slice.call(arguments));
				console.log.apply(console, args);
			}._w(54);
			Module.log = log;
			Module.timer = function (name, dont_format) {
				var t1 = timing(),
					t2;

				t2 = timer_names[name];
				timer_names[name] = t1;

				if (dont_format) {
					return (t2 === undefined) ? -1 : (t1 - t2);
				}
				return (t2 === undefined) ? "???ms" : (t1 - t2).toFixed(3) + "ms";
			}._w(55);
		}._w(53);

		// Exports
		var Module = {
			enabled: false,
			log: log,
			timer: dummy_fn,
			timer_log: timer_log,
			init: init
		};

		return Module;

	}._w(50))();
	var Post = (function () {

		// Private
		var file_ext = function (url) {
			var m = /\.[^\.]*$/.exec(url);
			return (m === null) ? "" : m[0].toLowerCase();
		}._w(57);
		var file_name = function (url) {
			url = url.split("/");
			return url[url.length - 1];
		}._w(58);

		var get_op_post_files_container_tinyboard = function (node) {
			while (true) {
				if ((node = node.previousSibling) === null) return null;
				if (node.classList && node.classList.contains("files")) return node;
			}
		}._w(59);

		var post_selector = {
			"4chan": ".postContainer,.post.inlined,#quote-preview",
			"foolz": "article:not(.backlink_container)",
			"fuuka": ".content>div[id],.content>table",
			"tinyboard": ".post",
			"ipb": ".borderwrap",
			"ipb_lofi": ".postwrapper"
		};
		var post_body_selector = {
			"4chan": "blockquote",
			"foolz": ".text",
			"fuuka": "blockquote>p",
			"tinyboard": ".body",
			"ipb": ".postcolor",
			"ipb_lofi": ".postcontent"
		};
		var body_links_selector = {
			"4chan": "a:not(.quotelink)",
			"foolz": "a:not(.backlink)",
			"fuuka": "a:not(.backlink)",
			"tinyboard": "a:not([onclick])",
			"ipb": "a[target=_blank]",
			"ipb_lofi": "a[target=_blank]"
		};
		var post_parent_find = {
			"4chan": function (node) {
				while ((node = node.parentNode) !== null) {
					if (node.classList.contains("postContainer")) return node;
					// 4chan-inline
					if (node.classList.contains("post") && (node.classList.contains("inlined") || node.id === "quote-preview")) return node;
				}
				return null;
			}._w(60),
			"foolz": function (node) {
				while ((node = node.parentNode) !== null) {
					if (node.tagName === "ARTICLE") return node;
				}
				return null;
			}._w(61),
			"fuuka": function (node) {
				while ((node = node.parentNode) !== null) {
					if (
						node.tagName === "TABLE" || // Reply
						(node.tagName === "DIV" && node.id && node.parentNode.classList.contains("content")) // OP
					) {
						return node;
					}
				}
				return null;
			}._w(62),
			"tinyboard": function (node) {
				while ((node = node.parentNode) !== null) {
					if (node.classList.contains("post")) {
						return node;
					}
					else if (node.classList.contains("thread")) {
						return $(".post.op", node);
					}
				}
				return null;
			}._w(63),
			"ipb": function (node) {
				while ((node = node.parentNode) !== null) {
					if (node.classList.contains("borderwrap")) return node;
				}
				return null;
			}._w(64),
			"ipb_lofi": function (node) {
				while ((node = node.parentNode) !== null) {
					if (node.classList.contains("postwrapper")) return node;
				}
				return null;
			}._w(65)
		};
		var get_file_info = {
			"4chan": function (post) {
				var n, ft, img, a1, url, i;

				if (
					(n = $(".file", post)) === null ||
					!belongs_to[Config.mode].call(null, n, post) ||
					(ft = $(".fileText", n)) === null ||
					(img = $("img", n)) === null ||
					(a1 = $("a", n)) === null
				) {
					return [];
				}

				url = a1.href;
				if ((i = url.indexOf("#")) >= 0) url = url.substr(0, i);

				return [{
					image: img,
					image_link: img.parentNode,
					text_link: a1,
					options: ft,
					url: url,
					type: file_ext(url),
					name: file_name(url),
					md5: img.getAttribute("data-md5") || null
				}];
			}._w(66),
			"foolz": function (post) {
				var n, ft, img, a1, url, i;

				if (
					(n = $(".thread_image_box", post)) === null ||
					!belongs_to[Config.mode].call(null, n, post) ||
					(ft = $(".post_file_controls", post)) === null ||
					(img = $("img", n)) === null ||
					(a1 = $(".post_file_filename", post)) === null
				) {
					return [];
				}

				url = a1.href;
				if ((i = url.indexOf("#")) >= 0) url = url.substr(0, i);

				return [{
					image: img,
					image_link: img.parentNode,
					text_link: a1,
					options: ft,
					url: url,
					type: file_ext(url),
					name: file_name(url),
					md5: img.getAttribute("data-md5") || null
				}];
			}._w(67),
			"fuuka": function (post) {
				var n, img, a1, url, i;

				if (
					(img = $("a>img.thumb", post)) === null ||
					!belongs_to[Config.mode].call(null, img, post)
				) {
					return [];
				}

				a1 = img.parentNode;
				n = a1.parentNode;
				url = a1.href;
				if ((i = url.indexOf("#")) >= 0) url = url.substr(0, i);

				return [{
					image: img,
					image_link: a1,
					text_link: null,
					options: n,
					url: url,
					type: file_ext(url),
					name: file_name(url),
					md5: img.getAttribute("data-md5") || null
				}];
			}._w(68),
			"tinyboard": function (post) {
				var results = [],
					imgs, infos, img, array, ft, a1, n, url, i, ii, j;

				if (post.classList.contains("op")) {
					n = get_op_post_files_container_tinyboard(post);
					if (n === null) return results;

					imgs = $$("a>img", n);
					infos = $$(".fileinfo", n);
					ii = Math.min(imgs.length, infos.length);
				}
				else {
					imgs = $$("a>img", post);
					array = [];
					for (i = 0, ii = imgs.length; i < ii; ++i) {
						img = imgs[i];
						if (belongs_to[Config.mode].call(null, img, post)) {
							array.push(img);
						}
					}
					imgs = array;

					infos = $$(".fileinfo", post);
					ii = Math.min(imgs.length, infos.length);
				}

				for (i = 0; i < ii; ++i) {
					img = imgs[i];
					n = infos[i];

					if (
						(ft = $(".unimportant", n)) === null ||
						(a1 = $("a", n)) === null
					) {
						continue;
					}

					url = img.parentNode.href || a1.href;
					if ((j = url.indexOf("#")) >= 0) url = url.substr(0, j);

					results.push({
						image: img,
						image_link: img.parentNode,
						text_link: a1,
						options: ft,
						url: url,
						type: file_ext(url),
						name: file_name(url),
						md5: img.getAttribute("data-md5") || null
					});
				}

				return results;
			}._w(69),
			"ipb": function () {
				return [];
			}._w(70),
			"ipb_lofi": function () {
				return [];
			}._w(71)
		};
		var belongs_to_default = function (node, post) {
			return (Module.get_post_container(node) === post);
		}._w(72);
		var belongs_to_re_non_digit = /\D+/g;
		var belongs_to = {
			"4chan": function (node, post) {
				var id1 = node.id.replace(belongs_to_re_non_digit, ""),
					id2 = post.id.replace(belongs_to_re_non_digit, "");

				return (id1 && id1 === id2);
			}._w(73),
			"foolz": belongs_to_default,
			"fuuka": belongs_to_default,
			"tinyboard": belongs_to_default,
			"ipb": belongs_to_default,
			"ipb_lofi": belongs_to_default
		};
		var create_image_meta_link_default = function (file_info, node) {
			var par = file_info.options;
			$.add(par, $.tnode(" "));
			$.add(par, node);
		}._w(74);
		var create_image_meta_link = {
			"4chan": create_image_meta_link_default,
			"foolz": function (file_info, node) {
				var par = file_info.options,
					next;

				for (next = par.lastChild; next !== null; next = next.previousSibling) {
					if (next.tagName === "A" && next.hasAttribute("download")) break;
				}

				node.classList.add("btnr");
				node.classList.add("parent");
				$.before(par, next, node);
			}._w(75),
			"fuuka": function (file_info, node) {
				var par = file_info.options,
					t = " [",
					i = 0,
					j = (par.tagName === "DIV" ? 1 : 2),
					next, n;

				for (next = par.firstChild; next !== null; next = next.nextSibling) {
					if (next.tagName === "BR" && ++i === j) break;
				}

				if (
					next !== null &&
					(n = next.previousSibling) !== null &&
					n.nodeType === Node.TEXT_NODE
				) {
					n.nodeValue = n.nodeValue.replace(/\]\s*$/, "]") + t;
				}
				else {
					$.before(par, next, $.tnode(t));
				}

				$.before(par, next, node);
				$.before(par, next, $.tnode("]"));
			}._w(76),
			"tinyboard": create_image_meta_link_default,
			"ipb": create_image_meta_link_default,
			"ipb_lofi": create_image_meta_link_default
		};

		// Exports
		var Module = {
			get_post_container: function (node) {
				return post_parent_find[Config.mode].call(null, node);
			}._w(77),
			get_text_body: function (node) {
				return $(post_body_selector[Config.mode], node);
			}._w(78),
			is_post: function (node) {
				return $.test(node, post_selector[Config.mode]);
			}._w(79),
			get_all_posts: function (parent) {
				return $$(post_selector[Config.mode], parent);
			}._w(80),
			get_file_info: function (post) {
				return get_file_info[Config.mode].call(null, post);
			}._w(81),
			get_body_links: function (post) {
				return $$(body_links_selector[Config.mode], post);
			}._w(82),
			create_image_meta_link: function (file_info, node) {
				return create_image_meta_link[Config.mode].call(null, file_info, node);
			}._w(83),
			get_op_post_files_container_tinyboard: get_op_post_files_container_tinyboard
		};

		return Module;

	}._w(56))();
	var CreateURL = (function () {

		// Private
		var to_gallery = {
			ehentai: function (data, domain) {
				return "http://" + domain_info[domain].g_domain + "/g/" + data.gid + "/" + data.token + "/";
			}._w(85),
			nhentai: function (data) {
				return "http://" + domains.nhentai + "/g/" + data.gid + "/";
			}._w(86),
			hitomi: function (data) {
				return "https://" + domains.hitomi + "/galleries/" + data.gid + ".html";
			}._w(87)
		};
		var to_uploader = {
			ehentai: function (data, domain) {
				return "http://" + domain_info[domain].g_domain + "/uploader/" + (data.uploader || "Unknown").replace(/\s+/g, "+");
			}._w(88),
			nhentai: function () {
				return "http://" + domains.nhentai + "/";
			}._w(89),
			hitomi: function () {
				return "https://" + domains.hitomi + "/";
			}._w(90)
		};
		var to_category = {
			ehentai: function (data, domain) {
				return "http://" + domain_info[domain].g_domain + "/" + API.get_category(data.category).short_name;
			}._w(91),
			nhentai: function (data) {
				return "http://" + domains.nhentai + "/category/" + data.category.toLowerCase() + "/";
			}._w(92),
			hitomi: function (data) {
				return "https://" + domains.hitomi + "/type/" + data.category.toLowerCase() + "-all-1.html";
			}._w(93)
		};
		var to_tag = {
			ehentai: function (tag, full_domain) {
				return "http://" + full_domain + "/tag/" + tag.replace(/\s+/g, "+");
			}._w(94),
			nhentai: function (tag, full_domain) {
				return "http://" + full_domain + "/tag/" + tag.replace(/\s+/g, "-") + "/";
			}._w(95),
			hitomi: function (tag, full_domain) {
				return "https://" + full_domain + "/tag/" + tag + "-all-1.html";
			}._w(96)
		};
		var to_tag_ns = {
			ehentai: function (tag, namespace, full_domain) {
				return "http://" + full_domain + "/tag/" + namespace + ":" + tag.replace(/\s+/g, "+");
			}._w(97),
			nhentai: function (tag, namespace, full_domain) {
				if (namespace === "tags") namespace = "tag";
				return "http://" + full_domain + "/" + namespace + "/" + tag.replace(/\s+/g, "-") + "/";
			}._w(98),
			hitomi: function (tag, namespace, full_domain) {
				if (namespace === "male" || namespace === "female") {
					return "https://" + full_domain + "/tag/" + namespace + ":" + tag + "-all-1.html";
				}
				else if (namespace === "artist") {
					return "https://" + full_domain + "/artist/" + tag + "-all-1.html";
				}
				else if (namespace === "parody") {
					return "https://" + full_domain + "/series/" + tag + "-all-1.html";
				}
				else if (namespace === "language") {
					return "https://" + full_domain + "/index-" + tag + "-1.html";
				}
				else {
					return "https://" + full_domain + "/tag/" + tag + "-all-1.html";
				}
			}._w(99)
		};

		// Exports
		return {
			to_gallery: function (data, domain) {
				var type = domain_info[domain].type;
				return to_gallery[type].call(null, data, domain);
			}._w(100),
			to_uploader: function (data, domain) {
				var type = domain_info[domain].type;
				return to_uploader[type].call(null, data, domain);
			}._w(101),
			to_category: function (data, domain) {
				var type = domain_info[domain].type;
				return to_category[type].call(null, data, domain);
			}._w(102),
			to_tag: function (tag, domain_type, full_domain) {
				return to_tag[domain_type].call(null, tag, full_domain);
			}._w(103),
			to_tag_ns: function (tag, namespace, domain_type, full_domain) {
				return to_tag_ns[domain_type].call(null, tag, namespace, full_domain);
			}._w(104)
		};

	}._w(84))();
	var HttpRequest = (function () {

		var gm_exists = false,
			debug_fn, request;

		try {
			if (GM_xmlhttpRequest && typeof(GM_xmlhttpRequest) === "function") {
				gm_exists = true;
			}
		}
		catch (e) {}

		debug_fn = function (type, data, callback, start_time) {
			return function (xhr) {
				var t = timing(),
					args = [
						"HttpRequest:",
						data.method,
						data.url,
						type,
						{ data: data, response: xhr, time: (t - start_time).toFixed(2) + "ms" }
					];

				if (type === "load") args.splice(4, 0, xhr.status, xhr.statusText);

				Debug.log.apply(Debug, args);
				return callback.apply(this, arguments);
			}._w(107);
		}._w(106);

		if (gm_exists) {
			request = function (data) {
				if (Debug.enabled) {
					var upload = data.upload,
						start = timing(),
						fn;

					Debug.log("HttpRequest:", data.method, data.url, { data: data });

					if (typeof((fn = data.onload)) === "function") {
						data.onload = debug_fn("load", data, fn, start);
					}
					if (typeof((fn = data.onerror)) === "function") {
						data.onerror = debug_fn("error", data, fn, start);
					}
					if (typeof((fn = data.onabort)) === "function") {
						data.onabort = debug_fn("abort", data, fn, start);
					}

					if (typeof(upload) === "object" && upload !== null) {
						if (typeof((fn = upload.onerror)) === "function") {
							upload.onerror = debug_fn("upload.error", data, fn, start);
						}
						if (typeof((fn = upload.onabort)) === "function") {
							upload.onabort = debug_fn("upload.abort", data, fn, start);
						}
					}
				}

				return GM_xmlhttpRequest(data);
			}._w(108);
		}
		else {
			// Fallback
			request = function (data) {
				Debug.log("HttpRequest.invalid:", data.method, data.url, { data: data });
				var onerror = (data && data.onerror && typeof(data.onerror) === "function") ? data.onerror : null;
				if (onerror !== null) {
					setTimeout(function () {
						onerror.call(null, {});
					}._w(110), 1);
				}
			}._w(109);
		}

		// Done
		return request;

	}._w(105))();
	var UI = (function () {

		// Private
		var details_nodes = {},
			actions_nodes = {},
			actions_nodes_active = {},
			actions_nodes_active_count = 0,
			actions_nodes_index = 0,
			actions_close_timeout = null;

		var gallery_link_events_data = {
			link: null,
			mouse_x: 0,
			mouse_y: 0
		};
		var gallery_link_events = {
			mouseover: $.wrap_mouseenterleave_event(function (event) {
				var full_id = get_node_id_full(this),
					details = details_nodes[full_id],
					node = this,
					info, data, domain, thumb_state, thumb_cb;

				if (
					(info = Linkifier.get_node_url_info(this)) === null ||
					(data = API.get_data(info.site, info.gid)) === null
				) {
					Debug.log("Invalid link", { link: this, info: info, data: data });
					return;
				}

				if (details === undefined) {
					if (!((domain = $.get_domain(this.href)) in domain_info)) {
						Debug.log("Invalid link", { link: this, domain: domain });
						return;
					}

					details = create_details(data, domain);
					details_nodes[full_id] = details;
				}
				if (Debug.enabled) {
					var i = 1,
						n = details;
					while (n.parentNode !== document) {
						if (!n.parentNode) {
							Debug.log(
								"Invalid details: parent[" + i + "] failed;",
								{
									link: this,
									node: n,
									parent: n.parentNode,
									details: details,
									full_id: full_id
								}
							);
							break;
						}
						n = n.parentNode;
						++i;
					}
				}

				details.classList.remove("xl-details-hidden");
				details.classList.remove("xl-details-has-thumbnail");
				details.classList.remove("xl-details-has-thumbnail-visible");

				gallery_link_events_data.link = this;
				gallery_link_events_data.mouse_x = event.clientX;
				gallery_link_events_data.mouse_y = event.clientY;

				update_details_position(details, this, event.clientX, event.clientY);

				if (info.page !== undefined && info.page > 1) {
					// Thumbnail processing
					thumb_state = 0;
					thumb_cb = function (err, thumb_data) {
						if (err === null) {
							API.get_thumbnail(thumb_data.url, thumb_data.flags, function (err, thumb_url) {
								if (err === null && node === gallery_link_events_data.link) {
									var n0, n1, n2;
									if (
										(n0 = $(".xl-details-page-thumbnail", details)) !== null &&
										(n1 = $(".xl-details-page-thumbnail-size", n0)) !== null &&
										(n2 = $(".xl-details-page-thumbnail-image", n1)) !== null
									) {
										n2.style.backgroundImage = "url('" + thumb_url + "')";

										if (thumb_data.width > 0 && thumb_data.height > 0) {
											// Small thumbnail
											var max_width = 140,
												max_height = 200,
												max_ratio = max_height / max_width,
												scale = (thumb_data.height / thumb_data.width > max_ratio) ? max_height / thumb_data.height : max_width / thumb_data.width;

											n1.style.transform = "translate(-50%,-50%) scale(" + scale + ")";
											n1.style.left = "50%";
											n1.style.top = "50%";
											n1.style.width = thumb_data.width + "px";
											n1.style.height = thumb_data.height + "px";
											n2.style.backgroundSize = "auto";
											n2.style.backgroundPosition = (-thumb_data.left) + "px " + (-thumb_data.top) + "px";
										}
										else {
											// Large thumbnail
											n1.style.transform = "";
											n1.style.left = "";
											n1.style.top = "";
											n1.style.width = "";
											n1.style.height = "";
											n2.style.backgroundSize = "";
											n2.style.backgroundPosition = "";
										}

										// Animate
										if (thumb_state === 1) {
											Theme.get_computed_style(n0).getPropertyValue("transform");
										}
										details.classList.add("xl-details-has-thumbnail-visible");
									}
								}
							}._w(114));
						}
					}._w(113);

					details.classList.add("xl-details-has-thumbnail");
					if (info.site === "ehentai") {
						API.get_ehentai_gallery_page_thumb(info.domain, data.gid, data.token, info.page_token, info.page, thumb_cb);
					}
					else if (info.site === "nhentai") {
						API.get_nhentai_gallery_page_thumb(data.gid, info.page, thumb_cb);
					}
					else if (info.site === "hitomi") {
						API.get_hitomi_gallery_page_thumb(data.gid, info.page, thumb_cb);
					}
					if (thumb_state === 0) ++thumb_state;
				}
			}._w(112)),
			mouseout: $.wrap_mouseenterleave_event(function () {
				var details = details_nodes[get_node_id_full(this)];

				if (details === undefined) return;

				details.classList.add("xl-details-hidden");

				gallery_link_events_data.link = null;
			}._w(115)),
			mousemove: function (event) {
				var details = details_nodes[get_node_id_full(this)];

				if (details === undefined) return;

				gallery_link_events_data.mouse_x = event.clientX;
				gallery_link_events_data.mouse_y = event.clientY;

				update_details_position(details, this, event.clientX, event.clientY);
			}._w(116)
		};
		var gallery_toggle_actions = function (event) {
			if ($.is_left_mouse(event) && config.actions.enabled) {
				event.preventDefault();

				var index = this.getAttribute("xl-actions-index"),
					actions, tag_bg, data, link, id;

				if (!index) {
					index = "" + actions_nodes_index;
					++actions_nodes_index;
					this.setAttribute("xl-actions-index", index);
				}

				if (this.classList.toggle("xl-site-tag-active")) {
					// Create bg
					tag_bg = $(".xl-site-tag-bg", this);
					if (tag_bg === null) tag_bg = create_tag_bg(this);

					// Show
					actions = actions_nodes[index];
					if (actions !== undefined) {
						actions.classList.remove("xl-actions-hidden");
						Popup.hovering(actions);
						activate_actions(actions, index);
					}
					else {
						// Create
						if (
							(link = get_link_from_tag_button(this)) !== null &&
							(id = get_node_id(link)) !== null &&
							(data = API.get_data(id[0], id[1])) !== null
						) {
							actions = create_actions(data, link, index);
							actions_nodes[index] = actions;
							activate_actions(actions, index);
						}
						else {
							return;
						}
					}

					// Position
					update_actions_position(actions, this, tag_bg, d.documentElement.getBoundingClientRect());
				}
				else {
					// Hide
					actions = actions_nodes[index];
					if (actions !== undefined) {
						close_actions(actions, index);
					}
				}
			}
		}._w(117);
		var gallery_fetch_event = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();

				var link, info;

				Linkifier.change_link_events(this, null);

				if (
					(link = get_link_from_tag_button(this)) !== null &&
					(info = Linkifier.get_node_url_info(link)) !== null
				) {
					Linkifier.load_link(link, info);
				}
			}
		}._w(118);
		var gallery_error_event = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();
				return false;
			}
		}._w(119);

		var set_node_id = function (node, namespace, id) {
			node.setAttribute("data-xl-id", namespace + "_" + id);
		}._w(120);
		var get_node_id = function (node) {
			var a = node.getAttribute("data-xl-id"),
				i;
			return (a && (i = a.indexOf("_")) >= 0) ? [ a.substr(0, i), a.substr(i + 1) ] : null;
		}._w(121);
		var get_node_id_full = function (node) {
			return node.getAttribute("data-xl-id") || "";
		}._w(122);

		var get_tag_button_from_link = function (node) {
			// Assume the button is the previous (or previous-previous) sibling
			if (
				(node = node.previousSibling) !== null &&
				(node.classList || ((node = node.previousSibling) !== null && node.classList)) &&
				node.classList.contains("xl-site-tag")
			) {
				return node;
			}
			return null;
		}._w(123);
		var get_link_from_tag_button = function (node) {
			// Assume the link is the next (or next-next) sibling
			if (
				(node = node.nextSibling) !== null &&
				(node.classList || ((node = node.nextSibling) !== null && node.classList)) &&
				node.classList.contains("xl-link")
			) {
				return node;
			}
			return null;
		}._w(124);

		var pad = function (n, sep) {
			return (n < 10 ? "0" : "") + n + sep;
		}._w(125);

		var create_details = function (data, domain) {
			var g_domain = domain_info[domain].g_domain,
				category = API.get_category(data.category),
				theme = Theme.classes,
				file_size = (data.total_size / 1024 / 1024).toFixed(2),
				content, n1, n2, n3;

			// Body
			content = $.node("div", "xl-details xl-hover-shadow" + theme);
			Theme.bg(content);

			// Image
			$.add(content, n1 = $.node("div", "xl-details-thumbnail" + theme));
			$.add(n1, n2 = $.node("div", "xl-details-page-thumbnail xl-hover-shadow" + theme));
			$.add(n2, n3 = $.node("div", "xl-details-page-thumbnail-size" + theme));
			$.add(n3, $.node("div", "xl-details-page-thumbnail-image" + theme));
			API.get_thumbnail(data.thumbnail, data.flags, $.bind(function (err, url) {
				if (err === null) {
					this.style.backgroundImage = "url('" + url + "')";
				}
			}._w(127), n1));


			// Sidebar
			$.add(content, n1 = $.node("div", "xl-details-side-panel"));

			$.add(n1, n2 = $.node("div", "xl-button xl-button-eh xl-button-" + category.short_name + theme));
			$.add(n2, $.node("div", "xl-noise", category.name));

			if (data.rating >= 0) {
				$.add(n1, n2 = $.node("div", "xl-details-side-box xl-details-side-box-rating" + theme));
				$.add(n2, n3 = $.node("div", "xl-details-rating xl-stars-container"));
				$.add(n3, create_rating_stars(data.rating));
				$.add(n2, $.node("div", "xl-details-rating-text", "(Avg. " + data.rating.toFixed(2) + ")"));
			}

			$.add(n1, n2 = $.node("div", "xl-details-side-box xl-details-side-box-rating" + theme));
			$.add(n2, $.node("div", "xl-details-file-count", data.file_count + " image" + (data.file_count === 1 ? "" : "s")));
			if (data.total_size >= 0) {
				$.add(n2, $.node("div", "xl-details-file-size", "(" + file_size + " MB)"));
			}

			if (data.torrent_count >= 0) {
				$.add(n1, n2 = $.node("div", "xl-details-side-box xl-details-side-box-torrents" + theme));
				$.add(n2, n3 = $.node("div", "xl-details-side-box-inner"));
				$.add(n3, $.node("strong", "", "Torrents:"));
				$.add(n3, $.node("span", "", " " + data.torrent_count));
			}

			if (data.removed === true) {
				$.add(n1, n2 = $.node("div", "xl-details-side-box xl-details-side-box-visible" + theme));
				$.add(n2, n3 = $.node("div", "xl-details-side-box-inner"));
				$.add(n3, $.node("strong", "xl-details-side-box-error" + theme, "Removed"));
			}
			else if (data.visible !== null) {
				$.add(n1, n2 = $.node("div", "xl-details-side-box xl-details-side-box-visible" + theme));
				$.add(n2, n3 = $.node("div", "xl-details-side-box-inner"));
				$.add(n3, $.node("strong", "", "Visible:"));
				$.add(n3, $.node("span", "", data.visible ? " Yes" : " No"));
			}

			// Title
			$.add(content, n1 = $.node("div", "xl-details-title-container" + theme));
			$.add(n1, n2 = $.link(CreateURL.to_gallery(data, domain), "xl-details-title" + theme, data.title));
			Filter.highlight("title", n2, data, Filter.None);
			if (data.title_jpn !== null) {
				$.add(n1, n2 = $.node("div", "xl-details-title-jp" + theme, data.title_jpn));
				Filter.highlight("title", n2, data, Filter.None);
			}

			// Upload info
			$.add(content, n1 = $.node("div", "xl-details-upload-info" + theme));
			$.add(n1, $.tnode("Uploaded by"));
			$.add(n1, n2 = $.node("strong", "xl-details-uploader", data.uploader));
			Filter.highlight("uploader", n2, data, Filter.None);
			$.add(n1, $.tnode("on"));
			$.add(n1, $.node("strong", "xl-details-upload-date", format_date(new Date(data.upload_date))));

			// Tags
			$.add(content, n1 = $.node("div", "xl-details-tag-block" + theme));
			$.add(n1, $.node("strong", "xl-details-tag-block-label", "Tags:"));
			$.add(n1, n2 = $.node("span", "xl-details-tags"));
			$.add(n2, create_tags(g_domain, data));

			// End
			$.add(content, $.node("div", "xl-details-clear"));

			// Full info
			if (data.type === "ehentai" && config.sites.ehentai_ext && !data.full) {
				API.get_ehentai_gallery_full(domain, data, function (err, data) {
					if (err === null) {
						update_full(data);
					}
					else {
						Debug.log("Error requesting full information: " + err);
					}
				}._w(128));
			}

			// Fonts
			Main.insert_custom_fonts();
			Popup.hovering(content);
			return content;
		}._w(126);
		var create_actions = function (data, link, index) {
			var theme = Theme.classes,
				domain = $.get_domain(link.href),
				g_domain = domain_info[domain].g_domain,
				gid = data.gid,
				token = data.token,
				type = data.type,
				actions = $.node("div", "xl-actions xl-hover-shadow" + theme),
				n1, n2, n3;

			$.add(actions, n1 = $.node("div", "xl-actions-inner" + theme));
			$.add(n1, n2 = $.node("div", "xl-actions-table" + theme));

			var gen_entry = function (container, label, url, text) {
				var n1, n2, n3;
				$.add(container, n1 = $.node("div", "xl-actions-table-row" + theme));
				$.add(n1, n2 = $.node("div", "xl-actions-table-cell" + theme));
				if (label !== null) $.add(n2, $.node("div", "xl-actions-table-header", label));
				$.add(n1, n2 = $.node("div", "xl-actions-table-cell" + theme));
				$.add(n2, n3 = $.link(url, "xl-actions-option" + theme, text));
				$.on(n3, "click", $.bind(on_actions_link_click, n3, actions, index));
				return n3;
			}._w(130);
			var gen_sep = function (container) {
				var n1, n2;
				$.add(container, n1 = $.node("div", "xl-actions-table-row" + theme));
				$.add(n1, n2 = $.node("div", "xl-actions-table-cell" + theme));
				$.add(n2, $.node("div", "xl-actions-table-sep"));
			}._w(131);

			if (type === "ehentai") {
				gen_entry(n2, "View on:", CreateURL.to_gallery(data, domains.ehentai), "E-Hentai");
				gen_entry(n2, null, CreateURL.to_gallery(data, domains.exhentai), "ExHentai");

				gen_sep(n2);

				n3 = gen_entry(n2, "Uploader:", CreateURL.to_uploader(data, domain), data.uploader);
				n3.classList.add("xl-actions-uploader");
				Filter.highlight("uploader", n3, data, Filter.None);

				gen_sep(n2);

				gen_entry(n2, "Download:", "http://" + g_domain + "/gallerytorrents.php?gid=" + gid + "&t=" + token, "Torrent (" + data.torrent_count + ")");
				gen_entry(n2, null, "http://" + g_domain + "/archiver.php?gid=" + gid + "&t=" + token + "&or=" + data.archiver_key, "Archiver");
				n3 = gen_entry(n2, null, "http://" + g_domain + "/hathdler.php?gid=" + gid + "&t=" + token, "via H@H");
				n3.removeAttribute("target");

				gen_sep(n2);

				gen_entry(n2, "Other:", "http://" + g_domain + "/gallerypopups.php?gid=" + gid + "&t=" + token + "&act=addfav", "Favorite");
				gen_entry(n2, null, "http://" + domains.gehentai + "/stats.php?gid=" + gid + "&t=" + token, "Stats");
			}
			else if (type === "nhentai") {
				gen_entry(n2, "View on:", CreateURL.to_gallery(data, domain), "nhentai.net");
			}
			else if (type === "hitomi") {
				gen_entry(n2, "View on:", CreateURL.to_gallery(data, domain), "hitomi.la");
			}

			// Prepare
			$.on(actions, "click", on_actions_click);
			Theme.bg(actions);
			Popup.hovering(actions);

			// Done
			return actions;
		}._w(129);
		var create_tags = function (site, data) {
			var tagfrag = d.createDocumentFragment(),
				domain = data.type,
				tags_ns = data.tags_ns,
				theme = Theme.classes,
				tag = null,
				last = null,
				namespace, namespace_style, tags, link, tf, i, ii;

			if (tags_ns === null) {
				// Non-namespaced tags
				tags = data.tags;
				for (i = 0, ii = tags.length; i < ii; ++i) {
					tag = $.node("span", "xl-tag-block" + theme);
					link = $.link(CreateURL.to_tag(tags[i], domain, site), "xl-tag", tags[i]);

					Filter.highlight("tags", link, data, Filter.None);

					$.add(tag, link);
					$.add(tag, last = $.tnode(","));
					$.add(tagfrag, tag);
				}
				if (last !== null) $.remove(last);
			}
			else {
				// Namespaced tags
				for (namespace in tags_ns) {
					tags = tags_ns[namespace];
					ii = tags.length;
					if (ii === 0) continue;
					namespace_style = theme + " xl-tag-namespace-" + namespace.replace(/\s+/g, "-");

					tag = $.node("span", "xl-tag-namespace-block" + namespace_style);
					link = $.node("span", "xl-tag-namespace", namespace);
					tf = $.node("span", "xl-tag-namespace-first");
					$.add(tag, link);
					$.add(tag, $.tnode(":"));
					$.add(tf, tag);
					$.add(tagfrag, tf);

					for (i = 0; i < ii; ++i) {
						tag = $.node("span", "xl-tag-block" + namespace_style);
						link = $.link(CreateURL.to_tag_ns(tags[i], namespace, domain, site), "xl-tag", tags[i]);

						Filter.highlight("tags", link, data, Filter.None);

						$.add(tag, link);
						if (i < ii - 1) {
							$.add(tag, $.tnode(","));
						}
						else {
							tag.classList.add("xl-tag-block-last-of-namespace");
						}
						$.add(tf, tag);
						tf = tagfrag;
					}
				}

				if (tag !== null) {
					tag.classList.add("xl-tag-block-last");
				}
			}

			return tagfrag;
		}._w(132);
		var update_full = function (data) {
			var domain = domains.exhentai,
				full_id = data.type + "_" + data.gid,
				details = details_nodes[full_id],
				tagfrag, n, n2;

			if (details === undefined) return;

			// Removed status
			if (data.removed === true) {
				if ((n2 = $(".xl-details-side-box-visible>.xl-details-side-box-inner", details)) !== null) {
					n = $.node("strong", "xl-details-side-box-error" + Theme.classes, "Removed");
					n2.innerHTML = "";
					n2.appendChild(n);
				}
			}

			// Update domain
			if ((n = $(".xl-details-title[href]", details)) !== null) {
				domain = $.get_domain(n.href);
			}

			// Update tags
			if (
				data.tags_ns !== null &&
				(n = $(".xl-details-tags", details)) !== null
			) {
				tagfrag = create_tags(domain, data);
				n.innerHTML = "";
				$.add(n, tagfrag);
			}

			// Reposition any open details
			if (
				(n = gallery_link_events_data.link) !== null &&
				get_node_id_full(n) === full_id
			) {
				update_details_position(details, n, gallery_link_events_data.mouse_x, gallery_link_events_data.mouse_y);
			}
		}._w(133);
		var update_details_position = function (details, link, mouse_x, mouse_y) {
			var w = window,
				de = d.documentElement,
				win_width = (de.clientWidth || w.innerWidth || 0),
				win_height = (de.clientHeight || w.innerHeight || 0),
				rect = details.getBoundingClientRect(),
				link_rect = link.getBoundingClientRect(),
				is_low = (link_rect.top + link_rect.height / 2 >= win_height / 2), // (mouse_y >= win_height / 2)
				offset = 20;

			mouse_x += rect.width * (config.details.hover_position || 0);
			mouse_x = Math.max(1, Math.min(win_width - rect.width - 1, mouse_x));
			mouse_y += is_low ? -(rect.height + offset) : offset;

			details.style.left = mouse_x + "px";
			details.style.top = mouse_y + "px";
		}._w(134);
		var close_actions = function (actions, index) {
			var ns = $$(".xl-site-tag.xl-site-tag-active[xl-actions-index='" + index + "']"),
				i, ii;

			for (i = 0, ii = ns.length; i < ii; ++i) {
				ns[i].classList.remove("xl-site-tag-active");
			}

			actions.classList.add("xl-actions-hidden");
			deactivate_actions(index);
		}._w(135);
		var close_all_actions = function () {
			for (var index in actions_nodes_active) {
				close_actions(actions_nodes_active[index], index);
			}
		}._w(136);
		var update_actions_position = function (actions, tag, tag_bg, de_rect, xpos, ypos) {
			// Position
			var rect = tag_bg.getBoundingClientRect(),
				below, right, x, y;

			// Positioning
			if (xpos === "right") {
				right = true;
			}
			else if (xpos === "left") {
				right = false;
			}
			else {
				right = (rect.left + rect.width / 2 <= (d.documentElement.clientWidth || window.innerWidth || 0) / 2);
				xpos = right ? "right" : "left";
			}

			if (ypos === "below") {
				below = true;
			}
			else if (ypos === "above") {
				below = false;
			}
			else {
				below = (rect.top + rect.height / 2 <= (d.documentElement.clientHeight || window.innerHeight || 0) / 2);
				ypos = below ? "below" : "above";
			}

			// Coordinates
			actions.style.maxWidth = "";
			if (right) {
				x = rect.left - de_rect.left;
			}
			else {
				actions.style.left = "0";
				actions.style.maxWidth = rect.right + "px";
				x = rect.right - actions.getBoundingClientRect().width - de_rect.left;
			}

			actions.style.left = x + "px";
			tag.setAttribute("data-xl-actions-hpos", xpos);
			actions.setAttribute("data-xl-actions-hpos", xpos);

			if (below) {
				y = rect.bottom - de_rect.top - 0.0625;
			}
			else {
				y = rect.top - actions.getBoundingClientRect().height - de_rect.top + 0.0625;
			}

			actions.style.top = y + "px";
			tag.setAttribute("data-xl-actions-vpos", ypos);
			actions.setAttribute("data-xl-actions-vpos", ypos);
		}._w(137);
		var update_active_actions_position = function () {
			var de_rect = d.documentElement.getBoundingClientRect(),
				index, actions, tag, tag_bg, xpos, ypos;

			for (index in actions_nodes_active) {
				actions = actions_nodes_active[index];
				if (
					(tag = $(".xl-site-tag.xl-site-tag-active[xl-actions-index='" + index + "']")) !== null &&
					(tag_bg = $(".xl-site-tag-bg", tag)) !== null
				) {
					xpos = actions.getAttribute("data-xl-actions-hpos");
					ypos = actions.getAttribute("data-xl-actions-vpos");
					update_actions_position(actions, tag, tag_bg, de_rect, xpos, ypos);
				}
			}
		}._w(138);

		var activate_actions = function (node, index) {
			if (config.actions.close_on_click && actions_nodes_active_count !== 0) {
				close_all_actions();
			}

			actions_nodes_active[index] = node;

			if (actions_close_timeout !== null) clearTimeout(actions_close_timeout);
			actions_close_timeout = setTimeout(function () { actions_close_timeout = null; }._w(140), 1);

			if (++actions_nodes_active_count === 1) {
				$.on(window, "resize", on_window_resize);
				$.on(d.documentElement, "click", on_document_click);
			}
		}._w(139);
		var deactivate_actions = function (index) {
			if (actions_nodes_active[index] === undefined) return;

			delete actions_nodes_active[index];
			if (--actions_nodes_active_count === 0) {
				$.off(window, "resize", on_window_resize);
				$.off(d.documentElement, "click", on_document_click);
				if (actions_close_timeout !== null) {
					clearTimeout(actions_close_timeout);
					actions_close_timeout = null;
				}
			}
		}._w(141);
		var on_window_resize = function () {
			update_active_actions_position();
		}._w(142);
		var on_document_click = function (event) {
			if (actions_close_timeout === null) {
				if (config.actions.close_on_click) {
					if ($.is_left_mouse(event)) {
						close_all_actions();
					}
				}
				else {
					// Re-position
					setTimeout(update_active_actions_position, 1);
				}
			}
		}._w(143);
		var on_actions_click = function (event) {
			if ($.is_left_mouse(event)) {
				event.stopPropagation();
			}
		}._w(144);
		var on_actions_link_click = function (actions, index, event) {
			if ($.is_left_mouse(event)) {
				event.stopPropagation();

				if (config.actions.close_on_click) {
					close_actions(actions, index);
				}
			}
		}._w(145);
		var create_tag_bg = function (parent) {
			var tag_bg = $.node("div", "xl-site-tag-bg" + Theme.classes),
				outline = $.node("div", "xl-site-tag-bg-shadow xl-hover-shadow" + Theme.classes),
				inner = $.node("div", "xl-site-tag-bg-inner" + Theme.classes);

			Theme.bg(inner);

			$.add(tag_bg, inner);

			$.before(parent, parent.firstChild, tag_bg);
			$.before(parent, parent.firstChild, outline);

			return tag_bg;
		}._w(146);

		var mark_button_text = function (button, text) {
			if ((button = button_get_inner(button)) !== null) {
				button.textContent = button.textContent.replace(/\]\s*$/, text + "]");
			}
		}._w(147);
		var update_button_text = function (button, domain) {
			if ((button = button_get_inner(button)) !== null) {
				button.textContent = button_text(domain);
			}
		}._w(148);

		// Public
		var create_rating_stars = function (rating) {
			var frag = d.createDocumentFragment(),
				star, tmp, i;

			rating = Math.round(rating * 2);

			for (i = 0; i < 5; ) {
				tmp = $.clamp(rating - (i * 2), 0, 2);
				star = (tmp === 2 ? "full" : (tmp === 1 ? "half" : "none"));
				++i;
				$.add(frag, $.node("div", "xl-star xl-star-" + i + " xl-star-" + star));
			}

			return frag;
		}._w(149);
		var button_get_inner = function (button) {
			return ((button = button.lastChild) !== null && button.tagName === "SPAN") ? button : null;
		}._w(150);
		var button_text = function (domain) {
			var d = domain_info[domain];
			return (d !== undefined ? "[" + d.tag + "]" : "[?]");
		}._w(151);
		var format_date = function (d) {
			return d.getUTCFullYear() + "-" +
				pad(d.getUTCMonth() + 1, "-") +
				pad(d.getUTCDate(), " ") +
				pad(d.getUTCHours(), ":") +
				pad(d.getUTCMinutes(), "");
		}._w(152);

		var setup_link = function (link, url, info) {
			var button = $.link(url, "xl-site-tag" + Theme.classes),
				text = $.node("span", "xl-site-tag-text", button_text(info.domain));

			set_node_id(link, info.site, info.gid);

			$.add(button, text);

			Linkifier.change_link_events(link, "gallery_link");
			Linkifier.change_link_events(button, "gallery_fetch");

			$.before(link.parentNode, link, button);
		}._w(153);
		var format_link = function (link, data, info) {
			var button = get_tag_button_from_link(link),
				domain, fjord, ex, hl, c, n;

			// Smart links
			if (config.general.rewrite_links === "smart" && data.type === "ehentai") {
				ex = ($.get_domain(link.href) === domains.exhentai);
				fjord = API.is_fjording(data);
				if (fjord !== ex) {
					domain = fjord ? domains.exhentai : domains.ehentai;
					link.href = $.change_url_domain(link.href, domain_info[domain].g_domain);
					if (button !== null) {
						button.href = link.href;
						update_button_text(button, domain);
					}
				}
			}

			// Link title
			link.textContent = data.title;
			link.classList.add("xl-link-formatted");

			// Button
			if (button !== null) {
				hl = Filter.check(link, data);
				if (hl[0] !== Filter.None) {
					c = (hl[0] === Filter.Good) ? config.filter.good_tag_marker : config.filter.bad_tag_marker;
					mark_button_text(button, c);
					Filter.highlight_tag(button, link, hl);
				}
				Linkifier.change_link_events(button, "gallery_toggle_actions");
			}

			// Page
			if (info.page !== undefined) {
				n = $.node("span", "xl-link-page", " (page " + info.page + ")");
				link.appendChild(n);
			}
		}._w(154);
		var format_link_error = function (link, error) {
			var text = " (" + error.trim().replace(/\.$/, "") + ")",
				button = get_tag_button_from_link(link),
				n;

			if (button !== null) {
				Linkifier.change_link_events(button, "gallery_error");
				button.classList.add("xl-link-error");
			}

			link.classList.add("xl-link-error");
			n = $(".xl-link-error-message", link);
			if (n === null) {
				$.add(link, $.node("span", "xl-link-error-message", text));
			}
			else {
				n.textContent = text;
			}
		}._w(155);

		var cleanup_post = function (post) {
			var nodes, n, i, ii;
			nodes = $$(".xl-exsauce-results:not(.xl-exsauce-results-hidden)", post);
			for (i = 0, ii = nodes.length; i < ii; ++i) {
				nodes[i].classList.add("xl-exsauce-results-hidden");
			}
			nodes = $$(".xl-actions:not(.xl-actions-hidden)", post);
			for (i = 0, ii = nodes.length; i < ii; ++i) {
				nodes[i].classList.add("xl-actions-hidden");
			}
			nodes = $$(".xl-site-tag[xl-actions-index]", post);
			for (i = 0, ii = nodes.length; i < ii; ++i) {
				n = nodes[i];
				n.classList.remove("xl-site-tag-active");
				n.removeAttribute("xl-actions-index");
			}
		}._w(156);
		var cleanup_post_removed = function (post) {
			var nodes, index, n, i, ii;
			nodes = $$(".xl-site-tag[xl-actions-index]", post);
			for (i = 0, ii = nodes.length; i < ii; ++i) {
				index = nodes[i].getAttribute("xl-actions-index") || "";
				n = actions_nodes[index];
				if (n !== undefined) {
					if (n.parentNode !== null) $.remove(n);
					delete actions_nodes[index];
					deactivate_actions(index);
				}
			}
		}._w(157);

		var init = function () {
			Linkifier.register_link_events({
				gallery_link: gallery_link_events,
				gallery_toggle_actions: gallery_toggle_actions,
				gallery_fetch: gallery_fetch_event,
				gallery_error: gallery_error_event
			});
		}._w(158);

		// Exports
		return {
			setup_link: setup_link,
			format_link: format_link,
			format_link_error: format_link_error,
			create_rating_stars: create_rating_stars,
			button_get_inner: button_get_inner,
			button_text: button_text,
			format_date: format_date,
			cleanup_post: cleanup_post,
			cleanup_post_removed: cleanup_post_removed,
			init: init
		};

	}._w(111))();
	var API = (function () {

		// Caching
		var cache_prefix = "xlinks-cache-",
			cache_storage = window.localStorage,
			cache_objects = {
				md5_to_hash: {},
				url_to_hash: {},
				lookup: {},
				errors: {}
			},
			ttl_1_hour = 60 * 60 * 1000,
			ttl_1_day = 24 * ttl_1_hour,
			ttl_1_year = 365 * ttl_1_day;

		var cache_set = function (key, data, ttl) {
			cache_storage.setItem(cache_prefix + key, JSON.stringify({
				expires: Date.now() + ttl,
				data: data
			}));
		}._w(160);
		var cache_get = function (key) {
			var json = $.json_parse_safe(cache_storage.getItem(cache_prefix + key), null);

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
		}._w(161);
		var cache_set_object = function (object_name) {
			cache_storage.setItem(cache_prefix + object_name, JSON.stringify({
				expires: null,
				data: cache_objects[object_name]
			}));
		}._w(162);
		var cache_get_object = function (object_name) {
			var json = $.json_parse_safe(cache_storage.getItem(cache_prefix + object_name), null),
				obj, target;

			if (
				json !== null &&
				typeof(json) === "object" &&
				(obj = json.data) !== null &&
				typeof(obj) === "object"
			) {
				target = cache_objects[object_name];
				return cache_merge_objects(target, obj);
			}

			cache_storage.removeItem(object_name);
			return false;
		}._w(163);
		var cache_merge_objects = function (dest, obj) {
			var now = Date.now(),
				update = false,
				entry, k;

			for (k in obj) {
				entry = obj[k];
				if (now < entry.expires) {
					dest[k] = entry;
				}
				else {
					update = true;
				}
			}

			return update;
		}._w(164);
		var cache_cleanup = function () {
			var storage = cache_storage,
				removes = [],
				time = Date.now(),
				key, json, i, ii;

			for (i = 0, ii = storage.length; i < ii; ++i) {
				key = storage.key(i);
				if (key.length >= cache_prefix.length && key.substr(0, cache_prefix.length) === cache_prefix) {
					json = $.json_parse_safe(storage.getItem(key), null);
					if (json === null || typeof(json) !== "object") {
						// Invalid
						removes.push(key);
					}
					else if (json.expires !== null && !(time < json.expires)) { // jshint ignore:line
						// This should also cover undefined values
						removes.push(key);
					}
				}
			}

			for (i = 0, ii = removes.length; i < ii; ++i) {
				storage.removeItem(removes[i]);
			}

			return ii;
		}._w(165);
		var cache_clear = function () {
			var storage_types = [ window.localStorage, window.sessionStorage ],
				removes = [],
				count = 0,
				storage, key, i, ii, j, jj;

			for (i = 0, ii = storage_types.length; i < ii; ++i) {
				storage = storage_types[i];

				for (j = 0, jj = storage.length; j < jj; ++j) {
					key = storage.key(j);
					if (key.length >= cache_prefix.length && key.substr(0, cache_prefix.length) === cache_prefix) {
						removes.push(key);
					}
				}

				for (j = 0, jj = removes.length; j < jj; ++j) {
					storage.removeItem(removes[j]);
				}
				count += jj;
			}

			return count;
		}._w(166);
		var cache_init = function () {
			// Cache mode
			if (config.debug.cache_mode === "none") {
				cache_storage = (function () {
					var data = {};

					var fn = {
						length: 0,
						key: function (index) {
							return Object.keys(data)[index];
						}._w(169),
						getItem: function (key) {
							if (Object.prototype.hasOwnProperty.call(data, key)) {
								return data[key];
							}
							return null;
						}._w(170),
						setItem: function (key, value) {
							if (!Object.prototype.hasOwnProperty.call(data, key)) {
								++fn.length;
							}
							data[key] = value;
						}._w(171),
						removeItem: function (key) {
							if (Object.prototype.hasOwnProperty.call(data, key)) {
								delete data[key];
								--fn.length;
							}
						}._w(172),
						clear: function () {
							data = {};
							fn.length = 0;
						}._w(173)
					};
					return fn;
				}._w(168))();
			}
			else if (config.debug.cache_mode === "session") {
				cache_storage = window.sessionStorage;
			}

			// Clean
			cache_cleanup();

			// Load
			var k;
			for (k in cache_objects) {
				if (cache_get_object(k)) {
					cache_set_object(k);
				}
			}
		}._w(167);



		// Databasing
		var saved_data = {};
		var saved_thumbnails = {};

		var get_saved_data = function (namespace, gid) {
			var id_full = namespace + "-" + gid,
				data = saved_data[id_full];

			if (data !== undefined) return data;

			data = cache_get("data-" + id_full);
			if (data !== null) {
				saved_data[id_full] = data;
				return data;
			}

			return null;
		}._w(174);
		var set_saved_data = function (data) {
			var id_full = data.type + "-" + data.gid;
			saved_data[id_full] = data;
			cache_set("data-" + id_full, data, ttl_1_hour * (data.upload_date >= Date.now() - ttl_1_day ? 1 : 12));
		}._w(175);
		var set_saved_error = function (id_list, error, cache) {
			var id = id_list.join("-");
			cache_objects.errors[id] = {
				expires: (cache ? Date.now() + ttl_1_hour * 12 : 0),
				data: error
			};

			if (cache) {
				cache_set_object("errors");
			}
		}._w(176);
		var get_saved_error = function (id_list) {
			var id = id_list.join("-"),
				value = cache_objects.errors[id];

			return (value !== undefined) ? value.data : null;
		}._w(177);
		var get_saved_thumbnail = function (namespace, gid, page) {
			var id_full = namespace + "-" + gid + "-" + page,
				data = saved_thumbnails[id_full];

			if (data !== undefined) return data;

			data = cache_get("thumb-" + id_full);
			if (data !== null) {
				saved_thumbnails[id_full] = data;
				return data;
			}

			return null;
		}._w(178);
		var set_saved_thumbnail = function (namespace, gid, page, data) {
			var id_full = namespace + "-" + gid + "-" + page;
			saved_thumbnails[id_full] = data;
			cache_set("thumb-" + id_full, data, ttl_1_hour * 6);
		}._w(179);

		var hash_get_sha1_from_md5 = function (md5) {
			var value = cache_objects.md5_to_hash[md5];
			return (value !== undefined) ? value.data : null;
		}._w(180);
		var hash_get_sha1_from_url = function (url) {
			var value = cache_objects.url_to_hash[url];
			return (value !== undefined) ? value.data : null;
		}._w(181);
		var hash_set_md5_to_sha1 = function (md5, sha1) {
			cache_objects.md5_to_hash[md5] = {
				expires: Date.now() + ttl_1_year,
				data: sha1
			};

			cache_set_object("md5_to_hash");
		}._w(182);
		var hash_set_url_to_sha1 = function (url, sha1) {
			cache_objects.url_to_hash[url] = {
				expires: Date.now() + ttl_1_day,
				data: sha1
			};

			cache_set_object("url_to_hash");
		}._w(183);

		var lookup_get_results = function (hash) {
			var value = cache_objects.lookup[hash];
			return (value !== undefined) ? value.data : null;
		}._w(184);
		var lookup_set_results = function (data) {
			cache_objects.lookup[data.hash] = {
				expires: Date.now() + ttl_1_day,
				data: data
			};

			cache_set_object("lookup");
		}._w(185);



		// Categories
		var categories = {
			artistcg:  { sort: 0,  short_name: "artistcg",  name: "Artist CG" },
			asianporn: { sort: 1,  short_name: "asianporn", name: "Asian Porn" },
			cosplay:   { sort: 2,  short_name: "cosplay",   name: "Cosplay" },
			doujinshi: { sort: 3,  short_name: "doujinshi", name: "Doujinshi" },
			gamecg:    { sort: 4,  short_name: "gamecg",    name: "Game CG" },
			imageset:  { sort: 5,  short_name: "imageset",  name: "Image Set" },
			manga:     { sort: 6,  short_name: "manga",     name: "Manga" },
			misc:      { sort: 7,  short_name: "misc",      name: "Misc" },
			non_h:     { sort: 8,  short_name: "non-h",     name: "Non-H" },
			"private": { sort: 9,  short_name: "private",   name: "Private" },
			western:   { sort: 10, short_name: "western",   name: "Western" }
		};
		var ehentai_category_mapping = {
			"artist cg sets": "artistcg",
			"asian porn": "asianporn",
			"cosplay": "cosplay",
			"doujinshi": "doujinshi",
			"game cg sets": "gamecg",
			"image sets": "imageset",
			"manga": "manga",
			"misc": "misc",
			"non-h": "non_h",
			"private": "private",
			"western": "western"
		};
		var nhentai_category_mapping = {
			"doujinshi": "doujinshi",
			"manga": "manga"
		};
		var hitomi_category_mapping = {
			"doujinshi": "doujinshi",
			"manga": "manga",
			"artist cg": "artistcg",
			"game cg": "gamecg"
		};

		var normalize_category = function (mapping, category) {
			var t = mapping[category.toLowerCase()];
			return (t !== undefined ? t : "misc");
		}._w(186);

		var get_category = function (name) {
			var c = categories[name];
			return (c !== undefined) ? c : categories.misc;
		}._w(187);
		var get_category_sort_rank = function (name) {
			var c = categories[name];
			return (c !== undefined) ? c.sort : Object.keys(categories).length;
		}._w(188);



		// Private
		var temp_div = $.node_simple("div"),
			nhentai_tag_namespaces = {
				parodies: "parody",
				characters: "character",
				artists: "artist",
				groups: "group"
			};

		var Flags = {
			None: 0x0,
			ThumbnailNoLeech: 0x1
		};

		var create_empty_gallery_info = function (type) {
			return {
				type: type,
				gid: 0,
				token: null,
				title: "",
				title_jpn: null,
				uploader: "",
				category: "misc",
				thumbnail: null,

				flags: 0,
				upload_date: 0,
				file_count: 0,
				total_size: -1,
				favorites: -1,
				rating: -1,
				torrent_count: -1,

				full: false,
				visible: null,
				removed: null,
				archiver_key: null,

				tags: null,
				tags_ns: null
			};
		}._w(189);
		var uint8_array_to_url = function (data, mime) {
			try {
				var blob = new Blob([ data ], { type: mime });
				return window.URL.createObjectURL(blob) || null;
			}
			catch (e) {}
			return null;
		}._w(190);
		var header_string_parse = function (header_str) {
			var lines = header_str.split("\r\n"),
				re_line = /^([^:]*):\s(.*)$/i,
				headers = {},
				i, m;

			for (i = 0; i < lines.length; ++i) {
				if ((m = re_line.exec(lines[i]))) {
					headers[m[1].toLowerCase()] = m[2];
				}
			}

			return headers;
		}._w(191);

		var ehentai_simple_string = function (value, default_value) {
			return (typeof(value) !== "string" || value.length === 0) ? default_value : value;
		}._w(192);
		var ehentai_normalize_string = function (value, default_value) {
			if (typeof(value) !== "string" || value.length === 0) {
				return default_value;
			}
			temp_div.innerHTML = value;
			value = temp_div.textContent;
			temp_div.textContent = "";
			return value;
		}._w(193);
		var ehentai_normalize_info = function (info) {
			if (info.error !== undefined) {
				return { error: info.error };
			}

			var data = create_empty_gallery_info("ehentai"),
				t;

			data.gid = parseInt(info.gid, 10) || 0;
			data.token = ehentai_simple_string(info.token, null);
			data.archiver_key = ehentai_simple_string(info.archiver_key, null);
			data.title = ehentai_normalize_string(info.title, "");
			data.title_jpn = ehentai_normalize_string(info.title_jpn, null);
			data.uploader = ehentai_normalize_string(info.uploader, null);
			data.category = normalize_category(ehentai_category_mapping, ehentai_simple_string(info.category, ""));
			data.thumbnail = ehentai_simple_string(info.thumb, null);
			data.upload_date = (parseInt(info.posted, 10) || 0) * 1000;
			data.file_count = parseInt(info.filecount, 10) || 0;
			data.total_size = parseInt(info.filesize, 10) || 0;
			data.rating = parseFloat(info.rating) || 0.0;
			data.torrent_count = parseInt(info.torrentcount, 10) || 0;
			data.visible = !info.expunged;
			t = info.tags;
			data.tags = Array.isArray(t) ? t : [];

			return data;
		}._w(194);

		var ehentai_is_not_available = function (html) {
			var n;
			return (
				(n = $("title", html)) !== null &&
				/^\s*Gallery\s+Not\s+Available/i.test(n.textContent) &&
				$("#continue", html) !== null
			);
		}._w(195);
		var ehentai_is_content_warning = function (html) {
			var n;
			return (
				(n = $("h1", html)) !== null &&
				/^\s*Content\s+Warning/i.test(n.textContent)
			);
		}._w(196);
		var ehentai_parse_gallery_info = function (html, data) {
			// Tags
			var updated_tag_count = 0,
				tags, tags_array, pattern, par, tds, namespace, ns, i, ii, j, jj, m, n, t;

			tags = {};
			tags_array = [];
			pattern = /(.+):/;

			data.removed = false;

			par = $$("#taglist tr", html);
			for (i = 0, ii = par.length; i < ii; ++i) {
				// Class
				tds = $$("td", par[i]);
				jj = tds.length;
				if (jj === 0) continue;

				// Namespace
				namespace = ((m = pattern.exec(tds[0].textContent)) ? m[1].trim() : "");
				if (!(namespace in tags)) {
					ns = [];
					tags[namespace] = ns;
				}
				else {
					ns = tags[namespace];
				}

				// Tags
				tds = $$("div", tds[jj - 1]);
				for (j = 0, jj = tds.length; j < jj; ++j) {
					// Create tag
					if ((n = $("a", tds[j])) !== null) {
						// Add tag
						t = n.textContent.trim();
						ns.push(t);
						tags_array.push(t);
					}
				}

				// Remove if empty
				if (ns.length === 0) {
					delete tags[namespace];
				}
				else {
					++updated_tag_count;
				}
			}

			if (tags_array.length > 0) {
				data.tags = tags_array;
				data.tags_ns = tags;
			}

			// Done
			data.full = true;
			return data;
		}._w(197);
		var ehentai_make_removed = function (data) {
			data.removed = true;
			data.full = true;
			return data;
		}._w(198);

		var ehentai_parse_lookup_results = function (xhr, is_similarity_scan, hash, url, md5) {
			var final_url = xhr.finalUrl,
				text = xhr.responseText,
				err = null,
				html, results, links, link, m, n, i, ii;

			// Similarity scan checking
			if (is_similarity_scan) {
				m = /f_shash=(([0-9a-f]{40}|corrupt)(?:;(?:[0-9a-f]{40}|monotone))*)/.exec(final_url);
				if (m !== null && m[2] !== "corrupt") {
					hash = m[1];
					if (/monotone/.test(hash)) {
						err = "Similarity lookup does not work on monotone images";
					}
				}
				else {
					if (/please\s+wait\s+a\s+bit\s+longer\s+between\s+each\s+file\s+search/i.test(text)) {
						err = "Wait longer between lookups";
					}
					else {
						Debug.log("An error occured while reverse image searching", xhr);
						err = "Unknown error";
						html = $.html_parse_safe(text, null);
						if (html !== null) {
							n = $("#iw", html);
							if (n !== null) err = n.textContent.trim();
						}
					}
				}

				if (err !== null) return { error: err };

				// Save hash
				if (md5 === null) {
					hash_set_url_to_sha1(url, hash);
				}
				else {
					hash_set_md5_to_sha1(md5, hash);
				}
			}

			// Get html
			html = $.html_parse_safe(text, null);

			// Process
			results = [];
			links = $$("div.it5 a,div.id2 a", html);
			for (i = 0, ii = links.length; i < ii; ++i) {
				link = links[i];
				results.push({
					url: link.href,
					title: link.textContent
				});
			}

			// Done
			return {
				url: final_url,
				hash: hash,
				results: results
			};
		}._w(199);
		var ehentai_create_lookup_url = function (sha1) {
			var url = "http://",
				di = domain_info[config.sauce.lookup_domain];
			url += (di === undefined ? "" : di.g_domain);
			url += "/?f_doujinshi=1&f_manga=1&f_artistcg=1&f_gamecg=1&f_western=1&f_non-h=1&f_imageset=1&f_cosplay=1&f_asianporn=1&f_misc=1&f_search=Search+Keywords&f_apply=Apply+Filter&f_shash=";
			url += sha1;
			url += "&fs_similar=0";
			if (config.sauce.expunged) url += "&fs_exp=1";
			return url;
		}._w(200);

		var nhentai_normalize_tag_namespace = function (namespace) {
			return nhentai_tag_namespaces[namespace] || namespace;
		}._w(201);
		var nhentai_parse_info = function (html, url) {
			var info = $("#info", html),
				data, nodes, tags, tag_ns, tag_ns_list, t, m, n, i, ii, j, jj;

			if (info === null) {
				return { error: "Could not find info" };
			}

			// Create data
			data = create_empty_gallery_info("nhentai");
			data.uploader = "nhentai.net";
			data.full = true;
			data.tags = [];
			data.tags_ns = {};

			// Image/gid
			if ((n = $("#cover>a", html)) !== null) {
				m = /\/g\/(\d+)/.exec(n.getAttribute("href") || "");
				if (m !== null) {
					data.gid = parseInt(m[1], 10);
				}

				if (
					(n = $("img", n)) !== null &&
					(t = n.getAttribute("src"))
				) {
					data.thumbnail = $.resolve(t, url);
				}
			}

			// Image count
			data.file_count = $$("#thumbnail-container>.thumb-container", html).length;

			// Titles
			if ((n = $("h1", info)) !== null) {
				data.title = n.textContent.trim();
			}
			if ((n = $("h2", info)) !== null) {
				data.title_jpn = n.textContent.trim();
			}

			// Tags
			if ((nodes = $$(".field-name", info)).length > 0) {
				for (i = 0, ii = nodes.length; i < ii; ++i) {
					tag_ns = nhentai_normalize_tag_namespace((
						(n = nodes[i].firstChild) !== null &&
						n.nodeType === Node.TEXT_NODE
					) ? n.nodeValue.trim().replace(/:/, "").toLowerCase() : "");

					tags = $$(".tag", nodes[i]);

					if (tag_ns === "category") {
						if (
							tags.length > 0 &&
							(n = tags[0].firstChild) !== null &&
							n.nodeType === Node.TEXT_NODE
						) {
							data.category = normalize_category(nhentai_category_mapping, n.nodeValue.trim());
						}
						tags = [];
					}

					if (tags.length > 0) {
						if (tag_ns in data.tags_ns) {
							tag_ns_list = data.tags_ns[tag_ns];
						}
						else {
							tag_ns_list = [];
							data.tags_ns[tag_ns] = tag_ns_list;
						}

						for (j = 0, jj = tags.length; j < jj; ++j) {
							if (
								(n = tags[j].firstChild) !== null &&
								n.nodeType === Node.TEXT_NODE
							) {
								// Add tag
								t = n.nodeValue.trim();
								tag_ns_list.push(t);
								data.tags.push(t);
							}
						}
					}
				}
			}

			// Date
			if ((n = $("time[datetime]", info)) !== null) {
				m = /^(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)\.(\d{6})/i.exec(n.getAttribute("datetime") || "");
				if (m !== null) {
					data.upload_date = new Date(
						parseInt(m[1], 10),
						parseInt(m[2], 10) - 1,
						parseInt(m[3], 10),
						parseInt(m[4], 10),
						parseInt(m[5], 10),
						parseInt(m[6], 10),
						Math.floor(parseInt(m[7], 10) / 1000)
					).getTime();
				}
			}

			// Favorite count
			if ((n = $(".buttons>.btn.btn-primary>span>.nobold", info)) !== null) {
				m = /\d+/.exec(n.textContent);
				if (m !== null) {
					data.favorites = parseInt(m[0], 10);
				}
			}

			return data;
		}._w(202);

		var hitomi_parse_info = function (html, url) {
			var info = $(".content", html),
				cellmap = {},
				re_gender = /\s*(\u2640|\u2642)$/, // \u2640 = female, \u2642 = male
				tags_full, tags, tag_list, info2, data, nodes, cells, t, m, n, i, ii, j;

			if (
				info === null ||
				(info2 = $(".gallery", info)) === null
			) {
				return { error: "Could not find info" };
			}

			// Create data
			data = create_empty_gallery_info("hitomi");
			data.flags |= Flags.ThumbnailNoLeech; // no cross origin thumbnails
			data.uploader = "hitomi.la";
			data.full = true;
			data.tags = tags = [];
			data.tags_ns = tags_full = {};

			// Image/gid
			if ((n = $(".cover>a", html)) !== null) {
				m = /\/reader\/(\d+)/.exec(n.getAttribute("href") || "");
				if (m !== null) {
					data.gid = parseInt(m[1], 10);
				}

				if (
					(n = $("img", n)) !== null &&
					(t = n.getAttribute("src"))
				) {
					data.thumbnail = $.resolve(t, url);
				}
			}

			// Image count
			data.file_count = $$(".thumbnail-list>li", html).length;

			// Title
			if ((n = $("h1", info2)) !== null) {
				data.title = n.textContent.trim();
			}

			// Cell info
			cells = $$(".gallery-info>table td", info2);
			for (i = 0; i < cells.length; i += 2) {
				cellmap[cells[i].textContent.trim().toLowerCase()] = cells[i + 1];
			}

			// Language
			if ((n = cellmap.language) !== undefined) {
				t = n.textContent.trim();
				if (t.length > 0 && t !== "N/A") {
					tags_full.language = [ t ];
					tags.push(t);
				}
			}

			// Parody
			if ((n = cellmap.series) !== undefined) {
				t = n.textContent.trim();
				if (t.length > 0 && t !== "N/A") {
					tags_full.parody = [ t ];
					tags.push(t);
				}
			}

			// Character
			if ((n = cellmap.characters) !== undefined) {
				if ((nodes = $$("li>a", n)).length > 0) {
					tag_list = [];

					for (i = 0, ii = nodes.length; i < ii; ++i) {
						t = nodes[i].textContent.trim();
						if (t.length > 0) {
							tag_list.push(t);
							tags.push(t);
						}
					}

					if (tag_list.length > 0) {
						tags_full.character = tag_list;
					}
				}
			}

			// Group
			if ((n = cellmap.group) !== undefined) {
				t = n.textContent.trim();
				if (t.length > 0 && t !== "N/A") {
					tags_full.group = [ t ];
					tags.push(t);
				}
			}

			// Artists
			if ((nodes = $$("h2>ul>li>a", info2)).length > 0) {
				tag_list = [];

				for (i = 0, ii = nodes.length; i < ii; ++i) {
					t = nodes[i].textContent.trim();
					if (t.length > 0) {
						tag_list.push(t);
						tags.push(t);
					}
				}

				if (tag_list.length > 0) {
					tags_full.artist = tag_list;
				}
			}

			// Type
			if ((n = cellmap.type) !== undefined) {
				t = n.textContent.trim();
				if (t.length > 0 && t !== "N/A") {
					data.category = normalize_category(hitomi_category_mapping, t);
				}
			}

			// Tags
			if ((n = cellmap.tags) !== undefined) {
				if ((nodes = $$("li>a", n)).length > 0) {
					tag_list = [ [], [], [] ]; // male, female, tags

					for (i = 0, ii = nodes.length; i < ii; ++i) {
						t = nodes[i].textContent.trim();
						if (t.length > 0) {
							if ((m = re_gender.exec(t)) === null) {
								j = 2;
							}
							else if (m[1] === "\u2640") { // female
								t = t.substr(0, m.index);
								j = 1;
							}
							else { // male
								t = t.substr(0, m.index);
								j = 0;
							}
							tag_list[j].push(t);
						}
					}

					if (tag_list[0].length > 0) {
						Array.prototype.push.apply(tags, tag_list[0]);
						tags_full.male = tag_list[0];
					}
					if (tag_list[1].length > 0) {
						Array.prototype.push.apply(tags, tag_list[1]);
						tags_full.female = tag_list[1];
					}
					if (tag_list[2].length > 0) {
						Array.prototype.push.apply(tags, tag_list[2]);
						tags_full.tags = tag_list[2];
					}
				}
			}

			// Date
			if ((n = $(".date", info)) !== null) {
				m = /^(\d+)-(\d+)-(\d+)\s+(\d+):(\d+):(\d+)/i.exec(n.textContent.trim());
				if (m !== null) {
					data.upload_date = new Date(
						parseInt(m[1], 10),
						parseInt(m[2], 10) - 1,
						parseInt(m[3], 10),
						parseInt(m[4], 10),
						parseInt(m[5], 10),
						parseInt(m[6], 10),
						0
					).getTime();
				}
			}

			return data;
		}._w(203);


		var get_image = function (url, callback, progress_callback) {
			// Note that the Uint8Array's length is longer than image_length
			// callback(err, image_data, image_length);
			var xhr_data = {
				method: "GET",
				url: url,
				overrideMimeType: "text/plain; charset=x-user-defined",
				onload: function (xhr) {
					if (xhr.status === 200) {
						var text = xhr.responseText,
							ta = new Uint8Array(text.length + 1),
							content_type = header_string_parse(xhr.responseHeaders)["content-type"] || "text/plain",
							i, ii;

						for (i = 0, ii = text.length; i < ii; ++i) {
							ta[i] = text.charCodeAt(i);
						}

						callback.call(null, null, ta, ii, content_type, xhr.finalUrl);
					}
					else {
						callback.call(null, "Response error " + xhr.status, null, 0, null, null);
					}
				}._w(205),
				onerror: function () {
					callback.call(null, "Connection error", null, 0, null, null);
				}._w(206),
				onabort: function () {
					callback.call(null, "Connection aborted", null, 0, null, null);
				}._w(207)
			};

			if (progress_callback !== undefined) {
				xhr_data.onprogress = function (xhr) {
					progress_callback.call(null, "progress", xhr.lengthComputable, xhr.loaded, xhr.total);
				}._w(208);
			}

			HttpRequest(xhr_data);
		}._w(204);
		var get_sha1_hash = function (url, md5, callback) {
			var sha1 = null;

			if (md5 !== null) {
				sha1 = hash_get_sha1_from_md5(md5);
				if (sha1 === null) {
					sha1 = hash_get_sha1_from_url(url);
				}
			}
			else {
				sha1 = hash_get_sha1_from_url(url);
			}

			if (callback === undefined) {
				return sha1;
			}

			if (sha1 !== null) {
				callback.call(null, null, sha1);
			}
			else {
				get_image(url, function (err, data) {
					if (err === null) {
						var sha1 = SHA1.hash(data, data.length - 1);

						if (md5 === null) {
							hash_set_url_to_sha1(url, sha1);
						}
						else {
							hash_set_md5_to_sha1(md5, sha1);
						}

						callback.call(null, null, sha1);
					}
					else {
						callback.call(null, err, null);
					}
				}._w(210));
			}

			return null;
		}._w(209);



		// API request base code
		var request_groups = {};
		var RequestGroup = function () {
			this.active = 0;
			this.timeout = null;
			this.types = [];
		}._w(211);
		var RequestType = function (count, concurrent, delay_okay, delay_error, group_name, namespace, type) {
			this.count = count;
			this.concurrent = concurrent;
			this.delay_okay = delay_okay;
			this.delay_error = delay_error;
			this.queue = [];
			this.unique = {};

			this.group = request_groups[group_name];
			if (this.group === undefined) {
				request_groups[group_name] = this.group = new RequestGroup();
			}
			this.group.types.push(this);

			this.namespace = namespace;
			this.type = type;

			this.retry_data = {
				count: 0,
				delay: 0
			};

			this.request_init = null;
			this.request_complete = null;

			this.delay_modify = null;
			this.error_mode = null;
			this.get_data = null;
			this.set_data = null;
			this.setup_xhr = null;
			this.parse_response = null;
		}._w(212);
		var RequestData = function (id, info, callback, progress_callback) {
			this.id = id;
			this.info = info;
			this.callbacks = [ callback ];
			this.progress_callbacks = [];
			if (progress_callback !== undefined) this.progress_callbacks.push(progress_callback);
		}._w(213);
		var Request = function (type, entries) {
			var self = this,
				delay_modify = type.delay_modify,
				cbs, i, ii;

			this.data = null;
			this.type = type;
			this.retry_count = 0;
			this.delay = 0;
			this.entries = entries;
			this.infos = [];
			this.progress_callbacks = null;

			for (i = 0, ii = entries.length; i < ii; ++i) {
				this.infos.push(entries[i].info);

				cbs = entries[i].progress_callbacks;
				if (cbs.length > 0) {
					if (this.progress_callbacks === null) {
						this.progress_callbacks = cbs.slice(0);
					}
					else {
						$.push_many(this.progress_callbacks, cbs);
					}
				}
			}

			this.complete = (delay_modify === null) ?
				function () {
					if (type.request_complete !== null) {
						type.request_complete.call(type, self);
					}
					type.group.complete(self.delay);
				}._w(215) :
				function () {
					delay_modify.call(self, function (err, delay) {
						if (type.request_complete !== null) {
							type.request_complete.call(type, self);
						}
						type.group.complete(err === null ? delay : self.delay);
					}._w(217));
				}._w(216);
		}._w(214);
		var RequestErrorMode = {
			None: 0,
			NoCache: 1,
			Save: 2
		};

		RequestGroup.prototype.run_delay = function (type) {
			setTimeout(function () {
				type.run();
			}._w(219), 1);
		}._w(218);
		RequestGroup.prototype.run = function (use_delay) {
			var type, i, ii;
			for (i = 0, ii = this.types.length; i < ii; ++i) {
				type = this.types[i];
				while (true) {
					if (this.active >= type.concurrent) return;
					if (type.queue.length === 0) break;
					++this.active;

					if (use_delay && type.count > 1) {
						this.run_delay(type);
					}
					else {
						type.run();
					}
				}
			}
		}._w(220);
		RequestGroup.prototype.complete = function (delay) {
			if (delay > 0) {
				var self = this;
				setTimeout(function () {
					--self.active;
					self.run(false);
				}._w(222), delay);
			}
			else {
				--this.active;
				this.run(false);
			}
		}._w(221);

		RequestType.prototype.add = function (unique_id, info, quick, callback, progress_callback) {
			var self = this;

			var get_data_callback = function (err, data) {
				var u;

				if (data !== null) {
					if (progress_callback !== undefined) progress_callback.call(null, "start");
					callback.call(null, null, data);
					return;
				}

				if (quick) err = "Not found";

				if (
					err !== null ||
					(err = get_saved_error([ self.namespace, self.type, unique_id ])) !== null
				) {
					if (progress_callback !== undefined) progress_callback.call(null, "start");
					callback.call(null, err, null);
					return;
				}

				// Add
				u = self.unique[unique_id];
				if (u === undefined) {
					u = new RequestData(unique_id, info, callback, progress_callback);
					self.unique[unique_id] = u;
					self.queue.push(u);
				}
				else {
					u.callbacks.push(callback);
					if (progress_callback !== undefined) u.progress_callbacks.push(progress_callback);
				}

				// Run (if not already running)
				self.group.run(true);
			}._w(224);

			if (this.get_data === null) {
				get_data_callback(null, null);
			}
			else {
				this.get_data.call(null, info, get_data_callback);
			}
		}._w(223);
		RequestType.prototype.run = function () {
			var req = new Request(this, this.queue.splice(0, this.count));
			if (this.request_init !== null) {
				this.request_init.call(this, req);
			}
			req.run();
		}._w(225);

		Request.prototype.run = function () {
			var i, ii, ev;

			if (this.progress_callbacks !== null) {
				ev = (this.retry_count === 0) ? "start" : "retry";
				for (i = 0, ii = this.progress_callbacks.length; i < ii; ++i) {
					this.progress_callbacks[i].call(this, ev);
				}
			}

			this.type.setup_xhr.call(this, $.bind(this.on_xhr_setup, this));
		}._w(226);
		Request.prototype.process_response = function (err, response) {
			var self = this,
				total = this.infos.length,
				responses = Math.min(response.length, total),
				error_mode = this.type.error_mode,
				set_data = this.type.set_data,
				complete = 0,
				default_mode = RequestErrorMode.NoCache,
				data = null,
				entry, i;

			// Save
			var save_callback = function () {
				for (var i = 0, ii = entry.callbacks.length; i < ii; ++i) {
					entry.callbacks[i].call(self, err, data);
				}

				if (++complete >= total) self.complete();
			}._w(228);

			// Error saving
			var save_error = (error_mode === null) ?
				function () {
					set_saved_error(
						[ self.type.namespace, self.type.type, entry.id ],
						err,
						(default_mode === RequestErrorMode.Save)
					);

					save_callback();
				}._w(229) :
				function () {
					error_mode.call(self, function (err2, mode) {
						if (err2 !== null) mode = default_mode;

						set_saved_error(
							[ self.type.namespace, self.type.type, entry.id ],
							err,
							(mode === RequestErrorMode.Save)
						);

						save_callback();
					}._w(231));
				}._w(230);

			// Save errors
			for (i = responses; i < total; ++i) {
				entry = this.entries[i];
				save_error();
			}

			// Save datas
			default_mode = RequestErrorMode.Save;
			for (i = 0; i < responses; ++i) {
				data = response[i];
				entry = this.entries[i];
				if ((err = data.error) !== undefined) {
					save_error();
				}
				else {
					err = null;
					if (set_data !== null) {
						set_data.call(this, data, entry.info, save_callback);
					}
					else {
						save_callback();
					}
				}
			}
		}._w(227);
		Request.prototype.complete_entries = function () {
			var unique = this.type.unique;
			for (var i = 0, ii = this.entries.length; i < ii; ++i) {
				delete unique[this.entries[i].id];
			}
		}._w(232);
		Request.prototype.xhr_error = function (err) {
			var self = this;
			return function () {
				self.delay = self.type.delay_error;
				self.complete_entries();
				self.process_response(err, []);
			}._w(234);
		}._w(233);
		Request.prototype.on_xhr_setup = function (err, xhr_data) {
			var self = this,
				i, ii, ev;

			// Error
			if (err !== null) {
				this.xhr_error(err)();
				return;
			}

			// Load handler
			xhr_data.onload = function (xhr) {
				if (xhr.status === 200) {
					self.type.parse_response.call(self, xhr, function (err, response) {
						self.on_response_parse(err, response);
					}._w(237));
				}
				else {
					self.xhr_error("Response error " + xhr.status)();
				}
			}._w(236);

			// Error handlers
			xhr_data.onerror = this.xhr_error("Connection error");
			xhr_data.onabort = this.xhr_error("Connection aborted");

			if (xhr_data.data !== undefined) {
				xhr_data.upload = {
					onerror: this.xhr_error("Upload connection error"),
					onabort: this.xhr_error("Upload connection aborted")
				};
			}

			// Progress handlers
			if (this.progress_callbacks !== null) {
				xhr_data.onprogress = function (xhr) {
					for (var i = 0, ii = self.progress_callbacks.length; i < ii; ++i) {
						self.progress_callbacks[i].call(self, "progress", xhr.lengthComputable, xhr.loaded, xhr.total);
					}
				}._w(238);

				if (xhr_data.data !== undefined) {
					ev = "upload";
					xhr_data.upload.onprogress = xhr_data.onprogress;
					xhr_data.upload.onload = function () {
						for (var i = 0, ii = self.progress_callbacks.length; i < ii; ++i) {
							self.progress_callbacks[i].call(self, "download");
						}
					}._w(239);
				}
				else {
					ev = "download";
				}

				for (i = 0, ii = this.progress_callbacks.length; i < ii; ++i) {
					this.progress_callbacks[i].call(this, ev);
				}
				ev = null;
			}

			// Start
			HttpRequest(xhr_data);
			xhr_data = null;
		}._w(235);
		Request.prototype.on_response_parse = function (err, response, delay) {
			if (err !== null) {
				// Error
				this.delay = this.type.delay_error;
				this.complete_entries();
				this.process_response(err, []);
			}
			else if (response === null) {
				// Retry
				++this.retry_count;
				if (delay > 0) {
					var self = this;
					setTimeout(function () { self.run(); }._w(241), delay);
				}
				else {
					this.run();
				}
			}
			else {
				// Process
				this.delay = this.type.delay_okay;
				this.complete_entries();
				this.process_response("Data not found", response);
			}
		}._w(240);


		// API request specializations
		var rt_ehentai_gallery_page = new RequestType(25, 1, 200, 5000, "ehentai_api", "ehentai", "page"),
			rt_ehentai_gallery = new RequestType(25, 1, 200, 5000, "ehentai_api", "ehentai", "gallery"),
			rt_ehentai_gallery_full = new RequestType(1, 1, 200, 5000, "ehentai_full", "ehentai", "full"),
			rt_ehentai_gallery_page_thumb = new RequestType(1, 1, 200, 5000, "ehentai_full", "ehentai", "page_thumb"),
			rt_ehentai_lookup = new RequestType(1, 1, 3000, 5000, "ehentai_lookup", "ehentai", "lookup"),
			rt_nhentai_gallery = new RequestType(1, 1, 200, 5000, "nhentai", "nhentai", "gallery"),
			rt_nhentai_gallery_page_thumb = new RequestType(1, 1, 200, 5000, "nhentai", "nhentai", "page_thumb"),
			rt_hitomi_gallery = new RequestType(1, 1, 200, 5000, "hitomi", "hitomi", "gallery"),
			rt_hitomi_gallery_page_thumb = new RequestType(1, 1, 200, 5000, "hitomi", "hitomi", "page_thumb");

		rt_ehentai_gallery.get_data = function (info, callback) {
			var data = get_saved_data("ehentai", info[0]);
			callback(null, (data !== null && data.token === info[1]) ? data : null);
		}._w(242);
		rt_ehentai_gallery.set_data = function (data, info, callback) {
			set_saved_data(data);
			callback(null);
		}._w(243);
		rt_ehentai_gallery.setup_xhr = function (callback) {
			var gidlist = [],
				i, ii;

			for (i = 0, ii = this.infos.length; i < ii; ++i) {
				gidlist.push(this.infos[i]);
			}

			callback(null, {
				method: "POST",
				url: "http://" + domains.gehentai + "/api.php",
				headers: { "Content-Type": "application/json" },
				data: JSON.stringify({
					method: "gdata",
					gidlist: gidlist
				})
			});
		}._w(244);
		rt_ehentai_gallery.parse_response = function (xhr, callback) {
			var response = $.json_parse_safe(xhr.responseText, null),
				datas, i, ii;

			if (response !== null) {
				if (typeof(response) === "object") {
					if (typeof(response.error) === "string") {
						callback(response.error);
						return;
					}
					else if (Array.isArray(response.gmetadata)) {
						response = response.gmetadata;
						datas = [];
						for (i = 0, ii = response.length; i < ii; ++i) {
							datas.push(ehentai_normalize_info(response[i]));
						}
						callback(null, datas);
						return;
					}
				}
				else if (typeof(response) === "string") {
					callback(response);
					return;
				}
			}
			return "Invalid response";
		}._w(245);

		rt_ehentai_gallery_page.get_data = function (info, callback) {
			var data = get_saved_data("ehentai", info[0]);
			if (data !== null) {
				callback(null, {
					gid: data.gid,
					token: data.token
				});
			}
			else {
				callback(null, null);
			}
		}._w(246);
		rt_ehentai_gallery_page.setup_xhr = function (callback) {
			var pagelist = [],
				i, ii;

			for (i = 0, ii = this.infos.length; i < ii; ++i) {
				pagelist.push(this.infos[i]);
			}

			callback(null, {
				method: "POST",
				url: "http://" + domains.gehentai + "/api.php",
				headers: { "Content-Type": "application/json" },
				data: JSON.stringify({
					method: "gtoken",
					pagelist: pagelist
				})
			});
		}._w(247);
		rt_ehentai_gallery_page.parse_response = function (xhr, callback) {
			var response = $.json_parse_safe(xhr.responseText, null);

			if (response !== null) {
				if (typeof(response) === "object") {
					if (typeof(response.error) === "string") {
						callback(response.error);
						return;
					}
					else if (Array.isArray(response.tokenlist)) {
						callback(null, response.tokenlist);
						return;
					}
				}
				else if (typeof(response) === "string") {
					callback(response);
					return;
				}
			}

			callback("Invalid response");
		}._w(248);

		rt_ehentai_gallery_full.get_data = function (info, callback) {
			var data = get_saved_data("ehentai", info.gid);
			callback(null, (data !== null && data.token === info.token && data.full) ? data : null);
		}._w(249);
		rt_ehentai_gallery_full.set_data = function (data, info, callback) {
			set_saved_data(data);
			callback(null);
		}._w(250);
		rt_ehentai_gallery_full.setup_xhr = function (callback) {
			var info = this.infos[0];
			callback(null, {
				method: "GET",
				url: "http://" + info.domain + "/g/" + info.gid + "/" + info.token + "/" + info.search,
			});
		}._w(251);
		rt_ehentai_gallery_full.parse_response = function (xhr, callback) {
			var info = this.infos[0];
			ehentai_response_process_generic.call(this, xhr, info, this.delay_okay, callback, function (err, html) {
				callback(null, [ err === null ? ehentai_parse_gallery_info(html, info.data) : ehentai_make_removed(info.data) ]);
			}._w(253));
		}._w(252);
		var ehentai_response_process_generic = function (xhr, info, retry_delay, callback, process_callback) {
			var content_type = header_string_parse(xhr.responseHeaders)["content-type"],
				html;

			if (!/^text\/html/i.test(content_type || "")) {
				// Panda
				if (this.retry_count === 0 && info.domain === domains.exhentai) {
					// Retry
					info.domain = domains.gehentai;
					callback(null, null, retry_delay);
				}
				else {
					callback("Invalid response type " + content_type);
				}
				return;
			}

			// Parse
			html = $.html_parse_safe(xhr.responseText, null);
			if (html === null) {
				callback("Invalid response");
			}
			else if (ehentai_is_not_available(html)) {
				if (this.retry_count === 0 && info.domain === domains.gehentai) {
					// Retry
					info.domain = domains.exhentai;
					callback(null, null, retry_delay);
				}
				else {
					this.retry_count = 0;
					process_callback.call(this, "Not available", null);
				}
			}
			else if (ehentai_is_content_warning(html)) {
				if (this.retry_count <= 1) {
					// Retry
					info.search = "?nw=session"; // bypass the "Content Warning"
					callback(null, null, retry_delay);
				}
				else {
					this.retry_count = 0;
					process_callback.call(this, "Content warning", null);
				}
			}
			else {
				this.retry_count = 0;
				process_callback.call(this, null, html);
			}
		}._w(254);

		rt_ehentai_gallery_page_thumb.get_data = function (info, callback) {
			callback(null, get_saved_thumbnail("ehentai", info.gid, info.page));
		}._w(255);
		rt_ehentai_gallery_page_thumb.set_data = function (data, info, callback) {
			set_saved_thumbnail("ehentai", info.gid, info.page, data);
			callback(null);
		}._w(256);
		rt_ehentai_gallery_page_thumb.setup_xhr = rt_ehentai_gallery_full.setup_xhr;
		rt_ehentai_gallery_page_thumb.parse_response = function (xhr, callback) {
			var info = this.infos[0],
				retry_delay = 0; // this.type.delay_okay

			ehentai_response_process_generic.call(this, xhr, info, retry_delay, callback, function (err, html) {
				if (err !== null) {
					callback(err);
					return;
				}

				var n1 = $(".gtb>.gpc", html),
					small = false,
					start, end, total, m, n2, url, t;

				if (n1 !== null) {
					m = /(\d+)\s*-\s*(\d+)\s*of\s*(\d+)/i.exec(n1.textContent);
					if (m !== null) {
						start = parseInt(m[1], 10);
						end = parseInt(m[2], 10);
						total = parseInt(m[3], 10);

						if (info.page >= start && info.page <= end) {
							n1 = $("#gdt", html);
							if (n1 !== null) {
								n2 = $$(".gdtl", n1);
								if (n2.length === 0) {
									n2 = $$(".gdtm", n1);
									small = true;
								}

								n1 = n2[info.page - start];
								if (n1 !== undefined) {
									// Check for image
									if (small) {
										if (
											(n2 = $("div", n1)) !== null &&
											(t = n2.getAttribute("style"))
										) {
											// Small image
											m = [
												/url\(['"]?([^'"\)]*)['"]?\)\s*-(\d+)px/.exec(t),
												/width\s*:\s*(\d+)px/.exec(t),
												/height\s*:\s*(\d+)px/.exec(t)
											];
											if (m[0] !== null && m[1] !== null && m[2] !== null) {
												url = m[0][1];
												callback(null, [{
													url: $.resolve(url, xhr.finalUrl),
													left: parseInt(m[0][2], 10),
													top: 0,
													width: parseInt(m[1][1], 10),
													height: parseInt(m[2][1], 10),
													flags: Flags.None
												}]);
												return;
											}
										}
									}
									else {
										if (
											(n2 = $("img", n1)) !== null &&
											(url = n2.getAttribute("src"))
										) {
											// Full image
											callback(null, [{
												url: $.resolve(url, xhr.finalUrl),
												left: 0,
												top: 0,
												width: -1,
												height: -1,
												flags: Flags.None
											}]);
											return;
										}
									}
								}
							}
						}
						else if (info.page >= 1 && info.page <= total) {
							// Wrong page
							if (this.retry_count === 0) {
								// Next
								info.search = "?p=" + Math.floor((info.page - 1) / (end - (start - 1)));
								callback(null, null, retry_delay);
								return;
							}
						}
					}
				}

				callback("Thumbnail not found");
			}._w(258));
		}._w(257);

		rt_ehentai_lookup.error_mode = function (callback) {
			callback(null, RequestErrorMode.None);
		}._w(259);
		rt_ehentai_lookup.delay_modify = function (callback) {
			callback(null, this.infos[0].similar ? this.delay : 0);
		}._w(260);
		rt_ehentai_lookup.get_data = function (info, callback) {
			callback(null, info.sha1 === null ? null : lookup_get_results(info.sha1));
		}._w(261);
		rt_ehentai_lookup.set_data = function (data, info, callback) {
			lookup_set_results(data);
			callback(null);
		}._w(262);
		rt_ehentai_lookup.setup_xhr = function (callback) {
			var info = this.infos[0];
			if (info.similar) {
				var blob = info.blob,
					form_data = new FormData(),
					ext = (blob.type || "").split("/");

				info.blob = null;

				ext = "." + ext[ext.length - 1];

				form_data.append("sfile", blob, "image" + ext);
				form_data.append("fs_similar", "on");
				if (config.sauce.expunged) {
					form_data.append("fs_exp", "on");
				}

				callback(null, {
					method: "POST",
					url: "http://ul." + config.sauce.lookup_domain + "/image_lookup.php",
					data: form_data
				});
			}
			else {
				callback(null, {
					method: "GET",
					url: ehentai_create_lookup_url(info.sha1)
				});
			}
		}._w(263);
		rt_ehentai_lookup.parse_response = function (xhr, callback) {
			var info = this.infos[0];
			callback(null, [ ehentai_parse_lookup_results(xhr, info.similar, info.sha1, info.url, info.md5) ]);
		}._w(264);

		rt_nhentai_gallery.get_data = function (info, callback) {
			callback(null, get_saved_data("nhentai", info.gid));
		}._w(265);
		rt_nhentai_gallery.set_data = function (data, info, callback) {
			set_saved_data(data);
			callback(null);
		}._w(266);
		rt_nhentai_gallery.setup_xhr = function (callback) {
			callback(null, {
				method: "GET",
				url: "http://" + domains.nhentai + "/g/" + this.infos[0].gid + "/",
			});
		}._w(267);
		rt_nhentai_gallery.parse_response = function (xhr, callback) {
			var html = $.html_parse_safe(xhr.responseText, null);
			if (html === null) {
				callback("Invalid response");
			}
			else {
				callback(null, [ nhentai_parse_info(html, xhr.finalUrl) ]);
			}
		}._w(268);

		rt_nhentai_gallery_page_thumb.get_data = function (info, callback) {
			callback(null, get_saved_thumbnail("nhentai", info.gid, info.page));
		}._w(269);
		rt_nhentai_gallery_page_thumb.set_data = function (data, info, callback) {
			set_saved_thumbnail("nhentai", info.gid, info.page, data);
			callback(null);
		}._w(270);
		rt_nhentai_gallery_page_thumb.setup_xhr = function (callback) {
			var info = this.infos[0];
			callback(null, {
				method: "GET",
				url: "http://" + domains.nhentai + "/g/" + info.gid + "/" + info.page + "/"
			});
		}._w(271);
		rt_nhentai_gallery_page_thumb.parse_response = function (xhr, callback) {
			var html = $.html_parse_safe(xhr.responseText, null),
				n1, url;

			if (html === null) {
				callback("Invalid response");
				return;
			}

			n1 = $("#image-container img[src]", html);
			if (n1 !== null) {
				url = n1.getAttribute("src") || "";
				url = url.replace(/\/\/i\./i, "//t.");
				url = url.replace(/\.\w+$/, "t$&");
				url = $.resolve(url, xhr.finalUrl);
				callback(null, [{
					url: url,
					left: 0,
					top: 0,
					width: -1,
					height: -1,
					flags: Flags.None
				}]);
			}
			else {
				callback("Thumbnail not found");
			}
		}._w(272);

		rt_hitomi_gallery.get_data = function (info, callback) {
			callback(null, get_saved_data("hitomi", info.gid));
		}._w(273);
		rt_hitomi_gallery.set_data = function (data, info, callback) {
			set_saved_data(data);
			callback(null);
		}._w(274);
		rt_hitomi_gallery.setup_xhr = function (callback) {
			callback(null, {
				method: "GET",
				url: "https://" + domains.hitomi + "/galleries/" + this.infos[0].gid + ".html",
			});
		}._w(275);
		rt_hitomi_gallery.parse_response = function (xhr, callback) {
			var html = $.html_parse_safe(xhr.responseText, null);
			if (html === null) {
				callback("Invalid response");
			}
			else {
				callback(null, [ hitomi_parse_info(html, xhr.finalUrl) ]);
			}
		}._w(276);

		rt_hitomi_gallery_page_thumb.get_data = function (info, callback) {
			callback(null, get_saved_thumbnail("hitomi", info.gid, info.page));
		}._w(277);
		rt_hitomi_gallery_page_thumb.set_data = function (data, info, callback) {
			set_saved_thumbnail("hitomi", info.gid, info.page, data);
			callback(null);
		}._w(278);
		rt_hitomi_gallery_page_thumb.setup_xhr = function (callback) {
			callback(null, {
				method: "GET",
				url: "https://" + domains.hitomi + "/reader/" + this.infos[0].gid + ".html"
			});
		}._w(279);
		rt_hitomi_gallery_page_thumb.parse_response = function (xhr, callback) {
			var html = $.html_parse_safe(xhr.responseText, null),
				n1, url;

			if (html === null) {
				callback("Invalid response");
				return;
			}

			n1 = $$(".img-url", html);
			n1 = n1[this.infos[0].page - 1];
			if (n1 !== undefined) {
				url = n1.textContent;
				url = url.replace(/\/\/g\./i, "//tn.");
				url = url.replace(/galleries/i, "smalltn");
				url += ".jpg";
				url = $.resolve(url, xhr.finalUrl);
				callback(null, [{
					url: url,
					left: 0,
					top: 0,
					width: -1,
					height: -1,
					flags: Flags.ThumbnailNoLeech
				}]);
			}
			else {
				callback("Thumbnail not found");
			}
		}._w(280);



		// Fjord test
		var re_fjord = /abortion|bestiality|incest|lolicon|shotacon|toddlercon/;
		var is_fjording = function (data) {
			return re_fjord.test(data.tags.join(","));
		}._w(281);



		// Public
		var get_url_info = function (url) {
			var match = /^(https?):\/*((?:[\w-]+\.)*)([\w-]+\.[\w]+)((?:[\/\?\#][\w\W]*)?)/.exec(url),
				domain, remaining, m, data;

			if (match === null) return null;

			domain = match[3].toLowerCase();
			remaining = match[4];

			if (domain === domains.exhentai || domain === domains.ehentai) {
				m = /^\/g\/(\d+)\/([0-9a-f]+)/.exec(remaining);
				if (m !== null) {
					return {
						site: "ehentai",
						type: "gallery",
						gid: parseInt(m[1], 10),
						token: m[2],
						domain: domain
					};
				}

				m = /^\/s\/([0-9a-f]+)\/(\d+)\-(\d+)/.exec(remaining);
				if (m !== null) {
					return {
						site: "ehentai",
						type: "page",
						gid: parseInt(m[2], 10),
						page: parseInt(m[3], 10),
						page_token: m[1],
						domain: domain
					};
				}
			}
			else if (domain === domains.nhentai) {
				m = /^\/g\/(\d+)(?:\/(\d+))?/.exec(remaining);
				if (m !== null) {
					data = {
						site: "nhentai",
						type: "gallery",
						gid: parseInt(m[1], 10),
						domain: domain
					};
					if (m[2] !== undefined) data.page = parseInt(m[2], 10);
					return data;
				}
			}
			else if (domain === domains.hitomi) {
				m = /^\/(galleries|reader|smalltn)\/(\d+)(?:\.html#(\d+))?/.exec(remaining);
				if (m !== null) {
					data = {
						site: "hitomi",
						type: "gallery",
						gid: parseInt(m[2], 10),
						domain: domain
					};
					if (m[1] === "reader" && m[3] !== undefined) data.page = parseInt(m[3], 10);
					return data;
				}
			}

			return null;
		}._w(282);

		var get_ehentai_gallery = function (gid, token, callback) {
			var info = [ gid, token ];
			rt_ehentai_gallery.add(info.join("_"), info, false, callback);
		}._w(283);
		var get_ehentai_gallery_page = function (gid, page_token, page, callback) {
			var info = [ gid, page_token, page ];
			rt_ehentai_gallery_page.add("" + gid, info, false, callback);
		}._w(284);
		var get_ehentai_gallery_page_thumb = function (domain, gid, token, page_token, page, callback) {
			var di = domain_info[domain];
			domain = (di === undefined) ? domains.exhentai : di.g_domain;

			rt_ehentai_gallery_page_thumb.add(gid + "-" + page, {
				domain: domain,
				gid: gid,
				token: token,
				page: page,
				page_token: page_token,
				search: ""
			}, false, callback);
		}._w(285);
		var get_ehentai_gallery_full = function (domain, data, callback) {
			var di = domain_info[domain];
			domain = (di === undefined) ? domains.exhentai : di.g_domain;

			rt_ehentai_gallery_full.add("" + data.gid, {
				domain: domain,
				gid: data.gid,
				token: data.token,
				search: "",
				data: data
			}, false, callback);
		}._w(286);
		var get_nhentai_gallery = function (gid, callback) {
			rt_nhentai_gallery.add("" + gid, { gid: gid }, false, callback);
		}._w(287);
		var get_nhentai_gallery_page_thumb = function (gid, page, callback) {
			rt_nhentai_gallery_page_thumb.add(gid + "-" + page, {
				gid: gid,
				page: page
			}, false, callback);
		}._w(288);
		var get_hitomi_gallery = function (gid, callback) {
			rt_hitomi_gallery.add("" + gid, { gid: gid }, false, callback);
		}._w(289);
		var get_hitomi_gallery_page_thumb = function (gid, page, callback) {
			rt_hitomi_gallery_page_thumb.add(gid + "-" + page, {
				gid: gid,
				page: page
			}, false, callback);
		}._w(290);

		var get_data = function (site, gid) {
			return get_saved_data(site, gid);
		}._w(291);
		var get_data_from_url_info = function (url_info, callback) {
			if (url_info.site === "ehentai") {
				if (url_info.type === "gallery") {
					get_ehentai_gallery(url_info.gid, url_info.token, callback);
					return true;
				}
				if (url_info.type === "page") {
					get_ehentai_gallery_page(url_info.gid, url_info.page_token, url_info.page, function (err, data) {
						if (err === null) {
							get_ehentai_gallery(data.gid, data.token, callback);
						}
						else {
							callback.call(null, err, null);
						}
					}._w(293));
					return true;
				}
			}
			else if (url_info.site === "nhentai") {
				if (url_info.type === "gallery") {
					get_nhentai_gallery(url_info.gid, callback);
					return true;
				}
			}
			else if (url_info.site === "hitomi") {
				if (url_info.type === "gallery") {
					get_hitomi_gallery(url_info.gid, callback);
					return true;
				}
			}

			return false;
		}._w(292);

		var cached_thumbnail_urls = {};
		var get_thumbnail = function (thumbnail_url, flags, callback) {
			var url;

			if (thumbnail_url === null) {
				callback.call(null, "No thumbnail", null);
			}

			// Use direct URL
			if ((flags & Flags.ThumbnailNoLeech) === 0 && !config.general.image_leeching_disabled)  {
				callback.call(null, null, thumbnail_url);
				return;
			}

			// Cached
			url = cached_thumbnail_urls[thumbnail_url];
			if (url !== undefined) {
				callback.call(null, null, url);
				return;
			}

			// Fetch
			get_image(thumbnail_url, function (err, data, data_length, mime_type) {
				if (err === null) {
					var img_url = uint8_array_to_url(data.subarray(0, data_length), mime_type);

					if (img_url !== null) {
						cached_thumbnail_urls[thumbnail_url] = img_url;
						callback.call(null, null, img_url);
					}
					else {
						callback.call(null, "Failed to load image", null);
					}
				}
				else {
					callback.call(null, err, null);
				}
			}._w(295));
		}._w(294);

		var lookup_on_ehentai = function (url, md5, use_similar, callback, progress_callback) {
			if (use_similar) {
				// Fast mode
				var sha1 = get_sha1_hash(url, md5);

				var get_image_callback = function (err, data, data_length, mime_type, url) {
					if (progress_callback !== undefined) {
						progress_callback.call(null, "image");
					}

					if (err === null) {
						var blob = new Blob([ data.subarray(0, data_length) ], { type: mime_type });

						rt_ehentai_lookup.add(url, {
							similar: true,
							blob: blob,
							url: url,
							md5: md5,
							sha1: sha1
						}, false, callback, progress_callback);
					}
					else {
						callback.call(null, err, null);
					}
				}._w(297);

				if (sha1 !== null) {
					rt_ehentai_lookup.add(url, {
						similar: true,
						blob: null,
						url: url,
						md5: md5,
						sha1: sha1
					}, true, function (err, results) {
						if (err === null) {
							// Already exists
							callback.call(null, null, results);
						}
						else {
							// Load image
							get_image(url, get_image_callback, progress_callback);
						}
					}._w(298));
				}
				else {
					// Load image
					get_image(url, get_image_callback, progress_callback);
				}
			}
			else {
				get_sha1_hash(url, md5, function (err, sha1) {
					if (progress_callback !== undefined) {
						progress_callback.call(null, "image");
					}

					if (err === null) {
						rt_ehentai_lookup.add(url, {
							similar: false,
							blob: null,
							url: url,
							md5: md5,
							sha1: sha1
						}, false, callback, progress_callback);
					}
					else {
						callback.call(null, err, null);
					}
				}._w(299));
			}
		}._w(296);

		var init = function () {
			// Clean
			cache_init();
		}._w(300);



		// Exports
		return {
			Flags: Flags,
			RequestType: RequestType,
			get_url_info: get_url_info,
			get_ehentai_gallery: get_ehentai_gallery,
			get_ehentai_gallery_page: get_ehentai_gallery_page,
			get_ehentai_gallery_full: get_ehentai_gallery_full,
			get_ehentai_gallery_page_thumb: get_ehentai_gallery_page_thumb,
			get_nhentai_gallery: get_nhentai_gallery,
			get_nhentai_gallery_page_thumb: get_nhentai_gallery_page_thumb,
			get_hitomi_gallery: get_hitomi_gallery,
			get_hitomi_gallery_page_thumb: get_hitomi_gallery_page_thumb,
			get_data: get_data,
			get_data_from_url_info: get_data_from_url_info,
			get_thumbnail: get_thumbnail,
			lookup_on_ehentai: lookup_on_ehentai,
			cache_clear: cache_clear,
			get_category: get_category,
			get_category_sort_rank: get_category_sort_rank,
			is_fjording: is_fjording,
			init: init
		};

	}._w(159))();
	var SHA1 = (function () {

		// SHA-1 JS implementation originally created by Chris Verness; http://movable-type.co.uk/scripts/sha1.html
		// Private
		var f = function (s, x, y, z) {
			switch (s) {
				case 0: return (x & y) ^ (~x & z);
				case 1: return x ^ y ^ z;
				case 2: return (x & y) ^ (x & z) ^ (y & z);
				case 3: return x ^ y ^ z;
			}
		}._w(302);
		var rotl = function (x, n) {
			return (x << n) | (x >>> (32 - n));
		}._w(303);
		var hex = function (str) {
			var s = "",
				v, i;
			for (i = 7; i >= 0; --i) {
				v = (str >>> (i * 4)) & 0xf;
				s += v.toString(16);
			}
			return s;
		}._w(304);

		// Public
		var hash = function (data, data_length) {
			var H0, H1, H2, H3, H4, K, M, N, W, T,
				a, b, c, d, e, i, j, l, s;

			K = new Uint32Array([ 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xCA62C1D6 ]);
			data[data_length] = 0x80; // this is valid because the typed array always contains 1 extra padding byte

			l = data.length / 4 + 2;
			N = Math.ceil(l / 16);
			M = [];

			for (i = 0; i < N; ++i) {
				M[i] = [];
				for (j = 0; j < 16; ++j) {
					M[i][j] =
						(data[i * 64 + j * 4] << 24) |
						(data[i * 64 + j * 4 + 1] << 16) |
						(data[i * 64 + j * 4 + 2] << 8) |
						(data[i * 64 + j * 4 + 3]);
				}
			}

			M[N - 1][14] = Math.floor(((data.length - 1) * 8) / Math.pow(2, 32));
			M[N - 1][15] = ((data.length - 1) * 8) & 0xffffffff;

			H0 = 0x67452301;
			H1 = 0xefcdab89;
			H2 = 0x98badcfe;
			H3 = 0x10325476;
			H4 = 0xc3d2e1f0;

			W = [];

			for (i = 0; i < N; ++i) {
				for (j = 0; j < 16; ++j) {
					W[j] = M[i][j];
				}
				for (j = 16; j < 80; ++j) {
					W[j] = rotl(W[j - 3] ^ W[j - 8] ^ W[j - 14] ^ W[j - 16], 1);
				}

				a = H0;
				b = H1;
				c = H2;
				d = H3;
				e = H4;

				for (j = 0; j < 80; ++j) {
					s = Math.floor(j / 20);
					T = (rotl(a, 5) + f(s, b, c, d) + e + K[s] + W[j]) & 0xffffffff;
					e = d;
					d = c;
					c = rotl(b, 30);
					b = a;
					a = T;
				}

				H0 = (H0 + a) & 0xffffffff;
				H1 = (H1 + b) & 0xffffffff;
				H2 = (H2 + c) & 0xffffffff;
				H3 = (H3 + d) & 0xffffffff;
				H4 = (H4 + e) & 0xffffffff;
			}

			return hex(H0) + hex(H1) + hex(H2) + hex(H3) + hex(H4);
		}._w(305);

		// Exports
		return {
			hash: hash
		};

	}._w(301))();
	var Sauce = (function () {

		// Private
		var hover_nodes = {},
			hover_nodes_id = 0;

		var get_exresults_from_exsauce = function (node) {
			var container = Post.get_post_container(node);

			if (
				container !== null &&
				(node = $(".xl-exsauce-results[data-xl-image-index='" + node.getAttribute("data-xl-image-index") + "']", container)) !== null &&
				Post.get_post_container(node) === container
			) {
				return node;
			}

			return null;
		}._w(307);

		var on_sauce_click = function (event) {
			event.preventDefault();

			var results = get_exresults_from_exsauce(this),
				hover;

			if (results !== null) {
				hover = hover_nodes[this.getAttribute("data-xl-sauce-hover-id") || ""];
				if (hover === undefined) return;

				if (results.classList.toggle("xl-exsauce-results-hidden")) {
					hover.classList.remove("xl-exsauce-hover-hidden");
					on_sauce_mousemove.call(this, event);
				}
				else {
					hover.classList.add("xl-exsauce-hover-hidden");
				}
			}
		}._w(308);
		var on_sauce_click_error = function (event) {
			event.preventDefault();

			var link = this,
				events = this.getAttribute("data-xl-exsauce-events") || null;

			if (events === null) return;

			Linkifier.change_link_events(link, null);

			setTimeout(function () {
				Linkifier.change_link_events(link, events);
				link.click();
			}._w(310), 1);
		}._w(309);
		var on_sauce_mouseover = $.wrap_mouseenterleave_event(function () {
			var results = get_exresults_from_exsauce(this),
				hover, err;

			if (results === null || results.classList.contains("xl-exsauce-results-hidden")) {
				hover = hover_nodes[this.getAttribute("data-xl-sauce-hover-id")];
				if (hover === undefined) {
					err = this.getAttribute("data-xl-exsauce-error");
					if (!err) return;
					this.removeAttribute("data-xl-exsauce-error");
					hover = create_error(this, err);
				}

				hover.classList.remove("xl-exsauce-hover-hidden");
			}
		}._w(311));
		var on_sauce_mouseout = $.wrap_mouseenterleave_event(function () {
			var hover = hover_nodes[this.getAttribute("data-xl-sauce-hover-id") || ""];
			if (hover !== undefined) {
				hover.classList.add("xl-exsauce-hover-hidden");
			}
		}._w(312));
		var on_sauce_mousemove = function (event) {
			var hover = hover_nodes[this.getAttribute("data-xl-sauce-hover-id") || ""];

			if (hover === undefined || hover.classList.contains("xl-exsauce-hover-hidden")) return;

			hover.style.left = "0";
			hover.style.top = "0";

			var w = window,
				de = d.documentElement,
				x = event.clientX,
				y = event.clientY,
				win_width = (de.clientWidth || w.innerWidth || 0),
				win_height = (de.clientHeight || w.innerHeight || 0),
				rect = hover.getBoundingClientRect();

			x -= rect.width / 2;
			x = Math.max(1, Math.min(win_width - rect.width - 1, x));
			y += 20;
			if (y + rect.height >= win_height) {
				y = event.clientY - (rect.height + 20);
			}

			hover.style.left = x + "px";
			hover.style.top = y + "px";
		}._w(313);

		var create_hover = function (id, data) {
			var results = data.results,
				hover, i, ii;

			hover = $.node("div", "xl-exsauce-hover xl-exsauce-hover-hidden xl-hover-shadow" + Theme.classes);
			Theme.bg(hover);
			hover.setAttribute("data-xl-sauce-hover-id", id);

			for (i = 0, ii = results.length; i < ii; ) {
				$.add(hover, $.link(results[i].url, "xl-exsauce-hover-link", results[i].title));
				if (++i < ii) $.add(hover, $.node_simple("br"));
			}

			Popup.hovering(hover);
			hover_nodes[id] = hover;

			return hover;
		}._w(314);
		var format = function (a, data) {
			var count = data.results.length,
				theme = Theme.classes,
				index = a.getAttribute("data-xl-image-index") || "",
				results, link, par, url, n1, n2, n, i, ii;

			a.classList.add("xl-exsauce-link-valid");
			a.textContent = "Found: " + count;
			a.href = data.url;
			a.target = "_blank";
			a.rel = "noreferrer";
			a.removeAttribute("title");

			if (count > 0) {
				if (
					(n = Post.get_post_container(a)) !== null &&
					(n = Post.get_text_body(n)) !== null &&
					(par = n.parentNode) !== null
				) {
					results = $.node("div", "xl-exsauce-results" + theme);
					results.setAttribute("data-xl-image-index", index);

					$.add(results, n1 = $.node("div", "xl-exsauce-results-inner" + theme));

					$.add(n1, n2 = $.node("div", "xl-exsauce-results-group" + theme));

					$.add(n2, $.node("strong", "xl-exsauce-results-title", "Reverse Image Search Results"));
					$.add(n2, $.node("span", "xl-exsauce-results-sep", "|"));
					$.add(n2, $.node("span", "xl-exsauce-results-label", "View on:"));

					if (config.sauce.lookup_domain === domains.exhentai) {
						$.add(n2, $.link(data.url, "xl-exsauce-results-link", "ExHentai"));
						$.add(n2, $.link($.change_url_domain(data.url, domains.gehentai), "xl-exsauce-results-link", "E-Hentai"));
					}
					else {
						$.add(n2,$.link(data.url, "xl-exsauce-results-link", "E-Hentai"));
						$.add(n2, $.link($.change_url_domain(data.url, domains.exhentai), "xl-exsauce-results-link", "ExHentai"));
					}

					$.add(n1, n2 = $.node("div", "xl-exsauce-results-group"));

					for (i = 0, ii = data.results.length; i < ii; ++i) {
						url = data.results[i].url;
						link = Linkifier.create_link(n2, null, url, url, true);
						if (i < ii - 1) $.add(n2, $.node_simple("br"));
					}

					$.before(par, n, results);
				}

				a.setAttribute("data-xl-sauce-hover-id", hover_nodes_id);
				create_hover(hover_nodes_id, data);
				++hover_nodes_id;

				Linkifier.change_link_events(a, "exsauce_toggle");
			}
		}._w(315);
		var label = function () {
			var label = config.sauce.label;

			if (label.length === 0) {
				label = (config.sauce.lookup_domain === domains.exhentai) ? "ExHentai" : "E-Hentai";
			}

			return label;
		}._w(316);

		var create_error = function (node, error) {
			var id = hover_nodes_id,
				hover;

			// Update id
			++hover_nodes_id;

			// Create hover
			hover = $.node("div", "xl-exsauce-hover xl-exsauce-hover-hidden xl-hover-shadow" + Theme.classes);
			Theme.bg(hover);
			$.add(hover, $.node("span", "xl-exsauce-hover-link", error));

			// Ids
			hover.setAttribute("data-xl-sauce-hover-id", id);
			node.setAttribute("data-xl-sauce-hover-id", id);

			Popup.hovering(hover);
			hover_nodes[id] = hover;

			// Done
			return hover;
		}._w(317);
		var set_error = function (node, error) {
			// Create hover
			create_error(node, error);

			// Link
			node.classList.add("xl-exsauce-link-error");
			node.textContent = "Error";
			node.removeAttribute("title");

			// Events
			Linkifier.change_link_events(node, "exsauce_error");
		}._w(318);
		var remove_error = function (node) {
			var events = Linkifier.get_link_events(node),
				id = node.getAttribute("data-xl-sauce-hover-id"),
				hover = hover_nodes[id];

			Linkifier.change_link_events(node, null);
			node.classList.remove("xl-exsauce-link-error");
			node.setAttribute("data-xl-exsauce-events", events);
			node.removeAttribute("data-xl-sauce-hover-id");

			if (hover !== undefined) {
				if (hover.parentNode !== null) $.remove(hover);
				delete hover_nodes[id];
			}
		}._w(319);

		var fetch_generic = function (link, use_similar) {
			var url = link.href,
				md5 = link.getAttribute("data-md5") || null,
				progress;

			if (use_similar) {
				link.textContent = "Downloading";

				progress = function (state) {
					if (state === "image") {
						link.textContent = "Waiting";
					}
					else if (state === "upload") {
						link.textContent = "Uploading";
					}
					else if (state === "download") {
						link.textContent = "Checking";
					}
				}._w(321);
			}
			else {
				link.textContent = "Downloading";

				progress = function (state) {
					if (state === "image") {
						link.textContent = "Waiting";
					}
					else if (state === "upload") {
						link.textContent = "Checking";
					}
				}._w(322);
			}

			remove_error(link);

			API.lookup_on_ehentai(url, md5, use_similar, function (err, data) {
				if (err === null) {
					format(link, data);
				}
				else {
					set_error(link, err);
				}
			}._w(323), progress);
		}._w(320);
		var fetch = function (event) {
			event.preventDefault();
			fetch_generic(this, false);
		}._w(324);
		var fetch_similar = function (event) {
			event.preventDefault();
			fetch_generic(this, true);
		}._w(325);

		// Public
		var find_link = function (container) {
			return $(".xl-exsauce-link", container);
		}._w(326);
		var create_link = function (file_info, index) {
			var event = "exsauce_fetch",
				sauce, err;

			sauce = $.link(file_info.url, "xl-exsauce-link", label());
			sauce.setAttribute("data-xl-filename", file_info.name);
			sauce.setAttribute("data-xl-image-index", index);
			if (file_info.md5 !== null) {
				sauce.setAttribute("data-md5", file_info.md5.replace(/=+/g, ""));
			}
			if (/^\.jpe?g$/i.test(file_info.type) && !Config.is_tinyboard) {
				if (browser.is_firefox) {
					event = "exsauce_fetch_similarity";
					sauce.title = "This will only work on colored images";
				}
				else {
					err = "Reverse Image Search doesn't work for .jpg images because 4chan manipulates them on upload";
					event = "exsauce_error";
					sauce.classList.add("xl-exsauce-link-disabled");
					sauce.setAttribute("data-xl-exsauce-error", err);
				}
			}

			Linkifier.change_link_events(sauce, event);

			return sauce;
		}._w(327);
		var init = function () {
			Linkifier.register_link_events({
				exsauce_fetch: fetch,
				exsauce_fetch_similarity: fetch_similar,
				exsauce_toggle: {
					click: on_sauce_click,
					mouseover: on_sauce_mouseover,
					mouseout: on_sauce_mouseout,
					mousemove: on_sauce_mousemove
				},
				exsauce_error: {
					click: on_sauce_click_error,
					mouseover: on_sauce_mouseover,
					mouseout: on_sauce_mouseout,
					mousemove: on_sauce_mousemove
				},
			});
		}._w(328);

		// Exports
		return {
			find_link: find_link,
			create_link: create_link,
			init: init
		};

	}._w(306))();
	var Linkifier = (function () {

		// Private
		var re_url = /(https?:\/*)?(?:(?:forums|gu|g|u)?\.?e[x\-]hentai\.org|nhentai\.net|hitomi\.la)(?:\/[^<>\s\'\"]*)?/ig,
			re_url_class_ignore = /(?:\binlined?\b|\bxl-)/,
			re_deferrer = /^(?:https?:)?\/\/sys\.4chan\.org\/derefer\?url=([\w\W]*)$/i;

		// Linkification
		var deep_dom_wrap = (function () {

			// Internal helper class
			var Offset = function (text_offset, node) {
				this.text_offset = text_offset;
				this.node = node;
				this.node_text_length = node.nodeValue.length;
			}._w(331);



			// Main function
			var deep_dom_wrap = function (container, tag, matcher, element_checker, setup_function, quick) {
				var text = "",
					offsets = [],
					d = document,
					count = 0,
					match_pos = 0,
					node, par, next, check, match,
					pos_start, pos_end, offset_start, offset_end,
					prefix, suffix, link_base, link_node, relative_node, relative_par, clone, i, n1, n2, len, offset_current, offset_node;


				// Create a string of the container's contents (similar to but not exactly the same as node.textContent)
				// Also lists all text nodes into the offsets array
				par = container;
				node = container.firstChild;
				if (node === null) return 0; // Quick exit for empty container
				while (true) {
					if (node !== null) {
						if (node.nodeType === 3) { // TEXT_NODE
							// Add to list and text
							offsets.push(new Offset(text.length, node));
							text += node.nodeValue;
						}
						else if (node.nodeType === 1) { // ELEMENT_NODE
							// Action callback
							check = element_checker.call(null, node);
							// Line break
							if ((check & deep_dom_wrap.EL_TYPE_LINE_BREAK) !== 0) {
								text += "\n";
							}
							// Parse
							if ((check & deep_dom_wrap.EL_TYPE_NO_PARSE) === 0) {
								par = node;
								node = node.firstChild;
								continue;
							}
						}

						// Next
						node = node.nextSibling;
					}
					else {
						// Done?
						if (par === container) break;

						// Move up
						node = par;
						par = node.parentNode;
						node = node.nextSibling;
					}
				}

				// Quick mode: just find all the matches
				if (quick) {
					// Match the text
					match = matcher.call(null, text, match_pos);
					if (match === null) return count;

					++count;

					match_pos = match[1];
				}

				// Loop to find all links
				while (true) {
					// Match the text
					match = matcher.call(null, text, match_pos);
					if (match === null) break;
					++count;



					// Find the beginning and ending text nodes
					pos_start = match[0];
					pos_end = match[1];

					for (offset_start = 1; offset_start < offsets.length; ++offset_start) {
						if (offsets[offset_start].text_offset > pos_start) break;
					}
					for (offset_end = offset_start; offset_end < offsets.length; ++offset_end) {
						if (offsets[offset_end].text_offset > pos_end) break;
					}
					--offset_start;
					--offset_end;



					// Vars to create the link
					prefix = text.substr(offsets[offset_start].text_offset, pos_start - offsets[offset_start].text_offset);
					suffix = text.substr(pos_end, offsets[offset_end].text_offset + offsets[offset_end].node_text_length - pos_end);
					link_base = d.createElement(tag);
					link_node = link_base;
					relative_node = null;

					// Prefix update
					i = offset_start;
					offset_current = offsets[i];
					offset_node = offset_current.node;
					if (prefix.length > 0) {
						// Insert prefix
						n1 = d.createTextNode(prefix);
						offset_node.parentNode.insertBefore(n1, offset_node);

						// Update text
						offset_node.nodeValue = offset_node.nodeValue.substr(prefix.length);

						// Set first relative
						relative_node = n1;
						relative_par = n1.parentNode;

						// Update offset for next search
						len = prefix.length;
						offset_current.text_offset += len;
						offset_current.node_text_length -= len;
					}
					else {
						// Set first relative
						relative_node = offset_node.previousSibling;
						relative_par = offset_node.parentNode;
					}

					// Loop over ELEMENT_NODEs; add TEXT_NODEs to the link, remove empty nodes where necessary
					// The only reason the par variable is necessary is because some nodes are removed during this process
					for (; i < offset_end; ++i) {
						// Next
						node = offsets[i].node;
						next = node.nextSibling;
						par = node.parentNode;

						// Add text
						link_node.appendChild(node);

						// Node loop
						while (true) {
							if (next) {
								if (next.nodeType === Node.TEXT_NODE) {
									// Done
									break;
								}
								else if (next.nodeType === Node.ELEMENT_NODE) {
									// Deeper
									node = next;
									next = node.firstChild;
									par = node;

									// Update link node
									clone = node.cloneNode(false);
									link_node.appendChild(clone);
									link_node = clone;

									continue;
								}
								else {
									// Some other node type; continue anyway
									node = next;
									next = node.nextSibling;

									// Update link node
									link_node.appendChild(node);

									continue;
								}
							}

							// Shallower
							node = par;
							next = node.nextSibling;
							par = node.parentNode;

							if (node.firstChild === null) par.removeChild(node);

							// Update link node
							if (link_node !== link_base) {
								// Simply move up tree (link_node still has a parent)
								link_node = link_node.parentNode;
							}
							else {
								// Create a new wrapper node (link_node has no parent; it's the link_base)
								clone = node.cloneNode(false);
								for (n1 = link_base.firstChild; n1; n1 = n2) {
									n2 = n1.nextSibling;
									clone.appendChild(n1);
								}
								link_base.appendChild(clone);
								link_node = link_base;

								// Placement relatives
								relative_node = (next !== null) ? next.previousSibling : null;
								relative_par = par;
							}
						}
					}

					// Suffix update
					offset_current = offsets[i];
					offset_node = offset_current.node;
					if (suffix.length > 0) {
						// Insert suffix
						n1 = d.createTextNode(suffix);
						if ((n2 = offset_node.nextSibling) !== null) {
							offset_node.parentNode.insertBefore(n1, n2);
						}
						else {
							offset_node.parentNode.appendChild(n1);
						}

						// Update text
						len = offset_node.nodeValue.length - suffix.length;
						offset_node.nodeValue = offset_node.nodeValue.substr(0, len);

						// Update offset for next search
						offset_current.text_length += len;
						offset_current.node_text_length -= len;
						offset_current.node = n1;
					}

					// Add the last segment
					par = offset_node.parentNode;
					link_node.appendChild(offset_node);



					// Setup function
					if (setup_function !== null) setup_function.call(null, link_base, match);



					// Find the proper relative node
					relative_node = (relative_node !== null) ? relative_node.nextSibling : relative_par.firstChild;

					// Insert link
					if (relative_node !== null) {
						// Insert before it
						relative_par.insertBefore(link_base, relative_node);
					}
					else {
						// Add to end
						relative_par.appendChild(link_base);
					}

					// Remove empty suffix tags
					while (par.firstChild === null) {
						node = par;
						par = par.parentNode;
						par.removeChild(node);
					}



					// Update match position
					offsets[offset_end].text_offset = pos_end;
					match_pos = pos_end;
				}

				// Done
				return count;
			}._w(332);



			// Element type constants
			deep_dom_wrap.EL_TYPE_PARSE = 0;
			deep_dom_wrap.EL_TYPE_NO_PARSE = 1;
			deep_dom_wrap.EL_TYPE_LINE_BREAK = 2;



			// Return the function
			return deep_dom_wrap;

		}._w(330))();

		var linkify = function (container, result_nodes, result_urls) {
			deep_dom_wrap(
				container,
				"a",
				function (text, pos) {
					re_url.lastIndex = pos;
					var m = re_url.exec(text);
					if (m === null) return null;
					return [ m.index , m.index + m[0].length, m ];
				}._w(334),
				function (node) {
					if (node.tagName === "BR" || node.tagName === "A") {
						return deep_dom_wrap.EL_TYPE_NO_PARSE | deep_dom_wrap.EL_TYPE_LINE_BREAK;
					}
					else if (node.tagName === "WBR") {
						return deep_dom_wrap.EL_TYPE_NO_PARSE;
					}
					else if (node.tagName === "DIV") {
						if (re_url_class_ignore.test(node.className)) {
							return deep_dom_wrap.EL_TYPE_NO_PARSE | deep_dom_wrap.EL_TYPE_LINE_BREAK;
						}
						return deep_dom_wrap.EL_TYPE_LINE_BREAK;
					}
					return deep_dom_wrap.EL_TYPE_PARSE;
				}._w(335),
				function (node, match) {
					var url = match[2][0];
					if (match[2][1] === undefined) url = "http://" + url.replace(/^\/+/, "");
					result_nodes.push(node);
					result_urls.push(url);
				}._w(336),
				false
			);
		}._w(333);

		var parse_text_for_urls = function (text) {
			var urls = [],
				m;

			re_url.lastIndex = 0;

			while ((m = re_url.exec(text)) !== null) {
				urls.push(m[0]);
			}

			return urls;
		}._w(337);

		// Link creation and processing
		var create_link = function (parent, next, url, text, auto_process) {
			var link = $.link(url, "xl-link-created", text);

			$.before(parent, next, link);

			preprocess_link(link, url, false, auto_process);

			return link;
		}._w(338);
		var preprocess_link = function (node, url, update_on_fail, auto_load) {
			var info, rewrite;

			if (
				node.parentNode === null ||
				(info = API.get_url_info(url)) === null ||
				!config.sites[info.site]
			) {
				if (update_on_fail) {
					node.href = url;
					node.target = "_blank";
					node.rel = "noreferrer";
					node.classList.add("xl-linkified");
				}
				return;
			}

			if (info.site === "ehentai") {
				rewrite = config.general.rewrite_links;
				if (
					(rewrite === domains.exhentai || rewrite === domains.ehentai) &&
					info.domain !== rewrite
				) {
					info.domain = rewrite;
					url = $.change_url_domain(url, domain_info[rewrite].g_domain);
				}
			}

			node.href = url;
			node.target = "_blank";
			node.rel = "noreferrer";

			node.classList.add("xl-link");
			node.classList.add("xl-linkified");

			set_node_url_info(node, info);
			UI.setup_link(node, url, info);

			if (auto_load) load_link(node, info);
		}._w(339);
		var load_link = function (link, info) {
			API.get_data_from_url_info(info, function (err, data) {
				if (link.parentNode !== null) {
					if (err === null) {
						UI.format_link(link, data, info);
						if (event_listeners.format.length > 0) {
							trigger(event_listeners.format, { link: link });
						}
					}
					else {
						UI.format_link_error(link, err, info);
					}
				}
			}._w(341));
		}._w(340);

		// Post queue
		var post_queue = {
			posts: [],
			timer: null,
			group_size: 25,
			delay: 50
		};
		var queue_posts = function (posts, flags) {
			if ((flags & queue_posts.Flags.Flush) !== 0) {
				// Flush
				if ((flags & queue_posts.Flags.FlushNoParse) === 0) {
					parse_posts(post_queue.posts);
				}
				post_queue.posts = [];

				// Clear timer
				if (post_queue.timer !== null) {
					clearTimeout(post_queue.timer);
					post_queue.timer = null;
				}
			}

			if ((flags & queue_posts.Flags.UseDelay) === 0) {
				// Immediate
				parse_posts(posts);
			}
			else {
				// Queue
				$.push_many(post_queue.posts, posts);

				// Run queue
				if (post_queue.timer === null) {
					dequeue_posts();
				}
			}
		}._w(342);
		queue_posts.Flags = {
			None: 0x0,
			UseDelay: 0x1,
			Flush: 0x2,
			FlushNoParse: 0x4
		};
		var dequeue_posts = function () {
			var posts = post_queue.posts.splice(0, post_queue.group_size);

			if (posts.length === 0) {
				// Done
				post_queue.timer = null;
			}
			else {
				// Run
				parse_posts(posts);

				// Timer for next
				post_queue.timer = setTimeout(dequeue_posts, post_queue.delay);
			}
		}._w(343);

		var setup_post_exsauce = function (post) {
			var index = 0,
				file_infos, file_info, node, i, ii;

			// File info
			file_infos = Post.get_file_info(post);
			for (i = 0, ii = file_infos.length; i < ii; ++i) {
				file_info = file_infos[i];

				// Create if not found
				node = Sauce.find_link(file_info.options);
				if (node !== null) $.remove(node);

				if (/^\.(png|gif|jpe?g)$/i.test(file_info.type)) {
					node = Sauce.create_link(file_info, index);
					Post.create_image_meta_link(file_info, node);
					++index;
				}
			}
		}._w(344);
		var parse_post = function (post) {
			var auto_load_links = config.general.automatic_processing,
				post_body, post_links, link_nodes, link_urls, link, url, i, ii, j;

			// Exsauce
			if (config.sauce.enabled && !browser.is_opera) {
				setup_post_exsauce(post);
			}

			if ((post_body = Post.get_text_body(post)) !== null) {
				// Content
				re_url.lastIndex = 0;
				post_links = Post.get_body_links(post_body);
				if (
					!Config.linkify ||
					post_links.length > 0 ||
					re_url.test(post_body.innerHTML)
				) {
					link_nodes = [];
					link_urls = [];
					for (i = 0, ii = post_links.length; i < ii; ++i) {
						link = post_links[i];
						if (link.classList.contains("xl-site-tag")) {
							$.remove(link);
						}
						else {
							re_url.lastIndex = 0;
							url = link.href;
							if (link.classList.contains("linkified") && re_deferrer.test(url)) {
								url = link.textContent.trim();
							}
							if (re_url.test(url)) {
								link_nodes.push(link);
								link_urls.push(url);
							}
						}
					}

					j = link_nodes.length;
					if (Config.linkify) {
						linkify(post_body, link_nodes, link_urls);
					}

					for (i = 0, ii = link_nodes.length; i < ii; ++i) {
						preprocess_link(link_nodes[i], link_urls[i], (i >= j), auto_load_links);
					}
				}
				post.classList.add("xl-post-linkified");
			}
		}._w(345);
		var parse_posts = function (posts) {
			var post, i, ii;

			Debug.timer("process");

			for (i = 0, ii = posts.length; i < ii; ++i) {
				post = posts[i];
				if (post.classList.contains("xl-post-linkified")) {
					UI.cleanup_post(post);
					apply_link_events(post, true);
				}
				else {
					parse_post(post);
				}
			}

			Debug.log("Total posts=" + posts.length + "; time=" + Debug.timer("process"));
		}._w(346);

		// Link events
		var link_events = {};
		var register_link_events = function (events) {
			var count = 0,
				k;

			for (k in events) {
				if (!Object.prototype.hasOwnProperty.call(link_events, k)) {
					link_events[k] = events[k];
					++count;
				}
			}

			return count;
		}._w(347);
		var get_link_events = function (node) {
			return node.getAttribute("data-xl-link-events") || null;
		}._w(348);
		var set_link_events = function (node, new_events) {
			var events = link_events[new_events],
				k;

			if (events) {
				if (typeof(events) === "function") {
					$.on(node, "click", events);
				}
				else {
					// Array
					for (k in events) {
						$.on(node, k, events[k]);
					}
				}
			}
		}._w(349);
		var apply_link_events = function (node, check_children) {
			var nodes = check_children ? $$("a.xl-link-events", node) : [ node ],
				events, i, ii;

			for (i = 0, ii = nodes.length; i < ii; ++i) {
				node = nodes[i];
				events = node.getAttribute("data-xl-link-events");
				set_link_events(node, events);
			}
		}._w(350);
		var change_link_events = function (node, new_events) {
			var old_events = node.getAttribute("data-xl-link-events"),
				events, k;

			events = link_events[old_events];
			if (events) {
				if (typeof(events) === "function") {
					$.off(node, "click", events);
				}
				else {
					// Array
					for (k in events) {
						$.off(node, k, events[k]);
					}
				}
			}

			if (new_events === null) {
				node.classList.remove("xl-link-events");
				node.removeAttribute("data-xl-link-events");
			}
			else {
				node.classList.add("xl-link-events");
				node.setAttribute("data-xl-link-events", new_events);
				set_link_events(node, new_events);
			}
		}._w(351);

		// Links
		var get_links_formatted = function (parent) {
			return $$("a.xl-link.xl-link-formatted", parent);
		}._w(352);

		var set_node_url_info = function (node, info) {
			node.setAttribute("data-xl-info", JSON.stringify(info));
		}._w(353);
		var get_node_url_info = function (node) {
			return $.json_parse_safe(node.getAttribute("data-xl-info"), null);
		}._w(354);

		// Events
		var event_listeners = {
			format: []
		};
		var on = function (event_name, callback) {
			var listeners = event_listeners[event_name];
			if (!listeners) return false;
			listeners.push(callback);
			return true;
		}._w(355);
		var off = function (event_name, callback) {
			var listeners = event_listeners[event_name],
				i, ii;
			if (listeners) {
				for (i = 0, ii = listeners.length; i < ii; ++i) {
					if (listeners[i] === callback) {
						listeners.splice(i, 1);
						return true;
					}
				}
			}
			return false;
		}._w(356);
		var trigger = function (listeners, data) {
			var i, ii;
			for (i = 0, ii = listeners.length; i < ii; ++i) {
				listeners[i].call(null, data);
			}
		}._w(357);

		// Fixing
		var relinkify_posts = function (posts) {
			var cls = "xl-post-linkified",
				post, links, i, ii, j, jj;

			for (i = 0, ii = posts.length; i < ii; ++i) {
				post = posts[i];
				if (!post.classList.contains(cls)) continue;

				post.classList.remove(cls);

				links = $$(".xl-site-tag", post);
				for (j = 0, jj = links.length; j < jj; ++j) {
					$.remove(links[j]);
				}

				links = $$(".xl-link-events", post);
				for (j = 0, jj = links.length; j < jj; ++j) {
					change_link_events(links[j], null);
				}
			}

			queue_posts(posts, queue_posts.Flags.Flush | queue_posts.Flags.FlushNoParse | queue_posts.Flags.UseDelay);
		}._w(358);
		var fix_broken_4chanx_linkification = function (node, event_links) {
			// Somehow one of the links gets cloned, and then they all get wrapped inside another link
			var fix = [],
				n = node.nextSibling,
				link, events, i, ii;

			if (n !== null && n.tagName === "A" && n.classList.contains("xl-link")) {
				$.remove(n);
			}

			n = node.previousSibling;
			if (n !== null && n.tagName === "A" && n.classList.contains("xl-site-tag")) {
				$.remove(n);
			}

			for (i = 0, ii = event_links.length; i < ii; ++i) {
				link = event_links[i];
				events = get_link_events(link);
				change_link_events(link, null);

				if (link.classList.contains("xl-site-tag")) {
					$.remove(link);
				}
				else if (link.classList.contains("xl-link")) {
					fix.push(link, events);
				}
			}

			$.unwrap(node);

			for (i = 0, ii = fix.length; i < ii; i += 2) {
				link = fix[i];
				preprocess_link(link, link.href || "", false, config.general.automatic_processing);
			}
		}._w(359);

		// Exports
		return {
			parse_text_for_urls: parse_text_for_urls,
			create_link: create_link,
			load_link: load_link,
			queue_posts: queue_posts,
			get_link_events: get_link_events,
			change_link_events: change_link_events,
			register_link_events: register_link_events,
			get_links_formatted: get_links_formatted,
			get_node_url_info: get_node_url_info,
			relinkify_posts: relinkify_posts,
			fix_broken_4chanx_linkification: fix_broken_4chanx_linkification,
			on: on,
			off: off
		};

	}._w(329))();
	var Settings = (function () {

		// Private
		var config_temp = null,
			export_url = null,
			popup = null;

		var html_filter_guide = function () {
			return '<div class="xl-settings-group xl-settings-filter-guide xl-theme">Lines starting with <code>/</code> will be treated as <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions" target="_blank" rel="noreferrer nofollow">regular expressions</a>. <span style="opacity: 0.75">(This is very similar to 4chan-x style filtering)</span><br>Lines starting with <code>#</code> are comments and will be ignored.<br>Lines starting with neither <code>#</code> nor <code>/</code> will be treated as a case-insensitive string to match anywhere.<br>For example, <code>/touhou/i</code> will highlight entries containing the string `<code>touhou</code>`, case-insensitive.<br><br>The lower a filter appears in this list, the greater its priority will be.<br><br>You can use these additional settings with each regular expression, separating them with semicolons:<br><ul><li><strong>Apply the filter to different scopes:</strong><br><code>tags;</code>, <code>title;</code> or <code>uploader;</code>. By default the scope is <code>title;tags;</code><br></li><li><strong>Force a gallery to not be highlighted:</strong> <span style="opacity: 0.75">If omitted, the gallery will be highlighted as normal</span><br><code>bad:no;</code>, <code>bad:yes;</code>, or just <code>bad;</code></li><li><strong>Only apply the filter to certain categories:</strong><br><code>only:doujinshi,manga;</code>.<div style="font-size: 0.9em; margin-top: 0.1em; opacity: 0.75">Categories: <span>artistcg, asianporn, cosplay, doujinshi, gamecg, imageset, manga, misc, <span style="white-space: nowrap">non-h</span>, private, western</span></div></li><li><strong>Only apply the filter if it <em>is not</em> a certain category:</strong><br><code>not:western,non-h;</code>.</li><li><strong>Only apply the filter to certain sites:</strong><br><code>only:ehentai;</code>.<div style="font-size: 0.9em; margin-top: 0.1em; opacity: 0.75">Sites: <span>ehentai, nhentai, hitomi</span></div></li><li><strong>Apply a colored decoration to the matched text:</strong><br><code>color:red;</code>, <code>underline:#0080f0;</code>, or <code>background:rgba(0,255,0,0.5);</code></li><li><strong>Apply a colored decoration to the [Ex] or [EH] tag:</strong><br><code>link-color:blue;</code>, <code>link-underline:#bf48b5;</code>, or <code>link-background:rgba(220,200,20,0.5);</code></li><li><strong>Apply a colored decoration to <em>BOTH</em> the matched text and tag:</strong><br><code>colors:blue;</code>, <code>underlines:#bf48b5;</code>, or <code>backgrounds:rgba(220,200,20,0.5);</code></li><li><strong>Disable any coloring, including the default:</strong><br><code>no-colors;</code> or <code>nocolor;</code></li></ul>Additionally, some settings have aliases. If multiple are used, only the main one will be used.<br><ul><li><code>tags: tag</code></li><li><code>only: category, cat</code></li><li class="xl-settings-li-no-space"><code>not: no</code></li><li class="xl-settings-li-no-space"><code>site: sites</code></li><li><code>colors: cs</code></li><li class="xl-settings-li-no-space"><code>underlines: us</code></li><li class="xl-settings-li-no-space"><code>backgrounds: bgs</code></li><li><code>color: c</code></li><li class="xl-settings-li-no-space"><code>underline: u</code></li><li class="xl-settings-li-no-space"><code>background: bg</code></li><li><code>link-color: link-c, lc</code></li><li class="xl-settings-li-no-space"><code>link-underline: link-u, lu</code></li><li class="xl-settings-li-no-space"><code>link-background: link-bg, lbg</code></li><li><code>no-colors: no-color, nocolors, nocolor</code></li></ul>For easy <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#Color_keywords" target="_blank" rel="noreferrer nofollow">HTML color</a> selection, you can use the following helper to select a color:<br><br><div><input type="color" value="#808080" class="xl-settings-color-input"><input type="text" value="#808080" class="xl-settings-color-input" readonly="readonly"><input type="text" value="rgba(128,128,128,1)" class="xl-settings-color-input" readonly="readonly"></div></div>';
		}._w(361);
		var create_export_data = function () {
			return {
				config: Config.get_saved_settings(),
				easy_list: EasyList.get_saved_settings()
			};
		}._w(362);
		var import_settings = function (data) {
			if (data !== null && typeof(data) === "object") {
				var v = data.config;
				if (typeof(v) !== "object") v = null;
				Config.set_saved_settings(v);

				v = data.easy_list;
				if (typeof(v) !== "object") v = null;
				EasyList.set_saved_settings(v);
			}
		}._w(363);
		var gen = function (container, option_type, title, message, pre) {
			var config_scope = config_temp[option_type],
				theme = Theme.classes,
				entry, table, row, cell, label, input, event,
				args, values, id, name, desc, type, value, obj, label_text, ext, i, ii, j, jj, n, n2, n3, v;

			// [ name, default, label, description, old_name, formatter, info? ]
			args = options[option_type];
			if (arguments.length > 5) args = Array.prototype.concat.call(args, Array.prototype.slice.call(arguments, 5));

			n = $.node("div", "xl-settings-heading" + theme);
			$.add(n, n2 = $.node("div", "xl-settings-heading-inner" + theme));
			$.add(n2, $.node("div", "xl-settings-heading-cell xl-settings-heading-title" + theme, title));
			if (message !== undefined) {
				$.add(n2, n3 = $.node("div", "xl-settings-heading-cell xl-settings-heading-subtitle" + theme));
				$.add(n3, message);
			}

			$.add(container, n);
			if (pre !== undefined) $.add(container, pre);

			n = $.node("div", "xl-settings-group xl-settings-group-" + option_type + theme);

			for (i = 0, ii = args.length; i < ii; ++i) {
				obj = args[i];
				name = obj[0];
				label_text = obj[2];
				desc = obj[3];
				ext = (obj.length > 5 ? obj[5] : null);
				if (ext === null || (type = ext.type) === undefined) type = "checkbox";
				value = (name === null ? null : config_scope[name]);
				id = "xl-settings-" + option_type + "-" + i;
				event = "change";

				$.add(n, entry = $.node("div", "xl-settings-entry" + theme));
				$.add(entry, table = $.node("div", "xl-settings-entry-table"));
				$.add(table, row = $.node("div", "xl-settings-entry-row"));

				$.add(row, cell = $.node("span", "xl-settings-entry-cell"));
				$.add(cell, label = $.node("label", "xl-settings-entry-label"));
				label.htmlFor = id;
				$.add(label, $.node("strong", "xl-settings-entry-label-name", label_text + ":"));
				if (desc.length > 0) {
					n2 = $.node("span", "xl-settings-entry-label-description");
					n2.innerHTML = " " + desc;
					$.add(label, n2);
				}

				if (type === "checkbox") {
					$.add(row, cell = $.node("span", "xl-settings-entry-cell"));
					$.add(cell, input = $.node("input", "xl-settings-entry-input" + theme));
					input.type = "checkbox";
					input.id = id;
					input.checked = value;
				}
				else if (type === "select") {
					$.add(row, cell = $.node("span", "xl-settings-entry-cell"));
					$.add(cell, input = $.node("select", "xl-settings-entry-input" + theme));

					values = ext.options;
					for (j = 0, jj = values.length; j < jj; ++j) {
						v = values[j];
						$.add(input, n2 = $.node("option", "xl-settings-entry-input-option", v[1]));
						n2.value = v[0];
						n2.selected = (v[0] === value);
						if (v.length > 2) n2.title = v[2];
					}
				}
				else if (type === "textbox") {
					$.add(row, cell = $.node("span", "xl-settings-entry-cell"));
					$.add(cell, input = $.node("input", "xl-settings-entry-input" + theme));
					input.type = "text";
					input.id = id;
					input.value = value;
				}
				else if (type === "textarea") {
					$.add(table, row = $.node("div", "xl-settings-entry-row"));
					$.add(row, cell = $.node("span", "xl-settings-entry-cell"));
					$.add(cell, input = $.node("textarea", "xl-settings-entry-input" + theme));
					input.wrap = "off";
					input.spellcheck = false;
					input.id = id;
					input.value = value;
				}
				else if (type === "button") {
					$.add(row, cell = $.node("span", "xl-settings-entry-cell"));
					$.add(cell, input = $.node("button", "xl-settings-entry-input" + theme, ext.text || ""));
					event = "click";
				}

				$.on(input, event, $.bind(on_change, input, type, option_type, name, ext));
			}

			$.add(container, n);
		}._w(364);

		var on_change = function (option_type, scope, name, extra, event) {
			var fn, v;

			if (name !== null) {
				if (option_type === "checkbox") {
					v = this.checked;
				}
				else if (option_type === "select" || option_type === "textbox" || option_type === "textarea") {
					v = this.value;
				}

				fn = (extra === null ? undefined : extra.set);
				if (fn !== undefined) fn.call(null, v);

				config_temp[scope][name] = v;
			}

			if (extra !== null && (fn = extra.on_change) !== undefined) {
				fn.call(this, event);
			}
		}._w(365);
		var on_cache_clear_click = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();

				var clears = API.cache_clear();
				Debug.log("Cleared cache; entries_removed=" + clears);
				this.textContent = "Cleared!";
			}
		}._w(366);
		var on_changelog_click = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();
				close(event);
				Changelog.open(null);
			}
		}._w(367);
		var on_export_click = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();
				close();
				open_export();
			}
		}._w(368);
		var on_save_click = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();

				config = config_temp;
				config_temp = null;

				Config.save();
				close();
			}
		}._w(369);
		var on_cancel_click = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();

				close();
			}
		}._w(370);
		var on_toggle_filter_guide = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();

				try {
					var n = this.parentNode.parentNode.parentNode.nextSibling;
					if (n.classList.contains("xl-settings-filter-guide")) {
						n.classList.toggle("xl-settings-filter-guide-visible");
					}
				}
				catch (e) {}
			}
		}._w(371);
		var on_color_helper_change = function () {
			var n = this.nextSibling,
				m;

			if (n !== null) {
				n.value = this.value.toUpperCase();
				n = n.nextSibling;
				if (n !== null) {
					m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(this.value);
					if (m !== null) {
						n.value = "rgba(" + parseInt(m[1], 16) + "," + parseInt(m[2], 16) + "," + parseInt(m[3], 16) + ",1)";
					}
				}
			}
		}._w(372);
		var on_settings_open_click = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();

				open();
			}
		}._w(373);

		// Public
		var ready = function () {
			Navigation.insert_link("main", "X-links", Main.homepage, " xl-nav-link-settings", on_settings_open_click);

			var n = $.link(Main.homepage, "xl-nav-link", "X-links Settings");
			$.on(n, "click", on_settings_open_click);
			HeaderBar.insert_menu_link(n);
		}._w(374);
		var open = function () {
			var theme = Theme.classes,
				content_container, n, n2;

			// Config
			config_temp = JSON.parse(JSON.stringify(config));

			// Popup
			popup = Popup.create("settings", [[{
				small: true,
				setup: function (container) {
					var n;
					$.add(container, $.link(Main.homepage, "xl-settings-title" + theme, "X-links"));
					$.add(container, n = $.link(Changelog.url, "xl-settings-version" + theme, Main.version.join(".")));
					$.on(n, "click", on_changelog_click);
				}._w(376)
			}, {
				align: "right",
				setup: function (container) {
					var n;
					$.add(container, n = $.link("https://github.com/dnsev-h/x-links/issues", "xl-settings-button" + theme));
					$.add(n, $.node("span", "xl-settings-button-text", "Issues"));

					$.add(container, n = $.link(Changelog.url, "xl-settings-button" + theme));
					$.add(n, $.node("span", "xl-settings-button-text", "Changelog"));
					$.on(n, "click", on_changelog_click);

					$.add(container, n = $.link("#", "xl-settings-button" + theme));
					$.add(n, $.node("span", "xl-settings-button-text", "Export"));
					$.on(n, "click", on_export_click);

					$.add(container, n = $.link("#", "xl-settings-button" + theme));
					$.add(n, $.node("span", "xl-settings-button-text", "Save settings"));
					$.on(n, "click", on_save_click);

					$.add(container, n = $.link("#", "xl-settings-button" + theme));
					$.add(n, $.node("span", "xl-settings-button-text", "Cancel"));
					$.on(n, "click", on_cancel_click);
				}._w(377)
			}], {
				body: true,
				setup: function (container) {
					content_container = container;
				}._w(378)
			}]);

			// Settings
			n = $.tnode("Note: you must reload the page after saving for some changes to take effect");
			gen(content_container, "general", "General", n);
			gen(content_container, "sites", "Sites");
			gen(content_container, "details", "Gallery Details");
			gen(content_container, "actions", "Gallery Actions");
			gen(content_container, "sauce", "ExSauce");
			n = $.link("#", "xl-settings-filter-guide-toggle", "Click here to toggle the guide");
			n2 = $.frag(html_filter_guide());
			$.on(n, "click", on_toggle_filter_guide);
			$.on($("input.xl-settings-color-input[type=color]", n2), "change", on_color_helper_change);
			Theme.apply(n2);
			gen(content_container, "filter", "Filtering", n, n2);
			gen(content_container, "debug", "Debugging", undefined, undefined,
				[ null, null,
					"Clear cache data", "Clear all cached gallery data",
					null,
					{ type: "button", text: "Clear", on_change: on_cache_clear_click },
				]
			);

			// Events
			$.on(popup, "click", on_cancel_click);

			// Add to body
			Popup.open(popup);

			// Focus
			n = $(".xl-popup-cell-size-scroll", popup);
			if (n !== null) $.scroll_focus(n);
		}._w(375);
		var open_export = function () {
			var theme = Theme.classes,
				nodes = {
					textarea: null
				},
				export_data_string, n;

			// Config
			export_data_string = JSON.stringify(create_export_data(), null, 2);
			export_url = window.URL.createObjectURL(new Blob([ export_data_string ], { type: "application/json" }));

			// Popup
			popup = Popup.create("settings", [[{
				small: true,
				setup: function (container) {
					$.add(container, $.link(Main.homepage, "xl-settings-title" + theme, "X-links"));
					$.add(container, $.node("span", "xl-settings-title-info" + theme, " - Settings export"));
				}._w(380)
			}, {
				align: "right",
				setup: function (container) {
					var d = new Date(),
						pad, n, fn;

					pad = function (s, len) {
						s = "" + s;
						while (s.length < len) s = "0" + s;
						return s;
					}._w(382);

					fn = $.node("input", "xl-settings-file-input");
					fn.type = "file";
					fn.accept = ".json";
					$.add(container, fn);
					$.on(fn, "change", function () {
						var files = this.files,
							reader;
						if (files.length > 0 && /\.json$/i.test(files[0].name)) {
							reader = new FileReader();
							reader.addEventListener("load", function () {
								var d = $.json_parse_safe(this.result, null);
								if (d !== null) {
									nodes.textarea.value = JSON.stringify(d, null, 2);
									nodes.textarea.classList.add("xl-settings-export-textarea-changed");
								}
							}._w(384), false);
							reader.readAsText(files[0]);
						}
						this.value = null;
					}._w(383));

					$.add(container, n = $.link(undefined, "xl-settings-button" + theme));
					$.add(n, $.node("span", "xl-settings-button-text", "Import"));
					$.on(n, "click", function (event) {
						event.preventDefault();
						fn.click();
					}._w(385));

					$.add(container, n = $.link(export_url, "xl-settings-button" + theme));
					n.removeAttribute("target");
					n.setAttribute("download",
						"X-links".toLowerCase() + "-settings-" +
						Main.version.join(".") + "-" +
						pad(d.getFullYear(), 4) + "." +
						pad(d.getMonth() + 1, 2) + "." +
						pad(d.getDate(), 2) + "-" +
						pad(d.getHours(), 2) + "." +
						pad(d.getMinutes(), 2) + ".json"
					);
					$.add(n, $.node("span", "xl-settings-button-text", "Export"));

					$.add(container, n = $.link("#", "xl-settings-button" + theme));
					$.add(n, $.node("span", "xl-settings-button-text", "Save settings"));
					$.on(n, "click", function (event) {
						if ($.is_left_mouse(event)) {
							event.preventDefault();
							var v = $.json_parse_safe(nodes.textarea.value, null);
							if (v !== null) {
								nodes.textarea.classList.remove("xl-settings-export-textarea-error");
								import_settings(v);
							}
							else {
								nodes.textarea.classList.add("xl-settings-export-textarea-error");
							}
							nodes.textarea.classList.remove("xl-settings-export-textarea-changed");
						}
					}._w(386));

					$.add(container, n = $.link("#", "xl-settings-button" + theme));
					$.add(n, $.node("span", "xl-settings-button-text", "Cancel"));
					$.on(n, "click", on_cancel_click);
				}._w(381)
			}], {
				padding: false,
				setup: function (container) {
					var n1, n2, n3;

					$.add(container, n1 = $.node("div", "xl-settings-export-message", "Disclaimer: changing these settings can easily break things. Edit at your own risk. ("));

					$.add(n1, n2 = $.node("label", "xl-settings-export-label"));
					$.add(n2, n3 = $.node("input", "xl-settings-export-checkbox"));
					$.add(n2, $.node("span", "xl-settings-export-label-text", "Enable editing"));
					$.add(n2, $.node("span", "xl-settings-export-label-text", "Editing enabled"));
					n3.type = "checkbox";
					n3.checked = false;
					$.on(n3, "change", function () {
						nodes.textarea.readOnly = !this.checked;
					}._w(388));

					$.add(n1, $.tnode(")"));

					$.add(container, n1);
				}._w(387)
			}, {
				body: true,
				padding: false,
				setup: function (container) {
					var n;

					n = $.node("textarea", "xl-settings-export-textarea" + theme);
					n.spellcheck = false;
					n.wrap = "off";
					n.value = export_data_string;
					n.readOnly = true;
					$.on(n, "input", function () {
						this.classList.add("xl-settings-export-textarea-changed");
					}._w(390));

					nodes.textarea = n;

					$.add(container, n);
				}._w(389)
			}]);
			$.on(popup, "click", on_cancel_click);

			// Add to body
			Popup.open(popup);

			// Focus
			n = $(".xl-settings-export-textarea", popup);
			if (n !== null) n.focus();
		}._w(379);
		var close = function () {
			config_temp = null;
			if (popup !== null) {
				Popup.close(popup);
				popup = null;
			}
			if (export_url !== null) {
				window.URL.revokeObjectURL(export_url);
				export_url = null;
			}
		}._w(391);

		// Exports
		return {
			ready: ready,
			open: open,
			open_export: open_export,
			close: close
		};

	}._w(360))();
	var Config = (function () {

		// Private
		var settings_key = "xlinks-settings";

		// Public
		var storage = (function () {
			try {
				if (!(
					GM_setValue && typeof(GM_setValue) === "function" &&
					GM_getValue && typeof(GM_getValue) === "function" &&
					GM_deleteValue && typeof(GM_deleteValue) === "function" &&
					GM_listValues && typeof(GM_listValues) === "function"
				)) {
					throw "";
				}
			}
			catch (e) {
				return window.localStorage;
			}

			return {
				getItem: function (key) {
					return GM_getValue(key, null);
				}._w(394),
				setItem: function (key, value) {
					GM_setValue(key, value);
				}._w(395),
				key: function (index) {
					return GM_listValues()[index];
				}._w(396),
				removeItem: function (key) {
					GM_deleteValue(key);
				}._w(397),
				clear: function () {
					var v = GM_listValues(), i, ii;
					for (i = 0, ii = v.length; i < ii; ++i) GM_deleteValue(v[i]);
				}._w(398),
				get length() {
					return GM_listValues().length;
				}
			};
		}._w(393))();

		var init = function () {
			var update = false,
				temp, temp_scope, info, scope, entry, value, i, ii, k, t;

			if (
				(temp = get_saved_settings()) === null ||
				typeof(temp) !== "object"
			) {
				temp = {};
				Main.version_change = 2;
			}

			if (typeof(temp.settings_version) === "number") {
				// New settings
				for (k in options) {
					config[k] = scope = {};
					info = options[k];
					ii = info.length;

					temp_scope = temp[k];
					if (typeof(temp_scope) !== "object" || temp_scope === null) temp_scope = {};

					for (i = 0; i < ii; ++i) {
						entry = info[i];
						t = entry[0]; // name
						value = temp_scope[t];
						if (value === undefined) {
							value = entry[1]; // default
							update = true;
						}
						scope[t] = value;
					}
				}
			}
			else {
				// Load from old version
				update = true;
				for (k in options) {
					config[k] = scope = {};
					info = options[k];
					for (i = 0, ii = info.length; i < ii; ++i) {
						entry = info[i];
						t = entry[4]; // old_name
						if (
							t === null ||
							(value = (typeof(t) === "string" ? temp[t] : t.call(null, temp))) === undefined
						) {
							value = entry[1]; // default
						}
						scope[entry[0]] = value;
					}
				}
			}

			// Version change
			value = temp.version;
			if (value === undefined) value = [];
			i = Main.version_compare(Main.version, value);
			if (i !== 0) {
				update = true;
				if (Main.version_change === 0) {
					Main.version_change = i;
				}
			}

			// Save changes
			if (update) save();
		}._w(399);
		var ready = function () {
			var domain = $.get_domain(window.location.href);

			if (domain === "4chan.org") {
				Module.mode = "4chan";
				Module.is_4chan = true;
				Module.is_4chan_x3 = d.documentElement.classList.contains("fourchan-x");
			}
			else if (domain === "desustorage.org" || domain === "fgts.jp") {
				if (d.doctype.publicId) {
					Module.mode = "fuuka";
					Module.is_fuuka = true;
				}
				else {
					Module.mode = "foolz";
					Module.is_foolz = true;
				}
				Module.linkify = false;
			}
			else if (domain === "e-hentai.org") {
				if ($("#ipbwrapper") === null) {
					Module.mode = "ipb";
					Module.is_ipb = true;
				}
				else {
					Module.mode = "ipb_lofi";
					Module.is_ipb_lofi = true;
				}
				Module.linkify = false;
				Module.dynamic = false;
			}
			else { // assume tinyboard
				Module.mode = "tinyboard";
				Module.is_tinyboard = true;
				Module.linkify = false;
				if ($("form[name=postcontrols]") === null) return false;
			}

			return true;
		}._w(400);
		var save = function () {
			config.version = Main.version;
			storage.setItem(settings_key, JSON.stringify(config));
			config.version = null;
		}._w(401);
		var get_saved_settings = function () {
			return $.json_parse_safe(storage.getItem(settings_key), null);
		}._w(402);
		var set_saved_settings = function (data) {
			if (data === null) {
				storage.removeItem(settings_key);
			}
			else {
				storage.setItem(settings_key, JSON.stringify(data));
			}
		}._w(403);

		// Exports
		var Module = {
			mode: "4chan", // foolz, fuuka, tinyboard, ipb, ipb_lofi
			is_4chan: false,
			is_4chan_x3: false,
			is_foolz: false,
			is_fuuka: false,
			is_tinyboard: false,
			is_ipb: false,
			is_ipb_lofi: false,
			linkify: true,
			dynamic: true,
			storage: storage,
			init: init,
			ready: ready,
			save: save,
			get_saved_settings: get_saved_settings,
			set_saved_settings: set_saved_settings
		};

		return Module;

	}._w(392))();
	var Filter = (function () {

		// Private
		var active_filters = null,
			good_values = [ "", "true", "yes" ],
			Status = { None: 0, Bad: -1, Good: 1 },
			cache = { tags: {} };

		var Filter = function (regex, flags, priority) {
			this.regex = regex;
			this.flags = flags;
			this.priority = priority;
		}._w(405);
		var FilterFlags = function () {
			this.title = true;
			this.tags = true;
			this.uploader = false;
			this.bad = false;

			this.only = null;
			this.not = null;
			this.site = null;

			this.color = "#EE2200";
			this.underline = null;
			this.background = null;
			this.link_color = this.color;
			this.link_underline = null;
			this.link_background = null;
		}._w(406);
		FilterFlags.scope_fn = function (name) {
			return function (value, state) {
				if (!state.scope) {
					state.scope = true;
					this.tags = false;
					this.title = false;
					this.uploader = false;
				}

				this[name] = (good_values.indexOf(value.trim().toLowerCase()) >= 0);
			}._w(408);
		}._w(407);
		FilterFlags.color_fn = function (fn) {
			return function (value, state) {
				if (!state.color) {
					state.color = true;
					this.color = null;
					this.underline = null;
					this.background = null;
					this.link_color = null;
					this.link_underline = null;
					this.link_background = null;
				}

				fn.call(this, value.trim());
			}._w(410);
		}._w(409);
		FilterFlags.names = {
			"tags": FilterFlags.scope_fn("tags"),
			"title": FilterFlags.scope_fn("title"),
			"uploader": FilterFlags.scope_fn("uploader"),

			"bad": FilterFlags.color_fn(function (value) {
				this.bad = (good_values.indexOf(value.toLowerCase()) >= 0);
			}._w(411)),

			"only": function (value) {
				this.only = this.split(value);
			}._w(412),
			"not": function (value) {
				this.not = this.split(value);
			}._w(413),
			"site": function (value) {
				this.site = this.split(value);
			}._w(414),

			"colors": FilterFlags.color_fn(function (value) {
				this.color = value;
				this.link_color = value;
			}._w(415)),
			"underlines": FilterFlags.color_fn(function (value) {
				this.underline = value;
				this.link_underline = value;
			}._w(416)),
			"backgrounds": FilterFlags.color_fn(function (value) {
				this.background = value;
				this.link_background = value;
			}._w(417)),

			"color": FilterFlags.color_fn(function (value) {
				this.color = value;
			}._w(418)),
			"underline": FilterFlags.color_fn(function (value) {
				this.underline = value;
			}._w(419)),
			"background": FilterFlags.color_fn(function (value) {
				this.background = value;
			}._w(420)),

			"link-color": FilterFlags.color_fn(function (value) {
				this.link_color = value;
			}._w(421)),
			"link-underline": FilterFlags.color_fn(function (value) {
				this.link_underline = value;
			}._w(422)),
			"link-background": FilterFlags.color_fn(function (value) {
				this.link_background = value;
			}._w(423)),

			"no-colors": function (value, state) {
				state.color = true;

				value = null;
				this.color = value;
				this.underline = value;
				this.background = value;
				this.link_color = value;
				this.link_underline = value;
				this.link_background = value;
			}._w(424),

			"tag": "tags",

			"category": "only",
			"cat": "only",
			"no": "not",
			"sites": "site",

			"cs": "colors",
			"us": "underlines",
			"bgs": "backgrounds",

			"c": "color",
			"u": "underline",
			"bg": "background",

			"link_color": "link-color",
			"link-c": "link-color",
			"link_c": "link-color",
			"lc": "link-color",
			"link_underline": "link-underline",
			"link-u": "link-underline",
			"link_u": "link-underline",
			"lu": "link-underline",
			"link_background": "link-background",
			"link-bg": "link-background",
			"link_bg": "link-background",
			"lbg": "link-background",

			"no_colors": "no-colors",
			"no-color": "no-colors",
			"no_color": "no-colors",
			"nocolors": "no-colors",
			"nocolor": "no-colors",
		};
		FilterFlags.prototype.setup = function (flags_obj) {
			var state = {
				scope: false,
				color: false
			}, k, fn;

			for (k in flags_obj) {
				fn = FilterFlags.names[k];
				if (fn !== undefined) {
					if (typeof(fn) === "string") {
						fn = FilterFlags.names[fn];
					}
					fn.call(this, flags_obj[k], state);
				}
			}
		}._w(425);
		FilterFlags.prototype.split = function (text) {
			var array, i, ii;

			text = text.trim();
			if (text.length === 0) return null;

			array = text.toLowerCase().split(",");
			for (i = 0, ii = array.length; i < ii; ++i) {
				array[i] = array[i].trim();
			}

			return array;
		}._w(426);
		var Match = function (start, end, filter) {
			this.start = start;
			this.end = end;
			this.filter = filter;
		}._w(427);
		var MatchSegment = function (start, end, data) {
			this.start = start;
			this.end = end;
			this.data = data;
		}._w(428);
		var MatchInfo = function () {
			this.matches = [];
			this.any = false;
			this.bad = false;
		}._w(429);

		var create_regex = function (pattern, flags) {
			if (flags.indexOf("g") < 0) flags += "g";

			try {
				return new RegExp(pattern, flags);
			}
			catch (e) {
				return null;
			}
		}._w(430);
		var create_flags = function (text) {
			var flaglist = text.split(";"),
				flags = {},
				key, m, i, f;

			for (i = 0; i < flaglist.length; ++i) {
				if (flaglist[i].length > 0) {
					m = flaglist[i].split(":");
					key = m[0].trim().toLowerCase();
					m.splice(0, 1);
					flags[key] = m.join("").trim();
				}
			}

			f = new FilterFlags();
			f.setup(flags);
			return f;
		}._w(431);
		var matches_to_segments = function (text, matches) {
			var segments = [ new MatchSegment(0, text.length, []) ],
				hit, m, s, i, ii, j, jj;

			if (config.filter.full_highlighting) { // fast mode
				for (i = 0, ii = matches.length; i < ii; ++i) {
					segments[0].data.push(matches[i].filter);
				}
			}
			else {
				for (i = 0, ii = matches.length; i < ii; ++i) {
					m = matches[i];
					hit = false;
					for (j = 0, jj = segments.length; j < jj; ++j) {
						s = segments[j];
						if (m.start < s.end && m.end > s.start) {
							hit = true;
							j = update_segments(segments, j, m, s);
						}
						else if (hit) {
							break;
						}
					}
				}
			}

			return segments;
		}._w(432);
		var update_segments = function (segments, pos, match, segment) {
			var data = segment.data.slice(0),
				s1, s2;

			segment.data.push(match.filter);

			if (match.start > segment.start) {
				if (match.end < segment.end) {
					// cut at both
					s1 = new MatchSegment(segment.start, match.start, data);
					s2 = new MatchSegment(match.end, segment.end, data.slice(0));
					segment.start = match.start;
					segment.end = match.end;
					segments.splice(pos, 0, s1);
					pos += 2;
					segments.splice(pos, 0, s2);
				}
				else {
					// cut at start
					s1 = new MatchSegment(segment.start, match.start, data);
					segment.start = match.start;
					segments.splice(pos, 0, s1);
					pos += 1;
				}
			}
			else {
				if (match.end < segment.end) {
					// cut at end
					s2 = new MatchSegment(match.end, segment.end, data);
					segment.end = match.end;
					pos += 1;
					segments.splice(pos, 0, s2);
				}
				// else, cut at neither
			}

			return pos;
		}._w(433);
		var apply_styles = function (node, styles) {
			var color = null,
				background = null,
				underline = null,
				p1 = -1,
				p2 = -1,
				p3 = -1,
				style, i, ii, s, p;

			for (i = 0, ii = styles.length; i < ii; ++i) {
				p = styles[i].priority;
				style = styles[i].flags;
				if ((s = style.color) !== null && p >= p1) {
					color = s;
					p1 = p;
				}
				if ((s = style.background) !== null && p >= p2) {
					background = s;
					p2 = p;
				}
				if ((s = style.underline) !== null && p >= p3) {
					underline = s;
					p3 = p;
				}
			}

			apply_styling(node, color, background, underline);
		}._w(434);
		var apply_styling = function (node, color, background, underline) {
			if (color !== null) {
				node.style.setProperty("color", color, "important");
			}
			if (background !== null) {
				node.style.setProperty("background-color", background, "important");
			}
			if (underline !== null) {
				node.style.setProperty("border-bottom", "0.125em solid " + underline, "important");
			}
		}._w(435);
		var append_match_datas = function (matchinfo, target) {
			for (var i = 0, ii = matchinfo.matches.length; i < ii; ++i) {
				target.push(matchinfo.matches[i].filter);
			}
		}._w(436);
		var remove_non_bad = function (list) {
			for (var i = 0; i < list.length; ) {
				if (!list[i].bad) {
					list.splice(i, 1);
					continue;
				}
				++i;
			}
		}._w(437);
		var check_multiple = function (type, text, filters, category, site_type) {
			var info = new MatchInfo(),
				filter, match, i, ii;

			for (i = 0, ii = filters.length; i < ii; ++i) {
				filter = filters[i];
				if (filter.flags[type] !== true) continue;
				filter.regex.lastIndex = 0;
				while (true) {
					match = check_single(text, filter, category, site_type);
					if (match === null) break;

					info.any = true;
					info.matches.push(match);
					if (match.filter.flags.bad) {
						info.bad = true;
					}
				}
			}

			return info;
		}._w(438);
		var check_single = function (text, filter, category, site_type) {
			// return null if no match
			// return a new Match if a match was found
			var list, i, ii, m;

			// Site filtering
			if ((list = filter.flags.site) !== null) {
				for (i = 0, ii = list.length; i < ii; ++i) {
					if (list[i] === site_type) break;
				}
				if (i >= ii) return null;
			}

			// Category filtering
			if ((list = filter.flags.only) !== null) {
				for (i = 0, ii = list.length; i < ii; ++i) {
					if (list[i] === category) break;
				}
				if (i >= ii) return null;
			}
			if ((list = filter.flags.not) !== null) {
				for (i = 0, ii = list.length; i < ii; ++i) {
					if (list[i] === category) return null;
				}
			}

			// Text filter
			m = filter.regex.exec(text);
			return (m === null) ? null : new Match(m.index, m.index + m[0].length, filter);
		}._w(439);
		var hl_return = function (bad, node) {
			if (bad) {
				node.classList.add("xl-filter-bad");
				return Status.Bad;
			}
			else {
				node.classList.add("xl-filter-good");
				return Status.Good;
			}
		}._w(440);
		var init_filters = function () {
			active_filters = config.filter.enabled ? parse(config.filter.filters, 0) : [];
		}._w(441);

		// Public
		var parse = function (input, start_priority) {
			var filters = [],
				lines = (input || "").split("\n"),
				i, pos, pos2, flags, line, regex;

			if (start_priority === undefined) start_priority = (active_filters === null ? 0 : active_filters.length);

			for (i = 0; i < lines.length; ++i) {
				line = lines[i].trim();
				if (line.length === 0) continue;
				if (line[0] === "/" && (pos = line.lastIndexOf("/")) > 0) {
					++pos;
					pos2 = line.indexOf(";", pos);

					regex = line.substr(1, pos - 2);
					if (pos2 >= 0) {
						flags = line.substr(pos, pos2 - pos);
						pos = pos2 + 1;
					}
					else {
						flags = line.substr(pos);
						pos = line.length;
					}
					regex = create_regex(regex, flags);

					if (regex !== null) {
						flags = create_flags(line.substr(pos));
						filters.push(new Filter(regex, flags, start_priority));
						++start_priority;
					}
				}
				else if (line[0] !== "#") {
					if ((pos = line.indexOf(";")) > 0) {
						regex = line.substr(0, pos);
						flags = create_flags(line.substr(pos));
					}
					else {
						regex = line;
						flags = create_flags("");
					}
					regex = new RegExp($.regex_escape(regex), "ig");

					filters.push(new Filter(regex, flags, start_priority));
					++start_priority;
				}
			}

			return filters;
		}._w(442);
		var highlight = function (type, node, data, input_state, results, extras) {
			if (active_filters === null) init_filters();

			var no_extras = true,
				filters = active_filters,
				category = API.get_category(data.category).short_name,
				site_type = data.type,
				cache_key = site_type + "_" + category,
				info, matches, text, frag, segment, cache_type, bad, c, i, t, n1, n2;

			if (extras && extras.length > 0) {
				filters = filters.concat(extras);
				no_extras = false;
			}
			if (filters.length === 0) {
				return Status.None;
			}

			// Cache for tags
			text = node.textContent;
			if (
				no_extras &&
				input_state !== Status.Bad &&
				(cache_type = cache[type]) !== undefined &&
				(c = cache_type[cache_key]) !== undefined &&
				(c = c[text]) !== undefined
			) {
				if (c === null) {
					return Status.None;
				}

				// Results
				if (results !== undefined) {
					append_match_datas(c[0], results);
				}

				// Clone
				n1 = c[1].cloneNode(true);
				node.innerHTML = "";
				while ((n2 = n1.firstChild) !== null) {
					$.add(node, n2);
				}
				return hl_return(n1.classList.contains("xl-filter-bad"), node);
			}

			// Check filters
			info = check_multiple(type, text, filters, category, site_type);
			if (!info.any) {
				if (cache_type !== undefined) {
					if ((c = cache_type[cache_key]) === undefined) {
						cache_type[cache_key] = c = {};
					}
					c[text] = null;
				}
				return Status.None;
			}

			// If bad, remove all non-bad filters
			bad = (info.bad || input_state === Status.Bad);
			if (bad) {
				for (i = 0; i < info.matches.length; ) {
					if (!info.matches[i].filter.flags.bad) {
						info.matches.splice(i, 1);
						continue;
					}
					++i;
				}
			}

			// Results
			if (results !== undefined) {
				append_match_datas(info, results);
			}

			// Merge
			matches = matches_to_segments(text, info.matches);

			frag = d.createDocumentFragment();
			for (i = 0; i < matches.length; ++i) {
				segment = matches[i];
				t = text.substring(segment.start, segment.end);
				if (segment.data.length === 0) {
					$.add(frag, $.tnode(t));
				}
				else {
					n1 = $.node("span", "xl-filter-text");
					n2 = $.node("span", "xl-filter-text-inner", t);
					$.add(n1, n2);
					$.add(frag, n1);
					apply_styles(n1, segment.data);
				}
			}

			// Replace
			node.innerHTML = "";
			$.add(node, frag);
			if (cache_type !== undefined) {
				if ((c = cache_type[cache_key]) === undefined) {
					cache_type[cache_key] = c = {};
				}
				c[text] = [ info, node ];
			}
			return hl_return(bad, node);
		}._w(443);
		var highlight_tag = function (node, link, filter_data) {
			if (filter_data[0] === Status.Bad) {
				node.classList.add("xl-filter-bad");
				link.classList.add("xl-filter-bad");
				link.classList.remove("xl-filter-good");
			}
			else {
				node.classList.add("xl-filter-good");
				link.classList.add("xl-filter-good");
			}

			// Get styles
			var color = null,
				background = null,
				underline = null,
				p1 = -1,
				p2 = -1,
				p3 = -1,
				n, n1, n2;

			var get_style = function (styles) {
				var style, i, ii, p, s;
				for (i = 0, ii = styles.length; i < ii; ++i) {
					p = styles[i].priority;
					style = styles[i].flags;
					if ((s = style.link_color) !== null && p >= p1) {
						color = s;
						p1 = p;
					}
					if ((s = style.link_background) !== null && p >= p2) {
						background = s;
						p2 = p;
					}
					if ((s = style.link_underline) !== null && p >= p3) {
						underline = s;
						p3 = p;
					}
				}
			}._w(445);

			get_style(filter_data[1].uploader);
			get_style(filter_data[1].title);
			get_style(filter_data[1].tags);

			// Apply styles
			if (
				(color !== null || background !== null || underline !== null) &&
				(node = UI.button_get_inner(node)) !== null
			) {
				n1 = $.node("span", "xl-filter-text");
				n2 = $.node("span", "xl-filter-text-inner");
				while ((n = node.firstChild) !== null) {
					$.add(n2, n);
				}
				$.add(n1, n2);
				$.add(node, n1);
				apply_styling(n1, color, background, underline);
			}
		}._w(444);
		var check = function (titlenode, data, extras) {
			if (active_filters === null) init_filters();

			var filters = active_filters,
				status = Status.None,
				category = API.get_category(data.category).short_name,
				site_type = data.type,
				str, tags, result, i, info;

			if (extras && extras.length > 0) {
				filters = filters.concat(extras);
			}

			result = {
				tags: [],
				uploader: [],
				title: [],
			};

			// Title
			if (filters.length > 0) {
				// Uploader
				if ((str = data.uploader)) {
					info = check_multiple("uploader", str, filters, category, site_type);
					if (info.any) {
						append_match_datas(info, result.uploader);
						if (info.bad) {
							status = Status.Bad;
						}
						else if (status === Status.None) {
							status = Status.Good;
						}
					}
				}

				// Tags
				if ((tags = data.tags) && tags.length > 0) {
					for (i = 0; i < tags.length; ++i) {
						info = check_multiple("tags", tags[i], filters, category, site_type);
						if (info.any) {
							append_match_datas(info, result.tags);
							if (info.bad) {
								status = Status.Bad;
							}
							else if (status === Status.None) {
								status = Status.Good;
							}
						}
					}
					// Remove dups
					result.tags = result.tags.filter(function (item, pos, self) {
						return (self.indexOf(item) === pos);
					}._w(447));
				}
			}

			i = highlight("title", titlenode, data, status, result.title, extras);
			if (status === Status.None || i === Status.Bad) {
				status = i;
			}

			// Remove non-bad filters on result.tags and result.uploader
			if (status === Status.Bad) {
				remove_non_bad(result.uploader);
				remove_non_bad(result.tags);
			}

			return [ status , (status === Status.None ? null : result) ];
		}._w(446);

		// Export
		return {
			None: Status.None,
			Bad: Status.Bad,
			Good: Status.Good,
			parse: parse,
			check: check,
			highlight: highlight,
			highlight_tag: highlight_tag
		};

	}._w(404))();
	var Theme = (function () {

		// Private
		var current = "light",
			post_bg = "#ffffff";

		var to_hex2 = function (n) {
			n = n.toString(16);
			if (n.length < 2) n = "0" + n;
			return n;
		}._w(449);
		var detect = function () {
			var doc_el = d.documentElement,
				body = d.body,
				n = d.createElement("div"),
				color, colors, i, j, a, a_inv;

			if (!doc_el || !body) {
				return null;
			}

			if (Config.is_ipb) {
				n.className = "post2";
			}
			else if (Config.is_ipb_lofi) {
				n.className = "posttopbar";
			}
			else {
				n.className = "post reply post_wrapper";
			}
			$.add(body, n);

			color = parse_css_color(get_computed_style(doc_el).backgroundColor);
			colors = [
				parse_css_color(get_computed_style(body).backgroundColor),
				parse_css_color(get_computed_style(n).backgroundColor),
			];

			for (i = 0; i < colors.length; ++i) {
				a = colors[i][3];
				a_inv = (1.0 - a) * color[3];

				for (j = 0; j < 3; ++j) {
					color[j] = (color[j] * a_inv + colors[i][j] * a);
				}
				color[3] = Math.max(color[3], a);
			}

			body.removeChild(n);

			if (color[3] === 0) return null;

			return [
				(color[0] + color[1] + color[2] < 384) ? "dark" : "light",
				"#" + to_hex2(colors[1][0]) + to_hex2(colors[1][1]) + to_hex2(colors[1][2])
			];
		}._w(450);
		var update = function (change_nodes) {
			var new_theme = detect();
			if (new_theme !== null) {
				if (new_theme[0] !== current) {
					if (change_nodes) update_nodes(new_theme);
					current = new_theme[0];
					Theme.classes = (current === "light" ? " xl-theme" : " xl-theme xl-theme-dark");
				}
				if (new_theme[1] !== post_bg) {
					post_bg = new_theme[1];
					if (change_nodes) update_nodes_bg();
				}
				return true;
			}
			return false;
		}._w(451);
		var update_nodes = function (new_theme) {
			var nodes = $$(".xl-theme"),
				ii = nodes.length,
				cls, i;
			if (new_theme === "light") {
				cls = "xl-theme-" + current;
				for (i = 0; i < ii; ++i) {
					nodes[i].classList.remove(cls);
				}
			}
			else {
				cls = "xl-theme-" + new_theme;
				for (i = 0; i < ii; ++i) {
					nodes[i].classList.add(cls);
				}
			}
		}._w(452);
		var update_nodes_bg = function () {
			var nodes = $$(".xl-theme-post-bg"),
				i, ii;
			for (i = 0, ii = nodes.length; i < ii; ++i) {
				nodes[i].style.backgroundColor = post_bg;
			}
		}._w(453);

		var on_head_mutate = function (records) {
			var nodes, node, tag, i, ii, j, jj;

			for (i = 0, ii = records.length; i < ii; ++i) {
				if ((nodes = records[i].addedNodes)) {
					for (j = 0, jj = nodes.length; j < jj; ++j) {
						node = nodes[j];
						tag = node.tagName;
						if (tag === "STYLE" || (tag === "LINK" && /\bstylesheet\b/.test(node.rel))) {
							update(true);
							return;
						}
					}
				}
				if ((nodes = records[i].removedNodes)) {
					for (j = 0, jj = nodes.length; j < jj; ++j) {
						node = nodes[j];
						tag = node.tagName;
						if (tag === "STYLE" || (tag === "LINK" && /\bstylesheet\b/.test(node.rel))) {
							update(true);
							return;
						}
					}
				}
			}
		}._w(454);

		// Public
		var ready = function () {
			update(false);

			if (d.head) {
				new MutationObserver(on_head_mutate).observe(d.head, { childList: true });
			}
		}._w(455);
		var bg = function (node) {
			node.classList.add("xl-theme-post-bg");
			node.style.backgroundColor = post_bg;
		}._w(456);
		var apply = function (node) {
			if (current !== "light") {
				var nodes = $$(".xl-theme", node),
					i, ii;

				for (i = 0, ii = nodes.length; i < ii; ++i) {
					nodes[i].classList.add("xl-theme-dark");
				}

				if (node.classList && node.classList.contains("xl-theme")) {
					node.classList.add("xl-theme-dark");
				}
			}
		}._w(457);
		var get_computed_style = function (node) {
			try {
				// Don't use window.getComputedStyle: https://code.google.com/p/chromium/issues/detail?id=538650
				return document.defaultView.getComputedStyle(node);
			}
			catch (e) {
				return node.style || {};
			}
		}._w(458);
		var parse_css_color = function (color) {
			if (color && color !== "transparent") {
				var m;
				if ((m = /^rgba?\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\s*(?:,\s*([0-9\.]+)\s*)?\)$/.exec(color))) {
					return [
						parseInt(m[1], 10),
						parseInt(m[2], 10),
						parseInt(m[3], 10),
						m[4] === undefined ? 1 : parseFloat(m[4])
					];
				}
				else if ((m = /^#([0-9a-fA-F]{3,})$/.exec(color))) {
					if ((m = m[1]).length === 6) {
						return [
							parseInt(m.substr(0, 2), 16),
							parseInt(m.substr(2, 2), 16),
							parseInt(m.substr(4, 2), 16),
							1
						];
					}
					else {
						return [
							parseInt(m[0], 16),
							parseInt(m[1], 16),
							parseInt(m[2], 16),
							1
						];
					}
				}
			}

			return [ 0 , 0 , 0 , 0 ];
		}._w(459);

		// Exports
		var Module =  {
			classes: " xl-theme",
			ready: ready,
			bg: bg,
			apply: apply,
			get_computed_style: get_computed_style,
			parse_css_color: parse_css_color
		};

		return Module;

	}._w(448))();
	var EasyList = (function () {

		var Entry = function (domain, site, gid) {
			this.domain = domain;
			this.namespace = site;
			this.id = gid;
			this.node = null;
		}._w(461);

		// Private
		var settings_key = "xlinks-easylist-settings",
			popup = null,
			options_container = null,
			empty_notification = null,
			content_container = null,
			content_current = 0,
			contents = [{
				entries: [],
				container: null,
				visible: 0
			}, {
				entries: [],
				container: null,
				visible: 0
			}],
			queue = [],
			data_map = {},
			queue_timer = null,
			custom_filters = [],
			custom_links = [],
			custom_links_map = {},
			custom_links_text = "",
			node_sort_order_keys = {
				thread: [ "data-xl-index", 1 ],
				upload: [ "data-xl-date-uploaded", -1 ],
				rating: [ "data-xl-rating", -1 ]
			},
			display_mode_names = [
				"full",
				"compact",
				"minimal"
			],
			settings = {
				sort_by: "thread",
				group_by_category: false,
				group_by_filters: false,
				custom_filters: "# Custom filters follow the same rules as standard filters\n",
				display_mode: 0, // 0 = full, 1 = compact, 2 = minimal
				filter_visibility: 0 // 0 = show all, 1 = hide bad, 2 = only show matches
			};

		var settings_save = function () {
			Config.storage.setItem(settings_key, JSON.stringify(settings));
		}._w(462);
		var settings_load = function () {
			// Load
			var value = get_saved_settings(),
				k;

			if (value !== null && typeof(value) === "object") {
				for (k in settings) {
					if (
						Object.prototype.hasOwnProperty.call(settings, k) &&
						Object.prototype.hasOwnProperty.call(value, k) &&
						typeof(settings[k]) === typeof(value[k])
					) {
						settings[k] = value[k];
					}
				}
			}

			// Load filters
			load_filters();
		}._w(463);
		var create = function () {
			popup = Popup.create("easylist", function (container) {
				var theme = Theme.classes,
					n1, n2;

				// Overlay
				$.add(container, n1 = $.node("div", "xl-easylist-title"));

				$.add(n1, $.node("span", "xl-easylist-title-text", "X-links Easy List"));
				$.add(n1, $.node("span", "xl-easylist-subtitle", "More porn, less hassle"));

				// Close
				$.add(container, n1 = $.node("div", "xl-easylist-control-links"));

				$.add(n1, n2 = $.link(undefined, "xl-easylist-control-link xl-easylist-control-link-options", "options"));
				$.on(n2, "click", on_options_click);

				$.add(n1, n2 = $.link(undefined, "xl-easylist-control-link", "close"));
				$.on(n2, "click", on_close_click);

				$.add(container, $.node("div", "xl-easylist-title-line"));

				// Settings
				options_container = create_options(theme);
				$.add(container, options_container);

				// Empty notification
				empty_notification = $.node("div",
					"xl-easylist-empty-notification xl-easylist-empty-notification-visible",
					"No galleries found"
				);
				$.add(container, empty_notification);

				// Items list
				contents[0].container = $.node("div", "xl-easylist-items" + theme);
				contents[1].container = $.node("div", "xl-easylist-items" + theme);
				$.add(container, contents[content_current].container);

				content_container = container;
			}._w(465));

			$.on(popup, "click", on_overlay_click);

			// Setup
			update_display_mode(true);
		}._w(464);
		var create_options = function (theme) {
			var fn, n1, n2, n3, n4, n5;

			n1 = $.node("div", "xl-easylist-options");
			$.add(n1, n2 = $.node("div", "xl-easylist-option-table"));


			$.add(n2, n3 = $.node("div", "xl-easylist-option-row"));
			$.add(n3, n4 = $.node("div", "xl-easylist-option-cell"));
			$.add(n4, $.node("span", "xl-easylist-option-title", "Sort by:"));

			$.add(n3, n4 = $.node("div", "xl-easylist-option-cell"));

			fn = function (value, text) {
				var n1 = $.node("label", "xl-easylist-option-label"),
					n2 = $.node("input", "xl-easylist-option-input");

				n2.name = "xl-easylist-options-sort-by";
				n2.type = "radio";
				n2.checked = (settings.sort_by === value);
				n2.value = value;

				$.add(n1, n2);
				$.add(n1, $.node("span", "xl-easylist-option-button" + theme, text));

				$.on(n2, "change", on_option_change.sort_by);

				return n1;
			}._w(467);
			$.add(n4, fn("thread", "Appearance in thread"));
			$.add(n4, fn("upload", "Upload date"));
			$.add(n4, fn("rating", "Rating"));

			$.add(n2, n3 = $.node("div", "xl-easylist-option-row"));
			$.add(n3, n4 = $.node("div", "xl-easylist-option-cell"));
			$.add(n4, $.node("span", "xl-easylist-option-title", "Group by:"));

			$.add(n3, n4 = $.node("div", "xl-easylist-option-cell"));

			fn = function (checked, text, change_fn) {
				var n1 = $.node("label", "xl-easylist-option-label"),
					n2 = $.node("input", "xl-easylist-option-input");

				n2.type = "checkbox";
				n2.checked = checked;

				$.add(n1, n2);
				$.add(n1, $.node("span", "xl-easylist-option-button" + theme, text));

				$.on(n2, "change", change_fn);

				return n1;
			}._w(468);
			$.add(n4, fn(settings.group_by_filters, "Filters", on_option_change.group_by_filters));
			$.add(n4, fn(settings.group_by_category, "Category", on_option_change.group_by_category));


			$.add(n2, n3 = $.node("div", "xl-easylist-option-row"));
			$.add(n3, n4 = $.node("div", "xl-easylist-option-cell"));
			$.add(n4, $.node("span", "xl-easylist-option-title", "Display mode:"));

			$.add(n3, n4 = $.node("div", "xl-easylist-option-cell"));

			fn = function (value, text) {
				var n1 = $.node("label", "xl-easylist-option-label"),
					n2 = $.node("input", "xl-easylist-option-input");

				n2.name = "xl-easylist-options-display";
				n2.type = "radio";
				n2.checked = (settings.display_mode === value);
				n2.value = "" + value;

				$.add(n1, n2);
				$.add(n1, $.node("span", "xl-easylist-option-button" + theme, text));

				$.on(n2, "change", on_option_change.display_mode);

				return n1;
			}._w(469);
			$.add(n4, fn(0, "Full"));
			$.add(n4, fn(1, "Compact"));
			$.add(n4, fn(2, "Minimal"));


			$.add(n2, n3 = $.node("div", "xl-easylist-option-row"));
			$.add(n3, n4 = $.node("div", "xl-easylist-option-cell"));
			$.add(n4, $.node("span", "xl-easylist-option-title", "Filter visibility:"));

			$.add(n3, n4 = $.node("div", "xl-easylist-option-cell"));

			fn = function (value, text) {
				var n1 = $.node("label", "xl-easylist-option-label"),
					n2 = $.node("input", "xl-easylist-option-input");

				n2.name = "xl-easylist-options-filter-visibility";
				n2.type = "radio";
				n2.checked = (settings.filter_visibility === value);
				n2.value = "" + value;

				$.add(n1, n2);
				$.add(n1, $.node("span", "xl-easylist-option-button" + theme, text));

				$.on(n2, "change", on_option_change.filter_visibility);

				return n1;
			}._w(470);
			$.add(n4, fn(0, "Show all"));
			$.add(n4, fn(1, "Hide bad"));
			$.add(n4, fn(2, "Only show matches"));


			$.add(n2, n3 = $.node("div", "xl-easylist-option-row"));
			$.add(n3, n4 = $.node("div", "xl-easylist-option-cell"));
			$.add(n4, $.node("span", "xl-easylist-option-title", "Custom filters:"));

			$.add(n3, n4 = $.node("div", "xl-easylist-option-cell"));

			$.add(n4, n5 = $.node("textarea", "xl-easylist-option-textarea" + theme));
			n5.value = settings.custom_filters;
			n5.wrap = "off";
			n5.spellcheck = false;
			$.on(n5, "change", on_option_change.custom_filters);
			$.on(n5, "input", on_option_change.custom_filters_input);


			$.add(n2, n3 = $.node("div", "xl-easylist-option-row"));
			$.add(n3, n4 = $.node("div", "xl-easylist-option-cell"));
			$.add(n4, $.node("span", "xl-easylist-option-title", "Custom links:"));
			$.add(n4, $.node_simple("br"));
			$.add(n4, n5 = $.node("div", "xl-easylist-option-title-sub"));
			$.add(n5, $.node("div", "xl-easylist-option-title-sub-text", "Display a list of links from an external source"));

			$.add(n3, n4 = $.node("div", "xl-easylist-option-cell"));

			$.add(n4, n5 = $.node("textarea", "xl-easylist-option-textarea" + theme));
			n5.value = custom_links_text;
			n5.wrap = "off";
			n5.spellcheck = false;
			$.on(n5, "change", on_option_change.custom_links);
			$.on(n5, "input", on_option_change.custom_links_input);

			$.add(n1, $.node("div", "xl-easylist-title-line"));

			return n1;
		}._w(466);
		var create_gallery_nodes = function (data, index, domain) {
			var url = CreateURL.to_gallery(data, domain),
				theme = Theme.classes,
				n1, n2, n3, n4, n5, n6, n7, i, t;

			n1 = $.node("div", "xl-easylist-item" + theme);
			n1.setAttribute("data-xl-index", index);
			n1.setAttribute("data-xl-gid", data.gid);
			n1.setAttribute("data-xl-rating", data.rating);
			n1.setAttribute("data-xl-date-uploaded", data.upload_date);
			n1.setAttribute("data-xl-category", data.category);
			n1.setAttribute("data-xl-domain", domain);

			$.add(n1, n2 = $.node("div", "xl-easylist-item-table-container" + theme));
			$.add(n2, n3 = $.node("div", "xl-easylist-item-table" + theme));
			n2 = n3;
			$.add(n2, n3 = $.node("div", "xl-easylist-item-row" + theme));
			$.add(n3, n4 = $.node("div", "xl-easylist-item-cell xl-easylist-item-cell-image" + theme));

			// Image
			$.add(n4, n5 = $.link(url, "xl-easylist-item-image-container" + theme));

			$.add(n5, n6 = $.node("div", "xl-easylist-item-image-outer" + theme));

			if (data.thumbnail !== null) {
				$.add(n6, n7 = $.node("img", "xl-easylist-item-image" + theme));
				$.on(n7, "error", on_thumbnail_error);
				n7.alt = "";

				API.get_thumbnail(data.thumbnail, data.flags, $.bind(function (err, url) {
					if (err === null) {
						this.src = url;
					}
					else {
						var par = this.parentNode;
						if (par !== null) {
							par.style.width = "100%";
							par.style.height = "100%";
						}
					}
				}._w(472), n7));
			}
			else {
				n6.style.width = "100%";
				n6.style.height = "100%";
			}

			$.add(n6, $.node("span", "xl-easylist-item-image-index" + theme, "#" + (index + 1)));


			// Main content
			$.add(n3, n4 = $.node("div", "xl-easylist-item-cell" + theme));

			$.add(n4, n5 = $.node("div", "xl-easylist-item-title" + theme));

			t = UI.button_text(domain);
			$.add(n5, n6 = $.link(url, "xl-easylist-item-title-tag-link" + theme));
			$.add(n6, $.node("span", "xl-easylist-item-title-tag-link-text", t));
			n6.setAttribute("data-xl-original", t);

			$.add(n5, n6 = $.link(url, "xl-easylist-item-title-link" + theme, data.title));
			n6.setAttribute("data-xl-original", n6.textContent);

			if (data.title_jpn !== null) {
				$.add(n4, n5 = $.node("span", "xl-easylist-item-title-jp" + theme, data.title_jpn));
				n5.setAttribute("data-xl-original", n5.textContent);
			}

			$.add(n4, n5 = $.node("div", "xl-easylist-item-upload-info" + theme));
			$.add(n5, $.tnode("Uploaded by "));
			$.add(n5, n6 = $.link(CreateURL.to_uploader(data, domain), "xl-easylist-item-uploader" + theme, data.uploader));
			n6.setAttribute("data-xl-original", n6.textContent);
			$.add(n5, $.tnode(" on "));
			$.add(n5, $.node("span", "xl-easylist-item-upload-date" + theme, UI.format_date(new Date(data.upload_date))));

			$.add(n4, n5 = $.node("div", "xl-easylist-item-tags" + theme));

			n6 = create_full_tags(domain, data, theme);
			$.add(n5, n6[0]);
			if (!n6[1]) {
				$.on(n1, "mouseover", on_gallery_mouseover);
			}


			// Right sidebar
			$.add(n3, n4 = $.node("div", "xl-easylist-item-cell xl-easylist-item-cell-side" + theme));

			$.add(n4, n5 = $.node("div", "xl-easylist-item-info" + theme));

			$.add(n5, n6 = $.link(CreateURL.to_category(data, domain),
				"xl-easylist-item-info-button xl-button xl-button-eh xl-button-" + API.get_category(data.category).short_name + theme
			));
			$.add(n6, $.node("div", "xl-noise", API.get_category(data.category).name));


			$.add(n5, n6 = $.node("div", "xl-easylist-item-info-item xl-easylist-item-info-item-rating" + theme));
			$.add(n6, n7 = $.node("div", "xl-stars-container"));
			$.add(n7, UI.create_rating_stars(data.rating));
			if (data.rating >= 0) {
				$.add(n6, $.node("span", "xl-easylist-item-info-light", "(Avg: " + data.rating.toFixed(2) + ")"));
			}
			else {
				n7.classList.add("xl-stars-container-na");
				$.add(n6, $.node("span", "xl-easylist-item-info-light", "(n/a)"));
			}

			$.add(n5, n6 = $.node("div", "xl-easylist-item-info-item xl-easylist-item-info-item-files" + theme));
			i = data.file_count;
			$.add(n6, $.node("span", "", i + " image" + (i === 1 ? "" : "s")));
			if (data.total_size >= 0) {
				$.add(n6, $.node_simple("br"));
				i = (data.total_size / 1024 / 1024).toFixed(2).replace(/\.?0+$/, "");
				$.add(n6, $.node("span", "xl-easylist-item-info-light", "(" + i + " MB)"));
			}

			// Highlight
			update_filters(n1, data, true, false);

			return n1;
		}._w(471);
		var create_full_tags = function (domain, data, theme) {
			var n1 = $.node("div", "xl-easylist-item-tag-table" + theme),
				domain_type = domain_info[domain].type,
				full_domain = domain_info[domain].g_domain,
				namespace_style = "",
				all_tags, namespace, tags, n2, n3, n4, i, ii;

			if (data.tags_ns !== null) {
				all_tags = data.tags_ns;
			}
			else {
				all_tags = { "": data.tags };
			}

			for (namespace in all_tags) {
				tags = all_tags[namespace];

				$.add(n1, n2 = $.node("div", "xl-easylist-item-tag-row" + theme));

				if (namespace !== "") {
					namespace_style = " xl-tag-namespace-" + namespace.replace(/\ /g, "-") + theme;
					$.add(n2, n3 = $.node("div", "xl-easylist-item-tag-cell xl-easylist-item-tag-cell-label" + theme));
					$.add(n3, n4 = $.node("span", "xl-tag-namespace-block xl-tag-namespace-block-no-outline" + namespace_style));
					$.add(n4, $.node("span", "xl-tag-namespace", namespace));
					$.add(n3, $.tnode(":"));
				}

				$.add(n2, n3 = $.node("div", "xl-easylist-item-tag-cell" + theme));
				n2 = n3;

				for (i = 0, ii = tags.length; i < ii; ++i) {
					$.add(n2, n3 = $.node("span", "xl-tag-block" + namespace_style));
					$.add(n3, n4 = $.link(CreateURL.to_tag(tags[i], domain_type, full_domain),
						"xl-tag xl-tag-color-inherit xl-easylist-item-tag",
						tags[i]
					));
					n4.setAttribute("data-xl-original", n4.textContent);

					if (i < ii - 1) $.add(n3, $.tnode(","));
				}
			}

			return [ n1, namespace !== "" ];
		}._w(473);
		var add_gallery_update_timer = null;
		var add_gallery = function (content_index, entry, index, force_reorder) {
			var data = API.get_data(entry.namespace, entry.id),
				entries, n;

			if (data !== null) {
				entries = contents[content_index].entries;
				n = create_gallery_nodes(data, index, entry.domain);
				n.setAttribute("data-xl-easylist-item-parity", (contents[content_index].visible % 2) === 0 ? "odd" : "even");

				Main.insert_custom_fonts();

				$.add(contents[content_index].container, n);

				entry.node = n;
				entries.push(entry);
				++contents[content_index].visible;

				if (content_index === content_current) {
					if (
						force_reorder ||
						settings.group_by_category ||
						settings.group_by_filters ||
						settings.sort_by !== "thread" ||
						settings.filter_visibility !== 0
					) {
						if (add_gallery_update_timer !== null) clearTimeout(add_gallery_update_timer);
						add_gallery_update_timer = setTimeout(function () {
							update_ordering();
						}._w(475), 1);
					}
					else {
						set_empty(contents[content_index].visible === 0);
					}
				}
			}
		}._w(474);
		var set_empty = function (empty) {
			if (empty_notification !== null) {
				var cls = "xl-easylist-empty-notification-visible";
				if (empty !== empty_notification.classList.contains(cls)) {
					empty_notification.classList.toggle(cls);
				}
			}
		}._w(476);
		var get_options_visible = function () {
			return options_container.classList.contains("xl-easylist-options-visible");
		}._w(477);
		var set_options_visible = function (visible) {
			var n = $(".xl-easylist-control-link-options", popup),
				cl, cls;

			if (n !== null) {
				cl = n.classList;
				cls = "xl-easylist-control-link-focus";
				if (cl.contains(cls) !== visible) cl.toggle(cls);
			}

			cl = options_container.classList;
			cls = "xl-easylist-options-visible";
			if (cl.contains(cls) !== visible) cl.toggle(cls);
		}._w(478);

		var get_node_filter_group = function (node) {
			var v = get_node_filters_bad(node);
			return (v > 0) ? -v : get_node_filters_good(node);
		}._w(479);
		var get_node_filters_good = function (node) {
			return (parseInt(node.getAttribute("data-xl-filter-matches-title"), 10) || 0) +
				(parseInt(node.getAttribute("data-xl-filter-matches-uploader"), 10) || 0) +
				(parseInt(node.getAttribute("data-xl-filter-matches-tags"), 10) || 0);
		}._w(480);
		var get_node_filters_bad = function (node) {
			return (parseInt(node.getAttribute("data-xl-filter-matches-title-bad"), 10) || 0) +
				(parseInt(node.getAttribute("data-xl-filter-matches-uploader-bad"), 10) || 0) +
				(parseInt(node.getAttribute("data-xl-filter-matches-tags-bad"), 10) || 0);
		}._w(481);
		var get_node_category_group = function (node) {
			return API.get_category_sort_rank(node.getAttribute("data-xl-category"));
		}._w(482);
		var update_display_mode = function (first) {
			var mode = display_mode_names[settings.display_mode] || "",
				cl = content_container.classList,
				i, ii;

			if (!first) {
				for (i = 0, ii = display_mode_names.length; i < ii; ++i) {
					cl.remove("xl-easylist-" + display_mode_names[i]);
				}
			}

			cl.add("xl-easylist-" + mode);
		}._w(483);
		var update_ordering = function () {
			var items = [],
				mode = settings.sort_by,
				visibility = settings.filter_visibility,
				show = true,
				content_index = content_current,
				entries = contents[content_index].entries,
				items_container = contents[content_index].container,
				current_visible_count = 0,
				ordering, base_array, item, attr, n, n2, i, ii;

			// Grouping
			if (settings.group_by_filters) {
				if (settings.group_by_category) {
					base_array = function (node) {
						return [ get_node_category_group(node), get_node_filter_group(node) ];
					}._w(485);
					ordering = [ 1, -1 ];
				}
				else {
					base_array = function (node) {
						return [ get_node_filter_group(node) ];
					}._w(486);
					ordering = [ -1 ];
				}
			}
			else if (settings.group_by_category) {
				base_array = function (node) {
					return [ get_node_category_group(node) ];
				}._w(487);
				ordering = [ 1 ];
			}
			else {
				base_array = function () { return []; }._w(488);
				ordering = [];
			}

			// Iterate
			attr = node_sort_order_keys[mode in node_sort_order_keys ? mode : "thread"];
			ordering.push(attr[1], 1);
			attr = attr[0];
			for (i = 0, ii = entries.length; i < ii; ++i) {
				n = entries[i].node;
				item = {
					order: base_array(n),
					node: n
				};
				item.order.push(
					parseFloat(n.getAttribute(attr)) || 0,
					parseFloat(n.getAttribute("data-xl-index")) || 0
				);
				items.push(item);
			}

			// Sort
			items.sort(function (a, b) {
				var x, y, i, ii;
				a = a.order;
				b = b.order;
				for (i = 0, ii = a.length; i < ii; ++i) {
					x = a[i];
					y = b[i];
					if (x < y) return -ordering[i];
					if (x > y) return ordering[i];
				}
				return 0;
			}._w(489));

			// Re-insert
			// Maybe eventually add labels
			for (i = 0, ii = items.length; i < ii; ++i) {
				n = items[i].node;
				n2 = $(".xl-easylist-item-image-index", n);

				$.add(items_container, n);

				if (visibility === 1) {
					show = (get_node_filters_bad(n) === 0);
				}
				else if (visibility === 2) {
					show = (get_node_filters_bad(n) === 0 && get_node_filters_good(n) > 0);
				}

				if (show) {
					n.setAttribute("data-xl-easylist-item-parity", (current_visible_count % 2) === 0 ? "odd" : "even");
					n.classList.remove("xl-easylist-item-hidden");
					++current_visible_count;

					if (n2 !== null) n2.textContent = "#" + current_visible_count;
				}
				else {
					n.setAttribute("data-xl-easylist-item-parity", "hidden");
					n.classList.add("xl-easylist-item-hidden");

					if (n2 !== null) n2.textContent = "#";
				}
			}

			contents[content_index].visible = current_visible_count;
			set_empty(current_visible_count === 0);
		}._w(484);
		var reset_filter_state = function (node, content_node) {
			content_node.textContent = node.getAttribute("data-xl-original") || "";
			node.classList.remove("xl-filter-good");
			node.classList.remove("xl-filter-bad");
		}._w(490);
		var update_filters_targets = [
			[ ".xl-easylist-item-title-link,.xl-easylist-item-title-jp", "title" ],
			[ ".xl-easylist-item-uploader", "uploader" ],
			[ ".xl-easylist-item-tag", "tags" ],
		];
		var update_filters = function (node, data, first, tags_only) {
			var target, nodes, mode, results, link, bad, hl, n, i, ii, j, jj;

			for (i = (tags_only ? 2 : 0), ii = update_filters_targets.length; i < ii; ++i) {
				target = update_filters_targets[i];
				nodes = $$(target[0], node);
				mode = target[1];
				results = [];
				for (j = 0, jj = nodes.length; j < jj; ++j) {
					n = nodes[j];
					if (!first) reset_filter_state(n, n);
					Filter.highlight(mode, n, data, Filter.None, results, custom_filters);
				}

				bad = 0;
				for (j = 0, jj = results.length; j < jj; ++j) {
					if (results[j].flags.bad) ++bad;
				}

				node.setAttribute("data-xl-filter-matches-" + mode, results.length - bad);
				node.setAttribute("data-xl-filter-matches-" + mode + "-bad", bad);
			}

			if (!tags_only) {
				link = $(".xl-easylist-item-title-link", node);
				n = $(".xl-easylist-item-title-tag-link>span", node);

				if (link !== null && n !== null) {
					if (!first) reset_filter_state(n.parentNode, n);

					link = link.cloneNode(true);
					if ((hl = Filter.check(link, data, custom_filters))[0] !== Filter.None) {
						Filter.highlight_tag(n.parentNode, link, hl);
					}
				}
			}
		}._w(491);
		var update_all_filters = function () {
			var content_index = content_current,
				entries = contents[content_index].entries,
				entry, data, i, ii;

			for (i = 0, ii = entries.length; i < ii; ++i) {
				entry = entries[i];
				data = API.get_data(entry.namespace, entry.id);
				if (data !== null) {
					update_filters(entries[i].node, data, false, false);
				}
			}

			// Update order
			if (settings.group_by_filters || settings.filter_visibility !== 0) {
				update_ordering();
			}
		}._w(492);
		var load_filters = function () {
			custom_filters = Filter.parse(settings.custom_filters, undefined);
		}._w(493);
		var add_links = function (links) {
			var info, key, entry, i, ii;

			for (i = 0, ii = links.length; i < ii; ++i) {
				info = Linkifier.get_node_url_info(links[i]);
				if (info !== null) {
					key = info.site + "_" + info.gid;
					if (data_map[key] === undefined) {
						entry = new Entry(info.domain, info.site, info.gid);
						queue.push(entry);
						data_map[key] = entry;
					}
				}
			}

			if (queue.length > 0 && queue_timer === null) {
				on_timer();
			}
		}._w(494);

		var set_content_index = function (content_index) {
			if (content_index === content_current) return;

			var node = contents[content_current].container,
				par = node.parentNode,
				next = node.nextSibling;

			if (par !== null) {
				content_current = content_index;

				$.remove(node);

				node = contents[content_current].container;
				$.before(par, next, node);

				update_all_filters();
				update_ordering();
			}
		}._w(495);

		var enable_custom_links = function (text) {
			custom_links = [];
			custom_links_map = {};
			custom_links_text = text;
			contents[1].entries = [];
			contents[1].container.innerHTML = "";

			if (text.length === 0) {
				set_content_index(0);
			}
			else {
				set_content_index(1);
				parse_custom_urls(text);
			}
		}._w(496);
		var parse_custom_urls = function (text) {
			var urls = Linkifier.parse_text_for_urls(text),
				info, i, ii;

			for (i = 0, ii = urls.length; i < ii; ++i) {
				info = API.get_url_info(urls[i]);
				if (info !== null) {
					parse_custom_url_info(i, info);
				}
			}
		}._w(497);
		var parse_custom_url_info = function (index, info) {
			API.get_data_from_url_info(info, function (err, data) {
				if (err === null) {
					var key = data.type + "_" + data.gid,
						entry;

					if (custom_links_map[key] === undefined) {
						entry = new Entry(info.domain, data.type, data.gid);
						custom_links_map[key] = entry;
						add_gallery(1, entry, index, true);
					}
				}
			}._w(499));
		}._w(498);

		var on_option_change = {
			sort_by: function () {
				settings.sort_by = this.value;
				settings_save();
				update_ordering();
			}._w(500),
			group_by_category: function () {
				settings.group_by_category = this.checked;
				settings_save();
				update_ordering();
			}._w(501),
			group_by_filters: function () {
				settings.group_by_filters = this.checked;
				settings_save();
				update_ordering();
			}._w(502),
			display_mode: function () {
				settings.display_mode = parseInt(this.value, 10) || 0;
				settings_save();
				update_display_mode(false);
			}._w(503),
			filter_visibility: function () {
				settings.filter_visibility = parseInt(this.value, 10) || 0;
				settings_save();
				update_ordering();
			}._w(504),
			custom_filters: function () {
				if (settings.custom_filters !== this.value) {
					settings.custom_filters = this.value;
					settings_save();
					load_filters();
					update_all_filters();
				}
			}._w(505),
			custom_filters_input: function () {
				var node = this;
				if (on_option_change.custom_filters_input_delay_timer !== null) {
					clearTimeout(on_option_change.custom_filters_input_delay_timer);
				}
				on_option_change.custom_filters_input_delay_timer = setTimeout(
					function () {
						on_option_change.custom_filters_input_delay_timer = null;
						on_option_change.custom_filters.call(node);
					}._w(507),
					1000
				);
			}._w(506),
			custom_filters_input_delay_timer: null,
			custom_links: function () {
				var t = this.value.trim();
				if (t !== custom_links_text) {
					enable_custom_links(t);
				}
			}._w(508),
			custom_links_input: function () {
				var node = this;
				if (on_option_change.custom_links_input_delay_timer !== null) {
					clearTimeout(on_option_change.custom_links_input_delay_timer);
				}
				on_option_change.custom_links_input_delay_timer = setTimeout(
					function () {
						on_option_change.custom_links_input_delay_timer = null;
						on_option_change.custom_links.call(node);
					}._w(510),
					1000
				);
			}._w(509),
			custom_links_input_delay_timer: null
		};
		var on_gallery_mouseover = $.wrap_mouseenterleave_event(function () {
			$.off(this, "mouseover", on_gallery_mouseover);

			var node = this,
				gid, domain, data;

			if (
				(gid = this.getAttribute("data-xl-gid")) &&
				(domain = this.getAttribute("data-xl-domain")) &&
				(data = API.get_data("ehentai", gid)) !== null
			) {
				API.get_ehentai_gallery_full(domain, data, function (err, data) {
					var tags_container, n;

					if (
						err === null &&
						(tags_container = $(".xl-easylist-item-tags", node)) !== null
					) {
						n = create_full_tags(domain, data, Theme.classes);
						tags_container.textContent = "";
						$.add(tags_container, n[0]);

						update_filters(node, data, false, true);
					}
				}._w(512));
			}
		}._w(511));
		var on_thumbnail_error = function () {
			$.off(this, "error", on_thumbnail_error);

			var par = this.parentNode;
			if (par === null) return;
			par.style.width = "100%";
			par.style.height = "100%";
			this.style.visibility = "hidden";
		}._w(513);
		var on_linkify = function (event) {
			add_links([ event.link ]);
		}._w(514);
		var on_timer = function () {
			queue_timer = null;

			var new_entries = queue.splice(0, 20),
				entries = contents[0].entries,
				i, ii;

			for (i = 0, ii = new_entries.length; i < ii; ++i) {
				add_gallery(0, new_entries[i], entries.length, true);
			}

			if (queue.length > 0) {
				queue_timer = setTimeout(on_timer, 50);
			}
		}._w(515);
		var on_open_click = function (event) {
			if ($.is_left_mouse(event)) {
				open();

				event.preventDefault();
				return false;
			}
		}._w(516);
		var on_close_click = function (event) {
			if ($.is_left_mouse(event)) {
				close();

				event.preventDefault();
				return false;
			}
		}._w(517);
		var on_toggle_click = function (event) {
			if ($.is_left_mouse(event)) {
				if (is_open()) {
					close();
				}
				else {
					open();
				}

				event.preventDefault();
				return false;
			}
		}._w(518);
		var on_options_click = function (event) {
			if ($.is_left_mouse(event)) {
				set_options_visible(!get_options_visible());

				event.preventDefault();
				return false;
			}
		}._w(519);
		var on_overlay_click = function (event) {
			if ($.is_left_mouse(event)) {
				close();

				event.preventDefault();
				return false;
			}
		}._w(520);

		// Public
		var get_saved_settings = function () {
			return $.json_parse_safe(Config.storage.getItem(settings_key), null);
		}._w(521);
		var set_saved_settings = function (data) {
			if (data === null) {
				Config.storage.removeItem(settings_key);
			}
			else {
				Config.storage.setItem(settings_key, JSON.stringify(data));
			}
		}._w(522);
		var ready = function () {
			Navigation.insert_link("normal", "Easy List", Main.homepage, " xl-nav-link-easylist", on_open_click);

			HeaderBar.insert_shortcut_icon(
				"panda",
				"X-links Easy List",
				Main.homepage,
				on_toggle_click,
				function (svg, svgns) {
					var path = $.node_ns(svgns, "path", "xl-header-bar-svg-panda-path");
					path.setAttribute("d",
						"M 16.633179,51.146308 c 3.64987,0.96291 4.964143,6.353343 5.848553,6.951214 1.803534,1.219209 16.129984,0.579826 16.129984,0.579826 1.197865,-11.724731 1.212833,-8.671318 2.95548,-16.59613 -1.989075,-1.34607 -5.333693,-2.23712 -5.797288,-4.88791 -0.463595,-2.65078 0.255088,-2.142681 0.187543,-6.314371 -1.439647,-2.768736 -2.204016,-6.03551 -2.500789,-9.43479 -3.024907,-1.751033 -6.026517,-0.494694 -6.433955,-5.297229 -0.353512,-4.166916 6.132756,-5.138818 9.747309,-7.5194007 7.077373,-8.28015298 12.684056,-7.86614927 18.26733,-7.86614927 5.583275,0 12.190976,3.76366917 17.585988,11.22034497 6.53222,9.028459 10.674317,18.629087 14.466281,30.044847 3.791954,11.41577 4.453617,21.459054 1.537854,31.769198 2.36821,0.77671 4.928378,1.009485 5.226735,3.950385 0.298366,2.94089 -1.267399,5.363996 -3.607729,5.963956 -2.34033,0.59995 -4.60182,-0.139224 -6.646539,-0.619694 -3.86217,3.77416 -9.011474,7.538043 -17.479555,9.177123 -8.468078,1.63908 -26.453377,6.593222 -32.623916,6.30881 C 27.325926,98.291926 26.634713,94.42266 25.658825,90.03441 24.682937,85.64616 25.403148,82.440968 25.465957,78.696308 19.909553,79.123928 11.055576,79.654646 9.0799525,78.775913 5.9995252,77.405776 4.2346784,69.110754 5.7658643,59.974024 6.9338652,53.004454 12.660658,50.22377 16.633179,51.146308 z " +
						"M 47.316173,40.278702 c -1.977441,10.244331 -5.318272,21.474541 -5.662805,29.784036 -0.242507,5.848836 2.420726,7.5586 5.348383,2.078223 5.586237,-10.45706 7.896687,-21.139251 10.839979,-32.018641 -1.376342,0.732535 -2.33581,0.805482 -3.567752,1.104816 2.20065,-1.826801 1.797963,-1.259845 4.683397,-4.356147 3.702042,-3.972588 11.505701,-7.842675 15.187296,-4.490869 4.597776,4.185917 3.4537,13.920509 -0.431829,18.735387 -1.301987,5.219157 -3.278232,10.993981 -4.691055,14.211545 1.650129,0.951997 7.1775,2.647886 8.723023,6.808838 1.818473,4.895806 0.447993,8.335081 -3.207776,12.929618 8.781279,-6.214409 9.875004,-12.24852 10.586682,-20.251062 C 85.596887,59.244915 85.615915,54.42819 83.82437,47.181873 82.032825,39.935556 77.484187,30.527275 73.806105,23.780748 70.128023,17.034221 68.465076,12.376515 60.467734,7.5782428 54.534892,4.0186364 44.006601,5.3633006 39.960199,11.716546 c -4.046402,6.353245 -2.052295,11.417199 0.339979,17.673546 -0.06795,1.969646 -1.145015,4.295256 0.105508,5.751383 1.875243,-0.914979 2.772108,-1.957655 4.421995,-2.639606 -0.01451,1.529931 0.320921,4.192236 -1.17535,5.722167 1.758316,1.116252 1.80495,1.414307 3.663842,2.054666 z"
					);
					$.add(svg, path);
				}._w(524)
			);
		}._w(523);
		var open = function () {
			if (popup === null) {
				settings_load();
				create();
			}

			add_links(Linkifier.get_links_formatted());
			Linkifier.on("format", on_linkify);

			Popup.open(popup);
			$.scroll_focus(popup);
		}._w(525);
		var close = function () {
			Popup.close(popup);

			set_options_visible(false);

			Linkifier.off("format", on_linkify);
		}._w(526);
		var is_open = function () {
			return (popup !== null && Popup.is_open(popup));
		}._w(527);

		// Exports
		return {
			get_saved_settings: get_saved_settings,
			set_saved_settings: set_saved_settings,
			ready: ready,
			open: open,
			close: close,
			is_open: is_open
		};

	}._w(460))();
	var Popup = (function () {

		// Private
		var active = null,
			hovering_container = null;

		var on_stop_propagation = function (event) {
			if ($.is_left_mouse(event)) {
				event.stopPropagation();
			}
		}._w(529);
		var on_overlay_event = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();
				event.stopPropagation();
				return false;
			}
		}._w(530);

		// Public
		var create = function (class_ns, setup) {
			var theme = Theme.classes,
				container, list, obj, n1, n2, n3, n4, n5, n6, i, ii, j, jj, v;

			n1 = $.node("div", "xl-popup-overlay xl-" + class_ns + "-popup-overlay" + theme);
			$.add(n1, n2 = $.node("div", "xl-popup-aligner xl-" + class_ns + "-popup-aligner" + theme));
			$.add(n2, n3 = $.node("div", "xl-popup-align xl-" + class_ns + "-popup-align" + theme));
			$.add(n3, container = $.node("div", "xl-popup-content xl-" + class_ns + "-popup-content xl-hover-shadow" + theme));
			Theme.bg(container);

			$.on(n1, "mousedown", on_overlay_event);
			$.on(container, "click", on_stop_propagation);
			$.on(container, "mousedown", on_stop_propagation);

			if (typeof(setup) === "function") {
				setup.call(null, container);
			}
			else {
				$.add(container, n2 = $.node("div", "xl-popup-table" + theme));

				for (i = 0, ii = setup.length; i < ii; ++i) {
					list = setup[i];
					if (!Array.isArray(list)) list = [ list ];

					$.add(n2, n3 = $.node("div", "xl-popup-row" + theme));
					jj = list.length;
					if (jj > 1) {
						$.add(n3, n4 = $.node("div", "xl-popup-cell" + theme));
						$.add(n4, n5 = $.node("div", "xl-popup-table" + theme));
						$.add(n5, n3 = $.node("div", "xl-popup-row" + theme));
					}
					for (j = 0; j < jj; ++j) {
						obj = list[j];

						$.add(n3, n4 = $.node("div", "xl-popup-cell" + theme));

						if (obj.small) n4.classList.add("xl-popup-cell-small");
						if ((v = obj.align) !== undefined && v !== "left") n4.classList.add("xl-popup-cell-" + v);
						if ((v = obj.valign) !== undefined && v !== "top") n4.classList.add("xl-popup-cell-" + v);
						if (obj.body) {
							n3.classList.add("xl-popup-row-body");

							$.add(n4, n5 = $.node("div", "xl-popup-cell-size" + theme));
							$.add(n5, n6 = $.node("div", "xl-popup-cell-size-scroll" + theme));
							if (obj.padding !== false) {
								$.add(n6, n4 = $.node("div", "xl-popup-cell-size-padding" + theme));
							}
							else {
								n4 = n6;
							}
						}

						obj.setup.call(null, n4);
					}
				}
			}

			return n1;
		}._w(531);
		var open = function (overlay) {
			if (active !== null && active.parentNode !== null) {
				$.remove(active);
			}
			d.documentElement.classList.add("xl-popup-overlaying");
			hovering(overlay);
			active = overlay;
		}._w(532);
		var close = function (overlay) {
			d.documentElement.classList.remove("xl-popup-overlaying");
			if (overlay.parentNode !== null) {
				$.remove(overlay);
			}
			active = null;
		}._w(533);
		var is_open = function (overlay) {
			return (overlay.parentNode !== null);
		}._w(534);
		var hovering = function (node) {
			if (hovering_container === null) {
				hovering_container = $.node("div", "xl-hovering-elements");
				if (Config.is_tinyboard) {
					// Fix some poor choices of selectors (div.post:last) that infinity uses
					$.prepend(d.body, hovering_container);
				}
				else {
					$.add(d.body, hovering_container);
				}
			}
			$.add(hovering_container, node);
		}._w(535);

		// Exports
		return {
			create: create,
			open: open,
			close: close,
			is_open: is_open,
			hovering: hovering
		};

	}._w(528))();
	var Changelog = (function () {

		// Private
		var change_data = null,
			acquiring = false,
			popup = null;

		var parse = function (text) {
			var m = /^([\w\W]*)\n=+(\r?\n|$)/.exec(text),
				re_version = /^(\w+(?:\.\w+)+)\s*$/,
				re_change = /^(\s*)[\-\+]\s*(.+)/,
				versions = [],
				authors = null,
				author, author_map, changes, lines, line, i, ii;

			if (m !== null) text = m[1];

			lines = text.replace(/\r\n?/g, "\n").split("\n");
			for (i = 1, ii = lines.length; i < ii; ++i) {
				line = lines[i];
				if ((m = re_version.exec(line)) !== null) {
					authors = [];
					versions.push({
						version: m[1],
						authors: authors
					});
					author = "";
					author_map = {};
				}
				else if (authors !== null) {
					if ((m = re_change.exec(line)) !== null) {
						if (m[1].length === 0) {
							author = m[2];
						}
						else {
							changes = author_map[author];
							if (changes === undefined) {
								changes = [];
								author_map[author] = changes;
								authors.push({
									author: author,
									changes: changes
								});
							}
							changes.push(m[2]);
						}
					}
				}
			}

			if (versions.length === 0) {
				return { error: "No changelog data found" };
			}

			return {
				error: null,
				log_data: versions
			};
		}._w(537);
		var display = function (container, theme) {
			var versions, authors, changes,
				e, n1, n2, n3, n4, n5, i, ii, j, jj, k, kk;

			if (change_data === null) {
				n1 = $.node("div", "xl-changelog-message-container");
				$.add(n1, $.node("div", "xl-changelog-message" + theme, "Loading changelog..."));
			}
			else if ((e = change_data.error) !== null) {
				n1 = $.node("div", "xl-changelog-message-container");
				$.add(n1, n2 = $.node("div", "xl-changelog-message xl-changelog-message-error" + theme));
				$.add(n2, $.node("strong", "xl-changelog-message-line" + theme, "Failed to load changelog:"));
				$.add(n2, $.node_simple("br"));
				$.add(n2, $.node("span", "xl-changelog-message-line" + theme, e));
			}
			else {
				n1 = $.node("div", "xl-changelog-entries");

				versions = change_data.log_data;
				for (i = 0, ii = versions.length; i < ii; ++i) {
					$.add(n1, n2 = $.node("div", "xl-changelog-entry" + theme));
					$.add(n2, $.node("div", "xl-changelog-entry-version" + theme, versions[i].version));
					$.add(n2, n3 = $.node("div", "xl-changelog-entry-users" + theme));

					authors = versions[i].authors;
					for (j = 0, jj = authors.length; j < jj; ++j) {
						$.add(n3, n4 = $.node("div", "xl-changelog-entry-user" + theme));
						$.add(n4, $.node("div", "xl-changelog-entry-user-name" + theme, authors[j].author));
						$.add(n4, n5 = $.node("ul", "xl-changelog-entry-changes" + theme));

						changes = authors[j].changes;
						for (k = 0, kk = changes.length; k < kk; ++k) {
							$.add(n5, $.node("li", "xl-changelog-entry-change" + theme, changes[k]));
						}
					}
				}
			}

			$.add(container, n1);
		}._w(538);
		var acquire = function (callback) {
			HttpRequest({
				method: "GET",
				url: Module.url,
				onload: function (xhr) {
					if (xhr.status === 200) {
						callback.call(null, null, xhr.responseText);
					}
					else {
						callback.call(null, "Response error " + xhr.status, null);
					}
				}._w(540),
				onerror: function () {
					callback.call(null, "Connection error", null);
				}._w(541),
				onabort: function () {
					callback.call(null, "Connection aborted", null);
				}._w(542)
			});
		}._w(539);

		var on_changelog_get = function (err, data) {
			if (err !== null) {
				change_data = { error: err };
			}
			else {
				change_data = parse(data);
			}

			if (popup !== null) {
				var n = $(".xl-changelog-content", popup);
				if (n !== null) {
					n.innerHTML = "";
					display(n, Theme.classes);
				}
			}
		}._w(543);
		var on_close_click = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();
				close();
			}
		}._w(544);
		var on_change_save = function () {
			config.general.changelog_on_update = this.checked;
			Config.save();
		}._w(545);

		// Public
		var open = function (message) {
			if (!acquiring) {
				acquiring = true;
				acquire(on_changelog_get);
			}

			var theme = Theme.classes;

			popup = Popup.create("settings", [[{
				small: true,
				setup: function (container) {
					var cls = "";
					$.add(container, $.link(Main.homepage, "xl-settings-title" + theme, "X-links"));
					if (message !== null) {
						$.add(container, $.node("span", "xl-settings-title-info" + theme, message));
						if (/\s+$/.test(message)) {
							cls = " xl-settings-version-large";
						}
					}
					$.add(container, $.link(Module.url, "xl-settings-version" + cls + theme, Main.version.join(".")));
				}._w(547)
			}, {
				align: "right",
				setup: function (container) {
					var n1, n2;
					$.add(container, n1 = $.node("label", "xl-settings-button" + theme));
					$.add(n1, n2 = $.node("input", "xl-settings-button-checkbox"));
					$.add(n1, $.node("span", "xl-settings-button-text xl-settings-button-checkbox-text", " Show on update"));
					$.add(n1, $.node("span", "xl-settings-button-text xl-settings-button-checkbox-text", " Don't show on update"));
					n2.type = "checkbox";
					n2.checked = config.general.changelog_on_update;
					$.on(n2, "change", on_change_save);

					$.add(container, n1 = $.link("#", "xl-settings-button" + theme));
					$.add(n1, $.node("span", "xl-settings-button-text", "Close"));
					$.on(n1, "click", on_close_click);
				}._w(548)
			}], {
				body: true,
				padding: false,
				setup: function (container) {
					container.classList.add("xl-changelog-content");
					display(container, theme);
				}._w(549)
			}]);

			$.on(popup, "click", on_close_click);
			Popup.open(popup);
		}._w(546);
		var close = function () {
			if (popup !== null) {
				Popup.close(popup);
				popup = null;
			}
		}._w(550);

		// Exports
		var Module = {
			url: "https://raw.githubusercontent.com/dnsev-h/x-links/stable/changelog",
			open: open,
			close: close
		};

		return Module;

	}._w(536))();
	var HeaderBar = (function () {

		// Private
		var menu_nodes = [],
			shortcut_icons = [],
			header_bar = null,
			mode = null;

		var add_svg_icons = function (nodes) {
			var par = null,
				is_appchan = (mode === "appchanx"),
				next, color, n1, n2, i, ii;

			if (is_appchan) {
				if (
					(n1 = $("#shortcuts", header_bar.parentNode)) !== null &&
					(n2 = $("a#appchan-gal", n1) || $("a.a-icon", n1)) !== null
				) {
					par = n2.parentNode;
					next = n2;
				}
			}
			else if (mode === "4chanx3") {
				if (
					(n1 = $("#shortcuts", header_bar)) !== null &&
					(n2 = $("a.fa.fa-picture-o", n1) || $("a.fa", n1)) !== null &&
					(n2 = n2.parentNode) !== null
				) {
					par = n2.parentNode;
					next = n2.nextSibling;
				}
			}

			if (par === null) return;

			for (i = 0, ii = nodes.length; i < ii; ++i) {
				n2 = nodes[i];
				if (is_appchan) {
					n2.classList.add("xl-appchanx");
					n2.classList.add("a-icon");
					n2.classList.add("shortcut");
					n2.classList.add("fa");
					$.before(par, next, n2);
					n2.style.setProperty("background-image", "none", "important");
				}
				else {
					n1 = $.node("span", "shortcut brackets-wrap");
					$.add(n1, n2);
					$.before(par, next, n1);
				}

				color = Theme.get_computed_style(n2).color;
				if (color && (n1 = $("svg", n2)) !== null) {
					n1.setAttribute("style", "fill:" + color + ";");
				}
				n2.setAttribute("data-xl-color", color);
			}
		}._w(552);

		var on_header_bar_detected = function (node) {
			header_bar = node;

			if ($("#shortcuts", node) !== null) {
				mode = "4chanx3";
			}
			else if ($("#shortcuts", node.parentNode) !== null) {
				mode = "appchanx";
				node = $("#hoverUI");
			}

			// Observer
			if (node !== null) {
				new MutationObserver(on_header_observe).observe(node, {
					childList: true,
					subtree: true
				});
			}

			// Icons
			if (shortcut_icons.length > 0) {
				add_svg_icons(shortcut_icons);
			}
		}._w(553);
		var on_icon_mouseover = $.wrap_mouseenterleave_event(function () {
			var n = $("svg", this),
				c;

			if (n !== null) {
				c = this.getAttribute("data-xl-hover-color");
				if (!c) {
					c = Theme.get_computed_style(this).color;
					this.setAttribute("data-xl-hover-color", c);
				}
				n.style.fill = c;
			}
		}._w(554));
		var on_icon_mouseout = $.wrap_mouseenterleave_event(function () {
			var n = $("svg", this);
			if (n !== null) {
				n.style.fill = this.getAttribute("data-xl-color");
			}
		}._w(555));
		var on_menu_item_mouseover = $.wrap_mouseenterleave_event(function () {
			var entries = $$(".entry", this.parent),
				i, ii;
			for (i = 0, ii = entries.length; i < ii; ++i) {
				entries[i].classList.remove("focused");
			}
			this.classList.add("focused");
		}._w(556));
		var on_menu_item_mouseout = $.wrap_mouseenterleave_event(function () {
			this.classList.remove("focused");
		}._w(557));
		var on_menu_item_click = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();
				d.documentElement.click();
			}
		}._w(558);
		var on_body_observe = function (records) {
			var nodes, node, i, ii, j, jj;

			for (i = 0, ii = records.length; i < ii; ++i) {
				if ((nodes = records[i].addedNodes)) {
					for (j = 0, jj = nodes.length; j < jj; ++j) {
						node = nodes[j];
						if (node.id === "header-bar") {
							on_header_bar_detected(node);
							this.disconnect();
							return;
						}
					}
				}
			}
		}._w(559);
		var on_header_observe = function (records) {
			var nodes, node, i, ii, j, jj;

			for (i = 0, ii = records.length; i < ii; ++i) {
				if ((nodes = records[i].addedNodes)) {
					for (j = 0, jj = nodes.length; j < jj; ++j) {
						node = nodes[j];
						if (node.id === "menu") {
							// Add menu items (if it's the main menu)
							if ($(".entry.delete-link", node) === null) {
								nodes = menu_nodes;
								for (j = 0, jj = nodes.length; j < jj; ++j) {
									$.add(node, nodes[j]);
								}
							}
							return;
						}
					}
				}
			}
		}._w(560);

		// Public
		var ready = function () {
			var n = $("#header-bar");
			if (n !== null) {
				on_header_bar_detected(n);
			}
			else {
				new MutationObserver(on_body_observe).observe(d.body, { childList: true, subtree: false });
			}
		}._w(561);
		var insert_shortcut_icon = function (namespace, title, url, on_click, svg_setup) {
			var svgns = "http://www.w3.org/2000/svg",
				n1, svg;

			n1 = $.link(url, "xl-header-bar-link xl-header-bar-link-" + namespace);
			n1.setAttribute("title", title);
			$.add(n1, svg = $.node_ns(svgns, "svg", "xl-header-bar-svg xl-header-bar-svg-" + namespace));
			svg.setAttribute("viewBox", "0 0 100 100");
			svg.setAttribute("svgns", svgns);
			svg.setAttribute("version", "1.1");
			svg_setup(svg, svgns);

			$.on(n1, "mouseover", on_icon_mouseover);
			$.on(n1, "mouseout", on_icon_mouseout);
			$.on(n1, "click", on_click);

			shortcut_icons.push(n1);

			if (header_bar !== null) add_svg_icons([ n1 ]);
		}._w(562);
		var insert_menu_link = function (menu_node) {
			menu_node.classList.add("entry");
			menu_node.style.order = 112;

			$.on(menu_node, "mouseover", on_menu_item_mouseover);
			$.on(menu_node, "mouseout", on_menu_item_mouseout);
			$.on(menu_node, "click", on_menu_item_click);

			menu_nodes.push(menu_node);
		}._w(563);

		// Exports
		return {
			ready: ready,
			insert_shortcut_icon: insert_shortcut_icon,
			insert_menu_link: insert_menu_link
		};

	}._w(551))();
	var Navigation = (function () {

		// Private
		var waiting = {},
			waiting_count = 0,
			waiting_observer = null;

		var Flags = {
			None: 0x0,
			Prepend: 0x1,
			Before: 0x2,
			After: 0x4,
			InnerSpace: 0x8,
			OuterSpace: 0x10,
			Brackets: 0x20,
			Mobile: 0x40,
			LowerCase: 0x80
		};

		var cleanup_functions = {
			"#navbotright": function (node) {
				var links = $$(".xl-nav-link", node),
					link, n, i, ii;

				// Remove bad copies
				for (i = 0, ii = links.length; i < ii; ++i) {
					link = links[i];
					if ((n = link.previousSibling) !== null) {
						$.remove(n);
					}
					if ((n = link.nextSibling) !== null && n.nodeType === Node.TEXT_NODE) {
						n.nodeValue = n.nodeValue.replace(/^\s*\]\s*/, "");
					}
					$.remove(link);
				}
			}._w(565)
		};

		var on_observe_all = function (records) {
			var nodes, node, list, fn, i, ii, j, jj, k, m, mm;

			for (i = 0, ii = records.length; i < ii; ++i) {
				nodes = records[i].addedNodes;
				if (nodes && (jj = nodes.length) > 0) {
					// Added nodes
					for (k in waiting) {
						for (j = 0; j < jj; ++j) {
							// Selector matches
							node = nodes[j];
							if (
								node.nodeType === Node.ELEMENT_NODE &&
								($.test(node, k) || (node = $(k, node)) !== null)
							) {
								fn = cleanup_functions[k];
								if (fn !== undefined) {
									fn.call(null, node);
								}

								list = waiting[k];
								for (m = 0, mm = list.length; m < mm; m += 3) {
									list[m].nodes = [ node, list[m + 1], list[m + 2] ];
									list[m].insert();
								}

								--waiting_count;
								delete waiting[k];
								break;
							}
						}
					}
				}
			}

			if (waiting_count === 0) {
				this.disconnect();
				waiting_observer = null;
			}
		}._w(566);

		var LocationData = function (text, url, class_name, on_click) {
			this.nodes = [];
			this.text = text;
			this.url = url;
			this.class_name = class_name;
			this.on_click = on_click;
		}._w(567);
		LocationData.prototype.add = function (selector, flags, separator) {
			var node = $(selector);
			if (node !== null) {
				this.nodes.push(node, flags, separator);
			}
			else {
				var k = waiting[selector];
				if (k === undefined) {
					waiting[selector] = k = [];
					++waiting_count;
				}
				k.push(this, flags, separator);
				if (waiting_observer === null) {
					waiting_observer = new MutationObserver(on_observe_all);
					waiting_observer.observe(d.body, { childList: true, subtree: true });
				}
			}
		}._w(568);
		LocationData.prototype.add_node = function (node, flags, separator) {
			this.nodes.push(node, flags, separator);
		}._w(569);
		LocationData.prototype.add_all = function (selector, flags, separator) {
			var nodes = $$(selector),
				i, ii;

			for (i = 0, ii = nodes.length; i < ii; ++i) {
				this.nodes.push(nodes[i], flags, separator);
			}
		}._w(570);
		LocationData.prototype.insert = function () {
			var first_mobile = true,
				container, flags, node, par, pre, next, sep, i, ii, n1, t, t2, t_opt;

			for (i = 0, ii = this.nodes.length; i < ii; i += 3) {
				node = this.nodes[i];
				flags = this.nodes[i + 1];
				sep = this.nodes[i + 2];

				// Text
				t = this.text;
				if ((flags & Flags.InnerSpace) !== 0) t = " " + t + " ";

				// Create
				if ((flags & Flags.Mobile) !== 0) {
					par = node.parentNode;
					container = first_mobile ? node.previousSibling : node.nextSibling;
					if (container === null || !container.classList || !container.classList.contains("xl-nav-extras")) {
						container = $.node("div", "mobile xl-nav-extras-mobile");
					}

					$.add(container, n1 = $.node("span", "mobileib button xl-nav-button" + this.class_name));
					$.add(n1, $.link(this.url, "xl-nav-button-inner" + this.class_name, t));

					if (first_mobile) {
						$.before(par, node, container);
						first_mobile = false;
					}
					else {
						$.after(par, node, container);
					}
					node = container;
				}
				else {
					n1 = $.link(this.url, "xl-nav-link" + this.class_name, t);
				}
				$.on(n1, "click", this.on_click);

				// Case
				if ((flags & Flags.LowerCase) !== 0) {
					n1.style.textTransform = "lowercase";
				}

				// Relative
				if ((flags & Flags.Before) !== 0) {
					par = node.parentNode;
					next = node;
				}
				else if ((flags & Flags.After) !== 0) {
					par = node.parentNode;
					next = node.nextSibling;
				}
				else {
					par = node;
					next = ((flags & Flags.Prepend) !== 0) ? node.firstChild : null;
				}

				// Node
				$.before(par, next, n1);

				// Brackets
				if ((flags & Flags.Brackets) !== 0) {
					t = ((flags & Flags.OuterSpace) !== 0) ? "] " : "]";
					t2 = ((flags & Flags.OuterSpace) !== 0) ? " [" : "[";
					t_opt = false;
				}
				else if ((flags & Flags.OuterSpace) !== 0) {
					t = " ";
					t2 = " ";
					t_opt = true;
				}
				else {
					t = null;
				}
				if (t !== null) {
					if (next !== null) {
						if (sep !== undefined) t = ((flags & Flags.OuterSpace) !== 0 ? " " : "") + sep + t;
						if (next.nodeType === Node.TEXT_NODE) {
							next.nodeValue = t + next.nodeValue.replace(/^\s*/, "");
						}
						else {
							$.after(par, n1, $.tnode(t));
						}
					}
					else if (!t_opt) {
						$.after(par, n1, $.tnode(t));
					}

					pre = n1.previousSibling;
					if (pre !== null) {
						if (sep !== undefined) t += sep + ((flags & Flags.OuterSpace) !== 0 ? " " : "");
						if (pre.nodeType === Node.TEXT_NODE) {
							pre.nodeValue = pre.nodeValue.replace(/\s*$/, "") + t2;
						}
						else {
							$.before(par, n1, $.tnode(t2));
						}
					}
					else if (!t_opt) {
						$.before(par, n1, $.tnode(t2));
					}
				}
			}

			this.nodes = null;
		}._w(571);

		// Public
		var insert_link = function (mode, text, url, class_name, on_click) {
			var locations = new LocationData(text, url, class_name, on_click),
				nodes, node, cl, i, ii;

			if (Config.is_4chan) {
				if (mode === "main") {
					locations.add("#navtopright", Flags.OuterSpace | Flags.Brackets | Flags.Prepend);
					locations.add("#navbotright", Flags.OuterSpace | Flags.Brackets | Flags.Prepend);
					locations.add("#settingsWindowLinkMobile", Flags.Before);
					locations.add("#settingsWindowLinkClassic", Flags.Before);
				}
				else {
					cl = d.documentElement.classList;
					if (
						!cl.contains("catalog-mode") &&
						!cl.contains("archive") &&
						$("#order-ctrl,#arc-list") === null
					) {
						nodes = $$("#ctrl-top,.navLinks");
						for (i = 0, ii = nodes.length; i < ii; ++i) {
							node = nodes[i];
							locations.add_node(
								node,
								(node.classList.contains("mobile") ? Flags.Mobile : (Flags.OuterSpace | Flags.Brackets))
							);
						}
					}
				}
			}
			else if (Config.is_foolz) {
				locations.add_all(".letters", Flags.InnerSpace | Flags.OuterSpace | Flags.Brackets);
			}
			else if (Config.is_fuuka) {
				locations.add("body>div:first-child", Flags.InnerSpace | Flags.OuterSpace | Flags.Brackets);
			}
			else if (Config.is_tinyboard) {
				locations.add_all(".boardlist", Flags.InnerSpace | Flags.OuterSpace | Flags.Brackets | Flags.LowerCase);
			}
			else if (Config.is_ipb) {
				locations.add("#livechat", Flags.Prepend | Flags.OuterSpace);
			}
			else if (Config.is_ipb_lofi) {
				locations.add(".ipbnavsmall", Flags.Prepend | Flags.OuterSpace, "-");
			}

			locations.insert();
		}._w(572);

		// Exports
		return {
			insert_link: insert_link
		};

	}._w(564))();
	var ExtensionAPI = (function () {

		// Private
		var random_string_alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		var random_string = function (count) {
			var alpha_len = random_string_alphabet.length,
				s = "",
				i;
			for (i = 0; i < count; ++i) {
				s += random_string_alphabet[Math.floor(Math.random() * alpha_len)];
			}
			return s;
		}._w(574);

		var is_object = function (obj) {
			return (obj !== null && typeof(obj) === "object");
		}._w(575);

		var api = null;
		var ExtensionAPI = function () {
			this.origin = window.location.protocol + "//" + window.location.host;
			this.timeout_delay = 1000;

			this.api_name = null;
			this.api_key = null;
			this.action = null;
			this.reply_id = null;
			this.reply_callbacks = {};

			this.registration = null;
			this.registrations = {};
			this.request_apis = {};

			var self = this;
			this.on_window_message_bind = function (event) {
				return self.on_window_message(event);
			}._w(577);
			window.addEventListener("message", this.on_window_message_bind, false);
		}._w(576);
		ExtensionAPI.prototype.on_window_message = function (event) {
			var data = event.data,
				handlers, action_data, reply_id, fn;

			if (
				event.origin === this.origin &&
				is_object(data) &&
				typeof((this.action = data.xlinks_action)) === "string" &&
				data.extension === true &&
				typeof((this.api_key = data.key)) === "string" &&
				typeof((this.api_name = data.name)) === "string" &&
				(action_data = data.data) !== undefined
			) {
				this.registration = this.registrations[this.api_key];
				if (this.registration === undefined || this.registration.name !== this.api_name) {
					this.registration = null;
					handlers = ExtensionAPI.handlers_init;
				}
				else {
					handlers = ExtensionAPI.handlers;
				}
				this.reply_id = data.id;

				if (typeof((reply_id = data.reply)) === "string") {
					if (typeof((fn = this.reply_callbacks[reply_id])) === "function") {
						delete this.reply_callbacks[reply_id];
						fn.call(this, null, action_data);
					}
				}
				else {
					if (typeof((fn = handlers[this.action])) === "function") {
						fn.call(this, action_data);
					}
					else if (this.reply_id !== null) {
						this.send(this.action, { err: "Invalid call" }, this.reply_id);
					}
				}

				this.registration = null;
				this.reply_id = null;
			}

			this.action = null;
			this.api_key = null;
			this.api_name = null;
		}._w(578);
		ExtensionAPI.prototype.send = function (action, data, reply_to, on_reply) {
			var self = this,
				id = null,
				timeout, cb, i;

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
				}._w(580);

				this.reply_callbacks[id] = cb;
				cb = null;

				if (this.timeout_delay >= 0) {
					timeout = setTimeout(function () {
						timeout = null;
						delete self.reply_callbacks[id];
						on_reply.call(self, "Response timeout");
					}._w(581), this.timeout_delay);
				}
			}

			window.postMessage({
				xlinks_action: action,
				extension: false,
				id: id,
				reply: reply_to || null,
				key: this.api_key,
				name: this.api_name,
				data: data
			}, this.origin);
		}._w(579);
		ExtensionAPI.prototype.request_api_fn = function (fn_id) {
			var self = this,
				api_name = this.api_name,
				api_key = this.api_key;

			return function () {
				var callback = arguments[arguments.length - 1],
					args = Array.prototype.splice.call(arguments, 0, arguments.length - 1),
					state = null;

				if (this !== null) {
					state = {
						id: this.data.id,
						retry_count: this.retry_count,
						delay: this.delay
					};

					if (!this.data.sent) {
						this.data.sent = true;
						state.infos = this.infos;
					}
				}

				self.api_name = api_name;
				self.api_key = api_key;
				self.send("api_function", {
					id: fn_id,
					args: args,
					state: state
				}, null, self.request_api_fn_callback(callback));
				self.api_name = null;
				self.api_key = null;
			}._w(583);
		}._w(582);
		ExtensionAPI.prototype.request_api_fn_callback = function (callback) {
			return function (err, data) {
				var args;
				if (err !== null) {
					callback.call(null, err, null);
				}
				else if (!is_object(data) || !Array.isArray((args = data.args))) {
					callback.call(null, "Invalid response", null);
				}
				else {
					args = JSON.parse(JSON.stringify(args));
					callback.apply(null, args);
				}
			}._w(585);
		}._w(584);

		ExtensionAPI.request_api_functions_required = [
			"setup_xhr",
			"parse_response"
		];
		ExtensionAPI.request_api_functions = {
			get_data: "get_data",
			set_data: "set_data",
			setup_xhr: "setup_xhr",
			parse_response: "parse_response",
			delay_modify: "delay_modify",
			error_mode: "error_mode"
		};

		ExtensionAPI.handlers_init = {
			start: function () {
				var reply_data = null,
					reply_key, i;

				for (i = 0; i < 10; ++i) {
					reply_key = random_string(64);
					if (!Object.prototype.hasOwnProperty.call(this.registrations, reply_key)) {
						this.registrations[reply_key] = {
							name: this.api_name,
							key: reply_key,
							apis: []
						};
						reply_data = { key: reply_key };
						break;
					}
				}

				this.send(this.action, reply_data, this.reply_id);
			}._w(586),
		};
		ExtensionAPI.handlers = {
			register: function (data) {
				if (!is_object(data)) {
					// Failure
					this.send(this.action, {
						err: "Invalid data"
					}, this.reply_id);
					return;
				}

				// Register
				var response = {
						settings: {},
						request_apis: []
					},
					req, fns, fn_id, a, o, o2, v, i, ii, j, jj, k;

				// Request APIs
				if (Array.isArray((o = data.request_apis))) {
					for (i = 0, ii = o.length; i < ii; ++i) {
						a = o[i];
						if (is_object(a)) {
							var req_group = "other",
								req_namespace = "other",
								req_type = "other",
								req_count = 1,
								req_concurrent = 1,
								req_delay_okay = 200,
								req_delay_error = 5000,
								req_functions = {},
								req_function_ids = {};

							// Settings
							if (typeof((v = a.group)) === "string") req_group = v;
							if (typeof((v = a.namespace)) === "string") req_namespace = v;
							if (typeof((v = a.type)) === "string") req_type = v;
							if (typeof((v = a.count)) === "number") req_count = Math.max(1, v);
							if (typeof((v = a.concurrent)) === "number") req_concurrent = Math.max(1, v);
							if (typeof((v = a.delay_okay)) === "number") req_delay_okay = Math.max(0, v);
							if (typeof((v = a.delay_error)) === "number") req_delay_error = Math.max(0, v);

							// Functions
							if (Array.isArray((fns = a.functions))) {
								for (j = 0, jj = fns.length; j < jj; ++j) {
									v = fns[j];
									if (Object.prototype.hasOwnProperty.call(ExtensionAPI.request_api_functions, v)) {
										fn_id = random_string(32);
										req_functions[ExtensionAPI.request_api_functions[v]] = this.request_api_fn(fn_id, v);
										req_function_ids[v] = fn_id;
									}
								}
							}

							// Validate
							for (j = 0, jj = ExtensionAPI.request_api_functions_required.length; j < jj; ++j) {
								if (!Object.prototype.hasOwnProperty.call(req_functions, ExtensionAPI.request_api_functions_required[j])) break;
							}
							if (j < jj) {
								response.request_apis.push([ "Missing functions" ]);
							}
							else {
								// Check to see if the namespace/type is unique
								if (
									(o2 = this.request_apis[req_namespace]) !== undefined &&
									o2[req_type] !== undefined
								) {
									response.request_apis.push([ "Already exists" ]);
								}
								else {
									req = new API.RequestType(
										req_count,
										req_concurrent,
										req_delay_okay,
										req_delay_error,
										req_group,
										req_namespace,
										req_type
									);
									for (k in req_functions) {
										req[k] = req_functions[k];
									}
									req.request_init = api_request_init_fn;
									req.request_complete = create_api_request_complete_fn(this.api_name, this.api_key);

									if (o2 === undefined) {
										this.request_apis[req_namespace] = o2 = {};
									}
									o2[req_type] = {
										req: req,
										api_name: this.api_name,
										api_key: this.api_key
									};

									response.request_apis.push([ null, req_function_ids ]);
								}
							}
						}
						else {
							response.request_apis.push([ "Invalid" ]);
						}
					}
				}

				// Okay
				this.send(this.action, {
					err: null,
					response: response
				}, this.reply_id);
			}._w(587),
			request: function (data) {
				var self = this,
					action = this.action,
					reply_id = this.reply_id,
					api_key = this.api_key,
					api_name = this.api_name,
					namespace, type, unique_id, info;

				if (
					!is_object(data) ||
					typeof((namespace = data.namespace)) !== "string" ||
					typeof((type = data.type)) !== "string" ||
					typeof((unique_id = data.id)) !== "string" ||
					(info = data.info) === undefined
				) {
					// Failure
					this.send(this.action, {
						err: "Invalid data"
					}, this.reply_id);
					return;
				}

				request(namespace, type, unique_id, info, function (err, data) {
					self.api_key = api_key;
					self.api_name = api_name;

					if (err !== null) {
						data = null;
					}

					self.send(action, {
						err: err,
						data: data
					}, reply_id);

					self.api_key = null;
					self.api_name = null;
				}._w(589));
			}._w(588),
		};

		var api_request_init_fn = function (req) {
			req.data = {
				id: random_string(32),
				sent: false
			};
		}._w(590);
		var create_api_request_complete_fn = function (api_name, api_key) {
			return function (req) {
				api.api_name = api_name;
				api.api_key = api_key;
				api.send("request_end", { id: req.data.id });
				api.api_name = null;
				api.api_key = null;
			}._w(592);
		}._w(591);


		// Public
		var init = function () {
			if (api === null) api = new ExtensionAPI();
		}._w(593);

		var request = function (namespace, type, unique_id, info, callback) {
			var req_data, req;
			if (
				api === null ||
				(req_data = api.request_apis[namespace]) === undefined ||
				(req_data = req_data[type]) === undefined
			) {
				callback.call(null, "Invalid API", null);
				return;
			}

			return req_data.req.add(unique_id, info, false, callback);
		}._w(594);


		// Exports
		return {
			init: init,
			request: request
		};

	}._w(573))();
	var Main = (function () {

		// Private
		var fonts_inserted = false,
			all_posts_reloaded = false;

		var reload_all_posts = function () {
			if (all_posts_reloaded) return;
			all_posts_reloaded = true;

			Linkifier.relinkify_posts(Post.get_all_posts(d));
		}._w(596);

		var on_ready = function () {
			Debug.timer("init");

			if (!Config.ready()) return;
			Settings.ready();

			var style = $.node_simple("style"),
				updater;

			style.textContent = ".xl-button,.xl-star{display:inline-block}.xl-easylist-subtitle,.xl-link-page,.xl-link.xl-link-error{font-style:italic}.xl-actions:before,.xl-changelog-message-container:before,.xl-easylist-item-image-container:after,.xl-popup-aligner:before,.xl-site-tag-bg-inner:after{content:\"\"}.xl-stars-container{position:relative;z-index:0;white-space:nowrap}.xl-stars-container.xl-stars-container-na{opacity:.5}.xl-star-none{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAQAAADYBBcfAAAA5UlEQVR4AZ2VwQmEMBBFfx0S5iwWJCIhhSwhRXgSEesQCVuIzbgCGiLJ4GTzbupjvvqNYFcDd9KgcBFmHCczqEzUOC50meiC6Eo0hS2IG5Rc7HFE9HLRPkQrf6L+IXpQ/n0ZuJigxap7YEAhViEa+Pwr1tDwRZKHvu+asIi15ZZudRJpEyhty/CqDfkWVWixs9KOFpWg3AmuoDNMf/ivkEHLgwrDEr6M8hLWJBd6PiwfdASdjO9hFdZoVg91He2juWuuAF04PYPSrfKiS0WbK3FQF34bMcm03FST3/ItanCrho1/CT96LV7iyUEWwgAAAABJRU5ErkJggg==)}.xl-star-half{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAADA0lEQVR4AbWWA7PkQBRG+9m28ubZNta2bdu2bdu2bdu2rZ/w7e2t9DKTHVS66gySyZy6X5MZ2/JjWTwx1MWBTbW1ZslMy0YiictyI2zham8BGyu2ki5LWgqbclnDkg7wdbeEnTUDXW6smVBUN6yFH0L9bYRwqJZxLuXC2X10iAqxE8KDRLBmcfZq4IujC9OREu0MVydLLuQ01CzO8V10uLuzOLIS3eDuYiWEgzWLc9moRDw6UAbZyR7wcrcRwsOEZMy8akoM1YeQTe4VjctbS+H58crISfFEgI+dEArpUBWaEpKICv9jSu9oXN1RDq/P1iRqIDfNC8H+DkJmKI3/ENJndKnpgZFtAjCmQzD1Vygmdg/HirEp4LI35+vi/aUGRF3kpXubLBSRLhVz7MCsJFzfmM8HB/VXWYqwCnhlXPbxelN8ut4A+Rk+CA4wWHiYywhJcdniFdLQl4VlwPuMx8gr47Jvt+qR0NtQ4VIhUl0rezbwwaKhMTi3rhDPjlbAq9NV8O5CDXy4UhufrtYkoUF9uFCvTEnKmdBNhwsbC/HiRAW8PlMZ785zcWXkpXmS0F5NNtPQFUhImxJHuXTZyFg8PVwaL46XxcuT5fDqVDnkpnog2E9R+JCoSwSasbpIeLi3KB4fLIGnh4jDJZCT7IYgPzsl4VCzV5cFg8JxZ3se7u3Kx/3dBXiwJx/Zia4I9LXVNyIlkxfr7nU8cGhuAq6tz8DNTZm4uSULt4jMBGcE+tjqnW+m733NvXFuSQIuLE/CpVXJODgnDnP7hvDtCX6e1vqEQ02Oc3IHHxyfE41T82Kwe3IEhrf0hjhiuDmL7cnMWEWc7So6YN3AAGwcGoRJ7b3RuZqzWAKXOtmzc/IGbH6sIs5e1R2xopc3+tb5IRKyoYTkbM+ibKzZUhXhUKPj7F7FAT2qOkJUJc/Nn1HZ2TCdvNsfVhDuJ4INjrNWrjWal7D7oyqVxyRisYK0vqFxcom6TFH6T8SDDa3QcJl6pU0NPsrLxDPjW6xc2VDin+e/Azq4LxX5iaTWAAAAAElFTkSuQmCC)}.xl-star-full{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAADhElEQVR4AbWWg3IsURRF82zbtm3btm3btmPbtm3btvEJ+93TlbmVigapSVV3D3tlr4NEQdqf5VMVprPjdf0xXdrvSwsbTaClEzqDjnroaHkCTxPo+PpudIigp+UJFNK9OTcEr88O5inlqVOXIMqPxkL54RgRUJdrlYfOB8cGw1dzPnw05uH+0YFcq9x0fr01FqmOa5HisBpfbo7iWuWmU+/DTGR5bEKm+0bovJsqrVY+V6f5bDV/CLCfDyYj2nYD8v13Is93GyIsV+L73bEcKuYexBjNVYk7fj2cjFiHLSgO3c+OfSgK3oWCgG2IJOidMWK/z2vdaJBxa38/vL80DJ+ujWT1GsMSjIfB5zkCrCT8MMqjjrHjMMoi9qE4ZCcK/Dcj3HwZdN5MxOfrw/Hh8hC8PTcQL0/2xbUd3emejYFcqa5oxjyUZiHecjk1B6vXZqZwFyUTYJXxp1EVfwwVMQdRFr4LhYFbkOu1DunOK5BoswjRxnMQqjUVtp9G49nRXlw3V9rM2qKE1Pr1wE1UM9JIyQRYXdIRVMXuZyl3oiiIAb3XIcNlOZIYMMZ4Nlx+TcDLU/3Er7+G0PvHBkHr9RSEma2kBqGakUZKJsAqonejNGw7CgM2IsdrDdKdlsFfexZUH43EnQO9G8GkWNDf7oylbqQGoZqRRkpGMJaO6fZdh2z3lQgymIvP14ZChsXOoeTcV5i991OZto3UIFQz0igkE2Aeq5HhvAxaL/h4+PJ6yb5dRiPTdTWyPddRg1DNSCMlE2Aptovw6epQnqzN20XjxXik2C9DmtNy6kZqEKoZa6olSLZZiHjzuVB5NKJNy5wv67uH+sFLdQbizBcg0Wohtb7QjYnWC5BgOQ+xprMRZTgDLr/H49Y+PganZf/bd3YgwnRmIEJ/FqKMZsNTZRpUH48SutFDcTLCdacjRHMyApTH48WJPlyrzDp/XhsEf5XJCFKbAuefE/D2/EDeiW/ODYDj19HwVRwHr5+j8PVCH5m0cp1XtneD2fNhsHw9Aj+uDsTNPT35DUW/0PXdPRioL0yeDoLhg364tKWL1Fq5zgd7u8PgwUA8PtSzyXw1nteH+7pD53Y/3NvdnX9Oap13d3XjN2i8DxvNK//8nR3dpNLKdR5Y2hFn13WRaGs0THt2bWfsX9JRYq1cJ7s2DxMHbfRdiROKhYmB8oTy/Vde/Pf/AxrB4Rr+1b9fAAAAAElFTkSuQmCC)}.xl-star{width:1.2em;height:1.4em;margin-left:-.1em;margin-right:-.1em;margin-bottom:-.2em;background-repeat:no-repeat;background-size:cover;background-position:-.1em 0;position:relative}.xl-star-1{z-index:4;width:1.3em;background-position:0 0}.xl-star-2{z-index:3}.xl-star-3{z-index:2}.xl-star-4{z-index:1}.xl-star-5{z-index:0;width:1.3em}.xl-button{padding:.3em 1em;font-size:inherit;line-height:1.6em;color:#333;text-align:center;text-shadow:0 .08em .08em rgba(255,255,255,.75);vertical-align:middle;cursor:pointer;background-color:#f5f5f5;background-image:-webkit-gradient(linear,0 0,0 100%,from(#fff),to(#e6e6e6));background-image:-webkit-linear-gradient(top,#fff,#e6e6e6);background-image:-o-linear-gradient(top,#fff,#e6e6e6);background-image:linear-gradient(to bottom,#fff,#e6e6e6);background-image:-moz-linear-gradient(top,#fff,#e6e6e6);background-repeat:repeat-x;border:1px solid #bbb;border-color:#e6e6e6 #e6e6e6 #bfbfbf;border-bottom-color:#a2a2a2;border-radius:.3em;box-shadow:inset 0 .08em 0 rgba(255,255,255,.2),0 .08em .16em rgba(0,0,0,.05)}.xl-button-eh{font-family:'Source Sans Pro',Tahoma,sans-serif!important;font-weight:900;font-size:.86em;width:100%;padding:.15em 0;color:#FFF!important;box-shadow:0 0 .5em rgba(0,0,0,.5);text-shadow:.09em .09em 0 rgba(0,0,0,.5),0 0 .3em #000;-webkit-font-smoothing:antialiased}.xl-button-doujinshi{background-color:#840505!important;background-image:-khtml-gradient(linear,left top,left bottom,from(#f74040),to(#840505));background-image:-moz-linear-gradient(top,#f74040,#840505);background-image:-ms-linear-gradient(top,#f74040,#840505);background-image:-webkit-gradient(linear,left top,left bottom,color-stop(0,#f74040),color-stop(100%,#840505));background-image:-webkit-linear-gradient(top,#f74040,#840505);background-image:-o-linear-gradient(top,#f74040,#840505);background-image:linear-gradient(#f74040,#840505);border-color:#840505 #840505 hsl(0,92%,18.5%)}.xl-button-manga{background-color:#7a2800!important;background-image:-khtml-gradient(linear,left top,left bottom,from(#ff7632),to(#7a2800));background-image:-moz-linear-gradient(top,#ff7632,#7a2800);background-image:-ms-linear-gradient(top,#ff7632,#7a2800);background-image:-webkit-gradient(linear,left top,left bottom,color-stop(0,#ff7632),color-stop(100%,#7a2800));background-image:-webkit-linear-gradient(top,#ff7632,#7a2800);background-image:-o-linear-gradient(top,#ff7632,#7a2800);background-image:linear-gradient(#ff7632,#7a2800);border-color:#7a2800 #7a2800 #4c1900}.xl-button-artistcg{background-color:#7a6a00!important;background-image:-khtml-gradient(linear,left top,left bottom,from(#ffe95b),to(#7a6a00));background-image:-moz-linear-gradient(top,#ffe95b,#7a6a00);background-image:-ms-linear-gradient(top,#ffe95b,#7a6a00);background-image:-webkit-gradient(linear,left top,left bottom,color-stop(0,#ffe95b),color-stop(100%,#7a6a00));background-image:-webkit-linear-gradient(top,#ffe95b,#7a6a00);background-image:-o-linear-gradient(top,#ffe95b,#7a6a00);background-image:linear-gradient(#ffe95b,#7a6a00);border-color:#7a6a00 #7a6a00 #423900}.xl-button-gamecg{background-color:#273214!important;background-image:-moz-linear-gradient(top,#96ba58,#273214);background-image:-webkit-gradient(linear,left top,left bottom,color-stop(0,#96ba58),color-stop(100%,#273214));background-image:-webkit-linear-gradient(top,#96ba58,#273214);background-image:-o-linear-gradient(top,#96ba58,#273214);background-image:linear-gradient(#96ba58,#273214);border-color:#273214 #273214 #0b0e05}.xl-button-western{background-color:#4d7a00!important;background-image:-moz-linear-gradient(top,#c3ff5b,#4d7a00);background-image:-ms-linear-gradient(top,#c3ff5b,#4d7a00);background-image:-webkit-gradient(linear,left top,left bottom,color-stop(0,#c3ff5b),color-stop(100%,#4d7a00));background-image:-webkit-linear-gradient(top,#c3ff5b,#4d7a00);background-image:-o-linear-gradient(top,#c3ff5b,#4d7a00);background-image:linear-gradient(#c3ff5b,#4d7a00);border-color:#4d7a00 #4d7a00 #294200}.xl-button-non-h{background-color:#225358!important;background-image:-moz-linear-gradient(top,#73c1c8,#225358);background-image:-webkit-gradient(linear,left top,left bottom,color-stop(0,#73c1c8),color-stop(100%,#225358));background-image:-webkit-linear-gradient(top,#73c1c8,#225358);background-image:-o-linear-gradient(top,#73c1c8,#225358);background-image:linear-gradient(#73c1c8,#225358);border-color:#225358 #225358 hsl(185,44%,14.5%)}.xl-button-imageset{background-color:#0e3961!important;background-image:-moz-linear-gradient(top,#56a0e5,#0e3961);background-image:-webkit-gradient(linear,left top,left bottom,color-stop(0,#56a0e5),color-stop(100%,#0e3961));background-image:-webkit-linear-gradient(top,#56a0e5,#0e3961);background-image:-o-linear-gradient(top,#56a0e5,#0e3961);background-image:linear-gradient(#56a0e5,#0e3961);border-color:#0e3961 #0e3961 #071f35}.xl-button-cosplay{background-color:#3a2861!important;background-image:-moz-linear-gradient(top,#a996d3,#3a2861);background-image:-webkit-gradient(linear,left top,left bottom,color-stop(0,#a996d3),color-stop(100%,#3a2861));background-image:-webkit-linear-gradient(top,#a996d3,#3a2861);background-image:-o-linear-gradient(top,#a996d3,#3a2861);background-image:linear-gradient(#a996d3,#3a2861);border-color:#3a2861 #3a2861 #221839}.xl-button-asianporn{background-color:#740f51!important;background-image:-moz-linear-gradient(top,#ec78c3,#740f51);background-image:-webkit-gradient(linear,left top,left bottom,color-stop(0,#ec78c3),color-stop(100%,#740f51));background-image:-webkit-linear-gradient(top,#ec78c3,#740f51);background-image:-o-linear-gradient(top,#ec78c3,#740f51);background-image:linear-gradient(#ec78c3,#740f51);border-color:#740f51 #740f51 #43092e}.xl-button-misc{background-color:#353535!important;background-image:-moz-linear-gradient(top,#bfbfbf,#353535);background-image:-webkit-gradient(linear,left top,left bottom,color-stop(0,#bfbfbf),color-stop(100%,#353535));background-image:-webkit-linear-gradient(top,#bfbfbf,#353535);background-image:-o-linear-gradient(top,#bfbfbf,#353535);background-image:linear-gradient(#bfbfbf,#353535);border-color:#353535 #353535 hsl(321,0%,7.5%)}.xl-noise{color:#fff!important;margin:0 0 -.25em;padding:.125em 0;border-radius:.25em;position:relative;top:-.125em;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAyCAMAAACd646MAAAAG1BMVEUAAAAfHx8/Pz9fX19/f3+fn5+/v7/f39////8NX9jPAAAACXRSTlMICAgICAgICAWHgaIXAAAErklEQVR42rWXOZIlNBBEn2rLd/8TYxBDANEsA78dGSpDqi0XGmDL04cKanRWhrWBvHqbUoemvHZscN5EVMV1KzTXzfMYtGVvkemNHVWiNitiC++ww3M5McNsFxaKkYcotEyUCKccLXvyXGFVfU/uYA2oWq/L9eapmsOmQd7BE7BcFEbWQp/jNE9jr6OjYYaAJ9K01LrCrCOc2Im2wVLsfjKHsHIttCn0DlYpU0tBSQMM9gRXpr8pLaRdGzUPpVefT1Dv7aFZ1wGL6OHPtRKg9BW1GCktCxq9ePZjhcsJCorYCOZgHdccomwrb1FL0fPQJ1lYuKfalqjeDVFMj+bUZ0d7BSHCPhnqeX0CKlqv11FlhbXAju0YmodWTo2otue1V84WPlT6PWtvRUGZS634CskGj4sogqJTDY1Bt8EM+VglKRWgR32nwhrIk/Gp/3sAAVen3hPvRpVwr5QD0eeqVgCNyvS6WrQC1JN+y7hA06qKLfC3wVWDrVZbvSDvjaTUKle0qBUZjWifntuN5TXI25oweKzOtEjZtmcclanhClMILtEmrT5ReKbUZzX6RxxBlTXdLZAdkRR2FbTPt17sU0kpLddnLH1IqaqoAMTcqZo6CgW/uytPtZVxIpYW0oNxH3gqZ0QQdyXeiOB6CyvaxQSgrDXkzlhvMePcySj71Oc4ilwVAoNiZb31dTzTI/vssNWxhzpvFHCRHQ0A4gOtOcLR7nNpQUV846ryYi3yVID1+U7sx/y4NSqzFqMVzUM+vt5fACVoFsyRZ+s2IIyISyaMjh5yyLqrIuZ8fY2LzKSe1698IojmNahUo891Vp3sQ1XfCMCbFUvrkBPvVhlD4Uoprw4dHFlltNSRs3wvnX6eF80inB6g57y2FR17T0QzDBifpe+y6rJImsiUcD9S+taxclb5axLwtnGkZwIct4K4pyCtJQ+PU1WjbBrDLD4V8R8FTW+ebzLq2A3GYWqRqDy0kQbPQ17jKefd8HUR+6BUP4Nq4KAOurFBzDzeOqL6+gkall6T97Nzj8/8epSOr4TVolhElXZGLi3oMjeqgjLPWhEkfRocTBqCzz4+q0vSCq+3geOpehTyeNvS0y2KmC7xVubpuz1XyZlVtH5CG7CKwvU5LiJNLTz0wfWUUsDqvhbRx4toKfokNMU2rlZ55nrP4TFleXOqqNDv9d19UPXxKTgvwozCG/WppSPrIRYAPXiCiWpjXe6cRtTu/8zUfNtISXScQdKWhuiIsocNZmdwoFQ5TN2VitkprVX7lsJzDlChARzENZy/mcc76duguKmZnfaMBw9Apwza2vGGiarj044exFsCAbUMNsB+ZcA+6oc/iR4iumKrv+NbvtOP/igH3yGB/rwzv1FkKHXVXhj1aEX0UJoFOeAAdME5xZLdoxHoVYiKNT5h3TOeqveGpihwRG12PKPIqH1cCjG8+OB1k4gQRnV2dVRRFKKA4strjYMqZQTK4tRRn08BBMT+d+aDD+iE14LKqRW+4Nr/ghNniexqONNKuyDiaXRTo4JiYIl22ZlDJ+/DxvsvHj9OBtW9d2alRrtAFTeiU5aD0UJEZIu2obEpQPlgYb7+2y84P1jASwAjowAAAABJRU5ErkJggg==)}.xl-exsauce-link{white-space:nowrap;text-transform:lowercase}.xl-exsauce-hover-link{text-decoration:none!important}a.xl-exsauce-link.xl-exsauce-link-disabled{text-decoration:line-through!important;cursor:default!important}.xl-exsauce-results{display:block;white-space:nowrap}.xl-exsauce-results.xl-exsauce-results-hidden{display:none}.xl-exsauce-results-inner{display:table;margin:.25em 0;border-radius:.375em;background-color:rgba(0,0,0,.05);padding:.5em;white-space:normal}.xl-details-page-thumbnail,.xl-details-rating,.xl-details-side-box>div,.xl-exsauce-results-label,.xl-exsauce-results-link{white-space:nowrap}.xl-exsauce-results-inner.xl-theme-dark{background-color:rgba(255,255,255,.05)}.xl-exsauce-results-sep{display:inline-block;margin:0 .5em}.xl-exsauce-results-link{text-decoration:none!important;vertical-align:top;margin:0 .375em;text-transform:lowercase}.xl-exsauce-results-group+.xl-exsauce-results-group{margin-top:.25em}.xl-details,.xl-exsauce-hover{opacity:.93;font-size:inherit;margin:0;overflow:visible}.xl-exsauce-hover{display:block;position:fixed;z-index:993;padding:.5em;border-radius:.25em;width:auto}.xl-actions.xl-actions-hidden,.xl-exsauce-hover.xl-exsauce-hover-hidden{display:none}.xl-actions,.xl-actions:before{position:absolute;border-radius:.25em}.xl-actions{z-index:5;box-sizing:border-box;-moz-box-sizing:border-box}.xl-actions:before{display:block;left:0;top:0;bottom:0;right:0;background-color:rgba(0,0,0,.05)}.xl-actions.xl-theme-dark:before{background-color:rgba(255,255,255,.05)}.xl-actions[data-xl-actions-vpos=above]:not([data-xl-actions-hpos=left]),.xl-actions[data-xl-actions-vpos=above]:not([data-xl-actions-hpos=left]):before{border-bottom-left-radius:0}.xl-actions[data-xl-actions-vpos=below]:not([data-xl-actions-hpos=left]),.xl-actions[data-xl-actions-vpos=below]:not([data-xl-actions-hpos=left]):before{border-top-left-radius:0}.xl-actions[data-xl-actions-vpos=above]:not([data-xl-actions-hpos=right]),.xl-actions[data-xl-actions-vpos=above]:not([data-xl-actions-hpos=right]):before{border-bottom-right-radius:0}.xl-actions[data-xl-actions-vpos=below]:not([data-xl-actions-hpos=right]),.xl-actions[data-xl-actions-vpos=below]:not([data-xl-actions-hpos=right]):before{border-top-right-radius:0}.xl-actions-inner{position:relative;padding:.5em 0}.xl-actions-table{display:table}.xl-actions-table-row{display:table-row}.xl-actions-table-cell{display:table-cell;height:100%;vertical-align:middle;text-align:left}.xl-actions-table-cell:first-of-type{width:0;white-space:nowrap;text-align:right}.xl-actions-table-sep{height:.25em}.xl-actions-table-header{font-weight:700;padding:0 .25em 0 1em;line-height:1.325em}.xl-actions-option{padding:0 1em 0 .25em;line-height:1.325em;display:block}.xl-actions-option:hover{background-color:rgba(0,0,0,.05)}.xl-actions-option.xl-theme-dark:hover{background-color:rgba(255,255,255,.05)}.xl-details{display:block;position:fixed;z-index:994;padding:.5em;border-radius:.5em;text-align:center;width:60%;min-width:600px;box-sizing:border-box;-moz-box-sizing:border-box}.xl-details.xl-details-hidden{display:none}.xl-details-thumbnail{float:left;margin-right:.625em;width:140px;height:200px;background-color:rgba(0,0,0,.03125);background-repeat:no-repeat;background-size:contain;background-position:center center}.xl-details-thumbnail.xl-details-thumbnail-full{background-size:cover;background-position:25% 0}.xl-details-thumbnail.xl-theme-dark{background-color:rgba(255,255,255,.03125)}.xl-details-page-thumbnail{display:none;visibility:hidden;position:absolute;left:0;top:0;width:100%;height:100%;background-color:#fff;text-align:center;transform-origin:100% 50%;-moz-transform-origin:100% 50%;-webkit-transform-origin:100% 50%;transform:rotateY(35deg) translate(1em,0);-moz-transform:rotateY(35deg) translate(1em,0);-webkit-transform:rotateY(35deg) translate(1em,0);backface-visibility:hidden;-moz-backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden;transition:transform .25s ease-out 0s,opacity .25s ease-out 0s;-moz-transition:-moz-transform .25s ease-out 0s,opacity .25s ease-out 0s;-webkit-transition:-webkit-transform .25s ease-out 0s,opacity .25s ease-out 0s}.xl-details-page-thumbnail-size{position:absolute;width:100%;height:100%;transform-origin:50% 50%}.xl-site-tag,.xl-tag{position:relative;text-decoration:none!important}.xl-details-page-thumbnail-image{width:100%;height:100%;background-repeat:no-repeat;background-size:contain;background-position:center center}.xl-details.xl-details-has-thumbnail>.xl-details-thumbnail{margin-right:1em}.xl-details.xl-details-has-thumbnail.xl-details-has-thumbnail-visible>.xl-details-thumbnail{perspective:500px;-moz-perspective:500px;-webkit-perspective:500px;perspective-origin:100% 50%;-moz-perspective-origin:100% 50%;-webkit-perspective-origin:100% 50%;transform-style:preserve-3d;-moz-transform-style:preserve-3d;-webkit-transform-style:preserve-3d}.xl-details.xl-details-has-thumbnail>.xl-details-thumbnail>.xl-details-page-thumbnail{display:block}.xl-details.xl-details-has-thumbnail.xl-details-has-thumbnail-visible>.xl-details-thumbnail>.xl-details-page-thumbnail{visibility:visible;opacity:1}.xl-details.xl-details-has-thumbnail:not(.xl-details-has-thumbnail-visible)>.xl-details-thumbnail>.xl-details-page-thumbnail{transform:none;-moz-transform:none;-webkit-transform:none;opacity:0}.xl-details-side-panel{float:right;margin-left:.5em;font-size:1.0625em!important;line-height:1em!important}.xl-details-side-box{width:100%;min-width:6em;font-size:.8em;padding:.5em 0;margin:.8em 0 .4em;border-radius:.5em;background-clip:padding-box;background-color:rgba(0,0,0,.125);box-shadow:0 0 .5em rgba(0,0,0,.125);text-shadow:0 .1em 0 rgba(255,255,255,.5)}.xl-details-side-box.xl-theme-dark{background-color:rgba(255,255,255,.125);box-shadow:0 0 .5em rgba(255,255,255,.125);text-shadow:0 .1em 0 rgba(0,0,0,.5)}.xl-details-side-box-error{color:#e00000}.xl-details-side-box-error.xl-theme-dark{color:#ff1f1f}.xl-details-title{font-size:1.5em!important;font-weight:700!important;text-shadow:.1em .1em .4em rgba(0,0,0,.15)!important;text-decoration:none!important}.xl-details-title-jp{margin-top:.25em;opacity:.5;font-size:1.1em;text-shadow:.1em .1em .5em rgba(0,0,0,.2)}.xl-details-title-jp.xl-theme-dark{text-shadow:.1em .1em .5em rgba(255,255,255,.2)}.xl-details-rating{text-align:center;display:inline-block;vertical-align:middle}.xl-details-file-size,.xl-details-rating-text{opacity:.65;font-size:.95em}.xl-details-upload-info{font-size:1em;margin:1em 0}.xl-details-uploader{font-size:1em!important;margin:0 .625em}.xl-details-upload-date{font-size:1em!important;margin-left:.625em}.xl-details-tag-block{font-size:1.075em!important;display:inline!important;line-height:1.4em}.xl-tag-block,.xl-tag-namespace-first{display:inline-block}.xl-details-tag-block-label{margin-right:.25em!important}.xl-details-clear{clear:both}.xl-tag-block{margin:0 .125em}.xl-tag{white-space:nobreak}.xl-tag.xl-tag-color-inherit{color:inherit!important}.xl-tag-block.xl-tag-block-last-of-namespace{margin-right:.5em}.xl-tag-block.xl-tag-block-last{margin-right:0}.xl-tag-namespace-first>.xl-tag-block{display:inline}.xl-tag-namespace-block{display:inline-block;margin:0 .125em}.xl-tag-namespace{display:inline-block;border:1px solid rgba(0,0,0,.4);border-radius:.25em;padding:0 .25em;line-height:normal}.xl-tag-namespace-block.xl-tag-namespace-block-no-outline>.xl-tag-namespace{border-style:none}.xl-tag-namespace-block.xl-theme-dark>.xl-tag-namespace{border-color:rgba(255,255,255,.4)}.xl-tag-namespace-block.xl-tag-namespace-language>.xl-tag-namespace{color:#6721c6}.xl-tag-namespace-block.xl-tag-namespace-group>.xl-tag-namespace{color:#9f8636}.xl-tag-namespace-block.xl-tag-namespace-artist>.xl-tag-namespace{color:#c47525}.xl-tag-namespace-block.xl-tag-namespace-parody>.xl-tag-namespace{color:#0ea79e}.xl-tag-namespace-block.xl-tag-namespace-character>.xl-tag-namespace{color:#288028}.xl-tag-namespace-block.xl-tag-namespace-male>.xl-tag-namespace{color:#0659ae}.xl-tag-namespace-block.xl-tag-namespace-female>.xl-tag-namespace{color:#e0338d}.xl-tag-namespace-block.xl-tag-namespace-language.xl-theme-dark>.xl-tag-namespace{color:#895cc6}.xl-tag-namespace-block.xl-tag-namespace-group.xl-theme-dark>.xl-tag-namespace{color:#e8c44f}.xl-tag-namespace-block.xl-tag-namespace-artist.xl-theme-dark>.xl-tag-namespace{color:#e89c4f}.xl-tag-namespace-block.xl-tag-namespace-parody.xl-theme-dark>.xl-tag-namespace{color:#21eda2}.xl-tag-namespace-block.xl-tag-namespace-character.xl-theme-dark>.xl-tag-namespace{color:#6ce769}.xl-tag-namespace-block.xl-tag-namespace-male.xl-theme-dark>.xl-tag-namespace{color:#23add0}.xl-tag-namespace-block.xl-tag-namespace-female.xl-theme-dark>.xl-tag-namespace{color:#e89cc4}.xl-actions-uploader.xl-filter-good,.xl-details-uploader.xl-filter-good,.xl-link.xl-filter-good,.xl-site-tag.xl-filter-good,.xl-tag.xl-filter-good{font-weight:700}.xl-filter-text{display:inline}.xl-site-tag{white-space:nowrap;display:inline-block;margin-right:.25em;outline:0!important}.xl-site-tag-bg,.xl-site-tag-bg-shadow{display:none;position:absolute;left:-.25em;top:-.25em;bottom:-.25em;right:-.25em;border-radius:.25em;pointer-events:none}.xl-site-tag.xl-site-tag-active>.xl-site-tag-bg-shadow{z-index:4}.xl-site-tag.xl-site-tag-active>.xl-site-tag-bg>.xl-site-tag-bg-inner,.xl-site-tag.xl-site-tag-active>.xl-site-tag-text{z-index:6}.xl-site-tag.xl-site-tag-active>.xl-site-tag-bg,.xl-site-tag.xl-site-tag-active>.xl-site-tag-bg-shadow{display:block}.xl-site-tag-bg-inner,.xl-site-tag-bg-inner:after{display:block;position:absolute;left:0;top:0;bottom:0;right:0;border-radius:.25em}.xl-popup-align,.xl-popup-aligner:before{display:inline-block;vertical-align:middle}.xl-site-tag-bg-inner:after{background-color:rgba(0,0,0,.05)}.xl-site-tag-bg-inner.xl-theme-dark:after{background-color:rgba(255,255,255,.05)}.xl-site-tag[data-xl-actions-vpos=above]>.xl-site-tag-bg,.xl-site-tag[data-xl-actions-vpos=above]>.xl-site-tag-bg-shadow,.xl-site-tag[data-xl-actions-vpos=above]>.xl-site-tag-bg>.xl-site-tag-bg-inner,.xl-site-tag[data-xl-actions-vpos=above]>.xl-site-tag-bg>.xl-site-tag-bg-inner:after{border-top-left-radius:0;border-top-right-radius:0}.xl-site-tag[data-xl-actions-vpos=below]>.xl-site-tag-bg,.xl-site-tag[data-xl-actions-vpos=below]>.xl-site-tag-bg-shadow,.xl-site-tag[data-xl-actions-vpos=below]>.xl-site-tag-bg>.xl-site-tag-bg-inner,.xl-site-tag[data-xl-actions-vpos=below]>.xl-site-tag-bg>.xl-site-tag-bg-inner:after{border-bottom-left-radius:0;border-bottom-right-radius:0}.xl-site-tag-text{position:relative}.xl-link.xl-link-formatted{text-decoration:none!important}.xl-link-error-message{opacity:.75}.xl-link-page{font-weight:400;white-space:nowrap}.xl-nav-extras-mobile{text-align:center;margin:.5em 0}.xl-nav-link{cursor:pointer}.xl-hover-shadow{box-shadow:0 0 .125em 0 rgba(0,0,0,.5)}.xl-hover-shadow.xl-theme-dark{box-shadow:0 0 .125em 0 rgba(255,255,255,.5)}:root.xl-popup-overlaying,:root.xl-popup-overlaying body{overflow-x:hidden!important;overflow-y:hidden!important}.xl-popup-overlay{position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(255,255,255,.5);z-index:400;overflow-x:auto;overflow-y:scroll}.xl-popup-overlay.xl-theme-dark{background:rgba(0,0,0,.5)}.xl-popup-aligner{position:absolute;left:0;top:0;right:0;bottom:0;white-space:nowrap;line-height:0;text-align:center}.xl-popup-aligner:before{width:0;height:100%}.xl-popup-align{white-space:normal;line-height:normal;text-align:left;padding:1em;margin:0;width:800px;min-width:60%;max-width:100%;box-sizing:border-box;-moz-box-sizing:border-box}.xl-popup-content{display:block;padding:1em;margin:0;width:100%;border:none;box-sizing:border-box;-moz-box-sizing:border-box;position:relative;border-radius:.5em;overflow:visible}.xl-popup-table{display:table;width:100%;height:100%}.xl-popup-row{display:table-row;width:100%;height:0}.xl-popup-row.xl-popup-row-body,.xl-popup-row.xl-popup-row-body>.xl-popup-cell{height:100%}.xl-popup-cell{display:table-cell;width:100%;height:0;vertical-align:top;text-align:left}.xl-popup-cell.xl-popup-cell-small{width:0;white-space:nowrap}.xl-popup-cell.xl-popup-cell-center{text-align:center}.xl-popup-cell.xl-popup-cell-right{text-align:right}.xl-popup-cell.xl-popup-cell-middle{vertical-align:middle}.xl-popup-cell.xl-popup-cell-bottom{vertical-align:bottom}.xl-popup-cell-size{position:relative;width:100%;height:100%}.xl-popup-cell-size-scroll{position:absolute;left:0;top:0;right:0;bottom:0;overflow:auto}.xl-popup-cell-size-padding{position:relative;padding:.375em;width:100%;min-height:100%;box-sizing:border-box;-moz-box-sizing:border-box}.xl-settings-popup-align{min-height:80%;height:200px}.xl-settings-popup-content{position:relative;height:100%}.xl-settings-button{margin:0 .25em;display:inline-block!important;vertical-align:middle;padding:.25em;background:rgba(0,0,0,.05);border-radius:.2em;text-decoration:none!important;cursor:pointer;font-size:inherit!important;line-height:normal!important;white-space:nowrap!important}.xl-settings-button.xl-theme-dark{background:rgba(255,255,255,.05)}.xl-settings-button-checkbox,.xl-settings-button-checkbox+.riceCheck{margin:0!important;padding:0!important;vertical-align:middle}.xl-settings-button-checkbox-text{display:none}.xl-settings-button-checkbox:checked~.xl-settings-button-checkbox-text:nth-of-type(1),.xl-settings-button-checkbox:not(:checked)~.xl-settings-button-checkbox-text:nth-of-type(2){display:inline}.xl-settings-title{font-size:2em!important;font-weight:700!important;text-decoration:none!important}.xl-settings-version{margin:0 .25em;opacity:.9;vertical-align:75%;text-decoration:none!important;color:inherit!important}.xl-settings-title-info,.xl-settings-version.xl-settings-version-large{margin:0;font-size:1.8em;vertical-align:baseline;opacity:1}.xl-settings-heading{display:table;width:100%;padding:.25em 0}.xl-settings-heading>div{display:table-row;height:100%}.xl-settings-heading-cell{display:table-cell;height:100%;width:100%}.xl-settings-heading-title{vertical-align:top;text-align:left;font-size:1.5em;font-weight:700;font-family:sans-serif;white-space:nowrap;width:0}.xl-settings-heading-subtitle{vertical-align:bottom;text-align:right;padding-left:.5em;opacity:.6}.xl-settings-group{border:1px solid rgba(0,0,0,.2);border-radius:.25em;padding:.125em;box-sizing:border-box;-moz-box-sizing:border-box}.xl-settings-group.xl-theme-dark{border-color:rgba(255,255,255,.2)}.xl-settings-group+.xl-settings-heading{margin-top:.75em}.xl-settings-entry-table{display:table;width:100%;padding:.375em .25em;box-sizing:border-box;-moz-box-sizing:border-box}.xl-settings-entry-row{display:table-row;height:100%}.xl-settings-entry-cell{vertical-align:middle;text-align:left;display:table-cell;width:100%;height:100%}.xl-settings-entry-cell:last-of-type:not(:first-of-type){vertical-align:middle;text-align:right;width:0}.xl-settings-entry+.xl-settings-entry{border-top:.125em solid transparent}.xl-settings-entry:nth-child(even)>.xl-settings-entry-table{background-color:rgba(0,0,0,.05)}.xl-settings-entry:nth-child(odd)>.xl-settings-entry-table{background-color:rgba(0,0,0,.025)}.xl-settings-entry.xl-theme-dark:nth-child(even)>.xl-settings-entry-table{background-color:rgba(255,255,255,.05)}.xl-settings-entry.xl-theme-dark:nth-child(odd)>.xl-settings-entry-table{background-color:rgba(255,255,255,.025)}input.xl-settings-entry-input[type=text]{width:8em}button.xl-settings-entry-input,input.xl-settings-entry-input[type=text],select.xl-settings-entry-input{min-width:8em;box-sizing:border-box;-moz-box-sizing:border-box;padding:.0625em .125em!important;margin:0!important;font-size:inherit!important;font-family:inherit!important;line-height:1.3em!important}select.xl-settings-entry-input{width:auto;height:auto}label.xl-settings-entry-label{cursor:pointer;margin-bottom:0}.xl-settings-filter-guide-toggle{cursor:pointer;text-decoration:none!important}.xl-settings-filter-guide{margin-bottom:.25em;padding:.375em}.xl-settings-filter-guide:not(.xl-settings-filter-guide-visible){display:none}.xl-settings-popup-content ul{padding:0;margin:1em 0;list-style-type:disc!important}.xl-settings-popup-content ul>li{margin:0 .5em 0 2em}.xl-settings-popup-content ul>li+li{margin-top:1em}.xl-settings-popup-content ul>li.xl-settings-li-no-space{margin-top:0}.xl-settings-popup-content code{color:#000;background-color:#fff;font-family:Courier,monospace!important}.xl-settings-popup-content.xl-theme-dark code{color:#fff;background-color:#000;font-family:Courier,monospace!important}.xl-settings-color-input{padding:.25em!important;margin:0 1em 0 0!important;display:inline-block;vertical-align:middle!important;line-height:1.5em!important;height:2em!important;width:8em!important;box-sizing:border-box!important;-moz-box-sizing:border-box!important;cursor:text!important}.xl-settings-color-input:first-of-type{cursor:pointer!important}.xl-settings-color-input:last-of-type{width:11em!important}.xl-settings-export-textarea,textarea.xl-settings-entry-input{display:block;width:100%;height:15em;line-height:1.3em;padding:.5em!important;margin:0!important;box-sizing:border-box;-moz-box-sizing:border-box;resize:vertical;font-size:.9em!important;font-family:Courier,monospace!important}button.xl-settings-entry-input{float:right;padding:.125em .25em;margin:0;box-sizing:border-box;-moz-box-sizing:border-box;background-color:transparent;border:1px solid rgba(0,0,0,.25);border-radius:.25em;font-size:inherit;font-family:inherit;color:inherit;cursor:pointer}button.xl-settings-entry-input:hover{border-color:rgba(0,0,0,.5)}button.xl-settings-entry-input.xl-theme-dark{border-color:rgba(255,255,255,.25)}button.xl-settings-entry-input.xl-theme-dark:hover{border-color:rgba(255,255,255,.5)}.xl-settings-export-textarea{height:100%;resize:none}.xl-settings-export-textarea.xl-settings-export-textarea-error{border-color:#f00000!important;color:#f00000!important}.xl-settings-export-textarea.xl-settings-export-textarea-changed{color:#0080f0!important}.xl-settings-export-textarea.xl-settings-export-textarea-changed.xl-theme-dark{color:#80b0ff!important}.xl-settings-file-input{display:inline-block;display:none;visibility:hidden;opacity:0;width:0;height:0}.xl-settings-export-message{line-height:1.6em}.xl-settings-export-label{display:inline-block;margin:0;padding:0}.xl-settings-export-checkbox,.xl-settings-export-checkbox:checked~.xl-settings-export-label-text:first-of-type,.xl-settings-export-checkbox:not(:checked)~.xl-settings-export-label-text:not(:first-of-type){display:none}.xl-settings-export-label-text:first-of-type{opacity:.6}.xl-easylist-title{margin-left:-2em}.xl-easylist-title-text{display:inline-block;font-size:2em;font-weight:700;margin-left:1em}.xl-easylist-subtitle{display:inline-block;opacity:.8;margin-left:2em}.xl-easylist-title-line{border-bottom:1px solid grey;margin:.5em 0}.xl-easylist-control-links{position:absolute;top:0;right:0}.xl-easylist-control-link{display:inline-block;padding:.5em;cursor:pointer;opacity:.5;text-decoration:none!important}.xl-easylist-empty-notification.xl-easylist-empty-notification-visible+.xl-easylist-items,.xl-easylist-empty-notification:not(.xl-easylist-empty-notification-visible),.xl-easylist-item.xl-easylist-item-hidden{display:none}.xl-easylist-control-link.xl-easylist-control-link-focus,.xl-easylist-control-link:hover{opacity:1}.xl-easylist-control-link+.xl-easylist-control-link{margin-left:.5em}.xl-easylist-empty-notification{text-align:center;font-size:2em;font-style:italic;padding:2em}.xl-easylist-items{border-radius:.5em;border:1px solid rgba(0,0,0,.25);box-sizing:border-box;-moz-box-sizing:border-box;overflow:hidden}.xl-easylist-items.xl-theme-dark{border:1px solid rgba(255,255,255,.25)}.xl-easylist-item{background-color:rgba(0,0,0,.03125)}.xl-easylist-item[data-xl-easylist-item-parity=even]{background-color:rgba(0,0,0,.0625)}.xl-easylist-item.xl-theme-dark{background-color:rgba(255,255,255,.03125)}.xl-easylist-item.xl-theme-dark[data-xl-easylist-item-parity=even]{background-color:rgba(255,255,255,.0625)}.xl-easylist-item-table-container{padding:.5em;position:relative;box-sizing:border-box;-moz-box-sizing:border-box}.xl-easylist-item-table{display:table;width:100%}.xl-easylist-item-row{display:table-row}.xl-easylist-item-cell{display:table-cell;width:100%;vertical-align:top;padding:0 .5em}.xl-easylist-item-cell.xl-easylist-item-cell-image,.xl-easylist-item-cell.xl-easylist-item-cell-side{width:0;padding:0}.xl-easylist-item-image-container{display:block;margin:0;padding:0;border:none;width:140px;height:200px;background-color:rgba(0,0,0,.03125);text-align:center;white-space:nowrap;line-height:0}.xl-easylist-item-image-container:after{display:inline-block;vertical-align:middle;width:0;height:100%}.xl-easylist-item-image-container.xl-theme-dark{background-color:rgba(255,255,255,.03125)}.xl-easylist-item-image-outer{display:inline-block;vertical-align:middle;position:relative;line-height:normal;white-space:normal}.xl-easylist-item-image{margin:0!important;padding:0!important;border:none!important;display:inline-block;vertical-align:middle;max-width:140px;max-height:200px}.xl-easylist-item-image-index{display:block;position:absolute;left:0;top:0;padding:.25em;color:#000;text-shadow:0 0 .125em #fff,0 0 .25em #fff}.xl-easylist-item-image-index.xl-theme-dark{color:#fff;text-shadow:0 0 .125em #000,0 0 .25em #000}.xl-easylist-item-info{display:inline-block;padding:0 0 .5em .5em;width:4.8em}.xl-easylist-item-info-item{font-size:.825em;margin-top:1em;text-align:center;max-width:100%;border-radius:.5em;padding:.375em 0;background-color:rgba(0,0,0,.125);box-shadow:0 0 .5em rgba(0,0,0,.125);text-shadow:0 .1em 0 rgba(255,255,255,.5)}.xl-easylist-item-tags,.xl-easylist-item-upload-info,.xl-easylist-option-group+.xl-easylist-option-group{margin-top:.5em}.xl-easylist-item-info-item.xl-theme-dark{background-color:rgba(255,255,255,.125);box-shadow:0 0 .5em rgba(255,255,255,.125);text-shadow:0 .1em 0 rgba(0,0,0,.5)}.xl-easylist-item-info-light{opacity:.8}.xl-easylist-item-info-button{text-decoration:none!important}.xl-easylist-item-title{font-size:1.5em;font-weight:700}.xl-easylist-item-title:hover{text-shadow:0 0 .25em #fff}.xl-easylist-item-title.xl-theme-dark:hover{text-shadow:0 0 .25em #000}.xl-easylist-item-title-link{text-decoration:none!important}.xl-easylist-item-title-tag-link{text-decoration:none!important;margin-right:.25em;display:none}.xl-easylist-item-title-jp{opacity:.5;font-size:1.1em;display:block}.xl-easylist-item-upload-date,.xl-easylist-item-uploader{font-weight:700;display:inline-block;padding:0 .25em}.xl-easylist-item-tag-table{display:table;width:100%}.xl-easylist-item-tag-row{display:table-row}.xl-easylist-item-tag-row+.xl-easylist-item-tag-row>.xl-easylist-item-tag-cell{padding-top:.25em}.xl-easylist-item-tag-cell{display:table-cell;width:100%}.xl-easylist-compact .xl-easylist-item-info-item.xl-easylist-item-info-item-files>:not(:first-child),.xl-easylist-compact .xl-easylist-item-info-item.xl-easylist-item-info-item-rating>:not(:first-child),.xl-easylist-compact .xl-easylist-item-title-jp,.xl-easylist-compact .xl-easylist-item-upload-info{display:none}.xl-easylist-item-tag-cell.xl-easylist-item-tag-cell-label{width:0;white-space:nowrap;text-align:right;padding-right:.25em}.xl-easylist-compact .xl-easylist-item-image-container{width:70px;height:100px}.xl-easylist-compact .xl-easylist-item-image{max-width:70px;max-height:100px}.xl-easylist-compact .xl-easylist-item-title{font-size:1em;line-height:1.25em;max-height:2.5em;overflow:hidden;position:relative}.xl-easylist-compact .xl-easylist-item-title:hover{overflow:visible;z-index:1}.xl-easylist-compact .xl-easylist-item-tags{font-size:.9em}.xl-easylist-compact .xl-easylist-item-tag-row+.xl-easylist-item-tag-row>.xl-easylist-item-tag-cell{padding-top:0}.xl-easylist-compact .xl-easylist-item-tag-table{display:block;line-height:1.4em}.xl-easylist-compact .xl-easylist-item-tag-row{display:inline}.xl-easylist-compact .xl-easylist-item-tag-row+.xl-easylist-item-tag-row:before{content:\"\";display:inline-block;width:1em;height:0}.xl-easylist-compact .xl-easylist-item-tag-cell{display:inline;width:auto}.xl-easylist-minimal .xl-easylist-item-cell-image,.xl-easylist-minimal .xl-easylist-item-info-item,.xl-easylist-minimal .xl-easylist-item-tags,.xl-easylist-minimal .xl-easylist-item-title-jp,.xl-easylist-minimal .xl-easylist-item-upload-info{display:none}.xl-easylist-compact .xl-easylist-item-tag-cell>.xl-tag-namespace-block.xl-tag-namespace-block-no-outline>.xl-tag-namespace{border-width:1px;border-style:solid}.xl-easylist-minimal .xl-easylist-item-cell{padding-left:0;vertical-align:middle}.xl-easylist-minimal .xl-easylist-item-cell-side{vertical-align:top}.xl-easylist-minimal .xl-easylist-item-title{font-size:1em;line-height:1.25em}.xl-easylist-minimal .xl-easylist-item-title-tag-link{display:inline-block}.xl-easylist-options:not(.xl-easylist-options-visible){display:none}.xl-easylist-option-table{display:table;width:100%}.xl-easylist-option-row{display:table-row}.xl-easylist-option-row+.xl-easylist-option-row>.xl-easylist-option-cell{padding-top:.5em}.xl-easylist-option-cell{display:table-cell;width:100%;vertical-align:top}.xl-easylist-option-cell:first-of-type{width:0;text-align:right}.xl-easylist-option-title{font-weight:700;margin-right:1em;display:inline-block;padding:.25em 0;border-top:1px solid transparent;border-bottom:1px solid transparent;white-space:nowrap}.xl-easylist-option-title-sub{max-width:100%;margin-right:1em;opacity:.9;white-space:normal}.xl-easylist-option-title-sub-text{font-size:.875em;line-height:1.1em}.xl-easylist-option-label{display:inline-block}.xl-easylist-option-label+.xl-easylist-option-label{margin-left:.5em}.xl-easylist-option-input,.xl-easylist-option-input+.riceCheck{display:none}.xl-easylist-option-button{display:inline-block;padding:.25em .5em;border-radius:.25em;background-color:rgba(255,255,255,.125);border:1px solid rgba(0,0,0,.0625);cursor:pointer}.xl-easylist-option-button:hover{border-color:rgba(0,0,0,.25)}.xl-easylist-option-button.xl-theme-dark{background-color:rgba(0,0,0,.125);border:1px solid rgba(255,255,255,.0625)}.xl-easylist-option-button.xl-theme-dark:hover{border-color:rgba(255,255,255,.25)}.xl-easylist-option-input:checked~.xl-easylist-option-button{background-color:rgba(255,255,255,.5);border-color:rgba(0,0,0,.25);color:#000}.xl-easylist-option-input:checked~.xl-easylist-option-button.xl-theme-dark{background-color:rgba(0,0,0,.5);border-color:rgba(255,255,255,.25);color:#fff}.xl-easylist-option-textarea{background-color:rgba(255,255,255,.125)!important;border:1px solid rgba(0,0,0,.0625)!important;margin:0!important;padding:.25em!important;box-sizing:border-box;-moz-box-sizing:border-box;width:100%;line-height:1.4em;height:4.8em;min-height:2em;resize:vertical;font-family:Courier,monospace!important}.xl-easylist-option-textarea:focus,.xl-easylist-option-textarea:hover{background-color:rgba(255,255,255,.5)!important;border-color:rgba(0,0,0,.25)!important}.xl-easylist-option-textarea.xl-theme-dark{background-color:rgba(0,0,0,.125)!important;border:1px solid rgba(255,255,255,.0625)!important;margin:0!important;padding:.25em!important}.xl-easylist-option-textarea.xl-theme-dark:focus,.xl-easylist-option-textarea.xl-theme-dark:hover{background-color:rgba(0,0,0,.5)!important;border-color:rgba(255,255,255,.25)!important}.xl-changelog-popup-align{min-height:80%;height:200px}.xl-changelog-popup-content{position:relative;height:100%}.xl-changelog-message-container{position:absolute;left:0;top:0;right:0;bottom:0;text-align:center;line-height:0;white-space:nowrap}.xl-changelog-message-container:before{display:inline-block;vertical-align:middle;width:0;height:100%}.xl-changelog-message{text-align:left;line-height:normal;white-space:normal;display:inline-block;vertical-align:middle}.xl-changelog-entry-user-name,.xl-changelog-entry-version{font-weight:700;line-height:1.4em}.xl-changelog-entries{padding:.375em}.xl-changelog-entry+.xl-changelog-entry{margin-top:1em}.xl-changelog-entry-version{font-size:1.25em}.xl-changelog-entry-users{margin-left:1em}.xl-changelog-entry-user+.xl-changelog-entry-user{margin-top:.5em}.xl-changelog-entry-changes{margin:0 0 0 1.5em!important;padding:0!important;list-style-type:disc!important}.xl-changelog-entry-change{margin:0!important;padding:0!important}.xl-changelog-entry-change+.xl-changelog-entry-change{margin-top:.5em!important}.xl-header-bar-link{vertical-align:bottom;cursor:pointer}.xl-header-bar-link.xl-appchanx,.xl-header-bar-svg{vertical-align:middle}.xl-header-bar-svg{width:1.2em;height:1.16em;display:inline-block;fill:#000;stroke:none}.xl-header-bar-link.xl-appchanx>.xl-header-bar-svg{width:100%;height:100%}";
			$.add(d.head, style);

			Theme.ready();
			EasyList.ready();

			Debug.timer_log("init.ready duration", "init");

			Linkifier.queue_posts(Post.get_all_posts(d), Linkifier.queue_posts.Flags.UseDelay);

			if (Config.dynamic) {
				updater = new MutationObserver(on_body_observe);
				updater.observe(d.body, { childList: true, subtree: true });
			}

			HeaderBar.ready();

			if (Module.version_change === 1 && config.general.changelog_on_update) {
				Changelog.open(" updated to ");
			}

			Debug.timer_log("init.ready.full duration", "init");
		}._w(597);
		var on_body_observe = function (records) {
			var post_list = [],
				reload_all = false,
				nodes, node, ns, e, i, ii, j, jj;

			for (i = 0, ii = records.length; i < ii; ++i) {
				e = records[i];
				nodes = e.removedNodes;
				if (nodes && nodes.length > 0) {
					// Removed posts
					check_removed_nodes(nodes);
				}

				nodes = e.addedNodes;
				if (!nodes) continue;

				// Find posts
				for (j = 0, jj = nodes.length; j < jj; ++j) {
					node = nodes[j];
					if (node.nodeType === Node.ELEMENT_NODE) {
						if (Post.is_post(node)) {
							post_list.push(node);
						}
						else if (is_post_group_container(node)) {
							ns = Post.get_all_posts(node);
							if (ns.length > 0) {
								$.push_many(post_list, ns);
							}
						}
					}
				}

				if (Config.is_4chan) {
					// 4chan-x conflicts
					if (Config.is_4chan_x3) {
						// Source links
						if (
							e.target.classList.contains("fileText") &&
							e.previousSibling &&
							e.previousSibling.classList &&
							e.previousSibling.classList.contains("file-info")
						) {
							node = Post.get_post_container(e.target);
							if (node !== null) {
								post_list.push(node);
							}
						}

						// 4chan-x linkification conflicts
						for (j = 0, jj = nodes.length; j < jj; ++j) {
							node = nodes[j];
							if (
								node.tagName === "A" &&
								node.classList.contains("linkify") &&
								(ns = $$(".xl-link-events", node)).length > 0
							) {
								Linkifier.fix_broken_4chanx_linkification(node, ns);
							}
						}
					}
					else {
						// 4chan-inline conflicts
						if (!reload_all && e.target.classList.contains("navLinks")) {
							for (j = 0, jj = nodes.length; j < jj; ++j) {
								if (nodes[j].classList && nodes[j].classList.contains("thread-stats")) {
									// Reload every single post because 4chan's inline script messed it all up
									// This seems to be some sort of timing issue where 4chan-inline replaces the body contents of EVERY SINGLE POST on ready()
									reload_all = true;
								}
							}
						}
					}
				}
			}

			if (post_list.length > 0) {
				Linkifier.queue_posts(post_list, Linkifier.queue_posts.Flags.None);
			}
			if (reload_all) {
				reload_all_posts();
			}
		}._w(598);
		var check_removed_nodes = function (nodes) {
			var node, ns, i, ii, j, jj;
			for (i = 0, ii = nodes.length; i < ii; ++i) {
				node = nodes[i];
				if (node.nodeType === Node.ELEMENT_NODE) {
					if (Post.is_post(node)) {
						UI.cleanup_post_removed(node);
					}
					else if (is_post_group_container(node)) {
						ns = Post.get_all_posts(node);
						for (j = 0, jj = ns.length; j < jj; ++j) {
							UI.cleanup_post_removed(ns[j]);
						}
					}
				}
			}
		}._w(599);
		var is_post_group_container = function (node) {
			return node.id === "qp" || node.classList.contains("thread") || node.classList.contains("inline");
		}._w(600);

		// Public
		var init = function () {
			var t = Debug.timer_log("init.pre duration", timing.start);
			Config.init();
			Debug.init();
			if (Module.version_change !== 0 && Module.version_change !== 2) {
				Debug.log("Clearing cache on version change");
				API.cache_clear();
			}
			API.init();
			UI.init();
			Sauce.init();
			ExtensionAPI.init();
			Debug.log(t[0], t[1]);
			Debug.timer_log("init duration", timing.start);
			$.ready(on_ready);
		}._w(601);
		var version_compare = function (v1, v2) {
			// Returns: -1 if v1<v2, 0 if v1==v2, 1 if v1>v2
			var ii = Math.min(v1.length, v2.length),
				i, x, y;

			for (i = 0; i < ii; ++i) {
				x = v1[i];
				y = v2[i];
				if (x < y) return -1;
				if (x > y) return 1;
			}

			ii = v1.length;
			y = v2.length;
			if (ii === y) return 0;

			if (ii > y) {
				y = 1;
			}
			else {
				ii = y;
				v1 = v2;
				y = -1;
			}

			for (; i < ii; ++i) {
				x = v1[i];
				if (x < 0) return -y;
				if (x > 0) return y;
			}

			return 0;
		}._w(602);
		var insert_custom_fonts = function () {
			if (fonts_inserted) return;
			fonts_inserted = true;

			if (!config.general.external_resources) return;

			var font = $.node_simple("link");
			font.rel = "stylesheet";
			font.type = "text/css";
			font.href = "//fonts.googleapis.com/css?family=Source+Sans+Pro:900";
			$.add(d.head, font);
		}._w(603);

		// Exports
		var Module = {
			homepage: "https://dnsev-h.github.io/x-links/",
			version: [1,2,1,1,0xDB],
			version_change: 0,
			init: init,
			version_compare: version_compare,
			insert_custom_fonts: insert_custom_fonts
		};

		return Module;

	}._w(595))();

	Main.init();
	Debug.timer_log("init.full duration", timing.start);

})();

