---
title: Given enough time, you can solve anything
description: Or, on the real value of a math education
tags: [thoughts]
---

For those into the weeds of the development of large language models, there's been a phenomenon known as ["grokking"](https://en.wikipedia.org/wiki/Grokking_(machine_learning)). Here's a beautiful graph:

In this case, a large language model overfit on the training data, but became unable to solve the unseen test data. Most researchers, constrained by the pricing of their compute, would stop the run at this point. However, one OpenAI scientist forgot to turn off the run, and returned to discover something magical — the model knew nothing, and then, it suddenly knew everything.

I've had this feeling a few times throughout my career, and increasingly so. I'll start off trying to solve some sort of problem, fumbling around, and then a few months later I'll think to myself, "how did I ever _not_ know how to do this?" The phase transition isn't conscious, and I can't pinpoint a moment where I never not knew, it's as if my own history had rewrote itself to the reality where I always knew.

I generally believe that given enough time on any sort of problem, I can solve it. Perhaps under the same vein of the [universal approximation theorem](https://en.wikipedia.org/wiki/Universal_approximation_theorem), I believe that by pure chance, the "weights" that describe my own neurons could update such that I solve a problem. Sure, that length of time required might be longer than my own lifespan, but given t -> infinity, I **will** solve it.

I don't think this is some sort of ability unique to my own brain, but I think it's more apt to call it a skill. The skill of relentless pursuit, the confidence to keep trying, and most importantly, being comfortable the deeply harrowing feeling of being in the unknown. And I think that skill was developed by a math education.

In economics, physics, and all the so-called "hard sciences", the curriculum is incremental. I've also found that the curriculums themselves are tied into a natural sort of understanding, such that if you don't _immediately understand the next module_ then it is a failure, both on you the student and the curriculum.

Mathematics education, at least to me, never felt this way. Sure, the topics did build on each other, but it never felt like I was told _why_ they connected to each other. I was expected to draw those connections. I was given examples of how our new theorem is a consequence of another theorem we derived earlier, but it almost never "clicked" for me, at least instantly. 

Part of the reason this works is because mathematical language is not in plain english. In a sense, a math education is like learning a foreign language. That "understanding" of it is learning how to speak it in your native tongue.

Let's talk about how neural network actually trains. They work via gradient descent, which is quite simply "follow the path to where there appears to be a valley" (in more technical terms, given a manifold, find the global minima). There is no general algorithm to do this given an arbitrary manifold, so gradient descent, in a sense, is an inelegant solution, just slightly better than brute force. When a neural network finds a minima, there is no guarantee that minima is the global minima. This is best represented by the loss curves for both the train and test data, where those weights were optimized for the train set, but _not_ the test data, meaning it reached a shallow local minima. Yet, when forced to explore more of the manifold, it had that "aha" moment, maybe by pure chance, and reached a "deeper" local minima. That deeper local minima was able to satisfy the whims of the test set. Maybe it was the global minima; there's no way to know this analytically.