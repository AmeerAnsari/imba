(function(){


	(function(){
		var tag = Imba.defineTag('ast',function ast(d){this.setDom(d)});
		
		tag.prototype.__raw = {dom: true,name: 'raw'};
		tag.prototype.raw = function(v){ return this.getAttribute('raw'); }
		tag.prototype.setRaw = function(v){ this.setAttribute('raw',v); return this; };
		
		tag.prototype.append = function (value){
			if (value instanceof AST.Node) { value = value.dom() };
			return tag.__super__.append.call(this,value);
		};
	
	})();
	
	(function(){
		var tag = Imba.defineTag('ast_node',function ast_node(d){this.setDom(d)},'ast');
		tag.prototype.build = function (){
			this.render(this.object());
			return this;
		};
	
	})();
	
	Imba.defineTag('ast_expression',function ast_expression(d){this.setDom(d)},'ast_node');
	
	(function(){
		var tag = Imba.defineTag('ast_value_node',function ast_value_node(d){this.setDom(d)},'ast_node');
		tag.prototype.template = function (){
			return this.object().value();
		};
	
	})();
	
	// tag ast-literal < ast
	// 	
	// 	def build
	// 		render(object)
	// 		self
	// 		
	// 	def template
	// 		object.value


}())