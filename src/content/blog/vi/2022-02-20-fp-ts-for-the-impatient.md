---
layout: post
title: "fp-ts cho người thiếu kiên nhẫn"
date: 2022-02-20 18:28
categories: [programming]
author: hungneox
description: "Giới thiệu nhanh fp-ts: pipe, flow, Option, Either, Task và do notation."
image: /assets/posts/fp-ts-for-the-impatient/white-rabbit.png
comments: true
published: true
---

!["Màu trừ (subtractive color)"](/assets/posts/fp-ts-for-the-impatient/white-rabbit.png)

# Giới thiệu

Bài này là một vòng nhanh dành cho những ai muốn dùng [fp-ts](https://gcanti.github.io/fp-ts/) mà không chờ đợi lâu. Trong phần giới thiệu ngắn này, chúng ta **không** đi qua khái niệm lập trình hàm là gì cũng như ưu/nhược điểm của nó.

Bạn **không** cần nắm hết các khái niệm toán học để học lập trình hàm. Theo quan điểm cá nhân, bạn chỉ cần biết **từng toán tử / hành vi** hoạt động thế nào. Khi đã quen các thành phần cơ bản trong fp-ts, bạn có thể quay lại đọc lý thuyết toán học sau.

# Hướng dẫn thực hành fp-ts

## Pipe, flow

### Pipe

Trong **fp-ts**, `pipe` là một **hàm**, nhưng trong ngôn lập trình hàm thuần (ví dụ Haskell) nó là **toán tử**. JavaScript cũng có đề xuất tương tự (xem [`Pipe Operator (|>) for JavaScript`](https://github.com/tc39/proposal-pipeline-operator)).

Đây là khối xây dựng cơ bản của fp-ts: bạn dùng [pipe](https://gcanti.github.io/fp-ts/modules/function.ts.html#pipe)() để **xâu chuỗi** các hàm theo thứ tự **từ trái sang phải**.

Xem ví dụ đơn giản sau:

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

// Tương đương với

add3(add1(1));
```

Kết quả của phép toán là `5`. Khá trực quan, nhưng ta có thể tách các bước:

1. Bắt đầu với giá trị **`1`**.
2. **`1`** được đưa vào **tham số thứ nhất** của `add1`; `add1` được tính thành **`2`** (bằng cách cộng **`1`**).
3. Giá trị trả về của `add1`, **`2`**, được đưa vào tham số đầu của `add3` và được tính thành `5` (bằng cách cộng `3`).

Ở đây `pipe` nhận **số** vào và trả ra **số** mới; ta cũng có thể chuyển tiếp sang kiểu khác, ví dụ từ số sang chuỗi:

```typescript
const meowify = (num: number): string => {
  return "meow ".repeat(num).trim();
};

pipe(1, add1, add3, meowify); // 'meow meow meow meow meow'
```

**Lưu ý:** ta **không** thể đặt `meowify` **giữa** `add1` và `add3` như sau:

```typescript
❌ pipe(1, add1, meowify, add3)
```

### Flow

`flow` rất giống `pipe`; điểm khác là **đối số đầu tiên** của `flow` phải là một **hàm**. Ví dụ, có thể ghép ba hàm trên thành một `flow` như sau:

```typescript
import { flow, pipe } from "fp-ts/lib/function";

flow(add1, add3, meowify)(1); // tương đương pipe(1, add1, add3, meowify)

// Hoặc dùng như sau

pipe(1, flow(add1, add3, meowify)); // 'meow meow meow meow meow'
```

Trong ví dụ với `pipe`, nếu **không** muốn đưa `1` trực tiếp vào `pipe` thì có thể phải viết kiểu:

```typescript
const meowify1 = (n: number) => pipe(n, flow(add1, add3, meowify));

// còn với flow thì không cần

const meowify2 = flow(add1, add3, meowify);
```

**Mẹo:** Nếu có chuỗi hàm curried dài, có thể dùng `ap` từ monad Identity để áp từng đối số:

```typescript
import { ap } from "fp-ts/lib/Identity";

const makeUrl = (protocol: string) => (domain: string) => (port: number) => {
  return `${protocol}://${domain}:${port}`;
};

// ✅ đúng
pipe(makeUrl, ap("https"), ap("swappie.com"), ap(80)); // https://swappie.com:80

// Tương đương

makeUrl("https")("swappie.com")(80);

// ❌ không chạy

pipe("https://", "swappie.com", 80, makeUrl);
```

## Option, Either

### Option

`Option` là các **container**, cụ thể `Option` là một **monad** (tương tự [Maybe trong Haskell](https://en.wikibooks.org/wiki/Haskell/Understanding_monads/Maybe)), bọc giá trị có thể **có** hoặc **không** (truthy / falsy). Nếu có giá trị “hợp lệ”, ta nói `Option` là **`Some`**; nếu không (`undefined | null`), ta nói là **`None`**.

```typescript
type Option<A> = None | Some<A>;
```

“Vậy tại sao phải dùng Option?” — TypeScript đã có cách xử lý **`undefined`** / **`null`** khá tốt, ví dụ **[optional chaining](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#optional-chaining)** hay **[nullish coalescing](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#nullish-coalescing)**.

**Trả lời ngắn:** đa số trường hợp bạn **không bắt buộc** dùng Option; **optional chaining** cũng đủ. Nhưng `Option` **không chỉ** là kiểm tra **null**: nó biểu diễn được **thao tác thất bại**, và quan trọng nhất là **xâu chuỗi** — tức **compose** các hàm trả về `Option` thành luồng phức tạp hơn.

Thường thì không cần Option, nhưng xem ví dụ sau để thấy lợi ích của monad Option:

```typescript
const findUrl = (array: string[]): string | undefined =>
  array.find((item) => item.startsWith("http"));

const makeA = (url: string | undefined): string =>
  url ? `<a href=${url}>${url}</a>` : "no link";

const parseLink = (array: string[]): string => makeA(findUrl(array));

// chạy thử
const input = ["[", "google", "]", "(", "http://www.google.com", ")"];

console.log(parseLink(input)); // <a href=http://www.google.com>http://www.google.com</a>

console.log(parseLink([])); // no link
```

Đoạn trên có thể chuyển sang phong cách FP:

```typescript
import * as O from "fp-ts/lib/Option";

// O.fromNullable: giá trị không null/undefined -> Some(value), còn lại -> None

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

💡 **Lưu ý:** có thể **lift** giá trị `nullable` lên `Option` bằng `O.fromNullable`.

### Either

`Either` biểu diễn thao tác **đồng bộ** có thể **thành công** hoặc **thất bại**. Giống `Option` với **`Some`** / **`None`**, `Either` là **`Right`** hoặc **`Left`**: **`Right`** là thành công, **`Left`** là lỗi. Khá giống kiểu **[Result](https://doc.rust-lang.org/std/result/)** trong Rust.

Ví dụ thực tế: dùng `Either` để **kiểm tra độ mạnh mật khẩu**. Các hàm riêng lẻ khá rõ ràng; phần cần để ý là `validatePassword`:

```typescript
import * as E from "fp-ts/Either";
import * as F from "fp-ts/function";

const minLength = (s: string): E.Either<Error, string> => {
  return s.length < 8 ? E.left(new Error("Password is too short")) : E.right(s);
};

const oneCapital = (s: string): E.Either<Error, string> =>
  /[A-Z]/g.test(s)
    ? E.right(s)
    : E.left(new Error("at least one capital letter"));

const oneNumber = (s: string): E.Either<Error, string> =>
  /[0-9]/g.test(s) ? E.right(s) : E.left(new Error("at least one number"));

// Cách này cũng được:
// F.pipe(minLength(s), E.chain(oneCapital), E.chain(oneNumber));

const validatePassword = (s: string): E.Either<Error, string> =>
  F.pipe(s, minLength, E.chain(oneCapital), E.chain(oneNumber));

// validatePassword('123456'); // Error: at least one capital letter
// validatePassword('salaSANA123'); // salaSANA123
```

Có thể tách từng bước của `validatePassword` như sau — lấy **happy path** `validatePassword('salaSANA123')`:

1. Đầu vào `salaSANA123` được đưa vào `minLength`.
   1.1 Kết quả là `Either` dạng `right` chứa `salaSANA123`.
2. Giá trị trả về của `minLength('salaSANA123')` được đưa tiếp vào `E.chain(oneCapital)`.

   2.1 `E.chain` “mở” `E.right('salaSANA123')` thành chuỗi `'salaSANA123'` rồi gọi `oneCapital`.

   2.2 `oneCapital('salaSANA123')` trả về `E.right('salaSANA123')`.

3. Tương tự, kết quả được đưa vào `E.chain(oneNumber)`.
   3.1 `E.chain` mở `E.right('salaSANA123')` và gọi `oneNumber`.

   3.2 `oneNumber('salaSANA123')` trả về `E.right('salaSANA123')`.

Nếu **bất kỳ** hàm nào trong ba hàm trả về `E.left(new Error('...'))` thì giá trị `left` được trả về **ngay**.

💡 Cũng giống việc lift `nullable` lên `Option`, bạn có thể đưa `Option` sang container fp-ts khác, ví dụ `Either`:

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

Trong `fp-ts`, `Task` về cơ bản giống `Promise` trong JavaScript — đây là định nghĩa:

```typescript
interface Task<A> {
  (): Promise<A>;
}
```

Trong tài liệu:

> `Task<A>` biểu diễn một tính toán **bất đồng bộ** cho ra giá trị kiểu `A` và **không bao giờ thất bại**. Muốn biểu diễn tính toán bất đồng bộ **có thể lỗi**, xem `TaskEither`.

### TaskEither

Về cơ bản `TaskEither` = `Task` + `Either`, nên bạn có `Task` **có thể thất bại**.

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

Hàm `TE.fold` khá đơn giản: nhận hai hàm (`onLeft`, `onRight`) — gọi `onLeft` khi là `left`, `onRight` khi là `right`, tùy giá trị trước đó trong `pipe`.

## Do notation

Trích tài liệu:

> Cả [Haskell](https://wiki.haskell.org/Monad#do-notation) và [PureScript](https://github.com/purescript/documentation/blob/master/language/Syntax.md#do-notation) đều có **cú pháp đặc biệt** (*syntactic sugar*) cho monad dưới dạng do notation.
>
> `fp-ts` có **implementation** do notation riêng, giúp đơn giản hóa code có **effect**.

Phần giải thích và ví dụ “chính thức” về do notation trong fp-ts: [tài liệu fp-ts](https://gcanti.github.io/fp-ts/guides/do-notation.html).

Nói chung, “do notation” cho phép **gắn** các giá trị trả về từ các bước trong `pipe` vào một **đối tượng ngữ cảnh** (context object). Không có do notation thì khó giữ phạm vi biến: hoặc phải truyền kết quả trung gian, hoặc lồng `pipe` sâu.

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

// Kết quả kiểu như:
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
