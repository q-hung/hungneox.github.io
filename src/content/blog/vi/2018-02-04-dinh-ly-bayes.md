---
layout: post
title: "Định lý Bayes" 
date: 2018-02-04 20:10
categories: [data-science]
author: hungneox
tags: [AI, statistics]
description: "Định lý Bayes (Bayes’s Theorem)"
image: /assets/images/placeholder.jpg
comments: true
---

# Định lý Bayes (Bayes’s Theorem)

TLDR; Diễn dịch theo cách thông thường thì định lý Bayes dùng để trả lời câu hỏi: Phỏng đoán của của ta chính xác bao nhiêu phần trăm nếu như có dữ kiện mới được thu thập.

## Giới thiệu

Định lý Bayes mang tên một nhà triết học và toán học nghiệp dư người Anh Thomas Bayes (1701-1761). Định lý này được viết trong một bài luận được đọc trước Hội khoa học hoàng gia năm 1763 sau khi ông chết. Cùng năm sau đó, một người bạn của ông là Richard Price trình bày và công bố định lý này trong ấn bản “Philosophical Transactions of the Royal Society of London”.

Nói chung, nó có nhiều ứng dụng thực tế như [lọc thư rác](https://en.wikipedia.org/wiki/Naive_Bayes_spam_filtering), [nhận dạng chữ viết](http://www.lrc.tnu.edu.vn/upload/collection/brief/827_17.pdf), hệ thống khuyến nghị vân vân và mây mây.

## Xác xuất có điều kiện (conditional probability)
Nói đơn giản thì xác xuất có điều kiện là khả năng đúng của một dự đoán dựa trên một điều kiện nào đó. 

Giả sử Phèo học trong một lớp học có 20 học sinh (5 nam và 15 nữ). Đồng thời ta biết trong lớp đó có một học sinh bị cúm. Như vậy dự đoán ban đầu của chúng ta về khả năng mắc bệnh cúm của Phèo là 1/20 hay 5%. 

Ta viết: `P(Phèo bị cúm) = 0.05`

Trong điều kiện mà bạn trẻ bị nhiễm cúm là nữ thì tỉ lệ mà Phèo mắc cúm giảm còn 0%. Nhưng trong trường hợp người bị cúm là nam thì tỉ lệ này sẽ là 1/5 hay 20%. Hãy nhớ rằng ta vẫn chưa biết người bị cúm là nam hay nữ.

Ta gọi nó là xác xuất có điều kiện và nó được viết như sau:

`P(Phèo bị cúm | bệnh nhân là nam) = 0.20`

`P(Phèo bị cúm | bệnh nhân là nữ) = 0`

Ví dụ trên chỉ để minh hoạ cho xác xuất có điều kiện. Sau đây nói tiếp với định lý Bayes.

## Định lý Bayes 

Định lý Bayes:

$$P(H | E) = \dfrac{P(E | H) . P(H)}{P(E)}$$

| H       | The probability of a hypothesis                               |
| E       | Conditional on a new piece of evidence                        |
| P(H\|E) | The probability of a hypothesis conditional on a new evidence |
| P(E\|H) | The probability of the evidence given the hypothesis          |
| P(H)    | The prior probability of the hypothesis                       |
| P(E)    | The prior probability of the evidence                         |


Ví dụ một ngày đẹp trời sau khi ngủ dậy bạn bị nhức đầu một cách kỳ lạ. Sau khi google thì bạn phát hiện ra là triệu chứng của bệnh ung thư não (hay một bệnh X nào đó). 

Ban đầu bạn tự nói với bản thân, định mệnh là 95% bị ung thư não rồi. Nhưng sau khi tìm hiểu thì bạn phát hiện ra rằng tỉ lệ bị ung thư não rất thấp, chỉ 1/10000 người bị, như vậy P(H) chỉ = 0.0001, và bệnh nhức đầu cũng khá phổ biến cứ 100 người thì có 1 người bị.

Như vậy: 

| P(H)   | khả năng bạn bị bệnh ung thư não       | = 0.0001 |
| P(E)   | khả năng bạn bị nhức đầu               |= 0.01    |
| P(E\|H)| khả năng bạn bị nhức đầu là do ung thư | = 0.95   |


Cuối cùng sau khi có tất cả các yếu tố cần thiết bạn có thể áp dụng định lý Bayes để tính `P(H | E)` hay khả năng bị ung thư do nhức đầu.


$$P(H | E) = \dfrac{P(E | H) . P(H)}{P(E)} = \dfrac{0.95 * 0.0001}{00.1} = 0,0095$$

Nói chung là khi bị nhức đầu thì khả năng bạn bị ung thư não là chưa tới 1%.

# Kết luận

Tóm lại, xác xuất có điều kiện của một giả thuyết được tính dựa trên ba yếu tố 
* Xác xuất xảy ra của giả thuyết (khả năng một người bị ung thư não)
* Xác xuất xảy ra của chứng cứ (khả năng một người bị nhức đầu)
* Xác xuất triệu chứng/chứng cứ xảy ra là do giả thuyết (khả năng nhức đầu là do ung thư não). 

Nói chung là sau mỗi lần bạn có thêm một triệu chứng mới thì phải cập nhật lại xác xuất của giả thuyết ban đầu. Trong thực tế đôi khi bạn không biết các điều kiện cần để tính toán là gì, có thể bạn biết là có những chứng cứ, thông tin có thể ảnh hưởng đến kết quả nhưng tại thời điểm đó ta không biết chứng cứ đó là gì. Hoặc là bạn phải đi tìm hoặc là phải dựa trên phán đoán ban đầu. Tuy không hoàn hảo, nhưng có thể nói định lý Bayes là một công cụ quan trọng để chúng ta tư duy dựa trên lý trí và mang tính phản biện (critical thinking).

# Tham khảo

* [CRITICAL THINKING - Fundamentals: Bayes](https://www.youtube.com/watch?v=OqmJhPQYRc8)
* [The Bayesian Trap](https://www.youtube.com/watch?v=R13BD8qKeTg)
* [Thomas Bayes](https://en.wikipedia.org/wiki/Thomas_Bayes)
* [Naive Bayes spam filtering](https://en.wikipedia.org/wiki/Naive_Bayes_spam_filtering)