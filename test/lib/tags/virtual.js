(function(){
	// externs;
	
	Imba.defineTag('el');
	
	Imba.defineTag('group', function(tag){
		
		
		tag.prototype.__long = {name: 'long'};
		tag.prototype.long = function(v){ return this._long; }
		tag.prototype.setLong = function(v){ this._long = v; return this; };
		
		tag.prototype.__headed = {name: 'headed'};
		tag.prototype.headed = function(v){ return this._headed; }
		tag.prototype.setHeaded = function(v){ this._headed = v; return this; };
		
		tag.prototype.__footed = {name: 'footed'};
		tag.prototype.footed = function(v){ return this._footed; }
		tag.prototype.setFooted = function(v){ this._footed = v; return this; };
		
		tag.prototype.render = function (){
			var t0;
			return this.setChildren([
				(this.headed()) && ([
					(t0 = this[0] || (this[0] = t$('el'))).flag('header').setContent([
						(t0[0] = t0[0] || t$('el')).flag('title').setContent("Header").end(),
						(t0[1] = t0[1] || t$('el')).flag('tools').end(),
						(this.long()) && ([
							(t0[2] = t0[2] || t$('el')).flag('long').end()
						])
					]).end(),
					(this[1] = this[1] || t$('el')).flag('ruler').end()
				]),
				(t0 = this[2] || (this[2] = t$('ul'))).setContent([
					(t0[0] = t0[0] || t$('li')).setContent("Hello").end(),
					(t0[1] = t0[1] || t$('li')).setContent("World").end(),
					(this.link()) && ([
						(t0[2] = t0[2] || t$('li')).setContent("long").end(),
						(t0[3] = t0[3] || t$('li')).setContent("loong").end()
					])
				]).end()
			]).synced();
		};
	});
	
	describe("Tags",function() {
		
		var root = t$('group').end();
		root.render();
		document.body.appendChild(root.dom());
		
		var a = t$('el').flag('a').end();
		var b = t$('el').flag('b').end();
		var c = t$('el').flag('c').end();
		var d = t$('el').flag('d').end();
		var e = t$('el').flag('e').end();
		var f = t$('el').flag('f').end();
		var g = t$('el').flag('g').end();
		var h = t$('el').flag('h').end();
		var i = t$('el').flag('i').end();
		var j = t$('el').flag('j').end();
		var k = t$('el').flag('k').end();
		var l = t$('el').flag('l').end();
		var m = t$('el').flag('m').end();
		
		// make eq test actual 
		
		return test("something",function() {
			return eq(1,1);
		});
	});

})()