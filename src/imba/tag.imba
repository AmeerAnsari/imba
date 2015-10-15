def Imba.static items, nr
	items:static = nr
	return items

export class ElementTag
	prop object

	def dom
		@dom

	def initialize dom
		self.dom = dom
		self
		
	def setDom dom
		dom.@tag = self
		@dom = dom
		self

	def setRef ref
		flag(@ref = ref)
		self

	def setHandler event, handler, ctx
		var key = 'on' + event

		if handler isa Function
			self[key] = handler
		elif handler isa Array
			var fn = handler.shift
			self[key] = do |e| ctx[fn].apply(ctx,handler.concat(e))
		else
			self[key] = do |e| ctx[handler](e)
		self

	def id= id
		dom:id = id
		self

	def id
		dom:id

	def setAttribute key, new
		var old = dom.getAttribute(key)

		if old == new
			new
		elif new != null && new !== false
			dom.setAttribute(key,new)
		else
			dom.removeAttribute(key)

	def removeAttribute key
		dom.removeAttribute(key)

	def getAttribute key
		dom.getAttribute(key)

	def setContent content, typ
		setChildren content, typ
		self

	def setChildren nodes, typ
		throw "Not implemented"

	def text v
		throw "Not implemented"

	def text= txt
		throw "Not implemented"

	def dataset key, val
		throw "Not implemented"

	# bind / present
	# should deprecate / remove
	def bind obj
		object = obj
		self

	def render
		self

	def build
		render
		self

	def commit
		render
		self

	def end
		if @built
			commit
		else
			@built = yes
			build
		self

	# called whenever a node has rendered itself like in <self> <div> ...
	def synced
		self

	# called when the node is awakened in the dom - either automatically
	# upon attachment to the dom-tree, or the first time imba needs the
	# tag for a domnode that has been rendered on the server
	def awaken
		self

	def flag ref, toggle
		throw "Not implemented"

	def self.createNode
		throw "Not implemented"

ElementTag:prototype:initialize = ElementTag

HTML_TAGS = "a abbr address area article aside audio b base bdi bdo big blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hr html i iframe img input ins kbd keygen label legend li link main map mark menu menuitem meta meter nav noscript object ol optgroup option output p param pre progress q rp rt ruby s samp script section select small source span strong style sub summary sup table tbody td textarea tfoot th thead time title tr track u ul var video wbr".split(" ")
HTML_TAGS_UNSAFE = "article aside header section".split(" ")
SVG_TAGS = "circle defs ellipse g line linearGradient mask path pattern polygon polyline radialGradient rect stop svg text tspan".split(" ")

Imba.TAGS = {
	element: ElementTag
}

Imba.SINGLETONS = {}
IMBA_TAGS = Imba.TAGS

def extender obj, sup
	for own k,v of sup
		obj[k] ?= v

	obj:prototype = Object.create(sup:prototype)
	obj:__super__ = obj:prototype:__super__ = sup:prototype
	obj:prototype:initialize = obj:prototype:constructor = obj
	sup.inherit(obj) if sup:inherit
	return obj

def Imba.defineTag name, supr = '', &body
	supr ||= (name in HTML_TAGS) ? 'htmlelement' : 'div'

	var superklass = Imba.TAGS[supr]

	var fname = name == 'var' ? 'vartag' : name
	# should drop this in production / optimized mode, but for debug
	# we create a constructor with a recognizeable name
	var klass = Function.new("return function {fname.replace(/[\s\-\:]/g,'_')}(dom)\{ this.setDom(dom); \}")()
	klass.@name = name

	extender(klass,superklass)

	Imba.TAGS[name] = klass

	body.call(klass,klass,klass:prototype) if body
	return klass

def Imba.defineSingletonTag id, supr = '', &body
	var superklass = Imba.TAGS[supr || 'div']

	# should drop this in production / optimized mode, but for debug
	# we create a constructor with a recognizeable name
	var klass = Function.new("return function {id.replace(/[\s\-\:]/g,'_')}(dom)\{ this.setDom(dom); \}")()
	klass.@name = null

	extender(klass,superklass)

	Imba.SINGLETONS[id] = klass

	body.call(klass,klass,klass:prototype) if body
	return klass

def Imba.extendTag name, body
	var klass = (name isa String ? Imba.TAGS[name] : name)
	body and body.call(klass,klass,klass:prototype) if body
	return klass

def Imba.tag name
	var typ = Imba.TAGS[name]
	return typ.new(typ.createNode)

def Imba.tagWithId name, id
	var typ = Imba.TAGS[name]
	var dom = typ.createNode
	dom:id = id
	return typ.new(dom)

# TODO: Can we move these out and into dom.imba in a clean way?
# These methods depends on Imba.document.getElementById

def Imba.getTagSingleton id	
	var dom, node

	if var klass = Imba.SINGLETONS[id]
		return klass.Instance if klass and klass.Instance 

		# no instance - check for element
		if dom = Imba.document.getElementById(id)
			# we have a live instance - when finding it through a selector we should awake it, no?
			# console.log('creating the singleton from existing node in dom?',id,type)
			node = klass.Instance = klass.new(dom)
			node.awaken(dom) # should only awaken
			return node

		dom = klass.createNode
		dom:id = id
		node = klass.Instance = klass.new(dom)
		node.end.awaken(dom)
		return node
	elif dom = Imba.document.getElementById(id)
		return Imba.getTagForDom(dom)

var svgSupport = typeof SVGElement !== 'undefined'

def Imba.getTagForDom dom
	return null unless dom
	return dom if dom.@dom # could use inheritance instead
	return dom.@tag if dom.@tag
	return null unless dom:nodeName

	var ns   = null
	var id   = dom:id
	var type = dom:nodeName.toLowerCase
	var cls  = dom:className

	if id and Imba.SINGLETONS[id]
		# FIXME control that it is the same singleton?
		# might collide -- not good?
		return Imba.getTagSingleton(id)
	# look for id - singleton

	# need better test here
	if svgSupport and dom isa SVGElement
		ns = "svg" 
		cls = dom:className:baseVal

	if cls
		# there can be several matches here - should choose the last
		# should fall back to less specific later? - otherwise things may fail
		# TODO rework this
		if var m = cls.match(/\b_([a-z\-]+)\b(?!\s*_[a-z\-]+)/)
			type = m[1].replace(/-/g,'_')

		if m = cls.match(/\b([a-z]+)_\b/)
			ns = m[1] 

	var spawner = Imba.TAGS[type]
	spawner ? spawner.new(dom).awaken(dom) : null

t$ = Imba:tag
tc$ = Imba:tagWithFlags
ti$ = Imba:tagWithId
tic$ = Imba:tagWithIdAndFlags
id$ = Imba:getTagSingleton
tag$wrap = Imba:getTagForDom

