---
layout: post
title: "MySQL full-text search — part 2"
date: 2011-12-28 8:00 PM
categories: [information-retrieval]
author: hungneox
description: "MATCH … AGAINST syntax, natural language vs boolean mode, query expansion, and practical caveats."
image: /assets/images/mysql.png
comments: true
---

## Introduction

The [previous post](/en/blog/2011-11-26-mysql-full-text-search-p1/) outlined what full-text search is and why it matters. Here we go deeper into **syntax** and **usage** of full-text search in MySQL.

<!--more-->

We will use the following sample schema for the examples in this post and the next:

```sql
CREATE TABLE articles (
  id INT UNSIGNED AUTO_INCREMENT NOT NULL PRIMARY KEY,
  title VARCHAR(200),
  body TEXT,
  FULLTEXT (title, body)
);

INSERT INTO articles (title, body)
VALUES
  ('MySQL Tutorial', 'DBMS stands for DataBase ...'),
  ('How To Use MySQL Well', 'After you went through a ...'),
  ('Optimizing MySQL', 'In this tutorial we will show ...'),
  ('1001 MySQL Tricks', '1. Never run mysqld as root. 2. ...'),
  ('MySQL vs. YourSQL', 'In the following database comparison ...'),
  ('MySQL Security', 'When configured properly, MySQL ...');
```

## Natural language mode and Boolean mode

```sql
MATCH (col1, col2, ...) AGAINST (expr [search_modifier])

search_modifier:
{
     IN NATURAL LANGUAGE MODE
   | IN NATURAL LANGUAGE MODE WITH QUERY EXPANSION
   | IN BOOLEAN MODE
   | WITH QUERY EXPANSION
}
```

### Natural language mode

In [natural language mode](https://dev.mysql.com/doc/refman/8.0/en/fulltext-natural-language.html), search follows **concepts** (rather than exact token matching like boolean mode) for the free-text query you supply. `MATCH … AGAINST` returns a **relevance score** (a floating-point value) based on how well each matched document fits the query; the better the fit, the higher the rank. (How “fit” is defined is covered later.)

To inspect the rank for a keyword, you can run:

```sql
SELECT id, ROUND(MATCH(title, body) AGAINST ('database'), 7) AS relevance
FROM articles;
```

### Boolean mode

In [boolean mode](https://dev.mysql.com/doc/refman/8.0/en/fulltext-boolean.html), search is driven by the **terms** you pass in, and rows are **not** ordered by relevance by default. Unlike natural language mode, you rely on **explicit operators** (`+`, `-`, `~`, `*`, parentheses, phrase quotes) rather than corpus-wide term statistics alone, to require, exclude, or weight terms.

Example:

```sql
SELECT *
FROM articles
WHERE MATCH (title, body) AGAINST ('+MySQL -YourSQL' IN BOOLEAN MODE);
```

This returns only rows that contain **MySQL** and must **not** contain **YourSQL**.

You can combine boolean operators so MySQL ranks rows according to your intent. Examples:

1. `'apple banana'` — Rows that contain **at least one** of the two terms.

2. `'+apple +juice'` — Rows that must contain **both** terms.

3. `'+apple macintosh'` — Rows that **must** contain `apple`; `macintosh` is optional (boosts rank if present).

4. `'+apple -macintosh'` — Rows that **must** contain `apple` and **must not** contain `macintosh`.

5. `'+apple ~macintosh'` — Rows that **must** contain `apple`; `macintosh` is optional, but rows **without** `macintosh` rank **higher**.

6. `'+apple +(>turnover <strudel)'` — Rows that contain `apple` and either `turnover` or `strudel`, with **“apple turnover”** ranked above **“apple strudel”**.

7. `'apple*'` — Prefix search: matches `apple`, `apples`, `applesauce`, `applet`, and so on.

8. `'"some words"'` — Phrase search: exact phrase **some words**.

### Query expansion

With **query expansion** (`WITH QUERY EXPANSION` or `IN NATURAL LANGUAGE MODE WITH QUERY EXPANSION`), MySQL runs **two** search passes. On the second pass it expands the original query with **related prominent terms** from the first hit set.

Example: searching for `"database"` with the sample data above:

```sql
SELECT * FROM articles WHERE MATCH (title, body) AGAINST ('database');
```

With query expansion, MySQL notices that among rows matching `database`, **MySQL** appears often as a co-occurring term, so it also returns rows that contain **MySQL** even if they do not contain **database**.

Per the MySQL manual, query expansion can increase **noise** and irrelevant hits, so it is best reserved for **short** queries.

### When natural language mode returns few or no rows

Prefer **boolean mode** when the dataset is **very small** (few rows) or when test data **repeats** the same content. Natural language mode weights terms by document frequency within a row and across the table: the more common a term is **globally**, the **lower** its weight—so MySQL may return an **empty set** quite often on tiny or repetitive corpora.

### Boolean mode and special characters in keywords

Boolean mode treats `(`, `)`, `+`, `-`, `~`, `>`, `*`, `"` as **operators**. That clashes with keywords that contain those characters—for example **`SBD-1107`**, where `-` is a hyphen, not the boolean **exclude** operator.

One workaround is to add a predicate such as `WHERE title LIKE 'SBD-1107%'` (or the appropriate column). As in the [previous post](/en/blog/2011-11-26-mysql-full-text-search-p1/), a trailing wildcard still allows index use (no leading `%`), so performance stays acceptable.

---

The [next post](/en/blog/2012-04-01-mysql-full-text-search-p3/) covers **how MySQL ranks** full-text matches and how the **full-text index** works.

## References

Official **MySQL 8.0 Reference Manual** entries for topics in this post:

**Overview and syntax**

1. **[Full-text search functions](https://dev.mysql.com/doc/refman/8.0/en/fulltext-search.html)** — `MATCH (…) AGAINST (…)` grammar, search modifiers, supported engines and column types, and links to the sections below.

**Search modes**

2. **[Natural language full-text searches](https://dev.mysql.com/doc/refman/8.0/en/fulltext-natural-language.html)** — free-text queries, relevance scores, default sort order, and `ROUND(MATCH … AGAINST …)` style expressions.

3. **[Boolean full-text searches](https://dev.mysql.com/doc/refman/8.0/en/fulltext-boolean.html)** — required/optional/excluded terms, `~`, `>`, `*`, grouping, phrase searches, and default ordering (use `ORDER BY MATCH …` when you need relevance order).

4. **[Full-text searches with query expansion](https://dev.mysql.com/doc/refman/8.0/en/fulltext-query-expansion.html)** — two-pass expansion (`WITH QUERY EXPANSION` / `IN NATURAL LANGUAGE MODE WITH QUERY EXPANSION`).

**Edge cases and hybrid filters**

5. **[Full-text restrictions](https://dev.mysql.com/doc/refman/8.0/en/fulltext-restrictions.html)** — limitations and parser behavior that interact with real-world queries.

6. **[The `LIKE` operator](https://dev.mysql.com/doc/refman/8.0/en/string-comparison-functions.html#operator_like)** — string matching when boolean metacharacters clash with literal tokens (e.g. hyphens in codes); pair with **[Column indexes](https://dev.mysql.com/doc/refman/8.0/en/column-indexes.html)** for how indexes apply to `LIKE` predicates.
