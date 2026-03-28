---
layout: post
title: "WebAssembly - Phần 1: Giới thiệu" 
date: 2018-08-06 1:00
categories: [webassembly, rust]
author: hungneox
tags : [webassembly, rust, guide]
description: "Giới thiệu về WebAssembly, WebAssembly là gì"
image: /assets/posts/webassembly/game-changer.jpg
comments: true
---

!["Web Platform"](/assets/posts/webassembly/game-changer.jpg){: .center-image }

# Giới thiệu WebAssembly

Về cơ bản, WebAssembly là một ngôn ngữ mới có thể chạy trên trình duyệt (dĩ nhiên là ngoài JavaScript ra). Nó được thiết kế để dịch ra từ ngôn ngữ low-level khác như C/C++ và Rust, nhưng không nhằm để thay thế JavaScript. Tuy bản thân JavaScript đủ mạnh để giải quyết đa số các vấn đề trên web, nhưng hiện nay chúng ta cũng gặp phải một số vấn đề về hiệu năng (performance) của JavaScript, trong các ứng dụng cần xử lý nhiều như các ứng dụng trò-chơi lập-thể (3D games), [thực-tế ảo (virtual reality)](https://www.wikiwand.com/en/Virtual_reality) và [thực-tế tăng-cường (augmented reality)](https://www.wikiwand.com/en/Augmented_reality), thị giác máy tính (computer vision), chỉnh sửa hình ảnh và phim v.v

WebAssembly có một ý nghĩa không nhỏ với nền tảng web nói chung, nó cho phép chương trình được viết bằng nhiều ngôn ngữ khác nhau có thể chạy trên web, mà trước đó là bất khả thi. Các modules WebAssembly không chỉ có thể được đưa vào các ứng dụng web (trên trình duyệt) mà cũng có thể được sử dụng trong các ứng dụng node.js. Cũng phải nói thêm là hiện nay, định dạng WASM đã được hỗ trợ rộng rãi trên các trình duyệt phổ biến như Chrome, Firefox, Safari và Edge.

!["Browser party"](/assets/posts/webassembly/browser-party.png){: .center-image }

Ngày nay, [các ứng dụng của WebAssembly](https://webassembly.org/docs/use-cases/) đã phát triển vượt khỏi phạm vi của các trò chơi trực tuyến (online games). Cùng với trình biên dịch [Emscripten](http://kripken.github.io/emscripten-site/), ngày càng có nhiều thử nghiệm với WebAssembly được triển khai. Ví dụ như

- [Thị giác máy tính](https://hacks.mozilla.org/2017/09/bootcamps-webassembly-and-computer-vision/)
- Lập bản đồ 3D – Altus platform, [Google Earth](https://medium.com/google-earth/earth-on-web-the-road-to-cross-browser-7338e0f46278)
- [Thiết kế giao diện người dùng](https://blog.figma.com/webassembly-cut-figmas-load-time-by-3x-76f3f2395164)
- [Phát hiện ngôn ngữ](https://github.com/jaukia/cld-js)
- [Trộn âm](http://eecs.qmul.ac.uk/~keno/60.pdf)
- [Hỗ trợ mã hoá video](https://github.com/brion/ogv.js/)
- [Xử lý tín hiệu số](https://github.com/shamadee/web-dsp)
- [Hình ảnh y khoa](https://github.com/jodogne/wasm-dicom-parser)
- [Giả lập vật lý](https://github.com/kripken/ammo.js/)
- [Mã hoá](https://github.com/vibornoff/asmcrypto.js)
- Nén – [zlib-asm](https://www.npmjs.com/package/zlib-asm), [Brotli](https://www.npmjs.com/package/brotli), [lzma](https://github.com/kripken/lzma.js)
- [Đại số máy tính](http://mathstud.io/)

# WebAssembly có vai trò như thế nào đối với web?

!["WebAssembly"](/assets/posts/webassembly/webassembly-2.png){: .center-image }

Nền tảng web có thể được tách ra làm 2 phần
- Phần máy ảo (virtual machine) để thực thi JavaScript code
- Phần Web APIs để điều khiển các chức năng của trình duyệt, thiết bị ([DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model), [CSSOM](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model), [WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API), IndexedDB, Web Audio API, etc)

Hầu như từ trước đến giờ, cái máy ảo trong trình duyệt chỉ có thể tải và chạy JavaScript, và cũng đã đề cập ở trên ngôn ngữ độc quyền này cũng có một số nhược điểm. WebAssembly không được tạo ra để thay thế JavaScript, mà để bổ sung cũng như hoạt động song song với JavaScript. Cả hai mang lại nhiều lợi thế riêng cho nền tảng web. Ví dụ:

- JavaScript là một ngôn ngữ cấp cao, linh động và hiệu quả đủ để viết các ứng dụng web. Nó có nhiều lợi thế như là một ngôn ngữ có kiểu động (dynamically typed language), không yêu cầu phải biên dịch và một hệ sinh thái khổng lồ gồm nhiều khung-làm-việc (framework), thư viện (libraries) và đủ các chủng loại công cụ (toolchain).

- Trong khi đó, WebAssembly là một ngôn ngữ cấp thấp, với một định dạng nhị phân nhỏ gọn (compact binary format), được thực thi với một tốc độ **gần-tương-đương** với các ngôn ngữ cấp thấp. Đồng thời nó cũng cho phép chương trình được viết bằng các ngôn ngữ cấp thấp có khả năng quản lý nhớ như C++ hoặc Rust chạy trên nền web. Ngoài ra trong tương lai, WebAssembly cũng có mục tiêu là hỗ trợ các ngôn ngữ có bộ dọn rác (garbage collector), như Python hay Ruby.

Nói về tốc độ thực thi và hiệu năng, thì trên trang Hỏi-Đáp của WebAssembly cũng có nói rằng, WebAssembly được phân-tích cú-pháp (parse) nhanh hơn JavaScript 20 lần.

> The kind of binary format being considered for WebAssembly can be natively decoded much faster than JavaScript can be parsed (experiments show more than 20× faster). On mobile, large compiled codes can easily take 20–40 seconds just to parse, so native decoding (especially when combined with other techniques like streaming for better-than-gzip compression) is critical to providing a good cold-load user experience. 

Nguồn: [WebAssembly FAQ](https://webassembly.org/docs/faq/)

Về cơ bản, WebAssembly là một ngôn ngữ khác và độc lập so với JavaScript, nhưng [WebAssembly JavaScript API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly) đóng gói các WebAssembly code thành các hàm JavaScript để có thể được thực thi bình thường như JavaScript trong browser hay node.js.

# Nói nhiều quá, cho xem code đi!

Thực chất WebAssembly không được thiết kế để viết bằng tay (mà để compile từ C++/Rust sang wasm), tuy nhiên chúng ta hoàn toàn có thể làm thủ công.

Trong đặc tả ngôn ngữ của WebAssembly (specification) có mô tả về hai định dạng của WebAssembly, một là dạng nhị phân nén **WASM**, thường được đem đi phân phối. Dạng thứ hai là **WAT** (WebAssembly Text Format), cũng rất gần với dạng nhị phân, nhưng thân thiện với loài người hơn.

```wat
(module
  (func (result i32)
    (i32.const 42)
  )
  (export "helloWorld" (func 0))
)
```

Đây là một hàm đơn giản trả về [hằng số 42](https://www.urbandictionary.com/define.php?term=42) (câu trả lời cho tất cả câu hỏi trong vũ trụ :-P). Để biên dịch code WAT ở trên ra WASM, ta cần cài [WABT (The WebAssembly Binary ToolKit)](https://github.com/WebAssembly/wabt).

Sau khi cài xong WABT, chỉ cần chạy lệnh sau từ console là ta có file `.wasm`

```
wat2wasm hello.wat -o hello.wasm
```

Sau khi được biên dịch thành định dạng `.wasm`, ta có thể gọi hàm **helloWorld** trong node.js như sau:

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

Để chạy trong browser, ta chỉ cần nhúng script sau vào html

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
* Ngoài ra chúng ta có thể vọc thử WebAssembly trên [WebAssembly Explorer](https://mbebenita.github.io/WasmExplorer/). 

# Tham khảo

1. [WebAssembly Concepts](https://developer.mozilla.org/en-US/docs/WebAssembly/Concepts)

2. [Loading and running WebAssembly code](https://developer.mozilla.org/en-US/docs/WebAssembly/Loading_and_running)

3. [WebAssembly support now shipping in all major browsers](https://blog.mozilla.org/blog/2017/11/13/webassembly-in-browsers/)

4. [7 Things You Should Know About WebAssembly](https://auth0.com/blog/7-things-you-should-know-about-web-assembly/)

5. [WebAssembly - FAQ](https://webassembly.org/docs/faq/)