---
title: Why is the typing of `try_map` like that?
description: "Breaking down why Rust's `try_map` has scary typing, and why it makes sense."
tags: [observations]
---

I've been on vacation in Europe for the past three weeks. Despite my best efforts to stay offline, the primal calling to doomscroll has overwhelmed me a few times, and on one evening, I saw this tweet by Dmitrii Kovanikov, Haskell-turned-C++ developer at Bloomberg.

![](https://x.com/ChShersh/status/1947739485971833085)

Perfectly executed rage bait. Definitely got me raging.

While me, a rust ~~cultist~~ enthusiast instantly saw the beauty with this, it would be unfair to not note this as a potential manifestation of stockholm syndrome. However, I do think that this function expresses a deeply beautiful concept, and I want to walk 
# On question marks and failability

If you're familiar with TypeScript/JavaScript/ECMAScript, you might know this syntax:

```typescript
const a: number | null = ...
const val = a?.toString()
// val is of type (string | undefined)
```

This syntax allows to elegantly handle nullish (aka `null` or `undefined`) elements without needing a ternary or if-else statement. The `?` operator desugars to something like `(a === null || a === undefined) ? undefined : a.toString()`.

Rust has something similar, but nullability in Rust is handled much differently as compared to ECMAScript. Instead of `null` being an explicit type, `null` does not exist in Rust, and instead, the `Option` type does, which is an disjoint algebraic union of some type `T` and `None`, where `None` is... nothing; it represents no data^[This is technically the "Never" type `!`, which you can think of as the return type of a program that never exits]. For those with a math background, you can think of it as the empty set. This may not seem like a huge difference in abstract, but it does mean that any notion of *null-ness* in Rust is really just some sugar over an enum. `Result` represents something similar, except being an union of `T` and `Err`, where `Err` is an arbitrary type that can have some data associated with it.

Due to Rust's `Result`/`Option` enums forcing you to handle the happy path explicitly, it instead uses the `?` operator to early return.

```rust
fn foo(a: u64) -> Option<u32> {
    const my_new_val = a.try_into()?;
    Some(my_new_val / 2)
}
```

In this case, if `a.try_into()` failed (returned an `Option::None` or a `Result:Err`), then the question mark operator would cause an early exit, making the function return `None` without needing to explicitly handle the case. Instead of `my_new_val` being an `Option<u32>`, it's just an `u32`.

...feels magical, innit? How does the question mark operator "know" that `Option::None` and `Result:Err` are the unhappy path? From the perspective of the type system, these are just two unions of two types — it feels rather discriminatory that one gets singled out. ECMAScript does it with the hardcoding of `null` and `undefined`, but that's for backwards-compatible reasons.

And that's where the `Try` trait comes into play, as an abstraction over this behavior.
# The `Try` trait

The `Try` trait encapsulates the behavior described above, where a given type that implements it defines two associated types, the `Output` type and the `Residual` type. Here's the definition of it from the [RFC](https://rust-lang.github.io/rfcs/3058-try-trait-v2.html).

```rust
trait Try: FromResidual {
    type Output;
    type Residual;
    fn branch(self) -> ControlFlow<Self::Residual, Self::Output>;
    fn from_output(o: Self::Output) -> Self;
}
```

The `ControlFlow` you might see is the following enum, available in [stable Rust since 1.55](https://doc.rust-lang.org/std/ops/enum.ControlFlow.html):

```rust
pub enum ControlFlow<B, C = ()> {
    Continue(C),
    Break(B),
}
```

This enum is magical in the eyes of the compiler, representing that "early return" behavior that the `?` operator does for us. So, whenever `?` is called, what it does is call `branch`, which returns a `ControlFlow`

# So, what does `try_map` actually do?

We now have enough context to break down what `try_map` actually does. Here's the full definition, copied from the [nightly docs](https://doc.rust-lang.org/nightly/std/primitive.array.html#method.try_map).

```rust
pub fn try_map<R>(
    self,
    f: impl FnMut(T) -> R,
) -> <<R as Try>::Residual as Residual<[<R as Try>::Output; N]>>::TryType
where
    R: Try,
    <R as Try>::Residual: Residual<[<R as Try>::Output; N]>,
```

First, let's take a look at what parameters this function takes. This function is taking an input of some `F` that implements `FnMut(T) -> R`. This is just a callable; this function takes a function. In particular, it takes a `FnMut`, which is allowed to *mutate* its internal state, of which that state is of type `T`. 

It turns `R`, of which `R` implements `Try`. Get

# A semi-contrived example with a custom `Try` implementation

# Is this good?

Alright, I'll now reveal my trick. As much as I think this is beautiful, this beauty is something akin to the beauty a murderer finds in its victim. 