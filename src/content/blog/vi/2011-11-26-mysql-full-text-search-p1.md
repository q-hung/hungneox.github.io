---
layout: post
title: "MySQL Full-text Search - P1"
date: 2011-11-26 8:00 PM
categories: [database, mysql, full-text-search, vi]
author: hungneox
tags : [mysql, full-text-search]
comments: true
---

## I.  Full text search là gì?
Nói đơn giản dễ hiểu, full text search (gọi tắt là FTS) là cách tự nhiên nhất để tìm kiếm thông tin, hệt như Google, ta chỉ cần gõ từ khóa và nhấn enter thế là có kết quả trả về. Phạm vi bài viết này chỉ đề cập, giới thiệu sơ lược về FTS trong MySQL mà không bàn về các FTS engine như Sphinx hay Solr.
<!--more-->
##II.  Tại sao chúng ta phải dùng Full text search?
Bình thường, chúng ta sẽ sử dụng câu truy vấn dạng như sau để tìm kiếm dữ liệu:

```SELECT id,title,description FROM book WHERE title LIKE ‘%keyword%’```

Nhưng cách truy vấn này có một số hạn chế như sau:

(Lưu ý: đây là những hạn chế chung trong MySQL, ngay cả full text search của MySQL cũng không giải quyết triệt để các vấn đề này mà phải dùng các search engine ngoài như Solr, Sphinx v.v Nhưng mình muốn nêu lên ở đây để chúng ta có cái nhìn rõ ràng về những khuyết điểm đó.)


### 1.    Không chính xác
- Độ nhiễu cao 
Giả sử, bạn có câu truy vấn với mệnh đề LIKE như sau:
Title LIKE ‘%one%’
Thì nó sẽ có thể trả về những kể quả sau: one, zone, money, phone nói chung là không chính xác vì dải kết quả trả về sẽ rộng và có thể chứa nhiều kết quả nhiễu không mong muốn.

- Từ đồng nghĩa (synonyms)
Như chúng ta đã biết, ngôn ngữ nào cũng có những từ đồng nghĩa, ví dụ như trong tiếng Việt là xe hơi - ôtô, bao thư - phong bì v.v. Tiếng Anh thì đơn giản thì có color-colour, check-cheque, deloper-programmer v.v Nếu như dùng LIKE hay = (thậm chí Full-text search của MySQL) thì tất nhiên không thể giải quyết được vấn từ đồng nghĩa này.

- Từ cấu tạo bằng chữ đầu của cụm từ (acronym)
Đôi lúc với những cụm từ dài và phổ biến chúng ta thường viết tắt ví dụ như THPT, CNTT, US, IT. Nhưng khi người dùng tìm kiếm thì họ có thể nhập khác với trong database chúng ta lưu trữ (viết thu gọn - viết đủ và ngược lại) cho nên đây cũng là một khó khăn mà chúng ta gặp phải khi làm chức năng search. Mong muốn của người dùng là họ tìm thấy được kết quả mong muốn cho dù họ viết tắt hay viết đầy đủ) 

### 2.    Tốc độ truy vấn chậm, ‘%keyword%’ không dùng index
Nếu như ta đặt wildcard ‘%’ ở phía trước thì MySQL sẽ thực hiện câu truy vấn mà không dùng index, MySQL sẽ thực hiện scan toàn bộ dữ liệu của nó từ đầu đến cuối, cho nên câu truy vấn sẽ rất chậm so với search trên index. Giống như ta tìm từng trang trong một cuốn sách thay vì tìm trong trang index đằng sau quyển sách đó vậy. Để hiểu rõ hơn vì sao dùng index lại nhanh hơn chúng ta sẽ tìm hiểu nó trong các phần sau.
The index also can be used for LIKE comparisons if the argument to LIKE is a constant string that does not start with a wildcard character[1]

### 3.    Vấn đề với tìm kiếm tiếng Việt có dấu và không dấu
Giả sử ta lưu tiếng Việt có dấu trong database, nhưng người dùng nhập tiếng Việt không dấu thì mệnh đề LIKE chắc chắn sẽ không tìm ra được dữ liệu ta cần. Có một số giải pháp ví dụ như lưu 2 field, một có dấu và một không dấu, nhưng cách này xem ra không tối ưu và không hỗ trợ search gần đúng. Nếu như người dùng nhập “co be mua dogn” thì dùng mệnh đề LIKE sẽ không search ra được “Cô bé mùa Đông”, nhưng FTS có thể giải quyết vấn đề này.

## III. Sơ lược MySQL full-text search

Sơ lược thì MySQL FTS hiện tại chỉ có trên storage engine MyISAM và mới có trên InnoDB  (>=5.6 beta).

Có 2 chế độ tìm kiếm đó là BOOLEAN MODE và NATURAL LANGUAGE MODE. Trong BOOLEAN MODE thì không có default sorting, và trong chế độ này thì ta có thể qui định từ khóa nào sẽ xuất hiện, và từ khóa nào không xuất hiện trong kết quả trả về. Còn NATURAL LANGUAGE MODE thì tìm kiếm những kết quả thích hợp (relavance) hơn là chính xác keyword được tìm.

Mặc định thì MySQL có một list các stopwords, nghĩa là các từ mà MySQL sẽ bỏ qua không search nếu gặp phải nó (ví dụ: the, and, or, for v.v). Tham khảo stop words list của MySQL ở đây.

Ngoài ra thì mặc định MySQL FTS chỉ tìm những từ có độ dài tối thiểu là 4 ký tự (global variable ft_min_word_len = 4). Từ thực tế, nếu như ta search những chữ có độ dài bé hơn 4 (ví dụ "Hà Nội", "Cà Mau","Y tá","Thư ký" "The way I am") thì sẽ không có kết quả nào trả về, cho nên ta phải lưu ý tới thiết lập này của MySQL.

```SHOW VARIABLES LIKE 'ft%'```

{% highlight sql %}
mysql> SHOW VARIABLES LIKE 'ft_%';
+--------------------------+----------------+
| Variable_name            | Value          |
+--------------------------+----------------+
| ft_boolean_syntax        | + -><()~*:""&| |
| ft_max_word_len          | 84             |
| ft_min_word_len          | 4              |
| ft_query_expansion_limit | 20             |
| ft_stopword_file         | (built-in)     |
+--------------------------+----------------+
5 rows in set (0.11 sec)

mysql>
{% endhighlight %}  

IV. Ứng dụng tham khảo

{% highlight sql %}
CREATE TABLE IF NOT EXISTS `jobs` ( 
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT, 
  `id_user` INT(11) UNSIGNED DEFAULT NULL, 
  `title` VARCHAR(255) COLLATE utf8_unicode_ci NOT NULL, 
  `location` VARCHAR(255) COLLATE utf8_unicode_ci NOT NULL, 
  `description` TEXT COLLATE utf8_unicode_ci NOT NULL, 
   FULLTEXT INDEX(title, description), 
) ENGINE=MyISAM COLLATE=utf8_unicode_ci;

SELECT * FROM `jobs ` 
WHERE MATCH(title, description) 
AGAINST (‘developers’ IN NATURAL LANGUAGE MODE); 


SELECT * FROM `jobs ` 
WHERE MATCH(title, description) 
AGAINST (‘developers’ IN BOOLEAN MODE);
{% endhighlight %}  

Bài này ta chỉ tìm hiểu sơ lược về MySQL full text search, entry sau chúng ta sẽ tìm hiểu kỹ hơn về full text search syntax, NATURAL LANGUAGE MODE, BOOLEAN MODE.
