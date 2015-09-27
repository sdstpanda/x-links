/* jshint eqnull:true, noarg:true, noempty:true, eqeqeq:true, bitwise:false, strict:true, undef:true, curly:false, browser:true, devel:true, newcap:false, maxerr:50 */
(function () {
	"use strict";

	var timing, fetch, domains, options, conf, tempconf, pageconf, regex, img, cat, d, t, $, $$,
		Debug, UI, Cache, API, Database, Hash, SHA1, Sauce, Options, Config, Main,
		Helper, HttpRequest, Linkifier, Filter, Theme, EasyList;

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

	img = {};
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
		gehentai: "g.e-hentai.org"
	};
	fetch = {
		original: { value: "Original" },
		gehentai: { value: domains.gehentai },
		exhentai: { value: domains.exhentai }
	};
	options = {
		general: {
			'Automatic Processing':        ['checkbox', true,  'Get data and format links automatically.'],
			'Gallery Details':             ['checkbox', true,  'Show gallery details for link on hover.'],
			'Gallery Actions':             ['checkbox', true,  'Generate gallery actions for links.'],
			'Smart Links':                 ['checkbox', false, 'All links lead to E-Hentai unless they have fjording tags.'],
			'ExSauce':                     ['checkbox', true,  'Add ExSauce reverse image search to posts. Disabled in Opera.'],
			'Extended Info':               ['checkbox', true,  'Fetch additional gallery info, such as tag namespaces']
		},
		actions: {
			'Show by Default':             ['checkbox', false, 'Show gallery actions by default.'],
			'Hide in Quotes':              ['checkbox', true,  'Hide any open gallery actions in inline quotes.'],
			'Torrent Popup':               ['checkbox', true,  'Use the default pop-up window for torrents.'],
			'Archiver Popup':              ['checkbox', true,  'Use the default pop-up window for archiver.'],
			'Favorite Popup':              ['checkbox', true,  'Use the default pop-up window for favorites.']
			// 'Favorite Autosave':         ['checkbox', false, 'Autosave to favorites. Overrides normal behavior.']
		},
		// favorite: {
			// 'Favorite Category':           ['favorite', 0, 'The category to use.'],
			// 'Favorite Comment':            ['textbox', 'ExLinks is awesome', 'The comment to use.']
		// },
		sauce: {
			'Inline Results':              ['checkbox', true,  'Shows the results inlined rather than opening the site. Works with Smart Links.'],
			'Show Results by Default':     ['checkbox', true,  'Open the inline results by default.'],
			'Hide Results in Quotes':      ['checkbox', true,  'Hide open inline results in inline quotes.'],
			'Show Short Results':          ['checkbox', true,  'Show gallery names when hovering over the link after lookup (similar to old ExSauce).'],
			'Search Expunged':             ['checkbox', false, 'Search expunged galleries as well.'],
			'Lowercase on 4chan':          ['checkbox', true,  'Lowercase ExSauce label on 4chan.'],
			'No Underline on Sauce':       ['checkbox', false,  'Force the ExSauce label to have no underline.'],
			'Use Custom Label':            ['checkbox', false, 'Use a custom label instead of the site name (e-hentai/exhentai).'],
			'Custom Label Text':           ['textbox', 'ExSauce', 'The custom label.'],
			'Site to Use':                 ['saucedomain', fetch.exhentai, 'The domain to use for the reverse image search.']
		},
		domains: {
			'Gallery Link':                ['domain', fetch.original, 'The domain used for the actual link. Overriden by Smart Links.'],
			'Torrent Link':                ['domain', fetch.original, 'The domain used for the torrent link in Actions.'],
			'Hentai@Home Link':            ['domain', fetch.original, 'The domain used for the Hentai@Home link in Actions.'],
			'Archiver Link':               ['domain', fetch.original, 'The domain used for the Archiver link in Actions.'],
			'Uploader Link':               ['domain', fetch.original, 'The domain used for the Uploader link in Actions.'],
			'Favorite Link':               ['domain', fetch.original, 'The domain used for the Favorite link in Actions.'],
			'Stats Link':                  ['domain', fetch.original, 'The domain used for the Stats link in Actions.'],
			'Tag Links':                   ['domain', fetch.original, 'The domain used for tag links in Actions.']
		},
		debug: {
			'Debug Mode':                  ['checkbox', false, 'Enable debugger and logging to browser console.'],
			'Disable Local Storage Cache': ['checkbox', false, 'If set, Session Storage is used for caching instead.'],
			'Populate Database on Load':   ['checkbox', false, 'Load all cached galleries to database on page load.']
		},
		filter: {
			'Full Highlighting':           ['checkbox', false, 'Highlight all the text instead of just the matching portion.'],
			'Good Tag Marker':             ['textbox', '!', 'The string to mark a good [Ex]/[EH] tag with.'],
			'Bad Tag Marker':              ['textbox', '', 'The string to mark a bad [Ex]/[EH] tag with.'],
			'Name Filter': ['textarea', [
				'# Highlight all doujinshi and manga galleries with (C82) in the name:',
				'# /\\(C82\\)/i;only:doujinshi,manga;link-color:red;color:#FF0000'
			].join('\n'), ''],
			'Tag Filter': ['textarea', [
				'# Highlight "english" and "translated" tags in non-western non-non-h galleries:',
				'# /english|translated/;not:western,non-h;color:#4080f0;link-color:#4080f0;',
				'# Highlight galleries tagged with "touhou project":',
				'# /touhou project/;background:rgba(255,128,64,0.5);link-background:rgba(255,128,64,0.5);',
				'# Highlight all non-english language tags in doujinshi/manga/artistcg/gamecg galleries:',
				'# /korean|chinese|italian|vietnamese|thai|spanish|french|german|portuguese|russian|dutch|hungarian|indonesian|finnish|rewrite/;only:doujinshi,manga,artistcg,gamecg;underline:#FF0000;link-underline:#FF0000;'
			].join('\n'), ''],
			'Uploader Filter': ['textarea', [
				'# Highlight links for galleries uploaded by "ExUploader"',
				'# /ExUploader/i;color:#FFFFFF;link-color:#FFFFFF;',
				'# Don\'t highlight anything uploaded by "CGrascal"',
				'# /CGrascal/i;bad:yes'
			].join('\n'), '']
		}
	};
	regex = {
		url: /(https?:\/*)?(forums|gu|g|u)?\.?e[\-x]hentai\.org\/[^\ \n<>\'\"]*/i,
		protocol: /https?\:\/*/,
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
	tempconf = {};
	pageconf = {};

	// Inspired by 4chan X and jQuery API: https://api.jquery.com/ (functions are not chainable)
	$ = function (selector, root) {
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
		return obj;
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
		checked: {
			prepend: function (parent, child) {
				if (parent && child) return parent.insertBefore(child, parent.firstChild);
			},
			add: function (parent, child) {
				if (parent && child) return parent.appendChild(child);
			},
			before: function (root, elem) {
				if (root && elem) return root.parentNode.insertBefore(elem, root);
			},
			after: function (root, elem) {
				if (root && elem) return root.parentNode.insertBefore(elem, root.nextSibling);
			}
		}
	});
	Debug = {
		log: function () {},
		timer: function () {},
		timer_log: function (label, timer) {
			var t = timing(),
				value;

			if (typeof(timer) === "string") timer = Debug.timer.timer_names[timer];

			value = (timer === undefined) ? "???ms" : (t - timer).toFixed(3) + "ms";

			Debug.log(label, value);
		},
		init: function () {
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
				var args = [ "ExLinks " + Main.version + ":" ].concat(Array.prototype.slice.call(arguments));
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
		get_id_from_node: function (node) {
			return node.getAttribute("data-exlinks-gid") || "";
		},
		get_token_from_node: function (node) {
			return node.getAttribute("data-exlinks-token") || "";
		},
		get_page_from_node: function (node) {
			return node.getAttribute("data-exlinks-page") || "";
		},
		get_page_token_from_node: function (node) {
			return node.getAttribute("data-exlinks-page-token") || "";
		},
		get_type_from_node: function (node) {
			return node.getAttribute("data-exlinks-type") || "";
		},
		get_tag_button_from_link: function (node) {
			// Assume the button is the previous (or previous-previous) sibling
			if (
				(node = node.previousSibling) !== null &&
				(node.classList || ((node = node.previousSibling) !== null && node.classList)) &&
				node.classList.contains("ex-site-tag")
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
				node.classList.contains("ex-linkified-gallery")
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
				node.classList.contains("ex-actions")
			) {
				return node;
			}
			return null;
		},
		get_exresults_from_exsauce: function (node) {
			var container = Helper.Post.get_post_container(node);

			if (
				container !== null &&
				(node = $(".exlinks-exsauce-results", container)) !== null &&
				Helper.Post.get_post_container(node) === container
			) {
				return node;
			}
			return null;
		},
		get_url_info: function (url) {
			var m = /\/g\/(\d+)\/([0-9a-f]+)/.exec(url);
			if (m !== null) {
				return {
					type: "g",
					gid: parseInt(m[1], 10),
					token: m[2]
				};
			}

			m = /\/s\/([0-9a-f]+)\/(\d+)\-(\d+)/.exec(url);
			if (m !== null) {
				return {
					type: "s",
					gid: parseInt(m[2], 10),
					page: parseInt(m[3], 10),
					page_token: m[1]
				};
			}

			return null;
		},
		get_domain: function (url) {
			var m = /^https?:\/*([\w\-]+(?:\.[\w\-]+)*)/i.exec(url);
			return (m === null) ? "" : m[1];
		},
		Post: (function () {
			var specific, fns, post_selector, post_body_selector, post_parent_find, get_file_info,
				belongs_to, body_links, file_ext;

			specific = function (obj) {
				var m = Config.mode;
				return obj[Object.prototype.hasOwnProperty.call(obj, m) ? m : ""];
			};
			file_ext = function (url) {
				var i = url.indexOf("#"),
					m = /\.[^\.]*$/.exec(i < 0 ? url : url.substr(0, i));
				return (m === null) ? "" : m[0].toLowerCase();
			};

			post_selector = {
				"4chan": ".postContainer:not(.ex-fake-post)",
				"foolz": "article:not(.ex-fake-post)",
				"38chan": ".post:not(.ex-fake-post)"
			};
			post_body_selector = {
				"4chan": "blockquote",
				"foolz": ".text",
				"38chan": ".body"
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
				"38chan": function (node) {
					while ((node = node.parentNode) !== null) {
						if (node.classList.contains("post")) return node;
					}
					return null;
				}
				// "fuuka": function (node) {}
			};
			get_file_info = {
				"4chan": function (post) {
					var n = $(".file", post),
						ft, img, a1;

					if (n === null || !specific(belongs_to).call(null, n, post)) return null;

					ft = $(".fileText", n);
					img = $("img", n);
					a1 = $("a", n);

					if (ft === null || img === null || a1 === null) return null;

					return {
						image: img,
						image_link: img.parentNode,
						text_link: a1,
						options: ft,
						options_before: null,
						options_class: "",
						options_sep: " ",
						url: a1.href,
						type: file_ext(a1.href),
						md5: img.getAttribute("data-md5") || null
					};
				},
				"foolz": function (post) {
					var n = $(".thread_image_box", post),
						ft, img, a1;

					if (n === null || !specific(belongs_to).call(null, n, post)) return null;

					ft = $(".post_file_controls", post);
					img = $("img", n);
					a1 = $(".post_file_filename", post);

					if (ft === null || img === null || a1 === null) return null;

					return {
						image: img,
						image_link: img.parentNode,
						text_link: a1,
						options: ft,
						options_before: $("a[download]", ft),
						options_class: "btnr parent",
						options_sep: "",
						url: a1.href,
						type: file_ext(a1.href),
						md5: img.getAttribute("data-md5") || null
					};
				},
				"38chan": function (post) {
					var img = $("img", post),
						ft, a1, n;

					if (img === null || !specific(belongs_to).call(null, img, post) || img.parentNode.tagName !== "A") return null;

					n = $(".fileinfo", post);
					if (n === null) return null;

					ft = $(".unimportant", n);
					a1 = $("a", n);

					if (ft === null || a1 === null) return null;

					return {
						image: img,
						image_link: img.parentNode,
						text_link: a1,
						options: ft,
						options_before: null,
						options_class: "",
						options_sep: " ",
						url: a1.href,
						type: file_ext(a1.href),
						md5: null
					};
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
				"38chan": "a:not([onclick])"
			};

			fns = {
				get_post_container: function (node) {
					return specific(post_parent_find).call(null, node);
				},
				get_text_body: function (node) {
					var selector = specific(post_body_selector);
					return selector ? $(selector, node) : null;
				},
				is_post: function (node) {
					return $.test(node, specific(post_selector));
				},
				get_all_posts: function (parent) {
					var selector = specific(post_selector);
					return selector ? $$(selector, parent) : [];
				},
				get_file_info: function (post) {
					return specific(get_file_info).call(null, post);
				},
				get_body_links: function (post) {
					var selector = specific(body_links);
					return selector ? $$(selector, post) : [];
				}
			};

			return fns;
		})()
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
			actions: function (data, data_alt) { return '#ACTIONS#'; },
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
					str += '<div class="exlinks-star exlinks-star-' + (i + 1) + ' exlinks-star-' + star + '"></div>';
				}
				return str;
			}
		},
		details: function (uid, domain) {
			var data = Database.get(uid),
				data_alt = {},
				frag, tagspace, content, n;

			if (data === null) return $.create("div"); // dummy

			data_alt.jtitle = data.title_jpn ? ('<br /><span class="ex-details-title-jp">' + data.title_jpn + '</span>') : '';

			data_alt.size = Math.round((data.filesize / 1024 / 1024) * 100) / 100;
			data_alt.datetext = UI.date(new Date(parseInt(data.posted, 10) * 1000));
			data_alt.visible = data.expunged ? 'No' : 'Yes';

			frag = $.frag(UI.html.details(data, data_alt));

			if ((n = $('.ex-details-title', frag)) !== null) {
				Filter.highlight("title", n, data, null);
			}
			if ((n = $('.ex-details-uploader', frag)) !== null) {
				Filter.highlight("uploader", n, data, null);
			}

			content = frag.firstChild;
			tagspace = $('.ex-details-tags', frag);
			content.style.setProperty("display", "table", "important");
			$.add(tagspace, UI.create_tags(domain, data.tags, data));
			n = frag.firstChild;
			Main.hovering(n);

			// Full info
			if (conf['Extended Info']) {
				API.request_full_info(data.gid, data.token, domain, function (err) {
					if (err === null) {
						UI.display_full(data);
					}
					else {
						Debug.log("Error requesting full information: " + err);
					}
				});
			}

			// Fonts
			Main.insert_custom_fonts();

			// Done
			return n;
		},
		actions: function (data, link) {
			var data_alt = {},
				tagstring = data.tags.join(','),
				uid = data.gid,
				token = data.token,
				key = data.archiver_key,
				domain, user, sites, button, frag, n;

			if (conf['Smart Links'] === true) {
				if (regex.fjord.test(tagstring)) {
					if (regex.site_gehentai.test(link.href)) {
						link.href = link.href.replace(regex.site_gehentai, domains.exhentai);
						if ((button = Helper.get_tag_button_from_link(link)) !== null) {
							button.href = link.href;
							button.textContent = UI.button.text(link.href);
						}
					}
				}
				else {
					if (regex.site_exhentai.test(link.href)) {
						link.href = link.href.replace(regex.site_exhentai, domains.gehentai);
						if ((button = Helper.get_tag_button_from_link(link)) !== null) {
							button.href = link.href;
							button.textContent = UI.button.text(link.href);
						}
					}
				}
			}

			data_alt.datetext = UI.date(new Date(parseInt(data.posted, 10) * 1000));
			domain = Helper.get_domain(link.href);
			sites = [
				Config.domain(domain, conf['Torrent Link']),
				Config.domain(domain, conf['Hentai@Home Link']),
				Config.domain(domain, conf['Archiver Link']),
				Config.domain(domain, conf['Favorite Link']),
				Config.domain(domain, conf['Uploader Link']),
				Config.domain(domain, conf['Stats Link']),
				Config.domain(domain, conf['Tag Links'])
			];
			user = data.uploader || 'Unknown';
			data_alt.url = {
				ge: "http://" + domains.gehentai + "/g/" + uid + "/" + token + "/",
				ex: "http://" + domains.exhentai + "/g/" + uid + "/" + token + "/",
				bt: "http://" + sites[0] + "/gallerytorrents.php?gid=" + uid + "&t=" + token,
				hh: "http://" + sites[1] + "/hathdler.php?gid=" + uid + "&t=" + token,
				arc: "http://" + sites[2] + "/archiver.php?gid=" + uid + "&token=" + token + "&or=" + key,
				fav: "http://" + sites[3] + "/gallerypopups.php?gid=" + uid + "&t=" + token + "&act=addfav",
				user: "http://" + sites[4] + "/uploader/" + user.replace(/\ /g, '+'),
				stats: "http://" + sites[5] + "/stats.php?gid=" + uid + "&t=" + token
			};
			if (regex.site_gehentai.test(data_alt.url.arc) && regex.fjord.test(tagstring)) {
				data_alt.url.arc = data_alt.url.arc.replace(regex.site_gehentai, 'exhentai');
			}

			frag = $.frag(UI.html.actions(data, data_alt));

			if ((n = $('.ex-actions-link-uploader', frag)) !== null) {
				Filter.highlight("uploader", n, data, null);
			}

			frag.firstChild.style.setProperty("display", conf['Show by Default'] ? "table" : "none", "important");
			$.add($(".ex-actions-tags", frag), UI.create_tags(sites[6], data.tags, data));

			return frag.firstChild;
		},
		button: function (url) {
			var button = $.link(url, {
				className: 'ex-link-events ex-site-tag',
				textContent: UI.button.text(url)
			});
			button.setAttribute("data-ex-link-events", "gallery_fetch");
			return button;
		},
		toggle: function (event) {
			if (!event.which || event.which === 1) {
				var actions = Helper.get_actions_from_link(this, true);
				if (actions !== null) {
					actions.style.display = (actions.style.display === "none") ? "table" : "none";
				}
				event.preventDefault();
			}
		},
		events: {
			mouseover: function () {
				var uid = Helper.get_id_from_node(this),
					details, domain;

				if (uid === null) return;
				details = $.id('exblock-details-uid-' + uid);
				if (details === null) {
					domain = Helper.get_domain(this.href);
					details = UI.details(uid, domain);
				}

				details.style.display = "table";
			},
			mouseout: function () {
				var uid = Helper.get_id_from_node(this),
					details, domain;

				if (uid === null) return;
				details = $.id('exblock-details-uid-' + uid);
				if (details === null) {
					domain = Helper.get_domain(this.href);
					details = UI.details(uid, domain);
				}

				details.style.display = "none";
			},
			mousemove: function (e) {
				var uid = Helper.get_id_from_node(this),
					details;

				if (uid === null) return;
				details = $.id('exblock-details-uid-' + uid);

				if (details) {
					if (details.offsetWidth + e.clientX + 20 < window.innerWidth - 8) {
						details.style.left = (e.clientX + 12) + 'px';
					}
					else {
						details.style.left = (window.innerWidth - details.offsetWidth - 16) + 'px';
					}
					if (details.offsetHeight + e.clientY + 22 > window.innerHeight) {
						details.style.top = (e.clientY - details.offsetHeight - 8) + 'px';
					}
					else {
						details.style.top = (e.clientY + 22) + 'px';
					}
				}
			},
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
		init: function () {
			$.extend(UI.button, {
				text: function (url) {
					if (regex.site_exhentai.test(url)) return '[Ex]';
					if (regex.site_gehentai.test(url)) return '[EH]';
					return '[?]';
				}
			});
		},
		create_tags: function (site, tags, data) {
			var tagfrag = d.createDocumentFragment(),
				tag, link, i, ii;
			for (i = 0, ii = tags.length; i < ii; ++i) {
				tag = $.create("span", {
					className: "ex-tag-block"
				});
				link = $.link("http://" + site + "/tag/" + tags[i].replace(/\ /g, "+"), {
					textContent: tags[i],
					className: "ex-tag"
				});

				Filter.highlight("tags", link, data, null);

				$.add(tag, link);
				if (i < ii - 1) $.add(tag, $.tnode(","));
				$.add(tagfrag, tag);
			}
			return tagfrag;
		},
		display_full: function (data) {
			var tagfrag = d.createDocumentFragment(),
				url_base = "http://" + domains.exhentai,
				theme = Theme.get(),
				nodes, namespace, namespace_style, tags, tag, link, site, i, j, n, t, ii;

			nodes = $$(
				".ex-actions-tags.exlinks-gid[data-exlinks-gid='" + data.gid + "']," +
				".ex-details-tags.exlinks-gid[data-exlinks-gid='" + data.gid + "']"
			);

			if (nodes.length === 0 || Object.keys(data.full.tags).length === 0) return;

			for (namespace in data.full.tags) {
				tags = data.full.tags[namespace];
				namespace_style = " ex-tag-namespace-" + namespace.replace(/\ /g, "-");

				tag = $.create("span", {
					className: "ex-tag-namespace-block" + theme + namespace_style
				});
				link = $.create("span", {
					textContent: namespace,
					className: "ex-tag-namespace"
				});
				$.add(tag, link);
				$.add(tag, $.tnode(":"));
				$.add(tagfrag, tag);

				for (i = 0, ii = tags.length; i < ii; ++i) {
					tag = $.create("span", { className: "ex-tag-block" + namespace_style });
					link = $.link(url_base + "/tag/" + tags[i].replace(/\ /g, "+"), {
						textContent: tags[i],
						className: "ex-tag"
					});

					Filter.highlight("tags", link, data, null);

					$.add(tag, link);
					$.add(tag, $.tnode(i === ii - 1 ? ";" : ","));
					$.add(tagfrag, tag);
				}
			}
			$.remove(tagfrag.lastChild.lastChild);

			for (i = 0; i < nodes.length; ) {
				n = nodes[i];
				t = tagfrag;
				++i;

				if (
					(link = $("a[href]", n)) !== null &&
					!regex.site_exhentai.test(link.getAttribute("href"))
				) {
					site = Config.domain(Helper.get_domain(link.href), conf['Stats Link']);
					t = (i < nodes.length) ? tagfrag.cloneNode(true) : tagfrag;
					tags = $$("a[href]", t);
					for (j = 0; j < tags.length; ++j) {
						tags[j].setAttribute("href", tags[j].getAttribute("href").replace(regex.site_exhentai, site));
					}
				}
				else if (i < nodes.length) {
					t = tagfrag.cloneNode(true);
				}

				n.innerHTML = "";
				$.add(n, t);
			}
		}
	};
	API = {
		s: {},
		so: {},
		g: {},
		go: {},
		cooldown: 0,
		working: false,
		full_timer: null,
		full_queue: [],
		full_version: 1,
		queue: function (type) {
			if (type === 's') {
				for (var k in API.g) {
					if (API.s[k]) {
						delete API.s[k];
					}
				}
				return Object.keys(API.s).length;
			}
			else if (type === 'g') {
				return Object.keys(API.g).length;
			}
			return 0;
		},
		request: function (type) {
			var limit = 0,
				request = null,
				j, k;

			if (type === 's') {
				request = {
					"method": "gtoken",
					"pagelist": []
				};
				for (j in API.s) {
					if (limit < 25) {
						request.pagelist.push([
							parseInt(j, 10),
							API.s[j][0],
							parseInt(API.s[j][1], 10)
						]);
						++limit;
					}
					else {
						API.queue.add('so', j, API.s[j][0], API.s[j][1]);
					}
				}
			}
			else if (type === 'g') {
				request = {
					"method": "gdata",
					"gidlist": []
				};
				for (k in API.g) {
					if (limit < 25) {
						request.gidlist.push([
							parseInt(k, 10),
							API.g[k]
						]);
						++limit;
					}
					else {
						API.queue.add('go', k, API.g[k]);
					}
				}
			}
			if (request !== null) {
				if (!API.working && Date.now() > API.cooldown) {
					API.working = true;
					API.cooldown = Date.now();
					Debug.timer("apirequest");
					Debug.log("API request", request);
					HttpRequest({
						method: 'POST',
						url: 'http://' + domains.gehentai + '/api.php',
						data: JSON.stringify(request),
						headers: {
							'Content-Type': 'application/json'
						},
						onload: function (xhr) {
							var json = null;
							if (xhr.readyState === 4 && xhr.status === 200) {
								json = Helper.json_parse_safe(xhr.responseText) || {};

								if (Object.keys(json).length > 0) {
									Debug.log('API response; time=' + Debug.timer("apirequest"), json);
									API.response(type, json);
								}
								else {
									Debug.log('API request error; waiiting five seconds before trying again. (time=' + Debug.timer("apirequest") + ')', xhr);
									// API.cooldown = Date.now() + (5 * t.SECOND);
									setTimeout(Main.update, 5000);
								}
							}
						}
					});
				}
			}
		},
		response: function (type, json) {
			var arr, i, ii;
			if (type === 's') {
				arr = json.tokenlist;
				for (i = 0, ii = arr.length; i < ii; ++i) {
					API.queue.add('g', arr[i].gid, arr[i].token);
				}
				API.queue.clear('s');
				if (Object.keys(API.so).length > 0) {
					API.s = API.so;
					API.queue.clear('so');
				}
				API.working = false;
			}
			else if (type === 'g') {
				arr = json.gmetadata;
				for (i = 0, ii = arr.length; i < ii; ++i) {
					Database.set(arr[i]);
					Main.queue.push(arr[i].gid);
				}
				API.queue.clear('g');
				if (Object.keys(API.go).length > 0) {
					API.g = API.go;
					API.queue.clear('go');
				}
				API.working = false;
			}
			Main.update();
		},
		init: function () {
			$.extend(API.queue, {
				add: function (type, uid, token, page) {
					if (type === 's') {
						API.s[uid] = [ token, page ];
					}
					else if (type === 'so') {
						API.so[uid] = [ token, page ];
					}
					else if (type === 'g') {
						API.g[uid] = token;
					}
					else if (type === 'go') {
						API.go[uid] = token;
					}
				},
				clear: function (type) {
					API[type] = {};
				}
			});
		},
		request_full_info: function (id, token, site, cb) {
			if (Database.check(id)) {
				var data = Database.get(id);
				if (data !== null && API.data_has_full(data)) {
					cb(null, data);
					return;
				}
			}
			if (API.full_timer === null) {
				API.execute_full_request(id, token, site, cb);
			}
			else {
				API.full_queue.push([ id, token, site, cb ]);
			}
		},
		on_request_full_next: function () {
			API.full_timer = null;
			if (API.full_queue.length > 0) {
				var d = API.full_queue.shift();
				API.execute_full_request(d[0], d[1], d[2], d[3]);
			}
		},
		execute_full_request: function (id, token, site, cb) {
			var callback = function (err, full_data) {
				API.full_timer = setTimeout(API.on_request_full_next, 200);

				var data = Database.get(id);
				if (data !== null) {
					data.full = full_data;
					Database.set(data);
				}
				else {
					err = "Could not update data";
					data = null;
				}

				cb(err, data);
			};

			HttpRequest({
				method: "GET",
				url: "http://" + site + "/g/" + id + "/" + token + "/",
				onload: function (xhr) {
					if (xhr.readyState === 4) {
						if (xhr.status === 200) {
							var html = Helper.html_parse_safe(xhr.responseText, null);
							if (html === null) {
								callback("Error parsing html", null);
							}
							else {
								html = API.parse_full_info(html);
								if (html === null) {
									callback("Error parsing info", null);
								}
								else {
									callback(null, html);
								}
							}
						}
						else {
							callback("Bad status " + xhr.status, null);
						}
					}
				},
				onerror: function () {
					callback("Connection error", null);
				},
				onabort: function () {
					callback("Connection aborted", null);
				}
			});
		},
		parse_full_info: function (html) {
			var data = {
				version: API.full_version,
				tags: {}
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
					if (!(namespace in data.tags)) {
						ns = [];
						data.tags[namespace] = ns;
					}
					else {
						ns = data.tags[namespace];
					}

					// Tags
					tds = $$("div", tds[tds.length - 1]);
					for (j = 0; j < tds.length; ++j) {
						// Create tag
						if ((n = $("a", tds[j])) !== null) {
							// Add tag
							data.tags[namespace].push(n.textContent.trim());
						}
					}
				}
			}

			return data;
		},
		data_has_full: function (data) {
			return data.full && data.full.version >= API.full_version;
		}
	};
	Cache = {
		type: null,
		init: function () {
			var res = [],
				key, json, i, ii;

			Cache.type = conf['Disable Local Storage Cache'] ? sessionStorage : localStorage;

			for (i = 0, ii = Cache.type.length; i < ii; ++i) {
				key = Cache.type.key(i);
				if (new RegExp("^" + Helper.regex_escape(Main.namespace) + "(gallery|md5|sha1)").test(key)) {
					json = Helper.json_parse_safe(Cache.type.getItem(key));
					if (!(json && typeof(json) === "object" && Date.now() <= json.added + json.TTL)) {
						res.push(key);
					}
				}
			}
			ii = res.length;
			if (ii > 0) {
				for (i = 0; i < ii; ++i) {
					Cache.type.removeItem(res[i]);
				}
				Debug.log("Purged " + ii + " old entries from cache");
			}
		},
		get: function (uid, type) {
			var key = Main.namespace + (type || "gallery") + "-" + uid,
				json = Helper.json_parse_safe(Cache.type.getItem(key));

			if (json && typeof(json) === "object" && Date.now() <= json.added + json.TTL) {
				return json.data;
			}

			Cache.type.removeItem(key);
			return false;
		},
		set: function (data, type, hash, ttl) {
			var key, keyid, TTL, limit, date, value;
			if (!type) {
				type = 'gallery';
				keyid = data.gid;
				limit = Date.now() - (12 * t.HOUR);
				date = new Date(parseInt(data.posted, 10) * 1000);
				if (date > limit) {
					TTL = date - limit;
				}
				else {
					TTL = 12 * t.HOUR;
				}
			}
			else {
				keyid = hash;
				TTL = ttl;
			}
			key = Main.namespace + type + '-' + keyid;
			value = {
				"added": Date.now(),
				"TTL": TTL,
				"data": data
			};
			Cache.type.setItem(key, JSON.stringify(value));
		},
		load: function () {
			var re_matcher = new RegExp("^" + Helper.regex_escape(Main.namespace) + "gallery"),
				key, data, i, ii;

			for (i = 0, ii = Cache.type.length; i < ii; ++i) {
				key = Cache.type.key(i);
				if (re_matcher.test(key)) {
					data = Cache.get(/\d+/.exec(key));
					if (data) Database.set(data);
				}
			}
		},
		clear: function () {
			var re_matcher = new RegExp("^" + Helper.regex_escape(Main.namespace) + "(gallery|md5|sha1)"),
				types = [ window.localStorage, window.sessionStorage ],
				results = [],
				remove, type, key, i, ii, j, jj;

			for (i = 0, ii = types.length; i < ii; ++i) {
				type = types[i];
				remove = [];

				for (j = 0, jj = type.length; j < jj; ++j) {
					key = type.key(j);
					if (re_matcher.test(key)) {
						remove.push(key);
					}
				}

				for (j = 0, jj = remove.length; j < jj; ++j) {
					type.removeItem(remove[j]);
				}

				results.push(jj);
			}

			return results;
		}
	};
	Database = {
		data: {},
		check: function (uid) {
			var data = Database.get(uid);
			return data ? data.token : null;
		},
		get: function (uid) { // , debug
			// Use this if you want to break database gets randomly for debugging
			// if (arguments[1] === true && Math.random() > 0.8) return false;
			var data = Database.data[uid];
			if (data) return data;

			data = Cache.get(uid);
			if (data) {
				Database.data[data.gid] = data;
				return data;
			}

			return null;
		},
		set: function (data) {
			Database.data[data.gid] = data;
			Cache.set(data);
		},
		init: function () {
			if (conf['Populate Database on Load'] === true) {
				Cache.load();
			}
		}
	};
	Hash = {
		md5: {},
		sha1: {},
		get: function (hash, type) {
			var result;
			if (Hash[type][hash]) {
				return Hash[type][hash];
			}
			else {
				result = Cache.get(hash, type);
				if (result) {
					Hash[type][hash] = result;
					return result;
				}
				return false;
			}
		},
		set: function (data, type, hash) {
			var ttl = (type === 'md5') ? 365 * t.DAY : 12 * t.HOUR;
			Cache.set(data, type, hash, ttl);
		}
	};
	SHA1 = {
		// SHA-1 JS implementation originally created by Chris Verness; http://movable-type.co.uk/scripts/sha1.html
		data: function (image) {
			var string = '',
				i, ii;
			for (i = 0, ii = image.length; i < ii; ++i) {
					string += String.fromCharCode(image[i].charCodeAt(0) & 0xff);
			}
			return string;
		},
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
				a, b, c, d, e, i, j, l, s, msg;

			K = [ 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xCA62C1D6 ];
			msg = SHA1.data(image) + String.fromCharCode(0x80);

			l = msg.length / 4 + 2;
			N = Math.ceil(l / 16);
			M = [];

			for (i = 0; i < N; ++i) {
				M[i] = [];
				for (j = 0; j < 16; ++j) {
					M[i][j] = (msg.charCodeAt(i * 64 + j * 4) << 24) |
						(msg.charCodeAt(i * 64 + j * 4 + 1) << 16) |
						(msg.charCodeAt(i * 64 + j * 4 + 2) << 8) |
						(msg.charCodeAt(i * 64 + j * 4 + 3));
				}
			}

			M[N - 1][14] = Math.floor(((msg.length - 1) * 8) / Math.pow(2, 32));
			M[N - 1][15] = ((msg.length - 1) * 8) & 0xffffffff;

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
		UI: {
			events: {
				click: function (event) {
					event.preventDefault();

					var sha1 = this.getAttribute("data-sha1"),
						results = Helper.get_exresults_from_exsauce(this),
						hover;

					if (results !== null) {
						hover = $.id("exlinks-exsauce-hover-" + sha1);

						if (results.style.display === "table") {
							results.style.display = "none";

							if (conf['Show Short Results']) {
								if (hover === null) hover = Sauce.UI.hover(sha1);
								hover.style.setProperty("display", "table", "important");
								Sauce.UI.events.mousemove.call(this, event);
							}
						}
						else {
							results.style.display = "table";

							if (hover !== null) {
								hover.style.setProperty("display", "none", "important");
							}
						}
					}
				},
				mouseover: function () {
					if (conf['Show Short Results']) {
						var sha1 = this.getAttribute("data-sha1"),
							results = Helper.get_exresults_from_exsauce(this),
							hover;

						if (results === null || results.style.display === "none") {
							hover = $.id("exlinks-exsauce-hover-" + sha1);
							if (hover === null) hover = Sauce.UI.hover(sha1);
							hover.style.setProperty("display", "table", "important");
						}
					}
				},
				mouseout: function () {
					if (conf['Show Short Results']) {
						var sha1 = this.getAttribute("data-sha1"),
							hover = $.id("exlinks-exsauce-hover-" + sha1);

						if (hover !== null) {
							hover.style.setProperty("display", "none", "important");
						}
					}
				},
				mousemove: function (event) {
					if (conf['Show Short Results']) {
						var sha1 = this.getAttribute("data-sha1"),
							hover = $.id("exlinks-exsauce-hover-" + sha1);

						if (hover === null || hover.style.display === "none") return;
						hover.style.left = (event.clientX + 12) + 'px';
						hover.style.top = (event.clientY + 22) + 'px';
					}
				}
			},
			hover: function (sha1) {
				var result = Hash.get(sha1, 'sha1'),
					hover, i, ii;

				hover = $.create('div', {
					className: 'exlinks-exsauce-hover post reply post_wrapper ex-fake-post',
					id: 'exlinks-exsauce-hover-' + sha1
				});
				hover.setAttribute("data-sha1", sha1);

				if ((ii = result.length) > 0) {
					i = 0;
					while (true) {
						$.add(hover, $.link(result[i][0], {
							className: "exlinks-exsauce-hover-link",
							textContent: result[i][1]
						}));
						if (++i >= ii) break;
						$.add(hover, $.create("br"));
					}
				}
				hover.style.setProperty("display", "table", "important");
				Main.hovering(hover);

				return hover;
			}
		},
		format: function (a, result) {
			var count = result.length,
				results, link, n, i, ii;

			a.classList.add('exlinks-exsauce-link-valid');
			a.textContent = Sauce.text('Found: ' + count);

			if (count > 0) {
				if (conf['Inline Results'] === true) {
					results = $.create('div', {
						className: 'exlinks-exsauce-results'
					});
					$.add(results, $.create("strong", { textContent: "Reverse Image Search Results" }));
					$.add(results, $.create("span", { className: "exlinks-exsauce-results-sep", textContent: "|" }));
					$.add(results, $.create("span", { className: "exlinks-exsauce-results-label", textContent: "View on:" }));
					$.add(results, $.link(a.href, {
						className: "exlinks-exsauce-results-link",
						textContent: Sauce.label(true)
					}));
					$.add(results, $.create("br"));
					results.style.setProperty("display", conf['Show Results by Default'] ? "table" : "none", "important");
					for (i = 0, ii = result.length; i < ii; ++i) {
						link = Linkifier.create_link(result[i][0]);
						$.add(results, link);
						Linkifier.preprocess_link(link);
						if (i < ii - 1) $.add(results, $.create("br"));
					}

					if (
						(n = Helper.Post.get_post_container(a)) !== null &&
						(n = Helper.Post.get_text_body(n)) !== null
					) {
						$.before(n, results);
						Main.update();
					}
				}
				Linkifier.change_link_events(a, "exsauce_toggle");
			}
			Debug.log('Formatting complete');
		},
		lookup: function (a, sha1) {
			a.textContent = Sauce.text('Checking');

			HttpRequest({
				method: "GET",
				url: a.href,
				onload: function (xhr) {
					var result = [],
						html = Helper.html_parse_safe(xhr.responseText, null),
						links, link, i, ii;

					if (html !== null) {
						links = $$('div.it5 a,div.id2 a', html);

						for (i = 0, ii = links.length; i < ii; ++i) {
							link = links[i];
							result.push([ link.href, link.textContent ]);
						}

						Hash.set(result, 'sha1', sha1);
						Debug.log('Lookup successful; formatting...');
						if (conf['Show Short Results']) Sauce.UI.hover(sha1);
						Sauce.format(a, result);
					}
				}
			});
		},
		hash: function (a, md5) {
			Debug.log('Fetching image ' + a.href);
			a.textContent = Sauce.text('Loading');
			HttpRequest({
				method: "GET",
				url: a.href,
				overrideMimeType: "text/plain; charset=x-user-defined",
				headers: { "Content-Type": "image/jpeg" },
				onload: function (xhr) {
					var sha1 = SHA1.hash(xhr.responseText);
					a.textContent = Sauce.text('Hashing');
					a.setAttribute('data-sha1', sha1);
					Hash.set(sha1, 'md5', md5);
					Debug.log('SHA-1 hash for image: ' + sha1);
					Sauce.check(a);
				}
			});
		},
		check: function (a) {
			var md5, sha1, result;
			if (a.hasAttribute('data-sha1')) {
				sha1 = a.getAttribute('data-sha1');
			}
			else {
				md5 = a.getAttribute('data-md5');
				sha1 = Hash.get(md5, 'md5');
			}
			if (sha1) {
				Debug.log('SHA-1 hash found');
				a.setAttribute('data-sha1', sha1);
				a.href = 'http://' + conf['Site to Use'].value + '/?f_doujinshi=1&f_manga=1&f_artistcg=1&f_gamecg=1&f_western=1&f_non-h=1&f_imageset=1&f_cosplay=1&f_asianporn=1&f_misc=1&f_search=Search+Keywords&f_apply=Apply+Filter&f_shash=' + sha1 + '&fs_similar=0';
				if (conf['Search Expunged'] === true) a.href += '&fs_exp=1';
				a.target = "_blank";
				a.rel = "noreferrer";
				result = Hash.get(sha1, 'sha1');
				if (result) {
					Debug.log('Cached result found; formatting...');
					Sauce.format(a, result);
				}
				else {
					Debug.log('No cached result found; performing a lookup...');
					Sauce.lookup(a, sha1);
				}
			}
			else {
				Debug.log('No SHA-1 hash found; fetching image...');
				Sauce.hash(a, md5);
			}
		},
		fetch: function (event) {
			event.preventDefault();
			$.off(this, "click", Sauce.fetch);
			Sauce.check(this);
		},
		label: function (siteonly) {
			var label = (conf['Site to Use'].value === domains.exhentai) ? 'ExHentai' : 'E-Hentai';

			if (!siteonly) {
				if (conf['Use Custom Label'] === true) {
					label = conf['Custom Label Text'];
				}
			}
			if (Config.mode === '4chan') {
				if (conf['Lowercase on 4chan'] === true) {
					label = label.toLowerCase();
				}
			}
			return label;
		},
		text: function (text) {
			return (Config.mode === '4chan' && conf['Lowercase on 4chan']) ? text.toLowerCase() : text;
		}
	};
	Linkifier = {
		event_queue: {
			format: []
		},
		event_listeners: {
			format: []
		},
		link_events: {
			exsauce_fetch: Sauce.fetch,
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
		get_links: function (parent) {
			return $$("a.ex-linkified-gallery[href]", parent);
		},
		get_links_formatted: function (parent) {
			return $$("a.ex-linkified-gallery[data-ex-linkified-status=formatted]", parent);
		},
		get_links_unformatted: function (gid, parent) {
			var selector = "a.ex-linkified-gallery.exlinks-gid";
			if (gid !== null) {
				selector += "[data-exlinks-gid='";
				selector += gid;
				selector += "']";
			}
			selector += "[data-ex-linkified-status=processed]";
			return $$(selector, parent);
		},
		linkify: function (container, results) {
			var ws = /^\s*$/,
				nodes = $.textnodes(container),
				node, text, match, linknode, sp, ml, tn, tl, tu, wbr, i, ii;

			if (nodes.length > 0) {
				for (i = 0, ii = nodes.length; i < ii; ++i) {
					node = nodes[i];
					if (regex.url.test(node.textContent)) {
						wbr = i;
						while (nodes[wbr] && nodes[wbr].nextSibling && nodes[wbr].nextSibling.tagName === "WBR") {
							nodes[wbr].parentNode.removeChild(nodes[wbr].nextSibling);
							++wbr;
							if (nodes[wbr]) {
								node.textContent += nodes[wbr].textContent;
								nodes[wbr].textContent = "";
							}
						}
					}
					text = node.textContent;
					match = regex.url.exec(text);
					tl = "";
					linknode = match ? [] : null;
					while (match) {
						sp = text.search(regex.url);
						ml = match[0].length - 1;
						tn = $.tnode(text.substr(0, sp));
						tl = text.substr(sp + ml + 1, text.length);

						tu = Linkifier.create_link((regex.protocol.test(match[0]) ? "" : "http://") + match[0]);
						results.push(tu);

						if (tn.length > 0 && !ws.test(tn.nodeValue)) {
							linknode.push(tn);
						}
						linknode.push(tu);

						text = tl;
						match = regex.url.exec(text);
					}
					if (tl.length > 0) {
						linknode.push($.tnode(tl));
					}
					if (linknode) {
						$.replace(node, $.elem(linknode));
					}
				}
			}
		},
		create_link: function (text) {
			return $.link(text, {
				className: "ex-linkified",
				textContent: text
			});
		},
		preprocess_link: function (node) {
			var site = conf['Gallery Link'].value,
				site_re = new RegExp(Helper.regex_escape(site)),
				info, button;

			if (site !== "Original") {
				site_re = new RegExp(Helper.regex_escape(site));
				if (!site_re.test(node.href)) {
					node.href = node.href.replace(regex.site, site.value);
				}
			}

			info = Helper.get_url_info(node.href);
			if (info === null) {
				node.classList.remove('ex-linkified-gallery');
				node.removeAttribute("data-ex-linkified-status");
			}
			else {
				node.classList.add("ex-linkified");
				node.classList.add("ex-link-events");
				node.classList.add("ex-linkified-gallery");
				node.setAttribute("data-ex-linkified-status", "unprocessed");
				node.setAttribute("data-ex-link-events", "gallery_link");

				if (info.type === "s") {
					node.setAttribute("data-exlinks-type", info.type);
					node.setAttribute("data-exlinks-gid", info.gid);
					node.setAttribute("data-exlinks-page", info.page);
					node.setAttribute("data-exlinks-page-token", info.page_token);
					node.classList.add("exlinks-type");
					node.classList.add("exlinks-gid");
					node.classList.add("exlinks-page");
					node.classList.add("exlinks-page-token");
				}
				else if (info.type === "g") {
					node.setAttribute("data-exlinks-type", info.type);
					node.setAttribute("data-exlinks-gid", info.gid);
					node.setAttribute("data-exlinks-token", info.token);
					node.classList.add("exlinks-type");
					node.classList.add("exlinks-gid");
					node.classList.add("exlinks-token");
				}

				node.setAttribute("data-ex-linkified-status", "processed");

				button = UI.button(node.href);
				$.before(node, button);

				if (conf['Automatic Processing'] === true) {
					Linkifier.check_link(node);
				}
			}
		},
		format: function (links, data) {
			var has_data = !!data,
				events = (Linkifier.event_listeners.format.length > 0) ? Linkifier.event_queue.format : null,
				error, link, gid, i, ii;

			if (has_data) {
				error = Object.prototype.hasOwnProperty.call(data, "error");
			}

			for (i = 0, ii = links.length; i < ii; ++i) {
				link = links[i];

				if (!has_data) {
					gid = Helper.get_id_from_node(link);
					data = Database.get(gid);
					if (data === null) continue;
					error = Object.prototype.hasOwnProperty.call(data, "error");
				}

				if (error) {
					Linkifier.format_link_error(link);
				}
				else {
					Linkifier.format_link(link, data);
				}

				if (events !== null) events.push(link);
			}

			if (!has_data && events !== null) {
				Linkifier.trigger("format");
			}
		},
		format_link: function (link, data) {
			var button, actions, hl, c;

			// Link title
			link.textContent = Helper.normalize_api_string(data.title);
			link.setAttribute("data-ex-linkified-status", "formatted");

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
		format_link_error: function (link) {
			var button = Helper.get_tag_button_from_link(link);
			if (button !== null) {
				Linkifier.change_link_events(button, "gallery_error");
			}

			link.textContent = "Incorrect Gallery Key";
			link.setAttribute("data-ex-linkified-status", "formatted_error");
		},
		apply_link_events: function (node, check_children) {
			var nodes = check_children ? $$("a.ex-link-events", node) : [ node ],
				events, i, ii;

			for (i = 0, ii = nodes.length; i < ii; ++i) {
				node = nodes[i];
				events = node.getAttribute("data-ex-link-events");
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
			var old_events = node.getAttribute("data-ex-link-events"),
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
				node.removeAttribute("data-ex-link-events");
			}
			else {
				node.setAttribute("data-ex-link-events", new_events);
				Linkifier.set_link_events(node, new_events);
			}
		},
		parse_posts: function (posts) {
			var post, i, ii;

			Debug.timer("process");

			for (i = 0, ii = posts.length; i < ii; ++i) {
				post = posts[i];
				Linkifier.parse_post(post);
				Linkifier.apply_link_events(post, true);
			}

			Debug.log("Total posts=" + posts.length + "; time=" + Debug.timer("process"));
		},
		parse_post: function (post) {
			var post_body, post_links, links, nodes, link, i, ii;

			// Exsauce
			if (conf.ExSauce) {
				Linkifier.setup_post_exsauce(post);
			}

			// Collapse info if it's an inline
			if (conf['Hide in Quotes']) {
				nodes = $$('.exlinks-exsauce-results,.ex-actions', post);
				for (i = 0, ii = nodes.length; i < ii; ++i) {
					nodes[i].style.display = "none";
				}
			}

			// Content
			post_body = Helper.Post.get_text_body(post) || post;
			if (regex.url.test(post_body.innerHTML)) {
				if (!post.classList.contains("ex-post-linkified")) {
					links = [];
					post_links = Helper.Post.get_body_links(post_body);
					for (i = 0, ii = post_links.length; i < ii; ++i) {
						link = post_links[i];
						if (regex.url.test(link.href)) {
							link.classList.add("ex-link-events");
							link.classList.add("ex-linkified");
							link.classList.add("ex-linkified-gallery");
							link.target = "_blank";
							link.rel = "noreferrer";
							link.setAttribute("data-ex-linkified-status", "unprocessed");
							Linkifier.change_link_events(link, "gallery_link");
							links.push(link);
						}
					}

					Linkifier.linkify(post_body, links);
					for (i = 0, ii = links.length; i < ii; ++i) {
						Linkifier.preprocess_link(links[i]);
					}

					post.classList.add("ex-post-linkified");
				}
			}

			// Events
			Linkifier.apply_link_events(post, true);
		},
		setup_post_exsauce: function (post) {
			var file_info, sauce;

			// File info
			file_info = Helper.Post.get_file_info(post);
			if (file_info === null || file_info.md5 === null) return;

			// Create if not found
			sauce = $(".exlinks-exsauce-link", file_info.options);
			if (sauce === null) {
				sauce = $.link(file_info.url, {
					className: "ex-link-events exlinks-exsauce-link" + (file_info.options_class ? " " + file_info.options_class : ""),
					textContent: Sauce.label(false)
				});
				sauce.setAttribute("data-ex-link-events", "exsauce_fetch");
				if (conf["No Underline on Sauce"]) {
					sauce.classList.add("exlinks-exsauce-link-no-underline");
				}
				sauce.setAttribute("data-md5", file_info.md5.replace(/=+/g, ""));
				if (/^\.jpe?g$/.test(file_info.type)) {
					sauce.classList.add("exlinks-exsauce-link-disabled");
					sauce.setAttribute("data-ex-link-events", "exsauce_error");
					sauce.title = (
						"Reverse Image Search doesn't work for JPG images because 4chan manipulates them on upload. " +
						"There is nothing ExLinks can do about this. " +
						"All complaints can be directed at 4chan staff."
					);
				}
				if (file_info.options_sep) {
					$.before2(file_info.options, $.tnode(file_info.options_sep), file_info.options_before);
				}
				$.before2(file_info.options, sauce, file_info.options_before);
			}
		},
		on_tag_click_to_load: function (event) {
			event.preventDefault();

			var n = Helper.get_link_from_tag_button(this);
			if (n !== null) {
				Linkifier.check_link(n);
				Main.update();
			}
		},
		check_link: function (link) {
			var type = Helper.get_type_from_node(link),
				uid = Helper.get_id_from_node(link),
				token = Helper.get_token_from_node(link),
				page, page_token, check;

			if (type === "s") {
				page = Helper.get_page_from_node(link);
				page_token = Helper.get_page_token_from_node(link);
				if (page !== null) {
					check = Database.check(uid);
					if (check && token) {
						type = "g";
						token = check;
						link.setAttribute("data-exlinks-type", type);
						link.setAttribute("data-exlinks-token", token);
						link.removeAttribute("data-exlinks-page");
						link.removeAttribute("data-exlinks-page-token");
						link.classList.add("exlinks-token");
						link.classList.remove("exlinks-page");
						link.classList.remove("exlinks-page-token");
						Main.queue.push(uid);
					}
					else {
						API.queue.add("s", uid, page_token, page);
					}
				}
			}
			if (type === "g") {
				if (Database.check(uid)) {
					Main.queue.push(uid);
				}
				else {
					if (token) {
						API.queue.add('g', uid, token);
					}
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
		}
	};
	Options = {
		save: function (e) {
			e.preventDefault();
			Config.save();
			$.remove($.id('exlinks-overlay'));
			d.body.style.overflow = 'visible';
		},
		close: function (e) {
			e.preventDefault();
			tempconf = JSON.parse(JSON.stringify(pageconf));
			$.remove($.id('exlinks-overlay'));
			d.body.style.overflow = 'visible';
		},
		on_change: function () {
			var option = this,
				type = option.getAttribute('type'),
				name = option.name,
				domain;

			if (!(name in tempconf)) return;

			if (option.tagName === "SELECT") {
				domain = {
					"1": fetch.original,
					"2": fetch.gehentai,
					"3": fetch.exhentai
				};
				tempconf[name] = domain[option.value];
			}
			else if (type === "checkbox") {
				tempconf[name] = (option.checked ? true : false);
			}
			else if (type === "text" || option.tagName === "TEXTAREA") {
				tempconf[name] = option.value;
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

			pageconf = JSON.parse(JSON.stringify(tempconf));

			var frag = $.frag(UI.html.options()),
				over = frag.firstChild;

			Theme.apply(frag);
			$.add(d.body, frag);
			$.on($.id('exlinks-options-save'), 'click', Options.save);
			$.on($.id('exlinks-options-cancel'), 'click', Options.close);
			$.on(over, 'click', Options.close);
			$.on($.id('exlinks-options'), 'click', function (e) { e.stopPropagation(); });
			d.body.style.overflow = 'hidden';

			Options.gen($.id('exlinks-options-general'), options.general);
			Options.gen($.id('exlinks-options-actions'), options.actions);
			Options.gen($.id('exlinks-options-sauce'), options.sauce);
			Options.gen($.id('exlinks-options-domains'), options.domains);
			Options.gen($.id('exlinks-options-debug'), options.debug, {
				"Clear Stored Data": [ "button", false, "Clear all stored data <em>except</em> for settings", "Clear", Options.on_data_clear ],
			});
			Options.gen($.id('exlinks-options-filter'), options.filter);
			$.on($("input.exlinks-options-color-input[type=color]"), 'change', Filter.settings_color_change);
		},
		gen: function (target) {
			var theme = Theme.get(),
				desc, tr, type, value, obj, key, i, ii;

			for (i = 1, ii = arguments.length; i < ii; ++i) {
				obj = arguments[i];
				for (key in obj) {
					desc = obj[key][2];
					type = obj[key][0];
					value = tempconf[key];
					tr = $.create('tr', { className: theme.trim() });
					if (type === 'checkbox') {
						tr.innerHTML = [
							'<td>',
							'<input class="exlinks-options-checkbox extheme" type="checkbox" id="' + key + '" name="' + key + '" />',
							'<label for="' + key + '"><strong>' + key + ':</strong> ' + desc + '</label>',
							'</td>'
						].join('');
						$('input', tr).checked = value;
						$.on($('input', tr), 'change', Options.on_change);
					}
					else if (type === 'domain') {
						tr.innerHTML = [
							'<td>',
							'<select class="exlinks-options-select extheme" name="' + key + '">',
								'<option value="1"' + (value.value === 'Original' ? ' selected' : '') + '>Original</option>',
								'<option value="2"' + (value.value === domains.gehentai ? ' selected' : '') + '>' + domains.gehentai + '</option>',
								'<option value="3"' + (value.value === domains.exhentai ? ' selected' : '') + '>' + domains.exhentai + '</option></select>',
							'<strong>' + key + ':</strong> ' + desc +
							'</td>'
						].join('');
						$.on($('select', tr), 'change', Options.on_change);
					}
					else if (type === 'saucedomain') {
						tr.innerHTML = [
							'<td>',
							'<select class="exlinks-options-select extheme" name="' + key + '">',
								'<option value="2"' + (value.value === domains.gehentai ? ' selected' : '') + '>' + domains.gehentai + '</option>',
								'<option value="3"' + (value.value === domains.exhentai ? ' selected' : '') + '>' + domains.exhentai + '</option></select>',
							'<strong>' + key + ':</strong> ' + desc +
							'</td>'
						].join('');
						$.on($('select', tr), 'change', Options.on_change);
					}
					else if (type === 'textbox') {
						tr.innerHTML = [
							'<td>',
							'<input class="exlinks-options-textbox extheme" type="text" id="' + key + '" name="' + key + '" />',
							'<strong>' + key + ':</strong> ' + desc +
							'</td>'
						].join('');
						$('input', tr).value = value;
						$.on($('input', tr), 'input', Options.on_change);
					}
					else if (type === 'textarea') {
						tr.innerHTML = [
							'<td>',
							'<strong>' + key + ':</strong> ' + desc + '<br />',
							'<textarea class="exlinks-options-textarea extheme" wrap="off" autocomplete="off" spellcheck="false" id="' + key + '" name="' + key + '"></textarea>',
							'</td>'
						].join('');
						$('textarea', tr).value = value;
						$.on($('textarea', tr), 'input', Options.on_change);
					}
					else if (type === 'button') {
						tr.innerHTML = [
							'<td>',
							'<button class="exlinks-options-input-button extheme" id="' + key + '" name="' + key + '">' + (obj[key][3] || '') + '</button>',
							'<strong>' + key + ':</strong> ' + desc +
							'</td>'
						].join('');
						$.on($('button', tr), 'click', obj[key][4] || Options.on_change);
					}
					$.add(target, tr);
					Theme.apply(tr);
				}
			}
		},
		init: function () {
			var oneechan = $.id('OneeChanLink'),
				chanss = $.id('themeoptionsLink'),
				conflink, conflink2, arrtop, arrbot;

			Main["4chanX3"] = d.documentElement.classList.contains("fourchan-x");
			conflink = $.link("#HOMEPAGE#", { title: "ExLinks Settings", className: "entry" });
			$.on(conflink, 'click', Options.open);

			if (Config.mode === '4chan') {
				if (oneechan) {
					$.add(d.body, conflink);
				}
				else if (chanss) {
					conflink.textContent = 'Ex';
					conflink.setAttribute('style', 'background-image: url(' + img.options + '); padding-top: 15px !important; opacity: 0.75;');
					$.on(conflink, [
						[ 'mouseover', function () { this.style.opacity = 1.0; } ],
						[ 'mouseout', function () { this.style.opacity = 0.65; } ]
					]);
					$.checked.add($.id('navtopright'), conflink);
				}
				else {
					conflink.textContent = 'ExLinks Settings';
					conflink.setAttribute('style', 'cursor:pointer;' + (conflink.getAttribute('style') || ""));
					conflink2 = conflink.cloneNode(true);
					$.on(conflink2, 'click', Options.open);
					arrtop = [ $.tnode('['), conflink, $.tnode('] ') ];
					arrbot = [ $.tnode('['), conflink2, $.tnode('] ') ];
					$.checked.prepend($.id('navtopright'), $.elem(arrtop));
					$.checked.prepend($.id('navbotright'), $.elem(arrbot));
				}
			}
			else if (Config.mode === 'fuuka') {
				conflink.textContent = 'exlinks options';
				conflink.setAttribute('style', 'cursor:pointer;text-decoration:underline;');
				arrtop = [ $.tnode(' [ '), conflink, $.tnode(' ] ') ];
				$.checked.add($('div'), $.elem(arrtop));
			}
			else if (Config.mode === 'foolz') {
				conflink.textContent = 'ExLinks Options';
				conflink.setAttribute('style', 'cursor:pointer;');
				arrtop = [ $.tnode(' [ '), conflink, $.tnode(' ] ') ];
				$.checked.add($('.letters'), $.elem(arrtop));
			}
			else if (Config.mode === '38chan') {
				conflink.textContent = 'exlinks options';
				conflink.setAttribute('style', 'cursor:pointer;');
				conflink2 = conflink.cloneNode(true);
				$.on(conflink2, 'click', Options.open);
				arrtop = [ $.tnode('  [ '), conflink, $.tnode(' ] ') ];
				arrbot = [ $.tnode('  [ '), conflink2, $.tnode(' ] ') ];
				$.checked.add($('.boardlist'), $.elem(arrtop));
				$.checked.add($('.boardlist.bottom'), $.elem(arrbot));
			}
		}
	};
	Config = {
		mode: "4chan", // foolz, fuuka, 38chan
		domain: function (domain, opt) {
			return (opt.value === "Original") ? domain : opt.value;
		},
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
			}
			else if (/boards\.38chan\.net/i.test(site)) {
				Config.mode = "38chan";
			}
		},
		save: function () {
			for (var i in options) {
				for (var k in options[i]) {
					localStorage.setItem(Main.namespace + 'user-' + k, JSON.stringify(tempconf[k]));
				}
			}
		},
		init: function () {
			var temp, option, i, k;
			for (i in options) {
				for (k in options[i]) {
					temp = localStorage.getItem(Main.namespace + 'user-' + k);
					if (temp) {
						conf[k] = Helper.json_parse_safe(temp, false);
					}
					else {
						option = JSON.stringify(options[i][k][1]);
						conf[k] = JSON.parse(option);
						localStorage.setItem(Main.namespace + 'user-' + k, option);
					}
				}
			}
			if (/presto/i.test(navigator.userAgent)) {
				conf.ExSauce = false;
			}
			tempconf = JSON.parse(JSON.stringify(conf));
		}
	};
	Filter = {
		title: null,
		tags: null,
		uploader: null,
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
			Filter.title = Filter.parse(conf['Name Filter']);
			Filter.tags = Filter.parse(conf['Tag Filter']);
			Filter.uploader = Filter.parse(conf['Uploader Filter']);
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
			var norm = {}, any = false;

			if (flags.only) {
				norm.only = Filter.normalize_split(flags.only);
				any = true;
			}
			if (flags.not) {
				norm.not = Filter.normalize_split(flags.not);
				any = true;
			}
			if ("bad" in flags && ([ "", "true", "yes" ].indexOf(flags.bad.trim().toLowerCase()) >= 0)) {
				norm.bad = true;
				any = true;
			}
			if ("color" in flags) {
				norm.color = flags.color.trim();
				any = true;
			}
			if ("background" in flags) {
				norm.background = flags.background.trim();
				any = true;
			}
			if ("underline" in flags) {
				norm.underline = flags.underline.trim();
				any = true;
			}
			if ("link-color" in flags) {
				norm.link = {};
				norm.link.color = flags["link-color"].trim();
				any = true;
			}
			if ("link-background" in flags) {
				if (!norm.link) {
					norm.link = {};
				}
				norm.link.background = flags["link-background"].trim();
				any = true;
			}
			if ("link-underline" in flags) {
				if (!norm.link) {
					norm.link = {};
				}
				norm.link.underline = flags["link-underline"].trim();
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
		check_multiple: function (text, filters, data) {
			var info = new Filter.MatchInfo(),
				filter, match, i;

			for (i = 0; i < filters.length; ++i) {
				filter = filters[i];
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
			if (Filter.title === null) return [ Filter.None, null ];

			var filter_uploader = Filter.uploader,
				filter_tags = Filter.tags,
				status, str, tags, result, i, info;

			if (extras && extras.length > 0) {
				filter_uploader = filter_uploader.concat(extras);
				filter_tags = filter_tags.concat(extras);
			}

			result = {
				tags: [],
				uploader: [],
				title: [],
			};

			// Title
			status = Filter.highlight("title", titlenode, data, result.title, extras);

			// Uploader
			if (Filter.uploader.length > 0) {
				if ((str = data.uploader)) {
					str = Helper.normalize_api_string(str);
					info = Filter.check_multiple(str, filter_uploader, data);
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
			}

			// Tags
			if (Filter.tags.length > 0) {
				if ((tags = data.tags) && tags.length > 0) {
					for (i = 0; i < tags.length; ++i) {
						info = Filter.check_multiple(tags[i], filter_tags, data);
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
		highlight: function (mode, node, data, results, extras) {
			if (Filter.title === null) {
				Filter.init();
			}

			var no_extras = true,
				filters = Filter[mode],
				info, matches, text, frag, segment, cache, i, t, n1, n2;

			if (filters.length === 0) {
				return Filter.None;
			}
			if (extras && extras.length > 0) {
				filters = filters.concat(extras);
				no_extras = false;
			}

			// Cache for tags
			text = node.textContent;
			if (no_extras && (cache = Filter.cache[mode]) !== undefined && (n1 = cache[text]) !== undefined) {
				if (n1 === null) {
					return Filter.None;
				}

				// Clone
				n1 = n1.cloneNode(true);
				node.innerHTML = "";
				while ((n2 = n1.firstChild) !== null) {
					$.add(node, n2);
				}
				return Filter.hl_return(n1.classList.contains("ex-filter-bad"), node);
			}

			// Check filters
			info = Filter.check_multiple(text, filters, data);
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
					n1 = $.create("span", { className: "ex-filter-text" });
					n2 = $.create("span", { className: "ex-filter-text-inner", textContent: t });
					$.add(n1, n2);
					$.add(frag, n1);
					Filter.apply_styles(n1, segment.data);
				}
			}

			// Replace
			node.innerHTML = "";
			$.add(node, frag);
			if (cache !== undefined) {
				cache[text] = node;
			}
			return Filter.hl_return(info.bad, node);
		},
		highlight_tag: function (node, link, filter_data) {
			if (filter_data[0] === Filter.Bad) {
				node.classList.add("ex-filter-bad");
				link.classList.add("ex-filter-bad");
				link.classList.remove("ex-filter-good");
			}
			else {
				node.classList.add("ex-filter-good");
				link.classList.add("ex-filter-good");
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
				n1 = $.create("span", { className: "ex-filter-text" });
				n2 = $.create("span", { className: "ex-filter-text-inner" });
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
				node.classList.add("ex-filter-bad");
				return Filter.Bad;
			}
			else {
				node.classList.add("ex-filter-good");
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
			return (Theme.current === "light" ? " extheme" : " extheme extheme-dark");
		},
		apply: function (node) {
			if (Theme.current !== "light") {
				var nodes = $$(".extheme", node),
					i, ii;

				for (i = 0, ii = nodes.length; i < ii; ++i) {
					nodes[i].classList.add("extheme-dark");
				}
			}
		},
		prepare: function (first) {
			Theme.update(!first);

			var add_mo = function (nodes, init, callback) {
				var MO = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver,
					mo, i;

				if (!MO) return;

				mo = new MO(callback);
				for (i = 0; i < nodes.length; ++i) {
					if (nodes[i]) mo.observe(nodes[i], init);
				}
			};

			add_mo([ d.head ], { childList: true }, function (records) {
				var update = false,
					nodes, i, j, tag;

				outer:
				for (i = 0; i < records.length; ++i) {
					if ((nodes = records[i].addedNodes)) {
						for (j = 0; j < nodes.length; ++j) {
							tag = nodes[j].tagName;
							if (tag === "STYLE" || tag === "LINK") {
								update = true;
								break outer;
							}
						}
					}
					if ((nodes = records[i].removedNodes)) {
						for (j = 0; j < nodes.length; ++j) {
							tag = nodes[j].tagName;
							if (tag === "STYLE" || tag === "LINK") {
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
					var nodes = $$("extheme"),
						cls, i;
					if (new_theme === "light") {
						cls = "extheme-" + Theme.current;
						for (i = 0; i < nodes.length; ++i) {
							nodes.classList.remove(cls);
						}
					}
					else {
						cls = "extheme-" + new_theme;
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

			n.className = "post reply post_wrapper ex-fake-post";
			body.appendChild(n);

			color = Theme.parse_css_color(window.getComputedStyle(doc_el).backgroundColor);
			colors = [
				Theme.parse_css_color(window.getComputedStyle(body).backgroundColor),
				Theme.parse_css_color(window.getComputedStyle(n).backgroundColor),
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

			if (color[3] === 0) {
				return null;
			}

			return (color[0] + color[1] + color[2] < 384) ? "dark" : "light";
		},
		parse_css_color: function (color) {
			if (color !== "transparent") {
				var m;
				if ((m = /^rgba?\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\s*(,\s*([0-9\.]+)\s*)?\)$/.exec(color))) {
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
		overlay: null,
		options_container: null,
		items_container: null,
		empty_notification: null,
		current: [],
		current_map: {},
		queue: [],
		queue_map: {},
		queue_timer: null,
		custom_filters: [],
		node_sort_order_keys: {
			thread: [ "data-index", 1 ],
			upload: [ "data-date-uploaded", -1 ],
			rating: [ "data-rating", -1 ]
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
			localStorage.setItem(Main.namespace + "easylist-settings", JSON.stringify(EasyList.settings));
		},
		settings_load: function () {
			// Load
			var value = localStorage.getItem(Main.namespace + "easylist-settings"),
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
			var mobile_top = true,
				links = [],
				navlinks, navlink, is_desktop, link_mod,
				n1, n2, i, ii;

			if (Config.mode === '4chan') {
				navlinks = $$(".navLinks");
				is_desktop = function (node) { return node.classList.contains("desktop"); };
				link_mod = function (text) { return text; };
			}
			else if (Config.mode === 'foolz') {
				navlinks = $$(".letters");
				is_desktop = function () { return true; };
				link_mod = function (text) { return " " + text + " "; };
			}
			else {
				navlinks = [];
			}

			for (i = 0, ii = navlinks.length; i < ii; ++i) {
				navlink = navlinks[i];
				if (is_desktop(navlink)) {
					// Desktop
					if ((n1 = navlink.lastChild) !== null && n1.nodeType === Node.TEXT_NODE) {
						n1.nodeValue = n1.nodeValue.replace(/\]\s*$/, "]") + " [";
					}
					else {
						$.add(navlink, $.tnode(" ["));
					}

					n2 = $.link(null, {
						className: "exlinks-easy-list-link",
						textContent: link_mod("ExLinks Easy List", true),
						style: "cursor:pointer;"
					});

					$.add(navlink, n2);
					$.add(navlink, $.tnode("]"));
				}
				else {
					// Mobile
					n1 = $.create("div", {
						className: "mobile",
						style: "text-align:center;margin:0.5em 0;"
					});
					$.add(n1, n2 = $.create("span", {
						className: "mobileib button exlinks-easy-list-button"
					}));
					$.add(n2, $.link(null, {
						textContent: link_mod("Easy List", false)
					}));
					if (mobile_top) {
						$.before(navlink, n1);
					}
					else {
						$.after(navlink, n1);
					}

					mobile_top = false;
				}

				links.push(n2);
			}

			for (i = 0, ii = links.length; i < ii; ++i) {
				$.on(links[i], "click", EasyList.on_open_click);
			}
		},
		create: function () {
			var theme = Theme.get(),
				n1, n2, n3, n4, n5;

			// Overlay
			n1 = $.create("div", {
				className: "ex-easylist-overlay" + theme
			});
			$.on(n1, "click", EasyList.on_overlay_click);
			$.on(n1, "mousedown", EasyList.on_overlay_mousedown);
			EasyList.overlay = n1;

			// Content aligner
			$.add(n1, n2 = $.create("div", {
				className: "ex-easylist-content-align"
			}));

			// Content
			$.add(n2, n3 = $.create("div", {
				className: "ex-easylist-content"
			}));

			$.add(n3, n4 = $.create("div", {
				className: "ex-easylist-content-inner post reply post_wrapper ex-fake-post" + theme
			}));
			$.on(n4, "click", EasyList.on_overlay_content_mouse_event);
			$.on(n4, "mousedown", EasyList.on_overlay_content_mouse_event);
			n3 = n4;

			$.add(n3, n4 = $.create("div", {
				className: "ex-easylist-title"
			}));

			$.add(n4, $.create("span", {
				className: "ex-easylist-title-text",
				textContent: "ExLinks Easy List"
			}));
			$.add(n4, $.create("span", {
				className: "ex-easylist-subtitle",
				textContent: "More porn, less hassle"
			}));

			// Close
			$.add(n3, n4 = $.create("div", { className: "ex-easylist-control-links" }));

			$.add(n4, n5 = $.link(null, {
				className: "ex-easylist-control-link ex-easylist-control-link-options",
				textContent: "options"
			}));
			$.on(n5, "click", EasyList.on_options_click);

			$.add(n4, n5 = $.link(null, {
				className: "ex-easylist-control-link",
				textContent: "close"
			}));
			$.on(n5, "click", EasyList.on_close_click);

			$.add(n3, $.create("div", { className: "ex-easylist-title-line" }));

			// Options
			EasyList.options_container = EasyList.create_options(theme);
			$.add(n3, EasyList.options_container);

			// Empty notification
			$.add(n3, n4 = $.create("div", {
				className: "ex-easylist-empty-notification ex-easylist-empty-notification-visible",
				textContent: "No galleries found"
			}));
			EasyList.empty_notification = n4;

			// Items list
			$.add(n3, n4 = $.create("div", { className: "ex-easylist-items" + theme }));
			EasyList.items_container = n4;

			// Setup
			EasyList.update_display_mode(true);
		},
		create_options: function (theme) {
			var n1, n2, n3, n4, n5, n6, v;

			n1 = $.create("div", { className: "ex-easylist-options" });
			$.add(n1, n2 = $.create("div", { className: "ex-easylist-option-table" }));


			$.add(n2, n3 = $.create("div", { className: "ex-easylist-option-row" }));
			$.add(n3, n4 = $.create("div", { className: "ex-easylist-option-cell" }));
			$.add(n4, $.create("span", { className: "ex-easylist-option-title", textContent: "Sort by:" }));

			$.add(n3, n4 = $.create("div", { className: "ex-easylist-option-cell" }));

			v = "thread";
			$.add(n4, n5 = $.create("label", { className: "ex-easylist-option-label" }));
			$.add(n5, n6 = $.create("input", {
				className: "ex-easylist-option-input",
				name: "ex-easylist-options-sort-by",
				type: "radio",
				checked: (EasyList.settings.sort_by === v),
				value: v
			}));
			$.add(n5, $.create("span", { className: "ex-easylist-option-button" + theme, textContent: "Appearance in thread" }));
			$.on(n6, "change", EasyList.on_option_change.sort_by);

			v = "upload";
			$.add(n4, n5 = $.create("label", { className: "ex-easylist-option-label" }));
			$.add(n5, n6 = $.create("input", {
				className: "ex-easylist-option-input",
				name: "ex-easylist-options-sort-by",
				type: "radio",
				checked: (EasyList.settings.sort_by === v),
				value: v
			}));
			$.add(n5, $.create("span", { className: "ex-easylist-option-button" + theme, textContent: "Upload date" }));
			$.on(n6, "change", EasyList.on_option_change.sort_by);

			v = "rating";
			$.add(n4, n5 = $.create("label", { className: "ex-easylist-option-label" }));
			$.add(n5, n6 = $.create("input", {
				className: "ex-easylist-option-input",
				name: "ex-easylist-options-sort-by",
				type: "radio",
				checked: (EasyList.settings.sort_by === v),
				value: v
			}));
			$.add(n5, $.create("span", { className: "ex-easylist-option-button" + theme, textContent: "Rating" }));
			$.on(n6, "change", EasyList.on_option_change.sort_by);


			$.add(n2, n3 = $.create("div", { className: "ex-easylist-option-row" }));
			$.add(n3, n4 = $.create("div", { className: "ex-easylist-option-cell" }));
			$.add(n4, $.create("span", { className: "ex-easylist-option-title", textContent: "Group by:" }));

			$.add(n3, n4 = $.create("div", { className: "ex-easylist-option-cell" }));

			$.add(n4, n5 = $.create("label", { className: "ex-easylist-option-label" }));
			$.add(n5, n6 = $.create("input", { className: "ex-easylist-option-input", type: "checkbox", checked: EasyList.settings.group_by_filters }));
			$.add(n5, $.create("span", { className: "ex-easylist-option-button" + theme, textContent: "Filters" }));
			$.on(n6, "change", EasyList.on_option_change.group_by_filters);

			$.add(n4, n5 = $.create("label", { className: "ex-easylist-option-label" }));
			$.add(n5, n6 = $.create("input", { className: "ex-easylist-option-input", type: "checkbox", checked: EasyList.settings.group_by_category }));
			$.add(n5, $.create("span", { className: "ex-easylist-option-button" + theme, textContent: "Category" }));
			$.on(n6, "change", EasyList.on_option_change.group_by_category);


			$.add(n2, n3 = $.create("div", { className: "ex-easylist-option-row" }));
			$.add(n3, n4 = $.create("div", { className: "ex-easylist-option-cell" }));
			$.add(n4, $.create("span", { className: "ex-easylist-option-title", textContent: "Display mode:" }));

			$.add(n3, n4 = $.create("div", { className: "ex-easylist-option-cell" }));

			v = 0;
			$.add(n4, n5 = $.create("label", { className: "ex-easylist-option-label" }));
			$.add(n5, n6 = $.create("input", {
				className: "ex-easylist-option-input",
				name: "ex-easylist-options-display",
				type: "radio",
				checked: (EasyList.settings.display_mode === v),
				value: "" + v
			}));
			$.add(n5, $.create("span", { className: "ex-easylist-option-button" + theme, textContent: "Full" }));
			$.on(n6, "change", EasyList.on_option_change.display_mode);

			v = 1;
			$.add(n4, n5 = $.create("label", { className: "ex-easylist-option-label" }));
			$.add(n5, n6 = $.create("input", {
				className: "ex-easylist-option-input",
				name: "ex-easylist-options-display",
				type: "radio",
				checked: (EasyList.settings.display_mode === v),
				value: "" + v
			}));
			$.add(n5, $.create("span", { className: "ex-easylist-option-button" + theme, textContent: "Compact" }));
			$.on(n6, "change", EasyList.on_option_change.display_mode);

			v = 2;
			$.add(n4, n5 = $.create("label", { className: "ex-easylist-option-label" }));
			$.add(n5, n6 = $.create("input", {
				className: "ex-easylist-option-input",
				name: "ex-easylist-options-display",
				type: "radio",
				checked: (EasyList.settings.display_mode === v),
				value: "" + v
			}));
			$.add(n5, $.create("span", { className: "ex-easylist-option-button" + theme, textContent: "Minimal" }));
			$.on(n6, "change", EasyList.on_option_change.display_mode);



			$.add(n2, n3 = $.create("div", { className: "ex-easylist-option-row" }));
			$.add(n3, n4 = $.create("div", { className: "ex-easylist-option-cell" }));
			$.add(n4, $.create("span", { className: "ex-easylist-option-title", textContent: "Custom filters:" }));

			$.add(n3, n4 = $.create("div", { className: "ex-easylist-option-cell" }));
			$.add(n4, n6 = $.create("textarea", { className: "ex-easylist-option-textarea" + theme, value: EasyList.settings.custom_filters, wrap: "off", spellcheck: false, autocomplete: "off" }));
			$.on(n6, "change", EasyList.on_option_change.custom_filters);
			$.on(n6, "input", EasyList.on_option_change.custom_filters_input);


			$.add(n1, $.create("div", { className: "ex-easylist-title-line" }));

			return n1;
		},
		enable: function () {
			var n = d.body;
			if (EasyList.overlay.parentNode !== n) {
				$.add(n, EasyList.overlay);
			}
			d.documentElement.classList.add("ex-easylist-overlaying");

			// Focus
			n = $.create("textarea");
			$.add(EasyList.overlay, n);
			n.focus();
			n.blur();
			$.remove(n);

			// Scroll to top
			EasyList.overlay.scrollTop = 0;
			EasyList.overlay.scrollLeft = 0;
		},
		disable: function () {
			if (EasyList.overlay.parentNode !== null) {
				$.remove(EasyList.overlay);
			}
			d.documentElement.classList.remove("ex-easylist-overlaying");

			EasyList.set_options_visible(false);

			Linkifier.off("format", EasyList.on_linkify);
		},
		populate: function () {
			EasyList.on_linkify(Linkifier.get_links_formatted());
			Linkifier.on("format", EasyList.on_linkify);
		},
		set_empty: function (empty) {
			if (EasyList.empty_notification !== null) {
				var cls = "ex-easylist-empty-notification-visible";
				if (empty !== EasyList.empty_notification.classList.contains(cls)) {
					EasyList.empty_notification.classList.toggle(cls);
				}
			}
		},
		get_options_visible: function () {
			return EasyList.options_container.classList.contains("ex-easylist-options-visible");
		},
		set_options_visible: function (visible) {
			var n = $(".ex-easylist-control-link-options", EasyList.overlay),
				cl, cls;

			if (n !== null) {
				cl = n.classList;
				cls = "ex-easylist-control-link-focus";
				if (cl.contains(cls) !== visible) cl.toggle(cls);
			}

			cl = EasyList.options_container.classList;
			cls = "ex-easylist-options-visible";
			if (cl.contains(cls) !== visible) cl.toggle(cls);
		},
		create_gallery_nodes: function (data, theme, index, domain) {
			var url_base = "http://" + domain,
				url = url_base + "/g/" + data.gid + "/" + data.token + "/",
				hl_res, n1, n2, n3, n4, n5, n6, n7, i;

			n1 = $.create("div", { className: "ex-easylist-item" + theme });
			n1.setAttribute("data-index", index);
			n1.setAttribute("data-gid", data.gid);
			n1.setAttribute("data-token", data.token);
			n1.setAttribute("data-rating", data.rating);
			n1.setAttribute("data-date-uploaded", data.posted);
			n1.setAttribute("data-category", data.category.toLowerCase());
			n1.setAttribute("data-domain", domain);

			$.add(n1, n2 = $.create("div", { className: "ex-easylist-item-table-container" + theme }));
			$.add(n2, n3 = $.create("div", { className: "ex-easylist-item-table" + theme }));
			n2 = n3;
			$.add(n2, n3 = $.create("div", { className: "ex-easylist-item-row" + theme }));
			$.add(n3, n4 = $.create("div", { className: "ex-easylist-item-cell ex-easylist-item-cell-image" + theme }));

			// Image
			$.add(n4, n5 = $.link(url, {
				className: "ex-easylist-item-image-container" + theme
			}));

			$.add(n5, n6 = $.create("div", {
				className: "ex-easylist-item-image-outer" + theme
			}));

			$.add(n6, n7 = $.create("img", {
				className: "ex-easylist-item-image" + theme,
				src: data.thumb,
				alt: "",
				title: ""
			}));
			$.on(n7, "error", EasyList.on_thumbnail_error);

			$.add(n6, $.create("span", {
				className: "ex-easylist-item-image-index" + theme,
				textContent: "#" + (index + 1)
			}));


			// Main content
			$.add(n3, n4 = $.create("div", { className: "ex-easylist-item-cell" + theme }));

			$.add(n4, n5 = $.create("div", {
				className: "ex-easylist-item-title" + theme
			}));

			$.add(n5, n6 = $.link(url, {
				className: "ex-easylist-item-title-tag-link" + theme,
				textContent: UI.button.text(domain)
			}));
			n6.setAttribute("data-original", n6.textContent);

			$.add(n5, n6 = $.link(url, {
				className: "ex-easylist-item-title-link" + theme,
				textContent: Helper.normalize_api_string(data.title)
			}));
			n6.setAttribute("data-original", n6.textContent);

			if (data.title_jpn) {
				$.add(n4, n5 = $.create("span", {
					className: "ex-easylist-item-title-jp" + theme,
					textContent: Helper.normalize_api_string(data.title_jpn)
				}));
				n5.setAttribute("data-original", n5.textContent);
			}

			$.add(n4, n5 = $.create("div", { className: "ex-easylist-item-upload-info" + theme }));
			$.add(n5, $.tnode("Uploaded by "));
			$.add(n5, n6 = $.link(url_base + "/uploader/" + data.uploader, {
				className: "ex-easylist-item-uploader" + theme,
				textContent: data.uploader
			}));
			n6.setAttribute("data-original", n6.textContent);
			$.add(n5, $.tnode(" on "));
			$.add(n5, $.create("span", {
				className: "ex-easylist-item-upload-date" + theme,
				textContent: UI.date(new Date(parseInt(data.posted, 10) * 1000))
			}));

			$.add(n4, n5 = $.create("div", { className: "ex-easylist-item-tags" + theme }));

			n6 = EasyList.create_full_tags(domain, data, theme);
			$.add(n5, n6[0]);
			if (!n6[1]) {
				$.on(n1, "mouseover", EasyList.on_gallery_mouseover);
			}


			// Right sidebar
			$.add(n3, n4 = $.create("div", { className: "ex-easylist-item-cell ex-easylist-item-cell-side" + theme }));

			$.add(n4, n5 = $.create("div", {
				className: "ex-easylist-item-info" + theme,
			}));

			$.add(n5, n6 = $.link(url_base + "/" + cat[data.category].short, {
				className: "ex-easylist-item-info-button exlinks-btn exlinks-btn-eh exlinks-btn-" + cat[data.category].short + theme
			}));
			$.add(n6, $.create("div", {
				className: "exlinks-noise",
				textContent: cat[data.category].name
			}));


			$.add(n5, n6 = $.create("div", {
				className: "ex-easylist-item-info-item ex-easylist-item-info-item-rating" + theme
			}));
			$.add(n6, $.create("div", {
				className: "exlinks-stars-container",
				innerHTML: UI.html.stars(data.rating)
			}));
			$.add(n6, $.create("span", {
				className: "ex-easylist-item-info-light",
				textContent: "(Avg: " + (parseFloat(data.rating) || 0).toFixed(2) + ")"
			}));


			$.add(n5, n6 = $.create("div", {
				className: "ex-easylist-item-info-item ex-easylist-item-info-item-files" + theme
			}));
			i = parseInt(data.filecount, 10) || 0;
			$.add(n6, $.create("span", {
				textContent: i + " image" + (i === 1 ? "" : "s")
			}));
			$.add(n6, $.create("br"));
			i = (data.filesize / 1024 / 1024).toFixed(2).replace(/\.?0+$/, "");
			$.add(n6, $.create("span", {
				className: "ex-easylist-item-info-light",
				textContent: "(" + i + " MB)"
			}));

			// Highlight
			hl_res = EasyList.update_filters(n1, data, true, false, true);
			EasyList.tag_filtering_results(n1, hl_res);

			return n1;
		},
		create_full_tags: function (domain, data, theme) {
			var url_base = "http://" + domain,
				n1 = $.create("div", { className: "ex-easylist-item-tag-table" + theme }),
				namespace_style = "",
				all_tags = { "": data.tags },
				namespace, tags, n2, n3, n4, i, ii;

			if (API.data_has_full(data) && Object.keys(data.full.tags).length > 0) {
				all_tags = data.full.tags;
			}

			for (namespace in all_tags) {
				tags = all_tags[namespace];

				$.add(n1, n2 = $.create("div", {
					className: "ex-easylist-item-tag-row" + theme
				}));

				if (namespace !== "") {
					namespace_style = " ex-tag-namespace-" + namespace.replace(/\ /g, "-");
					$.add(n2, n3 = $.create("div", {
						className: "ex-easylist-item-tag-cell ex-easylist-item-tag-cell-label" + theme
					}));
					$.add(n3, n4 = $.create("span", {
						className: "ex-tag-namespace-block ex-tag-namespace-block-no-outline" + namespace_style + theme
					}));
					$.add(n4, $.create("span", {
						textContent: namespace,
						className: "ex-tag-namespace"
					}));
					$.add(n3, $.tnode(":"));
				}

				$.add(n2, n3 = $.create("div", {
					className: "ex-easylist-item-tag-cell" + theme
				}));
				n2 = n3;

				for (i = 0, ii = tags.length; i < ii; ++i) {
					$.add(n2, n3 = $.create("span", {
						className: "ex-tag-block" + namespace_style
					}));
					$.add(n3, n4 = $.link(url_base + "/tag/" + tags[i].replace(/\ /g, "+"), {
						textContent: tags[i],
						className: "ex-tag ex-tag-color-inherit ex-easylist-item-tag"
					}));
					n4.setAttribute("data-original", n4.textContent);

					if (i < ii - 1) $.add(n3, $.tnode(","));
				}
			}

			return [ n1, namespace !== "" ];
		},
		add_gallery: function (gid, theme) {
			var data = Database.get(gid),
				link = EasyList.queue_map[gid],
				domain, info, n;

			delete EasyList.queue_map[gid];

			if (data !== null) {
				domain = Helper.get_domain(link.href || "") || domains.exhentai;

				n = EasyList.create_gallery_nodes(data, theme, EasyList.current.length, domain);
				info = {
					gid: gid,
					node: n
				};

				EasyList.current_map[gid] = info;
				EasyList.current.push(info);

				Main.insert_custom_fonts();

				$.add(EasyList.items_container, n);
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

				node.setAttribute("data-filter-matches-" + k, list.length - bad);
				node.setAttribute("data-filter-matches-" + k + "-bad", bad);
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
			var v1 = parseInt(node.getAttribute("data-filter-matches-title"), 10) || 0,
				v2 = parseInt(node.getAttribute("data-filter-matches-title-bad"), 10) || 0,
				v3 = parseInt(node.getAttribute("data-filter-matches-uploader"), 10) || 0,
				v4 = parseInt(node.getAttribute("data-filter-matches-uploader-bad"), 10) || 0,
				v5 = parseInt(node.getAttribute("data-filter-matches-tags"), 10) || 0,
				v6 = parseInt(node.getAttribute("data-filter-matches-tags-bad"), 10) || 0;

			v2 += v4 + v6;
			if (v2 > 0) return -v2;
			return v1 + v3 + v5;
		},
		get_node_category_group: function (node, ordering) {
			var k = node.getAttribute("data-category") || "";
			return ordering[k in ordering ? k : ""];
		},
		update_display_mode: function (first) {
			var list = EasyList.display_mode_names,
				mode = list[EasyList.settings.display_mode] || "",
				cl = EasyList.items_container.classList,
				i, ii;

			if (!first) {
				for (i = 0, ii = list.length; i < ii; ++i) {
					cl.remove("ex-easylist-" + list[i]);
				}
			}

			cl.add("ex-easylist-" + mode);
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
					parseFloat(n.getAttribute("data-index")) || 0
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
				if ((n2 = $(".ex-easylist-item-image-index", n)) !== null) {
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
				[ ".ex-easylist-item-title-link", "title", results1 ],
				[ ".ex-easylist-item-title-jp", "title", results1 ],
				[ ".ex-easylist-item-uploader", "uploader", results2 ],
				[ ".ex-easylist-item-tag", "tags", results3 ],
			];

			for (i = (tags_only ? 3 : 0), ii = targets.length; i < ii; ++i) {
				nodes = $$(targets[i][0], node);
				mode = targets[i][1];
				results = targets[i][2];
				for (j = 0, jj = nodes.length; j < jj; ++j) {
					n = nodes[j];
					if (!first) {
						n.textContent = n.getAttribute("data-original") || "";
						n.classList.remove("ex-filter-good");
						n.classList.remove("ex-filter-bad");
					}
					Filter.highlight(mode, n, data, results, EasyList.custom_filters);
				}
			}

			if (!tags_only) {
				link = $(".ex-easylist-item-title-link", node);
				n = $(".ex-easylist-item-title-tag-link", node);

				if (link !== null && n !== null) {
					if (!first) {
						n.textContent = n.getAttribute("data-original") || "";
						n.classList.remove("ex-filter-good");
						n.classList.remove("ex-filter-bad");
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
				hl_res, data, i, ii;

			for (i = 0, ii = list.length; i < ii; ++i) {
				data = Database.get(list[i].gid);
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
				EasyList.settings.display_mode = parseInt(this.value) || 0;
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
				tags_container = $(".ex-easylist-item-tags", this),
				gid = this.getAttribute("data-gid") || "",
				token = this.getAttribute("data-token") || "",
				domain = this.getAttribute("data-site");

			if (!domain) domain = domains.exhentai;

			API.request_full_info(gid, token, domain, function (err, data) {
				if (err === null && tags_container !== null) {
					var domain = node.getAttribute("data-domain") || domains.exhentai,
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
			var link, uid, i, ii;

			for (i = 0, ii = links.length; i < ii; ++i) {
				link = links[i];
				if ((uid = Helper.get_id_from_node(link)) !== null) {
					if (!(uid in EasyList.queue_map) && !(uid in EasyList.current_map)) {
						EasyList.queue.push(uid);
						EasyList.queue_map[uid] = link;
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
		namespace: "exlinks-",
		version: "#VERSION#",
		queue: [],
		font_inserted: false,
		hovering: (function () {
			var container = null;
			return function (node) {
				if (container === null) {
					container = $.create("div", {
						className: "exlinks-hovering-elements"
					});
					$.add(d.body, container);
				}
				$.add(container, node);
			};
		})(),
		check: function (uid) {
			var check = Database.check(uid),
				links, link, type, token, page, i, ii;

			if (check) {
				Main.queue.push(uid);
				return [ uid, 'f' ];
			}

			links = Linkifier.get_links_unformatted(uid);
			for (i = 0, ii = links.length; i < ii; ++i) {
				link = links[i];
				type = Helper.get_type_from_node(link);
				if (type === 's') {
					page = Helper.get_page_from_node(link);
					token = Helper.get_page_token_from_node(link);
				}
				else if (type === 'g') {
					token = Helper.get_token_from_node(link);
					break;
				}
			}

			if (type === 's') {
				if (page && token) {
					API.queue.add('s', uid, token, page);
					return [ uid, type ];
				}
			}
			else if (type === 'g') {
				if (token) {
					API.queue.add('g', uid, token);
					return [ uid, type ];
				}
			}
			return null;
		},
		flush_queue: function () {
			var queue = Main.queue,
				update = false,
				uid, data, i, ii;

			for (i = 0, ii = queue.length; i < ii; ++i) {
				uid = queue[i];
				data = Database.get(uid);
				if (data === null) {
					update = true;
				}
				else {
					Linkifier.format(Linkifier.get_links_unformatted(uid), data);
				}
			}

			Linkifier.trigger("format");

			Main.queue = [];

			if (update) {
				Main.update();
			}
		},
		update: function () {
			Main.flush_queue();

			if (!API.working) {
				if (API.queue('s')) {
					API.request('s');
				}
				else if (API.queue('g')) {
					API.request('g');
				}
			}
		},
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
				if (Main["4chanX3"]) {
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
						node.previousSibling.classList.contains("ex-site-tag")
					) {
						node.className = "ex-link-events ex-linkified ex-linkified-gallery";
						node.setAttribute("data-ex-linkified-status", "unprocessed");
						Linkifier.change_link_events(node, "gallery_link");
						$.remove(node.previousSibling);

						Linkifier.preprocess_link(node);

						node = Helper.Post.get_post_container(node);
						if (node !== null) {
							post_list.push(node);
						}
					}
				}

				// Add menu button back in whenever the menu is opened.
				if (
					nodes.length > 0 &&
					nodes[0].id === "menu" &&
					nodes[0].parentNode.parentNode.parentNode.parentNode.id === "header-bar"
				) {
					Main.create_menu_link(nodes[0]);
				}
			}

			if (post_list.length > 0) {
				Linkifier.parse_posts(post_list);
				Main.update();
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
		create_menu_link: function (menu) {
			var link = $.link("#HOMEPAGE#", {
				className: "entry",
				textContent: "ExLinks Settings"
			});
			link.style.order = 112;

			$.on(link, [
				[ "click", function (event) {
					$.remove(menu);
					return Options.open(event);
				} ],
				[ "mouseover", function () {
					var entries = $$('.entry', menu),
						i, ii;
					for (i = 0, ii = entries.length; i < ii; ++i) {
						entries[i].classList.remove("focused");
					}
					this.classList.add("focused");
				} ],
				[ "mouseout", function () {
					this.classList.remove("focused");
				} ]
			]);

			$.add(menu, link);
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
		ready: function () {
			Debug.timer("init");

			var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver,
				updater, style;

			Config.site();
			Options.init();

			style = $.create("style", {
				textContent: "#STYLESHEET#"
			});
			$.add(d.head, style);

			Theme.prepare();
			EasyList.init();

			Debug.timer_log("init.ready duration", "init");

			Linkifier.parse_posts(Helper.Post.get_all_posts(d));
			Main.update();

			if (MutationObserver) {
				updater = new MutationObserver(Main.observer);
				updater.observe(d.body, { childList: true, subtree: true });
			}
			else {
				$.on(d.body, "DOMNodeInserted", Main.dom);
			}

			Debug.timer_log("init.ready.full duration", "init");
		},
		init: function () {
			Config.init();
			Debug.init();
			Cache.init();
			Database.init();
			API.init();
			UI.init();
			Debug.timer_log("init duration", timing.start);
			$.ready(Main.ready);
		},
	};

	Main.init();
	Debug.timer_log("init.full duration", timing.start);

})();

