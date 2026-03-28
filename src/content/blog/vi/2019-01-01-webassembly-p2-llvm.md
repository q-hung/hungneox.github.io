---
layout: post
title: "WebAssembly - Phần 2: LLVM" 
date: 2019-01-01 7:10
categories: [webassembly, rust]
author: hungneox
tags : [webassembly, rust, guide]
description: "LLVM và WebAssembly"
image: /assets/posts/webassembly/webassembly-illustration.png
comments: true
published: true
---
# Giới thiệu sơ lược

Tiếp theo phần trước [WebAssembly](/vi/blog/2018-08-06-webassembly-p1-gioi-thieu), bài viết này sẽ giới thiệu về mối quan hệ giữa LLVM và WebAssembly, cũng như làm một số thử nghiệm để dịch [Rust](https://blog.rust-lang.org/2016/12/22/Rust-1.14.html) và C sang WebAssembly sử dụng Emscripten.

# WebAssembly - LLVM - Emscripten

## LLVM

LLVM là một `compiler framework`, nói ngắn gọn là một framework để xây dựng nên trình biên dịch của một ngôn ngữ lập trình. Nó cung cấp những công cụ mạnh mẽ để xây dựng phần front-end (parser, lexer) cũng như phần backend (phần chuyển phần code trung gian LLVM sang mã máy), cho các ngôn ngữ lập trình mới.

Khá nhiều ngôn ngữ lập trình phổ biến được xây dựng dựa trên nền tảng của LLVM. Nó là `engine` đằng sau của [Clang compiler](https://clang.llvm.org/get_started.html) (trình biên dịch C/C++/Objective-C của Apple), cũng như các trình biên dịch cho các ngôn ngữ mới ra đời gần đây như Rust và Swift. Có thể nói có một danh sách các ngôn ngữ từ A->X được build dựa trên LLVM, chỉ có một trường hợp biệt lệ là Go không dùng LLVM, tuy nhiên Google cũng đang làm việc để tạo ra một phiên bản LLVM-based Go compiler.

Trên trang chủ của LLVM cũng cung cấp một tutorial để tạo ra một ngôn ngữ lập trình mới có tên là [Kaleidoscope](https://llvm.org/docs/tutorial/index.html) (Kính vạn hoa). Hoặc nếu thích bạn có thể tham khảo thêm bài viết này: [Writing Your Own Toy Compiler Using Flex, Bison and LLVM](https://gnuu.org/2009/09/18/writing-your-own-toy-compiler/). Biết đâu được sau này chúng ta ngoài Go lang ra còn có một ngôn ngữ "made in Vietnam" như `Khoai lang` hay `Rau lang` :))).

## LLVM, WebAssembly và Emscripten

Cho đến đây thì chúng ta vẫn chưa thấy rõ mối liên hệ giữa LLVM và WebAssembly, chúng ta vẫn chưa biết hai thằng này ăn nhậu với nhau thế nào. Để làm rõ mối liên kết này chúng ta cần phải nói lại về compiler front-end và back-end đã đề cập ở trên.


- Phần front-end làm chủ yếu 3 khâu: lexical analysis, syntax analysis, semantic analysis. Nói nôm na là `lexer` sẽ đọc từng ký tự thành các token, sau đó `parser` sẽ chuyển chúng thành AST (abstract syntax tree), cuối cùng ở phần `semantic analysis` thì các thông tin khác sẽ được kiểm tra ví dụ như type checking.
- Phần back-end: sẽ chịu trách nhiệm tạo ra mã máy cho từng kiến trúc CPU cụ thể.

!["Compiler structure"](/assets/posts/webassembly/compiler-structure.png)

Ví dụ chúng ta muốn biên dịch C sang WebAssembly. Chúng ta có thể dùng Clang front-end để chuyển phần mã nguồn C sang LLVM IR (intermediate representation). Một khi phần code đó đã được chuyển thành LLVM IR, LLVM sẽ tiến hành một số bước để tối ưu nó. Tiếp theo để chuyển phần LLVM IR này thành WebAssembly (dạng .wasm), chúng ta cần một back-end. Hiện tại thì chưa có chính thức back-end cho WebAssembly, hiện tại nó đang là một project đang trong quá trình hoàn thành của LLVM. 

Tạm gọi cái official backend chưa dùng được, cho nên hiện tại thì có một số tool dùng được như là **Emscripten** hay [**PNaCL**](http://gonacl.com/), nhưng khuôn khổ bài này chỉ nói về Emscripten (nói chung thì bất kể tool nào được dùng thì nó cũng sẽ dịch ra file `.wasm`).

Nói một cách đơn giản hoá, Emscripten là một trình biên dịch LLVM-to-JavaScript. Để tạo ra WebAssembly, nó dịch LLVM IR sang [asm.js](https://www.wikiwand.com/en/Asm.js) (một subset của JavaScript) rồi mới convert sang định dạng WebAssembly.

!["Compiler structure"](/assets/posts/webassembly/llvm-ir-wasm.png)

# Dịch Rust sang WASM

1. Đầu tiên là cài Rust

Cách tốt nhất để cài Rust là thông qua [rustup](https://rustup.rs/). Nó là một cái project chính thức của Rust luôn.

```
curl https://sh.rustup.rs -sSf | sh
```

Sau khi đã cài *rustup* thì ta cài tiếp phiên bản stable của rust, cũng như *wasm32-unknown-emscripten*

```
rustup install stable
rustup default stable
rustup target add wasm32-unknown-emscripten
```

2. Tiếp theo là cài phiên bản portable của Emscripten SDK

Check out [emscripten-sdk](https://github.com/juj/emsdk) về. Sau đó chạy lệnh sau để cài đặt và thiết lập biến môi trường. (Xem thêm hướng dẫn cài đặt [ở đây](http://kripken.github.io/emscripten-site/docs/getting_started/downloads.html#download-and-install))

```
# Download and install the latest SDK tools.
./emsdk install latest

# Make the "latest" SDK "active" for the current user. (writes ~/.emscripten file)
./emsdk activate latest

source ./emsdk_env.sh
```

Sau đó kiểm tra phiên bản của `emcc`

```
emcc -v
```

Ví dụ ta biên dịch một file Rust đơn giản như sau:

```rust
fn main() {
    println!("Hello World!");
}
```
Sau đó ta chạy lệnh rustc để dịch `hello.rs` sang một bundle bao gồm 3 file: .wasm, .js để load .wasm và file html

```bash
rustc --target=wasm32-unknown-emscripten hello.rs -o hello.html
```

Để chạy hello.html ta cần một http server đơn giản, chúng ta có thể dùng `SimpleHTTPServer` của python.

```bash
python -m SimpleHTTPServer
```

Truy cập vào địa chỉ [http://localhost:8000/hello.html](http://localhost:8000/hello.html) ta thấy một giao diện siêu chuối `powered by emscripten` như sau:


!["Hello World"](/assets/posts/webassembly/helloworld.jpg)


Để tìm hiểu cách sử dụng lại các hàm được export ra `.wasm` như thế nào, chúng ta có thể tìm hiểu ở ví dụ tiếp theo.

# Dịch C sang WASM

Giả sử ta có file `add.c` như sau

```c
int add(int a, int b) {
  return a + b;
}
```
Chạy lệnh sau để biên dịch C thành wasm

```
emcc -s "EXTRA_EXPORTED_RUNTIME_METHODS=['cwrap']" -s EXPORTED_FUNCTIONS="['_add']" -s WASM=1 -o add.js  add.c
```
Nhìn vào tham số của dòng lệnh trên ta cũng thấy ẩn chứa đằng sau đó là một số "tà thuật", không có hai cái tham số `EXTRA_EXPORTED_RUNTIME_METHODS`, `EXPORTED_FUNCTIONS` thì cũng không dùng lại được hàm `add`, chưa kể emscripten còn tự thêm underscore `_` phía trước tên hàm (nên ta phải khai báo `_add` thay vì `add`).

Sau đó ta có thể dùng lại hàm `add` trong JavaScript thông qua `Module.cwrap`. Hàm `cwrap` nhận 3 tham số: tên hàm C đã export, kiểu trả về, và một mảng các kiểu của tham số đầu vào.

```html
<html>
<head>
  <script src="add.js"></script>
  <script>
      Module.onRuntimeInitialized = _ => {
        const add = Module.cwrap('add', 'number', ['number', 'number']);
        console.log(add(89, 29))
      }
  </script>
</head>
<body>

</body>
</html>
```

Vậy là với `Module.cwrap`, chúng ta có thể lấy được hàm cộng hai số mà chúng ta đã viết ở trong `add.c`. Tuy nó chẳng có gì ấn tượng cả nhưng nó mang lại nhiều khả năng để chúng ta có thể chuyển code được viết bằng các ngôn ngữ khác để dùng lại trong JavaScript.

- Còn tiếp -

# Tham khảo

1. [Announcing Rust 1.14](https://blog.rust-lang.org/2016/12/22/Rust-1.14.html)

2. [WebAssembly Concepts](https://developer.mozilla.org/en-US/docs/WebAssembly/Concepts)

3. [Creating and working with WebAssembly modules](https://hacks.mozilla.org/2017/02/creating-and-working-with-webassembly-modules/)