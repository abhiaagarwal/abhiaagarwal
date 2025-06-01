---
title: The philosophical argument against `useEffect`
description: "I don't want to just tell you to not use an `useEffect`. I'm gonna convince you."
tags: [observations]
---

I've been doing a lot of code reviews recently, and the number one thing that keeps popping up is the use of `useEffect`. Now, I'm not a particularly senior React dev, but one thing that I did learn and I did learn well is to avoid `useEffect`s. While my colleagues readily accept my tirade against them, 

# React is about. Reacting!

Despite React being named `React`, I don't think it's particularly obvious to most developers what React as a paradigm represents.

React is a declarative framework, arguably the first of its kind in the webdev space. In React, you describe _how_ you want your data to look, and React does the heavy-lifting to get you there.

Let's consider this simple, contrived example of how the `imperative` style of programming would develop some simple client-side interaction.

"I want my button to be red if the user clicks it, so **I will** set an event listener such that if they click it, **I will** add the `.red` css class."

Meanwhile, React would solve this problem declaratively like:

"If the Button is in the `clicked` state, then **it will** have the `.red` class applied to it."

Notice that the declarative style leaves... a lot to interpretation. It's not even bothering to figure out the details, it's just saying what it wants.

UI development in particularly is just a jumbled mess of global, mutable state. I tried to write a QT app once in C++ and gave up. 

# `useEffect` is about making React second-guess itself

# Instead, tell React upfront what to React to!