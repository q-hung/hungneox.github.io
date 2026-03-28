---
layout: post
title: "Y-Combinator trong Lambda Calculus"
date: 2017-10-23 16:00
categories: [programming]
author: hungneox
description: "Y-Combinator là gì và tại sao nó thú vị"
image: /assets/images/placeholder.jpg
comments: true
published: true
---

# Giới thiệu

TLDR; Y Combinator là một hàm bậc cao (higher-order function) trong [lambda calculus](https://en.wikipedia.org/wiki/Lambda_calculus) cho phép chúng ta thực hiện đệ quy mà không cần đặt tên cho hàm. Nói đơn giản thì nó là một "mẹo" để một hàm ẩn danh (anonymous function) có thể gọi lại chính nó.

## Y Combinator là gì?

Về cơ bản thì Y Combinator là một khái niệm khá thú vị trong lambda calculus. Nó cho phép các ngôn ngữ lập trình không hỗ trợ đệ quy một cách tự nhiên vẫn có thể thực hiện đệ quy. Y Combinator thực chất là một hàm bậc cao (`higher-order function`), và nó yêu cầu ngôn ngữ phải coi hàm như là [công dân hạng nhất](https://en.wikipedia.org/wiki/First-class_function) (first-class citizen), nghĩa là hàm có thể được truyền như tham số, trả về từ hàm khác, và gán vào biến.

Trong thực tế thì hầu như không có ngôn ngữ nào hỗ trợ first-class function mà lại không hỗ trợ đệ quy, nhưng Y Combinator vẫn là một ví dụ tuyệt vời để hiểu sức mạnh của hàm bậc cao và lambda calculus nói chung.

## Vấn đề: Đệ quy với hàm ẩn danh

Để hiểu tại sao Y Combinator tồn tại, chúng ta hãy xem xét một vấn đề đơn giản: tính giai thừa (factorial). Bình thường thì ai cũng viết đệ quy như thế này:

```javascript
function factorial(n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}
```

Dễ thôi đúng không? Nhưng ở đây hàm `factorial` gọi lại chính nó bằng **tên** của nó. Vấn đề là trong lambda calculus thuần túy, hàm không có tên. Tất cả đều là hàm ẩn danh (anonymous function hay lambda). Vậy làm thế nào để một hàm ẩn danh có thể gọi lại chính nó khi nó chẳng có tên gì để mà gọi?

Đây chính là bài toán mà Y Combinator giải quyết.

## Từng bước xây dựng Y Combinator

Phần này dựa theo bài viết [Deriving the Y Combinator in 7 Easy Steps](http://igstan.ro/posts/2010-12-01-deriving-the-y-combinator-in-7-easy-steps.html) của Ionuț G. Stan. Chúng ta sẽ đi từ cách viết đệ quy thông thường đến Y Combinator.

### Bước 1: Bắt đầu với hàm factorial đơn giản

```javascript
const factorial = (n) => n <= 1 ? 1 : n * factorial(n - 1);
```

Hàm này hoạt động tốt, nhưng nó phụ thuộc vào cái tên `factorial`. Mục tiêu của chúng ta là loại bỏ sự phụ thuộc này.

### Bước 2: Truyền hàm đệ quy như tham số

Ý tưởng đầu tiên là thay vì gọi `factorial` trực tiếp, chúng ta truyền "chính nó" vào như một tham số:

```javascript
const factorialGen = (recurse) => (n) => n <= 1 ? 1 : n * recurse(n - 1);
```

Bây giờ `factorialGen` là một hàm nhận vào tham số `recurse` (hàm dùng để đệ quy) và trả về hàm tính factorial. Nhưng vấn đề là ai sẽ cung cấp hàm `recurse` cho nó?

### Bước 3: Tự truyền chính mình

Nói chung là nếu chúng ta chưa có hàm factorial hoàn chỉnh để truyền vào, thì sao không thử cho hàm **tự truyền chính nó** vào?

```javascript
const proto = (self) => (n) => n <= 1 ? 1 : n * self(self)(n - 1);

proto(proto)(5); // 120
```

Ở đây `self(self)` tạo ra lại chính hàm factorial. Mỗi lần gọi `self(self)` chúng ta lại tạo ra một "phiên bản" mới của hàm, và cứ thế tiếp tục cho đến khi điều kiện dừng `n <= 1` được thỏa mãn.

### Bước 4: Tách phần self(self) ra ngoài

Code ở bước 3 hoạt động nhưng hơi "xấu" vì logic factorial bị trộn lẫn với cơ chế đệ quy `self(self)`. Chúng ta muốn tách hai phần này ra:

```javascript
const proto = (self) => {
    const recurse = (x) => self(self)(x);
    return (n) => n <= 1 ? 1 : n * recurse(n - 1);
};
```

### Bước 5: Trích xuất logic factorial ra ngoài

Bây giờ chúng ta có thể đưa logic factorial ra thành một hàm riêng, đúng như `factorialGen` ở bước 2:

```javascript
const factorialGen = (recurse) => (n) => n <= 1 ? 1 : n * recurse(n - 1);

const proto = (self) => {
    const recurse = (x) => self(self)(x);
    return factorialGen(recurse);
};

proto(proto)(5); // 120
```

### Bước 6: Tổng quát hóa thành Y Combinator

Nếu chúng ta thay `factorialGen` bằng một tham số `F` bất kỳ, thì chúng ta có được một hàm tổng quát:

```javascript
const Y = (F) => {
    const proto = (self) => {
        const recurse = (x) => self(self)(x);
        return F(recurse);
    };
    return proto(proto);
};
```

### Bước 7: Viết gọn lại

Rút gọn lại cho đẹp, chúng ta có Y Combinator trong JavaScript:

```javascript
const Y = (F) => ((f) => f(f))((f) => F((x) => f(f)(x)));
```

Nói chung nhìn vào cái đống ngoặc này thì hơi "hack não", nhưng nếu bạn đã đi qua từng bước ở trên thì sẽ hiểu nó làm gì.

## Sử dụng Y Combinator

Bây giờ chúng ta có thể tạo hàm đệ quy mà không cần đặt tên:

```javascript
const Y = (F) => ((f) => f(f))((f) => F((x) => f(f)(x)));

const factorial = Y((recurse) => (n) => n <= 1 ? 1 : n * recurse(n - 1));

const fibonacci = Y((recurse) => (n) => n <= 1 ? n : recurse(n - 1) + recurse(n - 2));

console.log(factorial(5));   // 120
console.log(fibonacci(10));  // 55
```

Chúng ta chỉ cần mô tả **logic** của hàm đệ quy (nhận `recurse` và trả về hàm thực thi), còn Y Combinator sẽ lo phần "nối dây" cho cơ chế đệ quy. Ngoài ra chúng ta cũng có thể áp dụng Y Combinator cho bất kỳ hàm đệ quy nào khác, ví dụ tìm ước chung lớn nhất (GCD), tìm kiếm nhị phân vân vân và mây mây.

## Ý nghĩa trong lý thuyết

Trong lambda calculus thuần tuý, mọi thứ đều là hàm ẩn danh. Không có biến toàn cục, không có `let`, không có tên hàm. Y Combinator chứng minh rằng ngay cả trong một hệ thống tối giản như vậy, chúng ta vẫn có thể thực hiện đệ quy. Điều này có ý nghĩa quan trọng trong lý thuyết tính toán vì nó chứng minh rằng lambda calculus có khả năng tính toán tương đương với máy Turing ([Turing complete](https://en.wikipedia.org/wiki/Turing_completeness)).

Nói chung là Y Combinator thuộc dạng kiến thức "biết thì hay mà không biết cũng chẳng chết ai", nhưng nó giúp chúng ta hiểu sâu hơn về bản chất của đệ quy và lập trình hàm (functional programming).

## Y Combinator (công ty)

Ngoài lề một chút, [Y Combinator](https://www.ycombinator.com/) cũng là tên một công ty nổi tiếng trong giới khởi nghiệp (startup). Được thành lập năm 2005 bởi Paul Graham, công ty này đã đầu tư và ươm mầm cho nhiều startup đình đám như Dropbox, Airbnb, Stripe, Reddit vân vân. Tên công ty được đặt theo Y Combinator trong lambda calculus, có lẽ vì ý tưởng rằng công ty giúp các startup "gọi lại chính mình" và phát triển một cách đệ quy.

# Tham khảo

1. [Deriving the Y Combinator in 7 Easy Steps](http://igstan.ro/posts/2010-12-01-deriving-the-y-combinator-in-7-easy-steps.html), Ionuț G. Stan
2. [The Y Combinator (no, not that one)](https://medium.com/@ayanonagon/the-y-combinator-no-not-that-one-7268d8d9c46), Ayaka Nonaka
3. [Lambda calculus - Wikipedia](https://en.wikipedia.org/wiki/Lambda_calculus)
4. [Fixed-point combinator - Wikipedia](https://en.wikipedia.org/wiki/Fixed-point_combinator)




