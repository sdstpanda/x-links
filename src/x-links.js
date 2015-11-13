/* jshint eqnull:true, noarg:true, noempty:true, eqeqeq:true, bitwise:false, strict:true, undef:true, curly:false, browser:true, devel:true, newcap:false, maxerr:50 */
/* globals GM_xmlhttpRequest, GM_setValue, GM_getValue, GM_deleteValue, GM_listValues */
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

	// begin_debug

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
						[ domains.gehentai, domains.gehentai ],
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
					set: function (v) { return parseFloat(v) || 0.0; }
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
						[ domains.gehentai, domains.gehentai ],
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
				"Good tag marker", "Text to mark a [Site] tag with when a good filter is matched",
				"Good Tag Marker",
				{ type: "textbox" },
			],
			[ "bad_tag_marker", "",
				"Bad tag marker", "Text to mark a [Site] tag with when a bad filter is matched",
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
				},
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
			};
			var on_body_node_remove = function (event) {
				var node = event.target;
				this.callback.call(this, [{
					target: node.parentNode,
					addedNodes: [],
					removedNodes: [ node ],
					nextSibling: node.nextSibling,
					previousSibling: node.previousSibling
				}]);
			};

			MutationObserver = function (callback) {
				this.on_body_node_add = $.bind(on_body_node_add, this);
				this.on_body_node_remove = $.bind(on_body_node_remove, this);
				this.callback = callback;
				this.nodes = [];
			};
			MutationObserver.prototype.observe = function (node, data) {
				this.nodes.push(node);
				if (data.childList) {
					$.on(node, "DOMNodeInserted", this.on_body_node_add);
					$.on(node, "DOMNodeRemoved", this.on_body_node_remove);
				}
			};
			MutationObserver.prototype.disconnect = function () {
				var node, i, ii;
				for (i = 0, ii = this.nodes.length; i < ii; ++i) {
					node = this.nodes[i];
					$.off(node, "DOMNodeInserted", this.on_body_node_add);
					$.off(node, "DOMNodeRemoved", this.on_body_node_remove);
				}
				this.nodes = [];
			};
		}

		return MutationObserver;

	})();
	var $$ = function (selector, root) {
		return (root || d).querySelectorAll(selector);
	};
	var $ = (function () {

		var re_full_domain = /^(?:[\w\-]+):\/*((?:[\w\-]+\.)+[\w\-]+)/i,
			re_short_domain = /^(?:[\w\-]+):\/*(?:[\w\-]+\.)*([\w\-]+\.[\w\-]+)/i,
			re_change_domain = /^([\w\-]+:\/*)([\w\-]+(?:\.[\w\-]+)*)([\w\W]*)$/i;

		var Module = function (selector, root) {
			return (root || d).querySelector(selector);
		};

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
		};
		Module.prepend = function (parent, child) {
			return parent.insertBefore(child, parent.firstChild);
		};
		Module.add = function (parent, child) {
			return parent.appendChild(child);
		};
		Module.before = function (root, next, node) {
			return root.insertBefore(node, next);
		};
		Module.after = function (root, prev, node) {
			return root.insertBefore(node, prev.nextSibling);
		};
		Module.replace = function (root, elem) {
			return root.parentNode.replaceChild(elem, root);
		};
		Module.remove = function (elem) {
			return elem.parentNode.removeChild(elem);
		};
		Module.tnode = function (text) {
			return d.createTextNode(text);
		};
		Module.node = function (tag, class_name, text) {
			var elem = d.createElement(tag);
			elem.className = class_name;
			if (text !== undefined) {
				elem.textContent = text;
			}
			return elem;
		};
		Module.node_ns = function (namespace, tag, class_name) {
			var elem = d.createElementNS(namespace, tag);
			elem.setAttribute("class", class_name);
			return elem;
		};
		Module.node_simple = function (tag) {
			return d.createElement(tag);
		};
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
		};
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
		};
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
		};
		Module.test = function (elem, selector) {
			try {
				if (elem.matches) return elem.matches(selector);
				return elem.matchesSelector(selector);
			}
			catch (e) {}
			return false;
		};
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
		};

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
		};
		Module.clamp = function (value, min, max) {
			return Math.min(max, Math.max(min, value));
		};
		Module.is_left_mouse = function (event) {
			return (event.which === undefined || event.which === 1);
		};
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
		};
		Module.bind = function (fn, self) {
			if (arguments.length > 2) {
				var args = Array.prototype.slice.call(arguments, 2);

				return function () {
					var full_args = Array.prototype.slice.call(args);
					Array.prototype.push.apply(full_args, arguments);

					return fn.apply(self, full_args);
				};
			}
			else {
				return function () {
					return fn.apply(self, arguments);
				};
			}
		};

		var mouseenterleave_event_validate = function (parent) {
			try {
				for (; parent; parent = parent.parentNode) {
					if (parent === this) return false;
				}
				return true;
			}
			catch (e) {}
			return false;
		};
		Module.wrap_mouseenterleave_event = function (fn) {
			return function (event) {
				return mouseenterleave_event_validate.call(this, event.relatedTarget) ? fn.call(this, event) : undefined;
			};
		};

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
		};
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
		};

		Module.create_regex_safe = function (text, flags) {
			try {
				return new RegExp(text, flags);
			}
			catch (e) {
				return null;
			}
		};
		Module.regex_escape = function (text) {
			return text.replace(/[\$\(\)\*\+\-\.\/\?\[\\\]\^\{\|\}]/g, "\\$&");
		};
		Module.json_parse_safe = function (text, def) {
			try {
				return JSON.parse(text);
			}
			catch (e) {
				return def;
			}
		};
		Module.html_parse_safe = function (text, def) {
			try {
				return (new DOMParser()).parseFromString(text, "text/html");
			}
			catch (e) {
				return def;
			}
		};
		Module.get_domain = function (url) {
			var m = re_short_domain.exec(url);
			return (m === null) ? "" : m[1].toLowerCase();
		};
		Module.get_full_domain = function (url) {
			var m = re_full_domain.exec(url);
			return (m === null) ? "" : m[1].toLowerCase();
		};
		Module.change_url_domain = function (url, new_domain) {
			var m = re_change_domain.exec(url);
			return (m === null) ? url : m[1] + new_domain + m[3];
		};

		return Module;

	})();
	var Debug = (function () {

		var started = false,
			timer_names = null;

		var dummy_fn = function () {};
		var log = dummy_fn;
		var timer_log = function (label, timer) {
			var t = timing(),
				value;

			if (typeof(timer) === "string") timer = timer_names[timer];

			value = (timer === undefined) ? "???ms" : (t - timer).toFixed(3) + "ms";

			if (!started) return [ label, value ];
			log(label, value);
		};

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
				var args = [ "#TITLE# " + Main.version.join(".") + ":" ].concat(Array.prototype.slice.call(arguments));
				console.log.apply(console, args);
			};
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
			};
		};

		// Exports
		var Module = {
			enabled: false,
			log: log,
			timer: dummy_fn,
			timer_log: timer_log,
			init: init
		};

		return Module;

	})();
	var Post = (function () {

		// Private
		var file_ext = function (url) {
			var m = /\.[^\.]*$/.exec(url);
			return (m === null) ? "" : m[0].toLowerCase();
		};
		var file_name = function (url) {
			url = url.split("/");
			return url[url.length - 1];
		};

		var get_op_post_files_container_tinyboard = function (node) {
			while (true) {
				if ((node = node.previousSibling) === null) return null;
				if (node.classList && node.classList.contains("files")) return node;
			}
		};

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
			},
			"foolz": function (node) {
				while ((node = node.parentNode) !== null) {
					if (node.tagName === "ARTICLE") return node;
				}
				return null;
			},
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
			},
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
			},
			"ipb": function (node) {
				while ((node = node.parentNode) !== null) {
					if (node.classList.contains("borderwrap")) return node;
				}
				return null;
			},
			"ipb_lofi": function (node) {
				while ((node = node.parentNode) !== null) {
					if (node.classList.contains("postwrapper")) return node;
				}
				return null;
			}
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
			},
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
			},
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
			},
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
			},
			"ipb": function () {
				return [];
			},
			"ipb_lofi": function () {
				return [];
			}
		};
		var belongs_to_default = function (node, post) {
			return (Module.get_post_container(node) === post);
		};
		var belongs_to_re_non_digit = /\D+/g;
		var belongs_to = {
			"4chan": function (node, post) {
				var id1 = node.id.replace(belongs_to_re_non_digit, ""),
					id2 = post.id.replace(belongs_to_re_non_digit, "");

				return (id1 && id1 === id2);
			},
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
		};
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
			},
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
			},
			"tinyboard": create_image_meta_link_default,
			"ipb": create_image_meta_link_default,
			"ipb_lofi": create_image_meta_link_default
		};

		// Exports
		var Module = {
			get_post_container: function (node) {
				return post_parent_find[Config.mode].call(null, node);
			},
			get_text_body: function (node) {
				return $(post_body_selector[Config.mode], node);
			},
			is_post: function (node) {
				return $.test(node, post_selector[Config.mode]);
			},
			get_all_posts: function (parent) {
				return $$(post_selector[Config.mode], parent);
			},
			get_file_info: function (post) {
				return get_file_info[Config.mode].call(null, post);
			},
			get_body_links: function (post) {
				return $$(body_links_selector[Config.mode], post);
			},
			create_image_meta_link: function (file_info, node) {
				return create_image_meta_link[Config.mode].call(null, file_info, node);
			},
			get_op_post_files_container_tinyboard: get_op_post_files_container_tinyboard
		};

		return Module;

	})();
	var CreateURL = (function () {

		// Private
		var to_gallery = {
			ehentai: function (data, domain) {
				return "http://" + domain + "/g/" + data.gid + "/" + data.token + "/";
			},
			nhentai: function (data) {
				return "http://" + domains.nhentai + "/g/" + data.gid + "/";
			},
			hitomi: function (data) {
				return "https://" + domains.hitomi + "/galleries/" + data.gid + ".html";
			}
		};
		var to_uploader = {
			ehentai: function (data, domain) {
				return "http://" + domain + "/uploader/" + (data.uploader || "Unknown").replace(/\s+/g, "+");
			},
			nhentai: function () {
				return "http://" + domains.nhentai + "/";
			},
			hitomi: function () {
				return "https://" + domains.hitomi + "/";
			}
		};
		var to_category = {
			ehentai: function (data, domain) {
				return "http://" + domain + "/" + API.get_category(data.category).short_name;
			},
			nhentai: function (data) {
				return "http://" + domains.nhentai + "/category/" + data.category.toLowerCase() + "/";
			},
			hitomi: function (data) {
				return "https://" + domains.hitomi + "/type/" + data.category.toLowerCase() + "-all-1.html";
			}
		};
		var to_tag = {
			ehentai: function (tag, domain) {
				return "http://" + domain + "/tag/" + tag.replace(/\s+/g, "+");
			},
			nhentai: function (tag, domain) {
				return "http://" + domain + "/tag/" + tag.replace(/\s+/g, "-") + "/";
			},
			hitomi: function (tag, domain) {
				return "https://" + domain + "/tag/" + tag + "-all-1.html";
			}
		};
		var to_tag_ns = {
			ehentai: function (tag, namespace, domain) {
				return "http://" + domain + "/tag/" + namespace + ":" + tag.replace(/\s+/g, "+");
			},
			nhentai: function (tag, namespace, domain) {
				if (namespace === "tags") namespace = "tag";
				return "http://" + domain + "/" + namespace + "/" + tag.replace(/\s+/g, "-") + "/";
			},
			hitomi: function (tag, namespace, domain) {
				if (namespace === "male" || namespace === "female") {
					return "https://" + domain + "/tag/" + namespace + ":" + tag + "-all-1.html";
				}
				else if (namespace === "artist") {
					return "https://" + domain + "/artist/" + tag + "-all-1.html";
				}
				else if (namespace === "parody") {
					return "https://" + domain + "/series/" + tag + "-all-1.html";
				}
				else if (namespace === "language") {
					return "https://" + domain + "/index-" + tag + "-1.html";
				}
				else {
					return "https://" + domain + "/tag/" + tag + "-all-1.html";
				}
			}
		};

		// Exports
		return {
			to_gallery: function (data, domain) {
				return to_gallery[data.type].call(null, data, domain);
			},
			to_uploader: function (data, domain) {
				return to_uploader[data.type].call(null, data, domain);
			},
			to_category: function (data, domain) {
				return to_category[data.type].call(null, data, domain);
			},
			to_tag: function (tag, domain_type, domain) {
				return to_tag[domain_type].call(null, tag, domain);
			},
			to_tag_ns: function (tag, namespace, domain_type, domain) {
				return to_tag_ns[domain_type].call(null, tag, namespace, domain);
			}
		};

	})();
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
			};
		};

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
			};
		}
		else {
			// Fallback
			request = function (data) {
				Debug.log("HttpRequest.invalid:", data.method, data.url, { data: data });
				var onerror = (data && data.onerror && typeof(data.onerror) === "function") ? data.onerror : null;
				if (onerror !== null) {
					setTimeout(function () {
						onerror.call(null, {});
					}, 1);
				}
			};
		}

		// Done
		return request;

	})();
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
				var self = this,
					info = API.get_url_info_saved(this.href);

				if (info === null) return;

				gallery_link_events_data.link = this;
				gallery_link_events_data.mouse_x = event.clientX;
				gallery_link_events_data.mouse_y = event.clientY;

				API.get_data_from_url_info(info, function (err, data) {
					if (err === null && gallery_link_events_data.link === self) {
						var details = details_nodes[info.id];
						if (details !== undefined) {
							details_hover_start(data, info, self, details);
						}
						else if (self.getAttribute("data-xl-details-creating") !== "true") {
							self.setAttribute("data-xl-details-creating", "true");
							create_details(data, info, function (err, details) {
								self.removeAttribute("data-xl-details-creating");
								if (err === null) {
									details_nodes[info.id] = details;
									if (gallery_link_events_data.link === self) {
										details_hover_start(data, info, self, details);
									}
								}
							});
						}
					}
				});

			}),
			mouseout: $.wrap_mouseenterleave_event(function () {
				var details = details_nodes[get_node_id_full(this)];

				if (details === undefined) return;

				details.classList.add("xl-details-hidden");

				gallery_link_events_data.link = null;
			}),
			mousemove: function (event) {
				var details = details_nodes[get_node_id_full(this)];

				if (details === undefined) return;

				gallery_link_events_data.mouse_x = event.clientX;
				gallery_link_events_data.mouse_y = event.clientY;

				update_details_position(details, this, event.clientX, event.clientY);
			}
		};
		var gallery_toggle_actions = function (event) {
			if ($.is_left_mouse(event) && config.actions.enabled) {
				event.preventDefault();

				var index = this.getAttribute("xl-actions-index"),
					actions, tag_bg, info, link, n;

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

						// Position
						update_actions_position(actions, this, tag_bg, d.documentElement.getBoundingClientRect());
					}
					else {
						// Create
						if (
							(link = get_link_from_tag_button(this)) !== null &&
							(info = API.get_url_info_saved(link.href)) !== null
						) {
							n = this;
							API.get_data_from_url_info(info, function (err, data) {
								if (err === null) {
									create_actions(data, info, index, function (err, actions) {
										if (err === null) {
											actions_nodes[index] = actions;
											activate_actions(actions, index);
											update_actions_position(actions, n, tag_bg, d.documentElement.getBoundingClientRect());
										}
									});
								}
							});
						}
					}
				}
				else {
					// Hide
					actions = actions_nodes[index];
					if (actions !== undefined) {
						close_actions(actions, index);
					}
				}
			}
		};
		var gallery_fetch_event = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();

				var link, info;

				Linkifier.change_link_events(this, null);

				if (
					(link = get_link_from_tag_button(this)) !== null &&
					(info = API.get_url_info_saved(link.href)) !== null
				) {
					Linkifier.load_link(link, info);
				}
			}
		};
		var gallery_error_event = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();
				return false;
			}
		};

		var details_hover_start = function (data, info, node, details) {
			if (Debug.enabled) {
				var i = 1,
					n = details;
				while (n.parentNode !== document) {
					if (!n.parentNode) {
						Debug.log(
							"Invalid details: parent[" + i + "] failed;",
							{
								link: node,
								node: n,
								parent: n.parentNode,
								details: details,
								data: data,
								info: info
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

			update_details_position(details, node, gallery_link_events_data.mouse_x, gallery_link_events_data.mouse_y);

			if (data.subtype === "gallery" && info.page !== undefined && info.page > 1) {
				update_details_page_thumbnail(info.page, data, info, details, node);
			}
		};

		var set_node_id = function (node, info) {
			node.setAttribute("data-xl-id", info.id);
		};
		var get_node_id_full = function (node) {
			return node.getAttribute("data-xl-id") || "";
		};

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
		};
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
		};

		var pad = function (n, sep) {
			return (n < 10 ? "0" : "") + n + sep;
		};

		var custom_details_functions = {}; // function (data, info, callback(err, copy_from_node))
		var custom_actions_functions = {}; // function (data, info, callback(err, gen_info))
		var register_details_creation = function (custom_id, callback) {
			custom_details_functions[custom_id] = callback;
		};
		var register_actions_creation = function (custom_id, callback) {
			custom_actions_functions[custom_id] = callback;
		};

		var create_details = function (data, info, callback) {
			var category = API.get_category(data.category),
				theme = Theme.classes,
				file_size = (data.total_size / 1024 / 1024).toFixed(2),
				content, n1, n2, n3, fn;

			// Fonts
			Main.insert_custom_fonts();

			// Custom
			if (data.subtype !== "gallery") {
				fn = custom_details_functions[info._custom_id];
				if (fn !== undefined) {
					// Add to container
					fn(data, info, function (err, content) {
						if (err === null) {
							content.className = (content.className + " xl-details xl-details-hidden xl-hover-shadow" + theme).trim();
							Theme.bg(content);
							Theme.apply(content);
							Popup.hovering(content);
							callback(null, content);
						}
						else {
							callback(err, null);
						}
					});
				}
				else {
					callback("Could not create details", null);
				}
				return;
			}

			// Body
			content = $.node("div", "xl-details xl-details-hidden xl-hover-shadow" + theme);
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
			}, n1));


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
			$.add(n1, n2 = $.link(CreateURL.to_gallery(data, info.domain), "xl-details-title" + theme, data.title));
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
			$.add(n1, $.node("strong", "xl-details-upload-date", format_date(data.date_created)));

			// Tags
			$.add(content, n1 = $.node("div", "xl-details-tag-block" + theme));
			$.add(n1, $.node("strong", "xl-details-tag-block-label", "Tags:"));
			$.add(n1, n2 = $.node("span", "xl-details-tags"));
			$.add(n2, create_tags(data, info.domain));

			// End
			$.add(content, $.node("div", "xl-details-clear"));

			// Full info
			if (data.type === "ehentai" && config.sites.ehentai_ext && !data.full) {
				API.get_ehentai_gallery_full(info, data, function (err, data) {
					if (err === null) {
						update_full(data, info);
					}
					else {
						Debug.log("Error requesting full information: " + err);
					}
				});
			}

			// Add to container
			Popup.hovering(content);

			// Done
			callback(null, content);
		};
		var create_actions = function (data, info, index, callback) {
			var theme = Theme.classes,
				gid = data.gid,
				token = data.token,
				type = data.type,
				actions = $.node("div", "xl-actions xl-hover-shadow" + theme),
				domain = info.domain,
				created = false,
				n1, n2, n3, fn;

			$.on(actions, "click", on_actions_click);
			Theme.bg(actions);

			$.add(actions, n1 = $.node("div", "xl-actions-inner" + theme));
			$.add(n1, n2 = $.node("div", "xl-actions-table" + theme));

			var gen_entry = function (container, label, url, text) {
				var n1, n2, n3;
				$.add(container, n1 = $.node("div", "xl-actions-table-row" + theme));
				$.add(n1, n2 = $.node("div", "xl-actions-table-cell" + theme));
				if (label !== null) {
					$.add(n2, $.node("div", "xl-actions-table-header", label));
				}
				if (text !== null) {
					$.add(n1, n2 = $.node("div", "xl-actions-table-cell" + theme));
					$.add(n2, n3 = $.link(url, "xl-actions-option" + theme, text));
					$.on(n3, "click", $.bind(on_actions_link_click, n3, actions, index));
				}
				else {
					n2.classList.add("xl-actions-table-cell-full");
				}
				return n3;
			};
			var gen_sep = function (container) {
				var n1, n2;
				$.add(container, n1 = $.node("div", "xl-actions-table-row" + theme));
				$.add(n1, n2 = $.node("div", "xl-actions-table-cell" + theme));
				$.add(n2, $.node("div", "xl-actions-table-sep"));
			};

			if (data.subtype === "gallery") {
				if (type === "ehentai") {
					gen_entry(n2, "View on:", CreateURL.to_gallery(data, domains.gehentai), "E-Hentai");
					gen_entry(n2, null, CreateURL.to_gallery(data, domains.exhentai), "ExHentai");

					gen_sep(n2);

					n3 = gen_entry(n2, "Uploader:", CreateURL.to_uploader(data, domain), data.uploader);
					n3.classList.add("xl-actions-uploader");
					Filter.highlight("uploader", n3, data, Filter.None);

					gen_sep(n2);

					gen_entry(n2, "Download:", "http://" + domain + "/gallerytorrents.php?gid=" + gid + "&t=" + token, "Torrent (" + data.torrent_count + ")");
					gen_entry(n2, null, "http://" + domains.gehentai + "/archiver.php?gid=" + gid + "&token=" + token + "&or=" + data.archiver_key, "Archiver");
					n3 = gen_entry(n2, null, "http://" + domain + "/hathdler.php?gid=" + gid + "&t=" + token, "via H@H");
					n3.removeAttribute("target");

					gen_sep(n2);

					gen_entry(n2, "Other:", "http://" + domain + "/gallerypopups.php?gid=" + gid + "&t=" + token + "&act=addfav", "Favorite");
					gen_entry(n2, null, "http://" + domains.gehentai + "/stats.php?gid=" + gid + "&t=" + token, "Stats");

					created = true;
				}
				else if (type === "nhentai") {
					gen_entry(n2, "View on:", CreateURL.to_gallery(data, domain), "nhentai.net");

					created = true;
				}
				else if (type === "hitomi") {
					gen_entry(n2, "View on:", CreateURL.to_gallery(data, domain), "hitomi.la");

					created = true;
				}
			}

			// Empty
			if (!created) {
				fn = custom_actions_functions[info._custom_id];
				if (fn !== null) {
					fn(data, info, function (err, gen_info) {
						if (err === null) {
							var ii = gen_info.length,
								i, g;

							if (ii === 0) {
								gen_entry(n2, "No actions available", null, null);
							}
							else {
								for (i = 0; i < ii; ++i) {
									g = gen_info[i];
									if (g === null) {
										gen_sep(n2);
									}
									else {
										gen_entry(n2, g[0] || null, g[1] || null, g[2] || null);
									}
								}
							}

							Popup.hovering(actions);
							callback(null, actions);
						}
						else {
							callback(err, null);
						}
					});
					return;
				}

				gen_entry(n2, "No actions available", null, null);
			}

			// Prepare
			Popup.hovering(actions);

			// Done
			callback(null, actions);
		};
		var create_tags = function (data, domain) {
			var tagfrag = d.createDocumentFragment(),
				site = data.type,
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
					link = $.link(CreateURL.to_tag(tags[i], site, domain), "xl-tag", tags[i]);

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
						link = $.link(CreateURL.to_tag_ns(tags[i], namespace, site, domain), "xl-tag", tags[i]);

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
		};
		var update_details_page_thumbnail = function (page, data, info, details, node) {
			var thumb_state = 0;

			var thumb_cb = function (err, thumb_data) {
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
					});
				}
			};

			details.classList.add("xl-details-has-thumbnail");
			if (info.site === "ehentai") {
				API.get_ehentai_gallery_page_thumb(info.domain, data.gid, data.token, info.page_token, page, thumb_cb);
			}
			else if (info.site === "nhentai") {
				API.get_nhentai_gallery_page_thumb(data.gid, page, thumb_cb);
			}
			else if (info.site === "hitomi") {
				API.get_hitomi_gallery_page_thumb(data.gid, page, thumb_cb);
			}
			else {
				thumb_cb("Invalid", null);
			}
			if (thumb_state === 0) ++thumb_state;
		};
		var update_full = function (data, info) {
			var domain = domains.exhentai,
				full_id = info.id,
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
				domain = $.get_full_domain(n.href);
			}

			// Update tags
			if (
				data.tags_ns !== null &&
				(n = $(".xl-details-tags", details)) !== null
			) {
				tagfrag = create_tags(data, domain);
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
		};
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
		};
		var close_actions = function (actions, index) {
			var ns = $$(".xl-site-tag.xl-site-tag-active[xl-actions-index='" + index + "']"),
				i, ii;

			for (i = 0, ii = ns.length; i < ii; ++i) {
				ns[i].classList.remove("xl-site-tag-active");
			}

			actions.classList.add("xl-actions-hidden");
			deactivate_actions(index);
		};
		var close_all_actions = function () {
			for (var index in actions_nodes_active) {
				close_actions(actions_nodes_active[index], index);
			}
		};
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
		};
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
		};

		var activate_actions = function (node, index) {
			if (config.actions.close_on_click && actions_nodes_active_count !== 0) {
				close_all_actions();
			}

			actions_nodes_active[index] = node;

			if (actions_close_timeout !== null) clearTimeout(actions_close_timeout);
			actions_close_timeout = setTimeout(function () { actions_close_timeout = null; }, 1);

			if (++actions_nodes_active_count === 1) {
				$.on(window, "resize", on_window_resize);
				$.on(d.documentElement, "click", on_document_click);
			}
		};
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
		};
		var on_window_resize = function () {
			update_active_actions_position();
		};
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
		};
		var on_actions_click = function (event) {
			if ($.is_left_mouse(event)) {
				event.stopPropagation();
			}
		};
		var on_actions_link_click = function (actions, index, event) {
			if ($.is_left_mouse(event)) {
				event.stopPropagation();

				if (config.actions.close_on_click) {
					close_actions(actions, index);
				}
			}
		};
		var create_tag_bg = function (parent) {
			var tag_bg = $.node("div", "xl-site-tag-bg" + Theme.classes),
				outline = $.node("div", "xl-site-tag-bg-shadow xl-hover-shadow" + Theme.classes),
				inner = $.node("div", "xl-site-tag-bg-inner" + Theme.classes);

			Theme.bg(inner);

			$.add(tag_bg, inner);

			$.before(parent, parent.firstChild, tag_bg);
			$.before(parent, parent.firstChild, outline);

			return tag_bg;
		};

		var mark_button_text = function (button, text) {
			if ((button = button_get_inner(button)) !== null) {
				button.textContent = button.textContent.replace(/\]\s*$/, text + "]");
			}
		};
		var update_button_text = function (button, info) {
			if ((button = button_get_inner(button)) !== null) {
				button.textContent = button_text(info);
			}
		};

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
		};
		var button_get_inner = function (button) {
			return ((button = button.lastChild) !== null && button.tagName === "SPAN") ? button : null;
		};
		var button_text = function (info) {
			return "[" + (info.tag || "?") + "]";
		};
		var format_date = function (timestamp) {
			var d = new Date(timestamp);
			return d.getUTCFullYear() + "-" +
				pad(d.getUTCMonth() + 1, "-") +
				pad(d.getUTCDate(), " ") +
				pad(d.getUTCHours(), ":") +
				pad(d.getUTCMinutes(), "");
		};

		var setup_link = function (link, url, info) {
			var button = $.link(url, "xl-site-tag" + Theme.classes),
				text = $.node("span", "xl-site-tag-text", button_text(info));

			set_node_id(link, info);

			$.add(button, text);

			Linkifier.change_link_events(link, "gallery_link");
			Linkifier.change_link_events(button, "gallery_fetch");

			$.before(link.parentNode, link, button);
		};
		var format_link = function (link, data, info) {
			var button = get_tag_button_from_link(link),
				fjord, ex, hl, c, n;

			// Smart links
			if (config.general.rewrite_links === "smart" && data.type === "ehentai") {
				ex = ($.get_domain(link.href) === domains.exhentai);
				fjord = API.is_fjording(data);
				if (fjord !== ex) {
					info.domain = fjord ? domains.exhentai : domains.gehentai;
					info.tag = API.get_tag_from_domain(info.domain);
					link.href = $.change_url_domain(link.href, info.domain);
					if (button !== null) {
						button.href = link.href;
						update_button_text(button, info);
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
		};
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
		};

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
		};
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
		};

		var init = function () {
			Linkifier.register_link_events({
				gallery_link: gallery_link_events,
				gallery_toggle_actions: gallery_toggle_actions,
				gallery_fetch: gallery_fetch_event,
				gallery_error: gallery_error_event
			});
		};

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
			register_details_creation: register_details_creation,
			register_actions_creation: register_actions_creation,
			init: init
		};

	})();
	var API = (function () {

		// Caching
		var cache_prefix = "#PREFIX#cache-",
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
		};
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
		};
		var cache_set_object = function (object_name) {
			cache_storage.setItem(cache_prefix + object_name, JSON.stringify({
				expires: null,
				data: cache_objects[object_name]
			}));
		};
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
		};
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
		};
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
		};
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
		};
		var cache_init = function () {
			// Cache mode
			if (config.debug.cache_mode === "none") {
				cache_storage = create_temp_storage();
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
		};
		var cache_get_prefix = function () {
			return cache_prefix;
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



		// Databasing
		var saved_data = {};
		var saved_thumbnails = {};

		var get_saved_data = function (id) {
			var data = saved_data[id];

			if (data !== undefined) return data;

			data = cache_get("data-" + id);
			if (data !== null) {
				saved_data[id] = data;
				return data;
			}

			return null;
		};
		var set_saved_data = function (id, data) {
			saved_data[id] = data;
			cache_set("data-" + id, data, ttl_1_hour * (data.date_created >= Date.now() - ttl_1_day ? 1 : 12));
		};
		var set_saved_error = function (id_list, error, cache) {
			var id = id_list.join("-");
			cache_objects.errors[id] = {
				expires: (cache ? Date.now() + ttl_1_hour * 12 : 0),
				data: error
			};

			if (cache) {
				cache_set_object("errors");
			}
		};
		var get_saved_error = function (id_list) {
			var id = id_list.join("-"),
				value = cache_objects.errors[id];

			return (value !== undefined) ? value.data : null;
		};
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
		};
		var set_saved_thumbnail = function (namespace, gid, page, data) {
			var id_full = namespace + "-" + gid + "-" + page;
			saved_thumbnails[id_full] = data;
			cache_set("thumb-" + id_full, data, ttl_1_hour * 6);
		};

		var hash_get_sha1_from_md5 = function (md5) {
			var value = cache_objects.md5_to_hash[md5];
			return (value !== undefined) ? value.data : null;
		};
		var hash_get_sha1_from_url = function (url) {
			var value = cache_objects.url_to_hash[url];
			return (value !== undefined) ? value.data : null;
		};
		var hash_set_md5_to_sha1 = function (md5, sha1) {
			cache_objects.md5_to_hash[md5] = {
				expires: Date.now() + ttl_1_year,
				data: sha1
			};

			cache_set_object("md5_to_hash");
		};
		var hash_set_url_to_sha1 = function (url, sha1) {
			cache_objects.url_to_hash[url] = {
				expires: Date.now() + ttl_1_day,
				data: sha1
			};

			cache_set_object("url_to_hash");
		};

		var lookup_get_results = function (hash) {
			var value = cache_objects.lookup[hash];
			return (value !== undefined) ? value.data : null;
		};
		var lookup_set_results = function (data) {
			cache_objects.lookup[data.hash] = {
				expires: Date.now() + ttl_1_day,
				data: data
			};

			cache_set_object("lookup");
		};



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
		};

		var get_category = function (name) {
			var c = categories[name];
			return (c !== undefined) ? c : categories.misc;
		};
		var get_category_sort_rank = function (name) {
			var c = categories[name];
			return (c !== undefined) ? c.sort : Object.keys(categories).length;
		};



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
				rating: -1,
				torrent_count: -1,

				full: false,
				visible: null,
				removed: null,
				archiver_key: null,

				tags: null,
				tags_ns: null
			};
		};
		var uint8_array_to_url = function (data, mime) {
			try {
				var blob = new Blob([ data ], { type: mime });
				return window.URL.createObjectURL(blob) || null;
			}
			catch (e) {}
			return null;
		};
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
		};

		var ehentai_simple_string = function (value, default_value) {
			return (typeof(value) !== "string" || value.length === 0) ? default_value : value;
		};
		var ehentai_normalize_string = function (value, default_value) {
			if (typeof(value) !== "string" || value.length === 0) {
				return default_value;
			}
			temp_div.innerHTML = value;
			value = temp_div.textContent;
			temp_div.textContent = "";
			return value;
		};
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
			data.date_created = (parseInt(info.posted, 10) || 0) * 1000;
			data.file_count = parseInt(info.filecount, 10) || 0;
			data.total_size = parseInt(info.filesize, 10) || 0;
			data.rating = parseFloat(info.rating) || 0.0;
			data.torrent_count = parseInt(info.torrentcount, 10) || 0;
			data.visible = !info.expunged;
			t = info.tags;
			data.tags = Array.isArray(t) ? t : [];

			return data;
		};

		var ehentai_is_not_available = function (html) {
			var n;
			return (
				(n = $("title", html)) !== null &&
				/^\s*Gallery\s+Not\s+Available/i.test(n.textContent) &&
				$("#continue", html) !== null
			);
		};
		var ehentai_is_content_warning = function (html) {
			var n;
			return (
				(n = $("h1", html)) !== null &&
				/^\s*Content\s+Warning/i.test(n.textContent)
			);
		};
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
		};
		var ehentai_make_removed = function (data) {
			data.removed = true;
			data.full = true;
			return data;
		};

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

				if (err !== null) return { error: err, error_mode: RequestErrorMode.None };

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
		};
		var ehentai_create_lookup_url = function (sha1) {
			var url = "http://";
			url += config.sauce.lookup_domain;
			url += "/?f_doujinshi=1&f_manga=1&f_artistcg=1&f_gamecg=1&f_western=1&f_non-h=1&f_imageset=1&f_cosplay=1&f_asianporn=1&f_misc=1&f_search=Search+Keywords&f_apply=Apply+Filter&f_shash=";
			url += sha1;
			url += "&fs_similar=0";
			if (config.sauce.expunged) url += "&fs_exp=1";
			return url;
		};

		var nhentai_normalize_tag_namespace = function (namespace) {
			return nhentai_tag_namespaces[namespace] || namespace;
		};
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
					data.date_created = new Date(
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
		};

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
					data.date_created = new Date(
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
		};


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
				},
				onerror: function () {
					callback.call(null, "Connection error", null, 0, null, null);
				},
				onabort: function () {
					callback.call(null, "Connection aborted", null, 0, null, null);
				}
			};

			if (progress_callback !== undefined) {
				xhr_data.onprogress = function (xhr) {
					progress_callback.call(null, "progress", xhr.lengthComputable, xhr.loaded, xhr.total);
				};
			}

			HttpRequest(xhr_data);
		};
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
				});
			}

			return null;
		};



		// API request base code
		var request_groups = {};
		var RequestGroup = function () {
			this.active = 0;
			this.timeout = null;
			this.types = [];
		};
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

			this.request_init = null;
			this.request_complete = null;

			this.get_data = null;
			this.set_data = null;
			this.setup_xhr = null;
			this.parse_response = null;
		};
		var RequestData = function (id, info, callback, progress_callback) {
			this.id = id;
			this.info = info;
			this.callbacks = [ callback ];
			this.progress_callbacks = [];
			if (progress_callback !== undefined) this.progress_callbacks.push(progress_callback);
		};
		var Request = function (type, entries) {
			var cbs, i, ii;

			this.data = null;
			this.type = type;
			this.retry_count = 0;
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
		};
		var RequestErrorMode = {
			None: 0,
			NoCache: 1,
			Save: 2
		};

		RequestGroup.prototype.run_delay = function (type) {
			setTimeout(function () {
				type.run();
			}, 1);
		};
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
		};
		RequestGroup.prototype.complete = function (delay) {
			if (delay > 0) {
				var self = this;
				setTimeout(function () {
					--self.active;
					self.run(false);
				}, delay);
			}
			else {
				--this.active;
				this.run(false);
			}
		};

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
			};

			if (this.get_data === null) {
				get_data_callback(null, null);
			}
			else {
				this.get_data.call(null, info, get_data_callback);
			}
		};
		RequestType.prototype.run = function () {
			var req = new Request(this, this.queue.splice(0, this.count));
			if (this.request_init !== null) {
				this.request_init.call(this, req);
			}
			req.run();
		};

		Request.prototype.run = function () {
			var i, ii, ev;

			if (this.progress_callbacks !== null) {
				ev = (this.retry_count === 0) ? "start" : "retry";
				for (i = 0, ii = this.progress_callbacks.length; i < ii; ++i) {
					this.progress_callbacks[i].call(this, ev);
				}
			}

			this.type.setup_xhr.call(this, $.bind(this.on_xhr_setup, this));
		};
		Request.prototype.process_response = function (err, response, delay) {
			var self = this,
				total = this.infos.length,
				responses = Math.min(response.length, total),
				set_data = this.type.set_data,
				complete = 0,
				data = null,
				entry, err_mode, i;

			// Save
			var save_callback = function () {
				for (var i = 0, ii = entry.callbacks.length; i < ii; ++i) {
					entry.callbacks[i].call(self, err, data);
				}

				if (++complete >= total) self.complete(delay);
			};

			// Save errors
			for (i = responses; i < total; ++i) {
				entry = this.entries[i];
				set_saved_error([ this.type.namespace, this.type.type, entry.id ], err, false);
				save_callback();
			}

			// Save datas
			for (i = 0; i < responses; ++i) {
				data = response[i];
				entry = this.entries[i];
				if (typeof((err = data.error)) === "string") {
					if (typeof((err_mode = data.error_mode)) !== "number") err_mode = RequestErrorMode.Save;
					set_saved_error([ this.type.namespace, this.type.type, entry.id ], err, (err_mode === RequestErrorMode.Save));
					save_callback();
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
		};
		Request.prototype.complete_entries = function () {
			var unique = this.type.unique;
			for (var i = 0, ii = this.entries.length; i < ii; ++i) {
				delete unique[this.entries[i].id];
			}
		};
		Request.prototype.complete = function (delay) {
			if (this.type.request_complete !== null) {
				this.type.request_complete.call(this.type, this);
			}
			this.type.group.complete(delay);
		};
		Request.prototype.xhr_error = function (err) {
			var self = this;
			return function () {
				self.complete_entries();
				self.process_response(err, [], self.type.delay_error);
			};
		};
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
					});
				}
				else {
					self.xhr_error("Response error " + xhr.status)();
				}
			};

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
				};

				if (xhr_data.data !== undefined) {
					ev = "upload";
					xhr_data.upload.onprogress = xhr_data.onprogress;
					xhr_data.upload.onload = function () {
						for (var i = 0, ii = self.progress_callbacks.length; i < ii; ++i) {
							self.progress_callbacks[i].call(self, "download");
						}
					};
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
		};
		Request.prototype.on_response_parse = function (err, response, delay) {
			if (err !== null) {
				// Error
				if (typeof(delay) !== "number") delay = this.type.delay_error;
				this.complete_entries();
				this.process_response(err, [], delay);
			}
			else if (response === null) {
				// Retry
				++this.retry_count;
				if (typeof(delay) !== "number") delay = 0;
				if (delay > 0) {
					var self = this;
					setTimeout(function () { self.run(); }, delay);
				}
				else {
					this.run();
				}
			}
			else {
				// Process
				if (typeof(delay) !== "number") delay = this.type.delay_okay;
				this.complete_entries();
				this.process_response("Data not found", response, delay);
			}
		};



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
			var data = get_saved_data(info.id);
			callback(null, (data !== null && data.token === info.token) ? data : null);
		};
		rt_ehentai_gallery.set_data = function (data, info, callback) {
			set_saved_data(info.id, data);
			callback(null);
		};
		rt_ehentai_gallery.setup_xhr = function (callback) {
			var gidlist = [],
				info, i, ii;

			for (i = 0, ii = this.infos.length; i < ii; ++i) {
				info = this.infos[i];
				gidlist.push([ info.gid, info.token ]);
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
		};
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
		};

		rt_ehentai_gallery_page.get_data = function (info, callback) {
			var data = get_saved_data(info.id);
			if (data !== null) {
				callback(null, {
					gid: data.gid,
					token: data.token
				});
			}
			else {
				callback(null, null);
			}
		};
		rt_ehentai_gallery_page.setup_xhr = function (callback) {
			var pagelist = [],
				info, i, ii;

			for (i = 0, ii = this.infos.length; i < ii; ++i) {
				info = this.infos[i];
				pagelist.push([ info.gid, info.page_token, info.page ]);
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
		};
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
		};

		rt_ehentai_gallery_full.get_data = function (info, callback) {
			callback(null, info.data.full ? info.data : null);
		};
		rt_ehentai_gallery_full.set_data = function (data, info, callback) {
			set_saved_data(info.info.id, data);
			callback(null);
		};
		rt_ehentai_gallery_full.setup_xhr = function (callback) {
			var info = this.infos[0];
			callback(null, {
				method: "GET",
				url: "http://" + info.domain + "/g/" + info.gid + "/" + info.token + "/" + info.search,
			});
		};
		rt_ehentai_gallery_full.parse_response = function (xhr, callback) {
			var info = this.infos[0];
			ehentai_response_process_generic.call(this, xhr, info, this.type.delay_okay, callback, function (err, html) {
				callback(null, [ err === null ? ehentai_parse_gallery_info(html, info.data) : ehentai_make_removed(info.data) ]);
			});
		};
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
		};

		rt_ehentai_gallery_page_thumb.get_data = function (info, callback) {
			callback(null, get_saved_thumbnail("ehentai", info.gid, info.page));
		};
		rt_ehentai_gallery_page_thumb.set_data = function (data, info, callback) {
			set_saved_thumbnail("ehentai", info.gid, info.page, data);
			callback(null);
		};
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
			});
		};

		rt_ehentai_lookup.get_data = function (info, callback) {
			callback(null, info.sha1 === null ? null : lookup_get_results(info.sha1));
		};
		rt_ehentai_lookup.set_data = function (data, info, callback) {
			lookup_set_results(data);
			callback(null);
		};
		rt_ehentai_lookup.setup_xhr = function (callback) {
			var info = this.infos[0];
			if (info.similar) {
				var blob = info.blob,
					form_data = new FormData(),
					ext = (blob.type || "").split("/"),
					domain = (config.sauce.lookup_domain === domains.exhentai ? domains.exhentai : domains.ehentai);

				info.blob = null;

				ext = "." + ext[ext.length - 1];

				form_data.append("sfile", blob, "image" + ext);
				form_data.append("fs_similar", "on");
				if (config.sauce.expunged) {
					form_data.append("fs_exp", "on");
				}

				callback(null, {
					method: "POST",
					url: "http://ul." + domain + "/image_lookup.php",
					data: form_data
				});
			}
			else {
				callback(null, {
					method: "GET",
					url: ehentai_create_lookup_url(info.sha1)
				});
			}
		};
		rt_ehentai_lookup.parse_response = function (xhr, callback) {
			var info = this.infos[0];
			callback(null, [ ehentai_parse_lookup_results(xhr, info.similar, info.sha1, info.url, info.md5) ], info.similar ? this.type.delay_okay : 0);
		};

		rt_nhentai_gallery.get_data = function (info, callback) {
			callback(null, get_saved_data(info.id));
		};
		rt_nhentai_gallery.set_data = function (data, info, callback) {
			set_saved_data(info.id, data);
			callback(null);
		};
		rt_nhentai_gallery.setup_xhr = function (callback) {
			callback(null, {
				method: "GET",
				url: "http://" + domains.nhentai + "/g/" + this.infos[0].gid + "/",
			});
		};
		rt_nhentai_gallery.parse_response = function (xhr, callback) {
			var html = $.html_parse_safe(xhr.responseText, null);
			if (html === null) {
				callback("Invalid response");
			}
			else {
				callback(null, [ nhentai_parse_info(html, xhr.finalUrl) ]);
			}
		};

		rt_nhentai_gallery_page_thumb.get_data = function (info, callback) {
			callback(null, get_saved_thumbnail("nhentai", info.gid, info.page));
		};
		rt_nhentai_gallery_page_thumb.set_data = function (data, info, callback) {
			set_saved_thumbnail("nhentai", info.gid, info.page, data);
			callback(null);
		};
		rt_nhentai_gallery_page_thumb.setup_xhr = function (callback) {
			var info = this.infos[0];
			callback(null, {
				method: "GET",
				url: "http://" + domains.nhentai + "/g/" + info.gid + "/" + info.page + "/"
			});
		};
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
		};

		rt_hitomi_gallery.get_data = function (info, callback) {
			callback(null, get_saved_data(info.id));
		};
		rt_hitomi_gallery.set_data = function (data, info, callback) {
			set_saved_data(info.id, data);
			callback(null);
		};
		rt_hitomi_gallery.setup_xhr = function (callback) {
			callback(null, {
				method: "GET",
				url: "https://" + domains.hitomi + "/galleries/" + this.infos[0].gid + ".html",
			});
		};
		rt_hitomi_gallery.parse_response = function (xhr, callback) {
			var html = $.html_parse_safe(xhr.responseText, null);
			if (html === null) {
				callback("Invalid response");
			}
			else {
				callback(null, [ hitomi_parse_info(html, xhr.finalUrl) ]);
			}
		};

		rt_hitomi_gallery_page_thumb.get_data = function (info, callback) {
			callback(null, get_saved_thumbnail("hitomi", info.gid, info.page));
		};
		rt_hitomi_gallery_page_thumb.set_data = function (data, info, callback) {
			set_saved_thumbnail("hitomi", info.gid, info.page, data);
			callback(null);
		};
		rt_hitomi_gallery_page_thumb.setup_xhr = function (callback) {
			callback(null, {
				method: "GET",
				url: "https://" + domains.hitomi + "/reader/" + this.infos[0].gid + ".html"
			});
		};
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
		};



		// Fjord test
		var re_fjord = /abortion|bestiality|incest|lolicon|shotacon|toddlercon/;
		var is_fjording = function (data) {
			return re_fjord.test(data.tags.join(","));
		};



		// Public
		var re_remove_protocol = /^https?:\/*/i,
			re_url_info = /^([\w\-]+(?:\.[\w\-]+)*)((?:[\/\?\#][\w\W]*)?)/,
			url_info_saved = {},
			url_info_registrations = [],
			url_info_to_data_registrations = [];

		var get_url_info = function (url, callback) {
			var save_key = url.replace(re_remove_protocol, ""),
				match, data, domain, remaining, is_ex, m;

			if ((data = url_info_saved[save_key]) !== undefined) {
				callback(null, data);
				return;
			}

			match = re_url_info.exec(save_key);

			if (match === null) {
				callback(null, null);
				return;
			}

			data = null;
			domain = (match[1]).toLowerCase();
			remaining = match[2];

			if ((is_ex = (domain === domains.exhentai)) || domain === domains.gehentai) {
				m = /^\/g\/(\d+)\/([0-9a-f]+)/.exec(remaining);
				if (m !== null) {
					data = {
						id: "ehentai_" + m[1],
						site: "ehentai",
						type: "gallery",
						gid: parseInt(m[1], 10),
						token: m[2],
						domain: domain,
						tag: get_tag_from_domain(domain)
					};
				}
				else {
					m = /^\/s\/([0-9a-f]+)\/(\d+)\-(\d+)/.exec(remaining);
					if (m !== null) {
						data = {
							id: "ehentai_" + m[2],
							site: "ehentai",
							type: "page",
							gid: parseInt(m[2], 10),
							page: parseInt(m[3], 10),
							page_token: m[1],
							domain: domain,
							tag: get_tag_from_domain(domain)
						};
					}
				}
			}
			else if (domain === domains.nhentai) {
				m = /^\/g\/(\d+)(?:\/(\d+))?/.exec(remaining);
				if (m !== null) {
					data = {
						id: "nhentai_" + m[1],
						site: "nhentai",
						type: "gallery",
						gid: parseInt(m[1], 10),
						domain: domain,
						tag: get_tag_from_domain(domain)
					};
					if (m[2] !== undefined) data.page = parseInt(m[2], 10);
				}
			}
			else if (domain === domains.hitomi) {
				m = /^\/(galleries|reader|smalltn)\/(\d+)(?:\.html#(\d+))?/.exec(remaining);
				if (m !== null) {
					data = {
						id: "nhentai_" + m[2],
						site: "hitomi",
						type: "gallery",
						gid: parseInt(m[2], 10),
						domain: domain,
						tag: get_tag_from_domain(domain)
					};
					if (m[1] === "reader" && m[3] !== undefined) data.page = parseInt(m[3], 10);
				}
			}

			if (data !== null) {
				url_info_saved[save_key] = data;
			}
			else if (url_info_registrations.length > 0) {
				get_url_info_custom(0, url, save_key, callback);
				return;
			}

			callback(null, data);
		};
		var get_url_info_saved = function (url) {
			url = url.replace(re_remove_protocol, "");
			var data = url_info_saved[url];
			return (data !== undefined) ? data : null;
		};
		var get_url_info_custom = function (i, url, save_key, callback) {
			// This should avoid stack overflowing when using a callback chain with many synchronous functions
			var ii = url_info_registrations.length,
				immediate;

			var fn_cb = function (err, data) {
				if (err === null && data !== null) {
					var v = url_info_saved[save_key];
					if (v === undefined) {
						data._custom_id = i;
						url_info_saved[save_key] = data;
					}
					else {
						data = v;
					}
					callback(null, data);
				}
				else if (immediate) {
					immediate = false;
				}
				else {
					get_url_info_custom(i + 1, url, save_key, callback);
				}
			};

			for (; i < ii; ++i) {
				immediate = true;

				url_info_registrations[i](url, fn_cb);

				if (immediate) {
					immediate = false;
					return;
				}
			}

			callback(null, null);
		};
		var register_url_info_function = function (check_fn, get_data_fn) {
			url_info_registrations.push(check_fn);
			url_info_to_data_registrations.push(get_data_fn);
			return url_info_registrations.length - 1;
		};

		var domain_tags = {
			"exhentai.org": "Ex",
			"g.e-hentai.org": "EH",
			"nhentai.net": "n",
			"hitomi.la": "Hi"
		};
		var get_tag_from_domain = function (domain) {
			var d = domain_tags[domain];
			return (d === undefined) ? "?" : d;
		};

		var get_ehentai_gallery_full = function (info, data, callback) {
			rt_ehentai_gallery_full.add("" + data.gid, {
				domain: info.domain,
				search: "",
				gid: data.gid,
				token: data.token,
				info: info,
				data: data
			}, false, callback);
		};
		var get_ehentai_gallery_page_thumb = function (domain, gid, token, page_token, page, callback) {
			rt_ehentai_gallery_page_thumb.add(gid + "-" + page, {
				domain: domain,
				gid: gid,
				token: token,
				page: page,
				page_token: page_token,
				search: ""
			}, false, callback);
		};
		var get_nhentai_gallery_page_thumb = function (gid, page, callback) {
			rt_nhentai_gallery_page_thumb.add(gid + "-" + page, {
				gid: gid,
				page: page
			}, false, callback);
		};
		var get_hitomi_gallery_page_thumb = function (gid, page, callback) {
			rt_hitomi_gallery_page_thumb.add(gid + "-" + page, {
				gid: gid,
				page: page
			}, false, callback);
		};

		var get_data = function (url_info) {
			return get_saved_data(url_info.id);
		};
		var get_data_from_url_info = function (url_info, callback) {
			if (url_info.site === "ehentai") {
				if (url_info.type === "gallery") {
					rt_ehentai_gallery.add("" + url_info.gid, url_info, false, callback);
					return;
				}
				if (url_info.type === "page") {
					rt_ehentai_gallery_page.add("" + url_info.gid, url_info, false, function (err, data) {
						if (err === null) {
							url_info.token = data.token;
							rt_ehentai_gallery.add("" + url_info.gid, url_info, false, callback);
						}
						else {
							callback.call(null, err, null);
						}
					});
					return;
				}
			}
			else if (url_info.site === "nhentai") {
				if (url_info.type === "gallery") {
					rt_nhentai_gallery.add("" + url_info.gid, url_info, false, callback);
					return;
				}
			}
			else if (url_info.site === "hitomi") {
				if (url_info.type === "gallery") {
					rt_hitomi_gallery.add("" + url_info.gid, url_info, false, callback);
					return;
				}
			}

			// Custom
			var i = url_info._custom_id,
				fn;

			if (typeof(i) === "number" && (fn = url_info_to_data_registrations[i]) !== undefined) {
				fn(url_info, callback);
				return;
			}

			callback.call(null, "Malformed data", null);
		};

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
			});
		};

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
				};

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
					});
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
				});
			}
		};

		var init = function () {
			// Clean
			cache_init();
		};



		// Exports
		return {
			Flags: Flags,
			RequestType: RequestType,
			get_url_info: get_url_info,
			get_url_info_saved: get_url_info_saved,
			get_tag_from_domain: get_tag_from_domain,
			get_ehentai_gallery_full: get_ehentai_gallery_full,
			get_ehentai_gallery_page_thumb: get_ehentai_gallery_page_thumb,
			get_nhentai_gallery_page_thumb: get_nhentai_gallery_page_thumb,
			get_hitomi_gallery_page_thumb: get_hitomi_gallery_page_thumb,
			get_data: get_data,
			get_data_from_url_info: get_data_from_url_info,
			get_thumbnail: get_thumbnail,
			lookup_on_ehentai: lookup_on_ehentai,
			cache_clear: cache_clear,
			cache_get_prefix: cache_get_prefix,
			get_category: get_category,
			get_category_sort_rank: get_category_sort_rank,
			is_fjording: is_fjording,
			register_url_info_function: register_url_info_function,
			init: init
		};

	})();
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
		};
		var rotl = function (x, n) {
			return (x << n) | (x >>> (32 - n));
		};
		var hex = function (str) {
			var s = "",
				v, i;
			for (i = 7; i >= 0; --i) {
				v = (str >>> (i * 4)) & 0xf;
				s += v.toString(16);
			}
			return s;
		};

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
		};

		// Exports
		return {
			hash: hash
		};

	})();
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
		};

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
		};
		var on_sauce_click_error = function (event) {
			event.preventDefault();

			var link = this,
				events = this.getAttribute("data-xl-exsauce-events") || null;

			if (events === null) return;

			Linkifier.change_link_events(link, null);

			setTimeout(function () {
				Linkifier.change_link_events(link, events);
				link.click();
			}, 1);
		};
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
		});
		var on_sauce_mouseout = $.wrap_mouseenterleave_event(function () {
			var hover = hover_nodes[this.getAttribute("data-xl-sauce-hover-id") || ""];
			if (hover !== undefined) {
				hover.classList.add("xl-exsauce-hover-hidden");
			}
		});
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
		};

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
		};
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
		};
		var label = function () {
			var label = config.sauce.label;

			if (label.length === 0) {
				label = (config.sauce.lookup_domain === domains.exhentai) ? "ExHentai" : "E-Hentai";
			}

			return label;
		};

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
		};
		var set_error = function (node, error) {
			// Create hover
			create_error(node, error);

			// Link
			node.classList.add("xl-exsauce-link-error");
			node.textContent = "Error";
			node.removeAttribute("title");

			// Events
			Linkifier.change_link_events(node, "exsauce_error");
		};
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
		};

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
				};
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
				};
			}

			remove_error(link);

			API.lookup_on_ehentai(url, md5, use_similar, function (err, data) {
				if (err === null) {
					format(link, data);
				}
				else {
					set_error(link, err);
				}
			}, progress);
		};
		var fetch = function (event) {
			event.preventDefault();
			fetch_generic(this, false);
		};
		var fetch_similar = function (event) {
			event.preventDefault();
			fetch_generic(this, true);
		};

		// Public
		var find_link = function (container) {
			return $(".xl-exsauce-link", container);
		};
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
		};
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
		};

		// Exports
		return {
			find_link: find_link,
			create_link: create_link,
			init: init
		};

	})();
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
			};



			// Main function
			var deep_dom_wrap = function (container, matcher, element_checker, setup_function, quick) {
				var text = "",
					offsets = [],
					d = document,
					count = 0,
					match_pos = 0,
					node, par, next, check, match,
					pos_start, pos_end, offset_start, offset_end, tag,
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
					tag = match[2];

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
					link_base = (tag !== null) ? d.createElement(tag) : d.createDocumentFragment();
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
			};



			// Element type constants
			deep_dom_wrap.EL_TYPE_PARSE = 0;
			deep_dom_wrap.EL_TYPE_NO_PARSE = 1;
			deep_dom_wrap.EL_TYPE_LINE_BREAK = 2;



			// Return the function
			return deep_dom_wrap;

		})();

		var linkify_groups = [{
			regex: re_url,
			prefix_group: 1,
			prefix: "http://",
			prefix_replace: [ /^\/+/, "" ],
			tag: "a",
			match: null
		}];
		var linkify = function (container, result_nodes, result_urls) {
			var match_fn, node_setup;

			if (linkify_groups.length === 1) {
				// Normal
				match_fn = function (text, pos) {
					re_url.lastIndex = pos;
					var m = re_url.exec(text);
					if (m === null) return null;
					return [ m.index , m.index + m[0].length, "a", m ];
				};
				node_setup = function (node, match) {
					var url = match[3][0];
					if (match[3][1] === undefined) url = "http://" + url.replace(/^\/+/, "");
					result_nodes.push(node);
					result_urls.push(url);
				};
			}
			else {
				// Multiple
				match_fn = function (text, pos) {
					var res = null,
						group, i, ii, m;

					for (i = 0, ii = linkify_groups.length; i < ii; ++i) {
						group = linkify_groups[i];

						if ((m = group.match) === null || m.index < pos) {
							group.regex.lastIndex = pos;
							group.match = m = group.regex.exec(text);
						}
						if (m !== null && (res === null || res[0] > m.index)) {
							res = [ m.index , m.index + m[0].length, group.tag, m, group ];
						}
					}

					return res;
				};
				node_setup = function (node, match) {
					var url = match[3][0],
						group = match[4],
						re;

					if (match[3][group.prefix_group] === undefined) {
						if ((re = group.prefix_replace) !== null) {
							url = url.replace(re[0], re[1]);
						}
						url = group.prefix + url;
					}

					result_nodes.push(node);
					result_urls.push(url);
				};
			}

			deep_dom_wrap(container, match_fn, linkify_element_checker, node_setup, false);
		};
		var linkify_element_checker = function (node) {
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
		};
		var linkify_test = function (text) {
			var group, re, i, ii, m;
			for (i = 0, ii = linkify_groups.length; i < ii; ++i) {
				group = linkify_groups[i];
				re = group.regex;
				re.lastIndex = 0;
				if ((m = re.exec(text)) !== null) {
					if (m[group.prefix_group] === undefined) {
						if ((re = group.prefix_replace) !== null) {
							text = text.replace(re[0], re[1]);
						}
						text = group.prefix + text;
					}
					return text;
				}
			}
			return null;
		};
		var linkify_register = function (regex, prefix_group, prefix, prefix_replace_regex, prefix_replace_with) {
			var prefix_replace = null;

			if (prefix_replace_regex !== null && typeof(prefix_replace_with) === "string") {
				prefix_replace = [ prefix_replace_regex, prefix_replace_with ];
			}

			linkify_groups.push({
				regex: regex,
				prefix_group: prefix_group,
				prefix: prefix,
				prefix_replace: prefix_replace,
				tag: "a",
				match: null
			});
		};

		var parse_text_for_urls = function (text) {
			var urls = [],
				m;

			re_url.lastIndex = 0;

			while ((m = re_url.exec(text)) !== null) {
				urls.push(m[0]);
			}

			return urls;
		};

		// Link creation and processing
		var create_link = function (parent, next, url, text, auto_process) {
			var link = $.link(url, "xl-link-created", text);

			$.before(parent, next, link);

			preprocess_link(link, url, false, auto_process);

			return link;
		};
		var preprocess_link = function (node, url, update_on_fail, auto_load) {
			API.get_url_info(url, function (err, info) {
				if (node.parentNode === null) return;

				if (info === null || (config.sites[info.site] === false || Config.get_custom("sites", info.site) === false)) {
					if (update_on_fail) {
						node.href = url;
						node.target = "_blank";
						node.rel = "noreferrer";
						node.classList.add("xl-linkified");
					}
					return;
				}

				if (info.site === "ehentai") {
					var rewrite = config.general.rewrite_links;
					if (
						(rewrite === domains.exhentai || rewrite === domains.gehentai) &&
						info.domain !== rewrite
					) {
						info.domain = rewrite;
						info.tag = API.get_tag_from_domain(rewrite);
						url = $.change_url_domain(url, rewrite);
					}
				}

				node.href = url;
				node.target = "_blank";
				node.rel = "noreferrer";

				node.classList.add("xl-link");
				node.classList.add("xl-linkified");

				UI.setup_link(node, url, info);

				if (auto_load) load_link(node, info);
			});
		};
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
			});
		};

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
		};
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
		};

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
		};
		var parse_post = function (post) {
			var auto_load_links = config.general.automatic_processing,
				post_body, post_links, link_nodes, link_urls, link, url, i, ii;

			// Exsauce
			if (config.sauce.enabled && !browser.is_opera) {
				setup_post_exsauce(post);
			}

			// Linkify
			if ((post_body = Post.get_text_body(post)) !== null) {
				link_nodes = [];
				link_urls = [];

				// Existing links
				post_links = Post.get_body_links(post_body);
				for (i = 0, ii = post_links.length; i < ii; ++i) {
					link = post_links[i];
					if (link.classList.contains("xl-site-tag")) {
						$.remove(link);
					}
					else {
						url = link.href;
						if (link.classList.contains("linkified") && re_deferrer.test(url)) {
							url = link.textContent.trim();
						}
						url = linkify_test(url);
						if (url !== null) {
							link_nodes.push(link);
							link_urls.push(url);
						}
					}
				}

				// Linkify links
				ii = link_nodes.length;
				linkify(post_body, link_nodes, link_urls);

				// Process
				for (i = 0; i < ii; ++i) {
					preprocess_link(link_nodes[i], link_urls[i], false, auto_load_links);
				}
				for (ii = link_nodes.length; i < ii; ++i) {
					preprocess_link(link_nodes[i], link_urls[i], true, auto_load_links);
				}

				// Mark
				post.classList.add("xl-post-linkified");
			}
		};
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
		};

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
		};
		var get_link_events = function (node) {
			return node.getAttribute("data-xl-link-events") || null;
		};
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
		};
		var apply_link_events = function (node, check_children) {
			var nodes = check_children ? $$("a.xl-link-events", node) : [ node ],
				events, i, ii;

			for (i = 0, ii = nodes.length; i < ii; ++i) {
				node = nodes[i];
				events = node.getAttribute("data-xl-link-events");
				set_link_events(node, events);
			}
		};
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
		};

		// Links
		var get_links_formatted = function (parent) {
			return $$("a.xl-link.xl-link-formatted", parent);
		};

		// Events
		var event_listeners = {
			format: []
		};
		var on = function (event_name, callback) {
			var listeners = event_listeners[event_name];
			if (!listeners) return false;
			listeners.push(callback);
			return true;
		};
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
		};
		var trigger = function (listeners, data) {
			var i, ii;
			for (i = 0, ii = listeners.length; i < ii; ++i) {
				listeners[i].call(null, data);
			}
		};

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
		};
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
		};

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
			relinkify_posts: relinkify_posts,
			fix_broken_4chanx_linkification: fix_broken_4chanx_linkification,
			linkify_register: linkify_register,
			on: on,
			off: off
		};

	})();
	var Settings = (function () {

		// Private
		var config_temp = null,
			config_custom_temp = null,
			export_url = null,
			popup = null;

		var html_filter_guide = function () {
			return '#FILTER_GUIDE#';
		};
		var create_export_data = function () {
			return {
				config: Config.get_saved_settings(),
				easy_list: EasyList.get_saved_settings()
			};
		};
		var import_settings = function (data) {
			if (data !== null && typeof(data) === "object") {
				var v = data.config;
				if (typeof(v) !== "object") v = null;
				Config.set_saved_settings(v);

				v = data.easy_list;
				if (typeof(v) !== "object") v = null;
				EasyList.set_saved_settings(v);
			}
		};

		var generate_section_header = function (title, message) {
			var theme = Theme.classes,
				n1, n2, n3;

			n1 = $.node("div", "xl-settings-heading" + theme);
			$.add(n1, n2 = $.node("div", "xl-settings-heading-inner" + theme));
			$.add(n2, $.node("div", "xl-settings-heading-cell xl-settings-heading-title" + theme, title));
			if (message !== undefined) {
				$.add(n2, n3 = $.node("div", "xl-settings-heading-cell xl-settings-heading-subtitle" + theme));
				$.add(n3, message);
			}

			return n1;
		};
		var generate_section = function () {
			return $.node("div", "xl-settings-group " + Theme.classes);
		};
		var generate_section_options = function (section, namespace, config_descriptor, config_scope) {
			var type, info, d, i, ii;
			for (i = 0, ii = config_descriptor.length; i < ii; ++i) {
				d = config_descriptor[i]; // [ name, default, label, description, old_name, info? ]
				info = (d.length > 5 ? d[5] : null);
				if (info === null || (type = info.type) === undefined) type = "checkbox";
				generate_section_option(
					section,
					config_scope,
					"xl-settings-" + namespace + "-" + i, // id
					d[0], // name
					d[2], // label
					d[3], // description
					type, // type
					config_scope !== null ? config_scope[d[0]] : null, // value
					info // info
				);
			}
		};
		var generate_section_options_custom = function (section, namespace, custom_descriptor, custom_config) {
			var config_descriptor = custom_descriptor[namespace];
			if (config_descriptor === undefined) return;

			generate_section_options(section, namespace + "-custom", config_descriptor, custom_config[namespace]);
		};
		var generate_section_option = function (section, config_scope, id, name, label_text, description, type, value, info) {
			var event = "change",
				theme = Theme.classes,
				values, entry, table, row, cell, label, input, n, i, ii, v;

			// Create label/description
			$.add(section, entry = $.node("div", "xl-settings-entry" + theme));
			$.add(entry, table = $.node("div", "xl-settings-entry-table"));
			$.add(table, row = $.node("div", "xl-settings-entry-row"));

			$.add(row, cell = $.node("span", "xl-settings-entry-cell"));
			$.add(cell, label = $.node("label", "xl-settings-entry-label"));
			label.htmlFor = id;
			$.add(label, $.node("strong", "xl-settings-entry-label-name", label_text + ":"));
			if (description) {
				$.add(label, $.node("span", "xl-settings-entry-label-description", " " + description));
			}

			// Value edit
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

				values = (info !== null ? info.options : []);
				for (i = 0, ii = values.length; i < ii; ++i) {
					v = values[i];
					$.add(input, n = $.node("option", "xl-settings-entry-input-option", v[1]));
					n.value = v[0];
					n.selected = (v[0] === value);
					if (v.length > 2) n.title = v[2];
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
				$.add(cell, input = $.node("button", "xl-settings-entry-input" + theme, (info !== null ? info.text || "" : "")));
				event = "click";
			}
			else {
				// Skip event
				return;
			}

			// Event
			if (config_scope === null) name = null;
			$.on(input, event, $.bind(on_change, input, type, config_scope, name, info));
		};

		var titlify_custom_namespace = function (namespace) {
			return namespace.replace(/[_\W]+/g, " ").replace(/\b\w/g, function (m) { return m.toUpperCase(); });
		};

		var on_change = function (type, config_scope, name, info, event) {
			var fn, v;

			if (name !== null) {
				if (type === "checkbox") {
					v = this.checked;
				}
				else if (type === "select" || type === "textbox" || type === "textarea") {
					v = this.value;
				}

				fn = (info === null ? undefined : info.set);
				if (fn !== undefined) fn.call(null, v);

				config_scope[name] = v;
			}

			if (info !== null && (fn = info.on_change) !== undefined) {
				fn.call(this, event);
			}
		};
		var on_cache_clear_click = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();

				var clears = API.cache_clear();
				Debug.log("Cleared cache; entries_removed=" + clears);
				this.textContent = "Cleared!";
			}
		};
		var on_changelog_click = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();
				close(event);
				Changelog.open(null);
			}
		};
		var on_export_click = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();
				close();
				open_export();
			}
		};
		var on_save_click = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();

				config = config_temp;
				Config.load_custom_from_clone(config_custom_temp);

				Config.save();
				close();
			}
		};
		var on_cancel_click = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();

				close();
			}
		};
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
		};
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
		};
		var on_settings_open_click = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();

				open();
			}
		};

		// Public
		var ready = function () {
			Navigation.insert_link("main", "#TITLE#", Main.homepage, " xl-nav-link-settings", on_settings_open_click);

			var n = $.link(Main.homepage, "xl-nav-link", "#TITLE# Settings");
			$.on(n, "click", on_settings_open_click);
			HeaderBar.insert_menu_link(n);
		};
		var open = function () {
			var theme = Theme.classes,
				custom_options = Config.get_custom_settings_descriptor(),
				content_container, k, n;

			// Config
			config_temp = JSON.parse(JSON.stringify(config));
			config_custom_temp = Config.get_custom_clone();

			// Popup
			popup = Popup.create("settings", [[{
				small: true,
				setup: function (container) {
					var n;
					$.add(container, $.link(Main.homepage, "xl-settings-title" + theme, "#TITLE#"));
					$.add(container, n = $.link(Changelog.url, "xl-settings-version" + theme, Main.version.join(".")));
					$.on(n, "click", on_changelog_click);
				}
			}, {
				align: "right",
				setup: function (container) {
					var n;
					$.add(container, n = $.link("#ISSUES#", "xl-settings-button" + theme));
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
				}
			}], {
				body: true,
				setup: function (container) {
					content_container = container;
				}
			}]);

			// Settings
			n = $.tnode("Note: you must reload the page after saving for some changes to take effect");
			$.add(content_container, generate_section_header("General", n));
			n = generate_section();
			generate_section_options(n, "general", options.general, config_temp.general);
			generate_section_options_custom(n, "general", custom_options, config_custom_temp);
			$.add(content_container, n);

			$.add(content_container, generate_section_header("Sites"));
			n = generate_section();
			generate_section_options(n, "sites", options.sites, config_temp.sites);
			generate_section_options_custom(n, "sites", custom_options, config_custom_temp);
			$.add(content_container, n);

			$.add(content_container, generate_section_header("Gallery Details"));
			n = generate_section();
			generate_section_options(n, "details", options.details, config_temp.details);
			generate_section_options_custom(n, "details", custom_options, config_custom_temp);
			$.add(content_container, n);

			$.add(content_container, generate_section_header("Gallery Actions"));
			n = generate_section();
			generate_section_options(n, "actions", options.actions, config_temp.actions);
			generate_section_options_custom(n, "actions", custom_options, config_custom_temp);
			$.add(content_container, n);

			$.add(content_container, generate_section_header("ExSauce"));
			n = generate_section();
			generate_section_options(n, "sauce", options.sauce, config_temp.sauce);
			generate_section_options_custom(n, "sauce", custom_options, config_custom_temp);
			$.add(content_container, n);

			n = $.link("#", "xl-settings-filter-guide-toggle", "Click here to toggle the guide");
			$.on(n, "click", on_toggle_filter_guide);
			$.add(content_container, generate_section_header("Filtering", n));
			n = $.frag(html_filter_guide());
			Theme.apply(n);
			$.on($("input.xl-settings-color-input[type=color]", n), "change", on_color_helper_change);
			$.add(content_container, n);
			n = generate_section();
			generate_section_options(n, "filter", options.filter, config_temp.filter);
			generate_section_options_custom(n, "filter", custom_options, config_custom_temp);
			$.add(content_container, n);

			$.add(content_container, generate_section_header("Debugging"));
			n = generate_section();
			generate_section_options(n, "debug", options.debug, config_temp.debug);
			generate_section_options(n, "debug-ext", [
				[ null, null,
					"Clear cache data", "Clear all cached gallery data",
					null,
					{ type: "button", text: "Clear", on_change: on_cache_clear_click },
				]
			], null);
			generate_section_options_custom(n, "debug", custom_options, config_custom_temp);
			$.add(content_container, n);

			// Custom
			for (k in custom_options) {
				if (!Object.prototype.hasOwnProperty.call(config_temp, k)) {
					$.add(content_container, generate_section_header(titlify_custom_namespace(k)));
					n = generate_section();
					generate_section_options(n, k + "-custom", custom_options[k], config_custom_temp[k]);
					$.add(content_container, n);
				}
			}

			// Events
			$.on(popup, "click", on_cancel_click);

			// Add to body
			Popup.open(popup);

			// Focus
			n = $(".xl-popup-cell-size-scroll", popup);
			if (n !== null) $.scroll_focus(n);
		};
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
					$.add(container, $.link(Main.homepage, "xl-settings-title" + theme, "#TITLE#"));
					$.add(container, $.node("span", "xl-settings-title-info" + theme, " - Settings export"));
				}
			}, {
				align: "right",
				setup: function (container) {
					var d = new Date(),
						pad, n, fn;

					pad = function (s, len) {
						s = "" + s;
						while (s.length < len) s = "0" + s;
						return s;
					};

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
							}, false);
							reader.readAsText(files[0]);
						}
						this.value = null;
					});

					$.add(container, n = $.link(undefined, "xl-settings-button" + theme));
					$.add(n, $.node("span", "xl-settings-button-text", "Import"));
					$.on(n, "click", function (event) {
						event.preventDefault();
						fn.click();
					});

					$.add(container, n = $.link(export_url, "xl-settings-button" + theme));
					n.removeAttribute("target");
					n.setAttribute("download",
						"#TITLE#".toLowerCase() + "-settings-" +
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
					});

					$.add(container, n = $.link("#", "xl-settings-button" + theme));
					$.add(n, $.node("span", "xl-settings-button-text", "Cancel"));
					$.on(n, "click", on_cancel_click);
				}
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
					});

					$.add(n1, $.tnode(")"));

					$.add(container, n1);
				}
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
					});

					nodes.textarea = n;

					$.add(container, n);
				}
			}]);
			$.on(popup, "click", on_cancel_click);

			// Add to body
			Popup.open(popup);

			// Focus
			n = $(".xl-settings-export-textarea", popup);
			if (n !== null) n.focus();
		};
		var close = function () {
			config_temp = null;
			config_custom_temp = null;
			if (popup !== null) {
				Popup.close(popup);
				popup = null;
			}
			if (export_url !== null) {
				window.URL.revokeObjectURL(export_url);
				export_url = null;
			}
		};

		// Exports
		return {
			ready: ready,
			open: open,
			open_export: open_export,
			close: close
		};

	})();
	var Config = (function () {

		// Private
		var settings_key = "#PREFIX#settings",
			custom = {},
			custom_descriptor = null;

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
				},
				setItem: function (key, value) {
					GM_setValue(key, value);
				},
				key: function (index) {
					return GM_listValues()[index];
				},
				removeItem: function (key) {
					GM_deleteValue(key);
				},
				clear: function () {
					var v = GM_listValues(), i, ii;
					for (i = 0, ii = v.length; i < ii; ++i) GM_deleteValue(v[i]);
				},
				get length() {
					return GM_listValues().length;
				}
			};
		})();

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
		};
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
		};
		var save = function () {
			config.version = Main.version;
			storage.setItem(settings_key, JSON.stringify(config));
			config.version = null;
		};
		var get_saved_settings = function () {
			return $.json_parse_safe(storage.getItem(settings_key), null);
		};
		var set_saved_settings = function (data) {
			if (data === null) {
				storage.removeItem(settings_key);
			}
			else {
				storage.setItem(settings_key, JSON.stringify(data));
			}
		};

		var load_custom = function () {
			var saved = $.json_parse_safe(storage.getItem(settings_key + "-custom"), null),
				obj, k1, k2, v;

			if (saved === null || typeof(saved) !== "object") return;

			for (k1 in saved) {
				obj = saved[k1];
				if (obj !== null && typeof(obj) === "object") {
					for (k2 in obj) {
						if (!Object.prototype.hasOwnProperty.call(custom, k1)) {
							v = custom[k1] = {};
						}
						else {
							v = custom[k1];
						}
						v[k2] = obj[k2];
					}
				}
			}
		};
		var save_custom = function () {
			storage.setItem(settings_key + "-custom", JSON.stringify(custom));
		};

		var register_custom_setting = function (namespace, name, default_value, title, description, descriptor) {
			// Already exists
			if (Object.prototype.hasOwnProperty.call(config, namespace) && Object.prototype.hasOwnProperty.call(config[namespace], name)) {
				return undefined;
			}

			// Load custom
			if (custom_descriptor === null) {
				custom_descriptor = {};
				load_custom();
			}

			// Get value
			var update = init_custom(namespace, name, default_value),
				d, v;

			// Descriptor
			d = [ name, default_value, title, description, null ];
			if (descriptor !== null) d.push(descriptor);

			v = custom_descriptor[namespace];
			if (v === undefined) custom_descriptor[namespace] = v = [];
			v.push(d);

			// Save
			if (update[0]) save_custom();

			// Return value
			return update[1];
		};
		var init_custom = function (namespace, name, default_value) {
			var v = custom[namespace],
				val;

			if (v === undefined) {
				custom[namespace] = v = {};
				v[name] = default_value;
				return [ true, default_value ];
			}

			val = v[name];
			if (val === undefined) {
				v[name] = default_value;
				return [ true, default_value ];
			}

			return [ false, val ];
		};
		var get_custom_settings_descriptor = function () {
			return custom_descriptor;
		};
		var get_custom = function (namespace, name) {
			var v = custom[namespace];
			return (v !== undefined) ? v[name] : undefined;
		};
		var get_custom_clone = function () {
			return JSON.parse(JSON.stringify(custom));
		};
		var load_custom_from_clone = function (clone) {
			custom = clone;
			save_custom();
		};

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
			set_saved_settings: set_saved_settings,
			register_custom_setting: register_custom_setting,
			get_custom_settings_descriptor: get_custom_settings_descriptor,
			get_custom: get_custom,
			get_custom_clone: get_custom_clone,
			load_custom_from_clone: load_custom_from_clone
		};

		return Module;

	})();
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
		};
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
		};
		FilterFlags.scope_fn = function (name) {
			return function (value, state) {
				if (!state.scope) {
					state.scope = true;
					this.tags = false;
					this.title = false;
					this.uploader = false;
				}

				this[name] = (good_values.indexOf(value.trim().toLowerCase()) >= 0);
			};
		};
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
			};
		};
		FilterFlags.names = {
			"tags": FilterFlags.scope_fn("tags"),
			"title": FilterFlags.scope_fn("title"),
			"uploader": FilterFlags.scope_fn("uploader"),

			"bad": FilterFlags.color_fn(function (value) {
				this.bad = (good_values.indexOf(value.toLowerCase()) >= 0);
			}),

			"only": function (value) {
				this.only = this.split(value);
			},
			"not": function (value) {
				this.not = this.split(value);
			},
			"site": function (value) {
				this.site = this.split(value);
			},

			"colors": FilterFlags.color_fn(function (value) {
				this.color = value;
				this.link_color = value;
			}),
			"underlines": FilterFlags.color_fn(function (value) {
				this.underline = value;
				this.link_underline = value;
			}),
			"backgrounds": FilterFlags.color_fn(function (value) {
				this.background = value;
				this.link_background = value;
			}),

			"color": FilterFlags.color_fn(function (value) {
				this.color = value;
			}),
			"underline": FilterFlags.color_fn(function (value) {
				this.underline = value;
			}),
			"background": FilterFlags.color_fn(function (value) {
				this.background = value;
			}),

			"link-color": FilterFlags.color_fn(function (value) {
				this.link_color = value;
			}),
			"link-underline": FilterFlags.color_fn(function (value) {
				this.link_underline = value;
			}),
			"link-background": FilterFlags.color_fn(function (value) {
				this.link_background = value;
			}),

			"no-colors": function (value, state) {
				state.color = true;

				value = null;
				this.color = value;
				this.underline = value;
				this.background = value;
				this.link_color = value;
				this.link_underline = value;
				this.link_background = value;
			},

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
		};
		FilterFlags.prototype.split = function (text) {
			var array, i, ii;

			text = text.trim();
			if (text.length === 0) return null;

			array = text.toLowerCase().split(",");
			for (i = 0, ii = array.length; i < ii; ++i) {
				array[i] = array[i].trim();
			}

			return array;
		};
		var Match = function (start, end, filter) {
			this.start = start;
			this.end = end;
			this.filter = filter;
		};
		var MatchSegment = function (start, end, data) {
			this.start = start;
			this.end = end;
			this.data = data;
		};
		var MatchInfo = function () {
			this.matches = [];
			this.any = false;
			this.bad = false;
		};

		var create_regex = function (pattern, flags) {
			if (flags.indexOf("g") < 0) flags += "g";

			try {
				return new RegExp(pattern, flags);
			}
			catch (e) {
				return null;
			}
		};
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
		};
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
		};
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
		};
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
		};
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
		};
		var append_match_datas = function (matchinfo, target) {
			for (var i = 0, ii = matchinfo.matches.length; i < ii; ++i) {
				target.push(matchinfo.matches[i].filter);
			}
		};
		var remove_non_bad = function (list) {
			for (var i = 0; i < list.length; ) {
				if (!list[i].bad) {
					list.splice(i, 1);
					continue;
				}
				++i;
			}
		};
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
		};
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
		};
		var hl_return = function (bad, node) {
			if (bad) {
				node.classList.add("xl-filter-bad");
				return Status.Bad;
			}
			else {
				node.classList.add("xl-filter-good");
				return Status.Good;
			}
		};
		var init_filters = function () {
			active_filters = config.filter.enabled ? parse(config.filter.filters, 0) : [];
		};

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
		};
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
		};
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
			};

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
		};
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
					});
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
		};

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

	})();
	var Theme = (function () {

		// Private
		var current = "light",
			post_bg = "#ffffff";

		var to_hex2 = function (n) {
			n = n.toString(16);
			if (n.length < 2) n = "0" + n;
			return n;
		};
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
		};
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
		};
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
		};
		var update_nodes_bg = function () {
			var nodes = $$(".xl-theme-post-bg"),
				i, ii;
			for (i = 0, ii = nodes.length; i < ii; ++i) {
				nodes[i].style.backgroundColor = post_bg;
			}
		};

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
		};

		// Public
		var ready = function () {
			update(false);

			if (d.head) {
				new MutationObserver(on_head_mutate).observe(d.head, { childList: true });
			}
		};
		var bg = function (node) {
			node.classList.add("xl-theme-post-bg");
			node.style.backgroundColor = post_bg;
		};
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
		};
		var get_computed_style = function (node) {
			try {
				// Don't use window.getComputedStyle: https://code.google.com/p/chromium/issues/detail?id=538650
				return document.defaultView.getComputedStyle(node);
			}
			catch (e) {
				return node.style || {};
			}
		};
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
		};

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

	})();
	var EasyList = (function () {

		var Entry = function (info, data) {
			this.info = info;
			this.data = data;
			this.node = null;
		};

		// Private
		var settings_key = "#PREFIX#easylist-settings",
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
				upload: [ "data-xl-date-created", -1 ],
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
		};
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
		};
		var create = function () {
			popup = Popup.create("easylist", function (container) {
				var theme = Theme.classes,
					n1, n2;

				// Overlay
				$.add(container, n1 = $.node("div", "xl-easylist-title"));

				$.add(n1, $.node("span", "xl-easylist-title-text", "#TITLE# Easy List"));
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
			});

			$.on(popup, "click", on_overlay_click);

			// Setup
			update_display_mode(true);
		};
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
			};
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
			};
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
			};
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
			};
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
		};
		var create_gallery_nodes = function (data, index, info) {
			var domain = info.domain,
				url = CreateURL.to_gallery(data, domain),
				theme = Theme.classes,
				n1, n2, n3, n4, n5, n6, n7, i, t;

			n1 = $.node("div", "xl-easylist-item" + theme);
			n1.setAttribute("data-xl-id", info.id);
			n1.setAttribute("data-xl-index", index);
			n1.setAttribute("data-xl-rating", data.rating);
			n1.setAttribute("data-xl-date-created", data.date_created);
			n1.setAttribute("data-xl-category", data.category);

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
				}, n7));
			}
			else {
				n6.style.width = "100%";
				n6.style.height = "100%";
			}

			$.add(n6, $.node("span", "xl-easylist-item-image-index" + theme, "#" + (index + 1)));


			// Main content
			$.add(n3, n4 = $.node("div", "xl-easylist-item-cell" + theme));

			$.add(n4, n5 = $.node("div", "xl-easylist-item-title" + theme));

			t = UI.button_text(info);
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
			$.add(n5, $.node("span", "xl-easylist-item-upload-date" + theme, UI.format_date(data.date_created)));

			$.add(n4, n5 = $.node("div", "xl-easylist-item-tags" + theme));

			n6 = create_full_tags(data, info);
			$.add(n5, n6);
			if (!data.full && data.type === "ehentai") {
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
		};
		var create_full_tags = function (data, info) {
			var theme = Theme.classes,
				n1 = $.node("div", "xl-easylist-item-tag-table" + theme),
				domain_type = data.type,
				domain = info.domain,
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
					$.add(n3, n4 = $.link(CreateURL.to_tag(tags[i], domain_type, domain),
						"xl-tag xl-tag-color-inherit xl-easylist-item-tag",
						tags[i]
					));
					n4.setAttribute("data-xl-original", n4.textContent);

					if (i < ii - 1) $.add(n3, $.tnode(","));
				}
			}

			return n1;
		};
		var add_gallery_update_timer = null;
		var add_gallery = function (content_index, entry, index, force_reorder) {
			var info = entry.info,
				data = entry.data,
				entries, n;

			if (data.subtype === "gallery") {
				entries = contents[content_index].entries;
				n = create_gallery_nodes(data, index, info);
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
						}, 1);
					}
					else {
						set_empty(contents[content_index].visible === 0);
					}
				}
			}
		};
		var set_empty = function (empty) {
			if (empty_notification !== null) {
				var cls = "xl-easylist-empty-notification-visible";
				if (empty !== empty_notification.classList.contains(cls)) {
					empty_notification.classList.toggle(cls);
				}
			}
		};
		var get_options_visible = function () {
			return options_container.classList.contains("xl-easylist-options-visible");
		};
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
		};

		var get_node_filter_group = function (node) {
			var v = get_node_filters_bad(node);
			return (v > 0) ? -v : get_node_filters_good(node);
		};
		var get_node_filters_good = function (node) {
			return (parseInt(node.getAttribute("data-xl-filter-matches-title"), 10) || 0) +
				(parseInt(node.getAttribute("data-xl-filter-matches-uploader"), 10) || 0) +
				(parseInt(node.getAttribute("data-xl-filter-matches-tags"), 10) || 0);
		};
		var get_node_filters_bad = function (node) {
			return (parseInt(node.getAttribute("data-xl-filter-matches-title-bad"), 10) || 0) +
				(parseInt(node.getAttribute("data-xl-filter-matches-uploader-bad"), 10) || 0) +
				(parseInt(node.getAttribute("data-xl-filter-matches-tags-bad"), 10) || 0);
		};
		var get_node_category_group = function (node) {
			return API.get_category_sort_rank(node.getAttribute("data-xl-category"));
		};
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
		};
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
					};
					ordering = [ 1, -1 ];
				}
				else {
					base_array = function (node) {
						return [ get_node_filter_group(node) ];
					};
					ordering = [ -1 ];
				}
			}
			else if (settings.group_by_category) {
				base_array = function (node) {
					return [ get_node_category_group(node) ];
				};
				ordering = [ 1 ];
			}
			else {
				base_array = function () { return []; };
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
			});

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
		};
		var reset_filter_state = function (node, content_node) {
			content_node.textContent = node.getAttribute("data-xl-original") || "";
			node.classList.remove("xl-filter-good");
			node.classList.remove("xl-filter-bad");
		};
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
		};
		var update_all_filters = function () {
			var content_index = content_current,
				entries = contents[content_index].entries,
				info, data, i, ii;

			for (i = 0, ii = entries.length; i < ii; ++i) {
				info = entries[i].info;
				data = API.get_data(info);
				if (data !== null) {
					update_filters(entries[i].node, data, false, false);
				}
			}

			// Update order
			if (settings.group_by_filters || settings.filter_visibility !== 0) {
				update_ordering();
			}
		};
		var load_filters = function () {
			custom_filters = Filter.parse(settings.custom_filters, undefined);
		};
		var add_links = function (links) {
			var immediate = true,
				i, ii;

			var cb = function (err, data) {
				add_entry(immediate, err, data);
			};

			for (i = 0, ii = links.length; i < ii; ++i) {
				API.get_url_info(links[i].href, cb);
			}

			immediate = false;
			if (queue.length > 0 && queue_timer === null) {
				on_timer();
			}
		};
		var add_entry = function (immediate, err, info) {
			var key;
			if (err !== null || data_map[(key = info.id)] !== undefined) return;

			API.get_data_from_url_info(info, function (err, data) {
				if (err === null) {
					if (data_map[key] === undefined) {
						var entry = new Entry(info, data);
						queue.push(entry);
						data_map[key] = entry;

						if (!immediate && queue.length > 0 && queue_timer === null) {
							on_timer();
						}
					}
				}
			});
		};

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
		};

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
		};
		var parse_custom_urls = function (text) {
			var urls = Linkifier.parse_text_for_urls(text),
				i, ii;

			for (i = 0, ii = urls.length; i < ii; ++i) {
				API.get_url_info(urls[i], $.bind(parse_custom_url_info, null, i));
			}
		};
		var parse_custom_url_info = function (index, err, info) {
			var key;
			if (err !== null || custom_links_map[(key = info.id)] !== undefined) return;

			API.get_data_from_url_info(info, function (err, data) {
				if (err === null) {
					if (custom_links_map[key] === undefined) {
						var entry = new Entry(info, data);
						custom_links_map[key] = entry;
						add_gallery(1, entry, index, true);
					}
				}
			});
		};

		var on_option_change = {
			sort_by: function () {
				settings.sort_by = this.value;
				settings_save();
				update_ordering();
			},
			group_by_category: function () {
				settings.group_by_category = this.checked;
				settings_save();
				update_ordering();
			},
			group_by_filters: function () {
				settings.group_by_filters = this.checked;
				settings_save();
				update_ordering();
			},
			display_mode: function () {
				settings.display_mode = parseInt(this.value, 10) || 0;
				settings_save();
				update_display_mode(false);
			},
			filter_visibility: function () {
				settings.filter_visibility = parseInt(this.value, 10) || 0;
				settings_save();
				update_ordering();
			},
			custom_filters: function () {
				if (settings.custom_filters !== this.value) {
					settings.custom_filters = this.value;
					settings_save();
					load_filters();
					update_all_filters();
				}
			},
			custom_filters_input: function () {
				var node = this;
				if (on_option_change.custom_filters_input_delay_timer !== null) {
					clearTimeout(on_option_change.custom_filters_input_delay_timer);
				}
				on_option_change.custom_filters_input_delay_timer = setTimeout(
					function () {
						on_option_change.custom_filters_input_delay_timer = null;
						on_option_change.custom_filters.call(node);
					},
					1000
				);
			},
			custom_filters_input_delay_timer: null,
			custom_links: function () {
				var t = this.value.trim();
				if (t !== custom_links_text) {
					enable_custom_links(t);
				}
			},
			custom_links_input: function () {
				var node = this;
				if (on_option_change.custom_links_input_delay_timer !== null) {
					clearTimeout(on_option_change.custom_links_input_delay_timer);
				}
				on_option_change.custom_links_input_delay_timer = setTimeout(
					function () {
						on_option_change.custom_links_input_delay_timer = null;
						on_option_change.custom_links.call(node);
					},
					1000
				);
			},
			custom_links_input_delay_timer: null
		};
		var on_gallery_mouseover = $.wrap_mouseenterleave_event(function () {
			$.off(this, "mouseover", on_gallery_mouseover);

			var node = this,
				id, entry, data;

			if (
				(id = this.getAttribute("data-xl-id")) &&
				(entry = data_map[id]) !== undefined &&
				(data = API.get_data(entry.info)) !== null
			) {
				API.get_ehentai_gallery_full(entry.info, data, function (err, data) {
					var tags_container, n;

					if (
						err === null &&
						(tags_container = $(".xl-easylist-item-tags", node)) !== null
					) {
						n = create_full_tags(data, entry.info);
						tags_container.textContent = "";
						$.add(tags_container, n);

						update_filters(node, data, false, true);
					}
				});
			}
		});
		var on_thumbnail_error = function () {
			$.off(this, "error", on_thumbnail_error);

			var par = this.parentNode;
			if (par === null) return;
			par.style.width = "100%";
			par.style.height = "100%";
			this.style.visibility = "hidden";
		};
		var on_linkify = function (event) {
			add_links([ event.link ]);
		};
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
		};
		var on_open_click = function (event) {
			if ($.is_left_mouse(event)) {
				open();

				event.preventDefault();
				return false;
			}
		};
		var on_close_click = function (event) {
			if ($.is_left_mouse(event)) {
				close();

				event.preventDefault();
				return false;
			}
		};
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
		};
		var on_options_click = function (event) {
			if ($.is_left_mouse(event)) {
				set_options_visible(!get_options_visible());

				event.preventDefault();
				return false;
			}
		};
		var on_overlay_click = function (event) {
			if ($.is_left_mouse(event)) {
				close();

				event.preventDefault();
				return false;
			}
		};

		// Public
		var get_saved_settings = function () {
			return $.json_parse_safe(Config.storage.getItem(settings_key), null);
		};
		var set_saved_settings = function (data) {
			if (data === null) {
				Config.storage.removeItem(settings_key);
			}
			else {
				Config.storage.setItem(settings_key, JSON.stringify(data));
			}
		};
		var ready = function () {
			Navigation.insert_link("normal", "Easy List", Main.homepage, " xl-nav-link-easylist", on_open_click);

			HeaderBar.insert_shortcut_icon(
				"panda",
				"#TITLE# Easy List",
				Main.homepage,
				on_toggle_click,
				function (svg, svgns) {
					var path = $.node_ns(svgns, "path", "xl-header-bar-svg-panda-path");
					path.setAttribute("d",
						"M 16.633179,51.146308 c 3.64987,0.96291 4.964143,6.353343 5.848553,6.951214 1.803534,1.219209 16.129984,0.579826 16.129984,0.579826 1.197865,-11.724731 1.212833,-8.671318 2.95548,-16.59613 -1.989075,-1.34607 -5.333693,-2.23712 -5.797288,-4.88791 -0.463595,-2.65078 0.255088,-2.142681 0.187543,-6.314371 -1.439647,-2.768736 -2.204016,-6.03551 -2.500789,-9.43479 -3.024907,-1.751033 -6.026517,-0.494694 -6.433955,-5.297229 -0.353512,-4.166916 6.132756,-5.138818 9.747309,-7.5194007 7.077373,-8.28015298 12.684056,-7.86614927 18.26733,-7.86614927 5.583275,0 12.190976,3.76366917 17.585988,11.22034497 6.53222,9.028459 10.674317,18.629087 14.466281,30.044847 3.791954,11.41577 4.453617,21.459054 1.537854,31.769198 2.36821,0.77671 4.928378,1.009485 5.226735,3.950385 0.298366,2.94089 -1.267399,5.363996 -3.607729,5.963956 -2.34033,0.59995 -4.60182,-0.139224 -6.646539,-0.619694 -3.86217,3.77416 -9.011474,7.538043 -17.479555,9.177123 -8.468078,1.63908 -26.453377,6.593222 -32.623916,6.30881 C 27.325926,98.291926 26.634713,94.42266 25.658825,90.03441 24.682937,85.64616 25.403148,82.440968 25.465957,78.696308 19.909553,79.123928 11.055576,79.654646 9.0799525,78.775913 5.9995252,77.405776 4.2346784,69.110754 5.7658643,59.974024 6.9338652,53.004454 12.660658,50.22377 16.633179,51.146308 z " +
						"M 47.316173,40.278702 c -1.977441,10.244331 -5.318272,21.474541 -5.662805,29.784036 -0.242507,5.848836 2.420726,7.5586 5.348383,2.078223 5.586237,-10.45706 7.896687,-21.139251 10.839979,-32.018641 -1.376342,0.732535 -2.33581,0.805482 -3.567752,1.104816 2.20065,-1.826801 1.797963,-1.259845 4.683397,-4.356147 3.702042,-3.972588 11.505701,-7.842675 15.187296,-4.490869 4.597776,4.185917 3.4537,13.920509 -0.431829,18.735387 -1.301987,5.219157 -3.278232,10.993981 -4.691055,14.211545 1.650129,0.951997 7.1775,2.647886 8.723023,6.808838 1.818473,4.895806 0.447993,8.335081 -3.207776,12.929618 8.781279,-6.214409 9.875004,-12.24852 10.586682,-20.251062 C 85.596887,59.244915 85.615915,54.42819 83.82437,47.181873 82.032825,39.935556 77.484187,30.527275 73.806105,23.780748 70.128023,17.034221 68.465076,12.376515 60.467734,7.5782428 54.534892,4.0186364 44.006601,5.3633006 39.960199,11.716546 c -4.046402,6.353245 -2.052295,11.417199 0.339979,17.673546 -0.06795,1.969646 -1.145015,4.295256 0.105508,5.751383 1.875243,-0.914979 2.772108,-1.957655 4.421995,-2.639606 -0.01451,1.529931 0.320921,4.192236 -1.17535,5.722167 1.758316,1.116252 1.80495,1.414307 3.663842,2.054666 z"
					);
					$.add(svg, path);
				}
			);
		};
		var open = function () {
			if (popup === null) {
				settings_load();
				create();
			}

			add_links(Linkifier.get_links_formatted());
			Linkifier.on("format", on_linkify);

			Popup.open(popup);
			$.scroll_focus(popup);
		};
		var close = function () {
			Popup.close(popup);

			set_options_visible(false);

			Linkifier.off("format", on_linkify);
		};
		var is_open = function () {
			return (popup !== null && Popup.is_open(popup));
		};

		// Exports
		return {
			get_saved_settings: get_saved_settings,
			set_saved_settings: set_saved_settings,
			ready: ready,
			open: open,
			close: close,
			is_open: is_open
		};

	})();
	var Popup = (function () {

		// Private
		var active = null,
			hovering_container = null;

		var on_stop_propagation = function (event) {
			if ($.is_left_mouse(event)) {
				event.stopPropagation();
			}
		};
		var on_overlay_event = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();
				event.stopPropagation();
				return false;
			}
		};

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
		};
		var open = function (overlay) {
			if (active !== null && active.parentNode !== null) {
				$.remove(active);
			}
			d.documentElement.classList.add("xl-popup-overlaying");
			hovering(overlay);
			active = overlay;
		};
		var close = function (overlay) {
			d.documentElement.classList.remove("xl-popup-overlaying");
			if (overlay.parentNode !== null) {
				$.remove(overlay);
			}
			active = null;
		};
		var is_open = function (overlay) {
			return (overlay.parentNode !== null);
		};
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
		};

		// Exports
		return {
			create: create,
			open: open,
			close: close,
			is_open: is_open,
			hovering: hovering
		};

	})();
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
		};
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
		};
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
				},
				onerror: function () {
					callback.call(null, "Connection error", null);
				},
				onabort: function () {
					callback.call(null, "Connection aborted", null);
				}
			});
		};

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
		};
		var on_close_click = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();
				close();
			}
		};
		var on_change_save = function () {
			config.general.changelog_on_update = this.checked;
			Config.save();
		};

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
					$.add(container, $.link(Main.homepage, "xl-settings-title" + theme, "#TITLE#"));
					if (message !== null) {
						$.add(container, $.node("span", "xl-settings-title-info" + theme, message));
						if (/\s+$/.test(message)) {
							cls = " xl-settings-version-large";
						}
					}
					$.add(container, $.link(Module.url, "xl-settings-version" + cls + theme, Main.version.join(".")));
				}
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
				}
			}], {
				body: true,
				padding: false,
				setup: function (container) {
					container.classList.add("xl-changelog-content");
					display(container, theme);
				}
			}]);

			$.on(popup, "click", on_close_click);
			Popup.open(popup);
		};
		var close = function () {
			if (popup !== null) {
				Popup.close(popup);
				popup = null;
			}
		};

		// Exports
		var Module = {
			url: "#CHANGELOG#",
			open: open,
			close: close
		};

		return Module;

	})();
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
		};

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
		};
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
		});
		var on_icon_mouseout = $.wrap_mouseenterleave_event(function () {
			var n = $("svg", this);
			if (n !== null) {
				n.style.fill = this.getAttribute("data-xl-color");
			}
		});
		var on_menu_item_mouseover = $.wrap_mouseenterleave_event(function () {
			var entries = $$(".entry", this.parent),
				i, ii;
			for (i = 0, ii = entries.length; i < ii; ++i) {
				entries[i].classList.remove("focused");
			}
			this.classList.add("focused");
		});
		var on_menu_item_mouseout = $.wrap_mouseenterleave_event(function () {
			this.classList.remove("focused");
		});
		var on_menu_item_click = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();
				d.documentElement.click();
			}
		};
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
		};
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
		};

		// Public
		var ready = function () {
			var n = $("#header-bar");
			if (n !== null) {
				on_header_bar_detected(n);
			}
			else {
				new MutationObserver(on_body_observe).observe(d.body, { childList: true, subtree: false });
			}
		};
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
		};
		var insert_menu_link = function (menu_node) {
			menu_node.classList.add("entry");
			menu_node.style.order = 112;

			$.on(menu_node, "mouseover", on_menu_item_mouseover);
			$.on(menu_node, "mouseout", on_menu_item_mouseout);
			$.on(menu_node, "click", on_menu_item_click);

			menu_nodes.push(menu_node);
		};

		// Exports
		return {
			ready: ready,
			insert_shortcut_icon: insert_shortcut_icon,
			insert_menu_link: insert_menu_link
		};

	})();
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
			}
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
		};

		var LocationData = function (text, url, class_name, on_click) {
			this.nodes = [];
			this.text = text;
			this.url = url;
			this.class_name = class_name;
			this.on_click = on_click;
		};
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
		};
		LocationData.prototype.add_node = function (node, flags, separator) {
			this.nodes.push(node, flags, separator);
		};
		LocationData.prototype.add_all = function (selector, flags, separator) {
			var nodes = $$(selector),
				i, ii;

			for (i = 0, ii = nodes.length; i < ii; ++i) {
				this.nodes.push(nodes[i], flags, separator);
			}
		};
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
		};

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
		};

		// Exports
		return {
			insert_link: insert_link
		};

	})();
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
		};

		var is_object = function (obj) {
			return (obj !== null && typeof(obj) === "object");
		};

		var get_shared_node = function (selector) {
			var par, n;

			if (
				selector === null ||
				(par = $(".xl-extension-sharing-elements")) === null
			) {
				return null;
			}

			try {
				n = $("[data-xl-sharing-id='" + selector + "']", par);
			}
			catch (e) {
				return null;
			}

			if (n !== null) {
				n.removeAttribute("data-xl-sharing-id");
				$.remove(n);
				if (par.firstChild === null) $.remove(par);
			}
			return n;
		};

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
			};
			window.addEventListener("message", this.on_window_message_bind, false);
		};
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
						this.send(this.action, { err: "Invalid extension call" }, this.reply_id);
					}
				}

				this.registration = null;
				this.reply_id = null;
			}

			this.action = null;
			this.api_key = null;
			this.api_name = null;
		};
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
				extension: false,
				id: id,
				reply: reply_to || null,
				key: this.api_key,
				name: this.api_name,
				data: data
			}, this.origin);
		};
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
						retry_count: this.retry_count
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
			};
		};
		ExtensionAPI.prototype.request_api_fn_callback = function (callback) {
			return function (err, data) {
				var args;
				if (err !== null) {
					callback.call(null, err, null);
				}
				else if (!is_object(data) || !Array.isArray((args = data.args))) {
					callback.call(null, "Invalid extension response", null);
				}
				else {
					args = JSON.parse(JSON.stringify(args));
					callback.apply(null, args);
				}
			};
		};
		ExtensionAPI.prototype.register_settings = function (reg_info) {
			var response = {},
				name, default_value, title, description, descriptor,
				res, value, k, i, ii, a, v;

			if (is_object(reg_info)) {
				for (k in reg_info) {
					a = reg_info[k];
					if (!Array.isArray(a)) continue;

					response[k] = res = {};
					for (i = 0, ii = a.length; i < ii; ++i) {
						v = a[i];
						if (!Array.isArray(v) || typeof((name = v[0])) !== "string") continue;

						default_value = v[1];
						if (default_value === undefined) default_value = null;
						title = v[2];
						if (typeof(title) !== "string") title = name;
						description = v[3];
						if (typeof(description) !== "string") description = "";
						descriptor = this.register_settings_descriptor_info(v[4]);

						value = Config.register_custom_setting(k, name, default_value, title, description, descriptor);
						if (value === undefined) {
							value = config[k][name];
						}

						res[name] = value;
					}
				}
			}

			return response;
		};
		ExtensionAPI.prototype.register_settings_descriptor_info = function (input) {
			if (!is_object(input)) return null;

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
		ExtensionAPI.prototype.register_request_api = function (reg_info) {
			if (!is_object(reg_info)) return "Invalid";

			var req_group = "other",
				req_namespace = "other",
				req_type = "other",
				req_count = 1,
				req_concurrent = 1,
				req_delay_okay = 200,
				req_delay_error = 5000,
				req_functions = {},
				req_function_ids = {},
				fns, fn_id, req, i, ii, k, o, v;

			// Settings
			if (typeof((v = reg_info.group)) === "string") req_group = v;
			if (typeof((v = reg_info.namespace)) === "string") req_namespace = v;
			if (typeof((v = reg_info.type)) === "string") req_type = v;
			if (typeof((v = reg_info.count)) === "number") req_count = Math.max(1, v);
			if (typeof((v = reg_info.concurrent)) === "number") req_concurrent = Math.max(1, v);
			if (typeof((v = reg_info.delay_okay)) === "number") req_delay_okay = Math.max(0, v);
			if (typeof((v = reg_info.delay_error)) === "number") req_delay_error = Math.max(0, v);

			// Functions
			if (Array.isArray((fns = reg_info.functions))) {
				for (i = 0, ii = fns.length; i < ii; ++i) {
					v = fns[i];
					if (Object.prototype.hasOwnProperty.call(ExtensionAPI.request_api_functions, v)) {
						fn_id = random_string(32);
						req_functions[ExtensionAPI.request_api_functions[v]] = this.request_api_fn(fn_id, v);
						req_function_ids[v] = fn_id;
					}
				}
			}

			// Validate
			for (i = 0, ii = ExtensionAPI.request_api_functions_required.length; i < ii; ++i) {
				if (!Object.prototype.hasOwnProperty.call(req_functions, ExtensionAPI.request_api_functions_required[i])) break;
			}
			if (i < ii) return "Missing functions";

			// Check to see if the namespace/type is unique
			if (
				(o = this.request_apis[req_namespace]) !== undefined &&
				o[req_type] !== undefined
			) {
				return "Already exists";
			}

			// Create
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

			if (o === undefined) {
				this.request_apis[req_namespace] = o = {};
			}
			o[req_type] = {
				req: req,
				api_name: this.api_name,
				api_key: this.api_key
			};

			return req_function_ids;
		};
		ExtensionAPI.prototype.register_linkifier = function (reg_info) {
			if (!is_object(reg_info)) return "Invalid";

			var regex,
				prefix_group = 0,
				prefix = "",
				flags, v, v2;

			// Regex
			if (
				!Array.isArray((v = reg_info.regex)) ||
				typeof((v2 = v[0])) !== "string"
			) {
				return "Invalid regex";
			}
			if (typeof((flags = v[1])) === "string") {
				if (flags.indexOf("g") < 0) flags += "g";
			}
			else {
				flags = "g";
			}
			regex = $.create_regex_safe(v2, flags);
			if (regex === null) return "Invalid regex";

			// Prefix
			if (typeof((v = reg_info.prefix_group)) === "number") prefix_group = v;
			if (typeof((v = reg_info.prefix)) === "string") prefix = v;

			// Register
			Linkifier.linkify_register(regex, prefix_group, prefix, null, null);
			return null;
		};
		ExtensionAPI.prototype.register_command = function (reg_info) {
			if (!is_object(reg_info) || reg_info.url_info !== true || reg_info.to_data !== true) {
				return "Invalid";
			}

			var id_data = { id: random_string(32), url: null },
				index;

			index = API.register_url_info_function(
				this.register_command_fn("url_info", id_data, 1000),
				this.register_command_fn("url_info_to_data", id_data, -1)
			);

			if (reg_info.details === true) {
				UI.register_details_creation(index, this.register_details_actions_fn("create_details", { id: id_data.id, info: null, data: null }, ExtensionAPI.details_validator));
			}
			if (reg_info.actions === true) {
				UI.register_actions_creation(index, this.register_details_actions_fn("create_actions", { id: id_data.id, info: null, data: null }, ExtensionAPI.actions_validator));
			}

			return id_data;
		};
		ExtensionAPI.prototype.register_command_fn = function (event, send_data, delay) {
			var api_name = this.api_name,
				api_key = this.api_key,
				self = this;

			return function (url_info, cb) {
				var d = self.timeout_delay;
				self.timeout_delay = delay;
				self.api_name = api_name;
				self.api_key = api_key;

				send_data.url = url_info;

				self.send(event, send_data, null, function (err, data) {
					if (err !== null) {
						cb(err, null);
					}
					else if (!is_object(data)) {
						cb("Invalid extension data", null);
					}
					else if ((err = data.err) !== null) {
						cb(err, null);
					}
					else if (!is_object(data.data)) {
						cb("Invalid extension data", null);
					}
					else {
						cb(null, data.data);
					}
				});

				self.api_name = null;
				self.api_key = null;
				self.timeout_delay = d;
			};
		};
		ExtensionAPI.prototype.register_details_actions_fn = function (event, send_data, validator) {
			var api_name = this.api_name,
				api_key = this.api_key,
				self = this;

			return function (data, info, cb) {
				self.api_name = api_name;
				self.api_key = api_key;

				send_data.data = data;
				send_data.info = info;

				self.send(event, send_data, null, function (err, data) {
					if (err !== null) {
						cb(err, null);
					}
					else if (!is_object(data)) {
						cb("Invalid extension data", null);
					}
					else if ((err = data.err) !== null) {
						cb(err, null);
					}
					else {
						validator(data.data, cb);
					}
				});

				self.api_name = null;
				self.api_key = null;
			};
		};

		ExtensionAPI.details_validator = function (data, cb) {
			if (typeof(data) !== "string") {
				cb("Invalid extension response", null);
			}
			else {
				data = get_shared_node(data);
				if (data === null) {
					cb("Invalid extension node", null);
				}
				else {
					cb(null, data);
				}
			}
		};
		ExtensionAPI.actions_validator = function (data, cb) {
			if (!Array.isArray(data)) {
				cb("Invalid extension response", null);
			}
			else {
				var response = [],
					d, i, ii;

				for (i = 0, ii = data.length; i < ii; ++i) {
					d = data[i];
					if (d === null || Array.isArray(d)) {
						response.push(d);
					}
				}

				cb(null, response);
			}
		};

		ExtensionAPI.request_api_functions_required = [
			"setup_xhr",
			"parse_response"
		];
		ExtensionAPI.request_api_functions = {
			get_data: "get_data",
			set_data: "set_data",
			setup_xhr: "setup_xhr",
			parse_response: "parse_response"
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
						reply_data = {
							key: reply_key,
							cache_prefix: API.cache_get_prefix(),
							cache_mode: config.debug.cache_mode
						};
						break;
					}
				}

				this.send(this.action, reply_data, this.reply_id);
			},
		};
		ExtensionAPI.handlers = {
			register: function (data) {
				if (!is_object(data)) {
					// Failure
					this.send(this.action, { err: "Invalid extension data" }, this.reply_id);
					return;
				}

				// Register
				var response = {
						settings: null,
						request_apis: [],
						linkifiers: [],
						commands: [],
					},
					de = document.documentElement,
					complete = false,
					k, o, i, ii;

				// Decrease register count
				if (de) {
					k = "data-xlinks-extensions-waiting";
					o = de.getAttribute(k);
					if (o) {
						o = (parseInt(o, 10) || 0) - 1;
						if (o > 0) {
							de.setAttribute(k, o);
						}
						else {
							de.removeAttribute(k);
							complete = true;
						}
					}
				}

				// Settings
				response.settings = this.register_settings(data.settings);

				// Request APIs
				if (Array.isArray((o = data.request_apis))) {
					for (i = 0, ii = o.length; i < ii; ++i) {
						response.request_apis.push(this.register_request_api(o[i]));
					}
				}

				// Linkifiers
				if (Array.isArray((o = data.linkifiers))) {
					for (i = 0, ii = o.length; i < ii; ++i) {
						response.linkifiers.push(this.register_linkifier(o[i]));
					}
				}

				// URL info function
				if (Array.isArray((o = data.commands))) {
					for (i = 0, ii = o.length; i < ii; ++i) {
						response.commands.push(this.register_command(o[i]));
					}
				}

				// Okay
				this.send(this.action, {
					err: null,
					response: response
				}, this.reply_id);

				// Done
				Main.start_processing(!complete);
			},
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
					this.send(this.action, { err: "Invalid extension data" }, this.reply_id);
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
				});
			},
		};

		var api_request_init_fn = function (req) {
			req.data = {
				id: random_string(32),
				sent: false
			};
		};
		var create_api_request_complete_fn = function (api_name, api_key) {
			return function (req) {
				api.api_name = api_name;
				api.api_key = api_key;
				api.send("request_end", { id: req.data.id });
				api.api_name = null;
				api.api_key = null;
			};
		};


		// Public
		var init = function () {
			if (api === null) api = new ExtensionAPI();
		};

		var request = function (namespace, type, unique_id, info, callback) {
			var req_data;
			if (
				api === null ||
				(req_data = api.request_apis[namespace]) === undefined ||
				(req_data = req_data[type]) === undefined
			) {
				callback.call(null, "Invalid extension request API", null);
				return;
			}

			return req_data.req.add(unique_id, info, false, callback);
		};

		var should_defer_processing = function () {
			return document.documentElement.hasAttribute("data-xlinks-extensions-waiting");
		};


		// Exports
		return {
			init: init,
			request: request,
			should_defer_processing: should_defer_processing
		};

	})();
	var Main = (function () {

		// Private
		var fonts_inserted = false,
			all_posts_reloaded = false,
			processing_started = false,
			processing_start_timer = null;

		var reload_all_posts = function () {
			if (all_posts_reloaded) return;
			all_posts_reloaded = true;

			Linkifier.relinkify_posts(Post.get_all_posts(d));
		};

		var on_ready = function () {
			Debug.timer("init");

			if (!Config.ready()) return;
			Settings.ready();

			var style = $.node_simple("style");

			style.textContent = "#STYLESHEET#";
			$.add(d.head, style);

			Theme.ready();
			EasyList.ready();

			Debug.timer_log("init.ready duration", "init");

			start_processing(ExtensionAPI.should_defer_processing());

			HeaderBar.ready();

			if (Module.version_change === 1 && config.general.changelog_on_update) {
				Changelog.open(" updated to ");
			}

			Debug.timer_log("init.ready.full duration", "init");
		};
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
		};
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
		};
		var is_post_group_container = function (node) {
			return node.id === "qp" || node.classList.contains("thread") || node.classList.contains("inline");
		};

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
		};
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
		};
		var insert_custom_fonts = function () {
			if (fonts_inserted) return;
			fonts_inserted = true;

			if (!config.general.external_resources) return;

			var font = $.node_simple("link");
			font.rel = "stylesheet";
			font.type = "text/css";
			font.href = "//fonts.googleapis.com/css?family=Source+Sans+Pro:900";
			$.add(d.head, font);
		};
		var start_processing = function (defer) {
			if (processing_started) return;

			// Stop timer
			if (processing_start_timer !== null) {
				clearTimeout(processing_start_timer);
				processing_start_timer = null;
			}

			if (defer) {
				// Wait
				processing_start_timer = setTimeout(function () {
					start_processing(false);
				}, 5000);
			}
			else {
				// Start processing
				processing_started = true;

				Linkifier.queue_posts(Post.get_all_posts(d), Linkifier.queue_posts.Flags.UseDelay);

				if (Config.dynamic) {
					var updater = new MutationObserver(on_body_observe);
					updater.observe(d.body, { childList: true, subtree: true });
				}
			}
		};

		// Exports
		var Module = {
			homepage: "#HOMEPAGE#",
			version: [/*#VERSION#*/],
			version_change: 0,
			init: init,
			version_compare: version_compare,
			insert_custom_fonts: insert_custom_fonts,
			start_processing: start_processing
		};

		return Module;

	})();

	Main.init();
	Debug.timer_log("init.full duration", timing.start);

})();

