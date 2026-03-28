---
layout: post
title: "WebAssembly - Part 1: Introduction"
date: 2018-08-06 1:00
categories: [systems]
author: hungneox
description: "An introduction to WebAssembly: what WebAssembly is"
image: /assets/images/wasm.jpg
comments: true
---

!["Web Platform"](/assets/images/wasm.jpg)

# Introducing WebAssembly

At its core, WebAssembly is a new language that can run in the browser (alongside JavaScript, of course). It is designed to be compiled from other low-level languages such as C/C++ and Rust, but it is not meant to replace JavaScript. While JavaScript is powerful enough for most web problems, we also run into performance limits in compute-heavy applications such as 3D games, [virtual reality](https://www.wikiwand.com/en/Virtual_reality) and [augmented reality](https://www.wikiwand.com/en/Augmented_reality), computer vision, image and video editing, and so on.

WebAssembly matters for the web platform as a whole: it lets programs written in many languages run on the web, which was previously impractical. WebAssembly modules can be embedded not only in browser-based web apps but also in Node.js applications. Today, the WASM format is widely supported in major browsers such as Chrome, Firefox, Safari, and Edge.

!["Browser party"](/assets/posts/webassembly/browser-party.png)

Today, [WebAssembly use cases](https://webassembly.org/docs/use-cases/) extend well beyond online games. Together with the [Emscripten](http://kripken.github.io/emscripten-site/) compiler, more and more experiments are shipping. Examples include:

- [Computer vision](https://hacks.mozilla.org/2017/09/bootcamps-webassembly-and-computer-vision/)
- 3D mapping – Altus platform, [Google Earth](https://medium.com/google-earth/earth-on-web-the-road-to-cross-browser-7338e0f46278)
- [User interface design](https://blog.figma.com/webassembly-cut-figmas-load-time-by-3x-76f3f2395164)
- [Language detection](https://github.com/jaukia/cld-js)
- [Audio mixing](http://eecs.qmul.ac.uk/~keno/60.pdf)
- [Video codec support](https://github.com/brion/ogv.js/)
- [Digital signal processing](https://github.com/shamadee/web-dsp)
- [Medical imaging](https://github.com/jodogne/wasm-dicom-parser)
- [Physics simulation](https://github.com/kripken/ammo.js/)
- [Cryptography](https://github.com/vibornoff/asmcrypto.js)
- Compression – [zlib-asm](https://www.npmjs.com/package/zlib-asm), [Brotli](https://www.npmjs.com/package/brotli), [lzma](https://github.com/kripken/lzma.js)
- [Computer algebra](http://mathstud.io/)

# What role does WebAssembly play on the web?

!["WebAssembly"](/assets/posts/webassembly/webassembly-2.png)

The web platform can be split into two parts:

- A **virtual machine** that executes JavaScript code
- **Web APIs** that control browser and device capabilities ([DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model), [CSSOM](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model), [WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API), IndexedDB, Web Audio API, and so on)

For a long time, the browser’s VM could only load and run JavaScript, and as noted above, that language has drawbacks. WebAssembly was not created to replace JavaScript, but to complement it and run alongside it. Each brings distinct strengths to the web platform. For example:

- JavaScript is a high-level, flexible, and productive language for web apps. It benefits from dynamic typing, no compile step, and a huge ecosystem of frameworks, libraries, and tooling.

- WebAssembly, by contrast, is a low-level language with a **compact binary format**, executed at speeds **close to native** low-level languages. It also lets code written in memory-manageable low-level languages such as C++ or Rust run on the web. In the future, WebAssembly also aims to support garbage-collected languages such as Python or Ruby.

On execution speed and performance, the WebAssembly FAQ states that WebAssembly can be **parsed** more than 20× faster than JavaScript.

> The kind of binary format being considered for WebAssembly can be natively decoded much faster than JavaScript can be parsed (experiments show more than 20× faster). On mobile, large compiled codes can easily take 20–40 seconds just to parse, so native decoding (especially when combined with other techniques like streaming for better-than-gzip compression) is critical to providing a good cold-load user experience.

Source: [WebAssembly FAQ](https://webassembly.org/docs/faq/)

In short, WebAssembly is a separate language from JavaScript, but the [WebAssembly JavaScript API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly) wraps WebAssembly code as JavaScript-callable functions so it can run like ordinary JavaScript in the browser or Node.js.

# Enough talk—show me the code

WebAssembly is not really meant to be written by hand (it is compiled from C++/Rust to WASM), but you can still do it manually.

The WebAssembly language specification describes two formats: the compressed binary **WASM** format, which is what you typically ship, and **WAT** (WebAssembly Text Format), which is very close to the binary form but more human-readable.

```wat
(module
  (func (result i32)
    (i32.const 42)
  )
  (export "helloWorld" (func 0))
)
```

This is a simple function that returns [the constant 42](https://www.urbandictionary.com/define.php?term=42) (the answer to life, the universe, and everything :-P). To compile the WAT above to WASM, install [WABT (The WebAssembly Binary Toolkit)](https://github.com/WebAssembly/wabt).

After installing WABT, run the following from a console to produce a `.wasm` file:

```
wat2wasm hello.wat -o hello.wasm
```

Once compiled to `.wasm`, you can call **helloWorld** from Node.js like this:

```javascript
const { readFileSync } = require("fs");

const run = async () => {
  const buffer = readFileSync("./hello.wasm");
  const module =  await WebAssembly.compile(buffer);
  const instance = await WebAssembly.instantiate(module);
  console.log(instance.exports.helloWorld());
};

run();
```

To run in the browser, embed the following script in your HTML:

```javascript
fetch("hello.wasm").then(response =>
    response.arrayBuffer()
).then(bytes =>
    WebAssembly.instantiate(bytes, {})
).then(result =>
    result.instance
).then(instance =>
    console.log(instance.exports.helloWorld())
);
```

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Hello WebAssembly</title>
</head>
<body>
    <!-- The only thing that matters is the following line,
    although having a valid HTML5 page is nice. -->
    <script src="hello.js"></script>
</body>
</html>
```

You can also experiment with WebAssembly in the [WebAssembly Explorer](https://mbebenita.github.io/WasmExplorer/).

# References

Further reading on the ideas in this post: the binary module model, loading from JS, browser adoption, and design tradeoffs versus JavaScript.

1. [WebAssembly Concepts](https://developer.mozilla.org/en-US/docs/WebAssembly/Concepts) — MDN introduction to modules, memory, tables, and how WASM fits next to JavaScript on the web platform.

2. [Loading and running WebAssembly code](https://developer.mozilla.org/en-US/docs/WebAssembly/Loading_and_running) — Step-by-step: fetch (or read) a `.wasm` file, compile, instantiate, and call exported functions—matches the Node.js and `fetch` examples above.

3. [WebAssembly JavaScript API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly) — Reference for the global `WebAssembly` object (`compile`, `instantiate`, etc.) used to embed WASM in the browser or Node.js.

4. [WebAssembly support now shipping in all major browsers](https://blog.mozilla.org/blog/2017/11/13/webassembly-in-browsers/) — Mozilla’s announcement of cross-browser WASM support (Chrome, Firefox, Safari, Edge), in line with the “browser party” theme of this post.

5. [7 Things You Should Know About WebAssembly](https://auth0.com/blog/7-things-you-should-know-about-web-assembly/) — Short, opinionated overview: security model, relationship to asm.js, and why WASM matters for the web.

6. [WebAssembly FAQ](https://webassembly.org/docs/faq/) — Official answers on goals, parsing speed versus JavaScript, and portability; source for the FAQ quote about binary decoding and cold-load performance.
