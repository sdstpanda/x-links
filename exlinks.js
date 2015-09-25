/* jshint eqnull:true, noarg:true, noempty:true, eqeqeq:true, bitwise:false, strict:true, undef:true, curly:false, browser:true, devel:true, newcap:false, maxerr:50 */
(function() {
	"use strict";

	var fetch, options, conf, tempconf, pageconf, regex, img, cat, d, t, $, $$,
		Debug, UI, Cache, API, Database, Hash, SHA1, Sauce, Parser, Options, Config, Main,
		Helper, Filter, Theme, EasyList;

	img = {};
	cat = {
		"Artist CG Sets": {"short": "artistcg",  "name": "Artist CG"  },
		"Asian Porn":     {"short": "asianporn", "name": "Asian Porn" },
		"Cosplay":        {"short": "cosplay",   "name": "Cosplay"    },
		"Doujinshi":      {"short": "doujinshi", "name": "Doujinshi"  },
		"Game CG Sets":   {"short": "gamecg",    "name": "Game CG"    },
		"Image Sets":     {"short": "imageset",  "name": "Image Set"  },
		"Manga":          {"short": "manga",     "name": "Manga"      },
		"Misc":           {"short": "misc",      "name": "Misc"       },
		"Non-H":          {"short": "non-h",     "name": "Non-H"      },
		"Private":        {"short": "private",   "name": "Private"    },
		"Western":        {"short": "western",   "name": "Western"    }
	};
	fetch = {
		original: {value: "Original"},
		geHentai: {value: "g.e-hentai.org"},
		exHentai: {value: "exhentai.org"}
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
			'Site to Use':                 ['saucedomain', fetch.exHentai, 'The domain to use for the reverse image search.']
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
		url: /(https?:\/\/)?(forums|gu|g|u)?\.?e[\-x]hentai\.org\/[^\ \n<>\'\"]*/i,
		protocol: /https?\:\/\//,
		site: /(g\.e\-hentai\.org|exhentai\.org)/i,
		gid: /\/g\/([0-9]+)\/([0-9a-f]+)/,
		sid: /\/s\/([0-9a-f]+)\/([0-9]+)\-([0-9]+)/,
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
		return (root || d.body).querySelector(selector);
	};
	$$ = function (selector, root) {
		return Array.prototype.slice.call((root || d.body).querySelectorAll(selector));
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
					if (cn.nodeType === 3) { // TEXT_NODE
						if (!ws.test(cn.nodeValue)) {
							tn.push(cn);
						}
					}
					else if (cn.nodeType === 1) { // ELEMENT_NODE
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
		on: false,
		timer: {},
		value: {},
		init: function () {
			if (conf['Debug Mode'] === true) {
				Debug.on = true;
			}
			$.extend(Debug.timer, {
				start: function (name) {
					if (Debug.on) {
						Debug.timer[name] = Date.now();
					}
				},
				stop: function (name) {
					if (Debug.on) {
						Debug.timer[name] = Date.now() - Debug.timer[name];
						return Debug.timer[name] + 'ms';
					}
				}
			});
			$.extend(Debug.value, {
				add: function (name, value) {
					if (Debug.on) {
						if (!Debug.value[name]) {
							Debug.value[name] = 0;
						}
						if (value) {
							Debug.value[name] += value;
						}
						else {
							++Debug.value[name];
						}
					}
				},
				get: function (name) {
					if (Debug.on) {
						var ret = Debug.value[name];
						Debug.value[name] = 0;
						return ret || 0;
					}
				},
				set: function (name, value) {
					if (Debug.on) {
						Debug.value[name] = value;
					}
				}
			});
		},
		log: function (arr) {
			if (Debug.on) {
				var log = (arr instanceof Array) ? arr : [arr],
					i, ii;
				for (i = 0, ii = log.length; i < ii; ++i) {
					console.log('ExLinks ' + Main.version + ':', log[i]);
				}
			}
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
				node.classList.contains("exbutton")
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
				node.classList.contains("exgallery")
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
				node.classList.contains("exactions")
			) {
				return node;
			}
			return null;
		},
		get_exresults_from_exsauce: function (node) {
			var container = Helper.get_post_container(node);

			if (
				container !== null &&
				(node = $(".exlinks-exsauce-results", container)) !== null &&
				Helper.get_post_container(node) === container
			) {
				return node;
			}
			return null;
		},
		get_post_container: $.extend(function (node) {
			return Helper.get_post_container[Config.mode].call(null, node);
		}, {
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
		}),
		get_url_type: function (url) {
			var m = /t?y?p?e?[\/|\-]([gs])[\/|\ ]/.exec(url); // not sure why most of this is here...
			return (m !== null) ? m[1] : "";
		}
	};
	UI = {
		html: {
			details: function (data, data_alt) { return '#DETAILS#'; },
			actions: function (data, data_alt) { return '#ACTIONS#'; },
			options: function () { return '#OPTIONS#'; },
			stars: function (data) {
				var str = '',
					star = '',
					rating = Math.round(parseFloat(data, 10) * 2),
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
		details: function (uid) {
			var data = Database.get(uid),
				data_alt = {},
				frag, tagspace, content, n;

			if (data.title_jpn) {
				data_alt.jtitle = '<br /><span class="exjptitle">' + data.title_jpn + '</span>';
			}
			else {
				data_alt.jtitle = '';
			}

			data_alt.size = Math.round((data.filesize / 1024 / 1024) * 100) / 100;
			data_alt.datetext = UI.date(new Date(parseInt(data.posted, 10) * 1000));
			data_alt.visible = data.expunged ? 'No' : 'Yes';

			frag = $.frag(UI.html.details(data, data_alt));

			if ((n = $('.extitle', frag)) !== null) {
				Filter.highlight("title", n, data, null);
			}
			if ((n = $('.exuploader', frag)) !== null) {
				Filter.highlight("uploader", n, data, null);
			}

			content = frag.firstChild;
			tagspace = $('.extags', frag);
			content.style.setProperty("display", "table", "important");
			$.add(tagspace, UI.create_tags("exhentai.org", data.tags, data));
			n = $(".exdetails", frag);
			d.body.appendChild(frag);

			// Full info
			if (conf['Extended Info']) {
				API.request_full_info(data.gid, data.token, function (err) {
					if (err === null) {
						UI.display_full(data);
					}
					else {
						Debug.log("Error requesting full information: " + err);
					}
				});
			}

			// Done
			return n;
		},
		actions: function (data, link) {
			var data_alt = {},
				tagstring = data.tags.join(','),
				uid = data.gid,
				token = data.token,
				key = data.archiver_key,
				user, sites, button, div, tagspace, frag, content, n;

			if (conf['Smart Links'] === true) {
				if (regex.fjord.test(tagstring)) {
					if (regex.site_gehentai.test(link.href)) {
						link.href = link.href.replace(regex.site_gehentai, 'exhentai.org');
						if ((button = Helper.get_tag_button_from_link(link)) !== null) {
							button.href = link.href;
							button.textContent = UI.button.text(link.href);
						}
					}
				}
				else {
					if (regex.site_exhentai.test(link.href)) {
						link.href = link.href.replace(regex.site_exhentai, 'g.e-hentai.org');
						if ((button = Helper.get_tag_button_from_link(link)) !== null) {
							button.href = link.href;
							button.textContent = UI.button.text(link.href);
						}
					}
				}
			}

			data_alt.datetext = UI.date(new Date(parseInt(data.posted, 10) * 1000));
			sites = [
				Config.link(link.href, conf['Torrent Link']),
				Config.link(link.href, conf['Hentai@Home Link']),
				Config.link(link.href, conf['Archiver Link']),
				Config.link(link.href, conf['Favorite Link']),
				Config.link(link.href, conf['Uploader Link']),
				Config.link(link.href, conf['Stats Link']),
				Config.link(link.href, conf['Tag Links'])
			];
			user = data.uploader || 'Unknown';
			data_alt.url = {
				ge: "http://g.e-hentai.org/g/" + uid + "/" + token + "/",
				ex: "http://exhentai.org/g/" + uid + "/" + token + "/",
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
			frag = d.createDocumentFragment();
			div = $.frag(UI.html.actions(data, data_alt));

			if ((n = $('.exuploader', div)) !== null) {
				Filter.highlight("uploader", n, data, null);
			}

			content = div.firstChild;
			content.style.setProperty("display", conf['Show by Default'] ? "table" : "none", "important");
			tagspace = $('.extags', div);
			$.add(tagspace, UI.create_tags(sites[6], data.tags, data));
			frag.appendChild(div);
			return frag;
		},
		button: function (url) {
			var button = $.create('a', {
				className: 'exlink exbutton exfetch',
				textContent: UI.button.text(url),
				href: url
			});
			button.style.marginRight = '4px';
			button.style.textDecoration = 'none';
			button.setAttribute('target', '_blank');
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
		show: function () {
			var uid = Helper.get_id_from_node(this),
				details;

			if (uid === null) return;
			details = $.id('exblock-details-uid-' + uid);
			if (details === null) details = UI.details(uid);

			details.style.display = "table";
		},
		hide: function () {
			var uid = Helper.get_id_from_node(this),
				details;

			if (uid === null) return;
			details = $.id('exblock-details-uid-' + uid);
			if (details === null) details = UI.details(uid);

			details.style.display = "none";
		},
		move: function (e) {
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
					className: "extag-block"
				});
				link = $.create("a", {
					textContent: tags[i],
					className: "exlink extag",
					href: "http://" + site + "/tag/" + tags[i].replace(/\ /g, "+"),
					target: "_blank"
				});

				Filter.highlight("tags", link, data, null);

				tag.appendChild(link);
				if (i < ii - 1) tag.appendChild($.tnode(","));
				tagfrag.appendChild(tag);
			}
			return tagfrag;
		},
		display_full: function (data) {
			var nodes = document.querySelectorAll(".extags.exlinks-gid[data-exlinks-gid='" + data.gid + "']"),
				tagfrag = d.createDocumentFragment(),
				namespace, namespace_style, tags, tag, link, site, i, j, n, t, ii;

			if (nodes.length === 0 || Object.keys(data.full.tags).length === 0) return;

			for (namespace in data.full.tags) {
				tags = data.full.tags[namespace];
				namespace_style = " extag-namespace extag-namespace-" + namespace.replace(/\ /g, "-");

				tag = $.create("span", {
					className: "extag-block extag-block-namespace" + Theme.get() + namespace_style
				});
				link = $.create("span", {
					textContent: namespace,
					className: "extag-block-namespace-tag"
				});
				tag.appendChild(link);
				tag.appendChild($.tnode(":"));
				tagfrag.appendChild(tag);

				for (i = 0, ii = tags.length; i < ii; ++i) {
					tag = $.create("span", { className: "extag-block" + namespace_style });
					link = $.create("a", {
						textContent: tags[i],
						className: "exlink extag",
						href: "http://exhentai.org/tag/" + tags[i].replace(/\ /g, "+"),
						target: "_blank"
					});

					Filter.highlight("tags", link, data, null);

					tag.appendChild(link);
					tag.appendChild($.tnode(i === ii - 1 ? ";" : ","));
					tagfrag.appendChild(tag);
				}
			}
			tagfrag.lastChild.removeChild(tagfrag.lastChild.lastChild);

			for (i = 0; i < nodes.length; ) {
				n = nodes[i];
				t = tagfrag;
				++i;

				if (
					(link = n.querySelector("a[href]")) !== null &&
					!regex.site_exhentai.test(link.getAttribute("href"))
				) {
					site = Config.link(link.href, conf['Stats Link']);
					t = (i < nodes.length) ? tagfrag.cloneNode(true) : tagfrag;
					tags = t.querySelectorAll("a[href]");
					for (j = 0; j < tags.length; ++j) {
						tags[j].setAttribute("href", tags[j].getAttribute("href").replace(regex.site_exhentai, site));
					}
				}
				else if (i < nodes.length) {
					t = tagfrag.cloneNode(true);
				}

				n.innerHTML = "";
				n.appendChild(t);
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
					Debug.timer.start('apirequest');
					Debug.log([ 'API Request', request ]);
					GM_xmlhttpRequest({
						method: 'POST',
						url: 'http://g.e-hentai.org/api.php',
						data: JSON.stringify(request),
						headers: {
							'Content-Type': 'application/json'
						},
						onload: function (xhr) {
							var json = null;
							if (xhr.readyState === 4 && xhr.status === 200) {
								json = Helper.json_parse_safe(xhr.responseText) || {};

								if (Object.keys(json).length > 0) {
									Debug.log([ 'API Response, Time: ' + Debug.timer.stop('apirequest'), json ]);
									API.response(type, json);
								}
								else {
									Debug.log('API Request error. Waiting five seconds before trying again. (Time: ' + Debug.timer.stop('apirequest') + ')');
									Debug.log(xhr.responseText);
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
					Main.queue.add(arr[i].gid);
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
		request_full_info: function (id, token, cb) {
			if (Database.check(id)) {
				var data = Database.get(id);
				if (data && API.data_has_full(data)) {
					cb(null, data);
					return;
				}
			}
			if (API.full_timer === null) {
				API.execute_full_request(id, token, cb);
			}
			else {
				API.full_queue.push([ id, token, cb ]);
			}
		},
		on_request_full_next: function () {
			API.full_timer = null;
			if (API.full_queue.length > 0) {
				var d = API.full_queue.shift();
				API.execute_full_request(d[0], d[1], d[2]);
			}
		},
		execute_full_request: function (id, token, cb) {
			var callback = function (err, full_data) {
				API.full_timer = setTimeout(API.on_request_full_next, 200);

				var data = Database.get(id);
				if (data) {
					data.full = full_data;
					Database.set(data);
				}
				else {
					err = "Could not update data";
					data = null;
				}

				cb(err, data);
			};

			Debug.log("Requesting full info for " + id + "/" + token);

			GM_xmlhttpRequest({
				method: 'GET',
				url: 'http://exhentai.org/g/' + id + '/' + token + '/',
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
				par = html.querySelectorAll("#taglist tr"),
				tds, namespace, ns, i, j, m, n;

			for (i = 0; i < par.length; ++i) {
				// Class
				tds = par[i].querySelectorAll("td");
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
					tds = tds[tds.length - 1].querySelectorAll("div");
					for (j = 0; j < tds.length; ++j) {
						// Create tag
						if ((n = tds[j].querySelector("a")) !== null) {
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
				Debug.log("Purged " + ii + " old entries from cache.");
				for (i = 0; i < ii; ++i) {
					Cache.type.removeItem(res[i]);
				}
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
			var key, data, i, ii;
			for (i = 0, ii = Cache.type.length; i < ii; ++i) {
				key = Cache.type.key(i);
				if (new RegExp(Helper.regex_escape(Main.namespace) + "gallery").test(key)) {
					data = Cache.get(/\d+/.exec(key));
					if (data) Database.set(data);
				}
			}
		}
	};
	Database = $.extend({}, {
		check: function (uid) {
			var data;
			if (Database[uid]) {
				return Database[uid].token;
			}
			else {
				data = Cache.get(uid);
				if (data) {
					Database.set(data);
					return data.token;
				}
				return false;
			}
		},
		get: function (uid) { // , debug
			// Use this if you want to break database gets randomly for debugging
			// if (arguments[1] === true && Math.random() > 0.8) return false;
			var data;
			if (Database[uid]) {
				return Database[uid];
			}
			else {
				data = Cache.get(uid);
				if (data) {
					Database.set(data);
					return data;
				}
				return false;
			}
		},
		set: function (data) {
			var uid = data.gid;
			Database[uid] = data;
			Cache.set(data);
		},
		init: function () {
			if (conf['Populate Database on Load'] === true) {
				Cache.load();
			}
		}
	});
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
			toggle: function (event) {
				event.preventDefault();

				var sha1 = this.getAttribute("data-sha1"),
					results = Helper.get_exresults_from_exsauce(this),
					hover;

				if (results !== null) {
					if (results.style.display === "table") {
						results.style.display = "none";
						if (conf['Show Short Results'] === true) {
							$.on(this, [
								[ 'mouseover', Sauce.UI.show ],
								[ 'mousemove', Sauce.UI.move ],
								[ 'mouseout', Sauce.UI.hide ]
							]);
						}
					}
					else {
						results.style.display = "table";
						if (conf['Show Short Results'] === true) {
							$.off(this, [
								[ 'mouseover', Sauce.UI.show ],
								[ 'mousemove', Sauce.UI.move ],
								[ 'mouseout', Sauce.UI.hide ]
							]);
							hover = $.id('exlinks-exsauce-hover-' + sha1);
							if (hover !== null) {
								hover.style.setProperty("display", "none", "important");
							}
						}
					}
				}
			},
			show: function () {
				var sha1 = this.getAttribute("data-sha1"),
					hover = $.id("exlinks-exsauce-hover-" + sha1);

				if (hover === null) hover = Sauce.UI.hover(sha1);
				hover.style.setProperty("display", "table", "important");
			},
			hide: function () {
				var sha1 = this.getAttribute("data-sha1"),
					hover = $.id("exlinks-exsauce-hover-" + sha1);

				if (hover === null) hover = Sauce.UI.hover(sha1);
				hover.style.setProperty("display", "none", "important");
			},
			move: function (event) {
				var sha1 = this.getAttribute("data-sha1"),
					hover = $.id("exlinks-exsauce-hover-" + sha1);

				if (hover === null) hover = Sauce.UI.hover(sha1);
				hover.style.setProperty("display", "table", "important");
				hover.style.left = (event.clientX + 12) + 'px';
				hover.style.top = (event.clientY + 22) + 'px';
			},
			hover: function (sha1) {
				var result = Hash.get(sha1, 'sha1'),
					hover, i, ii;

				hover = $.create('div', {
					className: 'exblock exlinks-exsauce-hover post reply',
					id: 'exlinks-exsauce-hover-' + sha1
				});
				hover.setAttribute("data-sha1", sha1);

				if ((ii = result.length) > 0) {
					i = 0;
					while (true) {
						$.add(hover, $.create("a", {
							className: "exlinks-exsauce-hover-link",
							href: result[i][0],
							textContent: result[i][1]
						}));
						if (++i >= ii) break;
						$.add(hover, $.create("br"));
					}
				}
				hover.style.setProperty("display", "table", "important");
				$.add(d.body, hover);

				return hover;
			}
		},
		format: function (a, result) {
			var count = result.length,
				results, parent, post, i, ii;
			a.classList.add('sauced');
			a.textContent = Sauce.text('Found: ' + count);
			if (count > 0) {
				if (conf['Inline Results'] === true) {
					$.on(a, 'click', Sauce.UI.toggle);
					results = $.create('div', {
						className: 'exblock exlinks-exsauce-results'
					});
					$.add(results, $.create("b", { textContent: "Reverse Image Search Results" }));
					$.add(results, $.tnode(" | View on: "));
					$.add(results, $.create("a", { href: a.href, textContent: Sauce.label(true) }));
					$.add(results, $.create("br"));
					results.style.setProperty("display", conf['Show Results by Default'] ? "table" : "none", "important");
					for (i = 0, ii = result.length; i < ii; ++i) {
						results.appendChild($.tnode(result[i][0]));
						if (i < ii - 1) results.appendChild($.create('br'));
					}
					if (Config.mode === '4chan') {
						parent = a.parentNode.parentNode.parentNode;
						post = $(Parser.postbody, parent);
						$.before(post, results);
					}
					Main.process([results]);
				}
				if (conf['Show Results by Default'] === false) {
					if (conf['Show Short Results'] === true) {
						$.on(a, [
							[ 'mouseover', Sauce.UI.show ],
							[ 'mousemove', Sauce.UI.move ],
							[ 'mouseout', Sauce.UI.hide ]
						]);
					}
				}
			}
			Debug.log('Formatting complete.');
		},
		lookup: function (a, sha1) {
			a.textContent = Sauce.text('Checking');

			GM_xmlhttpRequest({
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
						Debug.log('Lookup successful. Formatting.');
						if (conf['Show Short Results']) Sauce.UI.hover(sha1);
						Sauce.format(a, result);
					}
				}
			});
		},
		hash: function (a, md5) {
			Debug.log('Fetching image ' + a.href);
			a.textContent = Sauce.text('Loading');
			GM_xmlhttpRequest({
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
				Debug.log('SHA-1 hash found.');
				a.setAttribute('data-sha1', sha1);
				a.href = 'http://' + conf['Site to Use'].value + '/?f_doujinshi=1&f_manga=1&f_artistcg=1&f_gamecg=1&f_western=1&f_non-h=1&f_imageset=1&f_cosplay=1&f_asianporn=1&f_misc=1&f_search=Search+Keywords&f_apply=Apply+Filter&f_shash=' + sha1 + '&fs_similar=0';
				if (conf['Search Expunged'] === true) a.href += '&fs_exp=1';
				a.setAttribute('target', '_blank');
				result = Hash.get(sha1, 'sha1');
				if (result) {
					Debug.log('Cached result found. Formatting.');
					Sauce.format(a, result);
				}
				else {
					Debug.log('No cached result found. Performing a lookup.');
					Sauce.lookup(a, sha1);
				}
			}
			else {
				Debug.log('No SHA-1 hash found. Fetching image.');
				Sauce.hash(a, md5);
			}
		},
		click: function (event) {
			event.preventDefault();
			$.off(this, 'click', Sauce.click);
			Sauce.check(this);
		},
		label: function (siteonly) {
			var label = (conf['Site to Use'].value === 'exhentai.org') ? 'ExHentai' : 'E-Hentai';

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
	Parser = {
		postbody: 'blockquote',
		prelinks: 'a:not(.quotelink)',
		links: '.exlink',
		image: '.file',
		unformatted: function (uid) {
			return $$("a.exprocessed.exlinks-gid[data-exlinks-gid='" + uid + "']");
		},
		linkify: function (post) {
			var ws = /^\s*$/,
				nodes = $.textnodes(post),
				node, text, match, linknode, sp, ml, tn, tl, tu, wbr, i, ii;

			if (nodes.length > 0) {
				for (i = 0, ii = nodes.length; i < ii; ++i) {
					node = nodes[i];
					if (regex.url.test(node.textContent)) {
						wbr = i;
						while (nodes[wbr] && nodes[wbr].nextSibling && nodes[wbr].nextSibling.tagName === "WBR") {
							nodes[wbr].parentNode.removeChild(nodes[wbr].nextSibling);
							if (nodes[wbr + 1]) {
								node.textContent += nodes[wbr + 1].textContent;
								nodes[wbr + 1].textContent = "";
							}
							++wbr;
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
						tu = $.create('a');
						tu.className = 'exlink exgallery exunprocessed';
						if (regex.protocol.test(match[0])) {
							tu.href = match[0];
							tu.textContent = match[0];
						}
						else {
							tu.href = 'http://' + match[0];
							tu.textContent = 'http://' + match[0];
						}
						tu.setAttribute('target', '_blank');
						tu.style.textDecoration = 'none';
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
		toggle: function () {
			var option = this,
				type = option.getAttribute('type'),
				domain = {
					"1": fetch.original,
					"2": fetch.geHentai,
					"3": fetch.exHentai
				};

			if (type === 'checkbox') {
				tempconf[option.name] = (option.checked ? true : false);
			}
			else if (type === 'domain' || type === 'saucedomain') {
				tempconf[option.name] = domain[option.value];
			}
			else if (type === 'text' || option.tagName === "TEXTAREA") {
				tempconf[option.name] = option.value;
			}
		},
		open: function () {
			pageconf = JSON.parse(JSON.stringify(tempconf));

			var overlay = $.frag(UI.html.options()),
				over = overlay.firstChild,
				frag = d.createDocumentFragment(),
				gen;

			frag.appendChild(overlay);
			$.add(d.body, frag);
			$.on($.id('exlinks-options-save'), 'click', Options.save);
			$.on($.id('exlinks-options-cancel'), 'click', Options.close);
			$.on(over, 'click', Options.close);
			$.on($.id('exlinks-options'), 'click', function (e) { e.stopPropagation(); });
			d.body.style.overflow = 'hidden';

			gen = function (target, obj) {
				var desc, tr, type, value, i;
				for (i in obj) {
					desc = obj[i][2];
					type = obj[i][0];
					value = tempconf[i];
					tr = $.create('tr');
					if (type === 'checkbox') {
						tr.innerHTML = [
							'<td style="padding:3px;">',
							'<input style="float:right;margin-right:2px;" type="checkbox" id="' + i + '" name="' + i + '"' + (value ? ' checked' : '') + ' />',
							'<label for="' + i + '"><b>' + i + ':</b> ' + desc + '</label>',
							'</td>'
						].join('');
						$.on($('input', tr), 'change', Options.toggle);
					}
					else if (type === 'domain') {
						tr.innerHTML = [
							'<td style="padding:3px;">',
							'<select name="' + i + '" type="domain" style="font-size:0.92em!important;float:right;width:18%;">',
								'<option value="1"' + (value.value === 'Original' ? ' selected' : '') + '>Original</option>',
								'<option value="2"' + (value.value === 'g.e-hentai.org' ? ' selected' : '') + '>g.e-hentai.org</option>',
								'<option value="3"' + (value.value === 'exhentai.org' ? ' selected' : '') + '>exhentai.org</option></select>',
							'<b>' + i + ':</b> ' + desc + '</td>'
						].join('');
						$.on($('select', tr), 'change', Options.toggle);
					}
					else if (type === 'saucedomain') {
						tr.innerHTML = [
							'<td style="padding:3px;">',
							'<select name="' + i + '" type="domain" style="font-size:0.92em!important;float:right;width:18%;">',
								'<option value="2"' + (value.value === 'g.e-hentai.org' ? ' selected' : '') + '>g.e-hentai.org</option>',
								'<option value="3"' + (value.value === 'exhentai.org' ? ' selected' : '') + '>exhentai.org</option></select>',
							'<b>' + i + ':</b> ' + desc + '</td>'
						].join('');
						$.on($('select', tr), 'change', Options.toggle);
					}
					else if (type === 'textbox') {
						tr.innerHTML = [
							'<td style="padding:3px;">',
							'<input style="float:right;padding-left:5px;width:18%;font-size:0.92em!important;" type="text" id="' + i + '" name="' + i + '" />',
							'<b>' + i + ':</b> ' + desc + '</td>'
						].join('');
						$('input', tr).value = value;
						$.on($('input', tr), 'input', Options.toggle);
					}
					else if (type === 'textarea') {
						tr.innerHTML = [
							'<td style="padding:3px;">',
							'<b>' + i + ':</b> ' + desc + '<br />',
							'<textarea style="display:block;width:100%;height:7em;line-height:1.2em;padding:0.5em;box-sizing:border-box;resize:vertical;font-size:0.92em!important;" wrap="off" autocomplete="off" spellcheck="false" id="' + i + '" name="' + i + '"></textarea>',
							'</td>'
						].join('');
						$('textarea', tr).value = value;
						$.on($('textarea', tr), 'input', Options.toggle);
					}
					$.add(target, tr);
				}
			};

			gen($.id('exlinks-options-general'), options.general);
			gen($.id('exlinks-options-actions'), options.actions);
			gen($.id('exlinks-options-sauce'), options.sauce);
			gen($.id('exlinks-options-domains'), options.domains);
			gen($.id('exlinks-options-debug'), options.debug);
			gen($.id('exlinks-options-filter'), options.filter);
			$.on($("input.exlinks-options-color-input[type=color]"), 'change', Filter.settings_color_change);
		},
		init: function () {
			var oneechan = $.id('OneeChanLink'),
				chanss = $.id('themeoptionsLink'),
				conflink, conflink2, arrtop, arrbot;

			Main["4chanX3"] = d.documentElement.classList.contains("fourchan-x");
			conflink = $.create('a', { title: 'ExLinks Settings', className: 'exlinksOptionsLink entry' });
			$.on(conflink, 'click', Options.open);

			if (Config.mode === '4chan') {
				if (oneechan) {
					conflink.setAttribute('style', 'position: fixed; background: url(' + img.options + '); top: 108px; right: 10px; left: auto; width: 15px; height: 15px; opacity: 0.75; z-index: 5;');
					$.on(conflink, [
						[ 'mouseover', function () { this.style.opacity = 1.0; } ],
						[ 'mouseout', function () { this.style.opacity = 0.65; } ]
					]);
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
					conflink.setAttribute('style', 'cursor: pointer; ' + (conflink.getAttribute('style') || ""));
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
				conflink.setAttribute('style', 'cursor: pointer; text-decoration: underline;');
				arrtop = [ $.tnode(' [ '), conflink, $.tnode(' ] ') ];
				$.checked.add($('div'), $.elem(arrtop));
			}
			else if (Config.mode === 'foolz') {
				conflink.textContent = 'ExLinks Options';
				conflink.setAttribute('style', 'cursor: pointer;');
				arrtop = [ $.tnode(' [ '), conflink, $.tnode(' ] ') ];
				$.checked.add($('.letters'), $.elem(arrtop));
			}
			else if (Config.mode === '38chan') {
				conflink.textContent = 'exlinks options';
				conflink.setAttribute('style', 'cursor: pointer;');
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
		mode: '4chan', // foolz, fuuka, 38chan
		link: function (url, opt) {
			if (opt.value === "Original") {
				if (regex.site_exhentai.test(url)) return 'exhentai.org';
				if (regex.site_gehentai.test(url)) return 'g.e-hentai.org';
				return false;
			}
			if (opt.value === "g.e-hentai.org") return opt.value;
			return 'exhentai.org';
		},
		site: function () {
			var curSite = document.URL,
				curDocType = document.doctype,
				curType;

			if (/archive\.moe/i.test(curSite)) {
				curType = [
					"<!DOCTYPE ",
					curDocType.name,
					(curDocType.publicId ? ' PUBLIC "' + curDocType.publicId + '"' : ''),
					(!curDocType.publicId && curDocType.systemId ? ' SYSTEM' : ''),
					(curDocType.systemId ? ' "' + curDocType.systemId + '"' : ''),
					'>'
				].join('');

				if (/<!DOCTYPE html>/.test(curType)) {
					Config.mode = 'foolz';
					Parser.postbody = '.text';
					Parser.prelinks = 'a:not(.backlink)';
					Parser.image = '.thread_image_box';
				}
				else {
					Config.mode = 'fuuka';
					Parser.image = '.thumb';
				}
			}
			else if (/boards\.38chan\.net/i.test(curSite)) {
				Config.mode = '38chan';
				Parser.postbody = '.post:not(.hidden)>.body';
				Parser.prelinks = 'a:not([onclick])';
				Parser.image = '.fileinfo';
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
					node.appendChild(n2);
				}
				return Filter.hl_return(n1.classList.contains("exfilter-bad"), node);
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
					frag.appendChild($.tnode(t));
				}
				else {
					n1 = $.create("span", { className: "exfilter-text" });
					n2 = $.create("span", { className: "exfilter-text-inner" });
					n2.textContent = t;
					n1.appendChild(n2);
					frag.appendChild(n1);
					Filter.apply_styles(n1, segment.data);
				}
			}

			// Replace
			node.innerHTML = "";
			node.appendChild(frag);
			if (cache !== undefined) {
				cache[text] = node;
			}
			return Filter.hl_return(info.bad, node);
		},
		highlight_tag: function (node, link, filter_data) {
			if (filter_data[0] === Filter.Bad) {
				node.classList.add("exfilter-bad");
				link.classList.add("exfilter-bad");
				link.classList.remove("exfilter-good");
			}
			else {
				node.classList.add("exfilter-good");
				link.classList.add("exfilter-good");
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
				n1 = $.create("span", { className: "exfilter-text" });
				n2 = $.create("span", { className: "exfilter-text-inner" });
				while ((n = node.firstChild) !== null) {
					n2.appendChild(n);
				}
				n1.appendChild(n2);
				node.appendChild(n1);
				Filter.apply_styling(n1, color, background, underline);
			}
		},
		hl_return: function (bad, node) {
			if (bad) {
				node.classList.add("exfilter-bad");
				return Filter.Bad;
			}
			else {
				node.classList.add("exfilter-good");
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
		prepare: function (first) {
			Theme.update(!first);

			var add_mo = function (nodes, init, callback) {
				var MO = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver,
					mo, i;

				if (!MO) return;

				mo = new MO(callback);
				for (i = 0; i < nodes.length; ++i) {
					mo.observe(nodes[i], init);
				}
			};

			add_mo([document.head], { childList: true }, function (records) {
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
					var nodes = document.querySelectorAll("extheme"),
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
			var doc_el = document.documentElement,
				body = document.querySelector("body"),
				n = document.createElement("div"),
				color, colors, i, j, a, a_inv;

			if (!body || !doc_el) {
				return null;
			}

			n.className = "post reply post_wrapper";
			body.appendChild(n);

			color = Theme.parse_css_color(window.getComputedStyle(doc_el).backgroundColor);
			colors = [
				Theme.parse_css_color(window.getComputedStyle(body).backgroundColor),
				Theme.parse_css_color(window.getComputedStyle(n).backgroundColor),
			];

			body.removeChild(n);

			for (i = 0; i < colors.length; ++i) {
				a = colors[i][3];
				a_inv = (1.0 - a) * color[3];

				for (j = 0; j < 3; ++j) {
					color[j] = (color[j] * a_inv + colors[i][j] * a);
				}
				color[3] = Math.max(color[3], a);
			}

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
				n1, n2, n3, i, ii;

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
					if ((n1 = navlink.lastChild) !== null && n1.nodeType === 3) { // TEXT_NODE
						n1.nodeValue = n1.nodeValue.replace(/\]\s*$/, "]") + " [";
					}
					else {
						$.add(navlink, $.tnode("["));
					}

					n2 = $.create("a", {
						className: "exlinks-easy-list-link",
						textContent: link_mod("ExLinks Easy List", true),
						style: "cursor: pointer;"
					});

					$.add(navlink, n2);
					$.add(navlink, $.tnode("]"));
				}
				else {
					// Mobile
					n1 = $.create("div", {
						className: "mobile",
						style: "text-align: center; margin: 0.5em 0;"
					});
					n2 = $.create("span", {
						className: "mobileib button exlinks-easy-list-button"
					});
					n3 = $.create("a", {
						textContent: link_mod("Easy List", false)
					});
					$.add(n2, n3);
					$.add(n1, n2);
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
			n2 = $.create("div", {
				className: "ex-easylist-content-align"
			});
			$.add(n1, n2);

			// Content
			n3 = $.create("div", {
				className: "ex-easylist-content"
			});
			$.add(n2, n3);

			n4 = $.create("div", {
				className: "ex-easylist-content-inner post reply postContainer post_wrapper" + theme
			});
			$.on(n4, "click", EasyList.on_overlay_content_mouse_event);
			$.on(n4, "mousedown", EasyList.on_overlay_content_mouse_event);
			$.add(n3, n4);
			n3 = n4;

			$.add(n3, n4 = $.create("div", {
				className: "ex-easylist-title"
			}));

			n5 = $.create("span", {
				className: "ex-easylist-title-text",
				textContent: "ExLinks Easy List"
			});
			$.add(n4, n5);
			n5 = $.create("span", {
				className: "ex-easylist-subtitle",
				textContent: "More porn, less hassle"
			});
			$.add(n4, n5);

			// Close
			$.add(n3, n4 = $.create("div", { className: "ex-easylist-control-links" }));

			$.add(n4, n5 = $.create("a", {
				className: "ex-easylist-control-link ex-easylist-control-link-options",
				textContent: "options"
			}));
			$.on(n5, "click", EasyList.on_options_click);

			$.add(n4, n5 = $.create("a", {
				className: "ex-easylist-control-link",
				textContent: "close"
			}));
			$.on(n5, "click", EasyList.on_close_click);

			$.add(n3, $.create("div", { className: "ex-easylist-title-line" }));

			// Options
			EasyList.options_container = EasyList.create_options(theme);
			$.add(n3, EasyList.options_container);

			// Empty notification
			n4 = $.create("div", {
				className: "ex-easylist-empty-notification ex-easylist-empty-notification-visible",
				textContent: "No galleries found"
			});
			$.add(n3, n4);
			EasyList.empty_notification = n4;

			// Items list
			n4 = $.create("div", { className: "ex-easylist-items" + theme });
			$.add(n3, n4);
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
				n.appendChild(EasyList.overlay);
			}
			d.documentElement.classList.add("ex-easylist-overlaying");

			// Focus
			n = document.createElement("textarea");
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
				EasyList.overlay.parentNode.removeChild(EasyList.overlay);
			}
			d.documentElement.classList.remove("ex-easylist-overlaying");

			EasyList.set_options_visible(false);

			Main.off_linkify(EasyList.on_linkify);
		},
		populate: function () {
			EasyList.on_linkify(Main.get_linkified_links());
			Main.on_linkify(EasyList.on_linkify);
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
		create_gallery_nodes: function (data, theme, index) {
			var site = "exhentai.org",
				url_base = "http://" + site,
				url = url_base + "/g/" + data.gid + "/" + data.token + "/",
				hl_res, n1, n2, n3, n4, n5, n6, n7, i;

			n1 = $.create("div", { className: "ex-easylist-item" + theme });
			n1.setAttribute("data-index", index);
			n1.setAttribute("data-gid", data.gid);
			n1.setAttribute("data-token", data.token);
			n1.setAttribute("data-rating", data.rating);
			n1.setAttribute("data-date-uploaded", data.posted);
			n1.setAttribute("data-category", data.category.toLowerCase());
			n1.setAttribute("data-site", site);

			$.add(n1, n2 = $.create("div", { className: "ex-easylist-item-table-container" + theme }));
			$.add(n2, n3 = $.create("div", { className: "ex-easylist-item-table" + theme }));
			n2 = n3;
			$.add(n2, n3 = $.create("div", { className: "ex-easylist-item-row" + theme }));
			$.add(n3, n4 = $.create("div", { className: "ex-easylist-item-cell ex-easylist-item-cell-image" + theme }));

			// Image
			$.add(n4, n5 = $.create("a", {
				className: "ex-easylist-item-image-container" + theme,
				href: url,
				target: "_blank"
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

			$.add(n5, n6 = $.create("a", {
				className: "ex-easylist-item-title-tag-link" + theme,
				textContent: UI.button.text(site),
				href: url,
				target: "_blank"
			}));
			n6.setAttribute("data-original", n6.textContent);

			$.add(n5, n6 = $.create("a", {
				className: "ex-easylist-item-title-link" + theme,
				textContent: Helper.normalize_api_string(data.title),
				href: url,
				target: "_blank"
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
			$.add(n5, n6 = $.create("a", {
				className: "ex-easylist-item-uploader" + theme,
				textContent: data.uploader,
				href: url_base + "/uploader/" + data.uploader,
				target: "_blank"
			}));
			n6.setAttribute("data-original", n6.textContent);
			$.add(n5, $.tnode(" on "));
			$.add(n5, $.create("span", {
				className: "ex-easylist-item-upload-date" + theme,
				textContent: UI.date(new Date(parseInt(data.posted, 10) * 1000))
			}));

			$.add(n4, n5 = $.create("div", { className: "ex-easylist-item-tags" + theme }));

			n6 = EasyList.create_full_tags(site, data, theme);
			$.add(n5, n6[0]);
			if (!n6[1]) {
				$.on(n1, "mouseover", EasyList.on_gallery_mouseover);
			}


			// Right sidebar
			$.add(n3, n4 = $.create("div", { className: "ex-easylist-item-cell ex-easylist-item-cell-side" + theme }));

			$.add(n4, n5 = $.create("div", {
				className: "ex-easylist-item-info" + theme,
			}));

			$.add(n5, n6 = $.create("a", {
				className: "ex-easylist-item-info-button exlinks-btn exlinks-btn-eh exlinks-btn-" + cat[data.category].short + theme,
				href: url_base + "/" +  cat[data.category].short,
				target: "_blank"
			}));
			$.add(n6, $.create("div", {
				className: "exlinks-noise",
				textContent: cat[data.category].name
			}));


			$.add(n5, n6 = $.create("div", {
				className: "ex-easylist-item-info-item ex-easylist-item-info-item-rating" + theme
			}));
			$.add(n6, $.create("div", {
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
		create_full_tags: function (site, data, theme) {
			var url_base = "http://" + site,
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
					namespace_style = " extag-namespace extag-namespace-" + namespace.replace(/\ /g, "-");
					$.add(n2, n3 = $.create("div", {
						className: "ex-easylist-item-tag-cell ex-easylist-item-tag-cell-label" + theme
					}));
					$.add(n3, n4 = $.create("span", {
						className: "extag-block-namespace extag-block-namespace-no-outline" + namespace_style + theme
					}));
					$.add(n4, $.create("span", {
						textContent: namespace,
						className: "extag-block-namespace-tag"
					}));
					$.add(n3, $.tnode(":"));
				}

				$.add(n2, n3 = $.create("div", {
					className: "ex-easylist-item-tag-cell" + theme
				}));
				n2 = n3;

				for (i = 0, ii = tags.length; i < ii; ++i) {
					$.add(n2, n3 = $.create("span", {
						className: "extag-block" + namespace_style
					}));
					$.add(n3, n4 = $.create("a", {
						textContent: tags[i],
						className: "exlink extag extag-color-inherit ex-easylist-item-tag",
						href: url_base + "/tag/" + tags[i].replace(/\ /g, "+"),
						target: "_blank"
					}));
					n4.setAttribute("data-original", n4.textContent);

					if (i < ii - 1) $.add(n3, $.tnode(","));
				}
			}

			return [ n1, namespace !== "" ];
		},
		add_gallery: function (gid, theme) {
			var data = Database.get(gid),
				info, n;

			delete EasyList.queue_map[gid];

			if (data !== null) {
				n = EasyList.create_gallery_nodes(data, theme, EasyList.current.length);
				info = {
					gid: gid,
					node: n
				};

				EasyList.current_map[gid] = info;
				EasyList.current.push(info);

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
				if ((n2 = n.querySelector(".ex-easylist-item-image-index")) !== null) {
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
				nodes = node.querySelectorAll(targets[i][0]);
				mode = targets[i][1];
				results = targets[i][2];
				for (j = 0, jj = nodes.length; j < jj; ++j) {
					n = nodes[j];
					if (!first) {
						n.textContent = n.getAttribute("data-original") || "";
						n.classList.remove("exfilter-good");
						n.classList.remove("exfilter-bad");
					}
					Filter.highlight(mode, n, data, results, EasyList.custom_filters);
				}
			}

			if (!tags_only) {
				link = node.querySelector(".ex-easylist-item-title-link");
				n = node.querySelector(".ex-easylist-item-title-tag-link");

				if (link !== null && n !== null) {
					if (!first) {
						n.textContent = n.getAttribute("data-original") || "";
						n.classList.remove("exfilter-good");
						n.classList.remove("exfilter-bad");
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
				if (data) {
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
				tags_container = this.querySelector(".ex-easylist-item-tags"),
				gid = this.getAttribute("data-gid") || "",
				token = this.getAttribute("data-token") || "";

			API.request_full_info(gid, token, function (err, data) {
				if (err === null && tags_container !== null) {
					var site, n, hl_res;
					site = node.getAttribute("data-site") || "";
					n = EasyList.create_full_tags(site, data, Theme.get());
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
						EasyList.queue_map[uid] = true;
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
		namespace: 'exlinks-',
		version: '#VERSION#',
		linkify_event: {
			queue: [],
			listeners: []
		},
		check: function (uid) {
			var check = Database.check(uid),
				links, link, type, token, page, i, ii;

			if (check) {
				Main.queue.add(uid);
				return [ uid, 'f' ];
			}

			links = Parser.unformatted(uid);
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
					console.log("page&&token",type,page,token);
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
		format: function (queue) {
			Debug.timer.start('format');
			Debug.value.set('failed', 0);

			var failed = {},
				failtype = [],
				uid, links, link, button, data, actions, failure, hl, i, ii, j, jj, k, c;

			for (i = 0, ii = queue.length; i < ii; ++i) {
				uid = queue[i];
				data = Database.get(uid);
				links = Parser.unformatted(uid);
				if (data) {
					if (!data.hasOwnProperty('error')) {
						Debug.value.add('formatlinks');
						for (j = 0, jj = links.length; j < jj; ++j) {
							link = links[j];

							// Button
							button = Helper.get_tag_button_from_link(link);
							if (button !== null) {
								if ((hl = Filter.check(link, data))[0] !== Filter.None) {
									c = (hl[0] === Filter.Good) ? conf['Good Tag Marker'] : conf['Bad Tag Marker'];
									button.textContent = button.textContent.replace(/\]\s*$/, c + "]");
									Filter.highlight_tag(button, link, hl);
								}
								$.off(button, 'click', Main.singlelink);
								if (conf['Gallery Actions'] === true) {
									$.on(button, 'click', UI.toggle);
								}
								button.classList.remove('exfetch');
								button.classList.add('extoggle');
							}

							// Link title
							link.textContent = Helper.normalize_api_string(data.title);
							if (conf['Gallery Details'] === true) {
								$.on(link, [
									[ 'mouseover', UI.show ],
									[ 'mouseout', UI.hide ],
									[ 'mousemove', UI.move ]
								]);
							}
							actions = UI.actions(data, link);
							$.after(link, actions);
							actions = Helper.get_actions_from_link(link, false);
							if (actions !== null) {
								if (conf['Torrent Popup'] === true) {
									$.on($('a.extorrent', actions), 'click', UI.popup);
								}
								if (conf['Archiver Popup'] === true) {
									$.on($('a.exarchiver', actions), 'click', UI.popup);
								}
								if (conf['Favorite Popup'] === true) {
									$.on($('a.exfavorite', actions), 'click', UI.popup);
								}
							}
							link.classList.remove('exprocessed');
							link.classList.add('exformatted');
						}
					}
					else {
						for (j = 0, jj = links.length; j < jj; ++j) {
							link = links[j];

							button = Helper.get_tag_button_from_link(link);
							if (button !== null) {
								$.off(button, 'click', Main.singlelink);
								button.classList.remove('exfetch');
								button.classList.add('extoggle');
							}

							link.textContent = 'Incorrect Gallery Key';
							link.classList.remove('exprocessed');
							link.classList.add('exformatted');
						}
					}
					Main.queue_linkify_event(links, data);
				}
				else {
					Debug.value.add('failed');
					failed[uid] = true;
				}
			}

			Main.queue.clear();
			Debug.log('Formatted IDs: ' + Debug.value.get('formatlinks') + ' OK, ' + Debug.value.get('failed') + ' FAIL. Time: ' + Debug.timer.stop('format'));
			if (Object.keys(failed).length > 0) {
				for (k in failed) {
					failure = Main.check(parseInt(k, 10));
					if (failure !== null) {
						failtype.push(failure[0]);
						failtype.push(failure[1]);
					}
				}
				Debug.log([failtype]);
				Main.update();
			}

			Main.trigger_linkify_event();
		},
		queue: function () {
			var arr = [],
				obj = Main.queue.list,
				i = 0,
				k;
			for (k in obj) {
				arr[i++] = parseInt(k, 10);
			}
			return arr;
		},
		update: function () {
			var queue = Main.queue();
			if (!API.working) {
				if (API.queue('s')) {
					API.request('s');
				}
				else if (API.queue('g')) {
					API.request('g');
				}
			}
			if (queue.length > 0) {
				Main.format(queue);
				Main.queue.clear();
			}
		},
		singlelink: function (e) {
			e.preventDefault();
			var n = Helper.get_link_from_tag_button(this);
			if (n !== null) {
				Main.single(n);
				Main.update();
			}
		},
		single: function (link) {
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
						Main.queue.add(uid);
					}
					else {
						API.queue.add("s", uid, page_token, page);
					}
				}
			}
			if (type === "g") {
				if (Database.check(uid)) {
					Main.queue.add(uid);
				}
				else {
					if (token) {
						API.queue.add('g', uid, token);
					}
				}
			}
		},
		process: function (posts) {
			var post, file, info, sauce, exsauce, md5, sha1, results,
				actions, prelinks, prelink, links, link, site, prevent,
				type, gid, sid, uid, button, linkified, isJPG, i, ii, j, jj;

			Debug.timer.start('process');
			Debug.value.set('post_total', posts.length);

			prevent = function (e) {
				e.preventDefault();
				return false;
			};

			for (i = 0, ii = posts.length; i < ii; ++i) {
				post = posts[i];
				if (conf.ExSauce === true) {
					// Needs redoing to make life easier with archive
					if (!post.classList.contains('exlinks-exsauce-results')) {
						if ($(Parser.image, post.parentNode)) {
							if (Config.mode === '4chan') {
								file = $(Parser.image, post.parentNode);
								if (file.childNodes.length > 1) {
									info = file.childNodes[0];
									md5 = file.childNodes[1].firstChild.getAttribute('data-md5');
									isJPG = /\.jpg$/i.test(file.childNodes[1].href);
									if (md5) {
										md5 = md5.replace('==', '');
										sauce = $('.exsauce', info);
										if (!sauce) {
											exsauce = $.create('a', {
												textContent: Sauce.label(false),
												className: 'exsauce',
												href: file.childNodes[1].href
											});
											if (conf['No Underline on Sauce']) {
												exsauce.classList.add('exsauce-no-underline');
											}
											exsauce.setAttribute('data-md5', md5);
											if (isJPG) {
												exsauce.classList.add('exsauce-disabled');
												$.on(exsauce, 'click', prevent);
												exsauce.title = "Reverse Image Search doesn't work for JPG images because 4chan manipulates them on upload. There is nothing ExLinks can do about this. All complaints can be directed at 4chan staff.";
											}
											else {
												$.on(exsauce, 'click', Sauce.click);
											}
											$.add(info, $.tnode(" "));
											$.add(info, exsauce);
										}
										else if (!isJPG) {
											if (!sauce.classList.contains('sauced')) {
												$.on(sauce, 'click', Sauce.click);
											}
											else {
												sha1 = sauce.getAttribute('data-sha1');
												if (conf['Show Short Results'] === true) {
													if (conf['Inline Results'] === true) {
														results = Helper.get_exresults_from_exsauce(sauce);
														if (results !== null && results.style.display === 'none') {
															$.on(sauce, [
																[ 'mouseover', Sauce.UI.show ],
																[ 'mousemove', Sauce.UI.move ],
																[ 'mouseout', Sauce.UI.hide ]
															]);
														}
													}
													else {
														$.on(sauce, [
															[ 'mouseover', Sauce.UI.show ],
															[ 'mousemove', Sauce.UI.move ],
															[ 'mouseout', Sauce.UI.hide ]
														]);
													}
												}
												if (conf['Inline Results'] === true) {
													$.on(sauce, 'click', Sauce.UI.toggle);
													if (conf['Hide Results in Quotes'] === true) {
														results = Helper.get_exresults_from_exsauce(sauce);
														if (results !== null) {
															results.style.setProperty("display", "none", "important");
														}
													}
												}
											}
										}
									}
								}
							}
							// else if (Config.mode === 'fuuka') // A WORLD OF PAIN
							// else if (Config.mode === 'foolz') // AWAITS
							// else if (Config.mode === '38chan') // Man, why doesn't Tinychan even have md5 hashes for images?
						}
					}
				}

				if (regex.url.test(post.innerHTML)) {
					Debug.value.add('posts');

					if (conf['Hide in Quotes']) {
						actions = $$('.exactions', post);
						for (j = 0, jj = actions.length; j < jj; ++j) {
							if (actions[j].display === "inline-block") {
								actions[j].display = "none";
							}
						}
					}
					if (!post.classList.contains('exlinkified')) {
						Debug.value.add('linkified');
						linkified = true;

						prelinks = $$(Parser.prelinks, post);
						if (prelinks) {
							for (j = 0, jj = prelinks.length; j < jj; ++j) {
								prelink = prelinks[j];
								if (regex.url.test(prelink.href)) {
									prelink.classList.add('exlink');
									prelink.classList.add('exgallery');
									prelink.classList.add('exunprocessed');
									prelink.style.textDecoration = 'none';
									prelink.setAttribute('target', '_blank');
								}
							}
						}
						Parser.linkify(post);
						post.classList.add('exlinkified');
					}
					links = $$('a.exlink', post);
					for (j = 0, jj = links.length; j < jj; ++j) {
						link = links[j];
						if (link.classList.contains('exbutton')) {
							if (link.classList.contains('extoggle')) {
								if (conf['Gallery Actions'] === true) {
									$.on(link, 'click', UI.toggle);
								}
							}
							if (link.classList.contains('exfetch')) {
								$.on(link, 'click', Main.singlelink);
							}
						}
						if (link.classList.contains('exaction')) {
							if (link.classList.contains('extorrent')) {
								if (conf['Torrent Popup'] === true) {
									$.on(link, 'click', UI.popup);
								}
							}
							if (link.classList.contains('exarchiver')) {
								if (conf['Archiver Popup'] === true) {
									$.on(link, 'click', UI.popup);
								}
							}
							if (link.classList.contains('extorrent')) {
								if (conf['Favorite Popup'] === true) {
									$.on(link, 'click', UI.popup);
								}
							}
						}
						if (link.classList.contains('exgallery')) {
							if (link.classList.contains('exunprocessed')) {
								site = conf['Gallery Link'];
								if (site.value !== "Original") {
									if (!new RegExp(site.value).test(link.href)) {
										link.href = link.href.replace(regex.site, site.value);
									}
								}
								type = Helper.get_url_type(link.href);
								if (type === 's') {
									sid = regex.sid.exec(link.href);
									if (sid) {
										link.setAttribute("data-exlinks-type", "s");
										link.setAttribute("data-exlinks-gid", sid[2]);
										link.setAttribute("data-exlinks-page", sid[3]);
										link.setAttribute("data-exlinks-page-token", sid[1]);
										link.classList.add("exlinks-type");
										link.classList.add("exlinks-gid");
										link.classList.add("exlinks-page");
										link.classList.add("exlinks-page-token");
										uid = sid[2];
									}
									else {
										type = null;
									}
								}
								else if (type === 'g') {
									gid = regex.gid.exec(link.href);
									if (gid) {
										link.setAttribute("data-exlinks-type", "g");
										link.setAttribute("data-exlinks-gid", gid[1]);
										link.setAttribute("data-exlinks-token", gid[2]);
										link.classList.add("exlinks-type");
										link.classList.add("exlinks-gid");
										link.classList.add("exlinks-token");
										uid = gid[1];
									}
									else {
										type = null;
									}
								}
								link.classList.remove('exunprocessed');
								if (type) {
									link.classList.add('exprocessed');
									button = UI.button(link.href);
									$.on(button, 'click', Main.singlelink);
									$.before(link, button);
								}
								else {
									link.classList.remove('exgallery');
								}
							}
							if (link.classList.contains('exprocessed')) {
								if (conf['Automatic Processing'] === true) {
									Main.single(link);
									Debug.value.add('processed');
								}
							}
							if (link.classList.contains('exformatted')) {
								if (conf['Gallery Details'] === true) {
									$.on(link, [
										[ 'mouseover', UI.show ],
										[ 'mouseout', UI.hide ],
										[ 'mousemove', UI.move ]
									]);
								}
							}
						}
						if (link.classList.contains('exfavorite')) {
							if (conf['Favorite Autosave']) {
								$.on(link, 'click', UI.favorite);
							}
						}
					}
				}

			}

			Debug.log('Total posts: ' + Debug.value.get('post_total') + ' Linkified: ' + Debug.value.get('linkified') + ' Processed: ' + Debug.value.get('posts') + ' Links: ' + Debug.value.get('processed') + ' Time: ' + Debug.timer.stop('process'));
			Main.update();
		},
		dom: function (event) {
			var node = event.target,
				nodelist = [];

			if (node.nodeName === 'DIV') {
				if (node.classList.contains('postContainer') || node.classList.contains('inline')) {
					nodelist.push($(Parser.postbody, node));
				}
			}
			else if (node.nodeName === 'ARTICLE') {
				if (node.classList.contains('post')) {
					nodelist.push($(Parser.postbody, node));
				}
			}
			if (nodelist.length > 0) {
				Main.process(nodelist);
			}
		},
		observer: function (m) {
			var nodelist = [];

			m.forEach(function (e) {
				var nodes, node, menu, conflink, i, ii;

				if (e.addedNodes) {
					nodes = e.addedNodes;
					for (i = 0, ii = nodes.length; i < ii; ++i) {
						node = nodes[i];
						if (node.nodeName === 'DIV') {
							if (node.classList.contains('postContainer') || node.classList.contains('inline')) {
								nodelist.push($(Parser.postbody, node));
							}
							else if (node.classList.contains('thread')) { // support 4chan's new index pages
								nodelist = nodelist.concat($$(Parser.postbody, node));
							}
						}
						else if (node.nodeName === 'ARTICLE') {
							if (node.classList.contains('post')) {
								nodelist.push($(Parser.postbody, node));
							}
						}
					}
				}

				// 4chan X specific hacks.
				if (Main["4chanX3"]) {
					// detect when source links are added.
					if (e.target.classList.contains("fileText")) {
						if (
							e.previousSibling &&
							e.previousSibling.classList &&
							e.previousSibling.classList.contains("file-info")
						) {
							node = e.target;
							while (node) {
								if (
									node.classList.contains("postContainer") ||
									node.classList.contains("inline")
								) {
									break;
								}
								node = node.parentNode;
								if (node.nodeName === 'BODY') {
									node = null;
									break;
								}
							}
							if (node) nodelist.push($(Parser.postbody, node));
						}
					}
				}

				// Detect 4chan X's linkification muck-ups
				if (e.addedNodes.length > 0) {
					nodes = e.addedNodes;
					for (i = 0, ii = nodes.length; i < ii; ++i) {
						node = nodes[i];
						if (node.nodeName === 'A' && node.classList.contains('linkified')) {
							if (
								regex.url.test(node.innerHTML) &&
								node.previousSibling.classList.contains('exbutton')
							) {
								node.className = "exlink exgallery exunprocessed";
								$.remove(node.previousSibling);
								while (node) {
									if (
										node.classList.contains("postContainer") ||
										node.classList.contains("inline")
									) {
										break;
									}
									node = node.parentNode;
									if (node.nodeName === 'BODY') {
										node = null;
										break;
									}
								}
								if (node) nodelist.push($(Parser.postbody, node));
							}
						}
					}
				}

				// Add menu button back in whenever the menu is opened.
				if (
					e.addedNodes.length &&
					e.addedNodes[0].id === "menu" &&
					e.addedNodes[0].parentNode.parentNode.parentNode.parentNode.id === "header-bar"
				) {
					menu = e.addedNodes[0];
					conflink = $.create('a', {
						className: 'exlinksOptionsLink entry',
						textContent: "ExLinks Settings"
					});
					$.on(conflink, 'click', function () {
						$.remove(menu);
						Options.open();
					});
					$.on(conflink, 'mouseover', function () {
						var entries = $$('.entry', menu),
							i, ii;
						for (i = 0, ii = entries.length; i < ii; ++i) {
							entries[i].classList.remove('focused');
						}
						conflink.classList.add("focused");
					});
					$.on(conflink, 'mouseout', function () {
						conflink.classList.remove("focused");
					});
					conflink.style.order = 112;
					$.add(e.addedNodes[0], conflink);
				}
			});

			if (nodelist.length > 0) Main.process(nodelist);
		},
		ready: function () {
			var nodelist = $$(Parser.postbody),
				MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver,
				updater, css, font, style;

			Debug.timer.start('init');
			Config.site();
			Options.init();

			css = '';
			font = $.create('link', {
				rel: "stylesheet",
				type: "text/css",
				href: "//fonts.googleapis.com/css?family=Source+Sans+Pro:900"
			});
			style = $.create('link', {
				rel: "stylesheet",
				type: "text/css",
				href: css
			});
			$.add(d.head, font);
			$.add(d.head, style);

			Theme.prepare();
			EasyList.init();

			Debug.log('Initialization complete. Time: ' + Debug.timer.stop('init'));

			Main.process(nodelist);

			if (MutationObserver) {
				updater = new MutationObserver(Main.observer);
				updater.observe(d.body, { childList: true, subtree: true });
			}
			else {
				$.on(d.body, 'DOMNodeInserted', Main.dom);
			}
			$.off(d, 'DOMContentLoaded', Main.ready);
		},
		init: function () {
			Config.init();
			Debug.init();
			Cache.init();
			Database.init();
			API.init();
			UI.init();
			$.extend(Main.queue, {
				list: {},
				add: function (uid) {
					Main.queue.list[uid] = true;
				},
				clear: function () {
					Main.queue.list = {};
				}
			});
			$.on(d, 'DOMContentLoaded', Main.ready);
		},
		get_linkified_links: function () {
			return $$("a.exlink.exgallery[href]");
		},
		queue_linkify_event: function (links) {
			if (Main.linkify_event.listeners.length > 0) {
				$.push_many(Main.linkify_event.queue, links);
			}
		},
		trigger_linkify_event: function () {
			if (Main.linkify_event.queue.length > 0) {
				var queue = Main.linkify_event.queue,
					list = Main.linkify_event.listeners,
					i, ii;

				for (i = 0, ii = list.length; i < ii; ++i) {
					list[i].call(null, queue);
				}

				Main.linkify_event.queue = [];
			}
		},
		on_linkify: function (callback) {
			Main.linkify_event.listeners.push(callback);
		},
		off_linkify: function (callback) {
			var list = Main.linkify_event.listeners,
				i, ii;
			for (i = 0, ii = list.length; i < ii; ++i) {
				if (list[i] === callback) {
					list.splice(i, 1);
					return true;
				}
			}
			return false;
		}
	};

	Main.init();

})();

