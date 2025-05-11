---
title: The case for writing almost everything in Typescript
description: I was skeptical a year ago. But having more experience as a developer and using modern Typescript frameworks, I'm convinced that we should be writing almost all of our code in Typescript.
tags:
  - observations
---
It feels almost sacrilegious to say this and feel this. But I think we need to be writing more typescript. I think almost _everything_ should be written in Typescript.

One of my first coding memories was back in 8th grade in 2015, when I wrote my first Javascript in a Google Sheets in 8th grade science to calculate sunrise/sunset. This was the code:

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

"Yuck", I thought at the time. Coming from a statically-typed C++ mindset having been my first language, this code looked _ugly_ to me. I use a library called `SunCalc`, and it wasn't obvious to me what each function was returning. I didn't want to spend time guessing and looking, I just wanted to know! I spent _hours_ writing this code, and to boot, Mr. Shenker was not very impressed with me.

The experience left with me a bad taste in the mouth regarding Javascript, and by proxy, frontend development as a whole. A hilariously strong position for a dumb 8th grader to take, but one that affected me nonetheless. 

I wrote a lot of Python in high school, doing Project Euler problems during math class to solve my boredom. This followed me in college, where due to my undergrad focusing on math, econ, and physics, I was able to use `sympy`, `pandas`, `skikit-learn`, etc to do a ton of cool shit. Python has been my ride or die for around half my life.

Yet, as my career has progressed and I've drifted more into web app development, I've found only a positive experience with Typescript, and more worryingly... I feel my love for python starting to dissipate. 
# The build step is a good thing
The common criticism of typescript is the build step. You have to run `tsc` to compile your code, and that compilation can sometimes be _painful_. I get it. In the case of python, it's nice to just be able to `python whatever.py` and it'll work. 

However, I think the _timing_ of the build step is important. In practice, the performance of dev servers means that the first build can be expensive, but subsequent builds are cheap. When iterating, I only really care about the time my changes in my code are changes on the screen, and that's on the order of milliseconds.

But the build step is a cost you pay once, and you pay it _before_ your application is deployed. I've found that in my python apps, I do a sort of build step where I set up global, static state during the init functions and whatnot, meaning that I pay for a build step **every time I refresh my application.** I don't really care that I can do `python3 server.py` if `server.py ` needs to spend multiple seconds doing things to become useful.
# A shorter feedback loop
Typescript is immensely powerful. Going between Python's static type system and Typescript's is what man must have felt like discovering fire. With Typescript, I'm confident that if my code passes the type checker that it will work first try, but I can't say the same for Python, even with a maximalist mypy/ruff setup.

I recently, as a student of [[Content/education/omscs/omscs|Georgia Tech's OMSCS]], got access to Cursor for free for a year. Having not used it at all before, I ran it on some toy python and typescript code, and [[Content/ai/llms/reviews/gemini/gemini-2.5-pro|gemini-2.5-pro]] was able to iterate on the typescript code. It spent over 5 minutes, pondering, making mistakes, and constantly fixing them, but in the case of typescript, it was able to resolve my relatively complicated request in one shot. Due to the typescript (and eslint) constantly emitting errors whenever it hallucinated functions or wrote redundant code, the LLMs get a near-instant feedback loop that allows them to determine the behavior of a program _without_ running it.

Meanwhile, the python code _sucked_, for the lack of a better word. Gemini in this case reward-hacked, writing code that meet my intention but not actually resolving the problem. Nothing was there to hold it accountable, and why would they? MyPy smiled the whole way through. Python's type system is very weak, and I'd argue, close to useless.

# The world is the web
I develop full stack applications during my day job, but I personally fashion myself as a backend developer. Probably due to relating to Steve Carrell more than Ryan Gosling.

![[Content/programming/languages/javascript/frontend-backend-devs.png]]

I still do try to claim the backend aesthetic, but increasingly, most of my time is spent on frontend. I've realized the unfortunate truth that _no one really cares if your backend is good_. What your users care about is what's in front of them. Sure, your backend being good means your frontend can also be gooder, but it is not a necessary prerequisite.
# React Server Components, and RPC, broadly

Let's face it — for the _vast_ majority of applications, you do not need a dedicated API server. Your backend will likely only be consumed by one client, your frontend. If you ever need to scale out, you can, but for iteration, having two separate interfaces is a hassle. 

I've partially solved this problem by generating an OpenAPI spec off FastAPI and then generating a typescript client, but, why? 

RSCs are a controversial topic, and I was skeptical until I read Dan Abramov's series on overreacted. I still wonder consider myself more skeptical of the benefits of SSR for the vast majority of applications, but React Server
# Python has its place, but we probably should see less of it. 
Python will always be the chose of people looking to get down and dirty over Node by virtue of being integratabtle with everything through a consistent C-based FFI bindings. I've tried FFI with Node, and would not recommend it.

However, I don't think there's a strong argument for Python living close to the edge. Python should be reserved as a scripting language for a lower-level service. Yes, write your performant rust code and use pyo3 to expose it, do your data analysis with polars in your jupyter notebooks, run your torch training loops, do all of it in Python! 