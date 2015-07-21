
var snip = require './snippets'
var code = snip.NODES
var compiler  = require "../../../lib/compiler"
# var compiler  = require "/repos/imba/lib/compiler"
var rawtokens = compiler.tokenize(code, rewrite: no)
var tokens = compiler.tokenize(code, filename: "a")
var ast = compiler.parse(tokens, filename: "a")

var arg = process:argv[2]
# console.log compiler:ast
# compiler:ast.compile(ast)

# fs.writeFileSync("{__dirname}/snippets.imba","¨`LONG_SAMPLE = {JSON.stringify(code)};`")

# class Token
# 
# 	def initialize value, spaced
# 		@value = value
# 		@spaced = spaced

var helper = require './helper'
var b = helper.Benchmark.new "tokenize", maxTime: 1

(!arg or arg == 'lex') and b.add('lex') do
	compiler.tokenize(code, rewrite: no) # hmm

(!arg or arg == 'rewrite') and b.add('rewrite') do
	var arr = rawtokens.slice
	compiler.rewrite(arr) # hmm

# add tests
# b.add('tokenize') do
# 	compiler.tokenize(code) # hmm

(!arg or arg == 'parse') and b.add('parse') do
	compiler.parse(tokens, filename: "a") # hmm


(!arg or arg == 'compile') and b.add('compile') do
	var ast = compiler.parse(tokens)
	ast.compile(ast) # hmm

(!arg or arg == 'full') and b.add('full') do
	compiler.compile(code,filename: "a")
	return


# b.add('Token') do
# 	var arr = []
# 
# 	var count = 200
# 	while --count
# 		var str = "mystring"
# 		var val = Token.new(str,yes)
# 		arr.push(val)
# 	true

# run async
console.log process:argv
b.run()