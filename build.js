/* jshint eqnull:true, noarg:true, noempty:true, eqeqeq:true, bitwise:false, strict:true, undef:true, curly:false, node:true, devel:true, newcap:false, maxerr:50 */
(function () {
	"use strict";

	var fs = require("fs"),
		path = require("path"),
		child_process = require("child_process"),
		html_minifier = require("html-minifier"),
		// uglyify_js = require("uglify-js"),
		CleanCSS = require("clean-css"),
		debug_wrap = require("./src/debug_wrap");


	var SCRIPT_SOURCE = "./src/h-links.js",
		OUTPUT_MAIN = "./builds/h-links.user.js",
		OUTPUT_DEBUG = "./builds/h-links.debug.user.js",
		PACKAGE_JSON = "./package.json",
		RESOURCES = "./resources",
		RES_STYLESHEET = RESOURCES + "/stylesheets/style.css",
		RES_HTML_SETTINGS = RESOURCES + "/html/settings.html",
		RES_ICON_X48 = RESOURCES + "/images/icon48.png",
		RES_ICON_X64 = RESOURCES + "/images/icon64.png";


	var pkg = require(PACKAGE_JSON);


	var mimes = {
		".png": "image/png",
		".jpg": "image/jpeg",
		".jpeg": "image/jpeg",
		".css": "text/css",
		"": "text/plain"
	};


	var html = function (path) {
		var input = fs.readFileSync(path, "utf8");
		input = html_minifier.minify(input, { removeComments: true, collapseWhitespace: true });
		input = input.replace(/\#{([^}]*)}/g, "'+$1+'");
		return input;
	};


	var resources = function (input) {
		input = input.replace(/\#RESOURCE_BASE64\:([^\#]+)\#/g, function (m, name) {
			var file = path.resolve(path.normalize(path.join(RESOURCES, name))),
				data = fs.readFileSync(file).toString("base64"),
				ext = path.extname(file).toLowerCase(),
				mime = mimes[(Object.prototype.hasOwnProperty.call(mimes, ext)) ? ext : ""];

			return "data:" + mime + ";base64," + data;
		});

		return input;
	};


	var build = function (output, version, tag, no_update, debug) {
		var output_meta = output.replace(/\.user\./, ".meta."),
			header = "",
			source, style, list, i, ii;

		header += "// ==UserScript==\n";
		header += "// @name        " + pkg.name + (tag || "") + "\n";
		header += "// @namespace   " + pkg.custom.namespace + "\n";
		header += "// @author      " + pkg.author + "\n";
		header += "// @version     " + version + "\n";
		header += "// @description " + pkg.description + "\n";
		for (list = pkg.custom.targets, i = 0, ii = list.length; i < ii; ++i) {
			header += "// @include     " + list[i] + "\n";
		}
		header += "// @homepage    " + pkg.homepage + "\n";
		header += "// @supportURL  " + pkg.bugs.url + "\n";
		if (!no_update) {
			header += "// @updateURL   " + pkg.custom.update_url_base + path.normalize(output_meta).replace(/\\/g, "/") + "\n";
			header += "// @downloadURL " + pkg.custom.update_url_base + path.normalize(output).replace(/\\/g, "/") + "\n";
		}
		header += "// @icon        data:image/png;base64," + fs.readFileSync(RES_ICON_X48).toString("base64") + "\n";
		header += "// @icon64      data:image/png;base64," + fs.readFileSync(RES_ICON_X64).toString("base64") + "\n";
		for (list = pkg.custom.gm_permissions, i = 0, ii = list.length; i < ii; ++i) {
			header += "// @grant       " + list[i] + "\n";
		}
		header += "// @run-at      document-start\n";
		header += "// ==/UserScript==";

		style = fs.readFileSync(RES_STYLESHEET, "utf8");
		style = resources(style);
		style = new CleanCSS({}).minify(style).styles;

		source = fs.readFileSync(SCRIPT_SOURCE, "utf8");

		source = source.replace(/\#OPTIONS\#/g, html(RES_HTML_SETTINGS));
		source = source.replace(/\/\*\#VERSION\#\*\//g, version.split(".").join(","));
		source = source.replace(/\#HOMEPAGE\#/g, pkg.homepage);
		source = source.replace(/\#ISSUES\#/g, pkg.bugs.url);
		source = source.replace(/\#CHANGELOG\#/g, pkg.custom.changelog_url);
		source = source.replace(/\"\#STYLESHEET\#\"/g, JSON.stringify(style));
		source = source.replace(/\#TITLE\#/g, pkg.name);
		source = source.replace(/\#TITLE_2CHAR\#/g, pkg.custom.name_short);
		source = source.replace(/\#PREFIX\#/g, pkg.custom.settings_prefix);
		source = source.replace(/\/\*\s*(jshint|globals)\s+.*\*\/(?:\r?\n)?/g, "");

		source = header + "\n" + source;

		if (debug) {
			source = debug_wrap.debug_wrap_code(source);
		}

		fs.writeFileSync(output, source, "utf8", function (err) {
			if (err) throw err;
		});

		if (!no_update) {
			fs.writeFileSync(output_meta, header, "utf8", function (err) {
				if (err) throw err;
			});
		}
	};


	var full_build = function () {
		build(OUTPUT_MAIN, pkg.version, "", false, false);
		build(OUTPUT_DEBUG, pkg.version + ".0xDB", " (debug)", true, true);

		process.stdout.write("Build successful!\n");

		var cmd = null,
			f;
		if (fs.existsSync((f = "./post_build.bat"))) {
			cmd = [ "cmd", "/s", "/c", f.replace(/\//g, "\\") ];
		}
		else if (fs.existsSync((f = "./post_build.sh"))) {
			cmd = [ f ];
		}

		if (cmd !== null) {
			child_process.spawnSync(cmd[0], cmd.slice(1), { stdio: "inherit" });
		}
	};
	var full_build_safe = function () {
		try {
			full_build();
		}
		catch (e) {
			var pad = "========================================\n";
			process.stderr.write(pad + "" + e + "\n" + pad);
		}
	};


	full_build_safe();
	if (process.argv[2] === "dev") {
		var check = function (curr, prev) {
			if (curr.mtime > prev.mtime) {
				pkg = require(PACKAGE_JSON);
				full_build_safe();
			}
		};
		var settings = { interval: 250 };

		fs.watchFile(SCRIPT_SOURCE, settings, check);
		fs.watchFile(RES_STYLESHEET, settings, check);
		fs.watchFile(RES_HTML_SETTINGS, settings, check);
		fs.watchFile(RES_ICON_X48, settings, check);
		fs.watchFile(RES_ICON_X64, settings, check);
		fs.watchFile(PACKAGE_JSON, settings, check);
	}

})();

