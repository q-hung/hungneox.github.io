---
layout: post
title: "Laravel : Dependency Injection và IoC container"
date: 2016-06-25 22:20 PM
categories: [web-development]
author: hungneox
tags : [dependency-injection, ioc-container, php, laravel]
description: "Laravel : Dependency Injection và IoC container"
image: /assets/images/laravel.jpg
comments: true
---

!["Laravel"](/assets/images/laravel.jpg "Laravel"){: .center-image }

# 0. Mục lục
1. [Dependency Injection là gì?](#dependency-injection-la-gi)
2. [IoC conainter là gì?](#ioc-container-la-gi)
3. [Sử dụng IoC container trong Laravel như thế nào?](#su-dung-ioc-container-trong-laravel-nhu-the-nao)
4. [Kết luận](#ket-luan)

# 1. Dependency Injection là gì?

Nói ngắn gọn, thì dependency injection (DI) chỉ đơn giản là cung cấp cho một object những object nó phụ thuộc (dependencies) từ bên ngoài truyền vào mà không phải khởi tạo từ trong hàm dựng. Điều này giúp ứng dụng linh động hơn và dễ test hơn, vì ta có thể dễ dàng dùng Mock class để test.

Thử lấy một ví dụ tổng quát không sử dụng kỹ thuật DI như sau:

{% highlight php %}
<?php
class StandardLogger {

    public function info($message)
    {
      printf("[INFO] %s \n", $message);
    }
}

class MyLog {
    public $logger;

    public function __construct() {
        $this->logger = new StandardLogger();
    }

    public function info($string)
    {
        return $this->logger->info($string);
    }
}

//Main application, somewhere else
$myLog = new MyLog();
$myLog->info('This object depend on another object');
{% endhighlight %}

Ví vụ trên là một ví dụ mang tính tượng trưng, nhưng vấn đề chính được nêu ra là class MyLog bị phụ thuộc vào class StandardLogger. Nói cách khác là class MyLog bị dính chặt vào class StandardLogger. Hiện tại thì khi chúng ta muốn chuyển sang một loại logger khác (ví dụ như FileLogger hay MongoDBLogger) chúng ta phải sửa lại hàm dựng của class MyLog.


Để giải quyết vấn đề phụ thuộc này, chúng ta chỉ cần sửa lại hàm dựng của class MyLog nhận một tham số là logger là được. Hay còn gọi là **decouple** hàm dựng của class MyLog với những class khác mà nó phụ thuộc. Việc này đơn giản được gọi là **Dependency Injection**. Tah-dah, đơn giản quá phải không? Cho nên có người nói DI là một cái tên 25 dollars cho một khái niệm trị giá 5 cents. Nguyên văn của [James Shore](http://www.jamesshore.com/Blog/Dependency-Injection-Demystified.html):

> "Dependency Injection" is a 25-dollar term for a 5-cent concept. [...] Dependency injection means giving an object its instance variables. [...].

{% highlight php %}
<?php
interface LoggerInterface 
{
    function info($message);
}

class StandardLogger implements LoggerInterface
{

    public function info($message)
    {
        printf("[INFO] %s \n", $message);
    }
}

class FileLogger implements LoggerInterface 
{

    public function info($message) 
    {
        file_put_contents('app.log', sprintf("[INFO] %s \n", $message), FILE_APPEND);
    }
}

class MyLog 
{
    public $logger;

    public function __construct(LoggerInterface $logger) 
    {
        $this->logger = $logger;
    }

    public function info($string)
    {
        return $this->logger->info($string);
    }
}
// Print to standard input/output device
$myLog = new MyLog(new StandardLogger);
$myLog->info('This object depend on another object');
// Write to file
$myFileLog = new MyLog(new FileLogger);
$myFileLog->info('This object depend on another object'); 
{% endhighlight %}

# 2. IoC Conainter là gì?

Khi áp dụng kỹ thuật DI này, thì một vấn đề khác lại nảy sinh, làm thế nào chúng ta biết được lớp MyLog này phụ thuộc vào những lớp nào để khởi tạo nó? Việc tạo ra một instance của class MyLog rất đơn giản nếu như nó chỉ phụ thuộc trực tiếp vào một class khác. Tuy nhiên có khả năng xảy ra trường hợp phụ thuộc lồng nhau, ví dụ như `MyLog --> DBLogger --> DatabaseAccess`. Và nó gây rất nhiều khó khăn cho việc khởi tạo một object mà chúng ta cần, bởi vì danh sách các lớp phụ thuộc lồng nhau rất sâu (deeply nested class dependencies).

Để giải quyết điều này, người ta nghĩ ra Dependency Injection Container hay còn gọi là Inversion of Control Container (IoC container). Thuật ngữ Inversion of Control mang tính tổng quát hơn Dependency Injection, từ đây về sau mình sẽ dù IoC container thay cho Dependecy Injection Container. Về bản chất thì IoC Conainter là một tấm bản đồ, hay một dịch vụ tổng đài cuộc gọi. Nó cho ta biết một lớp phụ thuộc vào những lớp class nào khác và phân giải được những class đó bằng kỹ thuật [Reflection](http://php.net/manual/en/book.reflection.php), hoặc từ danh sách đã được developer đăng ký trước.

Thật ra mà nói DI là một khái niệm không mới mẻ gì, nhất là trong thế giới Java. Martin Folwer đã viết về [Dependency Pattern và IoC container từ năm 2004](http://martinfowler.com/articles/injection.html). Thậm chí xa hơn thuật ngữ *inversion of control* đã xuất hiện từ năm 1988 trong [paper Designing Reusable Classes](http://www.laputan.org/drc/drc.html) của Johnson và Foote.Tuy nhiên cho đến gần đầy thì mới có một vài frameworks PHP sử dụng DI và IoC container như [Laravel](https://laravel.com/docs/4.2/ioc) hay [Pimple](http://pimple.sensiolabs.org/). Từ Laravel 5.0 trở đi Laravel gọi nó là Service container thay vì IoC container như trước.

Khởi nguyên của Laravel là một dự án IoC Container cho CodeIgniter do Taylor Otwell viết có tên là CInject. Theo như Taylor thì thậm chí nó còn được tái sử dụng cho đến tận Laravel 5.x như bây giờ. Và bản chất thì Laravel chính là một IoC container mà cụ thể là class `Illuminate\Container\Container`. 

!["Ảnh chụp màn hình của dự án CInject trên Google Code"](/assets/posts/laravel-dependency-injection-va-ioc-container/cinject.png "Ảnh chụp màn hình của dự án CInject trên Google Code"){: .center-image }


# 3. Sử dụng IoC container trong Laravel như thế nào?

## - Cơ bản
Thử lấy một ví dụ đơn giản về 2 tầng phụ thuộc của một class.

{% highlight php %}
<?php
class Car {
    public $enigne;
    public function __construct(Engine $enigne) {
        $this->enigne = $enigne;
    }
}
class Engine {
    public $piston;
    public function __construct(Piston $piston) {
        $this->piston = $piston;
    }
}
class Piston {}
{% endhighlight %}

Khi ta muốn khởi tạo một đối tượng `$car = new Car();` thì php sẽ báo lỗi như sau:
```
Argument 1 passed to Car::__construct() must be an instance of Engine, none given,...
```

Cũng dễ hiểu vì class Car phụ thuộc vào class Engine mà class này lại phụ thuộc vào class Piston. Trong Laravel, nếu chúng ta dùng `App::make` thì IoC container trong Laravel sẽ tự động phân giải dependencies của class Car và giúp chúng ta khởi tạo đối tượng `$car` một cách đúng đắn.

{% highlight php %}
<?php
$car = App::make('Car');

dd($car);

//Ouput
Car {#212 ▼
  +enigne: Engine {#216 ▼
    +piston: Piston {#218}
  }
}
{% endhighlight %}

Trở lại với ví dụ về MyLog ở trên. Nếu như ta khởi tạo object MyLog bằng `App::make('MyLog')` Laravel sẽ báo lỗi như sau:

```
Target [LoggerInterface] is not instantiable.
```

Hiển nhiên vì class MyLog của chúng ta nhận tham số từ hàm dựng là một interface chứ không phải một concrete class nên Laravel không thể khởi tạo interface đó và inject vào class MyLog được. IoC container không đủ *thông minh* để đoán developer muốn gì trong trường hợp này. Cho nên chúng ta phải bind LoggerInterface với thực thi cụ thể của interface đó.

Ví dụ:
{% highlight php %}
<?php
App::bind('LoggerInterface', 'StandardLogger');

$myLog = App::make('MyLog');

dd($myLog);
//Ouput
MyLog {#212 ▼
  +logger: StandardLogger {#214}
}
{% endhighlight %}

## - Contextual binding

Đôi khi 2 class khác nhau sử dụng chung 1 interface, nhưng chúng cần 2 implementations khác nhau thì phải làm sao? Giả sử ta có thêm một class ExceptionLog, và chúng ta muốn nó ghi xuống file thay vì in ra standard ouput như class MyLog.

{% highlight php %}
<?php
class ExceptionLog 
{
    public $logger;

    public function __construct(LoggerInterface $logger) 
    {
        $this->logger = $logger;
    }

    public function info(\Exception $ex)
    {
        return $this->logger->info($ex->getMessage());
    }
}
{% endhighlight %}

Thật may là IoC Container của Larvel  có cung cấp **Contextual Binding**. Nó giúp chúng ta bind interface mà một lớp cần với implement cụ thể tuỳ theo ngữ cảnh.

{% highlight php %}
<?php
App::when('MyLog')
    ->needs('LoggerInterface')
    ->give('StandardLogger');

App::when('ExceptionLog')
    ->needs('LoggerInterface')
    ->give('FileLogger');

$mylog = App::make('MyLog');
$exceptionLog = App::make('ExceptionLog');

dump($mylog);
dump($exceptionLog);
// Ouput

MyLog {#211 ▼
  +logger: StandardLogger {#213}
}

ExceptionLog {#212 ▼
  +logger: FileLogger {#215}
}
{% endhighlight %}

## - Repository pattern

Một trong những ứng dụng thực tế và quan trọng của IoC container trong Laravel là dùng để khử FAT controller hay decouple controller và business logic code. Controller chỉ làm nhiệm vụ điều phối dữ liệu giữa view và model.

Hãy xem thử ví dụ sau:

{% highlight php %}
<?php
class MovieController extends Controller {
    
    use FormBuilderTrait;

    public function doUpsert(Request $request, $id = null)
    {
        $form = $this->form(\App\Forms\MovieForm::class);

        if (!$form->isValid()) {
           return redirect()->back()->withErrors($form->getErrors())->withInput();
         }
        //Tighly coupled to eloquent model
        $movie = (empty($id)) ? new Movie : Movie::find($id);
        $movie->fill($request->all());
        $movie->user()->associate(Auth::user());
        $movie->save();

        return redirect()->route('admin.movies');
    }
}
{% endhighlight %}

Mới nhìn thì ví dụ trên có vẻ ổn và không có vấn đề gì. Nhưng nó bị phụ thuộc chặt chẽ vào Eloquent model, và mọi thứ diễn ra trong controller. Điều này làm ứng dụng khó test và giả sử chúng ta muốn chuyển sang sử dụng MongoDB thì phải đập hết toàn bộ xây lại từ đầu.

 Khi sử dụng Repository pattern với IoC container, chúng ta có một giải pháp linh hoạt hơn. Có thể dễ dàng thay thế implementation của `MovieRepositoryInterface`. Có thể thay thế Eloquent bằng Doctrine hay sử dụng NoSQL database thay cho cơ sở dữ liệu quan hệ mà không phải thay đổi quá nhiều. Chỉ cần chuyển mapping cho  `MovieRepositoryInterface` trong `AppServiceProvider` mà không cần quan tâm implementation này làm gì cụ thể miễn là nó tuân theo contract cho trước.

{% highlight php %}
<?php
// AppServiceProvider
$this->app->bind(
    'App\Contracts\MovieRepositoryInterface',
    'App\Repositories\MovieRepository'
);

class MovieController extends Controller {
    
    use FormBuilderTrait;

    public function __construct(\App\Contracts\MovieRepositoryInterface $movie) 
    {   
        // Decoupled controller from eloquent model
        $this->movie = $movie;
    }

    public function doUpsert(Request $request, $id = null)
    {
        $form = $this->form(\App\Forms\MovieForm::class);

        if (!$form->isValid()) {
            return redirect()->back()->withErrors($form->getErrors())->withInput();
        }

        if (empty($id)) {
            $this->movie->create(Auth::user()->id, $request->all(), $request);
        } else {
            $this->movie->update($id, Auth::user()->id, $request->all(), $request);
        }

        return redirect()->route('admin.movies');
    }
}
{% endhighlight %}

# 4. Kết luận

Dependency Injection và IoC container là những khái niệm rất đơn giản. Tuy nhiên chúng ta cần tìm hiểu để biết rõ DI và IoC được ứng dụng trong trường hợp nào. Nếu áp dụng hợp lý code của chúng ta sẽ ít kết dính hơn (loosely coupled) cũng như dễ bảo trì và test hơn. Ngoài ra, theo quan điểm cá nhân thì IoC container chính là trái tim của Laravel và cũng là điểm khác biệt lớn những giữa Laravel và các PHP frameworks khác. Hơn nữa, hiểu rõ về IoC container cũng giúp chúng ta tận dụng và tổ chức ứng dụng Laravel hợp lý và gọn gàng hơn.


# Tham khảo 

1. Inversion of Control Containers and the Dependency Injection pattern [http://martinfowler.com/articles/injection.html](http://martinfowler.com/articles/injection.html)
2. Trở lại với cơ bản: OOP, Dependency Injection và Cake Pattern [http://kipalog.com/posts/Tro-lai-voi-co-ban--OOP--Dependency-Injection-va-Cake-Pattern](http://kipalog.com/posts/Tro-lai-voi-co-ban--OOP--Dependency-Injection-va-Cake-Pattern)
3. Dependency Injection Demystified [http://www.jamesshore.com/Blog/Dependency-Injection-Demystified.html](http://www.jamesshore.com/Blog/Dependency-Injection-Demystified.html)
4. Laravel - Lessons Learned— php[world] 2015 — Taylor Otwell [https://www.youtube.com/watch?v=xKefsl_UiM0](https://www.youtube.com/watch?v=xKefsl_UiM0)
5. Service Container - Laravel Official Website [https://laravel.com/docs/5.2/container#contextual-binding](https://laravel.com/docs/5.2/container#contextual-binding)