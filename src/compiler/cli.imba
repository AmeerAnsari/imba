
var fs        = require 'fs'
var path      = require 'path'
var cli       = require 'commander'
var chalk     = require 'chalk'

var orig = cli:helpInformation
var cliproto = cli:constructor:prototype

var package = require '../../package.json'
var ERR = require './errors'

def cliproto.helpInformation
	var str = orig.call(self)

	str = str.replace(/(Options|Usage|Examples|Commands)\:/g) do |m| chalk.bold m
	return str

# console.time("compiler")
var tasks = require './tasks'
var compiler  = require './compiler'
var fspath = path
var T = require './token'
# console.timeEnd("compiler")

var parser = compiler:parser

# really?
# wrapper for files?
# this caches an awful lot now - no need before we introduce a shared worker++
class SourceFile
	
	prop path
	prop meta

	def initialize path
		@path = path
		@code = nil
		@js = nil
		self

	def name
		path.split("/").pop # for testing

	def code
		@code ||= fs.readFileSync(@path,"utf8")

	def tokens
		@tokens ||= compiler.tokenize(code)

	def ast
		@ast ||= parser.parse(tokens)
		
	def js o = {}
		@js ||= ast.compile(o)

	def write outpath, cb
		# promise.new do |resolve|
		# await self.compile
		fs.writeFileSync(outpath,js)

	def dirty
		# console.log "marking file as dirty!"
		# simply removing all info abou tfiles
		@prevcode = @code
		@code = @js = @tokens = @ast = @meta = null
		@read = @tokenize = @compile = @parse = @analyze = null
		self

	# could analyze with different options - caching promise might not be the
	# best approach for this.
	def analyze cb
		if @meta
			cb and cb(@meta)
			return @meta

		# STACK:_loglevel = 0 # not here?
		var errors = []
		var err = null
		var data = {}

		try
			@meta = ast.analyze(loglevel: 0)
			cb and cb(@meta)
			# resolve(self.meta)
		catch e
			# console.log "something wrong {e:message}"
			unless e isa ERR.ImbaParseError
				if e:lexer
					e = ERR.ImbaParseError.new(e, tokens: e:lexer:tokens, pos: e:lexer:pos)
				else
					throw e
					# e = {message: e:message}

				
			@meta = {warnings: [e]}
			cb and cb(@meta)

		return @meta
		
	def run
		process:argv.pop
		process:argv[0] = 'imba'
		compiler.run(code, filename: @path)

	def htmlify
		var out = compiler.highlight(code,filename: @path)
		fs.writeFileSync(@path.replace(/\.imba$/,'.html'),out)
		console.log "htmlify code",out
		return out



def log *pars
	console.log(*pars)

def ts
	var d = Date.new.toISOString.substr(11,8)
	chalk.dim d

def b *pars
	chalk.bold(*pars)

def dim
	chalk:dim

def puts str
	process:stdout.write str

def print str
	process:stdout.write str
	

def print-tokens tokens
	var strings = for t in tokens
		var typ = T.typ(t)
		var id = T.val(t)

		if typ == 'TERMINATOR'
			continue "[" + chalk.yellow(id.replace(/\n/g,"\\n")) + "]"

		if id == typ
			"[" + chalk.red(id) + "]"
		else
			id = chalk.white(id)
			chalk.grey "[{typ} {id}]"

	log strings.join(' ')


def ensure-dir path
	return yes if fs.existsSync(path)
	var parts = path.split(fspath:sep)
	for part,i in parts
		# what about relative paths here? no good? might be important for symlinks etc no?
		var path = fspath:sep + fspath.join(*parts.slice(0,i + 1))
		if fs.existsSync(path)
			var stat = fs.statSync(path)
		elif part.match(/\.(imba|js)$/)
			yes
		else
			fs.mkdirSync(path)
			log chalk.green("+ mkdir {path}")
	return


def sourcefile-for-path path
	path = fspath.resolve(process.cwd, path)
	SourceFile.new(path)

def printCompilerError e, source: null, tok: null, tokens: null
	#  return printError(e,source: source)
	# console.log "error {e}"
	var lex = e:lexer

	tok ||= lex and lex:yytext
	tokens ||= lex and lex:tokens

	var src = source and source.code
	var lines = src and src.split(/\n/g)

	# log "OH NOH"

	var lnum = do |l, color = 'grey'|
		var s = String(l + 1)
		while s:length < 6
			s = ' ' + s
		return dim[color]('    ' + s + '  ')


	def printLn nr, errtok
		var pos = lex and lex:pos or 0
		var ln = lines[nr]
		var prefix = lnum(nr,errtok ? 'red' : 'grey')

		return log(prefix) unless ln

		# log lnum(nr)

		var colors = {
			NUMBER: chalk:blue
			STRING: chalk:green
			KEYWORD: chalk:gray
			PUNCTUATION: chalk:white
			IDENTIFIER: chalk:bold
			ERR: chalk:bold:red:underline
		}

		# first get the pos up to the wanted line
		while var tok = tokens[++pos]
			break if tok.@line > nr

		while var tok = tokens[--pos]
			continue if tok.@col == -1 # generated

			var l = tok.@line
			# log "looping token {tok.@line} {tok.@col}"
			continue if l > nr
			break if l < nr
			# log "breakign at line {tok.@line}"
			# log "highlight {tok.@type}"
			var typ = tok.@type
			var col = tok.@col
			var len = tok.@len or tok.@value:length

			typ = 'KEYWORD' if typ:length > 1 and typ == tok.@value.toUpperCase
			typ = 'PUNCTUATION' if typ.match(/^[\[\]\{\}\(\)\,]/)
			if tok == errtok
				typ = 'ERR'

			if var fmt = colors[typ]
				ln = ln.substr(0,col) + fmt(ln.substr(col,len)) + ln.slice(col + len)

		log prefix + ln

		return
		

		
	# select the lines to show
	# go backwards in tokenlist and colorize the string if type
	# try first on the single line
	# var character = src.charAt(tok.@loc)
	# var c2 = lines[tok.@line].charAt(tok.@col + 1)

	log " - " + chalk.red(e:message)  # + character + c2


	if tok and src
		log(chalk.grey("    ------") + "  ------------------")
		var lines = src.split(/\n/g)

		# find the closest non-generated token to show error
		var tpos = tokens.indexOf(tok)
		while tok and tok.@col == -1
			tok = tokens[--tpos]

		var ln = tok.@line
		var col = tok.@col

		printLn(ln - 3)
		printLn(ln - 2)
		printLn(ln - 1)
		printLn(ln,tok)
		printLn(ln + 1)
		log(chalk.grey("    ------") + "  ------------------")
		# log ln,col
	return



def write-file source, outpath
	ensure-dir(outpath)
	# var outpath = source.path.replace(/\.imba$/,'.js')
	# destpath = destpath.replace(basedir,outdir)
	return unless source.dirty

	var srcp = fspath.relative(process.cwd,source.path)
	var outp = fspath.relative(process.cwd,outpath)

	var str = ts + " " + chalk:dim.grey("compile {b chalk.white srcp} to {b chalk.white outp}")
	# console.log ts, str
	print str

	# log "made dirty"
	# log ts, chalk:dim.grey "will compile {source.path}"
	try
		var start = Date.now
		var code = compiler.compile(source.code, filename: source.path)
		var time = Date.now - start
		var ok = true
		print " - " + chalk:dim.grey("{time}ms") + "\n"

		if code:warnings
			for warn,i in code:warnings
				# print String(warn:token)
				if warn:type == 'error'
					ok = false
					# print chalk.red "    {b 'error'}: {warn:message} {warn:loc}"
					printCompilerError(warn, source: source, tok: warn:token, tokens: code:options.@tokens)
				else
					print chalk.yellow "    {b 'warning'}: {warn:message}"

				# if warn:token
				# 	print String(warn:token.@len)

		fs.writeFileSync(outpath,code:js or code) if ok

	catch e
		# print " - " + chalk:dim.red("failed") + "\n"
		printCompilerError(e, source: source) # e:message + "\n"
	return

# shared action for compile and watch
def cli-compile root, o, watch: no
	
	var base = fspath.resolve(process.cwd, root)
	var basedir = base
	var exists  = fs.existsSync(base)
	var stat    = fs.statSync(base)
	var isFile  = no

	if stat.isDirectory
		log "dirname {fspath.dirname(base)} {base}"
		# base += fspath:sep unless fspath.dirname(base) == base
		log chalk.magenta "--- watch dir: {b base}" if watch
	else
		isFile = yes
		basedir = fspath.dirname(base)
		log chalk.magenta "--- watch file: {b base}" if watch

	# what if it does not exist
	# log "stat",stat

	var dirs = basedir.split(fspath:sep)
	var out  = o:output ? fspath.resolve(process.cwd, o:output) : basedir
	var outdir = out

	unless o:output
		var srcIndex = dirs.indexOf('src')
		if srcIndex >= 0
			dirs[srcIndex] = 'lib'
			var libPath = fspath:sep + fspath.join(*dirs)
			# absolute paths here?
			var libExists = fs.existsSync(libPath)
			outdir = out = libPath
			# log chalk.blue "--- found dir: {b libPath}" if watch
	
	# compiling a single file - no need to require chokidar at all
	if isFile and !watch
		var source = sourcefileForPath(base)
		var destpath = source.path.replace(/\.imba$/,'.js').replace(basedir,outdir)
		write-file(source,destpath)
		return

	log chalk.blue "--- write dir: {b out}"

	var sources = {}

	# it is bad practice to require modules inside methods, but chokidar takes
	# some time to load, and we really dont want that for single-file compiles
	var chokidar = require 'chokidar'
	var watcher = chokidar.watch(base, ignored: /[\/\\]\./, persistent: watch)

	watcher.on('all') do |event,path|
		# need to fix on remove as well!
		# log "watcher {event} {path}"
		if path.match(/\.imba$/) and (event == 'add' or event == 'change')
			var realpath = fspath.resolve(process.cwd, path)
			var source = sources[realpath] ||= sourcefileForPath(realpath)
			var destpath = source.path.replace(/\.imba$/,'.js')
			destpath = destpath.replace(basedir,outdir)
			# should supply the dir
			# log "write file {destpath}"
			write-file(source,destpath)
	return

cli.version(package:version)

cli.command('* <path>')
	.usage('<path>')
	.description('run imba')
	.action do |path,o|
		var file = sourcefile-for-path(path)
		file.run


cli.command('compile <path>')
	.description('compile scripts')
	.option('-o, --output [dest]', 'set the output directory for compiled JavaScript')
	.action do |path,o| cli-compile path, o, watch: no

cli.command('watch <path>')
	.description('listen for changes and compile scripts')
	.option('-o, --output [dest]', 'set the output directory for compiled JavaScript')
	.action do |root,o| cli-compile(root,o,watch: yes)

cli.command('analyze <path>')
	.description('get information about scopes, variables and more')
	.option('-v, --verbose', 'return detailed output')
	.option('-t, --tokens', 'return detailed output')
	.action do |path, opts|
		var file = sourcefile-for-path(path)

		if opts:tokens
			# log "tokens"
			print-tokens(file.tokens)
		else
			file.analyze do |meta|
				log JSON.stringify(meta)

cli.command('export <path>')
	.description('create highlighted snippet of script')
	.option('-v, --verbose', 'return detailed output')
	.option('-t, --tokens', 'return detailed output')
	.action do |path, opts|
		var file = sourcefile-for-path(path)
		var out = file.htmlify # do |meta| log JSON.stringify(meta)
		log JSON.stringify(out)
		return 

cli.command('dev <task>')
	.description('commands for imba-development')
	.action do |cmd,o|
		if tasks[cmd] isa Function
			tasks[cmd](o)
		else
			log chalk.red("could not find task {b cmd}")


export def run argv
	return cli.outputHelp if process:argv:length < 3
	cli.parse(argv)

