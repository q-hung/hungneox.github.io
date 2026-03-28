---
layout: post
title: "ElasticSearch và Faceted search" 
date: 2018-02-23 14:00
categories: [elasticsearch]
author: hungneox
tags : [faceted-search, elasticsearch]
description: "ElasticSearch và Faceted search"
image: /assets/images/laravel.jpg
comments: true
published: false
---

# Faceted search

Faceted search hay còn gọi là faceted navigation, tạm dịch là tìm kiếm đa diện hay điều hướng đa diện. Nó là một kỹ thuật dùng để tra cứu thông tin dựa trên hệ thống phân loại đa diện (faceted classification system), cho phép người dùng có thể tìm kiếm và truy vấn thông tin một cách có hiệu quả bằng cách sàng lọc ra những kết quả mong muốn bằng nhiều bộ lọc cùng một lúc.

Các bộ lọc facets tương ứng với các thuộc tính của phần tử tìm kiếm. Ví dụ điện thoại thì có hãng sản xuất, màu sắc, hệ điều hành, kích thước màn hình, cân nặng v.v. Mỗi một thuộc tính như vậy có thể được xem là một mặt của thành phần thông tin trong hệ thống, trong trường hợp này nó là một mặt của sản phẩm điện thoại di động.

Điểm khác biệt của tìm kiếm đa diện và các bộ lọc thông thường là nó cung cấp thông tin tổng hợp về các facets có trong tập hợp dữ liệu. Cụ thể hơn với kiểu lọc thông thường thì khi chúng ta lọc ra những điện thoại có màu đỏ, thì chúng ta chỉ nhận về kết quả bao gồm các điện thoại có màu đỏ, mà không có bất kỳ thông tin nào về các màu khác. Ví dụ như có câu truy vấn SQL giả như sau:

`SELECT * from phones where color = 'RED'`

Còn với tìm kiếm đa diện, mà cụ thể ở đây là ElasticSearch, ngoài kết quả tìm kiếm tương ứng được trả về chúng ta còn có thêm thông tin về các buckets chứa các thuộc tính khác. Ví dụ ngoài danh sách điện thoại màu đỏ, chúng ta còn biết được trong toàn bộ tập dữ liệu có bao nhiêu điện thoại màu xanh, màu đen, màu trắng v.v. Nhờ đó, giao diện người dùng có thể hiển thị các bộ lọc kèm theo số lượng kết quả tương ứng, giúp người dùng dễ dàng thu hẹp phạm vi tìm kiếm.

Nếu bạn hay mua sắm trực tuyến thì chắc hẳn bạn đã thấy kiểu tìm kiếm này rất quen thuộc. Các trang thương mại điện tử như Amazon, Lazada hay Tiki đều sử dụng faceted search để người dùng có thể lọc sản phẩm theo thương hiệu, khoảng giá, đánh giá vân vân và mây mây.

# Aggregations trong ElasticSearch

Trong ElasticSearch, faceted search được triển khai thông qua cơ chế **Aggregations** (trước đây gọi là Facets API, nhưng đã bị deprecated từ phiên bản 1.x). Aggregations cho phép chúng ta nhóm và tính toán thống kê trên dữ liệu, đồng thời trả về cùng lúc với kết quả tìm kiếm.

Có ba loại aggregations chính:

- **Bucket Aggregations**: Nhóm các documents vào các "xô" (buckets) dựa trên giá trị của một trường hoặc một điều kiện nào đó. Ví dụ nhóm điện thoại theo hãng sản xuất.
- **Metric Aggregations**: Tính toán các giá trị thống kê trên một tập documents, ví dụ tính giá trung bình, giá thấp nhất, giá cao nhất.
- **Pipeline Aggregations**: Thực hiện tính toán dựa trên kết quả của các aggregations khác, thay vì dựa trực tiếp trên documents.

Nói chung, đa số các trường hợp faceted search trên thực tế đều sử dụng Bucket Aggregations kết hợp với Metric Aggregations.

# Ví dụ thực tế

Giả sử chúng ta đang xây dựng một trang thương mại điện tử bán điện thoại. Trước hết, chúng ta tạo một index với mapping như sau:

{% highlight javascript %}
curl -XPUT 'http://localhost:9200/phones' -H 'Content-Type: application/json' -d '
{
  "mappings": {
    "product": {
      "properties": {
        "name":         { "type": "text" },
        "brand":        { "type": "keyword" },
        "color":        { "type": "keyword" },
        "os":           { "type": "keyword" },
        "price":        { "type": "float" },
        "screen_size":  { "type": "float" },
        "rating":       { "type": "float" }
      }
    }
  }
}'
{% endhighlight %}

Có một điểm cần lưu ý là các trường dùng cho faceted search nên được khai báo kiểu `keyword` thay vì `text`. Lý do là vì kiểu `text` sẽ được phân tích (analyze) và tách thành các token, trong khi chúng ta cần giá trị nguyên vẹn để nhóm lại. Ví dụ "Samsung Galaxy" nếu để kiểu `text` sẽ bị tách thành hai token "samsung" và "galaxy", dẫn đến kết quả aggregation sai lệch.

Tiếp theo chúng ta index một vài documents mẫu:

{% highlight javascript %}
curl -XPOST 'http://localhost:9200/phones/product/_bulk' -H 'Content-Type: application/json' -d '
{"index":{}}
{"name":"iPhone X","brand":"Apple","color":"Bạc","os":"iOS","price":999,"screen_size":5.8,"rating":4.5}
{"index":{}}
{"name":"iPhone 8","brand":"Apple","color":"Đen","os":"iOS","price":699,"screen_size":4.7,"rating":4.3}
{"index":{}}
{"name":"Galaxy S9","brand":"Samsung","color":"Đen","os":"Android","price":720,"screen_size":5.8,"rating":4.4}
{"index":{}}
{"name":"Galaxy Note 8","brand":"Samsung","color":"Vàng","os":"Android","price":950,"screen_size":6.3,"rating":4.6}
{"index":{}}
{"name":"Pixel 2","brand":"Google","color":"Trắng","os":"Android","price":649,"screen_size":5.0,"rating":4.2}
{"index":{}}
{"name":"Pixel 2 XL","brand":"Google","color":"Đen","os":"Android","price":849,"screen_size":6.0,"rating":4.3}
{"index":{}}
{"name":"Xperia XZ2","brand":"Sony","color":"Bạc","os":"Android","price":799,"screen_size":5.7,"rating":4.0}
{"index":{}}
{"name":"Nokia 8","brand":"Nokia","color":"Đỏ","os":"Android","price":499,"screen_size":5.3,"rating":3.9}
'
{% endhighlight %}

## Terms Aggregation

Terms aggregation là loại phổ biến nhất trong faceted search. Nó nhóm các documents theo giá trị của một trường và đếm số lượng documents trong mỗi nhóm. Ví dụ chúng ta muốn biết có bao nhiêu điện thoại theo từng hãng sản xuất:

{% highlight javascript %}
curl -XGET 'http://localhost:9200/phones/product/_search?pretty' -H 'Content-Type: application/json' -d '
{
  "size": 0,
  "aggs": {
    "brands": {
      "terms": {
        "field": "brand"
      }
    }
  }
}'
{% endhighlight %}

Ở đây chúng ta đặt `"size": 0` vì chúng ta chỉ quan tâm đến kết quả aggregation mà không cần lấy danh sách documents. Kết quả trả về sẽ có dạng:

{% highlight javascript %}
{
  "hits": {
    "total": 8,
    "hits": []
  },
  "aggregations": {
    "brands": {
      "buckets": [
        { "key": "Samsung",  "doc_count": 2 },
        { "key": "Apple",    "doc_count": 2 },
        { "key": "Google",   "doc_count": 2 },
        { "key": "Sony",     "doc_count": 1 },
        { "key": "Nokia",    "doc_count": 1 }
      ]
    }
  }
}
{% endhighlight %}

Như vậy chúng ta biết được có 2 điện thoại Samsung, 2 Apple, 2 Google, 1 Sony và 1 Nokia. Thông tin này chính là những gì chúng ta cần để xây dựng giao diện bộ lọc faceted trên frontend.

## Kết hợp nhiều Aggregations

Sức mạnh thực sự của faceted search nằm ở chỗ chúng ta có thể kết hợp nhiều aggregations trong cùng một câu truy vấn. Ví dụ chúng ta muốn đồng thời lấy thống kê theo hãng, theo hệ điều hành, theo màu sắc và theo khoảng giá:

{% highlight javascript %}
curl -XGET 'http://localhost:9200/phones/product/_search?pretty' -H 'Content-Type: application/json' -d '
{
  "size": 5,
  "query": {
    "match_all": {}
  },
  "aggs": {
    "brands": {
      "terms": { "field": "brand" }
    },
    "operating_systems": {
      "terms": { "field": "os" }
    },
    "colors": {
      "terms": { "field": "color" }
    },
    "price_ranges": {
      "range": {
        "field": "price",
        "ranges": [
          { "to": 500 },
          { "from": 500, "to": 700 },
          { "from": 700, "to": 900 },
          { "from": 900 }
        ]
      }
    },
    "avg_price": {
      "avg": { "field": "price" }
    }
  }
}'
{% endhighlight %}

Câu truy vấn trên sẽ trả về cho chúng ta cùng một lúc: danh sách 5 sản phẩm, thống kê theo hãng, theo hệ điều hành, theo màu sắc, theo khoảng giá và giá trung bình. Tất cả trong một request duy nhất! Đây chính là điểm mạnh của ElasticSearch so với các câu truy vấn SQL truyền thống, nơi mà chúng ta phải viết nhiều câu query riêng biệt để lấy từng thống kê.

Kết quả phần aggregations sẽ có dạng như sau:

{% highlight javascript %}
{
  "aggregations": {
    "brands": {
      "buckets": [
        { "key": "Apple",   "doc_count": 2 },
        { "key": "Samsung", "doc_count": 2 },
        { "key": "Google",  "doc_count": 2 },
        { "key": "Sony",    "doc_count": 1 },
        { "key": "Nokia",   "doc_count": 1 }
      ]
    },
    "operating_systems": {
      "buckets": [
        { "key": "Android", "doc_count": 6 },
        { "key": "iOS",     "doc_count": 2 }
      ]
    },
    "colors": {
      "buckets": [
        { "key": "Đen",   "doc_count": 3 },
        { "key": "Bạc",   "doc_count": 2 },
        { "key": "Trắng", "doc_count": 1 },
        { "key": "Vàng",  "doc_count": 1 },
        { "key": "Đỏ",    "doc_count": 1 }
      ]
    },
    "price_ranges": {
      "buckets": [
        { "key": "*-500.0",       "to": 500.0,   "doc_count": 1 },
        { "key": "500.0-700.0",   "from": 500.0, "to": 700.0, "doc_count": 2 },
        { "key": "700.0-900.0",   "from": 700.0, "to": 900.0, "doc_count": 3 },
        { "key": "900.0-*",       "from": 900.0, "doc_count": 2 }
      ]
    },
    "avg_price": {
      "value": 770.625
    }
  }
}
{% endhighlight %}

## Kết hợp Query với Aggregation

Trong thực tế, người dùng thường tìm kiếm trước rồi mới lọc. Ví dụ khi người dùng chọn lọc theo hãng Samsung, chúng ta muốn kết quả tìm kiếm chỉ trả về điện thoại Samsung, nhưng đồng thời vẫn hiển thị đầy đủ các facets khác. Đây là lúc chúng ta cần dùng `post_filter` kết hợp với `aggs`:

{% highlight javascript %}
curl -XGET 'http://localhost:9200/phones/product/_search?pretty' -H 'Content-Type: application/json' -d '
{
  "size": 10,
  "query": {
    "match_all": {}
  },
  "post_filter": {
    "term": { "brand": "Samsung" }
  },
  "aggs": {
    "brands": {
      "terms": { "field": "brand" }
    },
    "colors": {
      "terms": { "field": "color" }
    },
    "price_ranges": {
      "range": {
        "field": "price",
        "ranges": [
          { "to": 500 },
          { "from": 500, "to": 700 },
          { "from": 700, "to": 900 },
          { "from": 900 }
        ]
      }
    }
  }
}'
{% endhighlight %}

Điểm mấu chốt ở đây là `post_filter` chỉ ảnh hưởng đến kết quả tìm kiếm (hits), nhưng **không** ảnh hưởng đến kết quả aggregation. Như vậy danh sách sản phẩm trả về chỉ có Samsung, nhưng phần aggregations vẫn hiển thị tổng quan toàn bộ dữ liệu bao gồm tất cả các hãng. Điều này giúp người dùng biết được nếu bỏ bộ lọc Samsung đi thì còn có những hãng nào khác và bao nhiêu sản phẩm.

Tuy nhiên nếu chúng ta đặt điều kiện lọc trong phần `query` thay vì `post_filter`, thì aggregations cũng sẽ bị ảnh hưởng bởi điều kiện đó. Đây là một lỗi mà nhiều người mắc phải khi mới triển khai faceted search.

## Nested Aggregation

Chúng ta cũng có thể lồng các aggregations với nhau. Ví dụ chúng ta muốn biết giá trung bình của điện thoại theo từng hãng:

{% highlight javascript %}
curl -XGET 'http://localhost:9200/phones/product/_search?pretty' -H 'Content-Type: application/json' -d '
{
  "size": 0,
  "aggs": {
    "brands": {
      "terms": { "field": "brand" },
      "aggs": {
        "avg_price": {
          "avg": { "field": "price" }
        },
        "max_rating": {
          "max": { "field": "rating" }
        }
      }
    }
  }
}'
{% endhighlight %}

Kết quả trả về:

{% highlight javascript %}
{
  "aggregations": {
    "brands": {
      "buckets": [
        {
          "key": "Apple",
          "doc_count": 2,
          "avg_price": { "value": 849.0 },
          "max_rating": { "value": 4.5 }
        },
        {
          "key": "Samsung",
          "doc_count": 2,
          "avg_price": { "value": 835.0 },
          "max_rating": { "value": 4.6 }
        },
        {
          "key": "Google",
          "doc_count": 2,
          "avg_price": { "value": 749.0 },
          "max_rating": { "value": 4.3 }
        },
        {
          "key": "Sony",
          "doc_count": 1,
          "avg_price": { "value": 799.0 },
          "max_rating": { "value": 4.0 }
        },
        {
          "key": "Nokia",
          "doc_count": 1,
          "avg_price": { "value": 499.0 },
          "max_rating": { "value": 3.9 }
        }
      ]
    }
  }
}
{% endhighlight %}

Với kiểu nested aggregation này, chúng ta có thể xây dựng những bảng so sánh rất chi tiết giữa các thương hiệu ngay trên giao diện tìm kiếm.

# Một số lưu ý khi triển khai

1. **Sử dụng kiểu `keyword` cho các trường facet**: Như đã đề cập, nếu dùng `text` thì giá trị sẽ bị tokenize dẫn đến kết quả aggregation sai. Trong trường hợp cần cả tìm kiếm full-text lẫn aggregation trên cùng một trường, chúng ta có thể dùng [multi-fields](https://www.elastic.co/guide/en/elasticsearch/reference/current/multi-fields.html) để khai báo cùng lúc cả hai kiểu.

2. **Hiệu năng**: Aggregations có thể tốn nhiều bộ nhớ, đặc biệt khi dữ liệu lớn. Nên giới hạn `size` trong terms aggregation và sử dụng `shard_size` hợp lý để cân bằng giữa độ chính xác và hiệu năng.

3. **`post_filter` vs `query`**: Như ở trên đã nói, dùng `post_filter` khi muốn aggregation tính trên toàn bộ dữ liệu, dùng `query` khi muốn aggregation cũng bị giới hạn theo điều kiện lọc. Tuỳ vào UX mà chúng ta chọn cách phù hợp.

4. **Filtered Aggregation**: Trong trường hợp phức tạp hơn, khi chúng ta muốn mỗi facet có điều kiện lọc riêng (ví dụ facet hãng thì không bị ảnh hưởng bởi bộ lọc hãng, nhưng bị ảnh hưởng bởi bộ lọc giá), thì phải dùng `filter` aggregation bên trong từng facet. Đây là cách mà các trang thương mại điện tử lớn thường làm.

# Kết luận

Nói chung, faceted search là một tính năng rất phổ biến và hữu ích trong các ứng dụng tìm kiếm hiện đại. ElasticSearch cung cấp một bộ công cụ Aggregations mạnh mẽ và linh hoạt để triển khai tính năng này. Từ những terms aggregation đơn giản cho đến nested aggregation phức tạp, chúng ta có thể xây dựng những trải nghiệm tìm kiếm thông minh và trực quan cho người dùng.

Điểm quan trọng nhất cần nhớ là phân biệt rõ giữa `query`, `post_filter` và `filter` aggregation, vì mỗi cái ảnh hưởng đến kết quả tìm kiếm và aggregation theo cách khác nhau. Nắm vững những khái niệm này thì việc triển khai faceted search trên ElasticSearch không quá khó khăn.

# Tham khảo

1. [Aggregations](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations.html) - ElasticSearch Official Guide
2. [Bucket Aggregations](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket.html)
3. [Post filter](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-post-filter.html)
4. [Multi-fields](https://www.elastic.co/guide/en/elasticsearch/reference/current/multi-fields.html)
5. [Faceted Search – the 120 Million Documents Story](http://www.slideshare.net/sourcesense/faceted-search-the-120-million-documents-story)
