---
title: The philosophical argument against `useEffect`
description: "I don't want to just tell you to not use an `useEffect`. I'm gonna convince you."
tags: [observations]
---

I've been doing a lot of code reviews recently, and the number one thing that keeps popping up is the use of useEffect. Now, I'm not a particularly senior React dev, but one thing that I did learn and I did learn well is to avoid `useEffect`s. However, I think most react devs

# React is about. Reacting!

Despite React being named `React`, I don't think it's particularly obvious to most developers about the philosophy react takes.

React is a declarative framework, arguably the first of its kind in the web-dev space. In React, you describe _how_ you want your data to look, and React does the heavy-lifting to get you there.

UI development in particularly is just a jumbled mess of global, mutable state. I tried to write a QT app once in C++ and gave up. 

# `useEffect` makes React second-guess itself