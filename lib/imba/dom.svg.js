(function(){
	function idx$(a,b){
		return (b && b.indexOf) ? b.indexOf(a) : [].indexOf.call(a,b);
	};
	
	
	Imba.TAGS.SVG.defineTag('svgelement', function(tag){
		
		tag.namespaceURI = function (){
			return "http://www.w3.org/2000/svg";
		};
		
		var types = "circle defs ellipse g line linearGradient mask path pattern polygon polyline radialGradient rect stop svg text tspan".split(" ");
		
		tag.buildNode = function (){
			var dom = Imba.document().createElementNS(this.namespaceURI(),this._nodeType);
			var cls = this._classes.join(" ");
			if (cls) { dom.className = cls };
			return dom;
		};
		
		tag.inherit = function (child){
			console.log('svg inherit',child);
			child._protoDom = null;
			
			if (idx$(child._name,types) >= 0) {
				child._nodeType = child._name;
				return child._classes = [];
			} else {
				child._nodeType = this._nodeType;
				var className = "_" + child._name.replace(/_/g,'-');
				return child._classes = this._classes.concat(className);
			};
		};
		
		
		Imba.attr(tag,'x');
		Imba.attr(tag,'y');
		
		Imba.attr(tag,'width');
		Imba.attr(tag,'height');
		
		Imba.attr(tag,'stroke');
		Imba.attr(tag,'stroke-width');
	});
	
	Imba.TAGS.SVG.defineTag('svg', function(tag){
		Imba.attr(tag,'viewbox');
	});
	
	Imba.TAGS.SVG.defineTag('rect');
	
	Imba.TAGS.SVG.defineTag('circle', function(tag){
		Imba.attr(tag,'cx');
		Imba.attr(tag,'cy');
		Imba.attr(tag,'r');
	});
	
	Imba.TAGS.SVG.defineTag('ellipse', function(tag){
		Imba.attr(tag,'cx');
		Imba.attr(tag,'cy');
		Imba.attr(tag,'rx');
		Imba.attr(tag,'ry');
	});
	
	Imba.TAGS.SVG.defineTag('path', function(tag){
		Imba.attr(tag,'d');
		Imba.attr(tag,'pathLength');
	});
	
	return Imba.TAGS.SVG.defineTag('line', function(tag){
		Imba.attr(tag,'x1');
		Imba.attr(tag,'x2');
		Imba.attr(tag,'y1');
		Imba.attr(tag,'y2');
	});

})()