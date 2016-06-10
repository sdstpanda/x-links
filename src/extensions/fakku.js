/* jshint eqnull:true, noarg:true, noempty:true, eqeqeq:true, bitwise:false, strict:true, undef:true, curly:false, browser:true, devel:true, newcap:false, maxerr:50 */
/* globals xlinks_api */
(function () {
	"use strict";

	/*#{begin_debug:timing=true}#*/

	/*#{require:../../extensions/api.js#tabs=1}#*/

	var main = function main_fn(xlinks_api) {

	var $$ = function (selector, root) {
		return (root || document).querySelectorAll(selector);
	};
	var $ = function (selector, root) {
		return (root || document).querySelector(selector);
	};
	$.html_parse_safe = function (text, def) {
		try {
			return new DOMParser().parseFromString(text, "text/html");
		}
		catch (e) {}
		return def;
	};

	var domains = {
		fakku: "fakku.net",
		www_fakku: "www.fakku.net",
		fakku_thumbs: "t.fakku.net",
		panda_chaika: "\x70\x61\x6e\x64\x61\x2e\x63\x68\x61\x69\x6b\x61\x2e\x6d\x6f\x65"
	};

	var create_url_to_gallery = function (data) {
		return "https://" + domains.www_fakku + "/" + data.name_class + "/" + data.name;
	};
	var create_url_to_chaika_search = function (data) {
		return "https://" + domains.panda_chaika + "/search/?title=" + data.title;
	};


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
	};

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
	};


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
	};


	var fakku_get_data = function (info, callback) {
		var data = xlinks_api.cache_get(info.id);
		callback(null, data);
	};
	var fakku_set_data = function (data, info, callback) {
		xlinks_api.cache_set(info.id, data, xlinks_api.ttl_1_day);
		callback(null);
	};
	var fakku_setup_xhr = function (callback) {
		var i = this.infos[0];
		callback(null, {
			method: "GET",
			url: "https://" + domains.www_fakku + "/" + i.name_class + "/" + i.name
		});
	};
	var fakku_parse_response = function (xhr, callback) {
		var html = $.html_parse_safe(xhr.responseText, null);
		if (html === null) {
			callback("Invalid response");
		}
		else {
			callback(null, [ fakku_parse_info(html, this.infos[0], xhr.finalUrl) ]);
		}
	};

	var url_get_info = function (url, callback) {
		var m = /\/(manga|magazines)\/([^\/#?]*)(?:\/read\/page\/([0-9]+))?/.exec(url),
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
	};
	var url_info_to_data = function (url_info, callback) {
		xlinks_api.request("fakku", "gallery", url_info.id, url_info, callback);
	};
	var create_actions = function (data, info, callback) {
		callback(null, [
			[ "View on:", create_url_to_gallery(data), "fakku.net" ],
			[ "Search on:", create_url_to_chaika_search(data), "Chaika" ]
		]);
	};

	xlinks_api.init({
		namespace: "fakku",
		name: "FAKKU",
		author: "#{json:#author}#",
		description: "#{json:#description}#",
		version: [/*#{version:,}#*/],
		registrations: 1,
		main: main_fn
	}, function (err) {
		if (err === null) {
			var base_url = "https://" + domains.www_fakku + "/";

			xlinks_api.insert_styles("#{style:../../resources/stylesheets/extensions/fakku.css}#");

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
	});

	};
	main(xlinks_api);

})();

