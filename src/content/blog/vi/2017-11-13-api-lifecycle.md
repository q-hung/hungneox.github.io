---
layout: post
title: "API Lifecycle"
date: 2017-11-13 7:00 AM
categories: [api-development, programming]
author: hungneox
tags : [api-development, programming, vietnamese]
description: "API Lifecyelce - Chu kỳ sống của API"
image: /assets/posts/api-lifecycle/api-lifecycle-state-diagram.jpg
comments: true
published: true
---

# Vòng đời của API

Cũng như là một sản phẩm phần mềm, thì API cũng có vòng đời (`API lifecycle`) riêng của nó. API không thể tự dưng sinh ra và chết đi đột ngột mà không để lại hậu quả nào. Cho nên có một chu trình phát triển API qui củ cũng giúp chúng ta dễ dàng phát triển và bảo trì API hơn. Ngoài ra cũng tăng tính tính cậy và giảm thiểu các rủi ro khi đưa cho khách hàng hay được sử dụng trong một ứng dụng khác. Trong bài viết này có thể hiểu vòng đời ở đây là vòng đời về mặt kỹ thuật của API nhiều hơn là vòng đời về khía cạnh "kinh doanh" của nó.

API Lifecycle là một chuỗi các trạng thái (series of states), có thể phụ thuộc vào [API Management Product](https://en.wikipedia.org/wiki/API_management) được sử dụng (vd: `Amazon API Gateway`, `Azure API Management`, `IBM API Connect`).

!["API lifecycle diagram"](/assets/posts/api-lifecycle/api-lifecycle-state-diagram.jpg){: .center-image }
<center>Nguồn http://cycles.apiops.net/apilifecycle/</center>

# Các trạng thái của API

1. **Draft**

    Đây là trạng thái, mà API còn trong giai đoạn `bản thảo` trong quá trình phát triển và thiết kế. Chưa được deployed và liên kết với bất kỳ `Catalog` nào. 
    _Cũng nói thêm là `Catalog` là một tập hợp các định nghĩa [Open API](https://www.openapis.org/) (tên mới của Swagger)._ Dùng từ fancy vậy thôi nhưng có thể hiểu như nó "danh bạ điện thoại" cho các APIs mà cụ thể là giống `Swagger Explorer`.

2. **Staged**

    Khi API ở trong trạng thái staged (tạm dịch là đã dược dàn dựng), thì nó được triển khai trên một Catalog. Staged là trạng thái ban đầu khi chúng ta `xuất bản` một API. Trong trạng thái này, thì API chưa được công bố và không thể sử dụng bởi bất kỳ developer nào. `Staging` (quá trình dàn dựng) có khi được gọi là `prototyping state`.

3. **Published**

    Khi API được published, một phiên bản cố định của API sẽ được công bố lên trên một `Catalog` đã định trước. Phiên bản API này bây giờ đã có thể sử dụng bởi developers và cộng đồng. Cũng trong giai đoạn này, thì các thiết lập về `visibility` và `susbcription` có thể thay đổi cho từng phiên bản cụ thể của API. Các thay đổi xa hơn (vd: chức năng) đòi hỏi một phiên bản API mới. Trong một số trường hợp cụ thể, trạng thái `published` cần được đồng bộ với `release cycles` của backend.

4. **Deprecated**

    Khi chúng ta `deprecate` một API, có nghĩa là chúng ta không khuyến khích developers sử dụng nó nữa. Trong trạng thái `deprecated`, thì API chỉ còn có thể sử dụng bởi những những ứng dụng đã và đang sử dụng nó mà thôi. Phiên bản API bị `deperecated` không cho phép developers đăng ký mới để sử dụng nữa (no new subscriptions) hoặc chuyển sang chế độ `read-only`. Khi một phiên bản mới API được `published` thì phiên bản cũ hơn nên được chuyển sang trạng thái `deprecated`. Một số `API Management Product` có thể tự động làm điều này.

5. **Retired / Archived**

    Khi chúng ta cho một API "nghỉ hưu", thì phiên bản đó của API không thể xem cũng như không thể đăng ký được nữa. API bị tắt hoàn toàn, thậm chí đối với các `subscribers` từ trước cũng không thể gọi (`invoke`) nó nữa.

# Làm thế nào để deprecate APIs

!["Twilio API"](/assets/posts/api-lifecycle/twilio-api-deprecation.png){: .center-image }

Trong thực tế, việc `deprecate` và `retire` một phiên bản API cũng không phải đơn giản là "rút ống" cho nó chết đột ngột được. Nhưng duy trì nhiều phiên bản API cũng tốn nhiều chi phí và thời gian. Nói chung là trước khi API cũ chết hẳn thì chúng ta cần thông báo cho bất kỳ ai đang sử dụng nó. Trong thực tế thì việc thông báo này không phải lúc nào cũng suôn sẻ, ví dụ như developers đổi thông tin liên lạc hoặc một dự án nào được phát triển bởi một bên tư vấn đã hết hợp đồng.

Sau đây là một số bước mà chúng ta có thể làm:
- Thông báo ngày API hết hạn trên blog/website và email cho cho developers để họ biết hạn chót có thể sử dụng và lên phương án nâng cấp.
- Trong trang document của API, hiện banner thông báo ngày hết hạn.
- Thông báo về lộ trình deprecate API ngay trong ứng dụng chính. (Ví dụ Google có thể thông báo về deprecated Google Analytics API version khi người dùng truy cập vào Google Analytics)
- Một trong những phương án kỹ thuật là gắn header `X-API-Warn` vào response từ API. Ý tưởng là những headers này sẽ xuất hiện trong server log như một thông báo nâng cấp cho developers. Ví dụ
    - `X-API-Deprecation-Date: 2017-12-25T00:00:00Z`
    - `X-API-Deprecation-Info: https://example.com/old-api-deprecation-info?utm=from-header`

# Tham khảo 

1. The Product lifecycle [https://www.ibm.com/.../capim_product_lifecycle.html](https://www.ibm.com/support/knowledgecenter/en/SSFS6T/com.ibm.apic.apionprem.doc/capim_product_lifecycle.html)
2. API Lifecycle [http://cycles.apiops.net/apilifecycle/](http://cycles.apiops.net/apilifecycle/)
3. API Geriatrics [https://zapier.com/engineering/api-geriatrics/](https://zapier.com/engineering/api-geriatrics/)
4. REST API v3 [https://developer.github.com/v3/#rate-limiting](https://developer.github.com/v3/#rate-limiting)