Visit [imba.io](http://imba.io) for more information!

# Imba
*if ruby and react had an indentation-based child, what would it look like?*
Imba is a new programming language for the web that compiles to performant
and readable JavaScript.

## Why
Imba started out several years ago as a fork of CoffeeScript, with a plan to add native syntax for creating, traversing, and manipulating DOM tags. After having used CoffeeScript for a long time, I found myself avoiding all the syntactic sugar that made CS nice, because I knew how cluttered the compiled code was. Imba tries to take all the good stuff from CoffeeScript, with the conciseness of Ruby, and tags as a native part of the language (like jsx).

## Principles
- Ultra-readable compiled js (keeping comments, indentation, style).
  Making the technological investment minimal - as it is easy to move on with js codebase at any time.
- Everything is an expression, including cases missing from CoffeeScript ( returning from loops, break/continue with arguments etc) without wrapping everything in anonymous functions all over the place. 
- Implement syntactic sugar like in CS, but with clean and performant code.

## Installation
Get [Node.js](http://nodejs.org) and [npm](http://npmjs.org), then:

- `npm install -g imba`

## Usage
After installing you can call `imba --help` to see our options.
For information about the commands you call `imba compile --help`, `imba watch --help`, etc.


## Plugins
We currently recommend Sublime Text 3 for Imba, since this is the only editor with a plugin so far. The [sublime-plugin](http://github.com/somebee/sublime-imba) can be installed through Sublime Package Manager.

## Contribute
Contributors are always welcome. To start with, you should clone the repository and try to get somewhat familiar with the codebase. Please shoot me a message on github if you have any comments or questions, and I will try to get back to you asap.

## Quirks
Even though Imba has been used in production on several large commercial applications for 2+ years, it is still quite rough around the egdes. Some of the more esoteric language features still have some quirks, and don't be surprised if you run into some of them. When you do, please file an issue so that we can fix and improve it asap.

## Roadmap
- Clarify and fix implicit self at root level
- Support for svg and arbitrarily namespaced tags
- full await / defer support even in complex nested codeblocks
- sourcemaps. All tokens are already tagged with locations, so it should be relatively trivial.