---
layout: post
title: "MySQL full-text search — part 1"
date: 2011-11-26 8:00 PM
categories: [search-data]
author: hungneox
description: "What full-text search is, why LIKE falls short, and a quick look at MySQL FTS."
image: /assets/images/mysql.png
comments: true
---

## I. What is full-text search?

In simple terms, **full-text search** (FTS) is the most natural way to look up information—much like Google: you type a keyword, press Enter, and get results. This article only introduces FTS **in MySQL**; it does not cover external FTS engines such as Sphinx or Solr.

<!--more-->

## II. Why bother with full-text search?

Usually we search with queries like:

```sql
SELECT id, title, description FROM book WHERE title LIKE '%keyword%'
```

That pattern has several limitations:

(Note: these are general MySQL limitations. Even MySQL’s own full-text search does not fully solve all of them—you often need external engines like Solr or Sphinx. They are listed here so we are clear about what `LIKE` cannot do well.)


### 1. Imprecise results

**High noise**

Suppose you use a `LIKE` clause such as:

`Title LIKE '%one%'`

You may get matches like: `one`, `zone`, `money`, `phone`—broad, noisy, and not what the user meant.

**Synonyms**

Every language has synonyms. In Vietnamese, *xe hơi* / *ô tô*, *bao thư* / *phong bì*, and so on. In English, *color* / *colour*, *check* / *cheque*, *developer* / *programmer*. Plain `LIKE` or `=` (and even MySQL FTS out of the box) will not map synonyms for you.

**Acronyms**

Long, common phrases are often abbreviated: THPT, CNTT, US, IT. Users may type the short form while the database stores the full phrase (or the other way around). Search should still find the right row whether they type the abbreviation or the full form.

### 2. Slow queries: `'%keyword%'` may skip the index

If the wildcard `%` is at the **beginning**, MySQL often cannot use an index and must **scan** the whole table—similar to flipping every page of a book instead of using the index at the back. We’ll say more about why indexes help in later posts.

The index can also be used for `LIKE` comparisons when the right-hand side is a **constant string that does not start with a wildcard** (see [References](#references), item 4).

### 3. Vietnamese: with vs without diacritics

If you store accented Vietnamese but the user types unaccented text, `LIKE` will usually miss. One workaround is two columns (accented / unaccented), but that is clumsy and still weak for fuzzy matching. If someone types something like `co be mua dogn` (typos and no accents), `LIKE` will not find *Cô bé mùa Đông*—whereas a proper FTS pipeline can help. (The same class of problem exists for other languages with rich diacritics.)

## III. MySQL full-text search in brief

Historically, MySQL FTS was **MyISAM-only**; **InnoDB** gained FTS in **5.6** (beta at the time of this post).

There are two modes: **BOOLEAN MODE** and **NATURAL LANGUAGE MODE**. In **BOOLEAN MODE** there is no default relevance ordering, and you can require or exclude keywords. **NATURAL LANGUAGE MODE** ranks by **relevance** rather than exact keyword equality.

By default MySQL uses a **stopword** list—tokens it ignores (e.g. *the*, *and*, *or*, *for*). See the MySQL manual for the [full-text stopword list](https://dev.mysql.com/doc/refman/8.0/en/fulltext-stopwords.html).

By default MySQL only indexes words of length **≥ 4** (`ft_min_word_len = 4`). Shorter tokens (e.g. place names or short words in Vietnamese, or phrases like *The way I am* where some words are short) may not match until you tune this—so keep these settings in mind.

```sql
SHOW VARIABLES LIKE 'ft%';
```

```sql
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
```

## IV. Minimal example

```sql
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_user` INT(11) UNSIGNED DEFAULT NULL,
  `title` VARCHAR(255) COLLATE utf8_unicode_ci NOT NULL,
  `location` VARCHAR(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` TEXT COLLATE utf8_unicode_ci NOT NULL,
  FULLTEXT INDEX(title, description)
) ENGINE=MyISAM COLLATE=utf8_unicode_ci;

SELECT * FROM `jobs`
WHERE MATCH(title, description)
AGAINST ('developers' IN NATURAL LANGUAGE MODE);

SELECT * FROM `jobs`
WHERE MATCH(title, description)
AGAINST ('developers' IN BOOLEAN MODE);
```

This post is only a quick tour of MySQL full-text search. The next one goes deeper into FTS syntax, **NATURAL LANGUAGE MODE**, and **BOOLEAN MODE**.

## References

Official **MySQL 8.0** documentation (topics touched in this post):

1. **[Full-text search](https://dev.mysql.com/doc/refman/8.0/en/fulltext-search.html)** — `MATCH … AGAINST`, natural language vs boolean mode, and InnoDB/MyISAM considerations.

2. **[Full-text stopwords](https://dev.mysql.com/doc/refman/8.0/en/fulltext-stopwords.html)** — default ignored terms and how they affect matching.

3. **Fine-tuning token length and stopwords:** [`ft_min_word_len`](https://dev.mysql.com/doc/refman/8.0/en/server-system-variables.html#sysvar_ft_min_word_len), [`ft_stopword_file`](https://dev.mysql.com/doc/refman/8.0/en/server-system-variables.html#sysvar_ft_stopword_file), and related [`ft_*` server variables](https://dev.mysql.com/doc/refman/8.0/en/server-system-variables.html) (search the page for `ft_`).

4. **`LIKE` vs indexes** — [The `LIKE` operator](https://dev.mysql.com/doc/refman/8.0/en/string-comparison-functions.html#operator_like) (when leading `%` prevents index use); [B-Tree index characteristics](https://dev.mysql.com/doc/refman/8.0/en/index-btree-hash.html) (how the optimizer can use indexes for string comparisons).
