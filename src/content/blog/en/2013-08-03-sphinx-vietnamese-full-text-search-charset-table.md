---
layout: post
title: "Sphinx Vietnamese full-text search: UTF-8 and charset_table"
date: 2013-08-03 8:00 PM
categories: [search-data]
author: hungneox
comments: true
---

### Introduction

For how to install Sphinx, see the earlier post on [installing and trying Sphinx on Windows](/vi/blog/2012-04-08-cai-va-chay-thu-sphinx-tren-windows/) (Vietnamese). This configuration lets Sphinx **index** Vietnamese text and **search** it in a way that ignores case and diacritics (case-insensitive and accent-insensitive).

You configure **`charset_table`** to map accented letters to their base forms (for example `a`, `á`, `à`, `ạ`, `ã`, … → `a`). That matters because users do not always type Vietnamese with full diacritics. Note that **`charset_table` must be written on a single line**.

Suppose we have an `images` table like this:

```sql
CREATE TABLE IF NOT EXISTS `images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `text` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `path` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `created` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  FULLTEXT KEY `text` (`text`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;
```

A sample `sphinx.cnf` (or `sphinx.conf`) looks like this:

```c
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
    U+00E0->a, U+00E1->a, U+1EA1->a, U+1EA3->a, U+00E3->a, U+00E2->a, U+1EA7->a, U+1EA5->a, U+1EAD->a, U+1EA9->a, U+1EAB->a, U+0103->a, U+1EB1->a, U+1EAF->a, U+1EB7->a, U+1EB3->a, U+1EB5->a, U+00E8->e, U+00E9->e, U+1EB9->e, U+1EBB->e, U+1EBD->e, U+00EA->e, U+1EC1->e, U+1EBF->e, U+1EC7->e, U+1EC3->e, U+1EC5->e, U+00EC->i, U+00ED->i, U+1ECB->i, U+1EC9->i, U+0129->i, U+00F2->o, U+00F3->o, U+1ECD->o, U+1ECF->o, U+00F5->o, U+00F4->o, U+1ED3->o, U+1ED1->o, U+1ED9->o, U+1ED5->o, U+1ED7->o, U+01A1->o, U+1EDD->o, U+1EDB->o, U+1EE3->o, U+1EDF->o, U+1EE1->o, U+00F9->u, U+00FA->u, U+1EE5->u, U+1EE7->u, U+0169->u, U+01B0->u, U+1EEB->u, U+1EE9->u, U+1EF1->u, U+1EED->u, U+1EEF->u, U+1EF3->y, U+00FD->y, U+1EF5->y, U+1EF7->y, U+1EF9->y, U+0111->d, U+00C0->a, U+00C1->a, U+1EA0->a, U+1EA2->a, U+00C3->a, U+00C2->a, U+1EA6->a, U+1EA4->a, U+1EAC->a, U+1EA8->a, U+1EAA->a, U+0102->a, U+1EB0->a, U+1EAE->a, U+1EB6->a, U+1EB2->a, U+1EB4->a, U+00C8->e, U+00C9->e, U+1EB8->e, U+1EBA->e, U+1EBC->e, U+00CA->e, U+1EC0->e, U+1EBE->e, U+1EC6->e, U+1EC2->e, U+1EC4->e, U+00CC->i, U+00CD->i, U+1ECA->i, U+1EC8->i, U+0128->i, U+00D2->o, U+00D3->o, U+1ECC->o, U+1ECE->o, U+00D5->o, U+00D4->o, U+1ED2->o, U+1ED0->o, U+1ED8->o, U+1ED4->o, U+1ED6->o, U+01A0->o, U+1EDC->o, U+1EDA->o, U+1EE2->o, U+1EDE->o, U+1EE0->o, U+00D9->u, U+00DA->u, U+1EE4->u, U+1EE6->u, U+0168->u, U+01AF->u, U+1EEA->u, U+1EE8->u, U+1EF0->u, U+1EEC->u, U+1EEE->u, U+1EF2->y, U+00DD->y, U+1EF4->y, U+1EF6->y, U+1EF8->y, U+0110->d,

}
 

searchd {
    compat_sphinxql_magics = 0
    port = 3313
    log = /home/www/butchiso/sphinx/logs/searchd.log
    query_log = /home/www/butchiso/sphinx/logs/query.log
    pid_file = /home/www/butchiso/sphinx/logs/searchd.pid
    max_matches = 10000
}
```
### Sphinx has two main parts

* **indexer** — builds the full-text index from your documents (see also the [MySQL full-text search](/en/blog/2011-11-26-mysql-full-text-search-p1/) series).
* **searchd** (search daemon) — a background service that runs queries against the index. Unlike MySQL full-text, Sphinx does not return full rows: it returns **IDs**, which you then use to load rows from MySQL.

After installation you must index the MySQL data. Because this setup is **not** a real-time index, schedule **`indexer`** with **cron** for periodic rebuilds and configure **searchd** to start with the server. For **real-time** indexing in Sphinx you would use **SphinxSE** as a MySQL storage engine and build MySQL from source with Sphinx support—see the Sphinx documentation for details.

```bash
/usr/bin/indexer --config /home/www/butchiso/sphinx/sphinx.conf --all
```

To rebuild indexes in production, add **`--rotate`**:

> --rotate is used for rotating indexes. Unless you have the situation where you can take the search function offline without troubling users, you will almost certainly need to keep search running whilst indexing new documents. --rotate creates a second index, parallel to the first (in the same place, simply including .new in the filenames). Once complete, indexer notifies searchd via sending the SIGHUP signal, and searchd will attempt to rename the indexes (renaming the existing ones to include .old and renaming the .new to replace them), and then start serving from the newer files. Depending on the setting of seamless_rotate, there may be a slight delay in being able to search the newer indexes.

So **`--rotate`** avoids downtime: while reindexing, **indexer** builds a **.new** index; when it finishes, it signals **searchd** to swap to the new files so search keeps working.

```bash
 /usr/bin/indexer --rotate --config /home/www/butchiso/sphinx/sphinx.conf --all
```

Then start the search daemon (**`searchd`**) pointing at the same config file (e.g. `sphinx.conf`):

```bash
/usr/bin/searchd --config  /home/www/butchiso/sphinx/sphinx.conf
```

You can smoke-test from the shell:

```bash
/usr/bin/search -c /home/www/butchiso/sphinx/sphinx.conf thich
```

Or use the **Sphinx search API**. The snippet below is a quick-and-dirty way to try different keywords.

```php
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
```
### References

Extra material on installing Sphinx on Linux, Unicode-aware indexing, and the **`charset_table`** option this post relies on.

1. [Install Sphinx Search on Ubuntu Intrepid Ibex](http://www.hackido.com/2009/01/install-sphinx-search-on-ubuntu.html) — Older walkthrough for Sphinx on Ubuntu (Ibex-era); useful for the general package layout and service setup even though distributions have moved on.

2. [How To Install and Configure Sphinx on Ubuntu 14.04](https://www.digitalocean.com/community/tutorials/how-to-install-and-configure-sphinx-on-ubuntu-14-04) — DigitalOcean tutorial covering install, sample `sphinx.conf`, indexer, and `searchd` (similar moving parts to the examples above).

3. [THINKING SPHINX AND UNICODE](http://yob.id.au/2008/05/08/thinking-sphinx-and-unicode.html) — Notes on UTF-8, Unicode normalization, and Ruby/Thinking Sphinx; the Unicode pitfalls discussed still apply when you design `charset_table` for Vietnamese.

4. [Sphinx Search manual: `charset_table`](https://sphinxsearch.com/docs/current/conf-charset-table.html) — Official reference for character folding and `U+XXXX->` target mappings (see also the rest of the [Sphinx 2.x documentation](https://sphinxsearch.com/docs/current/) for `indexer`, `searchd`, and rotation). Newer stacks often use [Manticore Search](https://manual.manticoresearch.com/), which inherited this configuration model.
