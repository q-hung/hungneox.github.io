---
layout: post
title: "Mã hoá bất đối xứng RSA"
date: 2016-01-19 19:55
categories: [security]
author: hungneox
description: Mã hoá bất đối xứng RSA
image: /assets/posts/rsa/asym-encryption.png
comments: true
---

# 1. Sơ lược về mã hoá đối xứng và bất đối xứng

![Asymmetric cryptography](/assets/posts/rsa/asym-encryption.png)

Hầu như ai có tìm hiểu về an toàn thông tin đều biết đến hai loại mã hoá phổ biến là mã hoá đối xứng (`symmetric cryptography`) 
và mã hoá bất đối xứng (`asymmetric cryptography`). Về cơ bản thì:

- Mã hoá đối xứng (hay còn gọi là mã hoá bí mật): Nói đơn giản là người ta dùng cùng một chìa khoá để khoá và mở thông tin 
cần được giữ bí mật. Và cả hai bên gửi và nhận thông tin đều phải có chìa khoá này.

- Mã hoá bất đối xứng (hay còn gọi là mã hoá công khai): Có thể hiểu là người ta dùng hai chìa khoá khác nhau 
để khoá và mở khoá thông tin bí mật. `public key` sẽ được công khai, và được gửi đi đến đối tượng cần mã hoá thông tin, 
còn `private key` được giữ bí mật, và nó đóng vai trò như chìa khoá vạn năng có thể mở được tất cả thông tin được 
khoá bằng public key.

# 2. Tại sao cần mã hoá bất đối xứng?

![https](/assets/posts/rsa/https.jpg)

Nói ngắn gọn thì hầu như các ứng dụng bạn dùng hàng ngày hiện nay như Facebook, Gmail, Amazon, PayPal v.v đều sử dụng giao thức HTTPs. Có thể hiểu là giao thức HTTPs an toàn hơn HTTP vì toàn bộ thông tin truyền đi giữa client và server được bảo vệ bởi bộ mã hoá SSL/TLS. SSL/TLS này hoạt động dựa trên cả hai loại mã hoá đối xứng và bất đối xứng. Nhờ nó mà chúng ta có thể đảm bảo bí mật khi thực hiện những giao dịch có chứa thông tin `nhạy cảm` trên Internet mà không bị đánh cắp thông tin trong suốt quá trình truyền nhận dữ liệu. Có thể nói, nếu không có mật mã, đặc biệt là mã hoá bất đối xứng thì **không có thương mại điện tử**.

Về cơ bản, HTTP truyền dữ liệu dưới dạng `plain text`, nghĩa là nếu ai đó `nghe lén` dữ liệu bạn truyền và nhận với server thì có thể đọc và can thiệp được nội dung (man-in-the-middle attack). Ngay cả khi dùng mã hoá đối xứng để encrypt và decrypt thông tin truyền và nhận thì cũng có lỗ hổng là hai bên phải trao đổi `key` mới mã hoá và giải mã được, như vậy attacker vẫn có thể tóm được `key` và đọc được thông tin như thường.

Điểm yếu của mã hoá đối xứng được khắc phục trong mã hoá bất đối xứng. Ý tưởng là thay vì gửi chìa khoá cho phía client, thì server sẽ gửi ổ khoá, để client khoá thông điệp bí mật trong một chiếc hộp, và chỉ có server có thể giải mã được. Cho nên các client sẽ **không** đọc được thông điệp của nhau, và chỉ có server với `private key` mới mở khoá được những chiếc hộp này. (Trên thực tế thì `public key` vừa dùng để mã hoá vừa dùng để giải mã thông tin nhận và gửi lên server!)

# 3. Về RSA


RSA là một trong những hệ thống mã hoá bất đối xứng được sử dụng rộng rãi. Nó được đặt theo tên của 3 nhà khoa học MIT thiết kế ra nó là: Ron **Rivest**, Adi **Shamir**, và Leonard **Adleman**. Ý tưởng then chốt để đảm bảo tính an toàn của RSA là dựa trên sự khó khăn trong việc phân tích một số rất lớn thành tích của 2 số nguyên tố. (a x b = c, tìm ngược lại a, b từ c là phân tích nhân tử).

Hệ thống mã hoá RSA bao gồm 4 bước: **key generation**, **key distribution**, **encryption** và **decryption**. Vì để đảm bảo tính bí mật, nên mỗi hệ thống khác nhau cần tạo ra các public, và private key khác nhau. Sau quá trình `handshake` và `public key` được gởi tới phía client thì thông tin mới chính thức được mã hoá khi server và client giao tiếp với nhau.

# 4. Mã hoá và giải mã

Tạm thời bỏ qua bước public key và private key được tạo ra như thế nào. Chúng ta có công thức để mã hoá và giải mã dữ liệu như sau:

- Encryption: $$m^e \mod n = c$$
- Decryption: $$c^d \mod n = m$$

Trong đó: 

* m là message ban đầu
* e, n là public key 
* c là dữ liệu đã được mã hoá
* d là private key, thường là một số rất lớn, và được giữ an toàn tuyệt đối

Ví dụ cho e = 17, n = 3233, d = 2753 và cho thông điệp cần đc mã hoá là m = 42 

* Mã hoá: $$42^{17} \mod 3233 = 2557$$

Số 2557 này khi được giải mã thì nó trở về 42 như cũ: 

* Giải mã: $$2557^{2753} \mod 3233 = 42$$

`private key` d được tạo ra dựa vào 2 `prime factor` của n. Trong thực tế n được tạo ra bằng cách nhân hai số nguyên tố 2048 bits cho nên tính ra d thì dễ, còn từ n tính ngược lại 2 số đó để tìm private key là gần như bất khả thi với máy tính hiện giờ.

# 5. Cách tạo public và private key
Phần này thiên về toán, hầu như chúng ta không cần quan tâm nếu như sử dụng các gói Cipher có sẵn của [Java](https://docs.oracle.com/javase/7/docs/api/java/security/KeyPairGenerator.html) hoặc [JavaScript](https://developer.mozilla.org/en/docs/Web/API/SubtleCrypto).

1. Chọn hai số nguyên tố ngẫu nhiên phân biệt p và q (trong thực tế là càng lớn càng tốt, cỡ 2048 bits hay 617 chữ số).
	* Ví dụ:  p = 61 và q = 53
2. Tính tích $$n = p * q  = 61 * 53 = 3233$$
3. Tính kết quả hàm số Euler (totient): $$\Phi(n) = (p − 1)(q − 1)$$
	$$\Phi(3233) = (61 - 1) * (53 - 1) = 3120$$
4. Chọn một số bất kỳ $$ 1 < e < 3120$$ và là [số nguyên tố cùng nhau](https://vi.wikipedia.org/wiki/S%E1%BB%91_nguy%C3%AAn_t%E1%BB%91_c%C3%B9ng_nhau) của 3120
	* Chọn $$e = 17$$
5. Tính d là [nghịch đảo modular của](https://en.wikipedia.org/wiki/Modular_multiplicative_inverse) $$e(mod \Phi(n))$$:

$$ 
 \\ e*d \mod \Phi(n) = 1
 \\ 17*d \mod 3120 = 1
$$

Hoặc là dùng cách `brute force` để tính d (có thể được vì chúng ta chọn các số nhỏ), hoặc dùng thuật toán Euclid mở rộng, ta có $$d = 2753$$

Cách brute force thì như sau (chạy chưa tới 15 bước là ra):

```python
def compute_d(phi_n, e):
	for i in range(1, 1000):
		x = ((i * phi_n) + 1) / e
		y = (e * x) % phi_n
		if y == 1:
			print x
			break

compute_d(3120, 17)
```
Như vậy cuối cùng chúng ta tính toán được `public key`: e = 17, n = 3233 và `private key`: d = 2753

# 6. Tính an toàn của RSA

Tính an toàn của RSA chủ yếu dựa vào bộ tạo số ngẫu nhiên sinh ra 2 số nguyên tố p và q ban đầu. Việc tính ngược lại p và q từ n là chuyện hầu như không thể với hai số nguyên tố 2048 bits như đã đề cập ở trên. Nhưng việc tính ra d từ từ p và q là việc rất dễ dàng. Do đó nếu như một bên nào đó đoán ra được hoặc tìm ra lỗ hổng của bộ sinh số ngẫu nhiên đó thì coi RSA bị hoá giải. Gần đây có ý kiến cho rằng Bộ An ninh Nội địa Hoa Kỳ (NSA) đã cài một `back door` vào bộ tạo số ngẫu nhiên `Dual Elliptic Curve` để giúp NSA có thể crack RSA nhanh hơn 10,000 lần. Và điều đáng quan tâm là bộ tạo số ngẫu nhiên này được công ty RSA (được thành lập bởi 3 đồng tác giả của hệ thống RSA) cài đặt mặc định trong rất nhiều ứng dụng khác nhau. ([Exclusive: NSA infiltrated RSA security more deeply than thought - study](http://www.reuters.com/article/us-usa-security-nsa-rsa-idUSBREA2U0TY20140331))

# Tham khảo
1. Mật mã hiện đại (1), Thái DN, [http://vnhacker.blogspot.fi/2010/05/mat-ma-hien-ai-1.html](http://vnhacker.blogspot.fi/2010/05/mat-ma-hien-ai-1.html)
2. Encryption Huge Number, Numberphile, [https://www.youtube.com/watch?v=M7kEpw1tn50](https://www.youtube.com/watch?v=M7kEpw1tn50)