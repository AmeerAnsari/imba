
# var fs = require 'fs'
# var path = require 'path'
# var promise = require 'bluebird'

require '../imba'

var compiler  = require './compiler'
var parser = compiler:parser

export def tokenize code, o = {}
	compiler.tokenize(code,o)

export def rewrite code, o = {}
	compiler.rewrite(code,o)

export def parse code, o
	compiler.parse(code,o)

export def compile code, o = {}
	compiler.compile(code,o)
