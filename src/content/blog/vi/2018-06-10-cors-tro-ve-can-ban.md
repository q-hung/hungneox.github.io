---
layout: post
title: "CORS - Trở về căn bản"
date: 2018-06-10 21:00
categories: [web, security]
author: hungneox
tags: [web, security]
description: "CORS - Trở về căn bản"
image: /assets/images/cors.png
comments: true
published: true
---

!["CORS flowchart"](https://upload.wikimedia.org/wikipedia/commons/c/ca/Flowchart_showing_Simple_and_Preflight_XHR.svg "Flowchart showing Simple and Preflight XHR")

# Cross-Origin Resource Sharing (CORS)

Trước khi có tiêu chuẩn về `CORS`, thì không có cách nào để một trang web gửi request thông qua trình duyệt đến một domain khác. Đó là một cơ chế trong trình duyệt có từ Netscape Navigator 2 (1995) gọi là **Same Origin Policy**, để hạn chế một `document` hay một `script` tương tác với tài nguyên không cùng một gốc hay `origin`. Hai trang web có cùng một `origin` là khi nó có chung `protocol`, `port` và `host`. Khác subdirectory hay path vẫn được coi là cùng `origin`.

| URL                                             | Outcome | Reason             |
| ----------------------------------------------- | ------- | ------------------ |
| http://store.company.com/dir2/other.html        | Success |                    |
| http://store.company.com/dir/inner/another.html | Success |                    |
| https://store.company.com/secure.html           | Failure | Different protocol |
| http://store.company.com:81/dir/etc.html        | Failure | Different port     |
| http://news.company.com/dir/other.html          | Failure | Different host     |

Cơ chế này nhằm hạn chế các cuộc tấn công Cross-site scripting (XSS), khi attacker nhúng cấy một đoạn mã vào các websites để gửi các thông tin đánh cắp được về máy chủ khác hoặc, thực hiện giao dịch bằng thông tin vừa ăn cắp được (từ cookies của trình duyệt etc).

Và một trong những lợi ích to lớn khác là nó cung cấp một cơ chế (yếu) để ngăn các website khác ăn cắp traffic của bạn một cách quá dễ dàng :-)

# CORS HTTP headers

CORS sử dụng một số HTTP headers trong cả request và response để cho phép việc truy xuất tài nguyên không cùng một `origin` có thể xảy ra, mà vẫn đảm bảo độ bảo mật.

Về cơ bản thì từ phía server sẽ thông báo cho trình duyệt biết là server chỉ chấp nhận resquest từ `origin` nào và những phương thức HTTP nào.

## Access-Control-Allow-Origin

Đây là header được trả về từ phía server, để thông báo cho browser biết domain nào được truy xuất tài nguyên từ server đó. Header này có thể được thiết lập giá trị:

- `*` chấp nhận request từ tất tần tật các domain
- hoặc một domain đầy đủ (https://example.com)

## Access-Control-Allow-Headers

Bằng header này Server sẽ thông báo cho trình duyệt biết những request header nào được phía server hỗ trợ. Ví dụ như (`x-authentication-token`, `Authorization` v.v). Nếu client gửi những header khác không nằm trong danh sách này sẽ bị server bỏ qua.

## Access-Control-Allow-Methods

Đây là một danh sách chứa các phương thức HTTP mà server cho phép client sử dụng (vd: `GET`, `POST`, `DELETE`), và sách này phân cách bằng dấu phẩy. Ví dụ có những trường hợp server chỉ cho phép truy xuất, nhưng không cho phép cập nhật hoặc xoá tài nguyên chẳng hạn.

## Origin

Header này được trình duyệt tự động đính kèm theo mỗi cross-origin request đến server, cho biết origin (protocol + host + port) của trang web đang gửi request. Vì lý do bảo mật, trình duyệt không cho phép JavaScript ghi đè hay thay đổi giá trị của header này.

## Preflight request

Một cái preflight request là một request được gửi từ phía trình duyệt để thăm dò xem server có hiểu/ hỗ trợ giao thức CORS hay không. Nó được tự động gởi bởi trình duyệt. Việc của phía server là trả về những headers cần thiết cho phía client.

Ví dụ, phía client có thể gửi một OPTIONS request để xem server có cho phép `DELETE` tài nguyên trên server hay không.

```
OPTIONS /resource/foo
Access-Control-Request-Method: DELETE
Access-Control-Request-Headers: origin, x-requested-with
Origin: https://foo.bar.org
```

Server sẽ phản hồi cho phía client những thông tin cần thiết ví dụ như header `Access-Control-Allow-Methods` chứa những phương thức HTTP mà client được phép thực hiện.

```
HTTP/1.1 200 OK
Content-Length: 0
Connection: keep-alive
Access-Control-Allow-Origin: https://foo.bar.org
Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE
Access-Control-Max-Age: 86400
```

# Làm thế nào để sửa lỗi "CORS"

Như đã nói ở trên, đây không thực sự là một lỗi kỹ thuật. Nó là cơ chế của thế giới web để đảm bảo vệ người dùng. Có một số cách để giải quyết vấn đề này:

## a) Cách tiêu chuẩn

Để "fix lỗi" này là thêm domain của bạn vào `Access-Control-Allow-Origin` header của server. Khi lập trình front-end, bạn nên sử dụng một domain để code, ví dụ `myawesomeapp.test` thay vì dùng `localhost:3000`. (Hoặc đơn giản hơn là cấu hình để server trả về `Access-Control-Allow-Origin: *`. Nhưng cách này không được khuyến khích.)

## b) Cách thứ hai

Hoặc nếu như bạn hoàn toàn không thể kiểm soát được backend (không có contact của backend dev) và cần một giải pháp tạm thời, thì bạn có thể tắt chức năng bảo mật của trình duyệt

```
chrome --disable-web-security --user-data-dir
```

**Lưu ý** rằng nó áp dụng cho tất cả các trang web, nên nếu bạn quên bật lại chức năng bảo mật thì bạn có thể bị dính chưởng XSS.

## c) Cách thứ ba

Là nếu như bạn hoàn toàn không thể làm gì được thì có thể viết một proxy đứng ở giữa front-end và server bạn cần truy xuất tài nguyên. Nói chung thì chỉ có browser cản bạn gởi request thôi, chứ dùng `curl` hay truy xuất thẳng trên browser thì vẫn bình thường. Cho nên bạn hoàn toàn có thể dựng một server để trung chuyển request và response mà không gặp vấn để gì. Thật ra mấu chốt là nếu client không gửi `Orign` header đến server thì server không check nó có phải là request CORS không.

Ví dụ đây là một hàm từ package [lumen-cors](https://github.com/digiaonline/lumen-cors)

```php
/**
    * @inheritdoc
    */
public function isCorsRequest(Request $request)
{
    return $request->headers->has('Origin');
}
```

# References

1. [Bartosz Szczeciński, Understanding CORS](https://medium.com/@baphemot/understanding-cors-18ad6b478e2b)
2. [Mozilla, Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)
3. [Mozilla, Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
4. [Mozilla, Preflight request](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request)
