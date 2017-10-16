var Imba = require("../imba");

Imba.TAGS.ns('svg').defineTag('element', function(tag){
	
	tag.namespaceURI = function (){
		return "http://www.w3.org/2000/svg";
	};
	
	tag.buildNode = function (){
		var dom = Imba.document().createElementNS(this.namespaceURI(),this._nodeType);
		var cls = this._classes.join(" ");
		if (cls) { dom.className.baseVal = cls };
		return dom;
	};
	
	tag.inherit = function (child){
		child._protoDom = null;
		
		if (Imba.indexOf(child._name,Imba.SVG_TAGS) >= 0) {
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

Imba.TAGS.ns('svg').defineTag('svg', function(tag){
	Imba.attr(tag,'viewbox');
});

Imba.TAGS.ns('svg').defineTag('g');

Imba.TAGS.ns('svg').defineTag('defs');

Imba.TAGS.ns('svg').defineTag('symbol', function(tag){
	Imba.attr(tag,'preserveAspectRatio');
	Imba.attr(tag,'viewBox');
});

Imba.TAGS.ns('svg').defineTag('marker', function(tag){
	Imba.attr(tag,'markerUnits');
	Imba.attr(tag,'refX');
	Imba.attr(tag,'refY');
	Imba.attr(tag,'markerWidth');
	Imba.attr(tag,'markerHeight');
	Imba.attr(tag,'orient');
});

// Basic shapes

Imba.TAGS.ns('svg').defineTag('rect', function(tag){
	Imba.attr(tag,'rx');
	Imba.attr(tag,'ry');
});

Imba.TAGS.ns('svg').defineTag('circle', function(tag){
	Imba.attr(tag,'cx');
	Imba.attr(tag,'cy');
	Imba.attr(tag,'r');
});

Imba.TAGS.ns('svg').defineTag('ellipse', function(tag){
	Imba.attr(tag,'cx');
	Imba.attr(tag,'cy');
	Imba.attr(tag,'rx');
	Imba.attr(tag,'ry');
});

Imba.TAGS.ns('svg').defineTag('path', function(tag){
	Imba.attr(tag,'d');
	Imba.attr(tag,'pathLength');
});

Imba.TAGS.ns('svg').defineTag('line', function(tag){
	Imba.attr(tag,'x1');
	Imba.attr(tag,'x2');
	Imba.attr(tag,'y1');
	Imba.attr(tag,'y2');
});

Imba.TAGS.ns('svg').defineTag('polyline', function(tag){
	Imba.attr(tag,'points');
});

Imba.TAGS.ns('svg').defineTag('polygon', function(tag){
	Imba.attr(tag,'points');
});

Imba.TAGS.ns('svg').defineTag('text', function(tag){
	Imba.attr(tag,'dx');
	Imba.attr(tag,'dy');
	Imba.attr(tag,'text-anchor');
	Imba.attr(tag,'rotate');
	Imba.attr(tag,'textLength');
	Imba.attr(tag,'lengthAdjust');
});

Imba.TAGS.ns('svg').defineTag('tspan', function(tag){
	Imba.attr(tag,'dx');
	Imba.attr(tag,'dy');
	Imba.attr(tag,'rotate');
	Imba.attr(tag,'textLength');
	Imba.attr(tag,'lengthAdjust');
});
