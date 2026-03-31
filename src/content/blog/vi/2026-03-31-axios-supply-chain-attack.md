---
layout: post
title: "Axios Supply Chain Attack axios@1.14.1"
date: 2026-03-31 21:00
categories: [security, til]
author: hungneox
tags: [security, supply-chain]
description: "Phân tích chi tiết cuộc tấn công chuỗi cung ứng Axios: Cách thức thực thi của package bị xâm nhập, các giai đoạn rải mã độc và chiến lược để bảo vệ hệ thống của bạn."
image: /assets/posts/supply-chain/supply_chain_vendor_cyber_attack.png
comments: true
published: false
---

# Sự cố

![Axios Supply Chain Attack](/assets/posts/supply-chain/tiredboss.png)

Sáng sớm hôm nay, một kỹ sư trong công ty tôi phát hiện package `axios` đã trở thành nạn nhân của một cuộc tấn công chuỗi cung ứng (supply chain attack). Cụ thể, kẻ tấn công đã phát hành các phiên bản bị xâm nhập của `axios` có chứa một dependency độc hại được ẩn giấu. May mắn thay, công ty tôi sử dụng [JFrog Artifactory](https://jfrog.com/artifactory/); chúng tôi đã nhanh chóng xóa bỏ package độc hại này khỏi hệ thống, và sau đó npm cũng đã gỡ bỏ các phiên bản dính mã độc khỏi registry công khai.

Nói chung, việc cài đặt trực tiếp từ các npm registry công khai tiềm ẩn nhiều rủi ro. Bạn nên sử dụng private registry như Artifactory để duy trì quyền kiểm soát đối với các dependency của mình.

# Cách cuộc tấn công diễn ra

### Đánh cắp tài khoản của maintainer

Kẻ tấn công đã chiếm đoạt tài khoản npm của người bảo trì dự án (maintainer) chính của `axios`, thay đổi email đăng ký thành một địa chỉ email của kẻ tấn công. Bằng cách sử dụng một access token npm (không có ngày hết hạn) đánh cắp được, chúng đã tự động đẩy lên cả hai phiên bản `axios@1.14.1` và `axios@0.30.4`, phớt lờ hoàn toàn quy trình CI/CD GitHub Actions chuẩn của dự án. Trong file `package.json` của các phiên bản này, các pre-commit hook `husky` hợp lệ đã bị xóa đi và một dependency độc hại đã được chèn vào.

![Maintainer account hijack](/assets/posts/supply-chain/jasonsaayman.png)

### Chuỗi phân phối

- Khi cài đặt phiên bản bị xâm nhập `axios@1.14.1` hoặc `axios@0.30.4`, nó sẽ tải file `plain-crypto-js@^4.2.1` dưới dạng dependency.
- `plain-crypto-js` đã khai báo đoạn mã `"postinstall": "node setup.js"` trong file `package.json` — tức là mã độc sẽ tự động thực thi ngay sau khi quá trình `npm install` hoàn tất.
- `setup.js` là một trình cài đặt backdoor đa nền tảng đã được ngụy trang (obfuscated).

Các phiên bản độc hại này đã đưa thêm một dependency mới độc nhất: `plain-crypto-js`, một package chuyên dụ mồi có `postinstall` hook sẽ âm thầm tải xuống và thực thi một mã độc Stage-2 RAT (Remote Access Trojan) tùy theo nền tảng mục tiêu từ máy chủ `sfrclak[.]com:8000`.

### Quy trình thực thi

Khi một nạn nhân vô tình cài đặt phiên bản `axios` bị lây nhiễm, một chuỗi các hành động sẽ được kích hoạt nhằm chiếm quyền kiểm soát máy và xóa sạch mọi dấu vết:

**1. Cài đặt âm thầm (Stage 1)**
- **Tự động thực thi:** Cuộc tấn công dựa hoàn toàn vào hook `postinstall`. Điều này có nghĩa là malware sẽ tự động chạy ngay sau khi `npm install axios` kết thúc, mà không cần bất kỳ sự tương tác nào từ nạn nhân.
- **Chống rà soát (Anti-forensics):** Kẻ phát tán (dropper) ngay lập tức xóa sạch dấu vết bằng cách tự hủy diệt. Nó thực hiện thông qua việc đổi tên một file thông tin giả mạo (`package.md`) thành `package.json`, từ đó đánh lừa một phiên bản giả `4.2.0` thay vì phiên bản độc hại `4.2.1`. Nếu các kỹ sư hệ thống gõ lệnh `npm list plain-crypto-js`, hệ thống sẽ trả về phiên bản  `4.2.0`, tạo ra một lớp ngụy trang đánh lạc hướng cực kỳ nguy hiểm.

**2. Trinh sát & Thu thập thông tin**
Ngay sau khi mã Stage-2 RAT được cài cắm ổn định, nó sẽ tạo báo cáo chi tiết về máy của nạn nhân và gửi về máy chủ điều khiển C&C của sinh tặc. Bản báo cáo sẽ chứa:
- **Thông tin thiết bị:** Hostname, username, phiên bản hệ điều hành (OS), và hardware model.
- **Thời gian hệ thống:** Thời điểm cài đặt hệ điều hành và thời gian boot chính xác.
- **Danh sách tiến trình:** Một bản rà soát tổng hợp mọi phần mềm đang chạy trên máy (PIDs, đường dẫn thực thi và người dùng sở hữu).
- **Lục soát tập tin:** Tự động đào sâu vào tìm các thư mục có giá trị như User Profile, Documents và Desktop.

# Cách tự bảo vệ hệ thống

Chiến lược hiệu quả nhất để làm chậm các tác hại từ kiểu tấn công chuỗi cung ứng là đưa ra các quy tắc về thời gian cách ly package (quarantine policy). Rất nhiều gói phần mềm độc hại thường sẽ bị phát hiện và xóa ngay sau khi chúng được lên kệ, việc ép buộc một thời gian tối thiểu đối với các package trước khi được phép sử dụng có thể sẽ bảo vệ hệ thống của bạn tuyệt đối. Ví dụ, chúng ta cần phải có các khoảng nghỉ cooldown cho những bản package mới, thông thường là 2-4 tuần trước khi chúng được đưa lên áp dụng tại môi trường production.

Trong trường hợp của đợt tấn công `axios` trên, dependency `plain-crypto-js@4.2.1` mới chỉ tồn tại không đầy 24 giờ. Nếu đội kỹ sư sử dụng các công cụ yêu cầu thời gian thẩm duyệt—chẳng hạn như công cụ nguồn mở [Aikido Safe Chain](https://github.com/AikidoSec/safe-chain), mặc định sẽ yêu cầu tuổi package phải qua độ chênh 48 giờ để rà quét malware—đợt sóng tấn công này đã có thể dễ dàng bị bẻ gãy tự động từ ban đầu.

# Nguồn tham khảo

- [GitHub Gist: Joe Desimone](https://gist.github.com/joe-desimone/36061dabd2bc2513705e0d083a9673e7)
- [Aikido Security: Axios npm compromised maintainer hijacked RAT](https://www.aikido.dev/blog/axios-npm-compromised-maintainer-hijacked-rat)
- [Elastic Security Labs: Axios - One RAT to rule them all](https://www.elastic.co/security-labs/axios-one-rat-to-rule-them-all)
- [Axios GitHub Issue](https://github.com/axios/axios/issues/10604)
- [StepSecurity: axios Compromised on npm - Malicious Versions Drop Remote Access Trojan](https://www.stepsecurity.io/blog/axios-compromised-on-npm-malicious-versions-drop-remote-access-trojan)