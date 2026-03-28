---
layout: post
title: "ElasticSearch và Geospatial search"
date: 2014-10-09 8:00 PM
categories: [nosql, search-engine, information-retrieval, vi]
author: hungneox
tags : [geospatial, elasticsearch, information-retrieval]
comments: true
---

Mục đích của entry này không đi sâu vào tất cả các khía cạnh của ElasticSearch mà chỉ giới thiệu sơ lược về GeoSpatial trong search engine này.

![ElasticSearch Logo](/assets/posts/elasticsearch-va-geospatial-search/elasticsearch-logo.jpg)

### I. Đôi điều ElasticSearch
[ElasticSearch](http://www.elasticsearch.org/) cũng giống như [Apache Solr](http://lucene.apache.org/solr/) là một **Lucence-based** search engine. Nhưng nó linh hoạt, **hiện đại** và dễ sử dụng hơn [Solr (xem thêm)]({% post_url 2013-08-18-tim-hieu-ve-apache-solr %}). Có thể xem bảng so sánh giữa [Solr và ElasticSearch](http://solr-vs-elasticsearch.com/).

ElasticSearch có một số ưu điểm như sau:

* Schemaless:
    * Không cần cấu hình phức tạp, ElasticSearch sẽ tự động phát hiện các kiểu dữ liệu cơ bản mà ta đưa vào. Do đó ta chỉ cần tiến hành `index` tài liệu ngay sau khi cài đặt xong. Tuy nhiên với các kiểu dữ liệu khác ngoài các kiểu dữ liệu cơ bản, như `geo_point`, `geo_shape` thì chúng ta phải tiến hành [mapping](http://www.elasticsearch.org/guide/en/elasticsearch/guide/current/mapping-intro.html).
* RESTful API
    * ElasticSearch hỗ trợ thêm, xoá, sửa `indices` thông qua các phương thức `HTTP` như `GET`, `POST`, `DELETE` và `PUT`, hỗ trợ params dưới dạng JSON thay vì chỉ là `GET` `params`.
* Distributed (mà không cần cài thêm bất cứ ứng dụng nào như [Apache Zookeeper](http://zookeeper.apache.org/)) 
* Near real-time search.

{% comment %}
Thật ra thì giữa Solr và ElasticSearch là bên tám lạng, người nửa cân. Từ Solr 4.4 trở đi đã hỗ trợ RESTful API và Schemaless. Nếu cực đoan quá thì cũng giống như việc so sánh `Emacs` và `VIM` vậy, tốt nhất là nên hiểu thật rõ và theo một trong hai cái. Một trong những điểm khác nhau cơ bản của Solr và ElasticSearch là cơ chế phân tán. Trong khi Solr tiến hành `index` và sau đó gửi `segment file` đến các server, còn ElasticSearch gửi các tài liệu cần `index` đến các server khác để tiến hành `indexing` riêng .
{% endcomment %}

Để hiểu rõ về cơ chế `indexing` của các search engine thì có thể xem lại các bài trước về `inverted index` [ở đây]({% post_url 2012-04-01-mysql-full-text-search-p3 %}) và `vector space model` và [ở đây]({% post_url 2013-10-27-tim-hieu-ve-mo-hinh-khong-gian-vector %}). Xem cách cài đặt ElasticSearch (ES) [ở đây](https://www.digitalocean.com/community/tutorials/how-to-install-elasticsearch-on-an-ubuntu-vps). Và xem thêm giới thiệu về ES ở đây [Elasticsearch – Awesome seach and index engine](http://trankimhieu.com/technology/chia-se/elasticsearch-awesome-seaching-engine.html)

### II. Tìm kiếm địa điểm trong ElasticSearch

ElasticSearch hỗ trợ mapping một số kiểu dữ liệu như là `geo_point`, `geo_shape`. Ngoài ra, ElasticSearch còn cung cấp các chức năng `filter` và `aggregation`, để giải quyết những vấn đề như: Tìm điểm gần nhất, hay thống kê có bao nhiêu điểm trong một khu vực cho trước.

Ví dụ ta mapping một cấu trúc index như sau:

{% highlight json %}
curl -XPUT http://localhost:9200/business -d '
{
 "mappings" : {
    "restaurant": {
        "properties": {
            "name": {
                "type": "string"
            },
            "location": {
                "type"          : "geo_point",
                "geohash"       : true,
                "geohash_prefix": true
            },
            "address" : {
                "type" : "string"
            }
      }
    }
  }
}'
{% endhighlight %}

Chúng ta có một số địa điểm như sau:

{:.table.table-bordered}
|             name            |    lat    |    lon     |   geohash    |                      address                      |
| --------------------------- | --------- | ---------- | ------------ | ------------------------------------------------- |
| Beafsteak Nam Sơn           | 10.775365 | 106.690952 | w3gv7dv8xfep | 200 Bis Nguyễn Thị Minh Khai, P. 6, Quận 3        |
| Đo Đo Quán                  | 10.768050 | 106.688704 | w3gv7b227jbp | 10/14 Lương Hữu Khánh, P. Phạm Ngũ Lão, Quận 1    |
| Chè Hà Ký                   | 10.754105 | 106.658514 | w3gv5jdr5qxb | 138 Châu Văn Liêm, P. 11, Quận 5                  |
| Cơm Gà Đông Nguyên          | 10.755465 | 106.652302 | w3gv5j4tmxxu | 89-91 Châu Văn Liêm, P. 14, Quận 5                |
| Nhà Hàng Sân Vườn  Bên Sông | 10.831478 | 106.724668 | w3gvsef9bvzc | 7/3 Kha Vạn Cân, P. Hiệp Bình Chánh, Quận Thủ Đức |
| Lẩu Dê Bình Điền            | 10.869835 | 106.763260 | w3gvv6y9kk0e | 1296C Kha Vạn Cân, Quận Thủ Đức                   |

[Lấy snippet ở đây](https://gist.github.com/hungnq1989/fc9241dfb45e1e4da166)

**Có một điểm hay là chúng ta chỉ cần nhập vào `lat` và `long` còn `geohash` thì ElasticSearch tự sinh ra.**

#### - Geo sort

Ví dụ ta muốn tìm và sắp xếp cách địa điểm theo khoảng cách từ gần đến xa từ một vị trí đã biết kinh độ và vĩ độ:

{% highlight json %}
curl -XPOST "http://localhost:9200/business/restaurant/_search?pretty=1" -d'
{
   "query" : {
        "match_all" : {}
    },
    "sort" : [
        {
            "_geo_distance" : {
                "location" : {
                    "lat" : 10.776945451753402,
                    "lon" : 106.69494867324829
                },
                "order" : "asc",
                "unit" : "km",
                "distance_type" : "arc"
            }
        }
    ]
}'
{% endhighlight %}

#### - Geo filter
Ví dụ, chúng ta đang đứng ở dinh Độc lập có toạ độ là (`10.776945451753402`,`106.69494867324829`). Ta muốn lọc ra các địa điểm có xung quanh khu vực này 4km (trong ví dụ này mình muốn lấy bán kính là 4km, vì 5km sẽ chạm tới khu vực Quận 5).
, thì tiến hành truy vấn như sau:

{% highlight json %} 
curl -XGET "http://localhost:9200/business/restaurant/_search?pretty=1 " -d'
{
    "filter" : {
        "geo_distance" : {
            "location" : {
                "lat" : 10.776945451753402,
                "lon" : 106.69494867324829
            }, 
            "distance": "4km",
            "distance_type": "arc"
        }
    }
}'
{% endhighlight %}

ElasticSearch sẽ trả về các [**kết quả**](https://gist.github.com/hungnq1989/cd25a85e1064e4e21535) trong phạm vi bán kính 4km tính từ điểm có toạ độ được chỉ định.

#### - Geo aggregation
**Lưu ý, mấy cái `aggregation` chỉ dùng được từ ElasticSearch 1.0.0 trở về sau

Ví dụ, thống kê tất cả `geohash` giống nhau 5 ký tự đầu tiên (Tức là thống kê những địa điểm trong cùng một khu vực 5 $$km^2$$)

{% highlight json %}
curl -XGET "http://localhost:9200/business/restaurant/_search?pretty=1 " -d'
{
    "size": 0,
    "aggregations" : {
        "restaurant-geohash" : {
            "geohash_grid" : {
                "field" : "location",
                "precision" : 5
            }
        }
    }
}'
{% endhighlight %}

Kết quả
{% highlight json %}
{
  ...
  "aggregations" : {
    "restaurant-geohash" : {
      "buckets" : [ {
        "key" : "w3gv7",
        "doc_count" : 2
      }, {
        "key" : "w3gv5",
        "doc_count" : 2
      }, {
        "key" : "w3gvv",
        "doc_count" : 1
      }, {
        "key" : "w3gvs",
        "doc_count" : 1
      } ]
    }
  }
}

{% endhighlight %}
#### - Full-text search

Ngoài ra chúng ta có thể thực hiện các câu truy vấn từ đơn giản (match) cho tới cách câu truy vấn phức tạp như:

Tìm chính xác
{% highlight json %} 
curl -XGET 'localhost:9200/business/restaurant/_search?size=50&pretty=1' -d '
{
  "size": 3,
    "query": {
        "match": {"name": "Lẩu Dê Bình Điền"}
    }
}'
{% endhighlight %}

Tìm gần đúng

{% highlight json %} 
curl -XGET 'localhost:9200/business/restaurant/_search?size=50&pretty=1' -d '
{
    "query": {
        "fuzzy_like_this" : {
            "fields" : ["address", "name"],
            "like_text" : "De Thu Duc",
            "max_query_terms" : 12
        }
    }
}'
{% endhighlight %}

### III. Giới thiệu về geohash 

![World GeoHash](/assets/posts/elasticsearch-va-geospatial-search/world1.jpg)

Bình thường thì để xác định toạ độ của một điểm *bất kỳ* trên bản đồ thì ta dùng kinh độ (longtitude) và vĩ độ  (latitude). Geohash là một hệ thống mã base-32 thay thế, để thể hiện kinh độ  và vĩ độ thay vì dưới dạng số thì dưới dạng kết hợp giữa chữ và số. Bằng cách không ngừng chia nhỏ bản đồ thành những ô vuông được đánh ký hiệu (bao gồm 0-9-a-z). Ví dụ geohash của dinh Độc Lập là `w3gv7cvnryzz` (`10.776945451753402`,`106.69494867324829`). 

Đối với kinh độ và vĩ độ thì độ chính xác cũng khá quan trọng, nếu chúng ta thu gọn toạ độ trên thành `10.77` và `106.69` thì nó sẽ lệch đi một khoảng 1.3km ([Hẻm 150 Nguyễn Trãi](https://www.google.fi/maps/place/10%C2%B046'12.0%22N+106%C2%B041'24.0%22E/) thay vì số [8 Huyền Trân Công Chúa](https://www.google.fi/maps/place/10°46'37.0"N+106°41'41.8"E)). Cái này chúng ta có thể kiểm tra bằng Google Maps.

Và những khu vực lân cận 20 $$km^2$$ của dinh Độc Lập sẽ có cùng prefix là `w3gv`, do đó dùng geohash rất có lợi nếu như muốn tìm những địa điểm gần với một điểm đã biết dùng `inverted index`. Cũng như kinh độ và vĩ độ, geohash càng dài thì vị trí càng chính xác.

{:.table.table-bordered}
| GeoHash length |  Area height x width  |
| -------------- | --------------------- |
|              1 | 5,009.4km x 4,992.6km |
|              2 | 1,252.3km x 624.1km   |
|              3 | 156.5km x 156km       |
|              4 | 39.1km x 19.5km       |
|              5 | 4.9km x 4.9km         |
|              6 | 1.2km x 609.4m        |
|              7 | 152.9m x 152.4m       |
|              8 | 38.2m x 19m           |
|              9 | 4.8m x 4.8m           |
|             10 | 1.2m x 59.5cm         |
|             11 | 14.9cm x 14.9cm       |
|             12 | 3.7cm x 1.9cm         |

### IV. Kết luận

ElasticSearch là một giải pháp tìm kiếm vô cùng tiện lợi và hiệu quả, không chỉ để ứng dụng làm full-text search engine thông thường mà còn giúp giải quyết dễ dàng các vấn đề tìm kiếm trong không gian (spatial search). Tuy triển khai nhanh và dễ dàng nhưng nó cũng là một giải pháp lâu dài cho các ứng dụng `location based`. Foursquare là một trong những công ty tiên phong chuyển từ Solr sang ElasticSearch từ tháng 8-2012. Ngoài ra nhiều công ty công nghệ khác như Github, Soundclound cũng sử dụng ElasticSearch phục vụ cho việc tìm kiếm của mình.

### References:
* Elastic Search
    * "geo distance filter", n.d <[http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-geo-distance-filter.html](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-geo-distance-filter.html)>
    * "geohash grid aggregation", n.d <[http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/search-aggregations-bucket-geohashgrid-aggregation.html](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/search-aggregations-bucket-geohashgrid-aggregation.html)>
* Một số tiện ích      
    * [http://geohash.gofreerange.com/](http://geohash.gofreerange.com/)
    * [http://openlocation.org/geohash/geohash-js/](http://openlocation.org/geohash/geohash-js/)
* Một số bài viết liên quan
    * Gauth, 2012, "Find closest subway station with ElasticSearch" <[http://gauth.fr/2012/09/find-closest-subway-station-with-elasticsearch/](http://gauth.fr/2012/09/find-closest-subway-station-with-elasticsearch/)>
    * Florian Hopf, 2014, Use Cases for Elasticsearch: Geospatial Search" <[http://blog.florian-hopf.de/2014/08/use-cases-for-elasticsearch-geospatial.html](http://blog.florian-hopf.de/2014/08/use-cases-for-elasticsearch-geospatial.html)>
    * ckendell, n.d, "How To Install Elasticsearch on an Ubuntu VPS", <[https://www.digitalocean.com/community/tutorials/how-to-install-elasticsearch-on-an-ubuntu-vps](https://www.digitalocean.com/community/tutorials/how-to-install-elasticsearch-on-an-ubuntu-vps)>
    * holdenkarau & adamalix, 2012, "foursquare now uses Elastic Search (and on a related note: Slashem also works with Elastic Search)!" <[http://engineering.foursquare.com/2012/08/09/foursquare-now-uses-elastic-search-and-on-a-related-note-slashem-also-works-with-elastic-search/](http://engineering.foursquare.com/2012/08/09/foursquare-now-uses-elastic-search-and-on-a-related-note-slashem-also-works-with-elastic-search/)>

