---
layout: post
title: "Cấu trúc dữ liệu phân cấp và ứng dụng"
date: 2013-06-22 8:00 PM
categories: [data-structure, vi]
author: hungneox
tags : [data-structure]
comments: true
---

### Giới thiệu
Việc lưu trữ dữ liệu dạng phân cấp (hierarchical data structure) rất cần thiết trong một số trường hợp. Ví dụ như menu phân nhiều cấp hay comment hỗ trợ reply lồng nhau. Bài này viết về hai mô hình lưu trữ dữ liệu phân cấp trong database đó là nested sets model và parent-child model.

<!--more-->

Nhìn chung thì nested set model có lợi thế là truy vấn dữ liệu nhanh, nhưng khó khăn trong việc thêm, cập nhật và xóa các nút. Nó chỉ thích hợp với các ứng dụng mà vị trị các nút ít hoặc không thay đổi thường xuyên. Ngược lại, parent-child model được cải tiến thêm thuộc tính path rất dễ áp dụng cho các ứng dụng cần thay đổi vị, thêm mới các nút thường xuyên mà không cần phải quan tâm tới việc cập nhật toàn bộ dữ liệu như nested sets model.

## Nested Sets Model
Nested sets model là một kỹ thuật dùng để thể hiện nested sets (các tập hợp lồng nhau) trong cơ sở dữ liệu. Ví dụ ta có một cấu trúc phân cấp về quần áo, cấu trúc này được sử dụng trong toàn bài viết này, như sau:


| ![Nested set model](/assets/posts/cau-truc-du-lieu-phan-cap-va-ung-dung/nested_set_model.png) | ![Clothing](/assets/posts/cau-truc-du-lieu-phan-cap-va-ung-dung/clothing.png) |

Nguồn: [Nested set model](http://en.wikipedia.org/wiki/Nested_set_model)

{:.table.table-bordered}
|      Node     | Left | Right |
| ------------- | ---- | ----- |
| Clothing      |    1 |    22 |
| Men's         |    2 |     9 |
| Women's       |   10 |    21 |
| Suits         |    3 |     8 |
| Slacks        |    4 |     5 |
| Jackets       |    6 |     7 |
| Dresses       |   11 |    16 |
| Skirts        |   17 |    18 |
| Blouses       |   19 |    20 |
| Evening Gowns |   12 |    13 |
| Sun Dresses   |   14 |    15 |

Ta thấy rằng, mỗi nút sẽ có hai giá trị left và right tương ứng như trên hình thể hiện giá trị ở biên trái và biên phải. Trong một nút giá trị bên phải lúc nào cũng lớn hơn giá trị bên trái. Và giá trị bên trái tăng dần theo mỗi phân cấp, nhưng giá trị bên phải giảm dần theo mỗi phân cấp.

 Lưu trữ dữ liệu với cấu trúc như trên trong database rất tiện lợi cho việc truy vấn, vì ta dễ dàng tìm được tập hợp các nút thuộc vùng bất kỳ. Ví dụ ta muốn lấy tất cả các nút thuộc về nút Men’s:

{% highlight sql %}
SELECT * FROM category WHERE left > =2 AND right<=9;
{% endhighlight %}


### Làm thế nào để xác định giá trị left và right cho mỗi nút?

![Clothing](/assets/posts/cau-truc-du-lieu-phan-cap-va-ung-dung/nested_tree_model.jpg)

Để đơn giản hóa, ta xem cấu trúc như hình trên, ta thấy rằng left và right được đánh số bắt đầu từ phía nút trên cùng bên trái, đếm theo hình mũi tên như hình vẽ ta sẽ xác định được giá trị left và right cho từng nút (theo thứ tự ABDGECF). Và dễ thấy rằng, việc thêm mới, cập nhật, di chuyển  một nút không dễ dàng như việc truy xuất dữ liệu vì chúng ta phải cập nhật lại các giá trị left right cho toàn bộ cấu trúc này.

### Làm thế nào để thêm một nút mới?
Để thêm một nút mới ta phải tạo ra một “khoảng trống” trong cấu trúc hiện có. Đầu tiên ta phải lấy giá trị right của nút mà ta muốn insert dưới nó một nút mới. Để tạo ra khoảng trống ta cộng thêm 2 vào tất cả các giá trị left, right mà lớn hơn bằng giá trị left nút đã chọn (nút mà nút mới trỏ vào). Vì khi chèn vào một nút mới, left và right của nút mới thêm vào sẽ làm cho tổng giá trị của cấu trúc tăng thêm 2 đơn vị.

![Insert new node](/assets/posts/cau-truc-du-lieu-phan-cap-va-ung-dung/insert_new_node.jpg)

Hình minh họa thêm một nút H vào dưới nút D. Màu xám là giá trị cũ.

Ví dụ ta thêm một nút H vào dưới nút D(2,5). Đầu tiên ta tăng giá trị của tất cả các nút có left, right lớn hơn hoặc bằng right của D (mở rộng bên phải của tất cả các nút từ D trở đi).

{% highlight sql %}
//5 is the right value of the parent node
UPDATE category SET left = left + 2 WHERE left>=5
UPDATE category SET right = right + 2 WHERE right>=5
{% endhighlight %}

Sau đó, dựa vào right của D = 7 ta có thể biết giá trị right của của H sẽ là 7-1=6 và left = 6 - 1 =5 (vì theo cách đếm thì right của D sẽ bằng right của H cộng 1). Như vậy ta có nút H(5,6).

Giá trị các nút bị thay đổi như sau:


* D(2,5) → D(2,7)
* E(6,7) → E(8,9)
* B(1,8) → B(1,10)
* C(9,12) → C(11,14)
* F(10,11) → F(12,13)


### Làm thế nào để xóa một nút?

Để xóa một nút, trước tiên ta cần phải xóa nút đó và các phần tử con của nó, và cập nhật các phần tử còn lại tùy thuộc vào số lượng nút bị xóa. Ví dụ để xóa nút D (2-5) trong hình trên ta phải xóa các nút có left, right >=2 và left, right <=5. Ở đây có 2 nút bị xóa là D và con nó là G, do đó ta phải giảm giá trị left, right của các phần tử có left,right >= giá trị left của nút D đi 4 đơn vị (2 nút x 2).

![Delete node](/assets/posts/cau-truc-du-lieu-phan-cap-va-ung-dung/delete_node.jpg)
Hình minh họa xóa đi một nút. Trong đó 4 là do phải xóa đi tổng cộng 2 nút. Màu xám là giá trị cũ.

Tổng quát, gọi `X(left_x, right_x)` là nút cần xóa thì đầu tiên ta sẽ tìm số nút n bị xóa từ X trở  đi. Sau đó cập nhật giảm đi (n*2) các giá trị left, right thỏa mãn điều kiện left, right >= left_x và left, right <= right_x.

Trường hợp `X = D(2,5)`. Lấy số lượng nút sẽ bị xóa

{% highlight sql %}
SELECT COUNT(id) FROM category WHERE left>=2 AND right <=5
{% endhighlight %}

Ta sẽ đếm được có 2 nút và việc còn lại là trừ các nút còn lại thỏa điều kiện cho 2*2 (trường hợp này n=2). Nếu nút bị xóa là nút ngoài cùng (nút lá) thì giá trị cần giảm đi là 2.

Cập nhật giá trị left, right cho các nút còn lại
{% highlight sql %}
UPDATE category SET left = left -4 WHERE left>=2 and left<=5
UPDATE category SET right=right-4 WHERE right>=2 and right<=5
{% endhighlight %}

Sau khi update các nút sẽ thay đổi như sau, ta thấy giá trị thay đổi là 4:

* A(0-13) → A(0,9)
* B(1-8) → B(1,4)
* E(6,7) → E(2,3)
* C(9,12) → C(5,8)
* F(10,11) → F(6,7)


### Làm thế nào để dời một nhánh?

Ta phải làm hai thao tác. Một là xóa tất cả các nút trong nhánh đó và tái tạo lại các nút đó ở vị trí mong muốn. Cách này chi phí cao, ví giả sử ta xóa một nhánh có 4 nút thì ta phải xóa 4 records trong database và thêm mới 4 records.

Cách thứ hai: (chưa test nên chưa viết :P)

## Parent-child model (adjacency list model)

Trong cấu trúc phân cấp này, thì mỗi nút sẽ có một ID và parent ID duy nhất. ID dùng để thiết lập mối quan hệ cha con giữa các nút. Và nút đầu tiên (nút gốc) sẽ có parent_id là null. Ví dụ xem bảng sau: 

{:.table.table-bordered}
|  id |    value     | parent_id |
| --- | ------------ | --------- |
|   1 | Clothing     | null      |
|   2 | Men’s        | 1         |
|   3 | Women’s      | 1         |
|   4 | Suits        | 2         |
|   5 | Slacks       | 4         |
|   6 | Jackets      | 4         |
|   7 | Dresses      | 3         |
|   8 | Skirts       | 3         |
|   9 | Blouses      | 3         |
|  10 | Evening Gows | 7         |
|  11 | Sun Dresses  | 7         |

Ta có thể thấy việc update và insert dữ liệu trong mô hình parent-child đơn giản hơn nhiều so với nested set model. Nhưng vấn đề chúng ta sẽ gặp phải là làm thế nào để truy vấn toàn bộ nút con của một nút. Việc này ứng dụng trong thực tế dùng để build breadcrumb cho website chẳng hạn (ví dụ Clothing > Men’s > Suits > Slacks). 

Cải tiến dữ liệu đi một chút thì vấn đề trên được giải quyết dễ dàng. Ta chỉ cần thêm vào một trường là path để chứa đường dẫn phân cấp của một nút. Path là sự kết hợp của các id dẫn tới nút đó, cách nhau bằng dấu gạch, bạn có thể dùng cái dấu khác như / nhưng nó sẽ nhầm lẫn khi để trên URL. Ví dụ với bảng trên sau khi thêm path: 

{:.table.table-bordered}
|  id |    value     | parent_id |    path   |
| --- | ------------ | --------- | --------- |
|   1 | Clothing     | null      | 1-        |
|   2 | Men’s        | 1         | 1-2-      |
|   3 | Women’s      | 1         | 1-3-      |
|   4 | Suits        | 2         | 1-2-4-    |
|   5 | Slacks       | 4         | 1-2-4-5-  |
|   6 | Jackets      | 4         | 1-2-4-6-  |
|   7 | Dresses      | 3         | 1-3-7-    |
|   8 | Skirts       | 3         | 1-3-8-    |
|   9 | Blouses      | 3         | 1-3-9-    |
|  10 | Evening Gows | 7         | 1-3-7-10- |
|  11 | Sun Dresses  | 7         | 1-3-7-11- |

.Như vậy muốn cần truy vấn một tập hợp các nút thuộc về một nút, ví dụ lấy tất cả các nút thuộc về nút Men’s: 

{% highlight sql %}
SELECT * FROM category WHERE path LIKE ‘1-2-%’;
{% endhighlight %}

Như vậy nó sẽ trả về tất cả các nút mà path có prefix là “1-2-” Bao gồm: 

{:.table.table-bordered}
|  id |  value  | parent_id |   path   |
| --- | ------- | --------- | -------- |
|   2 | Men’s   |         1 | 1-2-     |
|   4 | Suits   |         2 | 1-2-4-   |
|   5 | Slacks  |         4 | 1-2-4-5- |
|   6 | Jackets |         4 | 1-2-4-6- |

Việc cập nhật ví trí hay thêm mới nút dễ dàng hơn nhiều so với nested sets model thì chúng ta không cần tính toán lại left và right cho toàn bộ cây dữ liệu. Thay vào đó chúng ta chỉ cần cập nhật path cho nút đó. 

Ví dụ ta muốn dời nút Sun Dresses vào dưới Suits thì chỉ cần lấy path có sẵn của nút Suits (1-2-4-) thêm vào phần id của nút Sun Dresses là xong mà không cần phải tính lại các path khác. Việc thêm vào cũng tương tự như vậy. 
11  Sun Dresses 7 1-3-7-11-
Làm thế nào để dời một nhánh?
Rất đơn giản ta chỉ cần lấy tất cả các nút thuộc về nhánh đó. Ví dụ move nhánh Suits xuống dưới Women's thay vì Men ta chỉ cần replace path của Men thành path của Women trong path của tất cả các phần tử hiện tại. Ví dụ:

{% highlight sql %}
UPDATE category SET path = REPLACE(path, '1-2-4-', '1-3-4-') WHERE path LIKE '1-2-4-%';
{% endhighlight %}

{:.table.table-bordered}
|  id |  value  | parent_id |   path   |
| --- | ------- | --------- | -------- |
|   4 | Suits   |         2 | 1-3-4-   |
|   5 | Slacks  |         4 | 1-3-4-5- |
|   6 | Jackets |         4 | 1-3-4-6- |

### Ứng dụng làm menu phân tầng
Dù dữ liệu được lưu ở dạng nào thì nếu ta xây dựng một cấu trúc dạng html list ul li, thì ta có thể dễ dàng có thể áp dụng một plugin javascript như superfish để tạo ra menu. 


### Parent-child model 

{% highlight php %}
<?php
$list = array(
 array('id'=>1,'name'=>'Clothing','parent_id'=>null),
 array('id'=>2,'name'=>'Men\'s','parent_id'=>1),
 array('id'=>3,'name'=>'Women\'s','parent_id'=>1),
 array('id'=>4,'name'=>'Suits','parent_id'=>2),
 array('id'=>5,'name'=>'Slacks','parent_id'=>4),
 array('id'=>6,'name'=>'Jackets','parent_id'=>4),
 array('id'=>7,'name'=>'Dresses','parent_id'=>3),
 array('id'=>8,'name'=>'Skirts','parent_id'=>3),
 array('id'=>9,'name'=>'Blouses','parent_id'=>3),
 array('id'=>10,'name'=>'Evening Gorws','parent_id'=>7),
 array('id'=>11,'name'=>'Sun Dresses','parent_id'=>7),
);
function create_list($list, $parent_id = null){
  $html = '<ul>';
  foreach($list as $key => $row){
    if($row['parent_id'] == $parent_id){
        $html .= '<li>'.$row['name'] . create_list($list, $row['id']) .'</li>';
    }
  }
  $html .= '</ul>';
  if ( strpos($html, '<li>')===false){
    $html = '';
  }
  return $html;
}

$tree = create_list($list);

echo $tree;
{% endhighlight %}

### Nested sets model

{% highlight php %}
$category = array(
  array('id'=>1,'name'=>'Clothing','left'=>1, 'right'=>22),
  array('id'=>2,'name'=>'Men\'s','left'=>2, 'right'=>9),
  array('id'=>3,'name'=>'Women\'s','left'=>10, 'right'=>21),
  array('id'=>4,'name'=>'Suits','left'=>3, 'right'=>8),
  array('id'=>5,'name'=>'Slacks','left'=>4, 'right'=>5),
  array('id'=>6,'name'=>'Jackets','left'=>6, 'right'=>7),
  array('id'=>7,'name'=>'Dresses','left'=>11, 'right'=>16),
  array('id'=>8,'name'=>'Skirts','left'=>17, 'right'=>18),
  array('id'=>9,'name'=>'Blouses','left'=>19, 'right'=>20),
  array('id'=>10,'name'=>'Evening Gorws','left'=>12, 'right'=>13),
  array('id'=>11,'name'=>'Sun Dresses','left'=>14, 'right'=>15),
);

function createTree($category, $left = 0, $right = null) {
  $tree = array();
  foreach ($category as $cat => $range) {
    if ($range['left'] == $left + 1 && (is_null($right) || $range['right'] < $right)) {
      $tree[$cat] = createTree($category, $range['left'], $range['right']);
      $left = $range['right'];
    }
  }
  return $tree;
}

$tree = createTree($category);

function createList($keys, $category)
{
  $list = "<ul>";
  foreach($keys as $key => $row)
  {
    if(count($row)){
      $list.='<li>'. $category[$key]['name'].createList($row, $category) . '</li>';
    } else {
      $list.='<li>'. $category[$key]['name'] . '</li>';
    }
  }

  $list .= "</ul>";
if ( strpos($list, '<li>')===false){
    $list = '';
  }
return $list;
}

$list = createList($tree, $category);

print $list;
{% endhighlight %}

Kết quả của 2 đoạn code php thu được đều ra như sau: 

{% highlight html %}
<ul>
 <li>Clothing
  <ul>
   <li>Men's
    <ul>
     <li>Suits
      <ul>
       <li>Slacks</li>
       <li>Jackets</li>
      </ul>
     </li>
    </ul>
   </li>
   <li>Women's
    <ul>
     <li>Dresses
      <ul>
       <li>Evening Gorws</li>
       <li>Sun Dresses</li>
      </ul>
     </li>
     <li>Skirts</li>
     <li>Blouses</li>
    </ul>
   </li>
  </ul>
 </li>
</ul>
{% endhighlight %}

<ul>
  <li>Clothing
    <ul>
      <li>Men's
        <ul>
          <li>Suits
            <ul>
              <li>Slacks</li>
              <li>Jackets</li>
            </ul>
          </li>
        </ul>
      </li>
      <li>Women's
        <ul>
          <li>Dresses
            <ul>
              <li>Evening Gorws</li>
              <li>Sun Dresses</li>
            </ul>
          </li>
          <li>Skirts</li>
          <li>Blouses</li>
        </ul>
      </li>
    </ul>
  </li>
</ul>

### References:

* 'Nested set model', (n.d), 22 Jun 2013, <[http://en.wikipedia.org/wiki/Nested_set_model](http://en.wikipedia.org/wiki/Nested_set_model)>
* Evan Petersen, (n.d), 'Nested Sets', 22 Jun 2013, <[http://www.evanpetersen.com/item/nested-sets.html](http://www.evanpetersen.com/item/nested-sets.html)>
* Patrick Allaert, (n.d), 'Hierarchical data in MySQL (and other RDBMS)', 22 Jun 2013, <[http://patrickallaert.blogspot.fi/2008/05/hierarchical-data-in-mysql-and-other.html](http://patrickallaert.blogspot.fi/2008/05/hierarchical-data-in-mysql-and-other.html)>
* 'How do I format Nested Set Model data into an array?'. (n.d), 22 Jun 2013,<[http://stackoverflow.com/questions/16999530/how-do-i-format-nested-set-model-data-into-an-array](http://stackoverflow.com/questions/16999530/how-do-i-format-nested-set-model-data-into-an-array)>
