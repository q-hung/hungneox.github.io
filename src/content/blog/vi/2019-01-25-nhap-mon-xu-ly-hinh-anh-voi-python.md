---
layout: post
title: "Nhập môn xử lý hình ảnh với Python" 
date: 2019-01-25 1:00
categories: [programming]
author: hungneox
tags: [python]
description: "Nhập môn xử lý hình ảnh với Python. Sử dụng thư viện Pillow"
image: /assets/posts/nhap-mon-xu-ly-hinh-anh/python-image-processing.png
comments: true
published: true
---

# Đôi điều về không gian màu (color space)

![Python image processing](/assets/posts/nhap-mon-xu-ly-hinh-anh/python-image-processing.png)

## Mô hình màu CMYK

Khi chúng ta nhìn thấy một ấn phẩm màu nào đó, ví dụ như một tấm poster hay một tờ báo, thì màu sắc trên đó được in dựa trên mô hình màu [CMYK](https://www.wikiwand.com/en/CMYK_color_model). Mô hình này sử dụng các màu mực in cơ bản gồm **C**yan, **M**agenta, **Ye**llow, và blac**K** (Xanh lơ, Đỏ sậm, Vàng, Đen). Nó thường được biết đến với cái tên quá trình in 4 màu.

!["CMYK"](/assets/posts/nhap-mon-xu-ly-hinh-anh/CMYK_print.jpg)

Từ 4 màu chính, chúng ta có thể kết hợp để tạo ra các màu phụ. Hình bên dưới minh hoạ các màu chính và màu phụ trong quá trình in 4 màu:

!["Subtractive color"](/assets/posts/nhap-mon-xu-ly-hinh-anh/subtractive_color.png)

## Mô hình màu RGB

Trong khi trong ngành công nghiệp in ấn, người ta dùng quá trình in 4 màu, thì với các màn hình điện tử hiện thị màu sắc sử dụng mô hình màu RGB, tức là dùng sự kết hợp của 3 màu Red, Green, Blue (Đỏ, Xanh lá, Xanh biển) để tạo ra các dãy màu sắc khác nhau. Mỗi loại màn hình có một pattern pixel khác nhau, mỗi pixel có các sub-pixel hiện thị một màu trong RGB.

!["Pixels"](/assets/posts/nhap-mon-xu-ly-hinh-anh/pixels.jpg)

Hiện tại, thì một card màn hình điển hình dùng 24 bits để lưu giá trị của 1 pixel, tức là 8 bits cho mỗi sub-pixel. Mỗi 8 bits lưu được 256 trạng thái (0-255), như vậy tổng cộng 1 pixel có thể lưu được 256^3 = 16,777,216 trạng thái khác nhau. Tạm gọi là 16 triệu màu, nhưng không nhất thiết là mắt người có thể phân biệt được các màu này.

## Sự khác biệt giữa in truyền thống và màn hình điện tử

In Offset là một trong những kỹ thuật phổ biến trong in ấn. Nó được áp dụng để in tạp chí, sách báo, brochures vân vân và mây mây. Cách in này đòi hỏi hình ảnh phải được chuyển hoặc tạo ở dạng sử dụng mô hình màu CMYK. Màu sắc của ấn phẩm được tạo ra bằng các in chồng các màu mực, mà khi kết hợp lại nó sẽ hình thành các màu như sau:

!["Offset print"](/assets/posts/nhap-mon-xu-ly-hinh-anh/offset.png)

# Xử lý hình ảnh với Python và Pillow

[Pillow](https://pillow.readthedocs.io/en/stable/) là thư viện xử lý ảnh phổ biến nhất trong hệ sinh thái Python. Nó là một nhánh (fork) được duy trì tích cực của thư viện PIL (Python Imaging Library) cũ, với API đơn giản và hỗ trợ đa dạng định dạng ảnh như JPEG, PNG, BMP, GIF, TIFF, v.v.

## Cài đặt

```bash
pip install Pillow
```

## Đọc và hiển thị ảnh

```python
from PIL import Image

# Mở một file ảnh
img = Image.open("photo.jpg")

# Xem thông tin cơ bản
print(img.format)   # JPEG
print(img.size)     # (width, height), ví dụ: (1920, 1080)
print(img.mode)     # 'RGB', 'RGBA', 'L', 'CMYK', ...

# Hiển thị ảnh (mở bằng trình xem mặc định của hệ điều hành)
img.show()
```

Thuộc tính `mode` cho biết không gian màu của ảnh:
- `RGB` — ảnh màu thông thường (3 kênh)
- `RGBA` — ảnh màu có kênh alpha (trong suốt)
- `L` — ảnh grayscale (1 kênh, mỗi pixel là một giá trị 0–255)
- `CMYK` — ảnh dành cho in ấn (4 kênh)

## Lưu ảnh

```python
from PIL import Image

img = Image.open("photo.jpg")

# Lưu ra file mới với định dạng khác
img.save("photo.png")

# Lưu JPEG với chất lượng tùy chỉnh (1-95)
img.save("photo_compressed.jpg", quality=75)
```

## Chuyển đổi không gian màu

Pillow cho phép chuyển đổi giữa các mode ảnh rất dễ dàng bằng phương thức `convert()`.

```python
from PIL import Image

img = Image.open("photo.jpg")  # mode: RGB

# Chuyển sang grayscale
gray = img.convert("L")
gray.save("photo_gray.jpg")

# Chuyển sang CMYK (ví dụ để chuẩn bị in ấn)
cmyk = img.convert("CMYK")
cmyk.save("photo_cmyk.tiff")

# Thêm kênh alpha (trong suốt)
rgba = img.convert("RGBA")
rgba.save("photo_transparent.png")
```

## Làm việc với từng pixel

Trong một số trường hợp, bạn cần truy cập và chỉnh sửa từng điểm ảnh (pixel) thủ công. Pillow cung cấp hai phương thức `getpixel()` và `putpixel()` cho mục đích này.

```python
from PIL import Image

img = Image.open("photo.jpg")

# Đọc giá trị pixel tại toạ độ (x=100, y=50)
pixel = img.getpixel((100, 50))
print(pixel)  # (R, G, B) — ví dụ: (230, 120, 45)

# Ghi đè một pixel thành màu đỏ thuần
img.putpixel((100, 50), (255, 0, 0))

img.save("photo_edited.jpg")
```

> **Lưu ý**: Sử dụng vòng lặp để duyệt từng pixel sẽ rất chậm với ảnh lớn. Nếu cần xử lý toàn bộ ảnh theo pixel, hãy dùng `numpy` để tăng tốc.

```python
import numpy as np
from PIL import Image

img = Image.open("photo.jpg")
arr = np.array(img)  # shape: (height, width, 3)

# Tăng độ sáng tất cả các pixel lên 50 (clip để không vượt 255)
brighter = np.clip(arr + 50, 0, 255).astype(np.uint8)

result = Image.fromarray(brighter)
result.save("photo_brighter.jpg")
```

## Áp dụng bộ lọc (filters)

Pillow tích hợp sẵn nhiều bộ lọc ảnh thông dụng trong module `ImageFilter`.

```python
from PIL import Image, ImageFilter

img = Image.open("photo.jpg")

# Làm mờ (Gaussian blur)
blurred = img.filter(ImageFilter.GaussianBlur(radius=5))
blurred.save("photo_blur.jpg")

# Làm nét (sharpen)
sharpened = img.filter(ImageFilter.SHARPEN)
sharpened.save("photo_sharp.jpg")

# Dò cạnh (edge detection)
edges = img.filter(ImageFilter.FIND_EDGES)
edges.save("photo_edges.jpg")

# Làm mịn (smooth)
smoothed = img.filter(ImageFilter.SMOOTH)
smoothed.save("photo_smooth.jpg")
```

## Thay đổi kích thước và cắt ảnh

### Resize

```python
from PIL import Image

img = Image.open("photo.jpg")

# Thay đổi kích thước về 800x600 px (có thể bị méo nếu tỉ lệ khác)
resized = img.resize((800, 600))

# Giữ nguyên tỉ lệ - tính chiều còn lại
width, height = img.size
new_width = 800
new_height = int(height * new_width / width)
resized_ratio = img.resize((new_width, new_height), Image.LANCZOS)
resized_ratio.save("photo_resized.jpg")
```

`Image.LANCZOS` là thuật toán lấy mẫu lại (resampling) chất lượng cao, thích hợp khi thu nhỏ ảnh. Các lựa chọn khác gồm `NEAREST`, `BILINEAR`, `BICUBIC`.

### Crop

```python
from PIL import Image

img = Image.open("photo.jpg")

# Cắt một vùng chữ nhật: (left, upper, right, lower)
box = (100, 50, 600, 400)
cropped = img.crop(box)
cropped.save("photo_crop.jpg")
```

## Xoay và lật ảnh

```python
from PIL import Image

img = Image.open("photo.jpg")

# Xoay 90 độ ngược chiều kim đồng hồ
rotated = img.rotate(90, expand=True)
rotated.save("photo_rotated.jpg")

# Lật ngang (mirror)
flipped_h = img.transpose(Image.FLIP_LEFT_RIGHT)
flipped_h.save("photo_flip_h.jpg")

# Lật dọc
flipped_v = img.transpose(Image.FLIP_TOP_BOTTOM)
flipped_v.save("photo_flip_v.jpg")
```

# Tổng kết

Pillow là điểm khởi đầu lý tưởng cho bất kỳ ai muốn làm việc với ảnh trong Python. Với API trực quan, thư viện này xử lý tốt các tác vụ thông thường như đọc/ghi, chuyển đổi màu, cắt, resize và lọc ảnh.

Khi cần hiệu năng cao hơn hoặc các thuật toán phức tạp hơn (phát hiện đối tượng, nhận diện khuôn mặt, v.v.), bạn có thể kết hợp Pillow với:
- [NumPy](https://numpy.org/) — biểu diễn ảnh dưới dạng mảng số để xử lý nhanh
- [OpenCV](https://opencv.org/) — thư viện computer vision mạnh mẽ cho real-time processing
- [scikit-image](https://scikit-image.org/) — bộ thuật toán xử lý ảnh khoa học

# Tham khảo

- [Pillow Documentation](https://pillow.readthedocs.io/en/stable/)
- [Python Imaging Library Handbook](https://pillow.readthedocs.io/en/stable/handbook/index.html)
- [CMYK color model – Wikipedia](https://www.wikiwand.com/en/CMYK_color_model)
- [RGB color model – Wikipedia](https://www.wikiwand.com/en/RGB_color_model)