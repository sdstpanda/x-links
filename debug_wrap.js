/* jshint eqnull:true, noarg:true, noempty:true, eqeqeq:true, bitwise:false, strict:true, undef:true, curly:false, node:true, browser:true, devel:true, newcap:false, maxerr:50 */
(function (module) {
	"use strict";

	var Complexion = require("complexion"),
		ComplexionJS = require("complexion-js");

	// begin_debug

	var wrap_setup = function () {
		var node = null;
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
			if (node === null) {
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

				node = n2;
			}

			var s = "";
			if (node.value.length > 0) s += "\n====================\n";
			s += "" + exception + "\n" + (format_stack("" + exception.stack));
			node.value += s;

			console.log("Exception:", exception);
		};
		try {
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
		}
		catch (e) {}
	};

	var stringify_function = function (fn, indent) {
		return fn.toString().replace(/\n\t/g, "\n" + indent);
	};

	var debug_wrap_code = function (source) {
		var instance = new Complexion(),
			parens = 0,
			start_parens = -1,
			token_pre = null,
			function_starts = [],
			output = "",
			tokens, token, before, after, indent, c, i;

		ComplexionJS(instance);
		tokens = instance.tokenize(source);

		for (i = 0; i < tokens.length; ++i) {
			token = tokens[i];
			before = "";
			after = "";
			c = token.content;

			if (!token.isAnyType([ "WHITESPACE", "LINE_TERMINATOR", "SINGLE_LINE_COMMENT", "MULTI_LINE_COMMENT", "BOM", "SHEBANG", "UNKNOWN", "IMPLICIT_SEMICOLON" ])) {
				if (token.isType("KEYWORD")) {
					if (c === "function") {
						function_starts.push(parens);
					}
				}
				else if (token.isType("PUNCTUATOR")) {
					if (c === "[" || c === "(" || c === "{") {
						++parens;
					}
					else if (c === "]" || c === ")" || c === "}") {
						--parens;
						if (c === "}" && function_starts.length > 0 && function_starts[function_starts.length - 1] === parens) {
							function_starts.pop();
							if (start_parens >= 0 && parens >= start_parens) {
								after = "._w()";
							}
						}
					}
				}
				token_pre = token;
			}
			else if (start_parens < 0 && token.isType("SINGLE_LINE_COMMENT")) {
				if (/\/\/\s*begin_debug\s*/.test(c)) {
					start_parens = parens;
					indent = /(?:^|\n)([\t ]*)$/.exec(output);
					indent = (indent === null) ? "" : indent[1];
					c = "(" + stringify_function(wrap_setup, indent) + ")();";
				}
			}

			// Output
			output += before;
			output += c;
			output += after;
		}

		return output;
	};

	module.exports = {
		debug_wrap_code: debug_wrap_code
	};

})(module);

