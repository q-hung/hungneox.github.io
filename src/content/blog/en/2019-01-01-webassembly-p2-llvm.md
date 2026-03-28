---
layout: post
title: "WebAssembly - Part 2: LLVM"
date: 2019-01-01 7:10
categories: [systems]
author: hungneox
description: "LLVM and WebAssembly"
image: /assets/posts/webassembly/webassembly-illustration.png
comments: true
published: true
---

# A brief introduction

Following the previous post on [WebAssembly](/en/blog/2018-08-06-webassembly-p1-introduction/), this article introduces the relationship between LLVM and WebAssembly, and walks through experiments compiling [Rust](https://blog.rust-lang.org/2016/12/22/Rust-1.14.html) and C to WebAssembly using Emscripten.

# WebAssembly, LLVM, and Emscripten

## LLVM

LLVM is a **compiler framework**—in short, a framework for building compilers for programming languages. It provides powerful tools for both the front end (parser, lexer) and the back end (lowering LLVM intermediate code to machine code), for new or existing languages.

Many popular languages are built on LLVM. It is the engine behind the [Clang compiler](https://clang.llvm.org/get_started.html) (Apple’s C/C++/Objective-C compiler) and compilers for newer languages such as Rust and Swift. You could list languages from A to X that target LLVM; a notable exception is Go, which does not use LLVM—though Google is also working on an LLVM-based Go compiler.

The LLVM site includes a tutorial that builds a small language called [Kaleidoscope](https://llvm.org/docs/tutorial/index.html). If you prefer, see also [Writing Your Own Toy Compiler Using Flex, Bison and LLVM](https://gnuu.org/2009/09/18/writing-your-own-toy-compiler/). Who knows—maybe someday, alongside Go, we will have a “made in Vietnam” language called `SweetPotato` or `MorningGlory` :))).

## LLVM, WebAssembly, and Emscripten

So far the connection between LLVM and WebAssembly may still feel vague—how do the two actually fit together? To spell it out, we need to revisit compiler front ends and back ends.

- The **front end** mainly covers three stages: lexical analysis, syntax analysis, and semantic analysis. Roughly: the **lexer** turns characters into tokens; the **parser** builds an AST (abstract syntax tree); **semantic analysis** then checks additional rules such as types.
- The **back end** is responsible for generating machine code for specific CPU architectures.

!["Compiler structure"](/assets/posts/webassembly/compiler-structure.png)

Suppose we want to compile C to WebAssembly. We can use the Clang front end to lower C source to **LLVM IR** (intermediate representation). Once code is in LLVM IR, LLVM runs several optimization passes. To turn that IR into WebAssembly (`.wasm`), we need a **back end**. There was no official WebAssembly back end in LLVM for a long time; it has been developed as an ongoing LLVM project.

Until that official back end was widely usable, practical options included **Emscripten** and [**PNaCl**](http://gonacl.com/). This post focuses on Emscripten (whichever tool you use, the goal is still to produce a `.wasm` file).

Put simply, Emscripten is an **LLVM-to-JavaScript** compiler. To emit WebAssembly, it lowers LLVM IR to [asm.js](https://www.wikiwand.com/en/Asm.js) (a subset of JavaScript) and then converts that to WebAssembly.

!["Compiler structure"](/assets/posts/webassembly/llvm-ir-wasm.png)

# Compiling Rust to WASM

## 1. Install Rust

The recommended way to install Rust is [rustup](https://rustup.rs/)—the official Rust installer.

```
curl https://sh.rustup.rs -sSf | sh
```

After installing **rustup**, install the stable toolchain and the **wasm32-unknown-emscripten** target:

```
rustup install stable
rustup default stable
rustup target add wasm32-unknown-emscripten
```

## 2. Install the portable Emscripten SDK

Clone [emscripten-sdk](https://github.com/juj/emsdk), then run the commands below to install and set up your environment. (See the full install guide [here](http://kripken.github.io/emscripten-site/docs/getting_started/downloads.html#download-and-install).)

```
# Download and install the latest SDK tools.
./emsdk install latest

# Make the "latest" SDK "active" for the current user. (writes ~/.emscripten file)
./emsdk activate latest

source ./emsdk_env.sh
```

Then check the **emcc** version:

```
emcc -v
```

For example, compile a minimal Rust program:

```rust
fn main() {
    println!("Hello World!");
}
```

Run **rustc** to compile `hello.rs` into a bundle with three artifacts: `.wasm`, a `.js` loader, and an `.html` file:

```bash
rustc --target=wasm32-unknown-emscripten hello.rs -o hello.html
```

To open `hello.html`, you need a simple HTTP server—for example Python’s built-in server:

```bash
python -m http.server
```

Visit [http://localhost:8000/hello.html](http://localhost:8000/hello.html) and you will see a very plain “powered by Emscripten” page like this:

!["Hello World"](/assets/posts/webassembly/helloworld.jpg)

The next example shows how to call functions exported from `.wasm`.

# Compiling C to WASM

Suppose we have `add.c`:

```c
int add(int a, int b) {
  return a + b;
}
```

Compile C to WASM with:

```
emcc -s "EXTRA_EXPORTED_RUNTIME_METHODS=['cwrap']" -s EXPORTED_FUNCTIONS="['_add']" -s WASM=1 -o add.js  add.c
```

Those flags hide a bit of “magic”: without `EXTRA_EXPORTED_RUNTIME_METHODS` and `EXPORTED_FUNCTIONS`, you cannot easily call `add` from JS, and Emscripten prefixes C function names with an underscore (so you export `_add`, not `add`).

You can then call `add` from JavaScript via `Module.cwrap`. **`cwrap`** takes three arguments: the exported C function name, the return type, and an array of parameter types.

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

With `Module.cwrap`, you can use the add function defined in `add.c` from JavaScript. It is a tiny demo, but it shows how you can bring code from other languages into the browser.

— To be continued —

# References

Official docs and articles that line up with the LLVM → IR → WebAssembly / Emscripten path in this post:

1. [LLVM Language Reference](https://llvm.org/docs/LangRef.html) — Definition of LLVM IR, the intermediate form Clang (and other front ends) emit before code generation.

2. [Emscripten](https://emscripten.org/) — Project home; documentation for `emcc`, the SDK (`emsdk`), and compiling C/C++ to WebAssembly and JavaScript glue.

3. [Announcing Rust 1.14](https://blog.rust-lang.org/2016/12/22/Rust-1.14.html) — Release notes that introduced the `wasm32-unknown-emscripten` target used with `rustc` in the examples above.

4. [WebAssembly Concepts](https://developer.mozilla.org/en-US/docs/WebAssembly/Concepts) — MDN overview of modules, linear memory, and tables in the browser.

5. [Creating and working with WebAssembly modules](https://hacks.mozilla.org/2017/02/creating-and-working-with-webassembly-modules/) — Mozilla Hacks guide to fetching, instantiating, and calling WebAssembly from JavaScript (complements the `Module.cwrap` demo).

6. [*The Rust and WebAssembly Book*](https://rustwasm.github.io/book/) — Modern Rust + WASM workflow using the `wasm32-unknown-unknown` target and `wasm-bindgen` (no Emscripten); useful if you move beyond the Emscripten-based setup described here.
