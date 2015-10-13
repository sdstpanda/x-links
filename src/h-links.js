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
	var categories = {
		"Artist CG Sets": { "short": "artistcg",  "name": "Artist CG"  },
		"Asian Porn":     { "short": "asianporn", "name": "Asian Porn" },
		"Cosplay":        { "short": "cosplay",   "name": "Cosplay"    },
		"Doujinshi":      { "short": "doujinshi", "name": "Doujinshi"  },
		"Game CG Sets":   { "short": "gamecg",    "name": "Game CG"    },
		"Image Sets":     { "short": "imageset",  "name": "Image Set"  },
		"Manga":          { "short": "manga",     "name": "Manga"      },
		"Misc":           { "short": "misc",      "name": "Misc"       },
		"Non-H":          { "short": "non-h",     "name": "Non-H"      },
		"Private":        { "short": "private",   "name": "Private"    },
		"Western":        { "short": "western",   "name": "Western"    }
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
				"Use Extenral Resources"
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
		details: [
			[ "enabled", true,
				"Enabled", "Show details for gallery links on hover",
				"Gallery Details"
			],
			[ "extended_info", true,
				"Extended info", "Fetch complete gallery info for E*Hentai, including tag namespaces",
				"Extended Info"
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

	var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver || null;
	var $$ = function (selector, root) {
		return (root || d).querySelectorAll(selector);
	};
	var $ = (function () {

		// Inspired by 4chan X and jQuery API: https://api.jquery.com/ (functions are not chainable)
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
			timer_names = {};
			log = function () {
				var args = [ "#TITLE# " + Main.version.join(".") + ":" ].concat(Array.prototype.slice.call(arguments));
				console.log.apply(console, args);
			};
			Debug.log = log;
			Debug.timer = function (name, dont_format) {
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
			log: log,
			timer: dummy_fn,
			timer_log: timer_log,
			init: init
		};

		return Module;

	})();
	var Helper = (function () {

		// Private
		var re_full_domain = /^(?:[\w\-]+):\/*([\w\-]+(?:\.[\w\-]+)*)/i,
			re_short_domain = /^(?:[\w\-]+):\/*(?:[\w-]+\.)*([\w-]+\.[\w]+)/i,
			re_change_domain = /^([\w\-]+:\/*)([\w\-]+(?:\.[\w\-]+)*)([\w\W]*)$/i;

		// Public
		var regex_escape = function (text) {
			return text.replace(/[\$\(\)\*\+\-\.\/\?\[\\\]\^\{\|\}]/g, "\\$&");
		};
		var json_parse_safe = function (text, def) {
			try {
				return JSON.parse(text);
			}
			catch (e) {
				return def;
			}
		};
		var html_parse_safe = function (text, def) {
			try {
				return (new DOMParser()).parseFromString(text, "text/html");
			}
			catch (e) {
				return def;
			}
		};
		var get_url_info = function (url) {
			var match = /^(https?):\/*((?:[\w-]+\.)*)([\w-]+\.[\w]+)((?:[\/\?\#][\w\W]*)?)/.exec(url),
				domain, remaining, m;

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
				m = /^\/g\/(\d+)/.exec(remaining);
				if (m !== null) {
					return {
						site: "nhentai",
						type: "gallery",
						gid: parseInt(m[1], 10),
						domain: domain
					};
				}
			}
			else if (domain === domains.hitomi) {
				m = /^\/(?:galleries|reader|smalltn)\/(\d+)/.exec(remaining);
				if (m !== null) {
					return {
						site: "hitomi",
						type: "gallery",
						gid: parseInt(m[1], 10),
						domain: domain
					};
				}
			}

			return null;
		};
		var get_full_domain = function (url) {
			var m = re_full_domain.exec(url);
			return (m === null) ? "" : m[1];
		};
		var get_domain = function (url) {
			var m = re_short_domain.exec(url);
			return (m === null) ? "" : m[1].toLowerCase();
		};
		var change_url_domain = function (url, new_domain) {
			var m = re_change_domain.exec(url);
			return (m === null) ? url : m[1] + new_domain + m[3];
		};
		var title_case = function (text) {
			return text.replace(/\b\w/g, function (m) {
				return m.toUpperCase();
			});
		};
		var category = function (name) {
			var c = categories[name];
			return (c !== undefined) ? c : categories.Misc;
		};

		var get_id_from_node = function (node) {
			var a = node.getAttribute("data-hl-id"),
				i;
			return (a && (i = a.indexOf("_")) >= 0) ? [ a.substr(0, i), a.substr(i + 1) ] : null;
		};
		var get_id_from_node_full = function (node) {
			return node.getAttribute("data-hl-id") || "";
		};
		var get_info_from_node = function (node) {
			var attr = node.getAttribute("data-hl-info");
			try {
				return JSON.parse(attr);
			}
			catch (e) {}
			return null;
		};
		var get_tag_button_from_link = function (node) {
			// Assume the button is the previous (or previous-previous) sibling
			if (
				(node = node.previousSibling) !== null &&
				(node.classList || ((node = node.previousSibling) !== null && node.classList)) &&
				node.classList.contains("hl-site-tag")
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
				node.classList.contains("hl-linkified-gallery")
			) {
				return node;
			}
			return null;
		};
		var get_exresults_from_exsauce = function (node) {
			var container = Post.get_post_container(node);

			if (
				container !== null &&
				(node = $(".hl-exsauce-results[data-hl-image-index='" + node.getAttribute("data-hl-image-index") + "']", container)) !== null &&
				Post.get_post_container(node) === container
			) {
				return node;
			}

			return null;
		};

		// Exports
		return {
			regex_escape: regex_escape,
			json_parse_safe: json_parse_safe,
			html_parse_safe: html_parse_safe,
			get_url_info: get_url_info,
			get_full_domain: get_full_domain,
			get_domain: get_domain,
			change_url_domain: change_url_domain,
			title_case: title_case,
			category: category,
			get_id_from_node: get_id_from_node,
			get_id_from_node_full: get_id_from_node_full,
			get_info_from_node: get_info_from_node,
			get_tag_button_from_link: get_tag_button_from_link,
			get_link_from_tag_button: get_link_from_tag_button,
			get_exresults_from_exsauce: get_exresults_from_exsauce
		};

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
			"4chan": ".postContainer:not(.hl-fake-post),.post.inlined:not(.hl-fake-post),#quote-preview",
			"foolz": "article:not(.backlink_container)",
			"fuuka": ".content>div[id],.content>table",
			"tinyboard": ".post:not(.hl-fake-post)"
		};
		var post_body_selector = {
			"4chan": "blockquote",
			"foolz": ".text",
			"fuuka": "blockquote>p",
			"tinyboard": ".body"
		};
		var body_links_selector = {
			"4chan": "a:not(.quotelink)",
			"foolz": "a:not(.backlink)",
			"fuuka": "a:not(.backlink)",
			"tinyboard": "a:not([onclick])"
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
			"tinyboard": belongs_to_default
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
			"tinyboard": create_image_meta_link_default
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
				return "http://" + domain_info[domain].g_domain + "/g/" + data.gid + "/" + data.token + "/";
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
				return "http://" + domain_info[domain].g_domain + "/uploader/" + (data.uploader || "Unknown").replace(/\s+/g, "+");
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
				return "http://" + domain_info[domain].g_domain + "/" + Helper.category(data.category).short;
			},
			nhentai: function (data) {
				return "http://" + domains.nhentai + "/category/" + data.category.toLowerCase() + "/";
			},
			hitomi: function (data) {
				return "https://" + domains.hitomi + "/type/" + data.category.toLowerCase() + "-all-1.html";
			}
		};
		var to_tag = {
			ehentai: function (tag, full_domain) {
				return "http://" + full_domain + "/tag/" + tag.replace(/\s+/g, "+");
			},
			nhentai: function (tag, full_domain) {
				return "http://" + full_domain + "/tag/" + tag.replace(/\s+/g, "-") + "/";
			},
			hitomi: function (tag, full_domain) {
				return "https://" + full_domain + "/tag/" + tag + "-all-1.html";
			}
		};
		var to_tag_ns = {
			ehentai: function (tag, namespace, full_domain) {
				return "http://" + full_domain + "/tag/" + namespace + ":" + tag.replace(/\s+/g, "+");
			},
			nhentai: function (tag, namespace, full_domain) {
				if (namespace === "tags") namespace = "tag";
				return "http://" + full_domain + "/" + namespace + "/" + tag.replace(/\s+/g, "-") + "/";
			},
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
			}
		};

		// Exports
		return {
			to_gallery: function (data, domain) {
				var type = domain_info[domain].type;
				return to_gallery[type].call(null, data, domain);
			},
			to_uploader: function (data, domain) {
				var type = domain_info[domain].type;
				return to_uploader[type].call(null, data, domain);
			},
			to_category: function (data, domain) {
				var type = domain_info[domain].type;
				return to_category[type].call(null, data, domain);
			},
			to_tag: function (tag, domain_type, full_domain) {
				return to_tag[domain_type].call(null, tag, full_domain);
			},
			to_tag_ns: function (tag, namespace, domain_type, full_domain) {
				return to_tag_ns[domain_type].call(null, tag, namespace, full_domain);
			}
		};

	})();
	var HttpRequest = (function () {
		try {
			if (GM_xmlhttpRequest && typeof(GM_xmlhttpRequest) === "function") {
				return function (data) {
					Debug.log("HttpRequest:", data.method, data.url, data);
					return GM_xmlhttpRequest(data);
				};
			}
		}
		catch (e) {}

		// Fallback
		return function (data) {
			Debug.log("HttpRequest:", data.method, data.url, data);
			var onerror = (data && data.onerror && typeof(data.onerror) === "function") ? data.onerror : null;
			setTimeout(function () {
				if (onerror !== null) {
					onerror.call(null, {});
				}
			}, 10);
		};
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
			mouseover: function (event) {
				var full_id = Helper.get_id_from_node_full(this),
					details = details_nodes[full_id],
					domain, data, id;

				if (details === undefined) {
					id = Helper.get_id_from_node(this);
					if (
						id === null ||
						!Database.valid_namespace(id[0]) ||
						(data = Database.get(id[0], id[1])) === null ||
						!((domain = Helper.get_domain(this.href)) in domain_info)
					) {
						return;
					}

					details = create_details(data, domain);
					details_nodes[full_id] = details;
				}

				details.classList.remove("hl-details-hidden");

				gallery_link_events_data.link = this;
				gallery_link_events_data.mouse_x = event.clientX;
				gallery_link_events_data.mouse_y = event.clientY;

				update_details_position(details, this, event.clientX, event.clientY);
			},
			mouseout: function () {
				var full_id = Helper.get_id_from_node_full(this),
					details = details_nodes[full_id],
					domain, data, id;

				if (details === undefined) {
					id = Helper.get_id_from_node(this);
					if (
						id === null ||
						!Database.valid_namespace(id[0]) ||
						(data = Database.get(id[0], id[1])) === null ||
						!((domain = Helper.get_domain(this.href)) in domain_info)
					) {
						return;
					}

					details = create_details(data, domain);
					details_nodes[full_id] = details;
				}

				details.classList.add("hl-details-hidden");

				gallery_link_events_data.link = null;
			},
			mousemove: function (event) {
				var details = details_nodes[Helper.get_id_from_node_full(this)];

				if (details === undefined) return;

				gallery_link_events_data.mouse_x = event.clientX;
				gallery_link_events_data.mouse_y = event.clientY;

				update_details_position(details, this, event.clientX, event.clientY);
			}
		};

		var create_details = function (data, domain) {
			var g_domain = domain_info[domain].g_domain,
				category = Helper.category(data.category),
				theme = Theme.get(),
				file_size = (data.total_size / 1024 / 1024).toFixed(2),
				content, n1, n2, n3;

			// Body
			content = $.node("div", "hl-details hl-hover-shadow post reply post_wrapper hl-fake-post" + theme);
			content.setAttribute("data-hl-id", data.type + "_" + data.gid);

			// Image
			$.add(content, n1 = $.node("div", "hl-details-thumbnail" + theme));
			API.get_thumbnail(data, $.bind(function (err, url) {
				if (err === null) {
					this.style.backgroundImage = "url('" + url + "')";
				}
			}, n1));

			// Sidebar
			$.add(content, n1 = $.node("div", "hl-details-side-panel"));

			$.add(n1, n2 = $.node("div", "hl-button hl-button-eh hl-button-" + category.short + theme));
			$.add(n2, $.node("div", "hl-noise", category.name));

			if (data.rating >= 0) {
				$.add(n1, n2 = $.node("div", "hl-details-side-box hl-details-side-box-rating" + theme));
				$.add(n2, n3 = $.node("div", "hl-details-rating hl-stars-container"));
				$.add(n3, create_rating_stars(data.rating));
				$.add(n2, $.node("div", "hl-details-rating-text", "(Avg. " + data.rating.toFixed(2) + ")"));
			}

			$.add(n1, n2 = $.node("div", "hl-details-side-box hl-details-side-box-rating" + theme));
			$.add(n2, $.node("div", "hl-details-file-count", data.file_count + " image" + (data.file_count === 1 ? "" : "s")));
			if (data.total_size >= 0) {
				$.add(n2, $.node("div", "hl-details-file-size", "(" + file_size + " MB)"));
			}

			if (data.torrent_count >= 0) {
				$.add(n1, n2 = $.node("div", "hl-details-side-box hl-details-side-box-torrents" + theme));
				$.add(n2, n3 = $.node("div", "hl-details-side-box-inner"));
				$.add(n3, $.node("strong", "", "Torrents:"));
				$.add(n3, $.node("span", "", " " + data.torrent_count));
			}

			if (data.removed === true) {
				$.add(n1, n2 = $.node("div", "hl-details-side-box hl-details-side-box-visible" + theme));
				$.add(n2, n3 = $.node("div", "hl-details-side-box-inner"));
				$.add(n3, $.node("strong", "hl-details-side-box-error" + theme, "Removed"));
			}
			else if (data.visible !== null) {
				$.add(n1, n2 = $.node("div", "hl-details-side-box hl-details-side-box-visible" + theme));
				$.add(n2, n3 = $.node("div", "hl-details-side-box-inner"));
				$.add(n3, $.node("strong", "", "Visible:"));
				$.add(n3, $.node("span", "", data.visible ? " Yes" : " No"));
			}

			// Title
			$.add(content, n1 = $.node("div", "hl-details-title-container" + theme));
			$.add(n1, n2 = $.link("#", "hl-details-title" + theme, data.title));
			Filter.highlight("title", n2, data, Filter.None);
			if (data.title_jpn !== null) {
				$.add(n1, n2 = $.node("div", "hl-details-title-jp" + theme, data.title_jpn));
				Filter.highlight("title", n2, data, Filter.None);
			}

			// Upload info
			$.add(content, n1 = $.node("div", "hl-details-upload-info" + theme));
			$.add(n1, $.tnode("Uploaded by"));
			$.add(n1, n2 = $.node("strong", "hl-details-uploader", data.uploader));
			Filter.highlight("uploader", n2, data, Filter.None);
			$.add(n1, $.tnode("on"));
			$.add(n1, $.node("strong", "hl-details-upload-date", format_date(new Date(data.upload_date))));

			// Tags
			$.add(content, n1 = $.node("div", "hl-details-tag-block" + theme));
			$.add(n1, $.node("strong", "hl-details-tag-block-label", "Tags:"));
			$.add(n1, n2 = $.node("span", "hl-details-tags hl-tags"));
			n2.setAttribute("data-hl-id", data.type + "_" + data.gid);
			$.add(n2, create_tags_best(g_domain, data));

			// End
			$.add(content, $.node("div", "hl-details-clear"));

			// Full info
			if (config.details.extended_info && data.type === "ehentai" && !API.data_has_full(data)) {
				API.ehentai_get_full_info(data.gid, data.token, g_domain, function (err, data) {
					if (err === null) {
						update_full(data);
					}
					else {
						Debug.log("Error requesting full information: " + err);
					}
				});
			}

			// Fonts
			Main.insert_custom_fonts();
			Popup.hovering(content);
			return content;
		};
		var create_actions = function (data, link, index) {
			var theme = Theme.get(),
				domain = Helper.get_domain(link.href),
				g_domain = domain_info[domain].g_domain,
				gid = data.gid,
				token = data.token,
				type = data.type,
				actions = $.node("div", "hl-actions hl-hover-shadow" + theme),
				n1, n2, n3;

			$.add(actions, n1 = $.node("div", "hl-actions-inner" + theme));
			$.add(n1, n2 = $.node("div", "hl-actions-table" + theme));

			var gen_entry = function (container, label, url, text) {
				var n1, n2, n3;
				$.add(container, n1 = $.node("div", "hl-actions-table-row" + theme));
				$.add(n1, n2 = $.node("div", "hl-actions-table-cell" + theme));
				if (label !== null) $.add(n2, $.node("div", "hl-actions-table-header", label));
				$.add(n1, n2 = $.node("div", "hl-actions-table-cell" + theme));
				$.add(n2, n3 = $.link(url, "hl-actions-option" + theme, text));
				$.on(n3, "click", $.bind(on_actions_link_click, n3, actions, index));
				return n3;
			};
			var gen_sep = function (container) {
				var n1, n2;
				$.add(container, n1 = $.node("div", "hl-actions-table-row" + theme));
				$.add(n1, n2 = $.node("div", "hl-actions-table-cell" + theme));
				$.add(n2, $.node("div", "hl-actions-table-sep"));
			};

			if (type === "ehentai") {
				gen_entry(n2, "View on:", CreateURL.to_gallery(data, domains.ehentai), "E-Hentai");
				gen_entry(n2, null, CreateURL.to_gallery(data, domains.exhentai), "ExHentai");

				gen_sep(n2);

				n3 = gen_entry(n2, "Uploader:", CreateURL.to_uploader(data, domain), data.uploader);
				n3.classList.add("hl-actions-uploader");
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
		};
		var pad = function (n, sep) {
			return (n < 10 ? "0" : "") + n + sep;
		};
		var create_tags = function (site, data) {
			var tagfrag = d.createDocumentFragment(),
				domain = data.type,
				tags = data.tags,
				theme = Theme.get(),
				last = null,
				tag, link, i, ii;

			for (i = 0, ii = tags.length; i < ii; ++i) {
				tag = $.node("span", "hl-tag-block" + theme);
				link = $.link(CreateURL.to_tag(tags[i], domain, site), "hl-tag", tags[i]);

				Filter.highlight("tags", link, data, Filter.None);

				$.add(tag, link);
				$.add(tag, last = $.tnode(","));
				$.add(tagfrag, tag);
			}
			if (last !== null) $.remove(last);

			return tagfrag;
		};
		var create_tags_full = function (site, data) {
			var tagfrag = d.createDocumentFragment(),
				domain = data.type,
				tags_ns = data.tags_ns,
				theme = Theme.get(),
				tag = null,
				namespace, namespace_style, tags, link, tf, i, ii;

			for (namespace in tags_ns) {
				tags = tags_ns[namespace];
				ii = tags.length;
				if (ii === 0) continue;
				namespace_style = theme + " hl-tag-namespace-" + namespace.replace(/\s+/g, "-");

				tag = $.node("span", "hl-tag-namespace-block" + namespace_style);
				link = $.node("span", "hl-tag-namespace", namespace);
				tf = $.node("span", "hl-tag-namespace-first");
				$.add(tag, link);
				$.add(tag, $.tnode(":"));
				$.add(tf, tag);
				$.add(tagfrag, tf);

				for (i = 0; i < ii; ++i) {
					tag = $.node("span", "hl-tag-block" + namespace_style);
					link = $.link(CreateURL.to_tag_ns(tags[i], namespace, domain, site), "hl-tag", tags[i]);

					Filter.highlight("tags", link, data, Filter.None);

					$.add(tag, link);
					if (i < ii - 1) {
						$.add(tag, $.tnode(","));
					}
					else {
						tag.classList.add("hl-tag-block-last-of-namespace");
					}
					$.add(tf, tag);
					tf = tagfrag;
				}
			}

			if (tag !== null) {
				tag.classList.add("hl-tag-block-last");
			}

			return tagfrag;
		};
		var create_tags_best = function (site, data) {
			if (API.data_has_full(data)) {
				for (var k in data.tags_ns) {
					return create_tags_full(site, data);
				}
			}
			return create_tags(site, data);
		};
		var update_full = function (data) {
			var domain = domains.exhentai,
				full_id = data.type + "_" + data.gid,
				g_domain, tagfrag, nodes, link, tags, last, i, ii, j, jj, n, f;

			if (data.removed === true) {
				if (
					(n = details_nodes[data.type + "_" + data.gid]) !== null &&
					(link = $(".hl-details-side-box-visible>.hl-details-side-box-inner", n)) !== null
				) {
					link.innerHTML = "";
					n = $.node("strong", "hl-details-side-box-error" + Theme.get(), "Removed");
					link.appendChild(n);
				}
			}

			nodes = $$(".hl-tags[data-hl-id='" + full_id + "']");
			ii = nodes.length;

			if (ii === 0 || Object.keys(data.tags_ns).length === 0) return;

			tagfrag = create_tags_full(domain, data);

			i = 0;
			while (true) {
				n = nodes[i];
				f = tagfrag;
				last = (++i >= ii);

				if (
					(link = $("a[href]", n)) !== null &&
					Helper.get_domain(link.href) !== domain
				) {
					g_domain = Helper.get_full_domain(link.href);
					f = last ? tagfrag : tagfrag.cloneNode(true);
					tags = $$("a[href]", f);
					for (j = 0, jj = tags.length; j < jj; ++j) {
						tags[j].href = Helper.change_url_domain(tags[j].href, g_domain);
					}
				}
				else if (!last) {
					f = tagfrag.cloneNode(true);
				}

				n.innerHTML = "";
				$.add(n, f);

				if (last) break;
			}

			// Reposition any open details
			if (
				(n = details_nodes[full_id]) !== undefined &&
				(link = gallery_link_events_data.link) !== null &&
				Helper.get_id_from_node_full(link) === full_id
			) {
				update_details_position(n, link, gallery_link_events_data.mouse_x, gallery_link_events_data.mouse_y);
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
			var ns = $$(".hl-site-tag.hl-site-tag-active[hl-actions-index='" + index + "']"),
				i, ii;

			for (i = 0, ii = ns.length; i < ii; ++i) {
				ns[i].classList.remove("hl-site-tag-active");
			}

			actions.classList.add("hl-actions-hidden");
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
			tag.setAttribute("data-hl-actions-hpos", xpos);
			actions.setAttribute("data-hl-actions-hpos", xpos);

			if (below) {
				y = rect.bottom - de_rect.top - 0.0625;
			}
			else {
				y = rect.top - actions.getBoundingClientRect().height - de_rect.top + 0.0625;
			}

			actions.style.top = y + "px";
			tag.setAttribute("data-hl-actions-vpos", ypos);
			actions.setAttribute("data-hl-actions-vpos", ypos);
		};
		var update_active_actions_position = function () {
			var de_rect = d.documentElement.getBoundingClientRect(),
				index, actions, tag, tag_bg, xpos, ypos;

			for (index in actions_nodes_active) {
				actions = actions_nodes_active[index];
				if (
					(tag = $(".hl-site-tag.hl-site-tag-active[hl-actions-index='" + index + "']")) !== null &&
					(tag_bg = $(".hl-site-tag-bg", tag)) !== null
				) {
					xpos = actions.getAttribute("data-hl-actions-hpos");
					ypos = actions.getAttribute("data-hl-actions-vpos");
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
			var tag_bg = $.node("div", "hl-site-tag-bg" + Theme.get()),
				outline = $.node("div", "hl-site-tag-bg-shadow hl-hover-shadow" + Theme.get()),
				inner = $.node("div", "hl-site-tag-bg-inner" + Theme.get());

			Theme.bg(inner);

			$.add(tag_bg, inner);

			$.before(parent, parent.firstChild, tag_bg);
			$.before(parent, parent.firstChild, outline);

			return tag_bg;
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
				$.add(frag, $.node("div", "hl-star hl-star-" + i + " hl-star-" + star));
			}

			return frag;
		};
		var button = function (url, domain) {
			var button = $.link(url, "hl-site-tag" + Theme.get()),
				text = $.node("span", "hl-site-tag-text", button_text(domain));
			$.add(button, text);
			return button;
		};
		var button_get_inner = function (button) {
			return ((button = button.lastChild) !== null && button.tagName === "SPAN") ? button : null;
		};
		var update_button_text = function (button, domain) {
			if ((button = button_get_inner(button)) !== null) {
				button.textContent = button_text(domain);
			}
		};
		var mark_button_text = function (button, text) {
			if ((button = button_get_inner(button)) !== null) {
				button.textContent = button.textContent.replace(/\]\s*$/, text + "]");
			}
		};
		var button_text = function (domain) {
			var d = domain_info[domain];
			return (d !== undefined ? "[" + d.tag + "]" : "[?]");
		};
		var format_date = function (d) {
			return d.getUTCFullYear() + "-" +
				pad(d.getUTCMonth() + 1, "-") +
				pad(d.getUTCDate(), " ") +
				pad(d.getUTCHours(), ":") +
				pad(d.getUTCMinutes(), "");
		};
		var gallery_toggle_actions = function (event) {
			if ($.is_left_mouse(event) && config.actions.enabled) {
				event.preventDefault();

				var index = this.getAttribute("hl-actions-index"),
					actions, tag_bg, data, link, id;

				if (!index) {
					index = "" + actions_nodes_index;
					++actions_nodes_index;
					this.setAttribute("hl-actions-index", index);
				}

				if (this.classList.toggle("hl-site-tag-active")) {
					// Create bg
					tag_bg = $(".hl-site-tag-bg", this);
					if (tag_bg === null) tag_bg = create_tag_bg(this);

					// Show
					actions = actions_nodes[index];
					if (actions !== undefined) {
						actions.classList.remove("hl-actions-hidden");
						Popup.hovering(actions);
						activate_actions(actions, index);
					}
					else {
						// Create
						if (
							(link = Helper.get_link_from_tag_button(this)) !== null &&
							(id = Helper.get_id_from_node(link)) !== null &&
							Database.valid_namespace(id[0]) &&
							(data = Database.get(id[0], id[1])) !== null
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
		};

		var cleanup_post = function (post) {
			var nodes, n, i, ii;
			nodes = $$(".hl-exsauce-results:not(.hl-exsauce-results-hidden)", post);
			for (i = 0, ii = nodes.length; i < ii; ++i) {
				nodes[i].classList.add("hl-exsauce-results-hidden");
			}
			nodes = $$(".hl-actions:not(.hl-actions-hidden)", post);
			for (i = 0, ii = nodes.length; i < ii; ++i) {
				nodes[i].classList.add("hl-actions-hidden");
			}
			nodes = $$(".hl-site-tag[hl-actions-index]", post);
			for (i = 0, ii = nodes.length; i < ii; ++i) {
				n = nodes[i];
				n.classList.remove("hl-site-tag-active");
				n.removeAttribute("hl-actions-index");
			}
		};
		var cleanup_post_removed = function (post) {
			var nodes, index, n, i, ii;
			nodes = $$(".hl-site-tag[hl-actions-index]", post);
			for (i = 0, ii = nodes.length; i < ii; ++i) {
				index = nodes[i].getAttribute("hl-actions-index") || "";
				n = actions_nodes[index];
				if (n !== undefined) {
					if (n.parentNode !== null) $.remove(n);
					delete actions_nodes[index];
					deactivate_actions(index);
				}
			}
		};

		// Exports
		return {
			events: {
				gallery_link: gallery_link_events,
				gallery_toggle_actions: gallery_toggle_actions
			},
			create_rating_stars: create_rating_stars,
			button: button,
			button_get_inner: button_get_inner,
			update_button_text: update_button_text,
			mark_button_text: mark_button_text,
			button_text: button_text,
			format_date: format_date,
			cleanup_post: cleanup_post,
			cleanup_post_removed: cleanup_post_removed
		};

	})();
	var API = (function () {

		// Private
		var temp_div = $.node_simple("div"),
			re_protocol = /^https?\:/i,
			saved_thumbnails = {
				ehentai: {},
				nhentai: {},
				hitomi: {}
			},
			nhentai_tag_namespaces = {
				parodies: "parody",
				characters: "character",
				artists: "artist",
				groups: "group"
			},
			request_types = {
				ehentai: [ "ehentai_page", "ehentai_gallery" ],
				nhentai: [ "nhentai_gallery" ],
				hitomi: [ "hitomi_gallery" ]
			};

		var Request = (function () {

			var Queue = {
				ehentai_gallery: {
					data: [],
					callbacks: [],
					limit: 25,
					active: false,
					delays: { okay: 200, fail: 5000 },
					setup: function (entries) {
						return {
							method: "POST",
							url: "http://" + domains.gehentai + "/api.php",
							headers: { "Content-Type": "application/json" },
							data: JSON.stringify({
								method: "gdata",
								gidlist: entries
							})
						};
					},
					response: function (text) {
						var response = Helper.json_parse_safe(text);
						return (response !== null && typeof(response) === "object") ? (response.gmetadata || null) : null;
					}
				},
				ehentai_page: {
					data: [],
					callbacks: [],
					limit: 25,
					active: false,
					delays: { okay: 200, fail: 5000 },
					setup: function (entries) {
						return {
							method: "POST",
							url: "http://" + domains.gehentai + "/api.php",
							headers: { "Content-Type": "application/json" },
							data: JSON.stringify({
								method: "gtoken",
								pagelist: entries
							})
						};
					},
					response: function (text) {
						var response = Helper.json_parse_safe(text);
						return (response !== null && typeof(response) === "object") ? (response.tokenlist || null) : null;
					}
				},
				ehentai_full: {
					data: [],
					callbacks: [],
					limit: 1,
					active: false,
					delays: { okay: 200, fail: 5000 },
					setup: function (entries) {
						var e = entries[0];
						return {
							method: "GET",
							url: "http://" + e[0] + "/g/" + e[1] + "/" + e[2] + "/",
						};
					},
					response: function (text) {
						var html = Helper.html_parse_safe(text, null);
						if (html !== null) {
							return [ html ];
						}
						return null;
					}
				},
				nhentai_gallery: {
					data: [],
					callbacks: [],
					limit: 1,
					active: false,
					delays: { okay: 100, fail: 3000 },
					setup: function (entries) {
						return {
							method: "GET",
							url: "http://" + domains.nhentai + "/g/" + entries[0] + "/",
						};
					},
					response: function (text) {
						var html = Helper.html_parse_safe(text, null);
						if (html !== null) {
							return [ nhentai_parse_info(html) ];
						}
						return null;
					}
				},
				hitomi_gallery: {
					data: [],
					callbacks: [],
					limit: 1,
					active: false,
					delays: { okay: 100, fail: 3000 },
					setup: function (entries) {
						return {
							method: "GET",
							url: "https://" + domains.hitomi + "/galleries/" + entries[0] + ".html",
						};
					},
					response: function (text) {
						var html = Helper.html_parse_safe(text, null);
						if (html !== null) {
							return [ hitomi_parse_info(html) ];
						}
						return null;
					}
				}
			};

			var error_fn = function (q, names, callbacks, msg) {
				return function (xhr) {
					Debug.log("API.request[" + names.join(",") + "] error: " + msg + "; time=" + Debug.timer("apirequest_" + names.join("_")), xhr);

					var i = 0,
						ii = callbacks.length - 1;

					for (; i < ii; ++i) {
						callbacks[i].call(null, msg, null, false);
					}
					callbacks[i].call(null, msg, null, true);

					setTimeout(function () {
						q.active = false;
						trigger.call(null, names);
					}, q.delays.fail);
				};
			};

			var queue_add = function (name, data, callback) {
				var q = Queue[name];
				q.data.push(data);
				q.callbacks.push(callback);
			};
			var queue_get = function (names) {
				var entries, callbacks, q, d, i, ii;

				for (i = 0, ii = names.length; i < ii; ++i) {
					q = Queue[names[i]];
					if (q.active) return null;
					d = q.data;
					if (d.length > 0) {
						while (++i < ii) {
							if (Queue[names[i]].active) return null;
						}

						entries = d.splice(0, q.limit);
						callbacks = q.callbacks.splice(0, entries.length);
						return [ q, names, callbacks, q.setup.call(null, entries) ];
					}
				}

				return null;
			};

			var trigger = function (names) {
				var q_data = queue_get.call(null, names);
				if (q_data !== null) {
					perform_request.apply(null, q_data);
					return true;
				}
				return false;
			};

			var perform_request = function (q, names, callbacks, xhr_data) {
				q.active = true;

				var timer_name = "apirequest_" + names.join("_");

				xhr_data.onerror = error_fn(q, names, callbacks, "Connection error");
				xhr_data.onabort = error_fn(q, names, callbacks, "Connection aborted");
				xhr_data.onload = function (xhr) {
					Debug.log("API.Request[" + names.join(",") + "].response; time=" + Debug.timer(timer_name));

					var err, response;
					if (xhr.status === 200) {
						response = q.response(xhr.responseText);
						if (response !== null) {
							call_callbacks.call(null, q, names, callbacks, response);
							return;
						}

						err = "Invalid response";
					}
					else {
						err = "Invalid status: " + xhr.status;
					}

					// Error
					error_fn(q, names, callbacks, err).call(null, q, names, callbacks, xhr);
				};


				Debug.timer(timer_name);
				Debug.log("API.Request[" + names.join(",") + "]", xhr_data);
				HttpRequest(xhr_data);
			};

			var call_callbacks = function (q, names, callbacks, response) {
				var i = 0,
					ii = callbacks.length,
					data, err;

				if (response.length >= ii) {
					--ii;
					for (; i < ii; ++i) {
						data = response[i];
						callbacks[i].call(null, data.error || null, data, false);
					}
					data = response[i];
					callbacks[i].call(null, data.error || null, data, true);
				}
				else {
					ii = response.length || 0;
					for (; i < ii; ++i) {
						data = response[i];
						callbacks[i].call(null, data.error || null, data, false);
					}
					err = "Data not found";
					ii = callbacks.length - 1;
					for (; i < ii; ++i) {
						callbacks[i].call(null, err, null, false);
					}
					callbacks[i].call(null, err, null, true);
				}

				setTimeout(function () {
					q.active = false;
					trigger.call(null, names);
				}, q.delays.okay);
			};

			return {
				queue: queue_add,
				get: function (name, data, callback) {
					var q = Queue[name];
					if (q.active) {
						q.data.push(data);
						q.callbacks.push(callback);
						return false;
					}

					perform_request.call(null, q, [ name ], [ callback ], q.setup.call(null, [ data ]));
					return true;
				},
				trigger: trigger
			};

		})();

		var Flags = {
			None: 0x0,
			ThumbnailNoLeech: 0x1
		};

		var create_empty_gallery_info = function () {
			return {
				gid: 0,
				token: null,
				type: "",
				title: "",
				title_jpn: null,
				uploader: "",
				category: "",
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
		};
		var uint8_array_to_url = function (data, mime) {
			try {
				var blob = new Blob([ data ], { type: mime });
				return window.URL.createObjectURL(blob) || null;
			}
			catch (e) {}
			return null;
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
			var data = create_empty_gallery_info(),
				t;

			data.gid = parseInt(info.gid, 10) || 0;
			data.token = ehentai_simple_string(info.token, null);
			data.type = "ehentai";
			data.archiver_key = ehentai_simple_string(info.archiver_key, null);
			data.title = ehentai_normalize_string(info.title, "");
			data.title_jpn = ehentai_normalize_string(info.title_jpn, null);
			data.uploader = ehentai_normalize_string(info.uploader, null);
			data.category = ehentai_simple_string(info.category, "");
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
		};
		var ehentai_parse_info = function (html, data) {
			// Tags
			var updated_tag_count = 0,
				tags, pattern, par, tds, namespace, ns, i, ii, j, jj, m, n;

			if (
				(n = $("title", html)) !== null &&
				/^\s*Gallery\s+Not\s+Available/i.test(n.textContent) &&
				$("#continue", html) !== null
			) {
				data.removed = true;
				data.tags_ns = {};
			}
			else {
				tags = {};
				pattern = /(.+):/;

				data.removed = false;
				data.tags_ns = tags;

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
							ns.push(n.textContent.trim());
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
			}

			// Done
			data.full = true;
			return data;
		};
		var nhentai_normalize_category = function (category) {
			return Helper.title_case(category);
		};
		var nhentai_normalize_tag_namespace = function (namespace) {
			return nhentai_tag_namespaces[namespace] || namespace;
		};
		var nhentai_parse_info = function (html) {
			var info = $("#info", html),
				data, nodes, tags, tag_ns, tag_ns_list, t, m, n, i, ii, j, jj;

			if (info === null) {
				return { error: "Could not find info" };
			}

			// Create data
			data = create_empty_gallery_info();
			data.type = "nhentai";
			data.uploader = "nhentai";
			data.full = true;
			data.tags = [];
			data.tags_ns = {};

			// Image/gid
			if ((n = $("#cover>a", html)) !== null) {
				m = /\/g\/(\d+)/.exec(n.getAttribute("href") || "");
				if (m !== null) {
					data.gid = parseInt(m[1], 10);
				}

				if ((n = $("img", n)) !== null) {
					data.thumbnail = n.getAttribute("src") || null;
					if (data.thumbnail !== null && !re_protocol.test(data.thumbnail)) {
						data.thumbnail = "http:" + data.thumbnail;
					}
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
							data.category = nhentai_normalize_category(n.nodeValue.trim());
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
		};
		var hitomi_normalize_category = function (category) {
			return Helper.title_case(category);
		};
		var hitomi_parse_info = function (html) {
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
			data = create_empty_gallery_info();
			data.type = "hitomi";
			data.flags |= Flags.ThumbnailNoLeech;
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

				if ((n = $("img", n)) !== null) {
					t = n.getAttribute("src") || null;
					if (t !== null) {
						if (!re_protocol.test(t)) {
							t = "https:" + t;
						}
						data.thumbnail = t; // no cross origin
					}
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
					data.category = hitomi_normalize_category(t);
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
		};

		// Public
		var ehentai_queue_gallery = function (gid, token) {
			gid = parseInt(gid, 10);
			Request.queue("ehentai_gallery",
				[ gid, token ],
				function (err, data, last) {
					if (err === null) {
						data = ehentai_normalize_info(data);
						Database.set("ehentai", data);
					}
					else {
						Database.set_error("ehentai", gid, err, data !== null);
					}
					if (last) {
						Linkifier.check_incomplete("ehentai");
					}
				}
			);
		};
		var ehentai_queue_gallery_page = function (gid, page_token, page) {
			Request.queue("ehentai_page",
				[ parseInt(gid, 10), page_token, parseInt(page, 10) ],
				function (err, data) {
					if (err === null) {
						ehentai_queue_gallery(data.gid, data.token);
					}
				}
			);
		};
		var ehentai_get_full_info = function (id, token, site, cb) {
			Request.get("ehentai_full",
				[ site, id, token ],
				function (err, full_html) {
					if (err === null) {
						var data = Database.get("ehentai", id);
						if (data !== null) {
							data = ehentai_parse_info(full_html, data);
							if (data !== null) {
								Database.set("ehentai", data);
								cb(null, data);
							}
							else {
								cb("Failed to update data", null);
							}
						}
						else {
							cb("Could not update data", null);
						}
					}
					else {
						cb(err, null);
					}
				}
			);
		};
		var nhentai_queue_gallery = function (gid) {
			Request.queue("nhentai_gallery",
				gid,
				function (err, data) {
					if (err === null) {
						Database.set("nhentai", data);
						Linkifier.check_incomplete("nhentai");
					}
					else {
						Database.set_error("nhentai", gid, err, data !== null);
					}
				}
			);
		};
		var hitomi_queue_gallery = function (gid) {
			Request.queue("hitomi_gallery",
				gid,
				function (err, data) {
					if (err === null) {
						Database.set("hitomi", data);
						Linkifier.check_incomplete("hitomi");
					}
					else {
						Database.set_error("hitomi", gid, err, data !== null);
					}
				}
			);
		};
		var run_request_queue = function () {
			Request.trigger(request_types.ehentai);
			Request.trigger(request_types.nhentai);
			Request.trigger(request_types.hitomi);
		};
		var data_has_full = function (data) {
			return data.full;
		};
		var get_thumbnail = function (data, callback) {
			var thumbnail = data.thumbnail,
				url, cache, gid;

			if (thumbnail === null) {
				callback.call(null, "No thumbnail", null);
			}

			// Use direct URL
			if ((data.flags & API.Flags.ThumbnailNoLeech) === 0 && !config.general.image_leeching_disabled)  {
				callback.call(null, null, thumbnail);
				return;
			}

			// Cached
			cache = saved_thumbnails[data.type];
			if (cache === undefined) {
				callback.call(null, "Malformed data", null);
				return;
			}

			gid = data.gid;
			url = cache[gid];
			if (url !== undefined) {
				callback.call(null, null, url);
				return;
			}

			// Fetch
			get_image(thumbnail, function (err, data, data_length, final_url) {
				if (err === null) {
					var m = /\.(png|gif)$/i.exec(final_url),
						mime = "image/" + (m === null ? "jpeg" : m[1].toLowerCase()),
						img_url = uint8_array_to_url(data.subarray(0, data_length), mime);

					if (img_url !== null) {
						cache[gid] = img_url;
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
		var get_image = function (url, callback) {
			// Note that the Uint8Array's length is longer than image_length
			// callback(err, image_data, image_length);
			HttpRequest({
				method: "GET",
				url: url,
				overrideMimeType: "text/plain; charset=x-user-defined",
				onload: function (xhr) {
					if (xhr.status === 200) {
						var text = xhr.responseText,
							ta = new Uint8Array(text.length + 1),
							i, ii;

						for (i = 0, ii = text.length; i < ii; ++i) {
							ta[i] = text.charCodeAt(i);
						}

						callback(null, ta, ii, xhr.finalUrl);
					}
					else {
						callback(xhr.status, null, 0, null);
					}
				},
				onerror: function () {
					callback("connection error", null, 0, null);
				},
				onabort: function () {
					callback("aborted", null, 0, null);
				}
			});
		};

		// Exports
		return {
			Flags: Flags,
			ehentai_queue_gallery: ehentai_queue_gallery,
			ehentai_queue_gallery_page: ehentai_queue_gallery_page,
			ehentai_get_full_info: ehentai_get_full_info,
			nhentai_queue_gallery: nhentai_queue_gallery,
			hitomi_queue_gallery: hitomi_queue_gallery,
			run_request_queue: run_request_queue,
			data_has_full: data_has_full,
			get_thumbnail: get_thumbnail,
			get_image: get_image
		};

	})();
	var Cache = (function () {

		// Private
		var prefix = "#PREFIX#cache-",
			storage = window.localStorage,
			ttl_hour = 60 * 60 * 1000;

		var get_key = function (storage, key) {
			var json = Helper.json_parse_safe(storage.getItem(key));

			if (json && typeof(json) === "object" && Date.now() < json.expires) {
				return json.data;
			}

			storage.removeItem(key);
			return null;
		};

		// Public
		var init = function () {
			var re_matcher = new RegExp("^" + Helper.regex_escape(prefix) + "((?:([en]hentai|hitomi)_)gallery|md5|sha1)-([^-]+)"),
				removed = 0,
				keys = [],
				populate = false,
				key, data, m, i, ii;

			if (config.debug.cache_mode === "none") {
				storage = (function () {
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
				})();
			}
			else if (config.debug.cache_mode === "session") {
				storage = window.sessionStorage;
			}

			for (i = 0, ii = storage.length; i < ii; ++i) {
				key = storage.key(i);
				if ((m = re_matcher.exec(key)) !== null) {
					keys.push(key, m);
				}
			}

			for (i = 0, ii = keys.length; i < ii; ++i) {
				data = get_key(storage, keys[i]);
				++i;
				if (data === null) {
					++removed;
				}
				else if (populate) {
					m = keys[i];
					if (m[2] !== undefined) {
						Database.set_nocache(m[2], data);
					}
					else { // if (key === "md5" || key === "sha1") {
						Hash.set_nocache(m[1], m[2], data);
					}
				}
			}

			if (populate) {
				Debug.log("Preloaded " + (ii / 2 - removed) + " entries from cache");
			}
			if (removed > 0) {
				Debug.log("Purged " + removed + " old entries from cache");
			}
		};
		var get = function (type, key) {
			return get_key(storage, prefix + type + "-" + key);
		};
		var set = function (type, key, data, ttl) {
			var now = Date.now();

			if (ttl === 0) {
				ttl = ((now - data.upload_date < 12 * ttl_hour) ? ttl_hour : 12 * ttl_hour); // Update more frequently for recent uploads
			}

			storage.setItem(prefix + type + "-" + key, JSON.stringify({
				expires: now + ttl,
				data: data
			}));
		};
		var clear = function () {
			var re_matcher = new RegExp("^" + Helper.regex_escape(prefix)),
				storage_types = [ window.localStorage, window.sessionStorage ],
				results = [],
				remove, storage, key, i, ii, j, jj;

			for (i = 0, ii = storage_types.length; i < ii; ++i) {
				storage = storage_types[i];
				remove = [];

				for (j = 0, jj = storage.length; j < jj; ++j) {
					key = storage.key(j);
					if (re_matcher.test(key)) {
						remove.push(key);
					}
				}

				for (j = 0, jj = remove.length; j < jj; ++j) {
					storage.removeItem(remove[j]);
				}

				results.push(jj);
			}

			return results;
		};

		// Exports
		return {
			init: init,
			get: get,
			set: set,
			clear: clear
		};

	})();
	var Database = (function () {

		// Private
		var saved_data = {
				ehentai: {},
				nhentai: {},
				hitomi: {}
			},
			errors = {
				ehentai: {},
				nhentai: {},
				hitomi: {}
			};

		// Public
		var valid_namespace = function (namespace) {
			return (saved_data[namespace] !== undefined);
		};
		var get = function (namespace, uid) { // , debug
			// Use this if you want to break database gets randomly for debugging
			// if (arguments[2] === true && Math.random() > 0.8) return false;
			var db = saved_data[namespace],
				data = db[uid];

			if (data !== undefined) return data;

			data = Cache.get(namespace + "_gallery", uid);
			if (data !== null) {
				db[data.gid] = data;
				return data;
			}

			return null;
		};
		var set = function (namespace, data) {
			saved_data[namespace][data.gid] = data;
			Cache.set(namespace + "_gallery", data.gid, data, 0);
		};
		var set_nocache = function (namespace, data) {
			saved_data[namespace][data.gid] = data;
		};
		var set_error = function (namespace, gid, error) { // , cache
			errors[namespace][gid] = error;
		};
		var get_error = function (namespace, gid) {
			var v = errors[namespace][gid];
			return v === undefined ? null : v;
		};

		// Exports
		return {
			valid_namespace: valid_namespace,
			get: get,
			set: set,
			set_nocache: set_nocache,
			set_error: set_error,
			get_error: get_error
		};

	})();
	var Hash = (function () {

		// Private
		var ttl_12_hours = 12 * 60 * 60 * 1000,
			ttl_1_year = 365 * 24 * 60 * 60 * 1000;

		var saved_data = {
			md5: {},
			sha1: {},
		};

		// Public
		var get = function (type, key) {
			var hash_data = saved_data[type],
				value;

			value = hash_data[key];
			if (value) return value;

			value = Cache.get(type, key);
			if (value !== null) {
				hash_data[key] = value;
				return value;
			}

			return null;
		};
		var set = function (type, key, value) {
			var ttl = (type === "md5") ? ttl_1_year : ttl_12_hours;
			saved_data[type][key] = value;
			Cache.set(type, key, value, ttl);
		};
		var set_nocache = function (type, key, value) {
			saved_data[type][key] = value;
		};

		// Exports
		return {
			get: get,
			set: set,
			set_nocache: set_nocache
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
		var similar_uploading = false,
			hover_nodes = {},
			delays = {
				similar_okay: 3000,
				similar_error: 3000,
				similar_retry: 5000,
			};

		var ui_events = {
			click: function (event) {
				event.preventDefault();

				var sha1 = this.getAttribute("data-sha1"),
					results = Helper.get_exresults_from_exsauce(this),
					hover;

				if (results !== null) {
					hover = hover_nodes[sha1];

					if (results.classList.toggle("hl-exsauce-results-hidden")) {
						if (hover === undefined) hover = ui_hover(sha1);
						hover.classList.remove("hl-exsauce-hover-hidden");
						ui_events.mousemove.call(this, event);
					}
					else {
						if (hover !== undefined) {
							hover.classList.add("hl-exsauce-hover-hidden");
						}
					}
				}
			},
			mouseover: function () {
				var sha1 = this.getAttribute("data-sha1"),
					results = Helper.get_exresults_from_exsauce(this),
					hover;

				if (results === null || results.classList.contains("hl-exsauce-results-hidden")) {
					hover = hover_nodes[sha1];
					if (hover === undefined) hover = ui_hover(sha1);
					hover.classList.remove("hl-exsauce-hover-hidden");
				}
			},
			mouseout: function () {
				var sha1 = this.getAttribute("data-sha1"),
					hover = hover_nodes[sha1];

				if (hover !== undefined) {
					hover.classList.add("hl-exsauce-hover-hidden");
				}
			},
			mousemove: function (event) {
				var hover = hover_nodes[this.getAttribute("data-sha1")];

				if (hover === undefined || hover.classList.contains("hl-exsauce-hover-hidden")) return;

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
			}
		};

		var ui_hover = function (sha1) {
			var result = Hash.get("sha1", sha1),
				hover, i, ii;

			hover = $.node("div",
				"hl-exsauce-hover hl-exsauce-hover-hidden hl-hover-shadow post reply post_wrapper hl-fake-post" + Theme.get()
			);
			hover.setAttribute("data-sha1", sha1);

			if (result !== null && (ii = result.length) > 0) {
				i = 0;
				while (true) {
					$.add(hover, $.link(result[i][0], "hl-exsauce-hover-link", result[i][1]));
					if (++i >= ii) break;
					$.add(hover, $.node_simple("br"));
				}
			}
			Popup.hovering(hover);
			hover_nodes[sha1] = hover;

			return hover;
		};
		var format = function (a, result) {
			var count = result.length,
				theme = Theme.get(),
				sha1 = a.getAttribute("data-sha1"),
				index = a.getAttribute("data-hl-image-index") || "",
				results, link, par, n, i, ii;

			a.classList.add("hl-exsauce-link-valid");
			a.textContent = "Found: " + count;
			a.href = get_sha1_lookup_url(sha1);
			a.target = "_blank";
			a.rel = "noreferrer";

			if (count > 0) {
				if (
					(n = Post.get_post_container(a)) !== null &&
					(n = Post.get_text_body(n)) !== null &&
					(par = n.parentNode) !== null
				) {
					results = $.node("div", "hl-exsauce-results" + theme);
					results.setAttribute("data-hl-image-index", index);
					$.add(results, $.node("strong", "hl-exsauce-results-title", "Reverse Image Search Results"));
					$.add(results, $.node("span", "hl-exsauce-results-sep", "|" ));
					$.add(results, $.node("span", "hl-exsauce-results-label", "View on:"));
					$.add(results, $.link(a.href, "hl-exsauce-results-link", (config.sauce.lookup_domain === domains.exhentai) ? "exhentai" : "e-hentai"));
					$.add(results, $.node_simple("br"));

					for (i = 0, ii = result.length; i < ii; ++i) {
						link = Linkifier.create_link(result[i][0]);
						$.add(results, link);
						Linkifier.preprocess_link(link, true);
						if (i < ii - 1) $.add(results, $.node_simple("br"));
					}

					$.before(par, n, results);
					if (Linkifier.check_incomplete()) {
						API.run_request_queue();
					}
				}
				Linkifier.change_link_events(a, "exsauce_toggle");
			}

			Debug.log("Formatting complete");
		};
		var lookup = function (a, sha1) {
			a.textContent = "Checking";

			HttpRequest({
				method: "GET",
				url: get_sha1_lookup_url(sha1),
				onload: function (xhr) {
					if (xhr.status === 200) {
						var results = get_results(xhr.responseText);

						Debug.log("Lookup successful; formatting...");
						Hash.set("sha1", sha1, results);
						ui_hover(sha1);
						format(a, results);
					}
					else {
						a.textContent = "Error: lookup/" + xhr.status;
					}
				},
				onerror: function () {
					a.textContent = "Error: lookup/connection";
				},
				onabort: function () {
					a.textContent = "Error: lookup/aborted";
				}
			});
		};
		var lookup_similar = function (a, image) {
			var type = "jpeg",
				m = /\.(png|gif)$/.exec(a.href || ""),
				form_data = new FormData(),
				blob, error_fn, reset_uploading;

			if (m !== null) type = m[1];

			blob = new Blob([ image ], { type: "image/" + type });

			form_data.append("sfile", blob, a.getAttribute("data-hl-filename") || "image." + type);
			form_data.append("fs_similar", "on");
			if (config.sauce.expunged) {
				form_data.append("fs_exp", "on");
			}

			reset_uploading = function () {
				similar_uploading = false;
			};
			error_fn = function (msg) {
				return function () {
					setTimeout(reset_uploading, delays.similar_error);
					a.textContent = "Error: " + msg;
				};
			};

			a.textContent = "Uploading";

			similar_uploading = true;
			HttpRequest({
				method: "POST",
				url: "http://ul." + config.sauce.lookup_domain + "/image_lookup.php",
				data: form_data,
				onload: function (xhr) {
					if (xhr.status === 200) {
						var m = xhr.finalUrl.match(/f_shash=(([0-9a-f]{40}|corrupt)(?:;(?:[0-9a-f]{40}|monotone))*)/),
							md5, sha1, results, err, n;

						if (m && (sha1 = m[2]) !== "corrupt") {
							results = get_results(xhr.responseText);

							a.href = xhr.finalUrl;

							if (/monotone/.test(m[1]) && results.length === 0) {
								a.textContent = "Error: monotone";
								a.setAttribute("title", "Similarity scan can only be performed on color images");
							}
							else {
								md5 = a.getAttribute("data-md5");
								if (md5) {
									Hash.set("md5", md5, sha1);
								}

								a.removeAttribute("title");
								a.setAttribute("data-hl-similar", m[1]);
								a.setAttribute("data-sha1", sha1);

								Debug.log("Lookup successful (" + m[1] + "); formatting...");
								Hash.set("sha1", sha1, results);
								ui_hover(sha1);
								format(a, results);
							}

							setTimeout(reset_uploading, delays.similar_okay);
						}
						else {
							if (/please\s+wait\s+a\s+bit\s+longer\s+between\s+each\s+file\s+search/i.test(xhr.responseText)) {
								a.textContent = "Error: wait longer";
								a.setAttribute("title", "Click again to retry");
								$.on(a, "click", fetch_similar);
								setTimeout(reset_uploading, delays.similar_retry);
							}
							else {
								Debug.log("An error occured while reverse image searching", xhr);
								err = "Unknown error";
								m = Helper.html_parse_safe(xhr.responseText);
								if (m !== null) {
									n = $("#iw", m);
									if (n !== null) err = n.textContent;
								}
								a.setAttribute("title", err);
								error_fn("upload failed").call(null);
							}
						}
					}
					else {
						error_fn("similar/" + xhr.status).call(null);
					}
				},
				onerror: error_fn("similar/check/connection"),
				onabort: error_fn("similar/check/aborted"),
				upload: {
					onload: function () {
						a.textContent = "Checking";
					},
					onerror: error_fn("similar/upload/connection"),
					onabort: error_fn("similar/upload/aborted")
				}
			});
		};
		var get_sha1_lookup_url = function (sha1) {
			var url = "http://",
				di = domain_info[config.sauce.lookup_domain];
			url += (di === undefined ? "" : di.g_domain);
			url += "/?f_doujinshi=1&f_manga=1&f_artistcg=1&f_gamecg=1&f_western=1&f_non-h=1&f_imageset=1&f_cosplay=1&f_asianporn=1&f_misc=1&f_search=Search+Keywords&f_apply=Apply+Filter&f_shash=";
			url += sha1;
			url += "&fs_similar=0";
			if (config.sauce.expunged) url += "&fs_exp=1";
			return url;
		};
		var get_results = function (response_text) {
			var results = [],
				html = Helper.html_parse_safe(response_text, null),
				links, link, i, ii;

			if (html !== null) {
				links = $$("div.it5 a,div.id2 a", html);

				for (i = 0, ii = links.length; i < ii; ++i) {
					link = links[i];
					results.push([ link.href, link.textContent ]);
				}
			}

			return results;
		};
		var hash = function (a, md5) {
			Debug.log("Fetching image " + a.href);
			a.textContent = "Loading";

			API.get_image(a.href, function (err, data) {
				if (err !== null) {
					a.textContent = "Error: hash/" + err;
				}
				else {
					var sha1 = SHA1.hash(data, data.length - 1);
					a.textContent = "Hashing";
					a.setAttribute("data-sha1", sha1);
					Hash.set("md5", md5, sha1);
					Debug.log("SHA-1 hash for image: " + sha1);
					var res = check(a);
					if (res !== true && res !== null) {
						Debug.log('No cached result found; performing a lookup...');
						lookup(a, res);
					}
				}
			});
		};
		var check = function (a) {
			var sha1, results;

			if (
				(sha1 = a.getAttribute("data-sha1") || Hash.get("md5", a.getAttribute("data-md5") || "") || null) !== null &&
				(results = Hash.get("sha1", sha1)) !== null
			) {
				Debug.log('Cached result found; formatting...');
				a.setAttribute("data-sha1", sha1);
				format(a, results);
				return true;
			}

			return sha1;
		};
		var fetch = function (event) {
			event.preventDefault();
			$.off(this, "click", fetch);
			var res = check(this);

			if (res !== true) {
				if (res === null) {
					Debug.log('No SHA-1 hash found; fetching image...');
					res = this.getAttribute("data-md5");
					if (res) hash(this, res);
				}
				else { // res = sha1
					Debug.log('No cached result found; performing a lookup...');
					lookup(this, res);
				}
			}
		};
		var fetch_similar = function (event) {
			event.preventDefault();
			var res = check(this),
				a = this;

			if (res !== true) {
				// Can search?
				if (similar_uploading) return;
				$.off(this, "click", fetch_similar);

				// Load image and upload
				a.textContent = "Loading";

				API.get_image(this.href, function (err, image, image_size) {
					if (err !== null) {
						a.textContent = "Error: similar/" + err;
					}
					else {
						image = image.subarray(0, image_size);
						lookup_similar(a, image);
					}
				});
			}
		};

		// Public
		var label = function () {
			var label = config.sauce.label;

			if (label.length === 0) {
				label = (config.sauce.lookup_domain === domains.exhentai) ? "exhentai" : "e-hentai";
			}

			return label;
		};

		// Exports
		return {
			events: {
				fetch: fetch,
				fetch_similar: fetch_similar,
				ui: ui_events
			},
			label: label
		};

	})();
	var Linkifier = (function () {

		// Private
		var re_url = /(?:https?:\/*)?(?:(?:forums|gu|g|u)?\.?e[x\-]hentai\.org|nhentai\.net|hitomi\.la)\/[^<>\s\'\"]*/ig,
			re_url_class_ignore = /(?:\binlined?\b|\bhl-)/,
			re_fjord = /abortion|bestiality|incest|lolicon|shotacon|toddlercon/,
			re_protocol = /^https?\:/i,
			post_queue = {
				posts: [],
				timer: null,
				group_size: 25,
				delay: 50
			},
			incomplete = {
				types: [ "ehentai", "nhentai", "hitomi" ],
				ehentai: {
					types: [ "page", "gallery" ],
					unchecked: { page: {}, gallery: {} },
					checked: { page: {}, gallery: {} },
					missing: {
						page: function (id, info) {
							API.ehentai_queue_gallery_page(id, info.page_token, info.page);
						},
						gallery: function (id, info) {
							API.ehentai_queue_gallery(id, info.token);
						}
					}
				},
				nhentai: {
					types: [ "gallery" ],
					unchecked: { gallery: {} },
					checked: { gallery: {} },
					missing: {
						gallery: function (id) {
							API.nhentai_queue_gallery(id);
						}
					}
				},
				hitomi: {
					types: [ "gallery" ],
					unchecked: { gallery: {} },
					checked: { gallery: {} },
					missing: {
						gallery: function (id) {
							API.hitomi_queue_gallery(id);
						}
					}
				}
			},
			event_queue = {
				format: []
			},
			event_listeners = {
				format: []
			};

		var link_events = {
			exsauce_fetch: Sauce.events.fetch,
			exsauce_fetch_similarity: Sauce.events.fetch_similar,
			exsauce_toggle: Sauce.events.ui,
			exsauce_error: function (event) {
				event.preventDefault();
				return false;
			},
			gallery_link: UI.events.gallery_link,
			gallery_error: function (event) {
				event.preventDefault();
				return false;
			},
			gallery_toggle_actions: UI.events.gallery_toggle_actions,
			gallery_fetch: function (event) {
				return on_tag_click_to_load.call(this, event);
			}
		};

		var deep_dom_wrap = (function () {

			// Internal helper class
			var Offset = function (text_offset, node) {
				this.text_offset = text_offset;
				this.node = node;
				this.node_text_length = node.nodeValue.length;
			};



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
			};



			// Element type constants
			deep_dom_wrap.EL_TYPE_PARSE = 0;
			deep_dom_wrap.EL_TYPE_NO_PARSE = 1;
			deep_dom_wrap.EL_TYPE_LINE_BREAK = 2;



			// Return the function
			return deep_dom_wrap;

		})();

		var linkify = function (container, results) {
			deep_dom_wrap(
				container,
				"a",
				function (text, pos) {
					re_url.lastIndex = pos;
					var m = re_url.exec(text);
					if (m === null) return null;
					return [ m.index , m.index + m[0].length, m ];
				},
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
				},
				function (node, match) {
					var url = match[2][0];
					if (!re_protocol.test(url)) url = "http://" + url.replace(/^\/+/, "");
					node.href = url;
					node.target = "_blank";
					node.rel = "noreferrer";
					results.push(node);
				},
				false
			);
		};
		var format = function (links, data) {
			var events = (event_listeners.format.length > 0) ? event_queue.format : null,
				link, i, ii;

			for (i = 0, ii = links.length; i < ii; ++i) {
				link = links[i];

				if (link.parentNode !== null) {
					format_link(link, data);
					if (events !== null) events.push(link);
				}
			}

			if (events !== null) trigger("format");
		};
		var format_link = function (link, data) {
			var button = Helper.get_tag_button_from_link(link),
				domain, fjord, ex, hl, c;

			// Smart links
			if (config.general.rewrite_links === "smart") {
				domain = Helper.get_domain(link.href);
				ex = (domain === domains.exhentai);
				if (ex || domain === domains.ehentai) {
					fjord = re_fjord.test(data.tags.join(","));
					if (fjord !== ex) {
						domain = fjord ? domains.exhentai : domains.ehentai;
						link.href = Helper.change_url_domain(link.href, domain_info[domain].g_domain);
						if (button !== null) {
							button.href = link.href;
							UI.update_button_text(button, domain);
						}
					}
				}
			}

			// Link title
			link.textContent = data.title;
			link.setAttribute("data-hl-linkified-status", "formatted");

			// Button
			if (button !== null) {
				hl = Filter.check(link, data);
				if (hl[0] !== Filter.None) {
					c = (hl[0] === Filter.Good) ? config.filter.good_tag_marker : config.filter.bad_tag_marker;
					UI.mark_button_text(button, c);
					Filter.highlight_tag(button, link, hl);
				}
				change_link_events(button, "gallery_toggle_actions");
			}
		};
		var format_links_error = function (links, error) {
			var text = " (" + error.trim().replace(/\.$/, "") + ")",
				button, link, i, ii;

			for (i = 0, ii = links.length; i < ii; ++i) {
				link = links[i];
				button = Helper.get_tag_button_from_link(link);
				if (button !== null) {
					change_link_events(button, "gallery_error");
					button.classList.add("hl-linkified-error");
				}

				link.classList.add("hl-linkified-error");
				link.setAttribute("data-hl-linkified-status", "formatted_error");
				$.add(link, $.node("span", "hl-linkified-error-message", text));
			}
		};

		var on_tag_click_to_load = function (event) {
			event.preventDefault();

			var link, info;

			if (
				(link = Helper.get_link_from_tag_button(this)) !== null &&
				(info = Helper.get_info_from_node(link)) !== null &&
				Database.valid_namespace(info.site)
			) {
				check_link(link, info);
				if (check_incomplete()) {
					API.run_request_queue();
				}
			}
		};
		var check_link = function (link, info) {
			var obj, lists, list;

			if (
				(obj = incomplete[info.site]) !== undefined &&
				(lists = obj.unchecked[info.type]) !== undefined
			) {
				list = lists[info.gid];
				if (list !== undefined) {
					list[1].push(link);
				}
				else {
					lists[info.gid] = [ info, [ link ] ];
				}
			}
		};

		var setup_post_exsauce = function (post) {
			var index = 0,
				event, file_infos, file_info, sauce, i, ii;

			// File info
			file_infos = Post.get_file_info(post);
			for (i = 0, ii = file_infos.length; i < ii; ++i) {
				file_info = file_infos[i];
				if (file_info.md5 === null) continue;

				// Create if not found
				sauce = $(".hl-exsauce-link", file_info.options);
				if (sauce !== null) $.remove(sauce);

				if (/^\.(png|gif|jpe?g)$/i.test(file_info.type)) {
					event = "exsauce_fetch";
					sauce = $.link(file_info.url, "hl-exsauce-link", Sauce.label());
					sauce.setAttribute("data-hl-filename", file_info.name);
					sauce.setAttribute("data-hl-image-index", index);
					sauce.setAttribute("data-md5", file_info.md5.replace(/=+/g, ""));
					if (/^\.jpe?g$/i.test(file_info.type) && !Config.is_tinyboard) {
						if (browser.is_firefox) {
							event = "exsauce_fetch_similarity";
							sauce.title = "This will only work on colored images";
						}
						else {
							event = "exsauce_error";
							sauce.title = "Reverse Image Search doesn't work for .jpg images because 4chan manipulates them on upload";
							sauce.classList.add("hl-exsauce-link-disabled");
						}
					}

					change_link_events(sauce, event);

					Post.create_image_meta_link(file_info, sauce);

					++index;
				}
			}
		};
		var parse_post = function (post) {
			var auto_load_links = config.general.automatic_processing,
				post_body, post_links, links, link, i, ii;

			// Exsauce
			if (config.sauce.enabled && !browser.is_opera) {
				setup_post_exsauce(post);
			}

			if ((post_body = Post.get_text_body(post)) !== null) {
				// Content
				re_url.lastIndex = 0;
				if (!Config.linkify || re_url.test(post_body.innerHTML)) {
					links = [];
					post_links = Post.get_body_links(post_body);
					for (i = 0, ii = post_links.length; i < ii; ++i) {
						link = post_links[i];
						if (link.classList.contains("hl-site-tag")) {
							$.remove(link);
						}
						else {
							re_url.lastIndex = 0;
							if (re_url.test(link.href)) {
								link.classList.add("hl-linkified");
								link.classList.add("hl-linkified-gallery");
								link.target = "_blank";
								link.rel = "noreferrer";
								link.setAttribute("data-hl-linkified-status", "unprocessed");
								links.push(link);
							}
						}
					}

					if (Config.linkify) {
						linkify(post_body, links);
					}

					for (i = 0, ii = links.length; i < ii; ++i) {
						preprocess_link(links[i], auto_load_links);
					}
				}
				post.classList.add("hl-post-linkified");
			}
		};
		var parse_posts = function (posts) {
			var post, i, ii;

			Debug.timer("process");

			for (i = 0, ii = posts.length; i < ii; ++i) {
				post = posts[i];
				if (post.classList.contains("hl-post-linkified")) {
					UI.cleanup_post(post);
					apply_link_events(post, true);
				}
				else {
					parse_post(post);
				}
			}

			Debug.log("Total posts=" + posts.length + "; time=" + Debug.timer("process"));

			// Check incomplete, then run any API requests
			if (check_incomplete()) {
				API.run_request_queue();
			}
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

		var get_link_events = function (node) {
			return node.getAttribute("data-hl-link-events") || null;
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
			var nodes = check_children ? $$("a.hl-link-events", node) : [ node ],
				events, i, ii;

			for (i = 0, ii = nodes.length; i < ii; ++i) {
				node = nodes[i];
				events = node.getAttribute("data-hl-link-events");
				set_link_events(node, events);
			}
		};

		// Public
		var queue_posts = function (posts, flags) {
			if ((flags & queue_posts.Flags.Flush) !== 0) {
				// Flush
				parse_posts(post_queue.posts);
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
		};
		var preprocess_link = function (node, auto_load) {
			var url, info, rewrite, button, par;

			if (
				(par = node.parentNode) === null ||
				(info = Helper.get_url_info((url = node.href))) === null
			) {
				node.classList.remove("hl-linkified-gallery");
				node.removeAttribute("data-hl-linkified-status");
			}
			else {
				if (info.site === "ehentai") {
					rewrite = config.general.rewrite_links;
					if (
						(rewrite === domains.exhentai || rewrite === domains.ehentai) &&
						info.domain !== rewrite
					) {
						info.domain = rewrite;
						url = Helper.change_url_domain(url, domain_info[rewrite].g_domain);
						node.href = url;
					}
				}

				node.classList.add("hl-linkified");
				node.classList.add("hl-linkified-gallery");
				node.setAttribute("data-hl-linkified-status", "processed");

				node.setAttribute("data-hl-info", JSON.stringify(info));
				node.setAttribute("data-hl-id", info.site + "_" + info.gid);

				button = UI.button(url, info.domain);

				change_link_events(node, "gallery_link");
				change_link_events(button, "gallery_fetch");

				$.before(par, node, button);

				if (auto_load) check_link(node, info);
			}
		};
		var change_link_events = function (node, new_events) {
			var old_events = node.getAttribute("data-hl-link-events"),
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
				node.classList.remove("hl-link-events");
				node.removeAttribute("data-hl-link-events");
			}
			else {
				node.classList.add("hl-link-events");
				node.setAttribute("data-hl-link-events", new_events);
				set_link_events(node, new_events);
			}
		};
		var check_incomplete = function (type) {
			var api_request = false,
				obj, list1, list2, entry, data, info, t1, t2, fn_missing, i, ii, j, jj, k, m;

			i = 0;
			t1 = incomplete.types;
			if (type === undefined) {
				ii = t1.length;
				obj = incomplete[t1[i]];
			}
			else {
				ii = 1;
				obj = incomplete[type];
			}

			while (true) {
				t2 = obj.types;
				for (j = 0, jj = t2.length; j < jj; ++j) {
					m = t2[j];
					fn_missing = obj.missing[m];

					list1 = obj.checked[m];
					for (k in list1) {
						entry = list1[k];
						info = entry[0];
						data = Database.get(info.site, k);
						if (data !== null) {
							format(entry[1], data);
							delete list1[k];
						}
						else if ((data = Database.get_error(info.site, k)) !== null) {
							format_links_error(entry[1], data);
							delete list1[k];
						}
					}

					list2 = obj.unchecked[m];
					for (k in list2) {
						entry = list2[k];
						info = entry[0];
						data = Database.get(info.site, k);
						if (data !== null) {
							format(entry[1], data);
						}
						else {
							api_request = true;
							fn_missing.call(null, k, info);
							list1[k] = entry;
						}
						delete list2[k];
					}
				}

				if (++i >= ii) break;
				obj = incomplete[t1[i]];
			}

			return api_request;
		};
		var create_link = function (text) {
			return $.link(text, "hl-linkified", text);
		};
		var get_links = function (parent) {
			return $$("a.hl-linkified-gallery[href]", parent);
		};
		var get_links_formatted = function (parent) {
			return $$("a.hl-linkified-gallery[data-hl-linkified-status=formatted]", parent);
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
		var trigger = function (event_name) {
			var queue = event_queue[event_name],
				listeners, i, ii;
			if (queue && queue.length > 0) {
				listeners = event_listeners[event_name];
				for (i = 0, ii = listeners.length; i < ii; ++i) {
					listeners[i].call(null, queue);
				}

				event_queue[event_name] = [];
			}
		};

		var relinkify_posts = function (posts) {
			var post, links, i, ii, j, jj;

			for (i = 0, ii = posts.length; i < ii; ++i) {
				post = posts[i];
				post.classList.remove("hl-post-linkified");

				links = $$(".hl-site-tag", post);
				for (j = 0, jj = links.length; j < jj; ++j) {
					$.remove(links[j]);
				}

				links = $$(".hl-link-events", post);
				for (j = 0, jj = links.length; j < jj; ++j) {
					change_link_events(links[j], null);
				}
			}

			queue_posts(posts, queue_posts.Flags.Flush | queue_posts.Flags.UseDelay);
		};
		var fix_broken_4chanx_linkification = function (node, event_links) {
			// Somehow one of the links gets cloned, and then they all get wrapped inside another link
			var fix = [],
				n = node.nextSibling,
				link, events, i, ii;

			if (n !== null && n.tagName === "A" && n.classList.contains("hl-linkified")) {
				$.remove(n);
			}

			n = node.previousSibling;
			if (n !== null && n.tagName === "A" && n.classList.contains("hl-site-tag")) {
				$.remove(n);
			}

			for (i = 0, ii = event_links.length; i < ii; ++i) {
				link = event_links[i];
				events = get_link_events(link);
				change_link_events(link, null);

				if (link.classList.contains("hl-site-tag")) {
					$.remove(link);
				}
				else if (link.classList.contains("hl-linkified")) {
					fix.push(link, events);
				}
			}

			$.unwrap(node);

			for (i = 0, ii = fix.length; i < ii; i += 2) {
				link = fix[i];
				preprocess_link(link, config.general.automatic_processing);
			}
		};

		// Exports
		return {
			preprocess_link: preprocess_link,
			queue_posts: queue_posts,
			change_link_events: change_link_events,
			check_incomplete: check_incomplete,
			create_link: create_link,
			get_links: get_links,
			get_links_formatted: get_links_formatted,
			relinkify_posts: relinkify_posts,
			fix_broken_4chanx_linkification: fix_broken_4chanx_linkification,
			on: on,
			off: off
		};

	})();
	var Settings = (function () {

		// Private
		var config_temp = null,
			export_url = null,
			popup = null;

		var html_options = function () {
			return '#OPTIONS#';
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
		var gen = function (container, theme, option_type) {
			var config_scope = config_temp[option_type],
				entry, table, row, cell, label, input, event,
				args, values, id, name, desc, type, value, obj, label_text, ext, i, ii, j, jj, n, v;

			// [ name, default, label, description, old_name, formatter, info? ]
			args = options[option_type];
			if (arguments.length > 3) args = Array.prototype.concat.call(args, Array.prototype.slice.call(arguments, 3));

			for (i = 0, ii = args.length; i < ii; ++i) {
				obj = args[i];
				name = obj[0];
				label_text = obj[2];
				desc = obj[3];
				ext = (obj.length > 5 ? obj[5] : null);
				if (ext === null || (type = ext.type) === undefined) type = "checkbox";
				value = (name === null ? null : config_scope[name]);
				id = "hl-settings-" + option_type + "-" + i;
				event = "change";

				$.add(container, entry = $.node("div", "hl-settings-entry" + theme));
				$.add(entry, table = $.node("div", "hl-settings-entry-table"));
				$.add(table, row = $.node("div", "hl-settings-entry-row"));

				$.add(row, cell = $.node("span", "hl-settings-entry-cell"));
				$.add(cell, label = $.node("label", "hl-settings-entry-label"));
				label.htmlFor = id;
				$.add(label, $.node("strong", "hl-settings-entry-label-name", label_text + ":"));
				if (desc.length > 0) {
					n = $.node("span", "hl-settings-entry-label-description");
					n.innerHTML = " " + desc;
					$.add(label, n);
				}

				if (type === "checkbox") {
					$.add(row, cell = $.node("span", "hl-settings-entry-cell"));
					$.add(cell, input = $.node("input", "hl-settings-entry-input" + theme));
					input.type = "checkbox";
					input.id = id;
					input.checked = value;
				}
				else if (type === "select") {
					$.add(row, cell = $.node("span", "hl-settings-entry-cell"));
					$.add(cell, input = $.node("select", "hl-settings-entry-input" + theme));

					values = ext.options;
					for (j = 0, jj = values.length; j < jj; ++j) {
						v = values[j];
						$.add(input, n = $.node("option", "hl-settings-entry-input-option", v[1]));
						n.value = v[0];
						n.selected = (v[0] === value);
						if (v.length > 2) n.title = v[2];
					}
				}
				else if (type === "textbox") {
					$.add(row, cell = $.node("span", "hl-settings-entry-cell"));
					$.add(cell, input = $.node("input", "hl-settings-entry-input" + theme));
					input.type = "text";
					input.id = id;
					input.value = value;
				}
				else if (type === "textarea") {
					$.add(table, row = $.node("div", "hl-settings-entry-row"));
					$.add(row, cell = $.node("span", "hl-settings-entry-cell"));
					$.add(cell, input = $.node("textarea", "hl-settings-entry-input" + theme));
					input.wrap = "off";
					input.spellcheck = false;
					input.id = id;
					input.value = value;
				}
				else if (type === "button") {
					$.add(row, cell = $.node("span", "hl-settings-entry-cell"));
					$.add(cell, input = $.node("button", "hl-settings-entry-input" + theme, ext.text || ""));
					event = "click";
				}

				$.on(input, event, $.bind(on_change, input, type, option_type, name, ext));
			}
		};

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
		};
		var on_cache_clear_click = function (event) {
			if ($.is_left_mouse(event)) {
				event.preventDefault();

				var clears = Cache.clear();
				Debug.log("Cleared cache; localStorage=" + clears[0] + "; sessionStorage=" + clears[1]);
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
				config_temp = null;

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
					if (n.classList.contains("hl-settings-filter-guide")) {
						n.classList.toggle("hl-settings-filter-guide-visible");
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
			Navigation.insert_link("main", "#TITLE#", Main.homepage, " hl-nav-link-settings", on_settings_open_click);

			var n = $.link(Main.homepage, "hl-nav-link", "#TITLE# Settings");
			$.on(n, "click", on_settings_open_click);
			HeaderBar.insert_menu_link(n);
		};
		var open = function () {
			var theme = Theme.get(),
				n;

			// Config
			config_temp = JSON.parse(JSON.stringify(config));

			// Popup
			popup = Popup.create("settings", [[{
				small: true,
				setup: function (container) {
					var n;
					$.add(container, $.link(Main.homepage, "hl-settings-title" + theme, "#TITLE#"));
					$.add(container, n = $.link(Changelog.url, "hl-settings-version" + theme, Main.version.join(".")));
					$.on(n, "click", on_changelog_click);
				}
			}, {
				align: "right",
				setup: function (container) {
					var n;
					$.add(container, n = $.link("#ISSUES#", "hl-settings-button" + theme));
					$.add(n, $.node("span", "hl-settings-button-text", "Issues"));

					$.add(container, n = $.link(Changelog.url, "hl-settings-button" + theme));
					$.add(n, $.node("span", "hl-settings-button-text", "Changelog"));
					$.on(n, "click", on_changelog_click);

					$.add(container, n = $.link("#", "hl-settings-button" + theme));
					$.add(n, $.node("span", "hl-settings-button-text", "Export"));
					$.on(n, "click", on_export_click);

					$.add(container, n = $.link("#", "hl-settings-button" + theme));
					$.add(n, $.node("span", "hl-settings-button-text", "Save settings"));
					$.on(n, "click", on_save_click);

					$.add(container, n = $.link("#", "hl-settings-button" + theme));
					$.add(n, $.node("span", "hl-settings-button-text", "Cancel"));
					$.on(n, "click", on_cancel_click);
				}
			}], {
				body: true,
				setup: function (container) {
					var n = $.frag(html_options());
					Theme.apply(n);

					$.add(container, n);
				}
			}]);

			// Settings
			gen($(".hl-settings-group-general", popup), theme, "general");
			gen($(".hl-settings-group-details", popup), theme, "details");
			gen($(".hl-settings-group-actions", popup), theme, "actions");
			gen($(".hl-settings-group-sauce", popup), theme, "sauce");
			gen($(".hl-settings-group-filter", popup), theme, "filter");
			gen($(".hl-settings-group-debug", popup), theme, "debug",
				[ null, null,
					"Clear cache data", "Clear all cached gallery data",
					null,
					{ type: "button", text: "Clear", on_change: on_cache_clear_click },
				]
			);

			// Events
			$.on(popup, "click", on_cancel_click);
			$.on($("input.hl-settings-color-input[type=color]", popup), "change", on_color_helper_change);
			$.on($(".hl-settings-filter-guide-toggle", popup), "click", on_toggle_filter_guide);

			// Add to body
			Popup.open(popup);

			// Focus
			n = $(".hl-popup-cell-size-scroll", popup);
			if (n !== null) $.scroll_focus(n);
		};
		var open_export = function () {
			var theme = Theme.get(),
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
					$.add(container, $.link(Main.homepage, "hl-settings-title" + theme, "#TITLE#"));
					$.add(container, $.node("span", "hl-settings-title-info" + theme, " - Settings export"));
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

					fn = $.node("input", "hl-settings-file-input");
					fn.type = "file";
					fn.accept = ".json";
					$.add(container, fn);
					$.on(fn, "change", function () {
						var files = this.files,
							reader;
						if (files.length > 0 && /\.json$/i.test(files[0].name)) {
							reader = new FileReader();
							reader.addEventListener("load", function () {
								var d = Helper.json_parse_safe(this.result, null);
								if (d !== null) {
									nodes.textarea.value = JSON.stringify(d, null, 2);
									nodes.textarea.classList.add("hl-settings-export-textarea-changed");
								}
							}, false);
							reader.readAsText(files[0]);
						}
						this.value = null;
					});

					$.add(container, n = $.link(undefined, "hl-settings-button" + theme));
					$.add(n, $.node("span", "hl-settings-button-text", "Import"));
					$.on(n, "click", function (event) {
						event.preventDefault();
						fn.click();
					});

					$.add(container, n = $.link(export_url, "hl-settings-button" + theme));
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
					$.add(n, $.node("span", "hl-settings-button-text", "Export"));

					$.add(container, n = $.link("#", "hl-settings-button" + theme));
					$.add(n, $.node("span", "hl-settings-button-text", "Save settings"));
					$.on(n, "click", function (event) {
						if ($.is_left_mouse(event)) {
							event.preventDefault();
							var v = Helper.json_parse_safe(nodes.textarea.value, null);
							if (v !== null) {
								nodes.textarea.classList.remove("hl-settings-export-textarea-error");
								import_settings(v);
							}
							else {
								nodes.textarea.classList.add("hl-settings-export-textarea-error");
							}
							nodes.textarea.classList.remove("hl-settings-export-textarea-changed");
						}
					});

					$.add(container, n = $.link("#", "hl-settings-button" + theme));
					$.add(n, $.node("span", "hl-settings-button-text", "Cancel"));
					$.on(n, "click", on_cancel_click);
				}
			}], {
				padding: false,
				setup: function (container) {
					var n1, n2, n3;

					$.add(container, n1 = $.node("div", "hl-settings-export-message", "Disclaimer: changing these settings can easily break things. Edit at your own risk. ("));

					$.add(n1, n2 = $.node("label", "hl-settings-export-label"));
					$.add(n2, n3 = $.node("input", "hl-settings-export-checkbox"));
					$.add(n2, $.node("span", "hl-settings-export-label-text", "Enable editing"));
					$.add(n2, $.node("span", "hl-settings-export-label-text", "Editing enabled"));
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

					n = $.node("textarea", "hl-settings-export-textarea" + theme);
					n.spellcheck = false;
					n.wrap = "off";
					n.value = export_data_string;
					n.readOnly = true;
					$.on(n, "input", function () {
						this.classList.add("hl-settings-export-textarea-changed");
					});

					nodes.textarea = n;

					$.add(container, n);
				}
			}]);
			$.on(popup, "click", on_cancel_click);

			// Add to body
			Popup.open(popup);

			// Focus
			n = $(".hl-settings-export-textarea", popup);
			if (n !== null) n.focus();
		};
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
		var settings_key = "#PREFIX#settings";

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
			var domain = Helper.get_domain(window.location.href);

			if (domain === "4chan.org") {
				Module.mode = "4chan";
				Module.is_4chan = true;
				Module.is_4chan_x3 = d.documentElement.classList.contains("fourchan-x");
			}
			else if (domain === "desustorage.org" || domain === "archive.moe") {
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
			return Helper.json_parse_safe(storage.getItem(settings_key), null);
		};
		var set_saved_settings = function (data) {
			if (data === null) {
				storage.removeItem(settings_key);
			}
			else {
				storage.setItem(settings_key, JSON.stringify(data));
			}
		};

		// Exports
		var Module = {
			mode: "4chan", // foolz, fuuka, tinyboard
			is_4chan: false,
			is_4chan_x3: false,
			is_foolz: false,
			is_fuuka: false,
			is_tinyboard: false,
			linkify: true,
			storage: storage,
			init: init,
			ready: ready,
			save: save,
			get_saved_settings: get_saved_settings,
			set_saved_settings: set_saved_settings
		};

		return Module;

	})();
	var Filter = (function () {

		// Private
		var active_filters = null,
			regex_default_flags = "colors:#EE2200;",
			good_values = [ "", "true", "yes" ],
			Status = { None: 0, Bad: -1, Good: 1 },
			cache = { tags: {} };

		var Filter = function (regex, flags, priority) {
			this.regex = regex;
			this.flags = flags;
			this.priority = priority;
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
		var parse_flags = function (text) {
			var flaglist = text.split(";"),
				flags = {},
				key, m, i;

			for (i = 0; i < flaglist.length; ++i) {
				if (flaglist[i].length > 0) {
					m = flaglist[i].split(":");
					key = m[0].trim().toLowerCase();
					m.splice(0, 1);
					flags[key] = m.join("").trim();
				}
			}

			return normalize_flags(flags);
		};
		var normalize_flags = function (flags) {
			var any = false,
				norm = {
					title: true,
					tags: true,
					uploader: false,
					link: {},
				},
				v;

			if (flags.title !== undefined || flags.tags !== undefined || flags.tag !== undefined || flags.uploader !== undefined) {
				norm.title = ((v = flags.title) === undefined ? false : good_values.indexOf(v.trim().toLowerCase()) >= 0);
				norm.tags = ((v = flags.tags) === undefined && (v = flags.tag) === undefined ? false : good_values.indexOf(v.trim().toLowerCase()) >= 0);
				norm.uploader = ((v = flags.uploader) === undefined ? false : good_values.indexOf(v.trim().toLowerCase()) >= 0);
				any = true;
			}

			if (
				((v = flags.only) !== undefined || (v = flags.category) !== undefined || (v = flags.cat) !== undefined) &&
				v.length > 0
			) {
				norm.only = normalize_split(v);
				any = true;
			}
			if (
				((v = flags.not) !== undefined || (v = flags.no) !== undefined) &&
				v.length > 0
			) {
				norm.not = normalize_split(v);
				any = true;
			}
			if ((v = flags.bad) !== undefined && (good_values.indexOf(v.trim().toLowerCase()) >= 0)) {
				norm.bad = true;
				any = true;
			}

			if ((v = flags.colors) !== undefined || (v = flags.cs) !== undefined) {
				v = v.trim();
				norm.color = v;
				norm.link.color = v;
				any = true;
			}
			if ((v = flags.backgrounds) !== undefined ||  (v = flags.bgs) !== undefined) {
				v = v.trim();
				norm.background = v;
				norm.link.background = v;
				any = true;
			}
			if ((v = flags.underlines) !== undefined || (v = flags.us) !== undefined) {
				v = v.trim();
				norm.underline = v;
				norm.link.underline = v;
				any = true;
			}

			if ((v = flags.color) !== undefined || (v = flags.c) !== undefined) {
				norm.color = v.trim();
				any = true;
			}
			if ((v = flags.background) !== undefined ||  (v = flags.bg) !== undefined) {
				norm.background = v.trim();
				any = true;
			}
			if ((v = flags.underline) !== undefined || (v = flags.u) !== undefined) {
				norm.underline = v.trim();
				any = true;
			}

			if ((v = flags["link-color"]) !== undefined || (v = flags["link-c"]) !== undefined || (v = flags.lc) !== undefined) {
				norm.link.color = v.trim();
				any = true;
			}
			if ((v = flags["link-background"]) !== undefined || (v = flags["link-bg"]) !== undefined || (v = flags.lbg) !== undefined) {
				norm.link.background = v.trim();
				any = true;
			}
			if ((v = flags["link-underline"]) !== undefined || (v = flags["link-u"]) !== undefined || (v = flags.lu) !== undefined) {
				norm.link.underline = v.trim();
				any = true;
			}

			return any ? norm : null;
		};
		var normalize_split = function (text) {
			var array = text.split(","),
				i;
			for (i = 0; i < array.length; ++i) {
				array[i] = array[i].trim().toLowerCase();
			}
			return array;
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
				if ((s = style.color) !== undefined && p >= p1) {
					color = s;
					p1 = p;
				}
				if ((s = style.background) !== undefined && p >= p2) {
					background = s;
					p2 = p;
				}
				if ((s = style.underline) !== undefined && p >= p3) {
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
		var check_multiple = function (type, text, filters, category) {
			var info = new MatchInfo(),
				filter, match, i, ii;

			for (i = 0, ii = filters.length; i < ii; ++i) {
				filter = filters[i];
				if (filter.flags[type] !== true) continue;
				filter.regex.lastIndex = 0;
				while (true) {
					match = check_single(text, filter, category);
					if (match === false) break;

					info.any = true;
					if (match !== true) {
						info.matches.push(match);
						if (match.filter.flags.bad) {
							info.bad = true;
						}
					}
				}
			}

			return info;
		};
		var check_single = function (text, filter, category) {
			// return false if no match
			// return true if a match was found, but the filter has no flags
			// return a new Match if a match was found and the filter has flags
			var list, i, ii, m;

			m = filter.regex.exec(text);
			if (filter.flags === null) {
				return (m !== null);
			}

			// Category filtering
			if ((list = filter.flags.only) !== undefined) {
				for (i = 0, ii = list.length; i < ii; ++i) {
					if (list[i] === category) {
						break;
					}
				}
				if (i >= ii) return false;
			}
			if ((list = filter.flags.not) !== undefined) {
				for (i = 0, ii = list.length; i < ii; ++i) {
					if (list[i] === category) {
						return false;
					}
				}
			}

			// Text filter
			return (m === null) ? false : new Match(m.index, m.index + m[0].length, filter);
		};
		var hl_return = function (bad, node) {
			if (bad) {
				node.classList.add("hl-filter-bad");
				return Status.Bad;
			}
			else {
				node.classList.add("hl-filter-good");
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
						flags = parse_flags((pos < line.length) ? line.substr(pos) : regex_default_flags);
						filters.push(new Filter(regex, flags, start_priority));
						++start_priority;
					}
				}
				else if (line[0] !== "#") {
					if ((pos = line.indexOf(";")) > 0) {
						regex = line.substr(0, pos);
						flags = (pos < line.length) ? parse_flags(line.substr(pos)) : null;
					}
					else {
						regex = line;
						flags = parse_flags(regex_default_flags);
					}
					regex = new RegExp(Helper.regex_escape(regex), "ig");

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
				category = Helper.category(data.category).short,
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
				(c = cache_type[category]) !== undefined &&
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
				return hl_return(n1.classList.contains("hl-filter-bad"), node);
			}

			// Check filters
			info = check_multiple(type, text, filters, category);
			if (!info.any) {
				if (cache_type !== undefined) {
					if ((c = cache_type[category]) === undefined) {
						cache_type[category] = c = {};
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
					n1 = $.node("span", "hl-filter-text");
					n2 = $.node("span", "hl-filter-text-inner", t);
					$.add(n1, n2);
					$.add(frag, n1);
					apply_styles(n1, segment.data);
				}
			}

			// Replace
			node.innerHTML = "";
			$.add(node, frag);
			if (cache_type !== undefined) {
				if ((c = cache_type[category]) === undefined) {
					cache_type[category] = c = {};
				}
				c[text] = [ info, node ];
			}
			return hl_return(bad, node);
		};
		var highlight_tag = function (node, link, filter_data) {
			if (filter_data[0] === Status.Bad) {
				node.classList.add("hl-filter-bad");
				link.classList.add("hl-filter-bad");
				link.classList.remove("hl-filter-good");
			}
			else {
				node.classList.add("hl-filter-good");
				link.classList.add("hl-filter-good");
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
					style = styles[i].flags.link;
					if ((s = style.color) !== undefined && p >= p1) {
						color = s;
						p1 = p;
					}
					if ((s = style.background) !== undefined && p >= p2) {
						background = s;
						p2 = p;
					}
					if ((s = style.underline) !== undefined && p >= p3) {
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
				n1 = $.node("span", "hl-filter-text");
				n2 = $.node("span", "hl-filter-text-inner");
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
				category = Helper.category(data.category).short,
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
					info = check_multiple("uploader", str, filters, category);
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
						info = check_multiple("tags", tags[i], filters, category);
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
			current_get = " hl-theme",
			post_bg = "transparent";

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

			n.className = "post reply post_wrapper hl-fake-post";
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
					current_get = (current === "light" ? " hl-theme" : " hl-theme hl-theme-dark");
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
			var nodes = $$("hl-theme"),
				ii = nodes.length,
				cls, i;
			if (new_theme === "light") {
				cls = "hl-theme-" + current;
				for (i = 0; i < ii; ++i) {
					nodes[i].classList.remove(cls);
				}
			}
			else {
				cls = "hl-theme-" + new_theme;
				for (i = 0; i < ii; ++i) {
					nodes[i].classList.add(cls);
				}
			}
		};
		var update_nodes_bg = function () {
			var nodes = $$("hl-theme-post-bg"),
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

			if (MutationObserver !== null && d.head) {
				new MutationObserver(on_head_mutate).observe(d.head, { childList: true });
			}
		};
		var get = function () {
			return current_get;
		};
		var bg = function (node) {
			node.classList.add("hl-theme-post-bg");
			node.style.backgroundColor = post_bg;
		};
		var apply = function (node) {
			if (current !== "light") {
				var nodes = $$(".hl-theme", node),
					i, ii;

				for (i = 0, ii = nodes.length; i < ii; ++i) {
					nodes[i].classList.add("hl-theme-dark");
				}

				if (node.classList && node.classList.contains("hl-theme")) {
					node.classList.add("hl-theme-dark");
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
		return {
			ready: ready,
			get: get,
			bg: bg,
			apply: apply,
			get_computed_style: get_computed_style,
			parse_css_color: parse_css_color
		};

	})();
	var EasyList = (function () {

		// Private
		var settings_key = "#PREFIX#easylist-settings",
			popup = null,
			options_container = null,
			items_container = null,
			empty_notification = null,
			queue = [],
			current = [],
			data_map = {},
			queue_timer = null,
			custom_filters = [],
			node_sort_order_keys = {
				thread: [ "data-hl-index", 1 ],
				upload: [ "data-hl-date-uploaded", -1 ],
				rating: [ "data-hl-rating", -1 ]
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
				display_mode: 0 // 0 = full, 1 = compact, 2 = minimal
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
				var theme = Theme.get(),
					n1, n2;

				// Overlay
				$.add(container, n1 = $.node("div", "hl-easylist-title"));

				$.add(n1, $.node("span", "hl-easylist-title-text", "#TITLE# Easy List"));
				$.add(n1, $.node("span", "hl-easylist-subtitle", "More porn, less hassle"));

				// Close
				$.add(container, n1 = $.node("div", "hl-easylist-control-links"));

				$.add(n1, n2 = $.link(undefined, "hl-easylist-control-link hl-easylist-control-link-options", "options"));
				$.on(n2, "click", on_options_click);

				$.add(n1, n2 = $.link(undefined, "hl-easylist-control-link", "close"));
				$.on(n2, "click", on_close_click);

				$.add(container, $.node("div", "hl-easylist-title-line"));

				// Settings
				options_container = create_options(theme);
				$.add(container, options_container);

				// Empty notification
				empty_notification = $.node("div",
					"hl-easylist-empty-notification hl-easylist-empty-notification-visible",
					"No galleries found"
				);
				$.add(container, empty_notification);

				// Items list
				items_container = $.node("div", "hl-easylist-items" + theme);
				$.add(container, items_container);
			});

			$.on(popup, "click", on_overlay_click);

			// Setup
			update_display_mode(true);
		};
		var create_options = function (theme) {
			var fn, n1, n2, n3, n4, n5;

			n1 = $.node("div", "hl-easylist-options");
			$.add(n1, n2 = $.node("div", "hl-easylist-option-table"));


			$.add(n2, n3 = $.node("div", "hl-easylist-option-row"));
			$.add(n3, n4 = $.node("div", "hl-easylist-option-cell"));
			$.add(n4, $.node("span", "hl-easylist-option-title", "Sort by:"));

			$.add(n3, n4 = $.node("div", "hl-easylist-option-cell"));

			fn = function (value, text) {
				var n1 = $.node("label", "hl-easylist-option-label"),
					n2 = $.node("input", "hl-easylist-option-input");

				n2.name = "hl-easylist-options-sort-by";
				n2.type = "radio";
				n2.checked = (settings.sort_by === value);
				n2.value = value;

				$.add(n1, n2);
				$.add(n1, $.node("span", "hl-easylist-option-button" + theme, text));

				$.on(n2, "change", on_option_change.sort_by);

				return n1;
			};
			$.add(n4, fn("thread", "Appearance in thread"));
			$.add(n4, fn("upload", "Upload date"));
			$.add(n4, fn("rating", "Rating"));

			$.add(n2, n3 = $.node("div", "hl-easylist-option-row"));
			$.add(n3, n4 = $.node("div", "hl-easylist-option-cell"));
			$.add(n4, $.node("span", "hl-easylist-option-title", "Group by:"));

			$.add(n3, n4 = $.node("div", "hl-easylist-option-cell"));

			fn = function (checked, text) {
				var n1 = $.node("label", "hl-easylist-option-label"),
					n2 = $.node("input", "hl-easylist-option-input");

				n2.type = "checkbox";
				n2.checked = checked;

				$.add(n1, n2);
				$.add(n1, $.node("span", "hl-easylist-option-button" + theme, text));

				$.on(n2, "change", on_option_change.group_by_filters);

				return n1;
			};
			$.add(n4, fn(settings.group_by_filters, "Filters"));
			$.add(n4, fn(settings.group_by_category, "Category"));


			$.add(n2, n3 = $.node("div", "hl-easylist-option-row"));
			$.add(n3, n4 = $.node("div", "hl-easylist-option-cell"));
			$.add(n4, $.node("span", "hl-easylist-option-title", "Display mode:"));

			$.add(n3, n4 = $.node("div", "hl-easylist-option-cell"));

			fn = function (value, text) {
				var n1 = $.node("label", "hl-easylist-option-label"),
					n2 = $.node("input", "hl-easylist-option-input");

				n2.name = "hl-easylist-options-display";
				n2.type = "radio";
				n2.checked = (settings.display_mode === value);
				n2.value = "" + value;

				$.add(n1, n2);
				$.add(n1, $.node("span", "hl-easylist-option-button" + theme, text));

				$.on(n2, "change", on_option_change.display_mode);

				return n1;
			};
			$.add(n4, fn(0, "Full"));
			$.add(n4, fn(1, "Compact"));
			$.add(n4, fn(2, "Minimal"));


			$.add(n2, n3 = $.node("div", "hl-easylist-option-row"));
			$.add(n3, n4 = $.node("div", "hl-easylist-option-cell"));
			$.add(n4, $.node("span", "hl-easylist-option-title", "Custom filters:"));

			$.add(n3, n4 = $.node("div", "hl-easylist-option-cell"));

			$.add(n4, n5 = $.node("textarea", "hl-easylist-option-textarea" + theme));
			n5.value = settings.custom_filters;
			n5.wrap = "off";
			n5.spellcheck = false;
			$.on(n5, "change", on_option_change.custom_filters);
			$.on(n5, "input", on_option_change.custom_filters_input);


			$.add(n1, $.node("div", "hl-easylist-title-line"));

			return n1;
		};
		var create_gallery_nodes = function (data, theme, index, domain) {
			var url = CreateURL.to_gallery(data, domain),
				n1, n2, n3, n4, n5, n6, n7, i;

			n1 = $.node("div", "hl-easylist-item" + theme);
			n1.setAttribute("data-hl-index", index);
			n1.setAttribute("data-hl-gid", data.gid);
			if (data.token !== null) n1.setAttribute("data-hl-token", data.token);
			n1.setAttribute("data-hl-rating", data.rating);
			n1.setAttribute("data-hl-date-uploaded", data.upload_date);
			n1.setAttribute("data-hl-category", data.category.toLowerCase());
			n1.setAttribute("data-hl-domain", domain);

			$.add(n1, n2 = $.node("div", "hl-easylist-item-table-container" + theme));
			$.add(n2, n3 = $.node("div", "hl-easylist-item-table" + theme));
			n2 = n3;
			$.add(n2, n3 = $.node("div", "hl-easylist-item-row" + theme));
			$.add(n3, n4 = $.node("div", "hl-easylist-item-cell hl-easylist-item-cell-image" + theme));

			// Image
			$.add(n4, n5 = $.link(url, "hl-easylist-item-image-container" + theme));

			$.add(n5, n6 = $.node("div", "hl-easylist-item-image-outer" + theme));

			if (data.thumbnail !== null) {
				$.add(n6, n7 = $.node("img", "hl-easylist-item-image" + theme));
				$.on(n7, "error", on_thumbnail_error);
				n7.alt = "";

				API.get_thumbnail(data, $.bind(function (err, url) {
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

			$.add(n6, $.node("span", "hl-easylist-item-image-index" + theme, "#" + (index + 1)));


			// Main content
			$.add(n3, n4 = $.node("div", "hl-easylist-item-cell" + theme));

			$.add(n4, n5 = $.node("div", "hl-easylist-item-title" + theme));

			$.add(n5, n6 = $.link(url, "hl-easylist-item-title-tag-link" + theme, UI.button_text(domain)));
			n6.setAttribute("data-hl-original", n6.textContent);

			$.add(n5, n6 = $.link(url, "hl-easylist-item-title-link" + theme, data.title));
			n6.setAttribute("data-hl-original", n6.textContent);

			if (data.title_jpn !== null) {
				$.add(n4, n5 = $.node("span", "hl-easylist-item-title-jp" + theme, data.title_jpn));
				n5.setAttribute("data-hl-original", n5.textContent);
			}

			$.add(n4, n5 = $.node("div", "hl-easylist-item-upload-info" + theme));
			$.add(n5, $.tnode("Uploaded by "));
			$.add(n5, n6 = $.link(CreateURL.to_uploader(data, domain), "hl-easylist-item-uploader" + theme, data.uploader));
			n6.setAttribute("data-hl-original", n6.textContent);
			$.add(n5, $.tnode(" on "));
			$.add(n5, $.node("span", "hl-easylist-item-upload-date" + theme, UI.format_date(new Date(data.upload_date))));

			$.add(n4, n5 = $.node("div", "hl-easylist-item-tags" + theme));

			n6 = create_full_tags(domain, data, theme);
			$.add(n5, n6[0]);
			if (!n6[1]) {
				$.on(n1, "mouseover", on_gallery_mouseover);
			}


			// Right sidebar
			$.add(n3, n4 = $.node("div", "hl-easylist-item-cell hl-easylist-item-cell-side" + theme));

			$.add(n4, n5 = $.node("div", "hl-easylist-item-info" + theme));

			$.add(n5, n6 = $.link(CreateURL.to_category(data, domain),
				"hl-easylist-item-info-button hl-button hl-button-eh hl-button-" + Helper.category(data.category).short + theme
			));
			$.add(n6, $.node("div", "hl-noise", Helper.category(data.category).name));


			$.add(n5, n6 = $.node("div", "hl-easylist-item-info-item hl-easylist-item-info-item-rating" + theme));
			$.add(n6, n7 = $.node("div", "hl-stars-container"));
			$.add(n7, UI.create_rating_stars(data.rating));
			if (data.rating >= 0) {
				$.add(n6, $.node("span", "hl-easylist-item-info-light", "(Avg: " + data.rating.toFixed(2) + ")"));
			}
			else {
				n7.classList.add("hl-stars-container-na");
				$.add(n6, $.node("span", "hl-easylist-item-info-light", "(n/a)"));
			}

			$.add(n5, n6 = $.node("div", "hl-easylist-item-info-item hl-easylist-item-info-item-files" + theme));
			i = data.file_count;
			$.add(n6, $.node("span", "", i + " image" + (i === 1 ? "" : "s")));
			if (data.total_size >= 0) {
				$.add(n6, $.node_simple("br"));
				i = (data.total_size / 1024 / 1024).toFixed(2).replace(/\.?0+$/, "");
				$.add(n6, $.node("span", "hl-easylist-item-info-light", "(" + i + " MB)"));
			}

			// Highlight
			update_filters(n1, data, true, false);

			return n1;
		};
		var create_full_tags = function (domain, data, theme) {
			var n1 = $.node("div", "hl-easylist-item-tag-table" + theme),
				domain_type = domain_info[domain].type,
				full_domain = domain_info[domain].g_domain,
				namespace_style = "",
				all_tags, namespace, tags, n2, n3, n4, i, ii;

			if (API.data_has_full(data) && Object.keys(data.tags_ns).length > 0) {
				all_tags = data.tags_ns;
			}
			else {
				all_tags = { "": data.tags };
			}

			for (namespace in all_tags) {
				tags = all_tags[namespace];

				$.add(n1, n2 = $.node("div", "hl-easylist-item-tag-row" + theme));

				if (namespace !== "") {
					namespace_style = " hl-tag-namespace-" + namespace.replace(/\ /g, "-") + theme;
					$.add(n2, n3 = $.node("div", "hl-easylist-item-tag-cell hl-easylist-item-tag-cell-label" + theme));
					$.add(n3, n4 = $.node("span", "hl-tag-namespace-block hl-tag-namespace-block-no-outline" + namespace_style));
					$.add(n4, $.node("span", "hl-tag-namespace", namespace));
					$.add(n3, $.tnode(":"));
				}

				$.add(n2, n3 = $.node("div", "hl-easylist-item-tag-cell" + theme));
				n2 = n3;

				for (i = 0, ii = tags.length; i < ii; ++i) {
					$.add(n2, n3 = $.node("span", "hl-tag-block" + namespace_style));
					$.add(n3, n4 = $.link(CreateURL.to_tag(tags[i], domain_type, full_domain),
						"hl-tag hl-tag-color-inherit hl-easylist-item-tag",
						tags[i]
					));
					n4.setAttribute("data-hl-original", n4.textContent);

					if (i < ii - 1) $.add(n3, $.tnode(","));
				}
			}

			return [ n1, namespace !== "" ];
		};
		var add_gallery = function (entry, theme) {
			var data = Database.get(entry.namespace, entry.id),
				n;

			if (data !== null) {
				n = create_gallery_nodes(data, theme, current.length, entry.domain);

				Main.insert_custom_fonts();

				$.add(items_container, n);

				entry.node = n;
				current.push(entry);
			}
		};
		var add_gallery_complete = function () {
			set_empty(current.length === 0);

			if (settings.group_by_category || settings.group_by_filters || settings.sort_by !== "thread") {
				update_ordering();
			}
		};
		var set_empty = function (empty) {
			if (empty_notification !== null) {
				var cls = "hl-easylist-empty-notification-visible";
				if (empty !== empty_notification.classList.contains(cls)) {
					empty_notification.classList.toggle(cls);
				}
			}
		};
		var get_options_visible = function () {
			return options_container.classList.contains("hl-easylist-options-visible");
		};
		var set_options_visible = function (visible) {
			var n = $(".hl-easylist-control-link-options", popup),
				cl, cls;

			if (n !== null) {
				cl = n.classList;
				cls = "hl-easylist-control-link-focus";
				if (cl.contains(cls) !== visible) cl.toggle(cls);
			}

			cl = options_container.classList;
			cls = "hl-easylist-options-visible";
			if (cl.contains(cls) !== visible) cl.toggle(cls);
		};

		var get_category_ordering = function () {
			var cat_order = {},
				i = 0,
				k;

			for (k in categories) {
				cat_order[categories[k].short] = i;
				++i;
			}
			cat_order[""] = i;

			return cat_order;
		};
		var get_node_filter_group = function (node) {
			var v1 = parseInt(node.getAttribute("data-hl-filter-matches-title"), 10) || 0,
				v2 = parseInt(node.getAttribute("data-hl-filter-matches-title-bad"), 10) || 0,
				v3 = parseInt(node.getAttribute("data-hl-filter-matches-uploader"), 10) || 0,
				v4 = parseInt(node.getAttribute("data-hl-filter-matches-uploader-bad"), 10) || 0,
				v5 = parseInt(node.getAttribute("data-hl-filter-matches-tags"), 10) || 0,
				v6 = parseInt(node.getAttribute("data-hl-filter-matches-tags-bad"), 10) || 0;

			v2 += v4 + v6;
			if (v2 > 0) return -v2;
			return v1 + v3 + v5;
		};
		var get_node_category_group = function (node, ordering) {
			var k = node.getAttribute("data-hl-category") || "";
			return ordering[k in ordering ? k : ""];
		};
		var update_display_mode = function (first) {
			var mode = display_mode_names[settings.display_mode] || "",
				cl = items_container.classList,
				i, ii;

			if (!first) {
				for (i = 0, ii = display_mode_names.length; i < ii; ++i) {
					cl.remove("hl-easylist-" + display_mode_names[i]);
				}
			}

			cl.add("hl-easylist-" + mode);
		};
		var update_ordering = function () {
			var items = [],
				mode = settings.sort_by,
				ordering, base_array, item, attr, cat_order, n, n2, i, ii;

			// Grouping
			if (settings.group_by_filters) {
				if (settings.group_by_category) {
					cat_order = get_category_ordering();
					base_array = function (node) {
						return [ get_node_filter_group(node), get_node_category_group(node, cat_order) ];
					};
					ordering = [ -1, 1 ];
				}
				else {
					base_array = function (node) {
						return [ get_node_filter_group(node) ];
					};
					ordering = [ -1 ];
				}
			}
			else if (settings.group_by_category) {
				cat_order = get_category_ordering();
				base_array = function (node) {
					return [ get_node_category_group(node, cat_order) ];
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
			for (i = 0, ii = current.length; i < ii; ++i) {
				n = current[i].node;
				item = {
					order: base_array(n),
					node: n
				};
				item.order.push(
					parseFloat(n.getAttribute(attr)) || 0,
					parseFloat(n.getAttribute("data-hl-index")) || 0
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
				$.add(items_container, n);
				if ((n2 = $(".hl-easylist-item-image-index", n)) !== null) {
					n2.textContent = "#" + (i + 1);
				}
			}
		};
		var reset_filter_state = function (node) {
			node.textContent = node.getAttribute("data-hl-original") || "";
			node.classList.remove("hl-filter-good");
			node.classList.remove("hl-filter-bad");
		};
		var update_filters_targets = [
			[ ".hl-easylist-item-title-link,.hl-easylist-item-title-jp", "title" ],
			[ ".hl-easylist-item-uploader", "uploader" ],
			[ ".hl-easylist-item-tag", "tags" ],
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
					if (!first) reset_filter_state(n);
					Filter.highlight(mode, n, data, Filter.None, results, custom_filters);
				}

				bad = 0;
				for (j = 0, jj = results.length; j < jj; ++j) {
					if (results[j].bad) ++bad;
				}

				node.setAttribute("data-hl-filter-matches-" + mode, results.length - bad);
				node.setAttribute("data-hl-filter-matches-" + mode + "-bad", bad);
			}

			if (!tags_only) {
				link = $(".hl-easylist-item-title-link", node);
				n = $(".hl-easylist-item-title-tag-link", node);

				if (link !== null && n !== null) {
					if (!first) reset_filter_state(n);

					link = link.cloneNode(true);
					if ((hl = Filter.check(link, data, custom_filters))[0] !== Filter.None) {
						Filter.highlight_tag(n, link, hl);
					}
				}
			}
		};
		var update_all_filters = function () {
			var entry, data, i, ii;

			for (i = 0, ii = current.length; i < ii; ++i) {
				entry = current[i];
				data = Database.get(entry.namespace, entry.id);
				if (data !== null) {
					update_filters(current[i].node, data, false, false);
				}
			}
		};
		var load_filters = function () {
			custom_filters = Filter.parse(settings.custom_filters, undefined);
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
			custom_filters: function () {
				if (settings.custom_filters !== this.value) {
					settings.custom_filters = this.value;
					settings_save();
					load_filters();
					update_all_filters();

					// Update order
					if (settings.group_by_filters) {
						update_ordering();
					}
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
			custom_filters_input_delay_timer: null
		};
		var on_gallery_mouseover = function () {
			$.off(this, "mouseover", on_gallery_mouseover);

			var node = this,
				gid, token, domain, g_domain;

			if (
				(gid = this.getAttribute("data-hl-gid")) &&
				(token = this.getAttribute("data-hl-token")) &&
				(domain = this.getAttribute("data-hl-domain")) &&
				(g_domain = domain_info[domain].g_domain)
			) {
				API.ehentai_get_full_info(gid, token, g_domain, function (err, data) {
					var tags_container, n;

					if (
						err === null &&
						(tags_container = $(".hl-easylist-item-tags", node)) !== null
					) {
						n = create_full_tags(domain, data, Theme.get());
						tags_container.textContent = "";
						$.add(tags_container, n[0]);

						update_filters(node, data, false, true);
					}
				});
			}
		};
		var on_thumbnail_error = function () {
			$.off(this, "error", on_thumbnail_error);

			var par = this.parentNode;
			if (par === null) return;
			par.style.width = "100%";
			par.style.height = "100%";
			this.style.visibility = "hidden";
		};
		var on_linkify = function (links) {
			var link, id, id_key, d, i, ii;

			for (i = 0, ii = links.length; i < ii; ++i) {
				link = links[i];
				id = Helper.get_id_from_node(link);
				if (id !== null && Database.valid_namespace(id[0])) {
					id_key = id[0] + "_" + id[1];
					if (data_map[id_key] === undefined) {
						d = {
							domain: Helper.get_domain(link.href || "") || domains.exhentai,
							namespace: id[0],
							id: id[1],
							node: null
						};
						queue.push(d);
						data_map[id_key] = d;
					}
				}
			}

			if (queue.length > 0 && queue_timer === null) {
				on_timer();
			}
		};
		var on_timer = function () {
			queue_timer = null;

			var entries = queue.splice(0, 20),
				theme = Theme.get(),
				i, ii;

			for (i = 0, ii = entries.length; i < ii; ++i) {
				add_gallery(entries[i], theme);
			}
			add_gallery_complete();

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
			return Helper.json_parse_safe(Config.storage.getItem(settings_key), null);
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
			Navigation.insert_link("normal", "Easy List", Main.homepage, " hl-nav-link-easylist", on_open_click);

			HeaderBar.insert_shortcut_icon(
				"panda",
				"#TITLE# Easy List",
				Main.homepage,
				on_toggle_click,
				function (svg, svgns) {
					var path = $.node_ns(svgns, "path", "hl-header-bar-svg-panda-path");
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

			on_linkify(Linkifier.get_links_formatted());
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
			var theme = Theme.get(),
				container, list, obj, n1, n2, n3, n4, n5, n6, i, ii, j, jj, v;

			n1 = $.node("div", "hl-popup-overlay hl-" + class_ns + "-popup-overlay" + theme);
			$.add(n1, n2 = $.node("div", "hl-popup-aligner hl-" + class_ns + "-popup-aligner" + theme));
			$.add(n2, n3 = $.node("div", "hl-popup-align hl-" + class_ns + "-popup-align" + theme));
			$.add(n3, container = $.node("div", "hl-popup-content hl-" + class_ns + "-popup-content hl-hover-shadow post reply post_wrapper hl-fake-post" + theme));

			$.on(n1, "mousedown", on_overlay_event);
			$.on(container, "click", on_stop_propagation);
			$.on(container, "mousedown", on_stop_propagation);

			if (typeof(setup) === "function") {
				setup.call(null, container);
			}
			else {
				$.add(container, n2 = $.node("div", "hl-popup-table" + theme));

				for (i = 0, ii = setup.length; i < ii; ++i) {
					list = setup[i];
					if (!Array.isArray(list)) list = [ list ];

					$.add(n2, n3 = $.node("div", "hl-popup-row" + theme));
					jj = list.length;
					if (jj > 1) {
						$.add(n3, n4 = $.node("div", "hl-popup-cell" + theme));
						$.add(n4, n5 = $.node("div", "hl-popup-table" + theme));
						$.add(n5, n3 = $.node("div", "hl-popup-row" + theme));
					}
					for (j = 0; j < jj; ++j) {
						obj = list[j];

						$.add(n3, n4 = $.node("div", "hl-popup-cell" + theme));

						if (obj.small) n4.classList.add("hl-popup-cell-small");
						if ((v = obj.align) !== undefined && v !== "left") n4.classList.add("hl-popup-cell-" + v);
						if ((v = obj.valign) !== undefined && v !== "top") n4.classList.add("hl-popup-cell-" + v);
						if (obj.body) {
							n3.classList.add("hl-popup-row-body");

							$.add(n4, n5 = $.node("div", "hl-popup-cell-size" + theme));
							$.add(n5, n6 = $.node("div", "hl-popup-cell-size-scroll" + theme));
							if (obj.padding !== false) {
								$.add(n6, n4 = $.node("div", "hl-popup-cell-size-padding" + theme));
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
			d.documentElement.classList.add("hl-popup-overlaying");
			hovering(overlay);
			active = overlay;
		};
		var close = function (overlay) {
			d.documentElement.classList.remove("hl-popup-overlaying");
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
				hovering_container = $.node("div", "hl-hovering-elements");
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
				n1 = $.node("div", "hl-changelog-message-container");
				$.add(n1, $.node("div", "hl-changelog-message" + theme, "Loading changelog..."));
			}
			else if ((e = change_data.error) !== null) {
				n1 = $.node("div", "hl-changelog-message-container");
				$.add(n1, n2 = $.node("div", "hl-changelog-message hl-changelog-message-error" + theme));
				$.add(n2, $.node("strong", "hl-changelog-message-line" + theme, "Failed to load changelog:"));
				$.add(n2, $.node_simple("br"));
				$.add(n2, $.node("span", "hl-changelog-message-line" + theme, e));
			}
			else {
				n1 = $.node("div", "hl-changelog-entries");

				versions = change_data.log_data;
				for (i = 0, ii = versions.length; i < ii; ++i) {
					$.add(n1, n2 = $.node("div", "hl-changelog-entry" + theme));
					$.add(n2, $.node("div", "hl-changelog-entry-version" + theme, versions[i].version));
					$.add(n2, n3 = $.node("div", "hl-changelog-entry-users" + theme));

					authors = versions[i].authors;
					for (j = 0, jj = authors.length; j < jj; ++j) {
						$.add(n3, n4 = $.node("div", "hl-changelog-entry-user" + theme));
						$.add(n4, $.node("div", "hl-changelog-entry-user-name" + theme, authors[j].author));
						$.add(n4, n5 = $.node("ul", "hl-changelog-entry-changes" + theme));

						changes = authors[j].changes;
						for (k = 0, kk = changes.length; k < kk; ++k) {
							$.add(n5, $.node("li", "hl-changelog-entry-change" + theme, changes[k]));
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
						callback(null, xhr.responseText);
					}
					else {
						callback("Bad response status " + xhr.status, null);
					}
				},
				onerror: function () {
					callback("Connection error", null);
				},
				onabort: function () {
					callback("Connection aborted", null);
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
				var n = $(".hl-changelog-content", popup);
				if (n !== null) {
					n.innerHTML = "";
					display(n, Theme.get());
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

			var theme = Theme.get();

			popup = Popup.create("settings", [[{
				small: true,
				setup: function (container) {
					var cls = "";
					$.add(container, $.link(Main.homepage, "hl-settings-title" + theme, "#TITLE#"));
					if (message !== null) {
						$.add(container, $.node("span", "hl-settings-title-info" + theme, message));
						if (/\s+$/.test(message)) {
							cls = " hl-settings-version-large";
						}
					}
					$.add(container, $.link(Module.url, "hl-settings-version" + cls + theme, Main.version.join(".")));
				}
			}, {
				align: "right",
				setup: function (container) {
					var n1, n2;
					$.add(container, n1 = $.node("label", "hl-settings-button" + theme));
					$.add(n1, n2 = $.node("input", "hl-settings-button-checkbox"));
					$.add(n1, $.node("span", "hl-settings-button-text hl-settings-button-checkbox-text", " Show on update"));
					$.add(n1, $.node("span", "hl-settings-button-text hl-settings-button-checkbox-text", " Don't show on update"));
					n2.type = "checkbox";
					n2.checked = config.general.changelog_on_update;
					$.on(n2, "change", on_change_save);

					$.add(container, n1 = $.link("#", "hl-settings-button" + theme));
					$.add(n1, $.node("span", "hl-settings-button-text", "Close"));
					$.on(n1, "click", on_close_click);
				}
			}], {
				body: true,
				padding: false,
				setup: function (container) {
					container.classList.add("hl-changelog-content");
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
					n2.classList.add("hl-appchanx");
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
				n2.setAttribute("data-hl-color", color);
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
		var on_icon_mouseover = function () {
			var n = $("svg", this),
				c;

			if (n !== null) {
				c = this.getAttribute("data-hl-hover-color");
				if (!c) {
					c = Theme.get_computed_style(this).color;
					this.setAttribute("data-hl-hover-color", c);
				}
				n.style.fill = c;
			}
		};
		var on_icon_mouseout = function () {
			var n = $("svg", this);
			if (n !== null) {
				n.style.fill = this.getAttribute("data-hl-color");
			}
		};
		var on_menu_item_mouseover = function () {
			var entries = $$(".entry", this.parent),
				i, ii;
			for (i = 0, ii = entries.length; i < ii; ++i) {
				entries[i].classList.remove("focused");
			}
			this.classList.add("focused");
		};
		var on_menu_item_mouseout = function () {
			this.classList.remove("focused");
		};
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

			n1 = $.link(url, "hl-header-bar-link hl-header-bar-link-" + namespace);
			n1.setAttribute("title", title);
			$.add(n1, svg = $.node_ns(svgns, "svg", "hl-header-bar-svg hl-header-bar-svg-" + namespace));
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
		var Flags = {
			None: 0x0,
			Prepend: 0x1,
			Before: 0x2,
			After: 0x4,
			InnerSpace: 0x8,
			OuterSpace: 0x10,
			Brackets: 0x20,
			Mobile: 0x40,
			LowerCase: 0x80,
		};

		// Public
		var insert_link = function (mode, text, url, class_name, on_click) {
			var locations = [],
				first_mobile = true,
				container, flags, nodes, node, par, pre, next, cl, i, ii, n1, t;

			if (Config.is_4chan) {
				if (mode === "main") {
					nodes = $$("#navtopright,#navbotright");
					for (i = 0, ii = nodes.length; i < ii; ++i) {
						locations.push(nodes[i], Flags.OuterSpace | Flags.Brackets | Flags.Prepend);
					}
					nodes = $$("#settingsWindowLinkMobile");
					for (i = 0, ii = nodes.length; i < ii; ++i) {
						locations.push(nodes[i], Flags.Before);
					}
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
							locations.push(node);
							if (node.classList.contains("mobile")) {
								locations.push(Flags.Mobile);
							}
							else {
								locations.push(Flags.OuterSpace | Flags.Brackets);
							}
						}
					}
				}
			}
			else if (Config.is_foolz) {
				nodes = $$(".letters");
				for (i = 0, ii = nodes.length; i < ii; ++i) {
					locations.push(nodes[i], Flags.InnerSpace | Flags.OuterSpace | Flags.Brackets);
				}
			}
			else if (Config.is_fuuka) {
				node = $("body>div:first-child");
				if (node !== null) {
					locations.push(node, Flags.InnerSpace | Flags.OuterSpace | Flags.Brackets);
				}
			}
			else if (Config.is_tinyboard) {
				nodes = $$(".boardlist");
				for (i = 0, ii = nodes.length; i < ii; ++i) {
					locations.push(nodes[i], Flags.InnerSpace | Flags.OuterSpace | Flags.Brackets | Flags.LowerCase);
				}
			}

			for (i = 0, ii = locations.length; i < ii; i += 2) {
				node = locations[i];
				flags = locations[i + 1];

				// Text
				t = text;
				if ((flags & Flags.InnerSpace) !== 0) t = " " + t + " ";

				// Create
				if ((flags & Flags.Mobile) !== 0) {
					par = node.parentNode;
					container = first_mobile ? node.previousSibling : node.nextSibling;
					if (container === null || !container.classList || !container.classList.contains("hl-nav-extras")) {
						container = $.node("div", "mobile hl-nav-extras-mobile");
					}

					$.add(container, n1 = $.node("span", "mobileib button hl-nav-button" + class_name));
					$.add(n1, $.link(url, "hl-nav-button-inner" + class_name, t));

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
					n1 = $.link(url, "hl-nav-link" + class_name, t);
				}
				$.on(n1, "click", on_click);

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
					if (next !== null && next.nodeType === Node.TEXT_NODE) {
						next.nodeValue = t + next.nodeValue.replace(/^\s*\[/, "[");
					}
					else {
						$.after(par, n1, $.tnode(t));
					}

					pre = n1.previousSibling;
					t = ((flags & Flags.OuterSpace) !== 0) ? " [" : "[";
					if (pre !== null && pre.nodeType === Node.TEXT_NODE) {
						pre.nodeValue = pre.nodeValue.replace(/\]\s*$/, "]") + t;
					}
					else {
						$.before(par, n1, $.tnode(t));
					}
				}
			}
		};

		// Exports
		return {
			insert_link: insert_link
		};

	})();
	var Main = (function () {

		// Private
		var fonts_inserted = false,
			all_posts_reloaded = false;

		var reload_all_posts = function () {
			if (all_posts_reloaded) return;
			all_posts_reloaded = true;

			Linkifier.relinkify_posts(Post.get_all_posts(d));
		};

		var on_ready = function () {
			Debug.timer("init");

			if (!Config.ready()) return;
			Settings.ready();

			var style = $.node_simple("style"),
				updater;

			style.textContent = "#STYLESHEET#";
			$.add(d.head, style);

			Theme.ready();
			EasyList.ready();

			Debug.timer_log("init.ready duration", "init");

			Linkifier.queue_posts(Post.get_all_posts(d), Linkifier.queue_posts.Flags.UseDelay);

			if (MutationObserver !== null) {
				updater = new MutationObserver(on_body_observe);
				updater.observe(d.body, { childList: true, subtree: true });
			}
			else {
				$.on(d.body, "DOMNodeInserted", on_body_node_add);
				$.on(d.body, "DOMNodeRemoved", on_body_node_remove);
			}

			HeaderBar.ready();

			if (Module.version_change === 1 && config.general.changelog_on_update) {
				Changelog.open(" updated to ");
			}

			Debug.timer_log("init.ready.full duration", "init");
		};
		var on_body_node_add = function (event) {
			var node = event.target;
			on_body_observe([{
				target: node.parentNode,
				addedNodes: [ node ],
				removedNodes: [],
				nextSibling: node.nextSibling,
				previousSibling: node.previousSibling
			}]);
		};
		var on_body_node_remove = function (event) {
			var node = event.target;
			on_body_observe([{
				target: node.parentNode,
				addedNodes: [],
				removedNodes: [ node ],
				nextSibling: node.nextSibling,
				previousSibling: node.previousSibling
			}]);
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
								(ns = $$(".hl-link-events", node)).length > 0
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
				Cache.clear();
			}
			Cache.init();
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

		// Exports
		var Module = {
			homepage: "#HOMEPAGE#",
			version: [/*#VERSION#*/],
			version_change: 0,
			init: init,
			version_compare: version_compare,
			insert_custom_fonts: insert_custom_fonts
		};

		return Module;

	})();

	Main.init();
	Debug.timer_log("init.full duration", timing.start);

})();

