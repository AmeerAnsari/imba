# TODO Create AST.Expression - make all expressions inherit from these?

extern parseInt


var helpers = require './helpers'

AST = {}

# Helpers for operators
OP = do |op, left, right, opts|
	if op == '.'
		# Be careful
		if right isa String
			right = AST.Identifier.new(right)

		AST.Access.new(op,left,right)
	elif op == '='
		if left isa AST.Tuple
			# p "catching tuple-assign OP"
			return AST.TupleAssign.new(op,left,right)
		AST.Assign.new(op,left,right)
	elif op in ['?=','||=','&&=']
		AST.ConditionalAssign.new(op,left,right)
	elif op in ['=<']
		AST.AsyncAssign.new('=',left,AST.Await.new(right))
		# AST.AsyncAssign.new(op,left,right)
	elif op in ['+=','-=','*=','/=','^=','%=']
		AST.CompoundAssign.new(op,left,right)
		# elif op == '<<'
		#	AST.PushAssign.new(op,left,right)

	elif op == 'instanceof'
		AST.InstanceOf.new(op,left,right)
	elif op == 'in'
		AST.In.new(op,left,right)
	elif op == 'typeof'
		AST.TypeOf.new(op,left,right)
	elif op == 'delete'
		AST.Delete.new(op,left,right)
	elif op in ['--','++','!','√'] # hmm
		AST.UnaryOp.new(op,left,right)
	elif op in ['>','<','>=','<=','==','===','!=','!==']
		AST.ComparisonOp.new(op,left,right)
	elif op in ['∩','∪']
		AST.MathOp.new(op,left,right)
	elif op in ['..','...']
		AST.Range.new(op,left,right)
	else
		AST.Op.new(op,left,right)

LIT = do |val|
	AST.Literal.new(val)

SYM = do |val|
	AST.Symbol.new(val)

IF = do |cond,body,alt|
	var node = AST.If.new(cond,body)
	node.addElse(alt) if alt
	node

FN = do |pars,body|
	AST.Func.new(pars,body)

CALL = do |callee,pars = []|
	# possibly return instead(!)
	AST.Call.new(callee,pars)

CALLSELF = do |name,pars = []|
	var ref = AST.Identifier.new(name)
	AST.Call.new(OP('.',AST.SELF,ref),pars)

BLOCK = do
	AST.Block.wrap([]:slice.call(arguments))

WHILE = do |test,code|
	AST.While.new(test).addBody(code)

SPLAT = do |value|
	if value isa AST.Assign
		# p "WARN"
		value.left = AST.Splat.new(value.left)
		return value
	else
		AST.Splat.new(value)
		# not sure about this

OP.ASSIGNMENT = [ "=" , "+=" , "-=" , "*=" , "/=" , "%=", "<<=" , ">>=" , ">>>=", "|=" , "^=" , "&=" ]
OP.LOGICAL = [ "||" , "&&" ]
OP.UNARY = [ "++" , "--" ]

AST.LOC = do |loc|
	self

def AST.parse str, opts = {}
	var indent = str.match(/\t+/)[0]
	AST.Imba.parse(str,opts)

def AST.inline str, opts = {}
	AST.parse(str,opts).body

def AST.node typ, pars
	if typ == 'call'
		if pars[0].c == 'return'
			pars[0] = 'tata'	
		AST.Call.new(pars[0],pars[1],pars[2])


def AST.escapeComments str
	return '' unless str
	return str
	# var v = str.replace(/\\n/g,'\n')
	# v.split("\n").join("\n")
	# v.split("\n").map(|v| v ? "// {v}" : v).join("\n")

class AST.Indentation

	prop open
	prop close

	def initialize a,b
		@open = a or 1
		@close = b or 1
		self

	# should rather parse and extract the comments, no?
	def wrap str, o
		var pre = @open:pre
		var post = @open:post
		var esc = AST:escapeComments

		# the first newline should not be indented?
		str = esc(post).replace(/^\n/,'') + str
		str = str.replace(/^/g,"\t").replace(/\n/g,"\n\t").replace(/\n\t$/g,"\n")

		str = esc(pre) + '\n' + str
		# only add br if needed
		str = str + '\n' unless str[str:length - 1] == '\n'
		# if o and o:braces
		# 	str = '{' + str + '}'

		return str
		
AST.INDENT = AST.Indentation.new

class AST.Stack

	prop loglevel
	prop nodes
	prop scopes

	def initialize
		@nodes = []
		@scoping = []
		@scopes = [] # for analysis - should rename
		@loglevel = 3

	def addScope scope
		@scopes.push(scope)
		self

	def traverse node
		self

	def push node
		@nodes.push(node)
		# not sure if we have already defined a scope?
		self

	def pop node
		@nodes.pop(node)
		self

	def parent
		@nodes[@nodes:length - 2]

	def current
		@nodes[@nodes:length - 1]

	def up test
		test ||= do |v| !(v isa AST.VarOrAccess)

		if test:prototype isa AST.Node
			var typ = test
			test = do |v| v isa typ

		var i = @nodes:length - 1
		while i >= 0
			var node = @nodes[i]
			return node if test(node)
			i -= 1
		return nil

	def relative node, offset = 0
		var idx = @nodes.indexOf(node)
		idx >= 0 ? @nodes[idx + offset] : nil

	def scope lvl = 0
		var i = @nodes:length - 1 - lvl
		while i >= 0
			var node = @nodes[i]
			return node.@scope if node.@scope
			i -= 1
		return nil

	def scopes
		# include deeper scopes as well?
		var scopes = []
		var i = @nodes:length - 1
		while i >= 0
			var node = @nodes[i]
			scopes.push(node.@scope) if node.@scope
			i -= 1
		return scopes

	def method
		up(AST.MethodDeclaration)

	def isExpression
		var i = @nodes:length - 1
		while i >= 0
			var node = @nodes[i]
			# why are we not using isExpression here as well?
			if node isa AST.Code or node isa AST.Loop
				return false
			if node.isExpression
				return true
			# probably not the right test - need to be more explicit
			i -= 1
		return false

	def toString
		"Stack({@nodes.join(" -> ")})"

	def scoping
		@nodes.filter(|n| n.@scope ).map(|n| n.@scope )

# Lots of globals -- really need to deal with one stack per file / context
STACK = AST.Stack.new

class AST.Node

	prop o
	prop options
	prop traversed
	prop statement

	def safechain
		no

	def dom
		var name = "ast_" + self:constructor:name.replace(/([a-z])([A-Z])/g,"$1_$2").toLowerCase
		# p "try to get the dom-node for this ast-node",name
		if Imba.TAGS[name]
			var node = Imba.tag(name)
			node.bind(self).build
			return node
		else
			return "[{name}]"

	def p
		# hmm
		# allow controlling this from commandline
		if STACK.loglevel > 0
			console.log(*arguments)
		self

	def initialize
		self

	def set obj
		@options ||= {}
		for own k,v of obj
			@options[k] = v
		self

	# get and set
	def option key, val
		if val != undefined
			@options ||= {}
			@options[key] = val
			return self

		@options && @options[key]

	def configure obj
		set(obj)

	def region
		[]

	def loc
		[]

	def toAST
		self

	def compile
		self

	def visit
		self

	def stack
		STACK

	def traverse o = {}, up, key, index
		return self if @traversed
		@traversed = yes
		STACK.push self
		visit(STACK)
		STACK.pop self
		return self

	def inspect
		{type: self:constructor.toString}

	def js
		"NODE"

	def toString
		"{self:constructor:name}"

	# swallow might be better name
	def consume node
		if node isa AST.PushAssign
			return AST.PushAssign.new(node.op,node.left,self)

		if node isa AST.Assign
			# p "consume assignment".cyan
			# node.right = self
			return OP(node.op,node.left,self)
		elif node isa AST.Op
			return OP(node.op,node.left,self)
		elif node isa AST.Return
			# p "consume return".cyan
			return AST.Return.new(self)
		return self

	def toExpression
		@expression = true
		self

	def forceExpression
		@expression = true
		self

	def isExpressable
		true

	def isExpression
		@expression || false

	def hasSideEffects
		true

	def isUsed
		true
		
	def shouldParenthesize
		false

	def block
		AST.Block.wrap([self])

	def node
		self

	def scope__
		STACK.scope

	def up
		STACK.parent

	def util
		AST.Util

	def receiver
		self

	def addExpression expr
		# might be better to nest this up after parsing is done?
		# p "addExpression {self} <- {expr}"
		var node = AST.ExpressionBlock.new([self])
		return node.addExpression(expr)

	def addComment comment
		# console.log "adding comment"
		@comment = comment
		self

	def indented a,b
		# this is a _BIG_ hack
		if b isa Array
			# console.log "indented array?", b[0]
			add(b[0])
			b = b[1]

		# if indent and indent.match(/\:/)
		@indented = [a,b]
		@indentation ||= a and b ? AST.Indentation.new(a,b) : AST.INDENT
		self

	def prebreak term = '\n'
		# in options instead?
		# console.log "prebreak!!!!"
		# @prebreak = @prebreak or term
		self

	def invert
		return OP('!',self)

	def cache o = {}
		@cache = o
		o:var = scope__.temporary(self,o)
		o:lookups = 0
		# o:lookups = 0
		self

	def cachevar
		@cache && @cache:var

	def decache
		if @cache
			cachevar.free
			@cache = nil # hmm, removing the cache WARN
		self

	# is this without side-effects? hmm - what does it even do?
	def predeclare
		if @cache
			scope__.vars.swap(@cache:var,self)
		self

	# the "name-suggestion" for nodes if they need to be cached
	def alias
		nil

	def warn text, opts = {}
		# opts:node = self
		# p "AST.warn {text} {opts}"
		opts:message = text
		opts:loc ||= loc
		scope__.root.warn opts
		self

	def c o
		if @cache && @cache:cached
			@cache:lookups++
			if @cache:uses == @cache:lookups
				@cache:var.free
				#  "free variable(!) {@cache:var.c}"
			# p "getting cache {self}"
			# free it after the cached usage?
			# possibly premark how many times it need to be used before it is freed?
			return @cache:var.c

		STACK.push(self)
		forceExpression if o && o:expression

		if o and o:indent
			# console.log "set indentation"
			@indentation ||= AST.INDENT
			# self.indented()

		var out = js(STACK,o)

		var paren = shouldParenthesize
		
		if var indent = @indentation
			out = indent.wrap(out,o)

		if paren
			# this is not a good way to do it
			if out isa Array
				out = "({out})"
			else
				out = out.parenthesize

		if o and o:braces
			out = '{' + out + '}'


		# what about if we should indent?!?

		STACK.pop(self)

		if @cache

			# FIXME possibly double parenthesizing?
			out = "{@cache:var.c}={out}" unless @cache:manual
			var par = STACK.current
			out = out.parenthesize if par isa AST.Access || par isa AST.Op # others?
			@cache:cached = yes

		if @temporary && @temporary:length
			@temporary.map do |temp| 
				# p "decache temp!!! {temp}"
				temp.decache

		# if @newlines && @newlines.value:length > 2
		# 	out = "{out}\n"

		return out

class AST.Expression < AST.Node

class AST.ValueNode < AST.Node
	prop value

	def initialize value
		@value = load(value)

	def load value
		value

	def js
		value.c

	def visit
		@value.traverse if @value && @value:traverse
		self

	def region
		@value:_region

class AST.Statement < AST.ValueNode

	def isExpressable
		return no
		
	def statement
		return true


class AST.Meta < AST.ValueNode

class AST.Comment < AST.Meta

	def c o
		if o and o:expression or @value.match(/\n/) # multiline?
			"/*{value.c}*/"
		else
			"// {value.c}"


class AST.Terminator < AST.Meta

	def c
		return @value
		# var v = value.replace(/\\n/g,'\n')
		v # .split()
		# v.split("\n").map(|v| v ? " // {v}" : v).join("\n")

class AST.Newline < AST.Terminator

	def initialize v
		@value = v or '\n'

	def c
		@value
		

# weird place?
class AST.Index < AST.ValueNode

	def js
		@value.c

class AST.NewLines < AST.ValueNode

	def js
		@value

	def isExpressable
		yes

class AST.ListNode < AST.Node

	prop nodes

	def initialize list = [], options = {}
		@nodes = load(list)
		@options = options
	
	# PERF acces @nodes directly?
	def list
		@nodes

	def compact
		@nodes = @nodes.compact
		self

	def load list
		list

	def concat other
		# need to store indented content as well?
		@nodes = nodes.concat(other isa Array ? other : other.nodes)
		self

	def swap item, other
		var idx = indexOf(item)
		nodes[idx] = other if idx >= 0
		self

	def push item
		nodes.push(item)
		self

	def unshift item, br
		nodes.unshift(AST.BR) if br
		nodes.unshift(item)
		self

	# test
	def slice a, b
		self:constructor.new(@nodes.slice(a,b))

	def add item
		push(item)
		self

	def break br, pre = no
		# console.log "breaking block! ({br})"
		# should just accept regular terminators no?
		# console.log "BREAKING {br}"
		br = AST.Terminator.new(br) if typeof br == 'string' # hmmm?
		pre ? unshift(br) : push(br)
		self

	def some cb
		nodes.some(cb)

	def every cb
		nodes.every(cb)

	def filter cb
		if cb:prototype isa AST.Node
			var ary = []
			nodes.forEach do |n| ary.push(n) if n isa cb
			return ary

		nodes.filter(cb)

	def pluck cb
		var item = filter(cb)[0]
		remove(item) if item
		return item

	def indexOf item
		nodes.indexOf(item)

	def index i
		nodes[i]	

	def remove item
		var idx = list.indexOf(item)
		list.splice(idx, 1) if idx >= 0
		self

	def first
		list[0]
		
	# def last
	#	list[list:length - 1]

	def last
		var i = @nodes:length
		while i
			i = i - 1
			var v = @nodes[i]
			return v unless v isa AST.Meta
		return nil

	def map fn
		list.map(fn)

	def forEach fn
		list.forEach(fn)

	def remap fn
		@nodes = map(fn)
		self

	def count
		list:length

	def replace original, replacement
		var idx = nodes.indexOf(original)
		nodes[idx] = replacement if idx >= 0
		self


	def visit
		@nodes.forEach do |node|
			# console.log "traverse node {node}"
			node.traverse
		self

	def isExpressable
		return no unless nodes.every(|v| v.isExpressable )
		return yes

	def toArray
		@nodes

	def delimiter
		@delimiter or ","

	def js o, delim: delimiter, indent: @indentation, nodes: nodes
		# var delim = delimiter
		var express = delim != ';'
		var shouldDelim = no
		var nodes = nodes.compact
		var last = last
		var realLast = nodes[nodes:length - 1]
		# need to find the last node that is not a comment or newline?

		var parts = nodes.map do |arg| 
			var out = arg.c(expression: express)
			# if var br = arg.@prebreak
			# 	indent = yes # force indentation if one item is indented for now
			# 	out = br.replace(/\\n/g,"\n") + out #  '\n' + arg.@prebreak + out 
			# 	console.log "prebreak!!"
			#	out = delim + out if shouldDelim
			# else
			#	out = delim + " " + out if shouldDelim

			if arg isa AST.Meta
				true
				# console.log "argument is a comment!"
				# shouldDelim = no
			else
				# comment as well?
				# shouldDelim = yes
				out = out + delim if !express or arg != last
			out

		return parts.join("")

		# if indent
		# 	# console.log "{self} indented?"
		# 	# hmm
		# 	# var out = (@prebreak or '\n') +
		# 	return indent:wrap and indent.wrap(parts.join(""))
		# 
		# 	# var out = parts.join("").indent # + '\n' # hmmm
		# 	# out = '\n' + out unless nodes[0] isa AST.Terminator # hmmm
		# 	# out += '\n' unless realLast isa AST.Terminator # hmmm
		# 	# out
		# else
		# 	parts.join("")
		

class AST.ArgList < AST.ListNode

	def hasSplat
		list.some do |v| v isa AST.Splat

	def delimiter
		","

	# def visit
	# 	# console.log "ArgList.visit {@indented}"
	# 	# if @prebreak # hmm
	# 	# 	console.log "adding prebreak inside {@prebreak} arglist"
	# 	# 	first and first.prebreak(@prebreak) 
	# 	super

	# def js
	# 	return super
	# 	
	# 	# ).join(",")

	# def c
	# 	js --- not good(!)

class AST.AssignList < AST.ArgList	
	# def c o
	# 	# p "compile arglist {self}"
	# 	super.c o

	def concat other
		if @nodes:length == 0 and other isa AST.AssignList
			# console.log "return the other one(!)",other.@indented[0]
			return other
		else
			super
		# need to store indented content as well?
		# @nodes = nodes.concat(other isa Array ? other : other.nodes)
		self




class AST.Block < AST.ListNode	
	
	prop head

	def self.wrap ary
		# p "called Block wrap!!", $0
		ary:length == 1 && ary[0] isa AST.Block ? ary[0] : AST.Block.new(ary)
		# return nodes[0] if nodes.length is 1 and nodes[0] instanceof Block
		# new Block nodes

	# def prebreak br
	# 	console.log "Block prebreak {br}"
	# 	super

	def visit
		# @indentation ||= AST.INDENT

		if @prebreak # hmm
			# are we sure?
			console.log "PREBREAK IN AST.BLOCK SHOULD THROW"
			first and first.prebreak(@prebreak)
		super
		
	def push item, sep
		# if sep
		# 	# probably better to set property on the item - no?
		# 	# only newlines - no ?
		# 	
		# 	# @newlines = sep.replace(//)
		# 	# var ln = sep.replace(/[^\n]/g,''):length
		# 	var ln = sep.split("\\n"):length
		# 	# p "block separator!",ln,sep
		# 	last && last.@newlines = ln - 1
		# 	# nodes.push(AST.NewLines.new(sep))

		nodes.push(item)
		self

	def block
		self

	def loc
		if var opt = option(:ends)
			# p "location is",opt
			var a = opt[0].loc
			var b = opt[1].loc

			p "no loc for {opt[0]}" unless a
			p "no loc for {opt[1]}" unless b

			[a[0],b[1]]
		else
			[0,0]

	def initialize expr = []
		self.nodes = expr.flatten.compact or []
		# @indentation ||= AST.INDENT

	# go through children and unwrap inner nodes
	def unwrap
		var ary = []
		for node,i in nodes
			if node isa AST.Block
				# p "unwrapping inner block"
				ary:push.apply(ary,node.unwrap)
			else
				ary.push(node)
		return ary

	# This is just to work as an inplace replacement of nodes.coffee
	# After things are working okay we'll do bigger refactorings
	def compile o = {}
		var root = AST.Root.new(self,o)
		root.compile(o)

	# Not sure if we should create a separate block?
	def analyze o = {}
		# p "analyzing block!!!",o
		self

	def js o, opts
		var l = nodes:length
		# var filter = 
		var filter = (|n| n != null && n != undefined && n != AST.EMPTY)
		var ast = nodes.flatten.compact.filter(|n| n != null && n != undefined && n != AST.EMPTY)
		var express = isExpression or o.isExpression or (option(:express) and isExpressable)
		return null if ast:length == 0

		# return super(o, delim: ';', indent: no)

		if express
			return super(o,delim: ',', nodes: ast)
		# else
		# 	return super(o,delim: ';', nodes: ast)
		# return ast.c.flatten.compact.join(", ")

		var compile = do |node,i|
			var out = node ? node.c : ""
			return null if out == ""

			# hmm -- are we sure?
			if out isa Array
				# really??
				out = out.flatten.compact.filter(filter).join(";\n")

			var hasSemiColon = out.match(/;(\s*\/\/.*)?[\n\s\t]*$/) # out[out:length - 1] == ";"

			out += ";" unless hasSemiColon or node isa AST.Meta
			
			# if var br = node.@prebreak
			# 	console.log "br prebreak"
			# 	out = br.replace(/\\n/g,"\n") + out
			# hmm
			return out

		ast = ast.map(compile)

		# now add the head items as well
		if @head
			var prefix = []
			@head.forEach do |item|
				var out = compile(item)
				prefix.push(out + '\n') if out

			ast = prefix.concat(ast)
			# var ln = node.@newlines or 1
			# c += Array(ln + 1).join("\n") # "\n"

		ast = ast.compact.filter(filter).join("") # .replace(/[\s\n]+$/,'')  # hmm really?

		# @indentation ? @indentation.wrap(ast,opts) : ast

	# Should this create the function as well?
	def defers original, replacement
		var idx = nodes.indexOf(original)
		nodes[idx] = replacement if idx >= 0
		# now return the nodes after this
		replacement.@prebreak ||= original.@prebreak # hacky
		var rest = nodes.splice(idx + 1)
		return rest

	def consume node
		if node isa AST.TagTree # special case?!?
			# what if there is only one node?
			# let all the inner nodes consume this
			nodes = nodes.map(|child| child.consume(node))
			# then wrap ourselves in an array as well(!)
			nodes = [AST.Arr.new(nodes)] if nodes:length > 1
			
			# hmmm
			return self

		# can also return super if it is expressable, but should we really?
		if var before = last
			var after = before.consume(node)
			if after != before
				
				# p "replace node in block"
				replace(before,after)
		# really?
		return self
		
	def isExpressable
		return no unless nodes.every(|v| v.isExpressable )
		return yes

	def isExpression
		option(:express) || super.isExpression

# this is almost like the old VarDeclarations but without the values
class AST.VarBlock < AST.ListNode

	# TODO All these inner items should rather be straight up literals
	# or basic localvars - without any care whatsoever about adding var to the
	# beginning etc. 

	def addExpression expr
		# p "addExpression {self} <- {expr}"

		if expr isa AST.Assign
			addExpression(expr.left) # make sure this is a valid thing?
			# make this into a tuple instead
			# possibly fix this as well?!?
			# does not need to be a tuple?
			return AST.TupleAssign.new('=',AST.Tuple.new(nodes),expr.right)

		elif expr isa AST.VarOrAccess
			# this is really a VarReference
			push(AST.VarReference.new(expr.value))

		elif expr isa AST.Splat && expr.node isa AST.VarOrAccess
			# p "is a splat - only allowed in tuple-assignment"
			expr.value = AST.VarReference.new(expr.node.value)
			push(expr)
		else
			throw "VarBlock does not allow non-variable expressions"
		self

	def isExpressable
		# hmm, we would need to force-drop the variables, makes little sense
		# but, it could be, could just push the variables out?
		no

	def js o
		var code = nodes.map do |node| node.c
		code = code.flatten.compact.filter(|n| n != null && n != undefined && n != AST.EMPTY)
		return "var {code.join(",")}"

	def consume node
		# It doesnt make much sense for a VarBlock to consume anything
		# it should probably return void for methods
		# throw "VarBlock.consume"
		return self

# Could inherit from valueNode
class AST.Parens < AST.ValueNode

		
	def js o
		var par = up
		# p "Parens up {par} {o.isExpression}"

		if par isa AST.Block
			@noparen = yes unless o.isExpression
			return value.c(expression: o.isExpression)
		else
			value.c(expression: yes)
		# if value isa AST.Block
		# 	# no need to pare
		# 	p "compile the parens {value} {value.count}"
		# p "compile the parens {value}"
		# should not force expression
		# p o.isExpression
		# value.c(expression: yes)
		# "({value.c(expression: o.isExpression)})"

	def shouldParenthesize
		# var par = up
		# no need to parenthesize if this is a line in a block
		return no if @noparen #  or par isa AST.ArgList
		return yes

	def prebreak br
		super(br)
		# hmm
		@value.prebreak(br) if @value
		self

	def isExpressable
		value.isExpressable

	def consume node
		value.consume(node)

# Could inherit from valueNode
# an explicit expression-block (with parens) is somewhat different
# can be used to return after an expression
class AST.ExpressionBlock < AST.ListNode

	def visit
		# we need to see if this
		map(|item| item.traverse)
		self
		
	def c
		map(|item| item.c).join(",")

	# def isExpressable
	#	value.isExpressable

	def consume node
		value.consume(node)

	def addExpression expr
		# p "add expression {self} <- {expr}"

		# Need to take care of the splat here to.. hazzle
		if expr.node isa AST.Assign
			# p "is assignment!"
			push(expr.left)
			# make this into a tuple instead
			# possibly fix this as well?!?
			return AST.TupleAssign.new('=',AST.Tuple.new(nodes),expr.right)
		else
			push(expr)
		self

# create a raw-block for compiled stuff?
		
		

