/* jshint eqnull:true, noarg:true, noempty:true, eqeqeq:true, bitwise:false, strict:true, undef:true, curly:false, browser:true, devel:true, newcap:false, maxerr:50 */
/* globals xlinks_api */
(function () {
	"use strict";

	/*#{begin_debug:timing=true}#*/

	/*#{require:../../extensions/api.js#tabs=1}#*/

	var $$ = function (selector, root) {
		return (root || document).querySelectorAll(selector);
	};
	var $ = (function () {

		var d = document;

		var Module = function (selector, root) {
			return (root || d).querySelector(selector);
		};

		Module.add = function (parent, child) {
			return parent.appendChild(child);
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

		return Module;

	})();

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
		});
	};

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
	};
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
		};

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
	};
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
		},
		information: function (node, data) {
			data.information = innerhtml_to_safe_text(node);
		},
		stardom: function (node, data) {
			var n = node.querySelector("b");
			if (n !== null) {
				data.fans = parseInt(n.textContent.trim(), 10) || 0;
			}
		},
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
		},
		seeders: function (node, data) {
			if ($("b", node) !== null) {
				data.seeders = -1;
			}
			else {
				data.seeders = parseInt(node.textContent.trim(), 10) || 0;
			}
		},
		leechers: function (node, data) {
			if ($("b", node) !== null) {
				data.leechers = -1;
			}
			else {
				data.leechers = parseInt(node.textContent.trim(), 10) || 0;
			}
		},
		downloads: function (node, data) {
			data.downloads = parseInt(node.textContent.trim(), 10) || 0;
		},
		"file size": function (node, data) {
			data.file_size = file_size_text_to_number(node.textContent.trim());
		}
	};

	var pad = function (n, sep) {
		return (n < 10 ? "0" : "") + n + sep;
	};
	var format_date = function (timestamp) {
		var d = new Date(timestamp);
		return d.getUTCFullYear() + "-" +
			pad(d.getUTCMonth() + 1, "-") +
			pad(d.getUTCDate(), " ") +
			pad(d.getUTCHours(), ":") +
			pad(d.getUTCMinutes(), "");
	};

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
	};
	var file_size_number_to_text = function (size) {
		var scale = 1024,
			i, ii;

		for (i = 0, ii = file_size_labels.length - 1; i < ii && size >= 1024; ++i) {
			size /= 1024;
		}

		return size.toFixed(3).replace(/\.?0+$/, "") + " " + file_size_labels[i];
	};

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
	};

	var nyaa_get_data = function (info, callback) {
		var data = xlinks_api.cache_get(info.id);
		callback(null, data);
	};
	var nyaa_set_data = function (data, info, callback) {
		xlinks_api.cache_set(info.id, data, xlinks_api.ttl_1_day);
		callback(null);
	};
	var nyaa_setup_xhr = function (callback) {
		var info = this.infos[0];
		callback(null, {
			method: "GET",
			url: "http://" + (info.sukebei ? "sukebei" : "www") + ".nyaa.se/?page=view&tid=" + info.gid + "&showfiles=1"
		});
	};
	var nyaa_parse_response = function (xhr, callback) {
		var html = xlinks_api.parse_html(xhr.responseText, null),
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
	};

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
	};
	var url_info_to_data = function (url_info, callback) {
		xlinks_api.request("nyaa", "torrent", url_info.id, url_info, callback);
	};
	var create_actions = function (data, info, callback) {
		var urls = [],
			url_base = "http://" + (info.sukebei ? "sukebei" : "www") + ".nyaa.se/";

		urls.push([ "View on:", url_base + "?page=view&tid=" + info.gid + "&showfiles=1" + (data.comments_key ? "&showcomments=" + data.comments_key : ""), "Nyaa.se" ]);
		urls.push(null);
		urls.push([ "Download as:", url_base + "?page=download&tid=" + info.gid, "Torrent" ]);
		urls.push([ null, url_base + "?page=download&tid=" + info.gid + "&magnet=1", "Magnet" ]);
		urls.push([ null, url_base + "?page=download&tid=" + info.gid + "&txt=1", "Txt File" ]);

		callback(null, urls);
	};
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
	};

	xlinks_api.init({
		namespace: "nyaa_torrents",
		name: "Nyaa Torrents",
		author: "#{json:#author}#",
		description: "#{json:#description}#",
		version: [/*#{version:,}#*/],
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
	});

})();

