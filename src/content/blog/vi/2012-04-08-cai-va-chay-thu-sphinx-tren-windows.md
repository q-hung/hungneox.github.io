---
layout: post
title: "Cài và chạy thử Sphinx trên Windows"
date: 2012-04-08 8:00 PM
categories: [database, sphinx, mysql, full-text-search, vi]
author: hungneox
tags : [sphinx, mysql, full-text-search]
comments: true
---

### Giới thiệu

Như cũng đã đề cập ở các bài viết về MySQL full-text search trước, thì Sphinx là một full-text search engine được viết bằng ngôn ngữ C++ và có thể chạy trên hầu hết các hệ điều hành hiện nay (Linux, Windows, Mac, Solaris v.v).

Nhân tiện nói về thêm một chút, Sphinx là con nhân sư trong thần thoại Hy Lạp, Ai Cập. Trong thần thoại Hy Lạp nhân sư được cho là canh gác cổng vào thành phố Thebes, đưa ra câu đố cho bất kỳ ai muốn vào thành, những người không trả lời được sẽ bị nhân sư bóp cổ và ăn thịt >:) 

Sau đây ta sẽ tìm hiểu cách cài đặt và sử dụng Sphinx trong môi trường Windows  cùng với bộ xampp được cài đặt sẵn.

Đầu tiên ta vào trang download của Sphin search để tải về bản binary cho Windows http://sphinxsearch.com/downloads/release/ (ở đây ta chọn bản Win32 binaries w/MySQL support)

Các bước cài đặt khá đơn giản:

* Đầu tiên giải nén sphinx-2.0.4-release-win32.zip vào C:\sphinx
* Sau đó tạo file config sphinx.conf trong C:\sphinx\bin với nội dung như sau
 (Lưu ý là ta sử dụng lại database ở trong bài giới thiệu về MySQL full text search trước cho cấu hình Sphinx, xem ở đây và thêm một cột `last_modified` kiểu `timestamp`)

{% highlight sql %}
CREATE TABLE IF NOT EXISTS `articles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(200) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `body` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `last_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FULLTEXT KEY `title` (`title`,`body`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
{% endhighlight %}

**File cấu hình: sphinx.conf**

{% highlight c %}
source src1
{
  type   = mysql

  sql_host  = localhost
  sql_user  = root
  sql_pass  =
  sql_db    = butchiso
  sql_port  = 3306 # optional, default is 3306

  sql_query  = \
  SELECT id, title, body, last_modified \
  FROM articles

  sql_attr_timestamp = last_modified

  sql_query_info  = SELECT * FROM articles WHERE id=$id
}


index butchiso
{
  source       = src1
  path         = C:\sphinx\data\butchiso
  docinfo      = extern
  charset_type = sbcs
}

indexer
{
  mem_limit  = 32M
}

searchd
{
  listen          = 9312
  listen          = 9306:mysql41
  log             = C:\sphinx\log\searchd.log
  query_log       = C:\sphinx\log\query.log
  read_timeout    = 5
  max_children    = 30
  pid_file        = C:\sphinx\log\searchd.pid
  max_matches     = 1000
  seamless_rotate = 1
  preopen_indexes = 1
  unlink_old      = 1
  workers         = threads # for RT to work
}
{% endhighlight %}

Sau đó ta chạy một số lệnh để cài đặt Sphinx như là một service trong windows

`C:\sphinx\bin>searchd --install --config C:\sphinx\sphinx.conf --servicename Sphinx`

Nói thêm một chút về service, nếu ta muốn gỡ bỏ services này ra thì dùng lệnh sau:

`C:\sc delete Sphinx`

Rồi sau đó chạy lệnh để Sphinx thực hiện index dữ liệu trong MySQL vào index của mình

`C:\sphinx\bin>indexer.exe -c sphinx.conf --all`

Ở đây ta thấy có dòng báo lỗi my_thread_global_end() là do thư viện `libmySQL.dll` đi kèm theo Sphinx chưa được cập nhật mới nhất mà thôi. 

Sau đó là ta có thể thử tiến hành search bằng Sphinx bằng dòng lệnh

Tiếp theo, chúng ta sẽ tìm hiểu cách sử dụng Sphinx để search trong PHP. Đầu tiên ta vào đây để down sphinxapi.php về. Sau đó chúng ta tạo một file php như sau để thử chức năng search. Có một điều thú vị là Sphinx không trả về dữ liệu mà nó chỉ trả về id của record chứa từ khóa ta cần tìm trong MySQL. Do vậy ta phải viết thêm một câu truy vấn để lấy dữ liệu thật.

Trước khi chạy code php này thì chúng ta phải start sercvice Sphinx mà ta install khi nãy. 

{% highlight php %}
<?php 
setServer('127.0.0.1', 9312);
$s->setMatchMode(SPH_MATCH_ANY);
$s->SetConnectTimeout(1);
$s->SetArrayResult(true);
//Search Query
$result = $s->query('YourSQL');

$con = mysql_connect("localhost", "root", "");
if (!$con) {
    die('Could not connect: ' . mysql_error());
}
mysql_select_db("butchiso");

if ($result['total'] > 0) {
    foreach ($result['matches'] as $match) {
        $id = $match['id'];
        $rs = mysql_query("SELECT * FROM articles WHERE id=$id");
        while ($row = mysql_fetch_array($rs, MYSQL_ASSOC)) {
            printf(
              "id: %s - title: %s - body: %s \n", $row["id"], $row["title"], $row["body"]
            );
        }
        mysql_free_result($rs);
    }
} else {
    echo 'No results found';
}

mysql_close($con);
{% endhighlight %}

Kết quả trả về: 
`id: 5 - title: MySQL vs. YourSQL - body: In the following database comparison ... `

Như vậy là chúng ta đã biết cách làm thế nào để setup và chạy thử sphinx cùng với php/mysql trong môi trường Windows. Điều này có ích cho những ai phát triển web trên windows, trong các entry sau có thể chúng ta sẽ tìm hiểu cách cài đặt Sphin trong môi trường máy chủ Linux :).

### References:
Packtpub Sphinx Search Beginners Guide 
http://www.crankberryblog.com/2011/intalling-sphinx-on-wamp-localhost-windows