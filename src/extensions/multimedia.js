/* jshint eqnull:true, noarg:true, noempty:true, eqeqeq:true, bitwise:false, strict:true, undef:true, curly:false, browser:true, devel:true, newcap:false, maxerr:50 */
/* globals xlinks_api */
(function () {
	"use strict";

	/*#{begin_debug:timing=true}#*/

	/*#{require:../../extensions/api.js#tabs=1}#*/

	var main = function main_fn(xlinks_api) {

	// DOM helpers
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

		Module.regex_escape = function (text) {
			return text.replace(/[\$\(\)\*\+\-\.\/\?\[\\\]\^\{\|\}]/g, "\\$&");
		};

		return Module;

	})();


	// Helpers
	var re_newlines = /\r\n/g;

	var short_months = [ "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec" ];
	var full_months = [ "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december" ];

	var objectify = function (obj) {
		return (obj === null || typeof(obj) !== "object") ? {} : obj;
	};

	var time_to_string = function (timecode) {
		var h = Math.floor(timecode / 3600),
			m = Math.floor(timecode / 60) % 60,
			s = Math.floor(timecode) % 60,
			str = "";

		if (h > 0) str += (h + "h");
		if (m > 0) str += ((h > 0 && m < 10 ? "0" : "") + m + "m");
		if (s > 0 || str.length === 0) str += ((s < 10 ? "0" : "") + s + "s");

		return str;
	};
	var time_to_string_short = function (timecode) {
		var h = Math.floor(timecode / 3600),
			m = Math.floor(timecode / 60) % 60,
			s = Math.floor(timecode) % 60,
			str = "";

		str += (h > 0) ? (h + ":" + pad(m)) : m;
		str += ":";
		str += pad(s);
		return str;
	};
	var prettify_number = function (n, label, singular, plural) {
		var s;

		if (Number.prototype.toLocaleString) {
			s = n.toLocaleString();
		}
		else {
			s = ("" + n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		}

		return s + label + (n === 1 ? singular : plural);
	};
	var pad = function (n) {
		return (n < 10 ? "0" : "") + n;
	};
	var format_date = function (timestamp, date_only) {
		var d = new Date(timestamp),
			s = d.getUTCFullYear() + "-" +
				pad(d.getUTCMonth() + 1) + "-" +
				pad(d.getUTCDate());

		return date_only ? s :
			(s + " " +
			pad(d.getUTCHours()) + ":" +
			pad(d.getUTCMinutes()));
	};

	var plaintext_to_dom = function (container, text, trim) {
		var lines = text.split("\n"),
			line, i, ii, n;

		for (i = 0, ii = lines.length; i < ii; ++i) {
			line = lines[i];
			if (trim) line = line.trim();

			n = $.node("p", "xl-mm-details-paragraph");
			if (line.length === 0) {
				$.add(n, $.node_simple("br"));
			}
			else {
				n.textContent = line;
			}

			$.add(container, n);
		}
	};
	var parse_timestamp = function (time_str) {
		var match = /(\d+)-(\d+)-(\d+)[T\s](\d+):(\d+):(\d+)(?:\.(\d+))?(?:Z|\s*([\+\-])(\d+)(?::(\d+))?)?/i.exec(time_str),
			offset = 0,
			ms = 0;

		if (match === null) return 0;

		if (match[7] !== undefined) {
			ms = parseInt(match[7], 10);
			if (match[7].length !== 3) {
				ms = Math.floor((ms / Math.pow(10, match[7].length)) * 1000);
			}
		}

		if (match[9] !== undefined) {
			offset += 3600 * 1000 * parseInt(match[9], 10);
		}
		if (match[10] !== undefined) {
			offset += 60 * 1000 * parseInt(match[10], 10);
		}
		if (match[8] === "-") {
			offset = -offset;
		}

		return Date.UTC(
			parseInt(match[1], 10), // year
			parseInt(match[2], 10) - 1, // month
			parseInt(match[3], 10), // day
			parseInt(match[4], 10), // hours
			parseInt(match[5], 10), // minutes
			parseInt(match[6], 10), // seconds
			ms // milliseconds
		) + offset;
	};
	var parse_long_timestamp = function (time_str) {
		var m = /(\d+)\s+(\w+)\s+(\d+)\s*,?\s*(\d+):(\d+):(\d+)/.exec(time_str),
			month;

		if (m === null) return 0;

		month = Math.max(0, short_months.indexOf(m[2].toLowerCase()));

		return Date.UTC(
			parseInt(m[3], 10),
			month,
			parseInt(m[1], 10),
			parseInt(m[4], 10),
			parseInt(m[5], 10),
			parseInt(m[6], 10)
		);
	};
	var parse_tagstring = function (tagstr) {
		var tags = [],
			re = /,\s*/g,
			pos = 0,
			m;

		// Tags
		while ((m = re.exec(tagstr)) !== null) {
			tags.push(tagstr.substr(pos, m.index - pos).toLowerCase());
			pos = re.lastIndex;
		}
		if (pos < tagstr.length) {
			tags.push(tagstr.substr(pos).toLowerCase());
		}
		return tags;
	};

	var get_ordered_thumbnail = function (thumbnails, order) {
		var i, ii, t;

		for (i = 0, ii = order.length; i < ii; ++i) {
			t = thumbnails[order[i]];
			if (t !== undefined) return t;
		}

		return null;
	};
	get_ordered_thumbnail.order_default = [ "medium", "medium_large", "large", "small", "tiny", "huge" ];

	var use_icons = false;
	var iconify_info = function (info) {
		if (use_icons) {
			info.icon = info.site;
		}
	};


	// Generic
	var generic_get_data = function (info, callback) {
		var data = xlinks_api.cache_get(info.id);
		callback(null, data);
	};
	var generic_set_data = function (data, info, callback) {
		xlinks_api.cache_set(info.id, data, xlinks_api.ttl_1_hour * 6);
		callback(null);
	};

	var generic_create_details = function (data, info, callback) {
		var container = $.node("div", "xl-details-sized"),
			is_video = (data.subtype === "video"),
			is_code = (data.subtype === "gist"),
			uploaded_by = "Uploaded by",
			total, t, r, c, cc, n0, n1, n2, n3, i, thumb;

		$.add(container, t = $.node("div", "xl-mm-details-table"));
		$.add(t, r = $.node("div", "xl-mm-details-table-row"));


		// Small
		if (info.site === "twitter") {
			t.classList.add("xl-mm-details-table-no-height");
			uploaded_by = "Posted by";
		}
		else if (is_code) {
			uploaded_by = "Created by";
		}


		// Images
		thumb = get_ordered_thumbnail(data.thumbnails, get_ordered_thumbnail.order_default);
		if (thumb !== null) {
			$.add(r, c = $.node("div", "xl-mm-details-table-cell-left"));
			$.add(c, cc = $.node("div", "xl-mm-details-table-content-left"));

			if (is_video) {
				$.add(cc, n1 = $.node("div", "xl-mm-details-stats xl-theme"));
				if (data.stats.views !== undefined) {
					$.add(n1, $.node("span", "xl-mm-details-stat-views", prettify_number(data.stats.views, " view", "", "s")));
				}

				if (data.stats.likes !== undefined) {
					if (data.stats.dislikes === undefined) {
						$.add(n1, $.node("span", "xl-mm-details-stat", prettify_number(data.stats.likes, " like", "", "s")));
					}
					else {
						total = data.stats.likes + data.stats.dislikes;
						if (total > 0) {
							$.add(n1, $.node("span", "xl-mm-details-stat", "+" + prettify_number(data.stats.likes, "", "", "")));
							$.add(n1, $.node("span", "xl-mm-details-stat", "\u2212" + prettify_number(data.stats.dislikes, "", "", "")));

							$.add(cc, n1 = $.node("div", "xl-mm-details-rating"));
							$.add(n1, n2 = $.node("div", "xl-mm-details-rating-bar"));
							n2.style.width = (data.stats.likes / total * 100) + "%";
						}
					}
				}
			}

			$.add(cc, n0 = $.node("div", "xl-mm-details-thumbnail" + (is_video ? "" : " xl-mm-details-thumbnail-full") + " xl-theme"));
			generic_create_details_thumbnail(n0, thumb);

			if (is_video) {
				n1 = $.node("div", "xl-mm-details-thumbnail-row");
				for (i = 1; i <= 3; ++i) {
					if (data.thumbnails[i] === undefined) break;
					$.add(n1, n2 = $.node("div", "xl-mm-details-thumbnail-small"));
					$.add(n2, n3 = $.node("div", "xl-mm-details-thumbnail xl-theme"));
					generic_create_details_thumbnail(n3, data.thumbnails[i]);
				}
				if (i > 1) {
					$.add(cc, n1);
				}
				else {
					n0.classList.add("xl-mm-details-thumbnail-large");
				}

				// Duration
				if (data.video !== undefined && data.video.duration > 0) {
					$.add(cc, n1 = $.node("div", "xl-mm-details-duration"));
					n1.textContent = "Length: " + time_to_string_short(data.video.duration);
				}
			}
			else {
				$.add(cc, n1 = $.node("div", "xl-mm-details-stats xl-mm-details-stats-overlay xl-theme"));
				if (data.stats.views !== undefined) {
					$.add(n1, $.node("span", "xl-mm-details-stat-views", prettify_number(data.stats.views, " view", "", "s")));
				}
				if (data.stats.subscribers !== undefined) {
					$.add(n1, $.node("span", "xl-mm-details-stat", prettify_number(data.stats.subscribers, " sub", "", "s")));
				}
				if (data.stats.videos !== undefined) {
					$.add(n1, $.node("span", "xl-mm-details-stat", prettify_number(data.stats.videos, " video", "", "s")));
				}
			}
		}

		// Content
		$.add(r, c = $.node("div", "xl-mm-details-table-cell-right"));
		$.add(c, cc = $.node("div", "xl-mm-details-table-content"));
		$.add(cc, n1 = $.node("div", "xl-mm-details-table-content-inner"));
		cc = n1;

		// Title
		$.add(cc, n1 = $.node("div", "xl-details-title-container"));
		$.add(n1, n2 = $.node("a", "xl-details-title"));
		n2.href = "#";
		n2.textContent = (data.original_title !== undefined ? data.original_title : data.title);
		n2.setAttribute("data-xl-highlight", "title");

		// Upload info
		if (data.channel !== undefined) {
			$.add(cc, n1 = $.node("div", "xl-details-upload-info xl-theme"));
			$.add(n1, $.tnode(uploaded_by));
			$.add(n1, n2 = $.node("strong", "xl-details-uploader xl-theme xl-highlight", data.channel.title));
			n2.setAttribute("data-xl-highlight", "uploader");
			if (data.date_created !== undefined) {
				$.add(n1, $.tnode("on"));
				$.add(n1, $.node("strong", "xl-details-upload-date", format_date(data.date_created, data.date_only === true)));
			}
		}
		else if (data.date_created !== undefined) {
			$.add(cc, n1 = $.node("div", "xl-details-upload-info xl-theme"));
			$.add(n1, $.tnode("Joined on"));
			$.add(n1, $.node("strong", "xl-details-upload-date", format_date(data.date_created, data.date_only === true)));
		}

		// Description
		$.add(cc, n1 = $.node("div", "xl-mm-details-description"));
		plaintext_to_dom(n1, data.description, !is_code);

		if (is_code) {
			n1.classList.add("xl-mm-details-description-code");
		}


		// Done
		callback(null, container);
	};
	var generic_create_details_thumbnail = function (node, url) {
		xlinks_api.get_image(url, xlinks_api.ImageFlags.None, function (err, url_new) {
			if (err !== null) url_new = url;
			node.style.backgroundImage = "url('" + url_new + "')";
		});
	};


	// YouTube API
	var yt_api_key = "AIzaSyBmrf_-CQnv9nePDs272dFJ9shw0f-BxQA";

	var yt_url_get_info = function (url, callback) {
		var m = /(?:https?:\/*)?[\w\-\.]*(youtube\.com?(?:\.[a-z]{2})?|youtu\.be|y2u\.be)((?:\/[^<>()\s\'\"]*)?)/i.exec(url),
			data = null,
			tc, s, m2;

		if (m !== null) {
			s = m[1].toLowerCase();
			if (s === "youtu.be" || s === "y2u.be") {
				m2 = /^\/([a-zA-Z0-9_-]{11})/.exec(m[2]);
			}
			else {
				m2 = /^\/(user|channel)\/([\w\-\.]+)/i.exec(m[2]);
				if (m2 !== null) {
					s = m2[1].toLowerCase();
					data = {
						id: "youtube_" + s + "_" + m2[2],
						site: "youtube",
						type: s,
						name: m2[2],
						tag: "YouTube",
						classes_remove: [ "youtube" ],
						monitor: true
					};

					m2 = null;
				}
				else {
					m2 = /[\?\&]v=([a-zA-Z0-9_-]{11})/.exec(m[2]);
					if (m2 === null) {
						m2 = /^\/embed\/([a-zA-Z0-9_-]{11})/.exec(m[2]);
					}
				}
			}

			if (m2 !== null) {
				tc = yt_parse_url_for_timecode(m[2]);

				data = {
					id: "youtube_" + m2[1],
					site: "youtube",
					type: "video",
					vid: m2[1],
					timecode: tc,
					tag: "YouTube",
					classes_remove: [ "youtube" ],
					monitor: true
				};

				if (tc !== null) {
					data.title_extra = "(at " + time_to_string(tc) + ")";
				}
			}
		}

		if (data !== null) iconify_info(data);
		callback(null, data);
	};
	var yt_url_info_to_data = function (url_info, callback) {
		xlinks_api.request("youtube", url_info.type, url_info.id, url_info, callback);
	};

	var yt_setup_xhr = function (callback) {
		var id_list = [],
			loc = window.location,
			i, ii;

		for (i = 0, ii = this.infos.length; i < ii; ++i) {
			id_list.push(this.infos[i].vid);
		}

		callback(null, {
			method: "GET",
			url: "https://www.googleapis.com/youtube/v3/videos?key=" + yt_api_key + "&part=snippet,contentDetails,status,statistics&maxResults=" + id_list.length + "&id=" + id_list.join(","),
			headers: {
				"Cookie": "",
				"Referer": loc.protocol + "//" + loc.host + "/"
			},
			any_status: true
		});
	};
	var yt_parse_response = function (xhr, callback) {
		var json = xlinks_api.parse_json(xhr.responseText, null),
			datas, items, err, i, ii;

		if (!xlinks_api.is_object(json)) {
			callback("Invalid response");
			return;
		}

		if (xlinks_api.is_object(json.error)) {
			err = json.error.message;
			if (typeof(err) !== "string") err = "Unknown error";
			callback(err);
			return;
		}

		items = json.items;
		if (!Array.isArray(items)) {
			callback("Invalid response");
			return;
		}

		datas = [];
		for (i = 0, ii = items.length; i < ii; ++i) {
			datas.push(yt_parse_response_single(items[i]));
		}

		callback(null, datas);
	};
	var yt_parse_response_single = function (response) {
		var snippet = objectify(response.snippet),
			content_details = objectify(response.contentDetails),
			status = objectify(response.status),
			statistics = objectify(response.statistics),
			id = response.id || "",
			thumbnails = {},
			s_thumbnails = snippet.thumbnails,
			data, thumbs, i, ii, t, t2;

		// Create data
		data = {
			type: "youtube",
			subtype: "video",
			id: id,
			title: snippet.title || "",
			description: (snippet.description || "").replace(re_newlines, "\n"),
			category_id: parseInt(snippet.categoryId, 10) || 0,
			date_created: parse_timestamp(snippet.publishedAt || ""),
			thumbnails: thumbnails,
			channel: {
				id: snippet.channelId || "",
				title: snippet.channelTitle || "",
			},
			video: {
				duration: yt_parse_duration(content_details.duration || ""),
				dimension: content_details.dimension || "", // 2d / 3d
				definition: content_details.definition || "", // hd / sd
				captions: (content_details.caption === "true")
			},
			info: {
				upload_status: status.uploadStatus || "", // uploaded / processed
				privacy: status.privacyStatus || "", // public / unlisted
				license: status.license || "", // youtube / creativeCommon
				licensed: content_details.licensedContent || false,
				embeddable: status.embeddable || false,
				live_content: snippet.liveBroadcastContent,
			},
			stats: {
				views: parseInt(statistics.viewCount || 0, 10) || 0,
				likes: parseInt(statistics.likeCount || 0, 10) || 0,
				dislikes: parseInt(statistics.dislikeCount || 0, 10) || 0,
				favorites: parseInt(statistics.favoriteCount || 0, 10) || 0,
				comments: parseInt(statistics.commentCount || 0, 10) || 0,
			}
		};

		// Add thumbnails
		thumbs = xlinks_api.is_object(s_thumbnails) ? Object.keys(s_thumbnails) : [];
		for (i = 0, ii = thumbs.length; i < ii; ++i) {
			t = thumbs[i];
			t2 = yt_thumbnail_names[t];
			if (t2 !== undefined) {
				thumbnails[t2] = s_thumbnails[t].url || "";
			}
		}
		for (i = 1; i <= 3; ++i) {
			thumbnails[i] = "https://i1.ytimg.com/vi/" + id + "/" + i + ".jpg";
		}

		// Done
		return data;
	};

	var yt_channel_setup_xhr = function (callback) {
		var id_list = [],
			loc = window.location,
			mode = (this.infos[0].type === "user" ? "forUsername" : "id"),
			i, ii;

		for (i = 0, ii = this.infos.length; i < ii; ++i) {
			id_list.push(this.infos[i].name);
		}

		callback(null, {
			method: "GET",
			url: "https://www.googleapis.com/youtube/v3/channels?key=" + yt_api_key + "&part=snippet,statistics&maxResults=" + id_list.length + "&" + mode + "=" + id_list.join(","),
			headers: {
				"Cookie": "",
				"Referer": loc.protocol + "//" + loc.host + "/"
			},
			any_status: true
		});
	};
	var yt_channel_parse_response = function (xhr, callback) {
		var json = xlinks_api.parse_json(xhr.responseText, null),
			datas, items, err, i, ii;

		if (!xlinks_api.is_object(json)) {
			callback("Invalid response");
			return;
		}

		if (xlinks_api.is_object(json.error)) {
			err = json.error.message;
			if (typeof(err) !== "string") err = "Unknown error";
			callback(err);
			return;
		}

		items = json.items;
		if (!Array.isArray(items)) {
			callback("Invalid response");
			return;
		}

		datas = [];
		for (i = 0, ii = items.length; i < ii; ++i) {
			datas.push(yt_channel_parse_response_single(items[i]));
		}

		callback(null, datas);
	};
	var yt_channel_parse_response_single = function (response) {
		var snippet = objectify(response.snippet),
			statistics = objectify(response.statistics),
			thumbnails = {},
			s_thumbnails = snippet.thumbnails,
			data, thumbs, i, ii, t, t2;

		// Create data
		data = {
			type: "youtube",
			subtype: "channel",
			id: response.id || "",
			title: "Channel: " + (snippet.title || ""),
			original_title: snippet.title || "",
			description: (snippet.description || "").replace(re_newlines, "\n"),
			date_created: parse_timestamp(snippet.publishedAt || ""),
			thumbnails: thumbnails,
			stats: {
				views: parseInt(statistics.viewCount || 0, 10) || 0,
				videos: parseInt(statistics.videoCount || 0, 10) || 0,
				comments: parseInt(statistics.commentCount || 0, 10) || 0
			}
		};
		if (!statistics.hiddenSubscriberCount) {
			data.stats.subscribers = parseInt(statistics.subscriberCount || 0, 10) || 0;
		}

		// Add thumbnails
		thumbs = xlinks_api.is_object(s_thumbnails) ? Object.keys(s_thumbnails) : [];
		for (i = 0, ii = thumbs.length; i < ii; ++i) {
			t = thumbs[i];
			t2 = yt_thumbnail_names[t];
			if (t2 !== undefined) {
				thumbnails[t2] = s_thumbnails[t].url || "";
			}
		}

		// Done
		return data;
	};

	var yt_thumbnail_names = {
		"default": "small",
		"medium": "medium",
		"standard": "medium_large",
		"high": "large",
		"maxres": "huge"
	};
	var yt_parse_url_for_timecode = function (url) {
		var m = /[\?\&\#]t=(?:([0-9\.]+)h)?(?:([0-9\.]+)m)?([0-9\.]+)s?/i.exec(url),
			t = null;

		if (m !== null) {
			// Add time
			t = 0;
			if (m[1] !== undefined) t += parseFloat(m[1]) * 60 * 60;
			if (m[2] !== undefined) t += parseFloat(m[2]) * 60;
			t += parseFloat(m[3]);
		}

		return t;
	};
	var yt_parse_duration = function (time_str) {
		var match = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i.exec(time_str),
			t = 0;

		if (match !== null) {
			if (match[1] !== undefined) t += (parseInt(match[1], 10) || 0) * 60 * 60;
			if (match[2] !== undefined) t += (parseInt(match[2], 10) || 0) * 60;
			if (match[3] !== undefined) t += (parseInt(match[3], 10) || 0);
		}
		return t;
	};

	var yt_create_actions = function (data, info, callback) {
		var urls = [],
			timecode1 = "",
			timecode2 = "",
			timecode3 = "";

		if (info.timecode !== null) {
			timecode1 = "&t=" + info.timecode + "s";
			timecode2 = "?t=" + info.timecode + "s";
			timecode3 = "#t=" + info.timecode + "s";
		}

		urls.push([ "View URL as:", "https://www.youtube.com/watch?v=" + data.id + timecode1, "youtube.com" ]);
		urls.push([ null, "https://youtu.be/" + data.id + timecode2, "youtu.be" ]);
		urls.push([ null, "http://y2u.be/" + data.id + timecode3, "y2u.be" ]);
		urls.push([ null, "https://www.youtube.com/embed/" + data.id, "Embed URL" ]);

		callback(null, urls);
	};


	// Vimeo API
	var vimeo_url_get_info = function (url, callback) {
		var data = null,
			type, s, m, m2;

		if (
			(m = /(?:https?:\/*)?[\w\-\.]*vimeo\.com((?:\/[\w\W]*)?)/i.exec(url)) !== null &&
			(m2 = /^\/(?:m\/)?(?:(\d+)|channels\/([^\/\?\#]+)(?:\/(\d+))?|([^\/\?\#]+))/i.exec(m[1])) !== null
		) {
			if ((s = m2[1]) !== undefined) {
				data = {
					id: "vimeo_" + s,
					site: "vimeo",
					type: "video",
					vid: parseInt(s, 10),
					tag: "Vimeo",
					classes_remove: [ "vimeo" ],
					monitor: true
				};
			}
			else {
				s = m2[2];
				type = "channel";
				if (s === undefined) {
					s = m2[3];
					type = "user";
				}

				data = {
					id: "vimeo_" + type + "_" + s,
					site: "vimeo",
					type: type,
					name: s,
					tag: "Vimeo",
					classes_remove: [ "vimeo" ],
					monitor: true
				};
			}
		}

		if (data !== null) iconify_info(data);
		callback(null, data);
	};
	var vimeo_url_info_to_data = function (url_info, callback) {
		xlinks_api.request("vimeo", url_info.type, url_info.id, url_info, callback);
	};

	var vimeo_setup_xhr = function (callback) {
		var info = this.infos[0];
		callback(null, {
			method: "GET",
			url: "https://vimeo.com/api/v2/video/" + info.vid + ".json",
			headers: { "Cookie": "" }
		});
	};
	var vimeo_parse_response = function (xhr, callback) {
		var json = xlinks_api.parse_json(xhr.responseText, null),
			item;

		if (
			!xlinks_api.is_object(json) ||
			!Array.isArray(json) ||
			json.length < 1 ||
			!xlinks_api.is_object((item = json[0]))
		) {
			callback("Invalid response");
		}
		else {
			callback(null, [ vimeo_parse_response_single(item) ]);
		}
	};
	var vimeo_parse_response_single = function (response) {
		var tags = parse_tagstring("" + (response.tags || ""));

		// Create data
		return {
			type: "vimeo",
			subtype: "video",
			id: response.id || 0,
			title: response.title || "",
			description: vimeo_normalize_description(response.description || ""),
			date_created: parse_timestamp(response.upload_date || ""),
			thumbnails: {
				small: response.thumbnail_small,
				medium: response.thumbnail_medium,
				large: response.thumbnail_large,
			},
			tags: tags,
			channel: {
				id: response.user_id || 0,
				title: response.user_name || "",
				thumbnails: {
					small: response.user_portrait_small,
					medium: response.user_portrait_medium,
					large: response.user_portrait_large,
					huge: response.user_portrait_huge
				}
			},
			video: {
				duration: response.duration || 0,
				resolution: [ response.width || 0, response.height || 0 ]
			},
			info: {
				embeddable: (response.embed_privacy === "anywhere")
			},
			stats: {
				views: response.stats_number_of_plays || 0,
				likes: response.stats_number_of_likes || 0,
				comments: response.stats_number_of_comments || 0
			}
		};
	};

	var vimeo_user_setup_xhr = function (callback) {
		var info = this.infos[0];
		callback(null, {
			method: "GET",
			url: "https://vimeo.com/api/v2/" + info.name + "/info.json",
			headers: { "Cookie": "" }
		});
	};
	var vimeo_user_parse_response = function (xhr, callback) {
		var json = xlinks_api.parse_json(xhr.responseText, null);

		if (!xlinks_api.is_object(json)) {
			callback("Invalid response");
		}
		else {
			callback(null, [ vimeo_user_parse_response_single(json) ]);
		}
	};
	var vimeo_user_parse_response_single = function (response) {
		// Create data
		return {
			type: "vimeo",
			subtype: "user",
			id: response.id || 0,
			title: "User: " + (response.display_name || ""),
			original_title: (response.display_name || ""),
			description: vimeo_normalize_description(response.bio || ""),
			date_created: parse_timestamp(response.created_on || ""),
			thumbnails: {
				small: response.user_portrait_small,
				medium: response.user_portrait_medium,
				large: response.user_portrait_large,
				huge: response.user_portrait_huge
			},
			stats: {
				videos: response.total_videos_uploaded || 0
			},
			info: {
				url: response.url || "",
				location: response.location || ""
			}
		};
	};

	var vimeo_channel_setup_xhr = function (callback) {
		var info = this.infos[0];
		callback(null, {
			method: "GET",
			url: "https://vimeo.com/api/v2/channel/" + info.name + "/info.json",
			headers: { "Cookie": "" }
		});
	};
	var vimeo_channel_parse_response = function (xhr, callback) {
		var json = xlinks_api.parse_json(xhr.responseText, null);

		if (!xlinks_api.is_object(json)) {
			callback("Invalid response");
		}
		else {
			callback(null, [ vimeo_channel_parse_response_single(json) ]);
		}
	};
	var vimeo_channel_parse_response_single = function (response) {
		// Create data
		return {
			type: "vimeo",
			subtype: "channel",
			id: response.id || 0,
			title: "Channel: " + (response.name || ""),
			original_title: (response.name || ""),
			description: vimeo_normalize_description(response.description || ""),
			date_created: parse_timestamp(response.created_on || ""),
			author: {
				id: response.creator_id || 0,
				title: response.creator_display_name || ""
			},
			thumbnails: {
				huge: response.logo
			},
			stats: {
				videos: response.total_videos || 0,
				subscribers: response.total_subscribers || 0
			}
		};
	};

	var vimeo_normalize_description = function (text) {
		return text.replace(/<br\s*\/?>/g, "").replace(/\r\n/g, "\n");
	};


	// SoundCloud API
	var sc_url_get_info = function (url, callback) {
		var data = null,
			s, u, m, m2;

		if (
			(m = /(?:https?:\/*)?[\w\-\.]*soundcloud\.com((?:\/[\w\W]*)?)/i.exec(url)) !== null &&
			(m2 = /^\/(?:groups\/([^\/\?\#]+)|([^\/\?\#]+)(?:\/sets\/([^\/\?\#]+)|\/([^\/\?\#]+))?)/i.exec(m[1])) !== null
		) {
			if ((s = m2[1]) !== undefined) {
				data = {
					id: "soundcloud_group_" + s,
					site: "soundcloud",
					type: "group",
					name: s,
					tag: "SoundCloud",
					classes_remove: [ "soundcloud" ],
					monitor: true
				};
			}
			else {
				u = m2[2];
				if ((s = m2[3]) !== undefined) {
					data = {
						id: "soundcloud_playlist_" + u + "_" + s,
						site: "soundcloud",
						type: "playlist",
						name: u,
						playlist: s,
						tag: "SoundCloud",
						classes_remove: [ "soundcloud" ],
						monitor: true
					};
				}
				else if ((s = m2[4]) !== undefined) {
					data = {
						id: "soundcloud_track_" + u + "_" + s,
						site: "soundcloud",
						type: "track",
						name: u,
						track: s,
						tag: "SoundCloud",
						classes_remove: [ "soundcloud" ],
						monitor: true
					};
				}
				else {
					data = {
						id: "soundcloud_user_" + u,
						site: "soundcloud",
						type: "user",
						name: u,
						tag: "SoundCloud",
						classes_remove: [ "soundcloud" ],
						monitor: true
					};
				}
			}
		}

		if (data !== null) iconify_info(data);
		callback(null, data);
	};
	var sc_url_info_to_data = function (url_info, callback) {
		xlinks_api.request("soundcloud", "generic", url_info.id, url_info, callback);
	};

	var sc_setup_xhr = function (callback) {
		var info = this.infos[0],
			type = info.type,
			ext = info.name;

		if (type === "track") {
			ext += "/" + info.track;
		}
		else if (type === "playlist") {
			ext += "/sets/" + info.playlist;
		}
		else if (type === "group") {
			ext += "/groups/" + info.name;
		}

		callback(null, {
			method: "GET",
			url: "https://soundcloud.com/oembed?format=json&iframe=true&url=https://soundcloud.com/" + ext,
			headers: { "Cookie": "" }
		});
	};
	var sc_parse_response = function (xhr, callback) {
		var json = xlinks_api.parse_json(xhr.responseText, null);
		if (!xlinks_api.is_object(json)) {
			callback("Invalid response");
		}
		else {
			callback(null, [ sc_parse_response_single(json, this.infos[0]) ]);
		}
	};
	var sc_parse_response_single = function (response, info) {
		var type_prefix = "",
			type = info.type,
			title = (response.title || ""),
			author = (response.author_name || ""),
			data;

		if (type === "track") {
			if (author.length > 0) {
				title = title.replace(new RegExp("\\s+by\\s+" + $.regex_escape(author) + "$"), "");
			}
		}
		else {
			type_prefix = type[0].toUpperCase() + type.substr(1) + ": ";
		}

		// Create data
		data = {
			type: "soundcloud",
			subtype: type,
			title: type_prefix + title,
			description: vimeo_normalize_description(response.description || ""),
			thumbnails: {
				large: response.thumbnail_url,
			},
			stats: {}
		};

		if (type !== "user") {
			data.channel = {
				title: author
			};
		}

		// Done
		return data;
	};


	// DailyMotion API
	var dm_url_get_info = function (url, callback) {
		var data = null,
			s, m, m2;

		if (
			(m = /(?:https?:\/*)?[\w\-\.]*dailymotion\.com((?:\/[\w\W]*)?)/i.exec(url)) !== null &&
			(m2 = /^\/(?:video\/([a-zA-Z0-9]+)|([\w\-\.]+))/i.exec(m[1])) !== null
		) {
			if (m2[1] !== undefined) {
				s = m2[1];
				data = {
					id: "dailymotion_" + s,
					site: "dailymotion",
					type: "video",
					vid: s,
					tag: "DailyMotion"
				};
			}
			else {
				s = m2[2];
				data = {
					id: "dailymotion_channel_" + s,
					site: "dailymotion",
					type: "user",
					name: s,
					tag: "DailyMotion"
				};
			}
		}

		if (data !== null) iconify_info(data);
		callback(null, data);
	};
	var dm_url_info_to_data = function (url_info, callback) {
		xlinks_api.request("dailymotion", url_info.type, url_info.id, url_info, callback);
	};

	var dm_setup_xhr = function (callback) {
		var info = this.infos[0];
		callback(null, {
			method: "GET",
			url: "https://api.dailymotion.com/video/" + info.vid + "?family_filter=false&fields=allow_embed,created_time,description,duration,id,owner.id,owner.screenname,owner.username,private,rating,ratings_total,thumbnail_120_url,thumbnail_180_url,thumbnail_240_url,thumbnail_360_url,thumbnail_480_url,thumbnail_720_url,title,views_total",
			headers: { "Cookie": "" }
		});
	};
	var dm_parse_response = function (xhr, callback) {
		var json = xlinks_api.parse_json(xhr.responseText, null);
		if (!xlinks_api.is_object(json)) {
			callback("Invalid response");
		}
		else {
			callback(null, [ dm_parse_response_single(json) ]);
		}
	};
	var dm_parse_response_single = function (response) {
		var tags = (Array.isArray(response.tags) ? response.tags : []);

		// Create data
		return {
			type: "dailymotion",
			subtype: "video",
			id: response.id,
			title: response.title || "",
			description: dm_normalize_description(response.description || ""),
			date_created: (response.created_time || 0) * 1000,
			tags: tags,
			thumbnails: {
				tiny: response.thumbnail_120_url,
				small: response.thumbnail_180_url,
				medium: response.thumbnail_240_url,
				medium_large: response.thumbnail_360_url,
				large: response.thumbnail_480_url,
				huge: response.thumbnail_720_url,
			},
			channel: {
				id: response["owner.id"] || "",
				title: response["owner.screenname"] || "",
				name: response["owner.username"] || "",
			},
			video: {
				duration: response.duration || 0,
			},
			info: {
				privacy: response.private ? "private" : "public"
			},
			stats: {
				views: response.views_total || 0
			}
		};
	};

	var dm_user_setup_xhr = function (callback) {
		var info = this.infos[0];
		callback(null, {
			method: "GET",
			url: "https://api.dailymotion.com/user/" + info.name + "?family_filter=false&fields=created_time,description,id,screenname,username,avatar_120_url,avatar_190_url,avatar_240_url,avatar_360_url,avatar_480_url,avatar_720_url,videos_total,views_total",
			headers: { "Cookie": "" }
		});
	};
	var dm_user_parse_response = function (xhr, callback) {
		var json = xlinks_api.parse_json(xhr.responseText, null);
		if (!xlinks_api.is_object(json)) {
			callback("Invalid response");
		}
		else {
			callback(null, [ dm_user_parse_response_single(json) ]);
		}
	};
	var dm_user_parse_response_single = function (response) {
		// Create data
		return {
			type: "dailymotion",
			subtype: "user",
			id: response.id || "",
			title: "User: " + (response.screenname || ""),
			original_title: response.screenname || "",
			username: response.username,
			description: dm_normalize_description(response.description || ""),
			date_created: (response.created_time || 0) * 1000,
			thumbnails: {
				tiny: response.avatar_120_url,
				small: response.avatar_180_url,
				medium: response.avatar_240_url,
				medium_large: response.avatar_360_url,
				large: response.avatar_480_url,
				huge: response.avatar_720_url,
			},
			stats: {
				views: response.views_total || 0,
				videos: response.videos_total || 0
			}
		};
	};

	var dm_normalize_description = function (text) {
		return text.replace(/\s*<br\s*\/?>/g, "\n");
	};


	// LiveLeak API
	var ll_url_get_info = function (url, callback) {
		var data = null,
			s, m, m2;

		if (
			(m = /(?:https?:\/*)?[\w\-\.]*liveleak\.com((?:\/[\w\W]*)?)/i.exec(url)) !== null &&
			(m2 = /\/view[\w\W]*(?:[\?\&]i=([\w\_]+))/i.exec(m[1])) !== null
		) {
			s = m2[1];
			data = {
				id: "liveleak_" + s,
				site: "liveleak",
				vid: s,
				tag: "LiveLeak"
			};
		}

		if (data !== null) iconify_info(data);
		callback(null, data);
	};
	var ll_url_info_to_data = function (url_info, callback) {
		xlinks_api.request("liveleak", "video", url_info.id, url_info, callback);
	};

	var ll_setup_xhr = function (callback) {
		var info = this.infos[0];
		callback(null, {
			method: "GET",
			url: "http://mobile.liveleak.com/view?i=" + info.vid + "&ajax=1",
			headers: { "Cookie": "" }
		});
	};
	var ll_parse_response = function (xhr, callback) {
		var html = xlinks_api.parse_html(xhr.responseText, null);
		if (html === null) {
			callback("Invalid response");
		}
		else {
			callback(null, [ ll_parse_response_single(html, this.infos[0]) ]);
		}
	};
	var ll_parse_response_single = function (html, info) {
		var re_newlines = /\r?\n/g,
			re_thumbnail = /image\s*:\s*['"]([^'"\n]*)['"]/,
			re_colon = /:$/,
			data, n, n2, ns, s, m, i, ii;

		// Create data
		data = {
			type: "liveleak",
			subtype: "video",
			id: info.vid,
			title: "",
			description: "",
			date_created: 0,
			date_only: true,
			tags: [],
			thumbnails: {},
			channel: {
				title: ""
			},
			video: {
				duration: 0,
				definition: "sd"
			},
			stats: {
				views: 0,
				plays: 0,
				comments: 0,
			}
		};

		// Get info
		if ((n = $(".section_title", html)) !== null) {
			data.title = n.textContent.trim();
			if ($("img", n) !== null) {
				data.video.definition = "hd";
			}
		}
		if ((n = $("#body_text>p", html)) !== null) {
			s = "";
			for (n2 = n.firstChild; n2 !== null; n2 = n2.nextSibling) {
				if (n2.nodeType === Node.TEXT_NODE) {
					s += n2.nodeValue.replace(re_newlines, " ");
				}
				else if (n2.nodeType === Node.ELEMENT_NODE) {
					if (n2.tagName === "BR") {
						s += "\n";
					}
					else if (n2.tagName === "A") {
						s += n2.textContent.replace(re_newlines, " ");
					}
				}
			}
			data.description = s;
		}

		if (
			(n = $("center", html)) !== null &&
			(m = /Plays:\s*(\d+)/i.exec(n.textContent)) !== null
		) {
			data.stats.plays = parseInt(m[1], 10);
		}

		ns = $$("script", html);
		for (i = 0, ii = ns.length; i < ii; ++i) {
			if ((m = re_thumbnail.exec(ns[i].textContent)) !== null) {
				data.thumbnails.large = m[1];
				break;
			}
		}

		if ((n = $(".tab_nav_contents", html)) !== null) {
			ns = $$("strong", n);
			for (i = 0, ii = ns.length; i < ii; ++i) {
				n = ns[i];

				s = n.textContent.trim().replace(re_colon, "").toLowerCase();

				if (s === "views") {
					if (
						(n2 = ll_get_next_tnode(n)) !== null &&
						(m = /^\s*(\d+)/.exec(n2.nodeValue)) !== null
					) {
						data.stats.views = parseInt(m[1], 10);
					}
				}
				else if (s === "comments") {
					if (
						(n2 = ll_get_next_tnode(n)) !== null &&
						(m = /^\s*(\d+)/.exec(n2.nodeValue)) !== null
					) {
						data.stats.comments = parseInt(m[1], 10);
					}
				}
				else if (s === "by") {
					if ((n2 = ll_get_next_node(n, "A")) !== null) {
						data.channel.title = n2.textContent.trim();
					}
				}
				else if (s === "tags") {
					n2 = n;
					while ((n2 = ll_get_next_node(n2, "A")) !== null) {
						data.tags.push(n2.textContent.trim());
					}
				}
				else if (s === "added") {
					if (
						(n2 = ll_get_next_tnode(n)) !== null &&
						(m = /(\d+)\s*(sec|min|hour|day)s?\s+ago|(\w+)-(\d+)-(\d+)/i.exec(n2.nodeValue)) !== null
					) {
						data.date_created = ll_parse_timestamp(m);
					}
				}
			}
		}

		// Done
		return data;
	};

	var ll_parse_timestamp = function (match) {
		var v, s, d;

		if (match[1] !== undefined) {
			v = parseInt(match[1], 10);
			s = match[2].toLowerCase();

			if (s === "min") {
				s *= 60 * 1000;
			}
			else if (s === "hour") {
				s *= 60 * 60 * 1000;
			}
			else if (s === "day") {
				s *= 24 * 60 * 60 * 1000;
			}
			else { // if (s === "sec") {
				s *= 1000;
			}

			d = new Date().getTime();
		}
		else {
			s = match[3].toLowerCase();
			d = Date.UTC(
				parseInt(match[5], 10), // year
				Math.max(0, short_months.indexOf(s)),
				parseInt(match[4], 10) // day
			);
		}

		return d;
	};
	var ll_get_next_tnode = function (node) {
		var n = node.nextSibling;

		if (n === null) {
			n = node.parentNode.nextSibling;
		}

		return (n.nodeType === Node.TEXT_NODE) ? n : null;
	};
	var ll_get_next_node = function (node, tag_name) {
		while ((node = node.nextSibling) !== null) {
			if (node.nodeType === Node.ELEMENT_NODE) {
				if (node.tagName !== tag_name) node = null;
				break;
			}
		}
		return node;
	};


	// Vine API
	var vine_url_get_info = function (url, callback) {
		var data = null,
			s, m, m2;

		if (
			(m = /(?:https?:\/*)?[\w\-\.]*vine\.co((?:\/[\w\W]*)?)/i.exec(url)) !== null &&
			(m2 = /^\/v\/([\w\_\-]+)/i.exec(m[1])) !== null
		) {
			s = m2[1];
			data = {
				id: "vine_" + s,
				site: "vine",
				vid: s,
				tag: "Vine"
			};
		}

		if (data !== null) iconify_info(data);
		callback(null, data);
	};
	var vine_url_info_to_data = function (url_info, callback) {
		xlinks_api.request("vine", "generic", url_info.id, url_info, callback);
	};

	var vine_setup_xhr = function (callback) {
		var info = this.infos[0];
		callback(null, {
			method: "GET",
			url: "https://vine.co/oembed.json?id=" + info.vid,
			headers: { "Cookie": "" }
		});
	};
	var vine_parse_response = function (xhr, callback) {
		var json = xlinks_api.parse_json(xhr.responseText, null);
		if (!xlinks_api.is_object(json)) {
			callback("Invalid response");
		}
		else {
			callback(null, [ vine_parse_response_single(json) ]);
		}
	};
	var vine_parse_response_single = function (response) {
		var title = response.title || "",
			description = "",
			hashtags = /\s*((?:#[^\s\.\?\!\&\^\%\$\@\(\)\[\]\{\}<>\;\:\'\"\,\*\`\~\-\|\/\\]+\s*)+)([\.\!\?]*)$/.exec(title),
			t;

		if (hashtags !== null) {
			// Separate out hashtags at the end
			t = title.substr(0, hashtags.index).trim();
			if (t.length > 0) {
				title = t + hashtags[2];
				description = hashtags[1].trim();
			}
		}

		// Create data
		return {
			type: "vine",
			subtype: "vinevideo",
			title: title,
			description: description,
			channel: {
				title: response.author_name || "",
			},
			thumbnails: {
				large: response.thumbnail_url,
			},
			stats: {}
		};
	};


	// Twitter API
	var twitter_url_get_info = function (url, callback) {
		var data = null,
			user, id, m, m2;

		if (
			(m = /(?:https?:\/*)?[\w\-\.]*twitter\.com((?:\/[\w\W]*)?)/i.exec(url)) !== null &&
			(m2 = /^\/([^\/]+)\/status\/(\d+)/i.exec(m[1])) !== null
		) {
			user = m2[1];
			id = m2[2];
			data = {
				id: "twitter_" + user + "_" + id,
				site: "twitter",
				tid: id,
				user: user,
				tag: "Twitter",
				classes_remove: [ "twitter" ]
			};
		}

		if (data !== null) iconify_info(data);
		callback(null, data);
	};
	var twitter_url_info_to_data = function (url_info, callback) {
		xlinks_api.request("twitter", "generic", url_info.id, url_info, callback);
	};

	var twitter_setup_xhr = function (callback) {
		var info = this.infos[0];
		callback(null, {
			method: "GET",
			url: "https://api.twitter.com/1/statuses/oembed.json?url=https://twitter.com/" + info.user + "/status/" + info.tid,
			headers: {
				"Cookie": "",
				"Accept-Language": "en-us;q=0.8"
			}
		});
	};
	var twitter_parse_response = function (xhr, callback) {
		var json = xlinks_api.parse_json(xhr.responseText, null);
		if (!xlinks_api.is_object(json)) {
			callback("Invalid response");
		}
		else {
			callback(null, [ twitter_parse_response_single(json) ]);
		}
	};
	var twitter_parse_response_single = function (response) {
		var author_id = (response.author_name || ""),
			author_ext = "",
			description = "",
			title = "Tweet by " + author_id,
			html = xlinks_api.parse_html(response.html || "", null),
			re_pic = /^pic\.twitter\.com\/(\w+)$/,
			date_created = null,
			data, m, n, t, i;

		if ((m = /\/([^\/]+)$/.exec(response.author_url || "")) !== null) {
			author_id = m[1];
			author_ext = " (@" + author_id + ")";
			title += author_ext;
		}

		if (html !== null && (html = $("blockquote", html)) !== null) {
			if ((n = $("p", html)) !== null) {
				// Create description
				for (n = n.firstChild; n !== null; n = n.nextSibling) {
					if (n.nodeType === Node.TEXT_NODE) {
						description += n.nodeValue;
					}
					else if (n.nodeType === Node.ELEMENT_NODE) {
						if (n.tagName === "BR") {
							description += "\n";
						}
						else if (n.tagName === "A") {
							t = n.textContent;
							if ((m = re_pic.exec(t)) !== null && n.nextSibling === null) {
								t = "";
							}
							description += t;
						}
					}
				}
			}
			if (
				(n = $("p+a", html)) !== null &&
				(m = /(\w+)\s+(\d+)\s*,?\s*(\d+)/.exec(n.textContent.trim())) !== null
			) {
				i = Math.max(0, full_months.indexOf(m[1].toLowerCase()));
				date_created = Date.UTC(
					parseInt(m[3], 10),
					i,
					parseInt(m[2], 10)
				);
			}
		}

		// Create data
		data = {
			type: "twitter",
			subtype: "tweet",
			title: title,
			description: description,
			channel: {
				id: author_id,
				title: (response.author_name || "") + author_ext,
			},
			thumbnails: {},
			stats: {}
		};

		if (date_created !== null) {
			data.date_created = date_created;
			data.date_only = true;
		}

		// Done
		return data;
	};


	// Livestream API
	var ls_url_get_info = function (url, callback) {
		var data = null,
			original, type, user, id, m, m2;

		if (
			(m = /(?:https?:\/*)?([\w\-\.]*)livestream\.com((?:\/[\w\W]*)?)/i.exec(url)) !== null &&
			(m2 = /^\/(?:accounts\/(\d+)(?:\/events\/(\d+))?|([^\/\?\#]+)(?:\/events\/(\d+)|\/([^\/\?\#]+))?)/i.exec(m[2])) !== null
		) {
			original = (m[1].toLowerCase() === "original.");
			type = "channel";

			if (m2[1] !== undefined) {
				user = m2[1];
				if (m2[2] !== undefined) {
					id = m2[2];
					type = "video";
					original = false;
				}
			}
			else if (m2[3] !== undefined) {
				user = m2[3];
				if (m2[4] !== undefined) {
					id = m2[4];
					type = "video";
					original = false;
				}
				else if (m2[5] !== undefined) {
					id = m2[5];
					type = "video";

					if (
						id === "video" &&
						(m = /[\?\&]clipId=([\w\-\_]+)/i.exec(m[2])) !== null
					) {
						id = m[1];
						original = true;
					}
				}
			}

			if (type === "video") {
				data = {
					id: "livestream_" + user + "_" + id,
					site: "livestream",
					type: type,
					vid: id,
					user: user,
					original: original,
					tag: "Livestream"
				};
			}
			else {
				data = {
					id: "livestream_" + user,
					site: "livestream",
					type: type,
					user: user,
					original: original,
					tag: "Livestream"
				};
			}
		}

		if (data !== null) iconify_info(data);
		callback(null, data);
	};
	var ls_url_info_to_data = function (url_info, callback) {
		xlinks_api.request("livestream", url_info.type, url_info.id, url_info, callback);
	};

	var ls_setup_xhr = function (callback) {
		var info = this.infos[0],
			url;

		if (info.original) {
			url = "http://x" + info.user.replace(/[^a-zA-Z0-9]/g, "-") + "x.api.channel.livestream.com/2.0/clipdetails.json?id=" + info.vid;
		}
		else {
			url = "https://livestream.com/api/accounts/" + info.user + "/events/" + info.vid;
		}

		callback(null, {
			method: "GET",
			url: url,
			headers: { "Cookie": "" }
		});
	};
	var ls_parse_response = function (xhr, callback) {
		var json = xlinks_api.parse_json(xhr.responseText, null),
			info = this.infos[0];

		if (!xlinks_api.is_object(json)) {
			callback("Invalid response");
		}
		else {
			callback(null, [
				info.original ? ls_parse_response_single_old(json) : ls_parse_response_single_new(json)
			]);
		}
	};
	var ls_parse_response_single_old = function (response) {
		var short_name = "",
			title, item, data, m, t, r;

		r = objectify(response.channel);
		if (!Array.isArray((item = r.item))) item = [];
		item = item[0];

		if (!xlinks_api.is_object(item)) {
			return ls_channel_parse_response_single_old(response, true);
		}
		response = r;

		m = /[^\/]+$/.exec(response.link);
		if (m !== null) short_name = m[0];

		title = item.title || "";

		// Create data
		data = {
			type: "livestream",
			subtype: "video",
			id: item.guid || "",
			title: title,
			original: true,
			description: (item.description || "").replace(re_newlines, "\n"),
			date_created: parse_long_timestamp(response.pubDate || ""),
			thumbnails: {},
			channel: {
				id: short_name,
				title: response.title || "",
				thumbnails: {}
			},
			video: {
				duration: objectify(item.content)["@duration"] || 0,
			},
			info: {},
			stats: {
				views: item.viewsCount || 0
			}
		};

		if (typeof((t = objectify(response.image).url)) === "string" && t.length > 0) {
			data.channel.thumbnails.medium = t;
		}

		if (typeof((t = objectify(item.thumbnail)["@url"])) === "string" && t.length > 0) {
			data.thumbnails.medium = t;
		}
		if (typeof((t = item.thumbnailLow)) === "string" && t.length > 0) {
			data.thumbnails.small = t;
		}

		// Done
		return data;
	};
	var ls_parse_response_single_new = function (response) {
		var owner = objectify(response.owner),
			owner_picture = objectify(owner.picture),
			logo = objectify(response.logo),
			likes = objectify(response.likes),
			tags = parse_tagstring("" + (response.tags || "")),
			data;

		// Create data
		data = {
			type: "livestream",
			subtype: "video",
			id: response.id || 0,
			title: response.full_name || "",
			description: (response.description || "").replace(re_newlines, "\n"),
			date_created: parse_timestamp(response.created_at || ""),
			tags: tags,
			thumbnails: {},
			channel: {
				id: owner.id || 0,
				title: owner.full_name || "",
				name: owner.short_name || "",
				thumbnails: {}
			},
			video: {},
			info: {
				privacy: response.is_public ? "public" : "private",
				embeddable: (response.is_embeddable === true),
				live_content: (response.in_progress === true),
			},
			stats: {
				views: response.viewer_count || 0,
				likes: likes.total || 0
			}
		};

		ls_get_thumbs(data.thumbnails, logo);
		ls_get_thumbs(data.channel.thumbnails, owner_picture);

		// Done
		return data;
	};

	var ls_channel_setup_xhr = function (callback) {
		var info = this.infos[0],
			url;

		if (info.original === (this.is_retry !== true)) {
			url = "http://x" + info.user.replace(/[^a-zA-Z0-9]/g, "-") + "x.api.channel.livestream.com/2.0/info.json";
		}
		else {
			url = "https://livestream.com/api/accounts/" + info.user;
		}

		callback(null, {
			method: "GET",
			url: url,
			headers: { "Cookie": "" },
			any_status: true
		});
	};
	var ls_channel_parse_response = function (xhr, callback) {
		var info = this.infos[0],
			json, original, data;

		if (xhr.status !== 200) {
			if (this.is_retry === true) {
				callback("Invalid status");
			}
			else {
				// Retry
				this.is_retry = true;
				callback(null, null, 200);
			}
			return;
		}

		json = xlinks_api.parse_json(xhr.responseText, null);
		if (!xlinks_api.is_object(json)) {
			callback("Invalid response");
		}
		else {
			original = info.original;
			if (this.is_retry === true) original = !original;

			data = original ? ls_channel_parse_response_single_old(json, false) : ls_channel_parse_response_single_new(json);

			if (data !== null) {
				callback(null, [ data ]);
			}
			else if (this.is_retry === true) {
				callback("Invalid channel");
			}
			else {
				// Retry
				this.is_retry = true;
				callback(null, null, 200);
			}
		}
	};
	var ls_channel_parse_response_single_old = function (response, removed_video) {
		var short_name = "",
			title, original_title, data, m, t;

		response = objectify(response.channel);

		m = /[^\/]+$/.exec(response.link);
		if (m !== null) short_name = m[0];

		title = response.title || "";
		original_title = title;
		if (short_name.length > 0 && short_name !== original_title) {
			original_title += " (" + short_name + ")";
		}

		if (removed_video) {
			title += " (Video unavailable)";
		}

		// Create data
		data = {
			type: "livestream",
			subtype: "channel",
			id: short_name,
			title: "Channel: " + title,
			original_title: original_title,
			original: true,
			category: (response.category || "").toLowerCase(),
			description: (response.description || "").replace(re_newlines, "\n"),
			date_created: parse_long_timestamp(response.pubDate || ""),
			thumbnails: {},
			stats: {
				views: response.viewsCount || 0
			}
		};

		if (typeof((t = objectify(response.image).url)) === "string" && t.length > 0) {
			data.thumbnails.medium = t;
		}

		// Done
		return data;
	};
	var ls_channel_parse_response_single_new = function (response) {
		var short_name = response.short_name || "",
			title, original_title, data;

		title = response.full_name || "";
		original_title = title;
		if (short_name.length > 0 && short_name !== original_title) {
			original_title += " (" + short_name + ")";
		}

		// Create data
		data = {
			type: "livestream",
			subtype: "channel",
			id: response.id || 0,
			title: "Channel: " + title,
			original_title: original_title,
			name: short_name,
			description: (response.description || "").replace(re_newlines, "\n"),
			date_created: parse_timestamp(response.created_at || ""),
			thumbnails: {},
			stats: {}
		};

		ls_get_thumbs(data.thumbnails, objectify(response.picture));

		// Done
		return data;
	};

	var ls_get_thumbs = function (target, src) {
		var t;
		if (typeof((t = src.url)) === "string") target.huge = t;
		if (typeof((t = src.thumb_url)) === "string") target.tiny = t;
		if (typeof((t = src.small_url)) === "string") target.medium = t;
		if (typeof((t = src.medium_url)) === "string") target.large = t;
	};


	// Nicovideo API
	var nv_url_get_info = function (url, callback) {
		var data = null,
			id, m, m2;

		if (
			(m = /(?:https?:\/*)?([\w\-\.]*)nicovideo\.jp((?:\/[\w\W]*)?)/i.exec(url)) !== null &&
			(m2 = /^\/watch\/((?:sm)?\d+)/i.exec(m[2])) !== null
		) {
			id = m2[1];

			data = {
				id: "nicovideo_" + id,
				site: "nicovideo",
				vid: id,
				tag: "Niconico"
			};
		}

		if (data !== null) iconify_info(data);
		callback(null, data);
	};
	var nv_url_info_to_data = function (url_info, callback) {
		xlinks_api.request("nicovideo", "video", url_info.id, url_info, callback);
	};

	var nv_setup_xhr = function (callback) {
		var info = this.infos[0];
		callback(null, {
			method: "GET",
			url: "http://ext.nicovideo.jp/api/getthumbinfo/" + info.vid,
			headers: { "Cookie": "" }
		});
	};
	var nv_parse_response = function (xhr, callback) {
		var xml = xlinks_api.parse_xml(xhr.responseText, null);
		if (xml === null) {
			callback("Invalid response");
		}
		else {
			callback(null, [ nv_parse_response_single(xml) ]);
		}
	};
	var nv_parse_response_single = function (xml) {
		var data, thumb, err, n1, n2;

		// Check for errors
		n1 = $("thumb", xml);
		if (n1 === null) {
			if ((n1 = $("error>code", xml)) !== null) {
				err = n1.textContent;
				if ((n2 = $("error>description", xml)) !== null) {
					err += " - " + n2.textContent;
				}
			}
			else {
				err = "Invalid response";
			}

			return { error: err };
		}
		xml = n1;

		// Create data
		data = {
			type: "nicovideo",
			subtype: "video",
			id: nv_select_text(xml, "video_id", ""),
			title: nv_select_text(xml, "title", "Unknown title"),
			description: nv_select_text(xml, "description", ""),
			date_created: parse_timestamp(nv_select_text(xml, "first_retrieve", "")),
			thumbnails: {},
			channel: {
				id: nv_select_text(xml, "user_id", ""),
				title: nv_select_text(xml, "user_nickname", ""),
				thumbnails: {}
			},
			video: {
				duration: nv_parse_duration(nv_select_text(xml, "length", ""))
			},
			info: {
				embeddable: (nv_select_text(xml, "embeddable", "1") === "1")
			},
			stats: {
				views: parseInt(nv_select_text(xml, "view_counter", "0"), 10) || 0,
				comments: parseInt(nv_select_text(xml, "comment_num", "0"), 10) || 0,
			}
		};

		if ((thumb = nv_select_text(xml, "thumbnail_url", "")).length > 0) {
			data.thumbnails.medium = thumb;
		}
		if ((thumb = nv_select_text(xml, "user_icon_url", "")).length > 0) {
			data.channel.thumbnails.medium = thumb;
		}

		// Done
		return data;
	};

	var nv_parse_duration = function (text) {
		var m = /(?:(\d+):)?(\d+):(\d+)/.exec(text);
		if (m === null) return 0;

		return parseInt(m[3], 10) +
			parseInt(m[2], 10) * 60 +
			(m[1] === undefined ? 0 : parseInt(m[1], 10)) * 3600;
	};
	var nv_select_text = function (root, selector, def) {
		var n = $(selector, root);
		return (n === null) ? def : n.textContent;
	};


	// Github Gist API
	var gg_url_get_info = function (url, callback) {
		var data = null,
			id, m, m2;

		if (
			(m = /(?:https?:\/*)?([\w\-\.]*)gist\.github\.com((?:\/[\w\W]*)?)/i.exec(url)) !== null &&
			(m2 = /^\/(?:[\w\-]+\/)?(\w+)/i.exec(m[2])) !== null
		) {
			id = m2[1];

			data = {
				id: "github_gist_" + id,
				site: "githubgist",
				gid: id,
				tag: "Gist",
				classes_remove: [ "gist" ]
			};
		}

		if (data !== null) iconify_info(data);
		callback(null, data);
	};
	var gg_url_info_to_data = function (url_info, callback) {
		xlinks_api.request("githubgist", "gist", url_info.id, url_info, callback);
	};

	var gg_setup_xhr = function (callback) {
		var info = this.infos[0];
		callback(null, {
			method: "GET",
			url: "https://api.github.com/gists/" + info.gid,
			headers: { "Cookie": "" }
		});
	};
	var gg_parse_response = function (xhr, callback) {
		var json = xlinks_api.parse_json(xhr.responseText, null);
		if (!xlinks_api.is_object(json)) {
			callback("Invalid response");
		}
		else {
			callback(null, [ gg_parse_response_single(json) ]);
		}
	};
	var gg_parse_response_single = function (response) {
		var files = objectify(response.files),
			owner = response.owner,
			owner_id = -1,
			owner_name = "Anonymous",
			data, title, description, f, fdata;

		// Title and description
		title = response.description || "";
		description = "";

		for (f in files) {
			if (!title) title = f;
			fdata = objectify(files[f]);

			if (fdata.language) f += " (" + fdata.language + ")";

			description = gg_get_content(f, fdata.content || "");

			break;
		}

		if (!title) title = "Unnamed Github Gist";

		// Owner
		if (xlinks_api.is_object(owner)) {
			owner_id = owner.id || 0;
			owner_name = owner.login || "";
		}

		// Create data
		data = {
			type: "githubgist",
			subtype: "gist",
			id: response.id || "",
			title: title,
			description: description,
			date_created: parse_timestamp(response.created_at || ""),
			thumbnails: {},
			channel: {
				id: owner_id,
				title: owner_name
			},
			info: {
				privacy: (response.public ? "public" : "unlisted")
			},
			stats: {
				comments: response.comments || 0,
				changes: (Array.isArray(response.history) ? Math.max(0, response.history.length - 1) : 0)
			}
		};

		if (owner && (f = owner.avatar_url)) {
			data.thumbnails.medium = f;
		}

		// Done
		return data;
	};

	var gg_get_content = function (title, content) {
		var ext = "...",
			max_len = 2048,
			max_line_len = 100,
			i, ii, line;

		content = content.replace(re_newlines, "\n").split("\n");
		content.splice(10, content.length - 10);
		for (i = 0, ii = content.length; i < ii; ++i) {
			line = content[i];
			if (line.length > max_line_len) content[i] = line.substr(0, max_line_len - ext.length) + ext;
		}

		content = content.join("\n");
		if (content.length > max_len) content = content.substr(0, max_len);

		return title + "\n" + content;
	};


	// Init
	xlinks_api.init({
		namespace: "multimedia",
		name: "Multimedia",
		author: "#{json:#author}#",
		description: "#{json:#description}#",
		version: [/*#{version:,}#*/],
		registrations: 1,
		main: main_fn
	}, function (err) {
		if (err === null) {
			xlinks_api.insert_styles("#{style:../../resources/stylesheets/extensions/multimedia.css}#");

			xlinks_api.register({
				settings: {
					sites: [ // namespace
						[ "youtube", true, "youtube.com", "Enable link processing for YouTube" ],
						[ "vimeo", true, "vimeo.com", "Enable link processing for Vimeo" ],
						[ "soundcloud", true, "soundcloud.com", "Enable link processing for SoundCloud" ],
						[ "dailymotion", true, "dailymotion.com", "Enable link processing for DailyMotion" ],
						[ "liveleak", true, "liveleak.com", "Enable link processing for LiveLeak" ],
						[ "vine", true, "vine.co", "Enable link processing for Vine" ],
						[ "twitter", true, "twitter.com", "Enable link processing for Twitter" ],
						[ "livestream", true, "livestream.com", "Enable link processing for Livestream" ],
						[ "nicovideo", true, "nicovideo.jp", "Enable link processing for Niconico" ],
						[ "githubgist", true, "gist.github.com", "Enable link processing for Github Gists" ],
					],
					multimedia: [
						[ "iconify", true, "Icon site tags", "Use site-specific icons instead of [Site] tags" ],
						[ "youtube_api_key", "", "Custom YouTube API key", "Use a custom API key for the YouTube Data API v3 (leave blank for default)", { type: "textbox" } ]
					],
				},
				request_apis: [
					// Youtube
					{
						group: "youtube",
						namespace: "youtube",
						type: "video",
						count: 50,
						concurrent: 1,
						delay_okay: 100,
						delay_error: 5000,
						functions: {
							get_data: generic_get_data,
							set_data: generic_set_data,
							setup_xhr: yt_setup_xhr,
							parse_response: yt_parse_response
						}
					},
					{
						group: "youtube",
						namespace: "youtube",
						type: "channel",
						count: 50,
						concurrent: 1,
						delay_okay: 100,
						delay_error: 5000,
						functions: {
							get_data: generic_get_data,
							set_data: generic_set_data,
							setup_xhr: yt_channel_setup_xhr,
							parse_response: yt_channel_parse_response
						}
					},
					{
						group: "youtube",
						namespace: "youtube",
						type: "user",
						count: 1,
						concurrent: 10,
						delay_okay: 100,
						delay_error: 5000,
						functions: {
							get_data: generic_get_data,
							set_data: generic_set_data,
							setup_xhr: yt_channel_setup_xhr,
							parse_response: yt_channel_parse_response
						}
					},
					// Vimeo
					{
						group: "vimeo",
						namespace: "vimeo",
						type: "video",
						count: 1,
						concurrent: 1,
						delay_okay: 100,
						delay_error: 5000,
						functions: {
							get_data: generic_get_data,
							set_data: generic_set_data,
							setup_xhr: vimeo_setup_xhr,
							parse_response: vimeo_parse_response
						}
					},
					{
						group: "vimeo",
						namespace: "vimeo",
						type: "user",
						count: 1,
						concurrent: 1,
						delay_okay: 100,
						delay_error: 5000,
						functions: {
							get_data: generic_get_data,
							set_data: generic_set_data,
							setup_xhr: vimeo_user_setup_xhr,
							parse_response: vimeo_user_parse_response
						}
					},
					{
						group: "vimeo",
						namespace: "vimeo",
						type: "channel",
						count: 1,
						concurrent: 1,
						delay_okay: 100,
						delay_error: 5000,
						functions: {
							get_data: generic_get_data,
							set_data: generic_set_data,
							setup_xhr: vimeo_channel_setup_xhr,
							parse_response: vimeo_channel_parse_response
						}
					},
					// SoundCloud
					{
						group: "soundcloud",
						namespace: "soundcloud",
						type: "generic",
						count: 1,
						concurrent: 1,
						delay_okay: 100,
						delay_error: 5000,
						functions: {
							get_data: generic_get_data,
							set_data: generic_set_data,
							setup_xhr: sc_setup_xhr,
							parse_response: sc_parse_response
						}
					},
					// DailyMotion
					{
						group: "dailymotion",
						namespace: "dailymotion",
						type: "video",
						count: 1,
						concurrent: 1,
						delay_okay: 100,
						delay_error: 5000,
						functions: {
							get_data: generic_get_data,
							set_data: generic_set_data,
							setup_xhr: dm_setup_xhr,
							parse_response: dm_parse_response
						}
					},
					{
						group: "dailymotion",
						namespace: "dailymotion",
						type: "user",
						count: 1,
						concurrent: 1,
						delay_okay: 100,
						delay_error: 5000,
						functions: {
							get_data: generic_get_data,
							set_data: generic_set_data,
							setup_xhr: dm_user_setup_xhr,
							parse_response: dm_user_parse_response
						}
					},
					// LiveLeak
					{
						group: "liveleak",
						namespace: "liveleak",
						type: "video",
						count: 1,
						concurrent: 1,
						delay_okay: 200,
						delay_error: 5000,
						functions: {
							get_data: generic_get_data,
							set_data: generic_set_data,
							setup_xhr: ll_setup_xhr,
							parse_response: ll_parse_response
						}
					},
					// Vine
					{
						group: "vine",
						namespace: "vine",
						type: "generic",
						count: 1,
						concurrent: 1,
						delay_okay: 100,
						delay_error: 5000,
						functions: {
							get_data: generic_get_data,
							set_data: generic_set_data,
							setup_xhr: vine_setup_xhr,
							parse_response: vine_parse_response
						}
					},
					// Twitter
					{
						group: "twitter",
						namespace: "twitter",
						type: "generic",
						count: 1,
						concurrent: 1,
						delay_okay: 100,
						delay_error: 5000,
						functions: {
							get_data: generic_get_data,
							set_data: generic_set_data,
							setup_xhr: twitter_setup_xhr,
							parse_response: twitter_parse_response
						}
					},
					// Livestream
					{
						group: "livestream",
						namespace: "livestream",
						type: "video",
						count: 1,
						concurrent: 1,
						delay_okay: 200,
						delay_error: 5000,
						functions: {
							get_data: generic_get_data,
							set_data: generic_set_data,
							setup_xhr: ls_setup_xhr,
							parse_response: ls_parse_response
						}
					},
					{
						group: "livestream",
						namespace: "livestream",
						type: "channel",
						count: 1,
						concurrent: 1,
						delay_okay: 200,
						delay_error: 5000,
						functions: {
							get_data: generic_get_data,
							set_data: generic_set_data,
							setup_xhr: ls_channel_setup_xhr,
							parse_response: ls_channel_parse_response
						}
					},
					// Nicovideo
					{
						group: "nicovideo",
						namespace: "nicovideo",
						type: "video",
						count: 1,
						concurrent: 1,
						delay_okay: 200,
						delay_error: 5000,
						functions: {
							get_data: generic_get_data,
							set_data: generic_set_data,
							setup_xhr: nv_setup_xhr,
							parse_response: nv_parse_response
						}
					},
					// Github Gist
					{
						group: "githubgist",
						namespace: "githubgist",
						type: "gist",
						count: 1,
						concurrent: 1,
						delay_okay: 200,
						delay_error: 5000,
						functions: {
							get_data: generic_get_data,
							set_data: generic_set_data,
							setup_xhr: gg_setup_xhr,
							parse_response: gg_parse_response
						}
					},
				],
				linkifiers: [{
					regex: /(https?:\/*)?[\w\-\.]*(?:youtube\.com?(?:\.[a-z]{2})?|youtu\.be|y2u\.be|vimeo\.com|soundcloud\.com|dailymotion\.com|liveleak\.com|vine\.co|twitter\.com|livestream\.com|nicovideo\.jp|gist\.github\.com)(?:\/[^<>()\s\'\"]*)?/i,
					prefix_group: 1,
					prefix: "http://",
				}],
				commands: [
					{
						url_info: yt_url_get_info,
						to_data: yt_url_info_to_data,
						actions: yt_create_actions,
						details: generic_create_details
					},
					{
						url_info: vimeo_url_get_info,
						to_data: vimeo_url_info_to_data,
						details: generic_create_details
					},
					{
						url_info: sc_url_get_info,
						to_data: sc_url_info_to_data,
						details: generic_create_details
					},
					{
						url_info: dm_url_get_info,
						to_data: dm_url_info_to_data,
						details: generic_create_details
					},
					{
						url_info: ll_url_get_info,
						to_data: ll_url_info_to_data,
						details: generic_create_details
					},
					{
						url_info: vine_url_get_info,
						to_data: vine_url_info_to_data,
						details: generic_create_details
					},
					{
						url_info: twitter_url_get_info,
						to_data: twitter_url_info_to_data,
						details: generic_create_details
					},
					{
						url_info: ls_url_get_info,
						to_data: ls_url_info_to_data,
						details: generic_create_details
					},
					{
						url_info: nv_url_get_info,
						to_data: nv_url_info_to_data,
						details: generic_create_details
					},
					{
						url_info: gg_url_get_info,
						to_data: gg_url_info_to_data,
						details: generic_create_details
					}
				]
			}, function (err) {
				if (err === null) {
					var s = xlinks_api.config.multimedia.youtube_api_key;
					if (s.length === yt_api_key.length) {
						yt_api_key = s;
					}

					use_icons = xlinks_api.config.multimedia.iconify;
				}
			});
		}
	});

	};
	main(xlinks_api);

})();

