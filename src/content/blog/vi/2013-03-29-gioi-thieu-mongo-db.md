---
layout: post
title: " Giới thiệu MongoDB"
date: 2013-03-29 8:00 PM
categories: [mongodb, database, vi]
author: hungneox
tags : [mongodb]
comments: true
---

### Giới thiệu 

Thường khi nói về database mọi người sẽ liên tưởng tới RDBMS - cơ sở dữ liệu quan hệ như MS SQL hay MySQL. Bởi vì một số lý do (như khó đảm bảo tính [ACID](http://en.wikipedia.org/wiki/ACID) khi dữ liệu nằm rải rác trên nhiều máy vật lý), các hệ cơ sở dữ liệu quan hệ thường khó chạy phân tán vì database phải chắn rằng các dữ liệu liên quan không bị sửa đổi hay xóa ngoài tầm kiểm soát trong một transaction. Điều này cũng dẫn tới các RDBMS khó scale up (**khó** chứ không phải **không thể**), cho nênthường người ta sẽ bổ sung thêm phần cứng thay vì cho nó chạy song song trên nhiều máy chủ.

Khái niệm NoSQL được tạo ra vào năm 1998 bởi [Carlo Strozzi](http://www.strozzi.it/users/carlo/vitae.html). Nhiều người nghĩ rằng khái niệm này dùng để hạ thấp SQL nhưng thực ra nó có nghĩa là Not Only SQL. Về mặt ý tưởng thì cả hai (NoSQL và RDMS) sẽ sống chung và bổ sung cho nhau.
<!--more-->

NoSQL database được phân ra thành nhiều loại, bao gồm:

* Key/values
  * Dynamo
  * Apache Cassandra
  * Voldemort
  * memcached
* Tabular
  * BigTable
* Document database
  * MongoDB
  * Apache CouchDB
* Graph database
  * Neo4j

**Nó được dùng khi nào?**

  * Lượng dữ liệu lớn (large data set)
  * Chịu tải cao

**Nó không được dùng khi nào?**

  * Các ứng dụng cần sử dụng nhiều transaction (như ngân hàng)
  * Các ứng dụng cần SQL (sử dụng joins)

Bài viết này nhằm mang lại cho người đọc một cái nhìn tổng quan nhất về MongoDB một document-oriented database. MongoDB được rút ra từ “humongous”, có nghĩa là rất lớn. Nó được phát triển từ C++ bởi công ty 10gen

Về cơ bản, mọi thứ trong MongoDb được lưu trữ với dạng document, cụ thể là json-style document (BSON). Và như vậy là nó sẽ không có schema, không có lưu trữ dữ liệu dạng bảng như  cơ sở dữ liệu quan hệ, và cũng không có joins.

Dữ liệu được lưu trữ sẽ trông giống như thế này:

{% highlight javascript %} 
{
  _id: 0,
  title: '',
  body: '',
  comments: [{
    person: '',
    comment: '',
    created_at: new Date()
  }],
  created_at: new Date()
}
{% endhighlight %}

Câu hỏi khiến nhiều người thắc mắc là làm thế nào để truy vấn NoSQL nếu như nó không hỗ trợ ngôn ngữ SQL. Mặc dù không phải là RDBMS nhưng MongoDB vẫn cung cấp các cơ chế để truy vấn dữ liệu. Cụ thể như sau:

{% highlight javascript %} 
db.collection.find( <query>,  )
{% endhighlight %}

Phương thức `find()` tương đương với câu `SELECT` trong SQL, và tương đương với mệnh đề `WHERE`, còn tương ứng với danh sách các fields ta cần truy vấn. 

Ví dụ ta có một collection chứa các bộ phim, mỗi phần tử gồm có title và rating của khán giả.

{% highlight javascript %} 
> db.movies.insert({title:"SHERLOCK BBC", rating:9.2})
> db.movies.insert({title:"Elementary TV Series", rating:7.6})
> db.movies.insert({title:"Lie to Me (2009-2011)", rating:7.8})

/*SELECT * FROM movies WHERE title= 'Elementary TV Series'*/

> db.movies.find({title:"Elementary TV Series"})
{
   "_id" : ObjectId("51556737c79ef506ca8fc47d"),
   "title" : "Elementary TV Series",
   "rating" : 7.6
}   

/*SELECT * FROM movies WHERE rating>9*/
> db.movies.find({rating:{$gt:9}})
{
   "_id"         : ObjectId("515567f1c79ef506ca8fc47f"),
   "title"         : "SHERLOCK BBC",
   "rating"     : 9.2 }
}
{% endhighlight %}

`_id` là một filed được mongoDB tự động sinh ra với kiểu dữ liệu là ObjectId
ObjectId là một giá trị BSON 12-byte được cấu thành từ:

* 4-byte timestamp,
* 3-byte machine identifier,
* 2-byte process id
* 3-byte counter, starting with a random value.


Bạn có thể tham khảo list các operation của mongodb [ở đây](http://docs.mongodb.org/manual/reference/operator/)

### Những chức năng hay ho khác:

#### Map/reduce
Sẽ giới thiệu trong một bài viết khác

#### Capped collection

> Capped collections are fixed-size collections that support high-throughput operations that insert, retrieve, and delete documents based on insertion order. Capped collections work in a way similar to circular buffers: once a collection fills its allocated space, it makes room for new documents by overwriting the oldest documents in the collection.

Đây là một fixed collection, tức là một tập hợp có số phần tử cố định khi khai báo. Ngoài ra nó đảm bảo lưu đúng thứ tự được chèn vào (natural order), mà không tự sắp xếp lại theo index hay bất kỳ yếu tố nào khác, đảm bảo thứ tự chèn vào và thứ tự lưu trên disk là giống nhau. Và khi số lượng phần tử trong collection đã chạm ngưỡng max thì khi chèn thêm một phần tử mới vào thì phần tử cũ nhất sẽ bị tống ra. Capped collection thích hợp để làm logging vì tốc độ nhanh do natural ordering (dữ liệu được lưu theo thứ tự nào thì lấy ra theo thứ tự đó không cần sort).

{% highlight javascript %} 
db.createCollection("someCollection",{
   capped: true,
   size:100000,
   max:100

})
{% endhighlight %}

* size là maximum size của capped collection tính bằng byte 
* max là số phần tử tối đa trong capped collection đó

### GridFS

GridFS giúp lưu trữ những file có kích thước vượt quá giới hạn của BSON-document 16MB trên một document (định dạng lưu trữ trong mongodb BJON = “binary” + “JSON”). Nó chia một file ra nhiều phần nhỏ (parts hoặc chunks).

Mỗi chunks được lưu trữ với dạng:
{% highlight javascript %} 
{

 "_id" : ,
 "files_id" : ,
 "n" : ,
 "data" : 
}
{% endhighlight %}
Ví dụ: 
{% highlight javascript %} 
// returns default GridFS bucket (e.g. "fs"  collection)
GridFS myFS = new GridFS(myDatabase); 
// saves the file to "fs" GridFS bucket
myFS.storeFile(new File("/tmp/largething.mpg"));
{% endhighlight %}

#### Geopartial Index

Nếu bạn muốn tìm một địa điểm có tọa độ X,Y trên bản đồ có bao nhiêu nhà hàng nằm gần đó (giả sử bạn có danh sách các địa điểm lưu trong database) thì bạn sẽ cần tới Geopartial Index. Nếu bạn cần tính khoảng cách giữa 2 điểm trên bản đồ thì bạn cũng sẽ cần dùng nó. Giá trị của index được gọi là geohash được tính bằng cách liên tục chia 4 bản đồ không ngừng, mỗi một phần tư như vậy sẽ mang một giá trị 2-bit.

MongoDB hỗ trợ các operation như:

Tìm chính xác
{% highlight javascript %} 
> db.places.find( { loc:[50,50]}) Tìm địa điểm gần
> db.places.find( { loc:{$near:[50,50]}}) Tìm địa điểm trong phạm vi cho trước
> db.places.find( { loc:{$near:[50,50], $maxDistance:5}})
{% endhighlight %}

Một lưu ý nhỏ là bởi vì trái đất của chúng ta không phải là một cái dĩa dẹt nên ta phải dùng công thức lượng giác để tính. Tuy nhiên MongoDB cũng có hỗ trợ vấn đề này sẵn, nên chúng ta chỉ việc dùng như sau:

{% highlight javascript %} 
db.runCommand({
    geoNear : "points" ,
    near : [0,0],
    spherical :  true
})
{% endhighlight %}


### References:

* An Introduction to Document Databases
* Investigating storage solutions for large data
* Scale-out vs Scale-up
* The problems with ACID, and how to fix them without going NoSQL
* Why MongoDB is awsome
* Geoindexing with MongoDB

* MongoDB document
  * http://docs.mongodb.org/manual/applications/read/
  * http://docs.mongodb.org/manual/core/capped-collections/