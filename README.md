```javascript



///////     //     //////   ///////  ///////
//    //   ////   //    //  //       //    //
//    //  //  //  //        //////   //    //
///////  ///////  //    //  //       ///////
//      //     //  //////   ///////  //   //
//                                   //    //
//                                          //


```
Getting you from A to B since 2025.

<br>




##  TL;DR

__Pacer__ is a light-weight keyframing toolkit inspired by [Soledad Penadés](https://soledadpenades.com/)’ original [tween.js](https://soledadpenades.com/projects/tween-js/) masterpiece. List your keyframes as time / value pairs, and __Pacer__ will ✨ tween your numbers and 📞 call your callbacks. __It’s minimal__. Only does what it needs to. __It’s reliable__. We use this in our own professional projects. We found the bumps and sanded them down so you won’t have to ✔️ Either include the `Pacer.js` ES6 module in your codebase, or install the Node package:

```shell
npm install pacer-js
```
Now you’re cooking.

```javascript
import Pacer from 'pacer-js'

var p = new Pacer()

.key( Date.now(), { n: 0 })
.onKey(( e )=> console.log( '1st keyframe', e.n ))

.key( 2000, { n: 1 })
.onKey(( e )=> console.log( '2 seconds later', e.n ))
.onTween(( e )=> console.log( 'Ooooh!', e.n ))

.key( 2000, { n: 2 })
.onKey(( e )=> console.log( '2 more later', e.n ))
```

Just stick this in your animation loop:

```javascript
p.update()
```



<br><br><br><br>




##  Pacer features

With all the tweening and keyframing libraries already out there, why build a new one? Well, we write _a lot_ of JavaScript and we have _strong opinions_ about the libraries we use and the code we write. Sometimes that drives us to rip it all up and start afresh. Here are some aspects we gave particular attention to:

1. [Legible code](#legible-code)  
2. [Function chaining](#function-chaining)  
3. [Relative _and_ absolute timestamps](#relative-and-absolute-timestamps)  
4. [Tweening](#tweening)  
5. [Every key / every tween](#every-key--every-tween)  
6. [Access within callbacks](#access-within-callbacks)  
7. [Update all instances at once](#update-all-instances-at-once)  
8. [Updating time](#updating-time)  
9. [Forward _and_ backward](#forward-and-backward)  
10. [Reduce, reuse, recycle](#reduce-reuse-recycle)  
11. [Burn it to the ground](#burn-it-to-the-ground)  
12. [__Pacer’s__ Keyframe Guarantee™](#guaranteed-keyframe-callbacks)  
13. [Tweening outside the box](#outside-the-box)  
14. [A verbose example](#verbose-example)  


<br>


###  Legible code

Your __Pacer__ code says what it does. We wanted it to read like a short story. Animating is hard enough. It’s an iterative process that requires making, testing, and then _remaking._ You shouldn’t have to spend half your energy on deciphering your own code just to track down where that one keyframe is that you’re aiming to edit. 

We did shorten some words, like “keyframe” → `key` and “between” → `tween`, but in each case we debated and only accepted the shortened terms when we felt the tradeoff between immediate clarity and simple brevity was acceptable. __Commands__ like `key` read as terse verbs and focus on simple assignment. (_“Keyframe_ this for me.”) __Event hooks__ like `onKey` always begin with an `on` prefix and facilitate callback functions. (“_On this keyframe,_ do this…”) 




###  Function chaining

Expanding on the above, a code block should read like a normal paragraph of text—one idea following another in a logical sequence. With __Pacer__ you declare a keyframe, and [chain](https://en.wikipedia.org/wiki/Method_chaining) another right onto it. Perhaps you add an `onTween` callback _between_ those keyframes. Just about every __Pacer__ method returns its own instance, so you can chain from one method to another, to another—like writing the sentences of a short story. 




###  Relative _and_ absolute timestamps

By default, keyframes are specificed by _relative_ time. (“Do this two seconds after that last keyframe.”) This makes it trivial to swap pieces of an animation around—just cut and paste—without having to redo all the keyframe timings. Our TL;DR example uses the `key` command to illustrate this workflow, but we could have also used the slightly more descriptive `rel` (“relative”) alias to accomplish the exact same thing. All relative times are relative to the chronologically-latest keyframe as determined the moment the `key` or `rel` command is processed. (And yes, you can specify a _negative_ relative time—if you’re into that sort of thing.) What about your _first_ keyframe—which has no prior keyframe to be relative to? Consider it relative to _zero_—which makes it both relative _and_ absolute. Note the use of the alias `rel` here rather than `key`:

```javascript
var 
now = Date.now(),
p = new Pacer()

.rel( now )
.onKey(()=> console.log( '1st keyframe' ))

.rel( 2000 )
.onKey(()=> console.log( '3rd keyframe' ))

.rel( -1000 )
.onKey(()=> console.log( '2nd keyframe' ))
```

Meanwhile, specifying an absolute time for your keyframe is as easy as using the `abs` command instead of `key` or `rel`. Immediately after your new keyframe has been created, all keyframes are re-sorted in chronological order; ready for your next command. 

```javascript
var 
now = Date.now(),
p = new Pacer()

.abs( now )
.onKey(()=> console.log( '1st keyframe' ))

.abs( now + 2000 )
.onKey(()=> console.log( '3rd keyframe' ))

.abs( now + 1000 )
.onKey(()=> console.log( '2nd keyframe' ))
```

Mix and match `key`, `rel`, and `abs` if it makes you smile.

```javascript
var 
now = Date.now(),
p = new Pacer()

.key( now )
.onKey(()=> console.log( '1st keyframe' ))

.rel( 2000 )
.onKey(()=> console.log( '3rd keyframe' ))

.abs( now + 1000 )
.onKey(()=> console.log( '2nd keyframe' ))
```




###  Tweening

By default your values are [linear interpolated](https://en.wikipedia.org/wiki/Linear_interpolation) (“lerped”) between keyframes. If you’re reading this and evaluating if __Pacer__ is the right solution for you, then I’m sure I don’t have to explain the importance of easing equations. We have the goods. Use `tween()` to pick from our built-in easing equations, and `onTween()` to register a callback function that will execute on each `update()` call that lands between your specified keyframes. Check how easy it is:

```javascript
var p = new Pacer()

.key( Date.now(), { n: 0 })
.onKey(  ( e )=> console.log( 'KEY 1:', e.n ))
.onTween(( e )=> console.log( '1 → 2:', e.n ))

.key( 1000, { n: 100 })
.tween( Pacer.quadratic.out )
.onKey(  ( e )=> console.log( 'KEY 2:', e.n ))
.onTween(( e )=> console.log( '2 → 3:', e.n ))

.key( 1000, { n: 200 })
.onKey(  ( e )=> console.log( 'KEY 3:', e.n ))
```

Just like `onKey`, the `tween` function applies to your _most recently declared_ keyframe. __Pacer__ includes dear [Robert Penner’s basic easing equations](https://robertpenner.com/easing/). Those are tacked directly onto the `Pacer` object, eg. `Pacer.cubic.*`. That makes them easy to find and include—even in non-__Pacer__ contexts. Here’s our list of easings:
`sine`,
`quadratic`,
`cubic`,
`quartic`,
`quintic`,
`exponential`,
`circular`,
`elastic`,
`back`, and
`bounce`. 

Each easing equation includes its `in`, `out`, and `inOut` variants, eg. `Pacer.cubic.in`, `Pacer.cubic.out`, and `Pacer.cubic.inOut`, so you can hit the ground running. But like… ease into it, tho.




###  Every key / every tween

If you find you’re running the same callback over and over, perhaps you’d prefer to declare that just once? We’ve got you covered. Use `onEveryKey` to declare a callback that will fire on _every_ keyframe, and `onEveryTween` to do the same for all tweens. [Something borrowed, something blue. Every tween callback for you](https://youtu.be/4YR_Mft7yIM).  


```javascript
var p = new Pacer()
.key( Date.now(), { n: 0 })
.key( 1000, { n: 100 })
.key( 1000, { n: 200 })
.onEveryKey(  ( e )=> console.log( e.n, 'KEY!' ))
.onEveryTween(( e )=> console.log( e.n ))
```




###  Access within callbacks

__Pacer__’s `onKey` and `onTween` methods provide a reference to its own instance as a callback argument. The instance includes potentially useful properties, like `keyIndex` which tells you which keyframe in the sequence you are currently on.

```javascript
var p = new Pacer()
.key( Date.now() )
.key( 1000 )
.key( 1000 )
.onEveryKey(( e, p )=> console.log( 
	
	'Step #', p.keyIndex + 1, 
	'of', p.keys.length 
))
.onEveryTween(( e, p )=> console.log( 
	
	'Between #', p.keyIndex + 1, 
	'and', p.keyIndex + 2
))
```

This means in theory you don’t even have to name your __Pacer__ instance if all you want to do is reference that instance within your callbacks. Note the lack of assignment here:


```javascript
new Pacer()
.key( Date.now() )
.key( 1000 )
.key( 1000 )
.onEveryKey(( e, p )=> console.log( 
	
	'Step #', p.keyIndex + 1, 
	'of', p.keys.length
))
```




###  Update all instances at once

But how do you update an _unnamed_ instance? Under the hood, __Pacer__ keeps a reference to all created instances in its `Pacer.all` array. You can update every single instance at once by sticking this in your animation loop:

```javascript
Pacer.update()
```

And because `onKey` and `onTween` provide the same callback arguments, it’s trivial to use the same callback for both.

```javascript
var myCallback = ( e, p )=> console.log( 

	'Step:', p.keyIndex + 1,
	'value:', e.n
)
new Pacer()
.key( Date.now(), { n: 0 })
.key( 1000, { n: 100 })
.key( 1000, { n: 200 })
.onEveryKey(   myCallback )
.onEveryTween( myCallback )
```




###  Updating time

You’ve seen that you can update your instance with `p.update()`, or all instances at once with `Pacer.update()`. But now you’re interested in finer control of your timing. When either the class or instance `update` method is called without arguments, __Pacer__ defaults to `Date.now()`, but you are free to use any numeric progression you choose. Perhaps you want to key off of `window.performance.now()` for finer accuraccy. Or maybe you’re building a scroll-based animation and you’re substituting `scrollY` (pixels) for time. Just pass your value via update:

```javascript
p.update( numericValue )
```
Be sure you’re consistent with your units. __Pacer__ isn’t going to magically understand that you’ve used seconds to declare keyframes, but milliseconds in your `update` call. That’s on you.

Another thing to note is that `update` expects an _absolute_ number, rather than a _relative_ one. Repeatedly calling `p.update( 1000 )` will _not_ advance your animation by one second with each call. Instead it will lock your animation at its one second mark. Relative units are enormously useful for crafting (and recrafting) keyframes, but slightly less useful within the context of synchronization. It’s taken years of building projects like this to be able to feel confident in asserting this subtlety. 




###  Forward _and_ backward

Mathematically, [time can flow both forward _and_ backward](https://en.wikipedia.org/wiki/Tenet_(film)). Why would __Pacer__ ignore that reality? The ability to scrub a timeline back and forth is incredibly valuable, and literally the mechanism that our __ScrollPacer__ toolkit uses for scroll-based animations. (More on this to come.) Rest assured that your `update` call can handle time flowing in either direction (and at any speed). It just works.




###  Enable / disable

Need to gate your __Pacer__ instance? (Let’s assume you’ve named it `p`.) Prevent it from chewing `update` cycles:

```javascript
p.disable()
```
Ready to return to service?

```javascript
p.enable()
```




###  Reduce, reuse, recycle

Re-running an animation is easy. The `reset` method recalculates the timing of all of your instance’s keyframes based on the numeric argument provided. (With no arguments, the `reset` method defaults to `Date.now()`.) Here’s an example of taking a previously used animation and restarting it two seconds from now:

```javascript
p.reset( Date.now() + 2000 )
```


<br>


###  Burn it to the ground

Done with your instance for good? (We’re not talking about “pausing” your instance—we’re about to _destroy_ your instance.) Remove all of __Pacer__’s references to it and set the instance to `null` with:

```javascript
p.remove()
```
Or via the class itself:

```javascript
Pacer.remove( p )
```
Seeking total destruction?

```javascript
Pacer.removeAll()
```




###  Guaranteed keyframe callbacks

We pledge to deliver all of your `onKey` callbacks with a money-back guarantee. (Reminder: You have paid zero dollars for this toolkit.And donations don’t count.) By default, each keyframe has a `guarantee` Boolean set to `true` that assures `onKey` will be called when calculating the gulf between “now” and our animation loop’s prior execution. Let’s say you have keyframes spaced very close together in time—tighter than your animation loop is able to execute. In this example, our last `update` call determined that we were between Key Frame __A__ and Key Frame __B__: 

```
 KEY       KEY       KEY       KEY
FRAME     FRAME     FRAME     FRAME
  A         B         C         D

┄┄┼─────────┼─────────┼─────────┼┄┄

prior  ↑
update │            this   ↑
                    update │
```
However, on this current call to `update`, we have not merely reached Key Frame __B__, but have passed both it and Key Frame __C__ to arrive between __C__ and __D__. __Pacer__ ensures that if `onKey` callbacks exist for __B__ and __C__ they will be honored—and in order. Flowing backward through time? Sleep tight knowing they’ll be called in an order that respects your flow of time, eg. __C__ _then_ __B__ when flowing backward. That’s the __Pacer__ Keyframe Guarantee™.

As you’d hope, __Pacer__ will also call `onEveryKey` when it honors `onKey` for __B__ and __C__. Note that `onTween` and `onEveryTween` will _not_ be called for any values between __B__ and __C__ as we are not experiencing time between those keyframes. 




###  Outside the box

What happens outside of your declared keyframes? __Pacer__ automatically extrapolates your first and last tweens forward and backward in time, beyond your declared keyframes. You often don’t need this—but when you do, you do. Let’s say you have two keyframes, __A__ at time __0__, and __B__ at time __2__. They’re tweening a value, `n`, from `0` to `1` using the default linear interpolation easing function. As a result you can see that at time __1__, the tweened value of `n` will be `0.5`—halfway between its keyframed values of `0` and `1`. So far so good?


```
             KEY                 KEY
            FRAME               FRAME
              A                   B

   ┄┼┄┄┄┄┄┄┄┄┄╞═════════╪═════════╡┄┄┄┄┄┄┄┄┄┼┄
t             0         1         2         

n            0.0       0.5       1.0       
```

But what if we wanted to know the tweened value of `n` beyond the specified keyframes? What if we want to know `n` at time __-1__? Or at time __3__? __Pacer__ extends the value of `n` infinitely outward on either side of the timeline using the existing tweening functions on either end of the keyframe sequence. In this simple case we’re using the default linear interpolation on both ends, so it’s trivial to see that at time __-1__ `n` ought to be `-0.5`. This is consistent with its declared trajectory between time __0__ and __1__—or __0__ and __2__, for that matter. Similarly, at time __3__, `n` will be `1.5`.

```
             KEY                 KEY
            FRAME               FRAME
              A                   B

   ┄┼┄┄┄┄┄┄┄┄┄╞═════════╪═════════╡┄┄┄┄┄┄┄┄┄┼┄
t  -1         0         1         2         3

n -0.5       0.0       0.5       1.0       1.5
```

Because these times exist beyond our declared keyframes, `onEveryTween` will _not_ fire. (Just imagine how annoying that would become—requiring you to gate all of your `onEveryTween` callbacks based on whether or not the current time was actually within your expected range.) So how do we make use of this tween extrapolation? Here’s an example pre-history callback:

```javascript
p.onBeforeAll(( e, p )=> console.log(

	'Pre-history value:', e.n,
	'Current key index:', p.keyIndex,
	'Current keyframe: ', p.getCurrentKey()
))
```
And here’s the post-history complement:

```javascript
p.onAfterAll(( e, p )=> console.log(

	'Post-history value:', e.n,
	'Current key index: ', p.keyIndex,
	'Current keyframe:  ', p.getCurrentKey()
))
```
Note that for both of these, `p.keyIndex` will be _out of range_ of `p.keys` (`-1` and `keys.length`, respectively.) Consequently, `p.getCurrentKey()` will return `undefined`. This is expected behavior—you are beyond the timeline of the keyframes, after all. Here’s some pseudocode for additional clarity:

```
if keyIndex === -1 → onBeforeAll()
if keyIndex 0..keys.length-1 → onEveryTween()
if keyIndex === keys.length → onAfterAll()
```




<br><br>
<hr>
<br><br>




##  Verbose example

Let’s cram in a bunch of different feature highlights into this one verbose example.

```javascript
//  We’ll start off with the basics.
//  Did you know you can label a Pacer instance
//  by passing it a String?
//  That’s useful for debugging later.

var p = new Pacer( 'My first Pacer' )


//  Three keyframes, alike in dignity.
//  Note how we’re starting at time === 0.
//  Well that’s sliiightly earlier than Date.now()!
//  Don’t worry, we’ll fix it below 
//  when we demonstrate reset().

.key( 0, { n: 0 })
.onKey(( e )=> console.log( '1st keyframe.', e.n ))

.key( 2000, { n: 100 })
.onKey(( e )=> console.log( '2 seconds later.', e.n ))

.key( 2000, { n: 200 })
.onKey(( e )=> console.log( '+2 more seconds.', e.n ))


//  Now let’s have some fun with tweening.

.key( 2000, { n: 300 })
.label( 'My first tween!' )
.tween( Pacer.sine.in )
.onKey(( e, p )=> console.log( p.getCurrentKey().label ))
.onTween(( e )=> console.log( 'Tweened value:', e.n ))

.key( 2000, { n: 400 })
.label( 'My second tween' )
.tween( Pacer.quadratic.out )
.onKey(( e, p )=> console.log( p.getCurrentKey().label ))
.onTween(( e )=> console.log( 'Tweened value:', e.n ))

.key( 2000, { n: 500 })
.label( 'Let’s stop labeling things now.' )
.tween( Pacer.bounce.inOut )
.onTween(( e, p )=> console.log( 
	
	'Step:', p.keyIndex + 1,
	'value:', e.n
))


//  Can haz multiple tweens at once?
//  Of course you can!

.key( 2000, { n: 600, x: 100 })
.onTween(( e )=> console.log( e.n, e.x ))
.key( 2000, { n: 700, x: -100 })


//  Totally commenting these out
//  in case you copy and paste this whole thing
//  into your console.
//  You see what it is. You see how it works.
//  I think we’re good.

.onEveryKey(( e, p )=>{

	// console.log( 'Step:', p.keyIndex + 1, 'values:', e )
})
.onEveryTween(( e, p )=>{

	// console.log( 'Step:', p.keyIndex + 1, 'values:', e )
})


//  Note that for “before” `keyIndex` will be 
// “out of bounds” with a value of -1,
//  so `getCurrentKey()` will return undefined.
//  This is intended. We’re out of keyframes!
//  We are extrapolating our first tween.
//  Also note that `onEveryTween` will NOT 
//  be called in these before / after cases.

.onBeforeAll(( e, p )=> console.log( 
	
	'“Theoretical” step:', p.keyIndex + 1,
	'value:', e.n
))


//  Similarly, for “after” `keyIndex` will be 
// “out of bounds” with a value of keys.length,
//  so `getCurrentKey()` will return undefined.
//  We are extrapolating our final tween.
// `onEveryTween` will NOT be called.

.onAfterAll(( e, p )=> console.log( 
	
	'“Theoretical” step:', p.keyIndex + 1,
	'value:', e.n
))


//  This sequence effectively does nothing
//  to our animation execution,
//  but does demonstrate the existence 
//  of these features,
//  and the beauty of function chaining.

.disable()
.enable()


//  Remember how we declared this instance
//  starts at time === 0?
//  Let’s fix that to start at 2 seconds from now.
//  YES -- you can add this reset()
//  within a keyframe callback! Get loopy!

.reset( Date.now() + 2000 )
```



<!--

##  Commands

key
tween
rel
abs
etc


##  Event hooks

onKey
onTween

-->