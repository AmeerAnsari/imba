(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.imba = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function(){


	// externs;
	
	require('./imba');
	require('./core.events');
	require('./dom');
	
	if(typeof window === 'undefined') {
		require('./dom.server');// hmm -- dont require events?
	} else {
		require('./dom.events');
		require('./dom.virtual');
	};
	
	require('./selector');


}())
},{"./core.events":2,"./dom":4,"./dom.events":3,"./dom.server":undefined,"./dom.virtual":5,"./imba":6,"./selector":7}],2:[function(require,module,exports){
(function(){


	function emit__(event,args,node){
		// var node = cbs[event]
		var prev,cb,ret;
		
		while ((prev = node) && (node = node.next)){
			if (cb = node.listener) {
				if (node.path && cb[node.path]) {
					ret = args ? (cb[node.path].apply(cb,args)) : (cb[node.path]());
				} else {
					// check if it is a method?
					ret = args ? (cb.apply(node,args)) : (cb.call(node));
				};
			};
			
			if (node.times && --node.times <= 0) {
				prev.next = node.next;
				node.listener = null;
			};
		};
		return;
	};
	
	// method for registering a listener on object
	Imba.listen = function (obj,event,listener,path){
		var $1;
		var cbs,list,tail;
		cbs = obj.__listeners__ || (obj.__listeners__ = {});
		list = cbs[($1=event)] || (cbs[$1] = {});
		tail = list.tail || (list.tail = (list.next = {}));
		tail.listener = listener;
		tail.path = path;
		list.tail = tail.next = {};
		return tail;
	};
	
	Imba.once = function (obj,event,listener){
		var tail = Imba.listen(obj,event,listener);
		tail.times = 1;
		return tail;
	};
	
	Imba.unlisten = function (obj,event,cb,meth){
		var node,prev;
		var meta = obj.__listeners__;
		if (!meta) { return };
		
		if (node = meta[event]) {
			while ((prev = node) && (node = node.next)){
				if (node == cb || node.listener == cb) {
					prev.next = node.next;
					// check for correct path as well?
					node.listener = null;
					break;
				};
			};
		};
		return;
	};
	
	Imba.emit = function (obj,event,params){
		var cb;
		if (cb = obj.__listeners__) {
			if (cb[event]) { emit__(event,params,cb[event]) };
			if (cb.all) { emit__(event,[event,params],cb.all) }; // and event != 'all' # hmm
		};
		return;
	};
	
	Imba.observeProperty = function (observer,key,trigger,target,prev){
		if (prev && typeof prev == 'object') { // hmm 
			Imba.unlisten(prev,'all',observer,trigger);
		};
		if (target && typeof target == 'object') { // hmm
			Imba.listen(target,'all',observer,trigger);
		};
		return this;
	};


}())
},{}],3:[function(require,module,exports){
(function (global){
(function(){


	function iter$(a){ return a ? (a.toArray ? a.toArray() : a) : []; };
	// externs;
	
	
	var doc = global.document;
	var win = global.window;
	
	// hmm -- this is probably wrong
	var hasTouchEvents = win && win.ontouchstart !== undefined; // .hasOwnProperty('ontouchstart')
	
	
	// Ringbuffer for events?
	
	/* @class RingBuffer */
	Imba.RingBuffer = function RingBuffer(len){
		if(len === undefined) len = 10;
		this._array = [];
		this._keep = len;
		this._head = 0;
		this;
	};
	
	
	Imba.RingBuffer.prototype.__head = {name: 'head'};
	Imba.RingBuffer.prototype.head = function(v){ return this._head; }
	Imba.RingBuffer.prototype.setHead = function(v){ this._head = v; return this; };
	
	
	
	Imba.RingBuffer.prototype.push = function (obj){
		var i = this._head++;
		this._array[i % this._keep] = obj;
		return i;
	};
	
	Imba.RingBuffer.prototype.last = function (){
		return this._array[this._head % this._keep];
	};
	
	
	// button-states. Normalize ringbuffer to contain reuseable
	// normalized events?
	
	// really more like a pointer?
	/* @class Pointer */
	Imba.Pointer = function Pointer(){
		this.setButton(-1);
		this.setEvents(new Imba.RingBuffer(10));
		this.setEvent({x: 0,y: 0,type: 'uninitialized'});
		this;
	};
	
	
	Imba.Pointer.prototype.__phase = {name: 'phase'};
	Imba.Pointer.prototype.phase = function(v){ return this._phase; }
	Imba.Pointer.prototype.setPhase = function(v){ this._phase = v; return this; }; // change: update
	
	Imba.Pointer.prototype.__prevEvent = {name: 'prevEvent'};
	Imba.Pointer.prototype.prevEvent = function(v){ return this._prevEvent; }
	Imba.Pointer.prototype.setPrevEvent = function(v){ this._prevEvent = v; return this; };
	
	Imba.Pointer.prototype.__button = {name: 'button'};
	Imba.Pointer.prototype.button = function(v){ return this._button; }
	Imba.Pointer.prototype.setButton = function(v){ this._button = v; return this; };
	
	Imba.Pointer.prototype.__event = {name: 'event'};
	Imba.Pointer.prototype.event = function(v){ return this._event; }
	Imba.Pointer.prototype.setEvent = function(v){ this._event = v; return this; };
	
	Imba.Pointer.prototype.__dirty = {name: 'dirty'};
	Imba.Pointer.prototype.dirty = function(v){ return this._dirty; }
	Imba.Pointer.prototype.setDirty = function(v){ this._dirty = v; return this; };
	
	Imba.Pointer.prototype.__events = {name: 'events'};
	Imba.Pointer.prototype.events = function(v){ return this._events; }
	Imba.Pointer.prototype.setEvents = function(v){ this._events = v; return this; };
	
	Imba.Pointer.prototype.__touch = {name: 'touch'};
	Imba.Pointer.prototype.touch = function(v){ return this._touch; }
	Imba.Pointer.prototype.setTouch = function(v){ this._touch = v; return this; };
	
	
	
	Imba.Pointer.prototype.update = function (e){
		// console.log(e)
		this.setEvent(e);
		// normalize the event / touch?
		this.events().push(e);
		this.setDirty(true);
		return this;
	};
	
	// this is just for regular mouse now
	Imba.Pointer.prototype.process = function (){
		var phase = this.phase();
		var e0 = this.prevEvent();
		var e1 = this.event();
		
		if (this.dirty()) {
			this.setPrevEvent(e1);
			this.setDirty(false);
			// button should only change on mousedown etc
			if (e1.type == 'mousedown') {
				// this is correct when we know it is a mousedown(!)
				this.setButton(e1.button);
				// console.log('button-state changed!!!',button)
				this.setTouch(new Imba.Touch(e1,this));
				this.touch().mousedown(e1,e1);
				// trigger pointerdown
			} else if (e1.type == 'mousemove') {
				if (this.touch()) { this.touch().mousemove(e1,e1) };
			} else if (e1.type == 'mouseup') {
				// console.log('mouseup!!!')
				this.setButton(-1);
				// console.log('button-state changed!!!',button)
				if (this.touch()) { this.touch().mouseup(e1,e1) };
				this.setTouch(null); // reuse?
				// trigger pointerup
			};
			
			// if !e0 || e0:button != e1:button
			// 	console.log('button-state changed!!!',e0,e1)
			// see if button has transitioned?
			// console.log e:type
		} else {
			// set type to stationary?
			// update always?
			if (this.touch()) { this.touch().idle() };
		};
		
		
		return this;
	};
	
	Imba.Pointer.prototype.emit = function (name,target,pars){
		if(!pars||pars.constructor !== Object) pars = {};
		var bubble = pars.bubble !== undefined ? pars.bubble : true;
		return true;
	};
	
	
	Imba.Pointer.prototype.cleanup = function (){
		return Imba.POINTERS;
	};
	
	Imba.Pointer.prototype.x = function (){
		return this.event().x;
	};
	Imba.Pointer.prototype.y = function (){
		return this.event().y;
	};
	
	Imba.Pointer.update = function (){
		// console.log('update touch')
		for (var i=0, ary=iter$(Imba.POINTERS), len=ary.length; i < len; i++) {
			ary[i].process();
		};
		// need to be able to prevent the default behaviour of touch, no?
		win.requestAnimationFrame(Imba.Pointer.update);
		// hmmm
		return this;
	};
	
	
	
	// Imba.Touch
	// Began	A finger touched the screen.
	// Moved	A finger moved on the screen.
	// Stationary	A finger is touching the screen but hasn't moved.
	// Ended	A finger was lifted from the screen. This is the final phase of a touch.
	// Canceled The system cancelled tracking for the touch.
	/* @class Touch */
	Imba.Touch = function Touch(e,ptr){
		// @native  = false
		this.setEvent(e);
		this.setData({});
		this.setActive(true);
		this._suppress = false;
		this.setBubble(false);
		this.setPointer(ptr);
		this.setUpdates(0);
	};
	
	var multi = true;
	var touches = [];
	var count = 0;
	var identifiers = {};
	
	Imba.Touch.count = function (){
		return count;
	};
	
	Imba.Touch.lookup = function (item){
		// return touch if var touch = item:__touch__
		return item && (item.__touch__ || identifiers[item.identifier]);
		// look for lookup
		// var id = item:identifier
		// if id != undefined and (touch = IMBA_TOUCH_IDENTIFIERS{id})
		// 	return touch 
	};
	
	Imba.Touch.release = function (item,touch){
		var v_, $1;
		(((v_ = identifiers[item.identifier]),delete identifiers[item.identifier], v_));
		((($1 = item.__touch__),delete item.__touch__, $1));
		return;
	};
	
	Imba.Touch.ontouchstart = function (e){
		for (var i=0, ary=iter$(e.changedTouches), len=ary.length, t; i < len; i++) {
			t = ary[i];if (this.lookup(t)) { continue };
			var touch = identifiers[t.identifier] = new this(e); // (e)
			t.__touch__ = touch;
			touches.push(touch);
			count++;
			touch.touchstart(e,t);
		};
		return this;
	};
	
	Imba.Touch.ontouchmove = function (e){
		for (var i=0, ary=iter$(e.changedTouches), len=ary.length, t; i < len; i++) {
			t = ary[i];if (touch = this.lookup(t)) {
				touch.touchmove(e,t);
			};
		};
		
		return this;
	};
	
	Imba.Touch.ontouchend = function (e){
		for (var i=0, ary=iter$(e.changedTouches), len=ary.length, t; i < len; i++) {
			t = ary[i];if (touch = this.lookup(t)) {
				touch.touchend(e,t);
				this.release(t,touch);
				count--;
				// not always supported!
				// touches = touches.filter(||)
			};
		};
		return this;
	};
	
	Imba.Touch.ontouchcancel = function (e){
		for (var i=0, ary=iter$(e.changedTouches), len=ary.length, t; i < len; i++) {
			t = ary[i];if (touch = this.lookup(t)) {
				touch.touchcancel(e,t);
				this.release(t,touch);
				count--;
			};
		};
		return this;
	};
	
	
	
	
	Imba.Touch.prototype.__phase = {name: 'phase'};
	Imba.Touch.prototype.phase = function(v){ return this._phase; }
	Imba.Touch.prototype.setPhase = function(v){ this._phase = v; return this; };
	
	Imba.Touch.prototype.__active = {name: 'active'};
	Imba.Touch.prototype.active = function(v){ return this._active; }
	Imba.Touch.prototype.setActive = function(v){ this._active = v; return this; };
	
	Imba.Touch.prototype.__event = {name: 'event'};
	Imba.Touch.prototype.event = function(v){ return this._event; }
	Imba.Touch.prototype.setEvent = function(v){ this._event = v; return this; };
	
	Imba.Touch.prototype.__pointer = {name: 'pointer'};
	Imba.Touch.prototype.pointer = function(v){ return this._pointer; }
	Imba.Touch.prototype.setPointer = function(v){ this._pointer = v; return this; };
	
	Imba.Touch.prototype.__target = {name: 'target'};
	Imba.Touch.prototype.target = function(v){ return this._target; }
	Imba.Touch.prototype.setTarget = function(v){ this._target = v; return this; }; // if 'safe' we can cache multiple uses
	
	Imba.Touch.prototype.__handler = {name: 'handler'};
	Imba.Touch.prototype.handler = function(v){ return this._handler; }
	Imba.Touch.prototype.setHandler = function(v){ this._handler = v; return this; };
	
	Imba.Touch.prototype.__updates = {name: 'updates'};
	Imba.Touch.prototype.updates = function(v){ return this._updates; }
	Imba.Touch.prototype.setUpdates = function(v){ this._updates = v; return this; };
	
	Imba.Touch.prototype.__suppress = {name: 'suppress'};
	Imba.Touch.prototype.suppress = function(v){ return this._suppress; }
	Imba.Touch.prototype.setSuppress = function(v){ this._suppress = v; return this; };
	
	Imba.Touch.prototype.__data = {name: 'data'};
	Imba.Touch.prototype.data = function(v){ return this._data; }
	Imba.Touch.prototype.setData = function(v){ this._data = v; return this; };
	
	Imba.Touch.prototype.__bubble = {chainable: true,name: 'bubble'};
	Imba.Touch.prototype.bubble = function(v){ return v !== undefined ? (this.setBubble(v),this) : this._bubble; }
	Imba.Touch.prototype.setBubble = function(v){ this._bubble = v; return this; };
	
	
	Imba.Touch.prototype.__gestures = {name: 'gestures'};
	Imba.Touch.prototype.gestures = function(v){ return this._gestures; }
	Imba.Touch.prototype.setGestures = function(v){ this._gestures = v; return this; };
	// prop preventDefault
	
	
	Imba.Touch.prototype.__x0 = {name: 'x0'};
	Imba.Touch.prototype.x0 = function(v){ return this._x0; }
	Imba.Touch.prototype.setX0 = function(v){ this._x0 = v; return this; };
	
	Imba.Touch.prototype.__y0 = {name: 'y0'};
	Imba.Touch.prototype.y0 = function(v){ return this._y0; }
	Imba.Touch.prototype.setY0 = function(v){ this._y0 = v; return this; };
	
	// duration etc -- important
	
	
	
	Imba.Touch.prototype.preventDefault = function (){
		this._preventDefault = true;
		this.event() && this.event().preventDefault();
		// pointer.event.preventDefault
		return this;
	};
	
	Imba.Touch.prototype.extend = function (gesture){
		// console.log "added gesture!!!"
		this._gestures || (this._gestures = []);
		this._gestures.push(gesture); // hmmm
		return this;
	};
	
	Imba.Touch.prototype.redirect = function (target){
		this._redirect = target;
		return this;
	};
	
	Imba.Touch.prototype.suppress = function (){
		this._active = false;
		return this;
	};
	
	Imba.Touch.prototype.touchstart = function (e,t){
		this._event = e;
		this._touch = t;
		this._x = t.clientX;
		this._y = t.clientY;
		this.began();
		if (e && this._suppress) { e.preventDefault() };
		return this;
	};
	
	Imba.Touch.prototype.touchmove = function (e,t){
		this._event = e;
		this._x = t.clientX;
		this._y = t.clientY;
		this.update();
		if (e && this._suppress) { e.preventDefault() };
		return this;
	};
	
	Imba.Touch.prototype.touchend = function (e,t){
		this._event = e;
		// log "touchend"
		this._x = t.clientX;
		this._y = t.clientY;
		this.ended();
		if (e && this._suppress) { e.preventDefault() };
		return this;
	};
	
	Imba.Touch.prototype.touchcancel = function (e,t){
		// log "touchcancel"
		return this;
	};
	
	
	Imba.Touch.prototype.mousedown = function (e,t){
		// log "mousedown"
		this._x = t.clientX;
		this._y = t.clientY;
		this.began();
		return this;
	};
	
	Imba.Touch.prototype.mousemove = function (e,t){
		// log "mousemove"
		this._x = t.clientX;
		this._y = t.clientY;
		// how does this work with touches?
		this._event = e;
		if (this._suppress) { e.preventDefault() };
		this.update();
		this.move();
		return this;
	};
	
	Imba.Touch.prototype.mouseup = function (e,t){
		// log "mousemove"
		this._x = t.clientX;
		this._y = t.clientY;
		this.ended();
		return this;
	};
	
	Imba.Touch.prototype.idle = function (){
		return this.update();
	};
	
	Imba.Touch.prototype.began = function (){
		// console.log "begaN??"
		this._x0 = this._x;
		this._y0 = this._y;
		
		var e = this.event();
		// var ptr = pointer # hmmm
		var dom = this.event().target;
		var node = null;
		// hmm
		this._sourceTarget = dom && tag$wrap(dom);
		// need to find the 
		while (dom){
			node = tag$wrap(dom);
			if (node && node.ontouchstart) {
				this._bubble = false;
				this.setTarget(node);
				this.target().ontouchstart(this);
				if (!(this._bubble)) { break };
			};
			dom = dom.parentNode;
		};
		
		// console.log('target??',target)
		this._updates++;
		// if target
		// 	target.ontouchstart(self)
		// 	# ptr.event.preventDefault unless @native
		// 	# prevent default?
		
		//  = e:clientX
		//  = e:clientY
		return this;
	};
	
	Imba.Touch.prototype.update = function (){
		if (!(this._active)) { return this };
		// catching a touch-redirect?!?
		if (this._redirect) {
			if (this._target && this._target.ontouchcancel) {
				this._target.ontouchcancel(this);
			};
			this.setTarget(this._redirect);
			this._redirect = null;
			if (this.target().ontouchstart) { this.target().ontouchstart(this) };
		};
		
		
		this._updates++;
		if (this._gestures) {
			for (var i=0, ary=iter$(this._gestures), len=ary.length; i < len; i++) {
				ary[i].ontouchupdate(this);
			};
		};
		
		if (this.target() && this.target().ontouchupdate) { this.target().ontouchupdate(this) };
		return this;
	};
	
	Imba.Touch.prototype.move = function (){
		if (!(this._active)) { return this };
		
		if (this._gestures) {
			for (var i=0, ary=iter$(this._gestures), len=ary.length, g; i < len; i++) {
				g = ary[i];if (g.ontouchmove) { g.ontouchmove(this,this._event) };
			};
		};
		
		if (this.target() && this.target().ontouchmove) { this.target().ontouchmove(this,this._event) };
		return this;
	};
	
	Imba.Touch.prototype.ended = function (){
		if (!(this._active)) { return this };
		
		this._updates++;
		
		if (this._gestures) {
			for (var i=0, ary=iter$(this._gestures), len=ary.length; i < len; i++) {
				ary[i].ontouchend(this);
			};
		};
		
		if (this.target() && this.target().ontouchend) { this.target().ontouchend(this) };
		
		// simulate tap -- need to be careful about this(!)
		// must look at timing and movement(!)
		if (this._touch) {
			ED.trigger('tap',this.event().target);
		};
		return this;
	};
	
	Imba.Touch.prototype.cancelled = function (){
		return this;
	};
	
	Imba.Touch.prototype.dx = function (){
		return this._x - this._x0;
		// pointer.x - @x0
	};
	
	Imba.Touch.prototype.dy = function (){
		return this._y - this._y0;
		// pointer.y - @y0
	};
	
	Imba.Touch.prototype.x = function (){
		return this._x;
	}; // pointer.x
	Imba.Touch.prototype.y = function (){
		return this._y;
	}; // pointer.y
	
	Imba.Touch.prototype.button = function (){
		return this._pointer ? (this._pointer.button()) : (0);
	}; // hmmmm
	
	Imba.Touch.prototype.sourceTarget = function (){
		return this._sourceTarget;
	};
	
	
	
	/* @class TouchGesture */
	Imba.TouchGesture = function TouchGesture(){ };
	
	
	Imba.TouchGesture.prototype.__active = {default: false,name: 'active'};
	Imba.TouchGesture.prototype.active = function(v){ return this._active; }
	Imba.TouchGesture.prototype.setActive = function(v){ this._active = v; return this; }
	Imba.TouchGesture.prototype._active = false;
	
	Imba.TouchGesture.prototype.ontouchstart = function (e){
		return this;
	};
	
	Imba.TouchGesture.prototype.ontouchupdate = function (e){
		return this;
	};
	
	Imba.TouchGesture.prototype.ontouchend = function (e){
		return this;
	};
	
	
	
	
	// should be possible
	// def Imba.Pointer.update
	
	
	// A Touch-event is created on mousedown (always)
	// and while it exists, mousemove and mouseup will
	// be delegated to this active event.
	Imba.POINTER = new Imba.Pointer();
	Imba.POINTERS = [Imba.POINTER];
	
	// are we really sure we want to use RAF for this?
	// Imba.Pointer.update
	
	
	
	// regular event stuff
	Imba.KEYMAP = {
		"8": 'backspace',
		"9": 'tab',
		"13": 'enter',
		"16": 'shift',
		"17": 'ctrl',
		"18": 'alt',
		"19": 'break',
		"20": 'caps',
		"27": 'esc',
		"32": 'space',
		"35": 'end',
		"36": 'home',
		"37": 'larr',
		"38": 'uarr',
		"39": 'rarr',
		"40": 'darr',
		"45": 'insert',
		"46": 'delete',
		"107": 'plus',
		"106": 'mult',
		"91": 'meta'
	};
	
	Imba.CHARMAP = {
		"%": 'modulo',
		"*": 'multiply',
		"+": 'add',
		"-": 'sub',
		"/": 'divide',
		".": 'dot'
	};
	
	
	/* @class Event */
	Imba.Event = function Event(e){
		this.setEvent(e);
		this.setBubble(true);
	};
	
	
	Imba.Event.prototype.__event = {name: 'event'};
	Imba.Event.prototype.event = function(v){ return this._event; }
	Imba.Event.prototype.setEvent = function(v){ this._event = v; return this; };
	
	Imba.Event.prototype.__target = {name: 'target'};
	Imba.Event.prototype.target = function(v){ return this._target; }
	Imba.Event.prototype.setTarget = function(v){ this._target = v; return this; };
	
	Imba.Event.prototype.__prefix = {name: 'prefix'};
	Imba.Event.prototype.prefix = function(v){ return this._prefix; }
	Imba.Event.prototype.setPrefix = function(v){ this._prefix = v; return this; };
	
	Imba.Event.prototype.__data = {name: 'data'};
	Imba.Event.prototype.data = function(v){ return this._data; }
	Imba.Event.prototype.setData = function(v){ this._data = v; return this; };
	
	Imba.Event.prototype.__source = {name: 'source'};
	Imba.Event.prototype.source = function(v){ return this._source; }
	Imba.Event.prototype.setSource = function(v){ this._source = v; return this; };
	
	Imba.Event.prototype.__bubble = {name: 'bubble'};
	Imba.Event.prototype.bubble = function(v){ return this._bubble; }
	Imba.Event.prototype.setBubble = function(v){ this._bubble = v; return this; }; // getset: yes
	
	Imba.Event.wrap = function (e){
		return new this(e);
	};
	
	
	
	Imba.Event.prototype.name = function (){
		return this.event().type.toLowerCase().replace(/\:/g,'');
	};
	
	// mimc getset
	Imba.Event.prototype.bubble = function (v){
		if (v != undefined) {
			this.setBubble(v);
			return this;
		};
		return this._bubble;
	};
	
	Imba.Event.prototype.halt = function (){
		this.setBubble(false);
		return this;
	};
	
	Imba.Event.prototype.cancel = function (){
		if (this.event().preventDefault) { this.event().preventDefault() };
		return this;
	};
	
	Imba.Event.prototype.target = function (){
		return tag$wrap(this.event()._target || this.event().target);
	};
	
	Imba.Event.prototype.redirect = function (node){
		this._redirect = node;
		return this;
	};
	
	Imba.Event.prototype.keychar = function (){
		if (this.event() instanceof TextEvent) {
			return this.event().data;
		};
		
		if (this.event() instanceof KeyboardEvent) {
			var ki = this.event().keyIdentifier;
			var sym = Imba.KEYMAP[this.event().keyCode];
			
			// p 'keysym!',ki,sym
			
			if (!sym && ki.substr(0,2) == "U+") {
				sym = String.fromCharCode(global.parseInt(ki.substr(2),16));
			};
			return sym;
		};
		
		return null;
	};
	
	Imba.Event.prototype.keycombo = function (){
		var sym;
		if (!(sym = this.keychar())) { return };
		sym = Imba.CHARMAP[sym] || sym;
		var combo = [];
		if (this.event().ctrlKey) { combo.push('ctrl') };
		if (this.event().shiftKey) { combo.push('shift') };
		if (this.event().altKey) { combo.push('alt') };
		if (this.event().metaKey) { combo.push('cmd') };
		combo.push(sym);
		return combo.join("_").toLowerCase();
	};
	
	Imba.Event.prototype.process = function (){
		var meth = ("on" + (this._prefix || '') + this.name());
		var domtarget = this.event()._target || this.event().target;
		// var node = <{domtarget:_responder or domtarget}> # hmm
		
		var domnode = domtarget._responder || domtarget;
		// need to stop infinite redirect-rules here??!?
		while (domnode){
			this._redirect = null;
			var node = tag$wrap(domnode); // not only tag
			if (node && (node[meth] instanceof Function)) {
				var res = node[meth](this,this.data());
			};
			// log "hit?",domnode
			// add node.nextEventResponder as a separate method here?
			if (!(this.bubble() && (domnode = (this._redirect || (node ? (node.parent()) : (domnode.parentNode)))))) { break };
		};
		
		return this;
	};
	
	Imba.Event.prototype.x = function (){
		return this.event().x;
	};
	Imba.Event.prototype.y = function (){
		return this.event().y;
	};
	
	
	
	/* @class EventManager */
	Imba.EventManager = function EventManager(node,pars){
		var self=this;
		if(!pars||pars.constructor !== Object) pars = {};
		var events = pars.events !== undefined ? pars.events : [];
		self.setRoot(node);
		self.setListeners([]);
		self.setDelegators({});
		self.setDelegator(function(e) {
			// console.log "delegating event?! {e}"
			self.delegate(e);
			return true;
		});
		
		for (var i=0, ary=iter$(events), len=ary.length; i < len; i++) {
			self.register(ary[i]);
		};
		self;
	};
	
	
	Imba.EventManager.prototype.__root = {name: 'root'};
	Imba.EventManager.prototype.root = function(v){ return this._root; }
	Imba.EventManager.prototype.setRoot = function(v){ this._root = v; return this; };
	
	Imba.EventManager.prototype.__enabled = {default: false,watch: 'enabledDidSet',name: 'enabled'};
	Imba.EventManager.prototype.enabled = function(v){ return this._enabled; }
	Imba.EventManager.prototype.setEnabled = function(v){
		var a = this.enabled();
		if(v != a) { v = this._enabled = v; }
		if(v != a) { this.enabledDidSet && this.enabledDidSet(v,a,this.__enabled) }
		return this;
	}
	Imba.EventManager.prototype._enabled = false;
	
	Imba.EventManager.prototype.__listeners = {name: 'listeners'};
	Imba.EventManager.prototype.listeners = function(v){ return this._listeners; }
	Imba.EventManager.prototype.setListeners = function(v){ this._listeners = v; return this; };
	
	Imba.EventManager.prototype.__delegators = {name: 'delegators'};
	Imba.EventManager.prototype.delegators = function(v){ return this._delegators; }
	Imba.EventManager.prototype.setDelegators = function(v){ this._delegators = v; return this; };
	
	Imba.EventManager.prototype.__delegator = {name: 'delegator'};
	Imba.EventManager.prototype.delegator = function(v){ return this._delegator; }
	Imba.EventManager.prototype.setDelegator = function(v){ this._delegator = v; return this; };
	
	Imba.EventManager.prototype.enabledDidSet = function (bool){
		bool ? (this.onenable()) : (this.ondisable());
		return this;
	};
	
	
	
	
	Imba.EventManager.prototype.register = function (name,handler){
		if(handler === undefined) handler = true;
		if (name instanceof Array) {
			for (var i=0, ary=iter$(name), len=ary.length; i < len; i++) {
				this.register(ary[i],handler);
			};
			return this;
		};
		
		if (this.delegators()[name]) { return this };
		// console.log("register for event {name}")
		var fn = this.delegators()[name] = handler instanceof Function ? (handler) : (this.delegator());
		if (this.enabled()) { return this.root().addEventListener(name,fn,true) };
	};
	
	Imba.EventManager.prototype.listen = function (name,handler,capture){
		if(capture === undefined) capture = true;
		this.listeners().push([name,handler,capture]);
		if (this.enabled()) { this.root().addEventListener(name,handler,capture) };
		return this;
	};
	
	Imba.EventManager.prototype.delegate = function (e){
		// console.log "delegate event {e and e:type}"
		// really? wrap all events? Quite expensive unless we reuse them
		var event = Imba.Event.wrap(e);
		// console.log "delegate event {e:type}"
		event.process();
		// name = e:type.toLowerCase.replace(/\:/g,'')
		// create our own event here?
		return this;
	};
	
	Imba.EventManager.prototype.create = function (type,target,pars){
		if(!pars||pars.constructor !== Object) pars = {};
		var data = pars.data !== undefined ? pars.data : null;
		var source = pars.source !== undefined ? pars.source : null;
		var event = Imba.Event.wrap({type: type,target: target});
		if (data) { (event.setData(data),data) };
		if (source) { (event.setSource(source),source) };
		return event;
	};
	
	// use create instead?
	Imba.EventManager.prototype.trigger = function (type,target,pars){
		if(!pars||pars.constructor !== Object) pars = {};
		var data = pars.data !== undefined ? pars.data : null;
		var source = pars.source !== undefined ? pars.source : null;
		var event = Imba.Event.wrap({type: type,target: target});
		if (data) { (event.setData(data),data) };
		if (source) { (event.setSource(source),source) };
		return event.process();
	};
	
	Imba.EventManager.prototype.emit = function (obj,event,data,pars){
		// log "emit event for",obj,event,data
		if(!pars||pars.constructor !== Object) pars = {};
		var dom = pars.dom !== undefined ? pars.dom : true;
		var ns = pars.ns !== undefined ? pars.ns : 'object';
		var fn = ("on" + ns);
		var nodes = DOC.querySelectorAll(("." + (obj.uid())));
		for (var i=0, ary=iter$(nodes), len=ary.length, node; i < len; i++) {
			// log "found node {node:className}"
			node = ary[i];if (node._tag && node._tag[fn]) {
				node._tag[fn](event,data);
			};
			// now we simply link to onobject event
		};
		return this;
	};
	
	Imba.EventManager.prototype.onenable = function (){
		for (var o=this.delegators(), i=0, keys=Object.keys(o), l=keys.length; i < l; i++){
			this.root().addEventListener(keys[i],o[keys[i]],true);
		};
		
		for (var i=0, ary=iter$(this.listeners()), len=ary.length, item; i < len; i++) {
			item = ary[i];this.root().addEventListener(item[0],item[1],item[2]);
		};
		return this;
	};
	
	Imba.EventManager.prototype.ondisable = function (){
		for (var o=this.delegators(), i=0, keys=Object.keys(o), l=keys.length; i < l; i++){
			this.root().removeEventListener(keys[i],o[keys[i]],true);
		};
		
		for (var i=0, ary=iter$(this.listeners()), len=ary.length, item; i < len; i++) {
			item = ary[i];this.root().removeEventListener(item[0],item[1],item[2]);
		};
		return this;
	};
	
	
	
	
	ED = new Imba.EventManager(document,{events: [
		'keydown','keyup','keypress','textInput','input',
		'focusin','focusout','contextmenu','submit',
		'mousedown','mouseup'
	]});
	
	
	if (hasTouchEvents) {
		ED.listen('touchstart',function(e) {
			return Imba.Touch.ontouchstart(e);
		});
		ED.listen('touchmove',function(e) {
			return Imba.Touch.ontouchmove(e);
		});
		ED.listen('touchend',function(e) {
			return Imba.Touch.ontouchend(e);
		});
		ED.listen('touchcancel',function(e) {
			return Imba.Touch.ontouchcancel(e);
		});
	} else {
		ED.listen('click',function(e) {
			// console.log('onclick',e)
			return ED.trigger('tap',e.target);
		});
		
		ED.listen('mousedown',function(e) {
			if (Imba.POINTER) { return Imba.POINTER.update(e).process() };
		});
		
		ED.listen('mousemove',function(e) {
			if (Imba.POINTER) { return Imba.POINTER.update(e).process() }; // .process if touch # should not happen? We process through 
		});
		
		ED.listen('mouseup',function(e) {
			if (Imba.POINTER) { return Imba.POINTER.update(e).process() };
		});
	};


}())
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],4:[function(require,module,exports){
(function (global){
(function(){


	function idx$(a,b){
		return (b && b.indexOf) ? b.indexOf(a) : [].indexOf.call(a,b);
	};
	
	// helper for subclassing
	function subclass$(obj,sup) {
		for (var k in sup) {
			if (sup.hasOwnProperty(k)) obj[k] = sup[k];
		};
		// obj.__super__ = sup;
		obj.prototype = Object.create(sup.prototype);
		obj.__super__ = obj.prototype.__super__ = sup.prototype;
		obj.prototype.initialize = obj.prototype.constructor = obj;
	};
	
	function iter$(a){ return a ? (a.toArray ? a.toArray() : a) : []; };
	var doc;
	var svgSupport = true;
	
	if (doc = global.document) {
		Imba.doc = doc;
		svgSupport = doc.createElementNS && doc.createElementNS('http://www.w3.org/2000/svg',"svg").createSVGRect;
	};
	
	// This is VERY experimental. Using Imba for serverside templates
	// is not recommended unless you're ready for a rough ride. It is
	// a priority to get this fast and stable.
	
	// room for lots of optimization to serverside nodes. can be much more
	// clever when it comes to the classes etc
	
	/* @class ElementTag */
	function ElementTag(){ };
	
	
	ElementTag.prototype.__object = {};
	ElementTag.prototype.object = function(v){ return this._object; }
	ElementTag.prototype.setObject = function(v){ this._object = v; return this; };
	
	ElementTag.prototype.dom = function (){
		return this._dom;
	};
	
	ElementTag.prototype.setDom = function (dom){
		dom._tag = this;
		this._dom = dom;
		return this;
	};
	
	ElementTag.prototype.setRef = function (ref){
		this.flag(this._ref = ref);
		return this;
	};
	
	ElementTag.prototype.setAttribute = function (key,v){
		v != null && v !== false ? (this.dom().setAttribute(key,v)) : (this.removeAttribute(key));
		return v; // non-obvious that we need to return the value here, no?
	};
	
	ElementTag.prototype.removeAttribute = function (key){
		return this.dom().removeAttribute(key);
	};
	
	ElementTag.prototype.getAttribute = function (key){
		var val = this.dom().getAttribute(key);
		return val;
	};
	
	ElementTag.prototype.object = function (v){
		if (arguments.length) { return ((this.setObject(v),v),this) };
		return this._object; // hmm
	};
	
	ElementTag.prototype.body = function (v){
		if (arguments.length) { return ((this.setBody(v),v),this) };
		return this;
	};
	
	ElementTag.prototype.setBody = function (body){
		this._empty ? (this.append(body)) : (this.empty().append(body));
		return this;
	};
	
	ElementTag.prototype.setContent = function (content){
		this.setChildren(content); // override?
		return this;
	};
	
	ElementTag.prototype.setChildren = function (nodes){
		this._empty ? (this.append(nodes)) : (this.empty().append(nodes));
		return this;
	};
	
	ElementTag.prototype.text = function (v){
		if (arguments.length) { return ((this.setText(v),v),this) };
		return this._dom.textContent;
	};
	
	ElementTag.prototype.setText = function (txt){
		this._empty = false;
		this._dom.textContent = txt == null ? (txt = "") : (txt);
		return this;
	};
	
	ElementTag.prototype.empty = function (){
		while (this._dom.firstChild){
			this._dom.removeChild(this._dom.firstChild);
		};
		this._empty = true;
		return this;
	};
	
	ElementTag.prototype.remove = function (node){
		var par = this.dom();
		var el = node && node.dom();
		if (el && el.parentNode == par) { par.removeChild(el) };
		return this;
	};
	
	
	ElementTag.prototype.parent = function (){
		return tag$wrap(this.dom().parentNode);
	};
	
	// def first sel
	// 	# want to filter
	// 	var el = tag(dom:firstChild)
	// 	if sel and el and !el.matches(sel)
	// 		return el.next(sel)
	// 	return el
	
	ElementTag.prototype.log = function (){
		// playing safe for ie
		var $0 = arguments, i = $0.length;
		var args = new Array(i>0 ? i : 0);
		while(i>0) args[i-1] = $0[--i];
		args.unshift(console);
		Function.prototype.call.apply(console.log,args);
		// console.log(*arguments)
		return this;
	};
	
	
	// def emit name, data: nil, bubble: yes
	// 	ED.trigger name, self, data: data, bubble: bubble
	// 	return self
	
	ElementTag.prototype.css = function (key,val){
		if (key instanceof Object) {
			for (var o=key, i=0, keys=Object.keys(o), l=keys.length; i < l; i++){
				this.css(keys[i],o[keys[i]]);
			};
		} else if (val == null) {
			this.dom().style.removeProperty(key);
		} else if (val == undefined) {
			return this.dom().style[key];
		} else {
			if ((typeof val=='number'||val instanceof Number) && key.match(/width|height|left|right|top|bottom/)) {
				val = val + "px";
			};
			this.dom().style[key] = val;
		};
		return this;
	};
	
	// selectors / traversal
	ElementTag.prototype.find = function (sel){
		return new ImbaSelector(sel,this);
	};
	
	ElementTag.prototype.first = function (sel){
		return sel ? (this.find(sel).first()) : (tag$wrap(this.dom().firstElementChild));
	};
	
	ElementTag.prototype.last = function (sel){
		return sel ? (this.find(sel).last()) : (tag$wrap(this.dom().lastElementChild));
	};
	
	ElementTag.prototype.child = function (i){
		return tag$wrap(this.dom().children[i || 0]);
	};
	
	ElementTag.prototype.children = function (sel){
		var nodes = new ImbaSelector(null,this,this._dom.children);
		return sel ? (nodes.filter(sel)) : (nodes);
	};
	
	ElementTag.prototype.orphanize = function (){
		var par;
		if (par = this.dom().parentNode) { par.removeChild(this._dom) };
		return this;
	};
	
	ElementTag.prototype.matches = function (sel){
		var fn;
		if (sel instanceof Function) {
			return sel(this);
		};
		
		if (sel.query) { sel = sel.query() };
		if (fn = (this._dom.webkitMatchesSelector || this._dom.matches)) { return fn.call(this._dom,sel) };
		// TODO support other browsers etc?
	};
	
	ElementTag.prototype.closest = function (sel){
		if (!sel) { return this.parent() }; // should return self?!
		var node = this;
		if (sel.query) { sel = sel.query() };
		
		while (node){
			if (node.matches(sel)) { return node };
			node = node.parent();
		};
		return null;
	};
	
	ElementTag.prototype.path = function (sel){
		var node = this;
		var nodes = [];
		if (sel && sel.query) { sel = sel.query() };
		
		while (node){
			if (!sel || node.matches(sel)) { nodes.push(node) };
			node = node.parent();
		};
		return nodes;
	};
	
	ElementTag.prototype.parents = function (sel){
		var par = this.parent();
		return par ? (par.path(sel)) : ([]);
	};
	
	ElementTag.prototype.up = function (sel){
		if (!sel) { return this.parent() };
		return this.parent() && this.parent().closest(sel);
	};
	
	ElementTag.prototype.siblings = function (sel){
		var par, self=this;
		if (!(par = this.parent())) { return [] }; // FIXME
		var ary = this.dom().parentNode.children;
		var nodes = new ImbaSelector(null,this,ary);
		return nodes.filter(function(n) {
			return n != self && (!sel || n.matches(sel));
		});
	};
	
	ElementTag.prototype.next = function (sel){
		if (sel) {
			var el = this;
			while (el = el.next()){
				if (el.matches(sel)) { return el };
			};
			return null;
		};
		return tag$wrap(this.dom().nextElementSibling);
	};
	
	ElementTag.prototype.prev = function (sel){
		if (sel) {
			var el = this;
			while (el = el.prev()){
				if (el.matches(sel)) { return el };
			};
			return null;
		};
		return tag$wrap(this.dom().previousElementSibling);
	};
	
	ElementTag.prototype.contains = function (node){
		return this.dom().contains(node && node._dom || node);
	};
	
	ElementTag.prototype.index = function (){
		var i = 0;
		var el = this.dom();
		while (el.previousSibling){
			el = el.previousSibling;
			i++;
		};
		
		return i;
	};
	
	
	
	ElementTag.prototype.insert = function (node,pars){
		if(!pars||pars.constructor !== Object) pars = {};
		var before = pars.before !== undefined ? pars.before : null;
		var after = pars.after !== undefined ? pars.after : null;
		if (after) { before = after.next() };
		if (node instanceof Array) { node = (t$('fragment').setContent(node).end()) };
		if (before) {
			this.dom().insertBefore(node.dom(),before.dom());
		} else {
			this.append(node);
		};
		return this;
	};
	
	// bind / present
	ElementTag.prototype.bind = function (obj){
		this.setObject(obj);
		if (this._built) { this.render(obj) }; // hmm
		return this;
	};
	
	ElementTag.prototype.build = function (){
		return this;
	};
	
	ElementTag.prototype.commit = function (){
		return this;
	};
	
	ElementTag.prototype.synced = function (){
		return this;
	};
	
	ElementTag.prototype.focus = function (){
		this.dom().focus();
		return this;
	};
	
	ElementTag.prototype.blur = function (){
		this.dom().blur();
		return this;
	};
	
	ElementTag.prototype.end = function (){
		if (this._built) {
			this.commit();
		} else {
			this._built = true;
			this.build();
		};
		return this;
	};
	
	ElementTag.prototype.render = function (par){
		this.setBody(this.template(par || this._object));
		return this;
	};
	
	// called when the node is awakened in the dom - either automatically
	// upon attachment to the dom-tree, or the first time imba needs the
	// tag for a domnode that has been rendered on the server
	ElementTag.prototype.awake = function (){
		return this;
	};
	
	ElementTag.prototype.template = function (){
		return null;
	};
	
	ElementTag.prototype.prepend = function (item){
		return this.insert(item,{before: this.first()});
	};
	
	
	ElementTag.prototype.append = function (item){
		// possible to append blank
		// possible to simplify on server?
		if (!item) { return this };
		
		if (item instanceof Array) {
			for (var i=0, ary=iter$(item), len=ary.length, member; i < len; i++) {
				member = ary[i];member && this.append(member);
			};
		} else if ((typeof item=='string'||item instanceof String) || (typeof item=='number'||item instanceof Number)) {
			var node = Imba.doc.createTextNode(item);
			this._dom.appendChild(node);
			if (this._empty) { this._empty = false };
		} else {
			this._dom.appendChild(item._dom || item);
			if (this._empty) { this._empty = false };
		};
		
		return this;
	};
	
	ElementTag.prototype.toString = function (){
		return this._dom.toString(); // really?
	};
	
	ElementTag.flag = function (flag){
		// hmm - this is not good enough
		// should redirect to the prototype with a dom-node already set?
		var dom = this.dom();
		dom.classList.add(flag);
		// dom:className += " " + flag
		return this;
	};
	
	ElementTag.unflag = function (flag){
		this.dom().classList.remove(flag);
		return this;
	};
	
	ElementTag.prototype.classes = function (){
		return this.dom().classList;
	};
	
	ElementTag.prototype.flag = function (ref,toggle){
		// it is most natural to treat a second undefined argument as a no-switch
		// so we need to check the arguments-length
		if (arguments.length == 2) {
			toggle ? (this.classes().add(ref)) : (this.classes().remove(ref));
		} else {
			this.classes().add(ref);
		};
		return this;
	};
	
	ElementTag.prototype.unflag = function (ref){
		this.classes().remove(ref);
		return this;
	};
	
	ElementTag.prototype.hasFlag = function (ref){
		return this.classes().contains(ref);
	};
	
	
	
	/* @class HTMLElementTag */
	function HTMLElementTag(){ ElementTag.apply(this,arguments) };
	
	subclass$(HTMLElementTag,ElementTag);
	HTMLElementTag.dom = function (){
		if (this._dom) { return this._dom };
		
		var dom;
		var sup = this.__super__.constructor;
		
		// should clone the parent no?
		if (this._isNative) {
			dom = Imba.doc.createElement(this._nodeType);
		} else if (this._nodeType != sup._nodeType) {
			console.log("custom dom type(!)");
			dom = Imba.doc.createElement(this._nodeType);
			for (var i=0, ary=iter$(sup.dom()), len=ary.length, atr; i < len; i++) {
				atr = ary[i];dom.setAttribute(atr.name,atr.value);
			};
			// dom:className = sup.dom:className
			// what about default attributes?
		} else {
			dom = sup.dom().cloneNode(false);
		};
		
		// should be a way to use a native domtype without precreating the doc
		// and still keeping the classes?
		
		if (this._domFlags) {
			for (var i=0, ary=iter$(this._domFlags), len=ary.length; i < len; i++) {
				dom.classList.add(ary[i]);
			};
		};
		
		// include the super?!
		// dom:className = @nodeClass or ""
		return this._dom = dom;
	};
	
	// we really ought to optimize this
	HTMLElementTag.createNode = function (flags,id){
		var proto = this._dom || this.dom();
		var dom = proto.cloneNode(false);
		
		if (id) {
			dom.id = id;
		};
		
		if (flags) {
			this.p("SHOULD NEVER GET HERE?!");
			var nc = dom.className;
			dom.className = nc && flags ? ((nc + " " + flags)) : ((nc || flags));
		};
		
		return dom;
	};
	
	
	HTML_TAGS = "a abbr address area article aside audio b base bdi bdo big blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hr html i iframe img input ins kbd keygen label legend li link main map mark menu menuitem meta meter nav noscript object ol optgroup option output p param pre progress q rp rt ruby s samp script section select small source span strong style sub summary sup table tbody td textarea tfoot th thead time title tr track u ul var video wbr".split(" ");
	HTML_TAGS_UNSAFE = "article aside header section".split(" ");
	
	SVG_TAGS = "circle defs ellipse g line linearGradient mask path pattern polygon polyline radialGradient rect stop svg text tspan".split(" ");
	
	IMBA_TAGS = {
		element: ElementTag,
		htmlelement: HTMLElementTag
	};
	
	Imba.SINGLETONS = {};
	Imba.TAGS = IMBA_TAGS;
	
	function extender(obj,sup){
		for (var o=sup, i=0, keys=Object.keys(o), l=keys.length; i < l; i++){
			obj[keys[i]] = o[keys[i]];
		};
		
		obj.prototype = Object.create(sup.prototype);
		obj.__super__ = obj.prototype.__super__ = sup.prototype;
		obj.prototype.initialize = obj.prototype.constructor = obj;
		return obj;
	};
	
	Imba.defineTag = function (name,func,supr){
		var m = name.split("$");
		
		var name = m[0];
		var ns = m[1];
		
		supr || (supr = (idx$(name,HTML_TAGS) >= 0) ? ('htmlelement') : ('div'));
		
		var suprklass = IMBA_TAGS[supr];
		var klass = func; // imba$class(func,suprklass)
		
		extender(klass,suprklass);
		
		klass._nodeType = suprklass._nodeType || name;
		
		klass._name = name;
		klass._ns = ns;
		
		// add the classes -- if this is not a basic native node?
		if (klass._nodeType != name) {
			klass._nodeFlag = "_" + name.replace(/_/g,'-');
			var nc = suprklass._nodeClass;
			nc = nc ? (nc.split(/\s+/g)) : ([]);
			var c = null;
			if (ns && idx$(c,nc) == -1) { nc.push(c = ("" + ns + "_")) };
			if (!(idx$(c,nc) >= 0)) { nc.push(c = klass._nodeFlag) };
			klass._nodeClass = nc.join(" ");
			klass._domFlags = nc;
			klass._isNative = false;
		} else {
			klass._isNative = true;
		};
		
		klass._dom = null;
		klass.prototype._nodeType = klass._nodeType;
		klass.prototype._dom = null;
		klass.prototype._built = false;
		klass.prototype._empty = true;
		
		tag$[name] = Imba.basicTagSpawner(klass,klass._nodeType);
		
		// add the default flags / classes for ns etc
		// if namespaced -- this is dangerous
		if (!ns) { IMBA_TAGS[name] = klass };
		IMBA_TAGS[("" + name + "$" + (ns || 'html'))] = klass;
		
		// create the global shortcut for tag init as well
		return klass;
	};
	
	Imba.defineSingletonTag = function (id,func,supr){
		var superklass = Imba.TAGS[supr || 'div'];
		// do we really want a class for singletons?
		// var klass = imba$class(func,superklass)
		var klass = extender(func,superklass);
		
		klass._id = id;
		klass._ns = superklass._ns;
		klass._nodeType = superklass._nodeType;
		klass._nodeClass = superklass._nodeClass;
		klass._domFlags = superklass._domFlags;
		klass._isNative = false;
		
		klass._dom = null;
		klass._instance = null;
		klass.prototype._dom = null;
		klass.prototype._built = false;
		klass.prototype._empty = true;
		
		// add the default flags / classes for ns etc
		// if namespaced -- this is dangerous
		// console.log('registered singleton')
		Imba.SINGLETONS[id] = klass;
		return klass;
	};
	
	Imba.tag = function (name){
		var typ = IMBA_TAGS[name];
		return new typ(typ.createNode());
	};
	
	// tags are a big and important part of Imba. It is critical to make this as
	// fast as possible. Since most engines really like functions they can optimize
	// we use several different functions for generating tags, depending on which
	// parts are supplied (classes, id, attributes, ...)
	Imba.basicTagSpawner = function (type){
		return function() {
			return new type(type.createNode());
		};
	};
	
	Imba.tagWithId = function (name,id){
		var typ = IMBA_TAGS[name];
		var dom = typ.createNode();
		dom.id = id;
		return new typ(dom);
	};
	
	tag$ = Imba.tag;
	
	t$ = Imba.tag;
	tc$ = Imba.tagWithFlags;
	ti$ = Imba.tagWithId;
	tic$ = Imba.tagWithIdAndFlags;
	
	
	Imba.getTagSingleton = function (id){
		var type,node,dom;
		
		if (type = Imba.SINGLETONS[id]) {
			// return basic awakening if singleton does not exist?
			
			if (type && type.Instance) { return type.Instance };
			// no instance - check for element
			if (dom = Imba.doc.getElementById(id)) {
				// we have a live instance - when finding it through a selector we should awake it, no?
				// hmm?
				// console.log('creating the singleton from existing node in dom?',id,type)
				node = type.Instance = new type(dom);
				node.awake(); // should only awaken
				return node;
			};
			
			dom = type.createNode();
			dom.id = id;
			// console.log('creating the singleton',id,type)
			node = type.Instance = new type(dom);
			node.end().awake();
			return node;
		} else if (dom = Imba.doc.getElementById(id)) {
			// console.log('found plain element with id')
			return Imba.getTagForDom(dom);
		};
	};
	
	id$ = Imba.getTagSingleton;
	
	Imba.getTagForDom = function (dom){
		
		// ugly checks
		var m;
		if (!dom) { return null };
		if (dom._dom) { return dom }; // could use inheritance instead
		if (dom._tag) { return dom._tag };
		if (!(dom.nodeName)) { return null }; // better check?
		
		var ns = null;
		var id = dom.id;
		var type = dom.nodeName.toLowerCase();
		var cls = dom.className;
		
		if (id && Imba.SINGLETONS[id]) {
			// FIXME control that it is the same singleton?
			// might collide -- not good?
			return Imba.getTagSingleton(id);
		};
		// look for id - singleton
		
		// need better test here
		if (svgSupport && (dom instanceof SVGElement)) {
			ns = "svg";
			cls = dom.className.baseVal;
		};
		
		if (cls) {
			// there can be several matches here - should choose the last
			// should fall back to less specific later? - otherwise things may fail
			// TODO rework this
			if (m = cls.match(/\b_([a-z\-]+)\b(?!\s*_[a-z\-]+)/)) {
				type = m[1].replace(/-/g,'_'); // hmm -should not do that here?
			};
			
			if (m = cls.match(/\b([a-z]+)_\b/)) {
				ns = m[1];
			};
		};
		
		var spawner = IMBA_TAGS[type];
		// console.log("tag for dom?!",ns,type,cls,spawner)
		return spawner ? (new spawner(dom)) : (null);
	};
	
	tag$wrap = Imba.getTagForDom;
	// predefine all supported html tags
	
	
	
		
		
		IMBA_TAGS.htmlelement.prototype.__id = {dom: true};
		IMBA_TAGS.htmlelement.prototype.id = function(v){ return this.getAttribute('id'); }
		IMBA_TAGS.htmlelement.prototype.setId = function(v){ this.setAttribute('id',v); return this; };
		
		IMBA_TAGS.htmlelement.prototype.__tabindex = {dom: true};
		IMBA_TAGS.htmlelement.prototype.tabindex = function(v){ return this.getAttribute('tabindex'); }
		IMBA_TAGS.htmlelement.prototype.setTabindex = function(v){ this.setAttribute('tabindex',v); return this; };
		
		IMBA_TAGS.htmlelement.prototype.__title = {dom: true};
		IMBA_TAGS.htmlelement.prototype.title = function(v){ return this.getAttribute('title'); }
		IMBA_TAGS.htmlelement.prototype.setTitle = function(v){ this.setAttribute('title',v); return this; };
		
		IMBA_TAGS.htmlelement.prototype.__role = {dom: true};
		IMBA_TAGS.htmlelement.prototype.role = function(v){ return this.getAttribute('role'); }
		IMBA_TAGS.htmlelement.prototype.setRole = function(v){ this.setAttribute('role',v); return this; };
		
		// def log *params
		// 	console.log(*params)
		// 	self
	;
	
	(function(){
		var tag = Imba.defineTag('fragment',function fragment(d){this.setDom(d)},'htmlelement');
		tag.createNode = function (){
			return global.document.createDocumentFragment();
		};
	
	})();
	
	(function(){
		var tag = Imba.defineTag('a',function a(d){this.setDom(d)});
		
		tag.prototype.__href = {dom: true};
		tag.prototype.href = function(v){ return this.getAttribute('href'); }
		tag.prototype.setHref = function(v){ this.setAttribute('href',v); return this; };
	
	})();
	
	Imba.defineTag('abbr',function abbr(d){this.setDom(d)});
	Imba.defineTag('address',function address(d){this.setDom(d)});
	Imba.defineTag('area',function area(d){this.setDom(d)});
	Imba.defineTag('article',function article(d){this.setDom(d)});
	Imba.defineTag('aside',function aside(d){this.setDom(d)});
	Imba.defineTag('audio',function audio(d){this.setDom(d)});
	Imba.defineTag('b',function b(d){this.setDom(d)});
	Imba.defineTag('base',function base(d){this.setDom(d)});
	Imba.defineTag('bdi',function bdi(d){this.setDom(d)});
	Imba.defineTag('bdo',function bdo(d){this.setDom(d)});
	Imba.defineTag('big',function big(d){this.setDom(d)});
	Imba.defineTag('blockquote',function blockquote(d){this.setDom(d)});
	Imba.defineTag('body',function body(d){this.setDom(d)});
	Imba.defineTag('br',function br(d){this.setDom(d)});
	(function(){
		var tag = Imba.defineTag('button',function button(d){this.setDom(d)});
		
		tag.prototype.__type = {dom: true};
		tag.prototype.type = function(v){ return this.getAttribute('type'); }
		tag.prototype.setType = function(v){ this.setAttribute('type',v); return this; };
		
		tag.prototype.__disabled = {dom: true};
		tag.prototype.disabled = function(v){ return this.getAttribute('disabled'); }
		tag.prototype.setDisabled = function(v){ this.setAttribute('disabled',v); return this; };
	
	})();
	
	Imba.defineTag('canvas',function canvas(d){this.setDom(d)});
	Imba.defineTag('caption',function caption(d){this.setDom(d)});
	Imba.defineTag('cite',function cite(d){this.setDom(d)});
	Imba.defineTag('code',function code(d){this.setDom(d)});
	Imba.defineTag('col',function col(d){this.setDom(d)});
	Imba.defineTag('colgroup',function colgroup(d){this.setDom(d)});
	Imba.defineTag('data',function data(d){this.setDom(d)});
	Imba.defineTag('datalist',function datalist(d){this.setDom(d)});
	Imba.defineTag('dd',function dd(d){this.setDom(d)});
	Imba.defineTag('del',function del(d){this.setDom(d)});
	Imba.defineTag('details',function details(d){this.setDom(d)});
	Imba.defineTag('dfn',function dfn(d){this.setDom(d)});
	Imba.defineTag('div',function div(d){this.setDom(d)});
	Imba.defineTag('dl',function dl(d){this.setDom(d)});
	Imba.defineTag('dt',function dt(d){this.setDom(d)});
	Imba.defineTag('em',function em(d){this.setDom(d)});
	Imba.defineTag('embed',function embed(d){this.setDom(d)});
	Imba.defineTag('fieldset',function fieldset(d){this.setDom(d)});
	Imba.defineTag('figcaption',function figcaption(d){this.setDom(d)});
	Imba.defineTag('figure',function figure(d){this.setDom(d)});
	Imba.defineTag('footer',function footer(d){this.setDom(d)});
	
	(function(){
		var tag = Imba.defineTag('form',function form(d){this.setDom(d)});
		
		tag.prototype.__method = {dom: true};
		tag.prototype.method = function(v){ return this.getAttribute('method'); }
		tag.prototype.setMethod = function(v){ this.setAttribute('method',v); return this; };
		
		tag.prototype.__action = {dom: true};
		tag.prototype.action = function(v){ return this.getAttribute('action'); }
		tag.prototype.setAction = function(v){ this.setAttribute('action',v); return this; };
	
	})();
	
	Imba.defineTag('h1',function h1(d){this.setDom(d)});
	Imba.defineTag('h2',function h2(d){this.setDom(d)});
	Imba.defineTag('h3',function h3(d){this.setDom(d)});
	Imba.defineTag('h4',function h4(d){this.setDom(d)});
	Imba.defineTag('h5',function h5(d){this.setDom(d)});
	Imba.defineTag('h6',function h6(d){this.setDom(d)});
	Imba.defineTag('head',function head(d){this.setDom(d)});
	Imba.defineTag('header',function header(d){this.setDom(d)});
	Imba.defineTag('hr',function hr(d){this.setDom(d)});
	Imba.defineTag('html',function html(d){this.setDom(d)});
	Imba.defineTag('i',function i(d){this.setDom(d)});
	Imba.defineTag('iframe',function iframe(d){this.setDom(d)});
	
	(function(){
		var tag = Imba.defineTag('img',function img(d){this.setDom(d)});
		
		tag.prototype.__src = {dom: true};
		tag.prototype.src = function(v){ return this.getAttribute('src'); }
		tag.prototype.setSrc = function(v){ this.setAttribute('src',v); return this; };
	
	})();
	
	(function(){
		var tag = Imba.defineTag('input',function input(d){this.setDom(d)});
		
		tag.prototype.__name = {dom: true};
		tag.prototype.name = function(v){ return this.getAttribute('name'); }
		tag.prototype.setName = function(v){ this.setAttribute('name',v); return this; };
		
		tag.prototype.__type = {dom: true};
		tag.prototype.type = function(v){ return this.getAttribute('type'); }
		tag.prototype.setType = function(v){ this.setAttribute('type',v); return this; };
		
		tag.prototype.__value = {dom: true};
		tag.prototype.value = function(v){ return this.getAttribute('value'); }
		tag.prototype.setValue = function(v){ this.setAttribute('value',v); return this; }; // dom property - NOT attribute -- hmm
		
		tag.prototype.__required = {dom: true};
		tag.prototype.required = function(v){ return this.getAttribute('required'); }
		tag.prototype.setRequired = function(v){ this.setAttribute('required',v); return this; };
		
		tag.prototype.__disabled = {dom: true};
		tag.prototype.disabled = function(v){ return this.getAttribute('disabled'); }
		tag.prototype.setDisabled = function(v){ this.setAttribute('disabled',v); return this; };
		
		tag.prototype.__placeholder = {dom: true};
		tag.prototype.placeholder = function(v){ return this.getAttribute('placeholder'); }
		tag.prototype.setPlaceholder = function(v){ this.setAttribute('placeholder',v); return this; };
		
		tag.prototype.value = function (){
			return this.dom().value;
		};
		
		tag.prototype.setValue = function (v){
			this.dom().value = v;
			return this;
		};
	
	})();
	
	Imba.defineTag('ins',function ins(d){this.setDom(d)});
	Imba.defineTag('kbd',function kbd(d){this.setDom(d)});
	Imba.defineTag('keygen',function keygen(d){this.setDom(d)});
	Imba.defineTag('label',function label(d){this.setDom(d)});
	Imba.defineTag('legend',function legend(d){this.setDom(d)});
	Imba.defineTag('li',function li(d){this.setDom(d)});
	
	(function(){
		var tag = Imba.defineTag('link',function link(d){this.setDom(d)});
		
		tag.prototype.__rel = {dom: true};
		tag.prototype.rel = function(v){ return this.getAttribute('rel'); }
		tag.prototype.setRel = function(v){ this.setAttribute('rel',v); return this; };
		
		tag.prototype.__type = {dom: true};
		tag.prototype.type = function(v){ return this.getAttribute('type'); }
		tag.prototype.setType = function(v){ this.setAttribute('type',v); return this; };
		
		tag.prototype.__href = {dom: true};
		tag.prototype.href = function(v){ return this.getAttribute('href'); }
		tag.prototype.setHref = function(v){ this.setAttribute('href',v); return this; };
		
		tag.prototype.__media = {dom: true};
		tag.prototype.media = function(v){ return this.getAttribute('media'); }
		tag.prototype.setMedia = function(v){ this.setAttribute('media',v); return this; };
	
	})();
	
	Imba.defineTag('main',function main(d){this.setDom(d)});
	Imba.defineTag('map',function map(d){this.setDom(d)});
	Imba.defineTag('mark',function mark(d){this.setDom(d)});
	Imba.defineTag('menu',function menu(d){this.setDom(d)});
	Imba.defineTag('menuitem',function menuitem(d){this.setDom(d)});
	
	(function(){
		var tag = Imba.defineTag('meta',function meta(d){this.setDom(d)});
		
		tag.prototype.__name = {dom: true};
		tag.prototype.name = function(v){ return this.getAttribute('name'); }
		tag.prototype.setName = function(v){ this.setAttribute('name',v); return this; };
		
		tag.prototype.__content = {dom: true};
		tag.prototype.content = function(v){ return this.getAttribute('content'); }
		tag.prototype.setContent = function(v){ this.setAttribute('content',v); return this; };
		
		tag.prototype.__charset = {dom: true};
		tag.prototype.charset = function(v){ return this.getAttribute('charset'); }
		tag.prototype.setCharset = function(v){ this.setAttribute('charset',v); return this; };
	
	})();
	
	Imba.defineTag('meter',function meter(d){this.setDom(d)});
	Imba.defineTag('nav',function nav(d){this.setDom(d)});
	Imba.defineTag('noscript',function noscript(d){this.setDom(d)});
	Imba.defineTag('object',function object(d){this.setDom(d)});
	Imba.defineTag('ol',function ol(d){this.setDom(d)});
	Imba.defineTag('optgroup',function optgroup(d){this.setDom(d)});
	
	(function(){
		var tag = Imba.defineTag('option',function option(d){this.setDom(d)});
		
		tag.prototype.__value = {dom: true};
		tag.prototype.value = function(v){ return this.getAttribute('value'); }
		tag.prototype.setValue = function(v){ this.setAttribute('value',v); return this; };
	
	})();
	
	Imba.defineTag('output',function output(d){this.setDom(d)});
	Imba.defineTag('p',function p(d){this.setDom(d)});
	Imba.defineTag('param',function param(d){this.setDom(d)});
	Imba.defineTag('pre',function pre(d){this.setDom(d)});
	Imba.defineTag('progress',function progress(d){this.setDom(d)});
	Imba.defineTag('q',function q(d){this.setDom(d)});
	Imba.defineTag('rp',function rp(d){this.setDom(d)});
	Imba.defineTag('rt',function rt(d){this.setDom(d)});
	Imba.defineTag('ruby',function ruby(d){this.setDom(d)});
	Imba.defineTag('s',function s(d){this.setDom(d)});
	Imba.defineTag('samp',function samp(d){this.setDom(d)});
	
	(function(){
		var tag = Imba.defineTag('script',function script(d){this.setDom(d)});
		
		tag.prototype.__src = {dom: true};
		tag.prototype.src = function(v){ return this.getAttribute('src'); }
		tag.prototype.setSrc = function(v){ this.setAttribute('src',v); return this; };
		
		tag.prototype.__type = {dom: true};
		tag.prototype.type = function(v){ return this.getAttribute('type'); }
		tag.prototype.setType = function(v){ this.setAttribute('type',v); return this; };
	
	})();
	
	Imba.defineTag('section',function section(d){this.setDom(d)});
	
	(function(){
		var tag = Imba.defineTag('select',function select(d){this.setDom(d)});
		
		tag.prototype.__multiple = {dom: true};
		tag.prototype.multiple = function(v){ return this.getAttribute('multiple'); }
		tag.prototype.setMultiple = function(v){ this.setAttribute('multiple',v); return this; };
		
		tag.prototype.value = function (){
			return this.dom().value;
		};
		
		tag.prototype.setValue = function (v){
			this.dom().value = v;
			return this;
		};
	
	})();
	
	
	Imba.defineTag('small',function small(d){this.setDom(d)});
	Imba.defineTag('source',function source(d){this.setDom(d)});
	Imba.defineTag('span',function span(d){this.setDom(d)});
	Imba.defineTag('strong',function strong(d){this.setDom(d)});
	Imba.defineTag('style',function style(d){this.setDom(d)});
	Imba.defineTag('sub',function sub(d){this.setDom(d)});
	Imba.defineTag('summary',function summary(d){this.setDom(d)});
	Imba.defineTag('sup',function sup(d){this.setDom(d)});
	Imba.defineTag('table',function table(d){this.setDom(d)});
	Imba.defineTag('tbody',function tbody(d){this.setDom(d)});
	Imba.defineTag('td',function td(d){this.setDom(d)});
	
	(function(){
		var tag = Imba.defineTag('textarea',function textarea(d){this.setDom(d)});
		
		tag.prototype.__name = {dom: true};
		tag.prototype.name = function(v){ return this.getAttribute('name'); }
		tag.prototype.setName = function(v){ this.setAttribute('name',v); return this; };
		
		tag.prototype.__disabled = {dom: true};
		tag.prototype.disabled = function(v){ return this.getAttribute('disabled'); }
		tag.prototype.setDisabled = function(v){ this.setAttribute('disabled',v); return this; };
		
		tag.prototype.__required = {dom: true};
		tag.prototype.required = function(v){ return this.getAttribute('required'); }
		tag.prototype.setRequired = function(v){ this.setAttribute('required',v); return this; };
		
		tag.prototype.__placeholder = {dom: true};
		tag.prototype.placeholder = function(v){ return this.getAttribute('placeholder'); }
		tag.prototype.setPlaceholder = function(v){ this.setAttribute('placeholder',v); return this; };
		
		tag.prototype.__value = {dom: true};
		tag.prototype.value = function(v){ return this.getAttribute('value'); }
		tag.prototype.setValue = function(v){ this.setAttribute('value',v); return this; };
		
		tag.prototype.__rows = {dom: true};
		tag.prototype.rows = function(v){ return this.getAttribute('rows'); }
		tag.prototype.setRows = function(v){ this.setAttribute('rows',v); return this; };
		
		tag.prototype.__cols = {dom: true};
		tag.prototype.cols = function(v){ return this.getAttribute('cols'); }
		tag.prototype.setCols = function(v){ this.setAttribute('cols',v); return this; };
		
		tag.prototype.value = function (){
			return this.dom().value;
		};
		
		tag.prototype.setValue = function (v){
			this.dom().value = v;
			return this;
		};
	
	})();
	
	Imba.defineTag('tfoot',function tfoot(d){this.setDom(d)});
	Imba.defineTag('th',function th(d){this.setDom(d)});
	Imba.defineTag('thead',function thead(d){this.setDom(d)});
	Imba.defineTag('time',function time(d){this.setDom(d)});
	Imba.defineTag('title',function title(d){this.setDom(d)});
	Imba.defineTag('tr',function tr(d){this.setDom(d)});
	Imba.defineTag('track',function track(d){this.setDom(d)});
	Imba.defineTag('u',function u(d){this.setDom(d)});
	Imba.defineTag('ul',function ul(d){this.setDom(d)});
	Imba.defineTag('video',function video(d){this.setDom(d)});
	Imba.defineTag('wbr',function wbr(d){this.setDom(d)});


}())
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],5:[function(require,module,exports){
(function(){


	function flatten(input,out){
		if(out === undefined) out = [];
		var idx = 0;
		var len = input.length;
		
		while (idx < len){
			var el = input[idx++];
			Array.isArray(el) ? (flatten(el,out)) : (out.push(el));
		};
		return out;
	};
	
	// for (var i=0; i<input.length; ++i) {
	//     var current = input[i];
	//     for (var j=0; j<current.length; ++j)
	//         flattened.push(current[j]);
	// }
	
	
	
		
		// def remove a
		// 	# console.log 'removing element !! ',a
		// 	dom.removeChild(a.dom) if a
		// 	self
		
		IMBA_TAGS.htmlelement.prototype.setChildren = function (nodes){
			var prev = this._children;
			
			if ((typeof nodes=='string'||nodes instanceof String) || (typeof nodes=='number'||nodes instanceof Number)) {
				this.setText(nodes);
				return this;
			};
			
			// console.log 'set content!',nodes
			if (prev != null) {
				// fast handling of all the cases where we only have a single inner node
				// later we will use this to optimize static templates
				if (nodes == prev) { return this };
				
				var aa = (prev instanceof Array);
				var ba = (nodes instanceof Array);
				
				if (ba) {
					nodes = flatten(nodes);
				};
				
				if (!aa && !ba) {
					// console.log "just set the content directly",prev,nodes
					IMBA_TAGS.htmlelement.__super__.setChildren.apply(this,arguments); // just replace the element
				} else if (aa && ba) {
					// need to loop through array
					var al = prev.length;
					var bl = nodes.length;
					
					var l = Math.max(al,bl);
					var i = 0;
					
					// need to find a much faster algorithm to discover
					// the actual changes in the array - and only change this
					// what about flattening arrays? we must do that right
					
					while (i < l){
						var a = prev[i];
						var b = nodes[i];
						
						// the index of old element in the new nodelist
						var abi = a ? (nodes.indexOf(a)) : (-1);
						
						// like before -- do nothing
						// if a == b
						//	i++
						//	continue
						
						if (b && b != a) {
							this.append(b);
							
							// should not remove if another has just been added
							// only if it does not exist in b
							if (a && abi == -1) { this.remove(a) };
						} else if (a && a != b) {
							if (abi == -1) { this.remove(a) };
							true;
						};
						i++;
					};
				} else {
					// should throw error, no?
					console.log("was array - is single -- confused=!!!!");
					this.empty();
					IMBA_TAGS.htmlelement.__super__.setChildren.apply(this,arguments);
				};
			} else {
				if (nodes instanceof Array) {
					nodes = flatten(nodes);
				};
				
				// need to empty the element first
				// @dom:innerHTML = nil # hmmmm
				this.empty();
				IMBA_TAGS.htmlelement.__super__.setChildren.apply(this,arguments);
			};
			
			this._children = nodes; // update the cached children?
			return this;
		};
		
		IMBA_TAGS.htmlelement.prototype.content = function (){
			return this._content || this.children().toArray();
		};
		
		IMBA_TAGS.htmlelement.prototype.setText = function (text){
			if (text != this._children) {
				this.dom().textContent = this._children = text; // hmmmm
			};
			return this;
		};
	


}())
},{}],6:[function(require,module,exports){
(function(){


	Imba = {};


}())
},{}],7:[function(require,module,exports){
(function (global){
(function(){


	function iter$(a){ return a ? (a.toArray ? a.toArray() : a) : []; };
	/* @class ImbaSelector */
	function ImbaSelector(sel,scope,nodes){
		this._query = (sel instanceof ImbaSelector) ? (sel.query()) : (sel);
		this._context = scope;
		
		if(nodes) {
			for(var i=0, ary=iter$(nodes), len=ary.length, res=[]; i < len; i++) {
				res.push(tag$wrap(ary[i]));
			};this._nodes = res;
		};
		
		this._lazy = !nodes;
		return this;
	};
	
	global.ImbaSelector = ImbaSelector; // global class 
	
	ImbaSelector.prototype.__query = {};
	ImbaSelector.prototype.query = function(v){ return this._query; }
	ImbaSelector.prototype.setQuery = function(v){ this._query = v; return this; };
	
	
	
	ImbaSelector.prototype.reload = function (){
		this._nodes = null;
		return this;
	};
	
	ImbaSelector.prototype.scope = function (){
		var ctx;
		if(this._scope) {
			return this._scope;
		};
		if(!(ctx = this._context)) {
			return global.document;
		};
		return this._scope = (ctx.toScope) ? (ctx.toScope()) : (ctx);
	};
	
	ImbaSelector.prototype.first = function (){
		return (this._lazy) ? (
			tag$wrap(this._first || (this._first = this.scope().querySelector(this.query())))
		) : (
			this.nodes()[0]
		);
	};
	
	ImbaSelector.prototype.last = function (){
		return this.nodes()[this._nodes.length - 1];
	};
	
	ImbaSelector.prototype.nodes = function (){
		if(this._nodes) {
			return this._nodes;
		};
		var items = this.scope().querySelectorAll(this.query());
		for(var i=0, ary=iter$(items), len=ary.length, res=[]; i < len; i++) {
			res.push(tag$wrap(ary[i]));
		};this._nodes = res;
		this._lazy = false;
		return this._nodes;
	};
	
	ImbaSelector.prototype.count = function (){
		return this.nodes().length;
	};
	ImbaSelector.prototype.len = function (){
		return this.nodes().length;
	};
	ImbaSelector.prototype.any = function (){
		return this.count();
	};
	
	ImbaSelector.prototype.at = function (idx){
		return this.nodes()[idx];
	};
	
	ImbaSelector.prototype.forEach = function (block){
		this.nodes().forEach(block);
		return this;
	};
	
	ImbaSelector.prototype.map = function (block){
		return this.nodes().map(block);
	};
	
	ImbaSelector.prototype.toArray = function (){
		return this.nodes();
	};
	
	// Get the first element that matches the selector, 
	// beginning at the current element and progressing up through the DOM tree
	ImbaSelector.prototype.closest = function (sel){
		this._nodes = this.map(function (node){
			return node.closest(sel);
		});
		return this;
	};
	
	// Get the siblings of each element in the set of matched elements, 
	// optionally filtered by a selector.
	// TODO remove duplicates?
	ImbaSelector.prototype.siblings = function (sel){
		this._nodes = this.map(function (node){
			return node.siblings(sel);
		});
		return this;
	};
	
	// Get the descendants of each element in the current set of matched 
	// elements, filtered by a selector.
	ImbaSelector.prototype.find = function (sel){
		this._nodes = this.__query__(sel.query(),this.nodes());
		return this;
	};
	
	// TODO IMPLEMENT
	// Get the children of each element in the set of matched elements, 
	// optionally filtered by a selector.
	ImbaSelector.prototype.children = function (sel){
		return true;
	};
	
	// TODO IMPLEMENT
	// Reduce the set of matched elements to those that have a descendant that
	// matches the selector or DOM element.
	ImbaSelector.prototype.has = function (){
		return true;
	};
	
	// TODO IMPLEMENT
	ImbaSelector.prototype.__union = function (){
		this.p("called ImbaSelector.__union");
		return this;
	};
	
	// TODO IMPLEMENT
	ImbaSelector.prototype.__intersect = function (){
		this.p("called ImbaSelector.__union");
		return this;
	};
	
	ImbaSelector.prototype.reject = function (blk){
		return this.filter(blk,false);
	};
	
	ImbaSelector.prototype.filter = function (blk,bool){
		if(bool === undefined) bool = true;
		var fn = (blk instanceof Function) && blk || (function (n){
			return n.matches(blk);
		});
		var ary = this.nodes().filter(function (n){
			return fn(n) == bool;
		});// hmm -- not sure about this?
		// if we want to return a new selector for this, we should do that for
		// others as well
		return new ImbaSelector("",this._scope,ary);
	};
	
	// hmm - what is this even for?
	ImbaSelector.prototype.__query__ = function (query,contexts){
		var nodes = [];
		var i = 0;
		var l = contexts.length;
		
		while(i < l){
			nodes.push.apply(nodes,contexts[i++].querySelectorAll(query));
		};
		return nodes;
	};
	
	ImbaSelector.prototype.__matches__ = function (){
		return true;
	};
	
	// Proxies
	ImbaSelector.prototype.flag = function (flag){
		return this.forEach(function (n){
			return n.flag(flag);
		});
	};
	
	ImbaSelector.prototype.unflag = function (flag){
		return this.forEach(function (n){
			return n.unflag(flag);
		});
	};
	
	ImbaSelector.prototype.call = function (meth,args){
		var self=this;
		if(args === undefined) args = [];
		return self.forEach(function (n){
			var $1;
			return ((self.setFn(n[($1=meth)]),n[$1])) && (self.fn().apply(n,args));
		});
	};
	
	
	// hmm
	q$ = function (sel,scope){
		return new ImbaSelector(sel,scope);
	};
	
	q$$ = function (sel,scope){
		var el = (scope || global.document).querySelector(sel);
		return el && tag$wrap(el) || null;
	};
	
	// extending tags with query-methods
	// must be a better way to reopen classes
	
		IMBA_TAGS.element.prototype.querySelectorAll = function (q){
			return this._dom.querySelectorAll(q);
		};
		IMBA_TAGS.element.prototype.querySelector = function (q){
			return this._dom.querySelector(q);
		};
		IMBA_TAGS.element.prototype.find = function (sel){
			return new ImbaSelector(sel,this);
		};
	


}())
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1])(1)
});