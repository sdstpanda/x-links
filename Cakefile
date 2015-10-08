{log}    = console
{exec}   = require 'child_process'
fs       = require 'fs'
{minify} = require 'html-minifier'
ugly     = require 'uglify-js'
pkg      = require './package.json'
CleanCSS = require 'clean-css'
debug_wrap = require './debug_wrap'


CAKEFILE  = 'Cakefile'
INFILE    = 'h-links.js'
ELEMENTS  = './elements'
IMAGES    = './images'
STYLEFILE = 'style.css'
OUTFILE   = 'h-links.user.js'
OUTFILEDB = 'h-links.debug.user.js'
LATEST    = 'latest.js'
CHANGELOG = 'changelog'

ICON48    = IMAGES + '/icon/h48.png'
ICON64    = IMAGES + '/icon/h64.png'


option '-o', '--output [output]', 'Specify output location.'
option '-u', '--uglify [uglify]', 'Minify with UglifyJS. Options: "mangle,squeeze"'
option '-v', '--version [version]', 'Release version.'


build = (output, version, tag, no_update, debug) ->
	jsp = ugly.parser
	pro = ugly.uglify
	output_meta = output.replace /\.user\./, ".meta."

	header = "// ==UserScript==\n"
	header += "// @name        #{pkg.name}#{tag || ''}\n"
	header += "// @namespace   #{pkg.custom.namespace}\n"
	header += "// @author      #{pkg.author}\n"
	header += "// @version     #{version}\n"
	header += "// @description #{pkg.description}\n"
	header += (("// @include     #{a}\n" for a in pkg.custom.targets).join "")
	header += "// @homepage    #{pkg.homepage}\n"
	header += "// @supportURL  #{pkg.bugs.url}\n"
	if !no_update
		header += "// @updateURL   #{pkg.custom.update_url_base}#{output_meta}\n"
		header += "// @downloadURL #{pkg.custom.update_url_base}#{output}\n"
	header += "// @icon        data:image/png;base64,#{(fs.readFileSync ICON48).toString 'base64'}\n"
	header += "// @icon64      data:image/png;base64,#{(fs.readFileSync ICON64).toString 'base64'}\n"
	header += (("// @grant       #{a}\n" for a in pkg.custom.gm_permissions).join "")
	header += "// @run-at      document-start\n"
	header += "// ==/UserScript=="

	html = {}
	store = (path) ->
		dest = {}
		files = fs.readdirSync path
		for file in files
			ext = file.split '.'
			input = fs.readFileSync path+'/'+file, 'utf8'
			input = minify input, { removeComments: true, collapseWhitespace: true }
			input = input.replace /\#{([^}]*)}/g, "'+$1+'"
			dest[ext[0]] = input
		return dest

	html = store ELEMENTS
	input = fs.readFileSync INFILE, 'utf8'
	style = fs.readFileSync STYLEFILE, 'utf8'
	style = new CleanCSS({}).minify(style).styles
	input = input.replace /\#DETAILS\#/g, html.details
	input = input.replace /\#OPTIONS\#/g, html.options
	input = input.replace /\/\*\#VERSION\#\*\//g, (version.split ".").join ","
	input = input.replace /\#HOMEPAGE\#/g, pkg.homepage
	input = input.replace /\#ISSUES\#/g, pkg.bugs.url
	input = input.replace /\#CHANGELOG\#/g, pkg.custom.changelog_url
	input = input.replace /\"\#STYLESHEET\#\"/g, (JSON.stringify style)
	#"# good work syntax highlighter
	input = input.replace /\#TITLE\#/g, pkg.name
	input = input.replace /\#TITLE_2CHAR\#/g, pkg.custom.name_short
	input = input.replace /\#PREFIX\#/g, pkg.custom.settings_prefix
	input = input.replace /\/\*\s*(jshint|globals)\s+.*\*\/(?:\r?\n)?/g, ''

	input = header + "\n" + input

	if debug
		input = debug_wrap.debug_wrap_code input

	fs.writeFileSync output, input, 'utf8', (err) ->
		throw err if err
	if !no_update
		fs.writeFileSync output_meta, header, 'utf8', (err) ->
			throw err if err

task 'build', (options) ->
	build options.output || OUTFILE, pkg.version, '', false, false
	build options.output_debug || OUTFILEDB, pkg.version + '.1', ' (debug)', true, true
	log 'Build successful!'

task 'dev', (options) ->
	invoke 'build'
	fs.watchFile INFILE, interval: 250, (curr, prev) ->
		if curr.mtime > prev.mtime
			invoke 'build'
	fs.watchFile './elements/details.htm', interval: 250, (curr, prev) ->
		if curr.mtime > prev.mtime
			invoke 'build'
	fs.watchFile './elements/options.htm', interval: 250, (curr, prev) ->
		if curr.mtime > prev.mtime
			invoke 'build'
	fs.watchFile './style.css', interval: 250, (curr, prev) ->
		if curr.mtime > prev.mtime
			invoke 'build'
###
task 'release', (options) ->
	{version} = options
	unless version
		console.warn 'Version argument not specified. Exiting.'
		return
	regexp = RegExp pkg.version, 'g'
	for file in [CAKEFILE, INFILE, OUTFILE]
		data = fs.readFileSync file, 'utf8'
		fs.writeFileSync file, data.replace regexp, version
		data = fs.readFileSync CHANGELOG, 'utf8'
		fs.writeFileSync CHANGELOG, data.replace 'master', "master\n\n#{version}"
		exec "git commit -am 'Release #{version}.'"
		exec "git tag -a #{version} -m '#{version}'"
		exec "git tag -af stable -m '#{version}'"
###