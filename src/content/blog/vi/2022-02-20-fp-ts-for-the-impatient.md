---
layout: post
title: "fp-ts for the impatient"
date: 2022-02-20 18:28
categories: [typescript, functional programming]
author: hungneox
tags: [typescript, javascript, fp-ts, fp]
description: "An introduction to fp-ts for the impatient"
image: /assets/posts/fp-ts-for-the-impatient/white-rabbit.png
comments: true
published: true
---

!["Subtractive color"](/assets/posts/fp-ts-for-the-impatient/white-rabbit.png){: .center-image }

# Introduction

This post is an express tour for impatients who want to use [fp-ts](https://gcanti.github.io/fp-ts/). In this brief introduction, we don't go through the what is functional programming as well as its advantages/disadvantages.

You don’t really need to understand all mathematics concepts in order to learn functional programming. IMO, you only need to to know how each operator works. Once you get to know each basic operators in fp-ts, you can go back and review the mathematic theory.

# Practical guide to fp-ts

## Pipe, flow

### Pipe

In **fp-ts** pipe is a function, but in pure functional programming language (like Haskell) it’s an operator. Javascript also has a proposal for it (see [`Pipe Operator (|>) for JavaScript`](https://github.com/tc39/proposal-pipeline-operator))

It’s the basic building block of fp-ts, you can use [pipe](https://gcanti.github.io/fp-ts/modules/function.ts.html#pipe)() to chain the sequence of functions from left to right

Let’s look at this simple example:

```typescript
import { pipe } from "fp-ts/lib/function";

const add =
  (first: number) =>
  (second: number): number => {
    return first + second;
  };

const add1 = add(1);
const add3 = add(3);

pipe(1, add1, add3); // 5

// This is equivalent to this

add3(add1(1));
```

The result of this operation is `5`. It’s self-explanatory but we can look at these steps:

1. We start with the value of **`1`**.
2. **`1`** is piped into the first argument of `add1` and `add1` is evaluated to **`2`** by adding **`1`**.
3. The return value of `add1`, **`2`** is piped into the first argument `add3`  and is evaluated to `5` by adding `3`.

At this point, the pipe receives a number as input and output a new number, but we can also do something else like input a string from a number also.

```typescript
const meowify = (num: number): string => {
  return "meow ".repeat(num).trim();
};

pipe(1, add1, add3, meowify); // 'meow meow meow meow meow'
```

Notes that we cannot put the meowify function in between add1 and add3 function like this

```typescript
❌ pipe(1, add1, meowify, add3)
```

### Flow

The flow operator is very similar to pipe operator, the difference is the first argument of flow must be a function. For example, we can use the three functions above to form a flow like this:

```typescript
import { flow, pipe } from "fp-ts/lib/function";

flow(add1, add3, meowify)(1); // this is equivalent to pipe(1, add1, add3, meowify)

// Or we can use it like this

pipe(1, flow(add1, add3, meowify)); // 'meow meow meow meow meow'
```

In the example with `pipe` what if we don’t want to feed `1` as the input to the pipe? We probably have to do this:

```typescript
const meowify1 = (n: number) => pipe(n, flow(add1, add3, meowify)

// but with flow you don't need to

const meowify2 = flow(add1, add3, meowify)
```

Tip: If you have a long curried functions, you can use `ap` from Identity monad to apply all arguments

```typescript
import { ap } from "fp-ts/lib/Identity";

const makeUrl = (protocol: string) => (domain: string) => (port: number) => {
  return `${protocol}://${domain}:${port}`;
};

// ✅ right
pipe(makeUrl, ap("https"), ap("swappie.com"), ap(80)); // https://swappie.com:80

// Equivalent to

makeUrl("https")("swappie.com")(80);

// ❌ this doesn't work

pipe("https://", "swappie.com", 80, makeUrl);
```

## Option, Either

### Option

Options are containers, or specifically an Option is a monad (it's analogous to [Maybe monad in Haskell](https://en.wikibooks.org/wiki/Haskell/Understanding_monads/Maybe)), that wrap values that could be `truthy` or `falsy`. If the values are `truthy`, we say the `Option` is of `Some` type, and if the values are `falsy` (`undefined | null`) we say it has the `None` type.

```typescript
type Option<A> = None | Some<A>;
```

"Why should we use Option types in the first place?" You might ask. We already know that Typescript already has good ways to deal with **`undefined`** or **`null`** values. For example, we can use **[optional chaining](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#optional-chaining)** or **[nullish coalescing](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#nullish-coalescing)**.

The anwser is: mostly you won’t need to use Option, **optional chaining** can do it as well for you. However the Option type is more than just checking for **null**. Options can be used to represent failing operations, and most importantly you can chain them or in other words you can compose functions that return `Option` into a more complex one.

In most cases you probably don’t need Option, but let see these example to see some benefits of Option monad

```typescript
const findUrl = (array: string[]): string | undefined =>
  array.find((item) => item.startsWith("http"));

const makeA = (url: string | undefined): string =>
  url ? `<a href=${url}>${url}</a>` : "no link";

const parseLink = (array: string[]): string => makeA(findUrl(array));

// execute
const input = ["[", "google", "]", "(", "http://www.google.com", ")"];

console.log(parseLink(input)); // <a href=http://www.google.com>http://www.google.com</a>

console.log(parseLink([])); // no link
```

The code above can be converted to FP style

```typescript
import * as O from "fp-ts/lib/Option";

// O.fromNullable convert a non-nullable value to Some(value) and nullable
// to None

const findUrl = (array: string[]): O.Option<string> =>
  O.fromNullable(array.find((item) => item.startsWith("http")));

const makeA = (url: string): string => `<a href=${url}>${url}</a>`;

const parseLink = flow(
  findUrl,
  O.fold(() => "no link", makeA)
);

parseLink(input); // <a href=http://www.google.com>http://www.google.com</a>

parseLink([]); // no link
```

💡 Notes that you can **lift** a `nullable` value to an `Option` using `O.fromNullable`

### Either

An Either is a type that represents a *synchronous* operation that can succeed or fail. Much like Option, where it is **`Some`** or **`None`**, the Either type is either **`Right`** or **`Left`**. **`Right`** represents success and **`Left`** represents failure. It is analogous to the **[Result](https://doc.rust-lang.org/std/result/)** type in Rust.

This is one practical example of using fp-ts, specially `Either` for validating a password strength. For each individual functions below, I think they pretty self-explanatory excepts the last one `validatePassword`

```typescript
import * as E from "fp-ts/Either";
import * as F from "fp-ts/function";

const minxLength = (s: string): E.Either<Error, string> => {
  return s.length < 8 ? E.left(new Error("Password is too short")) : E.right(s);
};

const oneCapital = (s: string): E.Either<Error, string> =>
  /[A-Z]/g.test(s)
    ? E.right(s)
    : E.left(new Error("at least one capital letter"));

const oneNumber = (s: string): E.Either<Error, string> =>
  /[0-9]/g.test(s) ? E.right(s) : E.left(new Error("at least one number"));

// This also works
// F.pipe(minLength(s), E.chain(oneCapital), E.chain(oneNumber));

const validatePassword = (s: string): E.Either<Error, string> =>
  F.pipe(s, minLength, E.chain(oneCapital), E.chain(oneNumber));

// validatePassword('123456'); // Error: at least one capital letter
// validatePassword('salaSANA123'); // salaSANA123
```

We can looks at the break-down steps of `validatePassword` as follow:

Let's take this happy path example `validatePassword('salaSANA123')`

1. We will start with input `salaSANA123` is passed to `minLength`
   1.1 It will be evaluated to a `Either` value that contains a right value `salaSANA123`
2. The return value of `minLength('salaSANA123')` value will be piped to `E.chain(oneCapital)`

   2.1 `E.chain` will unwrap the `E.right('salaSANA123')` to `'salaSANA123'` value and passes it to `oneCapital`.

   2.2 `oneCapital('salaSANA123')` will evaluate the string and returns `E.right('salaSANA123')`.

3. Again, the return value of `oneCapital('salaSANA123')` will be piped to `E.chain(oneNumber)`
   3.1 `E.chain` will unwrap the `E.right('salaSANA123')` to `'salaSANA123'` value and passes it to `oneNumber`

   3.2 `oneNumber('salaSANA123')` will evaluate the string and returns `E.right('salaSANA123')`

In any situation that one of the three function returns `E.left(new Error('...'))` the `left` value is returned immediately

💡 And just like how you can lift `nullable` into an Option, you can also lift an `Option` into another fp-ts container, like `Either`.

```tsx
const minLength = (s: string): O.Option<string> =>
  s.length >= 6 ? O.some(s) : O.none;

...

const validatePassword = (s: string): Either<Error, string> =>
  pipe(
    minLength(s),
    E.fromOption(() => new Error("at least 6 characters")), //
    chain(oneCapital),
    chain(oneNumber)
  );
```

## Task, TaskEither

### Task

In `fp-ts`, a `Task` is basically a js `Promise`, this is the definition of `Task`.

```typescript
interface Task<A> {
  (): Promise<A>;
}
```

From the docs

> `Task<A>`
>  represents an asynchronous computation that yields a value of type `A`
>  and **never fails**. If you want to represent an asynchronous computation that may fail, please see `TaskEither`.

### TaskEither

Basically `TaskEither` = `Task` + `Either`, so with `TaskEither` you can have a `Task` that may fail.

```tsx
import axios, { AxiosResponse } from "axios";
import * as F from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";

type ToDo = {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
};

const safeGet = (url: string): TE.TaskEither<Error, AxiosResponse> =>
  TE.tryCatch(() => axios.get(url), E.toError);

const fetchTodo = (id: number): TE.TaskEither<string, ToDo> =>
  F.pipe(
    safeGet(`https://jsonplaceholder.typicode.com/todos/${id}`),
    TE.fold(
      (e: Error) => T.of(e.message),
      (a: AxiosResponse) => T.of(a.data)
    )
  );

const main = async () => {
  const resp = await fetchTodo(1)();
  // { userId: 1, id: 1, title: 'delectus aut autem', completed: false }
  console.log(resp);

  const resp1 = await fetchTodo(3)();
  // { userId: 1, id: 3, title: 'fugiat veniam minus', completed: false }
  console.log(resp1);

  const resp2 = await fetchTodo(0)();
  // Request failed with status code 404
  console.log(resp2);
};

main();
```

The `TE.fold` function is actually very simple, it accepts two functions (`onLeft`, `onRight`) and it will call `onLeft` on `left` value and `onRight` on `right` value, depends on the previous value from the pipe.

## Do Notation

From the docs

> Both [Haskell](https://wiki.haskell.org/Monad#do-notation) and [PureScript](https://github.com/purescript/documentation/blob/master/language/Syntax.md#do-notation) languages provide syntactic sugar for working with monads in the form of do notation.
>
> `fp-ts` provides it’s own implementation of do notation which can help to simplify effectful code.

You can read about the "official" explanation and example from fp-ts ([see this](https://gcanti.github.io/fp-ts/guides/do-notation.html)) about do notation in fp-ts

Generally speaking, "do notation" allows you bind previous returned values from other functions in the pipe to a context object. Without do notation it's very hard to maintain the variable scope, since you either to pass it along as intermediate result or go deep into nested pipe.

```tsx
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";
const createUser = (username: string): TE.TaskEither<Error, string> => {
  return TE.right(`UserId-${username}`);
};

const createOrder = (userId: string): TE.TaskEither<Error, string> => {
  return TE.right(`Order-${userId}`);
};

const createOrderRow = (
  orderId: string,
  userId: string
): TE.TaskEither<Error, string> => {
  return TE.right(`OrderRowFor-${orderId}-${userId}`);
};

// This will return something like
// {
//   _tag: 'Right',
//   right: {
//     userId: 'UserIdRick',
//     orderId: 'Order123456-UserIdRick',
//     orderRowId: 'OrderRowFor-UserIdRick-Order123456-UserIdRick'
//   }
// }
const main = pipe(
  TE.Do,
  TE.bind("userId", () => createUser("Rick")),
  TE.bind("orderId", ({ userId }) => createOrder(userId)),
  TE.bind("orderRowId", ({ userId, orderId }) =>
    createOrderRow(userId, orderId)
  ),
  TE.map(({ userId, orderId, orderRowId }) => ({
    userId,
    orderId,
    orderRowId,
  }))
);
```
