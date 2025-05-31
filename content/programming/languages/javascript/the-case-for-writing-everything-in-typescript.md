---
title: The case for writing almost everything in Typescript
description: "I was skeptical a year ago. But having more experience as a developer and using modern Typescript frameworks, I'm convinced that we should be writing almost all of our code in Typescript."
tags: [observations]
---

It feels almost sacrilegious to say this—but I think we need to be writing more TypeScript. Almost _everything_ should be written in TypeScript.

One of my first coding memories was in 8th grade (2015), when I wrote my first JavaScript script in Google Sheets to calculate sunrise and sunset times for a class assignment. We were supposed to do it by my hand, but as the resident smart alek, I decided to give it a try. Here's the code:

```javascript
var andoverLat = 42.65;
var andoverLong = -71.22;

function appendZero(duration) {
  return (duration < 10) ? "0" + duration : duration;
}

function getSunrise(date) {
  var myDate = new Date(date);
  
  var times = SunCalc.getTimes(myDate, andoverLat, andoverLong);
    
  var sunrise = times.sunrise.getHours() + ":" + appendZero( times.sunrise.getMinutes() );
  
  return sunrise;
}

function getSunset(date) {
  var myDate = new Date(date);
  
  var times = SunCalc.getTimes(myDate, andoverLat, andoverLong);
    
  var sunset = times.sunset.getHours() + ":" + appendZero( times.sunset.getMinutes() );
  
  return sunset;
}
```

"Yuck" I thought at the time. Coming from a statically typed C++ background, I found it difficult to reason about. I use a library called `SunCalc`, and it wasn't obvious to me what each function was returning. I didn't want to spend time guessing and looking, I just wanted to know!

The experience left me somewhat disillusioned with JavaScript, and by extension, frontend development. A hilariously strong position for an 8th grader to take, but one that affected me nonetheless.

I wrote a lot of Python in high school, doing Project Euler problems during math class to solve my boredom. This followed me in college, where due to my undergrad focusing on math, econ, and physics, I was able to use `sympy`, `pandas`, `skikit-learn`, etc to power through my undergrad research and the start of my professional career.

Yet, as my career has progressed and I've drifted more into services-based development, and recently onto the frontend, I've had nothing but positive experiences with TypeScript—and more surprisingly, I’ve found my long-standing love for Python starting to fade.

# The build step is a good thing

One common criticism of TypeScript is the build step required before deployment. You have to run `tsc` to compile your code, and that compilation can sometimes be _painful_. I get it. In the case of python, it's nice to just be able to `python my_app.py` and it'll work. 

However, I think the _timing_ of the build step is important. In practice, the performance of dev servers means that while the first build can be expensive, subsequent builds are cheap. When iterating, I only care about how quickly my code changes show up on screen.

But the build step is a cost you pay once, and you pay it _before_ your application is deployed. I've found that in my python apps, I do a sort of build step where I set up global, static state during the init functions and whatnot, meaning that I pay for a build step **every time I refresh my application.** `python3 server.py` becomes much less useful if `server.py ` needs to spend multiple seconds doing things to become useful.

Additionally, with the recent development of node gaining native typescript support (with bun, my preferred runtime, already natively transpiling) and [`erasableSyntaxOnly`](https://www.totaltypescript.com/erasable-syntax-only), we're getting closer to just being able to run typescript without any sort of build step. The types will be 
# A shorter feedback loop
Typescript is immensely powerful. Switching from Python's static type system to TypeScript's feels like discovering fire. With Typescript, I'm confident that if my code passes the type checker that it will work first try, but I can't say the same for Python, even with a maximalist mypy/ruff setup.

I recently, as a student of [[Content/education/omscs/omscs|Georgia Tech's OMSCS]], got access to Cursor for free for a year. Having not used it at all before, I ran it on some toy python and typescript code, and [[Content/ai/llms/reviews/gemini/gemini-2.5-pro|gemini-2.5-pro]] was able to iterate on the typescript code. It spent over 5 minutes, pondering, making mistakes, and constantly fixing them, but in the case of typescript, it was able to resolve my relatively complicated request in one shot. Due to the Typescript (and ESLint) constantly emitting errors whenever it hallucinated functions or wrote redundant code, the LLMs benefit from a near-instant feedback loop, allowing them to infer program behavior _without_ running it.

Meanwhile, The Python code performed poorly, lacking the constraints that made TypeScript iteration so effective. Gemini in this case reward-hacked, writing code that meet my intention but not actually resolving the problem. Nothing was there to hold it accountable, and why would they? MyPy smiled the whole way through. Python's type system is very weak, and I'd argue, close to useless.

I wouldn't call myself an LLM evangelist by any means, but I do think the areas where they can be most successful in is with automated iteration based on a system of constraints. [AlphaEvolve](https://deepmind.google/discover/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/) is a good example of this design, as LLMs can simply generate more text faster than we can type. Static typing can be thought as a form of an unit tests, except you encode the desired behavior _declaratively_, rather than _imperatively_.
# Python's type system is bad

I cannot emphasize how badly Python messed up with its type system.

So in Python, types do nothing. They're entirely annotations. So as a result, they don't actually affect the execution of a program. Similar to typescript!

Actually, that’s not even true. Types are available at runtime in python, you can get them by using `inspect.get_annotations()`. Frustratingly, type hints actually resolve to their module names at runtime, so if you were to type-hint a function that took an `np.ndarray` and therefore imported `numpy as np`, it would import numpy even though it "does" nothing! You can mitigate this with `from __future__ import annotations` and guarding your imports with `if typing.TYPE_CHECKING`, but it just goes to show the layers of hackery that go into this.

 Python has the typing information available at "build time", but does nothing with it. Even though the types _do nothing_, Python isn't able to provide the rich, structural typing that Typescript is able to do. Someone just [wrote doom](https://www.youtube.com/watch?v=0mCsluv5FXA) inside of Typescript; if you tried to do the same with MyPy, it would likely cause a small nuclear explosion.

Yet, this isn't even still the full story. Perhaps the worst part is that those advisory types actually _can_ affect runtime behavior. My favorite Python library, Pydantic, uses those type hints to create its data classes at runtime. This means that your entirely-advisory hints can have runtime effects.

Python's type system ends up combining the downsides of both interpreted and statically typed models. The more I try to rely on Python’s type system to write correct code, the more friction I encounter.
# React Server Components, and RPC, broadly

For the _vast_ majority of applications, you do not need a dedicated API server. Your backend will likely only be consumed by one client, your frontend. If you ever need to scale out, you can, but for iteration, having two separate interfaces is a hassle.

I've partially solved this problem by generating an OpenAPI spec off FastAPI and then generating a typescript client, but, why?

RSCs are a controversial topic, and I was skeptical until I read Dan Abramov's series on overreacted. I still wonder consider myself more skeptical of the benefits of SSR for the vast majority of applications, but React Server Components are just an abstraction over the HTTP boundary. 
# Python has its place, but we probably should see less of it. 
Python will always be the chose of people looking to get down and dirty over Node by virtue of being integratabtle with everything through a consistent C-based FFI bindings. I've tried FFI with Node, and would not recommend it.

However, I don't think there's a strong argument for Python living close to the edge. Python should be reserved as a scripting language for a lower-level service. Yes, write your performant rust code and use pyo3 to expose it, do your data analysis with polars in your jupyter notebooks, run your torch training loops, do all of it in Python!

A common criticism of Python is that it's a "glorified scripting language", akin to Perl, and I think I agree. Python is rarely doing anything itself, it's instead orchestrating a lower-level program and wrapping it together. 