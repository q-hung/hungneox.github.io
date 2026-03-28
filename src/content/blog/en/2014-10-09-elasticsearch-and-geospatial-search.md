---
layout: post
title: "Elasticsearch and geospatial search"
date: 2014-10-09 8:00 PM
categories: [information-retrieval]
author: hungneox
image: /assets/posts/elasticsearch-va-geospatial-search/elasticsearch-logo.jpg
comments: true
---

This post does not cover every aspect of Elasticsearch; it is a short introduction to **geospatial** features in the engine.

![ElasticSearch Logo](/assets/posts/elasticsearch-va-geospatial-search/elasticsearch-logo.jpg)

### I. A few words about Elasticsearch

[Elasticsearch](http://www.elasticsearch.org/), like [Apache Solr](http://lucene.apache.org/solr/), is a **Lucene-based** search engine. It tends to be more flexible, **modern**, and easier to get started with than Solr ([see also](/en/blog/2013-08-18-introduction-to-apache-solr/)). There is a feature comparison at [Solr vs Elasticsearch](http://solr-vs-elasticsearch.com/).

Some strengths of Elasticsearch:

* **Schemaless**
    * You avoid heavy upfront schema work: Elasticsearch infers basic field types from the documents you send, so you can start **indexing** soon after install. For non-basic types such as `geo_point` and `geo_shape`, you still need explicit [mapping](http://www.elasticsearch.org/guide/en/elasticsearch/guide/current/mapping-intro.html).
* **RESTful API**
    * Create, update, and delete **indices** over **HTTP** (`GET`, `POST`, `DELETE`, `PUT`), with JSON bodies instead of query-string-only `GET` parameters.
* **Distributed** (without extra cluster software such as [Apache ZooKeeper](http://zookeeper.apache.org/))
* **Near real-time** search.

<!-- Solr vs Elasticsearch is a long-running debate. From Solr 4.4 onward, Solr also exposes REST APIs and schemaless options—pushing the comparison toward taste, a bit like Emacs vs Vim: learn one stack deeply. One structural difference is distribution: Solr can index then ship segment files to other nodes, while Elasticsearch routes documents to shards for local indexing. -->

To revisit how **indexing** works in search engines, see the earlier posts on the inverted index [here](/en/blog/2012-04-01-mysql-full-text-search-p3/) and the vector space model [here](/vi/blog/2013-10-27-tim-hieu-ve-mo-hinh-khong-gian-vector) (Vietnamese). For installing Elasticsearch, see [How To Install Elasticsearch on an Ubuntu VPS](https://www.digitalocean.com/community/tutorials/how-to-install-elasticsearch-on-an-ubuntu-vps). For a broader tour, see [Elasticsearch – Awesome search and index engine](http://trankimhieu.com/technology/chia-se/elasticsearch-awesome-seaching-engine.html).

### II. Location search in Elasticsearch

Elasticsearch supports field types such as `geo_point` and `geo_shape`, plus **filters** and **aggregations** for problems like “nearest points” or “how many points fall in this region.”

Example index mapping:

```json
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
```

Sample locations:

{:.table.table-bordered}
|             name            |    lat    |    lon     |   geohash    |                      address                      |
| --------------------------- | --------- | ---------- | ------------ | ------------------------------------------------- |
| Beafsteak Nam Sơn           | 10.775365 | 106.690952 | w3gv7dv8xfep | 200 Bis Nguyễn Thị Minh Khai, P. 6, Quận 3        |
| Đo Đo Quán                  | 10.768050 | 106.688704 | w3gv7b227jbp | 10/14 Lương Hữu Khánh, P. Phạm Ngũ Lão, Quận 1    |
| Chè Hà Ký                   | 10.754105 | 106.658514 | w3gv5jdr5qxb | 138 Châu Văn Liêm, P. 11, Quận 5                  |
| Cơm Gà Đông Nguyên          | 10.755465 | 106.652302 | w3gv5j4tmxxu | 89-91 Châu Văn Liêm, P. 14, Quận 5                |
| Nhà Hàng Sân Vườn  Bên Sông | 10.831478 | 106.724668 | w3gvsef9bvzc | 7/3 Kha Vạn Cân, P. Hiệp Bình Chánh, Quận Thủ Đức |
| Lẩu Dê Bình Điền            | 10.869835 | 106.763260 | w3gvv6y9kk0e | 1296C Kha Vạn Cân, Quận Thủ Đức                   |

[Snippet source](https://gist.github.com/hungnq1989/fc9241dfb45e1e4da166)

**You only need to send `lat` and `lon`; Elasticsearch derives `geohash` for you.**

#### Geo sort

Sort venues by distance from a known latitude/longitude (nearest first):

```json
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
```
#### Geo filter

Standing at Independence Palace (`10.776945451753402`, `106.69494867324829`), we want venues within **4 km** (the example uses 4 km so the circle does not reach District 5; 5 km would):

```json
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
```
Elasticsearch returns [**hits**](https://gist.github.com/hungnq1989/cd25a85e1064e4e21535) inside that 4 km radius from the given point.

#### Geo aggregation

**Note:** `aggregation` APIs require Elasticsearch **1.0.0** or newer.

Example: bucket documents by **geohash** cells that share the same **first five characters**—a coarse “same neighborhood” bucket (roughly on the order of km² for that precision; exact cell size depends on latitude).

```json
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
```
Sample response:

```json
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

```
#### Full-text search

You can combine geo features with text queries, from simple **match** queries to fuzzier ones:

Exact match:

```json
curl -XGET 'localhost:9200/business/restaurant/_search?size=50&pretty=1' -d '
{
  "size": 3,
    "query": {
        "match": {"name": "Lẩu Dê Bình Điền"}
    }
}'
```
Approximate match:

```json
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
```
### III. What is geohash?

![World GeoHash](/assets/posts/elasticsearch-va-geospatial-search/world1.jpg)

Normally you locate a point with **longitude** and **latitude**. **Geohash** is a base-32 encoding that represents the same information as a compact alphanumeric string instead of two decimal numbers. The world is subdivided into labeled cells (using `0–9` and `a–z`). For example, Independence Palace is `w3gv7cvnryzz` at (`10.776945451753402`, `106.69494867324829`).

Precision matters: rounding to `10.77` and `106.69` shifts the point by about **1.3 km**—for example [alley 150 Nguyen Trai](https://www.google.fi/maps/place/10%C2%B046'12.0%22N+106%C2%B041'24.0%22E/) instead of [8 Huyen Tran Cong Chua](https://www.google.fi/maps/place/10°46'37.0"N+106°41'41.8"E). You can verify distances in Google Maps.

Nearby areas within roughly **20 km²** around Independence Palace share the prefix **`w3gv`**, which makes geohash attractive for “near this point” queries backed by an **inverted index**. Like raw coordinates, **longer geohashes mean finer precision**.

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

### IV. Conclusion

Elasticsearch is a practical, powerful search stack—not only for classic full-text search but also for **spatial** problems. It is quick to prototype yet solid enough for long-running **location-based** services. Foursquare was an early mover, [migrating from Solr to Elasticsearch in August 2012](http://engineering.foursquare.com/2012/08/09/foursquare-now-uses-elastic-search-and-on-a-related-note-slashem-also-works-with-elastic-search/). Other teams such as GitHub and SoundCloud also rely on Elasticsearch for search.

### References

**Elasticsearch**

1. [Geo distance filter](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-geo-distance-filter.html) — Distance filters on `geo_point` fields (legacy guide URL; see current [Elasticsearch documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-geo-distance-query.html) for newer releases).

2. [Geohash grid aggregation](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/search-aggregations-bucket-geohashgrid-aggregation.html) — Bucketing documents by geohash cells.

**Tools**

3. [geohash.gofreerange.com](http://geohash.gofreerange.com/) — Interactive geohash explorer.

4. [geohash-js](http://openlocation.org/geohash/geohash-js/) — JavaScript geohash encoder/decoder.

**Articles**

5. Gauth (2012). [Find closest subway station with Elasticsearch](http://gauth.fr/2012/09/find-closest-subway-station-with-elasticsearch/).

6. Florian Hopf (2014). [Use cases for Elasticsearch: Geospatial search](http://blog.florian-hopf.de/2014/08/use-cases-for-elasticsearch-geospatial.html).

7. DigitalOcean Community. [How To Install Elasticsearch on an Ubuntu VPS](https://www.digitalocean.com/community/tutorials/how-to-install-elasticsearch-on-an-ubuntu-vps).

8. Foursquare Engineering (2012). [Foursquare now uses Elasticsearch](http://engineering.foursquare.com/2012/08/09/foursquare-now-uses-elastic-search-and-on-a-related-note-slashem-also-works-with-elastic-search/).
