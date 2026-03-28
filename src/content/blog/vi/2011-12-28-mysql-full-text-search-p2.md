---
layout: post
title: "MySQL Full-text Search - P2"
date: 2011-12-28 8:00 PM
categories: [database, mysql, full-text-search, vi]
author: hungneox
tags : [mysql, full-text-search]
comments: true
---
### Giới thiệu

Trong entry trước ta đã tìm hiểu sơ lược về full text search là gì và tại sao chúng ta phải dùng full text search. Trong entry này chúng ta sẽ tìm hiểu kỹ hơn về cú pháp của và cách dùng full text search trong MySQL.
<!--more-->
Chúng ta sẽ sử dụng database mẫu này để thực hiện các ví dụ trong entry này và các entry sau:

{% highlight sql %}
CREATE TABLE articles (
       id INT UNSIGNED AUTO_INCREMENT NOT NULL PRIMARY KEY,
       title VARCHAR(200),
       body TEXT,
       FULLTEXT (title,body)
       );

INSERT INTO articles (title,body) 
      VALUES('MySQL Tutorial','DBMS stands for DataBase ...'),
      ('How To Use MySQL Well','After you went through a ...'),
      ('Optimizing MySQL','In this tutorial we will show ...'),
      ('1001 MySQL Tricks','1. Never run mysqld as root. 2. ...'),
      ('MySQL vs. YourSQL','In the following database comparison ...'),
      ('MySQL Security','When configured properly, MySQL ...');
{% endhighlight %}  

### NATURAL LANGUAGE MODE và BOOLEAN MODE

{% highlight sql %}
MATCH (col1,col2,...) AGAINST (expr [search_modifier])

search_modifier: 
{ 
     IN NATURAL LANGUAGE MODE 
   | IN NATURAL LANGUAGE MODE WITH QUERY EXPANSION    
   | IN BOOLEAN MODE 
   | WITH QUERY EXPANSION 
}
{% endhighlight %}

Trong Natural Language Mode [1](http://dev.mysql.com/doc/refman/5.5/en/fulltext-natural-language.html), chế độ này search theo khái niệm (concepts, thay vì chính xác các từ như Boolean mode) theo ‘free-text queries’ mà chúng ta đưa vào, `MATCH…AGAINST` trả về điểm ranking dạng số thực dựa trên mức độ phù hợp của kết tài liệu tìm thấy, tài liệu trả về càng phù hợp thì có số rank càng cao (như thế nào là phù hợp thì chúng ta sẽ tìm hiểu sau). Muốn biết tài liệu đó có rank bao nhiêu so với từ khóa thì ta có thể sử dụng một câu query như sau:

{% highlight sql %}
SELECT id, ROUND(MATCH(title, body) AGAINST('database'), 7) FROM `articles`
{% endhighlight %}

Còn trong Boolean Mode[2], chế độ này search theo những từ mà chúng ta đưa vào, và kết quả trả về không được sắp xếp theo thứ tự nào. Khác với Natural language mode, chúng ta thậm chí có thể thực hiện search mà không cần full text index. Ngoài ra, chúng ta có thể dùng các toán tử như `+` và `–` để quyết định từ nào có trong kết quả trả về, từ nào không có.

Ví dụ như câu query sau:
{% highlight sql %}
SELECT * FROM articles WHERE MATCH (title,body) AGAINST ('+MySQL -YourSQL' IN BOOLEAN MODE);
{% endhighlight %}

Thì kết quả trả về chỉ bao gồm những tài liệu nào chứ chữ MySQL mà không được phép chứa chữ YourSQL.

Ngoài ra chúng ta có thể dùng các wildcard sau để MySQL xếp hạng các kết quả dựa theo yêu cầu của chúng ta.

Ví dụ:

1.`‘apple banana’`
Tìm những dòng mà có chứa ít nhất 1 trong 2 chữ.

2.`‘+apple +juice’`
Tìm những dòng phải chứa cả hai chữ trên

3.`‘+apple macintosh’`
Tìm những dòng mà bắt buộc phải chứa apple, chứa hoặc không chứ macintosh

4.`‘+apple –macintosh’`
Tìm những dòng bắt buộc chứa apple mà không được chứ macintosh

5.`‘+apple ~macintosh’`
Tìm những dòng bắt buộc chứa apple, có thể chứa macintosh, nhưng dòng nào không chứa macintosh thì được xếp hạng cao hơn

6.`‘+apple +(>turnover <studel)`
Tìm những dòng có chứa apple và turnover, hoặc apple và strudel, nhưng xếp hạng “apple turnover” cao hơn “apple strudel” 

7.`‘apple*’`
Tìm những dòng có chứa các chữ như “apple”, “apples”, “applesauce “, “applet” 

8.`‘”some words“’` 
Tìm những dòng có chứa chính xác cụm “some words”

Với  Query expansion (`WITH QUERY EXPANSION` hoặc `IN NATURAL LANGUAGE MODE WITH QUERY EXPANSION`), MySQL sẽ thực hiện thao tách search 2 lần, trong lần search thứ 2 MySQL sẽ tìm kết hợp cụm từ tìm kiếm gốc với những từ thích hợp nổi bật so với từ khóa gốc

Ví dụ:
Ta search từ "database" thì kết quả trả về sẽ là (theo như dữ liệu ở trên):

{% highlight sql %}
SELECT * FROM articles WHERE MATCH(title,body) AGAINST('database'); 
{% endhighlight %}

Với Query expansion, thì MySQL nhận thấy rằng trong 2 kết quả trả về có chứa từ khóa "database" thì còn chứa từ chung là 'MySQL'. Nên đồng thời MySQL cũng trả về kết quả có chứa từ MySQL mặc dù không có chứa từ database.

Theo như tài liệu của MySQL, thì search với Query expansion có thể làm tăng độ nhiễu (noise) và các tài liệu không phù hợp, cho nên ta chỉ  thực hiện search với Query expansion với những từ khóa ngắn. 

Chúng ta nên sửa dụng BM trong trường hợp dữ liệu quá ít (ít rows trong tables) hoặc dữ liệu testing lặp đi lặp lại nội dung. Vì khi cơ chế của Natural Language Mode sẽ ranking trọng số (weight) của các từ khó dựa trên số lần xuất hiện của từ đó trong một row và trong toàn bảng. Càng xuất hiện nhiều lần trong cả bảng dữ liệu thì điểm càng thấp. Cho nên khả năng MySQL trả về empty set là rất cao.

Có một vấn đề nhỏ khi dùng Boolean Mode để search các keyword có chứa các ký tự như `(+-~>* v.v)` là các ký tự đó trùng với toán tử wild card trong boolean mode. Ví dụ keyword SBD-1107 sẽ có ký tự `-` (hyphen hay dash) trùng với toán tử `-` của boolean mode. Trong trường hợp này có có thể dùng thêm cụm `HAVING field LIKE 'SBD-1107%'` để tìm, như đã nói ở bài trước tuy là toán tử `LIKE` nhưng dùng dấu `%` ở cuối nên nó vẫn được tìm kiếm trên index và đảm bảo tốc độ.

Trong entry tới, ta sẽ tìm hiểu thêm về cơ chế ranking của MySQL full text search và full text search index.