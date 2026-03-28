---
layout: post
title: "So sánh chuỗi trong PHP"
date: 2013-07-11 8:00 PM
categories: [php, vi]
author: hungneox
tags : [php]
image: /assets/images/placeholder.jpg
comments: true
---
### Sử dụng toán tử so sánh 
Cách đơn giản và thô sơ nhất là dùng toán tử so sánh của PHP (comparison operators). Tuy nhiên không nên dùng toán tử Equal (`==`) mà nên dùng toán tử Identical (`===`). Bởi vì `==` không so sánh kiểu dữ liệu và có thể dẫn đến sai lệch trong việc so sánh. Ta hãy xem thử ví dụ sau: 

```php
<?php
  $input = 0;
  if('defaultpassword' == $input){
   echo 'true';
  } else {
   echo 'false';
  }
?>
```
Viết ngắn sử dụng toán tử 3 ngôi (ternary operator):
```php
<?php
$input = 0;
echo ('defaultpassword' == $input) ? ‘true’ : ‘false’;
?>
```
Mặc dùng `0` và `defaultpassword` hoàn toàn khác nhau nhưng kết quả trả về là `true` thay vì `false`. Bởi vì khi PHP sẽ ngầm định ép kiểu về `float` để so sánh, và ép kiểu chuỗi ‘defaultpassword’ về kiểu float thì nó sẽ ra kết quả như sau: `int(0);` [Xem thêm](http://php.net/manual/en/language.types.type-juggling.php)

Do đó khi so sánh 2 chuỗi `1e3` và `1000` bằng phép toán `==` ta được kết quả là true. 

```php
<?php
echo ('1e3' == '1000') ? 'true' : 'false';
?>
```
Nhưng nếu dùng toán tử === ta sẽ được kết quả là false: 
```php
<?php
echo ('1e3' === '1000') ? 'true' : 'false';
?>
```
Do `1e3` tương đương `1000` nếu như convert sang kiểu `float`. Vì vậy tốt hơn hết là ta dùng toán tử Identical (`===`) để so sánh hai chuỗi.

### Sử dụng hàm strcmp() 

`int strcmp ( string $str1 , string $str2 )`
Nhận hai tham số `$str1` và `$str2` và trả về kết quả:

1. `< 0` nếu như `$str1 < $str2`
2. `> 0` nếu như `$str1 > $str2`
2. `0` nếu như `$str1 = $str2`

Đây là một hàm binary-safe, tức là nhận dữ liệu đầu vào như dữ liệu thô mà không ngầm định kiểu dữ liệu. Và hàm strcmp chỉ so sánh nội dung của hai chuỗi mà không phải so sánh địa chỉ bộ nhớ và bỏ qua các ký tự đặc biệt. Lưu ý thêm là hàm này có phân biệt hoa thường, nhưng hàm `strcasecmp` thì không.

Ví dụ: Hai chuỗi “string1” và “string1\0\n”, hiển nhiên là không giống nhau. Nếu dùng toán tử so sánh ở trên để kiếm tra thì tất nhiên kết quả trả về sẽ là ‘false’. Tuy nhiên nếu dùng hàm strcmp ta sẽ nhận được kết quả là true vì nội dung hai chuỗi này hoàn toàn giống nhau nếu bỏ đi ký tự đặc biệt trong PHP là \0 và\n. 
echo (strcmp('string1', 'string1\0\n')) ? 'true' : 'false';

Nhưng lưu ý là PHP có một bug  như sau:  Nếu dùng strcmp để so sánh một array() và một chuỗi thì kết quả trả về vẫn là 0 (tức là hai “chuỗi” bằng nhau).

```php
<?php
$pwd = isset($_GET[‘pwd’]) ? $_GET[‘pwd’] : '';
//tương đương $pwd = array();
 if ( strcasecmp( $pwd, 'password' ) == 0 ){
      echo 'You successfully logged in.';
}
?>
Warning: strcasecmp() expects parameter 1 to be string, array given in cmpstr.php on line 12
```
Mặc dù nó vẫn bung ra Warning như nó vẫn vượt qua vào được bên trong và in ra câu thông báo:”You successfully logged in”

### Sử dụng hàm similar_text 

`int similar_text ( string $first , string $second [, float &$percent ] )`

Hàm similar_text nhận 3 tham số, 2 chuỗi đầu vào và một biến chứa kết quả trả về. Kết quả là số phần trăm giống nhau giữa hai chuỗi. Ví dụ:

```php
<?php
similar_text("Hello World","Hello Hello",$percent);
echo $percent;
?>
```
Kết quả trả về là `63.636363636364` Theo document của PHP, hàm này tính toán sự giống nhau giữa hai chuỗi được được mô tả trong sách [Programming Classics: Implementing the World's Best Algorithms by Oliver (ISBN 0-131-00413-1)](http://www.amazon.com/Programming-Classics-Implementing-Worlds-Algorithms/dp/0131004131). 

Tuy nhiên thứ tự của các tham số cũng khiến thay đổi kết quả trả về, và ví dụ dưới đây được báo cáo là một bug nhưng chưa được xác nhận 

```php
<?php
echo similar_text('test','wert'); // 1
echo similar_text('wert','test'); // 2 hay
$var_1 = 'PHP IS GREAT'; 
$var_2 = 'WITH MYSQL'; 

echo similar_text($var_1, $var_2); // 3
echo similar_text($var_2, $var_1); // 2
?>
```
### Sử dụng hàm levenshtein 
Hàm này ngược lại với hàm `similar_text()`, nó sẽ trả về 0 nếu như hai chuỗi so sánh giống hệt nhau:
```php
<?php 
int levenshtein ( string $str1 , string $str2 )
int levenshtein ( string $str1 , string $str2 , int $cost_ins , int $cost_rep , int $cost_del ) 
?>
```
Hàm này tính khoảng cách levenshtein (hay còn gọi là Edit distance) giữa 2 dãy (sequence) và được đặt tên theo một nhà khoa học người Nga Vladimir Levenshtein người đã nghĩ ra ý tưởng này vào năm 1965. Khoảng cách levenshtein được tính bằng cách tính số lần xóa (deletions), thêm (insertions) và thay thế (substitutions) để chuyển chuỗi gốc (source) thành chuỗi đích (target).

Ví dụ: Khoảng cách Levenshtein giữa 2 chuỗi "kitten" và "sitting" là 3, vì phải dùng ít nhất 3 lần biến đổi.

* kitten -> sitten (thay "k" bằng "s") 
* sitten -> sittin (thay "e" bằng "i") 
* sittin -> sitting (thêm kí tự "g")

```php
<?php 
  echo levenshtein("kitten","sitting");//3
?>
```
### Sử dụng hàm soundex
`string soundex ( string $str )` 

Hàm này sử dụng thuật toán ngữ âm (phonetic algorithm) để tính toán chỉ mục của các tự dựa trên cách phát âm của nó (theo tiếng Anh). Hàm này trả về một chuỗi 4 ký tự bắt đầu với một chữ cái. Thuật toán này được mô tả trong cuốn nổi tiếng The Art Of Computer Programming, vol. 3: Sorting And Searching", Addison-Wesley (1973), pp. 391-392 của Donald Knuth.

Ví dụ: Trong MySQL có một hàm tương tự [soundex](http://dev.mysql.com/doc/refman/5.0/en/string-functions.html#function_soundex). Ta có thể dùng hàm này để đưa ra tìm không gần đúng một keyword. Ta lưu trong database 1 trường soundex, để so sánh với keyword người dùng đưa vào:

`SELECT p.name FROM products p WHERE p.soundex = SOUNDEX(‘test’);`

### Sử dụng hàm metaphone
`string metaphone ( string $str [, int $phonemes = 0 ] )`

Theo PHP document thì hàm này tương tự như soundex nhưng chính xác hơn vì dựa vào nguyên tắc phát âm cơ bản trong tiếng Anh. Và hàm này trả về một khóa có chiều dài thay đổi theo chiều dài của chuỗi đầu vào. Thuật toán này được phát triển bởi Lawrence Philips và được mô tả trong cuốn "Practical Algorithms for Programmers", Binstock & Rex, Addison Wesley, 1995.

```php
<?php 
var_dump(metaphone('Catherine'));
var_dump(metaphone('Katherine'));
//string(5) "K0RN"
//string(5) "K0RN"
?>
```
Trong khi dùng hàm soundex sẽ trả về 2 kết quả khác nhau `C365` (Catherine) và `K365` (Katherine). Ở đây ta có thể thấy tại sao hàm `metaphone` được mô tả là chính xác hơn hàm `soundex`, theo nghĩa nó có ích hơn vì trên thực tế hai Katherine và Catherine đọc hoàn toàn giống nhau. Cũng tương tự như `soundex`, ta có thể sử dụng hàm `metaphone` để tăng khả năng tìm kiếm trong database. 

Tham khảo một bài viết áp dụng với [Python](http://www.informit.com/articles/article.aspx?p=1848528)

### References:

* PHP String Comparison == vs strcmp, Stackoverflow
* what is the difference between “some” == “some\0” and strcmp(“some”,“some\0”) in c++?, Stackoverrflow
* PHP Manual, metaphone
* PHP Manual, similar_text
* PHP Manual, levenshtein