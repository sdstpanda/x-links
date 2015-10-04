/* jshint eqnull:true, noarg:true, noempty:true, eqeqeq:true, bitwise:false, strict:true, undef:true, curly:false, browser:true, devel:true, newcap:false, maxerr:50 */
/* globals GM_xmlhttpRequest, GM_setValue, GM_getValue, GM_deleteValue, GM_listValues */
(function () {
	"use strict";

	var timing, domains, domain_info, options, conf, regex, cat, d, t, $, $$,
		Debug, UI, Cache, API, Database, Hash, SHA1, Sauce, Options, Config, Main,
		MutationObserver, Helper, Nodes, HttpRequest, Linkifier, Filter, Theme, EasyList;

	timing = (function () {
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

	(function (debug) {
		try {
			if (debug) {
				Function.prototype._w = function () {
					var fn = this;
					return function () {
						try {
							return fn.apply(this, arguments);
						}
						catch (e) {
							console.log("Exception:", e);
							throw e;
						}
					};
				};
			}
			else {
				Function.prototype._w = function () { return this; };
			}
		}
		catch (e) {
			console.log("Exception:", e);
			throw e;
		}
	})(true);

	cat = {
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
	domains = {
		exhentai: "exhentai.org",
		gehentai: "g.e-hentai.org",
		ehentai: "e-hentai.org",
		nhentai: "nhentai.net",
		hitomi: "hitomi.la"
	};
	domain_info = {
		"exhentai.org": { tag: "Ex", g_domain: "exhentai.org", type: "ehentai" },
		"e-hentai.org": { tag: "EH", g_domain: "g.e-hentai.org", type: "ehentai" },
		"nhentai.net": { tag: "n", g_domain: "nhentai.net", type: "nhentai" },
		"hitomi.la": { tag: "Hi", g_domain: "hitomi.la", type: "hitomi" }
	};
	options = {
		general: {
			'Automatic Processing':        ['checkbox', true,  'Get data and format links automatically.'],
			'Gallery Details':             ['checkbox', true,  'Show gallery details for link on hover.'],
			'Gallery Actions':             ['checkbox', true,  'Generate gallery actions for links.'],
			'ExSauce':                     ['checkbox', true,  'Add ExSauce reverse image search to posts. Disabled in Opera.'],
			'Extended Info':               ['checkbox', true,  'Fetch additional gallery info, such as tag namespaces.'],
			'Rewrite Links':               ['select', 'none', 'Rewrite all E*Hentai links to use a specific site.', [
				[ "none", "Disabled" ], // [ value, label_text, description ]
				[ "smart", "Smart", "All links lead to " + domains.gehentai + " unless they have fjording tags." ],
				[ domains.ehentai, domains.gehentai ],
				[ domains.exhentai, domains.exhentai ]
			] ],
			'Details Hover Position':      ['select', -0.25, 'Change the horizontal offset of the gallery details from the cursor.', [
				[ -0.25, "Default" ], // [ value, label_text, description ]
				[ 0.0, "ExLinks", "Use the original ExLinks style positioning" ]
			], function (v) { return parseFloat(v) || 0.0; } ]
		},
		actions: {
			'Show by Default':             ['checkbox', false, 'Show gallery actions by default.'],
			'Hide in Quotes':              ['checkbox', true,  'Hide any open gallery actions in inline quotes.'],
			'Torrent Popup':               ['checkbox', true,  'Use the default pop-up window for torrents.'],
			'Archiver Popup':              ['checkbox', true,  'Use the default pop-up window for archiver.'],
			'Favorite Popup':              ['checkbox', true,  'Use the default pop-up window for favorites.']
			// 'Favorite Autosave':         ['checkbox', false, 'Autosave to favorites. Overrides normal behavior.']
		},
		sauce: {
			'Inline Results':              ['checkbox', true,  'Shows the results inlined rather than opening the site.'],
			'Hide Results in Quotes':      ['checkbox', true,  'Hide open inline results in inline quotes.'],
			'Show Short Results':          ['checkbox', true,  'Show gallery names when hovering over the link after lookup.'],
			'Search Expunged':             ['checkbox', false, 'Search expunged galleries as well.'],
			'Custom Label Text':           ['textbox', '', 'Use a custom label instead of the site name (e-hentai/exhentai).'],
			'Lookup Domain':               ['select', domains.exhentai, 'The site to use for the reverse image search.', [
				[ domains.ehentai, domains.gehentai ], // [ value, label_text, description ]
				[ domains.exhentai, domains.exhentai ]
			] ]
		},
		debug: {
			'Debug Mode':                  ['checkbox', false, 'Enable debugger and logging to browser console.'],
			'Disable Local Storage Cache': ['checkbox', false, 'If set, Session Storage is used for caching instead.'],
			'Disable Caching':             ['checkbox', false, 'Disable caching completely.'],
			'Populate Database on Load':   ['checkbox', false, 'Load all cached galleries to database on page load.']
		},
		filter: {
			'Full Highlighting':           ['checkbox', false, 'Highlight of all the text instead of just the matching portion.'],
			'Good Tag Marker':             ['textbox', '!', 'The string to mark a good [Ex]/[EH] tag with.'],
			'Bad Tag Marker':              ['textbox', '', 'The string to mark a bad [Ex]/[EH] tag with.'],
			'Filters': ['textarea', [
				'# Highlight all doujinshi and manga galleries with (C88) in the name:',
				'# /\\(C88\\)/i;only:doujinshi,manga;link-color:red;color:#FF0000;title',
				'# Highlight "english" and "translated" tags in non-western non-non-h galleries:',
				'# /english|translated/i;not:western,non-h;color:#4080F0;link-color:#4080F0;tag',
				'# Highlight galleries tagged with "touhou project":',
				'# /touhou project/i;bg:rgba(255,128,64,0.5);link-bg:rgba(255,128,64,0.5);tag;title',
				'# Highlight links for galleries uploaded by "ExUploader"',
				'# /ExUploader/i;color:#FFFFFF;link-color:#FFFFFF;uploader',
				'# Don\'t highlight anything uploaded by "CGrascal"',
				'# /CGrascal/i;bad:yes;uploader'
			].join('\n'), '']
		}
	};
	regex = {
		url: /(?:https?:\/*)?(?:(?:forums|gu|g|u)?\.?e[x\-]hentai\.org|nhentai\.net|hitomi\.la)\/[^<>\s\'\"]*/ig,
		protocol: /^https?\:\/*/i,
		fjord: /abortion|bestiality|incest|lolicon|shotacon|toddlercon/,
		site_exhentai: /exhentai\.org/i,
		site_gehentai: /g\.e\-hentai\.org/i
	};
	t = {
		SECOND: 1000,
		MINUTE: 1000 * 60,
		HOUR: 1000 * 60 * 60,
		DAY: 1000 * 60 * 60 * 24
	};
	d = document;
	conf = {};

	MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver || null;
	$ = function (selector, root) { // Inspired by 4chan X and jQuery API: https://api.jquery.com/ (functions are not chainable)
		return (root || d).querySelector(selector);
	};
	$$ = function (selector, root) {
		return (root || d).querySelectorAll(selector);
	};
	$.extend = function (obj, properties) {
		for (var k in properties) {
			if (Object.prototype.hasOwnProperty.call(properties, k)) {
				obj[k] = properties[k];
			}
		}
	};
	$.extend($, {
		ready: (function () {
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
					window.removeEventListener("readystatechange", callback_check, false);

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
			window.addEventListener("readystatechange", callback_check, false);

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
		})(),
		clamp: function (value, min, max) {
			return Math.min(max, Math.max(min, value));
		},
		elem: function (arr) {
			var frag = d.createDocumentFragment(),
				i, ii;
			for (i = 0, ii = arr.length; i < ii; ++i) {
				frag.appendChild(arr[i]);
			}
			return frag;
		},
		frag: function (content) {
			var frag = d.createDocumentFragment(),
				div = $.create("div", { innerHTML: content }),
				n;
			for (n = div.firstChild; n !== null; n = n.nextSibling) {
				frag.appendChild(n.cloneNode(true));
			}
			return frag;
		},
		textnodes: function (elem) {
			var tn = [],
				ws = /^\s*$/,
				getTextNodes;

			getTextNodes = function (node) {
				var cn, i, ii;
				for (i = 0, ii = node.childNodes.length; i < ii; ++i) {
					cn = node.childNodes[i];
					if (cn.nodeType === Node.TEXT_NODE) {
						if (!ws.test(cn.nodeValue)) {
							tn.push(cn);
						}
					}
					else if (cn.nodeType === Node.ELEMENT_NODE) {
						if (cn.tagName === 'SPAN' || cn.tagName === 'P' || cn.tagName === 'S') {
							getTextNodes(cn);
						}
					}
				}
			};

			getTextNodes(elem);
			return tn;
		},
		id: function (id) {
			return d.getElementById(id);
		},
		prepend: function (parent, child) {
			return parent.insertBefore(child, parent.firstChild);
		},
		add: function (parent, child) {
			return parent.appendChild(child);
		},
		before: function (root, elem) {
			return root.parentNode.insertBefore(elem, root);
		},
		before2: function (root, node, before) {
			return root.insertBefore(node, before);
		},
		after: function (root, elem) {
			return root.parentNode.insertBefore(elem, root.nextSibling);
		},
		replace: function (root, elem) {
			return root.parentNode.replaceChild(elem, root);
		},
		remove: function (elem) {
			return elem.parentNode.removeChild(elem);
		},
		tnode: function (text) {
			return d.createTextNode(text);
		},
		create: function (tag, properties) {
			var elem = d.createElement(tag);
			if (properties) {
				$.extend(elem, properties);
			}
			return elem;
		},
		on: function (elem, eventlist, handler) {
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
		},
		off: function (elem, eventlist, handler) {
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
		},
		test: function (elem, selector) {
			try {
				if (elem.matches) return elem.matches(selector);
				return elem.matchesSelector(selector);
			}
			catch (e) {}
			return false;
		},
		link: function (href, properties) {
			var elem = d.createElement("a");
			if (href !== null) {
				elem.href = href;
				elem.target = "_blank";
				elem.rel = "noreferrer";
			}
			if (properties) {
				$.extend(elem, properties);
			}
			return elem;
		},
		push_many: function (target, new_entries) {
			var max_push = 1000;
			if (new_entries.length < max_push) {
				Array.prototype.push.apply(target, new_entries);
			}
			else {
				for (var i = 0, ii = new_entries.length; i < ii; i += max_push) {
					Array.prototype.push.apply(target, new_entries.slice(i, i + max_push));
				}
			}
		},
		scroll_focus: function (element) {
			// Focus
			var n = $.create("textarea");
			$.prepend(element, n);
			n.focus();
			n.blur();
			$.remove(n);

			// Scroll to top
			element.scrollTop = 0;
			element.scrollLeft = 0;
		}
	});
	Debug = {
		started: false,
		log: function () {},
		timer: function () {},
		timer_log: function (label, timer) {
			var t = timing(),
				value;

			if (typeof(timer) === "string") timer = Debug.timer.timer_names[timer];

			value = (timer === undefined) ? "???ms" : (t - timer).toFixed(3) + "ms";

			if (!Debug.started) return [ label, value ];
			Debug.log(label, value);
		},
		init: function () {
			Debug.started = true;
			if (!conf['Debug Mode']) {
				Debug.timer_log = function () {};
				return;
			}

			// Find timing
			var timer_names = {},
				perf = window.performance,
				now;

			if (!perf || !(now = perf.now || perf.mozNow || perf.msNow || perf.oNow || perf.webkitNow)) {
				perf = Date;
				now = perf.now;
			}

			// Debug functions
			Debug.log = function () {
				var args = [ "#TITLE# " + Main.version + ":" ].concat(Array.prototype.slice.call(arguments));
				console.log.apply(console, args);
			};
			Debug.timer = function (name, dont_format) {
				var t1 = now.call(perf),
					t2;

				t2 = timer_names[name];
				timer_names[name] = t1;

				if (dont_format) {
					return (t2 === undefined) ? -1 : (t1 - t2);
				}
				return (t2 === undefined) ? "???ms" : (t1 - t2).toFixed(3) + "ms";
			};
			Debug.timer.timer_names = timer_names;
		}
	};
	Helper = {
		div: d.createElement("div"),
		normalize_api_string: function (text) {
			Helper.div.innerHTML = text;
			text = Helper.div.textContent;
			Helper.div.textContent = "";
			return text;
		},
		regex_escape: function (text) {
			return text.replace(/[\$\(\)\*\+\-\.\/\?\[\\\]\^\{\|\}]/g, "\\$&");
		},
		json_parse_safe: function (text, def) {
			try {
				return JSON.parse(text);
			}
			catch (e) {
				return def;
			}
		},
		html_parse_safe: function (text, def) {
			try {
				return (new DOMParser()).parseFromString(text, "text/html");
			}
			catch (e) {
				return def;
			}
		},
		get_uid_from_node: function (node) {
			var a = node.getAttribute("data-hl-id"),
				i;
			return (a && (i = a.indexOf("_")) >= 0) ? a.substr(i + 1) : "";
		},
		get_id_from_node: function (node) {
			var a = node.getAttribute("data-hl-id"),
				i;
			return (a && (i = a.indexOf("_")) >= 0) ? [ a.substr(0, i), a.substr(i + 1) ] : null;
		},
		get_id_from_node_full: function (node) {
			return node.getAttribute("data-hl-id") || "";
		},
		get_info_from_node: function (node) {
			var attr = node.getAttribute("data-hl-info");
			try {
				return JSON.parse(attr);
			}
			catch (e) {}
			return null;
		},
		get_tag_button_from_link: function (node) {
			// Assume the button is the previous (or previous-previous) sibling
			if (
				(node = node.previousSibling) !== null &&
				(node.classList || ((node = node.previousSibling) !== null && node.classList)) &&
				node.classList.contains("hl-site-tag")
			) {
				return node;
			}
			return null;
		},
		get_link_from_tag_button: function (node) {
			// Assume the link is the next (or next-next) sibling
			if (
				(node = node.nextSibling) !== null &&
				(node.classList || ((node = node.nextSibling) !== null && node.classList)) &&
				node.classList.contains("hl-linkified-gallery")
			) {
				return node;
			}
			return null;
		},
		get_actions_from_link: function (node, is_tag) {
			// Get
			if (is_tag) {
				node = Helper.get_link_from_tag_button(node);
				if (node === null) return null;
			}

			if (
				(node = node.nextSibling) !== null &&
				(node.classList || ((node = node.nextSibling) !== null && node.classList)) &&
				node.classList.contains("hl-actions")
			) {
				return node;
			}
			return null;
		},
		get_exresults_from_exsauce: function (node) {
			var container = Helper.Post.get_post_container(node);

			if (
				container !== null &&
				(node = $(".hl-exsauce-results[data-hl-image-index='" + node.getAttribute("data-hl-image-index") + "']", container)) !== null &&
				Helper.Post.get_post_container(node) === container
			) {
				return node;
			}

			return null;
		},
		get_url_info: function (url) {
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
		},
		get_full_domain: function (url) {
			var m = /^https?:\/*([\w\-]+(?:\.[\w\-]+)*)/i.exec(url);
			return (m === null) ? "" : m[1];
		},
		get_domain: function (url) {
			var m = /^https?:\/*(?:[\w-]+\.)*([\w-]+\.[\w]+)/i.exec(url);
			return (m === null) ? "" : m[1].toLowerCase();
		},
		title_case: function (text) {
			return text.replace(/\b\w/g, function (m) {
				return m.toUpperCase();
			});
		},
		Site: (function () {

			var create_gallery_url = {
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
			var create_uploader_url = {
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
			var create_category_url = {
				ehentai: function (data, domain) {
					return "http://" + domain_info[domain].g_domain + "/" + cat[data.category].short;
				},
				nhentai: function (data) {
					return "http://" + domains.nhentai + "/category/" + data.category.toLowerCase() + "/";
				},
				hitomi: function (data) {
					return "https://" + domains.hitomi + "/type/" + data.category.toLowerCase() + "-all-1.html";
				}
			};
			var create_tag_url = {
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
			var create_tag_ns_url = {
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

			return {
				create_gallery_url: function (data, domain) {
					var type = domain_info[domain].type;
					return create_gallery_url[type].call(null, data, domain);
				},
				create_uploader_url: function (data, domain) {
					var type = domain_info[domain].type;
					return create_uploader_url[type].call(null, data, domain);
				},
				create_category_url: function (data, domain) {
					var type = domain_info[domain].type;
					return create_category_url[type].call(null, data, domain);
				},
				create_tag_url: function (tag, domain_type, full_domain) {
					return create_tag_url[domain_type].call(null, tag, full_domain);
				},
				create_tag_ns_url: function (tag, namespace, domain_type, full_domain) {
					return create_tag_ns_url[domain_type].call(null, tag, namespace, full_domain);
				}
			};

		})(),
		Post: (function () {
			var specific, fns, post_selector, post_body_selector, post_parent_find, get_file_info,
				get_op_post_files_container_tinyboard,
				belongs_to, body_links, file_ext, file_name;

			specific = function (obj, def) {
				return obj[Config.mode] || obj[def];
			};
			file_ext = function (url) {
				var m = /\.[^\.]*$/.exec(url);
				return (m === null) ? "" : m[0].toLowerCase();
			};
			file_name = function (url) {
				url = url.split("/");
				return url[url.length - 1];
			};

			get_op_post_files_container_tinyboard = function (node) {
				while (true) {
					if ((node = node.previousSibling) === null) return null;
					if (node.classList && node.classList.contains("files")) return node;
				}
			};

			post_selector = {
				"4chan": ".postContainer:not(.hl-fake-post)",
				"foolz": "article:not(.backlink_container)",
				"tinyboard": ".post:not(.hl-fake-post)"
			};
			post_body_selector = {
				"4chan": "blockquote",
				"foolz": ".text",
				"tinyboard": ".body"
			};
			post_parent_find = {
				"4chan": function (node) {
					while ((node = node.parentNode) !== null) {
						if (node.classList.contains("postContainer")) return node;
					}
					return null;
				},
				"foolz": function (node) {
					while ((node = node.parentNode) !== null) {
						if (node.tagName === "ARTICLE") return node;
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
				// "fuuka": function (node) {}
			};
			get_file_info = {
				"4chan": function (post) {
					var n, ft, img, a1, url, i;

					if (
						(n = $(".file", post)) === null ||
						!specific(belongs_to, "").call(null, n, post) ||
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
						options_before: null,
						options_class: "",
						options_sep: " ",
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
						!specific(belongs_to, "").call(null, n, post) ||
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
						options_before: $("a[download]", ft),
						options_class: "btnr parent",
						options_sep: "",
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
							if (specific(belongs_to, "").call(null, img, post)) {
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
							options_before: null,
							options_class: "",
							options_sep: " ",
							url: url,
							type: file_ext(url),
							name: file_name(url),
							md5: img.getAttribute("data-md5") || null
						});
					}

					return results;
				}
			};
			belongs_to = {
				"4chan": function (node, post) {
					var re = /\D+/g,
						id1 = node.id.replace(re, ""),
						id2 = post.id.replace(re, "");

					return (id1 && id1 === id2);
				},
				"": function (node, post) {
					return (fns.get_post_container(node) === post);
				}
			};
			body_links = {
				"4chan": "a:not(.quotelink)",
				"foolz": "a:not(.backlink)",
				"tinyboard": "a:not([onclick])"
			};

			fns = {
				get_post_container: function (node) {
					return specific(post_parent_find, "tinyboard").call(null, node);
				},
				get_text_body: function (node) {
					var selector = specific(post_body_selector, "tinyboard");
					return selector ? $(selector, node) : null;
				},
				is_post: function (node) {
					return $.test(node, specific(post_selector, "tinyboard"));
				},
				get_all_posts: function (parent) {
					var selector = specific(post_selector, "tinyboard");
					return selector ? $$(selector, parent) : [];
				},
				get_file_info: function (post) {
					return specific(get_file_info, "tinyboard").call(null, post);
				},
				get_body_links: function (post) {
					var selector = specific(body_links, "tinyboard");
					return selector ? $$(selector, post) : [];
				},
				get_op_post_files_container_tinyboard: get_op_post_files_container_tinyboard
			};

			return fns;
		})()
	};
	Nodes = {
		details: {},
		sauce_hover: {},
		options_overlay: null
	};
	HttpRequest = (function () {
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
	UI = {
		html: {
			details: function (data, data_alt) { return '#DETAILS#'; },
			actions: function (data, domain) {
				var gid = data.gid,
					token = data.token,
					theme = Theme.get(),
					domain_type = domain_info[domain].type,
					url, src;

				src = '<div class="hl-actions hl-actions-hidden' + theme + '" data-hl-id="' + domain_type + '_' + gid + '">';
				src += '<div class="hl-actions-info">';
				src += '<span>' + data.category + '</span>';
				src += '<span class="hl-actions-sep">|</span>';
				src += '<span>' + data.filecount + ' files</span>';
				src += '<span class="hl-actions-sep">|</span>';
				src += '<span class="hl-actions-label">View on:</span>';

				if (domain_type === "ehentai") {
					url = Helper.Site.create_gallery_url(data, domains.ehentai);
					src += '<a href="' + url + '" target="_blank" rel="noreferrer" class="hl-link-events hl-actions-link" data-hl-link-events="actions_view_on_eh">e-hentai</a>';

					url = Helper.Site.create_gallery_url(data, domains.exhentai);
					src += '<a href="' + url + '" target="_blank" rel="noreferrer" class="hl-link-events hl-actions-link" data-hl-link-events="actions_view_on_ex">exhentai</a>';

					src += '<span class="hl-actions-sep">|</span>';
					src += '<span class="hl-actions-label">Uploader:</span>';

					url = Helper.Site.create_uploader_url(data, domain);
					src += '<a href="' + url + '" target="_blank" rel="noreferrer" class="hl-link-events hl-actions-link" data-hl-link-events="actions_uploader">' + data.uploader + '</a>';

					src += '<span class="hl-actions-sep">|</span>';

					url = domains.gehentai + "/stats.php?gid=" + gid + "&t=" + token;
					src += '<a href="http://' + url + '" target="_blank" rel="noreferrer" class="hl-link-events hl-actions-link" data-hl-link-events="actions_stats">Stats</a>';
				}
				else if (domain_type === "nhentai") {
					url = Helper.Site.create_gallery_url(data, domain);
					src += '<a href="' + url + '" target="_blank" rel="noreferrer" class="hl-link-events hl-actions-link" data-hl-link-events="actions_view_on_nh">nhentai</a>';
				}
				else if (domain_type === "hitomi") {
					url = Helper.Site.create_gallery_url(data, domain);
					src += '<a href="' + url + '" target="_blank" rel="noreferrer" class="hl-link-events hl-actions-link" data-hl-link-events="actions_view_on_nh">hitomi.la</a>';
				}
				src += '</div>';
				src += '<div class="hl-actions-tag-block">';
				src += '<strong class="hl-actions-tag-block-label">Tags:</strong><span class="hl-actions-tags hl-tags" data-hl-id="' + domain_type + '_' + gid + '"></span>';
				src += '</div>';
				src += '</div>';

				return src;
			},
			options: function () { return '#OPTIONS#'; },
			stars: function (data) {
				var str = '',
					star = '',
					rating = Math.round(parseFloat(data) * 2),
					tmp, i;

				for (i = 0; i < 5; ++i) {
					tmp = $.clamp(rating - (i * 2), 0, 2);
					switch (tmp) {
						case 0: star = 'none'; break;
						case 1: star = 'half'; break;
						case 2: star = 'full'; break;
					}
					str += '<div class="hl-star hl-star-' + (i + 1) + ' hl-star-' + star + '"></div>';
				}
				return str;
			}
		},
		events: {
			mouseover: function () {
				var full_id = Helper.get_id_from_node_full(this),
					details = Nodes.details[full_id],
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

					details = UI.details(data, domain);
					Nodes.details[full_id] = details;
				}

				details.classList.remove("hl-details-hidden");
			},
			mouseout: function () {
				var full_id = Helper.get_id_from_node_full(this),
					details = Nodes.details[full_id],
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

					details = UI.details(data, domain);
					Nodes.details[full_id] = details;
				}

				details.classList.add("hl-details-hidden");
			},
			mousemove: function (event) {
				var details = Nodes.details[Helper.get_id_from_node_full(this)];

				if (details === undefined) return;

				var w = window,
					de = d.documentElement,
					x = event.clientX,
					y = event.clientY,
					win_width = (de.clientWidth || w.innerWidth || 0),
					win_height = (de.clientHeight || w.innerHeight || 0),
					rect = details.getBoundingClientRect(),
					link_rect = this.getBoundingClientRect(),
					is_low = (link_rect.top + link_rect.height / 2 >= win_height / 2), // (y >= win_height / 2)
					offset = 20;

				x += rect.width * (conf['Details Hover Position'] || 0);
				x = Math.max(1, Math.min(win_width - rect.width - 1, x));
				y += is_low ? -(rect.height + offset) : offset;

				details.style.left = x + "px";
				details.style.top = y + "px";
			}
		},
		details: function (data, domain) {
			var data_alt = {},
				di = domain_info[domain],
				g_domain = di.g_domain,
				content, n, o;

			data_alt.jtitle = data.title_jpn ? ('<br /><span class="hl-details-title-jp">' + data.title_jpn + '</span>') : '';
			data_alt.site = di.type;
			data_alt.size = Math.round((data.filesize / 1024 / 1024) * 100) / 100;
			data_alt.datetext = UI.date(new Date(parseInt(data.posted, 10) * 1000));
			data_alt.visible = data.expunged ? 'No' : 'Yes';
			data_alt.category_type = (o = cat[data.category]) === undefined ? "misc" : o.short;

			content = $.frag(UI.html.details(data, data_alt)).firstChild;
			Theme.apply(content);

			if (data.thumb && (n = $(".hl-details-thumbnail", content)) !== null) {
				n.style.backgroundImage = "url('" + data.thumb + "')";
			}
			if ((n = $(".hl-details-title", content)) !== null) {
				Filter.highlight("title", n, data, null);
			}
			if ((n = $(".hl-details-uploader", content)) !== null) {
				Filter.highlight("uploader", n, data, null);
			}
			if (data.filesize < 0 && (n = $(".hl-details-file-size", content)) !== null) {
				$.remove(n);
			}
			if (data.torrentcount < 0 && (n = $(".hl-details-side-box-torrents", content)) !== null) {
				$.remove(n);
			}
			if (data.rating < 0 && (n = $(".hl-details-side-box-rating", content)) !== null) {
				$.remove(n);
			}
			if (data.expunged === null && (n = $(".hl-details-side-box-visible", content)) !== null) {
				$.remove(n);
			}

			$.add($(".hl-tags", content), UI.create_tags_best(di.type, g_domain, data));

			Main.hovering(content);

			// Full info
			if (conf['Extended Info'] && di.type === "ehentai" && !API.data_has_full(data)) {
				API.get_full_gallery_info(data.gid, data.token, g_domain, function (err) {
					if (err === null) {
						UI.update_full(data);
					}
					else {
						Debug.log("Error requesting full information: " + err);
					}
				});
			}

			// Fonts
			Main.insert_custom_fonts();

			// Done
			return content;
		},
		actions: function (data, link) {
			var fjord = regex.fjord.test(data.tags.join(',')),
				domain, button, container, di, n;

			domain = Helper.get_domain(link.href);

			if (conf['Rewrite Links'] === "smart") {
				if (fjord) {
					if (domain === domains.ehentai) {
						domain = domains.exhentai;
						link.href = link.href.replace(regex.site_gehentai, domains.exhentai);
						if ((button = Helper.get_tag_button_from_link(link)) !== null) {
							button.href = link.href;
							button.textContent = UI.button_text(domain);
						}
					}
				}
				else {
					if (domain === domains.exhentai) {
						domain = domains.ehentai;
						link.href = link.href.replace(regex.site_exhentai, domains.gehentai);
						if ((button = Helper.get_tag_button_from_link(link)) !== null) {
							button.href = link.href;
							button.textContent = UI.button_text(domain);
						}
					}
				}
			}

			di = domain_info[domain];

			container = $.frag(UI.html.actions(data, domain)).firstChild;

			if ((n = $(".hl-actions-link-uploader", container)) !== null) {
				Filter.highlight("uploader", n, data, null);
			}

			if (conf['Show by Default']) container.classList.remove("hl-actions-hidden");
			$.add($(".hl-tags", container), UI.create_tags_best(di.type, di.g_domain, data));

			return container;
		},
		button: function (url, domain) {
			var button = $.link(url, {
				className: 'hl-link-events hl-site-tag',
				textContent: UI.button_text(domain)
			});
			button.setAttribute("data-hl-link-events", "gallery_fetch");
			return button;
		},
		button_text: function (domain) {
			var d = domain_info[domain];
			return (d !== undefined ? "[" + d.tag + "]" : "[?]");
		},
		toggle: function (event) {
			if (!event.which || event.which === 1) {
				var actions = Helper.get_actions_from_link(this, true);
				if (actions !== null) {
					actions.classList.toggle("hl-actions-hidden");
				}
				event.preventDefault();
			}
		},
		popup: function (event) {
			event.preventDefault();

			var w = 400,
				h = 400,
				link = this,
				type = /gallerytorrents|gallerypopups|archiver/i.exec(link.href);

			if (type === null) return;
			type = type[0];

			if (type === "gallerytorrents") {
				w = 610;
				h = 590;
			}
			else if (type === "gallerypopups") {
				w = 675;
				h = 415;
			}
			else { // if (type === "archiver") {
				w = 350;
				h = 320;
			}
			window.open(
				link.href,
				"_pu" + (Math.random() + "").replace(/0\./, ""),
				"toolbar=0,scrollbars=0,location=0,statusbar=0,menubar=0,resizable=0,width=" + w + ",height=" + h + ",left=" + ((screen.width - w) / 2) + ",top=" + ((screen.height - h) / 2)
			);
		},
		date: function (d) {
			var pad = function (n, sep) {
				return (n < 10 ? '0' : '') + n + sep;
			};
			return d.getUTCFullYear() + '-' +
				pad(d.getUTCMonth() + 1, '-') +
				pad(d.getUTCDate(), ' ') +
				pad(d.getUTCHours(), ':') +
				pad(d.getUTCMinutes(), '');
		},
		create_tags: function (domain, site, data) {
			var tagfrag = d.createDocumentFragment(),
				tags = data.tags,
				theme = Theme.get(),
				tag, link, i, ii;

			for (i = 0, ii = tags.length; i < ii; ++i) {
				tag = $.create("span", { className: "hl-tag-block" + theme });
				link = $.link(Helper.Site.create_tag_url(tags[i], domain, site), {
					textContent: tags[i],
					className: "hl-tag"
				});

				Filter.highlight("tags", link, data, null);

				$.add(tag, link);
				$.add(tag, $.tnode(","));
				$.add(tagfrag, tag);
			}
			$.remove(tagfrag.lastChild.lastChild);

			return tagfrag;
		},
		create_tags_full: function (domain, site, data) {
			var tagfrag = d.createDocumentFragment(),
				tags_ns = data.full.tags,
				theme = Theme.get(),
				tag = null,
				namespace, namespace_style, tags, link, tf, i, ii;

			for (namespace in tags_ns) {
				tags = tags_ns[namespace];
				ii = tags.length;
				if (ii === 0) continue;
				namespace_style = theme + " hl-tag-namespace-" + namespace.replace(/\s+/g, "-");

				tag = $.create("span", {
					className: "hl-tag-namespace-block" + namespace_style
				});
				link = $.create("span", {
					textContent: namespace,
					className: "hl-tag-namespace"
				});
				tf = $.create("span", {
					className: "hl-tag-namespace-first"
				});
				$.add(tag, link);
				$.add(tag, $.tnode(":"));
				$.add(tf, tag);
				$.add(tagfrag, tf);

				for (i = 0; i < ii; ++i) {
					tag = $.create("span", { className: "hl-tag-block" + namespace_style });
					link = $.link(Helper.Site.create_tag_ns_url(tags[i], namespace, domain, site), {
						textContent: tags[i],
						className: "hl-tag"
					});

					Filter.highlight("tags", link, data, null);

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
		},
		create_tags_best: function (domain, site, data) {
			if (data.full) {
				for (var k in data.full.tags) {
					return UI.create_tags_full(domain, site, data);
				}
			}
			return UI.create_tags(domain, site, data);
		},
		update_full: function (data) {
			var tagfrag, nodes, link, site, tags, last, i, ii, j, jj, n, f;

			nodes = $$(".hl-tags[data-hl-id='ehentai_" + data.gid + "']");

			ii = nodes.length;
			if (ii === 0 || Object.keys(data.full.tags).length === 0) return;

			tagfrag = UI.create_tags_full("ehentai", domains.exhentai, data);

			i = 0;
			while (true) {
				n = nodes[i];
				f = tagfrag;
				last = (++i >= ii);

				if (
					(link = $("a[href]", n)) !== null &&
					!regex.site_exhentai.test(link.getAttribute("href"))
				) {
					site = Helper.get_full_domain(link.href);
					f = last ? tagfrag : tagfrag.cloneNode(true);
					tags = $$("a[href]", f);
					for (j = 0, jj = tags.length; j < jj; ++j) {
						tags[j].href = tags[j].href.replace(regex.site_exhentai, site);
					}
				}
				else if (!last) {
					f = tagfrag.cloneNode(true);
				}

				n.innerHTML = "";
				$.add(n, f);

				if (last) break;
			}
		}
	};
	API = {
		full_version: 1,
		nhentai_tag_namespaces: {
			parodies: "parody",
			characters: "character",
			artists: "artist",
			groups: "group"
		},
		request_types: {
			ehentai: [ "ehentai_page", "ehentai_gallery" ],
			nhentai: [ "nhentai_gallery" ],
			hitomi: [ "hitomi_gallery" ]
		},
		Request: (function () {
			var Queue, error_fn, queue_add, queue_get, trigger, perform_request, call_callbacks;

			Queue = {
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
							return [ API.parse_full_info(html) ];
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
							return [ API.nhentai_parse_info(html) ];
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
							return [ API.hitomi_parse_info(html) ];
						}
						return null;
					}
				}
			};

			error_fn = function (q, names, callbacks, msg) {
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

			queue_add = function (name, data, callback) {
				var q = Queue[name];
				q.data.push(data);
				q.callbacks.push(callback);
			};
			queue_get = function (names) {
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

			trigger = function (names) {
				var q_data = queue_get.call(null, names);
				if (q_data !== null) {
					perform_request.apply(null, q_data);
					return true;
				}
				return false;
			};

			perform_request = function (q, names, callbacks, xhr_data) {
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

			call_callbacks = function (q, names, callbacks, response) {
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
		})(),
		queue_gallery: function (gid, token) {
			gid = parseInt(gid, 10);
			API.Request.queue("ehentai_gallery",
				[ gid, token ],
				function (err, data, last) {
					if (err === null) {
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
		},
		queue_gallery_page: function (gid, page_token, page) {
			API.Request.queue("ehentai_page",
				[ parseInt(gid, 10), page_token, parseInt(page, 10) ],
				function (err, data) {
					if (err === null) {
						API.queue_gallery(data.gid, data.token);
					}
				}
			);
		},
		get_full_gallery_info: function (id, token, site, cb) {
			API.Request.get("ehentai_full",
				[ site, id, token ],
				function (err, full_data) {
					if (err === null) {
						var data = Database.get("ehentai", id);
						if (data !== null) {
							data.full = full_data;
							Database.set("ehentai", data);
							cb(null, data);
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
		},
		nhentai_queue_gallery: function (gid) {
			API.Request.queue("nhentai_gallery",
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
		},
		hitomi_queue_gallery: function (gid) {
			API.Request.queue("hitomi_gallery",
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
		},
		run_request_queue: function () {
			API.Request.trigger(API.request_types.ehentai);
			API.Request.trigger(API.request_types.nhentai);
			API.Request.trigger(API.request_types.hitomi);
		},
		data_has_full: function (data) {
			return data.full && data.full.version >= API.full_version;
		},
		parse_full_info: function (html) {
			var tags = {},
				data = {
					version: API.full_version,
					tags: tags
				};

			// Tags
			var pattern = /(.+):/,
				par = $$("#taglist tr", html),
				tds, namespace, ns, i, j, m, n;

			for (i = 0; i < par.length; ++i) {
				// Class
				tds = $$("td", par[i]);
				if (tds.length > 0) {
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
					tds = $$("div", tds[tds.length - 1]);
					for (j = 0; j < tds.length; ++j) {
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
				}
			}

			return data;
		},
		nhentai_parse_info: function (html) {
			var info = $("#info", html),
				data, nodes, tags, tag_ns, tag_ns_list, t, m, n, i, ii, j, jj;

			if (info === null) {
				return { error: "Could not find info" };
			}

			// Create data
			data = {
				category: "",
				expunged: null,
				filecount: 0,
				filesize: -1,
				full: {
					version: API.full_version,
					tags: {},
					favorites: 0
				},
				gid: 0,
				posted: 0,
				rating: -1,
				tags: [],
				thumb: "",
				title: "",
				title_jpn: "",
				token: null,
				torrentcount: -1,
				uploader: "nhentai"
			};

			// Image/gid
			if ((n = $("#cover>a", html)) !== null) {
				m = /\/g\/(\d+)/.exec(n.getAttribute("href") || "");
				if (m !== null) {
					data.gid = parseInt(m[1], 10);
				}

				if ((n = $("img", n)) !== null) {
					data.thumb = n.getAttribute("src") || "";
					if (!regex.protocol.test(data.thumb)) {
						data.thumb = "http:" + data.thumb;
					}
				}
			}

			// Image count
			data.filecount = $$("#thumbnail-container>.thumb-container", html).length;

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
					tag_ns = (
						(n = nodes[i].firstChild) !== null &&
						n.nodeType === Node.TEXT_NODE
					) ? n.nodeValue.trim().replace(/:/, "").toLowerCase() : "";

					tags = $$(".tag", nodes[i]);

					tag_ns = API.nhentai_tag_namespaces[tag_ns] || tag_ns;

					if (tag_ns === "category") {
						if (
							tags.length > 0 &&
							(n = tags[0].firstChild) !== null &&
							n.nodeType === Node.TEXT_NODE
						) {
							data.category = Helper.title_case(n.nodeValue.trim());
						}
						tags = [];
					}

					if (tags.length > 0) {
						if (tag_ns in data.full.tags) {
							tag_ns_list = data.full.tags[tag_ns];
						}
						else {
							tag_ns_list = [];
							data.full.tags[tag_ns] = tag_ns_list;
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
					data.posted = new Date(
						parseInt(m[1], 10),
						parseInt(m[2], 10) - 1,
						parseInt(m[3], 10),
						parseInt(m[4], 10),
						parseInt(m[5], 10),
						parseInt(m[6], 10),
						Math.floor(parseInt(m[7], 10) / 1000)
					).getTime() / 1000;
				}
			}

			// Favorite count
			if ((n = $(".buttons>.btn.btn-primary>span>.nobold", info)) !== null) {
				m = /\d+/.exec(n.textContent);
				if (m !== null) {
					data.full.favorites = parseInt(m[0], 10);
				}
			}

			return data;
		},
		hitomi_parse_info: function (html) {
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
			tags = [];
			tags_full = {};
			data = {
				category: "",
				expunged: null,
				filecount: 0,
				filesize: -1,
				full: {
					version: API.full_version,
					tags: tags_full,
					favorites: -1,
					thumb_external: ""
				},
				gid: 0,
				posted: 0,
				rating: -1,
				tags: tags,
				thumb: "",
				title: "",
				title_jpn: "",
				token: null,
				torrentcount: -1,
				uploader: "hitomi.la"
			};

			// Image/gid
			if ((n = $(".cover>a", html)) !== null) {
				m = /\/reader\/(\d+)/.exec(n.getAttribute("href") || "");
				if (m !== null) {
					data.gid = parseInt(m[1], 10);
				}

				if ((n = $("img", n)) !== null) {
					t = n.getAttribute("src") || "";
					if (!regex.protocol.test(t)) {
						t = "https:" + t;
					}
					data.full.thumb_external = t; // no cross origin
				}
			}

			// Image count
			data.filecount = $$(".thumbnail-list>li", html).length;

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
					data.category = Helper.title_case(t);
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
					data.posted = new Date(
						parseInt(m[1], 10),
						parseInt(m[2], 10) - 1,
						parseInt(m[3], 10),
						parseInt(m[4], 10),
						parseInt(m[5], 10),
						parseInt(m[6], 10),
						0
					).getTime() / 1000;
				}
			}

			return data;
		}
	};
	Cache = {
		namespace: "#PREFIX#cache-",
		type: window.localStorage,
		init: function () {
			var re_matcher = new RegExp("^" + Helper.regex_escape(Cache.namespace) + "((?:([en]hentai|hitomi)_)gallery|md5|sha1)-([^-]+)"),
				removed = 0,
				keys = [],
				populate = conf['Populate Database on Load'],
				cache_type, key, data, m, i, ii;

			if (conf['Disable Caching']) {
				Cache.type = (function () {
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
			else if (conf['Disable Local Storage Cache']) {
				Cache.type = window.sessionStorage;
			}
			cache_type = Cache.type;

			for (i = 0, ii = cache_type.length; i < ii; ++i) {
				key = cache_type.key(i);
				if ((m = re_matcher.exec(key)) !== null) {
					keys.push(key, m);
				}
			}

			for (i = 0, ii = keys.length; i < ii; ++i) {
				data = Cache.get_key(cache_type, keys[i]);
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
		},
		get_key: function (cache_type, key) {
			var json = Helper.json_parse_safe(cache_type.getItem(key));

			if (json && typeof(json) === "object" && Date.now() < json.expires) {
				return json.data;
			}

			cache_type.removeItem(key);
			return null;
		},
		get: function (type, key) {
			return Cache.get_key(Cache.type, Cache.namespace + type + "-" + key);
		},
		set: function (type, key, data, ttl) {
			var now = Date.now();

			if (ttl === 0) {
				ttl = ((now - parseInt(data.posted, 10) < 12 * t.HOUR) ? 1 : 12) * t.HOUR; // Update more frequently for recent uploads
			}

			Cache.type.setItem(Cache.namespace + type + "-" + key, JSON.stringify({
				expires: now + ttl,
				data: data
			}));
		},
		clear: function () {
			var re_matcher = new RegExp("^" + Helper.regex_escape(Cache.namespace)),
				types = [ window.localStorage, window.sessionStorage ],
				results = [],
				remove, cache_type, key, i, ii, j, jj;

			for (i = 0, ii = types.length; i < ii; ++i) {
				cache_type = types[i];
				remove = [];

				for (j = 0, jj = cache_type.length; j < jj; ++j) {
					key = cache_type.key(j);
					if (re_matcher.test(key)) {
						remove.push(key);
					}
				}

				for (j = 0, jj = remove.length; j < jj; ++j) {
					cache_type.removeItem(remove[j]);
				}

				results.push(jj);
			}

			return results;
		}
	};
	Database = {
		data: {
			ehentai: {},
			nhentai: {},
			hitomi: {}
		},
		errors: {
			ehentai: {},
			nhentai: {},
			hitomi: {}
		},
		valid_namespace: function (namespace) {
			return (Database.data[namespace] !== undefined);
		},
		get: function (namespace, uid) { // , debug
			// Use this if you want to break database gets randomly for debugging
			// if (arguments[2] === true && Math.random() > 0.8) return false;
			var db = Database.data[namespace],
				data = db[uid];

			if (data !== undefined) return data;

			data = Cache.get(namespace + "_gallery", uid);
			if (data !== null) {
				db[data.gid] = data;
				return data;
			}

			return null;
		},
		set: function (namespace, data) {
			Database.data[data.gid] = data;
			Cache.set(namespace + "_gallery", data.gid, data, 0);
		},
		set_nocache: function (namespace, data) {
			Database.data[namespace][data.gid] = data;
		},
		set_error: function (namespace, gid, error/*, cache*/) {
			Database.errors[namespace][gid] = error;
		},
		get_error: function (namespace, gid) {
			var v = Database.errors[namespace][gid];
			return v === undefined ? null : v;
		}
	};
	Hash = {
		data: {
			md5: {},
			sha1: {},
		},
		get: function (type, key) {
			var hash_data = Hash.data[type],
				value;

			value = hash_data[key];
			if (value) return value;

			value = Cache.get(type, key);
			if (value !== null) {
				hash_data[key] = value;
				return value;
			}

			return null;
		},
		set: function (type, key, value) {
			var ttl = (type === "md5") ? 365 * t.DAY : 12 * t.HOUR;
			Hash.data[type][key] = value;
			Cache.set(type, key, value, ttl);
		},
		set_nocache: function (type, key, value) {
			Hash.data[type][key] = value;
		}
	};
	SHA1 = {
		// SHA-1 JS implementation originally created by Chris Verness; http://movable-type.co.uk/scripts/sha1.html
		f: function (s, x, y, z) {
			switch (s) {
				case 0: return (x & y) ^ (~x & z);
				case 1: return x ^ y ^ z;
				case 2: return (x & y) ^ (x & z) ^ (y & z);
				case 3: return x ^ y ^ z;
			}
		},
		ROTL: function (x, n) {
			return (x << n) | (x >>> (32 - n));
		},
		hex: function (str) {
			var s = '',
				v, i;
			for (i = 7; i >= 0; --i) {
				v = (str >>> (i * 4)) & 0xf;
				s += v.toString(16);
			}
			return s;
		},
		hash: function (image) {
			var H0, H1, H2, H3, H4, K, M, N, W, T,
				a, b, c, d, e, i, j, l, s;

			K = new Uint32Array([ 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xCA62C1D6 ]);
			image[image.length - 1] = 0x80; // this is valid because the typed array always contains 1 extra padding byte

			l = image.length / 4 + 2;
			N = Math.ceil(l / 16);
			M = [];

			for (i = 0; i < N; ++i) {
				M[i] = [];
				for (j = 0; j < 16; ++j) {
					M[i][j] =
						(image[i * 64 + j * 4] << 24) |
						(image[i * 64 + j * 4 + 1] << 16) |
						(image[i * 64 + j * 4 + 2] << 8) |
						(image[i * 64 + j * 4 + 3]);
				}
			}

			M[N - 1][14] = Math.floor(((image.length - 1) * 8) / Math.pow(2, 32));
			M[N - 1][15] = ((image.length - 1) * 8) & 0xffffffff;

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
					W[j] = SHA1.ROTL(W[j - 3] ^ W[j - 8] ^ W[j - 14] ^ W[j - 16], 1);
				}

				a = H0;
				b = H1;
				c = H2;
				d = H3;
				e = H4;

				for (j = 0; j < 80; ++j) {
					s = Math.floor(j / 20);
					T = (SHA1.ROTL(a, 5) + SHA1.f(s, b, c, d) + e + K[s] + W[j]) & 0xffffffff;
					e = d;
					d = c;
					c = SHA1.ROTL(b, 30);
					b = a;
					a = T;
				}

				H0 = (H0 + a) & 0xffffffff;
				H1 = (H1 + b) & 0xffffffff;
				H2 = (H2 + c) & 0xffffffff;
				H3 = (H3 + d) & 0xffffffff;
				H4 = (H4 + e) & 0xffffffff;
			}

			return SHA1.hex(H0) + SHA1.hex(H1) + SHA1.hex(H2) + SHA1.hex(H3) + SHA1.hex(H4);
		}
	};
	Sauce = {
		similar_uploading: false,
		delays: {
			similar_okay: 2500,
			similar_error: 3000,
			similar_retry: 5000,
		},
		UI: {
			events: {
				click: function (event) {
					event.preventDefault();

					var sha1 = this.getAttribute("data-sha1"),
						results = Helper.get_exresults_from_exsauce(this),
						hover;

					if (results !== null) {
						hover = Nodes.sauce_hover[sha1];

						if (results.classList.toggle("hl-exsauce-results-hidden")) {
							if (conf['Show Short Results']) {
								if (hover === undefined) hover = Sauce.UI.hover(sha1);
								hover.classList.remove("hl-exsauce-hover-hidden");
								Sauce.UI.events.mousemove.call(this, event);
							}
						}
						else {
							if (hover !== undefined) {
								hover.classList.add("hl-exsauce-hover-hidden");
							}
						}
					}
				},
				mouseover: function () {
					if (conf['Show Short Results']) {
						var sha1 = this.getAttribute("data-sha1"),
							results = Helper.get_exresults_from_exsauce(this),
							hover;

						if (results === null || results.classList.contains("hl-exsauce-results-hidden")) {
							hover = Nodes.sauce_hover[sha1];
							if (hover === undefined) hover = Sauce.UI.hover(sha1);
							hover.classList.remove("hl-exsauce-hover-hidden");
						}
					}
				},
				mouseout: function () {
					if (conf['Show Short Results']) {
						var sha1 = this.getAttribute("data-sha1"),
							hover = Nodes.sauce_hover[sha1];

						if (hover !== undefined) {
							hover.classList.add("hl-exsauce-hover-hidden");
						}
					}
				},
				mousemove: function (event) {
					if (conf['Show Short Results']) {
						var hover = Nodes.sauce_hover[this.getAttribute("data-sha1")];

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
				}
			},
			hover: function (sha1) {
				var result = Hash.get("sha1", sha1),
					hover, i, ii;

				hover = $.create("div", {
					className: "hl-exsauce-hover hl-exsauce-hover-hidden post hl-hover-shadow reply post_wrapper hl-fake-post" + Theme.get()
				});
				hover.setAttribute("data-sha1", sha1);

				if (result !== null && (ii = result.length) > 0) {
					i = 0;
					while (true) {
						$.add(hover, $.link(result[i][0], {
							className: "hl-exsauce-hover-link",
							textContent: result[i][1]
						}));
						if (++i >= ii) break;
						$.add(hover, $.create("br"));
					}
				}
				Main.hovering(hover);
				Nodes.sauce_hover[sha1] = hover;

				return hover;
			}
		},
		format: function (a, result) {
			var count = result.length,
				theme = Theme.get(),
				index, results, link, n, i, ii;

			a.classList.add("hl-exsauce-link-valid");
			index = a.getAttribute("data-hl-image-index") || "";
			a.textContent = "Found: " + count;

			if (count > 0) {
				if (conf["Inline Results"] === true) {
					if (
						(n = Helper.Post.get_post_container(a)) !== null &&
						(n = Helper.Post.get_text_body(n)) !== null
					) {
						results = $.create("div", { className: "hl-exsauce-results" + theme });
						results.setAttribute("data-hl-image-index", index);
						$.add(results, $.create("strong", { textContent: "Reverse Image Search Results" }));
						$.add(results, $.create("span", { className: "hl-exsauce-results-sep", textContent: "|" }));
						$.add(results, $.create("span", { className: "hl-exsauce-results-label", textContent: "View on:" }));
						$.add(results, $.link(a.href, {
							className: "hl-exsauce-results-link",
							textContent: (conf["Lookup Domain"] === domains.exhentai) ? "exhentai" : "e-hentai"
						}));
						$.add(results, $.create("br"));

						for (i = 0, ii = result.length; i < ii; ++i) {
							link = Linkifier.create_link(result[i][0]);
							$.add(results, link);
							Linkifier.preprocess_link(link, true);
							Linkifier.apply_link_events(link);
							if (i < ii - 1) $.add(results, $.create("br"));
						}

						$.before(n, results);
						if (Linkifier.check_incomplete()) {
							API.run_request_queue();
						}
					}
				}
				Linkifier.change_link_events(a, "exsauce_toggle");
			}

			Debug.log("Formatting complete");
		},
		lookup: function (a, sha1) {
			a.textContent = "Checking";

			HttpRequest({
				method: "GET",
				url: a.href,
				onload: function (xhr) {
					if (xhr.status === 200) {
						var results = Sauce.get_results(xhr.responseText);

						Debug.log("Lookup successful; formatting...");
						Hash.set("sha1", sha1, results);
						if (conf["Show Short Results"]) Sauce.UI.hover(sha1);
						Sauce.format(a, results);
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
		},
		lookup_similar: function (a, image) {
			var type = "jpeg",
				m = /\.(png|gif)$/.exec(a.href || ""),
				form_data = new FormData(),
				blob, error_fn, reset_uploading;

			if (m !== null) type = m[1];

			blob = new Blob([ image ], { type: "image/" + type });

			form_data.append("sfile", blob, a.getAttribute("data-hl-filename") || "image." + type);
			form_data.append("fs_similar", "on");
			if (conf["Search Expunged"]) {
				form_data.append("fs_exp", "on");
			}

			reset_uploading = function () {
				Sauce.similar_uploading = false;
			};
			error_fn = function (msg) {
				return function () {
					setTimeout(reset_uploading, Sauce.delays.similar_error);
					a.textContent = "Error: " + msg;
				};
			};

			a.textContent = "Uploading";

			Sauce.similar_uploading = true;
			HttpRequest({
				method: "POST",
				url: "http://ul." + conf["Lookup Domain"] + "/image_lookup.php",
				data: form_data,
				onload: function (xhr) {
					if (xhr.status === 200) {
						var m = xhr.finalUrl.match(/f_shash=(([0-9a-f]{40}|corrupt)(?:;(?:[0-9a-f]{40}|monotone))*)/),
							md5, sha1, results;

						if (m && (sha1 = m[2]) !== "corrupt") {
							results = Sauce.get_results(xhr.responseText);

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
								if (conf["Show Short Results"]) Sauce.UI.hover(sha1);
								Sauce.format(a, results);
							}

							setTimeout(reset_uploading, Sauce.delays.similar_okay);
						}
						else {
							if (/please\s+wait\s+a\s+bit\s+longer\s+between\s+each\s+file\s+search/i.test(xhr.responseText)) {
								a.textContent = "Error: wait longer";
								a.setAttribute("title", "Click again to retry");
								$.on(a, "click", Sauce.fetch_similar);
								setTimeout(reset_uploading, Sauce.delays.similar_retry);
							}
							else {
								error_fn("unknown").call(null);
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
		},
		get_results: function (response_text) {
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
		},
		get_image: function (url, callback) {
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

						callback(null, ta, ii);
					}
					else {
						callback(xhr.status, null, 0);
					}
				},
				onerror: function () {
					callback("connection error", null, 0);
				},
				onabort: function () {
					callback("aborted", null, 0);
				}
			});
		},
		hash: function (a, md5) {
			Debug.log("Fetching image " + a.href);
			a.textContent = "Loading";

			Sauce.get_image(a.href, function (err, data) {
				if (err !== null) {
					a.textContent = "Error: hash/" + err;
				}
				else {
					var sha1 = SHA1.hash(data);
					a.textContent = "Hashing";
					a.setAttribute("data-sha1", sha1);
					Hash.set("md5", md5, sha1);
					Debug.log("SHA-1 hash for image: " + sha1);
					var res = Sauce.check(a);
					if (res !== true && res !== null) {
						Debug.log('No cached result found; performing a lookup...');
						Sauce.lookup(a, res);
					}
				}
			});
		},
		check: function (a) {
			var sha1 = a.getAttribute("data-sha1") || Hash.get("md5", a.getAttribute("data-md5") || "") || null,
				results;

			if (!sha1) return null;

			Debug.log('SHA-1 hash found');
			a.setAttribute('data-sha1', sha1);
			a.href = "http://" + domain_info[conf["Lookup Domain"]].g_domain + "/?f_doujinshi=1&f_manga=1&f_artistcg=1&f_gamecg=1&f_western=1&f_non-h=1&f_imageset=1&f_cosplay=1&f_asianporn=1&f_misc=1&f_search=Search+Keywords&f_apply=Apply+Filter&f_shash=" + sha1 + "&fs_similar=0";
			if (conf['Search Expunged'] === true) a.href += '&fs_exp=1';
			a.target = "_blank";
			a.rel = "noreferrer";

			results = Hash.get("sha1", sha1);
			if (results !== null) {
				Debug.log('Cached result found; formatting...');
				Sauce.format(a, results);
				return true;
			}

			return sha1;
		},
		fetch: function (event) {
			event.preventDefault();
			$.off(this, "click", Sauce.fetch);
			var res = Sauce.check(this);

			if (res !== true) {
				if (res === null) {
					Debug.log('No SHA-1 hash found; fetching image...');
					res = this.getAttribute("data-md5");
					if (res) Sauce.hash(this, res);
				}
				else { // res = sha1
					Debug.log('No cached result found; performing a lookup...');
					Sauce.lookup(this, res);
				}
			}
		},
		fetch_similar: function (event) {
			event.preventDefault();

			var res = Sauce.check(this),
				a = this;

			if (res !== true) {
				// Can search?
				if (Sauce.similar_uploading) return;
				$.off(this, "click", Sauce.fetch_similar);

				// Load image and upload
				a.textContent = "Loading";

				Sauce.get_image(this.href, function (err, image, image_size) {
					if (err !== null) {
						a.textContent = "Error: similar/" + err;
					}
					else {
						image = image.subarray(0, image_size);
						Sauce.lookup_similar(a, image);
					}
				});
			}
		},
		label: function () {
			var label = conf["Custom Label Text"];

			if (label.length === 0) {
				label = (conf["Lookup Domain"] === domains.exhentai) ? "exhentai" : "e-hentai";
			}

			return label;
		}
	};
	Linkifier = {
		incomplete: {
			types: [ "ehentai", "nhentai", "hitomi" ],
			ehentai: {
				types: [ "page", "gallery" ],
				unchecked: { page: {}, gallery: {} },
				checked: { page: {}, gallery: {} },
				missing: {
					page: function (id, info) {
						API.queue_gallery_page(id, info.page_token, info.page);
					},
					gallery: function (id, info) {
						API.queue_gallery(id, info.token);
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
		event_queue: {
			format: []
		},
		event_listeners: {
			format: []
		},
		link_events: {
			exsauce_fetch: Sauce.fetch,
			exsauce_fetch_similarity: Sauce.fetch_similar,
			exsauce_toggle: Sauce.UI.events,
			exsauce_error: function (event) {
				event.preventDefault();
				return false;
			},
			gallery_link: UI.events,
			gallery_error: function (event) {
				event.preventDefault();
				return false;
			},
			gallery_toggle_actions: function (event) {
				if (conf['Gallery Actions']) {
					return UI.toggle.call(this, event);
				}
			},
			gallery_fetch: function (event) {
				return Linkifier.on_tag_click_to_load.call(this, event);
			},
			actions_torrent: function (event) {
				if (conf['Torrent Popup']) {
					return UI.popup.call(this, event);
				}
			},
			actions_archiver: function (event) {
				if (conf['Archiver Popup']) {
					return UI.popup.call(this, event);
				}
			},
			actions_favorite: function (event) {
				if (conf['Favorite Autosave']) {
					return UI.favorite.call(this, event);
				}
				else if (conf['Favorite Popup']) {
					return UI.popup.call(this, event);
				}
			},
		},
		check_incomplete: function (type) {
			var incomplete = Linkifier.incomplete,
				api_request = false,
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
							Linkifier.format(entry[1], data);
							delete list1[k];
						}
						else if ((data = Database.get_error(info.site, k)) !== null) {
							Linkifier.format_links_error(entry[1], data);
							delete list1[k];
						}
					}

					list2 = obj.unchecked[m];
					for (k in list2) {
						entry = list2[k];
						info = entry[0];
						data = Database.get(info.site, k);
						if (data !== null) {
							Linkifier.format(entry[1], data);
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
		},
		get_links: function (parent) {
			return $$("a.hl-linkified-gallery[href]", parent);
		},
		get_links_formatted: function (parent) {
			return $$("a.hl-linkified-gallery[data-hl-linkified-status=formatted]", parent);
		},
		linkify: function (container, results) {
			var ddw = Linkifier.deep_dom_wrap,
				re_link = regex.url,
				re_ignore = /(?:\binlined?\b|\bex(?:links)?-)/;

			ddw(
				container,
				"a",
				function (text, pos) {
					re_link.lastIndex = pos;
					var m = re_link.exec(text);
					if (m === null) return null;
					return [ m.index , m.index + m[0].length, m ];
				},
				function (node) {
					if (node.tagName === "BR" || node.tagName === "A") {
						return ddw.EL_TYPE_NO_PARSE | ddw.EL_TYPE_LINE_BREAK;
					}
					else if (node.tagName === "WBR") {
						return ddw.EL_TYPE_NO_PARSE;
					}
					else if (node.tagName === "DIV") {
						if (re_ignore.test(node.className)) {
							return ddw.EL_TYPE_NO_PARSE | ddw.EL_TYPE_LINE_BREAK;
						}
						return ddw.EL_TYPE_LINE_BREAK;
					}
					return ddw.EL_TYPE_PARSE;
				},
				function (node, match) {
					var url = match[2][0];
					if (!regex.protocol.test(url)) url = "http://" + url.replace(/^\/+/, "");
					node.href = url;
					node.target = "_blank";
					node.rel = "noreferrer";
					results.push(node);
				},
				false
			);
		},
		create_link: function (text) {
			return $.link(text, {
				className: "hl-linkified",
				textContent: text
			});
		},
		preprocess_link: function (node, auto_load) {
			var url = node.href,
				info = Helper.get_url_info(url),
				rewrite, button;

			if (info === null) {
				node.classList.remove('hl-linkified-gallery');
				node.removeAttribute("data-hl-linkified-status");
			}
			else {
				if (info.site === "ehentai") {
					rewrite = conf['Rewrite Links'];
					if (rewrite === domains.exhentai) {
						if (info.domain !== rewrite) {
							node.href = url.replace(regex.site_gehentai, domains.exhentai);
							info.domain = rewrite;
						}
					}
					else if (rewrite === domains.ehentai) {
						if (info.domain !== rewrite) {
							node.href = url.replace(regex.site_exhentai, domains.gehentai);
							info.domain = rewrite;
						}
					}
				}

				node.classList.add("hl-link-events");
				node.classList.add("hl-linkified");
				node.classList.add("hl-linkified-gallery");
				node.setAttribute("data-hl-link-events", "gallery_link");
				node.setAttribute("data-hl-linkified-status", "processed");

				node.setAttribute("data-hl-info", JSON.stringify(info));
				node.setAttribute("data-hl-id", info.site + "_" + info.gid);

				button = UI.button(url, info.domain);
				$.before(node, button);

				if (auto_load) {
					Linkifier.check_link(node, info);
				}
			}
		},
		format: function (links, data) {
			var events = (Linkifier.event_listeners.format.length > 0) ? Linkifier.event_queue.format : null,
				link, i, ii;

			for (i = 0, ii = links.length; i < ii; ++i) {
				link = links[i];

				Linkifier.format_link(link, data);

				if (events !== null) events.push(link);
			}

			if (events !== null) {
				Linkifier.trigger("format");
			}
		},
		format_link: function (link, data) {
			var button, actions, hl, c;

			// Link title
			link.textContent = Helper.normalize_api_string(data.title);
			link.setAttribute("data-hl-linkified-status", "formatted");

			// Button
			button = Helper.get_tag_button_from_link(link);
			if (button !== null) {
				if ((hl = Filter.check(link, data))[0] !== Filter.None) {
					c = (hl[0] === Filter.Good) ? conf['Good Tag Marker'] : conf['Bad Tag Marker'];
					button.textContent = button.textContent.replace(/\]\s*$/, c + "]");
					Filter.highlight_tag(button, link, hl);
				}
				Linkifier.change_link_events(button, "gallery_toggle_actions");
			}

			// Actions
			actions = UI.actions(data, link);
			$.after(link, actions);
		},
		format_links_error: function (links, error) {
			var button, link, msg_data, i, ii;

			msg_data = {
				className: "hl-linkified-error-message",
				textContent: " (" + error.trim().replace(/\.$/, "") + ")"
			};

			for (i = 0, ii = links.length; i < ii; ++i) {
				link = links[i];
				button = Helper.get_tag_button_from_link(link);
				if (button !== null) {
					Linkifier.change_link_events(button, "gallery_error");
					button.classList.add("hl-linkified-error");
				}

				link.classList.add("hl-linkified-error");
				link.setAttribute("data-hl-linkified-status", "formatted_error");
				$.add(link, $.create("span", msg_data));
			}
		},
		apply_link_events: function (node, check_children) {
			var nodes = check_children ? $$("a.hl-link-events", node) : [ node ],
				events, i, ii;

			for (i = 0, ii = nodes.length; i < ii; ++i) {
				node = nodes[i];
				events = node.getAttribute("data-hl-link-events");
				Linkifier.set_link_events(node, events);
			}
		},
		set_link_events: function (node, new_events) {
			var events = Linkifier.link_events[new_events],
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
		},
		change_link_events: function (node, new_events) {
			var old_events = node.getAttribute("data-hl-link-events"),
				events, k;

			if (old_events === new_events) return;

			events = Linkifier.link_events[old_events];
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
				node.removeAttribute("data-hl-link-events");
			}
			else {
				node.setAttribute("data-hl-link-events", new_events);
				Linkifier.set_link_events(node, new_events);
			}
		},
		parse_posts: function (posts) {
			var check_files_before = (Config.mode === "tinyboard"),
				post, i, ii;

			Debug.timer("process");

			for (i = 0, ii = posts.length; i < ii; ++i) {
				post = posts[i];
				Linkifier.parse_post(post);
				Linkifier.apply_link_events(post, true);
				if (check_files_before && post.classList.contains("op")) {
					if ((post = Helper.Post.get_op_post_files_container_tinyboard(post)) !== null) {
						Linkifier.apply_link_events(post, true);
					}
				}
			}

			Debug.log("Total posts=" + posts.length + "; time=" + Debug.timer("process"));
		},
		parse_post: function (post) {
			var auto_load_links = conf["Automatic Processing"],
				post_body, post_links, links, nodes, link, i, ii;

			// Exsauce
			if (conf.ExSauce) {
				Linkifier.setup_post_exsauce(post);
			}

			// Collapse info if it's an inline
			if (conf['Hide in Quotes']) {
				nodes = $$(".hl-exsauce-results", post);
				for (i = 0, ii = nodes.length; i < ii; ++i) {
					nodes[i].classList.add("hl-exsauce-results-hidden");
				}
				nodes = $$(".hl-actions", post);
				for (i = 0, ii = nodes.length; i < ii; ++i) {
					nodes[i].classList.add("hl-actions-hidden");
				}
			}

			// Content
			if (
				!post.classList.contains("hl-post-linkified") &&
				(post_body = Helper.Post.get_text_body(post)) !== null
			) {
				regex.url.lastIndex = 0;
				if (!Config.linkify || regex.url.test(post_body.innerHTML)) {
					links = [];
					post_links = Helper.Post.get_body_links(post_body);
					for (i = 0, ii = post_links.length; i < ii; ++i) {
						link = post_links[i];
						regex.url.lastIndex = 0;
						if (regex.url.test(link.href)) {
							link.classList.add("hl-link-events");
							link.classList.add("hl-linkified");
							link.classList.add("hl-linkified-gallery");
							link.target = "_blank";
							link.rel = "noreferrer";
							link.setAttribute("data-hl-linkified-status", "unprocessed");
							Linkifier.change_link_events(link, "gallery_link");
							links.push(link);
						}
					}

					if (Config.linkify) {
						Linkifier.linkify(post_body, links);
					}

					for (i = 0, ii = links.length; i < ii; ++i) {
						Linkifier.preprocess_link(links[i], auto_load_links);
					}
				}
				post.classList.add("hl-post-linkified");
			}
		},
		setup_post_exsauce: function (post) {
			var index = 0,
				file_infos, file_info, sauce, i, ii;

			// File info
			file_infos = Helper.Post.get_file_info(post);
			for (i = 0, ii = file_infos.length; i < ii; ++i) {
				file_info = file_infos[i];
				if (file_info.md5 === null) continue;

				// Create if not found
				sauce = $(".hl-exsauce-link", file_info.options);
				if (sauce === null && /^\.(png|gif|jpe?g)$/i.test(file_info.type)) {
					sauce = $.link(file_info.url, {
						className: "hl-link-events hl-exsauce-link" + (file_info.options_class ? " " + file_info.options_class : ""),
						textContent: Sauce.label()
					});
					sauce.setAttribute("data-hl-link-events", "exsauce_fetch");
					sauce.setAttribute("data-hl-filename", file_info.name);
					sauce.setAttribute("data-hl-image-index", index);
					sauce.setAttribute("data-md5", file_info.md5.replace(/=+/g, ""));
					if (/^\.jpe?g$/i.test(file_info.type) && Config.mode !== "tinyboard") {
						if (/Firefox/i.test("" + navigator.userAgent)) {
							sauce.setAttribute("data-hl-link-events", "exsauce_fetch_similarity");
							sauce.title = "This will only work on colored images";
						}
						else {
							sauce.classList.add("hl-exsauce-link-disabled");
							sauce.setAttribute("data-hl-link-events", "exsauce_error");
							sauce.title = (
								"Reverse Image Search doesn't work for .jpg images because 4chan manipulates them on upload"
							);
						}
					}
					if (file_info.options_sep) {
						$.before2(file_info.options, $.tnode(file_info.options_sep), file_info.options_before);
					}
					$.before2(file_info.options, sauce, file_info.options_before);

					++index;
				}
			}
		},
		on_tag_click_to_load: function (event) {
			event.preventDefault();

			var link, info;

			if (
				(link = Helper.get_link_from_tag_button(this)) !== null &&
				(info = Helper.get_info_from_node(link)) !== null &&
				Database.valid_namespace(info.site)
			) {
				Linkifier.check_link(link, info);
				Linkifier.check_incomplete();
			}
		},
		check_link: function (link, info) {
			var obj, lists, list;

			if (
				(obj = Linkifier.incomplete[info.site]) !== undefined &&
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
		},
		on: function (event_name, callback) {
			var listeners = Linkifier.event_listeners[event_name];
			if (!listeners) return false;
			listeners.push(callback);
			return true;
		},
		off: function (event_name, callback) {
			var listeners = Linkifier.event_listeners[event_name],
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
		},
		trigger: function (event_name) {
			var queue = Linkifier.event_queue[event_name],
				listeners, i, ii;
			if (queue && queue.length > 0) {
				listeners = Linkifier.event_listeners[event_name];
				for (i = 0, ii = listeners.length; i < ii; ++i) {
					listeners[i].call(null, queue);
				}

				Linkifier.event_queue[event_name] = [];
			}
		},
		deep_dom_wrap: (function () {

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

		})()
	};
	Options = {
		conf: null,
		save: function (e) {
			e.preventDefault();
			conf = Options.conf;
			Options.conf = null;
			Config.save();
			if (Nodes.options_overlay !== null) {
				$.remove(Nodes.options_overlay);
				Nodes.options_overlay = null;
			}
			d.documentElement.classList.remove("hl-settings-overlaying");
		},
		close: function (e) {
			e.preventDefault();
			Options.conf = null;
			if (Nodes.options_overlay !== null) {
				$.remove(Nodes.options_overlay);
				Nodes.options_overlay = null;
			}
			d.documentElement.classList.remove("hl-settings-overlaying");
		},
		on_change: function () {
			var node = this,
				type = node.getAttribute("type"),
				name = node.getAttribute("data-hl-setting-name"),
				opt, v;

			if (!(name in Options.conf)) return;

			if (node.tagName === "SELECT") {
				v = node.value;
				if (
					(opt = options[node.getAttribute("data-hl-setting-type")]) !== undefined &&
					(opt = opt[name]) !== undefined &&
					opt.length >= 5
				) {
					v = opt[4].call(this, v);
				}
				Options.conf[name] = v;
			}
			else if (type === "checkbox") {
				Options.conf[name] = (node.checked ? true : false);
			}
			else if (type === "text" || node.tagName === "TEXTAREA") {
				Options.conf[name] = node.value;
			}
		},
		on_data_clear: function (event) {
			if (!event.which || event.which === 1) {
				event.preventDefault();
				var clears = Cache.clear();
				Debug.log("Cleared cache; localStorage=" + clears[0] + "; sessionStorage=" + clears[1]);
				this.textContent = "Cleared!";
			}
		},
		open: function (event) {
			if (event.which && event.which !== 1) return;
			event.preventDefault();

			// Create
			var overlay = $.frag(UI.html.options()).firstChild,
				scroll_node = $(".hl-settings-content", overlay),
				theme = Theme.get();

			// Config
			Options.conf = JSON.parse(JSON.stringify(conf));

			// Set global
			if (Nodes.options_overlay !== null) {
				$.remove(Nodes.options_overlay);
			}
			Nodes.options_overlay = overlay;

			// Theme
			Theme.apply(overlay);

			// Options
			Options.gen($(".hl-settings-group-general", overlay), theme, "general");
			Options.gen($(".hl-settings-group-actions", overlay), theme, "actions");
			Options.gen($(".hl-settings-group-sauce", overlay), theme, "sauce");
			Options.gen($(".hl-settings-group-filter", overlay), theme, "filter");
			Options.gen($(".hl-settings-group-debug", overlay), theme, "debug", {
				"Clear Stored Data": [ "button", false, "Clear all stored data <em>except</em> for settings", "Clear", Options.on_data_clear ],
			});

			// Events
			$.on($(".hl-settings-button-link-save", overlay), "click", Options.save);
			$.on($(".hl-settings-button-link-cancel", overlay), "click", Options.close);
			$.on(overlay, "click", Options.close);
			$.on($(".hl-settings", overlay), "click", function (event) { event.stopPropagation(); });
			$.on($("input.hl-settings-color-input[type=color]", overlay), "change", Filter.settings_color_change);
			$.on($(".hl-settings-filter-guide-toggle", overlay), "click", Options.on_toggle_filter_guide);

			// Add to body
			$.add(d.body, overlay);
			d.documentElement.classList.add("hl-settings-overlaying");

			// Focus
			if (scroll_node !== null) {
				$.scroll_focus(scroll_node);
			}
		},
		gen: function (container, theme, option_type) {
			var entry, table, row, cell, label, input,
				args, values, name, desc, type, value, obj, key, i, ii, j, jj, n, v;

			args = Array.prototype.slice.call(arguments, 2);
			args[0] = options[option_type];
			for (i = 0, ii = args.length; i < ii; ++i) {
				obj = args[i];
				for (key in obj) {
					name = "hl-settings-" + key;
					desc = obj[key][2];
					type = obj[key][0];
					value = Options.conf[key];

					$.add(container, entry = $.create("div", { className: "hl-settings-entry" + theme }));
					$.add(entry, table = $.create("div", { className: "hl-settings-entry-table" }));
					$.add(table, row = $.create("div", { className: "hl-settings-entry-row" }));

					$.add(row, cell = $.create("span", { className: "hl-settings-entry-cell" }));
					$.add(cell, label = $.create("label", { className: "hl-settings-entry-label", htmlFor: name }));
					label.innerHTML = "<strong>" + key + ":</strong>" + (desc.length > 0 ? " " + desc : "");

					if (type === "checkbox") {
						$.add(row, cell = $.create("span", { className: "hl-settings-entry-cell" }));
						$.add(cell, input = $.create("input", {
							className: "hl-settings-entry-input" + theme,
							type: "checkbox",
							id: name,
							checked: value
						}));
						$.on(input, "change", Options.on_change);
					}
					else if (type === "select") {
						$.add(row, cell = $.create("span", { className: "hl-settings-entry-cell" }));
						$.add(cell, input = $.create("select", {
							className: "hl-settings-entry-input" + theme
						}));
						$.on(input, "change", Options.on_change);

						values = obj[key][3];
						for (j = 0, jj = values.length; j < jj; ++j) {
							v = values[j];
							$.add(input, n = $.create("option", {
								textContent: v[1],
								value: v[0],
								selected: (v[0] === value)
							}));
							if (v.length > 2) n.title = v[2];
						}
					}
					else if (type === "textbox") {
						$.add(row, cell = $.create("span", { className: "hl-settings-entry-cell" }));
						$.add(cell, input = $.create("input", {
							className: "hl-settings-entry-input" + theme,
							type: "text",
							id: name,
							value: value
						}));
						$.on(input, "change", Options.on_change);
					}
					else if (type === "textarea") {
						$.add(table, row = $.create("div", { className: "hl-settings-entry-row" }));
						$.add(row, cell = $.create("span", { className: "hl-settings-entry-cell" }));
						$.add(cell, input = $.create("textarea", {
							className: "hl-settings-entry-input" + theme,
							wrap: "off",
							spellcheck: false,
							id: name,
							value: value
						}));
						$.on(input, "change", Options.on_change);
					}
					else if (type === "button") {
						$.add(row, cell = $.create("span", { className: "hl-settings-entry-cell" }));
						$.add(cell, input = $.create("button", {
							className: "hl-settings-entry-input" + theme,
							textContent: (obj[key][3] || '')
						}));
						$.on(input, "click", obj[key][4] || Options.on_change);
					}
					input.setAttribute("data-hl-setting-name", key);
					input.setAttribute("data-hl-setting-type", option_type);
				}
			}
		},
		on_toggle_filter_guide: function (event) {
			event.preventDefault();

			try {
				var n = this.parentNode.parentNode.parentNode.nextSibling;
				if (n.classList.contains("hl-settings-filter-guide")) {
					n.classList.toggle("hl-settings-filter-guide-visible");
				}
			}
			catch (e) {}
		},
		init: function () {
			Main.insert_nav_link("main", "#TITLE#", "#TITLE# Settings", " hl-nav-link-settings", Options.open);
		}
	};
	Config = {
		namespace: "#PREFIX#settings",
		mode: "4chan", // foolz, fuuka, tinyboard
		mode_ext: {
			fourchanx3: false,
			oneechan: false
		},
		linkify: true,
		storage: (function () {
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
		})(),
		site: function () {
			var site = d.URL,
				doctype = d.doctype,
				type;

			if (/archive\.moe/i.test(site)) {
				type = "<!DOCTYPE " +
					doctype.name +
					(doctype.publicId ? " PUBLIC \"" + doctype.publicId + "\"" : "") +
					(!doctype.publicId && doctype.systemId ? " SYSTEM" : "") +
					(doctype.systemId ? " \"" + doctype.systemId + "\"" : "") +
					">";

				Config.mode = (/<!DOCTYPE html>/.test(type)) ? "foolz" : "fuuka";
				Config.linkify = false;
			}
			else if (/8ch\.net/i.test(site)) {
				Config.mode = "tinyboard";
				Config.linkify = false;
				if ($("form[name=postcontrols]") === null) return false;
			}
			else if (/boards\.38chan\.net/i.test(site)) {
				Config.mode = "tinyboard";
				Config.linkify = false;
			}
			else {
				Config.mode_ext.fourchanx3 = d.documentElement.classList.contains("fourchan-x");
				Config.mode_ext.oneechan = ($.id("OneeChanLink") !== null);
			}

			return true;
		},
		save: function () {
			var temp = {},
				i, k;
			for (i in options) {
				for (k in options[i]) {
					temp[k] = conf[k];
				}
			}
			Config.storage.setItem(Config.namespace, JSON.stringify(temp));
		},
		init: function () {
			var update = false,
				temp, value, i, k;

			if (
				(temp = Config.storage.getItem(Config.namespace)) === null ||
				(temp = Helper.json_parse_safe(temp, null)) === null ||
				typeof(temp) !== "object"
			) {
				temp = {};
			}

			for (i in options) {
				for (k in options[i]) {
					value = temp[k];
					if (value === undefined) {
						value = options[i][k][1];
						update = true;
					}
					conf[k] = value;
				}
			}

			if (/presto/i.test(navigator.userAgent)) {
				conf.ExSauce = false;
			}

			if (update) Config.save();
		}
	};
	Filter = {
		filters: null,
		None: 0,
		Bad: -1,
		Good: 1,
		cache: {
			tags: {}
		},
		regex_default_flags: "color:#ee2200;link-color:#ee2200;",
		Segment: function (start, end, data) {
			this.start = start;
			this.end = end;
			this.data = data;
		},
		MatchInfo: function () {
			this.matches = [];
			this.any = false;
			this.bad = false;
		},
		init: function () {
			Filter.filters = Filter.parse(conf.Filters);
		},
		genregex: function (pattern, flags) {
			if (flags.indexOf("g") < 0) {
				flags += "g";
			}
			try {
				return new RegExp(pattern, flags);
			}
			catch (e) {
				return null;
			}
		},
		parse: function (input) {
			var filters = [],
				lines = (input || "").split("\n"),
				i, pos, pos2, flags, line, regex;

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
					regex = Filter.genregex(regex, flags);

					if (regex) {
						flags = Filter.parse_flags((pos < line.length) ? line.substr(pos) : Filter.regex_default_flags);
						filters.push({
							regex: regex,
							flags: flags
						});
					}
				}
				else if (line[0] !== "#") {
					if ((pos = line.indexOf(";")) > 0) {
						regex = line.substr(0, pos);
						flags = (pos < line.length) ? Filter.parse_flags(line.substr(pos)) : null;
					}
					else {
						regex = line;
						flags = Filter.parse_flags(Filter.regex_default_flags);
					}
					regex = new RegExp(Helper.regex_escape(regex), "ig");

					filters.push({
						regex: regex,
						flags: flags
					});
				}
			}
			return filters;
		},
		parse_flags: function (text) {
			var flaglist, flags, key, m, i;
			flags = {};
			flaglist = text.split(";");

			for (i = 0; i < flaglist.length; ++i) {
				if (flaglist[i].length > 0) {
					m = flaglist[i].split(":");
					key = m[0].trim().toLowerCase();
					m.splice(0, 1);
					flags[key] = m.join("").trim();
				}
			}

			return Filter.normalize_flags(flags);
		},
		normalize_flags: function (flags) {
			var any = false,
				good = [ "", "true", "yes" ],
				norm = {
					title: true,
					tags: true,
					uploader: false,
				},
				v;

			if (flags.title !== undefined || flags.tags !== undefined || flags.tag !== undefined || flags.uploader !== undefined) {
				norm.title = ((v = flags.title) === undefined ? false : good.indexOf(v.trim().toLowerCase()) >= 0);
				norm.tags = ((v = flags.tags) === undefined && (v = flags.tag) === undefined ? false : good.indexOf(v.trim().toLowerCase()) >= 0);
				norm.uploader = ((v = flags.uploader) === undefined ? false : good.indexOf(v.trim().toLowerCase()) >= 0);
				any = true;
			}

			if (
				((v = flags.only) !== undefined || (v = flags.category) !== undefined || (v = flags.cat) !== undefined) &&
				v.length > 0
			) {
				norm.only = Filter.normalize_split(v);
				any = true;
			}
			if ((v = flags.not) !== undefined && v.length > 0) {
				norm.not = Filter.normalize_split(v);
				any = true;
			}
			if ((v = flags.bad) !== undefined && (good.indexOf(v.trim().toLowerCase()) >= 0)) {
				norm.bad = true;
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
				norm.link = {};
				norm.link.color = v.trim();
				any = true;
			}
			if ((v = flags["link-background"]) !== undefined || (v = flags["link-bg"]) !== undefined || (v = flags.lbg) !== undefined) {
				if (norm.link === undefined) norm.link = {};
				norm.link.background = v.trim();
				any = true;
			}
			if ((v = flags["link-underline"]) !== undefined || (v = flags["link-u"]) !== undefined || (v = flags.lu) !== undefined) {
				if (norm.link === undefined) norm.link = {};
				norm.link.underline = v.trim();
				any = true;
			}

			return any ? norm : null;
		},
		normalize_split: function (text) {
			var array, i;
			array = text.split(",");
			for (i = 0; i < array.length; ++i) {
				array[i] = array[i].trim().toLowerCase();
			}
			return array;
		},
		matches_to_segments: function (text, matches) {
			var Segment, segments, fast, hit, m, s, i, j;

			Segment = Filter.Segment;
			segments = [ new Segment(0, text.length, []) ];
			fast = conf['Full Highlighting'];

			if (fast) {
				for (i = 0; i < matches.length; ++i) {
					segments[0].data.push(matches[i].data);
				}
			}
			else {
				for (i = 0; i < matches.length; ++i) {
					m = matches[i];
					hit = false;
					for (j = 0; j < segments.length; ++j) {
						s = segments[j];
						if (m.start < s.end && m.end > s.start) {
							hit = true;
							j = Filter.update_segments(segments, j, m, s);
						}
						else if (hit) {
							break;
						}
					}
				}
			}

			return segments;
		},
		update_segments: function (segments, pos, seg1, seg2) {
			var s1, s2, data;

			data = seg2.data.slice(0);
			seg2.data.push(seg1.data);

			if (seg1.start > seg2.start) {
				if (seg1.end < seg2.end) {
					// cut at both
					s1 = new Filter.Segment(seg2.start, seg1.start, data);
					s2 = new Filter.Segment(seg1.end, seg2.end, data.slice(0));
					seg2.start = seg1.start;
					seg2.end = seg1.end;
					segments.splice(pos, 0, s1);
					pos += 2;
					segments.splice(pos, 0, s2);
				}
				else {
					// cut at start
					s1 = new Filter.Segment(seg2.start, seg1.start, data);
					seg2.start = seg1.start;
					segments.splice(pos, 0, s1);
					pos += 1;
				}
			}
			else {
				if (seg1.end < seg2.end) {
					// cut at end
					s2 = new Filter.Segment(seg1.end, seg2.end, data);
					seg2.end = seg1.end;
					pos += 1;
					segments.splice(pos, 0, s2);
				}
				// else, cut at neither
			}

			return pos;
		},
		apply_styles: function (node, styles) {
			var color = null, background = null, underline = null, style, i, s;

			for (i = 0; i < styles.length; ++i) {
				style = styles[i];
				if ((s = style.color)) {
					color = s;
				}
				if ((s = style.background)) {
					background = s;
				}
				if ((s = style.underline)) {
					underline = s;
				}
			}

			Filter.apply_styling(node, color, background, underline);
		},
		apply_styling: function (node, color, background, underline) {
			if (color !== null) {
				node.style.setProperty("color", color, "important");
			}
			if (background !== null) {
				node.style.setProperty("background-color", background, "important");
			}
			if (underline !== null) {
				node.style.setProperty("border-bottom", "0.125em solid " + underline, "important");
			}
		},
		append_match_datas: function (matchinfo, target) {
			for (var i = 0, ii = matchinfo.matches.length; i < ii; ++i) {
				target.push(matchinfo.matches[i].data);
			}
		},
		remove_non_bad: function (list) {
			for (var i = 0; i < list.length; ) {
				if (!list[i].bad) {
					list.splice(i, 1);
					continue;
				}
				++i;
			}
		},
		check_multiple: function (type, text, filters, data) {
			var info = new Filter.MatchInfo(),
				filter, match, i;

			for (i = 0; i < filters.length; ++i) {
				filter = filters[i];
				if (filter.flags[type] !== true) continue;
				filter.regex.lastIndex = 0;
				while (true) {
					match = Filter.check_single(text, filter, data);
					if (match === false) break;

					info.any = true;
					if (match !== true) {
						info.matches.push(match);
						if (match.data.bad) {
							info.bad = true;
						}
					}
				}
			}
			return info;
		},
		check_single: function (text, filter, data) {
			var list, cat, i, m;

			m = filter.regex.exec(text);
			if (filter.flags === null) {
				return (m !== null);
			}

			// Category filtering
			cat = data.category.toLowerCase();
			if ((list = filter.flags.only)) {
				for (i = 0; i < list.length; ++i) {
					if (list[i] === cat) {
						break;
					}
				}
				if (i >= list.length) {
					return false;
				}
			}
			if ((list = filter.flags.not)) {
				for (i = 0; i < list.length; ++i) {
					if (list[i] === cat) {
						return false;
					}
				}
			}

			// Text filter
			return (m === null) ? false : new Filter.Segment(m.index, m.index + m[0].length, filter.flags);
		},
		check: function (titlenode, data, extras) {
			if (Filter.filters === null) return [ Filter.None, null ];

			var filters = Filter.filters,
				status, str, tags, result, i, info;

			if (extras && extras.length > 0) {
				filters = filters.concat(extras);
			}

			result = {
				tags: [],
				uploader: [],
				title: [],
			};

			// Title
			status = Filter.highlight("title", titlenode, data, result.title, extras);

			if (filters.length > 0) {
				// Uploader
				if ((str = data.uploader)) {
					str = Helper.normalize_api_string(str);
					info = Filter.check_multiple("uploader", str, filters, data);
					if (info.any) {
						Filter.append_match_datas(info, result.uploader);
						if (info.bad) {
							status = Filter.Bad;
						}
						else if (status === Filter.None) {
							status = Filter.Good;
						}
					}
				}

				// Tags
				if ((tags = data.tags) && tags.length > 0) {
					for (i = 0; i < tags.length; ++i) {
						info = Filter.check_multiple("tags", tags[i], filters, data);
						if (info.any) {
							Filter.append_match_datas(info, result.tags);
							if (info.bad) {
								status = Filter.Bad;
							}
							else if (status === Filter.None) {
								status = Filter.Good;
							}
						}
					}
					// Remove dups
					result.tags = result.tags.filter(function (item, pos, self) {
						return (self.indexOf(item) === pos);
					});
				}
			}

			// Remove non-bad filters on result.tags and result.uploader
			if (status === Filter.Bad) {
				Filter.remove_non_bad(result.uploader);
				Filter.remove_non_bad(result.tags);
			}

			return [ status , (status === Filter.None ? null : result) ];
		},
		highlight: function (type, node, data, results, extras) {
			if (Filter.filters === null) {
				Filter.init();
			}

			var no_extras = true,
				filters = Filter.filters,
				info, matches, text, frag, segment, cache, c, i, t, n1, n2;

			if (extras && extras.length > 0) {
				filters = filters.concat(extras);
				no_extras = false;
			}
			if (filters.length === 0) {
				return Filter.None;
			}

			// Cache for tags
			text = node.textContent;
			if (no_extras && (cache = Filter.cache[type]) !== undefined && (c = cache[text]) !== undefined) {
				if (c === null) {
					return Filter.None;
				}

				// Results
				if (results !== null) {
					Filter.append_match_datas(c[0], results);
				}

				// Clone
				n1 = c[1].cloneNode(true);
				node.innerHTML = "";
				while ((n2 = n1.firstChild) !== null) {
					$.add(node, n2);
				}
				return Filter.hl_return(n1.classList.contains("hl-filter-bad"), node);
			}

			// Check filters
			info = Filter.check_multiple(type, text, filters, data);
			if (!info.any) {
				if (cache !== undefined) {
					cache[text] = null;
				}
				return Filter.None;
			}

			// If bad, remove all non-bad filters
			if (info.bad) {
				for (i = 0; i < info.matches.length; ) {
					if (!info.matches[i].data.bad) {
						info.matches.splice(i, 1);
						continue;
					}
					++i;
				}
			}

			// Results
			if (results !== null) {
				Filter.append_match_datas(info, results);
			}

			// Merge
			matches = Filter.matches_to_segments(text, info.matches);

			frag = d.createDocumentFragment();
			for (i = 0; i < matches.length; ++i) {
				segment = matches[i];
				t = text.substring(segment.start, segment.end);
				if (segment.data.length === 0) {
					$.add(frag, $.tnode(t));
				}
				else {
					n1 = $.create("span", { className: "hl-filter-text" });
					n2 = $.create("span", { className: "hl-filter-text-inner", textContent: t });
					$.add(n1, n2);
					$.add(frag, n1);
					Filter.apply_styles(n1, segment.data);
				}
			}

			// Replace
			node.innerHTML = "";
			$.add(node, frag);
			if (cache !== undefined) {
				cache[text] = [ info, node ];
			}
			return Filter.hl_return(info.bad, node);
		},
		highlight_tag: function (node, link, filter_data) {
			if (filter_data[0] === Filter.Bad) {
				node.classList.add("hl-filter-bad");
				link.classList.add("hl-filter-bad");
				link.classList.remove("hl-filter-good");
			}
			else {
				node.classList.add("hl-filter-good");
				link.classList.add("hl-filter-good");
			}

			// Get styles
			var color = null, background = null, underline = null, n, n1, n2;

			var get_style = function (styles) {
				var i, s, style;
				for (i = 0; i < styles.length; ++i) {
					if ((style = styles[i].link) !== undefined) {
						if ((s = style.color)) {
							color = s;
						}
						if ((s = style.background)) {
							background = s;
						}
						if ((s = style.underline)) {
							underline = s;
						}
					}
				}
			};

			get_style(filter_data[1].uploader);
			get_style(filter_data[1].title);
			get_style(filter_data[1].tags);

			// Apply styles
			if (color !== null || background !== null || underline !== null) {
				n1 = $.create("span", { className: "hl-filter-text" });
				n2 = $.create("span", { className: "hl-filter-text-inner" });
				while ((n = node.firstChild) !== null) {
					$.add(n2, n);
				}
				$.add(n1, n2);
				$.add(node, n1);
				Filter.apply_styling(n1, color, background, underline);
			}
		},
		hl_return: function (bad, node) {
			if (bad) {
				node.classList.add("hl-filter-bad");
				return Filter.Bad;
			}
			else {
				node.classList.add("hl-filter-good");
				return Filter.Good;
			}
		},
		settings_color_change: function () {
			var n = this.nextSibling, m;
			if (n) {
				n.value = this.value.toUpperCase();
				n = n.nextSibling;
				if (n) {
					m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(this.value);
					if (m !== null) {
						n.value = "rgba(" + parseInt(m[1], 16) + "," + parseInt(m[2], 16) + "," + parseInt(m[3], 16) + ",1)";
					}
				}
			}
		}
	};
	Theme = {
		current: "light",
		get: function () {
			return (Theme.current === "light" ? " hl-theme" : " hl-theme hl-theme-dark");
		},
		apply: function (node) {
			if (Theme.current !== "light") {
				var nodes = $$(".hl-theme", node),
					i, ii;

				for (i = 0, ii = nodes.length; i < ii; ++i) {
					nodes[i].classList.add("hl-theme-dark");
				}

				if (node.classList && node.classList.contains("hl-theme")) {
					node.classList.add("hl-theme-dark");
				}
			}
		},
		prepare: function (first) {
			Theme.update(!first);

			var add_mo = function (nodes, init, callback) {
				if (MutationObserver === null) return;

				var mo = new MutationObserver(callback),
					i;
				for (i = 0; i < nodes.length; ++i) {
					if (nodes[i]) mo.observe(nodes[i], init);
				}
			};

			add_mo([ d.head ], { childList: true }, function (records) {
				var update = false,
					nodes, node, tag, i, ii, j, jj;

				outer:
				for (i = 0, ii = records.length; i < ii; ++i) {
					if ((nodes = records[i].addedNodes)) {
						for (j = 0, jj = nodes.length; j < jj; ++j) {
							node = nodes[j];
							tag = node.tagName;
							if (tag === "STYLE" || (tag === "LINK" && /\bstylesheet\b/.test(node.rel))) {
								update = true;
								break outer;
							}
						}
					}
					if ((nodes = records[i].removedNodes)) {
						for (j = 0, jj = nodes.length; j < jj; ++j) {
							node = nodes[j];
							tag = node.tagName;
							if (tag === "STYLE" || (tag === "LINK" && /\bstylesheet\b/.test(node.rel))) {
								update = true;
								break outer;
							}
						}
					}
				}

				if (update) {
					Theme.update();
				}
			});
		},
		update: function (update_nodes) {
			var new_theme = Theme.detect();
			if (new_theme !== null && new_theme !== Theme.current) {
				if (update_nodes) {
					var nodes = $$("hl-theme"),
						cls, i;
					if (new_theme === "light") {
						cls = "hl-theme-" + Theme.current;
						for (i = 0; i < nodes.length; ++i) {
							nodes.classList.remove(cls);
						}
					}
					else {
						cls = "hl-theme-" + new_theme;
						for (i = 0; i < nodes.length; ++i) {
							nodes.classList.add(cls);
						}
					}
				}
				Theme.current = new_theme;
			}
		},
		detect: function () {
			var doc_el = d.documentElement,
				body = d.body,
				n = d.createElement("div"),
				color, colors, i, j, a, a_inv;

			if (!doc_el || !body) {
				return null;
			}

			n.className = "post reply post_wrapper hl-fake-post";
			body.appendChild(n);

			color = Theme.parse_css_color(Theme.get_computed_style(doc_el).backgroundColor);
			colors = [
				Theme.parse_css_color(Theme.get_computed_style(body).backgroundColor),
				Theme.parse_css_color(Theme.get_computed_style(n).backgroundColor),
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

			return (color[0] + color[1] + color[2] < 384) ? "dark" : "light";
		},
		get_computed_style: function (node) {
			try {
				// Don't use window.getComputedStyle: https://code.google.com/p/chromium/issues/detail?id=538650
				return document.defaultView.getComputedStyle(node);
			}
			catch (e) {
				return node.style;
			}
		},
		parse_css_color: function (color) {
			color = color || "";
			if (color !== "transparent") {
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
		}
	};
	EasyList = {
		namespace: "#PREFIX#easylist-",
		overlay: null,
		options_container: null,
		items_container: null,
		empty_notification: null,
		queue: [],
		current: [],
		data_map: {},
		queue_timer: null,
		custom_filters: [],
		node_sort_order_keys: {
			thread: [ "data-hl-index", 1 ],
			upload: [ "data-hl-date-uploaded", -1 ],
			rating: [ "data-hl-rating", -1 ]
		},
		display_mode_names: [
			"full",
			"compact",
			"minimal"
		],
		settings: {
			sort_by: "thread",
			group_by_category: false,
			group_by_filters: false,
			custom_filters: "# Custom filters follow the same rules as standard filters\n",
			display_mode: 0 // 0 = full, 1 = compact, 2 = minimal
		},
		settings_save: function () {
			Config.storage.setItem(EasyList.namespace + "settings", JSON.stringify(EasyList.settings));
		},
		settings_load: function () {
			// Load
			var value = Config.storage.getItem(EasyList.namespace + "settings"),
				settings = EasyList.settings,
				k;

			value = Helper.json_parse_safe(value, null);
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
			EasyList.load_filters();
		},
		init: function () {
			Main.insert_nav_link("normal", "Easy List", "Easy List", " hl-nav-link-easylist", EasyList.on_open_click);
		},
		create: function () {
			var theme = Theme.get(),
				n1, n2, n3, n4, n5;

			// Overlay
			n1 = $.create("div", {
				className: "hl-easylist-overlay" + theme
			});
			$.on(n1, "click", EasyList.on_overlay_click);
			$.on(n1, "mousedown", EasyList.on_overlay_mousedown);
			EasyList.overlay = n1;

			// Content aligner
			$.add(n1, n2 = $.create("div", {
				className: "hl-easylist-content-align"
			}));

			// Content
			$.add(n2, n3 = $.create("div", {
				className: "hl-easylist-content"
			}));

			$.add(n3, n4 = $.create("div", {
				className: "hl-easylist-content-inner hl-hover-shadow post reply post_wrapper hl-fake-post" + theme
			}));
			$.on(n4, "click", EasyList.on_overlay_content_mouse_event);
			$.on(n4, "mousedown", EasyList.on_overlay_content_mouse_event);
			n3 = n4;

			$.add(n3, n4 = $.create("div", {
				className: "hl-easylist-title"
			}));

			$.add(n4, $.create("span", {
				className: "hl-easylist-title-text",
				textContent: "#TITLE# Easy List"
			}));
			$.add(n4, $.create("span", {
				className: "hl-easylist-subtitle",
				textContent: "More porn, less hassle"
			}));

			// Close
			$.add(n3, n4 = $.create("div", { className: "hl-easylist-control-links" }));

			$.add(n4, n5 = $.link(null, {
				className: "hl-easylist-control-link hl-easylist-control-link-options",
				textContent: "options"
			}));
			$.on(n5, "click", EasyList.on_options_click);

			$.add(n4, n5 = $.link(null, {
				className: "hl-easylist-control-link",
				textContent: "close"
			}));
			$.on(n5, "click", EasyList.on_close_click);

			$.add(n3, $.create("div", { className: "hl-easylist-title-line" }));

			// Options
			EasyList.options_container = EasyList.create_options(theme);
			$.add(n3, EasyList.options_container);

			// Empty notification
			$.add(n3, n4 = $.create("div", {
				className: "hl-easylist-empty-notification hl-easylist-empty-notification-visible",
				textContent: "No galleries found"
			}));
			EasyList.empty_notification = n4;

			// Items list
			$.add(n3, n4 = $.create("div", { className: "hl-easylist-items" + theme }));
			EasyList.items_container = n4;

			// Setup
			EasyList.update_display_mode(true);
		},
		create_options: function (theme) {
			var n1, n2, n3, n4, n5, n6, v;

			n1 = $.create("div", { className: "hl-easylist-options" });
			$.add(n1, n2 = $.create("div", { className: "hl-easylist-option-table" }));


			$.add(n2, n3 = $.create("div", { className: "hl-easylist-option-row" }));
			$.add(n3, n4 = $.create("div", { className: "hl-easylist-option-cell" }));
			$.add(n4, $.create("span", { className: "hl-easylist-option-title", textContent: "Sort by:" }));

			$.add(n3, n4 = $.create("div", { className: "hl-easylist-option-cell" }));

			v = "thread";
			$.add(n4, n5 = $.create("label", { className: "hl-easylist-option-label" }));
			$.add(n5, n6 = $.create("input", {
				className: "hl-easylist-option-input",
				name: "hl-easylist-options-sort-by",
				type: "radio",
				checked: (EasyList.settings.sort_by === v),
				value: v
			}));
			$.add(n5, $.create("span", { className: "hl-easylist-option-button" + theme, textContent: "Appearance in thread" }));
			$.on(n6, "change", EasyList.on_option_change.sort_by);

			v = "upload";
			$.add(n4, n5 = $.create("label", { className: "hl-easylist-option-label" }));
			$.add(n5, n6 = $.create("input", {
				className: "hl-easylist-option-input",
				name: "hl-easylist-options-sort-by",
				type: "radio",
				checked: (EasyList.settings.sort_by === v),
				value: v
			}));
			$.add(n5, $.create("span", { className: "hl-easylist-option-button" + theme, textContent: "Upload date" }));
			$.on(n6, "change", EasyList.on_option_change.sort_by);

			v = "rating";
			$.add(n4, n5 = $.create("label", { className: "hl-easylist-option-label" }));
			$.add(n5, n6 = $.create("input", {
				className: "hl-easylist-option-input",
				name: "hl-easylist-options-sort-by",
				type: "radio",
				checked: (EasyList.settings.sort_by === v),
				value: v
			}));
			$.add(n5, $.create("span", { className: "hl-easylist-option-button" + theme, textContent: "Rating" }));
			$.on(n6, "change", EasyList.on_option_change.sort_by);


			$.add(n2, n3 = $.create("div", { className: "hl-easylist-option-row" }));
			$.add(n3, n4 = $.create("div", { className: "hl-easylist-option-cell" }));
			$.add(n4, $.create("span", { className: "hl-easylist-option-title", textContent: "Group by:" }));

			$.add(n3, n4 = $.create("div", { className: "hl-easylist-option-cell" }));

			$.add(n4, n5 = $.create("label", { className: "hl-easylist-option-label" }));
			$.add(n5, n6 = $.create("input", { className: "hl-easylist-option-input", type: "checkbox", checked: EasyList.settings.group_by_filters }));
			$.add(n5, $.create("span", { className: "hl-easylist-option-button" + theme, textContent: "Filters" }));
			$.on(n6, "change", EasyList.on_option_change.group_by_filters);

			$.add(n4, n5 = $.create("label", { className: "hl-easylist-option-label" }));
			$.add(n5, n6 = $.create("input", { className: "hl-easylist-option-input", type: "checkbox", checked: EasyList.settings.group_by_category }));
			$.add(n5, $.create("span", { className: "hl-easylist-option-button" + theme, textContent: "Category" }));
			$.on(n6, "change", EasyList.on_option_change.group_by_category);


			$.add(n2, n3 = $.create("div", { className: "hl-easylist-option-row" }));
			$.add(n3, n4 = $.create("div", { className: "hl-easylist-option-cell" }));
			$.add(n4, $.create("span", { className: "hl-easylist-option-title", textContent: "Display mode:" }));

			$.add(n3, n4 = $.create("div", { className: "hl-easylist-option-cell" }));

			v = 0;
			$.add(n4, n5 = $.create("label", { className: "hl-easylist-option-label" }));
			$.add(n5, n6 = $.create("input", {
				className: "hl-easylist-option-input",
				name: "hl-easylist-options-display",
				type: "radio",
				checked: (EasyList.settings.display_mode === v),
				value: "" + v
			}));
			$.add(n5, $.create("span", { className: "hl-easylist-option-button" + theme, textContent: "Full" }));
			$.on(n6, "change", EasyList.on_option_change.display_mode);

			v = 1;
			$.add(n4, n5 = $.create("label", { className: "hl-easylist-option-label" }));
			$.add(n5, n6 = $.create("input", {
				className: "hl-easylist-option-input",
				name: "hl-easylist-options-display",
				type: "radio",
				checked: (EasyList.settings.display_mode === v),
				value: "" + v
			}));
			$.add(n5, $.create("span", { className: "hl-easylist-option-button" + theme, textContent: "Compact" }));
			$.on(n6, "change", EasyList.on_option_change.display_mode);

			v = 2;
			$.add(n4, n5 = $.create("label", { className: "hl-easylist-option-label" }));
			$.add(n5, n6 = $.create("input", {
				className: "hl-easylist-option-input",
				name: "hl-easylist-options-display",
				type: "radio",
				checked: (EasyList.settings.display_mode === v),
				value: "" + v
			}));
			$.add(n5, $.create("span", { className: "hl-easylist-option-button" + theme, textContent: "Minimal" }));
			$.on(n6, "change", EasyList.on_option_change.display_mode);



			$.add(n2, n3 = $.create("div", { className: "hl-easylist-option-row" }));
			$.add(n3, n4 = $.create("div", { className: "hl-easylist-option-cell" }));
			$.add(n4, $.create("span", { className: "hl-easylist-option-title", textContent: "Custom filters:" }));

			$.add(n3, n4 = $.create("div", { className: "hl-easylist-option-cell" }));
			$.add(n4, n6 = $.create("textarea", { className: "hl-easylist-option-textarea" + theme, value: EasyList.settings.custom_filters, wrap: "off", spellcheck: false, autocomplete: "off" }));
			$.on(n6, "change", EasyList.on_option_change.custom_filters);
			$.on(n6, "input", EasyList.on_option_change.custom_filters_input);


			$.add(n1, $.create("div", { className: "hl-easylist-title-line" }));

			return n1;
		},
		enable: function () {
			var n = d.body;
			if (EasyList.overlay.parentNode !== n) {
				$.add(n, EasyList.overlay);
			}
			d.documentElement.classList.add("hl-easylist-overlaying");

			// Focus
			$.scroll_focus(EasyList.overlay);
		},
		disable: function () {
			if (EasyList.overlay.parentNode !== null) {
				$.remove(EasyList.overlay);
			}
			d.documentElement.classList.remove("hl-easylist-overlaying");

			EasyList.set_options_visible(false);

			Linkifier.off("format", EasyList.on_linkify);
		},
		populate: function () {
			EasyList.on_linkify(Linkifier.get_links_formatted());
			Linkifier.on("format", EasyList.on_linkify);
		},
		set_empty: function (empty) {
			if (EasyList.empty_notification !== null) {
				var cls = "hl-easylist-empty-notification-visible";
				if (empty !== EasyList.empty_notification.classList.contains(cls)) {
					EasyList.empty_notification.classList.toggle(cls);
				}
			}
		},
		get_options_visible: function () {
			return EasyList.options_container.classList.contains("hl-easylist-options-visible");
		},
		set_options_visible: function (visible) {
			var n = $(".hl-easylist-control-link-options", EasyList.overlay),
				cl, cls;

			if (n !== null) {
				cl = n.classList;
				cls = "hl-easylist-control-link-focus";
				if (cl.contains(cls) !== visible) cl.toggle(cls);
			}

			cl = EasyList.options_container.classList;
			cls = "hl-easylist-options-visible";
			if (cl.contains(cls) !== visible) cl.toggle(cls);
		},
		create_gallery_nodes: function (data, theme, index, domain) {
			var url = Helper.Site.create_gallery_url(data, domain),
				hl_res, n1, n2, n3, n4, n5, n6, n7, i;

			n1 = $.create("div", { className: "hl-easylist-item" + theme });
			n1.setAttribute("data-hl-index", index);
			n1.setAttribute("data-hl-gid", data.gid);
			n1.setAttribute("data-hl-token", data.token);
			n1.setAttribute("data-hl-rating", data.rating);
			n1.setAttribute("data-hl-date-uploaded", data.posted);
			n1.setAttribute("data-hl-category", data.category.toLowerCase());
			n1.setAttribute("data-hl-domain", domain);

			$.add(n1, n2 = $.create("div", { className: "hl-easylist-item-table-container" + theme }));
			$.add(n2, n3 = $.create("div", { className: "hl-easylist-item-table" + theme }));
			n2 = n3;
			$.add(n2, n3 = $.create("div", { className: "hl-easylist-item-row" + theme }));
			$.add(n3, n4 = $.create("div", { className: "hl-easylist-item-cell hl-easylist-item-cell-image" + theme }));

			// Image
			$.add(n4, n5 = $.link(url, {
				className: "hl-easylist-item-image-container" + theme
			}));

			$.add(n5, n6 = $.create("div", {
				className: "hl-easylist-item-image-outer" + theme
			}));

			if (data.thumb) {
				$.add(n6, n7 = $.create("img", {
					className: "hl-easylist-item-image" + theme,
					src: data.thumb,
					alt: "",
					title: ""
				}));
				$.on(n7, "error", EasyList.on_thumbnail_error);
			}
			else {
				n6.style.width = "100%";
				n6.style.height = "100%";
			}

			$.add(n6, $.create("span", {
				className: "hl-easylist-item-image-index" + theme,
				textContent: "#" + (index + 1)
			}));


			// Main content
			$.add(n3, n4 = $.create("div", { className: "hl-easylist-item-cell" + theme }));

			$.add(n4, n5 = $.create("div", {
				className: "hl-easylist-item-title" + theme
			}));

			$.add(n5, n6 = $.link(url, {
				className: "hl-easylist-item-title-tag-link" + theme,
				textContent: UI.button_text(domain)
			}));
			n6.setAttribute("data-hl-original", n6.textContent);

			$.add(n5, n6 = $.link(url, {
				className: "hl-easylist-item-title-link" + theme,
				textContent: Helper.normalize_api_string(data.title)
			}));
			n6.setAttribute("data-hl-original", n6.textContent);

			if (data.title_jpn) {
				$.add(n4, n5 = $.create("span", {
					className: "hl-easylist-item-title-jp" + theme,
					textContent: Helper.normalize_api_string(data.title_jpn)
				}));
				n5.setAttribute("data-hl-original", n5.textContent);
			}

			$.add(n4, n5 = $.create("div", { className: "hl-easylist-item-upload-info" + theme }));
			$.add(n5, $.tnode("Uploaded by "));
			$.add(n5, n6 = $.link(Helper.Site.create_uploader_url(data, domain), {
				className: "hl-easylist-item-uploader" + theme,
				textContent: data.uploader
			}));
			n6.setAttribute("data-hl-original", n6.textContent);
			$.add(n5, $.tnode(" on "));
			$.add(n5, $.create("span", {
				className: "hl-easylist-item-upload-date" + theme,
				textContent: UI.date(new Date(parseInt(data.posted, 10) * 1000))
			}));

			$.add(n4, n5 = $.create("div", { className: "hl-easylist-item-tags" + theme }));

			n6 = EasyList.create_full_tags(domain, data, theme);
			$.add(n5, n6[0]);
			if (!n6[1]) {
				$.on(n1, "mouseover", EasyList.on_gallery_mouseover);
			}


			// Right sidebar
			$.add(n3, n4 = $.create("div", { className: "hl-easylist-item-cell hl-easylist-item-cell-side" + theme }));

			$.add(n4, n5 = $.create("div", {
				className: "hl-easylist-item-info" + theme,
			}));

			$.add(n5, n6 = $.link(Helper.Site.create_category_url(data, domain), {
				className: "hl-easylist-item-info-button hl-button hl-button-eh hl-button-" + cat[data.category].short + theme
			}));
			$.add(n6, $.create("div", {
				className: "hl-noise",
				textContent: cat[data.category].name
			}));


			$.add(n5, n6 = $.create("div", {
				className: "hl-easylist-item-info-item hl-easylist-item-info-item-rating" + theme
			}));
			$.add(n6, n7 = $.create("div", {
				className: "hl-stars-container",
				innerHTML: UI.html.stars(data.rating)
			}));
			if (data.rating >= 0) {
				$.add(n6, $.create("span", {
					className: "hl-easylist-item-info-light",
					textContent: "(Avg: " + (parseFloat(data.rating) || 0).toFixed(2) + ")"
				}));
			}
			else {
				n7.classList.add("hl-stars-container-na");
				$.add(n6, $.create("span", {
					className: "hl-easylist-item-info-light",
					textContent: "(n/a)"
				}));
			}

			$.add(n5, n6 = $.create("div", {
				className: "hl-easylist-item-info-item hl-easylist-item-info-item-files" + theme
			}));
			i = parseInt(data.filecount, 10) || 0;
			$.add(n6, $.create("span", {
				textContent: i + " image" + (i === 1 ? "" : "s")
			}));
			if (data.filesize >= 0) {
				$.add(n6, $.create("br"));
				i = (data.filesize / 1024 / 1024).toFixed(2).replace(/\.?0+$/, "");
				$.add(n6, $.create("span", {
					className: "hl-easylist-item-info-light",
					textContent: "(" + i + " MB)"
				}));
			}

			// Highlight
			hl_res = EasyList.update_filters(n1, data, true, false, true);
			EasyList.tag_filtering_results(n1, hl_res);

			return n1;
		},
		create_full_tags: function (domain, data, theme) {
			var n1 = $.create("div", { className: "hl-easylist-item-tag-table" + theme }),
				domain_type = domain_info[domain].type,
				full_domain = domain_info[domain].g_domain,
				namespace_style = "",
				all_tags, namespace, tags, n2, n3, n4, i, ii;

			if (API.data_has_full(data) && Object.keys(data.full.tags).length > 0) {
				all_tags = data.full.tags;
			}
			else {
				all_tags = { "": data.tags };
			}

			for (namespace in all_tags) {
				tags = all_tags[namespace];

				$.add(n1, n2 = $.create("div", {
					className: "hl-easylist-item-tag-row" + theme
				}));

				if (namespace !== "") {
					namespace_style = " hl-tag-namespace-" + namespace.replace(/\ /g, "-");
					$.add(n2, n3 = $.create("div", {
						className: "hl-easylist-item-tag-cell hl-easylist-item-tag-cell-label" + theme
					}));
					$.add(n3, n4 = $.create("span", {
						className: "hl-tag-namespace-block hl-tag-namespace-block-no-outline" + namespace_style + theme
					}));
					$.add(n4, $.create("span", {
						textContent: namespace,
						className: "hl-tag-namespace"
					}));
					$.add(n3, $.tnode(":"));
				}

				$.add(n2, n3 = $.create("div", {
					className: "hl-easylist-item-tag-cell" + theme
				}));
				n2 = n3;

				for (i = 0, ii = tags.length; i < ii; ++i) {
					$.add(n2, n3 = $.create("span", {
						className: "hl-tag-block" + namespace_style
					}));
					$.add(n3, n4 = $.link(Helper.Site.create_tag_url(tags[i], domain_type, full_domain), {
						textContent: tags[i],
						className: "hl-tag hl-tag-color-inherit hl-easylist-item-tag"
					}));
					n4.setAttribute("data-hl-original", n4.textContent);

					if (i < ii - 1) $.add(n3, $.tnode(","));
				}
			}

			return [ n1, namespace !== "" ];
		},
		add_gallery: function (entry, theme) {
			var data = Database.get(entry.namespace, entry.id),
				n;

			if (data !== null) {
				n = EasyList.create_gallery_nodes(data, theme, EasyList.current.length, entry.domain);

				Main.insert_custom_fonts();

				$.add(EasyList.items_container, n);

				EasyList.current.push(entry);
			}
		},
		add_gallery_complete: function () {
			EasyList.set_empty(EasyList.current.length === 0);

			var set = EasyList.settings;
			if (set.group_by_category || set.group_by_filters || set.sort_by !== "thread") {
				EasyList.update_ordering();
			}
		},
		tag_filtering_results: function (node, hl_results) {
			var list, bad, i, ii, k;
			for (k in hl_results) {
				list = hl_results[k];
				bad = 0;
				for (i = 0, ii = list.length; i < ii; ++i) {
					if (list[i].bad) ++bad;
				}

				node.setAttribute("data-hl-filter-matches-" + k, list.length - bad);
				node.setAttribute("data-hl-filter-matches-" + k + "-bad", bad);
			}
		},
		get_category_ordering: function () {
			var cat_order = {},
				i = 0,
				k;

			for (k in cat) {
				cat_order[cat[k].short] = i;
				++i;
			}
			cat_order[""] = i;

			return cat_order;
		},
		get_node_filter_group: function (node) {
			var v1 = parseInt(node.getAttribute("data-hl-filter-matches-title"), 10) || 0,
				v2 = parseInt(node.getAttribute("data-hl-filter-matches-title-bad"), 10) || 0,
				v3 = parseInt(node.getAttribute("data-hl-filter-matches-uploader"), 10) || 0,
				v4 = parseInt(node.getAttribute("data-hl-filter-matches-uploader-bad"), 10) || 0,
				v5 = parseInt(node.getAttribute("data-hl-filter-matches-tags"), 10) || 0,
				v6 = parseInt(node.getAttribute("data-hl-filter-matches-tags-bad"), 10) || 0;

			v2 += v4 + v6;
			if (v2 > 0) return -v2;
			return v1 + v3 + v5;
		},
		get_node_category_group: function (node, ordering) {
			var k = node.getAttribute("data-hl-category") || "";
			return ordering[k in ordering ? k : ""];
		},
		update_display_mode: function (first) {
			var list = EasyList.display_mode_names,
				mode = list[EasyList.settings.display_mode] || "",
				cl = EasyList.items_container.classList,
				i, ii;

			if (!first) {
				for (i = 0, ii = list.length; i < ii; ++i) {
					cl.remove("hl-easylist-" + list[i]);
				}
			}

			cl.add("hl-easylist-" + mode);
		},
		update_ordering: function () {
			var items = [],
				list = EasyList.current,
				mode = EasyList.settings.sort_by,
				ordering, base_array, item, attr, cat_order, par, n, n2, i, ii;

			// Grouping
			if (EasyList.settings.group_by_filters) {
				if (EasyList.settings.group_by_category) {
					cat_order = EasyList.get_category_ordering();
					base_array = function (node) {
						return [ EasyList.get_node_filter_group(node), EasyList.get_node_category_group(node, cat_order) ];
					};
					ordering = [ -1, 1 ];
				}
				else {
					base_array = function (node) {
						return [ EasyList.get_node_filter_group(node) ];
					};
					ordering = [ -1 ];
				}
			}
			else if (EasyList.settings.group_by_category) {
				cat_order = EasyList.get_category_ordering();
				base_array = function (node) {
					return [ EasyList.get_node_category_group(node, cat_order) ];
				};
				ordering = [ 1 ];
			}
			else {
				base_array = function () { return []; };
				ordering = [];
			}

			// Iterate
			attr = EasyList.node_sort_order_keys[mode in EasyList.node_sort_order_keys ? mode : "thread"];
			ordering.push(attr[1], 1);
			attr = attr[0];
			for (i = 0, ii = list.length; i < ii; ++i) {
				n = list[i].node;
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
			par = EasyList.items_container;
			for (i = 0, ii = items.length; i < ii; ++i) {
				n = items[i].node;
				par.appendChild(n);
				if ((n2 = $(".hl-easylist-item-image-index", n)) !== null) {
					n2.textContent = "#" + (i + 1);
				}
			}
		},
		update_filters: function (node, data, first, tags_only, get_results) {
			var results1 = null,
				results2 = null,
				results3 = null,
				ret = null,
				targets, nodes, mode, results, link, hl, n, i, ii, j, jj;

			if (get_results) {
				results1 = [];
				results2 = [];
				results3 = [];
				ret = {
					title: results1,
					uploader: results2,
					tags: results3
				};
			}

			targets = [
				[ ".hl-easylist-item-title-link", "title", results1 ],
				[ ".hl-easylist-item-title-jp", "title", results1 ],
				[ ".hl-easylist-item-uploader", "uploader", results2 ],
				[ ".hl-easylist-item-tag", "tags", results3 ],
			];

			for (i = (tags_only ? 3 : 0), ii = targets.length; i < ii; ++i) {
				nodes = $$(targets[i][0], node);
				mode = targets[i][1];
				results = targets[i][2];
				for (j = 0, jj = nodes.length; j < jj; ++j) {
					n = nodes[j];
					if (!first) {
						n.textContent = n.getAttribute("data-hl-original") || "";
						n.classList.remove("hl-filter-good");
						n.classList.remove("hl-filter-bad");
					}
					Filter.highlight(mode, n, data, results, EasyList.custom_filters);
				}
			}

			if (!tags_only) {
				link = $(".hl-easylist-item-title-link", node);
				n = $(".hl-easylist-item-title-tag-link", node);

				if (link !== null && n !== null) {
					if (!first) {
						n.textContent = n.getAttribute("data-hl-original") || "";
						n.classList.remove("hl-filter-good");
						n.classList.remove("hl-filter-bad");
					}

					link = link.cloneNode(true);
					if ((hl = Filter.check(link, data, EasyList.custom_filters))[0] !== Filter.None) {
						Filter.highlight_tag(n, link, hl);
					}
				}
			}

			return ret;
		},
		update_all_filters: function () {
			var list = EasyList.current,
				hl_res, entry, data, i, ii;

			for (i = 0, ii = list.length; i < ii; ++i) {
				entry = list[i];
				data = Database.get(entry.namespace, entry.id);
				if (data !== null) {
					hl_res = EasyList.update_filters(list[i].node, data, false, false, true);
					EasyList.tag_filtering_results(list[i].node, hl_res);
				}
			}
		},
		load_filters: function () {
			EasyList.custom_filters = Filter.parse(EasyList.settings.custom_filters);
		},
		on_option_change: {
			sort_by: function () {
				EasyList.settings.sort_by = this.value;
				EasyList.settings_save();
				EasyList.update_ordering();
			},
			group_by_category: function () {
				EasyList.settings.group_by_category = this.checked;
				EasyList.settings_save();
				EasyList.update_ordering();
			},
			group_by_filters: function () {
				EasyList.settings.group_by_filters = this.checked;
				EasyList.settings_save();
				EasyList.update_ordering();
			},
			display_mode: function () {
				EasyList.settings.display_mode = parseInt(this.value, 10) || 0;
				EasyList.settings_save();
				EasyList.update_display_mode(false);
			},
			custom_filters: function () {
				if (EasyList.settings.custom_filters !== this.value) {
					EasyList.settings.custom_filters = this.value;
					EasyList.settings_save();
					EasyList.load_filters();
					EasyList.update_all_filters();

					// Update order
					if (EasyList.settings.group_by_filters) {
						EasyList.update_ordering();
					}
				}
			},
			custom_filters_input: function () {
				var node = this;
				if (EasyList.on_option_change.custom_filters_input_delay_timer !== null) {
					clearTimeout(EasyList.on_option_change.custom_filters_input_delay_timer);
				}
				EasyList.on_option_change.custom_filters_input_delay_timer = setTimeout(
					function () {
						EasyList.on_option_change.custom_filters_input_delay_timer = null;
						EasyList.on_option_change.custom_filters.call(node);
					},
					1000
				);
			},
			custom_filters_input_delay_timer: null
		},
		on_gallery_mouseover: function () {
			$.off(this, "mouseover", EasyList.on_gallery_mouseover);

			var node = this,
				tags_container = $(".hl-easylist-item-tags", this),
				gid = this.getAttribute("data-hl-gid") || "",
				token = this.getAttribute("data-hl-token") || "",
				site = this.getAttribute("data-hl-site");

			if (!site) site = domains.exhentai;

			API.get_full_gallery_info(gid, token, site, function (err, data) {
				if (err === null && tags_container !== null) {
					var domain = node.getAttribute("data-hl-domain") || domains.exhentai,
						n, hl_res;

					n = EasyList.create_full_tags(domain, data, Theme.get());
					tags_container.textContent = "";
					$.add(tags_container, n[0]);

					hl_res = EasyList.update_filters(tags_container, data, false, true, true);
					EasyList.tag_filtering_results(node, { tags: hl_res.tags });
				}
			});
		},
		on_thumbnail_error: function () {
			$.off(this, "error", EasyList.on_thumbnail_error);

			var par = this.parentNode;
			if (par === null) return;
			par.style.width = "100%";
			par.style.height = "100%";
			this.style.visibility = "hidden";
		},
		on_linkify: function (links) {
			var link, id, id_key, d, i, ii;

			for (i = 0, ii = links.length; i < ii; ++i) {
				link = links[i];
				id = Helper.get_id_from_node(link);
				if (id !== null && Database.valid_namespace(id[0])) {
					id_key = id[0] + "_" + id[1];
					if (EasyList.data_map[id_key] === undefined) {
						d = {
							domain: Helper.get_domain(link.href || "") || domains.exhentai,
							namespace: id[0],
							id: id[1]
						};
						EasyList.queue.push(d);
						EasyList.data_map[id_key] = d;
					}
				}
			}

			if (EasyList.queue.length > 0 && EasyList.queue_timer === null) {
				EasyList.on_timer();
			}
		},
		on_timer: function () {
			EasyList.queue_timer = null;

			var entries = EasyList.queue.splice(0, 20),
				theme = Theme.get(),
				i, ii;

			for (i = 0, ii = entries.length; i < ii; ++i) {
				EasyList.add_gallery(entries[i], theme);
			}
			EasyList.add_gallery_complete();

			if (EasyList.queue.length > 0) {
				EasyList.queue_timer = setTimeout(EasyList.on_timer, 50);
			}
		},
		on_open_click: function (event) {
			if (EasyList.overlay === null) {
				EasyList.settings_load();
				EasyList.create();
			}
			EasyList.enable();
			EasyList.populate();
			event.preventDefault();
			return false;
		},
		on_close_click: function (event) {
			if (!event.which || event.which === 1) {
				EasyList.disable();
			}
		},
		on_options_click: function (event) {
			if (!event.which || event.which === 1) {
				EasyList.set_options_visible(!EasyList.get_options_visible());
			}
		},
		on_overlay_click: function (event) {
			EasyList.disable();

			event.preventDefault();
			event.stopPropagation();
			return false;
		},
		on_overlay_mousedown: function (event) {
			if (!event.which || event.which === 1) {
				event.preventDefault();
				event.stopPropagation();
				return false;
			}
		},
		on_overlay_content_mouse_event: function (event) {
			if (!event.which || event.which === 1) {
				event.stopPropagation();
			}
		}
	};
	Main = {
		version: "#VERSION#",
		queue: [],
		font_inserted: false,
		hovering: (function () {
			var container = null;
			return function (node) {
				if (container === null) {
					container = $.create("div", {
						className: "hl-hovering-elements"
					});
					$.add(d.body, container);
				}
				$.add(container, node);
			};
		})(),
		dom: function (event) {
			var node = event.target;
			Main.observer([{
				target: node.parentNode,
				addedNodes: [ node ],
				nextSibling: node.nextSibling,
				previousSibling: node.previousSibling
			}]);
		},
		observer: function (records) {
			var post_list = [],
				nodes, node, e, i, ii, j, jj;

			for (i = 0, ii = records.length; i < ii; ++i) {
				e = records[i];
				nodes = e.addedNodes;
				if (!nodes) continue;

				// Look for posts
				for (j = 0, jj = nodes.length; j < jj; ++j) {
					Main.observe_post_change(nodes[j], post_list);
				}

				// 4chan X specific hacks.
				if (Config.fourchanx3) {
					// detect when source links are added.
					if (
						e.target.classList.contains("fileText") &&
						e.previousSibling &&
						e.previousSibling.classList &&
						e.previousSibling.classList.contains("file-info")
					) {
						node = Helper.Post.get_post_container(e.target);
						if (node !== null) {
							post_list.push(node);
						}
					}
				}

				// Detect 4chan X's linkification muck-ups
				for (j = 0, jj = nodes.length; j < jj; ++j) {
					node = nodes[j];
					if (
						node.tagName === "A" &&
						node.classList.contains("linkified") &&
						node.previousSibling &&
						node.previousSibling.classList &&
						node.previousSibling.classList.contains("hl-site-tag")
					) {
						node.className = "hl-link-events hl-linkified hl-linkified-gallery";
						node.setAttribute("data-hl-linkified-status", "unprocessed");
						Linkifier.change_link_events(node, "gallery_link");
						$.remove(node.previousSibling);

						Linkifier.preprocess_link(node, conf["Automatic Processing"]);

						node = Helper.Post.get_post_container(node);
						if (node !== null) {
							post_list.push(node);
						}
					}
				}
			}

			if (post_list.length > 0) {
				Linkifier.parse_posts(post_list);
				if (Linkifier.check_incomplete()) {
					API.run_request_queue();
				}
			}
		},
		observe_post_change: function (node, nodelist) {
			if (node.nodeType === Node.ELEMENT_NODE) {
				if (Helper.Post.is_post(node)) {
					nodelist.push(node);
				}
				else if (node.classList.contains("thread")) {
					var ns = Helper.Post.get_all_posts(node);
					if (ns.length > 0) {
						$.push_many(nodelist, ns);
					}
				}
			}
		},
		insert_custom_fonts: function () {
			if (Main.font_inserted) return;
			Main.font_inserted = true;
			var font = $.create("link", {
				rel: "stylesheet",
				type: "text/css",
				href: "//fonts.googleapis.com/css?family=Source+Sans+Pro:900"
			});
			$.add(d.head, font);
		},
		insert_menu_link: (function () {

			var menu_nodes = null;
			var on_observe = function (records) {
				var nodes, node, i, ii, j, jj;
				for (i = 0, ii = records.length; i < ii; ++i) {
					nodes = records[i].addedNodes;
					for (j = 0, jj = nodes.length; j < jj; ++j) {
						node = nodes[j];
						if (
							node.id === "menu" &&
							node.parentNode.parentNode.parentNode.parentNode.id === "header-bar"
						) {
							for (i = 0, ii = menu_nodes.length; i < ii; ++i) {
								$.add(node, menu_nodes[i]);
							}
							return;
						}
					}
				}
			};

			return function (menu_node) {
				menu_node.classList.add("entry");
				menu_node.style.order = 112;

				$.on(menu_node, "mouseover", function () {
					var entries = $$(".entry", this.parent),
						i, ii;
					for (i = 0, ii = entries.length; i < ii; ++i) {
						entries[i].classList.remove("focused");
					}
					this.classList.add("focused");
				});
				$.on(menu_node, "mouseout", function () {
					this.classList.remove("focused");
				});

				if (menu_nodes === null) {
					menu_nodes = [ menu_node ];
					new MutationObserver(on_observe).observe(d.body, {
						childList: true,
						subtree: true
					});
				}
				else {
					menu_nodes.append(menu_node);
				}
			};

		})(),
		insert_nav_link: function (mode, text, text_menu, class_name, on_click) {
			var mobile_top = true,
				append = true,
				exclude_mobile = false,
				navlinks, navlink, is_desktop, link_mod, n1, n2, i, ii;

			if (Config.mode === "4chan") {
				if (mode === "main") {
					navlinks = $$("#navtopright,#navbotright");
					exclude_mobile = true;
					append = false;

					if (Config.mode_ext.fourchanx3) {
						n2 = $.link("#HOMEPAGE#", {
							className: "hl-nav-link-menu" + class_name,
							textContent: text_menu
						});
						$.on(n2, "click", on_click);
						Main.insert_menu_link(n2);
					}
				}
				else {
					navlinks = $$(".navLinks");
				}
				is_desktop = function (node) { return !node.classList.contains("mobile"); };
				link_mod = function (text) { return text; };
			}
			else if (Config.mode === "foolz") {
				navlinks = $$(".letters");
				is_desktop = function () { return true; };
				link_mod = function (text) { return " " + text + " "; };
			}
			else if (Config.mode === "fuuka") {
				navlinks = [ $("div") ];
				if (navlinks[0] === null) return;
				is_desktop = function () { return true; };
				link_mod = function (text) { return " " + text + " "; };
			}
			else if (Config.mode === "tinyboard") {
				navlinks = $$(".boardlist");
				is_desktop = function () { return true; };
				link_mod = function (text) { return " " + text.toLowerCase() + " "; };
			}
			else {
				return;
			}

			for (i = 0, ii = navlinks.length; i < ii; ++i) {
				navlink = navlinks[i];
				if (is_desktop(navlink)) {
					// Desktop
					n2 = $.link("#HOMEPAGE#", {
						className: "hl-nav-link" + class_name,
						textContent: link_mod(text, true)
					});

					if (append) {
						if ((n1 = navlink.lastChild) !== null && n1.nodeType === Node.TEXT_NODE) {
							n1.nodeValue = n1.nodeValue.replace(/\]\s*$/, "]") + " [";
						}
						else {
							$.add(navlink, $.tnode(" ["));
						}

						$.add(navlink, n2);
						$.add(navlink, $.tnode("]"));
					}
					else {
						if ((n1 = navlink.firstChild) !== null && n1.nodeType === Node.TEXT_NODE) {
							n1.nodeValue = "] " + n1.nodeValue.replace(/^\s*\[/, "[");
						}
						else {
							$.add(navlink, $.tnode("] "));
						}

						$.prepend(navlink, n2);
						$.prepend(navlink, $.tnode("["));
					}
				}
				else if (!exclude_mobile) {
					// Mobile
					n1 = mobile_top ? navlink.previousSibling : navlink.nextSibling;
					if (n1 === null || !n1.classList || !n1.classList.contains("hl-nav-extras")) {
						n1 = $.create("div", {
							className: "mobile hl-nav-extras-mobile"
						});
					}

					$.add(n1, n2 = $.create("span", {
						className: "mobileib button hl-nav-button" + class_name
					}));
					$.add(n2, $.link(null, {
						className: "hl-nav-button-inner" + class_name,
						textContent: link_mod(text, false)
					}));
					if (mobile_top) {
						$.before(navlink, n1);
					}
					else {
						$.after(navlink, n1);
					}

					mobile_top = false;
				}
				else {
					continue;
				}

				$.on(n2, "click", on_click);
			}
		},
		ready: function () {
			Debug.timer("init");

			if (!Config.site()) return;
			Options.init();

			var updater, style;
			style = $.create("style", {
				textContent: "#STYLESHEET#"
			});
			$.add(d.head, style);

			Theme.prepare();
			EasyList.init();

			Debug.timer_log("init.ready duration", "init");

			Linkifier.parse_posts(Helper.Post.get_all_posts(d));
			Linkifier.check_incomplete();
			API.run_request_queue();

			if (MutationObserver !== null) {
				updater = new MutationObserver(Main.observer);
				updater.observe(d.body, { childList: true, subtree: true });
			}
			else {
				$.on(d.body, "DOMNodeInserted", Main.dom);
			}

			Debug.timer_log("init.ready.full duration", "init");
		},
		init: function () {
			var t = Debug.timer_log("init.pre duration", timing.start);
			Config.init();
			Debug.init();
			Cache.init();
			Debug.log(t[0], t[1]);
			Debug.timer_log("init duration", timing.start);
			$.ready(Main.ready);
		}
	};

	Main.init();
	Debug.timer_log("init.full duration", timing.start);

})();

