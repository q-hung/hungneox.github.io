---
layout: post
title: "Generator in ES6 and solving callback hell"
date: 2015-07-18 3:45 AM
categories: [programming]
author: hungneox
description: What is Generator in ES6, its basic usage and how to use it to solve callback hell?
image: /assets/posts/generator-in-es6-and-solving-callback-hell/ecmascript6.png
comments: true
---

![ECMAScript6](/assets/posts/generator-in-es6-and-solving-callback-hell/ecmascript6.png)

# 1. What is `Generator`?

Generally, a `Generator` is an object returned by a generator function; it behaves like an `Iterator`. In JavaScript, according to Mozilla:

>The Generator object is returned by a generator function and it conforms to both the iterator and the Iterable protocol.

While a normal function returns a value with the `return` keyword, a `Generator` uses `yield` to describe a *rule for producing values* rather than computing everything up front. In other words, it is a lazy way to generate values.

The obvious benefit is better performance when lazy generation helps, and it helps us organize source code more clearly. This is new in ES6, but the same idea has been around for a long time in other languages (e.g. Python, C#).

# 2. Syntax

To define a generator function we can use `GeneratorFunction` constructor and `function* expression` 

```javascript
function* name([param[, param[, ... param]]]) {
   statements
}
```
- `name`
   The function name.
- `param`
   The name of an argument to be passed to the function. A function can have up to 255 arguments.
- `statements`
   The statements comprising the body of the function.

Futhermore, we can also using [`yield*](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*)` to yield another generator, and note that:

>The next() method also accepts a value which can be used to modify the internal state of the generator. A value passed to next() will be treated as the result of the last yield expression that paused the generator.

# 3. Generator usage

## 3.1 Simple example

In this simple example, instead of creating an array to store all odd numbers, we just simply create `a rule` for generating them.

```javascript
function* oddNumberGenerator(){
   var i = 0;
   while(true){
      yield (i!==0) ? i+=2 : i+=1;
   }
}

var gen = oddNumberGenerator();
console.log(gen.next().value); // 1
console.log(gen.next().value); // 3
console.log(gen.next().value); // 5
console.log(gen.next().value); // 7
```
## 3.2 What is "callback hell" and how to solve it?

First, let's take a look at this **callback hell** or **pyramid of doom**

```javascript
var $status = $('#status');

$.ajax({
  type: 'GET',
  url: 'categories.json', //GETting a JSON file acts just like hitting an API
  success: function(categories) {
    $status.append('<li>Got categories</li>');
    $('#categories-pre').html(JSON.stringify(categories));
    $.ajax({
      type: 'GET',
      url: 'authors.json'
      success: function(authors) {
        $status.append('<li>Got authors</li>');
        $('#authors-pre').html(JSON.stringify(authors));
        $.ajax({
          type: 'GET',
          url: 'books',
          success: function(books) {
            $status.append('<li>Got books</li>');
            $('#books-pre').html(JSON.stringify(books));
          },
          error: function(xhr, status, error) {
            $status.append('<li>error:'+error.toString()+'</li>');
          }
        });
      },
      error: function(xhr, status, error) {
        $status.append('<li>error:'+error.toString()+'</li>');
      }
    });
    
  },
  error: function(xhr, status, error) {
    $status.append('<li>error:'+error.toString()+'</li>');
  }
});
```
How can we make it better? Using `Promise` is an answer. Obviously, the code looks more tidy and easy to read.

```javascript
var $status = $('#status');
$.get('categories.json').then(function(categories){
   $('#categories-pre').html(JSON.Stringify(categories));
   return $.get('authors.json');
}).then(function(authors){
   $('#authors-pre').html(JSON.Stringify(authors));
   return $.get('books.json');
}).then(function(books){
   $('#books-pre').html(JSON.Stringify(books));
}, errorHandler);

function errorHandler(xhr, status, error){
   $status.append('<li>error:'+error.toString()+'</li>');
}
```
`Promise` (technically in this case: `jQuery Promise`) is a good way to prevent callback hell. But you know what? `Generator` is more awesome. This example below uses [bluebird](https://github.com/petkaantonov/bluebird) `Promise.coroutine` to return a function that can use `yield` to yield promise.

```javascript
var $status = $('#status');

Promise.coroutine(function* () {

  var categories = yield $.get('categories.json');
  $status.append('<li>Got categories</li>');
  $('#categories-pre').html(JSON.stringify(categories));
  
  var authors = yield $.get('authors.json');
  $status.append('<li>Got authors</li>');
  $('#authors-pre').html(JSON.stringify(authors));
  
  var books = yield $.get('books.json');
  $status.append('<li>Got books</li>');
  $('#books-pre').html(JSON.stringify(books));

})().catch(function(errs) {
  //handle errors on any events
})
```

**Note (ES2017+):** `async`/`await` is built-in syntax for the same idea—sequential async code that reads like straight-line control flow. In 2015, helpers such as Bluebird’s `Promise.coroutine` were an important bridge until that landed in the language.

# 4. Conlusion
`Generator` is a new feature in ECMAScript 6 and it is a convenient way to control iteration behavior of a loop. Moreover, it also help to solve the callback hell in your existing code. Combine `Promise` and `Generator` effectively can help you control the asynchronous flow better and preventing callback hell in your code. It is more powerful and useful than just only make your code more concise and tidy. Using it wisely can aslo help you to improve your code performance compare to tradditional `loop`.

Full code is here: [http://plnkr.co/edit/DFowxQiDYCmxzhm3RvVB?p=info](http://plnkr.co/edit/DFowxQiDYCmxzhm3RvVB?p=info)

# References

1. [Iterators and generators — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators)
2. [Generator function (`function*`) — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*)
3. [`yield` — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield)
4. [Using promises — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)
5. [`async function` — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
6. [`Promise.coroutine` — Bluebird](https://bluebirdjs.com/docs/api/promise.coroutine.html)
7. [Callbacks, promises, and generators (video)](https://www.youtube.com/watch?v=obaSQBBWZLk)
