extern describe, test, eq, document, _

tag el

	def flag ref
		@flagged = ref
		super

tag group
	prop ops
	prop opstr

	prop expected
	prop actual
		
	def setStaticChildren nodes
		@ops = []
		@opstr = ""
		@errors = null
		expected = _.flatten(nodes).filter do |n| n and n.@dom
		actual = []
		# log "setStaticChildren",nodes,expected
		super(nodes)

		for child,i in @dom:childNodes
			var el = tag(child)
			if el != expected[i]
				@errors ||= []
				log "not the same as expected at i",child,expected[i].@dom
				@errors.push([el,expected[i],i])

			actual.push( tag(child) )
		# log actual
		eq @errors, null
		return self

	def appendChild node
		# log "appendChild",node
		ops.push ["appendChild",node]
		@opstr += "A"
		super

	def removeChild node
		# log "removeChild",node
		ops.push ["removeChild", node]
		@opstr += "R"
		super

	def insertBefore node, rel
		# log "insertBefore"
		ops.push ["insertBefore",node,rel]
		@opstr += "I"
		super

	def reset
		render

	def render a: no, b: no, c: no, d: no, e: no, list: null
		# no need for nested stuff here - we're testing setStaticChildren
		# if it works on the flat level it should work everywhere
		<self>
			<el.a> "top"
			<el.b> "ok"
			if a
				<el.header>
				<el.title> "Header"
				<el.tools>
				if b
					<el.long>
					<el.long>
				else
					<el.short>
				<el.ruler>
			if c
				<div.c1> "long"
				<div.c2> "loong"
			if d and e
				<el.long>
				<el.footer>
				<el.bottom>
			elif e
				<el.footer>
				<el.bottom>
			else
				<el> "!d and !e"
			list
			<el.x> "very last"


describe "Tags" do

	var a = <el.a> "a"
	var b = <el.b> "b"
	var c = <el.c> "c"
	var d = <el.d> "d"
	var e = <el.e> "e"
	var f = <el.f> "f"
	var g = <el.g> "g"
	var h = <el.h> "h"

	var group = <group>
	document:body.appendChild(group.dom)

	test "first render" do
		group.render
		eq group.opstr, "AAAA"

	test "second render" do
		# nothing should happen on second render
		group.render
		eq group.opstr, ""

	test "added block" do
		group.render c: yes
		eq group.opstr, "II"

	test "remove again" do
		group.render c: no
		eq group.opstr, "RR"

	describe "dynamic lists" do
		# render once without anything to reset
		var full = [a,b,c,d,e,f]

		test "adding dynamic list items" do
			group.render list: full
			eq group.opstr, "IIIIII"

		test "removing" do
			group.render list: [a,b,e,f]
			eq group.opstr, "RR"

			group.render list: full
			eq group.opstr, "II"

		test "should be reorderable" do

			group.render list: full # render with the regular list
			group.render list: [b,a,c,d,e,f]
			eq group.opstr, "I"

			# reordering two elements
			group.render list: full
			group.render list: [c,d,a,b,e,f]
			eq group.opstr, "II"

			# reordering two elements
			group.render list: full
			group.render list: [c,d,e,f,a,b]
			eq group.opstr, "II"




