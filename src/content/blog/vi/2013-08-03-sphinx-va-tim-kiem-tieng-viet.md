---
layout: post
title: "Sphinx và tìm kiếm tiếng Việt"
date: 2013-08-03 8:00 PM
categories: [database, sphinx, mysql, full-text-search, vi]
author: hungneox
tags : [sphinx, mysql, full-text-search]
comments: true
---

### Giới thiệu
Tham khảo cách cài đặt Sphinx ở [bài trước](/2012/04/cai-va-chay-thu-sphinx-tren-windows.html). Đây là file cấu hình giúp Sphinx có thể đánh dấu chỉ mục (indexing) và tiếng kiếm tiếng Việt không phân biệt hoa/ thường có dấu hoặc không dấu (case-insensitive và accents-insensitive).

Về cơ bản, thì chúng ta phải cấu hình charset_table để mapping các ký tự có dấu (accents) trở về các ký tự không dấu (ví dụ như a,á,à,ạ,ã v.v --> a). Điều này rất quan trọng vì trong thực tế không phải lúc nào cũng gõ tiếng Việt có dấu. Và lưu ý, charset_table chỉ cấu hình trên một dòng duy nhất.

Ví dụ chúng ta có bảng images như sau:
{% highlight sql %}
CREATE TABLE IF NOT EXISTS `images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `text` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `path` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `created` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  FULLTEXT KEY `text` (`text`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;
{% endhighlight %}  
Và file cấu hình sphinx.cnf như sau:

{% highlight c %}
source butchiso {
    type     = mysql   
    sql_host = localhost
    sql_user = root
    sql_pass = your_password
    sql_db   = your_database
    sql_port = 3306
    
    sql_query_pre   = SET CHARACTER_SET_RESULTS=utf8
    sql_query_pre   = SET NAMES utf8
    sql_query_range = SELECT MIN(id), MAX(id) FROM images
    sql_range_step  = 128
    sql_query       = SELECT id, text, path, created FROM images WHERE id>=$start AND id<=$end
}
 
index butchiso {
    source = butchiso
    path = /home/www/butchiso/sphinx
    docinfo = extern
    morphology = stem_en
    min_word_len = 3
    min_prefix_len = 0
    charset_type   = utf-8
    charset_table = 0..9, a..z, _, A..Z->a..z,-, U+002C, \
    U+00E0->a, U+00E1->a, U+1EA1->a, U+1EA3->a, U+00E3->a, U+00E2->a, U+1EA7->a, U+1EA5->a, U+1EAD->a, U+1EA9->a, U+1EAB->a, U+0103->a, U+1EB1->a, U+1EAF->a, U+1EB7->a, U+1EB3->a, U+1EB5->a, U+00E8->e, U+00E9->e, U+1EB9->e, U+1EBB->e, U+1EBD->e, U+00EA->e, U+1EC1->e, U+1EBF->e, U+1EC7->e, U+1EC3->e, U+1EC5->e, U+00EC->i, U+00ED->i, U+1ECB->i, U+1EC9->i, U+0129->i, U+00F2->o, U+00F3->o, U+1ECD->o, U+1ECF->o, U+00F5->o, U+00F4->o, U+1ED3->o, U+1ED1->o, U+1ED9->o, U+1ED5->o, U+1ED7->o, U+01A1->o, U+1EDD->o, U+1EDB->o, U+1EE3->o, U+1EDF->o, U+1EE1->o, U+00F9->u, U+00FA->u, U+1EE5->u, U+1EE7->u, U+0169->u, U+01B0->u, U+1EEB->u, U+1EE9->u, U+1EF1->u, U+1EED->u, U+1EEF->u, U+1EF3->y, U+00FD->y, U+1EF5->y, U+1EF7->y, U+1EF9->y, U+0111->y, U+00C0->a, U+00C1->a, U+1EA0->a, U+1EA2->a, U+00C3->a, U+00C2->a, U+1EA6->a, U+1EA4->a, U+1EAC->a, U+1EA8->a, U+1EAA->a, U+0102->a, U+1EB0->a, U+1EAE->a, U+1EB6->a, U+1EB2->a, U+1EB4->a, U+00C8->e, U+00C9->e, U+1EB8->e, U+1EBA->e, U+1EBC->e, U+00CA->e, U+1EC0->e, U+1EBE->e, U+1EC6->e, U+1EC2->e, U+1EC4->e, U+00CC->i, U+00CD->i, U+1ECA->i, U+1EC8->i, U+0128->i, U+00D2->o, U+00D3->o, U+1ECC->o, U+1ECE->o, U+00D5->o, U+00D4->o, U+1ED2->o, U+1ED0->o, U+1ED8->o, U+1ED4->o, U+1ED6->o, U+01A0->o, U+1EDC->o, U+1EDA->o, U+1EE2->o, U+1EDE->o, U+1EE0->o, U+00D9->u, U+00DA->u, U+1EE4->u, U+1EE6->u, U+0168->u, U+01AF->u, U+1EEA->u, U+1EE8->u, U+1EF0->u, U+1EEC->u, U+1EEE->u, U+1EF2->y, U+00DD->y, U+1EF4->y, U+1EF6->y, U+1EF8->y, U+0110->y,

}
 

searchd {
    compat_sphinxql_magics = 0
    port = 3313
    log = /home/www/butchiso/sphinx/logs/searchd.log
    query_log = /home/www/butchiso/sphinx/logs/query.log
    pid_file = /home/www/butchiso/sphinx/logs/searchd.pid
    max_matches = 10000
}
{% endhighlight %}


### Về cơ bản thì Sphinx có 2 phần chính:
* indexer: dùng để đánh dấu chỉ mục dữ liệu (indexing) tài liệu (xem thêm ở bài viế MySQL Full-text search)
* searchd (search deamon): đây là một chương trình chạy ngầm để tìm kiếm trong index. Điểm khác biệt của Sphinx và MySQL là Sphinx không thực sự trả về kết quả, mà chỉ trả về id của dòng cần tìm trong MySQL.

Sau khi cài đặt thì chúng ta cần phải tiến hành index dữ liệu trong database MySQL. Do đây không phải là cấu hình real-time index, nên ta phải thiết lập thêm cronjob để nó index dữ liệu định kỳ và cấu hình để sphinx khởi động cùng server (xem thêm ở đây). Nếu như muốn sử dụng real-time index của Sphinx, thì ta phải sử dụng nó như một storage engine (SphinxSE) của MySQL và phải compile lại source của MySQL (xem thêm ở đây).

{% highlight bash %}
/usr/bin/indexer --config /home/www/butchiso/sphinx/sphinx.conf --all
{% endhighlight %}

Để re-index lại dữ liệu ta phải thêm tham số `--rotate` vào

> --rotate is used for rotating indexes. Unless you have the situation where you can take the search function offline without troubling users, you will almost certainly need to keep search running whilst indexing new documents. --rotate creates a second index, parallel to the first (in the same place, simply including .new in the filenames). Once complete, indexer notifies searchd via sending the SIGHUP signal, and searchd will attempt to rename the indexes (renaming the existing ones to include .old and renaming the .new to replace them), and then start serving from the newer files. Depending on the setting of seamless_rotate, there may be a slight delay in being able to search the newer indexes.

Tức là dùng option `--rotateotate` để tránh trường hợp chức năng search không dùng được khi server đang tiến hành index lại dữ liệu, thì indexer sẽ tạo ra một file index thứ hai để search deamon tìm kiếm trong lúc tiến hành index lại dữ liệu. Sau khi hoàn tất thì, indexer sẽ báo cho search deamon biết để tìm kiếm trong file index mới.

{% highlight bash %}
 /usr/bin/indexer --rotate --config /home/www/butchiso/sphinx/sphinx.conf --all
{% endhighlight %}

Sau đó chúng ta cần phải khởi động search deamon (`searchd`) và trỏ nó tới file cấu hình `sphinx.cnf` ở trên

{% highlight bash %}
/usr/bin/searchd --config  /home/www/butchiso/sphinx/sphinx.conf
{% endhighlight %}

Chúng ta có thể test bằng cách thực hiện tìm kiếm từ dòng lệnh

{% highlight bash %}
/usr/bin/search -c /home/www/butchiso/sphinx/sphinx.conf thich
{% endhighlight %}

Hoặc sử dụng Sphinx Search API . Code này chủ yếu là quick and dirty để test các keywords khác nhau.

{% highlight php %}
<?php
require_once('sphinxapi.php');
//Sphinx
$s = new SphinxClient();
$s->setServer('127.0.0.1', 3313);
$s->setMatchMode(SPH_MATCH_ANY);
$s->SetConnectTimeout(1);
$s->SetArrayResult(true);
//Search Query
$result = $s->Query($_GET['q']);

$con = mysql_connect("localhost", "username", "password");

if (!$con) {
    die('Could not connect: ' . mysql_error());
}

mysql_select_db("butchiso");
mysql_query("set names 'utf8'");

if ($result['total'] > 0) {
    foreach ($result['matches'] as $match) {
        $id = $match['id'];
        $rs = mysql_query("SELECT * FROM images WHERE id=$id");
        while ($row = mysql_fetch_array($rs, MYSQL_ASSOC)) {
            printf("id: %s  - text: %s" . PHP_EOL, $row["id"], $row["text"]);
        }
        mysql_free_result($rs);
    }
} else {
    echo 'No results found';
}

mysql_close($con);
{% endhighlight %}

### References:
* [Install Sphinx Search on Ubuntu Intrepid Ibex](http://www.hackido.com/2009/01/install-sphinx-search-on-ubuntu.html)
* [How To Install and Configure Sphinx on Ubuntu 14.04](https://www.digitalocean.com/community/tutorials/how-to-install-and-configure-sphinx-on-ubuntu-14-04)
* [THINKING SPHINX AND UNICODE](http://yob.id.au/2008/05/08/thinking-sphinx-and-unicode.html)
