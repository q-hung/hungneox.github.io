---
layout: post
title: "The Y combinator in lambda calculus"
date: 2017-10-23 16:00
categories: [programming]
author: hungneox
description: "What the Y combinator is and why it is worth knowing"
image: /assets/images/placeholder.jpg
comments: true
published: true
---

# Introduction

**TL;DR:** The Y combinator is a **higher-order function** in the [lambda calculus](https://en.wikipedia.org/wiki/Lambda_calculus) that lets us write **recursion without naming** the function. In plain terms, it is a trick that lets an **anonymous** function call **itself**.

## What is the Y combinator?

At its core, the Y combinator is a neat idea in lambda calculus. It shows how languages that do not “naturally” support recursion can still implement it. The Y combinator is itself a higher-order function: the language must treat functions as [first-class values](https://en.wikipedia.org/wiki/First-class_function)—they can be passed as arguments, returned from other functions, and stored in variables.

In practice, almost every language with first-class functions also has named recursion, but the Y combinator remains a great way to see what higher-order functions and lambda calculus can do.

## The problem: recursion without names

To see why the Y combinator exists, take something simple: the **factorial**. Usually we write it like this:

```javascript
function factorial(n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}
```

Easy, right? Here `factorial` calls itself by **name**. In pure lambda calculus, though, functions have **no** names—everything is an anonymous lambda. How can an anonymous function call itself if it has **nothing** to call?

That is the problem the Y combinator solves.

## Building the Y combinator step by step

This section follows Ionuț G. Stan’s post [Deriving the Y Combinator in 7 Easy Steps](http://igstan.ro/posts/2010-12-01-deriving-the-y-combinator-in-7-easy-steps.html). We will go from ordinary recursive style to the Y combinator.

### Step 1: Start with a simple factorial

```javascript
const factorial = (n) => n <= 1 ? 1 : n * factorial(n - 1);
```

This works, but it depends on the name `factorial`. We want to get rid of that dependency.

### Step 2: Pass the recursive function as an argument

The first idea: instead of calling `factorial` by name, pass “itself” in as a parameter:

```javascript
const factorialGen = (recurse) => (n) => n <= 1 ? 1 : n * recurse(n - 1);
```

Now `factorialGen` takes a `recurse` function and returns the factorial worker. But **who** supplies `recurse`?

### Step 3: Pass yourself to yourself

If we do not yet have a finished factorial to pass in, why not have the function **pass itself to itself**?

```javascript
const proto = (self) => (n) => n <= 1 ? 1 : n * self(self)(n - 1);

proto(proto)(5); // 120
```

Here `self(self)` reconstructs the factorial function. Each `self(self)` yields another “copy” of the function, and that continues until the base case `n <= 1` fires.

### Step 4: Pull `self(self)` out of the factorial logic

The step-3 code works but is a bit ugly: factorial logic is tangled with the `self(self)` plumbing. Split the two:

```javascript
const proto = (self) => {
    const recurse = (x) => self(self)(x);
    return (n) => n <= 1 ? 1 : n * recurse(n - 1);
};
```

### Step 5: Factor the factorial logic back out

We can lift the factorial body into its own function, like `factorialGen` in step 2:

```javascript
const factorialGen = (recurse) => (n) => n <= 1 ? 1 : n * recurse(n - 1);

const proto = (self) => {
    const recurse = (x) => self(self)(x);
    return factorialGen(recurse);
};

proto(proto)(5); // 120
```

### Step 6: Generalize to the Y combinator

Replace `factorialGen` with an arbitrary `F` and you get the general form:

```javascript
const Y = (F) => {
    const proto = (self) => {
        const recurse = (x) => self(self)(x);
        return F(recurse);
    };
    return proto(proto);
};
```

### Step 7: Write it in one line

Collapsed into idiomatic JavaScript, the Y combinator looks like this:

```javascript
const Y = (F) => ((f) => f(f))((f) => F((x) => f(f)(x)));
```

Staring at that pile of parentheses is a bit **mind-bending**, but if you walked through the steps above, you know what it is doing.

## Using the Y combinator

Now we can build recursive functions **without** binding a name:

```javascript
const Y = (F) => ((f) => f(f))((f) => F((x) => f(f)(x)));

const factorial = Y((recurse) => (n) => n <= 1 ? 1 : n * recurse(n - 1));

const fibonacci = Y((recurse) => (n) => n <= 1 ? n : recurse(n - 1) + recurse(n - 2));

console.log(factorial(5));   // 120
console.log(fibonacci(10));  // 55
```

You only describe the **recursive logic** (take `recurse`, return the worker); the Y combinator wires up the recursion. You can plug the same pattern into other recursive algorithms—GCD, binary search, and so on.

## Why it matters in theory

In pure lambda calculus, everything is an anonymous function. There are no globals, no `let`, no function names. The Y combinator shows that even in that minimal setting, **recursion is possible**. That matters for computability theory: it helps show lambda calculus is as powerful as a Turing machine ([Turing-complete](https://en.wikipedia.org/wiki/Turing_completeness)).

This is the kind of thing you can live without—but it will not kill you not to know it—yet it deepens your intuition for recursion and functional programming.

## Y Combinator (the company)

On a tangent, [Y Combinator](https://www.ycombinator.com/) is also a well-known **startup** accelerator. Founded in 2005 by Paul Graham, it has funded many household-name companies—Dropbox, Airbnb, Stripe, Reddit, among others. The name comes from the lambda-calculus Y combinator, perhaps suggesting startups “calling themselves” and growing in a recursive way.

# References

1. [Deriving the Y Combinator in 7 Easy Steps](http://igstan.ro/posts/2010-12-01-deriving-the-y-combinator-in-7-easy-steps.html), Ionuț G. Stan  
2. [The Y Combinator (no, not that one)](https://medium.com/@ayanonagon/the-y-combinator-no-not-that-one-7268d8d9c46), Ayaka Nonaka  
3. [Lambda calculus – Wikipedia](https://en.wikipedia.org/wiki/Lambda_calculus)  
4. [Fixed-point combinator – Wikipedia](https://en.wikipedia.org/wiki/Fixed-point_combinator)
