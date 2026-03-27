---
layout: post
title: "Từ đồng nghĩa trong ElasticSearch"
date: 2016-04-23 20:50 PM
categories: [search-engine, information-retrieval]
author: hungneox
tags : [search-engine, information-retrieval, elasticsearch]
description: Từ đồng nghĩa (synonyms) trong ElasticSearch
image: /assets/images/placeholder.jpg
comments: true
---

# Giới thiệu

Khi xây dựng một chức năng tìm kiếm, chúng ta thường gặp một vấn đề đó là nhiều từ khoá có cùng một nghĩa (từ đồng nghĩa hay synonyms). Thật ra về mặt kỹ thuật thì từ đồng nghĩa không chỉ là hai từ đồng nghĩa của cùng một ngôn ngữ. Nó có thể là hai từ thuộc hai ngôn ngữ hoặc các từ viết tắt hoặc rút gọn (abbreviation) hoặc là một bí-danh/alias/nickname của một người hay địa danh. 

Ví dụ những từ như developer, programmer, coder, lập trình viên, kỹ sư phần mềm chẳng có điểm chung về mặt cấu tạo, nhưng chúng gần như mang một nghĩa giống nhau. Ngoài ra thì kiểu như TP.HCM hay Sài Gòn đều chỉ một thành phố duy nhất. Hay ví dụ như Big Apple là nickname của thành phố New York chẳng hạn. Nói chung với thiết lập này, thì chúng ta có khả năng cải thiện kết quả tìm kiếm phù hợp và thông minh hơn. Tuy nhiên, nó cũng có khả năng gây nhiễu và trả về những kết quả không mong muốn.

# Thiết lập cấu hình

Trong bài này thì chúng sẽ đi qua những vấn đề cơ bản, ví dụ như ElasticSearch là gì và làm thế nào để tạo mappings và query vân vân và mây mây. Tuy nhiên có một điểm cần lưu ý là mỗi lần chúng ta thay đổi thiết lập (các filter, analyzer) thì tuy chúng ta không cần phải xoá và tạo lại collection và settings, tuy nhiên chúng phải đóng collection lại trước khi thực hiện thay đổi settings, cụ thể là thêm/ sửa danh sách synonyms.

Ví dụ chúng ta có một collection là butchiso

{% highlight javascript %}
curl -XPOST 'http://localhost:9200/butchiso/_close'

curl -X PUT 'http://localhost:9200/butchiso/_settings' -d \
'{
  "analysis" : {
      "analyzer" : {
        "synonym_analyzer" : {
          "filter" : [ "lowercase", "synonym_filter" ],
          "tokenizer" : "standard"
        }
      },
      "filter" : {
        "synonym_filter" : {
            "type" : "synonym",
            "synonyms" : [ 
              "tphcm,tp.hcm,tp hồ chí minh,sài gòn,saigon",
              "developer,programmer,coder,lập trình viên,kỹ sư phần mềm"
            ],
            "tokenizer" : "keyword"
        }
      }
    }
}'

curl -XPOST 'http://localhost:9200/butchiso/_open'
{% endhighlight %}

Chúng ta có thể chỉ định một file text chứa danh sách các từ đồng nghĩa, tuy nhiên chúng ta vẫn có thể tạo động settings này chỉ có điều phải đóng collection lại trong một lúc. Việc này cũng không quá lâu, tuy nhiên nếu chúng ta muốn thay đổi settings cũng như mappings với zero downtime thì cũng có cách: [Changing Mapping with Zero Downtime](https://www.elastic.co/blog/changing-mapping-with-zero-downtime).

Sau khi thay đổi thiết lập này và re-index toàn bộ collection, chúng ta sẽ thu được kết quả tìm kiếm rộng hơn. Ví dụ khi người search developer thì những kết quả có chứa bất kỳ những từ đồng nghĩa còn lại cũng được trả về.

Việc index lại một cơ sơ dữ liệu lớn thường mất thời gian, tuy nhiên bạn cũng có thể đưa synonym_filter và query analyzer. Nó sẽ tự động analyze keyword và thực hiện việc tìm kiếm rộng hơn dựa trên synonym của keyword đưa vào. 

# Chạy thử synonym_analyzer

![https](/assets/posts/tu-dong-nghia-trong-elasticsearch/elasticsearch.png){: .center-image }

Có một điểm thú vị là chúng ta có thể thử chạy synonym_filter vừa rồi thông qua REST infterface của ElasticSearch.

Ví dụ, chúng ta test thử với keyword là developer, để xem thử có có những synonym nào được tìm thấy.

{% highlight javascript %}
curl -XGET 'http://localhost:9200/butchiso/_analyze?analyzer=synonym_analyzer&pretty' -d  'developer'
{
  "tokens" : [ {
    "token" : "developer",
    "start_offset" : 0,
    "end_offset" : 9,
    "type" : "SYNONYM",
    "position" : 1
  }, {
    "token" : "programmer",
    "start_offset" : 0,
    "end_offset" : 9,
    "type" : "SYNONYM",
    "position" : 1
  }, {
    "token" : "coder",
    "start_offset" : 0,
    "end_offset" : 9,
    "type" : "SYNONYM",
    "position" : 1
  }, {
    "token" : "lập trình viên",
    "start_offset" : 0,
    "end_offset" : 9,
    "type" : "SYNONYM",
    "position" : 1
  }, {
    "token" : "kỹ sư phần mềm",
    "start_offset" : 0,
    "end_offset" : 9,
    "type" : "SYNONYM",
    "position" : 1
  } ]
}
{% endhighlight %}

Như chúng ta thấy, qua synonym_analyzer, chúng ta lấy được các từ đồng nghĩa liên quan. Tuy nhiên nếu chúng ta thử với từ khoá "lập trình viên", thì kết quả khá bất ngờ, đây là vấn đề xảy ra với mutlti-term keyword và Solr cũng bị vấn đề này. Chúng ta có thể trỏ mọi synonym về một từ duy nhất ví dụ "programmer,coder,lập trình viên,kỹ sư phần mềm => developer", tuy nhiên cách này khi người nhập lập trình viên hay coder chỉ nhận được những kết quả khớp vời từ khoá developer.

Cá nhân mình thì chọn cách dùng dấu gạch dưới _ để thay khoản trắng (ví dụ lập_trình_viên), và trong quá trình tạo index thì cũng append thêm 1 chuỗi thay khoảng trắng bằng gạch dưới vào phần index. Ví dụ: "Lập trình viên PHP lập_trình_viên_php", cách này hơi tốn bộ nhớ nhưng có vẻ ổn.

{% highlight javascript %}
curl -XGET 'http://localhost:9200/butchiso/_analyze?analyzer=synonym_analyzer&pretty' -d  'lập trình viên'
{
  "tokens" : [ {
    "token" : "lập",
    "start_offset" : 0,
    "end_offset" : 3,
    "type" : "<ALPHANUM>",
    "position" : 1
  }, {
    "token" : "trình",
    "start_offset" : 4,
    "end_offset" : 9,
    "type" : "<ALPHANUM>",
    "position" : 2
  }, {
    "token" : "viên",
    "start_offset" : 10,
    "end_offset" : 14,
    "type" : "<ALPHANUM>",
    "position" : 3
  } ]
}

{% endhighlight %}



# Tham khảo 
1. Using synonym [https://www.elastic.co/guide/en/elasticsearch/guide/current/using-synonyms.html](https://www.elastic.co/guide/en/elasticsearch/guide/current/using-synonyms.html)
2. Multiword Synonyms and Phrase Queries [https://www.elastic.co/guide/en/elasticsearch/guide/current/multi-word-synonyms.html](https://www.elastic.co/guide/en/elasticsearch/guide/current/multi-word-synonyms.html)
3. Elasticsearch: updating the mappings and settings of an existing index [https://gist.github.com/nicolashery/6317643](https://gist.github.com/nicolashery/6317643)
