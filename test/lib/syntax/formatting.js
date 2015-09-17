(function(){
	var self=this;
	
	function chk(str,fn){
		var stripped = fn.toString().replace(/^function\s?\(\)\s?\{\s*(return )?/,'').replace(/\;?\s*\}\s*$/,'');
		return this.eq(stripped,str);
	};
	
	self.describe("Formatting",function() {
		
		// some basic tests to make sure we dont add nested parens all over the place
		return self.test("test",function() {
			chk("!!true",function() { return !!true; });
			return chk("1 + 2",function() { return 1 + 2; });
		});
	});

})()