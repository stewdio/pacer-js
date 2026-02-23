//  Copyright ©️ 2025–2026 Stewart Smith. See LICENSE for details.






///////     //     //////   ///////  ///////
//    //   ////   //    //  //       //    //
//    //  //  //  //        //////   //    //
///////  ///////  //    //  //       ///////
//      //     //  //////   ///////  //   //
//                                   //    //
//                                          //






import {

	isUsefulNumber,
	isNotUsefulNumber,
	isUsefulString,
	normalize,
	normalize01,
	lerp

} from 'snacks-js'




class Key {
	
	constructor( timeAbsolute, values, callback ){

		this.timeAbsolute = timeAbsolute
		this.values = values instanceof Object ? values : {}
		this.onKey  = callback
		this.tween  = Pacer.linear//  Default tween method is linear interpolation.
		this.label  = ''
		this.guarantee = true
	}
}




class Pacer {
	
	constructor( label, units ){
		
		this._label = isUsefulString( label ) ? label : 'Untitled Pacer instance'

		
		//  This is purely to help humans reason around their Pacers.
		//  No particular value is required. 
		//  All that matters is that YOU, the human, are consisent with your units.
		//  If you want to make use of this property, some suggested values:
		//  ms, milliseconds, s, seconds, #, n, norm, normalize, normalized, %, percent

		this._units = isUsefulString( units ) ? units : 'ms'

		this.keys = []
		this.keyIndex = -1
		this.lastCreatedKey = null
		
		this.values = {}
		this.n = 0
		this.direction = 1
		this.isClamped = true
		
		this.isEnabled = true
		this.instanceIndex = Pacer.all.length
		Pacer.all.push( this )
	}
	
	




	    ////////////////////////
	   //                    //
	  //   Non-chainables   //
	 //                    //
	////////////////////////


	//  ie. They do not return `this` (your Pacer instance).

	inspect( useRelative ){

		const scope = this
		let out = ''
		out += '\n'+ this._label
		out += '\n'+ new Array( this._label.length ).fill( '─' ).join( '' )
		out += this.keys
		.reduce( function( output, key ){

			output += '\n'
			output += useRelative === true && isUsefulNumber( key.timeRelative )
				? ' +'+ key.timeRelative 
				: '  '+ key.timeAbsolute
			output += scope._units +'  '
			if( isUsefulString( key.label )) output += key.label +'  ' 
			output += JSON.stringify( key.values )
			return output

		}, '' )


		//  Should add things like timeCursor, total n, etc.

		return out +'\n\n'
	}
	getFirstKey(){

		return this.keys[ 0 ]
	}
	getLastKey(){

		return this.keys[ this.keys.length - 1 ]
	}
	getCurrentKey(){

		return this.keys[ this.keyIndex ]
	}
	tweenKeys( keyA, keyB, now, direction ){

		if( isNotUsefulNumber( direction )) direction = 1
		let tween = keyA.tween

		
		//  This logic is unnecessary,
		//  but leaving it here for future reference.

		// const tweenLabel = keyA.tween.label
		// if( direction < 0 && tweenLabel !== 'linear' ){
			
		// 	let tweenStyle = keyA.tween.style			
		// 	if( tweenStyle === 'in' ) tweenStyle = 'out'
		// 	else if( tweenStyle === 'out' ) tweenStyle = 'in'
		// 	console.log( tweenLabel, tweenStyle )
		// 	tween = Pacer[ tweenLabel ][ tweenStyle ]
		// }

		const 
		method = this.isClamped ? normalize01 : normalize,
		n = method(

			keyA.timeAbsolute,
			keyB.timeAbsolute,
			now
		),
		a = Object.keys( keyA.values ),
		b = Object.keys( keyB.values ),
		c = a.reduce( function( output, key ){

			const a = keyA.values[ key ]
			if( isNotUsefulNumber( a )) return output
			const b = keyB.values[ key ]	
			if( isNotUsefulNumber( b )) return output
			output[ key ] = lerp( a, b, tween( n ))
			return output
		
		}, {})

		
		//  Make current values easily available on the instance.
		
		this.values = c
		return n
	}






	    ////////////////////
	   //                //
	  //   Chainables   //
	 //                //
	////////////////////


	//  ie. They all return `this` (your Pacer instance),
	//  so you can pipe from one method to another, to another… 

	setTimeBounds(){

		this.timeStart = this.getFirstKey().timeAbsolute
		this.timeStop  = this.getLastKey().timeAbsolute
		this.duration  = this.timeStop - this.timeStart
		return this
	}
	sortKeys(){

		this.keys
		.sort( function( a, b ){

			return a.timeAbsolute - b.timeAbsolute
		})
		.forEach( function( key, i, keys ){


			//  Yes, we have to operate directly on the `keys` Array
			//  rather than a `key` element reference
			//  if we want to actually write this property.
			//  Otherwise it silently fails. Lovely. 
			//  And we don’t want to use Array.map 
			//  in case we ever need a DEEP copy of an element’s properties.

			keys[ i ].index = i


			//  You know what?
			//  Let’s also keep track of _relative_ time
			//  so it’s as easy as pie 
			//  to shift key times without more overhead. 

			keys[ i ].timeRelative = i === 0 
				? 0 
				: key.timeAbsolute - keys[ i - 1 ].timeAbsolute

			
			//  Also, here’s a nicety:
			//  if there’s a key with no values,
			//  let’s just copy the values from the previous key.
			// (I have some further ideas about this… Stay tuned!)

			if( key.values instanceof Object !== true &&
				typeof keys[ i - 1 ] !== 'undefined' &&
				keys[ i - 1 ].values instanceof Object === true ){

				keys[ i ].values = keys[ i - 1 ].values


				//  There’s an argument to be made for this instead of the above:
				//  keys[ i ].values = Object.assign( {}, keys[ i - 1 ].values )
				//  Remove ability for original object owner to mutate values? Thoughts? 
			}
		})
		this.setTimeBounds()
		return this
	}


	//  CHAINABLE “Key-based” methods,
	//  ie. creates or relies on `this.lastCreatedKey`.

	key( time, values, callback, isAbsolute ){

		if( isAbsolute !== true &&//  Making a theoretical `isRelative` the default for backwards compatibility.
			this.keys.length > 0 ){
			
			// time += this.getLastKey().timeAbsolute
			time += this.lastCreatedKey.timeAbsolute//  IT’S TRICKY TO ROCK A RHYME !
		}
		if( this.keys.length === 0 ) this.values = values
		const key = new Key( time, values, callback )
		this.lastCreatedKey = key
		this.keys.push( key )
		this.sortKeys()
		if( this.keys.length === 1 ) this.timeCursor = this.timeStart - 1
		return this
	}
	rel( timeRelative, values, callback ){

		return this.key( timeRelative, values, callback, false )
	}
	abs( timeAbsolute, values, callback ){

		return this.key( timeAbsolute, values, callback, true )
	}
	label( s ){

		this.lastCreatedKey.label = s
		return this
	}
	//  Well this was stupid…
	//  Need to meditate on best approach for avoiding name collisions between
	//  1. Regular old instance object properties,
	//  2. Setters on this Pacer instance,
	//  3. Setters actually intended for a Key instance.
	//  Particularly acute when it comes to .label(), for example.
	// (I don’t love `label` vs `labelPacer`, but will do for now.)
	// values( v ){

	// 	this.lastCreatedKey.values = v
	// 	return this
	// }
	onKey( fn ){

		this.lastCreatedKey.onKey = fn
		return this
	}
	tween( fn ){

		this.lastCreatedKey.tween = fn
		return this
	}
	onTween( fn ){

		this.lastCreatedKey.onTween = fn
		return this
	}
	onCancel( fn ){

		this.lastCreatedKey.onCancel = fn
		return this
	}


	//  CHAINABLE “instance-wide” callback setters,
	//  ie. These do _not_ rely on `this.lastCreatedKey`
	//  and set callbacks for the instance to use.

	onEveryKey( fn ){

		this._onEveryKey = fn
		return this
	}
	onEveryTween( fn ){

		this._onEveryTween = fn
		return this
	}
	onBeforeAll( fn ){

		this._onBefore = fn
		return this
	}
	onAfterAll( fn ){

		this._onAfter = fn
		return this
	}


	//  CHAINABLE “instance-wide” commands,
	//  ie. These do _not_ rely on `this.lastCreatedKey`
	//  and issue simple property setters.

	labelPacer( s ){//  This naming gives me pause.

		this._label = s
		return this
	}
	units( u ){

		this._units = u
		return this
	}
	clamp(){

		this.isClamped = true
		return this
	}
	unclamp(){

		this.isClamped = false
		return this
	}


	//  A quick way to turn individual instances on/off,
	//  particuarly convenient if doing bulk updates
	//  like `Pacer.update()` ← Note that’s the Class method itself,
	//  not an instance method.

	enable(){

		this.isEnabled = true
		return this
	}
	disable(){

		this.isEnabled = false
		return this
	}


	//  All those moments will be lost in time, 
	//  like tears in rain. 
	//  Time to die.

	remove(){
		
		Pacer.remove( this )
		return this
	}




	    ////////////////
	   //            //
	  //   Update   //
	 //            //
	////////////////

	
	//  Yeah. This one method deserves its own rhombus comment block, 
	//  because if it were a pickle it would wear a shirt that says
	// “I’m a big dill.” Pho real.
	//  See also `onKey` and `onTween` below.

	update( now ){


		//  We only need to update
		//  if our instance is enabled
		//  and we have at least one keyframe:
		//    that might have either a values{} object, 
		//    an onKey() callback,
		//    or would be included if there’s an onEveryKey() callback.

		if( this.isEnabled !== true ) return this
		if( this.keys.length < 1 ) return this


		//  What time is it?
		//  Remember that “time” is just a numeric value…
		//  You’ll likely use it for time, sure,
		//  but you could also follow Scroll Pacer’s example
		//  and instead send pixel values 
		//  describing an element’s relationship to the viewport.

		if( isNotUsefulNumber( now )) now = Date.now()


		//  The following is unlikely to be true for standalone animations, 
		//  but very likely for scroll animations.

		if( now === this.timeCursor ) return this


		//  If we made it to here, I guess we’re actually doing this.
		//  So what direction is our time flowing?

		const direction = now < this.timeCursor ? -1 : 1

		
		//  What’s our total N gain for the this entire instance?

		const method = this.isClamped ? normalize01 : normalize
		this.n = method( this.timeStart, this.timeStop, now )


		//  We know our keys are already sorted by time,
		//  and we’ve previously set the convenience variables
		// `timeStart` and `timeStop`.
		// (This sorting happens automagically with every key creation.)
		
		//  Note 1: Direction has no effect on the order of
		//  keyA and keyB, because we always want this to be true:
		//  keyA.timeAbsolute < keyB.timeAbsolute.
		//  And we always use the tween attached to keyA!
		
		//  Note 2: For this step, it is perfectly reasonable
		//  for keyA or keyB to be undefined. 
		//  That is a signal itself, not a lack of signal.

		let 
		targetIndex = 0,
		keyA,
		keyB

		if( now < this.timeStart ){
				
			targetIndex = -1//  Intentionally out of range.
			keyA = this.keys[ 0 ]
			keyB = this.keys[ 1 ]
		}
		else if( now >= this.timeStop ){
				
			targetIndex = this.keys.length//  Intentionally out of range.
			keyA = this.keys[ this.keys.length - 2 ]
			keyB = this.keys[ this.keys.length - 1 ]
		}
		else {


			//  Price-is-Right rules:
			//  CLOSEST WITHOUT GOING OVER.
			//  If our direction is +1, we want the LATEST keyframe 
			//      where `now` is still >= keyframe.timeAbsolute.
			//  If our direction is -1, we want the EARLIEST keyframe 
			//      where `now` is still <= keyframe.timeAbsolute. 
			//  That index gives us KeyA, 
			//  and keys[ index + direction ] give us keyB.

			let i = Math.min( Math.max( 0, this.keyIndex ), this.keys.length - 1 )
			keyA = this.keys[ i ]
			keyB = this.keys[ i + 1 ]
			if( direction > 0 ){
				
				while( 
					keyB instanceof Key &&
					keyB.timeAbsolute < now ){

					i ++
					keyA = this.keys[ i ]
					keyB = this.keys[ i + 1 ]
				}
			}
			else if( direction < 0 ){
				
				while( 
					keyA instanceof Key &&
					keyA.timeAbsolute > now ){

					i --
					keyA = this.keys[ i ]
					keyB = this.keys[ i + 1 ]
				}
			}
			targetIndex = i
		}


		//  Let’s prep for any onKey callbacks;
		//  You never know what someone’s callbacks
		//  are going to ask for on this instance
		//  so it’s best to be kind and sharing.

		const keyIndexPrior = this.keyIndex
		this.direction = direction




		    ///////////////
		   //           //
		  //   onKey   //
		 //           //
		///////////////


		//  Ok. Perhaps you were wondering 
		//  why we hold onto a targetIndex value at all.
		//  We already have keyA and keyB -- just tween, right?
		//  Well... We’re in the business of 
		//  GUARANTEEING keyframe onKey callbacks.
		//  That means, unless told otherwise, we need to hit 
		//  each of those key frames and onKey() callbacks
		//  between wherever we were previously, and now.

		//  I had originally combined the following logic into one block,
		//  but debugging the subtleties became a true ass pain,
		//  so for clarity I separated them back out based on direction.

		if( direction > 0 ){

			for( let i = keyIndexPrior + 1; i <= targetIndex; i ++ ){


				//  Yes, we do expect (and are accounting for!) 
				//  a moment where i > this.keys.length - 1
				//  and therefore tempKey === undefined. 
				//  This is expected behavior!
				//  You are going to be ok. Okay. O.K. OK.

				const tempKey = this.keys[ i ]
				this.keyIndex = i
				if( tempKey instanceof Key &&
					tempKey.guarantee === true ){

					if( typeof tempKey.onKey === 'function' ){

						tempKey.onKey( tempKey.values, this )
					}
					if( typeof this._onEveryKey === 'function' ){

						this._onEveryKey( tempKey.values, this )
					}
				}
			}
		}
		else if( direction < 0 ){

			for( let i = keyIndexPrior; i > targetIndex; i -- ){

			
				//  See above disclaimer about expecting 
				//  tempKey === undefined when at the edge 
				//  of this.keys[].

				const tempKey = this.keys[ i ]
				this.keyIndex = i
				if( tempKey instanceof Key &&
					tempKey.guarantee === true ){

					if( typeof tempKey.onKey === 'function' ){

						tempKey.onKey( tempKey.values, this )
					}


					//  In the future we may wish to distinguish
					//  between `onEveryKeyEarly` and `onEveryKeyLate`
					//  in order to allow users finer control.

					if( typeof this._onEveryKey === 'function' ){

						this._onEveryKey( tempKey.values, this )
					}
				}
			}
		}
		this.keyIndex = targetIndex
		this.timeCursor = now




		    /////////////////
		   //             //
		  //   onTween   //
		 //             //
		/////////////////


		//  It is possible that our `now` is _exactly_ on a 
		//  keyframe’s intended firing time.
		//  If that’s the case, isn’t it redundant to tween?
		//  YES. But the moment we tried removing the ability to 
		//  fire tween callbacks when it aligned with a keyframe, 
		//  we ran into unintended logical “gotchas” on the user side.
		//  If you are incredibly anxious about performance, 
		//  you may want to give more thought to your callbacks here. 

		//  We need TWO valid keyframes in order to tween anything.
		//  If we don’t got, we bail now.

		if( keyA instanceof Key !== true ||
			keyB instanceof Key !== true ){

			// console.warn( 'One of these keyframes was unresolved.', keyA, keyB )
			return this
		}
		this.tweenKeys( keyA, keyB, now, direction )


		//  Do we need to implement onBefore with no valid keyB? 
		//  Just pass keyA vals??? +++

		if( targetIndex < 0 &&
			typeof this._onBefore === 'function' ){

			this._onBefore( this.values, this )
			//  Note: We are NOT calling this._onEveryTween().
			return this
		}
		if( targetIndex > this.keys.length - 1 && 
			typeof this._onAfter === 'function' ){
			
			this._onAfter( this.values, this )
			//  Note: We are NOT calling this._onEveryTween().
			return this
		}
		if( targetIndex >= 0 && 
			targetIndex < this.keys.length ){

			if( typeof keyA._onTween === 'function' ){

				keyA._onTween( this.values, this )
			}


			//  In the future we may wish to distinguish
			//  between `onEveryTweenEarly` and `onEveryTweenLate`
			//  in order to allow users finer control.

			if( typeof this._onEveryTween === 'function' ){

				this._onEveryTween( this.values, this )
			}
		}
		return this
	}
	
	
	reset( newTimeStartAbsolute ){

		this.disable()
		if( isNotUsefulNumber( newTimeStartAbsolute )) newTimeStartAbsolute = Date.now()
		
		let timeCursor = newTimeStartAbsolute
		this.keys
		.forEach( function( key, i, keys ){

			timeCursor += key.timeRelative
			
			
			//  Again, see reasoning above for using .forEach rather than .reduce or .map here.

			keys[ i ].timeAbsolute = timeCursor
		})
		this.setTimeBounds()
		this.keyIndex   = -1
		this.timeCursor = this.timeStart - 1
		this.enable()
		return this
	}






	    /////////////////
	   //             //
	  //   Statics   //
	 //             //
	/////////////////


	//  ie `this === Pacer`

	static all = []
	static update( now ){

		this.all.forEach( function( p ){

			p.update( now )
		})
		return this
	}
	static inspect(){

		return this.all
		.reduce( function( output, entry ){

			return output +'\n'+ entry.inspect()
		
		}, '' )
	}
	static remove( instance ){

		instance.isEnabled = false//  Immediately prevents update() calls on the instance itself.
		const index = this.all.indexOf( instance )
		this.all.splice( index, 1 )
		instance = null
		return this
	}
	static removeAll(){

		this.all.forEach( function( p ){

			
			//  Immediately prevents update() calls on the instance itself,
			//  which may be in the process of being called
			//  by some outside bit of script’s looping update() function
			//  that is holding a reference to the instance itself.
			//  And we of course do not want that.

			p.isEnabled = false
		})
		this.all = []
		return this
	}
}






    ////////////////
   //            //
  //   Easing   //
 //            //
////////////////


//  Tweening functions, aka Easing functions.
// “Tween” is of course short for “between”, as in _between_ the keyframes.
//  We’ll start with our default tween (no fancy easing):

Pacer.linear = function( n ){ return n }
Pacer.linear.label = 'linear'


//  Robert Penner’s collection of easing functions.
//  https://robertpenner.com/easing/
//  Look how ’purty I’ve boxed up these symetric functions!
//  Compare to how much lengthier and complicated this looks:
//  https://github.com/danro/jquery-easing/blob/master/jquery.easing.js
//  Down the road we ought to add Bezier() and Custom options.

Object.entries({

	sine:        n => 1 - Math.cos(( n * Math.PI ) / 2 ),
	quadratic:   n => Math.pow( n, 2 ),
	cubic:       n => Math.pow( n, 3 ),
	quartic:     n => Math.pow( n, 4 ),
	quintic:     n => Math.pow( n, 5 ),
	exponential: n => n === 0 ? 0 : Math.pow( 2, 10 * n - 10 ),
	circular:    n => 1 - Math.sqrt( 1 - Math.pow( n, 2 )),
	elastic:     n => {

		const c4 = ( 2 * Math.PI ) / 3
		return n === 0
			? 0
			: n === 1
				? 1
				: -Math.pow( 2, 10 * n - 10 ) * Math.sin(( n * 10 - 10.75 ) * c4 )
	},
	back:      ( n, c1, c3 )=> {
		
		if( isNotUsefulNumber( c1 )) c1 = 1.70158
		c3 = c1 + 1
		return c3 * Math.pow( n, 3 ) - c1 * Math.pow( n, 2 )
	}
})
.forEach( function( entry ){

	const
	key = entry[ 0 ],
	val = entry[ 1 ]


	//  Graft our easing logic right onto Pacer
	//  so it’s trivial to access.

	Pacer[ key ] = {

		label: key,
		in:    val,
		out:   n => 1 - val( 1 - n ),
		inOut: n => n < 0.5 ? val( n * 2 ) / 2 : val( n * 2 - 1 ) / 2 + 0.5
	}


	//  Why do this?
	//  To make logic it easy to build logic off of this,
	//  like “What is this tween and what’s its inverse?”

	Pacer[ key ].in.label = key
	Pacer[ key ].in.style = 'in'
	Pacer[ key ].out.label = key
	Pacer[ key ].out.style = 'out'
	Pacer[ key ].inOut.label = key
	Pacer[ key ].inOut.style = 'inOut'
})


//  Bounce doesn’t really make sense for “in” or “inOut”
//  but I’m including it here for completeness. 

Pacer.bounce = {

	label: 'bounce',
	out: function( n, n1, d1 ){//  Oddly, must be defined before `in` and `inOut`.

		if( isNotUsefulNumber( n1 )) n1 = 7.5625
		if( isNotUsefulNumber( d1 )) d1 = 2.75
		if( n < 1 / d1 ) return n1 * Math.pow( n, 2 )
		else if( n < 2 / d1 ) return n1 * ( n -= 1.5 / d1 ) * n + 0.75
		else if( n < 2.5 / d1 ) return n1 * ( n -= 2.25 / d1 ) * n + 0.9375
		else return n1 * ( n -= 2.625 / d1 ) * n + 0.984375
	},
	in: n => 1 - Pacer.bounce.out( 1 - n ),
	inOut: n => n < 0.5 
		? Pacer.bounce.out( n * 2 ) / 2 
		: Pacer.bounce.out( n * 2 - 1 ) / 2 + 0.5
}
Pacer.bounce.in.label = 'bounce'
Pacer.bounce.in.style = 'in'
Pacer.bounce.out.label = 'bounce'
Pacer.bounce.out.style = 'out'
Pacer.bounce.inOut.label = 'bounce'
Pacer.bounce.inOut.style = 'inOut'




export default Pacer




//	If my whitespace makes you uncomfortable, 
//	go weep into the bosom of your favorite dominatrix linter, 
//	you feeble coward.

//  Do you feel that every function must be an arrow function?
//  I’m sorry you feel that way. Cry harder, feely boi.

//	Line-ending semicolons are for perverts.