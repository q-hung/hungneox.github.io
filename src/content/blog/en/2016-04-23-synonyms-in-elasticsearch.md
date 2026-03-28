---
layout: post
title: "Synonyms in Elasticsearch"
date: 2016-04-23 8:50 PM
categories: [search-data]
author: hungneox
description: Synonyms in Elasticsearch
image: /assets/images/elasticsearch.jpg
comments: true
---

# Introduction

![Asymmetric cryptography](/assets/images/elasticsearch.jpg)

When you build search, you often run into many keywords that share the same meaning (synonyms). Technically, a “synonym” is not only two words that mean the same thing in one language. It can be two words in different languages, abbreviations or shortened forms, or an alias or nickname for a person or place.

For example, words like developer, programmer, coder, lập trình viên, and kỹ sư phần mềm do not look alike, but they mean almost the same thing. TP.HCM and Sài Gòn both refer to one city. Big Apple is a nickname for New York. With this kind of setup you can make search results more relevant and smarter—but it can also add noise and return unwanted hits.

# Configuration

This article walks through basic topics—for example what Elasticsearch is and how to create mappings and queries, and related points. One important note: whenever you change settings (filters, analyzers), you do not have to delete and recreate the index and settings, but you **must close the index** before changing settings—specifically when adding or editing the synonym list.

Suppose we have an index named `butchiso`:

```javascript
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
```

You can point to a text file that lists synonyms, or build these settings dynamically—you still have to close the index for a short time. That is usually quick. If you need to change settings and mappings with zero downtime, see [Changing Mapping with Zero Downtime](https://www.elastic.co/blog/changing-mapping-with-zero-downtime).

After changing this configuration and reindexing the whole index, search becomes broader. For example, when someone searches for `developer`, documents containing any of the other synonymous terms can match as well.

Reindexing a large dataset takes time, but you can also put `synonym_filter` on the **query** analyzer. It will analyze the query and expand search using synonyms of the input keyword.

# Trying `synonym_analyzer`

![Elasticsearch synonym analysis](/assets/posts/tu-dong-nghia-trong-elasticsearch/elasticsearch.png)

You can exercise the `synonym_filter` you just defined through Elasticsearch’s REST API.

For example, test the keyword `developer` to see which synonyms are emitted:

```javascript
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
```

As you can see, `synonym_analyzer` expands to the related synonyms. If you try the phrase **lập trình viên**, the result is more surprising: this is the multi-word synonym problem, and Solr has it too. You can map every synonym to a single term, e.g. `programmer,coder,lập trình viên,kỹ sư phần mềm => developer`, but then users who type **lập trình viên** or **coder** only get matches that align with the **developer** keyword.

Personally I use underscores `_` instead of spaces (e.g. `lập_trình_viên`), and when indexing I also append a string that replaces spaces with underscores. For example: `Lập trình viên PHP lập_trình_viên_php`. It uses a bit more storage but works reasonably well.

```javascript
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

```

# References

1. [Elasticsearch Reference: Synonym token filter](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-synonym-tokenfilter.html) — configuring synonym filters and inline or file-based synonym lists.
2. [Elasticsearch Reference: Synonym graph token filter](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-synonym-graph-tokenfilter.html) — phrase-aware expansion; relevant when synonyms span multiple tokens (the multi-word problem this post mentions).
3. [*Elasticsearch: The Definitive Guide* — Multi-word synonyms and phrase queries](https://www.elastic.co/guide/en/elasticsearch/guide/current/multi-word-synonyms.html) — older but clear narrative on why multi-word synonyms are tricky (Solr-related discussion still applies conceptually).
4. [Updating mappings and settings on an existing index](https://gist.github.com/nicolashery/6317643) (Nicolas Hery, GitHub Gist) — practical notes on closing the index and applying setting changes.
