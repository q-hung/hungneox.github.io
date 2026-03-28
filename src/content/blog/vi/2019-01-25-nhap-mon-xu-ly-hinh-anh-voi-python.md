---
layout: post
title: "Nhập môn xử lý hình ảnh với Python" 
date: 2019-01-25 1:00
categories: [python, image-processing, pillow]
author: hungneox
tags : [python, image processing]
description: "Nhập môn xử lý hình ảnh với Python. Sử dụng thư viện Pillow"
image: /assets/posts/webassembly/game-changer.jpg
comments: true
published: false
---

# Đôi điều về không gian màu (color space)

## Mô hình màu CMYK

Khi chúng ta nhìn thấy một ấn phẩm màu nào đó, ví dụ như một tấm poster hay một tờ báo, thì màu sắc trên đó được in dựa trên mô hình màu [CMYK](https://www.wikiwand.com/en/CMYK_color_model). Mô hình này sử dụng các màu mực in cơ bản gồm **C**yan, **M**agenta, **Ye**llow, và blac**K** (Xanh lơ, Đỏ sậm, Vàng, Đen). Nó thường được biết đến với cái tên quá trình in 4 màu.

!["CMYK"](/assets/posts/nhap-mon-xu-ly-hinh-anh/CMYK_print.jpg){: .center-image }

Từ 4 màu chính, chúng ta có thể kết hợp để tạo ra các màu phụ. Hình bên dưới minh hoạ các màu chính và màu phụ trong quá trình in 4 màu:

!["Subtractive color"](/assets/posts/nhap-mon-xu-ly-hinh-anh/subtractive_color.png){: .center-image }

## Mô hình màu RGB

Trong khi trong ngành công nghiệp in ấn, người ta dùng quá trình in 4 màu, thì với các màn hình điện tử hiện thị màu sắc sử dụng mô hình màu RGB, tức là dùng sự kết hợp của 3 màu Red, Green, Blue (Đỏ, Xanh lá, Xanh biển) để tạo ra các dãy màu sắc khác nhau. Mỗi loại màn hình có một pattern pixel khác nhau, mỗi pixel có các sub-pixel hiện thị một màu trong RGB.

!["Subtractive color"](/assets/posts/nhap-mon-xu-ly-hinh-anh/pixels.jpg){: .center-image }

Hiện tại, thì một card màn hình điển hình dùng 24 bits để lưu giá trị của 1 pixel, tức là 8 bits cho mỗi sub-pixel. Mỗi 8 bits lưu được 256 trạng thái (0-255), như vậy tổng cộng 1 pixel có thể lưu được 256^3 = 16,777,216 trạng thái khác nhau. Tạm gọi là 16 triệu màu, nhưng không nhất thiết là mắt người có thể phân biệt được các màu này. 

## Sự khác biệt giữa in truyền thống và màn hình điện tử

In Offset là một trong những kỹ thuật phổ biến trong in ấn. Nó được áp dụng để in tạp chí, sách báo, brochures vân vân và mây mây. Cách in này đòi hỏi hình ảnh phải được chuyển hoặc tạo ở dạng sử dụng mô hình màu CMYK. Màu sắc của ấn phẩm được tạo ra bằng các in chồng các màu mực, mà khi kết hợp lại nó sẽ hình thành các màu như sau:

!["Subtractive color"](/assets/posts/nhap-mon-xu-ly-hinh-anh/offset.png){: .center-image }