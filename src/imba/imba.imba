extern window, global

if typeof window !== 'undefined'
	global = window

Imba = {
	VERSION: '0.13.8'
}

var reg = /-./g


def Imba.subclass obj, sup
	for k,v of sup
		obj[k] = v if sup.hasOwnProperty(k)

	obj:prototype = Object.create(sup:prototype)
	obj:__super__ = obj:prototype:__super__ = sup:prototype
	obj:prototype:initialize = obj:prototype:constructor = obj
	return obj

def Imba.iterable o
	return o ? (o:toArray ? o.toArray : o) : []

def Imba.await o
	if a isa Array
		Promise.all(a)
	elif a and a:then
		a
	else
		Promise.resolve(a)

def Imba.toCamelCase str
	str.replace(reg) do |m| m.charAt(1).toUpperCase

def Imba.indexOf a,b
	return (b && b:indexOf) ? b.indexOf(a) : []:indexOf.call(a,b)

# trackable timeout
def Imba.setTimeout delay, &block
	setTimeout(&,delay) do
		block()
		Imba.emit(Imba,'timeout',[block])

# trackable interval
def Imba.setInterval interval, &block
	setInterval(&,interval) do
		block()
		Imba.emit(Imba,'interval',[block])

def Imba.clearInterval interval
	clearInterval(interval)

def Imba.clearTimeout timeout
	clearTimeout(timeout)