---
layout: post
title: "Generator in ES6 and solving callback hell"
date: 2015-07-18 3:45 AM
categories: [javascript, en]
author: hungneox
tags : [javascript, es6, generator, asynchronous, callback]
description: What is Generator in ES6, its basic usage and how to use it to solve callback hell?
image: /assets/posts/generator-in-es6-and-solving-callback-hell/ecmascript6.png
comments: true
---

![ECMAScript6](/assets/posts/generator-in-es6-and-solving-callback-hell/ecmascript6.png)

# 1. What is `Generator`?

Generally, `Generator` is a object returned by a generator function that behaves like an `Iterator`. In Javascript, according to Mozilla:

>The Generator object is returned by a generator function and it conforms to both the iterator and the Iterable protocol.

While a normal function will return a value using `return` keyword, `Generator` uses `yield` keyword to generate a *rule to create values* rather than the actual values. In other words, it is the lazily way to generate values.

The obvious benefit of `Generator` is improving the performance and help us to organize source code better. This is a new feature in ES6, but it has been implemented in other languages (e.g.Python, C# etc) for a long time.

# 2. Syntax

To define a generator function we can use `GeneratorFunction` constructor and `function* expression` 

{% highlight javascript %}
function* name([param[, param[, ... param]]]) {
   statements
}
{% endhighlight %}

- `name`
   The function name.
- `param`
   The name of an argument to be passed to the function. A function can have up to 255 arguments.
- `statements`
   The statements comprising the body of the function.

Futhermore, we can also using [`yield*](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*)` to yield another generator, and note that:

>The next() method also accepts a value which can be used to modify the internal state of the generator. A value passed to next() will be treated as the result of the last yield expression that paused the generator.

# 3. `Generator` usage

## 3.1 Simple example

In this simple example, instead of creating an array to store all odd numbers, we just simply create `a rule` for generating them.

{% highlight javascript %}
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
{% endhighlight %}

## 3.2 What is `callback hell` and how to solve it?

First, let's take a look at this **callback hell** or **pyramid of doom**

{% highlight javascript %}
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
{% endhighlight %}
How can we make it better? Using `Promise` is an answer. Obviously, the code looks more tidy and easy to read.

{% highlight javascript %}
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
{% endhighlight %}

`Promise` (technically in this case: `jQuery Promise`) is a good way to prevent callback hell. But you know what? `Generator` is more awesome. This example below uses [bluebird](https://github.com/petkaantonov/bluebird) `Promise.coroutine` to return a function that can use `yield` to yield promise.

{% highlight javascript %}
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
{% endhighlight %}

# 4. Conlusion
`Generator` is a new feature in ECMAScript 6 and it is a convenient way to control iteration behavior of a loop. Moreover, it also help to solve the callback hell in your existing code. Combine `Promise` and `Generator` effectively can help you control the asynchronous flow better and preventing callback hell in your code. It is more powerful and useful than just only make your code more concise and tidy. Using it wisely can aslo help you to improve your code performance compare to tradditional `loop`.

Full code is here: [http://plnkr.co/edit/DFowxQiDYCmxzhm3RvVB?p=info](http://plnkr.co/edit/DFowxQiDYCmxzhm3RvVB?p=info)

# References
1. [Mozilla Developer Network: Iterators and generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators)

2. [Mozilla Developer Network: function&#42;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*)

3. [Are you bad, good, better or best with Async JS? JS Tutorial: Callbacks, Promises, Generators](https://www.youtube.com/watch?v=obaSQBBWZLk)
