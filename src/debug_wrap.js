/* jshint eqnull:true, noarg:true, noempty:true, eqeqeq:true, bitwise:false, strict:true, undef:true, curly:false, node:true, browser:true, devel:true, newcap:false, maxerr:50 */
(function (module) {
	"use strict";

	var Complexion = require("complexion"),
		ComplexionJS = require("complexion-js");

	// begin_debug

	var wrap_setup_simple = function () {
		var error_node = null;
		var format_stack = function (stack) {
			var output = "",
				line, i, ii;
			stack = stack.trim().replace(/\r\n/g, "\n").split("\n");
			for (i = 0, ii = stack.length; i < ii; ++i) {
				line = stack[i];
				line = line.replace(/(@file:)(?:.*?)([^\/\\\\]+)$/, "$1$2");
				if (i > 0) output += "\n";
				output += line;
			}
			return output;
		};
		var log = function (exception) {
			if (error_node === null) {
				var n0 = document.body || document.documentElement,
					n1 = document.createElement("div"),
					n2 = document.createElement("textarea");

				n1.setAttribute("style", "position:fixed!important;right:0!important;top:0!important;bottom:0!important;width:20em!important;opacity:0.8!important;background:#fff!important;color:#000!important;z-index:999999999!important;");
				n2.setAttribute("style", "position:absolute!important;left:0!important;top:0!important;width:100%!important;height:100%!important;padding:0.5em!important;margin:0!important;color:inherit!important;background:transparent!important;font-family:inherit!important;font-size:8px!important;line-height:1.1em!important;border:none!important;resize:none!important;font-family:Courier,monospace!important;box-sizing:border-box!important;");
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

		Function.prototype._w = function () {
			var fn = this;
			return function () {
				try {
					return fn.apply(this, arguments);
				}
				catch (e) {
					log(e);
					throw e;
				}
			};
		};
	};

	var wrap_setup = function () {
		var error_node = null;
		var function_names = [];
		var total_counter = 0;
		var function_counters = {};
		var format_stack = function (stack) {
			var output = "",
				line, i, ii;
			stack = stack.trim().replace(/\r\n/g, "\n").split("\n");
			for (i = 0, ii = stack.length; i < ii; ++i) {
				line = stack[i];
				line = line.replace(/(@file:)(?:.*?)([^\/\\\\]+)$/, "$1$2");
				if (i > 0) output += "\n";
				output += line;
			}
			return output;
		};
		var log = function (exception) {
			if (error_node === null) {
				var n0 = document.body || document.documentElement,
					n1 = document.createElement("div"),
					n2 = document.createElement("textarea");

				n1.setAttribute("style", "position:fixed!important;right:0!important;top:0!important;bottom:0!important;width:20em!important;opacity:0.8!important;background:#fff!important;color:#000!important;z-index:999999999!important;");
				n2.setAttribute("style", "position:absolute!important;left:0!important;top:0!important;width:100%!important;height:100%!important;padding:0.5em!important;margin:0!important;color:inherit!important;background:transparent!important;font-family:inherit!important;font-size:8px!important;line-height:1.1em!important;border:none!important;resize:none!important;font-family:Courier,monospace!important;box-sizing:border-box!important;");
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

		Function.prototype._w = function (fn_index) {
			var fn = this;
			return function () {
				++total_counter;
				if (fn_index in function_counters) {
					++function_counters[fn_index];
				}
				else {
					function_counters[fn_index] = 1;
				}

				try {
					return fn.apply(this, arguments);
				}
				catch (e) {
					log(e);
					throw e;
				}
			};
		};

		// Performance checking loop
		var check_interval_index = 0;
		setInterval(function () {
			++check_interval_index;
			if (total_counter === 0) return;

			var keys = Object.keys(function_counters),
				sortable = [],
				i;

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

			console.log("========================================");
			console.log("Debug Function Call Counter:", "Init + " + check_interval_index + "s: " + total_counter + " calls");
			console.log("Debug Function Call Counter:", sortable);
			console.log("========================================");
			total_counter = 0;
			function_counters = {};
		}, 1000);
	};

	var stringify_function = function (fn, indent) {
		return fn.toString().replace(/\n\t/g, "\n" + indent);
	};

	var debug_wrap_code = function (source, simple) {
		var instance = new Complexion(),
			parens = 0,
			start_parens = -1,
			token_pre = null,
			token_pre_name = null,
			function_starts = [],
			output = "",
			function_names = [],
			function_name_pos = -1,
			tokens, token, before, after, indent, name, fs, t, c, i;

		ComplexionJS(instance);
		tokens = instance.tokenize(source);

		for (i = 0; i < tokens.length; ++i) {
			token = tokens[i];
			before = "";
			after = "";
			c = token.content;

			if (!token.isAnyType([ "WHITESPACE", "LINE_TERMINATOR", "SINGLE_LINE_COMMENT", "MULTI_LINE_COMMENT", "BOM", "SHEBANG", "UNKNOWN" ])) {
				if (token.isType("KEYWORD")) {
					if (c === "function") {
						name = (token_pre_name === null ? "?" : token_pre_name.content);
						t = (function_starts.length > 0 ? function_names[function_starts[function_starts.length - 1][1]] : "?");
						if (t !== "?") name = t + "." + name;
						function_starts.push([ parens, function_names.length ]);
						function_names.push(name);
					}
				}
				else if (token.isType("PUNCTUATOR")) {
					if (c === "[" || c === "(" || c === "{") {
						++parens;
					}
					else if (c === "]" || c === ")" || c === "}") {
						--parens;
						if (
							c === "}" &&
							function_starts.length > 0 &&
							(fs = function_starts[function_starts.length - 1])[0] === parens
						) {
							function_starts.pop();
							if (start_parens >= 0 && parens >= start_parens) {
								after = "._w(" + fs[1] + ")";
							}
						}
					}
				}

				if (token.isAnyType([ "KEYWORD", "NULL_LITERAL", "NUMERIC_LITERAL", "IDENTIFIER_NAME" ])) {
					token_pre_name = token;
				}
				else if (token.isAnyType([ "PUNCTUATOR" ])) {
					if (c !== "[" && c !== "(" && c !== "{" && c !== ":" && c !== "=") {
						token_pre_name = null;
					}
				}
				else {
					token_pre_name = null;
				}

				token_pre = token;
			}
			else if (start_parens < 0 && token.isType("SINGLE_LINE_COMMENT")) {
				if (/\/\/\s*begin_debug\s*/.test(c)) {
					start_parens = parens;
					indent = /(?:^|\n)([\t ]*)$/.exec(output);
					indent = (indent === null) ? "" : indent[1];
					c = "(" + stringify_function(simple ? wrap_setup_simple : wrap_setup, indent) + ")();";

					// Position
					if (!simple) {
						function_name_pos = c.indexOf("var function_names = [];");
						if (function_name_pos >= 0) {
							function_name_pos += output.length + before.length + ("var function_names = ").length;
						}
					}
				}
			}

			// Output
			output += before;
			output += c;
			output += after;
		}

		if (function_name_pos >= 0) {
			output = output.substr(0, function_name_pos) + JSON.stringify(function_names) + output.substr(function_name_pos + 2);
		}

		return output;
	};

	module.exports = {
		debug_wrap_code: debug_wrap_code
	};

})(module);

