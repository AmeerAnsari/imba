(function(){
	function iter$(a){ return a ? (a.toArray ? a.toArray() : a) : []; };
	// List of the token pairs that must be balanced.
	var BALANCED_PAIRS = exports.BALANCED_PAIRS = [
		['(',')'],
		['[',']'],
		['{','}'],
		['{{','}}'],
		['INDENT','OUTDENT'],
		['CALL_START','CALL_END'],
		['PARAM_START','PARAM_END'],
		['INDEX_START','INDEX_END'],
		['TAG_START','TAG_END'],
		['TAG_PARAM_START','TAG_PARAM_END'],
		['TAG_ATTRS_START','TAG_ATTRS_END'],
		['BLOCK_PARAM_START','BLOCK_PARAM_END']
	];
	
	// The inverse mappings of `BALANCED_PAIRS` we're trying to fix up, so we can
	// look things up from either end.
	var INVERSES = exports.INVERSES = {};
	
	// The tokens that signal the start/end of a balanced pair.
	// var EXPRESSION_START = []
	// var EXPRESSION_END   = []
	
	for (var i = 0, ary = iter$(BALANCED_PAIRS), len = ary.length, pair; i < len; i++) {
		pair = ary[i];
		var left = pair[0];
		var rite = pair[1];
		INVERSES[rite] = left;
		INVERSES[left] = rite;
	};
	
	
	var ALL_KEYWORDS = exports.ALL_KEYWORDS = [
		'true','false','null','this',
		'delete','typeof','in','instanceof',
		'throw','break','continue','debugger',
		'if','else','switch','for','while','do','try','catch','finally',
		'class','extends','super','return',
		'undefined','then','unless','until','loop','of','by',
		'when','def','tag','do','elif','begin','var','let','self','await','import',
		'and','or','is','isnt','not','yes','no','isa','case','nil','require'
	];
	
	var TOKEN_TYPES = exports.TOKEN_TYPES = {
		TERMINATOR: 'TERMINATOR'
	};

})();