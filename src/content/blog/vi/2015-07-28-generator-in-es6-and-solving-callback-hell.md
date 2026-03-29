---
layout: post
title: "Generator trong ES6 và giải quyết callback hell"
date: 2015-07-18 3:45 AM
categories: [programming]
author: hungneox
description: "Generator trong ES6 là gì, cách dùng cơ bản và cách dùng cùng Promise để tránh callback hell."
image: /assets/posts/generator-in-es6-and-solving-callback-hell/ecmascript6.png
comments: true
---

![ECMAScript6](/assets/posts/generator-in-es6-and-solving-callback-hell/ecmascript6.png)

# 1. Generator là gì?

Nhìn chung, `Generator` là một object do hàm generator trả về, nó hoạt động giống một `Iterator`. Trong JavaScript, theo Mozilla:

> The Generator object is returned by a generator function and it conforms to both the iterator and the Iterable protocol.

Trong khi hàm bình thường trả về giá trị bằng từ khóa `return`, thì `Generator` dùng `yield` để mô tả một *quy tắc sinh giá trị* thay vì tính hết mọi thứ ngay từ đầu. Nói cách khác, đây là cách sinh giá trị theo kiểu trì hoãn (lazy).

Lợi ích rõ nhất là hiệu năng tốt hơn khi code được thực thi trì hoãn, và giúp chúng ta tổ chức mã nguồn rõ ràng hơn. Đây là tính năng mới trong ES6, nhưng ý tưởng tương tự đã có từ lâu ở các ngôn ngữ khác (ví dụ: Python, C#).

# 2. Cú pháp

Để khai báo generator function ta có thể dùng constructor `GeneratorFunction` và biểu thức `function*`

```javascript
function* name([param[, param[, ... param]]]) {
   statements
}
```
- `name`
   Tên hàm.
- `param`
   Tên tham số truyền vào hàm. Một hàm có thể có tối đa 255 tham số.
- `statements`
   Các câu lệnh trong thân hàm.

Ngoài ra, ta còn có thể dùng [`yield*`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*) để yield một generator khác, và lưu ý rằng:

> The next() method also accepts a value which can be used to modify the internal state of the generator. A value passed to next() will be treated as the result of the last yield expression that paused the generator.

# 3. Cách dùng `Generator`

## 3.1 Ví dụ đơn giản

Trong ví dụ đơn giản này, thay vì tạo một mảng chứa hết các số lẻ, ta chỉ cần tạo một `quy tắc` để sinh chúng.

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
## 3.2 "Callback hell" là gì và xử lý thế nào?

Trước hết, hãy xem **callback hell** hay **kim tự tháp thảm họa** (*pyramid of doom*)

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
Làm sao cải thiện chất lượng code hơn? Dùng `Promise` là một câu trả lời. Rõ ràng là đoạn mã trông gọn và dễ đọc hơn.

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
`Promise` (trong trường hợp này cụ thể là `jQuery Promise`) là cách hay để tránh callback hell. `Generator` còn có thể làm bước tiếp theo dễ đọc hơn nữa. Ví dụ dưới đây dùng [`bluebird`](https://github.com/petkaantonov/bluebird) với `Promise.coroutine` để trả về một hàm có thể `yield` từng promise.

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

# 4. Kết luận

`Generator` là tính năng mới trong ECMAScript 6 và là cách tiện để điều khiển hành vi lặp của vòng lặp. Ngoài ra, nó còn giúp xử lý callback hell trong mã hiện có. Kết hợp `Promise` và `Generator` hợp lý sẽ giúp bạn kiểm soát luồng bất đồng bộ tốt hơn và hạn chế callback hell. Cách dùng đúng còn giúp mã gọn và dễ theo dõi hơn so với chỉ dùng vòng lặp truyền thống.

Toàn bộ mã nguồn: [http://plnkr.co/edit/DFowxQiDYCmxzhm3RvVB?p=info](http://plnkr.co/edit/DFowxQiDYCmxzhm3RvVB?p=info)

# Tài liệu tham khảo

1. [Iterators and generators — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators)
2. [Generator function (`function*`) — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*)
3. [`yield` — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield)
4. [Using promises — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)
5. [`async function` — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
6. [`Promise.coroutine` — Bluebird](https://bluebirdjs.com/docs/api/promise.coroutine.html)
7. [Callbacks, promises, and generators (video)](https://www.youtube.com/watch?v=obaSQBBWZLk)
